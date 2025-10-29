import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { EpUiPlusResolver } from 'ep-ui-plus/resolver'

export default defineConfig({
  // Electron 主进程配置
  main: {
    // 插件
    plugins: [
      // 将所有 node_modules 依赖项外部化
      // 防止将依赖打包到主进程代码中
      externalizeDepsPlugin()
    ],
    // 构建配置
    build: {
      // Rollup 选项
      rollupOptions: {
        // 定义入口文件
        input: {
          index: resolve(__dirname, 'electron/main/index.ts')
        }
      },
      outDir: 'dist-electron/main'
    }
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
          index: resolve(__dirname, 'electron/preload/index.ts')
        }
      },
      outDir: 'dist-electron/preload'
    }
  },

  // Electron 渲染进程配置 (Vue 应用)
  renderer: {
    // 渲染进程的根目录
    root: '.',
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    // 插件
    plugins: [
      vue(),
      AutoImport({
        resolvers: [EpUiPlusResolver()],
        dts: 'src/auto-imports.d.ts'
      }),
      Components({
        resolvers: [EpUiPlusResolver()],
        dts: 'src/components.d.ts'
      })
    ],

    // 构建配置
    build: {
      // Rollup 选项
      rollupOptions: {
        // 定义 HTML 入口文件
        input: {
          index: resolve(__dirname, 'index.html')
        }
      },
      outDir: 'dist'
    }
  }
})
