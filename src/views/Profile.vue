<template>
  <div class="page-container">
    <!-- 顶部导航 -->
    <van-nav-bar title="我的" fixed placeholder />

    <!-- 用户信息卡片 -->
    <div class="profile-card">
      <div class="avatar-wrapper" @click="showAvatarPreview = true">
        <van-image
          round
          width="64"
          height="64"
          :src="user.avatar || defaultAvatar"
          fit="cover"
        />
      </div>
      <div class="user-info">
        <p class="user-name">{{ user.nickname || '未设置昵称' }}</p>
        <p class="user-phone">{{ user.phone || '未绑定手机号' }}</p>
      </div>
    </div>

    <!-- 菜单列表 -->
    <van-cell-group inset class="menu-group">
      <van-cell title="头像" is-link @click="showAvatarPreview = true" />
      <van-cell title="昵称" :value="user.nickname" is-link @click="showEditDialog" />
      <van-cell title="手机号" :value="user.phone" is-link @click="showPhoneDialog" />
      <van-cell title="设置" is-link @click="goSettings" />
    </van-cell-group>

    <!-- 退出登录 -->
    <div class="logout-wrapper">
      <van-button
        type="danger"
        round
        block
        plain
        @click="showLogoutDialog"
      >
        退出登录
      </van-button>
    </div>

    <!-- 退出登录确认弹窗 -->
    <van-dialog
      v-model:show="showLogout"
      title="确认退出"
      message="退出后需要重新登录，确定退出吗？"
      show-cancel-button
      confirm-button-text="退出"
      confirm-button-color="#FF4D4F"
      @confirm="doLogout"
    />

    <!-- 编辑昵称弹窗 -->
    <van-dialog
      v-model:show="showEdit"
      title="修改昵称"
      show-cancel-button
      confirm-button-text="保存"
      confirm-button-color="#5B9BD5"
      @confirm="onNicknameSave"
    >
      <div class="edit-dialog">
        <van-field
          v-model="editNickname"
          placeholder="请输入新昵称"
          maxlength="20"
        />
      </div>
    </van-dialog>

    <!-- 修改手机号弹窗 -->
    <van-dialog
      v-model:show="showPhone"
      title="修改手机号"
      show-cancel-button
      confirm-button-text="保存"
      confirm-button-color="#5B9BD5"
      @confirm="onPhoneSave"
    >
      <div class="edit-dialog">
        <van-field
          v-model="editPhone"
          placeholder="请输入新手机号"
          type="tel"
          maxlength="11"
        />
      </div>
    </van-dialog>

    <!-- 头像放大预览 -->
    <van-overlay :show="showAvatarPreview" lock-scroll>
      <div class="avatar-overlay-bg" @click="showAvatarPreview = false">
        <div class="avatar-preview-wrapper" @click.stop>
          <div class="avatar-preview-img">
            <van-image
              round
              width="200"
              height="200"
              :src="user.avatar || defaultAvatar"
              fit="cover"
            />
          </div>
          <!-- 毛玻璃修改按钮 -->
          <div class="avatar-modify-btn" @click="onAvatarModify">
            <van-icon name="photograph" size="16" />
            <span>更换头像</span>
          </div>
          <div class="avatar-close-hint">点击空白处关闭</div>
        </div>
      </div>
    </van-overlay>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { showToast } from 'vant'

const router = useRouter()
const user = useUserStore()

const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIzMiIgZmlsbD0iI0U4RjRGRCIvPjx0ZXh0IHg9IjMyIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyOCIgZmlsbD0iIzVCOUJENSI+8J+RpDwvdGV4dD48L3N2Zz4='

// 退出登录
const showLogout = ref(false)

function showLogoutDialog() {
  showLogout.value = true
}

function doLogout() {
  user.logout()
  showToast({ message: '已退出登录', duration: 1500 })
}

// 编辑昵称
const showEdit = ref(false)
const editNickname = ref('')

function showEditDialog() {
  editNickname.value = user.nickname
  showEdit.value = true
}

function onNicknameSave() {
  if (editNickname.value.trim()) {
    user.updateProfile({ nickname: editNickname.value.trim() })
    showToast({ message: '昵称已更新', duration: 1000 })
  }
}

// 修改手机号
const showPhone = ref(false)
const editPhone = ref('')

function showPhoneDialog() {
  editPhone.value = user.phone
  showPhone.value = true
}

function onPhoneSave() {
  const phone = editPhone.value.trim()
  if (phone && /^\d{11}$/.test(phone)) {
    // 保存时自动脱敏显示
    const masked = phone.slice(0, 3) + '****' + phone.slice(7)
    user.updateProfile({ phone: masked })
    showToast({ message: '手机号已更新', duration: 1000 })
  } else if (phone) {
    showToast({ message: '请输入正确的11位手机号', duration: 1500 })
  }
}

// 头像放大预览
const showAvatarPreview = ref(false)

function onAvatarModify() {
  showToast({ message: '头像更换功能开发中', duration: 1500 })
}

// 导航
function goSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  padding: var(--spacing-xxl) var(--spacing-xl);
  background: linear-gradient(135deg, #4A8BC5, #6EB8D3);
  margin-bottom: var(--spacing-lg);
}

.avatar-wrapper {
  margin-right: var(--spacing-lg);
  cursor: pointer;
  transition: transform 0.2s;
}

.avatar-wrapper:active {
  transform: scale(0.95);
}

.user-info {
  color: #ffffff;
}

.user-name {
  font-size: var(--font-size-h2);
  font-weight: 600;
  margin-bottom: 4px;
}

.user-phone {
  font-size: var(--font-size-caption);
  opacity: 0.85;
}

.menu-group {
  margin-bottom: var(--spacing-xxl);
}

.logout-wrapper {
  padding: 0 var(--spacing-lg);
}

.edit-dialog {
  padding: var(--spacing-lg);
}

/* 头像放大预览 */
.avatar-overlay-bg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
}

.avatar-preview-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: var(--spacing-xxl);
}

.avatar-preview-img {
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* 毛玻璃修改按钮 */
.avatar-modify-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xxl);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: var(--font-size-body);
  cursor: pointer;
  transition: background 0.2s;
}

.avatar-modify-btn:active {
  background: rgba(255, 255, 255, 0.4);
}

.avatar-close-hint {
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-caption);
}
</style>
