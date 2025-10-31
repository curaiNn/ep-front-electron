import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { EpUiPlusResolver } from 'ep-ui-plus/resolver'
import { loadEnv } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
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
      // 明确指定 env 目录 (根目录)
      envDir: resolve(__dirname),
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
          dts: 'types/auto-imports.d.ts'
        }),
        Components({
          resolvers: [EpUiPlusResolver()],
          dirs: ['src/components'],
          dts: 'types/components.d.ts'
        }),
        // 3. 在这里配置 vitePluginHtml
        createHtmlPlugin({
          inject: {
            data: {
              VITE_APP_TITLE: env.VITE_APP_TITLE,
              NODE_ENV: mode
            }
          }
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
  }
})
