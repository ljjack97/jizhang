/**
 * localStorage 工具函数
 */

const PREFIX = 'jizhang-'

export function getStorage(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStorage(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeStorage(key) {
  try {
    localStorage.removeItem(PREFIX + key)
    return true
  } catch {
    return false
  }
}
