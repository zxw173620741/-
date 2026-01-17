<template>
  <div class="analysis-card">
    <div class="chart-body">
      <div class="chart-section left-section">
        
        <div class="left-header-block">
          <div class="section-title">重点批发市场成交量监测</div>
          
          <div class="header-right-area">
            <div class="mini-stat-group">
               <span class="stat-item">
                 <span class="label">总</span>
                 <span class="value">{{ totalVolume.toLocaleString() }}</span>
               </span>
               <span class="divider">/</span>
               <span class="stat-item">
                 <span class="label">均</span>
                 <span class="value">{{ avgVolume.toLocaleString() }}</span>
               </span>
            </div>
            
            <div class="city-tag">{{ currentCityName }}</div>
          </div>
        </div>
        
        <div class="radar-container">
          <div ref="radarChartRef" class="echarts-box"></div>
          <div class="scan-ring"></div>
          <div class="radar-bg-grid"></div>
          <div class="corner-decor top-left"></div>
          <div class="corner-decor top-right"></div>
          <div class="corner-decor bottom-left"></div>
          <div class="corner-decor bottom-right"></div>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { mapLocation } from '../../stores/store.js'

const mapLocationStore = mapLocation()
const radarChartRef = ref(null)
let radarChart = null
const currentCityName = ref('加载中...')
const currentGroupData = ref({ data: [] })

const totalVolume = computed(() => {
    return currentGroupData.value.data.reduce((sum, item) => sum + item.value, 0)
})

const avgVolume = computed(() => {
    if (currentGroupData.value.data.length === 0) return 0
    return Math.round(totalVolume.value / currentGroupData.value.data.length)
})

const getMarketData = (province, city) => {
  const marketData = {
    '四川省': {
      '成都市': [
        { name: '四川雨润国际农产品交易中心', value: 8532, max: 12000 },
        { name: '成都蒙阳农副产品综合批发市场', value: 10687, max: 12000 },
        { name: '龙泉聚和国际果蔬交易中心', value: 4193, max: 12000 },
        { name: '成都海吉星国际农产品物流园', value: 6745, max: 12000 },
        { name: '四川沙西国际农副产品批发市场', value: 5388, max: 12000 }
      ]
    },
    '河南省': {
      '郑州市': [
        { name: '河南万邦国际农产品物流城', value: 11482, max: 12000 },
        { name: '郑州陈寨蔬菜批发交易市场', value: 5633, max: 12000 },
        { name: '广亿国际农副产品交易中心', value: 4791, max: 12000 },
        { name: '郑州刘庄农产品批发市场', value: 3876, max: 12000 },
        { name: '中牟万邦国际农产品物流园', value: 8519, max: 12000 }
      ]
    }
  }

  const data = marketData[province]?.[city] || marketData['河南省']['郑州市']
  return {
    city: `📍 ${province}·${city}`,
    data
  }
}

const getRadarOption = (groupData) => {
  const values = groupData.data.map(item => item.value)
  const indicator = groupData.data.map(item => ({ 
    name: item.name, 
    max: item.max 
  }))

  const mainColor = '#00ff9d'
  const secondaryColor = '#42e3a4'

  return {
    backgroundColor: 'transparent',
    // 减小内边距，允许图表撑得更大
    grid: { top: 5, bottom: 5, left: 5, right: 5 },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(0, 10, 5, 0.95)',
      borderColor: mainColor,
      borderWidth: 1,
      textStyle: { color: '#fff' },
      formatter: (params) => {
        let html = `<div style="color:${mainColor};font-weight:bold;margin-bottom:8px;font-size:14px;">${groupData.city}</div>`
        groupData.data.forEach((item) => {
           const percent = Math.round((item.value / item.max) * 100)
           html += `<div style="display:flex;justify-content:space-between;min-width:200px;margin-bottom:4px;">
                      <span style="color:#ccc;font-size:12px;">${item.name.substring(0, 4)}...</span>
                      <span style="color:#fff;font-weight:bold;">${item.value.toLocaleString()} <span style="font-size:10px;color:${secondaryColor}">(${percent}%)</span></span>
                    </div>`
        })
        return html
      }
    },
    radar: {
      indicator: indicator,
      center: ['50%', '55%'], 
      radius: '75%', 
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        formatter: (val) => {
           const item = groupData.data.find(d => d.name === val)
           const value = item ? item.value.toLocaleString() : ''
           
           // 【修改点】商场名字自动换行逻辑
           let displayName = val
           if (val.length > 6) {
             // 如果名字长度超过6个字符，从中间切分换行
             const mid = Math.ceil(val.length / 2)
             displayName = val.slice(0, mid) + '\n' + val.slice(mid)
           }

           // {a|} 应用于名字，{b|} 应用于数值
           return `{a|${displayName}}\n{b|${value} 吨}`
        },
        rich: {
            a: {
                color: '#ffffff', 
                fontWeight: 'bold', 
                fontSize: 11,     
                lineHeight: 14, // 控制行高，防止重叠
                align: 'center',
                padding: [0, 0, 2, 0],
                textShadowColor: 'rgba(0,0,0,0.9)', 
                textShadowBlur: 4,
                textShadowOffsetX: 1,
                textShadowOffsetY: 1
            },
            b: {
                color: '#00ff9d', 
                fontSize: 13,      
                fontWeight: 'bold',
                fontFamily: 'DIN, Arial',
                align: 'center',
                textShadowColor: 'rgba(0,0,0,0.9)', 
                textShadowBlur: 4
            }
        }
      },
      axisNameGap: 5, 
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(0, 255, 157, 0.1)', 'rgba(0, 255, 157, 0.05)', 'transparent', 'transparent'],
          shadowColor: 'rgba(0, 0, 0, 0.5)',
          shadowBlur: 10
        }
      },
      axisLine: { lineStyle: { color: 'rgba(0, 255, 157, 0.3)', type: 'dashed' } },
      splitLine: { lineStyle: { color: 'rgba(0, 255, 157, 0.2)' } }
    },
    series: [
      {
        name: '市场成交量',
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        label: { show: false }, 
        itemStyle: {
          color: '#fff',
          borderColor: mainColor,
          borderWidth: 2,
          shadowColor: mainColor,
          shadowBlur: 10
        },
        lineStyle: {
          color: mainColor,
          width: 2,
          shadowColor: mainColor,
          shadowBlur: 10
        },
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
            { offset: 0, color: 'rgba(0, 255, 157, 0.8)' },
            { offset: 1, color: 'rgba(0, 255, 157, 0.1)' }
          ]),
          opacity: 0.7
        },
        data: [
          {
            value: values,
            name: '成交量'
          }
        ]
      }
    ]
  }
}

const updateChart = () => {
  if (!radarChart) return
  const group = getMarketData(mapLocationStore.currentProvince, mapLocationStore.currentCity)
  currentCityName.value = group.city
  currentGroupData.value = group
  radarChart.setOption(getRadarOption(group))
}

const initChart = () => {
  if (!radarChartRef.value) return
  radarChart = echarts.init(radarChartRef.value)
  updateChart()
  window.addEventListener('resize', () => radarChart?.resize())
}

watch(() => mapLocationStore.currentProvince, () => updateChart())
watch(() => mapLocationStore.currentCity, () => updateChart())

onMounted(() => {
  setTimeout(initChart, 200)
})

onUnmounted(() => {
  radarChart?.dispose()
})
</script>

<style scoped>
.analysis-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(4, 25, 20, 0.2) 0%, rgba(0, 45, 35, 0.2) 100%);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 157, 0.1);
}

.chart-body {
  flex: 1;
  display: flex;
  padding: 10px;
  gap: 10px;
  flex-direction: column; 
}

.left-section { flex: 1; display: flex; flex-direction: column; }

.left-header-block {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  width: 100%;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #42e3a4;
  padding-left: 12px;
  border-left: 4px solid #00ff9d;
  background: linear-gradient(90deg, rgba(0,255,157,0.15) 0%, transparent 100%);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.header-right-area {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.mini-stat-group {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    background: rgba(0, 255, 157, 0.08);
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid rgba(0, 255, 157, 0.2);
}

.stat-item .label {
    color: #aaa;
    margin-right: 3px;
    font-size: 11px;
}

.stat-item .value {
    color: #fff;
    font-weight: bold;
    font-family: 'Arial', sans-serif;
    font-size: 13px;
}

.divider { color: #444; margin: 0 2px; }

.city-tag {
  font-size: 12px;
  color: #001a14;
  background-color: #00ff9d;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: 800;
  white-space: nowrap;
}

.radar-container {
  flex: 1; 
  width: 100%;
  min-height: 0;
  position: relative;
  background: rgba(0, 20, 10, 0.3); 
  border: 1px solid rgba(66, 227, 164, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: inset 0 0 30px rgba(0, 255, 157, 0.08);
}

.echarts-box {
  width: 100%;
  height: 100%;
  z-index: 10;
}

.scan-ring {
  position: absolute;
  /* 扫描圈放大以匹配新雷达图 */
  width: 280px; 
  height: 280px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 300deg,
    rgba(0, 255, 157, 0.05) 330deg,
    rgba(0, 255, 157, 0.4) 360deg
  );
  z-index: 5;
  animation: radarScan 6s linear infinite;
  pointer-events: none;
  filter: blur(2px);
}

@keyframes radarScan {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.radar-bg-grid {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: 
    linear-gradient(rgba(0, 255, 157, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 157, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 0;
  opacity: 0.5;
  mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
}

.corner-decor {
    position: absolute;
    width: 20px;
    height: 20px;
    border-color: #00ff9d;
    border-style: solid;
    z-index: 2;
    opacity: 0.8;
    box-shadow: 0 0 8px rgba(0,255,157,0.4);
}
.top-left { top: 0; left: 0; border-width: 2px 0 0 2px; border-top-left-radius: 4px; }
.top-right { top: 0; right: 0; border-width: 2px 2px 0 0; border-top-right-radius: 4px; }
.bottom-left { bottom: 0; left: 0; border-width: 0 0 2px 2px; border-bottom-left-radius: 4px; }
.bottom-right { bottom: 0; right: 0; border-width: 0 2px 2px 0; border-bottom-right-radius: 4px; }

</style>