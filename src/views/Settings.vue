<template>
  <div class="page-container">
    <van-nav-bar
      title="设置"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="router.back"
    />

    <div class="settings-content">
      <!-- 添加按钮样式 -->
      <van-cell-group inset title="添加按钮样式">
        <van-cell title="按钮位置" center>
          <template #right-icon>
            <van-radio-group
              v-model="prefs.addButtonStyle"
              direction="horizontal"
              @change="onButtonStyleChange"
            >
              <van-radio name="fab" icon-size="14px">悬浮按钮</van-radio>
              <van-radio name="topbar" icon-size="14px">顶部按钮</van-radio>
            </van-radio-group>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 交互设置 -->
      <van-cell-group inset title="交互设置">
        <van-cell title="摇一摇记账" center>
          <template #right-icon>
            <van-switch
              v-model="prefs.shakeEnabled"
              size="24px"
              @change="onShakeChange"
            />
          </template>
        </van-cell>
        <van-cell title="记账音效" center>
          <template #right-icon>
            <van-switch
              v-model="prefs.soundEnabled"
              size="24px"
              @change="onSoundChange"
            />
          </template>
        </van-cell>
        <van-cell title="震动反馈" center>
          <template #right-icon>
            <van-switch
              v-model="prefs.vibrateEnabled"
              size="24px"
              @change="onVibrateChange"
            />
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 无障碍权限引导 -->
      <van-cell-group inset title="无障碍自动记账">
        <van-cell
          title="无障碍权限"
          label="开启后可在支付时自动弹出记账弹窗"
          is-link
          @click="openAccessibilityGuide"
        />
        <van-cell title="权限状态" center>
          <template #right-icon>
            <van-tag :type="accessibilityStatus.type" size="small">
              {{ accessibilityStatus.text }}
            </van-tag>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 数据导入 -->
      <van-cell-group inset title="数据导入">
        <van-cell
          title="导入 CSV 账单"
          label="支持微信/支付宝导出账单"
          is-link
          @click="onImportCSV"
        />
      </van-cell-group>

      <!-- 数据管理 -->
      <van-cell-group inset title="数据管理">
        <van-cell title="清除全部记录" center>
          <template #right-icon>
            <van-button
              type="danger"
              size="small"
              round
              plain
              @click="showClearDialog"
            >
              清除
            </van-button>
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <!-- 清除确认弹窗 -->
    <van-dialog
      v-model:show="showClear"
      title="确认清除"
      message="此操作将删除所有支付记录且不可恢复，确定继续吗？"
      show-cancel-button
      confirm-button-text="确定清除"
      confirm-button-color="#FF4D4F"
      @confirm="doClear"
    />

    <!-- 无障碍权限引导弹窗 -->
    <van-dialog
      v-model:show="showAccessGuide"
      title="无障碍权限指引"
      show-cancel-button
      confirm-button-text="去设置"
      confirm-button-color="#5B9BD5"
      @confirm="goToAccessSettings"
    >
      <div class="guide-content">
        <p class="guide-step">1. 打开手机「设置」</p>
        <p class="guide-step">2. 进入「辅助功能」→「无障碍」</p>
        <p class="guide-step">3. 找到「记账」并开启服务</p>
        <p class="guide-step">4. 返回 App，状态将自动更新</p>
      </div>
    </van-dialog>

    <!-- CSV 导入预览弹窗 -->
    <van-dialog
      v-model:show="showCSVPreview"
      :title="`导入预览 (${csvStats.total} 条)`"
      show-cancel-button
      confirm-button-text="确认导入"
      confirm-button-color="#5B9BD5"
      @confirm="doCSVImport"
      :style="{ width: '90%' }"
      class="csv-dialog"
    >
      <div class="csv-preview" v-if="csvRecords.length > 0">
        <!-- 统计摘要 -->
        <div class="csv-stats">
          <div class="csv-stat-row">
            <span>总收入</span><span class="income-color">{{ csvStats.incomeCount }} 条 / +¥{{ csvStats.incomeTotal.toFixed(2) }}</span>
          </div>
          <div class="csv-stat-row">
            <span>总支出</span><span class="expense-color">{{ csvStats.expenseCount }} 条 / -¥{{ csvStats.expenseTotal.toFixed(2) }}</span>
          </div>
        </div>
        <!-- 前5条预览 -->
        <div class="csv-records">
          <p class="csv-section-title">数据预览（前5条）</p>
          <div class="csv-record-item" v-for="(r, i) in csvRecords.slice(0, 5)" :key="i">
            <div class="csv-record-main">
              <span :class="r.type === 'income' ? 'income-color' : 'expense-color'">
                {{ r.type === 'income' ? '+' : '-' }}¥{{ r.amount.toFixed(2) }}
              </span>
              <span class="csv-record-merchant">{{ r.merchant || '未知商家' }}</span>
              <van-tag size="mini" type="primary">{{ categoryLabelMap[r.category] || '其他' }}</van-tag>
            </div>
            <div class="csv-record-sub">{{ formatCSVTime(r.paymentTime) }}</div>
          </div>
        </div>
        <!-- 分类分布 -->
        <div class="csv-categories">
          <p class="csv-section-title">分类分布</p>
          <div class="csv-cat-tags">
            <van-tag
              v-for="(stat, cat) in csvStats.categoryStats"
              :key="cat"
              size="small"
              type="primary"
              plain
            >
              {{ categoryLabelMap[cat] || cat }}: {{ stat.count }}条
            </van-tag>
          </div>
        </div>
        <div class="csv-errors" v-if="csvErrors.length > 0">
          <p class="csv-section-title error-title">解析警告</p>
          <p class="csv-error-item" v-for="(err, i) in csvErrors" :key="i">{{ err }}</p>
        </div>
      </div>
      <div class="csv-empty" v-else>
        <p>未能从文件中解析出有效记录</p>
        <p class="csv-empty-hint">请确保文件为微信或支付宝导出的 CSV 账单</p>
      </div>
    </van-dialog>

    <!-- 隐藏的文件选择器 -->
    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      style="display: none"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { usePreferencesStore } from '../stores/preferences'
import { useRecordsStore } from '../stores/records'
import { parseCSVBill, getImportStats } from '../utils/csv-parser'
import { useInteraction } from '../composables/useInteraction'
import { showToast } from 'vant'

const router = useRouter()
const prefs = usePreferencesStore()
const recordsStore = useRecordsStore()
const { feedbackToggle } = useInteraction()

const categoryLabelMap = {
  food: '餐饮', transport: '交通', shopping: '购物', hotel: '住宿',
  entertain: '娱乐', transfer: '转账', redpacket: '红包', other: '其他'
}

const accessibilityStatus = reactive({
  type: 'warning',
  text: '未检测'
})

function onButtonStyleChange(val) {
  prefs.setAddButtonStyle(val)
  showToast({ message: '已切换按钮位置', duration: 1000 })
}

function onShakeChange(val) {
  prefs.setShakeEnabled(val)
  feedbackToggle()
  showToast({ message: val ? '已开启摇一摇' : '已关闭摇一摇', duration: 1000 })
}

function onSoundChange(val) {
  prefs.setSoundEnabled(val)
  feedbackToggle()
  showToast({ message: val ? '已开启音效' : '已关闭音效', duration: 1000 })
}

function onVibrateChange(val) {
  prefs.setVibrateEnabled(val)
  feedbackToggle()
  showToast({ message: val ? '已开启震动' : '已关闭震动', duration: 1000 })
}

// 无障碍权限引导
const showAccessGuide = ref(false)

function openAccessibilityGuide() {
  showAccessGuide.value = true
}

function goToAccessSettings() {
  showAccessGuide.value = false
  showToast({ message: '请在系统设置中开启无障碍权限', duration: 2000 })
}

// CSV 导入
const fileInput = ref(null)
const showCSVPreview = ref(false)
const csvImporting = ref(false)
const csvRecords = ref([])
const csvStats = ref({ total: 0, incomeCount: 0, expenseCount: 0, incomeTotal: 0, expenseTotal: 0, categoryStats: {} })
const csvErrors = ref([])

function onImportCSV() {
  // 触发文件选择
  if (fileInput.value) {
    fileInput.value.click()
  }
}

async function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return

  // 检查文件类型
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    showToast({ message: '请选择 CSV 文件', duration: 1500 })
    event.target.value = ''
    return
  }

  try {
    const text = await file.text()
    const result = parseCSVBill(text)

    if (result.records.length === 0) {
      showToast({
        message: result.errors[0] || '未能解析出有效记录',
        duration: 2000
      })
      event.target.value = ''
      return
    }

    csvRecords.value = result.records
    csvStats.value = getImportStats(result.records)
    csvErrors.value = result.errors
    showCSVPreview.value = true
  } catch (e) {
    showToast({ message: '文件读取失败: ' + e.message, duration: 2000 })
  }

  // 重置 input，允许重复选择同一文件
  event.target.value = ''
}

function doCSVImport() {
  if (csvImporting.value) return
  csvImporting.value = true

  let imported = 0
  csvRecords.value.forEach(r => {
    recordsStore.addRecord({
      type: r.type,
      amount: r.amount,
      category: r.category,
      merchant: r.merchant,
      paymentTime: r.paymentTime,
      platform: r.platform,
      orderNumber: r.orderNumber,
      description: r.description
    })
    imported++
  })

  showToast({
    message: `成功导入 ${imported} 条记录`,
    icon: 'success',
    duration: 2000
  })

  // 重置状态
  showCSVPreview.value = false
  csvRecords.value = []
  csvErrors.value = []
  setTimeout(() => { csvImporting.value = false }, 500)
}

function formatCSVTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 清除数据
const showClear = ref(false)

function showClearDialog() {
  showClear.value = true
}

function doClear() {
  recordsStore.clearAllRecords()
  showToast({ message: '已清除全部记录', icon: 'success', duration: 1500 })
}
</script>

<style scoped>
.settings-content {
  padding-top: var(--spacing-md);
}

.settings-content :deep(.van-cell-group) {
  margin-bottom: var(--spacing-lg);
}

.guide-content {
  padding: var(--spacing-lg);
}

.guide-step {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  padding: var(--spacing-sm) 0;
  margin: 0;
}

/* CSV 导入预览 */
.csv-preview {
  padding: var(--spacing-md);
  max-height: 50vh;
  overflow-y: auto;
}

.csv-stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.csv-stat-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-body);
  font-weight: 500;
}

.csv-section-title {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  margin: var(--spacing-md) 0 var(--spacing-sm);
  font-weight: 600;
}

.csv-records {
  margin-bottom: var(--spacing-sm);
}

.csv-record-item {
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-color);
}

.csv-record-item:last-child {
  border-bottom: none;
}

.csv-record-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-body);
}

.csv-record-merchant {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.csv-record-sub {
  font-size: 11px;
  color: var(--color-text-hint);
  margin-top: 2px;
}

.csv-cat-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.csv-empty {
  padding: var(--spacing-xxl) var(--spacing-lg);
  text-align: center;
}

.csv-empty p {
  color: var(--color-text-secondary);
}

.csv-empty-hint {
  font-size: var(--font-size-caption);
  color: var(--color-text-hint) !important;
  margin-top: var(--spacing-sm);
}

.csv-errors {
  margin-top: var(--spacing-md);
}

.error-title {
  color: #FF4D4F !important;
}

.csv-error-item {
  font-size: 11px;
  color: #FF4D4F;
  margin: 2px 0;
}

.income-color {
  color: #52C41A;
  font-weight: 600;
}

.expense-color {
  color: #FF4D4F;
  font-weight: 600;
}
</style>
