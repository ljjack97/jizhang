/**
 * API 接口层
 *
 * 当前版本：直接操作 Pinia Store（Mock 模式）
 * 未来对接后端时，将以下方法改为 fetch/axios 调用即可，
 * 其他文件（views/components）无需修改。
 */

import { useRecordsStore } from '../stores/records'

function getStore() {
  return useRecordsStore()
}

// 获取记录列表
export function fetchRecords({ page = 1, pageSize = 20 } = {}) {
  const store = getStore()
  const all = store.sortedRecords
  const start = (page - 1) * pageSize
  const records = all.slice(start, start + pageSize)
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: { records, total: all.length, page, pageSize }
  })
}

// 获取单条记录
export function fetchRecordById(id) {
  const store = getStore()
  const record = store.getRecordById(id)
  if (!record) {
    return Promise.resolve({ code: 1002, message: '记录不存在', data: null })
  }
  return Promise.resolve({ code: 0, message: 'success', data: record })
}

// 新增记录
export function createRecord(data) {
  const store = getStore()
  const record = store.addRecord(data)
  return Promise.resolve({ code: 0, message: 'success', data: record })
}

// 删除记录
export function removeRecord(id) {
  const store = getStore()
  const ok = store.deleteRecord(id)
  if (!ok) {
    return Promise.resolve({ code: 1002, message: '记录不存在', data: null })
  }
  return Promise.resolve({ code: 0, message: 'success', data: null })
}

// 搜索记录
export function searchRecords({ keyword, startDate, endDate } = {}) {
  const store = getStore()
  const records = store.searchRecords({ keyword, startDate, endDate })
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: { records, total: records.length }
  })
}

// === 爬虫相关（预留） ===

export function triggerScrape(platforms = []) {
  // TODO: 对接后端爬虫接口
  console.log('爬虫触发（预留）:', platforms)
  return Promise.resolve({
    code: 0,
    message: '爬虫功能尚未接入后端',
    data: { taskId: null }
  })
}

export function getScrapeStatus() {
  // TODO: 对接后端爬虫状态接口
  return Promise.resolve({
    code: 0,
    message: 'success',
    data: {
      status: 'idle',
      lastRunTime: null,
      lastResult: null
    }
  })
}
