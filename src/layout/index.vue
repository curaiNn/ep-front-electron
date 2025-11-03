<template>
  <div class="main-layout-content">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Layout' })
</script>

<style lang="less" scoped>
@import '@/assets/mixins.less';
.main-layout-content {
  .beautyScrollbar();
  /* 1. 关键：创建滚动容器 */
  height: 100vh; /* 占满整个视口高度 */
  overflow-y: auto; /* 只在 Y 轴上需要时滚动 */
  overflow-x: hidden; /* 隐藏 X 轴滚动 */
}
</style>
