import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { updater } from '@electron-toolkit/vite-plugin-updater'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Electron 主进程配置
  main: {
    // 插件
    plugins: [
      // 将所有 node_modules 依赖项外部化
      // 防止将依赖打包到主进程代码中
      externalizeDepsPlugin(),
    ],
    // 构建配置
    build: {
      // Rollup 选项
      rollupOptions: {
        // 定义入口文件
        input: {
          index: resolve(__dirname, 'electron/main/index.ts'),
        },
      },
    },
  },

  // Electron 预加载脚本配置
  preload: {
    // 插件
    plugins: [externalizeDepsPlugin()],
    // 构建配置
    build: {
      // Rollup 选项
      rollupOptions: {
        // 定义入口文件
        input: {
          index: resolve(__dirname, 'electron/preload/index.ts'),
        },
      },
    },
  },

  // Electron 渲染进程配置 (Vue 应用)
  renderer: {
    // 渲染进程的根目录
    root: '.',
    // 插件
    plugins: [
      vue(),
      // 启用 Electron 更新器插件
      updater({
        // 定义发布服务器的 URL
        // 你需要将其替换为你的实际发布服务器地址
        // 例如 GitHub Releases, S3, 或你自己的服务器
        // publicPath: 'https://your-update-server.com/releases'
      }),
    ],
    // 构建配置
    build: {
      // Rollup 选项
      rollupOptions: {
        // 定义 HTML 入口文件
        input: {
          index: resolve(__dirname, 'index.html'),
        },
      },
    },
  },
})

