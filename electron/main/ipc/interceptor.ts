import { ipcMain, session, net, BrowserWindow, WebContents } from 'electron'
import path from 'path'

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

    // 4. [修改] 解析文件名
    const contentDisposition = response.headers.get('content-disposition')
    let filename = 'unknown_file'

    if (contentDisposition) {
      console.log('IPC: 找到 Content-Disposition:', contentDisposition)

      // 1. [新增] 尝试解析 RFC 2047 (=?utf-8?B?...)
      // 匹配你提供的: =?utf-8?B?4oCc5o6M...cHZGY=?=
      const rfc2047Match = contentDisposition.match(/filename="=\?utf-8\?B\?([^?]+)\?="/i)
      if (rfc2047Match && rfc2047Match[1]) {
        console.log('IPC: 正在解析 RFC 2047 (Base64) 文件名...')
        try {
          const base64Part = rfc2047Match[1]
          // 使用 Node.js 的 Buffer 解码 Base64
          filename = Buffer.from(base64Part, 'base64').toString('utf-8')
          console.log('IPC: Base64 解析成功:', filename)
        } catch (e) {
          console.error('IPC: Base64 解码失败', e)
          filename = 'download.dat' // 解码失败时的备用名
        }
      } else {
        // 2. [保留] 尝试简单的 filename="..."
        const simpleMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (simpleMatch && simpleMatch[1]) {
          console.log('IPC: 正在解析简单文件名...')
          filename = simpleMatch[1]
        }
      }
    }

    // 3. [保留] 如果以上都失败了，从 URL 中猜测
    if (filename === 'unknown_file') {
      console.log('IPC: 未在 header 中找到文件名, 尝试从 URL 解析...')
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

    // 5. 将数据流式传回 Vue 组件 (模仿 preload 的消息)
    vueWebContents.send('upload-to-ocp-start', { filename, url })

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

        // 2. [关键修复] 放行原始请求，让 webview 内部的下载继续
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

  // 9. [保留] 'get-public-file-path' (虽然现在不用了，但保留它没坏处)
  ipcMain.handle('get-public-file-path', (event, fileName: string): string => {
    if (process.env['ELECTRON_RENDERER_URL']) {
      return path.join(process.cwd(), 'public', fileName)
    } else {
      return path.join(__dirname, '../', fileName)
    }
  })
}
