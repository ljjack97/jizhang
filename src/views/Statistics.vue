<template>
  <div class="page-container">
    <van-nav-bar
      title="统计图表"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="router.back"
    />

    <div class="stats-page-content">
      <!-- 周期切换 -->
      <div class="period-tabs">
        <span
          v-for="tab in periodTabs"
          :key="tab.key"
          :class="['period-tab', { active: activePeriod === tab.key }]"
          @click="activePeriod = tab.key"
        >
          {{ tab.label }}
        </span>
      </div>

      <!-- 收支摘要卡片 -->
      <div class="summary-cards">
        <div class="summary-card income-card">
          <div class="summary-icon income-icon">
            <van-icon name="down" size="12" />
          </div>
          <div class="summary-body">
            <span class="summary-label">收入</span>
            <span class="summary-amount income-amount">+¥{{ incomeTotal.toFixed(2) }}</span>
            <span class="summary-count">{{ incomeCount }} 笔</span>
          </div>
        </div>
        <div class="summary-card expense-card">
          <div class="summary-icon expense-icon">
            <van-icon name="up" size="12" />
          </div>
          <div class="summary-body">
            <span class="summary-label">支出</span>
            <span class="summary-amount expense-amount">-¥{{ expenseTotal.toFixed(2) }}</span>
            <span class="summary-count">{{ expenseCount }} 笔</span>
          </div>
        </div>
      </div>

      <!-- 饼图：分类占比 -->
      <div class="chart-card" v-if="pieData.length > 0">
        <div class="chart-card-header">
          <span class="chart-title">支出分类占比</span>
          <span class="chart-subtitle">{{ periodLabel }}</span>
        </div>
        <div class="pie-chart-wrapper">
          <svg :width="pieSize" :height="pieSize" viewBox="0 0 200 200" class="pie-svg" role="img" :aria-label="`支出分类占比饼图，总支出 ¥${expenseTotal.toFixed(0)}`">
            <defs>
              <!-- 3D 阴影滤镜 -->
              <filter id="pie-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.15" />
              </filter>
              <!-- 每个分类的渐变 -->
              <linearGradient
                v-for="item in pieData" :key="'grad-' + item.key"
                :id="'pie-grad-' + item.key"
                x1="0%" y1="0%" x2="0%" y2="100%"
              >
                <stop offset="0%" :stop-color="lightenColor(item.color, 15)" />
                <stop offset="100%" :stop-color="item.color" />
              </linearGradient>
            </defs>
            <!-- 环形图扇区 -->
            <g
              v-for="(slice, i) in pieSlices"
              :key="slice.key"
              :transform="selectedPieCategory === slice.key ? `translate(${(slice.midX - pieCenter) * 0.06}, ${(slice.midY - pieCenter) * 0.06})` : ''"
              class="pie-group"
              role="button"
              :aria-label="`${slice.label} ¥${slice.amount.toFixed(2)}，占比 ${slice.pct.toFixed(1)}%`"
              :aria-pressed="selectedPieCategory === slice.key"
              tabindex="0"
              @click="selectedPieCategory = selectedPieCategory === slice.key ? '' : slice.key"
              @keydown.enter.prevent="selectedPieCategory = selectedPieCategory === slice.key ? '' : slice.key"
            >
              <path
                :d="slice.path"
                :fill="`url(#pie-grad-${slice.key})`"
                :opacity="!selectedPieCategory || selectedPieCategory === slice.key ? 1 : 0.25"
                stroke="#fff"
                stroke-width="2"
                filter="url(#pie-shadow)"
                class="pie-slice"
              />
              <text
                v-if="slice.pct >= 3"
                :x="slice.labelX"
                :y="slice.labelY"
                text-anchor="middle"
                font-size="11"
                font-weight="700"
                fill="#fff"
                style="text-shadow: 0 1px 2px rgba(0,0,0,0.3)"
                class="pie-label"
              >
                {{ slice.pct.toFixed(1) }}%
              </text>
            </g>
            <!-- 中心圆（环形）- 立体感 -->
            <circle cx="100" cy="100" r="42" fill="#fff" filter="url(#pie-shadow)" />
            <circle cx="100" cy="100" r="42" fill="none" stroke="#f0f0f0" stroke-width="1" />
            <text x="100" y="96" text-anchor="middle" font-size="14" fill="#333" font-weight="800">
              ¥{{ expenseTotal.toFixed(0) }}
            </text>
            <text x="100" y="113" text-anchor="middle" font-size="10" fill="#666" font-weight="500">
              总支出
            </text>
          </svg>
          <!-- 图例 -->
          <div class="pie-legend">
            <span
              v-for="item in pieData"
              :key="item.key"
              :class="['legend-item', { dimmed: selectedPieCategory && selectedPieCategory !== item.key }]"
              role="button"
              :aria-pressed="!selectedPieCategory || selectedPieCategory === item.key"
              tabindex="0"
              @click="selectedPieCategory = selectedPieCategory === item.key ? '' : item.key"
              @keydown.enter.prevent="selectedPieCategory = selectedPieCategory === item.key ? '' : item.key"
            >
              <span class="legend-dot" :style="{ background: item.color, boxShadow: `0 2px 4px ${item.color}66` }"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-amount">¥{{ item.amount.toFixed(2) }}</span>
              <span class="legend-pct">{{ item.pct.toFixed(1) }}%</span>
            </span>
          </div>
        </div>
      </div>
      <div class="chart-empty" v-else>
        <van-icon name="chart-trending-o" size="40" color="#ddd" />
        <p>暂无支出数据</p>
      </div>

      <!-- 柱状图：每日趋势 -->
      <div class="chart-card" v-if="barData.length > 0">
        <div class="chart-card-header">
          <span class="chart-title">每日收支趋势</span>
          <span class="chart-subtitle">{{ periodLabel }}</span>
        </div>
        <div class="bar-chart-wrapper">
          <svg :width="barWidth" :height="barChartH" :viewBox="`0 0 ${Math.max(320, barWidth)} ${barChartH}`" role="img" aria-label="每日收支趋势柱状图">
            <defs>
              <!-- 收入柱渐变 -->
              <linearGradient id="bar-income-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#73D13D" />
                <stop offset="60%" stop-color="#52C41A" />
                <stop offset="100%" stop-color="#389E0D" />
              </linearGradient>
              <!-- 支出柱渐变 -->
              <linearGradient id="bar-expense-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#FF7875" />
                <stop offset="60%" stop-color="#FF4D4F" />
                <stop offset="100%" stop-color="#CF1322" />
              </linearGradient>
              <!-- 柱阴影 -->
              <filter id="bar-shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.12" />
              </filter>
              <!-- 柱顶高光 -->
              <linearGradient id="bar-income-top" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#B7EB8F" />
                <stop offset="100%" stop-color="#73D13D" />
              </linearGradient>
              <linearGradient id="bar-expense-top" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#FFA39E" />
                <stop offset="100%" stop-color="#FF7875" />
              </linearGradient>
            </defs>
            <!-- 网格线（虚线） -->
            <line
              v-for="i in 4"
              :key="'grid-' + i"
              :x1="barPadL" :y1="barH - i * barGridGap"
              :x2="barW" :y2="barH - i * barGridGap"
              stroke="#f0f0f0"
              stroke-width="1"
              stroke-dasharray="4 3"
            />
            <!-- 基线 -->
            <line :x1="barPadL-4" :y1="barH" :x2="barW" :y2="barH" stroke="#e0e0e0" stroke-width="1" />

            <!-- 柱状条 -->
            <g v-for="(d, i) in barData" :key="'bar-' + i" class="bar-group">
              <!-- 支出柱（在后面） -->
              <rect
                :x="d.x - barColW - 2"
                :y="d.expenseY"
                :width="barColW"
                :height="Math.max(1, d.expenseH)"
                fill="url(#bar-expense-grad)"
                rx="2"
                filter="url(#bar-shadow)"
                class="bar-rect"
              >
                <title>支出 ¥{{ d.expense.toFixed(2) }}</title>
              </rect>
              <!-- 支出柱顶面（3D 效果） -->
              <rect
                v-if="d.expenseH > 3"
                :x="d.x - barColW - 2"
                :y="d.expenseY"
                :width="barColW"
                :height="2.5"
                fill="url(#bar-expense-top)"
                rx="2"
              />
              <!-- 支出标签（小值外部引线） -->
              <g v-if="d.expense > 0">
                <line
                  v-if="d.expenseH < 10"
                  :x1="d.x - barColW/2 - 2" :y1="d.expenseY"
                  :x2="d.x - barColW/2 - 2" :y2="d.expenseY - 16"
                  stroke="#FF4D4F" stroke-width="0.8" stroke-dasharray="2 2"
                />
                <text
                  :x="d.x - barColW/2 - 2"
                  :y="d.expenseH < 10 ? d.expenseY - 19 : d.expenseY - 4"
                  text-anchor="middle"
                  font-size="8"
                  fill="#CF1322"
                  font-weight="700"
                >
                  {{ d.expense.toFixed(0) }}
                </text>
              </g>
              <!-- 收入柱（在前面） -->
              <rect
                :x="d.x + 2"
                :y="d.incomeY"
                :width="barColW"
                :height="Math.max(1, d.incomeH)"
                fill="url(#bar-income-grad)"
                rx="2"
                filter="url(#bar-shadow)"
                class="bar-rect"
              >
                <title>收入 ¥{{ d.income.toFixed(2) }}</title>
              </rect>
              <!-- 收入柱顶面（3D 效果） -->
              <rect
                v-if="d.incomeH > 3"
                :x="d.x + 2"
                :y="d.incomeY"
                :width="barColW"
                :height="2.5"
                fill="url(#bar-income-top)"
                rx="2"
              />
              <!-- 收入标签（小值外部引线） -->
              <g v-if="d.income > 0">
                <line
                  v-if="d.incomeH < 10"
                  :x1="d.x + barColW/2 + 2" :y1="d.incomeY"
                  :x2="d.x + barColW/2 + 2" :y2="d.incomeY - 16"
                  stroke="#52C41A" stroke-width="0.8" stroke-dasharray="2 2"
                />
                <text
                  :x="d.x + barColW/2 + 2"
                  :y="d.incomeH < 10 ? d.incomeY - 19 : d.incomeY - 4"
                  text-anchor="middle"
                  font-size="8"
                  fill="#389E0D"
                  font-weight="700"
                >
                  {{ d.income.toFixed(0) }}
                </text>
              </g>
              <!-- X 轴日期 -->
              <text
                :x="d.x"
                :y="barH + 16"
                text-anchor="middle"
                :font-size="barData.length > 15 ? 7 : 9"
                fill="#999"
                font-weight="500"
              >
                {{ d.label }}
              </text>
            </g>
          </svg>
          <!-- 图例 -->
          <div class="bar-legend">
            <span class="bar-legend-item">
              <span class="bar-legend-swatch income-swatch"></span>收入
            </span>
            <span class="bar-legend-item">
              <span class="bar-legend-swatch expense-swatch"></span>支出
            </span>
          </div>
        </div>
      </div>
      <div class="chart-empty" v-else>
        <van-icon name="chart-trending-o" size="40" color="#ddd" />
        <p>暂无数据</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordsStore } from '../stores/records'

const router = useRouter()
const store = useRecordsStore()

const activePeriod = ref('month')
const selectedPieCategory = ref('')

const periodTabs = [
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' },
  { key: '30d', label: '近30天' }
]

const periodLabelMap = { month: '本月', year: '本年', '30d': '近30天' }
const periodLabel = computed(() => periodLabelMap[activePeriod.value])

// 颜色列表（稍亮的主色 + 渐变暗色）
const catColors = {
  food: '#FF6B6B', transport: '#4ECDC4', shopping: '#FFD93D', hotel: '#6C5CE7',
  entertain: '#A29BFE', transfer: '#FD79A8', redpacket: '#E17055', other: '#B2BEC3'
}
const catLabels = {
  food: '餐饮', transport: '交通', shopping: '购物', hotel: '住宿',
  entertain: '娱乐', transfer: '转账', redpacket: '红包', other: '其他'
}

// 颜色变亮工具函数
function lightenColor(hex, pct) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * pct))
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * pct))
  const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * pct))
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

// 统计范围
function getPeriodRange(period) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'month':
      start.setDate(1); start.setHours(0, 0, 0, 0)
      end.setMonth(now.getMonth() + 1, 0); end.setHours(23, 59, 59, 999)
      break
    case 'year':
      start.setMonth(0, 1); start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31); end.setHours(23, 59, 59, 999)
      break
    case '30d':
      start.setDate(now.getDate() - 29); start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
  }
  return { start, end }
}

const periodRecords = computed(() => {
  const { start, end } = getPeriodRange(activePeriod.value)
  return store.sortedRecords.filter(r => {
    const t = new Date(r.paymentTime).getTime()
    return t >= start.getTime() && t <= end.getTime()
  })
})

const incomeRecords = computed(() => periodRecords.value.filter(r => r.type === 'income'))
const expenseRecords = computed(() => periodRecords.value.filter(r => r.type === 'expense'))

const incomeTotal = computed(() => incomeRecords.value.reduce((s, r) => s + r.amount, 0))
const expenseTotal = computed(() => expenseRecords.value.reduce((s, r) => s + r.amount, 0))
const incomeCount = computed(() => incomeRecords.value.length)
const expenseCount = computed(() => expenseRecords.value.length)

// ===== 饼图数据 =====
const pieSize = 200
const pieCenter = 100
const pieRadius = 70

const pieData = computed(() => {
  const group = {}
  expenseRecords.value.forEach(r => {
    const cat = r.category || 'other'
    group[cat] = (group[cat] || 0) + r.amount
  })
  const total = Object.values(group).reduce((s, v) => s + v, 0)
  if (!total) return []

  return Object.entries(group)
    .sort((a, b) => b[1] - a[1])
    .map(([key, val]) => ({
      key,
      label: catLabels[key] || key,
      color: catColors[key] || '#B2BEC3',
      amount: val,
      pct: (val / total) * 100
    }))
})

const pieSlices = computed(() => {
  let startAngle = -Math.PI / 2
  const slices = []
  for (const item of pieData.value) {
    if (item.pct <= 0) continue
    const angle = (item.pct / 100) * 2 * Math.PI
    const endAngle = startAngle + angle
    const midAngle = startAngle + angle / 2

    const x1 = pieCenter + pieRadius * Math.cos(startAngle)
    const y1 = pieCenter + pieRadius * Math.sin(startAngle)
    const x2 = pieCenter + pieRadius * Math.cos(endAngle)
    const y2 = pieCenter + pieRadius * Math.sin(endAngle)

    const largeArc = angle > Math.PI ? 1 : 0
    const path = `M ${pieCenter} ${pieCenter} L ${x1} ${y1} A ${pieRadius} ${pieRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    // 标签放在扇区半径 62% 处，确保不偏离图表
    const labelR = pieRadius * 0.62
    const labelX = pieCenter + labelR * Math.cos(midAngle)
    const labelY = pieCenter + labelR * Math.sin(midAngle)
    const midX = pieCenter + (pieRadius / 2) * Math.cos(midAngle)
    const midY = pieCenter + (pieRadius / 2) * Math.sin(midAngle)

    slices.push({ ...item, startAngle, endAngle, path, labelX, labelY, midX, midY })
    startAngle = endAngle
  }
  return slices
})

// ===== 柱状图数据 =====
const barPadL = 36
const barPadR = 12
const barH = 160
const barW = 312
const barGridGap = barH / 4

const barData = computed(() => {
  const dayMap = {}
  periodRecords.value.forEach(r => {
    const d = new Date(r.paymentTime)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!dayMap[key]) dayMap[key] = { date: d, income: 0, expense: 0 }
    if (r.type === 'income') dayMap[key].income += r.amount
    else dayMap[key].expense += r.amount
  })

  const days = Object.values(dayMap).sort((a, b) => a.date - b.date)
  if (days.length === 0) return []

  const maxAmount = Math.max(1, ...days.map(d => Math.max(d.income, d.expense)))
  const chartAreaW = barW - barPadL - barPadR
  const colCount = days.length

  return days.map((d, i) => {
    const x = barPadL + (i + 0.5) * (chartAreaW / colCount)
    const incomeH = Math.max(0, (d.income / maxAmount) * barH)
    const expenseH = Math.max(0, (d.expense / maxAmount) * barH)
    return {
      x,
      label: `${d.date.getMonth() + 1}/${d.date.getDate()}`,
      income: d.income,
      expense: d.expense,
      incomeY: barH - incomeH,
      incomeH,
      expenseY: barH - expenseH,
      expenseH
    }
  })
})

const barColW = computed(() => {
  if (barData.value.length === 0) return 8
  const area = barW - barPadL - barPadR
  return Math.min(12, Math.max(5, area / barData.value.length / 3))
})

const barWidth = computed(() => Math.max(320, barPadL + barPadR + barData.value.length * barColW.value * 3 + 16))
const barChartH = computed(() => barH + 24)
</script>

<style scoped>
.stats-page-content {
  padding: var(--spacing-md) var(--spacing-lg);
  padding-bottom: var(--spacing-xxl);
}

/* ===== 周期切换 ===== */
.period-tabs {
  display: flex;
  background: var(--bg-page);
  border-radius: var(--radius-lg);
  padding: 4px;
  margin-bottom: var(--spacing-lg);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
}

.period-tab {
  flex: 1;
  text-align: center;
  padding: var(--spacing-sm) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.period-tab.active {
  background: #fff;
  color: var(--color-primary);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(91, 155, 213, 0.2), 0 1px 2px rgba(0,0,0,0.06);
}

/* ===== 摘要卡片 ===== */
.summary-cards {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.summary-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
}

.income-card {
  background: linear-gradient(135deg, #F0FFF4 0%, #E6FFED 100%);
  border: 1px solid #D9F7BE;
  box-shadow: 0 2px 12px rgba(82, 196, 26, 0.08);
}

.expense-card {
  background: linear-gradient(135deg, #FFF1F0 0%, #FFEBE9 100%);
  border: 1px solid #FFD8D5;
  box-shadow: 0 2px 12px rgba(255, 77, 79, 0.08);
}

.summary-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.income-icon {
  background: linear-gradient(135deg, #52C41A, #73D13D);
  color: #fff;
  box-shadow: 0 3px 8px rgba(82, 196, 26, 0.3);
}

.expense-icon {
  background: linear-gradient(135deg, #FF4D4F, #FF7875);
  color: #fff;
  box-shadow: 0 3px 8px rgba(255, 77, 79, 0.3);
}

.summary-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.summary-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.summary-amount {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.income-amount { color: #389E0D; }
.expense-amount { color: #CF1322; }

.summary-count {
  font-size: 10px;
  color: var(--color-text-hint);
}

/* ===== 图表卡片 ===== */
.chart-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0,0,0,0.04);
}

.chart-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--spacing-lg);
}

.chart-title {
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.chart-subtitle {
  font-size: 11px;
  color: var(--color-text-hint);
  font-weight: 500;
}

/* ===== 饼图 ===== */
.pie-chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pie-svg {
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.08));
}

.pie-group {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.pie-slice {
  transition: opacity 0.3s;
}

.pie-label {
  pointer-events: none;
  user-select: none;
}

.pie-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: var(--spacing-lg);
  justify-content: center;
  padding: var(--spacing-md);
  background: var(--bg-page);
  border-radius: var(--radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  padding: 3px 0;
}

.legend-item.dimmed {
  opacity: 0.3;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-label {
  font-weight: 500;
}

.legend-amount {
  color: var(--color-text-primary);
  font-size: 11px;
  font-weight: 500;
}

.legend-pct {
  color: var(--color-text-hint);
  font-size: 11px;
}

/* ===== 柱状图 ===== */
.bar-chart-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}

.bar-group {
  cursor: pointer;
}

.bar-rect {
  transition: opacity 0.2s;
}

.bar-rect:hover {
  opacity: 0.85;
}

.bar-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xxl);
  margin-top: var(--spacing-xs);
  padding-top: var(--spacing-sm);
}

.bar-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-hint);
  font-weight: 500;
}

.bar-legend-swatch {
  width: 14px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}

.income-swatch {
  background: linear-gradient(180deg, #73D13D 0%, #52C41A 60%, #389E0D 100%);
  box-shadow: 0 1px 3px rgba(82, 196, 26, 0.3);
}

.expense-swatch {
  background: linear-gradient(180deg, #FF7875 0%, #FF4D4F 60%, #CF1322 100%);
  box-shadow: 0 1px 3px rgba(255, 77, 79, 0.3);
}

/* ===== 空状态 ===== */
.chart-empty {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  color: var(--color-text-hint);
  font-size: var(--font-size-caption);
  background: #fff;
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.chart-empty p {
  margin-top: var(--spacing-sm);
  color: #ccc;
}
</style>
