import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 生成简单的唯一 ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export const useRecordsStore = defineStore('records', () => {
  // 状态
  const records = ref([])

  // 计算属性：按支付时间倒序
  const sortedRecords = computed(() => {
    return [...records.value].sort((a, b) =>
      new Date(b.paymentTime) - new Date(a.paymentTime)
    )
  })

  // 根据 ID 获取单条记录
  function getRecordById(id) {
    return records.value.find(r => r.id === id) || null
  }

  // 新增记录
  function addRecord(record) {
    const newRecord = {
      id: generateId(),
      type: record.type || 'expense',
      amount: Number(record.amount),
      category: record.category || 'other',
      paymentTime: record.paymentTime || new Date().toISOString(),
      merchant: record.merchant || '',
      platform: record.platform || 'other',
      orderNumber: record.orderNumber || '',
      description: record.description || '',
      createdAt: new Date().toISOString()
    }
    records.value.push(newRecord)
    return newRecord
  }

  // 更新记录
  function updateRecord(id, data) {
    const record = records.value.find(r => r.id === id)
    if (!record) return false
    if (data.type !== undefined) record.type = data.type
    if (data.amount !== undefined) record.amount = Number(data.amount)
    if (data.category !== undefined) record.category = data.category
    if (data.paymentTime !== undefined) record.paymentTime = data.paymentTime
    if (data.merchant !== undefined) record.merchant = data.merchant
    if (data.platform !== undefined) record.platform = data.platform
    if (data.orderNumber !== undefined) record.orderNumber = data.orderNumber
    if (data.description !== undefined) record.description = data.description
    return true
  }

  // 清除全部记录
  function clearAllRecords() {
    records.value = []
  }

  // 删除记录
  function deleteRecord(id) {
    const index = records.value.findIndex(r => r.id === id)
    if (index !== -1) {
      records.value.splice(index, 1)
      return true
    }
    return false
  }

  // 搜索记录
  function searchRecords({ keyword, startDate, endDate } = {}) {
    let result = [...sortedRecords.value]

    if (keyword) {
      const kw = keyword.toLowerCase()
      result = result.filter(r =>
        r.orderNumber.toLowerCase().includes(kw) ||
        r.description.toLowerCase().includes(kw) ||
        String(r.amount).includes(kw) ||
        (r.merchant && r.merchant.toLowerCase().includes(kw))
      )
    }

    if (startDate) {
      result = result.filter(r => r.paymentTime >= startDate)
    }

    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      result = result.filter(r => r.paymentTime < endDateTime.toISOString())
    }

    return result
  }

  return {
    records,
    sortedRecords,
    getRecordById,
    addRecord,
    updateRecord,
    deleteRecord,
    clearAllRecords,
    searchRecords
  }
}, {
  persist: {
    key: 'jizhang-records',
    storage: localStorage
  }
})
