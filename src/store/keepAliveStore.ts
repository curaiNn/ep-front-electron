import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useKeepAliveStore = defineStore('keepAlive', () => {
  // 存储需要被缓存的路由组件名称
  // 注意：这里存的是组件的 'name' 选项
  const cacheList = ref<string[]>([])

  /**
   * 添加一个路由到缓存列表
   * @param name - 路由组件的 'name'
   */
  function addCache(name: string) {
    if (name && !cacheList.value.includes(name)) {
      cacheList.value.push(name)
    }
  }

  /**
   * 从缓存列表中移除一个路由
   * @param name - 路由组件的 'name'
   */
  function removeCache(name: string) {
    const index = cacheList.value.indexOf(name)
    if (index > -1) {
      cacheList.value.splice(index, 1)
    }
  }

  return {
    cacheList,
    addCache,
    removeCache
  }
})
