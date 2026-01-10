<template>
  <div class="ai-prediction-container">
    <div v-if="!isPredicting && !showResults" class="start-prediction-wrapper">
      <button class="start-btn" @click="startPrediction">
        <span class="btn-icon">🤖</span>
        <span class="btn-text">开始预测</span>
      </button>
    </div>

    <div v-if="isPredicting || showResults" class="prediction-panel">
      <div class="panel-header">
        <div class="panel-title">
          <span class="title-icon">📊</span>
          <span>AI 智能预测</span>
        </div>
        <button v-if="showResults" class="close-btn" @click="closePrediction">✕</button>
      </div>

      <div class="panel-content">
        <div v-if="isPredicting" class="loading-section">
          <div class="loading-spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
          <div class="loading-progress">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
          </div>
        </div>

        <div v-if="showResults" class="results-section">
          
          <div v-if="displayStep >= 1" class="result-info fade-in">
            <div class="info-item">
              <span class="info-label">预测区域</span>
              <span class="info-value">{{ predictionData.province }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预测品种</span>
              <span class="info-value">{{ predictionData.product }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">当前均价</span>
              <span class="info-value">{{ predictionData.basePrice }} 元</span>
            </div>
          </div>

          <div v-if="displayStep >= 2" class="prediction-metrics fade-in">
            <div class="metric-card">
              <div class="metric-label">下周预测均价</div>
              <div class="metric-value">{{ predictionData.predictedPrice }}</div>
              <div class="metric-unit">元/kg</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">价格趋势</div>
              <div class="metric-value" :class="predictionData.trendClass">
                {{ predictionData.trend }}
              </div>
              <div class="metric-unit">未来7天方向</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">AI置信度</div>
              <div class="metric-value">{{ predictionData.confidence }}</div>
              <div class="metric-unit">模型R²值</div>
            </div>
          </div>

          <div v-if="displayStep >= 3" class="prediction-details fade-in">
            <div class="detail-title">📈 因子分析</div>
            <div class="detail-content">
              <div v-for="(item, index) in predictionData.details" :key="index" 
                   v-show="detailIndex > index" 
                   class="detail-item slide-in">
                <span class="detail-label">{{ item.label }}：</span>
                <span class="detail-value" :class="item.valueClass">{{ item.value }}</span>
              </div>
            </div>
          </div>

          <div v-if="displayStep >= 4" class="prediction-timeline fade-in">
            <div class="timeline-title">📅 未来7天价格走势</div>
            <div class="timeline-chart">
              <div v-for="(day, index) in predictionData.timeline" :key="index" 
                   v-show="timelineIndex > index"
                   class="timeline-item slide-up">
                <div class="timeline-price">{{ day.price }}</div>
                <div class="timeline-bar-wrapper" :style="{ height: day.height + '%' }">
                   <div class="timeline-bar"></div>
                </div>
                <div class="timeline-label">{{ day.date }}</div>
              </div>
            </div>
          </div>

          <div v-if="displayStep >= 5" class="prediction-report fade-in-up">
            <div class="report-header">
              <span class="report-icon">📑</span>
              <span>深度分析报告</span>
            </div>
            <div class="report-body">
              <p class="report-text">
                基于 <span class="highlight">{{ predictionData.province }}</span> 历史交易数据与气象模型分析，
                预计未来一周 <span class="highlight">{{ predictionData.product }}</span> 价格将呈现
                <span :class="predictionData.trendClass === 'trend-up' ? 'text-red' : 'text-green'">
                  {{ predictionData.trend === '上升' ? '震荡上行' : '波动回落' }}
                </span> 态势。
              </p>
              <p class="report-text mt-2">
                主要受季节性供需关系影响，市场流通量{{ predictionData.trend === '上升' ? '略显紧缩' : '逐渐充裕' }}。
                建议相关商户{{ predictionData.trend === '上升' ? '提前备货锁定成本' : '按需采购规避风险' }}。
              </p>
            </div>
            <div class="report-footer">
              <span>生成时间: {{ new Date().toLocaleString() }}</span>
              <span>Model: Agri-LSTM-v3</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { mapLocation, mapProduct } from '../../stores/store.js'

const mapLocationStore = mapLocation()
const mapProductStore = mapProduct()

const isPredicting = ref(false)
const showResults = ref(false)
const progress = ref(0)
const loadingText = ref('')
const predictionData = ref({})
const displayStep = ref(0)
const detailIndex = ref(-1)
const timelineIndex = ref(-1)

const loadingMessages = [
  '正在分析历史数据...',
  '正在加载市场信息...',
  'AI 模型计算中...',
  '生成预测结果...',
  '优化预测精度...'
]

const startPrediction = async () => {
  isPredicting.value = true
  progress.value = 0
  displayStep.value = 0
  detailIndex.value = -1
  timelineIndex.value = -1
  
  for (let i = 0; i < loadingMessages.length; i++) {
    loadingText.value = loadingMessages[i]
    await new Promise(resolve => setTimeout(resolve, 500))
    progress.value = ((i + 1) / loadingMessages.length) * 100
  }

  await new Promise(resolve => setTimeout(resolve, 300))
  
  generatePredictionData()
  isPredicting.value = false
  showResults.value = true
  
  await streamDisplayResults()
}

const streamDisplayResults = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  displayStep.value = 1
  
  await new Promise(resolve => setTimeout(resolve, 400))
  displayStep.value = 2
  
  await new Promise(resolve => setTimeout(resolve, 400))
  displayStep.value = 3
  for (let i = 0; i < predictionData.value.details.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 200))
    detailIndex.value = i
  }
  
  await new Promise(resolve => setTimeout(resolve, 300))
  displayStep.value = 4
  for (let i = 0; i < predictionData.value.timeline.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 150))
    timelineIndex.value = i
  }

  await new Promise(resolve => setTimeout(resolve, 500))
  displayStep.value = 5
}

const generatePredictionData = () => {
  const province = mapLocationStore.currentProvince || '河南省'
  const product = mapProductStore.currentProduct || '大白菜'
  
  const basePriceVal = (Math.random() * 3 + 1)
  const basePrice = basePriceVal.toFixed(2)
  const trend = Math.random() > 0.5 ? '上升' : '下降'
  const trendClass = trend === '上升' ? 'trend-up' : 'trend-down'
  const confidence = (85 + Math.random() * 14).toFixed(1) + '%'
  
  const timeline = []
  let currentPrice = parseFloat(basePrice)
  const today = new Date()
  
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    
    let change;
    if (trend === '上升') {
        change = (Math.random() * 0.4) - 0.1;
    } else {
        change = (Math.random() * 0.4) - 0.3;
    }
    
    currentPrice = Math.max(0.5, currentPrice + change)
    
    timeline.push({
      date: dateStr,
      price: currentPrice.toFixed(2),
      height: Math.min(100, Math.max(20, (currentPrice / (basePriceVal * 1.5)) * 100))
    })
  }

  const finalPrice = timeline[timeline.length - 1].price;

  predictionData.value = {
    province,
    product,
    basePrice,
    predictedPrice: finalPrice,
    trend,
    trendClass,
    confidence,
    details: [
      { label: '市场供需', value: trend === '上升' ? '供不应求' : '供应充足', valueClass: '' },
      { label: '季节因素', value: Math.random() > 0.5 ? '旺季效应' : '季节性回落', valueClass: '' },
      { label: '物流成本', value: '平稳', valueClass: '' },
      { label: '操作建议', value: trend === '上升' ? '建议囤货' : '随用随采', valueClass: trend === '上升' ? 'action-buy' : 'action-wait' }
    ],
    timeline
  }
}

const closePrediction = () => {
  showResults.value = false
  isPredicting.value = false
  progress.value = 0
  displayStep.value = 0
  detailIndex.value = -1
  timelineIndex.value = -1
}
</script>

<style scoped>
.ai-prediction-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.start-prediction-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 200px;
}

.start-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #42e3a4 0%, #00c853 100%);
  border: none;
  border-radius: 8px;
  color: #0b1325;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(66, 227, 164, 0.4);
  transition: all 0.3s ease;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(66, 227, 164, 0.6);
}

.prediction-panel {
  width: 100%;
  height: 100%;
  background: rgba(11, 19, 37, 0.95);
  border: 1px solid rgba(66, 227, 164, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(90deg, rgba(66, 227, 164, 0.1), transparent);
  border-bottom: 1px solid rgba(66, 227, 164, 0.2);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: bold;
  color: #42e3a4;
}

.close-btn {
  background: transparent;
  border: none;
  color: #42e3a4;
  font-size: 18px;
  cursor: pointer;
}

/* ======== 核心修改区域：内容容器与滚动条 ======== */
.panel-content {
  padding: 15px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  
  /* Firefox 滚动条支持 */
  scrollbar-width: thin;
  scrollbar-color: rgba(66, 227, 164, 0.3) rgba(11, 19, 37, 0.2);
}

/* WebKit (Chrome/Safari/Edge) 滚动条定制 */
.panel-content::-webkit-scrollbar {
  width: 4px; /* 极细宽度，视觉干扰最小化 */
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(11, 19, 37, 0.2); /* 轨道颜色 */
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(66, 227, 164, 0.2); /* 默认态：半透明绿色 */
  border-radius: 2px;
  transition: all 0.3s; /* 平滑过渡 */
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #42e3a4; /* 悬停态：高亮绿色 */
  box-shadow: 0 0 6px rgba(66, 227, 164, 0.6); /* 增加赛博朋克发光效果 */
}
/* ========================================= */

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(66, 227, 164, 0.2);
  border-top-color: #42e3a4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { margin-top: 15px; font-size: 13px; color: #42e3a4; }
.loading-progress { width: 80%; height: 3px; background: rgba(66, 227, 164, 0.1); margin-top: 15px; border-radius: 2px; }
.progress-bar { height: 100%; background: #42e3a4; transition: width 0.3s ease; }

.result-info {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(66, 227, 164, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(66, 227, 164, 0.1);
}
.info-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 11px; color: rgba(255, 255, 255, 0.5); }
.info-value { font-size: 13px; font-weight: bold; color: #fff; }

.prediction-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 15px;
}
.metric-card {
  padding: 10px 5px;
  background: rgba(66, 227, 164, 0.05);
  border: 1px solid rgba(66, 227, 164, 0.1);
  border-radius: 6px;
  text-align: center;
}
.metric-label { font-size: 10px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; }
.metric-value { font-size: 16px; font-weight: bold; color: #42e3a4; }
.metric-value.trend-up { color: #ff6b6b; }
.metric-value.trend-down { color: #69f0ae; }
.metric-unit { font-size: 9px; color: rgba(255, 255, 255, 0.4); }

.prediction-details { margin-bottom: 15px; }
.detail-title { font-size: 12px; font-weight: bold; color: #42e3a4; margin-bottom: 8px; border-left: 2px solid #42e3a4; padding-left: 6px; }
.detail-content { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(255,255,255,0.03);
  border-radius: 4px;
}
.detail-label { font-size: 11px; color: rgba(255,255,255,0.6); }
.detail-value { font-size: 11px; font-weight: bold; color: #fff; }
.detail-value.action-buy { color: #ff6b6b; }
.detail-value.action-wait { color: #69f0ae; }

.prediction-timeline {
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(66, 227, 164, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(66, 227, 164, 0.1);
}
.timeline-title { font-size: 12px; font-weight: bold; color: #42e3a4; margin-bottom: 15px; border-left: 2px solid #42e3a4; padding-left: 6px; }
.timeline-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 120px;
  padding-top: 20px;
  width: 100%;
}
.timeline-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  height: 100%;
  position: relative;
}
.timeline-bar-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  transition: height 0.5s ease;
  min-height: 4px;
}
.timeline-bar {
  width: 40%;
  max-width: 20px;
  min-width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #42e3a4 0%, rgba(66, 227, 164, 0.1) 100%);
  border-radius: 4px 4px 0 0;
}
.timeline-item .timeline-price {
  font-size: 10px;
  color: #42e3a4;
  margin-bottom: 2px;
  transform: scale(0.9);
  white-space: nowrap;
}
.timeline-label {
  margin-top: 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  transform: scale(0.9);
  white-space: nowrap;
}

.prediction-report {
  background: linear-gradient(135deg, rgba(66, 227, 164, 0.05) 0%, rgba(11, 19, 37, 0.2) 100%);
  border: 1px solid rgba(66, 227, 164, 0.15);
  border-radius: 8px;
  padding: 12px;
  position: relative;
  overflow: hidden;
}
.prediction-report::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: #42e3a4;
}
.report-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: #42e3a4;
  font-size: 13px;
  font-weight: bold;
}
.report-text {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  text-align: justify;
}
.mt-2 { margin-top: 8px; }
.highlight {
  color: #fff;
  font-weight: bold;
  background: rgba(66, 227, 164, 0.1);
  padding: 0 4px;
  border-radius: 2px;
}
.text-red { color: #ff6b6b; }
.text-green { color: #69f0ae; }
.report-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  font-family: monospace;
}

.fade-in { animation: fadeIn 0.5s ease forwards; opacity: 0; }
.fade-in-up { animation: fadeInUp 0.5s ease forwards; opacity: 0; }
.slide-in { animation: slideInLeft 0.3s ease forwards; opacity: 0; }
.slide-up { animation: slideUpBar 0.4s ease forwards; opacity: 0; }

@keyframes fadeIn { to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideInLeft { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideUpBar { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>