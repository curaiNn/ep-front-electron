<template>
  <div class="main-layout-content">
    <router-view></router-view>
  </div>

  <!--
    [修复] 新增一个透明的 "触发条"
    它覆盖在 iframe 底部边缘，用来捕获鼠标进入事件
  -->
  <div class="dock-trigger" @mouseenter="isMouseAtBottom = true" @mouseleave="isMouseAtBottom = false"></div>

  <!--
    程序坞 (Dock)
    - @mouseenter 和 @mouseleave 保持不变
    - :class 绑定保持不变
  -->
  <nav class="app-dock" :class="{ visible: isDockVisible }" @mouseenter="isDockHovered = true" @mouseleave="isDockHovered = false">
    <router-link to="/" class="dock-item" active-class="active" exact>
      <span>首页</span>
      <div class="dock-icon">🏠</div>
    </router-link>

    <router-link to="/china-single-window" class="dock-item" active-class="active">
      <span>中国国际贸易单一窗口</span>
      <img class="dock-icon" src="./logo.png" alt="" />
    </router-link>

    <router-link to="/baoguanxiang" class="dock-item" active-class="active">
      <span>上海单一窗口</span>
      <div class="dock-icon">箱</div>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'Layout' })

// --- [修改] Dock 显隐逻辑 ---

const route = useRoute()
const isDockHovered = ref(false) // 鼠标是否在 Dock 上
const isMouseAtBottom = ref(false) // 鼠标是否在底部的 "dock-trigger" 上

// 1. 计算当前是否在首页
const isHomePage = computed(() => route.path === '/')

// 2. 决定 Dock 是否可见的核心逻辑
const isDockVisible = computed(() => {
  // 如果在首页，则始终可见
  if (isHomePage.value) {
    return true
  }
  // 在其他页面，如果鼠标在底部触发条上，或在 Dock 本身上，则可见
  return isMouseAtBottom.value || isDockHovered.value
})

// 3. [移除] 不再需要 'handleMouseMove' 或 'handleMouseLeave/Enter'
// 4. [移除] 不再需要 onMounted/onUnmounted

// --- Dock 逻辑结束 ---
</script>

<style lang="less" scoped>
.main-layout-content {
  height: 100vh;
  overflow-y: hidden;
  overflow-x: hidden;
  background-color: var(--background-color-page);
  /* [新增] 确保 layout 是一个定位上下文，以便 trigger 生效 */
  position: relative;
}

/* [新增] 底部触发条的样式 */
.dock-trigger {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30px; /* 触发区域的高度，可以调小，比如 5px */
  /* background: rgba(255, 0, 0, 0.2); // 调试时取消注释来看清它的位置 */
  z-index: 999; /* 确保它在 iframe 之上 */
}

/*
  Dock 栏样式
*/
.app-dock {
  position: fixed;
  bottom: 10px;
  left: 50%;

  opacity: 0;
  transform: translate(-50%, 100px);
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.35, 0, 0.25, 1);

  /* [修改]
    将 z-index 提高，确保它在 trigger 之上，
    这样 "isDockHovered" 才能正常工作
  */
  z-index: 1000;

  &.visible {
    opacity: 1;
    transform: translateX(-50%);
    pointer-events: auto;
  }

  display: flex;
  gap: 10px;
  padding: 10px;

  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.dock-item {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 32px;
  color: #333;
  text-decoration: none;
  position: relative;
  transition: all 0.2s cubic-bezier(0.35, 0, 0.25, 1);

  span {
    position: absolute;
    bottom: 80px;
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.2s ease;
    pointer-events: none;
  }

  .dock-icon {
    transition: all 0.2s ease;
  }

  &:hover {
    .dock-icon {
      transform: scale(1.4);
    }
    span {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &.active {
    background: rgba(255, 255, 255, 0.5);
  }
}
</style>
