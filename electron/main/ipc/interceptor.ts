import { ipcMain, session, net, BrowserWindow, WebContents } from 'electron'
import path from 'path'
import { Buffer } from 'buffer' // 导入 Buffer

// --- [新架构] ---

// 1. 我们需要一个变量来存储 vue 窗口，以便回传消息
let vueWebContents: WebContents | null = null

// 2. 我们需要一个变量来存储 webview 的 ID，以便过滤请求
let webviewContentsId: number | null = null

/**
 * [新] 异步处理被劫持的下载
 * (这个函数在 Electron 主进程中运行)
 */
async function handleOcpUpload(url: string) {
  if (!vueWebContents) {
    console.error('IPC: 无法回传消息，vueWebContents 未注册。')
    return
  }

  console.log('IPC: 劫持成功, 正在下载:', url)

  try {
    // 3. 在主进程中使用 'net' 模块下载文件
    const response = await net.fetch(url)
    if (!response.ok) {
      throw new Error(`主进程 fetch 失败, 状态: ${response.status}`)
    }
    console.log('IPC: 内部 fetch 成功, 准备流式传输...')

    // ---
    // [修复 1] 从 Content-Length 响应头中获取文件总大小
    // ---
    const contentLength = response.headers.get('content-length')
    const totalSize = contentLength ? parseInt(contentLength, 10) : 0
    console.log(`IPC: 解析到 Content-Length: ${totalSize} 字节`)

    // 4. 解析文件名 (逻辑与旧 preload 相同)
    const contentDisposition = response.headers.get('content-disposition')
    let filename = 'unknown_file'

    if (contentDisposition) {
      console.log('IPC: 找到 Content-Disposition:', contentDisposition)
      // 匹配 =?utf-8?B?...?=
      const base64Match = contentDisposition.match(/=\?utf-8\?B\?([^?]+)\?=/i)
      if (base64Match && base64Match[1]) {
        // [修复 1.1] 解码 Base64 文件名
        filename = Buffer.from(base64Match[1], 'base64').toString('utf-8')
        console.log('IPC: 解码 Base64 文件名:', filename)
      } else {
        // 尝试标准匹配
        const standardMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (standardMatch && standardMatch[1]) {
          filename = standardMatch[1]
        }
      }
    }

    if (filename === 'unknown_file') {
      try {
        const urlObj = new URL(url)
        const filenamex = urlObj.searchParams.get('filenamex')
        if (filenamex) {
          filename = decodeURIComponent(filenamex.replace(/00/g, '%'))
        } else {
          filename = new URL(url).pathname.split('/').pop() || 'downloaded_file'
        }
      } catch (e) {
        filename = url.split('/').pop()?.split('?')[0] || 'downloaded_file'
      }
    }

    // 5. 将数据流式传回 Vue 组件
    // [修复 1.2] 将 totalSize 发送给 Vue 组件
    vueWebContents.send('upload-to-ocp-start', {
      filename,
      url,
      totalSize: totalSize // <-- 在这里发送总大小
    })

    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      vueWebContents.send('upload-to-ocp-data', value)
    }

    vueWebContents.send('upload-to-ocp-end')
    console.log('IPC: 数据流传输完毕。')
  } catch (err) {
    console.error('IPC: handleOcpUpload 失败:', err)
    vueWebContents.send('upload-to-ocp-error', err.message)
  }
}

/**
 * 注册与拦截器相关的 IPC 处理器
 */
export function registerInterceptorHandlers() {
  // 6. [修改] 注册 webview ID，并开始监听
  ipcMain.on('register-webview-listener', (event, id: number) => {
    vueWebContents = event.sender // 保存 Vue 窗口的 webContents
    webviewContentsId = id
    console.log(`IPC: 收到 webview ID ${id}, 开始监听网络请求...`)

    // 7. [关键] 附加 'webRequest' 监听器
    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
      // 检查请求是否来自我们正在监视的 webview
      if (details.webContentsId !== webviewContentsId) {
        callback({}) // 不是，放行
        return
      }

      // 检查 URL 是否匹配我们的规则
      const isTargetDownload = details.url.startsWith('https://www.singlewindow.cn/fs/')

      if (isTargetDownload) {
        // [关键] 匹配成功！
        console.log(`IPC: 侦测到目标 URL: ${details.url}`)

        // 1. 异步处理这个下载 (我们不能阻塞 callback)
        handleOcpUpload(details.url)

        // 2. [修改] 放行原始请求，让 iframe 自己的下载继续
        callback({})
      } else {
        // 不匹配，放行
        callback({})
      }
    })
  })

  // 8. [新增] 停止监听
  ipcMain.on('unregister-webview-listener', () => {
    console.log('IPC: 停止监听网络请求。')
    session.defaultSession.webRequest.onBeforeRequest(null) // 移除所有监听器
    vueWebContents = null
    webviewContentsId = null
  })
}
