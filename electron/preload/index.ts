import { contextBridge, ipcRenderer } from 'electron'

// 任何通道都可以被渲染进程调用。

contextBridge.exposeInMainWorld('electronApi', {
  /**
   * 发送消息到主进程 (单向)
   * @param channel 通道名
   * @param args 参数
   */
  send: (channel: string, ...args: any[]): void => {
    ipcRenderer.send(channel, ...args)
  },

  /**
   * 从主进程接收消息
   * @param channel 通道名
   * @param listener 监听回调
   * @returns 一个用于移除监听器的清理函数
   */
  on: (channel: string, listener: (...args: any[]) => void): (() => void) => {
    // 刻意剥离 'event' 参数
    const newListener = (_: Electron.IpcRendererEvent, ...args: any[]) => {
      listener(...args)
    }
    ipcRenderer.on(channel, newListener)

    // 返回一个清理函数
    return () => {
      ipcRenderer.removeListener(channel, newListener)
    }
  },

  /**
   * 发送消息到主进程并等待响应 (双向)
   * @param channel 通道名
   * @param args 参数
   * @returns Promise<any> 响应数据
   */
  invoke: (channel: string, ...args: any[]): Promise<any> => {
    return ipcRenderer.invoke(channel, ...args)
  }
})
