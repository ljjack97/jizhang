<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useInteraction } from './composables/useInteraction'

const router = useRouter()
const route = useRoute()

// 全局摇一摇监听
useInteraction()

// 需要底部导航栏的页面
const showTabbar = computed(() => {
  const tabRoutes = ['/', '/profile']
  return tabRoutes.includes(route.path)
})

// 当前激活的标签
const activeTab = computed(() => {
  if (route.path === '/profile') return 'profile'
  return 'home'
})

function onTabChange(name) {
  if (name === 'home') router.push('/')
  if (name === 'profile') router.push('/profile')
}
</script>

<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <van-tabbar
      v-if="showTabbar"
      v-model="activeTab"
      :fixed="true"
      :border="true"
      :safe-area-inset-bottom="true"
      active-color="#5B9BD5"
      inactive-color="#999999"
      @change="onTabChange"
    >
      <van-tabbar-item name="home" icon="records-o">
        账单
      </van-tabbar-item>
      <van-tabbar-item name="profile" icon="contact">
        我的
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background: var(--bg-page);
  padding-bottom: 50px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
