import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import EpUiPlus from 'ep-ui-plus'
import 'ep-ui-plus/dist/index.css'

// 引入 Less 入口文件
import './assets/main.less'

// 1. 创建 Pinia 实例
const pinia = createPinia()

// 2. 创建 Vue 应用实例
const app = createApp(App)
// 3. 使用 Pinia
app.use(pinia)

app.use(EpUiPlus)

// 4. 挂载应用
app.mount('#app')

console.log(import.meta.env.VITE_APP_TITLE)
