<template>
  <div class="dashboard-container">
    <!-- 动态弥散背景 -->
    <div class="ambient-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
    </div>

    <!-- 内容区域 -->
    <div class="content-wrapper">
      <el-card class="box-card glass-card">
        <template #header>
          <div class="card-header">
            <span>后端状态监测</span>
          </div>
        </template>
        <div class="status-display">
          <el-tag :type="status === '在线' ? 'success' : 'danger'" size="large">
            {{ status }}
          </el-tag>
          <div style="margin-top: 20px;">{{ message }}</div>
        </div>
        <el-button type="primary" @click="checkBackend" style="margin-top: 20px;">
          测试连接
        </el-button>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'

const status = ref('离线')
const message = ref('正在连接...')

const checkBackend = async () => {
  try {
    // 请求后端的根路径
    const res = await request.get('/')
    if (res.data.status === 'success') {
      status.value = '在线'
      message.value = res.data.message
    }
  } catch (error) {
    status.value = '离线'
    message.value = '无法连接到后端，请检查服务是否启动。'
    console.error(error)
  }
}

onMounted(() => {
  checkBackend()
})
</script>

<style scoped>
.dashboard-container {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 动态弥散背景 */
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

/* 内容区域 */
.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

/* 玻璃卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
              0 10px 15px -3px rgba(0, 0, 0, 0.05);
  border-radius: 24px;
}

.box-card {
  width: 480px;
  max-width: 90vw;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.status-display {
  text-align: center;
  padding: 20px 0;
}
</style>
