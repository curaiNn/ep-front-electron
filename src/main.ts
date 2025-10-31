import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import EpUiPlus from 'ep-ui-plus'
import 'ep-ui-plus/dist/index.css'

// 引入 Less 入口文件
import './assets/main.less'
import { useAppStore } from '@/store/app.ts'

// 1. 创建 Pinia 实例
const pinia = createPinia()

// 2. 创建 Vue 应用实例
const app = createApp(App)
// 3. 使用 Pinia
app.use(pinia)

app.use(EpUiPlus)

const appStore = useAppStore(pinia)

// 5. 异步从主进程获取系统信息
try {
  // 这会触发 electron/main/ipc/system.ts (）中的 'get-system-info' 处理器
  const systemInfo = await window.electronAPI.invoke('get-system-info')

  // 6. 将获取到的信息设置到 Pinia store 中
  appStore.setSystemInfo(systemInfo)
  console.log('系统信息获取成功:', systemInfo)
} catch (error) {
  console.error('获取系统信息失败:', error)
  // 即使失败，也设置一些默认值，防止应用崩溃
  appStore.setSystemInfo({
    hostname: 'N/A',
    arch: 'N/A',
    os: 'N/A',
    ip: 'N/A'
  })
}

// 4. 挂载应用
app.mount('#app')
