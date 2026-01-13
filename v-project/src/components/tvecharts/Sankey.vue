<template>
  <div class="sankey-container tech-bg">
    <div class="sankey-chart" ref="sankeyChart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { calendar } from '../../api/requestFuntion.js'
import { mapLocation, mapProduct } from '../../stores/store.js'
import { ElMessage } from 'element-plus'

const sankeyChart = ref(null)
let myChart = null
const mapLocationStore = mapLocation()
const mapProductStore = mapProduct()

const queryData = {
  province: mapLocationStore.currentProvince,
}

// --- 1. 现代化配色方案：采用同色系梯度，减少视觉杂乱 ---
const techColorPalette = [
  '#00f2ff', // 主亮青
  '#009dff', // 科技蓝
  '#4e77ff', // 靛蓝
  '#a855f7', // 优雅紫
  '#22d3ee', // 淡青
  '#818cf8', // 浅靛蓝
];

const getUniqueColor = (index) => {
  return techColorPalette[index % techColorPalette.length];
}

const option = {
  backgroundColor: 'transparent', // 背景交给CSS处理，更具通透感
  series: [
    {
      type: 'sankey',
      left: '5%',
      right: '18%', 
      top: '8%',
      bottom: '8%',
      nodeWidth: 12, // 【关键修改】减窄节点宽度，更显精致，不笨重
      nodeGap: 18,   // 适当的间距
      draggable: false,
      layoutIterations: 32,
      data: [],
      links: [],
      // 优化线条：低透明度、更平滑的曲线
      lineStyle: {
        color: 'source',
        curveness: 0.5,
        opacity: 0.25, // 【关键修改】大幅降低初始透明度，现代感的秘诀
      },
      // 优化节点：去掉厚重的发光，改用轻薄的边框
      itemStyle: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
      },
      // 优化标签：更清爽的排版
      label: {
        color: '#a5f3fc',
        fontFamily: 'Microsoft YaHei',
        fontSize: 12,
        fontWeight: 400,
        distance: 10
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          opacity: 0.7, // 鼠标悬停时才加亮
        },
        itemStyle: {
          shadowBlur: 10,
          shadowColor: '#00f2ff',
        }
      },
    },
  ],
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(7, 26, 55, 0.9)',
    borderColor: '#22d3ee',
    borderWidth: 1,
    textStyle: { color: '#fff' },
    formatter: (params) => {
      if (params.dataType === 'node') {
        return `<div style="padding:3px 8px;">📊 节点: <b>${params.name}</b></div>`
      }
      return `
        <div style="padding:5px;">
          <span style="color:#94a3b8">流向：</span>${params.data.source} ➜ ${params.data.target}<br/>
          <span style="color:#22d3ee">交易量：</span><b style="font-size:1.1em">${params.data.value}</b> 吨
        </div>
      `
    },
  },
}

const transformToSankeyData = (rawData) => {
  const nodes = []
  const nodeMap = new Map()
  const links = []
  const linkMap = new Map()

  let colorIndex = 0;

  const addNode = (name, level) => {
    if (!nodeMap.has(name)) {
      const color = getUniqueColor(colorIndex++);
      let labelConfig = { position: 'right' };
      
      // 第1层居左显示，第2层和第3层居右显示，避免文字重叠
      if (level === 0) {
        labelConfig = { position: 'left', distance: 15 };
      }

      nodes.push({
        name: name,
        itemStyle: { color: color },
        label: labelConfig
      });
      nodeMap.set(name, nodes.length - 1);
      return true;
    }
    return false;
  }

  rawData.forEach((item) => {
    addNode(item.oneLevel, 0);
    addNode(item.twoLevel, 1);
    addNode(item.varietyname, 2);
  })

  rawData.forEach((item) => {
    const k1 = `${item.oneLevel}|${item.twoLevel}`
    linkMap.set(k1, (linkMap.get(k1) || 0) + item.totalExportVolume)
    const k2 = `${item.twoLevel}|${item.varietyname}`
    linkMap.set(k2, (linkMap.get(k2) || 0) + item.totalExportVolume)
  })

  linkMap.forEach((value, key) => {
    const [source, target] = key.split('|')
    links.push({ source, target, value })
  })

  return { nodes, links }
}

const initData = async () => {
  queryData.province = mapLocationStore.currentProvince
  const mockData = [
    { oneLevel: `${queryData.province}中心`, twoLevel: '根茎类', varietyname: '土豆', totalExportVolume: 2200 },
    { oneLevel: `${queryData.province}中心`, twoLevel: '根茎类', varietyname: '胡萝卜', totalExportVolume: 1300 },
    { oneLevel: `${queryData.province}中心`, twoLevel: '柑橘类', varietyname: '橘子', totalExportVolume: 1700 },
    { oneLevel: `${queryData.province}中心`, twoLevel: '豆类', varietyname: '绿豆', totalExportVolume: 900 },
    { oneLevel: `${queryData.province}中心`, twoLevel: '叶菜类', varietyname: '菠菜', totalExportVolume: 950 },
  ]

  let finalData = null
  try {
    const resp = await calendar(queryData, '/user/calendar')
    if (resp && resp.length > 0) finalData = resp
  } catch (e) {}

  if (!finalData) finalData = mockData

  const { nodes, links } = transformToSankeyData(finalData)
  option.series[0].data = nodes
  option.series[0].links = links

  if (!myChart) initChart()
  else myChart.setOption(option, true)
}

const initChart = () => {
  if (!sankeyChart.value) return
  myChart = echarts.init(sankeyChart.value)
  myChart.setOption(option)
  myChart.on('click', (params) => {
    if (params.dataType === 'node') {
      const isLeaf = !option.series[0].links.some(l => l.source === params.name)
      if (isLeaf) {
        mapProductStore.setCurrentProduct(params.name)
        ElMessage.success(`定位品种: ${params.name}`)
      }
    }
  })
  window.addEventListener('resize', () => myChart && myChart.resize())
}

watch(() => mapLocationStore.currentProvince, () => { initData() })
onMounted(() => { nextTick(() => initData()) })
onUnmounted(() => { if (myChart) myChart.dispose() })
</script>

<style scoped>
.sankey-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #020617; /* 更深邃的底色 */
  overflow: hidden;
}

/* 装饰背景：微弱的网格感 */
.tech-bg {
  background-image: 
    linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 30px 30px;
}

.sankey-chart {
  width: 100%;
  height: 100%;
}
</style>