<template>
  <div class="empty-state">
    <div class="empty-icon" aria-hidden="true">{{ icon }}</div>
    <p class="empty-title">{{ title }}</p>
    <p class="empty-desc">{{ desc }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: { type: String, default: '' }
})

const icon = computed(() => props.message ? '🔍' : '📋')
const title = computed(() => props.message || '还没有支付记录')
const desc = computed(() => props.message ? '换个关键词试试' : '点击下方 + 按钮添加第一笔')
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: var(--font-size-h3);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: var(--font-size-caption);
  color: var(--color-text-hint);
}
</style>
