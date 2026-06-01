import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()]
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '记账',
        short_name: '记账',
        description: '个人支付记录管理',
        theme_color: '#5B9BD5',
        background_color: '#F5F7FA',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: '添加支出',
            short_name: '支出',
            description: '快速添加一笔支出',
            url: '/#/add?type=expense',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: '添加收入',
            short_name: '收入',
            description: '快速添加一笔收入',
            url: '/#/add?type=income',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: '查看统计',
            short_name: '统计',
            description: '查看收支统计图表',
            url: '/#/statistics',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  base: '/jizhang/',
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
