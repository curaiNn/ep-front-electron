import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const electronAPI = {
  // 示例：获取应用版本
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('get-app-version'),

  /**
   * 触发主进程检查更新
   */
  checkForUpdates: (): void => {
    ipcRenderer.send('check-for-updates')
  },

  /**
   * 监听“可用更新”事件
   * @param callback 回调函数，接收状态消息
   */
  onUpdateAvailable: (callback: (message: string) => void) => {
    const listener = (_event: IpcRendererEvent, message: string) => callback(message)
    ipcRenderer.on('update-available', listener)

    // 返回一个清理函数，用于移除监听器
    return () => {
      ipcRenderer.removeListener('update-available', listener)
    }
  },

  /**
   * 监听“更新下载完成”事件
   * @param callback 回调函数，接收状态消息
   */
  onUpdateDownloaded: (callback: (message: string) => void) => {
    const listener = (_event: IpcRendererEvent, message: string) => callback(message)
    ipcRenderer.on('update-downloaded', listener)

    // 返回一个清理函数，用于移除监听器
    return () => {
      ipcRenderer.removeListener('update-downloaded', listener)
    }
  }
}

try {
  // contextIsolation: true 时使用 contextBridge
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
} catch (error) {
  console.error('Failed to expose electronAPI to preload:', error)
}
