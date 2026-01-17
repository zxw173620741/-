<template>
  <div class="dashboard-container">
    <!-- 视频背景（从第一段合并） -->
    <video 
      autoplay 
      muted 
      loop 
      playsinline 
      class="video-background"
    >
      <source src="/videos/bg03.mp4" type="video/mp4" />
    </video>
    
    <!-- 独立的遮罩层元素 -->
    <div class="video-overlay"></div>

    <header class="header">
      <div class="header-left">
        <span class="time">{{ currentTime }}</span>
        <span class="weather">天气：多云</span>
      </div>
      <div class="header-center">
        <h1 class="title">价溯云图</h1>
      </div>
      <div class="header-right">
        <button class="nav-btn" @click="toHome">成本计算器</button>
        <button class="nav-btn voice-btn" :class="{ active: voiceBroadcastStore.isEnabled }" @click="toggleVoiceBroadcast">
          {{ voiceBroadcastStore.isEnabled ? '🔊 语音播报已开启' : '🔇 语音播报' }}
        </button>
        <button class="nav-btn recognition-btn" :class="{ active: voiceRecognitionStore.isListening }" @click="toggleVoiceRecognition">
          {{ voiceRecognitionStore.isListening ? '🎤 正在倾听...' : '🎤 语音识别' }}
        </button>
        <button class="nav-btn" @click="toMore">更多看板</button>
      </div>
    </header>

    <main class="main-content">
      <aside class="column left-col">
        <div class="card box-gauge">
          <div class="card-header">{{ mapLocationStore.currentProvince }}农产品流向分析</div>
          <div class="card-body">
            <Sankey />
          </div>
        </div>

        <div class="card box-line">
          <div class="card-header">{{ mapLocationStore.currentProvince }}{{ mapProductStore.currentProduct }}价格趋势</div>
          <div class="card-body">
            <TrendChart class="echarts-container" :modalVisible="showPricePrediction" />
          </div>
        </div>
      </aside>

      <section class="column center-col">
        <div class="map-container">
          <div class="mock-map">
            <div class="map-glow"></div>
            <ChinaMapWrapper ref="chinaMapWrapperRef" />
          </div>
        </div>

        <div class="center-bottom">
          <div class="card box-analysis-left">
            <div class="card-body">
              <ProductAnalysisGreen />
            </div>
          </div>
          <div class="card box-analysis-right">
            <div class="card-body">
              <PriceTrendChart />
            </div>
          </div>
        </div>
      </section>

      <aside class="column right-col">
        <div class="card box-radar">
          <div class="card-header">AI 智能决策分析</div>
          <div class="card-body">
            <AiPrediction />
          </div>
        </div>

        <div class="card box-cctv">
          <div class="card-header">⚠️ 预警提示</div>
          <div class="card-body">
            <div class="warning-container">
              <Warning :province="mapLocationStore.currentProvince" :product="mapProductStore.currentProduct" />
            </div>
          </div>
        </div>
      </aside>
    </main>

    <PricePrediction 
      :visible="showPricePrediction" 
      @close="showPricePrediction = false"
      @confirm="(data) => { console.log('预测确认:', data); speak('预测已保存') }"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
// 请确保以下组件路径正确
import ChinaMapWrapper from '../components/tvecharts/ChinaMapWrapper.vue'
import TrendChart from '../components/tvecharts/TrendChart.vue'
import ProductAnalysisGreen from '../components/tvecharts/ProductAnalysisGreen.vue'
import PriceTrendChart from '../components/tvecharts/PriceTrendChart.vue'
import Sankey from '../components/tvecharts/Sankey.vue'
import Warning from '../components/tvecharts/warning.vue'
import AiPrediction from '../components/aiprediction/AiPrediction.vue'
import PricePrediction from '../components/priceprediction/PricePrediction.vue'
import { mapLocation, mapProduct, voiceBroadcast, voiceRecognition } from '../stores/store.js'
import { speak } from '../api/requestFuntion.js'

const router = useRouter()
const mapLocationStore = mapLocation()
const mapProductStore = mapProduct()
const voiceBroadcastStore = voiceBroadcast()
const voiceRecognitionStore = voiceRecognition()
const chinaMapWrapperRef = ref(null)
const currentTime = ref('')
const showPricePrediction = ref(false)
let timer = null

const toHome = () => router.push('/')
const toDashboard = () => router.push('/dashboard')
const toMore = () => router.push('/more')

const toggleVoiceBroadcast = () => {
  voiceBroadcastStore.toggleVoiceBroadcast()
}

const toggleVoiceRecognition = () => {
  voiceRecognitionStore.toggleVoiceRecognition()
  
  if (voiceRecognitionStore.isEnabled) {
    voiceRecognitionStore.startListening()
  } else {
    voiceRecognitionStore.stopListening()
  }
}

const hello = (event) => {
  if (event.key === '1') {
    event.preventDefault()
    event.stopPropagation()
    speak('我在，有什么可以帮助到你')
    console.log('唤醒回应')
  }
  if (event.key === '2') {
    event.preventDefault()
    event.stopPropagation()
    speak('好的，我已切换四川省成都市的黄瓜 数据面板')
    chinaMapWrapperRef.value?.loadProvinceAndHighlightCity('四川省', '成都市')
    mapProductStore.setCurrentProduct('黄瓜')
    console.log('切换四川省成都市黄瓜')
  }
  if (event.key === '3') {
    event.preventDefault()
    event.stopPropagation()
    speak('四川省黄瓜价格，均价呈伴随波动的稳定趋势，整体行情波动较大。')
  }
  if (event.key === '4') {
    event.preventDefault()
    event.stopPropagation()
    speak('好的，即将为您执行命令')
  }
  if (event.key === '0') {
    event.preventDefault()
    event.stopPropagation()
    showPricePrediction.value = true
    
    setTimeout(() => {
      speak('已打开价格预测面板')
    }, 2000)
    console.log('打开价格预测')
  }
}

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
  window.addEventListener('keydown', hello)
})

onUnmounted(() => {
  clearInterval(timer)
  window.removeEventListener('keydown', hello)
})
</script>

<style>
/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
/* === 基础容器：添加 position 为了承载视频层 === */
.dashboard-container {
  position: relative; /* 必需：让视频在容器下方 */
  width: 100vw;
  height: 100vh;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 视频背景定位（从第一段复制） */
.video-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1; /* 保证在所有内容之下 */
  pointer-events: none;
  filter: brightness(1) contrast(1.1) saturate(1.1) hue-rotate(5deg);
  opacity: 0.95;
  animation: video-pulse 20s ease-in-out infinite;
}

/* 独立的视频遮罩层 */
.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(11, 19, 37, 0.3) 0%,
    rgba(11, 19, 37, 0.5) 50%,
    rgba(11, 19, 37, 0.7) 100%
  );
  background-image:
    radial-gradient(circle at 50% 50%, rgba(28, 46, 74, 0.5) 0%, rgba(11, 19, 37, 0.5) 60%),
    linear-gradient(rgba(66, 227, 164, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(66, 227, 164, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 20px 20px, 20px 20px;
  z-index: 1;
  pointer-events: none;
}

@keyframes video-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.95;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

/* 响应式设计：确保视频在不同屏幕尺寸下的良好表现 */
@media (max-width: 768px) {
  .video-background {
    /* 在小屏幕上保持视频的正确比例和覆盖 */
    object-fit: cover;
    min-width: 100%;
    min-height: 100%;
  }
}

@media (max-height: 480px) {
  .video-background {
    /* 在小高度屏幕上调整视频显示 */
    object-fit: cover;
    min-width: 100%;
    min-height: 100%;
  }
}

/* === Header === */
.header {
  height: 8vh;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: url('https://img.alicdn.com/tfs/TB1L.VDX4v1gK0jSZFFXXb0sXXa-1920-100.png') no-repeat
    center bottom;
  background-size: 100% 100%;
  border-bottom: 2px solid #42e3a4;
  z-index: 10;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #42e3a4 0%, #00a884 50%, #42e3a4 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(66, 227, 164, 0.8),
               0 0 40px rgba(66, 227, 164, 0.4),
               0 0 60px rgba(66, 227, 164, 0.2);
  letter-spacing: 8px;
  position: relative;
  animation: shimmer 3s ease-in-out infinite;
}

.title::before {
  content: '价溯云图';
  position: absolute;
  left: 0;
  top: 0;
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  filter: blur(8px);
  animation: glow 2s ease-in-out infinite;
  z-index: -1;
}

.title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #42e3a4, #ffd700, #42e3a4, transparent);
  border-radius: 2px;
  animation: line-expand 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes glow {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
}

@keyframes line-expand {
  0%, 100% {
    width: 40%;
    opacity: 0.5;
  }
  50% {
    width: 80%;
    opacity: 1;
  }
}

.nav-btn {
  background: transparent;
  border: 1px solid #42e3a4;
  color: #42e3a4;
  padding: 5px 15px;
  margin-left: 10px;
  cursor: pointer;
  clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
  transition: all 0.3s;
}
.nav-btn:hover {
  background: rgba(66, 227, 164, 0.2);
  box-shadow: 0 0 10px rgba(66, 227, 164, 0.4);
}

.voice-btn.active {
  background: rgba(66, 227, 164, 0.3);
  border-color: #42e3a4;
  box-shadow: 0 0 15px rgba(66, 227, 164, 0.5);
  animation: pulse 2s infinite;
}

.recognition-btn.active {
  background: rgba(66, 227, 164, 0.3);
  border-color: #42e3a4;
  box-shadow: 0 0 15px rgba(66, 227, 164, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 15px rgba(66, 227, 164, 0.5);
  }
  50% {
    box-shadow: 0 0 25px rgba(66, 227, 164, 0.8);
  }
}

/* === 主布局 === */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 15px;
  padding: 15px;
  min-height: 0;
  z-index: 10; /* 保证主内容在视频之上 */
}

.column {
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  min-height: 0;
}

/* === 卡片通用样式 === */
.card {
  background: rgba(13, 30, 60, 0.6);
  border: 1px solid rgba(66, 227, 164, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 10px rgba(66, 227, 164, 0.05);
}

/* 四角装饰 */
.card::before {
  content: ''; 
  position: absolute;
  top: -1px;
  left: -1px;
  width: 10px;
  height: 10px;
  border-top: 2px solid #42e3a4;
  border-left: 2px solid #42e3a4;
}
.card::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 10px;
  height: 10px;
  border-bottom: 2px solid #42e3a4;
  border-right: 2px solid #42e3a4;
}

.card-header {
  height: 35px;
  line-height: 35px;
  padding-left: 15px;
  font-size: 14px;
  font-weight: bold;
  color: #42e3a4;
  border-left: 3px solid #42e3a4;
  background: linear-gradient(90deg, rgba(66, 227, 164, 0.1), transparent);
  border-bottom: 1px solid rgba(66, 227, 164, 0.1);
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  padding: 10px;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

/* === 左侧栏布局 === */
.box-gauge { flex: 1; }
.box-line { flex: 1; }

/* === 中间栏布局 === */
.map-container {
  flex: 3;
  position: relative;
  border: 1px solid rgba(66, 227, 164, 0.3);
  background: radial-gradient(circle, rgba(0, 30, 60, 0.8), rgba(0, 0, 0, 0));
}
.mock-map { width: 100%; height: 100%; }

.center-bottom { flex: 1; display: flex; gap: 15px; }
.box-analysis-left { flex: 2; height: 100%; }
.box-analysis-right { flex: 3; height: 100%; }

/* === 右侧栏布局 (优化后) === */
.box-radar { flex: 6; min-height: 0; }
.box-cctv { flex: 4; min-height: 0; }

/* 监控网格等 */
.cctv-grid { width: 100%; height: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 10px; padding: 5px; }
.warning-container { width: 100%; height: 100%; }
.screen-placeholder { flex: 1; background: #000; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(66, 227, 164, 0.3); color: rgba(66, 227, 164, 0.5); font-family: monospace; position: relative; box-shadow: inset 0 0 15px rgba(66, 227, 164, 0.05); transition: all 0.3s; }

.screen-placeholder:hover { border-color: #42e3a4; box-shadow: 0 0 10px rgba(66, 227, 164, 0.2); }

.rec-dot { position: absolute; top: 5px; left: 5px; font-size: 10px; color: #ff3b3b; font-weight: bold; animation: blink 1s infinite; text-shadow: 0 0 5px red; }
.cam-label { text-align: center; font-size: 10px; color: rgba(255, 255, 255, 0.4); white-space: nowrap; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>
