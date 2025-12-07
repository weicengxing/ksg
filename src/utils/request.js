import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'https://pitcherlike-remorseless-lita.ngrok-free.dev', // 替换为你的后端 API 地址
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token（避免 Pinia 在模块初始化时未就绪）
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 跳过 ngrok 浏览器警告拦截页
    config.headers['ngrok-skip-browser-warning'] = 'true'
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default request
