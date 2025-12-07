import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMusicStore = defineStore('music', () => {
  // 播放器状态
  const currentSong = ref(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(50)
  const songs = ref([])
  const currentBlobUrl = ref(null)
  
  // 音频元素引用（将在 MainLayout 中设置）
  const audioPlayer = ref(null)

  const setAudioPlayer = (player) => {
    audioPlayer.value = player
  }

  const setCurrentSong = (song) => {
    currentSong.value = song
  }

  const setIsPlaying = (playing) => {
    isPlaying.value = playing
  }

  const setCurrentTime = (time) => {
    currentTime.value = time
  }

  const setDuration = (dur) => {
    duration.value = dur
  }

  const setVolume = (vol) => {
    volume.value = vol
    if (audioPlayer.value) {
      audioPlayer.value.volume = vol / 100
    }
  }

  const setSongs = (songList) => {
    songs.value = songList
  }

  const setCurrentBlobUrl = (url) => {
    // 清理之前的 blob URL
    if (currentBlobUrl.value) {
      URL.revokeObjectURL(currentBlobUrl.value)
    }
    currentBlobUrl.value = url
  }

  const clearBlobUrl = () => {
    if (currentBlobUrl.value) {
      URL.revokeObjectURL(currentBlobUrl.value)
      currentBlobUrl.value = null
    }
  }

  return {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    songs,
    currentBlobUrl,
    audioPlayer,
    setAudioPlayer,
    setCurrentSong,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setSongs,
    setCurrentBlobUrl,
    clearBlobUrl
  }
})
