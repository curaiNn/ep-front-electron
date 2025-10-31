<template>
  <div class="loading-process" v-show="ep_data.length > 0" style="min-height: 40px">
    <div class="loading-process-item" v-for="item in ep_data" :key="item.id">
      <div class="loading-process-item__name" :title="item.message">
        {{ item.message }}
      </div>

      <div class="loading-process-item__size">{{ formatFileSize(item.lastLoaded) }}/{{ formatFileSize(item.totalSize) }}，</div>
      <div class="loading-process-item__speed">{{ formatSpeed(item.speed) }}，</div>
      <div class="loading-process-item__remaining">
        {{ item.remainingDisplay }}
      </div>

      <div style="margin-left: auto" class="flex-center">
        <div class="loading-process-item__loader loader-bar">
          <div class="loader-bar-inner" :style="{ width: item.percent + '%', transition: 'width 0.5s ease' }"></div>
        </div>

        <div class="loading-process-item__percent">
          {{ item.percent === 100 ? '验证中' : item.percent }}
        </div>

        <div class="loading-process-item__close">
          <ep-button @click="removeProcess(item.id)" style="cursor: pointer" type="text" :icon="Close"></ep-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEmitt } from '@/hooks/useEmitt'
// FIX: Import the icon component
import { Close } from '@ep-ui-plus/ep-icons'

// The rest of your script remains exactly the same...
class NotificationVO {
  id = ''
  message = ''
  speed = 0
  remainingDisplay = '计算中'
  percent = 0
  lastLoaded = 0
  totalSize = 0
  lastUpdateTime = 0
}

const ep_data = ref<NotificationVO[]>([])

useEmitt({
  name: 'add-process',
  callback: (payload: any) => {
    const { id, fileName } = payload
    let notificationVO = new NotificationVO()
    notificationVO.id = id
    notificationVO.message = fileName
    notificationVO.lastLoaded = 0
    notificationVO.lastUpdateTime = Date.now()
    ep_data.value.push(notificationVO)
  }
})

useEmitt({
  name: 'update-process',
  callback: (payload: any) => {
    const { id, event } = payload
    let findOne = ep_data.value.find(e => e.id === id)
    if (!findOne) return
    if (!event.lengthComputable) {
      console.error('Download Error: Server is not sending Content-Length. Progress cannot be computed.')
      findOne.remainingDisplay = '无法计算进度'
      return
    }
    const now = Date.now()
    if (now - findOne.lastUpdateTime < 500) {
      return
    }
    const elapsedTimeSinceLastUpdate = (now - findOne.lastUpdateTime) / 1000
    if (elapsedTimeSinceLastUpdate === 0) return
    const currentLoaded = event.loaded
    const totalSize = event.total
    const speed = (currentLoaded - findOne.lastLoaded) / elapsedTimeSinceLastUpdate
    const remainingSize = totalSize - currentLoaded
    let remainingTimeInSeconds = speed > 0 ? remainingSize / speed : Infinity
    let remainingTimeDisplay = formatRemainingTime(remainingTimeInSeconds)
    const percent = Math.round((currentLoaded / totalSize) * 100)
    findOne.lastUpdateTime = now
    findOne.lastLoaded = currentLoaded
    findOne.speed = speed
    findOne.remainingDisplay = remainingTimeDisplay
    findOne.percent = percent
    findOne.totalSize = totalSize
  }
})

useEmitt({
  name: 'remove-process',
  callback: (payload: any) => {
    removeProcess(payload.id)
  }
})

function removeProcess(id: string) {
  const index = ep_data.value.findIndex(e => e.id === id)
  if (index > -1) {
    ep_data.value.splice(index, 1)
  }
}

function formatRemainingTime(remainingTimeInSeconds: number) {
  if (remainingTimeInSeconds === Infinity) return '计算中'
  if (remainingTimeInSeconds > 3600) {
    const hours = Math.ceil(remainingTimeInSeconds / 3600)
    return `约 ${hours} 小时`
  } else if (remainingTimeInSeconds > 60) {
    const minutes = Math.ceil(remainingTimeInSeconds / 60)
    return `约 ${minutes} 分钟`
  } else {
    return `约 ${Math.round(remainingTimeInSeconds)} 秒`
  }
}

function formatFileSize(bytes: number, size?: string) {
  if (bytes === 0) {
    return size ? '0 ' + size : '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = size ? sizes.indexOf(size) : Math.floor(Math.log(bytes) / Math.log(k))
  if (i === -1) throw new Error('Invalid size unit')
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

function formatSpeed(bytesPerSecond: number) {
  if (bytesPerSecond === 0) return '0 B/s'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s']
  let i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024))
  if (i < 0) i = 0
  let result = (bytesPerSecond / Math.pow(1024, i)).toFixed(2)
  if (result.endsWith('.00')) {
    result = result.split('.00')[0]
  } else if (result.endsWith('0')) {
    result = result.slice(0, -1)
  }
  return `${result} ${units[i]}`
}
</script>

<style lang="less" scoped>
.loading-process {
  z-index: 9999;
  width: 100%;
  padding-right: 12px;
  position: fixed;
  left: 0px;
  bottom: 0px;
  border-radius: 2px;
  background: var(--background-color-modal);
  box-shadow: 0 -0.5px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  transition: width 0.2s ease;

  .flex-center {
    display: flex;
    align-items: center;
  }

  .loading-process-item {
    display: flex;
    align-items: center;
    padding: 2px 6px 2px 12px;
    margin-top: 2px;

    .loading-process-item__name {
      color: var(--font-color-primary);
      font-size: 13px;
      margin-right: 12px;
      max-width: 36vw;
      width: 30vw;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .loading-process-item__size {
      color: var(--font-color-secondary);
      font-size: 12px;
      margin: 0px 2px;
    }

    .loading-process-item__speed {
      color: var(--font-color-secondary);
      font-size: 12px;
      margin: 0px 2px;
    }

    .loading-process-item__remaining {
      color: var(--font-color-hint);
      font-size: 12px;
    }

    .loading-process-item__percent {
      width: 45px;
      text-align: center;
      font-size: 12px;
      background: linear-gradient(45deg, var(--font-color-primary), var(--font-color-primary-active), var(--font-color-primary));
      background-size: 200% 200%;
      -webkit-background-clip: text;
      color: transparent;
      animation: flow 5s linear infinite;
    }

    @keyframes flow {
      0% {
        background-position: 200% 0%;
      }
      100% {
        background-position: -200% 0%;
      }
    }
  }
}

@media screen and (max-width: 1000px) {
  .loading-process {
    .loading-process-item__name {
      width: 52vw !important;
      max-width: 60vw !important;
    }
    .loading-process-item__size {
      display: none;
    }
    .loading-process-item__speed {
      display: none;
    }
    .loading-process-item__loader {
      width: 100px !important;
    }
    .loading-process-item__percent {
      display: none;
    }
  }
}
</style>
<style lang="less" scoped>
.loader-bar {
  width: 180px;
  background: rgba(0, 0, 0, 0.2);
  height: 6px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.loader-bar-inner {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
  background: var(--background-color-btn-primary-active);
  animation: lightEffect 2s infinite linear;
  animation-fill-mode: forwards;
}

@keyframes lightEffect {
  0%,
  20%,
  40%,
  60%,
  80%,
  100% {
    background: repeating-linear-gradient(45deg, var(--stop-color-hosts-service-logo-start) 0 30px, var(--stop-color-hosts-service-logo-end) 0 40px)
      right/200% 100%;
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    background: repeating-linear-gradient(
        45deg,
        var(--stop-color-hosts-service-logo-start) 0 30px,
        var(--stop-color-hosts-service-logo-end) 0 40px,
        rgba(255, 255, 255, 0.3) 0 40px
      )
      right/200% 100%;
  }
}
</style>
