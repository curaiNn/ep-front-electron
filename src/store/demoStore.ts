import { defineStore } from 'pinia'
import { ref } from 'vue'

// 使用 setup store 风格 (推荐)
export const useDemoStore = defineStore('demo', () => {
  // state
  const count = ref(0)

  // actions
  function increment() {
    count.value++
  }

  return { count, increment }
})
