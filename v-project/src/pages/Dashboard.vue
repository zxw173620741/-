<template>
  <div class="dashboard-container">
    <header class="header">
      <div class="header-left">
        <span class="time">{{ currentTime }}</span>
        <span class="weather">天气：多云</span>
      </div>
      <div class="header-center">
        <h1 class="title">中国城市农业数据可视化大屏</h1>
      </div>
      <div class="header-right">
        <button class="nav-btn" @click="toHome">成本计算器</button>
        <button class="nav-btn" @click="toDashboard">数据看板</button>
        <button class="nav-btn" @click="toMore">更多看板</button>
      </div>
    </header>

    <main class="main-content">
      <aside class="column left-col">
        <div class="card box-gauge">
          <div class="card-header">{{ mapCityStore.currentProvince }}农产品流向分析</div>
          <div class="card-body">
            <Sankey />
          </div>
        </div>

        <div class="card box-line">
          <div class="card-header">全国{{ mapCityStore.currentProduct }}价格趋势</div>
          <div class="card-body">
            <TrendChart class="echarts-container" />
          </div>
        </div>
      </aside>

      <section class="column center-col">
        <div class="map-container">
          <div class="mock-map">
            <div class="map-glow"></div>
            <ChinaMapWrapper />
          </div>
        </div>

        <div class="center-bottom">
          <div class="card box-analysis">
            <div class="card-body">
              <ProductAnalysisGreen />
            </div>
          </div>
        </div>
      </section>

      <aside class="column right-col">
        <div class="card box-radar">
          <div class="card-header">区域价格方差雷达分析</div>
          <div class="card-body">
            <div class="chart-container">
              <Radar />
            </div>
          </div>
        </div>

        <div class="card box-cctv">
          <div class="card-header">农业基地实时监控</div>
          <div class="card-body">
            
            <div class="warning-container">
              <Warning />
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
// 请确保以下组件路径正确
import ChinaMapWrapper from '../components/tvecharts/ChinaMapWrapper.vue'
import TrendChart from '../components/tvecharts/TrendChart.vue'
import Radar from '../components/tvecharts/radar.vue'
import ProductAnalysisGreen from '../components/tvecharts/ProductAnalysisGreen.vue'
import Sankey from '../components/tvecharts/Sankey.vue'
import Warning from '../components/tvecharts/warning.vue'
import { mapCity } from '../stores/store.js'

const router = useRouter()
const mapCityStore = mapCity()
const currentTime = ref('')
let timer = null

const toHome = () => router.push('/')
const toDashboard = () => router.push('/dashboard')
const toMore = () => router.push('/more')

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
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
/* === 基础容器 === */
.dashboard-container {
  width: 100vw;
  height: 100vh;
  background-color: #0b1325;
  background-image:
    radial-gradient(circle at 50% 50%, #1c2e4a 0%, #0b1325 60%),
    linear-gradient(rgba(66, 227, 164, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(66, 227, 164, 0.03) 1px, transparent 1px);
  background-size:
    100% 100%,
    20px 20px,
    20px 20px;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
}

.title {
  font-size: 24px;
  color: #42e3a4;
  text-shadow: 0 0 10px rgba(66, 227, 164, 0.5);
  letter-spacing: 2px;
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

/* === 主布局 === */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 15px;
  padding: 15px;
  min-height: 0;
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
.box-gauge {
  flex: 1;
}
.box-line {
  flex: 1;
}

/* === 中间栏布局 === */
.map-container {
  flex: 2;
  position: relative;
  border: 1px solid rgba(66, 227, 164, 0.3);
  background: radial-gradient(circle, rgba(0, 30, 60, 0.8), rgba(0, 0, 0, 0));
}
.mock-map {
  width: 100%;
  height: 100%;
}

.center-bottom {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.box-analysis {
  flex: 1;
  height: 100%;
}

/* === 右侧栏布局 (优化后) === */
.box-radar {
  flex: 6; /* 雷达图占 40% 高度 */
  min-height: 0;
}

.box-cctv {
  flex: 4; /* 监控占 60% 高度 */
  min-height: 0;
}

/* 图表容器 */
.chart-container {
  width: 100%;
  height: 100%;
}

/* 监控网格 */
.cctv-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  padding: 5px;
}

.cctv-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.screen-placeholder {
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(66, 227, 164, 0.3);
  color: rgba(66, 227, 164, 0.5);
  font-family: monospace;
  position: relative;
  box-shadow: inset 0 0 15px rgba(66, 227, 164, 0.05);
  transition: all 0.3s;
}

.screen-placeholder:hover {
  border-color: #42e3a4;
  box-shadow: 0 0 10px rgba(66, 227, 164, 0.2);
}

.rec-dot {
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 10px;
  color: #ff3b3b;
  font-weight: bold;
  animation: blink 1s infinite;
  text-shadow: 0 0 5px red;
}

.cam-label {
  text-align: center;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>


