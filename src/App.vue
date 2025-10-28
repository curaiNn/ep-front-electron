<template>
  <div class="container">
    <h1>Electron + Vue 3 + Vite</h1>
    <p>欢迎来到你的 Electron 应用模板！</p>

    <div class="card">
      <h2>Pinia 状态管理</h2>
      <p>当前计数: {{ demoStore.count }}</p>
      <p>双倍计数: {{ demoStore.doubleCount }}</p>
      <button @click="demoStore.increment">增加计数</button>
    </div>

    <div class="card">
      <h2>Day.js 日期格式化</h2>
      <p>当前时间: {{ currentTime }}</p>
    </div>

    <div class="card">
      <h2>Axios 数据请求</h2>
      <button @click="fetchData" :disabled="loading">
        {{ loading ? '加载中...' : '请求模拟数据' }}
      </button>
      <pre v-if="apiData">{{ apiData }}</pre>
      <p v-if="apiError" class="error">{{ apiError }}</p>
    </div>

    <div class="card">
      <h2>Electron API (热更新)</h2>
      <button @click="handleCheckForUpdates">检查更新</button>
      <p class="update-status">{{ updateMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDemoStore } from '@/store/demoStore'
import api from '@/services/api'
import dayjs from 'dayjs'

// Pinia
const demoStore = useDemoStore()

// Day.js
const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))

// Axios
const loading = ref(false)
const apiData = ref(null)
const apiError = ref<string | null>(null)

const fetchData = async () => {
  loading.value = true
  apiData.value = null
  apiError.value = null
  try {
    // 使用 jsonplaceholder 作为模拟 API
    const response = await api.get('/todos/1')
    apiData.value = response.data
  } catch (error: any) {
    apiError.value = `请求失败: ${error.message}`
  } finally {
    loading.value = false
  }
}

// === Electron Updater ===
const updateMessage = ref('准备检查更新...')
let cleanupUpdateAvailable: () => void
let cleanupUpdateDownloaded: () => void

// 触发检查更新
const handleCheckForUpdates = () => {
  updateMessage.value = '正在检查更新...'
  window.electronAPI.checkForUpdates()
}

onMounted(() => {
  // 更新当前时间
  const timer = setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)

  // 监听更新事件
  if (window.electronAPI) {
    cleanupUpdateAvailable = window.electronAPI.onUpdateAvailable(
      (message: string) => {
        updateMessage.value = message
      },
    )

    cleanupUpdateDownloaded = window.electronAPI.onUpdateDownloaded(
      (message: string) => {
        updateMessage.value = message
        // 你可以在这里显示一个弹窗，询问用户是否立即重启
      },
    )
  }

  onUnmounted(() => {
    clearInterval(timer)
    // 组件卸载时清理监听器
    if (cleanupUpdateAvailable) cleanupUpdateAvailable()
    if (cleanupUpdateDownloaded) cleanupUpdateDownloaded()
  })
})
</script>

<style lang="less" scoped>
/* 引入全局变量 */
@import '@/assets/variables.less';

.container {
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  text-align: center;
  color: #333;
}

h1 {
  color: @primary-color;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

p {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;

  h2 {
    margin-top: 0;
    color: @primary-color;
    border-bottom: 2px solid @secondary-color;
    padding-bottom: 0.5rem;
  }

  button {
    background-color: @primary-color;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color 0.3s ease,
      transform 0.1s ease;

    &:hover {
      background-color: darken(@primary-color, 10%);
    }

    &:active {
      transform: scale(0.98);
    }

    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  }

  pre {
    background: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Courier New', Courier, monospace;
    margin-top: 1rem;
  }

  .error {
    color: #e74c3c;
    font-weight: bold;
    margin-top: 1rem;
  }

  .update-status {
    color: @secondary-color;
    font-weight: 500;
    margin-top: 1rem;
    font-size: 1rem;
  }
}
</style>

