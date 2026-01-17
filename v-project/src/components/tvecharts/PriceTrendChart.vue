<template>
  <div class="price-trend-card">
    <div class="left-header-block">
      <div class="header-row">
        <span class="product-name">{{ currentProductName }}</span>
        <span class="sub-text"> // 实时动态监测中</span>
        <span class="live-dot"></span>
      </div>
    </div>
    
    <div class="section-title">近30日价格走势 (实时)</div>
    <div ref="priceChartRef" class="echarts-box"></div>

    <div v-if="loading" class="state-mask">
      <div class="loading-spinner"></div>
      <div class="state-text">农业大数据分析中...</div>
    </div>

    <div v-if="!loading && isAllEmpty" class="state-mask">
      <div class="state-text">暂无 {{ currentProductName }} 相关监测数据</div>
      <button class="retry-btn" @click="fetchData">重新扫描</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { mapProduct, mapLocation } from '../../stores/store.js'

const mapProductStore = mapProduct()
const mapLocationStore = mapLocation()

const priceChartRef = ref(null)
let priceChart = null
let dynamicTimer = null

const loading = ref(false)
const isAllEmpty = ref(false)
const currentProductName = ref('未选择')

let currentXData = []
let currentYData = []

const getPriceOption = (xData, yData) => {
  return {
    backgroundColor: 'transparent',
    animationDuration: 1000,
    grid: { top: '15%', left: '2%', right: '4%', bottom: '5%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 20, 15, 0.95)',
      borderColor: '#42e3a4',
      textStyle: { color: '#fff', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: '#42e3a4', type: 'dashed' } },
      formatter: (params) => {
        const p = params[0];
        return `<div style="color:#42e3a4;font-weight:bold">${p.axisValue}</div>
                <div style="color:#fff">均价：<span style="font-size:14px;color:#00ff9d">${p.data}</span> 元/kg</div>`
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData,
      axisLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        formatter: (val) => (val ? val.substring(5) : ''),
      },
      axisLine: { lineStyle: { color: 'rgba(66, 227, 164, 0.3)' } },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(66, 227, 164, 0.1)', type: 'dashed' } },
    },
    series: [
      {
        name: '均价',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        endLabel: {
          show: true,
          formatter: '{c}',
          color: '#00ff9d',
          fontWeight: 'bold',
          distance: 10
        },
        itemStyle: { color: '#00ff9d', borderColor: '#fff', borderWidth: 1 },
        lineStyle: { width: 2, color: '#42e3a4' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(66, 227, 164, 0.4)' },
            { offset: 1, color: 'rgba(66, 227, 164, 0)' },
          ]),
        },
        data: yData,
      },
    ],
  }
}

const fetchData = async () => {
  stopDynamicUpdate()
  
  const productName = mapProductStore.currentProduct || '大白菜'
  const province = mapLocationStore.currentProvince || '河南省'
  currentProductName.value = productName
  loading.value = true

  try {
    const dates = []
    const prices = []
    const today = new Date()
    const basePrice = (province === '河南省') ? 2.5 : 4.0

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
      prices.push(Number((basePrice + Math.random() * 2).toFixed(2)))
    }

    currentXData = dates
    currentYData = prices

    if (priceChart) {
      priceChart.setOption(getPriceOption(currentXData, currentYData))
    }

    startDynamicUpdate()
    
  } catch (error) {
    console.error('获取数据失败', error)
  } finally {
    loading.value = false
  }
}

const startDynamicUpdate = () => {
  dynamicTimer = setInterval(() => {
    if (!priceChart) return

    currentXData.shift()
    currentYData.shift()

    const lastDate = new Date(currentXData[currentXData.length - 1])
    lastDate.setDate(lastDate.getDate() + 1)
    
    const lastPrice = currentYData[currentYData.length - 1]
    const nextPrice = Number((lastPrice + (Math.random() - 0.5) * 0.6).toFixed(2))

    currentXData.push(lastDate.toISOString().split('T')[0])
    currentYData.push(nextPrice > 0 ? nextPrice : 1.0)

    priceChart.setOption({
      xAxis: { data: currentXData },
      series: [{ data: currentYData }]
    })
  }, 3000)
}

const stopDynamicUpdate = () => {
  if (dynamicTimer) {
    clearInterval(dynamicTimer)
    dynamicTimer = null
  }
}

const initChart = () => {
  if (!priceChartRef.value) return
  priceChart = echarts.init(priceChartRef.value)
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  priceChart?.resize()
}

watch(() => mapProductStore.currentProduct, () => fetchData())
watch(() => mapLocationStore.currentProvince, () => fetchData())

onMounted(() => {
  setTimeout(() => {
    initChart()
    fetchData()
  }, 200)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopDynamicUpdate()
  priceChart?.dispose()
})
</script>

<style scoped>
.price-trend-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(135deg, rgba(4, 20, 15, 0.1) 0%, rgba(0, 40, 30, 0.1) 100%);
  border-radius: 8px;
  overflow: hidden;
}

.header-row {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.product-name {
  font-size: 20px;
  font-weight: bold;
  color: #00ff9d;
  text-shadow: 0 0 10px rgba(0, 255, 157, 0.5);
  letter-spacing: 1px;
}

.sub-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 10px;
}

.live-dot {
  width: 6px;
  height: 6px;
  background-color: #00ff9d;
  border-radius: 50%;
  margin-left: 8px;
  box-shadow: 0 0 8px #00ff9d;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #42e3a4;
  padding-left: 10px;
  border-left: 3px solid #00ff9d;
  margin-bottom: 12px;
  background: linear-gradient(90deg, rgba(0,255,157,0.1) 0%, transparent 100%);
  line-height: 1.5;
}

.echarts-box {
  width: 100%;
  flex: 1;
  min-height: 180px;
}

.retry-btn {
  margin-top: 10px;
  padding: 6px 16px;
  background: rgba(0, 255, 157, 0.2);
  border: 1px solid #00ff9d;
  color: #00ff9d;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}
.retry-btn:hover {
  background: #00ff9d;
  color: #000;
}

.state-mask {
  position: absolute;
  inset: 0;
  background: rgba(2, 10, 8, 0.85);
  backdrop-filter: blur(2px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(66, 227, 164, 0.2);
  border-top-color: #00ff9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.state-text {
  color: #42e3a4;
  margin-top: 10px;
  font-size: 13px;
  letter-spacing: 1px;
}
</style>
