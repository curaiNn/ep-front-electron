import { defineStore } from 'pinia'
import { ref } from 'vue'
import packageJson from '../../package.json'

/**
 * 应用系统状态存储
 * 使用 setup store 风格 (推荐)
 */
export const useAppStore = defineStore('app', () => {
  // --- state ---

  /**
   * 应用标题
   * 默认从 package.json 的 description 字段获取
   */
  const title = ref<string>(import.meta.env.VITE_APP_TITLE)

  /**
   * 当前应用版本
   * 从 package.json 的 version 字段获取
   */
  const currentVersion = ref<string>(packageJson.version || '1.0.0')

  /**
   * 最新应用版本
   * (通常从服务器异步获取)
   */
  const latestVersion = ref<string>('')

  /**
   * 是否需要更新
   * (在检查更新后设置)
   */
  const needsUpdate = ref<boolean>(false)

  /**
   * 客户端 IP
   * (需要从主进程获取)
   */
  const clientIP = ref<string>('')

  /**
   * 客户端 Hostname
   * (需要从主进程获取, e.g., os.hostname())
   */
  const clientHostname = ref<string>('')

  /**
   * 系统架构
   * (需要从主进程获取, e.g., os.arch() -> 'x64', 'arm64')
   */
  const systemArchitecture = ref<string>('')

  /**
   * 操作系统
   * (需要从主进程获取, e.g., os.platform() -> 'win32', 'darwin', 'linux')
   */
  const operatingSystem = ref<string>('')

  // --- actions ---

  /**
   * 设置最新版本号，并检查是否需要更新
   * @param version - 从服务器获取的最新版本号
   */
  function setLatestVersion(version: string) {
    latestVersion.value = version

    // 这里是一个简单的版本对比
    // 在实际生产中，你可能需要使用 'semver' 库来处理更复杂的版本比较
    if (version && currentVersion.value !== version) {
      needsUpdate.value = true
    } else {
      needsUpdate.value = false
    }
  }

  /**
   * 设置客户端系统信息
   * 这些信息通常在 Electron 主进程中获取，通过 preload 脚本传递给渲染进程
   * * @param info - 包含系统信息的对象
   */
  function setSystemInfo(info: { ip?: string; hostname?: string; arch?: string; os?: string }) {
    if (info.ip) clientIP.value = info.ip
    if (info.hostname) clientHostname.value = info.hostname
    if (info.arch) systemArchitecture.value = info.arch
    if (info.os) operatingSystem.value = info.os
  }

  // --- return ---
  // 暴露 state 和 actions
  return {
    title,
    currentVersion,
    latestVersion,
    needsUpdate,
    clientIP,
    clientHostname,
    systemArchitecture,
    operatingSystem,

    setLatestVersion,
    setSystemInfo
  }
})
