<template>
  <div class="page-container">
    <!-- 顶部导航 -->
    <van-nav-bar title="账单" fixed placeholder>
      <template #right>
        <span class="stats-btn" role="button" tabindex="0" @click="showStats = true" @keydown.enter.prevent="showStats = true" @keydown.space.prevent="showStats = true">
          <van-icon name="chart-trending-o" size="18" />
          <span class="stats-btn-text">统计</span>
        </span>
        <van-icon v-if="prefs.addButtonStyle === 'topbar'" name="plus" size="22" aria-label="添加记录" role="button" tabindex="0" @click="goAdd" @keydown.enter.prevent="goAdd" />
      </template>
    </van-nav-bar>

    <!-- 顶部搜索栏 -->
    <div class="search-wrapper">
      <van-search
        v-model="searchKeyword"
        shape="round"
        placeholder="搜索金额、日期、订单号、商家、备注"
        clearable
        @update:model-value="onSearchChange"
      />
    </div>

    <!-- 日期筛选栏（搜索激活时显示） -->
    <div class="date-filter" v-if="showDateFilter">
      <van-cell
        :title="dateRangeLabel"
        is-link
        @click="showDatePicker = true"
      />
      <span v-if="dateRange.length === 2" class="date-clear" @click="clearDateFilter">
        清除
      </span>
    </div>

    <!-- 分类筛选栏 -->
    <div class="category-filter">
      <div class="category-filter-scroll">
        <span
          :class="['filter-chip', { active: activeCategory === '' }]"
          @click="activeCategory = ''"
        >
          全部
        </span>
        <span
          v-for="cat in filterCategories"
          :key="cat.key"
          :class="['filter-chip', { active: activeCategory === cat.key }]"
          @click="activeCategory = activeCategory === cat.key ? '' : cat.key"
        >
          <van-icon :name="cat.icon" size="14" />
          <span>{{ cat.label }}</span>
        </span>
      </div>
    </div>

    <!-- 记录列表 -->
    <van-pull-refresh
      v-model="refreshing"
      @refresh="onRefresh"
      v-if="filteredRecords.length > 0"
    >
      <div class="record-list">
        <van-swipe-cell v-for="record in filteredRecords" :key="record.id">
          <RecordCard
            :record="record"
            @click="goDetail"
          />
          <template #right>
            <van-button
              square
              type="danger"
              text="删除"
              class="swipe-delete-btn"
              @click="onSwipeDelete(record)"
            />
          </template>
        </van-swipe-cell>
      </div>
      <p class="list-end">— 已加载全部记录 —</p>
    </van-pull-refresh>

    <!-- 空状态 -->
    <EmptyState v-else :message="emptyMessage" />

    <!-- 悬浮添加按钮 FAB（偏好设置） -->
    <div class="fab-wrapper" v-if="prefs.addButtonStyle === 'fab'">
      <van-button
        type="primary"
        round
        icon="plus"
        size="large"
        class="fab-button"
        @click="goAdd"
      />
    </div>

    <!-- 日期选择器弹窗 -->
    <van-calendar
      v-model:show="showDatePicker"
      type="range"
      :show-confirm="true"
      @confirm="onDateConfirm"
      title="选择日期范围"
      confirm-text="确定"
      confirm-disabled-text="请选择日期范围"
    />

    <!-- 统计弹窗 -->
    <van-popup
      v-model:show="showStats"
      position="bottom"
      round
      :style="{ height: '78%' }"
    >
      <div class="stats-popup">
        <div class="stats-header">
          <span class="stats-title">收支统计</span>
          <van-icon name="cross" size="18" aria-label="关闭统计" role="button" tabindex="0" @click="showStats = false" @keydown.enter.prevent="showStats = false" />
        </div>

        <!-- 周期切换 -->
        <div class="stats-tabs">
          <span
            v-for="tab in periodTabs"
            :key="tab.key"
            :class="['stats-tab', { active: activePeriod === tab.key }]"
            @click="switchPeriod(tab.key)"
          >
            {{ tab.label }}
          </span>
        </div>

        <!-- 统计内容 -->
        <div class="stats-body">
          <!-- 总额 -->
          <div class="stats-total-card">
            <span class="stats-total-label">总额</span>
            <span class="stats-total-amount">¥ {{ periodTotal.toFixed(2) }}</span>
            <div class="stats-total-sub">
              <span class="stats-total-income">收入 +¥{{ periodIncome.toFixed(2) }}</span>
              <span class="stats-total-sep">|</span>
              <span class="stats-total-expense">支出 -¥{{ periodExpense.toFixed(2) }}</span>
            </div>
            <div class="stats-total-net" :class="periodNet >= 0 ? 'net-positive' : 'net-negative'">
              {{ activePeriodLabel }}结余：{{ periodNet >= 0 ? '+' : '' }}¥{{ periodNet.toFixed(2) }}
            </div>
          </div>

          <!-- 收支明细表 -->
          <div class="stats-detail">
            <p class="stats-detail-title">{{ activePeriodLabel }}收支明细</p>
            <div class="stats-detail-table" v-if="periodRecords.length > 0">
              <div
                v-for="r in periodRecords"
                :key="r.id"
                class="stats-detail-row"
              >
                <div class="detail-left">
                  <span :class="['detail-tag', r.type === 'income' ? 'tag-income' : 'tag-expense']">
                    {{ r.type === 'income' ? '收' : '支' }}
                  </span>
                  <div class="detail-info">
                    <span class="detail-merchant">{{ r.merchant || categoryMap[r.category] || '未知' }}</span>
                    <span class="detail-time">{{ formatDetailTime(r.paymentTime) }}</span>
                  </div>
                </div>
                <span :class="['detail-amount', r.type === 'income' ? 'income-color' : 'expense-color']">
                  {{ r.type === 'income' ? '+' : '-' }}¥{{ r.amount.toFixed(2) }}
                </span>
              </div>
            </div>
            <div class="stats-detail-empty" v-else>
              <span>暂无记录</span>
            </div>
          </div>
        </div>

        <!-- 跳转详细统计 -->
        <div class="stats-link" @click="goStatistics">
          <span>查看详细图表</span>
          <van-icon name="arrow" />
        </div>
      </div>
    </van-popup>

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showSwipeDelete"
      title="确认删除"
      message="删除后无法恢复，确定要删除此记录吗？"
      show-cancel-button
      confirm-button-text="删除"
      confirm-button-color="#FF4D4F"
      @confirm="doSwipeDelete"
    />

    <!-- 剪贴板自动记账弹窗 -->
    <AutoAddPopup
      :show="showAutoAdd"
      :data="clipboardData"
      @close="onAutoAddClose"
      @done="onAutoAddDone"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordsStore } from '../stores/records'
import { usePreferencesStore } from '../stores/preferences'
import { useClipboardStore } from '../stores/clipboard'

import { readClipboard, parsePaymentText } from '../utils/clipboard'
import { useInteraction } from '../composables/useInteraction'
import RecordCard from '../components/RecordCard.vue'
import EmptyState from '../components/EmptyState.vue'
import AutoAddPopup from '../components/AutoAddPopup.vue'
import { showToast } from 'vant'

const router = useRouter()
const store = useRecordsStore()
const prefs = usePreferencesStore()
const { feedbackDelete, feedbackTap } = useInteraction()

// ===== 统计弹窗 =====
const showStats = ref(false)

// ===== 搜索 =====
const searchKeyword = ref('')
const showDateFilter = ref(false)
const dateRange = ref([])
const showDatePicker = ref(false)

// ===== 分类筛选 =====
const activeCategory = ref('')
const filterCategories = [
  { key: 'food',      label: '餐饮', icon: 'food-o' },
  { key: 'transport', label: '交通', icon: 'logistics' },
  { key: 'shopping',  label: '购物', icon: 'shopping-cart-o' },
  { key: 'hotel',     label: '住宿', icon: 'hotel-o' },
  { key: 'entertain', label: '娱乐', icon: 'music-o' },
  { key: 'transfer',  label: '转账', icon: 'exchange' },
  { key: 'redpacket', label: '红包', icon: 'gift-o' }
]

const dateRangeLabel = computed(() => {
  if (dateRange.value.length === 2) {
    return `${dateRange.value[0]} 至 ${dateRange.value[1]}`
  }
  return '选择日期范围筛选'
})

function onSearchChange(val) {
  showDateFilter.value = !!val
}

function onDateConfirm(values) {
  const [start, end] = values
  dateRange.value = [
    `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
    `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  ]
  showDatePicker.value = false
}

function clearDateFilter() {
  dateRange.value = []
}

// ===== 统计周期 =====
const activePeriod = ref('month')

const periodTabs = [
  { key: 'day', label: '日' },
  { key: 'week', label: '周' },
  { key: 'month', label: '月' },
  { key: 'year', label: '年' }
]

const periodLabelMap = { day: '今日', week: '本周', month: '本月', year: '今年' }
const activePeriodLabel = computed(() => periodLabelMap[activePeriod.value])

function getPeriodRange(period) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'week': {
      const day = now.getDay()
      const mondayOffset = day === 0 ? -6 : 1 - day
      start.setDate(now.getDate() + mondayOffset)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(now.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      break
  }
  return { start, end }
}

function switchPeriod(key) {
  activePeriod.value = key
}

const periodRecords = computed(() => {
  const { start, end } = getPeriodRange(activePeriod.value)
  return store.sortedRecords.filter(r => {
    const t = new Date(r.paymentTime).getTime()
    return t >= start.getTime() && t <= end.getTime()
  })
})

const periodIncome = computed(() => {
  return periodRecords.value
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)
})

const periodExpense = computed(() => {
  return periodRecords.value
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)
})

const periodNet = computed(() => {
  return periodIncome.value - periodExpense.value
})

const periodTotal = computed(() => {
  return periodRecords.value.reduce((sum, r) => sum + r.amount, 0)
})

// ===== 记录过滤 =====
const filteredRecords = computed(() => {
  let result = [...store.sortedRecords]

  // 分类筛选
  if (activeCategory.value) {
    result = result.filter(r => r.category === activeCategory.value)
  }

  // 关键词搜索（金额、日期、订单号、商家、备注）
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(r => {
      // 支付时间格式化后匹配
      const timeStr = formatSearchTime(r.paymentTime)
      return r.orderNumber.toLowerCase().includes(kw) ||
        (r.description && r.description.toLowerCase().includes(kw)) ||
        String(r.amount).includes(kw) ||
        timeStr.includes(kw) ||
        (r.merchant && r.merchant.toLowerCase().includes(kw))
    })
  }

  // 日期范围筛选
  if (dateRange.value.length === 2) {
    const startTime = new Date(dateRange.value[0]).getTime()
    const endTime = new Date(dateRange.value[1] + 'T23:59:59').getTime()
    result = result.filter(r => {
      const t = new Date(r.paymentTime).getTime()
      return t >= startTime && t <= endTime
    })
  }

  return result
})

function formatSearchTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDetailTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}/${day} ${h}:${min}`
}

const categoryMap = {
  food: '餐饮', transport: '交通', shopping: '购物', hotel: '住宿',
  entertain: '娱乐', transfer: '转账', redpacket: '红包', other: '其他'
}

const emptyMessage = computed(() => {
  if (searchKeyword.value || dateRange.value.length === 2) return '没有匹配的记录'
  return '还没有支付记录'
})

// ===== 刷新 =====
const refreshing = ref(false)

function onRefresh() {
  setTimeout(() => {
    refreshing.value = false
    showToast({ message: '已刷新', duration: 1000 })
  }, 500)
}

// ===== 左滑删除 =====
const showSwipeDelete = ref(false)
const deletingRecord = ref(null)

function onSwipeDelete(record) {
  deletingRecord.value = record
  showSwipeDelete.value = true
}

function doSwipeDelete() {
  if (deletingRecord.value) {
    store.deleteRecord(deletingRecord.value.id)
    feedbackDelete()
    showToast({ message: '已删除', icon: 'success', duration: 1500 })
    deletingRecord.value = null
  }
}

// ===== 剪贴板检测 =====
const showAutoAdd = ref(false)
const clipboardData = ref(null)

async function checkClipboard() {
  try {
    const text = await readClipboard()
    if (!text) return
    const parsed = parsePaymentText(text)
    if (parsed && parsed.amount > 0) {
      clipboardData.value = parsed
      showAutoAdd.value = true
    }
  } catch {
    // 剪贴板读取失败，静默处理
  }
}

function onAutoAddClose() {
  showAutoAdd.value = false
  clipboardData.value = null
}

function onAutoAddDone() {
  showAutoAdd.value = false
  clipboardData.value = null
}

// ===== 导航 =====
function goDetail(id) {
  router.push(`/detail/${id}`)
}

function goAdd() {
  router.push('/add')
}

function goStatistics() {
  showStats.value = false
  router.push('/statistics')
}

// 页面挂载时检测剪贴板
onMounted(() => {
  checkClipboard()
})
</script>

<style scoped>
.search-wrapper {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-card);
}

.search-wrapper :deep(.van-search) {
  padding: 0;
}

.stats-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: var(--spacing-md);
  cursor: pointer;
  color: var(--color-text-primary);
}

.stats-btn-text {
  font-size: 13px;
  font-weight: 500;
}

/* 分类筛选 */
.category-filter {
  margin: var(--spacing-sm) var(--spacing-lg);
}

.category-filter-scroll {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding: var(--spacing-xs) 0;
  -webkit-overflow-scrolling: touch;
}

.category-filter-scroll::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  background: var(--bg-card);
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-chip.active {
  background: var(--color-primary);
  color: #fff;
}

.filter-chip:active {
  transform: scale(0.95);
}

.date-filter {
  display: flex;
  align-items: center;
  margin: 0 var(--spacing-lg) var(--spacing-sm);
  background: var(--bg-card);
  border-radius: var(--radius-md);
}

.date-filter :deep(.van-cell) {
  flex: 1;
  font-size: var(--font-size-caption);
}

.date-clear {
  padding: 0 var(--spacing-lg);
  font-size: var(--font-size-caption);
  color: var(--color-primary);
  cursor: pointer;
}

.record-list {
  padding-top: var(--spacing-md);
}

/* 左滑删除按钮 */
.swipe-delete-btn {
  height: 100%;
  min-height: 80px;
}

.list-end {
  text-align: center;
  color: var(--color-text-hint);
  font-size: var(--font-size-caption);
  padding: var(--spacing-xl) 0;
}

.fab-wrapper {
  position: fixed;
  right: 24px;
  bottom: 80px;
  z-index: 100;
}

.fab-button {
  width: 52px;
  height: 52px;
  box-shadow: 0 4px 12px rgba(91, 155, 213, 0.4);
}

/* ===== 统计弹窗 ===== */
.stats-popup {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.stats-title {
  font-size: var(--font-size-h2);
  font-weight: 600;
}

.stats-tabs {
  display: flex;
  background: var(--bg-page);
  border-radius: var(--radius-md);
  padding: 4px;
  margin-bottom: var(--spacing-xxl);
}

.stats-tab {
  flex: 1;
  text-align: center;
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.stats-tab.active {
  background: var(--bg-card);
  color: var(--color-primary);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stats-body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 总额卡片 */
.stats-total-card {
  text-align: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  background: linear-gradient(135deg, #4A8BC5, #6EB8D3);
  border-radius: var(--radius-lg);
  color: #fff;
}

.stats-total-label {
  font-size: 11px;
  opacity: 0.9;
}

.stats-total-amount {
  display: block;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

.stats-total-sub {
  font-size: 10px;
  opacity: 0.95;
}

.stats-total-sep {
  margin: 0 var(--spacing-sm);
  opacity: 0.6;
}

.stats-total-net {
  font-size: var(--font-size-caption);
  font-weight: 600;
  padding-top: 2px;
  border-top: 1px solid rgba(255,255,255,0.4);
  margin-top: 2px;
}

.stats-total-net.net-positive {
  color: #D0F5A0;
}

.stats-total-net.net-negative {
  color: #FFE0DE;
}

/* 明细表 */
.stats-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.stats-detail-title {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  padding: 0 var(--spacing-xs);
}

.stats-detail-table {
  flex: 1;
  overflow-y: auto;
}

.stats-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-xs);
  border-bottom: 1px solid var(--border-color);
}

.stats-detail-row:last-child {
  border-bottom: none;
}

.detail-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.detail-tag {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.tag-income {
  background: #52C41A;
}

.tag-expense {
  background: #FF4D4F;
}

.detail-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.detail-merchant {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-time {
  font-size: 11px;
  color: var(--color-text-hint);
}

.detail-amount {
  flex-shrink: 0;
  font-size: var(--font-size-body);
  font-weight: 600;
  margin-left: var(--spacing-md);
}

.income-color {
  color: #52C41A;
}

.expense-color {
  color: #FF4D4F;
}

.stats-detail-empty {
  text-align: center;
  padding: var(--spacing-xxl);
  color: var(--color-text-hint);
  font-size: var(--font-size-caption);
}

.stats-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) 0;
  color: var(--color-primary);
  font-size: var(--font-size-body);
  cursor: pointer;
}
</style>
