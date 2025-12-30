<template>
  <!--
    [修改]
    这个外层 div 现在是 '100vh' 高，并且隐藏了溢出。
    滚动功能将交给子路由 (Home.vue 等) 去实现。
  -->
  <div class="main-layout-content">
    <!--
      [修改]
      使用 <router-view> 和 <keep-alive>。
      - v-slot="{ Component }" 是 Vue 3 的标准用法。
      - :include="cacheList" 会动态地只缓存 store 中的组件。
    -->
    <router-view v-slot="{ Component }">
      <keep-alive :include="cacheList">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>

  <!--
    Dock 栏 (不变)
    它会浮动在 <router-view> 渲染的页面之上。
  -->
  <nav class="app-dock" :class="{ visible: isDockVisible }" @mouseenter="isDockHovered = true" @mouseleave="isDockHovered = false">
    <router-link to="/" class="dock-item" active-class="active" exact>
      <span>首页</span>
      <div class="dock-icon">🏠</div>
    </router-link>

    <router-link to="/china-single-window" class="dock-item" active-class="active">
      <span>中国国际贸易单一窗口</span>
      <!--
        [注意]
        这个图片路径 './logo.png' 是一个相对路径。
        在 Vue 组件中，你应该使用 `@/assets/logo.png` (如果图片在 src/assets)
        或者 `/logo.png` (如果图片在 public 目录)。
        我将暂时使用一个占位符。
      -->
      <img class="dock-icon" src="@/assets/imgs/logo.png" alt="中国国际贸易单一窗口" />
    </router-link>


    <router-link to="/swgdfront-jin" class="dock-item" active-class="active">
      <span>信天翁进境申报</span>
      <div class="dock-icon">信</div>
    </router-link>

    <router-link to="/baoguanxiang" class="dock-item" active-class="active">
      <span>上海单证保管箱</span>
      <div class="dock-icon">箱</div>
    </router-link>
  </nav>

  <!-- [新增] 用于触发 Dock 栏的透明热区 -->
  <div class="dock-trigger" @mouseenter="isMouseAtBottom = true" @mouseleave="isMouseAtBottom = false"></div>
</template>

<script setup lang="ts">
// [修改] 导入 Pinia Store 和 Vue Router
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useKeepAliveStore } from '@/store/keepAliveStore' // 1. 导入 Store

defineOptions({ name: 'Layout' })

// --- 2. KeepAlive 逻辑 ---
const keepAliveStore = useKeepAliveStore()
const cacheList = computed(() => keepAliveStore.cacheList) // 响应式地获取缓存列表

// --- 3. Dock 显隐逻辑 (不变) ---
const route = useRoute()
const isDockHovered = ref(false)
const isMouseAtBottom = ref(false) // [修改] 由热区触发

// 计算当前是否在首页
const isHomePage = computed(() => route.path === '/')

// 决定 Dock 是否可见的核心逻辑
const isDockVisible = computed(() => {
  if (isHomePage.value) {
    return true // 首页始终可见
  }
  // 其他页面，如果鼠标在底部热区或在 Dock 上方，则可见
  return isMouseAtBottom.value || isDockHovered.value
})
</script>

<style lang="less" scoped>
.main-layout-content {
  height: 100vh; /* 占满整个视口高度 */
  /* [修改] 布局本身不再滚动 */
  overflow-y: hidden;
  overflow-x: hidden;
  background-color: var(--background-color-page); /* 应用页面背景色 */
  position: relative; /* 确保子元素可以正确定位 */
}

/*
  Dock 栏样式 (不变)
*/
.app-dock {
  position: fixed; /* 固定在视口 */
  bottom: 10px; /* 距离底部 10px */
  left: 50%; /* 居中 */

  /* 默认状态：隐藏 */
  opacity: 0;
  transform: translate(-50%, 100px); /* 初始位置在屏幕下方 100px */
  pointer-events: none; /* 隐藏时不可交互 */
  transition: all 0.3s cubic-bezier(0.35, 0, 0.25, 1); /* 添加平滑过渡 */

  /* 可见状态 */
  &.visible {
    opacity: 1;
    transform: translateX(-50%); /* 移回原位 */
    pointer-events: auto; /* 恢复交互 */
  }

  display: flex;
  gap: 10px;
  padding: 10px;

  background: rgba(255, 255, 255, 0.3); /* 毛玻璃效果背景 */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.dock-item {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 32px; /* 图标大小 */
  color: #333;
  text-decoration: none;
  position: relative;
  transition: all 0.2s cubic-bezier(0.35, 0, 0.25, 1);

  /* 悬停提示文字 */
  span {
    position: absolute;
    bottom: 80px; /* 显示在图标上方 */
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 14px;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.2s ease;
    pointer-events: none; /* 穿透事件 */
  }

  .dock-icon {
    transition: all 0.2s ease;
    width: 100%;
    height: 100%;
    border-radius: 12px;
    display: grid;
    place-items: center;
    overflow: hidden;

    /* 确保 <img> 也能正确显示 */
    &[src] {
      object-fit: cover;
    }
  }

  /* 悬停效果 */
  &:hover {
    .dock-icon {
      transform: scale(1.4); /* 放大图标 */
    }
    span {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* 激活状态 */
  &.active {
    background: rgba(255, 255, 255, 0.5);
  }
}

/* [新增] Dock 底部触发热区 */
.dock-trigger {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 10px; /* 10px 高的触发区域 */
  z-index: 999; /* 在 Dock 之下，但在页面内容之上 */
  /* background: rgba(255, 0, 0, 0.2); */ /* 取消注释以调试热区 */
}
</style>
