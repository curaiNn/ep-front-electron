import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

import Layout from '@/layout/index.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home/Home.vue')
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About/About.vue')
      },
      {
        path: '/china-single-window',
        name: 'ChinaSingleWindow',
        meta: { keepAlive: true },
        // 懒加载新页面
        component: () => import('@/views/ChinaSingleWindow/index.vue')
      },
      {
        path: '/shanghai-single-window',
        name: 'ShanghaiSingleWindow',
        meta: { keepAlive: true },
        // 懒加载新页面
        component: () => import('@/views/ShanghaiSingleWindow/index.vue')
      },
      {
        path: '/baoguanxiang',
        name: 'Baoguanxiang',
        meta: { keepAlive: true },
        // 懒加载新页面
        component: () => import('@/views/Baoguanxiang/index.vue')
      }
    ]
  }
  // 你可以在这里添加其他顶层路由，例如登录页 (它不使用 Layout)
  // {
  //   path: '/login',
  //   component: () => import('@/views/Login.vue')
  // }
]

// 4. 创建路由实例
const router = createRouter({
  // 我们在 Electron 中使用 Hash 模式 (#)
  history: createWebHashHistory(),
  routes
})

export default router
