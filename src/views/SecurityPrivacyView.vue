<template>
  <div class="app-container">
    <!-- 动态背景 -->
    <div class="ambient-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <div class="glass-layout">
      <div class="dashboard-grid">
        
        <!-- ================= 左侧侧边栏 (已修复布局溢出问题) ================= -->
        <aside class="profile-sidebar glass-card">
          <!-- 头部信息 -->
          <div class="profile-header">
            <div class="avatar-wrapper" @click="triggerAvatarUpload">
              <img v-if="userInfo.avatar" :src="avatarUrl" class="avatar-img" alt="Avatar" />
              <div v-else class="avatar-placeholder">
                {{ (userInfo.username || 'U')[0].toUpperCase() }}
              </div>
              <div class="avatar-overlay">
                <el-icon><Camera /></el-icon>
              </div>
              <div class="status-indicator online"></div>
            </div>
            <input type="file" ref="avatarInput" @change="handleAvatarChange" accept="image/*" style="display: none" />
            
            <h2 class="username">{{ userInfo.username || '未知用户' }}</h2>
            <p class="email">{{ userInfo.email || 'user@example.com' }}</p>
            
            <div class="tags">
              <span class="tag pro-tag">PRO 会员</span>
              <span class="tag dev-tag">开发者</span>
            </div>
          </div>

          <div class="divider"></div>

          <!-- 菜单区 (自适应高度，防止撑开) -->
          <div class="sidebar-menu">
            <div class="menu-item" @click="router.push('/profile')">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </div>
            <div class="menu-item" @click="router.push('/profile/account-settings')">
              <el-icon><Setting /></el-icon>
              <span>账号设置</span>
            </div>
            <div class="menu-item active">
              <el-icon><Lock /></el-icon>
              <span>安全隐私</span>
            </div>
          </div>

          <!-- 底部按钮区 (固定底部) -->
          <div class="sidebar-footer">
            <button @click="handleLogout" class="btn-logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </button>
            <button @click="handleDeleteAccount" class="btn-delete">
              <el-icon><Delete /></el-icon>
              <span>注销账户</span>
            </button>
          </div>
        </aside>

        <!-- ================= 右侧：安全隐私内容 (美化版) ================= -->
        <main class="main-content">
          <header class="content-header">
            <div class="header-text">
              <h1 class="page-title">安全隐私</h1>
              <p class="page-subtitle">管理您的账户密码、两步验证及登录设备</p>
            </div>
            <div class="header-status">
             <span class="security-badge" :class="securityRatingClass">
                <el-icon><component :is="securityRatingIcon" /></el-icon> 账户安全评级：{{ securityRating.label }}
             </span>
            </div>
          </header>

          <div class="settings-scroll-area">
            
            <!-- 修改密码卡片 -->
            <div class="settings-section glass-panel">
              <div class="section-header">
                <div class="header-icon-bg purple">
                  <el-icon><Key /></el-icon>
                </div>
                <div class="header-info">
                  <h2 class="section-title">登录密码</h2>
                  <p class="section-desc">建议定期修改密码以保护账号安全，密码强度需要满足规范</p>
                </div>
              </div>
              
              <div class="password-form-grid">
                <!-- 当前密码 -->
                <div class="form-group full-width">
                  <label>当前密码</label>
                  <div class="input-wrapper">
                    <el-icon class="input-prefix"><Lock /></el-icon>
                    <input
                      v-model="passwordForm.currentPassword"
                      :type="showPassword.current ? 'text' : 'password'"
                      placeholder="请输入当前正在使用的密码"
                      class="custom-input"
                    />
                    <el-icon class="eye-suffix" @click="togglePass('current')">
                      <component :is="showPassword.current ? 'View' : 'Hide'" />
                    </el-icon>
                  </div>
                </div>

                <!-- 新密码 -->
                <div class="form-group">
                  <label>新密码</label>
                  <div class="input-wrapper">
                    <el-icon class="input-prefix"><Unlock /></el-icon>
                    <input
                      v-model="passwordForm.newPassword"
                      :type="showPassword.new ? 'text' : 'password'"
                      placeholder="设置新密码"
                      class="custom-input"
                    />
                    <el-icon class="eye-suffix" @click="togglePass('new')">
                      <component :is="showPassword.new ? 'View' : 'Hide'" />
                    </el-icon>
                  </div>
                </div>

                <!-- 确认新密码 -->
                <div class="form-group">
                  <label>确认新密码</label>
                  <div class="input-wrapper">
                    <el-icon class="input-prefix"><CircleCheckFilled /></el-icon>
                    <input
                      v-model="passwordForm.confirmPassword"
                      :type="showPassword.confirm ? 'text' : 'password'"
                      placeholder="再次输入新密码"
                      class="custom-input"
                    />
                     <el-icon class="eye-suffix" @click="togglePass('confirm')">
                      <component :is="showPassword.confirm ? 'View' : 'Hide'" />
                    </el-icon>
                  </div>
                </div>
              </div>

              <div class="form-footer">
                <button @click="handleChangePassword" class="btn-primary" :disabled="changingPassword">
                   <el-icon v-if="changingPassword" class="is-loading"><Loading /></el-icon>
                  <span>{{ changingPassword ? '验证并修改...' : '更新密码' }}</span>
                </button>
              </div>
            </div>

            <!-- 安全控制中心 -->
            <div class="settings-section glass-panel">
              <h2 class="sub-title">安全控制</h2>

              <div class="security-list">
                <!-- 2FA -->
                <div class="security-item">
                  <div class="item-left">
                    <div class="item-icon-bg green">
                      <el-icon><Iphone /></el-icon>
                    </div>
                    <div class="item-content">
                      <h3>两步验证 (2FA)</h3>
                      <p>启用后，登录时需要上传验证图片进行二次验证</p>
                    </div>
                  </div>
                  <div class="item-action">
                    <el-switch
                      v-model="twoFactorEnabled"
                      active-color="#10b981"
                      :loading="twoFactorLoading"
                      @change="handleTwoFactorChange"
                    />
                  </div>
                </div>

                <!-- 二维码登录 -->
                <div class="security-item hover-effect" @click="handleShowQRLogin">
                  <div class="item-left">
                    <div class="item-icon-bg blue">
                      <el-icon><Monitor /></el-icon>
                    </div>
                    <div class="item-content">
                      <h3>二维码登录</h3>
                      <p>使用手机扫描二维码，快速登录其他设备</p>
                    </div>
                  </div>
                  <div class="item-action">
                    <el-icon class="arrow-right"><ArrowRight /></el-icon>
                  </div>
                </div>

                <!-- 登录历史 -->
                <div class="security-item hover-effect" @click="handleViewLoginHistory">
                  <div class="item-left">
                    <div class="item-icon-bg orange">
                      <el-icon><Clock /></el-icon>
                    </div>
                    <div class="item-content">
                      <h3>登录历史记录</h3>
                      <p>监控最近 30 天的账户活动与登录地点</p>
                    </div>
                  </div>
                  <div class="item-action">
                    <el-icon class="arrow-right"><ArrowRight /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- 2FA 图片上传对话框 -->
    <el-dialog
      v-model="showTwoFactorDialog"
      title="设置两步验证图片"
      width="450px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <div class="twofa-dialog-content">
        <p class="twofa-tip">请上传一张图片作为您的两步验证凭证。登录时需要上传相同的图片才能完成验证。</p>
        <p class="twofa-warning">请妥善保管此图片，丢失后将无法登录！</p>

        <div class="upload-area" @click="triggerTwoFactorUpload" @dragover.prevent @drop.prevent="handleDrop">
          <input type="file" ref="twoFactorInput" @change="handleTwoFactorFileChange" accept="image/*" style="display: none" />
          <div v-if="!twoFactorPreview" class="upload-placeholder">
            <el-icon class="upload-icon"><Picture /></el-icon>
            <p>点击或拖拽图片到此处</p>
            <span>支持 JPG、PNG 格式，最大 5MB</span>
          </div>
          <div v-else class="upload-preview">
            <img :src="twoFactorPreview" alt="预览" />
            <div class="preview-overlay" @click.stop="clearTwoFactorFile">
              <el-icon><Delete /></el-icon>
              <span>移除</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="handleDialogClose">取消</button>
        <button class="btn-primary" @click="confirmEnableTwoFactor" :disabled="!twoFactorFile || twoFactorUploading">
          <el-icon v-if="twoFactorUploading" class="is-loading"><Loading /></el-icon>
          <span>{{ twoFactorUploading ? '上传中...' : '确认启用' }}</span>
        </button>
      </template>
    </el-dialog>

    <!-- 登录历史记录弹窗 -->
    <el-dialog
      v-model="showLoginHistoryDialog"
      title="登录历史记录"
      width="700px"
      :close-on-click-modal="true"
      @close="showLoginHistoryDialog = false"
    >
      <div class="login-history-content">
        <p class="history-tip">监控最近 30 天的账户活动与登录地点，帮助您发现异常登录。</p>

        <div v-if="loginHistoryLoading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <div v-else-if="loginHistory.length === 0" class="empty-history">
          <el-icon><Clock /></el-icon>
          <p>暂无登录记录</p>
        </div>

        <div v-else class="history-list">
          <div v-for="(record, index) in loginHistory" :key="index" class="history-item">
            <div class="history-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="history-info">
              <div class="history-main">
                <span class="history-location">{{ record.location }}</span>
                <span class="history-ip">{{ record.ip }}</span>
              </div>
              <div class="history-detail">
                <span class="history-browser">{{ formatUserAgent(record.user_agent) }}</span>
              </div>
              <div class="history-time">{{ formatLoginTime(record.login_time) }}</div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-primary" @click="showLoginHistoryDialog = false">关闭</button>
      </template>
    </el-dialog>

    <!-- 二维码登录弹窗 -->
    <el-dialog
      v-model="showQRLoginDialog"
      title="二维码登录"
      width="400px"
      :close-on-click-modal="false"
      @close="handleQRDialogClose"
    >
      <div class="qr-dialog-content">
        <p class="qr-tip">使用手机扫描下方二维码，在手机上确认登录</p>

        <div class="qr-container">
          <div v-if="qrLoading" class="qr-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>生成中...</span>
          </div>
          <div v-else-if="qrExpired" class="qr-expired" @click="generateQRCode">
            <el-icon><Warning /></el-icon>
            <span>二维码已过期</span>
            <p>点击刷新</p>
          </div>
          <div v-else-if="qrConfirmed" class="qr-confirmed">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>登录成功</span>
          </div>
          <div v-else class="qr-code-wrapper">
            <img :src="qrCodeImage" alt="登录二维码" class="qr-code-img" />
          </div>
        </div>

        <div class="qr-status">
          <span v-if="qrLoading">正在生成二维码...</span>
          <span v-else-if="qrExpired">二维码已过期，请点击刷新</span>
          <span v-else-if="qrConfirmed">扫码成功，正在跳转...</span>
          <span v-else>
            <el-icon class="scanning-icon"><Iphone /></el-icon>
            请使用手机扫描二维码
          </span>
        </div>

        <div v-if="!qrLoading && !qrExpired && !qrConfirmed" class="qr-countdown">
          二维码有效期：{{ qrCountdown }}秒
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="handleQRDialogClose">关闭</button>
        <button v-if="qrExpired" class="btn-primary" @click="generateQRCode">
          刷新二维码
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
// 引入图标
import {
  Camera, User, Setting, Lock, SwitchButton, Delete, // Sidebar icons
  Key, Unlock, View, Hide, Loading, CircleCheckFilled, // Password icons
  Iphone, Monitor, Clock, ArrowRight, Picture, // Security List icons
  WarningFilled, Warning // Security rating icons
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const userInfo = ref({})

// 密码逻辑
const changingPassword = ref(false)
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const showPassword = ref({ current: false, new: false, confirm: false })
const togglePass = (field) => showPassword.value[field] = !showPassword.value[field]

// 2FA 相关状态
const twoFactorEnabled = ref(false)
const twoFactorLoading = ref(false)
const showTwoFactorDialog = ref(false)
const twoFactorInput = ref(null)
const twoFactorFile = ref(null)
const twoFactorPreview = ref('')
const twoFactorUploading = ref(false)

// 安全评级相关状态
const securityRating = ref({ level: 'medium', label: '中', color: 'yellow' })

// 登录历史相关状态
const showLoginHistoryDialog = ref(false)
const loginHistoryLoading = ref(false)
const loginHistory = ref([])

// 二维码登录相关状态
const showQRLoginDialog = ref(false)
const qrLoading = ref(false)
const qrExpired = ref(false)
const qrConfirmed = ref(false)
const qrCodeImage = ref('')
const qrId = ref('')
const qrCountdown = ref(300)
let qrPollingTimer = null
let qrCountdownTimer = null

// 计算安全评级样式类
const securityRatingClass = computed(() => {
  return `security-badge-${securityRating.value.color}`
})

// 计算安全评级图标
const securityRatingIcon = computed(() => {
  switch (securityRating.value.level) {
    case 'top_secret':
      return 'CircleCheckFilled'
    case 'high':
      return 'CircleCheckFilled'
    case 'medium':
      return 'Warning'
    case 'low':
      return 'WarningFilled'
    default:
      return 'CircleCheckFilled'
  }
})

// 复用逻辑 (Sidebar & UserInfo)
const avatarInput = ref(null)
const localAvatarUrl = ref('')
const avatarUrl = computed(() => localAvatarUrl.value || (userInfo.value.avatar ? `http://localhost:8000/avatar/${userInfo.value.avatar}` : ''))
const triggerAvatarUpload = () => avatarInput.value?.click()

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  localAvatarUrl.value = URL.createObjectURL(file)
  const fd = new FormData(); fd.append('file', file)
  try {
    const res = await request.post('/auth/upload-avatar', fd)
    userInfo.value.avatar = res.data.avatar
    ElMessage.success('头像上传成功')
  } catch (e) { ElMessage.error('上传失败') }
}

const fetchUserInfo = async () => {
  try {
    const res = await request.get('/auth/me')
    userInfo.value = res.data
    // 同步2FA状态
    twoFactorEnabled.value = res.data.twofa_enabled || false
    // 获取安全评级
    await fetchSecurityRating()
  } catch (e) {}
}

// 获取安全评级
const fetchSecurityRating = async () => {
  try {
    const res = await request.get('/auth/security-rating')
    securityRating.value = res.data.rating
  } catch (e) {
    // 如果获取失败，使用默认值
    securityRating.value = { level: 'medium', label: '中', color: 'yellow' }
  }
}

// ==================== 2FA 相关方法 ====================

const handleTwoFactorChange = async (newValue) => {
  if (newValue) {
    // 开启2FA，弹出上传对话框
    showTwoFactorDialog.value = true
    // 先把开关恢复，等上传成功后再改
    twoFactorEnabled.value = false
  } else {
    // 关闭2FA
    try {
      await ElMessageBox.confirm(
        '关闭两步验证后，您的账户安全性将降低。确定要关闭吗？',
        '确认关闭',
        { confirmButtonText: '确定关闭', cancelButtonText: '取消', type: 'warning' }
      )
      twoFactorLoading.value = true
      await request.post('/auth/disable-2fa')
      twoFactorEnabled.value = false
      ElMessage.success('两步验证已关闭')
      // 刷新安全评级
      await fetchSecurityRating()
    } catch (e) {
      if (e !== 'cancel') {
        ElMessage.error(e.response?.data?.detail || '操作失败')
      }
      // 恢复开关状态
      twoFactorEnabled.value = true
    } finally {
      twoFactorLoading.value = false
    }
  }
}

const triggerTwoFactorUpload = () => twoFactorInput.value?.click()

const handleTwoFactorFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }
  twoFactorFile.value = file
  twoFactorPreview.value = URL.createObjectURL(file)
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }
  twoFactorFile.value = file
  twoFactorPreview.value = URL.createObjectURL(file)
}

const clearTwoFactorFile = () => {
  twoFactorFile.value = null
  twoFactorPreview.value = ''
  if (twoFactorInput.value) {
    twoFactorInput.value.value = ''
  }
}

const handleDialogClose = () => {
  showTwoFactorDialog.value = false
  clearTwoFactorFile()
}

const confirmEnableTwoFactor = async () => {
  if (!twoFactorFile.value) {
    ElMessage.error('请先选择验证图片')
    return
  }

  twoFactorUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', twoFactorFile.value)
    await request.post('/auth/enable-2fa', fd)
    twoFactorEnabled.value = true
    showTwoFactorDialog.value = false
    clearTwoFactorFile()
    ElMessage.success('两步验证已启用，请妥善保管您的验证图片！')
    // 刷新安全评级
    await fetchSecurityRating()
  } catch (e) {
    ElMessage.error(e.response?.data?.detail || '启用失败')
  } finally {
    twoFactorUploading.value = false
  }
}

const handleChangePassword = async () => {
  if (!passwordForm.value.currentPassword) return ElMessage.error('请输入当前密码')
  if (passwordForm.value.newPassword.length < 8) return ElMessage.error('新密码长度至少8位')
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) return ElMessage.error('密码不一致')
  
  changingPassword.value = true
  try {
    await request.put('/auth/change-password', {
      current_password: passwordForm.value.currentPassword,
      new_password: passwordForm.value.newPassword
    })
    ElMessage.success('密码修改成功，请重新登录')
    setTimeout(() => { userStore.logout(); router.push('/login') }, 1500)
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '密码修改失败')
  } finally {
    changingPassword.value = false
  }
}

const handleViewDevices = async () => {
  try {
    const res = await request.get('/auth/login-devices')
    ElMessageBox.alert(`当前活跃设备数: ${res.data.devices?.length || 0}`, '设备管理', { confirmButtonText: '确定' })
  } catch (e) { ElMessage.info('功能演示：此处将展示设备列表') }
}

// ==================== 二维码登录相关方法 ====================

const handleShowQRLogin = () => {
  showQRLoginDialog.value = true
  generateQRCode()
}

const generateQRCode = async () => {
  qrLoading.value = true
  qrExpired.value = false
  qrConfirmed.value = false
  qrCodeImage.value = ''

  // 清除之前的定时器
  clearQRTimers()

  try {
    const res = await request.post('/auth/qr/generate')
    qrId.value = res.data.qr_id

    // 使用在线二维码生成服务生成二维码图片
    qrCodeImage.value = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(res.data.qr_url)}`

    // 开始倒计时
    qrCountdown.value = res.data.expires_in || 300
    startCountdown()

    // 开始轮询检查登录状态
    startPolling()
  } catch (e) {
    ElMessage.error('生成二维码失败，请重试')
    qrExpired.value = true
  } finally {
    qrLoading.value = false
  }
}

const startCountdown = () => {
  qrCountdownTimer = setInterval(() => {
    qrCountdown.value--
    if (qrCountdown.value <= 0) {
      qrExpired.value = true
      clearQRTimers()
    }
  }, 1000)
}

const startPolling = () => {
  qrPollingTimer = setInterval(async () => {
    try {
      const res = await request.get(`/auth/qr/check/${qrId.value}`)

      if (res.data.status === 'confirmed') {
        // 登录成功
        qrConfirmed.value = true
        clearQRTimers()

        // 保存token并跳转
        userStore.setLogin(res.data.access_token, res.data.username)
        ElMessage.success('扫码登录成功！')

        setTimeout(() => {
          showQRLoginDialog.value = false
          router.push('/')
        }, 1500)
      } else if (res.data.status === 'expired') {
        qrExpired.value = true
        clearQRTimers()
      }
    } catch (e) {
      // 轮询出错，忽略
    }
  }, 2000) // 每2秒检查一次
}

const clearQRTimers = () => {
  if (qrPollingTimer) {
    clearInterval(qrPollingTimer)
    qrPollingTimer = null
  }
  if (qrCountdownTimer) {
    clearInterval(qrCountdownTimer)
    qrCountdownTimer = null
  }
}

const handleQRDialogClose = () => {
  showQRLoginDialog.value = false
  clearQRTimers()
  qrLoading.value = false
  qrExpired.value = false
  qrConfirmed.value = false
  qrCodeImage.value = ''
  qrId.value = ''
}

const handleViewLoginHistory = async () => {
  showLoginHistoryDialog.value = true
  loginHistoryLoading.value = true
  loginHistory.value = []

  try {
    const res = await request.get('/auth/login-history')
    loginHistory.value = res.data.records || []
  } catch (e) {
    ElMessage.error('获取登录历史失败')
  } finally {
    loginHistoryLoading.value = false
  }
}

// 格式化 User-Agent 为简短浏览器描述
const formatUserAgent = (ua) => {
  if (!ua) return '未知浏览器'

  // 检测常见浏览器
  if (ua.includes('Edg/')) return 'Microsoft Edge'
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Google Chrome'
  if (ua.includes('Firefox/')) return 'Mozilla Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Apple Safari'
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera'

  // 检测操作系统
  let os = ''
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return os ? `${os} 浏览器` : '未知浏览器'
}

// 格式化登录时间
const formatLoginTime = (timestamp) => {
  if (!timestamp) return '未知时间'

  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // 今天
  if (diffDays === 0) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `今天 ${hours}:${minutes}`
  }

  // 昨天
  if (diffDays === 1) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `昨天 ${hours}:${minutes}`
  }

  // 其他日期
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  // 今年不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day} ${hours}:${minutes}`
  }

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const handleLogout = () => { userStore.logout(); router.push('/login') }
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

onMounted(fetchUserInfo)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ================= 全局基础样式 ================= */
.app-container {
  width: 100vw; height: 100vh; position: relative; overflow: hidden;
  background-color: #f3f4f6; font-family: 'Inter', sans-serif; color: #1f2937;
}

/* 动态背景 */
.ambient-background { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
.shape { position: absolute; filter: blur(90px); border-radius: 50%; opacity: 0.5; animation: float 25s infinite ease-in-out; }
.shape-1 { width: 50vw; height: 50vw; background: #c4b5fd; top: -10%; left: -10%; }
.shape-2 { width: 40vw; height: 40vw; background: #a5f3fc; bottom: -5%; right: -5%; animation-delay: -5s; }
.shape-3 { width: 30vw; height: 30vw; background: #fbcfe8; top: 40%; left: 30%; animation-delay: -10s; }
@keyframes float { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, 40px); } }

/* 玻璃容器 */
.glass-layout {
  position: relative; z-index: 1; width: 100%; height: 100%; padding: 2rem;
  display: flex; justify-content: center; align-items: center;
}
.dashboard-grid {
  display: grid; grid-template-columns: 280px 1fr; gap: 24px;
  width: 100%; max-width: 1400px; height: 100%; max-height: 900px;
}

/* 玻璃面板通用样式 */
.glass-card {
  background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  border-radius: 24px;
}
.glass-panel {
  background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  padding: 32px;
}

/* ================= 左侧侧边栏 (修复布局) ================= */
.profile-sidebar {
  display: flex; 
  flex-direction: column; 
  padding: 24px; 
  height: 100%; 
  overflow-y: auto; /* 允许整体滚动 */
}
.profile-sidebar::-webkit-scrollbar { width: 6px; }
.profile-sidebar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }
.profile-sidebar::-webkit-scrollbar-track { background: transparent; }

/* 头部固定 */
.profile-header { text-align: center; flex-shrink: 0; margin-bottom: 20px; }
.avatar-wrapper { width: 96px; height: 96px; margin: 0 auto 12px; position: relative; cursor: pointer; }
.avatar-img, .avatar-placeholder { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.avatar-placeholder { background: linear-gradient(135deg, #6366f1, #a855f7); color: white; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; }
.avatar-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.3s; color: white; font-size: 24px; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.status-indicator { position: absolute; bottom: 4px; right: 4px; width: 16px; height: 16px; background: #10b981; border: 3px solid white; border-radius: 50%; }
.username { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 4px; }
.email { font-size: 13px; color: #6b7280; margin-bottom: 12px; }
.tags { display: flex; gap: 6px; justify-content: center; }
.tag { font-size: 10px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
.pro-tag { background: #e0e7ff; color: #4338ca; }
.dev-tag { background: #dcfce7; color: #15803d; }
.divider { height: 1px; background: rgba(0,0,0,0.06); margin: 0 0 20px 0; flex-shrink: 0; }

/* 菜单区 (自然高度) */
.sidebar-menu { 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
  margin-bottom: 16px;
}
.menu-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: 12px; color: #4b5563; cursor: pointer; transition: 0.2s; font-weight: 500; font-size: 14px; flex-shrink: 0; }
.menu-item:hover { background: rgba(255,255,255,0.6); color: #111827; }
.menu-item.active { background: white; color: #6366f1; box-shadow: 0 2px 8px rgba(0,0,0,0.04); font-weight: 600; }
.menu-item .el-icon { font-size: 18px; }

/* 底部按钮区 (固定显示) */
.sidebar-footer { 
  padding-top: 16px; 
  border-top: 1px solid rgba(0,0,0,0.06);
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  flex-shrink: 0;
}
.btn-logout, .btn-delete { width: 100%; padding: 10px; border: none; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; transition: 0.2s; }
.btn-logout { background: #fee2e2; color: #dc2626; }
.btn-logout:hover { background: #fecaca; }
.btn-delete { background: transparent; color: #9ca3af; }
.btn-delete:hover { background: rgba(0,0,0,0.05); color: #4b5563; }

/* ================= 右侧 Main Content ================= */
.main-content { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 8px; flex-shrink: 0; }
.page-title { font-size: 26px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
.page-subtitle { color: #6b7280; font-size: 14px; margin-top: 4px; }

/* 安全评级徽章样式 */
.security-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

/* 低 - 红色 */
.security-badge-red {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* 中 - 黄色 */
.security-badge-yellow {
  background: #fefce8;
  color: #ca8a04;
  border: 1px solid #fef08a;
}

/* 高 - 绿色 */
.security-badge-green {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

/* 绝密 - 紫色 */
.security-badge-purple {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #7c3aed;
  border: 1px solid #d8b4fe;
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.2);
}

.settings-scroll-area { 
  flex: 1; overflow-y: auto; padding: 4px; padding-bottom: 20px; 
  display: flex; flex-direction: column; gap: 24px; 
}
.settings-scroll-area::-webkit-scrollbar { width: 6px; }
.settings-scroll-area::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 3px; }

/* 修改密码 Section */
.settings-section { display: flex; flex-direction: column; }
.section-header { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 24px; }
.header-icon-bg { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
.header-icon-bg.purple { background: #f3e8ff; color: #9333ea; }
.section-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 4px 0; }
.section-desc { font-size: 13px; color: #6b7280; line-height: 1.5; margin: 0; }

.password-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.form-group.full-width { grid-column: 1 / -1; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: #4b5563; margin-bottom: 8px; }

/* Input Styles */
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-prefix { position: absolute; left: 16px; font-size: 18px; color: #9ca3af; transition: 0.3s; }
.eye-suffix { position: absolute; right: 16px; font-size: 18px; color: #9ca3af; cursor: pointer; transition: 0.3s; }
.eye-suffix:hover { color: #6366f1; }
.custom-input { 
  width: 100%; height: 48px; padding: 0 48px; border: 1px solid #e5e7eb; 
  border-radius: 12px; font-size: 14px; background: #fff; transition: all 0.3s; 
}
.custom-input:focus { 
  border-color: #6366f1; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1); outline: none; 
}
.input-wrapper:focus-within .input-prefix { color: #6366f1; }

.form-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid rgba(0,0,0,0.05);
}
.btn-primary { 
  padding: 10px 24px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
  color: white; border: none; border-radius: 12px; font-weight: 600; 
  cursor: pointer; display: flex; align-items: center; gap: 8px; 
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); transition: all 0.2s; 
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(99, 102, 241, 0.4); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

/* 安全控制列表 */
.sub-title { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 16px; }
.security-list { display: flex; flex-direction: column; gap: 16px; }
.security-item { 
  display: flex; align-items: center; justify-content: space-between; 
  padding: 20px; background: rgba(255,255,255,0.4); 
  border: 1px solid rgba(255,255,255,0.5); border-radius: 16px; transition: all 0.2s; 
}
.security-item.hover-effect:hover { 
  background: white; border-color: #e0e7ff; 
  box-shadow: 0 8px 20px rgba(0,0,0,0.03); transform: translateY(-2px); cursor: pointer; 
}
.item-left { display: flex; align-items: center; gap: 16px; }
.item-icon-bg { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.item-icon-bg.green { background: #dcfce7; color: #16a34a; }
.item-icon-bg.blue { background: #e0e7ff; color: #4f46e5; }
.item-icon-bg.orange { background: #ffedd5; color: #ea580c; }
.item-content h3 { font-size: 15px; font-weight: 600; margin: 0 0 4px; color: #1f2937; }
.item-content p { font-size: 12px; color: #6b7280; margin: 0; }
.item-action .arrow-right { font-size: 18px; color: #cbd5e1; }

/* 响应式 */
@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .profile-sidebar { height: auto; flex-direction: row; padding: 16px; align-items: center; }
  .sidebar-menu { flex-direction: row; overflow-y: visible; flex: 0; }
  .sidebar-footer { display: none; }
  .profile-header { display: flex; align-items: center; margin: 0; gap: 12px; }
  .avatar-wrapper { margin: 0; width: 48px; height: 48px; }
  .email, .tags, .divider { display: none; }
  .username { font-size: 16px; margin: 0; }
}

@media (max-width: 768px) {
  .password-form-grid { grid-template-columns: 1fr; }
  .security-item { flex-direction: column; align-items: flex-start; gap: 16px; }
  .item-action { align-self: flex-end; }
}

/* ================= 2FA 对话框样式 ================= */
.twofa-dialog-content {
  padding: 10px 0;
}

.twofa-tip {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 12px;
  line-height: 1.6;
}

.twofa-warning {
  font-size: 13px;
  color: #dc2626;
  background: #fef2f2;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.upload-area {
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #6366f1;
  background: #f5f3ff;
}

.upload-placeholder {
  color: #9ca3af;
}

.upload-placeholder .upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #d1d5db;
}

.upload-placeholder p {
  font-size: 14px;
  margin: 0 0 4px;
  color: #6b7280;
}

.upload-placeholder span {
  font-size: 12px;
  color: #9ca3af;
}

.upload-preview {
  position: relative;
  display: inline-block;
}

.upload-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: white;
  cursor: pointer;
}

.preview-overlay:hover {
  opacity: 1;
}

.preview-overlay .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.preview-overlay span {
  font-size: 12px;
}

:deep(.el-dialog) {
  border-radius: 20px;
}

:deep(.el-dialog__header) {
  padding: 20px 24px 10px;
}

:deep(.el-dialog__title) {
  font-weight: 700;
  font-size: 18px;
}

:deep(.el-dialog__body) {
  padding: 10px 24px 20px;
}

:deep(.el-dialog__footer) {
  padding: 10px 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ================= 登录历史弹窗样式 ================= */
.login-history-content {
  padding: 10px 0;
}

.history-tip {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.6;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #9ca3af;
  gap: 12px;
}

.loading-container .el-icon {
  font-size: 32px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #9ca3af;
}

.empty-history .el-icon {
  font-size: 48px;
  margin-bottom: 12px;
  color: #d1d5db;
}

.empty-history p {
  font-size: 14px;
  margin: 0;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s;
}

.history-item:hover {
  background: #f3f4f6;
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #e0e7ff;
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.history-location {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.history-ip {
  font-size: 13px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

.history-detail {
  margin-bottom: 4px;
}

.history-browser {
  font-size: 13px;
  color: #6b7280;
}

.history-time {
  font-size: 12px;
  color: #9ca3af;
}

.btn-ghost {
  padding: 10px 20px;
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

/* ================= 二维码登录弹窗样式 ================= */
.qr-dialog-content {
  text-align: center;
  padding: 10px 0;
}

.qr-tip {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.6;
}

.qr-container {
  width: 220px;
  height: 220px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
}

.qr-loading,
.qr-expired,
.qr-confirmed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #9ca3af;
}

.qr-loading .el-icon {
  font-size: 40px;
  color: #6366f1;
}

.qr-expired {
  cursor: pointer;
  transition: all 0.3s;
}

.qr-expired:hover {
  color: #6366f1;
}

.qr-expired .el-icon {
  font-size: 40px;
  color: #f59e0b;
}

.qr-expired span {
  font-size: 14px;
  font-weight: 600;
}

.qr-expired p {
  font-size: 12px;
  margin: 0;
  color: #6366f1;
}

.qr-confirmed .el-icon {
  font-size: 48px;
  color: #10b981;
}

.qr-confirmed span {
  font-size: 16px;
  font-weight: 600;
  color: #10b981;
}

.qr-code-wrapper {
  padding: 10px;
  background: white;
  border-radius: 12px;
}

.qr-code-img {
  width: 180px;
  height: 180px;
  display: block;
}

.qr-status {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.scanning-icon {
  color: #6366f1;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.qr-countdown {
  font-size: 13px;
  color: #9ca3af;
}
</style>
