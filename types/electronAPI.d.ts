/**
 * 为 electron/preload/index.ts 中通过 contextBridge 暴露的
 * 'electronApi' 对象提供 TypeScript 类型定义。
 */

// 1. 定义暴露的 API 接口
export interface IElectronAPI {
  /**
   * 发送消息到主进程 (单向)
   * @param channel 通道名 (必须在 electronAPI.ts 中注册)
   * @param args 任意参数
   */
  send: (channel: string, ...args: any[]) => void

  /**
   * 监听来自主进程的消息
   * @param channel 通道名 (必须在 electronAPI.ts 中注册)
   * @param listener 收到消息时执行的回调函数
   * @returns 一个用于移除监听器的清理函数
   */
  on: (channel: string, listener: (...args: any[]) => void) => () => void

  /**
   * 发送消息到主进程并等待响应 (双向)
   * @param channel 通道名 (必须在 electronAPI.ts 中注册)
   * @param args 任意参数
   * @returns 一个 Promise，解析为主进程返回的响应
   */
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

// 2. 将此 API 附加到全局 window 对象
declare global {
  interface Window {
    /**
     * Electron 预加载脚本暴露的通用 IPC API
     */
    electronAPI: IElectronAPI
  }
}
