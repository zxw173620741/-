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
        <button class="nav-btn" @click="toHome">
          首页
        </button>

        <button class="nav-btn" @click="toDashboard">
          数据看板
        </button>

        <button class="nav-btn" @click="toMore">
          更多看板
        </button>

      </div>
    </header>

    <main class="main-content">

      <aside class="column left-col">
        <div class="card box-gauge">
          <div class="card-header">总览统计</div>
          <div class="card-body center-content">
            <div class="mock-chart circle-chart">
              <span class="highlight">68%</span>
            </div>
            <div class="gauge-info">
              <div>☀ 123 已完成</div>
              <div>待完成 123 ❄</div>
            </div>
          </div>
        </div>

        <div class="card box-line">
          <div class="card-header">
            总览统计
            <div class="tabs">
             
            </div>
          </div>
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
          <div class="card box-bar">
            <div class="card-header">总览统计</div>
            <div class="card-body">
              <div class="mock-chart bar-placeholder">[柱状图]</div>
            </div>
          </div>
          <div class="card box-alert">
            <div class="card-header">实时告警</div>
            <div class="card-body">
              <div class="alert-item error">⚠ I级 某某花园发生严重洪涝...</div>
              <div class="alert-item warning">⚠ II级 某某路段发生...</div>
            </div>
          </div>
        </div>
      </section>

      <aside class="column right-col">
        <div class="card box-metrics">
          <div class="card-header">总览统计</div>
          <div class="card-body hex-grid">
            <div class="hex-item" v-for="i in 4" :key="i">
              <div class="hex-icon">🏠</div>
              <div class="hex-text">
                <div class="label">数据类型</div>
                <div class="value">2,888</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card box-pie">
          <div class="card-header">总览统计</div>
          <div class="card-body flex-row">
            <div class="mock-chart pie-placeholder">[饼图]</div>
            <ul class="legend">
              <li>类型一 10.28%</li>
              <li>类型二 26.50%</li>
              <li>类型三 23.14%</li>
            </ul>
          </div>
        </div>

        <div class="card box-cctv">
          <div class="card-header">总览统计</div>
          <div class="card-body cctv-grid">
            <div class="cctv-item" v-for="n in 4" :key="n">
              <div class="screen-placeholder">CAM-0{{ n }}</div>
              <span class="cam-label">A1-视频监控</span>
            </div>
          </div>
        </div>
      </aside>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import ChinaMap from '../components/tvecharts/ChinaMap.vue';
import ChinaMapWrapper from '../components/tvecharts/ChinaMapWrapper.vue';
import TrendChart from '../components/tvecharts/TrendChart.vue';
import { mapCity } from '/src/store/store.js';

const router = useRouter();
const mapCityStore = mapCity();
// 简单的时间逻辑
const currentTime = ref('');
let timer = null;

const toHome = () => {
  router.push('/');
};

// 去看板
const toDashboard = () => {
  router.push('/dashboard'); // 假设你的路由叫这个
};

// 去更多
const toMore = () => {
  router.push('/more');
};

const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false });
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
/* --- 全局变量与背景 --- */
.dashboard-container {
  width: 100vw;
  height: 100vh;
  background-color: #0b1325;
  /* 深蓝背景 */
  background-image:
    radial-gradient(circle at 50% 50%, #1c2e4a 0%, #0b1325 60%),
    linear-gradient(rgba(69, 208, 178, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(69, 208, 178, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 20px 20px, 20px 20px;
  /* 网格背景模拟 */
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

/* --- 1. Header 样式 --- */
.header {
  height: 8vh;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: url('https://img.alicdn.com/tfs/TB1L.VDX4v1gK0jSZFFXXb0sXXa-1920-100.png') no-repeat center bottom;
  /* 模拟大屏顶部的图片条 */
  background-size: 100% 100%;
  border-bottom: 2px solid #00f0ff;
}

.title {
  font-size: 24px;
  color: #00f0ff;
  text-shadow: 0 0 10px #00f0ff;
  letter-spacing: 2px;
}

.nav-btn {
  background: transparent;
  border: 1px solid #007acc;
  color: #00f0ff;
  padding: 5px 15px;
  margin-left: 10px;
  cursor: pointer;
  clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
  /* 切角按钮 */
}

/* --- 2. 主布局 (Grid) --- */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  /* <-- 改成这样 */
  /* 左 中 右 比例 */
  gap: 15px;
  padding: 15px;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* --- 通用卡片样式 (FUI 边框) --- */
.card {
  background: rgba(13, 30, 60, 0.6);
  border: 1px solid rgba(0, 240, 255, 0.2);
  position: relative;
  display: flex;
  flex-direction: column;
  /* 四角装饰模拟 */
  box-shadow: inset 0 0 10px rgba(0, 240, 255, 0.1);
}

.card::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  height: 10px;
  border-top: 2px solid #00f0ff;
  border-left: 2px solid #00f0ff;
  border-right: 2px solid #00f0ff;
  width: 10px;
  /* 左上角 */
}

/* 实际上应该用四个伪元素或 SVG 边框图来实现完整的四角效果 */

.card-header {
  height: 30px;
  line-height: 30px;
  padding-left: 15px;
  font-size: 14px;
  font-weight: bold;
  border-left: 3px solid #45d0b2;
  background: linear-gradient(90deg, rgba(69, 208, 178, 0.1), transparent);
  display: flex;
  justify-content: space-between;
  padding-right: 10px;
}

.card-body {
  flex: 1;
  padding: 10px;
  overflow: hidden;
  position: relative;
}

/* --- 具体模块内部样式 --- */

/* 左侧 */
.box-gauge {
  flex: 1.5;
}

.box-line {
  flex: 4;
}

.box-table {
  flex: 2;
}

.circle-chart {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 5px solid #333;
  border-top-color: #ffd700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.data-list .list-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

/* 中间 */
.map-container {
  flex: 2;
  position: relative;
  border: 1px solid rgba(0, 240, 255, 0.3);
  background: radial-gradient(circle, rgba(0, 30, 60, 0.8), rgba(0, 0, 0, 0));
}

.mock-map {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00f0ff;
  text-shadow: 0 0 20px #00f0ff;
}

.center-bottom {
  flex: 1;
  display: flex;
  gap: 15px;
}

.box-bar,
.box-alert {
  flex: 1;
}

.alert-item {
  padding: 8px;
  margin-bottom: 5px;
  font-size: 12px;
  background: rgba(255, 0, 0, 0.1);
  border-left: 3px solid red;
}

/* 右侧 */
.box-metrics {
  flex: 1.5;
}

.box-pie {
  flex: 1.5;
}

.box-cctv {
  flex: 2;
}

.hex-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.hex-item {
  background: rgba(0, 240, 255, 0.05);
  display: flex;
  align-items: center;
  border: 1px solid rgba(0, 240, 255, 0.2);
  padding: 5px;
}

.cctv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 5px;
  height: 100%;
}

.screen-placeholder {
  background: #000;
  height: 80%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #333;
  color: #555;
}

.cam-label {
  display: block;
  text-align: center;
  font-size: 10px;
  color: #aaa;
}

/* --- 辅助类 --- */
.highlight {
  font-size: 20px;
  color: #ffd700;
  font-weight: bold;
}

.highlight-text {
  color: #45d0b2;
}

.tabs span {
  font-size: 12px;
  padding: 2px 5px;
  cursor: pointer;
}

.tabs .active {
  background: #45d0b2;
  color: #000;
}
</style>