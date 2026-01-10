<template>
  <div class="analysis-card">
    <div class="chart-body">
      <div class="chart-section left-section">
        <div class="left-header-block">
          <div class="header-row">
            <span class="product-name">{{ currentProductName }}</span>
            <span class="sub-text"> // 价格趋势监测</span>
          </div>
        </div>
        
        <div class="section-title">近30日价格走势</div>
        <div ref="priceChartRef" class="echarts-box"></div>
      </div>

      <div class="divider-v"></div>

      <div class="chart-section right-section">
        <div class="radar-container">
          <div ref="radarChartRef" class="echarts-box"></div>
        </div>
      </div>

      <div v-if="loading" class="state-mask">
        <div class="loading-spinner"></div>
        <div class="state-text">数据同步中...</div>
      </div>

      <div v-if="!loading && isAllEmpty" class="state-mask">
        <div class="state-text">暂无 {{ currentProductName }} 相关数据</div>
        <button class="retry-btn" @click="fetchData">重试</button>
      </div>
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
const radarChartRef = ref(null)
let priceChart = null
let radarChart = null

const loading = ref(false)
const isAllEmpty = ref(false)
const currentProductName = ref('未选择')

// ================= ECharts 配置 (左侧) =================

const getPriceOption = (xData, yData) => {
  return {
    backgroundColor: 'transparent',
    grid: { top: '15%', left: '2%', right: '4%', bottom: '5%', containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 20, 15, 0.9)',
      borderColor: '#42e3a4',
      textStyle: { color: '#fff', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: '#42e3a4', type: 'dashed' } },
      formatter: (params) => {
        const item = params[0]
        return `<div style="color:#aaa">${item.name}</div>
                <div style="font-weight:bold; color:#42e3a4">
                  ${item.marker} 均价: ${item.value} 元/kg
                </div>`
      },
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
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '元/kg',
      nameTextStyle: { color: 'rgba(66, 227, 164, 0.6)', padding: [0, 0, 0, -10] },
      axisLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(66, 227, 164, 0.1)', type: 'dashed' } },
    },
    series: [
      {
        name: '价格',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#00ff9d', borderColor: '#fff' },
        lineStyle: { width: 2, color: '#42e3a4', shadowBlur: 5, shadowColor: '#42e3a4' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(66, 227, 164, 0.4)' },
            { offset: 1, color: 'rgba(66, 227, 164, 0.01)' },
          ]),
        },
        data: yData,
      },
    ],
  }
}

// ================= ECharts 配置 (右侧：雷达图 - 已修改) =================

const getRadarOption = (data) => {
  const variances = data.map((item) => item.priceVariance)
  const avgVariance =
    variances.length > 0 ? variances.reduce((a, b) => a + b, 0) / variances.length : 0
  const markets = data.map((item) => item.marketname)
  const maxValue = Math.max(...variances, avgVariance) * 1.2

  return {
    backgroundColor: 'transparent',
    title: {
      text: '', 
      left: 'center',
      top: 0, 
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0,195,85,0.9)',
      borderColor: '#00e676',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: (params) => {
        if (params.seriesIndex !== 0) return null 
        
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: #00ff9f;">方差详情</div>
            ${markets.map((m, i) => {
                const v = variances[i];
                const diff = v - avgVariance;
                const color = '#69f0ae'; 
                return `<div style="display:flex; justify-content:space-between; width: 180px; font-size:12px; margin-bottom:2px;">
                    <span>${m}:</span>
                    <span style="color:${color}">${v.toFixed(3)} (${diff>0?'+':''}${((diff/avgVariance)*100).toFixed(0)}%)</span>
                </div>`
            }).join('')}
             <div style="margin-top:5px; border-top:1px dashed #fff; padding-top:2px;">
                平均方差: ${avgVariance.toFixed(3)}
            </div>
          </div>
        `
      },
    },
    radar: {
      shape: 'polygon',
      center: ['50%', '50%'], 
      radius: '65%', 
      indicator: markets.map((name, index) => ({
        name: `${name}`,
        max: maxValue,
        // 【修改点：axisLabel.show 设为 false，彻底隐藏数字】
        axisLabel: {
          show: false, 
        },
        nameTextStyle: {
          color: '#00ff9f',
          fontSize: 11, 
          fontWeight: 'bold',
          textShadow: '0 0 8px rgba(0,255,159,0.5)', 
        },
      })),
      splitNumber: 4,
      axisName: {
        backgroundColor: 'rgba(0, 195, 85, 0.15)', 
        borderRadius: 12, 
        padding: [6, 12], 
        borderWidth: 0,   
        shadowColor: 'rgba(0, 255, 159, 0.4)', 
        shadowBlur: 8,    
        shadowOffsetY: 2, 
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(0,255,159,0.05)', 'rgba(0,255,159,0.1)'],
        },
      },
      axisLine: { lineStyle: { color: 'rgba(0,230,118,0.4)' } },
      splitLine: { lineStyle: { color: 'rgba(0,230,118,0.3)' } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: variances,
            name: '市场价格方差',
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: {
              color: '#00ff9f', 
              borderColor: '#fff',
              borderWidth: 1,
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0,255,159,0.8)' },
                { offset: 1, color: 'rgba(0,255,159,0.2)' },
              ]),
            },
            lineStyle: {
              width: 2,
              color: '#00ff9f',
              shadowColor: 'rgba(0,255,159,0.5)',
              shadowBlur: 10,
            },
          },
          {
            value: new Array(markets.length).fill(avgVariance),
            name: '行业平均线',
            symbol: 'none',
            lineStyle: {
              type: 'dashed',
              color: '#00e676', 
              width: 1.5,
            },
            itemStyle: { color: 'transparent' },
          },
        ],
      },
    ],
    legend: {
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      data: ['市场价格方差', '行业平均线'],
      textStyle: {
        color: '#00ff9f',
        fontSize: 10,
        textShadow: '0 0 5px rgba(0,255,159,0.3)',
      },
    },
  }
}

// ================= 数据生成逻辑 =================

const generateDates = () => {
  const dates = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    dates.push(dateStr)
  }
  return dates
}

const generateRandomPrice = (basePrice = 2.0) => {
  const dates = generateDates()
  return dates.map((date) => ({
    reporttime: date,
    middleprice: Number((basePrice * (0.85 + Math.random() * 0.3)).toFixed(2)),
  }))
}

const generateRandomVariance = () => {
  const markets = [
    '北京新发地', '上海江桥', '广州江南', '深圳海吉星', '杭州良渚',
    '成都益民', '武汉白沙洲', '南京众彩', '西安欣桥', '重庆双福',
  ]
  const shuffled = markets.sort(() => 0.5 - Math.random()).slice(0, 5)
  return shuffled
    .map((market) => ({
      marketname: market,
      priceVariance: Number((0.04 + Math.random() * 0.16).toFixed(4)),
    }))
}

const mockDataStyles = [
  { priceBase: 1.5 }, { priceBase: 4.5 }, { priceBase: 8.0 },
]

const fetchData = async () => {
  const productName = mapProductStore.currentProduct || '大白菜'
  currentProductName.value = productName
  loading.value = true
  isAllEmpty.value = false

  try {
    let priceX = []
    let priceY = []
    const style = mockDataStyles[Math.floor(Math.random() * mockDataStyles.length)]
    const mockData = generateRandomPrice(style.priceBase)
    priceX = mockData.map((item) => item.reporttime)
    priceY = mockData.map((item) => item.middleprice)

    if (priceChart) priceChart.setOption(getPriceOption(priceX, priceY), true)

    const mockDataV = generateRandomVariance()
    if (radarChart) radarChart.setOption(getRadarOption(mockDataV), true)
  } catch (error) {
    console.error('数据生成错误', error)
  } finally {
    loading.value = false
  }
}

// ================= 初始化 =================

const initCharts = () => {
  if (!priceChartRef.value || !radarChartRef.value) return
  priceChart = echarts.init(priceChartRef.value)
  radarChart = echarts.init(radarChartRef.value)
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  priceChart?.resize()
  radarChart?.resize()
}

watch(() => mapProductStore.currentProduct, (newVal) => {
  if (newVal) fetchData()
})

onMounted(() => {
  setTimeout(() => {
    initCharts()
    fetchData()
  }, 200)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  priceChart?.dispose()
  radarChart?.dispose()
})
</script>

<style scoped>
.analysis-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(66, 227, 164, 0.05);
}

.chart-body {
  flex: 1;
  display: flex;
  position: relative;
  padding: 10px 5px;
  min-height: 0;
}

.chart-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.left-section {
  flex: 3;
  display: flex;
  flex-direction: column;
}

.left-header-block {
  padding: 0 5px 8px 10px;
  margin-bottom: 5px;
  border-bottom: 1px dashed rgba(66, 227, 164, 0.3);
  flex-shrink: 0;
}

.product-name {
  font-size: 18px;
  font-weight: bold;
  color: #00ff9d;
  text-shadow: 0 0 8px rgba(0, 255, 157, 0.4);
  margin-right: 10px;
}

.sub-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.section-title {
  font-size: 11px;
  color: rgba(66, 227, 164, 0.8);
  padding-left: 10px;
  margin-bottom: 5px;
  border-left: 2px solid #00ff9d;
  flex-shrink: 0;
}

.right-section {
  flex: 2;
  padding-left: 5px;
  height: 100%;
}

.divider-v {
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(66, 227, 164, 0.3), transparent);
  margin: 0 8px;
}

.echarts-box {
  flex: 1;
  width: 100%;
  min-height: 150px;
}

.radar-container {
  width: 100%;
  height: 100%; 
  display: flex;
  background: linear-gradient(135deg, rgba(0, 195, 85, 0.08) 0%, rgba(0, 230, 118, 0.02) 100%);
  border-radius: 8px;
  box-shadow: inset 0 0 15px rgba(0, 230, 118, 0.1);
  border: 1px solid rgba(0, 255, 159, 0.2);
  margin-top: 0; 
  padding: 5px;
  transition: all 0.3s ease;
}

.radar-container:hover {
  box-shadow: inset 0 0 25px rgba(0, 230, 118, 0.15);
  border-color: rgba(0, 255, 159, 0.4);
}

.state-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(11, 19, 37, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 20;
  backdrop-filter: blur(4px);
}
.retry-btn {
  margin-top: 10px;
  background: transparent;
  border: 1px solid #42e3a4;
  color: #42e3a4;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
}
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(66, 227, 164, 0.2);
  border-top-color: #00ff9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
.state-text {
  margin-top: 10px;
  font-size: 12px;
  color: #42e3a4;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>