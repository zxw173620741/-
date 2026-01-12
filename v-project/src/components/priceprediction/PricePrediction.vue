<template>
  <div v-if="visible" class="price-prediction-overlay" @click.self="close">
    <div class="price-prediction-modal">
      <div class="modal-decoration-line"></div>
      
      <div class="modal-header">
        <div class="header-title">
          <div class="icon-box">
            <span class="pulse-dot"></span>
            <span class="title-icon">🧠</span>
          </div>
          <div class="title-text-group">
            <span class="title-main">Agr-Brain 价格预测引擎</span>
            <span class="title-sub">LSTM-V3 Model / Real-time Inference</span>
          </div>
        </div>
        <button class="close-btn" @click="close">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="modal-body">
        
        <div class="hero-section">
          <div class="product-tag-float">
            <span class="p-icon">🥒</span> {{ selectedProduct }} (Category A)
          </div>
          
          <div class="date-hero-wrapper">
            <label class="hero-label">PREDICTION TARGET DATE</label>
            <div class="date-display-box" :class="{ 'disabled': isLoading }">
              <input 
                v-model="targetDate" 
                type="date" 
                class="hero-date-input"
                :min="minDate"
                :disabled="isLoading"
              >
              <span class="edit-hint" v-if="!isLoading">点击更改日期</span>
            </div>
          </div>
        </div>

        <div v-if="isLoading" class="loading-container">
          <div class="scanner-wrapper">
            <div class="scan-ring"></div>
            <div class="scan-core"></div>
          </div>
          <div class="loading-text">
            AGR-BRAIN 引擎正在分析中
            <span class="dot-flashing"></span>
          </div>
          <div class="loading-sub">正在检索气象数据与历史行情...</div>
        </div>

        <div v-else class="result-container animate-fade-in">
          <div class="dashboard-grid">
            <div class="metric-card price-card">
              <div class="card-header">
                <span class="card-label">预测单价</span>
                <span class="live-badge">AI LIVE</span>
              </div>
              <div class="price-display">
                <span class="currency">¥</span>
                <span class="big-number">{{ predictedPrice }}</span>
                <span class="unit">/kg</span>
              </div>
              <div class="trend-row">
                <div class="trend-badge" :class="trendClass">
                  <span class="trend-arrow">{{ trendIcon }}</span> {{ trendText }}
                </div>
                <span class="diff-text" :class="diffClass">{{ priceDiff }}</span>
              </div>
            </div>

            <div class="metric-card analysis-card">
              <div class="card-label">影响因子分析</div>
              <div class="factor-list">
                <div class="factor-item">
                  <span class="f-name">🌦️ 气象条件</span>
                  <div class="f-bar-bg"><div class="f-bar" :style="{width: factors.weather + '%', background: '#42e3a4'}"></div></div>
                  <span class="f-val">{{ factors.weather }}%</span>
                </div>
                <div class="factor-item">
                  <span class="f-name">📦 库存周转</span>
                  <div class="f-bar-bg"><div class="f-bar" :style="{width: factors.inventory + '%', background: '#ffd700'}"></div></div>
                  <span class="f-val">{{ factors.inventory }}%</span>
                </div>
                <div class="factor-item">
                  <span class="f-name">🚚 物流成本</span>
                  <div class="f-bar-bg"><div class="f-bar" :style="{width: factors.logistics + '%', background: '#ff6b6b'}"></div></div>
                  <span class="f-val">{{ factors.logistics }}%</span>
                </div>
              </div>
            </div>

            <div class="metric-card confidence-card">
              <div class="card-label">模型准确率</div>
              <div class="confidence-circle">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="circle" :stroke-dasharray="`${confidence}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div class="percentage-text">{{ confidence }}<span class="pct">%</span></div>
              </div>
              <div class="risk-label">风险等级: <span style="color:#42e3a4">低</span></div>
            </div>
          </div>

          <div class="chart-section">
            <div class="chart-header">
              <div class="chart-title">
                <span class="chart-icon">📈</span> 近7日走势拟合 & 未来预测
              </div>
              <div class="legend">
                <span class="dot history"></span>历史数据
                <span class="dot predict"></span>AI预测点
              </div>
            </div>
            <div ref="chartRef" class="chart-container"></div>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">取消操作</button>
        <button class="btn btn-primary" @click="confirmPrediction" :disabled="isLoading" :style="{ opacity: isLoading ? 0.5 : 1 }">
          <span class="btn-icon">⚡</span> 采纳该预测值
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { mapLocation, mapProduct } from '../../stores/store.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'confirm'])

// Store
const mapLocationStore = mapLocation()
const mapProductStore = mapProduct()

const productName = computed(() => mapProductStore.currentProduct)
const provinceName = computed(() => mapLocationStore.currentProvince)

// State
const targetDate = ref('')
const selectedProduct = ref(productName.value || '黄瓜')
const chartRef = ref(null)
const isLoading = ref(false) // 新增 Loading 状态
let chartInstance = null

const predictedPrice = ref('0.00')
const confidence = ref('0')
const factors = ref({ weather: 0, inventory: 0, logistics: 0 })

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const defaultDate = computed(() => {
  const today = new Date()
  today.setDate(today.getDate() + 2)
  return today.toISOString().split('T')[0]
})

// 监听 store 变化，如果弹窗开着就重新预测
watch([productName, provinceName], () => {
  selectedProduct.value = productName.value || '黄瓜'
  if (props.visible) {
    generatePrediction()
  }
})

// 计算属性：趋势
const trendClass = computed(() => {
  const price = parseFloat(predictedPrice.value)
  if (price > 6) return 'trend-up'
  if (price < 4) return 'trend-down'
  return 'trend-stable'
})

const trendIcon = computed(() => {
  const price = parseFloat(predictedPrice.value)
  if (price > 6) return '▲'
  if (price < 4) return '▼'
  return '●'
})

const trendText = computed(() => {
  const price = parseFloat(predictedPrice.value)
  if (price > 6) return '强力看涨'
  if (price < 4) return '持续下跌'
  return '市场平稳'
})

// 计算属性：环比
const priceDiff = computed(() => {
  const current = parseFloat(predictedPrice.value)
  const base = 5.0
  const diff = ((current - base) / base * 100).toFixed(1)
  return (diff > 0 ? '+' : '') + diff + '%'
})

const diffClass = computed(() => {
  return parseFloat(predictedPrice.value) >= 5 ? 'diff-up' : 'diff-down'
})

// 核心逻辑：生成预测 (带模拟延迟)
const generatePrediction = () => {
  // 1. 开启 Loading
  isLoading.value = true
  
  // 销毁旧图表，防止残留
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }

  // 2. 模拟 1.5秒 AI 计算延迟
  setTimeout(async () => {
    let basePrice = 0
    
    // 简单的模拟逻辑
    if (provinceName.value === '河南省' && productName.value === '大白菜') {
      basePrice = 1.5 + Math.random() * 1.5
    } else if (provinceName.value === '河南省' && productName.value === '黄瓜') {
      basePrice = 5.5 + Math.random() * 2.5
    } else if (provinceName.value === '四川省' && productName.value === '黄瓜') {
      basePrice = 4 + Math.random() * 4
    } else if (provinceName.value === '四川省' && productName.value === '大白菜') {
      basePrice = 2 + Math.random() * 1
    } else {
      basePrice = 5
    }
    
    const variance = (Math.random() - 0.5) * 0.5
    predictedPrice.value = (basePrice + variance).toFixed(2)
    confidence.value = Math.floor(80 + Math.random() * 18)
    
    factors.value = {
      weather: Math.floor(Math.random() * 40 + 50),
      inventory: Math.floor(Math.random() * 60 + 20),
      logistics: Math.floor(Math.random() * 30 + 10)
    }

    // 3. 计算完成，关闭 Loading
    isLoading.value = false
    
    // 4. 等待 DOM 渲染完毕后初始化图表
    await nextTick()
    initChart()
    
  }, 1500)
}

// 图表初始化
const initChart = () => {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()
  chartInstance = echarts.init(chartRef.value)
  
  const dates = []
  const prices = []
  const today = new Date()
  
  // 简单的基准价格逻辑用于图表历史数据
  let basePrice = parseFloat(predictedPrice.value) || 5
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0].substring(5))
    // 制造一些波动
    prices.push((basePrice + Math.sin(i) * 0.5 + (Math.random() - 0.5) * 0.3).toFixed(2))
  }
  
  dates.push(targetDate.value ? targetDate.value.substring(5) : '预测')
  prices.push(predictedPrice.value)
  
  const option = {
    backgroundColor: 'transparent',
    grid: {
      top: '20%', left: '2%', right: '4%', bottom: '5%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(5, 20, 15, 0.95)',
      borderColor: '#42e3a4',
      textStyle: { color: '#fff', fontFamily: 'monospace' },
      formatter: (params) => {
        const item = params[0]
        const isPredict = item.dataIndex === prices.length - 1
        return `<div style="color:#8aa;font-size:12px;margin-bottom:4px">${item.name}</div>
                <div style="color:${isPredict ? '#ffd700' : '#42e3a4'};font-weight:bold">
                  ${isPredict ? '🔮 预测' : '📅 历史'}: ${item.value}
                </div>`
      }
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { color: '#688', fontSize: 11 },
      axisLine: { lineStyle: { color: '#2c4a45' } },
      axisTick: { show: false },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(66, 227, 164, 0.08)', type: 'dashed' } },
      axisLabel: { color: '#587a75' }
    },
    series: [
      {
        name: '价格',
        type: 'line',
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: (val, params) => params.dataIndex === prices.length - 1 ? 12 : 6,
        itemStyle: {
          color: (params) => params.dataIndex === prices.length - 1 ? '#ffd700' : '#42e3a4',
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: (params) => params.dataIndex === prices.length - 1 ? '#ffd700' : 'transparent'
        },
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#42e3a4' },
            { offset: 1, color: '#ffd700' }
          ]),
          shadowColor: 'rgba(66, 227, 164, 0.5)',
          shadowBlur: 10
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(66, 227, 164, 0.3)' },
            { offset: 1, color: 'rgba(66, 227, 164, 0.0)' }
          ])
        },
        data: prices,
        markLine: {
          symbol: 'none',
          data: [{ type: 'average', name: 'Avg' }],
          lineStyle: { color: 'rgba(255,255,255,0.2)', type: 'dotted' },
          label: { show: false }
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const close = () => {
  emit('close')
}

const confirmPrediction = () => {
  if (isLoading.value) return
  emit('confirm', {
    date: targetDate.value,
    product: selectedProduct.value,
    price: predictedPrice.value,
    confidence: confidence.value
  })
  close()
}

// 监听 visible 属性
watch(() => props.visible, (newVal) => {
  if (newVal) {
    targetDate.value = defaultDate.value
    // 打开弹窗时，触发带 loading 的预测
    generatePrediction()
  } else {
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
  }
})

// 监听日期变化
watch(targetDate, (newVal, oldVal) => {
  // 防止在关闭弹窗清空日期时触发
  if (props.visible && newVal) {
    generatePrediction()
  }
})

onUnmounted(() => {
  if (chartInstance) chartInstance.dispose()
  window.removeEventListener('resize', () => chartInstance?.resize())
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

.price-prediction-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(2, 8, 6, 0.85);
  backdrop-filter: blur(12px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; animation: fadeIn 0.4s ease forwards;
}
@keyframes fadeIn { to { opacity: 1; } }

.price-prediction-modal {
  width: 95%; max-width: 900px;
  background: linear-gradient(145deg, rgba(10, 25, 22, 0.95), rgba(5, 15, 12, 0.98));
  border: 1px solid rgba(66, 227, 164, 0.25);
  border-radius: 24px;
  box-shadow: 0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(66, 227, 164, 0.1);
  overflow: hidden;
  transform: translateY(30px);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideUp { to { transform: translateY(0); } }

/* 装饰线条 */
.modal-decoration-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, #42e3a4, #ffd700, transparent);
  box-shadow: 0 1px 10px rgba(66, 227, 164, 0.5);
}

/* 顶部 */
.modal-header {
  padding: 20px 30px;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.header-title { display: flex; align-items: center; gap: 15px; }
.icon-box {
  width: 36px; height: 36px;
  background: rgba(66, 227, 164, 0.1); border-radius: 8px;
  display: flex; align-items: center; justify-content: center; position: relative;
}
.pulse-dot {
  position: absolute; top: -2px; right: -2px; width: 6px; height: 6px;
  background: #ffd700; border-radius: 50%;
  animation: pulse 1.5s infinite;
}
.title-main { display: block; font-size: 16px; font-weight: 700; color: #fff; }
.title-sub { display: block; font-size: 10px; color: #42e3a4; opacity: 0.7; letter-spacing: 1px; }

.close-btn {
  background: transparent; border: none; color: rgba(255,255,255,0.3);
  cursor: pointer; padding: 5px; transition: 0.2s;
}
.close-btn:hover { color: #fff; transform: rotate(90deg); }

.modal-body { padding: 30px 40px; min-height: 400px; }

/* Hero 区域 */
.hero-section {
  text-align: center;
  margin-bottom: 35px;
  position: relative;
}
.product-tag-float {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(66, 227, 164, 0.08); border: 1px solid rgba(66, 227, 164, 0.2);
  padding: 6px 16px; border-radius: 20px;
  font-size: 13px; color: #42e3a4; font-weight: 600;
  margin-bottom: 15px;
}
.hero-label {
  display: block; font-size: 12px; color: #688; letter-spacing: 2px;
  margin-bottom: 10px; font-weight: bold;
}
.date-display-box {
  position: relative; display: inline-block;
}
.date-display-box.disabled {
  opacity: 0.5; pointer-events: none; filter: grayscale(1);
}
.hero-date-input {
  background: transparent; border: none; outline: none;
  font-family: 'JetBrains Mono', monospace;
  font-size: 42px; font-weight: 700;
  color: #fff; text-align: center;
  border-bottom: 2px solid rgba(66, 227, 164, 0.3);
  padding-bottom: 5px; cursor: pointer;
  text-shadow: 0 0 20px rgba(66, 227, 164, 0.3);
  transition: all 0.3s;
  width: 320px;
}
.hero-date-input:focus {
  border-bottom-color: #ffd700;
  text-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
}
.edit-hint {
  display: block; font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 5px;
  opacity: 0; transition: 0.3s; transform: translateY(-5px);
}
.date-display-box:hover .edit-hint { opacity: 1; transform: translateY(0); }

/* --- 加载动画样式 --- */
.loading-container {
  height: 300px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  animation: fadeIn 0.3s ease;
}
.scanner-wrapper {
  position: relative; width: 80px; height: 80px; margin-bottom: 25px;
}
.scan-ring {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  border: 4px solid transparent;
  border-top-color: #42e3a4; border-right-color: rgba(66, 227, 164, 0.3);
  border-radius: 50%; animation: spin 1s linear infinite;
}
.scan-core {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 40%; height: 40%; background: #ffd700;
  border-radius: 50%; box-shadow: 0 0 15px #ffd700;
  animation: pulse-core 1s ease-in-out infinite;
}
.loading-text {
  font-family: 'JetBrains Mono', monospace; font-size: 16px; color: #fff;
  font-weight: bold; letter-spacing: 1px; margin-bottom: 8px;
  display: flex; align-items: center; gap: 5px;
}
.loading-sub { font-size: 12px; color: rgba(66, 227, 164, 0.7); }

/* 仪表盘 */
.dashboard-grid {
  display: grid; grid-template-columns: 1.2fr 1.2fr 0.8fr; gap: 20px;
  margin-bottom: 25px;
}
.metric-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; padding: 20px;
  position: relative;
}
.price-card { background: linear-gradient(145deg, rgba(66, 227, 164, 0.05), transparent); }
.card-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
.card-label { font-size: 12px; color: #8aa; }
.live-badge { 
  font-size: 10px; background: rgba(255,0,0,0.2); color: #ff4d4d; 
  padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,0,0,0.3); 
  animation: blink 2s infinite;
}
.price-display { display: flex; align-items: baseline; gap: 4px; margin-bottom: 10px; }
.currency { color: #42e3a4; font-size: 20px; }
.big-number { 
  font-family: 'JetBrains Mono', monospace; font-size: 46px; font-weight: 700; color: #fff;
  text-shadow: 0 0 15px rgba(66,227,164,0.3);
}
.unit { color: #688; font-size: 14px; }
.trend-row { display: flex; align-items: center; justify-content: space-between; }
.trend-badge { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
.trend-up { color: #ff6b6b; } .trend-down { color: #42e3a4; } .trend-stable { color: #ffd700; }
.diff-text { font-family: 'JetBrains Mono'; font-size: 12px; }
.diff-up { color: #ff6b6b; } .diff-down { color: #42e3a4; }

/* 归因分析 */
.factor-list { display: flex; flex-direction: column; gap: 12px; margin-top: 5px; }
.factor-item { display: flex; align-items: center; gap: 10px; font-size: 12px; color: #ccc; }
.f-name { width: 70px; }
.f-bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.f-bar { height: 100%; border-radius: 3px; transition: width 1s ease; }
.f-val { width: 30px; text-align: right; font-family: 'JetBrains Mono'; opacity: 0.8; }

/* 置信度 */
.confidence-card { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.confidence-circle { width: 70px; height: 70px; position: relative; margin-bottom: 10px; }
.circular-chart { display: block; margin: 0 auto; max-width: 100%; max-height: 100%; }
.circle-bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 3; }
.circle { 
  fill: none; stroke: #ffd700; stroke-width: 3; stroke-linecap: round;
  animation: progress 1.5s ease-out forwards;
}
@keyframes progress { from { stroke-dasharray: 0, 100; } }
.percentage-text {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-family: 'JetBrains Mono'; font-weight: bold; color: #ffd700; font-size: 14px;
}
.risk-label { font-size: 12px; color: #8aa; }

/* 图表区 */
.chart-section {
  background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);
  padding: 15px;
}
.chart-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
.chart-title { font-size: 13px; color: #ccc; display: flex; align-items: center; gap: 6px; }
.legend { display: flex; gap: 12px; font-size: 12px; color: #8aa; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
.dot.history { background: #42e3a4; }
.dot.predict { background: #ffd700; box-shadow: 0 0 6px #ffd700; }
.chart-container { width: 100%; height: 180px; }

/* 结果淡入 */
.animate-fade-in { animation: fadeInUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }

/* 底部按钮 */
.modal-footer {
  padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.05);
  display: flex; gap: 20px; background: rgba(0,0,0,0.15);
}
.btn {
  flex: 1; padding: 14px; border-radius: 10px; font-weight: 600; font-size: 14px;
  cursor: pointer; border: none; transition: all 0.3s;
}
.btn-secondary { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #aaa; }
.btn-secondary:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.05); }
.btn-primary {
  background: linear-gradient(135deg, #42e3a4 0%, #00a884 100%); color: #051a15;
  box-shadow: 0 8px 25px rgba(66,227,164,0.2); display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(66,227,164,0.3); }
.btn-primary:disabled { cursor: not-allowed; filter: grayscale(0.5); }

/* 关键帧动画 */
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes pulse-core {
  0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; box-shadow: 0 0 25px #ffd700; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 点点点动画 */
.dot-flashing {
  position: relative; width: 4px; height: 4px; margin-left: 10px;
  border-radius: 2px; background-color: #42e3a4; color: #42e3a4;
  animation: dot-flashing 1s infinite linear alternate; animation-delay: 0.5s;
}
.dot-flashing::before, .dot-flashing::after {
  content: ''; display: inline-block; position: absolute; top: 0;
  width: 4px; height: 4px; border-radius: 2px; background-color: #42e3a4; color: #42e3a4;
  animation: dot-flashing 1s infinite alternate;
}
.dot-flashing::before { left: -8px; animation-delay: 0s; }
.dot-flashing::after { left: 8px; animation-delay: 1s; }

@keyframes dot-flashing {
  0% { background-color: #42e3a4; }
  50%, 100% { background-color: rgba(66, 227, 164, 0.2); }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; gap: 12px; }
  .hero-date-input { font-size: 32px; width: 100%; }
  .metric-card { padding: 15px; }
  .factor-list { flex-direction: row; flex-wrap: wrap; }
  .factor-item { flex: 1 1 100%; }
}
</style>