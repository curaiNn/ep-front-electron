<template>
  <div class="iframe-container">
    <!--
      请将 src 替换为 "上海单一窗口" 的真实 URL。
    -->
    <iframe src="https://www.singlewindow.sh.cn/" frameborder="0" allowfullscreen></iframe>

    <!--    <div class="placeholder-content">-->
    <!--      <h1>上海单一窗口</h1>-->
    <!--      <p>内容正在建设中...</p>-->
    <!--      <p>(或者<a href="https://www.singlewindow.sh.cn/" target="_blank">点击这里</a>在新窗口中打开)</p>-->
    <!--    </div>-->
  </div>
</template>

<style scoped>
.iframe-container {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
.iframe-container iframe {
  width: 100%;
  height: 100%;
  min-height: 80vh;
}
</style>
