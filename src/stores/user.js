import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 用户信息（当前为 Mock 数据，后续对接后端）
  const avatar = ref('')
  const nickname = ref('用户')
  const phone = ref('138****8888')
  const isLoggedIn = ref(true) // 模拟已登录状态

  // 更新用户信息
  function updateProfile(data) {
    if (data.nickname !== undefined) nickname.value = data.nickname
    if (data.phone !== undefined) phone.value = data.phone
    if (data.avatar !== undefined) avatar.value = data.avatar
  }

  // 退出登录
  function logout() {
    // TODO: 对接后端退出登录接口
    isLoggedIn.value = false
    avatar.value = ''
    nickname.value = ''
    phone.value = ''
  }

  // 登录
  function login() {
    // TODO: 对接后端登录接口
    isLoggedIn.value = true
    nickname.value = '用户'
    phone.value = '138****8888'
  }

  return {
    avatar,
    nickname,
    phone,
    isLoggedIn,
    updateProfile,
    logout,
    login
  }
}, {
  persist: {
    key: 'jizhang-user',
    storage: localStorage
  }
})
