/**
 * 摇一摇检测工具
 *
 * 使用 DeviceMotion API 检测手机摇动，触发回调。
 * - iOS 13+ 需要用户手势触发 requestPermission()
 * - 通过加速度变化阈值判断摇动
 * - 内置防抖：触发后冷却 1 秒
 */

const SHAKE_THRESHOLD = 15       // 加速度阈值 (m/s²)
const SHAKE_COOLDOWN = 1000      // 冷却时间 (ms)
const SHAKE_SAMPLE_WINDOW = 300  // 采样窗口 (ms)

let lastTriggerTime = 0
let permissionRequested = false
let listeners = []

/**
 * 请求 DeviceMotion 权限（iOS 13+ 需要）
 * 必须在用户手势（click/touchend）中调用
 * @returns {Promise<'granted'|'denied'|'unavailable'>}
 */
export async function requestShakePermission() {
  // 检查是否支持 DeviceMotionEvent
  if (typeof DeviceMotionEvent === 'undefined') {
    return 'unavailable'
  }

  // iOS 13+ 需要 requestPermission
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const response = await DeviceMotionEvent.requestPermission()
      permissionRequested = true
      return response === 'granted' ? 'granted' : 'denied'
    } catch {
      return 'denied'
    }
  }

  // Android / 桌面：无需权限，直接返回 granted
  permissionRequested = true
  return 'granted'
}

/**
 * 检查是否支持摇一摇
 */
export function isShakeSupported() {
  return typeof DeviceMotionEvent !== 'undefined'
}

/**
 * 开启摇一摇监听
 * @param {Function} callback - 摇动触发时的回调
 * @param {Object} options
 * @param {number} options.threshold - 加速度阈值，默认 15
 * @param {number} options.cooldown - 冷却时间 (ms)，默认 1000
 * @returns {Function} 取消监听的函数
 */
export function startShakeListener(callback, options = {}) {
  if (typeof DeviceMotionEvent === 'undefined') {
    console.warn('[shake] DeviceMotion not supported')
    return () => {}
  }

  const threshold = options.threshold || SHAKE_THRESHOLD
  const cooldown = options.cooldown || SHAKE_COOLDOWN

  let lastX = 0, lastY = 0, lastZ = 0
  let lastSampleTime = 0

  function handleMotion(event) {
    const acc = event.accelerationIncludingGravity
    if (!acc) return

    const { x, y, z } = acc
    const now = Date.now()

    // 采样间隔控制
    if (now - lastSampleTime < 50) return
    lastSampleTime = now

    // 计算加速度变化量
    const deltaX = Math.abs(x - lastX)
    const deltaY = Math.abs(y - lastY)
    const deltaZ = Math.abs(z - lastZ)

    lastX = x; lastY = y; lastZ = z

    // 综合变化判断
    const delta = Math.max(deltaX, deltaY, deltaZ)

    if (delta > threshold) {
      // 冷却时间检查
      if (now - lastTriggerTime < cooldown) return
      lastTriggerTime = now

      callback()
    }
  }

  window.addEventListener('devicemotion', handleMotion)
  listeners.push({ handler: handleMotion })

  return () => {
    window.removeEventListener('devicemotion', handleMotion)
    listeners = listeners.filter(l => l.handler !== handleMotion)
  }
}

/**
 * 移除所有摇一摇监听器
 */
export function stopAllShakeListeners() {
  listeners.forEach(({ handler }) => {
    window.removeEventListener('devicemotion', handler)
  })
  listeners = []
}
