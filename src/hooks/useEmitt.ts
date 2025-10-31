import mitt from 'mitt'
import { onBeforeUnmount } from 'vue' // 确保导入

/**
 * 通用回调函数类型
 */
type GenericCallback = (...args: any[]) => void

interface Option {
  name: string // 事件名称
  callback: GenericCallback // 回调
}

// 创建一个 emitter 实例 (单例)
// 它现在可以处理任何 string: any[] 类型的事件
const emitter = mitt()

/**
 * Vue Composable - 用于全局事件
 * @param option (可选) 传入则自动注册监听和销毁
 */
export const useEmitt = (option?: Option) => {
  // 如果传入了 'option'，则注册监听器
  if (option) {
    emitter.on(option.name, option.callback)

    // 在组件卸载前自动移除监听器
    onBeforeUnmount(() => {
      // (优化) 传入 callback 确保只移除这一个监听器
      emitter.off(option.name, option.callback)
    })
  }

  // 始终返回 emitter 实例，以便其他组件可以调用 .emit
  return {
    emitter
  }
}
