// src/utils/download.ts

import { useEmitt } from '../hooks/useEmitt.ts' // 导入我们刚创建的 Event Bus

/**
 * 使用 XMLHttpRequest 下载文件并广播进度事件
 * @param url 文件的下载地址
 * @param fileName 要保存的文件名
 */
export function downloadFile(url: string, fileName: string) {
  // 1. 获取全局 emitter 实例
  // 我们只在这里发射事件，所以不需要传 option
  const { emitter } = useEmitt()

  // 2. 生成一个唯一的 ID，用于跟踪这个特定的下载任务
  const sequenceId = 'download_' + Date.now()

  // 3. 广播 'add-process' 事件
  // 任何监听这个事件的UI组件（如下载管理器）都可以收到
  emitter.emit('add-process', {
    id: sequenceId,
    fileName: fileName
  })

  // 4. 设置 XMLHttpRequest
  const xhr = new XMLHttpRequest()
  xhr.open('GET', url, true)
  xhr.responseType = 'blob'

  // 5. 监听加载完成
  xhr.onload = function () {
    if (xhr.status === 200) {
      // 下载成功
      const blob = new Blob([xhr.response])
      const downloadLink = document.createElement('a')
      downloadLink.href = URL.createObjectURL(blob)
      downloadLink.download = fileName
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(downloadLink.href)

      // 广播 'remove-process' 事件
      emitter.emit('remove-process', { id: sequenceId, status: 'completed' })
    } else {
      // 下载失败（服务器返回非200状态）
      console.error('文件下载失败:', xhr.statusText)
      emitter.emit('remove-process', { id: sequenceId, status: 'failed', error: xhr.statusText })
    }
  }

  // 6. 监听进度
  xhr.onprogress = event => {
    // 广播 'update-process' 事件
    emitter.emit('update-process', {
      id: sequenceId,
      event: event // 将原生的 ProgressEvent 整个传递出去
    })
  }

  // 7. 监听网络错误
  xhr.onerror = function () {
    console.error('网络错误或服务器未响应')
    emitter.emit('remove-process', { id: sequenceId, status: 'error', error: 'Network Error' })
  }

  // 8. 发送请求
  xhr.send()
}
