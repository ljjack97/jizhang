/**
 * 交互反馈组合式函数
 *
 * 整合摇一摇、音效、震动，统一管理交互反馈；
 * 所有反馈受用户偏好开关控制。
 */

import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePreferencesStore } from '../stores/preferences'
import {
  isShakeSupported,
  startShakeListener
} from '../utils/shake'
import {
  playSuccessSound,
  playTapSound,
  playShakeDetectedSound,
  playDeleteSound,
  playToggleSound
} from '../utils/sound'
import {
  isVibrateSupported,
  vibrateSuccess,
  vibrateShort,
  vibrateShake,
  vibrateWarning
} from '../utils/vibrate'

export function useInteraction() {
  const prefs = usePreferencesStore()
  const router = useRouter()

  // ===== 音效 =====
  function sfx(name) {
    if (!prefs.soundEnabled) return
    switch (name) {
      case 'success': playSuccessSound(); break
      case 'tap': playTapSound(); break
      case 'shake': playShakeDetectedSound(); break
      case 'delete': playDeleteSound(); break
      case 'toggle': playToggleSound(); break
    }
  }

  // ===== 震动 =====
  function haptic(name) {
    if (!prefs.vibrateEnabled) return
    switch (name) {
      case 'success': vibrateSuccess(); break
      case 'tap': vibrateShort(); break
      case 'shake': vibrateShake(); break
      case 'warning': vibrateWarning(); break
    }
  }

  // ===== 组合反馈 =====
  /** 成功反馈（添加记录成功、保存成功） */
  function feedbackSuccess() {
    sfx('success')
    haptic('success')
  }

  /** 点击反馈（按钮、开关） */
  function feedbackTap() {
    sfx('tap')
    haptic('tap')
  }

  /** 删除反馈 */
  function feedbackDelete() {
    sfx('delete')
    haptic('warning')
  }

  /** 开关切换反馈 */
  function feedbackToggle() {
    sfx('toggle')
    haptic('tap')
  }

  /** 摇一摇检测反馈 */
  function feedbackShakeDetected() {
    sfx('shake')
    haptic('shake')
  }

  // ===== 摇一摇监听 =====
  let stopShake = null

  function onShakeDetected() {
    feedbackShakeDetected()
    // 跳转到添加页面
    router.push('/add')
  }

  function enableShake() {
    if (!prefs.shakeEnabled) return
    if (!isShakeSupported()) return
    if (stopShake) return // 已启用

    stopShake = startShakeListener(onShakeDetected, {
      threshold: 15,
      cooldown: 1500
    })
  }

  function disableShake() {
    if (stopShake) {
      stopShake()
      stopShake = null
    }
  }

  // 首屏加载时启用（如果开关打开）
  onMounted(() => {
    enableShake()
  })

  onUnmounted(() => {
    disableShake()
  })

  return {
    // 能力检测
    isShakeSupported,
    isVibrateSupported,
    // 反馈方法
    feedbackSuccess,
    feedbackTap,
    feedbackDelete,
    feedbackToggle,
    feedbackShakeDetected,
    // 摇一摇
    enableShake,
    disableShake
  }
}
