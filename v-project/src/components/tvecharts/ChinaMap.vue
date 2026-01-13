<template>
  <div class="map-container">
    <div ref="chartRef" class="echarts-box" :class="animateClass"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { mapLocation, voiceRecognition } from '../../stores/store.js'
import { getChinaMap, getProvinceMap, getCityMap, getRegionNames } from '../../api/requestFuntion.js'

const mapLocationStore = mapLocation()
const voiceRecognitionStore = voiceRecognition()
const emit = defineEmits(['region-change', 'map-level-change'])

const props = defineProps({
  cityData: {
    type: Array,
    default: () => [],
  },
})

const chartRef = ref(null)
const chartInstance = shallowRef(null)
const currentMapName = ref('china')
const currentAdcode = ref('100000')
const animateClass = ref('')

const heatmapData = ref([])

const timer = ref(null)
const regionNames = ref([])
const lastHighlightName = ref('')
const historyStack = ref([])

const ignoredRegions = [
  '台湾省',
  '香港特别行政区',
  '澳门特别行政区',
]

// --- 颜色配置 (对应 visualMap 的四个层级) ---
const colors = [
  
  '#025a48', // Low (原 #00465a) - 深青绿
  '#029a85', // Mid-Low (原 #00759a) - 中青绿
  '#0af3c2', // Mid-High (原 #0abff3) - 亮薄荷绿
  '#08e795'  // High (原 #08e7de) - 荧光绿
]

// --- 工具函数：Hex 转 RGBA ---
const hexToRgba = (hex, opacity) => {
  let c = hex.substring(1).split('')
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]]
  }
  c = '0x' + c.join('')
  return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + opacity + ')'
}

// --- 核心修改：生成带渐变样式的模拟数据 ---
const generateMockData = (geoJson) => {
  if (!geoJson || !geoJson.features) return []
  return geoJson.features.map(feature => {
    const value = Math.floor(Math.random() * 1000)
    
    // 1. 根据数值手动计算对应的基准颜色
    let baseColor = colors[0]
    if (value >= 750) baseColor = colors[3]
    else if (value >= 500) baseColor = colors[2]
    else if (value >= 250) baseColor = colors[1]

    return {
      name: feature.properties.name,
      value: value,
      // 2. 为每个板块单独注入渐变样式
      itemStyle: {
        // LinearGradient(x1, y1, x2, y2, stops)
        // 0,0,0,1 代表从图形上方(0)到下方(1)
        areaColor: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: hexToRgba(baseColor, 1) // 【修改点】顶部：透明度 10% (0.1)
          },
          {
            offset: 1,
            color: hexToRgba(baseColor, 0.1)   // 【修改点】底部：透明度 100% (1)
          }
        ])
      }
    }
  })
}

const loadMapData = async (mapName, adcode, direction = 'drill') => {
  animateClass.value = ''

  chartInstance.value.showLoading({
    text: '数据运算中...',
    color: '#08e7de', 
    textColor: '#08e7de',
    maskColor: 'rgba(0, 70, 90, 0.8)', 
  })

  try {
    let response
    let geoJson

    if (mapName === 'china') {
      response = await getChinaMap()
    } else if (currentMapName.value === 'china') {
      response = await getProvinceMap(adcode)
    } else {
      response = await getCityMap(adcode)
    }

    if (response) {
      geoJson = response
    } else {
      throw new Error('API返回数据格式错误')
    }

    if (!geoJson) {
      throw new Error('地图数据为空')
    }

    echarts.registerMap(mapName, geoJson)

    currentMapName.value = mapName
    currentAdcode.value = adcode
    
    // 生成数据 (包含渐变逻辑)
    heatmapData.value = generateMockData(geoJson)

    chartInstance.value.hideLoading()
    setOptions(mapName)

    nextTick(() => {
      if (direction === 'drill') {
        animateClass.value = 'map-drill-enter'
      } else if (direction === 'back') {
        animateClass.value = 'map-back-enter'
      } else {
        animateClass.value = ''
      }

      setTimeout(() => {
        animateClass.value = ''
      }, 800)
    })

    emit('map-level-change', mapName === 'china')

    return true
  } catch (error) {
    console.warn('无法加载地图数据:', error)
    chartInstance.value.hideLoading()
    return false
  }
}

// ... (startRandomHighlight, stopRandomHighlight, backToPrevious, loadProvinceAndHighlightCity 保持不变，代码略以节省篇幅，请保留原有的逻辑) ...
const startRandomHighlight = async () => {
  stopRandomHighlight()
  // ... (保留原有逻辑)
}

const stopRandomHighlight = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  if (chartInstance.value && lastHighlightName.value) {
    chartInstance.value.dispatchAction({
      type: 'downplay',
      geoIndex: 0,
      name: lastHighlightName.value
    })
    chartInstance.value.dispatchAction({ type: 'hideTip' })
  }
}

const backToPrevious = async () => {
  if (historyStack.value.length === 0) return
  const prev = historyStack.value.pop()
  await loadMapData(prev.mapName, prev.adcode, 'back')
  emit('region-change', prev.mapName === 'china' ? '全国' : prev.mapName)
  emit('map-level-change', prev.mapName === 'china')
}

const loadProvinceAndHighlightCity = async (provinceName, cityName) => {
  stopRandomHighlight()
  const currentGeoJson = echarts.getMap(currentMapName.value).geoJson
  const feature = currentGeoJson.features.find(
    (f) => f.properties.name === provinceName
  )
  if (feature && feature.properties.adcode) {
    const nextAdcode = feature.properties.adcode
    historyStack.value.push({
      mapName: currentMapName.value,
      adcode: currentAdcode.value
    })
    const success = await loadMapData(provinceName, nextAdcode, 'drill')
    if (success) {
      mapLocationStore.setCurrentProvince(provinceName)
      mapLocationStore.setCurrentCity(cityName)
      emit('region-change', cityName)
      setTimeout(() => {
        if (chartInstance.value) {
          chartInstance.value.dispatchAction({
            type: 'showTip',
            seriesIndex: 0,
            name: cityName
          })
        }
      }, 500)
    } else {
      historyStack.value.pop()
    }
  }
}

defineExpose({
  backToPrevious,
  loadProvinceAndHighlightCity,
})

const initChart = async () => {
  if (!chartRef.value) return
  chartInstance.value = echarts.init(chartRef.value)
  await loadMapData('china', '100000', 'none')

  chartInstance.value.on('click', async (params) => {
    if (params.componentType === 'series' || params.componentType === 'geo') { 
      const clickedRegionName = params.name
      const currentGeoJson = echarts.getMap(currentMapName.value).geoJson
      const feature = currentGeoJson.features.find(
        (f) => f.properties.name === clickedRegionName
      )

      if (feature && feature.properties.adcode) {
        const nextAdcode = feature.properties.adcode
        historyStack.value.push({
          mapName: currentMapName.value,
          adcode: currentAdcode.value
        })

        stopRandomHighlight()

        const success = await loadMapData(clickedRegionName, nextAdcode, 'drill')

        if (success) {
           if (clickedRegionName !== 'china') {
             mapLocationStore.setCurrentCity(clickedRegionName)
           }
           emit('region-change', clickedRegionName)
        } else {
           historyStack.value.pop()
           console.log(`已到达最底层：${clickedRegionName}`)
           mapLocationStore.setCurrentCity(clickedRegionName)
           emit('region-change', clickedRegionName)
        }
      }
    }
  })
}

const setOptions = (mapName) => {
  if (!chartInstance.value) return

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 70, 90, 0.9)', 
      borderColor: '#60EFDB',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: (params) => {
        if (isNaN(params.value)) return `${params.name}`
        return `${params.name}<br/>热度值: <span style="color:#08e7de;font-weight:bold;text-shadow:0 0 5px #08e7de;">${params.value}</span>`
      }
    },
    
    // 图例配置保持不变
    visualMap: {
      show: false,
      seriesIndex: -1,
      orient: 'horizontal', 
      min: 0,
      max: 1000,
      left: 'center',       
      bottom: '30',         
      text: ['高', '低'],    
      gap: 10,              
      itemWidth: 20,        
      itemHeight: 140,      
      calculable: true,
      textStyle: {
        color: '#60EFDB'
      },
      inRange: {
        color: colors 
      }
    },

    // 【修改点1】隐藏 geo 组件，避免它抢占样式或造成重影
    geo: {
      show: false, 
      map: mapName,
      roam: true,
      zoom: 1.2
    },

    series: [
      {
        type: 'map',
        map: mapName,
        // 【修改点2】删除 geoIndex: 0，让 series 独立渲染
        // geoIndex: 0, 
        
        // 【修改点3】将原本 geo 中的漫游和缩放配置移到这里
        roam: true,
        zoom: 1.2,
        
        // 【修改点4】将 geo 的默认样式也移过来（作为兜底样式）
        itemStyle: {
          areaColor: 'rgba(0, 70, 90, 0.2)', 
          borderColor: '#60EFDB', 
          borderWidth: 1.5,
          shadowColor: '#0abff3', 
          shadowBlur: 15,
          shadowOffsetY: 5 
        },

        // 这里传入的数据包含了你的渐变色 itemStyle
        data: heatmapData.value, 
        
        emphasis: {
          label: { show: true, color: '#fff', fontSize: 14, fontWeight: 'bold' },
          itemStyle: {
            areaColor: '#BEF2E5', 
            borderColor: '#fff',
            borderWidth: 2,
            shadowBlur: 30,
            shadowColor: '#08e7de', 
          },
        },
        select: {
          itemStyle: { areaColor: '#0abff3' }
        }
      }
    ],
  }
  chartInstance.value.setOption(option, true)
}

const handleResize = () => chartInstance.value?.resize()

watch(() => voiceRecognitionStore.isEnabled, (newValue) => {
  if (newValue) {
    stopRandomHighlight()
  }
})

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopRandomHighlight()
  window.removeEventListener('resize', handleResize)
  chartInstance.value?.dispose()
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: transparent;
  overflow: hidden;
  perspective: 1000px;
}

.echarts-box {
  width: 100%;
  height: 100%;
  transform-origin: center center;
}

@keyframes drillIn {
  0% {
    opacity: 0;
    transform: scale(1.5);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

@keyframes backIn {
  0% {
    opacity: 0;
    transform: scale(0.5);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }
}

.map-drill-enter {
  animation: drillIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.map-back-enter {
  animation: backIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}
</style>