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
import { onMounted, watch, defineEmits, ref, onBeforeUnmount, computed } from 'vue'
import { getQuarterDataByYear } from '/src/api/requestFuntion.js'
import { mapCity } from '/src/store/store.js'

const emit = defineEmits(['chartClick'])

const store = mapCity()

const productName = computed(() => store.currentProduct)

let myChart = null
const trendData = ref([])
const chartDom = ref(null)

const fetchYearlyData = async () => {
  if (myChart) {
    myChart.showLoading({
      text: '数据加载中...',
      color: '#45d0b2',
      textColor: '#45d0b2',
      maskColor: 'rgba(10, 30, 60, 0.8)',
      spinnerRadius: 8
    })
  }
  
  try {
    const response = await getQuarterDataByYear({
      name: productName.value,
      start: 2010,
      end: new Date().getFullYear()
    })
    
    if (response.data && response.data.data) {
      trendData.value = response.data.data
    } else if (Array.isArray(response.data)) {
      trendData.value = response.data
    } else {
      trendData.value = []
      console.warn('年度趋势API返回的数据结构不符合预期', response.data)
    }
    updateChart()
  } catch (error) {
    console.error('获取年度趋势数据失败：', error)
    trendData.value = []
    
    if (myChart) {
      myChart.hideLoading()
      myChart.setOption({
        title: {
          text: '数据加载失败',
          subtext: '请检查网络连接或稍后再试',
          left: 'center',
          top: 'center',
          textStyle: {
            color: '#45d0b2',
            fontSize: 18
          },
          subtextStyle: {
            color: 'rgba(69, 208, 178, 0.6)',
            fontSize: 14
          }
        }
      })
    }
  } finally {
    if (myChart) {
      myChart.hideLoading()
    }
  }
}

const option = {
  grid: {
    top: 50,
    bottom: 60,
    left: 60,
    right: 30,
    containLabel: true
  },
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(10, 30, 60, 0.95)',
    borderColor: '#45d0b2',
    borderWidth: 1,
    textStyle: {
      color: '#fff',
      fontSize: 12
    },
    padding: [10, 14],
    extraCssText: 'box-shadow: 0 0 20px rgba(69, 208, 178, 0.3); backdrop-filter: blur(10px);'
  },
  dataZoom: [
    {
      type: 'slider',
      start: 0,
      end: 100,
      height: 18,
      bottom: 8,
      borderColor: 'rgba(69, 208, 178, 0.3)',
      fillerColor: 'rgba(69, 208, 178, 0.2)',
      handleStyle: {
        color: '#45d0b2',
        borderColor: '#45d0b2'
      },
      textStyle: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 10
      }
    },
    {
      type: 'inside',
      start: 0,
      end: 100
    }
  ],
  legend: {
    data: ['平均价', '最大价'],
    textStyle: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: 12
    },
    top: 15,
    itemGap: 25,
    itemWidth: 15,
    itemHeight: 10
  },
  toolbox: {
    show: true,
    feature: {
      dataView: { 
        show: true, 
        readOnly: false,
        title: '数据视图'
      },
      magicType: {
        show: true,
        type: ['line', 'bar'],
        title: { line: '折线图', bar: '柱状图' }
      },
      restore: {
        show: true,
        title: '还原'
      },
      saveAsImage: {
        show: true,
        title: '保存图片'
      }
    },
    iconStyle: {
      borderColor: '#45d0b2'
    },
    top: 15,
    right: 10,
    itemSize: 12
  },
  xAxis: {
    type: 'category',
    axisLine: {
      lineStyle: {
        color: 'rgba(69, 208, 178, 0.5)',
        width: 1
      }
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11,
      margin: 12
    },
    axisTick: {
      lineStyle: {
        color: 'rgba(69, 208, 178, 0.3)'
      }
    }
  },
  yAxis: {
    type: 'value',
    name: '元/公斤',
    nameTextStyle: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11,
      padding: [0, 0, 0, 8]
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(69, 208, 178, 0.1)',
        type: 'dashed'
      }
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(69, 208, 178, 0.3)'
      }
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 11
    }
  },
  series: [
    {
      name: '平均价',
      type: 'bar',
      barGap: '0%',
      data: [],
      label: {
        show: false
      },
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(69, 208, 178, 0.8)' },
          { offset: 1, color: 'rgba(38, 162, 147, 0.3)' }
        ]),
        borderRadius: [3, 3, 0, 0],
        shadowColor: 'rgba(69, 208, 178, 0.4)',
        shadowBlur: 8
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(69, 208, 178, 1)' },
            { offset: 1, color: 'rgba(38, 162, 147, 0.6)' }
          ]),
          shadowColor: 'rgba(69, 208, 178, 0.8)',
          shadowBlur: 15
        }
      }
    },
    {
      name: '最大价',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2.5,
        color: '#45d0b2',
        shadowColor: 'rgba(69, 208, 178, 0.5)',
        shadowBlur: 8
      },
      itemStyle: {
        color: '#45d0b2',
        borderColor: '#fff',
        borderWidth: 1.5,
        shadowColor: 'rgba(69, 208, 178, 0.8)',
        shadowBlur: 12
      },
      emphasis: {
        itemStyle: {
          color: '#fff',
          borderColor: '#45d0b2',
          borderWidth: 2,
          shadowColor: 'rgba(69, 208, 178, 1)',
          shadowBlur: 18
        },
        lineStyle: {
          width: 3.5,
          shadowColor: 'rgba(69, 208, 178, 0.8)',
          shadowBlur: 12
        }
      },
      data: []
    }
  ]
}

const updateChart = () => {
  if (!trendData.value || !Array.isArray(trendData.value) || trendData.value.length === 0) {
    console.warn('无法更新图表：年度数据为空或格式不正确')
    return
  }

  try {
    option.series[0].data = trendData.value.map(e => [
      e.year,
      Math.floor(e.averagePrice * 100) / 100
    ])
    option.series[1].data = trendData.value.map(e => [
      e.year,
      Math.floor(e.avgMaxPrice * 100) / 100
    ])

    if (myChart) {
      myChart.setOption(option)
    }
  } catch (error) {
    console.error('更新图表时出错:', error)
    console.log('trendData值:', trendData.value)
  }
}

const initChart = () => {
  if (!chartDom.value) return
  
  if (myChart) {
    myChart.dispose()
  }
  
  myChart = echarts.init(chartDom.value)
  
  myChart.on('click', (params) => {
    emit('chartClick', params)
  })
  
  updateChart()
}

const resizeHandler = () => {
  if (myChart) {
    myChart.resize()
  }
}

watch(
  () => trendData,
  () => updateChart(),
  { deep: true }
)

watch(
  () => productName.value,
  () => fetchYearlyData()
)

onMounted(() => {
  setTimeout(() => {
    initChart()
    fetchYearlyData()
    window.addEventListener('resize', resizeHandler)
  }, 100)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler)
  
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
})
</script>

<style scoped>
.tech-trend-chart {
  width: 100%;
  height: 100%;
  position: relative;
}

.chart-container {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  position: relative;
  display: flex;
  flex-direction: column;
}

.chart-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.echarts-container {
  width: 100%;
  height: 100%;
}
</style>
