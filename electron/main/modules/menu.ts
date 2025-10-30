import { app, Menu, BrowserWindow, MenuItemConstructorOptions, shell } from 'electron'

import { createFindView, closeFindView, findViewMap } from '../view/findView'

/**
 * 检查是否为 macOS
 */
const isMac = process.platform === 'darwin'

/**
 * 创建菜单模板
 */
const createMenuTemplate = (): MenuItemConstructorOptions[] => {
  // 菜单模板数组
  const template: MenuItemConstructorOptions[] = [
    // { role: 'appMenu' } ... (保持不变)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: `关于 ${app.name}` },
              { type: 'separator' },
              { role: 'services', label: '服务' },
              { type: 'separator' },
              { role: 'hide', label: '隐藏' },
              { role: 'hideOthers', label: '隐藏其他' },
              { role: 'unhide', label: '全部显示' },
              { type: 'separator' },
              { role: 'quit', label: '退出' }
            ]
          } as MenuItemConstructorOptions
        ]
      : []),

    // { role: 'fileMenu' } 文件菜单
    {
      label: '文件',
      submenu: [
        isMac ? { role: 'close', label: '关闭窗口' } : { role: 'quit', label: '退出' },

        {
          label: '查找',
          accelerator: isMac ? 'Cmd+F' : 'Ctrl+F',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (!focusedWindow) {
              return
            }

            if (findViewMap.has(focusedWindow)) {
              closeFindView(focusedWindow)
            } else {
              await createFindView(focusedWindow)
            }
          }
        }
      ]
    } as MenuItemConstructorOptions,

    // { role: 'editMenu' } ... (保持不变)
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle', label: '粘贴并匹配样式' },
              { role: 'delete', label: '删除' },
              { role: 'selectAll', label: '全选' },
              { type: 'separator' },
              {
                label: '语音',
                submenu: [
                  { role: 'startSpeaking', label: '开始朗读' },
                  { role: 'stopSpeaking', label: '停止朗读' }
                ]
              } as MenuItemConstructorOptions
            ]
          : [{ role: 'delete', label: '删除' }, { type: 'separator' }, { role: 'selectAll', label: '全选' }])
      ]
    } as MenuItemConstructorOptions,

    // { role: 'viewMenu' } ... (保持不变)
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },

    // { role: 'windowMenu' } ... (保持不变)
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        ...(isMac
          ? [{ type: 'separator' }, { role: 'front', label: '全部置于顶层' }, { type: 'separator' }, { role: 'window', label: '窗口' }]
          : [{ role: 'close', label: '关闭' }])
      ]
    } as MenuItemConstructorOptions,

    // { role: 'help' } ... (保持不变)
    {
      label: '帮助',
      submenu: [
        {
          label: '访问官网',
          click: async (): Promise<void> => {
            await shell.openExternal('https://www.electronjs.org')
          }
        }
      ]
    }
  ]

  return template
}

/**
 * 创建并设置应用菜单
 */
export const createApplicationMenu = (): void => {
  const template = createMenuTemplate()
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
