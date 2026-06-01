<template>
  <div class="page-container">
    <van-nav-bar
      :title="isEditing ? '编辑记录' : '记录详情'"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="onBack"
    >
      <template #right v-if="!isEditing">
        <van-icon name="edit" size="18" aria-label="编辑记录" role="button" tabindex="0" @click="enterEdit" @keydown.enter.prevent="enterEdit" />
      </template>
    </van-nav-bar>

    <!-- 加载中 -->
    <van-loading v-if="!record" class="loading" size="24" vertical>
      加载中...
    </van-loading>

    <!-- 查看模式 -->
    <template v-else-if="!isEditing">
      <!-- 金额区 -->
      <div class="amount-section">
        <p :class="['amount-number', record.type === 'income' ? 'income-color' : 'expense-color']">
          {{ record.type === 'income' ? '+' : '-' }}¥ {{ record.amount.toFixed(2) }}
        </p>
        <div class="amount-tags">
          <span :class="['badge', `type-${record.type}`]">{{ record.type === 'income' ? '收入' : '支出' }}</span>
          <span :class="['badge', `cat-${record.category}`]">{{ categoryLabel }}</span>
        </div>
      </div>

      <!-- 详情列表 -->
      <div class="detail-list">
        <van-cell-group inset>
          <van-cell title="支付时间" :value="formatTime(record.paymentTime)" />
          <van-cell v-if="record.merchant" title="商家" :value="record.merchant" />
          <van-cell
            v-if="record.orderNumber"
            title="订单编号"
            :value="record.orderNumber"
            :label="record.orderNumber"
            value-class="order-value"
          />
          <van-cell title="支付平台" :value="platformLabel" />
          <van-cell
            v-if="record.description"
            title="备注"
            :value="record.description"
            value-class="desc-value"
          />
          <van-cell title="记录时间" :value="formatTime(record.createdAt)" />
        </van-cell-group>
      </div>

      <!-- 操作按钮 -->
      <div class="action-wrapper">
        <van-button
          type="danger"
          round
          block
          plain
          icon="delete-o"
          @click="showDeleteDialog"
        >
          删除此记录
        </van-button>
      </div>
    </template>

    <!-- 编辑模式 -->
    <template v-else>
      <div class="edit-wrapper">
        <van-form @submit="onEditSave" ref="editFormRef">
          <!-- 收支切换 -->
          <div class="type-toggle">
            <span
              :class="['type-option', 'type-expense', { active: editForm.type === 'expense' }]"
              @click="editForm.type = 'expense'"
            >
              支出
            </span>
            <span
              :class="['type-option', 'type-income', { active: editForm.type === 'income' }]"
              @click="editForm.type = 'income'"
            >
              收入
            </span>
          </div>

          <!-- 分类 -->
          <div class="category-section">
            <p class="section-label">分类</p>
            <div class="category-grid">
              <div
                v-for="cat in categories"
                :key="cat.key"
                :class="['category-item', { selected: editForm.category === cat.key }]"
                @click="editForm.category = cat.key"
              >
                <van-icon :name="cat.icon" :color="editForm.category === cat.key ? '#fff' : cat.color" size="22" />
                <span class="cat-label">{{ cat.label }}</span>
              </div>
            </div>
          </div>

          <!-- 金额 -->
          <van-field
            v-model="editForm.amount"
            name="amount"
            label="金额"
            placeholder="请输入金额"
            type="number"
            :rules="amountRules"
            input-align="right"
          />

          <!-- 商家 -->
          <van-field
            v-model="editForm.merchant"
            name="merchant"
            label="商家"
            placeholder="商家名称（选填）"
            input-align="right"
          />

          <!-- 支付时间 -->
          <van-field
            v-model="editForm.paymentTimeDisplay"
            is-link
            readonly
            name="paymentTime"
            label="支付时间"
            input-align="right"
            @click="showTimePicker = true"
          />

          <!-- 支付平台 -->
          <van-field
            v-model="editForm.platformLabel"
            is-link
            readonly
            name="platform"
            label="支付平台"
            input-align="right"
            @click="showPlatformPicker = true"
          />

          <!-- 订单编号 -->
          <van-field
            v-model="editForm.orderNumber"
            name="orderNumber"
            label="订单编号"
            placeholder="选填"
            input-align="right"
          />

          <!-- 备注 -->
          <van-field
            v-model="editForm.description"
            name="description"
            label="备注"
            placeholder="选填"
            type="textarea"
            rows="2"
            autosize
          />

          <!-- 保存按钮 -->
          <div class="submit-wrapper">
            <van-button type="primary" round block native-type="submit" :loading="editSaving">
              保存修改
            </van-button>
            <van-button type="default" round block plain class="cancel-btn" @click="isEditing = false">
              取消
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 编辑模式时间选择器 -->
      <van-popup v-model:show="showTimePicker" position="bottom" round>
        <div class="picker-header">
          <span class="picker-title">选择日期</span>
          <span class="picker-confirm" @click="onEditDateConfirm">确定</span>
        </div>
        <van-date-picker
          v-model="currentDate"
          :min-date="minDate"
          :max-date="maxDate"
          :columns-type="['year', 'month', 'day']"
        />
        <div class="time-row">
          <span class="time-label">时间</span>
          <van-stepper v-model="currentHour" :min="0" :max="23" integer class="time-stepper" />
          <span class="time-sep">:</span>
          <van-stepper v-model="currentMinute" :min="0" :max="59" integer class="time-stepper" />
        </div>
      </van-popup>

      <!-- 编辑模式平台选择器 -->
      <van-popup v-model:show="showPlatformPicker" position="bottom" round>
        <van-picker
          :columns="platformColumns"
          title="选择支付平台"
          @confirm="onEditPlatformConfirm"
          @cancel="showPlatformPicker = false"
        />
      </van-popup>
    </template>

    <!-- 删除确认弹窗 -->
    <van-dialog
      v-model:show="showDelete"
      title="确认删除"
      message="删除后无法恢复，确定要删除此记录吗？"
      show-cancel-button
      confirm-button-text="删除"
      confirm-button-color="#FF4D4F"
      @confirm="doDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecordsStore } from '../stores/records'
import { showToast, showDialog } from 'vant'

const router = useRouter()
const route = useRoute()
const store = useRecordsStore()

const record = ref(null)
const showDelete = ref(false)
const isEditing = ref(false)
const editSaving = ref(false)

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
  if (!record.value) return ''
  return platformMap[record.value.platform] || '其他'
})

const categoryLabel = computed(() => {
  if (!record.value) return ''
  return categoryMap[record.value.category] || '其他'
})

// 分类数据
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

// 编辑表单
const editFormRef = ref(null)
const editForm = reactive({
  type: 'expense',
  category: 'food',
  amount: '',
  merchant: '',
  paymentTime: '',
  paymentTimeDisplay: '',
  platform: '',
  platformLabel: '',
  orderNumber: '',
  description: ''
})

const amountRules = [
  { required: true, message: '请输入金额' },
  {
    validator: (val) => {
      const num = parseFloat(val)
      return num > 0
    },
    message: '金额必须大于 0'
  }
]

// 编辑模式下拉选择
const showTimePicker = ref(false)
const showPlatformPicker = ref(false)
const currentDate = ref([])
const currentHour = ref(0)
const currentMinute = ref(0)
const minDate = new Date(2020, 0, 1)
const maxDate = new Date()

const platformColumns = [
  { text: '微信支付', value: 'wechat' },
  { text: '支付宝', value: 'alipay' },
  { text: '银行卡', value: 'bank' },
  { text: '其他', value: 'other' }
]

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

onMounted(() => {
  const id = route.params.id
  const found = store.getRecordById(id)
  if (found) {
    record.value = found
  } else {
    showToast({ message: '记录不存在', icon: 'fail' })
    router.replace('/')
  }
})

function onBack() {
  if (isEditing.value) {
    // 有未保存的修改时确认
    if (hasUnsavedChanges()) {
      showDialog({
        title: '放弃修改',
        message: '当前有未保存的修改，确定放弃吗？',
        showCancelButton: true,
        confirmButtonText: '放弃',
        confirmButtonColor: '#FF4D4F'
      }).then(() => {
        isEditing.value = false
      }).catch(() => {})
    } else {
      isEditing.value = false
    }
  } else {
    router.back()
  }
}

function hasUnsavedChanges() {
  if (!record.value) return false
  const r = record.value
  return editForm.type !== (r.type || 'expense') ||
    editForm.category !== (r.category || 'other') ||
    editForm.amount !== String(r.amount) ||
    editForm.merchant !== (r.merchant || '') ||
    editForm.paymentTime !== r.paymentTime ||
    editForm.platform !== (r.platform || '') ||
    editForm.orderNumber !== (r.orderNumber || '') ||
    editForm.description !== (r.description || '')
}

// 进入编辑
function enterEdit() {
  if (!record.value) return
  const r = record.value
  const d = new Date(r.paymentTime)
  editForm.type = r.type || 'expense'
  editForm.category = r.category || 'other'
  editForm.amount = String(r.amount)
  editForm.merchant = r.merchant || ''
  editForm.paymentTime = r.paymentTime
  editForm.paymentTimeDisplay = formatTime(r.paymentTime)
  editForm.platform = r.platform
  editForm.platformLabel = platformMap[r.platform] || '其他'
  editForm.orderNumber = r.orderNumber
  editForm.description = r.description

  currentDate.value = [d.getFullYear(), d.getMonth() + 1, d.getDate()]
  currentHour.value = d.getHours()
  currentMinute.value = d.getMinutes()

  isEditing.value = true
}

// 编辑时间确认
function onEditDateConfirm() {
  const [y, m, d] = currentDate.value
  const date = new Date(y, m - 1, d, currentHour.value, currentMinute.value)
  editForm.paymentTime = date.toISOString()
  editForm.paymentTimeDisplay = formatTime(date)
  showTimePicker.value = false
}

// 编辑平台确认
function onEditPlatformConfirm({ selectedOptions }) {
  editForm.platform = selectedOptions[0].value
  editForm.platformLabel = selectedOptions[0].text
  showPlatformPicker.value = false
}

// 保存编辑
function onEditSave() {
  if (editSaving.value) return
  editSaving.value = true

  store.updateRecord(record.value.id, {
    type: editForm.type,
    amount: parseFloat(editForm.amount),
    category: editForm.category,
    merchant: editForm.merchant,
    paymentTime: editForm.paymentTime,
    platform: editForm.platform,
    orderNumber: editForm.orderNumber,
    description: editForm.description
  })

  // 刷新当前记录的显示
  record.value = store.getRecordById(record.value.id)
  isEditing.value = false
  showToast({ message: '修改成功', icon: 'success', duration: 1500 })
  setTimeout(() => { editSaving.value = false }, 500)
}

// 删除
function showDeleteDialog() {
  showDelete.value = true
}

function doDelete() {
  store.deleteRecord(record.value.id)
  showToast({ message: '已删除', icon: 'success', duration: 1500 })
  router.replace('/')
}
</script>

<style scoped>
.loading {
  padding-top: 120px;
}

/* 查看模式 */
.amount-section {
  text-align: center;
  padding: var(--spacing-xxl) 0 var(--spacing-lg);
}

.amount-number {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
}

.income-color {
  color: #52C41A;
}

.expense-color {
  color: #FF4D4F;
}

.amount-tags {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: var(--font-size-caption);
}

.type-income {
  background: #F0FFF4;
  color: #52C41A;
}

.type-expense {
  background: #FFF1F0;
  color: #FF4D4F;
}

.detail-list {
  margin-bottom: var(--spacing-xxl);
}

.order-value {
  font-size: var(--font-size-caption);
  word-break: break-all;
}

.desc-value {
  color: var(--color-text-secondary);
}

.action-wrapper {
  padding: 0 var(--spacing-lg);
}

/* 编辑模式 */
.edit-wrapper {
  padding-top: var(--spacing-md);
}

.type-toggle {
  display: flex;
  margin: 0 var(--spacing-lg) var(--spacing-lg);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--border-color);
}

.type-option {
  flex: 1;
  text-align: center;
  padding: var(--spacing-md);
  font-size: var(--font-size-h3);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-card);
  color: var(--color-text-secondary);
}

.type-option.type-expense.active {
  background: #FF4D4F;
  color: #fff;
}

.type-option.type-income.active {
  background: #52C41A;
  color: #fff;
}

.category-section {
  margin: 0 var(--spacing-lg) var(--spacing-lg);
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

.submit-wrapper {
  padding: var(--spacing-xxl) var(--spacing-lg);
}

.cancel-btn {
  margin-top: var(--spacing-md);
}

/* 选择器 */
.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.picker-title {
  font-size: var(--font-size-h3);
  font-weight: 600;
}

.picker-confirm {
  color: var(--color-primary);
  font-size: var(--font-size-body);
  cursor: pointer;
}

.time-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-xxl);
  gap: var(--spacing-md);
}

.time-label {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
}

.time-stepper {
  width: 80px;
}

.time-sep {
  font-size: var(--font-size-h2);
  font-weight: 600;
}
</style>
