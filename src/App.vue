<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { useInteraction } from './composables/useInteraction'
import { usePreferencesStore } from './stores/preferences'
import { useRecordsStore } from './stores/records'

const router = useRouter()
const route = useRoute()
const prefs = usePreferencesStore()

// 欢迎弹窗
const showWelcome = ref(false)

// 一次性清理旧数据（Phase 16：移除种子数据后，清空旧 localStorage 记录）
function cleanupOldRecords() {
  if (!prefs.dataMigratedV4) {
    useRecordsStore().clearAllRecords()
    prefs.setDataMigratedV4(true)
  }
}

onMounted(() => {
  cleanupOldRecords()
  if (!prefs.firstVisitCompleted) {
    showWelcome.value = true
  }
})

function onWelcomeDismiss() {
  prefs.setFirstVisitCompleted(true)
  showWelcome.value = false
}

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
    <!-- 首次访问欢迎弹窗 -->
    <van-dialog
      v-model:show="showWelcome"
      title="欢迎使用记账"
      show-cancel-button
      cancel-button-text="稍后再说"
      confirm-button-text="开始使用"
      confirm-button-color="#5B9BD5"
      :close-on-click-overlay="false"
      @confirm="onWelcomeDismiss"
      @cancel="onWelcomeDismiss"
    >
      <div class="welcome-content">
        <p class="welcome-intro">轻松记录每一笔收支，掌控个人财务。</p>
        <div class="welcome-features">
          <div class="welcome-feature">
            <van-icon name="add-o" size="18" color="#5B9BD5" />
            <span>快速记账，支持多种分类</span>
          </div>
          <div class="welcome-feature">
            <van-icon name="chart-trending-o" size="18" color="#5B9BD5" />
            <span>图表统计，一目了然</span>
          </div>
          <div class="welcome-feature">
            <van-icon name="search" size="18" color="#5B9BD5" />
            <span>搜索筛选，快速查找</span>
          </div>
          <div class="welcome-feature">
            <van-icon name="description" size="18" color="#5B9BD5" />
            <span>支持 CSV 导入账单</span>
          </div>
          <div class="welcome-feature">
            <van-icon name="phone-o" size="18" color="#5B9BD5" />
            <span>摇一摇快速记账</span>
          </div>
        </div>
        <p class="welcome-tip">点击下方 + 按钮开始记第一笔账吧</p>
      </div>
    </van-dialog>

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

/* 欢迎弹窗 */
.welcome-content {
  padding: 6px 16px 4px;
}

.welcome-intro {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin: 0 0 16px;
  line-height: 1.6;
}

.welcome-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.welcome-feature {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: #333;
}

.welcome-tip {
  font-size: 12px;
  color: #8C8C8C;
  text-align: center;
  margin: 0;
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
