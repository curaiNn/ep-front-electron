// 告诉 TypeScript window 对象上有一个 electronAPI 属性
export interface IElectronAPI {
  getAppVersion: () => Promise<string>
  checkForUpdates: () => void
  onUpdateAvailable: (callback: (message: string) => void) => () => void
  onUpdateDownloaded: (callback: (message: string) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}
