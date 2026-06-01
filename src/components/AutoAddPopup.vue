<template>
  <van-popup
    v-model:show="visible"
    position="bottom"
    round
    :style="{ height: '65%' }"
    @closed="onClosed"
  >
    <div class="auto-add-popup">
      <!-- 头部 -->
      <div class="popup-header">
        <span class="popup-title">检测到支付记录</span>
        <van-icon name="cross" size="18" aria-label="关闭" role="button" tabindex="0" @click="onCancel" @keydown.enter.prevent="onCancel" />
      </div>

      <div class="popup-body">
        <!-- 来源提示 -->
        <div class="source-hint">
          <van-icon name="info-o" size="14" />
          <span>从剪贴板识别以下信息，请确认后记账</span>
        </div>

        <!-- 预填信息展示 -->
        <van-cell-group inset>
          <van-cell title="金额" :value="amountText" />
          <van-cell v-if="parsedData.merchant" title="商家" :value="parsedData.merchant" />
          <van-cell title="类型">
            <template #value>
              <span :class="parsedData.type === 'income' ? 'income-text' : 'expense-text'">
                {{ parsedData.type === 'income' ? '收入' : '支出' }}
              </span>
            </template>
          </van-cell>
        </van-cell-group>

        <!-- 分类选择 -->
        <div class="category-section">
          <p class="section-label">选择分类</p>
          <div class="category-grid">
            <div
              v-for="cat in categories"
              :key="cat.key"
              :class="['category-item', { selected: selectedCategory === cat.key }]"
              @click="selectedCategory = cat.key"
            >
              <van-icon :name="cat.icon" :color="selectedCategory === cat.key ? '#fff' : cat.color" size="22" />
              <span class="cat-label">{{ cat.label }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="btn-row">
          <van-button
            type="default"
            round
            plain
            class="btn-skip"
            @click="onCancel"
          >
            忽略
          </van-button>
          <van-button
            type="primary"
            round
            class="btn-confirm"
            :loading="confirming"
            @click="onConfirm"
          >
            立即记账
          </van-button>
        </div>

        <!-- 手动输入链接 -->
        <div class="manual-link" role="link" tabindex="0" @click="goManualAdd" @keydown.enter.prevent="goManualAdd">
          <span>需要填写更多信息？</span>
          <van-icon name="arrow" size="14" />
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRecordsStore } from '../stores/records'
import { useClipboardStore } from '../stores/clipboard'
import { showToast } from 'vant'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  data: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'done'])

const router = useRouter()
const recordsStore = useRecordsStore()
const clipboardStore = useClipboardStore()

const visible = computed({
  get: () => props.show,
  set: (val) => { if (!val) emit('close') }
})

const parsedData = computed(() => props.data || { amount: 0, merchant: '', platform: 'other', category: 'other', type: 'expense' })

const selectedCategory = ref('food')

// 当 data 变化时，使用预填的分类
watch(() => props.data, (newData) => {
  if (newData && newData.category) {
    selectedCategory.value = newData.category
  }
}, { immediate: true })

const amountText = computed(() => {
  const prefix = parsedData.value.type === 'income' ? '+' : '-'
  return `${prefix}¥ ${parsedData.value.amount.toFixed(2)}`
})

const categories = [
  { key: 'food',      label: '餐饮', icon: 'food-o',       color: '#FF6B6B' },
  { key: 'transport', label: '交通', icon: 'logistics',     color: '#4ECDC4' },
  { key: 'shopping',  label: '购物', icon: 'shopping-cart-o', color: '#FFD93D' },
  { key: 'hotel',     label: '住宿', icon: 'hotel-o',       color: '#6C5CE7' },
  { key: 'entertain', label: '娱乐', icon: 'music-o',       color: '#A29BFE' },
  { key: 'transfer',  label: '转账', icon: 'exchange',      color: '#FD79A8' },
  { key: 'redpacket', label: '红包', icon: 'gift-o',        color: '#E17055' },
  { key: 'other',     label: '其他', icon: 'more-o',        color: '#B2BEC3' }
]

const confirming = ref(false)

function onConfirm() {
  if (confirming.value) return
  confirming.value = true

  const data = parsedData.value
  recordsStore.addRecord({
    type: data.type || 'expense',
    amount: data.amount,
    category: selectedCategory.value,
    merchant: data.merchant || '',
    paymentTime: new Date().toISOString(),
    platform: data.platform || 'other',
    orderNumber: '',
    description: ''
  })

  showToast({ message: '记账成功', icon: 'success', duration: 1500 })
  visible.value = false
  emit('done')
  setTimeout(() => { confirming.value = false }, 500)
}

function onCancel() {
  visible.value = false
  emit('close')
}

function goManualAdd() {
  // 将数据暂存到 clipboardStore，然后跳转 Add 页
  clipboardStore.setParsedData(parsedData.value)
  visible.value = false
  router.push('/add?auto=1')
  emit('close')
}

function onClosed() {
  emit('close')
}
</script>

<style scoped>
.auto-add-popup {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.popup-title {
  font-size: var(--font-size-h2);
  font-weight: 600;
}

.popup-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  padding-bottom: env(safe-area-inset-bottom, var(--spacing-xl));
}

.source-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: #FFF9D6;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-caption);
  color: #7A6300;
  font-weight: 500;
  margin-bottom: var(--spacing-lg);
}

.category-section {
  margin: var(--spacing-lg) 0;
}

.section-label {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s;
}

.category-item.selected {
  background: var(--color-primary);
}

.cat-label {
  font-size: 11px;
  margin-top: 4px;
  color: var(--color-text-hint);
}

.category-item.selected .cat-label {
  color: #fff;
}

.btn-row {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.btn-skip {
  flex: 1;
}

.btn-confirm {
  flex: 2;
}

.manual-link {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) 0;
  color: var(--color-primary);
  font-size: var(--font-size-caption);
  cursor: pointer;
}

.income-text {
  color: #52C41A;
  font-weight: 600;
}

.expense-text {
  color: #FF4D4F;
  font-weight: 600;
}
</style>
