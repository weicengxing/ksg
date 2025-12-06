import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router' // 新增
import { createPinia } from 'pinia' // 新增
import axios from 'axios'
import { useUserStore } from './stores/user'

const app = createApp(App)

// --- 添加 Axios 拦截器 ---
// 请求拦截器：自动添加 Authorization header
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理 401 错误（token 过期）、302 重定向和自动token更新
axios.interceptors.response.use(
  response => {
    // 检查响应头中是否有新token
    const newToken = response.headers['x-new-token']
    if (newToken) {
      // 自动更新localStorage中的token
      localStorage.setItem('token', newToken)
      // 同时更新user store中的token
      const userStore = useUserStore()
      if (userStore) {
        userStore.token = newToken
      }
      console.log('Token已自动更新')
    }
    return response
  },
  error => {
    // 处理302重定向（会话超过24小时）
    if (error.response?.status === 302) {
      // 清除登录信息
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      // 重定向到登录页
      window.location.href = '/login'
      return Promise.reject(error)
    }
    
    // 处理401错误（token无效）
    if (error.response?.status === 401) {
      // 清除登录信息
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      // 重定向到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

app.use(ElementPlus)
app.use(router) // 新增
app.use(createPinia()) // 新增
app.mount('#app')
