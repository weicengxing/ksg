<template>
  <div class="app-container">
    <!-- 动态弥散背景 -->
    <div class="ambient-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 内容区域 -->
    <div class="glass-layout">
      <!-- 加载状态 -->
      <transition name="fade" mode="out-in">
        <div v-if="loading" class="loading-wrapper">
          <div class="loader"></div>
          <p>正在同步数据...</p>
        </div>

        <div v-else class="dashboard-grid">
          <!-- 左侧：个人概览卡片 -->
          <aside class="profile-sidebar glass-card">
            <div class="profile-header">
              <div class="avatar-wrapper" @click="triggerAvatarUpload">
                <img
                  v-if="userInfo.avatar"
                  :src="avatarUrl"
                  class="avatar-img"
                  alt="Avatar"
                />
                <div v-else class="avatar-placeholder">
                  {{ (userInfo.username || 'U')[0].toUpperCase() }}
                </div>
                <div class="avatar-overlay">
                  <el-icon><Camera /></el-icon>
                </div>
                <div class="status-indicator online"></div>
              </div>
              <input
                type="file"
                ref="avatarInput"
                @change="handleAvatarChange"
                accept="image/*"
                style="display: none"
              />
              
              <h2 class="username">{{ userInfo.username || '未知用户' }}</h2>
              <p class="email">{{ userInfo.email || 'user@example.com' }}</p>
              
              <div class="tags">
                <span class="tag pro-tag">PRO 会员</span>
                <span class="tag dev-tag">开发者</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="sidebar-menu">
              <div 
                class="menu-item"
                :class="{ active: $route.name === 'Profile' }"
                @click="router.push('/profile')"
              >
                <i class="el-icon-user"></i>
                <span>个人中心</span>
              </div>
              <div 
                class="menu-item"
                :class="{ active: $route.name === 'AccountSettings' }"
                @click="router.push('/profile/account-settings')"
              >
                <i class="el-icon-setting"></i>
                <span>账号设置</span>
              </div>
              <div 
                class="menu-item"
                :class="{ active: $route.name === 'SecurityPrivacy' }"
                @click="router.push('/profile/security-privacy')"
              >
                <i class="el-icon-lock"></i>
                <span>安全隐私</span>
              </div>
            </div>

            <div class="sidebar-footer">
              <button @click="handleLogout" class="btn-logout">
                <i class="el-icon-switch-button"></i>
                <span>退出登录</span>
              </button>
              <button @click="handleDeleteAccount" class="btn-logout btn-delete">
                <i class="el-icon-delete"></i>
                <span>注销账户</span>
              </button>
            </div>
          </aside>

          <!-- 右侧：数据与功能区 -->
          <main class="main-content">
            <!-- 顶部欢迎语 -->
            <header class="content-header">
              <div class="greeting-container">
                <div class="greeting-main">
                  <span class="greeting-emoji">{{ greetingEmoji }}</span>
                  <h1 class="greeting-text">
                    {{ greetingMessage }}，<span class="username-highlight">{{ userInfo.username }}</span>
                  </h1>
                </div>
                <p class="greeting-subtitle">{{ greetingSubtitle }}</p>
              </div>
            </header>

            <!-- 数据统计 Bento Grid -->
            <div class="stats-container">
              <div class="stat-card glass-card">
                <div class="stat-icon-bg blue">
                  <i class="el-icon-time"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ userInfo.online_days }}</span>
                  <span class="stat-label">在线天数</span>
                </div>
              </div>

              <div class="stat-card glass-card">
                <div class="stat-icon-bg purple">
                  <i class="el-icon-search"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ userInfo.request_count }}</span>
                  <span class="stat-label">总查询量</span>
                </div>
              </div>

              <div class="stat-card glass-card">
                <div class="stat-icon-bg green">
                  <i class="el-icon-data-line"></i>
                </div>
                <div class="stat-info">
                  <span class="stat-value">99.9%</span>
                  <span class="stat-label">服务可用性</span>
                </div>
              </div>
            </div>

            <!-- 快捷功能区 -->
            <div class="section-title">快捷入口</div>
            <div class="quick-actions-grid">
              <div class="action-card glass-card">
                <div class="action-icon">
                  <i class="el-icon-document"></i>
                </div>
                <h3>使用文档</h3>
                <p>查看API接口文档与说明</p>
                <i class="el-icon-right arrow-icon"></i>
              </div>

              <div class="action-card glass-card">
                <div class="action-icon">
                  <i class="el-icon-message-solid"></i>
                </div>
                <h3>消息通知</h3>
                <p>查看最新的系统公告</p>
                <i class="el-icon-right arrow-icon"></i>
              </div>

              <div class="action-card glass-card">
                <div class="action-icon">
                  <i class="el-icon-pie-chart"></i>
                </div>
                <h3>数据报表</h3>
                <p>导出过去30天的数据</p>
                <i class="el-icon-right arrow-icon"></i>
              </div>
            </div>
          </main>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { Camera } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const avatarInput = ref(null)
const localAvatarUrl = ref('') // 本地预览URL
const userInfo = ref({
  username: '',
  email: '',
  avatar: '',
  created_at: null,
  last_activity: null,
  request_count: 0,
  online_days: 0
})

// 计算头像URL（优先使用本地预览）
const avatarUrl = computed(() => {
  if (localAvatarUrl.value) {
    return localAvatarUrl.value
  }
  if (userInfo.value.avatar) {
    return `http://localhost:8000/avatar/${userInfo.value.avatar}`
  }
  return ''
})

// 触发头像上传
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 处理头像文件选择
const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // 检查文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }

  // 立即本地预览（不等待上传完成）
  localAvatarUrl.value = URL.createObjectURL(file)

  // 异步上传头像
  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await request.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    // 更新服务器返回的头像文件名
    userInfo.value.avatar = res.data.avatar
    ElMessage.success('头像上传成功')
  } catch (error) {
    // 上传失败，清除本地预览
    localAvatarUrl.value = ''
    ElMessage.error(error.response?.data?.detail || '头像上传失败')
  }

  // 清空input，允许重复选择同一文件
  event.target.value = ''
}

// 动态问候语
const greetingMessage = ref('')
const greetingEmoji = ref('')
const greetingSubtitle = ref('')

// 根据时间生成问候语
const generateGreeting = () => {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 9) {
    greetingMessage.value = '早安'
    greetingEmoji.value = '🌅'
    greetingSubtitle.value = '美好的一天从现在开始'
  } else if (hour >= 9 && hour < 12) {
    greetingMessage.value = '上午好'
    greetingEmoji.value = '☀️'
    greetingSubtitle.value = '保持专注，创造精彩'
  } else if (hour >= 12 && hour < 14) {
    greetingMessage.value = '中午好'
    greetingEmoji.value = '🌤️'
    greetingSubtitle.value = '记得休息一下，补充能量'
  } else if (hour >= 14 && hour < 18) {
    greetingMessage.value = '下午好'
    greetingEmoji.value = '🌞'
    greetingSubtitle.value = '继续加油，胜利就在前方'
  } else if (hour >= 18 && hour < 22) {
    greetingMessage.value = '晚上好'
    greetingEmoji.value = '🌆'
    greetingSubtitle.value = '辛苦了，享受悠闲时光'
  } else {
    greetingMessage.value = '夜深了'
    greetingEmoji.value = '🌙'
    greetingSubtitle.value = '早点休息，明天更美好'
  }
}

// 获取用户信息（包含统计信息）
const fetchUserInfo = async () => {
  try {
    const res = await request.get('/auth/me')
    userInfo.value = {
      username: res.data.username,
      email: res.data.email,
      avatar: res.data.avatar || '',
      created_at: res.data.created_at,
      last_activity: res.data.last_activity,
      request_count: res.data.request_count || 0,
      online_days: res.data.online_days || 0
    }
    loading.value = false
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '获取用户信息失败')
    loading.value = false
    // 使用默认值
    userInfo.value = {
      ...userInfo.value,
      request_count: 0,
      online_days: 1
    }
  }
}

const refreshToken = async () => {
  try {
    const loadingMsg = ElMessage.loading({ message: '刷新中...', duration: 0 })

    // 模拟刷新token
    await new Promise(resolve => setTimeout(resolve, 500))

    loadingMsg.close()
    ElMessage.success('Token 已刷新')
  } catch (error) {
    ElMessage.error('Token 刷新失败')
  }
}

// 处理退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

// 处理注销账户
const handleDeleteAccount = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm(
      '此操作将永久删除您的账户和所有数据，无法恢复。您确定要继续吗？',
      '确认注销账户',
      {
        confirmButtonText: '确定注销',
        cancelButtonText: '取消',
        type: 'warning',
        center: true
      }
    )

    // 用户确认注销，调用后端API删除账户
    await request.delete('/auth/delete-account')
    // 注销成功，清除本地存储并跳转到登录页
    userStore.logout()
    ElMessage.success('账户已成功注销')
    router.push('/login')
  } catch (error) {
    // 用户点击取消时，error 为 'cancel'，不需要显示错误
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.detail || '注销账户失败')
    }
  }
}

onMounted(async () => {
  generateGreeting()
  await fetchUserInfo()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* 全局重置与基础设置 */
:deep(*) {
  box-sizing: border-box;
}

.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #f3f4f6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #1f2937;
}

/* 1. 动态弥散背景 (Aurora Background) */
.ambient-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  background: #f8fafc;
}

.shape {
  position: absolute;
  filter: blur(80px);
  border-radius: 50%;
  opacity: 0.6;
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  top: -10%;
  left: -10%;
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, #c4b5fd 0%, rgba(196, 181, 253, 0) 70%);
  animation-delay: 0s;
}

.shape-2 {
  bottom: -10%;
  right: -5%;
  width: 45vw;
  height: 45vw;
  background: radial-gradient(circle, #a5f3fc 0%, rgba(165, 243, 252, 0) 70%);
  animation-delay: -5s;
}

.shape-3 {
  top: 40%;
  left: 40%;
  width: 30vw;
  height: 30vw;
  background: radial-gradient(circle, #fbcfe8 0%, rgba(251, 207, 232, 0) 70%);
  animation-delay: -10s;
}

@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, 50px) rotate(10deg); }
  66% { transform: translate(-20px, 20px) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

/* 2. 玻璃拟态容器 */
.glass-layout {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 通用玻璃卡片样式 */
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 
              0 10px 15px -3px rgba(0, 0, 0, 0.05);
  border-radius: 24px;
}

/* 3. Dashboard 布局 */
.dashboard-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  width: 100%;
  max-width: 1600px;
  height: 100%;
  max-height: 900px; /* 限制最大高度保持美观 */
}

/* 左侧侧边栏 */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  padding: 32px;
  height: 100%;
}

.profile-header {
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 16px;
}

.avatar-placeholder, .avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.avatar-wrapper {
  cursor: pointer;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.avatar-overlay .el-icon {
  color: white;
  font-size: 24px;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.status-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid white;
}

.status-indicator.online { background-color: #10b981; }

.username {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #111827;
}

.email {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.tags {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.tag {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
}

.pro-tag { background: #e0e7ff; color: #4338ca; }
.dev-tag { background: #dcfce7; color: #15803d; }

.divider {
  height: 1px;
  background: rgba(0,0,0,0.05);
  margin: 24px 0;
}

.sidebar-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  color: #4b5563;
  transition: all 0.2s;
  font-weight: 500;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.5);
  color: #111827;
}

.menu-item.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-logout {
  width: 100%;
  padding: 12px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

.btn-logout.btn-delete {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-logout.btn-delete:hover {
  background: #e5e7eb;
  color: #374151;
}

/* 右侧主内容区 */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  padding-right: 4px; /* 防止滚动条贴边 */
}

/* 隐藏滚动条但保留功能 */
.main-content::-webkit-scrollbar {
  width: 6px;
}
.main-content::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 3px;
}

.content-header {
  margin-bottom: 32px;
}

.greeting-container {
  position: relative;
}

.greeting-main {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.greeting-emoji {
  font-size: 48px;
  animation: wave 2s ease-in-out infinite;
  display: inline-block;
  transform-origin: 70% 70%;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(-4deg); }
  50% { transform: rotate(10deg); }
  60% { transform: rotate(0deg); }
}

.greeting-text {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.5px;
  animation: fadeInUp 0.6s ease-out;
}

.username-highlight {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.greeting-subtitle {
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  padding-left: 64px;
  animation: fadeInUp 0.8s ease-out;
  letter-spacing: 0.3px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 统计卡片区 */
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat-card {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.1);
  background: rgba(255,255,255,0.8);
}

.stat-icon-bg {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon-bg.blue { background: #e0e7ff; color: #4f46e5; }
.stat-icon-bg.purple { background: #f3e8ff; color: #9333ea; }
.stat-icon-bg.green { background: #dcfce7; color: #16a34a; }

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

/* 快捷功能区 */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
  margin-top: 10px;
  margin-bottom: 8px;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  flex: 1; /* 填充剩余空间 */
}

.action-card {
  padding: 24px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.1);
  border-color: #a5b4fc;
}

.action-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #4f46e5;
  margin-bottom: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.action-card:hover .action-icon {
  transform: scale(1.1) rotate(5deg);
  background: #4f46e5;
  color: white;
}

.action-card h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}

.action-card p {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.arrow-icon {
  position: absolute;
  top: 24px;
  right: 24px;
  color: #cbd5e1;
  font-size: 20px;
  transition: all 0.3s;
}

.action-card:hover .arrow-icon {
  color: #4f46e5;
  transform: translateX(5px);
}

/* 加载动画 */
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.loader {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(99, 102, 241, 0.1);
  border-left-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-wrapper p {
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 0.5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: 280px 1fr;
  }
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    max-height: none;
    height: auto;
    display: flex;
    flex-direction: column;
  }

  .profile-sidebar {
    flex-direction: row;
    align-items: center;
    padding: 20px;
    gap: 30px;
    height: auto;
  }

  .sidebar-menu {
    flex-direction: row;
    margin: 0;
  }
  
  .divider, .sidebar-footer, .header-text p {
    display: none; 
  }

  .profile-header {
    text-align: left;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .avatar-wrapper {
    margin: 0;
    width: 60px;
    height: 60px;
  }

  .main-content {
    overflow: visible;
  }
}

@media (max-width: 768px) {
  .profile-sidebar {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .stats-container, 
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }

  .app-container {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
  }
}
</style>