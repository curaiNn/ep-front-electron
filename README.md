Electron + Vue 3 + Vite + TS 模板项目

这是一个基于 electron-vite 搭建的现代化 Electron 应用模板，集成了 Vue 3, TypeScript, Pinia, Axios, Day.js, Less 和 Prettier。

功能特性

现代技术栈: Vite, Vue 3, TypeScript

状态管理: Pinia

HTTP 请求: Axios

日期处理: Day.js

CSS 预处理器: Less

代码规范: Prettier

清晰的结构:

electron/: 主进程和预加载脚本

src/: 渲染进程 (Vue 应用)

安全的 API 暴露: 使用 contextBridge 和 preload.ts

强大的构建: 使用 electron-builder 构建

Windows: .exe 安装包 和 portable 免安装版

macOS: .dmg 镜像 和 .zip 压缩包

构建输出: 所有产物均在 release/ 目录下

如何开始

1. 安装依赖

npm install

2. 开发模式 (热重载)

启动应用进行开发，Vite 和 Electron 都会进行热重载。

npm run dev

3. 构建应用

3.1 仅构建 (不打包)

这将构建主进程、预加载脚本和渲染进程代码到 dist 和 dist-electron 目录。

npm run build

3.2 构建并打包 Windows 应用

这将首先执行 npm run build，然后使用 electron-builder 打包。
你会在 release/ 目录下找到 .exe 安装包和 ...-portable.exe 免安装包。

npm run build:win

3.3 构建并打包 macOS 应用

这将首先执行 npm run build，然后使用 electron-builder 打包。
你会在 release/ 目录下找到 .dmg 磁盘镜像和 .zip 压缩包。

npm run build:mac

4. 代码格式化

# 检查格式

npm run lint

# 自动格式化

npm run format
