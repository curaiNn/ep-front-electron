<template>
  <div class="swgd-webview-container" v-loading="isLoading" element-loading-text="正在加载页面...">
    <!-- 顶部工具栏 -->
    <div class="webview-header">
      <span class="title">入库搜索 (Webview)</span>
      <div class="header-btns">
        <ep-button size="small" type="primary" @click="reloadPage">刷新</ep-button>
        <ep-button size="small" type="success" @click="openDevTools">调试</ep-button>
      </div>
    </div>

    <!-- Webview -->
    <webview ref="webviewRef" class="custom-webview" :src="targetUrl" allowpopups @console-message="handleConsoleMessage"></webview>

    <!-- AI 助手组件 -->
    <AiAssistant
      ref="aiRef"
      @handle-record="onAiRecord"
      @handle-upload="onAiUpload"
      @handle-fill="onAiFill"
      @handle-query-files="onAiQueryFiles"
      @handle-select-file="onAiSelectFileForUpload"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { EpMessage } from 'ep-ui-plus'
import AiAssistant from '@/components/Ai-assistant.vue'

// --- 配置常量 ---
const OCP_SERVER_ROOT = import.meta.env.VITE_OCP_SERVER_URL || 'http://192.168.118.127:59998'
const OCP_UPLOAD_URL = `${OCP_SERVER_ROOT}/upload`
const OCP_DOWNLOAD_URL = `${OCP_SERVER_ROOT}/download`
const OCP_FILES_URL = `${OCP_SERVER_ROOT}/files`
const OCP_UPLOAD_PATH = '/ocptest/intercepted-files'
const SYNC_FILENAME = 'swgd_data_sync.json'

// --- 状态定义 ---
const targetUrl = ref('http://192.168.120.40/swgdfront/#/inboundSearch')
const webviewRef = ref(null)
const aiRef = ref(null)
const isLoading = ref(true)
const isSelectingForAttachment = ref(false)

// --- Webview 基本控制 ---
const reloadPage = () => {
  if (webviewRef.value) {
    isLoading.value = true
    webviewRef.value.reload()
  }
}

const openDevTools = () => {
  if (webviewRef.value) webviewRef.value.openDevTools()
}

onMounted(() => {
  const webview = webviewRef.value
  if (webview) {
    webview.addEventListener('did-start-loading', () => {
      isLoading.value = true
    })
    webview.addEventListener('did-stop-loading', () => {
      isLoading.value = false
      injectAttachmentInterceptor()
    })
    webview.addEventListener('did-fail-load', e => {
      if (e.errorCode !== -3) isLoading.value = false
    })
  }
})

// [附件拦截] 注入附件点击拦截脚本
const injectAttachmentInterceptor = () => {
  if (!webviewRef.value) return
  webviewRef.value.executeJavaScript(`
        (function() {
            if (window.__attachment_interceptor_installed) return;
            const install = () => {
                // 定位附件按钮
                const xpath = "//label[contains(@title, '附件')]/following-sibling::div//button";
                const btn = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                if (btn && !btn.getAttribute('data-intercepted')) {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        console.log('__INTERCEPT_ATTACHMENT_CLICK__');
                        return false;
                    }, true);
                    btn.setAttribute('data-intercepted', 'true');
                    window.__attachment_interceptor_installed = true;
                }
            };
            install();
            const observer = new MutationObserver(install);
            observer.observe(document.body, { childList: true, subtree: true });
        })();
    `)
}

const handleConsoleMessage = e => {
  if (e.message === '__INTERCEPT_ATTACHMENT_CLICK__') {
    isSelectingForAttachment.value = true
    aiRef.value.addAiMessage('检测到您点击了“附件上传”。<br/>已为您检索条件最匹配的单证附件：')
    onAiQueryFiles()
  }
}

// ==========================================
// 核心修复：手动修正 MIME 类型
// ==========================================
const onAiSelectFileForUpload = async fileName => {
  if (!isSelectingForAttachment.value) {
    aiRef.value.addAiMessage('当前未处于附件上传模式，仅为您下载文件。')
    return
  }

  aiRef.value.addAiMessage(`正在下载 "${fileName}" 并准备填入附件框...`)

  try {
    const fullPath = `${OCP_UPLOAD_PATH}/${fileName}`
    const downloadUrl = `${OCP_DOWNLOAD_URL}?path=${encodeURIComponent(fullPath)}`
    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error('下载文件失败')

    const blob = await response.blob()

    // [修复开始] 根据后缀名强制修正 MIME 类型
    // 如果 blob.type 是通用的二进制流，会导致页面校验失败
    let mimeType = blob.type
    const ext = fileName.split('.').pop().toLowerCase()

    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      bmp: 'image/bmp',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }

    if (mimeMap[ext]) {
      mimeType = mimeMap[ext]
      console.log(`修正文件类型: ${fileName} -> ${mimeType}`)
    } else if (!mimeType || mimeType === 'application/octet-stream') {
      // 兜底策略，如果是图片但没匹配到，尝试默认为 jpeg
      mimeType = 'image/jpeg'
    }
    // [修复结束]

    const reader = new FileReader()
    reader.onloadend = async function () {
      const base64data = reader.result

      // 传递修正后的 mimeType 给 Webview
      await webviewRef.value.executeJavaScript(`
                (function(base64Str, fileName, fileType) {
                    try {
                        const byteCharacters = atob(base64Str.split(',')[1]);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        // 使用传入的 fileType (修正后的类型)
                        const blob = new Blob([byteArray], { type: fileType });

                        // 创建 File 对象，补全 lastModified (有些校验需要)
                        const file = new File([blob], fileName, {
                            type: fileType,
                            lastModified: new Date().getTime()
                        });

                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);

                        const xpath = "//label[contains(@title, '附件')]/following-sibling::div//input[@type='file']";
                        const fileInput = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                        if (fileInput) {
                            fileInput.files = dataTransfer.files;
                            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                            fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                            // 有些框架监听的是 focus/blur
                            fileInput.dispatchEvent(new Event('blur', { bubbles: true }));
                            return { success: true };
                        } else {
                            return { error: '未找到附件输入框' };
                        }
                    } catch(e) {
                        return { error: e.message };
                    }
                })('${base64data}', '${fileName}', '${mimeType}');
            `)

      aiRef.value.addAiMessage(`✅ 文件 "${fileName}" 已成功填入附件！`)
      isSelectingForAttachment.value = false
    }
    reader.readAsDataURL(blob)
  } catch (err) {
    console.error(err)
    aiRef.value.addAiMessage(`❌ 注入失败: ${err.message}`)
  }
}

// --- 其他业务逻辑 (保持不变) ---

const onAiQueryFiles = async () => {
  if (!aiRef.value) return
  if (!isSelectingForAttachment.value) {
    aiRef.value.addAiMessage('正在查询单证保管箱中的文件列表...')
  }

  try {
    const response = await fetch(`${OCP_FILES_URL}?path=${encodeURIComponent(OCP_UPLOAD_PATH)}`)
    if (!response.ok) throw new Error(`查询失败 (Status ${response.status})`)

    const result = await response.json()
    if (result.flag && result.flag !== 'T') throw new Error(result.message || '获取文件列表失败')

    const fileList = Array.isArray(result) ? result : result.data || []
    fileList.sort((a, b) => (a.directory !== b.directory ? (a.directory ? -1 : 1) : a.name.localeCompare(b.name)))

    if (fileList.length === 0) {
      aiRef.value.addAiMessage('保管箱目前是空的。')
      return
    }

    let html = isSelectingForAttachment.value
      ? '请点击下方文件进行<b>填入</b>：<br/><ul style="padding-left: 20px; margin-top: 5px;">'
      : '为您找到以下文件（点击即可下载）：<br/><ul style="padding-left: 20px; margin-top: 5px;">'

    fileList.forEach(file => {
      if (file.directory) return

      if (isSelectingForAttachment.value) {
        const actionUrl = `action://select-file?name=${encodeURIComponent(file.name)}`
        html += `<li style="margin-bottom: 6px;">
             <a href="${actionUrl}" style="color: #67c23a; font-weight: bold; text-decoration: none; display: inline-flex; align-items: center; cursor: pointer;">
               <span style="margin-right: 4px;">📎</span> 选择: ${file.name}
             </a>
           </li>`
      } else {
        const fullPath = `${OCP_UPLOAD_PATH}/${file.name}`
        const downloadUrl = `${OCP_DOWNLOAD_URL}?path=${encodeURIComponent(fullPath)}`
        html += `<li style="margin-bottom: 4px;">
             <a href="${downloadUrl}" target="_blank" style="color: #409eff; text-decoration: none; display: inline-flex; align-items: center;">
               <span style="margin-right: 4px;">📄</span> ${file.name}
             </a>
           </li>`
      }
    })
    html += '</ul>'

    aiRef.value.addAiMessage(html)
  } catch (error) {
    console.error(error)
    aiRef.value.addAiMessage(`❌ 查询失败：${error.message}`)
  }
}

const onAiRecord = async () => {
  if (!webviewRef.value || !aiRef.value) return
  aiRef.value.addAiMessage('收到，正在解析页面表单以进行记录...')
  try {
    const pageData = await webviewRef.value.executeJavaScript(`
      (function() {
        try {
          const items = document.querySelectorAll('.ep-form--item');
          const result = {};
          items.forEach(item => {
            const labelEl = item.querySelector('.ep-form--label');
            const label = labelEl ? labelEl.innerText.trim().replace(':', '') : null;
            if (!label) return;
            let value = '';
            const inputEl = item.querySelector('input.ep-input__inner');
            if (inputEl) { value = inputEl.value; }
            else { const contentEl = item.querySelector('.ep-form--content'); if (contentEl) value = contentEl.innerText.trim(); }
            result[label] = value;
          });
          result['_timestamp'] = new Date().toISOString();
          return result;
        } catch (e) { return { error: e.message }; }
      })();
    `)
    if (pageData.error) throw new Error(pageData.error)
    const fieldCount = Object.keys(pageData).filter(k => !k.startsWith('_')).length
    if (fieldCount === 0) throw new Error('未能提取到有效表单数据。')
    aiRef.value.addAiMessage(`解析成功！提取到 ${fieldCount} 个字段。\n正在归档至保管箱...`)
    const jsonString = JSON.stringify(pageData, null, 2)
    const fileBlob = new Blob([jsonString], { type: 'application/json' })
    await performUpload(fileBlob, SYNC_FILENAME)
  } catch (error) {
    console.error(error)
    aiRef.value.addAiMessage(`❌ 记录失败：${error.message}`)
  }
}

const onAiUpload = async file => {
  if (!aiRef.value) return
  aiRef.value.addAiMessage(`正在将文件 "${file.name}" 上传至单证保管箱...`)
  try {
    await performUpload(file, file.name)
  } catch (error) {
    console.error(error)
    aiRef.value.addAiMessage(`❌ 上传失败：${error.message}`)
  }
}

const performUpload = async (blobOrFile, filename) => {
  try {
    const formData = new FormData()
    formData.append('file', blobOrFile, filename)
    formData.append('path', OCP_UPLOAD_PATH)
    const response = await fetch(OCP_UPLOAD_URL, { method: 'POST', body: formData })
    if (!response.ok) throw new Error(await response.text())
    aiRef.value.addAiMessage(`✅ **操作成功！**\n文件已存入：${filename}`)
  } catch (err) {
    throw new Error(`上传接口异常: ${err.message}`)
  }
}

const onAiFill = async () => {
  if (!webviewRef.value || !aiRef.value) return
  aiRef.value.addAiMessage(`收到，正在从 OCP 下载最近记录的数据 (${SYNC_FILENAME})...`)
  try {
    const downloadLink = `${OCP_DOWNLOAD_URL}?path=${OCP_UPLOAD_PATH}/${SYNC_FILENAME}`
    const response = await fetch(downloadLink)
    if (!response.ok) throw new Error(`下载失败 (Status ${response.status})`)
    const jsonData = await response.json()
    const dataCount = Object.keys(jsonData).filter(k => !k.startsWith('_')).length
    aiRef.value.addAiMessage(`数据就绪！共 ${dataCount} 条。\n正在启动自动回填...`)
    const fillResult = await webviewRef.value.executeJavaScript(`
      (async function(data) {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const result = { success: 0, failed: [], logs: [] };
        for (const [key, value] of Object.entries(data)) {
            if (key.startsWith('_')) continue;
            if (!value) continue;
            try {
                const xpath = "//label[contains(@class, 'ep-form--label') and contains(text(), '" + key + "')]";
                const labelNode = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (labelNode) {
                    const formItem = labelNode.closest('.ep-form--item');
                    if (!formItem) continue;
                    const isSelect = formItem.querySelector('.ep-select') !== null || formItem.querySelector('.ion-chevron-down') !== null;
                    const input = formItem.querySelector('input');
                    if (input) {
                        if (isSelect) {
                            input.click(); input.dispatchEvent(new Event('focus', { bubbles: true }));
                            await sleep(1200);
                            const optionSelector = '.ep-select-drop-item, .ep-select-dropdown__item';
                            const allOptions = Array.from(document.querySelectorAll(optionSelector));
                            const visibleOptions = allOptions.filter(el => el.offsetParent !== null);
                            const targetOption = visibleOptions.find(el => {
                                const text = el.innerText.trim();
                                return text && (text.includes(value) || value.includes(text));
                            });
                            if (targetOption) {
                                targetOption.scrollIntoViewIfNeeded ? targetOption.scrollIntoViewIfNeeded() : targetOption.scrollIntoView();
                                targetOption.click(); result.success++;
                            } else {
                                labelNode.click(); result.failed.push({ field: key, reason: '无匹配项: ' + value });
                            }
                            await sleep(200);
                        } else if (input.type === 'checkbox') {
                            const shouldCheck = (value == '1' || value === true || value === 'true');
                            if (input.checked !== shouldCheck) { input.click(); result.success++; }
                        } else {
                            if (input.hasAttribute('readonly') || input.hasAttribute('disabled')) {
                               result.failed.push({ field: key, reason: '只读/禁用' }); continue;
                            }
                            input.focus(); input.value = value;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            input.blur(); result.success++;
                        }
                    } else { result.failed.push({ field: key, reason: '无输入控件' }); }
                } else { result.failed.push({ field: key, reason: '未找到标签' }); }
            } catch (err) { result.failed.push({ field: key, reason: '脚本错误: ' + err.message }); }
        }
        return result;
      })(${JSON.stringify(jsonData)});
    `)
    if (fillResult.error) throw new Error(fillResult.error)
    let msg = `✅ **智能填写完成！**\n成功录入：${fillResult.success} 个字段。`
    if (fillResult.failed.length > 0) {
      msg += `<br/><br/>❌ **以下 ${fillResult.failed.length} 个字段异常：**<table style="width:100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; border: 1px solid #ebeef5;"><tbody>`
      fillResult.failed.forEach(item => {
        msg += `<tr><td style="padding: 6px; border: 1px solid #ebeef5;">${item.field}</td><td style="padding: 6px; border: 1px solid #ebeef5; color: #f56c6c;">${item.reason}</td></tr>`
      })
      msg += `</tbody></table>`
    }
    aiRef.value.addAiMessage(msg)
  } catch (error) {
    console.error(error)
    aiRef.value.addAiMessage(`❌ 填写中断：${error.message}`)
  }
}
</script>

<style scoped>
.swgd-webview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: #fff;
  position: relative;
}
.webview-header {
  height: 40px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #ebeef5;
  background-color: #f5f7fa;
  flex-shrink: 0;
}
.webview-header .title {
  font-size: 14px;
  font-weight: bold;
  color: #606266;
}
.header-btns {
  display: flex;
  gap: 10px;
}
.custom-webview {
  flex: 1;
  width: 100%;
  display: flex;
}
</style>
