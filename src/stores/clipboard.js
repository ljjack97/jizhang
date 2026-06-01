/**
 * 剪贴板临时数据 Store
 * 不持久化，仅用于组件间传递解析结果
 * 用于：剪贴板解析 → AutoAddPopup → Add.vue 预填
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useClipboardStore = defineStore('clipboard', () => {
  // 暂存的解析结果（不持久化）
  const parsedData = ref(null)

  /**
   * 设置解析数据
   * @param {{ amount: number, merchant: string, platform: string, category: string, type: string } | null} data
   */
  function setParsedData(data) {
    parsedData.value = data
  }

  /**
   * 获取并清除数据（消费一次）
   */
  function consumeData() {
    const data = parsedData.value
    parsedData.value = null
    return data
  }

  /**
   * 清除数据
   */
  function clearData() {
    parsedData.value = null
  }

  return {
    parsedData,
    setParsedData,
    consumeData,
    clearData
  }
})
