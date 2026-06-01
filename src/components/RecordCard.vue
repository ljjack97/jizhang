<template>
  <div class="record-card" role="button" tabindex="0" @click="onClick" @keydown.enter.prevent="onClick" @keydown.space.prevent="onClick">
    <div class="card-top">
      <span :class="['amount-text', 'amount-text-md', record.type === 'income' ? 'income-color' : 'expense-color']">
        {{ record.type === 'income' ? '+' : '-' }}¥ {{ record.amount.toFixed(2) }}
      </span>
      <span :class="['platform-tag', `platform-${record.platform}`]">
        {{ platformLabel }}
      </span>
    </div>
    <div class="card-meta">
      <span :class="['category-tag', `cat-${record.category}`]">{{ categoryLabel }}</span>
      <span class="card-time">{{ formatTime(record.paymentTime) }}</span>
    </div>
    <div v-if="record.merchant" class="card-merchant text-ellipsis">
      {{ record.merchant }}
    </div>
    <div v-if="record.orderNumber" class="card-order text-ellipsis">
      订单: {{ record.orderNumber }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  record: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['click'])

const platformMap = {
  wechat: '微信支付',
  alipay: '支付宝',
  bank: '银行卡',
  other: '其他'
}

const categoryMap = {
  food: '餐饮',
  transport: '交通',
  shopping: '购物',
  hotel: '住宿',
  entertain: '娱乐',
  transfer: '转账',
  redpacket: '红包',
  other: '其他'
}

const platformLabel = computed(() => {
  return platformMap[props.record.platform] || '其他'
})

const categoryLabel = computed(() => {
  return categoryMap[props.record.category] || '其他'
})

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${mins}`
}

function onClick() {
  emit('click', props.record.id)
}
</script>

<style scoped>
.record-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin: 0 var(--spacing-lg) var(--spacing-md);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: transform 0.1s ease;
  position: relative;
}

.record-card:active {
  transform: scale(0.98);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.income-color {
  color: #52C41A;
}

.expense-color {
  color: #FF4D4F;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.category-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--bg-page);
  color: var(--color-text-secondary);
}

.card-time {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.card-merchant {
  font-size: var(--font-size-caption);
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.card-order {
  font-size: var(--font-size-caption);
  color: var(--color-text-hint);
}
</style>
