<template>
  <div class="iframe-container">
    <webview ref="webviewRef" src="https://www.singlewindow.cn/#/manual" class="webview-element"></webview>

    <!-- 1. [修改] 初始加载状态浮层 (居中) -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>正在初始化安全环境...</p>
    </div>

    <!-- 2. [修改] 上传状态浮层 (居中) -->
    <div v-if="uploadState.active" class="upload-status">
      <div class="spinner"></div>
      <p>正在上传报关单至单证保管箱...</p>
      <p>文件名: {{ uploadState.filename }}</p>
      <!-- [修改] 进度显示 (Request #1) -->
      <p>进度: {{ uploadState.percent }}% ({{ formatBytes(uploadState.bytesUploaded) }} / {{ formatBytes(uploadState.totalSize) }})</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
// [修改] 导入 EpMessage (Request #3)
import { EpMessage } from 'ep-ui-plus'

// OCP 服务器的上传配置
const OCP_UPLOAD_URL = `${import.meta.env.VITE_OCP_SERVER_URL || 'http://localhost:59998'}/upload`
const OCP_UPLOAD_PATH = '/ocptest/intercepted-files'

const webviewRef = ref<any>(null)
const isLoading = ref(true) // [新增] 初始加载状态
const uploadState = reactive({
  active: false,
  filename: 'N/A',
  chunks: [] as Uint8Array[],
  bytesUploaded: 0,
  totalSize: 0, // [新增] (Request #1)
  percent: 0 // [新增] (Request #1)
})

// 用于存储清理函数的 ref
const cleanupListeners = ref<(() => void)[]>([])

onMounted(async () => {
  const webview = webviewRef.value
  if (!webview) {
    console.error('VUE: Webview 元素未找到！')
    return
  }

  // 监听 'dom-ready' 来注册 webview
  webview.addEventListener('dom-ready', () => {
    console.log('VUE: Webview DOM Ready.')
    isLoading.value = false // [新增] DOM 加载完毕，隐藏初始加载

    // [修复 2] 移除自动打开的 devtools
    // webview.openDevTools()

    // 获取 webview 的 ID 并发送给主进程
    try {
      const webviewId = webview.getWebContentsId()
      console.log(`VUE: Webview ID 是 ${webviewId}. 正在发送给主进程...`)
      window.electronAPI.send('register-webview-listener', webviewId)
    } catch (err) {
      console.error('VUE: 无法获取 webContentsId:', err)
    }
  })

  // 监听来自主进程的消息 (使用 electronApi.on)

  const onStart = (data: any) => {
    console.log('VUE: 收到 upload-to-ocp-start', data)

    // [修改] 移除 onStart 时的 EpMessage (Request #2)

    // 激活上传浮层
    uploadState.active = true
    uploadState.filename = data.filename
    uploadState.chunks = []
    uploadState.bytesUploaded = 0
    // [新增] 期望从 IPC 消息中获取 totalSize (Request #1)
    // (注意: 这需要 'interceptor.ts' 在 'upload-to-ocp-start' 消息中发送 totalSize)
    uploadState.totalSize = data.totalSize || 0
    uploadState.percent = 0
  }

  const onData = (data: Uint8Array) => {
    // console.log('VUE: 收到 upload-to-ocp-data chunk') // 日志太多，注释掉
    if (!uploadState.active) return // 防止在 onStart 之前收到数据
    uploadState.chunks.push(data)
    uploadState.bytesUploaded += data.length

    // [新增] 计算百分比 (Request #1)
    if (uploadState.totalSize > 0) {
      uploadState.percent = Math.min(100, Math.round((uploadState.bytesUploaded / uploadState.totalSize) * 100))
    }
  }

  const onEnd = () => {
    console.log('VUE: 收到 upload-to-ocp-end. 准备上传...')
    // [修改] uploadToOCPServer 会在上传完毕后关闭浮层
    uploadToOCPServer()
  }

  const onError = (errorMsg: string) => {
    console.error('VUE: 劫持时发生错误:', errorMsg)
    uploadState.active = false // 出错时也关闭浮层
  }

  // 注册监听器并保存清理函数
  cleanupListeners.value.push(window.electronAPI.on('upload-to-ocp-start', onStart))
  cleanupListeners.value.push(window.electronAPI.on('upload-to-ocp-data', onData))
  cleanupListeners.value.push(window.electronAPI.on('upload-to-ocp-end', onEnd))
  cleanupListeners.value.push(window.electronAPI.on('upload-to-ocp-error', onError))
})

// 组件卸载时，清理所有监听器
onUnmounted(() => {
  console.log('VUE: 卸载组件, 清理 webRequest 监听器...')
  // 告诉主进程停止监听
  window.electronAPI.send('unregister-webview-listener')
  // 清理所有 Vue 端的 'on' 监听器
  cleanupListeners.value.forEach(cleanup => cleanup())
})

/**
 * 将收集到的数据块 (chunks) 上传到 OCP 服务器
 */
async function uploadToOCPServer() {
  if (uploadState.chunks.length === 0) {
    console.error('OCP 上传失败: 没有数据。')
    uploadState.active = false // 确保浮层关闭
    return
  }

  const fileBlob = new Blob(uploadState.chunks, {
    type: 'application/octet-stream'
  })

  const formData = new FormData()
  formData.append('file', fileBlob, uploadState.filename)
  formData.append('path', OCP_UPLOAD_PATH)

  console.log(`正在上传 ${uploadState.filename} (共 ${fileBlob.size} 字节) 到 ${OCP_UPLOAD_URL}`)

  try {
    const response = await fetch(OCP_UPLOAD_URL, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`OCP 服务器响应失败: ${response.statusText}`)
    }

    const resultText = await response.text()
    console.log('OCP 上传成功:', resultText)

    // [新增] 上传成功后显示 2 秒的 EpMessage
    EpMessage({
      message: '报关单已成功上传至保管箱！',
      type: 'success',
      duration: 2000 // 2 秒
    })
  } catch (err) {
    console.error('OCP 上传失败:', err)

    // [新增] 上传失败后显示 2 秒的 EpMessage
    EpMessage({
      message: '报关单上传失败。',
      type: 'error',
      duration: 2000 // 2 秒
    })
  } finally {
    // [新增] 无论成功还是失败，都关闭浮层
    uploadState.active = false
    uploadState.chunks = []
    uploadState.bytesUploaded = 0
    // [新增] 重置百分比和总大小
    uploadState.percent = 0
    uploadState.totalSize = 0
  }
}

/**
 * 格式化字节单位
 */
function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
</script>

<style scoped>
.iframe-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
}
.webview-element {
  width: 100%;
  height: 100%;
  border: none;
}

/* [修改] 居中浮层 (用于初始加载和上传进度)
*/
.loading-container,
.upload-status {
  position: fixed; /* [修改] 改为 fixed，使其在视口中居中 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 居中 */

  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 25px 30px;
  border-radius: 12px;
  z-index: 100;
  display: flex;
  flex-direction: column; /* [修改] 改为纵向排列 */
  align-items: center;
  gap: 15px;
  font-size: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.upload-status p {
  margin: 0;
}
.loading-container p {
  margin: 0;
  font-size: 16px;
  color: #f0f0f0;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px; /* [修改] 统一尺寸 */
  height: 40px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
