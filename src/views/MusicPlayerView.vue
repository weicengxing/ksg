<template>
  <div class="music-player-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <div class="music-header">
      <h1 class="music-title">
        <span class="title-icon">🎵</span>
        音乐播放器
      </h1>
      <div class="header-controls">
        <el-input
          v-model="searchQuery"
          placeholder="搜索歌曲、艺术家..."
          clearable
          prefix-icon="Search"
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="music-content">
      <!-- 左侧:歌曲列表 -->
      <div class="song-list-panel">
        <div class="panel-header">
          <h2>歌曲列表</h2>
          <span class="song-count">{{ filteredSongs.length }} 首歌曲</span>
        </div>
        <div class="song-list">
          <div
            v-for="(song, index) in filteredSongs"
            :key="song.id"
            :class="['song-item', { 'active': currentSong?.id === song.id, 'playing': currentSong?.id === song.id && isPlaying }]"
            @click="selectSong(song)"
          >
            <div class="song-index">{{ index + 1 }}</div>
            <div class="song-cover">
              <img
                v-if="song.coverBlobUrl"
                :src="song.coverBlobUrl"
                :alt="song.title"
                @error="(e) => handleImageError(e, song.id)"
              />
              <div v-else class="default-cover">
                <i class="cover-icon">🎵</i>
              </div>
              <div class="play-overlay" v-if="currentSong?.id === song.id && isPlaying">
                <i class="playing-icon">▶</i>
              </div>
            </div>
            <div class="song-info">
              <div class="song-title">{{ song.title }}</div>
              <div class="song-artist">{{ song.artist || '未知艺术家' }}</div>
            </div>
            <div class="song-duration">{{ formatDuration(song.duration) }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧:播放器控制面板 -->
      <div class="player-panel">
        <div class="current-song-display" v-if="currentSong">
          <div class="cover-wrapper">
            <div class="cover-display" :class="{ 'spinning': isPlaying }">
              <img
                v-if="currentSong.coverBlobUrl"
                :src="currentSong.coverBlobUrl"
                :alt="currentSong.title"
                class="large-cover"
                @error="(e) => handleImageError(e, currentSong.id)"
              />
              <div v-else class="default-large-cover">
                <i class="large-icon">🎵</i>
              </div>
            </div>
            <!-- 音波效果 -->
            <div class="sound-wave" v-if="isPlaying">
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
              <span class="wave-bar"></span>
            </div>
          </div>
          <div class="song-details">
            <h2 class="current-title">{{ currentSong.title }}</h2>
            <p class="current-artist">{{ currentSong.artist || '未知艺术家' }}</p>
            <p class="current-album" v-if="currentSong.album">{{ currentSong.album }}</p>
          </div>
        </div>
        <div class="empty-player" v-else>
          <div class="empty-icon">🎵</div>
          <p class="empty-text">选择一首歌曲开始播放</p>
        </div>

        <div class="player-controls" v-if="currentSong">
          <div class="progress-bar-container">
            <span class="time-display">{{ formatTime(currentTime) }}</span>
            <div class="progress-wrapper" @click="handleProgressClick">
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
                <div 
                  class="progress-thumb" 
                  :style="{ left: progressPercent + '%' }"
                  @mousedown="startDrag"
                  @touchstart="startDrag"
                ></div>
              </div>
            </div>
            <span class="time-display">{{ formatTime(duration) }}</span>
          </div>

          <div class="control-buttons">
            <button
              class="control-btn btn-prev"
              @click="previousSong"
              :disabled="!currentSong"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button
              class="control-btn btn-play"
              @click="togglePlay"
              :disabled="!currentSong"
            >
              <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>
            <button
              class="control-btn btn-next"
              @click="nextSong"
              :disabled="!currentSong"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 18h2V6h-2zm-11-1l8.5-6L5 5z"/>
              </svg>
            </button>
          </div>

          <div class="volume-control">
            <span class="volume-icon" @click="toggleMute">
              {{ volume === 0 ? '🔇' : volume < 50 ? '🔉' : '🔊' }}
            </span>
            <div class="volume-wrapper">
              <div class="volume-track" @click="handleVolumeClick">
                <div class="volume-fill" :style="{ width: volume + '%' }"></div>
                <div 
                  class="volume-thumb" 
                  :style="{ left: volume + '%' }"
                  @mousedown="startVolumeDrag"
                  @touchstart="startVolumeDrag"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useMusicStore } from '../stores/music'

const musicStore = useMusicStore()

const searchQuery = ref('')
const coverBlobUrlCache = ref({})
const shouldAutoPlay = ref(false)
const isDragging = ref(false)
const isVolumeDragging = ref(false)
const lastVolume = ref(50) // 用于静音前的音量记忆

const songs = computed(() => musicStore.songs)
const currentSong = computed(() => musicStore.currentSong)
const isPlaying = computed(() => musicStore.isPlaying)
const currentTime = computed(() => musicStore.currentTime)
const duration = computed(() => musicStore.duration)
const volume = computed({
  get: () => musicStore.volume,
  set: (val) => musicStore.setVolume(val)
})
const audioPlayer = computed(() => musicStore.audioPlayer)

// 计算进度百分比
const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const filteredSongs = computed(() => {
  if (!searchQuery.value.trim()) {
    return songs.value
  }
  const query = searchQuery.value.toLowerCase()
  return songs.value.filter(song => 
    song.title.toLowerCase().includes(query) ||
    (song.artist && song.artist.toLowerCase().includes(query)) ||
    (song.album && song.album.toLowerCase().includes(query))
  )
})

// 获取封面
const getCoverBlobUrl = async (filename, songId) => {
  if (coverBlobUrlCache.value[songId]) {
    return coverBlobUrlCache.value[songId]
  }
  
  try {
    const response = await request.get(`/music/image/${encodeURIComponent(filename)}`, {
      responseType: 'blob'
    })
    const blobUrl = URL.createObjectURL(response.data)
    coverBlobUrlCache.value[songId] = blobUrl
    return blobUrl
  } catch (error) {
    console.error(`获取封面 ${filename} 失败:`, error)
    return ''
  }
}

const fetchSongs = async () => {
  try {
    const response = await request.get('/music/songs')
    if (response.data && response.data.songs) {
      const songsWithCovers = await Promise.all(
        response.data.songs.map(async (song) => {
          let coverBlobUrl = ''
          if (song.cover_image) {
            coverBlobUrl = await getCoverBlobUrl(song.cover_image, song.id)
          }
          return { ...song, coverBlobUrl }
        })
      )
      musicStore.setSongs(songsWithCovers)
      
      if (musicStore.songs.length > 0 && !musicStore.currentSong) {
        selectSong(musicStore.songs[0], false)
      }
    }
  } catch (error) {
    console.error('获取歌曲列表失败:', error)
    ElMessage.error('获取歌曲列表失败')
  }
}

// 修改1：优化selectSong函数，确保自动播放逻辑更健壮
const selectSong = async (song, autoPlay = true) => {
  // 安全检查：确保audioPlayer存在
  if (!musicStore.audioPlayer) {
    ElMessage.error('音频播放器初始化失败，请刷新页面重试')
    return
  }

  try {
    // 停止当前播放
    if (musicStore.isPlaying && musicStore.audioPlayer) {
      musicStore.audioPlayer.pause()
    }
    
    // 设置当前歌曲
    musicStore.setCurrentSong(song)
    musicStore.setIsPlaying(false)
    
    // 清除旧的blob url
    musicStore.clearBlobUrl()
    
    try {
      // 请求音频文件
      const response = await request.get(`/music/play/${song.id}`, {
        responseType: 'blob'
      })
      const blobUrl = URL.createObjectURL(response.data)
      musicStore.setCurrentBlobUrl(blobUrl)
      
      // 设置音频源并加载
      musicStore.audioPlayer.src = blobUrl
      musicStore.audioPlayer.volume = musicStore.volume / 100
      
      // 监听音频可播放事件
      const onCanPlay = async () => {
        try {
          // 移除事件监听（防止重复绑定）
          musicStore.audioPlayer.removeEventListener('canplay', onCanPlay)
          
          // 如果需要自动播放
          if (autoPlay) {
            // 处理浏览器自动播放策略限制
            await musicStore.audioPlayer.play()
            musicStore.setIsPlaying(true)
            
          }
        } catch (playError) {
          console.error('播放失败:', playError)
          musicStore.setIsPlaying(false)
          // 提示用户手动点击播放
          ElMessage.warning('自动播放失败（浏览器策略限制），请点击播放按钮手动播放')
        }
      }
      
      // 监听播放结束事件
      const onEnded = () => {
        nextSong()
      }
      
      // 先移除旧的事件监听
      musicStore.audioPlayer.removeEventListener('canplay', onCanPlay)
      musicStore.audioPlayer.removeEventListener('ended', onEnded)
      
      // 绑定新的事件监听
      musicStore.audioPlayer.addEventListener('canplay', onCanPlay)
      musicStore.audioPlayer.addEventListener('ended', onEnded)
      
      // 加载音频
      musicStore.audioPlayer.load()
      
    } catch (error) {
      console.error('加载歌曲失败:', error)
      ElMessage.error(`加载歌曲 "${song.title}" 失败: ${error.message || '网络错误'}`)
    }
  } catch (error) {
    console.error('选择歌曲失败:', error)
    ElMessage.error('选择歌曲失败')
  }
}

const handleNextSongEvent = (event) => {
  if (event.detail && event.detail.song) {
    selectSong(event.detail.song, true)
  }
}

const togglePlay = () => {
  if (!musicStore.currentSong || !musicStore.audioPlayer) return
  
  if (musicStore.isPlaying) {
    musicStore.audioPlayer.pause()
    musicStore.setIsPlaying(false)
  } else {
    musicStore.audioPlayer.play().then(() => {
      musicStore.setIsPlaying(true)
    }).catch(err => {
      console.error('播放失败:', err)
      ElMessage.error('播放失败，请检查音频文件')
    })
  }
}

const previousSong = () => {
  if (!musicStore.currentSong || musicStore.songs.length === 0) return
  const currentIndex = musicStore.songs.findIndex(s => s.id === musicStore.currentSong.id)
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : musicStore.songs.length - 1
  selectSong(musicStore.songs[prevIndex], true)
}

// 修改2：修复nextSong函数的数组长度判断错误
const nextSong = () => {
  if (!musicStore.currentSong || musicStore.songs.length === 0) return
  const currentIndex = musicStore.songs.findIndex(s => s.id === musicStore.currentSong.id)
  // 错误点：currentIndex.length 改为 musicStore.songs.length
  const nextIndex = currentIndex < musicStore.songs.length - 1 ? currentIndex + 1 : 0
  selectSong(musicStore.songs[nextIndex], true)
}

// 改进的进度条拖动
const handleProgressClick = (e) => {
  if (!audioPlayer.value || !duration.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  const newTime = percent * duration.value
  audioPlayer.value.currentTime = newTime
  musicStore.setCurrentTime(newTime)
}

const startDrag = (e) => {
  isDragging.value = true
  e.preventDefault()
  
  const onMove = (moveEvent) => {
    if (!isDragging.value || !audioPlayer.value || !duration.value) return
    
    const progressWrapper = document.querySelector('.progress-wrapper')
    if (!progressWrapper) return
    
    const rect = progressWrapper.getBoundingClientRect()
    const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
    let percent = (clientX - rect.left) / rect.width
    percent = Math.max(0, Math.min(1, percent))
    
    const newTime = percent * duration.value
    audioPlayer.value.currentTime = newTime
    musicStore.setCurrentTime(newTime)
  }
  
  const onEnd = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onMove)
  document.addEventListener('touchend', onEnd)
}

// 音量控制
const handleVolumeClick = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  musicStore.setVolume(percent)
  if (audioPlayer.value) {
    audioPlayer.value.volume = percent / 100
  }
}

const startVolumeDrag = (e) => {
  isVolumeDragging.value = true
  e.preventDefault()
  
  const onMove = (moveEvent) => {
    if (!isVolumeDragging.value) return
    
    const volumeWrapper = document.querySelector('.volume-wrapper')
    if (!volumeWrapper) return
    
    const rect = volumeWrapper.getBoundingClientRect()
    const clientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX
    let percent = ((clientX - rect.left) / rect.width) * 100
    percent = Math.max(0, Math.min(100, percent))
    
    musicStore.setVolume(percent)
    if (audioPlayer.value) {
      audioPlayer.value.volume = percent / 100
    }
  }
  
  const onEnd = () => {
    isVolumeDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onMove)
  document.addEventListener('touchend', onEnd)
}

const toggleMute = () => {
  if (volume.value === 0) {
    musicStore.setVolume(lastVolume.value || 50)
  } else {
    lastVolume.value = volume.value
    musicStore.setVolume(0)
  }
  if (audioPlayer.value) {
    audioPlayer.value.volume = volume.value / 100
  }
}

const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

const handleImageError = (event, songId) => {
  event.target.style.display = 'none'
  delete coverBlobUrlCache.value[songId]
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDuration = (seconds) => {
  return formatTime(seconds)
}

// 修改3：添加对audioPlayer的监听，确保播放器初始化完成
watch(audioPlayer, (newVal) => {
  if (newVal) {
    newVal.volume = musicStore.volume / 100
    // 添加错误监听
    newVal.addEventListener('error', (e) => {
      console.error('音频播放错误:', e)
      musicStore.setIsPlaying(false)
      ElMessage.error('音频文件无法播放，请检查文件格式或网络')
    })
  }
}, { immediate: true })

onMounted(() => {
  fetchSongs()
  window.addEventListener('music-next-song', handleNextSongEvent)
  
  if (musicStore.audioPlayer) {
    musicStore.audioPlayer.volume = musicStore.volume / 100
  }
})

onUnmounted(() => {
  window.removeEventListener('music-next-song', handleNextSongEvent)
  Object.values(coverBlobUrlCache.value).forEach(blobUrl => {
    URL.revokeObjectURL(blobUrl)
  })
  coverBlobUrlCache.value = {}
  
  // 清理音频事件监听
  if (musicStore.audioPlayer) {
    musicStore.audioPlayer.removeEventListener('canplay', () => {})
    musicStore.audioPlayer.removeEventListener('ended', () => {})
    musicStore.audioPlayer.removeEventListener('error', () => {})
  }
})
</script>

<style scoped>
/* 样式部分保持不变，省略以节省篇幅 */
* {
  box-sizing: border-box;
}

.music-player-container {
  min-height: calc(100vh - 64px);
  padding: 32px;
  background: #0a0e27;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s infinite ease-in-out;
}

.bg-circle-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -250px;
  left: -250px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -200px;
  right: -200px;
  animation-delay: -7s;
}

.bg-circle-3 {
  width: 350px;
  height: 350px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  right: -175px;
  animation-delay: -14s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.music-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.music-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 36px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.search-input {
  width: 350px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: none;
}

.search-input :deep(.el-input__inner) {
  color: #fff;
}

.search-input :deep(.el-input__inner)::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.music-content {
  display: flex;
  gap: 32px;
  height: calc(100vh - 250px);
  position: relative;
  z-index: 1;
}

/* 歌曲列表面板 */
.song-list-panel {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.song-list-panel::-webkit-scrollbar {
  width: 8px;
}

.song-list-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.song-list-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.song-list-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.song-count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(8px);
  border-color: rgba(255, 255, 255, 0.1);
}

.song-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  border-color: rgba(102, 126, 234, 0.5);
}

.song-item.playing {
  animation: playing-glow 2s infinite;
}

@keyframes playing-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(102, 126, 234, 0.5);
  }
}

.song-index {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.song-item.active .song-index {
  color: #667eea;
}

.song-cover {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cover-icon {
  font-size: 24px;
  font-style: normal;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s;
}

.playing-icon {
  font-style: normal;
  color: #fff;
  font-size: 20px;
  animation: pulse 1s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #fff;
}

.song-artist {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song-duration {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
  font-weight: 500;
}

/* 播放器面板 */
.player-panel {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.current-song-display {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.cover-wrapper {
  position: relative;
  margin-bottom: 32px;
}

.cover-display {
  width: 280px;
  height: 280px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  position: relative;
}

.cover-display.spinning {
  animation: spin 20s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.large-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-large-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.large-icon {
  font-size: 100px;
  font-style: normal;
}

/* 音波效果 */
.sound-wave {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  align-items: flex-end;
  height: 30px;
}

.wave-bar {
  width: 4px;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 2px;
  animation: wave 1s infinite ease-in-out;
}

.wave-bar:nth-child(1) {
  animation-delay: 0s;
}

.wave-bar:nth-child(2) {
  animation-delay: 0.1s;
}

.wave-bar:nth-child(3) {
  animation-delay: 0.2s;
}

.wave-bar:nth-child(4) {
  animation-delay: 0.3s;
}

@keyframes wave {
  0%, 100% {
    height: 10px;
  }
  50% {
    height: 30px;
  }
}

.song-details {
  margin-top: 24px;
}

.current-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #fff;
}

.current-artist {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
}

.current-album {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.empty-player {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

/* 播放器控制 */
.player-controls {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time-display {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  min-width: 45px;
  text-align: center;
  font-weight: 500;
}

.progress-wrapper {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.1s linear;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s;
}

.progress-thumb:hover {
  transform: translate(-50%, -50%) scale(1.2);
}

.progress-thumb:active {
  transform: translate(-50%, -50%) scale(1.3);
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.control-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn svg {
  width: 24px;
  height: 24px;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.control-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-play {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.btn-play svg {
  width: 32px;
  height: 32px;
}

.btn-play:hover:not(:disabled) {
  background: linear-gradient(135deg, #7d8ff0 0%, #8b5fb8 100%);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
  transform: scale(1.1);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: center;
}

.volume-icon {
  font-size: 22px;
  cursor: pointer;
  transition: transform 0.2s;
  user-select: none;
}

.volume-icon:hover {
  transform: scale(1.1);
}

.volume-wrapper {
  width: 150px;
  height: 40px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
}

.volume-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  position: relative;
}

.volume-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.volume-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s;
}

.volume-thumb:hover {
  transform: translate(-50%, -50%) scale(1.3);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .music-content {
    flex-direction: column;
    height: auto;
  }

  .song-list-panel {
    max-height: 350px;
  }

  .player-panel {
    min-height: 500px;
  }

  .cover-display {
    width: 240px;
    height: 240px;
  }
}

@media (max-width: 768px) {
  .music-player-container {
    padding: 16px;
  }

  .music-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .search-input {
    width: 100%;
  }

  .music-content {
    gap: 16px;
  }

  .cover-display {
    width: 200px;
    height: 200px;
  }

  .current-title {
    font-size: 22px;
  }

  .current-artist {
    font-size: 16px;
  }

  .control-buttons {
    gap: 16px;
  }

  .control-btn {
    width: 48px;
    height: 48px;
  }

  .btn-play {
    width: 60px;
    height: 60px;
  }

  .song-item {
    padding: 10px 12px;
  }

  .song-cover {
    width: 48px;
    height: 48px;
  }
}
</style>