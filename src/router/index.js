import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '账单' }
  },
  {
    path: '/detail/:id',
    name: 'Detail',
    component: () => import('../views/Detail.vue'),
    meta: { title: '记录详情' }
  },
  {
    path: '/add',
    name: 'Add',
    component: () => import('../views/Add.vue'),
    meta: { title: '添加记录' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { title: '我的' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '设置' }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('../views/Statistics.vue'),
    meta: { title: '统计图表' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 设置页面标题
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 记账` : '记账'
})

export default router
