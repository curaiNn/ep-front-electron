<template>
  <div class="container">
    <!-- 1. 标题和副标题 (现在会居中) -->
    <h1>欢迎使用单一窗口桌面端</h1>
    <!--    <p>请选择一项服务</p>-->

    <!--    &lt;!&ndash;-->
    <!--      2. [修改] 应用网格布局 (现在会居中)-->
    <!--    &ndash;&gt;-->
    <!--    <div class="dock-grid">-->
    <!--      &lt;!&ndash; 应用 1: 首页 (使用 'dock-item' 'dock-icon' 'dock-name') &ndash;&gt;-->
    <!--      <router-link to="/" class="dock-item" active-class="active" exact>-->
    <!--        <div class="dock-icon home-icon">🏠</div>-->
    <!--        <span class="dock-name">首页</span>-->
    <!--      </router-link>-->

    <!--      &lt;!&ndash; 应用 2: 中国国际贸易单一窗口 (使用 'dock-item' 'dock-icon' 'dock-name') &ndash;&gt;-->
    <!--      <router-link to="/china-single-window" class="dock-item" active-class="active">-->
    <!--        &lt;!&ndash; [修改] 使用了带占位符的 <img> 标签 &ndash;&gt;-->
    <!--        <img class="dock-icon" src="@/assets/imgs/logo.png" alt="中国国际贸易单一窗口" />-->
    <!--        <span class="dock-name">中国国际贸易...</span>-->
    <!--      </router-link>-->

    <!--      &lt;!&ndash; 应用 3: 上海单证保管箱 (使用 'dock-item' 'dock-icon' 'dock-name') &ndash;&gt;-->
    <!--      <router-link to="/baoguanxiang" class="dock-item" active-class="active">-->
    <!--        <div class="dock-icon box-icon">箱</div>-->
    <!--        <span class="dock-name">上海单证保管箱</span>-->
    <!--      </router-link>-->
    <!--    </div>-->
  </div>
</template>

<script setup lang="ts">
// 脚本部分不变
import { ref } from 'vue'

defineOptions({ name: 'Home' })
</script>

<style lang="less" scoped>
/* 3. [修改] .container 样式
*/
.container {
  padding: 2rem;
  font-family: 'Inter', sans-serif;
  text-align: center; /* [修改] 默认为居中 */
  height: 100%;
  box-sizing: border-box;
}

h1 {
  color: var(--font-color-primary, #333);
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-align: center; /* [修改] 明确居中 */
}

p {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
  text-align: center; /* [修改] 明确居中 */
}

/*
  4. [修改] 应用网格 (App Grid) 样式
*/
.dock-grid {
  display: grid;
  /* 创建网格，每列最小 100px，最大 1fr (自动填充)
    gap 是图标间的距离
  */
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  max-width: 800px; /* 限制网格的最大宽度 */
  padding-top: 20px;
  margin-left: auto; /* [修改] 居中网格 */
  margin-right: auto; /* [修改] 居中网格 */
}

.dock-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #333;
  padding: 10px;
  border-radius: 12px;
  transition: all 0.2s ease;

  /* 激活状态 */
  &.active {
    .dock-icon {
      /* 给激活的图标一个轻微的描边 */
      box-shadow: 0 0 0 2px var(--font-color-primary, #3b82f6);
    }
  }

  /* 悬停效果 */
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.dock-icon {
  width: 70px;
  height: 70px;
  border-radius: 16px; /* 更圆的 iOS 风格 */
  display: grid;
  place-items: center;
  font-size: 36px; /* 图标大小 */
  margin-bottom: 8px;
  transition: all 0.2s ease;
  overflow: hidden; /* [新增] 确保 <img> 圆角生效 */

  /* [新增] 为 <img> 标签设置样式 */
  &.dock-icon[src] {
    width: 100%;
    height: 100%;
    object-fit: cover; /* 覆盖图像 */
    font-size: 0; /* 隐藏 <img> 的 alt 文本 */
  }

  /* [新增] 为每个图标添加不同的背景色 */
  &.home-icon {
    background-color: #f0f0f0;
  }
  /*
    img 标签会覆盖背景色，
    但 placehold.co 图片自带背景色，所以效果一致
  */
  &.box-icon {
    background-color: #ffe0e0;
    color: #ff3b30;
  }
}

.dock-name {
  font-size: 14px;
  text-align: center;
  /* [新增] 处理长文本 */
  width: 100px; /* 限制宽度 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
