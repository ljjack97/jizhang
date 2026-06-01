<template>
  <div class="page-container">
    <van-nav-bar
      :title="isAutoMode ? '快速记账' : '添加记录'"
      left-text="返回"
      left-arrow
      fixed
      placeholder
      @click-left="router.back"
    />

    <!-- 自动预填提示 -->
    <div class="auto-hint" v-if="isAutoMode">
      <van-icon name="info-o" size="14" />
      <span>已从剪贴板识别信息，请确认后保存</span>
    </div>

    <!-- 截图识别入口 -->
    <div class="ocr-section" v-if="!isAutoMode">
      <div class="ocr-trigger" role="button" tabindex="0" @click="showOcrPanel = !showOcrPanel" @keydown.enter.prevent="showOcrPanel = !showOcrPanel">
        <van-icon name="scan" size="18" />
        <span>截图识别</span>
        <van-icon :name="showOcrPanel ? 'arrow-up' : 'arrow-down'" size="14" class="ocr-arrow" />
      </div>
      <div class="ocr-panel" v-show="showOcrPanel">
        <div class="ocr-buttons">
          <van-button size="small" icon="description" type="primary" plain round @click="onReadClipboard">
            读取剪贴板
          </van-button>
          <van-button size="small" icon="photograph" type="default" plain round @click="onUploadScreenshot">
            上传截图
          </van-button>
        </div>
        <!-- 截图预览 -->
        <div class="ocr-image-preview" v-if="screenshotUrl">
          <img :src="screenshotUrl" alt="截图预览" />
          <van-icon name="cross" class="ocr-img-close" @click="screenshotUrl = ''" />
        </div>
        <!-- 手动输入识别文本 -->
        <div class="ocr-text-area">
          <van-field
            v-model="ocrText"
            type="textarea"
            rows="3"
            autosize
            placeholder="粘贴或输入截图中的支付文本，如：微信支付 ¥12.34 麦当劳"
          />
        </div>
        <van-button
          v-if="ocrText.trim()"
          size="small"
          type="primary"
          round
          block
          class="ocr-parse-btn"
          @click="onOcrParse"
        >
          识别并预填
        </van-button>
        <input
          ref="screenshotInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="onScreenshotSelected"
        />
      </div>
    </div>

    <div class="form-wrapper">
      <van-form @submit="onSubmit" ref="formRef">
        <!-- 收入/支出切换 -->
        <div class="type-toggle">
          <span
            :class="['type-option', 'type-expense', { active: form.type === 'expense' }]"
            @click="form.type = 'expense'"
          >
            支出
          </span>
          <span
            :class="['type-option', 'type-income', { active: form.type === 'income' }]"
            @click="form.type = 'income'"
          >
            收入
          </span>
        </div>

        <!-- 消费分类 -->
        <div class="category-section">
          <p class="section-label">分类</p>
          <div class="category-grid">
            <div
              v-for="cat in categories"
              :key="cat.key"
              :class="['category-item', { selected: form.category === cat.key }]"
              @click="form.category = cat.key"
            >
              <van-icon :name="cat.icon" :color="form.category === cat.key ? '#fff' : cat.color" size="22" />
              <span class="cat-label">{{ cat.label }}</span>
            </div>
          </div>
        </div>

        <!-- 金额 -->
        <van-field
          v-model="form.amount"
          name="amount"
          label="金额"
          placeholder="请输入金额"
          type="number"
          :rules="amountRules"
          input-align="right"
        >
          <template #left-icon>
            <span :class="['currency-sign', form.type === 'income' ? 'income-color' : 'expense-color']">
              {{ form.type === 'income' ? '+' : '-' }}¥
            </span>
          </template>
        </van-field>

        <!-- 商家名称 -->
        <van-field
          v-model="form.merchant"
          name="merchant"
          label="商家"
          placeholder="商家名称（选填）"
          input-align="right"
        />

        <!-- 支付时间 -->
        <van-field
          v-model="form.paymentTimeDisplay"
          is-link
          readonly
          name="paymentTime"
          label="支付时间"
          placeholder="选择支付时间"
          :rules="[{ required: true, message: '请选择支付时间' }]"
          input-align="right"
          @click="showTimePicker = true"
        />

        <!-- 支付平台 -->
        <van-field
          v-model="form.platformLabel"
          is-link
          readonly
          name="platform"
          label="支付平台"
          placeholder="选择平台"
          :rules="[{ required: true, message: '请选择支付平台' }]"
          input-align="right"
          @click="showPlatformPicker = true"
        />

        <!-- 订单编号 -->
        <van-field
          v-model="form.orderNumber"
          name="orderNumber"
          label="订单编号"
          placeholder="选填"
          input-align="right"
        />

        <!-- 备注 -->
        <van-field
          v-model="form.description"
          name="description"
          label="备注"
          placeholder="选填"
          type="textarea"
          rows="2"
          autosize
        />

        <!-- 提交按钮 -->
        <div class="submit-wrapper">
          <van-button
            type="primary"
            round
            block
            native-type="submit"
            :loading="submitting"
          >
            保存记录
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 日期时间选择器弹窗 -->
    <van-popup v-model:show="showTimePicker" position="bottom" round>
      <div class="picker-header">
        <span class="picker-title">选择日期</span>
        <span class="picker-confirm" @click="onDateConfirm">确定</span>
      </div>
      <van-date-picker
        v-model="currentDate"
        :min-date="minDate"
        :max-date="maxDate"
        title="选择日期"
        :columns-type="['year', 'month', 'day']"
      />
      <div class="time-row">
        <span class="time-label">时间</span>
        <van-stepper
          v-model="currentHour"
          :min="0" :max="23"
          integer
          class="time-stepper"
        />
        <span class="time-sep">:</span>
        <van-stepper
          v-model="currentMinute"
          :min="0" :max="59"
          integer
          class="time-stepper"
        />
      </div>
    </van-popup>

    <!-- 平台选择器弹窗 -->
    <van-popup v-model:show="showPlatformPicker" position="bottom" round>
      <van-picker
        :columns="platformColumns"
        title="选择支付平台"
        @confirm="onPlatformConfirm"
        @cancel="showPlatformPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecordsStore } from '../stores/records'
import { useClipboardStore } from '../stores/clipboard'
import { readClipboard, parsePaymentText } from '../utils/clipboard'
import { useInteraction } from '../composables/useInteraction'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const store = useRecordsStore()
const clipboardStore = useClipboardStore()
const { feedbackSuccess } = useInteraction()

const formRef = ref(null)
const submitting = ref(false)

// 自动预填模式（?auto=1）
const isAutoMode = computed(() => route.query.auto === '1')

const now = new Date()

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

// 表单数据
const form = reactive({
  type: 'expense',
  category: 'food',
  amount: '',
  merchant: '',
  paymentTime: now.toISOString(),
  paymentTimeDisplay: formatDisplay(now),
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

function formatDisplay(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

// 时间选择器
const showTimePicker = ref(false)
const currentDate = ref([now.getFullYear(), now.getMonth() + 1, now.getDate()])
const currentHour = ref(now.getHours())
const currentMinute = ref(now.getMinutes())
const minDate = new Date(2020, 0, 1)
const maxDate = new Date()

function onDateConfirm() {
  const [y, m, d] = currentDate.value
  const date = new Date(y, m - 1, d, currentHour.value, currentMinute.value)
  form.paymentTime = date.toISOString()
  form.paymentTimeDisplay = formatDisplay(date)
  showTimePicker.value = false
}

// 平台选择器
const showPlatformPicker = ref(false)
const platformColumns = [
  { text: '微信支付', value: 'wechat' },
  { text: '支付宝', value: 'alipay' },
  { text: '银行卡', value: 'bank' },
  { text: '其他', value: 'other' }
]

function onPlatformConfirm({ selectedOptions }) {
  form.platform = selectedOptions[0].value
  form.platformLabel = selectedOptions[0].text
  showPlatformPicker.value = false
}

// 截图识别
const showOcrPanel = ref(false)
const ocrText = ref('')
const screenshotUrl = ref('')
const screenshotInput = ref(null)

async function onReadClipboard() {
  try {
    const text = await readClipboard()
    if (!text) {
      showToast({ message: '剪贴板为空，请先复制支付通知文本', duration: 2000 })
      return
    }
    ocrText.value = text
    const parsed = parsePaymentText(text)
    if (parsed) {
      applyOcrResult(parsed)
      showToast({ message: `已识别：¥${parsed.amount} ${parsed.merchant || ''}`, icon: 'success', duration: 2000 })
    } else {
      showToast({ message: '未识别到金额信息，请手动修改文本', duration: 2000 })
    }
  } catch {
    showToast({ message: '无法读取剪贴板，请授权后重试', duration: 2000 })
  }
}

function onUploadScreenshot() {
  if (screenshotInput.value) {
    screenshotInput.value.click()
  }
}

function onScreenshotSelected(event) {
  const file = event.target.files[0]
  if (!file) return
  screenshotUrl.value = URL.createObjectURL(file)
  showToast({ message: '请对照截图输入或粘贴支付文本', duration: 2000 })
  event.target.value = ''
}

function onOcrParse() {
  const parsed = parsePaymentText(ocrText.value)
  if (parsed) {
    applyOcrResult(parsed)
    showToast({ message: `已识别：¥${parsed.amount} ${parsed.merchant || ''}`, icon: 'success', duration: 2000 })
  } else {
    showToast({ message: '未识别到有效金额，请检查文本', duration: 2000 })
  }
}

function applyOcrResult(data) {
  form.type = data.type || 'expense'
  form.category = data.category || 'other'
  if (data.amount) form.amount = String(data.amount)
  if (data.merchant) form.merchant = data.merchant
  if (data.platform && data.platform !== 'other') {
    form.platform = data.platform
    const platformLabels = { wechat: '微信支付', alipay: '支付宝', bank: '银行卡', other: '其他' }
    form.platformLabel = platformLabels[data.platform] || '其他'
  }
}

// 自动预填：从剪贴板 Store 获取数据
onMounted(() => {
  if (isAutoMode.value) {
    const data = clipboardStore.consumeData()
    if (data) {
      form.type = data.type || 'expense'
      form.category = data.category || 'other'
      if (data.amount) form.amount = String(data.amount)
      if (data.merchant) form.merchant = data.merchant
      if (data.platform) {
        form.platform = data.platform
        const platformLabels = { wechat: '微信支付', alipay: '支付宝', bank: '银行卡', other: '其他' }
        form.platformLabel = platformLabels[data.platform] || '其他'
      }
    }
  }
})

// 提交
function onSubmit() {
  submitting.value = true

  store.addRecord({
    type: form.type,
    amount: parseFloat(form.amount),
    category: form.category,
    merchant: form.merchant,
    paymentTime: form.paymentTime,
    orderNumber: form.orderNumber,
    platform: form.platform,
    description: form.description
  })

  setTimeout(() => {
    submitting.value = false
    feedbackSuccess()
    showToast({ message: '添加成功', icon: 'success', duration: 1500 })
    router.replace('/')
  }, 300)
}
</script>

<style scoped>
/* 截图识别 */
.ocr-section {
  margin: var(--spacing-md) var(--spacing-lg);
}

.ocr-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, #EDE7F6, #E0DAF0);
  border: 1px solid #C4B5E0;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: var(--font-size-body);
  color: #4A3DB8;
  font-weight: 600;
  transition: all 0.2s;
}

.ocr-trigger:active {
  background: #EDE7F6;
}

.ocr-arrow {
  margin-left: auto;
  transition: transform 0.2s;
}

.ocr-panel {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.ocr-buttons {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.ocr-buttons .van-button {
  flex: 1;
}

.ocr-image-preview {
  position: relative;
  margin-bottom: var(--spacing-md);
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.ocr-image-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  background: #f5f5f5;
}

.ocr-img-close {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border-radius: 50%;
  padding: 4px;
  font-size: 12px;
  cursor: pointer;
}

.ocr-text-area {
  margin-bottom: var(--spacing-sm);
}

.ocr-text-area :deep(.van-field) {
  background: var(--bg-page);
  border-radius: var(--radius-sm);
}

.ocr-parse-btn {
  margin-top: var(--spacing-sm);
}

/* 自动预填提示 */
.auto-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: var(--spacing-md) var(--spacing-lg);
  padding: var(--spacing-sm) var(--spacing-md);
  background: #FFF9D6;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-caption);
  color: #7A6300;
  font-weight: 500;
}

.form-wrapper {
  padding-top: var(--spacing-md);
}

/* 收支切换 */
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

/* 分类 */
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

/* 金额符号 */
.currency-sign {
  font-size: 18px;
  font-weight: 700;
  margin-right: var(--spacing-sm);
}

.income-color {
  color: #52C41A;
}

.expense-color {
  color: #FF4D4F;
}

.submit-wrapper {
  padding: var(--spacing-xxl) var(--spacing-lg);
}

/* 日期时间选择器 */
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
