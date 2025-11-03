// public/interceptor-preload.js

// --- [新增] 关键调试日志 ---
console.log('[Interceptor] --- PRELOAD 脚本已注入 --- (v2 - 宽松匹配模式)')

// 1. 导入 Electron 的 ipcRenderer
let ipcRenderer
try {
  ipcRenderer = require('electron').ipcRenderer
  console.log('[Interceptor] `ipcRenderer` 加载成功。')
} catch (e) {
  console.error('[Interceptor] 严重错误: 无法加载 `ipcRenderer`。', e)
  console.error('[Interceptor] 请确保在 electron/main/index.ts 中设置了 `nodeIntegrationInSubFrames: true`')
}

// -----------------------------------------------------------------
// 辅助函数
// -----------------------------------------------------------------

/**
 * [已修改] 检查 URL 是否是我们想要拦截的下载。
 */
function isTargetDownloadUrl(url) {
  if (!url || typeof url !== 'string') {
    return false
  }

  console.log('[Interceptor] 正在检查 URL:', url)

  // -----------------------------------------------------------------
  // [关键修复] 按照你的要求，放宽匹配规则
  // -----------------------------------------------------------------
  // 旧规则: url.includes('/fs/STADOCROOT/') && url.includes('?_downloadmode=2')
  // 新规则: 只要 URL 包含 "https://www.singlewindow.cn/fs/"

  const isFsDownload = url.startsWith('https://www.singlewindow.cn/fs/')

  if (isFsDownload) {
    console.log('[Interceptor] URL 匹配成功！(规则: "https://www.singlewindow.cn/fs/")')
    return true
  }

  return false
}

/**
 * [已修改] 异步获取文件数据并将其流式传输到主 Electron 进程。
 */
async function triggerOcpUpload(url) {
  // --- [新增] 关键调试日志 ---
  console.log('[Interceptor] --- triggerOcpUpload 已调用 ---', url)

  try {
    console.log('[Interceptor] 正在尝试使用 fetch 劫持下载:', url)
    // 因为 cURL 显示 'same-origin'，这个 fetch 应该会成功。
    const response = await originalFetch(url)

    if (!response.ok) {
      throw new Error(`Fetch 失败，状态: ${response.status}`)
    }

    console.log('[Interceptor] 内部 fetch 成功。')
    // 克隆响应
    const responseClone = response.clone()

    // --- [新增] 查找文件名 ---
    const contentDisposition = responseClone.headers.get('content-disposition')
    let filename = 'unknown_file'

    // 1. 尝试从 Content-Disposition
    if (contentDisposition) {
      console.log('[Interceptor] 找到 Content-Disposition:', contentDisposition)
      const match = contentDisposition.match(/filename="?([^"]+)"?/)
      if (match) {
        // 尝试解码 (例如 'filename="UTF-8\'\'example.pdf"')
        try {
          filename = decodeURIComponent(match[1].replace(/UTF-8''/, ''))
        } catch (e) {
          filename = match[1]
        }
      }
    }

    // 2. [新增] 如果失败，尝试从 URL 中的 filenamex
    if (filename === 'unknown_file') {
      console.log('[Interceptor] 未找到 Content-Disposition, 尝试从 URL 参数 `filenamex`...')
      try {
        const urlObj = new URL(url)
        // 尝试从 'filenamex' (在你的 cURL 示例中)
        const filenamex = urlObj.searchParams.get('filenamex')
        if (filenamex) {
          console.log('[Interceptor] 找到 `filenamex`:', filenamex)
          // 你的 'filenamex' 看起来是十六进制编码的 Unicode
          // 这是一个简化的解码器 (将 00xx 替换为 %xx)
          filename = decodeURIComponent(filenamex.replace(/00/g, '%'))
        } else {
          // 否则，只取路径的最后一部分
          console.log('[Interceptor] 未找到 `filenamex`, 从路径中提取文件名...')
          filename = urlObj.pathname.split('/').pop()
        }
      } catch (e) {
        console.warn('[Interceptor] 解析文件名失败', e)
        filename = url.split('/').pop().split('?')[0] // 最后的备用方案
      }
    }
    // --- 文件名查找结束 ---

    console.log('[Interceptor] 解析得到的文件名:', filename)

    // 通知 Vue App：上传开始了！
    ipcRenderer.sendToHost('upload-to-ocp-start', {
      filename: filename,
      url: url
    })

    // 流式读取数据
    const reader = responseClone.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      // 将数据块 (Uint8Array) 发送回 Vue App
      ipcRenderer.sendToHost('upload-to-ocp-data', value)
    }

    // 通知 Vue App：数据发送完毕
    ipcRenderer.sendToHost('upload-to-ocp-end')
    console.log('[Interceptor] 数据流发送完毕。')
  } catch (err) {
    console.error('[Interceptor] 劫持下载流时出错:', err)
    ipcRenderer.sendToHost('upload-to-ocp-error', err.message)
  }
}

// -----------------------------------------------------------------
// 拦截器 1: 拦截 Fetch
// -----------------------------------------------------------------
const originalFetch = window.fetch
window.fetch = async function (url, options) {
  // --- [新增] 关键调试日志 ---
  console.log('[Interceptor] 侦测到 `fetch` 调用. URL:', url)

  // 检查 URL 是否是我们要劫持的
  if (isTargetDownloadUrl(url)) {
    console.log('[Interceptor] `fetch` 匹配成功, 正在劫持...')

    // 触发我们的劫持逻辑
    triggerOcpUpload(url)

    // 返回一个“假的”成功响应，以欺骗原始页面，让它以为下载开始了
    // (注意：这可能会中断原始页面的逻辑，如果它期望一个真实的文件流)
    return new Response(null, { status: 204, statusText: 'No Content' })
  }

  // 如果不是目标URL，则原封不动地继续
  return originalFetch(url, options)
}
console.log('[Interceptor] `fetch` 函数已重写。')

// -----------------------------------------------------------------
// 拦截器 2: 拦截 createElement (用于 <iframe src="...">)
// -----------------------------------------------------------------
const originalCreateElement = document.createElement
document.createElement = function (tagName) {
  const element = originalCreateElement.apply(this, arguments)

  // --- [新增] 关键调试日志 ---
  console.log('[Interceptor] 侦测到 `createElement`. 标签:', tagName)

  // 监视 'iframe' 标签
  if (tagName && tagName.toLowerCase() === 'iframe') {
    // --- [新增] 关键调试日志 ---
    console.log('[Interceptor] `iframe` 被创建. 正在劫持 `src` 属性...')

    // 劫持 'src' 属性的设置
    let srcCache = ''
    Object.defineProperty(element, 'src', {
      configurable: true, // 允许我们再次定义
      enumerable: true,
      get: function () {
        return srcCache
      },
      set: function (newSrc) {
        // --- [新增] 关键调试日志 ---
        console.log('[Interceptor] 侦测到 `iframe.src` 被设置. URL:', newSrc)

        // [已修改] 检查这个 src 是否是我们要找的下载
        if (isTargetDownloadUrl(newSrc)) {
          console.log('[Interceptor] `iframe.src` 匹配成功, 正在劫持...')
          // 触发我们的上传，但不设置 src，从而阻止原始 iframe 下载
          triggerOcpUpload(newSrc)
        } else {
          // 否则，正常设置 src
          srcCache = newSrc
          // 使用 setAttribute 来实际设置 DOM 属性
          element.setAttribute('src', newSrc)
        }
      }
    })
  }
  return element
}
console.log('[Interceptor] `document.createElement` 函数已重写。')

// -----------------------------------------------------------------
// 拦截器 3: 拦截 window.open (用于弹出窗口下载)
// -----------------------------------------------------------------
const originalOpen = window.open
window.open = function (url, target, features) {
  // --- [新增] 关键调试日志 ---
  console.log('[Interceptor] 侦测到 `window.open` 调用. URL:', url)

  // [已修改] 检查 URL
  if (isTargetDownloadUrl(url)) {
    console.log('[Interceptor] `window.open` 匹配成功, 正在劫持...')
    // 触发我们的上传并阻止打开新窗口
    triggerOcpUpload(url)
    return null // 返回 null 来阻止窗口打开
  }
  return originalOpen.apply(this, arguments)
}
console.log('[Interceptor] `window.open` 函数已重写。')
