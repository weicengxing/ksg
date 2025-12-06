import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import ProfileView from '../views/ProfileView.vue'
import AccountSettingsView from '../views/AccountSettingsView.vue'
import SecurityPrivacyView from '../views/SecurityPrivacyView.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/', name: 'Dashboard', component: DashboardView },
  { path: '/profile', name: 'Profile', component: ProfileView },
  { path: '/profile/account-settings', name: 'AccountSettings', component: AccountSettingsView },
  { path: '/profile/security-privacy', name: 'SecurityPrivacy', component: SecurityPrivacyView },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：没登录就踢回登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router