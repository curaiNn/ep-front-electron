import { ipcMain } from 'electron'
import * as os from 'os'

export function registerSystemInfoHandlers(): void {
  ipcMain.handle('get-system-info', () => {
    console.log('正在获取系统信息...')
    // 注意：IP 地址获取逻辑比较复杂，os.networkInterfaces() 会返回所有接口
    // 这里我们先返回一个占位符，或者你可以实现更复杂的逻辑来找到"主要"IP
    const networkInterfaces = os.networkInterfaces()
    let ip = ''
    try {
      // 尝试查找一个非内部的 IPv4 地址
      const externalIPv4 = Object.values(networkInterfaces)
        .flat()
        .find(iface => iface?.family === 'IPv4' && !iface.internal)
      ip = externalIPv4?.address || '127.0.0.1'
    } catch (e) {
      ip = 'Error fetching IP'
    }

    return {
      hostname: os.hostname(), // 客户端hostname
      arch: os.arch(), // 系统架构
      os: os.platform(), // 操作系统 (win32, darwin, linux)
      ip: ip // 客户端 IP (简单示例)
    }
  })
}
