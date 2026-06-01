/**
 * 震动反馈工具
 *
 * 封装 navigator.vibrate()，提供预设的震动模式。
 * - Android 原生支持
 * - iOS 不支持（静默失败）
 */

/**
 * 检查设备是否支持震动
 */
export function isVibrateSupported() {
  return typeof navigator.vibrate === 'function'
}

/**
 * 短震动 — 按钮点击反馈
 * @param {number} duration - 震动时长 (ms)，默认 10
 */
export function vibrateShort(duration = 10) {
  if (isVibrateSupported()) {
    navigator.vibrate(duration)
  }
}

/**
 * 成功震动 — 双脉冲（确认操作完成）
 */
export function vibrateSuccess() {
  if (isVibrateSupported()) {
    navigator.vibrate([30, 60, 30])
  }
}

/**
 * 警告震动 — 三短脉冲（用于错误/删除确认等）
 */
export function vibrateWarning() {
  if (isVibrateSupported()) {
    navigator.vibrate([40, 50, 40, 50, 40])
  }
}

/**
 * 摇一摇震动 — 中等强度单次（摇动检测到时的反馈）
 */
export function vibrateShake() {
  if (isVibrateSupported()) {
    navigator.vibrate(50)
  }
}

/**
 * 长震动 — 强调操作（如删除完成）
 */
export function vibrateLong(duration = 200) {
  if (isVibrateSupported()) {
    navigator.vibrate(duration)
  }
}

/**
 * 停止震动
 */
export function vibrateStop() {
  if (isVibrateSupported()) {
    navigator.vibrate(0)
  }
}
