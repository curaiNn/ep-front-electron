import { registerFindHandlers } from './find'

/**
 * 集中注册所有主进程的 IPC 监听器
 *
 * 当应用启动时 (app.whenReady)，应调用此函数。
 * 它会调用所有子模块的注册函数。
 */
export function registerIpcHandlers(): void {
  // 注册“页内查找”的处理器
  registerFindHandlers()

  // 注册其他模块的处理器，例如:
  // registerFileHandlers()
}
