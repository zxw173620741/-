<template>
  <div class="map-container">
    <div ref="chartRef" class="echarts-box"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import * as echarts from 'echarts'
import { mapLocation } from '../../stores/store.js'

const mapLocationStore = mapLocation()
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

const timer = ref(null)
const regionNames = ref([])
const lastHighlightName = ref('')
const historyStack = ref([])

// --- 修改点 1: 定义不想参与随机高亮的地区名单 ---
// 注意：名字必须和地图 GeoJSON 里的名字完全一致
const ignoredRegions = [
  '台湾省', 
  '香港特别行政区', 
  '澳门特别行政区',
]

const loadMapData = async (mapName, adcode) => {
  chartInstance.value.showLoading({
    text: '数据加载中...',
    color: '#00f7ff',
    textColor: '#00f7ff',
    maskColor: 'rgba(10, 30, 60, 0.5)',
  })

  try {
    const url = `https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`
    const response = await fetch(url)
    
    if (!response.ok) {
        throw new Error('No child map data')
    }

    const geoJson = await response.json()

    // --- 修改点 2: 提取名字时进行过滤 ---
    // 逻辑：获取所有名字 -> 过滤掉在 ignoredRegions 里的名字
    regionNames.value = geoJson.features
      .map(feature => feature.properties.name)
      .filter(name => !ignoredRegions.includes(name))

    echarts.registerMap(mapName, geoJson)
    
    currentMapName.value = mapName
    currentAdcode.value = adcode
    
    chartInstance.value.hideLoading()
    setOptions(mapName)
    
    emit('map-level-change', mapName === 'china')
    
    startRandomHighlight()
    
    return true 
  } catch (error) {
    console.warn('无法加载下一级地图:', error)
    chartInstance.value.hideLoading()
    return false 
  }
}

// --- 随机高亮逻辑 (无需修改，因为它依赖 regionNames) ---
const startRandomHighlight = () => {
  stopRandomHighlight()
  
  if (regionNames.value.length === 0) return

  timer.value = setInterval(() => {
    if (!chartInstance.value) return

    if (lastHighlightName.value) {
      chartInstance.value.dispatchAction({
        type: 'downplay',
        geoIndex: 0,
        name: lastHighlightName.value
      })
    }

    const randomIndex = Math.floor(Math.random() * regionNames.value.length)
    const randomName = regionNames.value[randomIndex]

    chartInstance.value.dispatchAction({
      type: 'highlight',
      geoIndex: 0,
      name: randomName
    })
    
    chartInstance.value.dispatchAction({
      type: 'showTip',
      seriesIndex: 0, 
      name: randomName
    })

    if (currentMapName.value === 'china') {
      mapLocationStore.setCurrentProvince(randomName)
    } else {
      mapLocationStore.setCurrentCity(randomName)
    }

    lastHighlightName.value = randomName

  }, 2000)
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
  await loadMapData(prev.mapName, prev.adcode)
  emit('region-change', prev.mapName === 'china' ? '全国' : prev.mapName)
  emit('map-level-change', prev.mapName === 'china')
}

defineExpose({
  backToPrevious,
})

const initChart = async () => {
  if (!chartRef.value) return
  chartInstance.value = echarts.init(chartRef.value)

  chartInstance.value.getZr().on('mousemove', () => {
    if (timer.value) stopRandomHighlight()
  })
  chartInstance.value.getZr().on('globalout', () => {
    startRandomHighlight()
  })

  await loadMapData('china', '100000')

  chartInstance.value.on('click', async (params) => {
    if (params.componentType === 'geo') {
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

        const success = await loadMapData(clickedRegionName, nextAdcode)

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
           startRandomHighlight()
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
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#45d0b2',
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: (params) => {
          return `${params.name}`
      }
    },
    geo: {
      map: mapName,
      roam: true,
      zoom: 1.2,
      label: {
        show: false, 
        color: '#7fffd4',
        fontSize: 10,
      },
      itemStyle: {
        areaColor: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(69, 208, 178, 0.1)' },
            { offset: 1, color: 'rgba(0, 20, 60, 0.9)' },
          ],
        },
        borderColor: '#b9f8f4',
        borderWidth: 1.5,
        shadowColor: '#00ffff',
        shadowBlur: 10,
      },
      emphasis: {
        label: { show: true, color: '#fff', fontSize: 14, fontWeight: 'bold' }, 
        itemStyle: {
          areaColor: '#f1c40f',
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowBlur: 20,
          shadowColor: '#f1c40f',
        },
      },
      select: {
        itemStyle: { areaColor: '#2B91B7' }
      }
    },
    series: [],
  }
  chartInstance.value.setOption(option, true)
}

const handleResize = () => chartInstance.value?.resize()

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
}
.echarts-box {
  width: 100%;
  height: 100%;
}
</style>