<template>
  <!--
    遮罩层：
    当 isOverlayVisible 为 true 时，这个层会覆盖整个页面
  -->
  <div v-if="isOverlayVisible" class="global-overlay">
    <div class="overlay-content">
      <div class="error-icon">⚠️</div>
      <h2>环境安全异常</h2>
      <!--      <p>{{ errorMessage }}</p>-->
      <p>请确保您已经正确插入卡介质，当前未连接到卡介质无法确认单证保险箱的安全操作。</p>
      <!--      <p>请确保客户端已安装并正确运行后，刷新页面重试。</p>-->
    </div>
  </div>

  <!--
    你的路由视图会正常渲染在遮罩层之下
  -->
  <router-view></router-view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// --- 响应式状态 ---

// 控制遮罩层是否显示
const isOverlayVisible = ref(false)
// 在遮罩层上显示的错误消息
const errorMessage = ref('')
// 轮询定时器的ID
let pollTimer: number | null = null

// --- Promise 封装的 EportClient ---

/**
 * 1. 封装 isInstalled 为 Promise
 */
function promiseIsInstalled(client: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    client.isInstalled('iKey', (msg: any) => {
      if (!msg.Result) {
        const errorMsg = '未装客户端：' + msg.Error.join(',')
        console.error(errorMsg)
        reject(new Error(errorMsg))
      } else {
        console.log('客户端已安装')
        resolve(true)
      }
    })
  })
}

/**
 * 2. 封装 spcInitEnvEx 为 Promise
 */
function promiseSpcInitEnvEx(client: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    console.log('开卡------------------')
    client.spcInitEnvEx((msg: any) => {
      if (!msg.Result) {
        const errorMsg = '开卡失败：' + msg.Error.join(',')
        console.error(errorMsg)
        reject(new Error(errorMsg))
      } else {
        console.log('开卡成功')
        resolve(true)
      }
    })
  })
}

// --- 轮询逻辑 ---

/**
 * 3. 执行检查的轮询函数
 */
async function checkCardStatus() {
  // 假设 EportClient 被加载到了 window 上
  const EportClient = (window as any).EportClient

  if (!EportClient) {
    console.error('EportClient 客户端库未加载。')
    errorMessage.value = '客户端核心组件 (EportClient) 未能加载，请检查网络或刷新页面。'
    isOverlayVisible.value = true
    return // 库未加载，停止轮询
  }

  try {
    // 依次检查
    await promiseIsInstalled(EportClient)
    await promiseSpcInitEnvEx(EportClient)

    // 如果两个检查都成功通过
    console.log('状态正常：客户端已安装并开卡成功。')
    isOverlayVisible.value = false
    errorMessage.value = ''
  } catch (error: any) {
    // 如果任何一个检查失败
    errorMessage.value = error.message
    isOverlayVisible.value = true
  }
}

// --- Vue 生命周期钩子 ---

onMounted(() => {
  console.log('启动开卡状态轮询...')
  // 1. 立即执行一次检查
  checkCardStatus()

  // 2. 启动定时器，每 5 秒检查一次
  pollTimer = window.setInterval(checkCardStatus, 5000)
})

onUnmounted(() => {
  // 3. 组件卸载时，清除定时器
  if (pollTimer) {
    console.log('停止开卡状态轮询。')
    clearInterval(pollTimer)
  }
})
</script>

<style lang="less" scoped>
/* 新增：遮罩层样式
*/
.global-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.75); /* 半透明黑色背景 */
  backdrop-filter: blur(5px); /* 毛玻璃效果 */
  z-index: 9999; /* 确保在最顶层 */

  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 20px;
}

.overlay-content {
  background-color: rgba(40, 40, 40, 0.9);
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 500px;

  .error-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 1.8rem;
    margin-bottom: 15px;
    color: #ffcdd2; /* 淡红色标题 */
  }

  p {
    font-size: 1rem;
    line-height: 1.6;
    color: #f0f0f0;
  }

  p:last-of-type {
    margin-top: 20px;
    font-size: 0.9rem;
    color: #aaa;
  }
}
</style>
