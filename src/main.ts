import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 引入 Less 入口文件
import './assets/main.less'

// 1. 创建 Pinia 实例
const pinia = createPinia()

// 2. 创建 Vue 应用实例
const app = createApp(App)

// 3. 使用 Pinia
app.use(pinia)

// 4. 挂载应用
app.mount('#app')
