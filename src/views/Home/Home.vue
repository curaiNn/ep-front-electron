<template>
  <!--
    这部分内容现在会在 src/layout/index.vue 内部滚动
  -->
  <div class="container">
    <h1>Electron + Vue 3 + Vite</h1>
    <p>欢迎来到你的 Electron 应用模板！1.0.0</p>
    <ep-button @click="$router.push('/about')">跳转到 About 页面</ep-button>

    <!-- 我保留了 Pinia 的示例，因为 main.ts 中注册了它 -->
    <div class="card">
      <h2>Pinia 状态管理</h2>
      <p>当前计数: {{ demoStore.count }}</p>
      <button @click="demoStore.increment">增加计数</button>
    </div>

    <div class="card">
      <h2>Day.js 日期格式化</h2>
      <p>当前时间: {{ currentTime }}</p>
    </div>

    <div class="card">
      <h2>Electron API (热更新)</h2>
      <button @click="handleCheckForUpdates">检查更新 (下载)</button>
      <p class="update-status">{{ updateMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDemoStore } from '@/store/demoStore' // 假设 store 在这里
import dayjs from 'dayjs'
import { downloadFile } from '@/utils/download' // 确保路径正确

// Pinia
const demoStore = useDemoStore()

// Day.js
const currentTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))

// === Electron Updater ===
const updateMessage = ref('准备检查更新...')

// 触发检查更新
const handleCheckForUpdates = () => {
  updateMessage.value = '正在下载...'
  downloadFile(
    'http://192.168.118.127:59998/download?path=//u01/nfs/ep-security/epSecurity-Mac-3.0.0-Installer.dmg',
    'epSecurity-Mac-3.0.0-Installer.dmg'
  )
}

let timer: number
onMounted(() => {
  // 更新当前时间
  timer = setInterval(() => {
    currentTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style lang="less" scoped>
/* 你之前的所有页面样式
*/
.container {
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  text-align: center;
}

h1 {
  color: var(--font-color-primary);
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
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  h2 {
    margin-top: 0;
    color: var(--font-color-primary);
    border-bottom: 2px solid var(--font-color-secondary);
    padding-bottom: 0.5rem;
  }

  button {
    background-color: var(--font-color-primary);
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
      background-color: var(--font-color-primary-active);
    }
  }

  .update-status {
    color: var(--font-color-secondary);
    font-weight: 500;
    margin-top: 1rem;
    font-size: 1rem;
  }
}
</style>
