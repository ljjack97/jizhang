import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePreferencesStore = defineStore('preferences', () => {
  // 添加按钮样式：'fab'（悬浮）| 'topbar'（顶部导航栏）
  const addButtonStyle = ref('fab')

  // 交互开关
  const shakeEnabled = ref(true)
  const soundEnabled = ref(true)
  const vibrateEnabled = ref(true)

  function setAddButtonStyle(style) {
    if (style === 'fab' || style === 'topbar') {
      addButtonStyle.value = style
    }
  }

  function setShakeEnabled(val) {
    shakeEnabled.value = val
  }

  function setSoundEnabled(val) {
    soundEnabled.value = val
  }

  function setVibrateEnabled(val) {
    vibrateEnabled.value = val
  }

  return {
    addButtonStyle,
    shakeEnabled,
    soundEnabled,
    vibrateEnabled,
    setAddButtonStyle,
    setShakeEnabled,
    setSoundEnabled,
    setVibrateEnabled
  }
}, {
  persist: {
    key: 'jizhang-preferences',
    storage: localStorage
  }
})
