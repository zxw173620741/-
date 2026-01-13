<template>
  <div class="tech-trend-chart">
    <div class="chart-container">
      <div class="chart-body">
        <div ref="chartDom" class="echarts-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as echarts from 'echarts'
import { onMounted, watch, defineEmits, ref, onBeforeUnmount, computed, nextTick } from 'vue'
import { getYearlyTrendByProvince } from '../../api/requestFuntion.js'
import { mapLocation, mapProduct } from '../../stores/store.js'

const props = defineProps({
  modalVisible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['chartClick'])
const mapLocationStore = mapLocation()
const mapProductStore = mapProduct()

const productName = computed(() => mapProductStore.currentProduct)
const provinceName = computed(() => mapLocationStore.currentProvince)

let myChart = null
const trendData = ref([])
const chartDom = ref(null)

// --- 动画配置 ---
const DISPLAY_COUNT = 8 // 一屏显示 8 个
const autoTimer = ref(null)
const currentIndex = ref(0)
let realDataLength = 0 // 记录真实数据的长度，不包含替身数据

const fetchYearlyData = async () => {
  if (myChart) {
    myChart.showLoading({
      text: '数据加载中...',
      color: '#45d0b2',
      textColor: '#45d0b2',
      maskColor: 'rgba(10, 30, 60, 0.2)',
      zlevel: 0
    })
  }

  try {
    let rawData = []
    
    if (provinceName.value === '河南省' && productName.value === '大白菜') {
      const currentYear = new Date().getFullYear()
      for (let i = 0; i < 10; i++) {
        const year = currentYear - 9 + i
        const avgPrice = 1.5 + Math.random() * 1.5
        const maxPrice = avgPrice + Math.random() * 0.5
        rawData.push({
          year: year,
          averagePrice: avgPrice.toFixed(2),
          avgMaxPrice: maxPrice.toFixed(2)
        })
      }
    } else if (provinceName.value === '河南省' && productName.value === '黄瓜') {
      const currentYear = new Date().getFullYear()
      for (let i = 0; i < 10; i++) {
        const year = currentYear - 9 + i
        const avgPrice = 5.5 + Math.random() * 2.5
        const maxPrice = avgPrice + Math.random() * 0.8
        rawData.push({
          year: year,
          averagePrice: avgPrice.toFixed(2),
          avgMaxPrice: maxPrice.toFixed(2)
        })
      }
    } else if (provinceName.value === '四川省' && productName.value === '黄瓜') {
      const currentYear = new Date().getFullYear()
      for (let i = 0; i < 10; i++) {
        const year = currentYear - 9 + i
        const avgPrice = 4 + Math.random() * 4
        const maxPrice = avgPrice + Math.random() * 0.8
        rawData.push({
          year: year,
          averagePrice: avgPrice.toFixed(2),
          avgMaxPrice: maxPrice.toFixed(2)
        })
      }
    } else if (provinceName.value === '四川省' && productName.value === '大白菜') {
      const currentYear = new Date().getFullYear()
      for (let i = 0; i < 10; i++) {
        const year = currentYear - 9 + i
        const avgPrice = 2 + Math.random() * 1
        const maxPrice = avgPrice + Math.random() * 0.5
        rawData.push({
          year: year,
          averagePrice: avgPrice.toFixed(2),
          avgMaxPrice: maxPrice.toFixed(2)
        })
      }
    } else {
      const response = await getYearlyTrendByProvince(
        provinceName.value,
        productName.value
      )
      rawData = Array.isArray(response) ? response : []
    }
    
    realDataLength = rawData.length

    if (realDataLength > DISPLAY_COUNT) {
      const bufferData = rawData.slice(0, DISPLAY_COUNT) 
      trendData.value = [...rawData, ...bufferData]
    } else {
      trendData.value = rawData
    }

    updateChart()
  } catch (error) {
    console.error(error)
    trendData.value = []
    if (myChart) myChart.hideLoading()
  } finally {
    if (myChart) myChart.hideLoading()
  }
}

// ECharts 配置项
const option = {
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut',
  grid: { top: 40, bottom: 40, left: 50, right: 30, containLabel: true },
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(10, 30, 60, 0.95)',
    borderColor: '#45d0b2',
    textStyle: { color: '#fff' },
    axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(69, 208, 178, 0.1)' } }
  },
  dataZoom: [
    {
      type: 'slider',
      show: true,
      height: 12,
      bottom: 5,
      borderColor: 'rgba(69, 208, 178, 0.3)',
      handleStyle: { color: '#45d0b2' },
      textStyle: { color: '#fff' },
      brushSelect: false
    },
    { type: 'inside' }
  ],
  legend: {
    data: ['平均价', '最大价'],
    textStyle: { color: '#fff' },
    top: 5
  },
  xAxis: {
    type: 'category',
    data: [],
    axisLine: { lineStyle: { color: 'rgba(69, 208, 178, 0.5)' } },
    axisLabel: { color: '#fff', fontSize: 11 },
    axisTick: { alignWithLabel: true }
  },
  yAxis: {
    type: 'value',
    name: '元/公斤',
    nameTextStyle: { color: '#fff', padding: [0, 0, 0, 10] },
    splitLine: { lineStyle: { color: 'rgba(69, 208, 178, 0.1)', type: 'dashed' } },
    axisLabel: { color: '#fff' }
  },
  series: [
    {
      name: '平均价',
      type: 'bar',
      barMaxWidth: 30,
      data: [],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(69, 208, 178, 0.9)' },
          { offset: 1, color: 'rgba(38, 162, 147, 0.1)' }
        ]),
        borderRadius: [3, 3, 0, 0]
      }
    },
    {
      name: '最大价',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: [],
      itemStyle: { color: '#45d0b2', borderColor: '#fff', borderWidth: 1 },
      lineStyle: { width: 3, shadowBlur: 10, shadowColor: 'rgba(69, 208, 178, 0.5)' }
    }
  ]
}

const updateChart = () => {
  if (!myChart) return

  const data = trendData.value || []
  option.xAxis.data = data.map(item => String(item.year))
  option.series[0].data = data.map(item => parseFloat(item.averagePrice).toFixed(2))
  option.series[1].data = data.map(item => parseFloat(item.avgMaxPrice).toFixed(2))

  // 2. 初始化 DataZoom 位置
  // 总是从 0 开始
  option.dataZoom[0].startValue = 0
  option.dataZoom[0].endValue = Math.min(DISPLAY_COUNT - 1, data.length - 1)
  option.dataZoom[1].startValue = 0
  option.dataZoom[1].endValue = Math.min(DISPLAY_COUNT - 1, data.length - 1)

  myChart.setOption(option, true)
  
  startAutoPlay()
}

// --- 3. 核心升级：无限循环滚动逻辑 ---
const startAutoPlay = () => {
  stopAutoPlay()
  
  // 如果数据太少，不需要滚动，只开启 Tooltip 轮播
  if (realDataLength <= DISPLAY_COUNT) {
    runStaticCarousel()
    return
  }

  // 开启全景滚动模式
  let currentStart = myChart.getOption().dataZoom[0].startValue

  autoTimer.value = setInterval(() => {
    if (!myChart) return

    // 这一步：向右移动一格
    currentStart++

    // 检测是否到达了“替身区”的边界
    // 当 currentStart 等于真实数据长度时，说明视图里的第一根柱子已经是“假替身”了
    // 且这个“假替身”和索引为0的“真身”一模一样
    if (currentStart === realDataLength) {
      // 【关键操作】：瞬间瞬移回 0
      // setOption 中 animation: false 可以禁止过渡动画，实现“隐身传送”
      myChart.setOption({
        dataZoom: [
          { startValue: 0, endValue: DISPLAY_COUNT - 1 },
          { startValue: 0, endValue: DISPLAY_COUNT - 1 }
        ]
      }, {
        lazyUpdate: false, // 立即更新
        animation: false   // 禁止动画，实现无缝
      })
      
      // 传送回 0 后，我们实际上想看的是 0 的下一位（即 1）
      // 所以把起始点设为 1，然后用动画滑过去
      currentStart = 1
    }

    // 执行平滑滚动动画
    myChart.dispatchAction({
      type: 'dataZoom',
      startValue: currentStart,
      endValue: currentStart + (DISPLAY_COUNT - 1)
    })
    
    // 可选：高亮中间柱子
    const centerIndex = Math.floor(currentStart + (DISPLAY_COUNT / 2))

  }, 2000) // 2秒滚动一次
}

// 静态数据时的轮播逻辑（无需修改）
const runStaticCarousel = () => {
  currentIndex.value = -1
  autoTimer.value = setInterval(() => {
    if (!myChart) return
    currentIndex.value = (currentIndex.value + 1) % realDataLength
    myChart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: currentIndex.value })
    myChart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    myChart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: currentIndex.value })
  }, 2500)
}

const stopAutoPlay = () => {
  if (autoTimer.value) {
    clearInterval(autoTimer.value)
    autoTimer.value = null
  }
  if (myChart) {
    myChart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    myChart.dispatchAction({ type: 'hideTip' })
  }
}

const initChart = () => {
  if (!chartDom.value) return
  if (myChart) myChart.dispose()
  
  myChart = echarts.init(chartDom.value)
  myChart.on('click', (params) => emit('chartClick', params))

  myChart.getZr().on('mousemove', () => { if(autoTimer.value) stopAutoPlay() })
  myChart.getZr().on('globalout', () => { startAutoPlay() })
  
  if (trendData.value.length > 0) updateChart()
}

const resizeHandler = () => myChart?.resize()

watch([provinceName, productName], () => { fetchYearlyData() })

watch(() => props.modalVisible, (newVal) => {
  if (newVal) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
})

onMounted(() => {
  nextTick(() => {
    initChart()
    fetchYearlyData()
    window.addEventListener('resize', resizeHandler)
  })
})

onBeforeUnmount(() => {
  stopAutoPlay()
  window.removeEventListener('resize', resizeHandler)
  myChart?.dispose()
})
</script>

<style scoped>
.tech-trend-chart {
  width: 100%;
  height: 100%;
}
.chart-container, .chart-body, .echarts-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>