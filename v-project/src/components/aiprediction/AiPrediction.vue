<template>
  <div class="ai-prediction-container">
    <div class="prediction-panel">
      <span class="corner top-left"></span>
      <span class="corner top-right"></span>
      <span class="corner bottom-left"></span>
      <span class="corner bottom-right"></span>

      <div class="panel-header">
        <div class="panel-title"></div>
        <button v-if="showResults" class="close-btn" @click="resetPrediction">✕</button>
      </div>

      <div class="panel-content">
        
        <div v-if="!showResults" class="loading-wrapper">
          
          <div class="system-check-list">
            <div class="timeline-line"></div> 

            <div 
              v-for="(task, index) in tasks" 
              :key="index"
              class="task-item"
              :class="task.status"
            >
              <div class="task-status-wrapper">
                 <div class="task-icon">
                    <span v-if="task.status === 'pending'" class="icon-dot"></span>
                    <span v-else-if="task.status === 'loading'" class="icon-spinner"></span>
                    <span v-else class="icon-check">✔</span>
                 </div>
              </div>
              
              <div class="task-info">
                <span class="task-index">0{{ index + 1 }}</span>
                <span class="task-name">{{ task.name }}</span>
              </div>

              <div class="task-meta">
                 <span v-if="task.status === 'done'" class="time-cost fade-in-text">
                   {{ (task.duration / 1000).toFixed(2) }}s
                 </span>
                 <span v-else-if="task.status === 'loading'" class="processing-dots">...</span>
              </div>
              
              <div class="item-progress-line" :style="{ width: task.status === 'done' ? '100%' : '0%' }"></div>
            </div>
          </div>

          <div class="action-area">
             <transition name="fade-up">
               <button v-if="allLoaded" class="liquid-btn" @click="showReport">
                 <span class="btn-content">
                  决策报告
                   <span class="shine"></span>
                 </span>
               </button>
             </transition>
             
             <div v-if="!allLoaded" class="loading-hint">
               正在建立数据连接... {{ completedCount }}/{{ tasks.length }}
             </div>
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
              <div class="metric-label">下周预测</div>
              <div class="metric-value">{{ predictionData.predictedPrice }}</div>
              <div class="metric-unit">元/kg</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">价格趋势</div>
              <div class="metric-value" :class="predictionData.trendClass">
                {{ predictionData.trend }}
              </div>
              <div class="metric-unit">未来7天</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">AI置信度</div>
              <div class="metric-value">{{ predictionData.confidence }}</div>
              <div class="metric-unit">R²值</div>
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
            <div class="timeline-title">📅 趋势推演</div>
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
                基于 <span class="highlight">{{ predictionData.province }}</span> 历史数据，
                预计未来一周 <span class="highlight">{{ predictionData.product }}</span> 价格
                <span :class="predictionData.trendClass === 'trend-up' ? 'text-red' : 'text-green'">
                  {{ predictionData.trend === '上升' ? '震荡上行' : '波动回落' }}
                </span>。
              </p>
              <p class="report-text mt-2">
                受季节性供需影响，流通量{{ predictionData.trend === '上升' ? '略显紧缩' : '逐渐充裕' }}。
                建议{{ predictionData.trend === '上升' ? '提前备货' : '按需采购' }}。
              </p>
            </div>
            <div class="report-footer">
              <span>{{ new Date().toLocaleDateString() }}</span>
              <span>Model: Agri-LSTM-v3</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { mapLocation, mapProduct } from '../../stores/store.js'

const mapLocationStore = mapLocation()
const mapProductStore = mapProduct()

const showResults = ref(false)
const predictionData = ref({})

// 监听城市变化，自动重置
watch(() => mapLocationStore.currentProvince, (newVal) => {
  if (newVal) {
    resetPrediction()
  }
})

const getRandomDuration = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const tasks = ref([
  { name: '定位区域信息', status: 'pending', duration: 0 },
  { name: '获取气象数据', status: 'pending', duration: 0 },
  { name: '加载历史价格', status: 'pending', duration: 0 },
  { name: '构建预测模型', status: 'pending', duration: 0 },
  { name: '生成策略建议', status: 'pending', duration: 0 }
])

const displayStep = ref(0)
const detailIndex = ref(-1)
const timelineIndex = ref(-1)

const allLoaded = computed(() => {
  return tasks.value.every(t => t.status === 'done')
})

const completedCount = computed(() => {
  return tasks.value.filter(t => t.status === 'done').length
})

onMounted(() => {
  startLoadingSequence()
})

// ==== 核心修改：控制执行顺序 ====
const startLoadingSequence = async () => {
  // 1. 初始化：设置动态名称和重置状态
  const currentCity = mapLocationStore.currentProvince || '定位中...'
  tasks.value[0].name = `定位区域信息: ${currentCity}`
  generatePredictionData()

  // 重置所有任务状态
  tasks.value.forEach(t => t.status = 'pending')

  // 2. 配置前4个任务的时间 (并行任务)
  const parallelConfigs = [
    { min: 1200, max: 1800 }, // Task 0
    { min: 2200, max: 3500 }, // Task 1
    { min: 1500, max: 2500 }, // Task 2
    { min: 3500, max: 5000 }  // Task 3: 模型计算
  ]

  // 3. 定义执行单个任务的函数（返回 Promise）
  const runTask = (index, durationObj, delay = 0) => {
    return new Promise((resolve) => {
      // 设置该任务的持续时间
      const duration = getRandomDuration(durationObj.min, durationObj.max)
      tasks.value[index].duration = duration
      
      setTimeout(() => {
        tasks.value[index].status = 'loading'
        
        setTimeout(() => {
          tasks.value[index].status = 'done'
          resolve() // 任务完成，通知 Promise
        }, duration)
        
      }, delay) // 启动延迟
    })
  }

  // 4. 【第一阶段】并行执行前4个任务 (Index 0-3)
  // 使用 Promise.all 等待它们全部完成
  // 这里的 delay (index * 200) 是为了保留视觉上的“错峰”启动效果，而不是完全同时闪烁
  const firstBatch = parallelConfigs.map((config, i) => 
    runTask(i, config, i * 200 + getRandomDuration(0, 200))
  )

  await Promise.all(firstBatch)

  // 5. 【第二阶段】前4个都做完了，才开始第5个 (Index 4)
  // 稍微停顿一下(300ms)，让用户意识到前置工作已完成
  await new Promise(r => setTimeout(r, 300))

  const finalTaskConfig = { min: 1500, max: 2500 } // 策略生成时间
  await runTask(4, finalTaskConfig, 0)
}

const showReport = async () => {
  showResults.value = true
  await streamDisplayResults()
}

const resetPrediction = () => {
  showResults.value = false
  displayStep.value = 0
  detailIndex.value = -1
  timelineIndex.value = -1
  // 重新开始序列
  startLoadingSequence()
}

const streamDisplayResults = async () => {
  await new Promise(resolve => setTimeout(resolve, 100))
  displayStep.value = 1
  await new Promise(resolve => setTimeout(resolve, 300))
  displayStep.value = 2
  await new Promise(resolve => setTimeout(resolve, 300))
  displayStep.value = 3
  if (predictionData.value.details) {
    for (let i = 0; i < predictionData.value.details.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 150))
      detailIndex.value = i
    }
  }
  await new Promise(resolve => setTimeout(resolve, 300))
  displayStep.value = 4
  if (predictionData.value.timeline) {
    for (let i = 0; i < predictionData.value.timeline.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100))
      timelineIndex.value = i
    }
  }
  await new Promise(resolve => setTimeout(resolve, 400))
  displayStep.value = 5
}

const generatePredictionData = () => {
  const province = mapLocationStore.currentProvince || '河南省'
  const product = mapProductStore.currentProduct || '大白菜'
  
  let basePriceVal = 0
  if (province === '河南省' && product === '大白菜') basePriceVal = 1.5 + Math.random() * 1.5
  else if (province === '河南省' && product === '黄瓜') basePriceVal = 5.5 + Math.random() * 2.5
  else basePriceVal = Math.random() * 3 + 1
  
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
    
    let change = trend === '上升' ? (Math.random() * 0.4) - 0.1 : (Math.random() * 0.4) - 0.3
    currentPrice = Math.max(0.5, currentPrice + change)
    
    timeline.push({
      date: dateStr,
      price: currentPrice.toFixed(2),
      height: Math.min(100, Math.max(20, (currentPrice / (basePriceVal * 1.5)) * 100))
    })
  }

  const finalPrice = timeline[timeline.length - 1].price;

  predictionData.value = {
    province, product, basePrice, predictedPrice: finalPrice,
    trend, trendClass, confidence,
    details: [
      { label: '市场供需', value: trend === '上升' ? '供不应求' : '供应充足', valueClass: '' },
      { label: '季节因素', value: Math.random() > 0.5 ? '旺季效应' : '季节性回落', valueClass: '' },
      { label: '物流成本', value: '平稳', valueClass: '' },
      { label: '操作建议', value: trend === '上升' ? '建议囤货' : '随用随采', valueClass: trend === '上升' ? 'action-buy' : 'action-wait' }
    ],
    timeline
  }
}
</script>

<style scoped>
/* ================= 基础容器 ================= */
.ai-prediction-container {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1000;
  padding: 4px; 
}

.prediction-panel {
  width: 100%;
  height: 100%;
  position: relative;
  background: rgba(11, 19, 37, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(66, 227, 164, 0.05); 
  border-radius: 4px; 
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* ================= 科技感断开式边框 ================= */
.corner {
  position: absolute; width: 15px; height: 15px;
  border: 2px solid #42e3a4;
  transition: all 0.5s ease;
  z-index: 10;
  box-shadow: 0 0 5px rgba(66, 227, 164, 0.6);
}
.top-left { top: -1px; left: -1px; border-right: none; border-bottom: none; }
.top-right { top: -1px; right: -1px; border-left: none; border-bottom: none; }
.bottom-left { bottom: -1px; left: -1px; border-right: none; border-top: none; }
.bottom-right { bottom: -1px; right: -1px; border-left: none; border-top: none; }

/* ================= 头部优化：高度压缩 ================= */
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 15px; /* 减少上下padding */
  background: linear-gradient(90deg, transparent, rgba(66, 227, 164, 0.05), transparent);
  border-bottom: 1px solid rgba(66, 227, 164, 0.05);
  flex-shrink: 0;
  min-height: 36px; /* 限制最小高度 */
}

.close-btn { background: transparent; border: none; color: #42e3a4; font-size: 16px; cursor: pointer; opacity: 0.8; }
.close-btn:hover { opacity: 1; transform: scale(1.1); }

/* ================= 内容区优化：隐藏滚动条 ================= */
.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  
  /* 隐藏滚动条的核心代码 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
/* Chrome, Safari, Edge */
.panel-content::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* ================= 任务列表 ================= */
.loading-wrapper {
  flex: 1; display: flex; flex-direction: column; padding: 10px 20px; height: 100%;
}
.system-check-list {
  display: flex; flex-direction: column; gap: 0; margin-top: 10px; position: relative; flex: 1;
}
.timeline-line {
  position: absolute; left: 19px; top: 20px; bottom: 20px; width: 1px;
  background: linear-gradient(180deg, transparent, rgba(66, 227, 164, 0.1) 20%, rgba(66, 227, 164, 0.1) 80%, transparent);
}
.task-item {
  display: flex; align-items: center; padding: 14px 10px; position: relative;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.03);
}
.task-item:last-child { border-bottom: none; }
.task-item.loading { background: linear-gradient(90deg, rgba(66, 227, 164, 0.05) 0%, transparent 80%); }

.task-status-wrapper { width: 40px; position: relative; z-index: 1; display: flex; justify-content: center; }
.task-icon {
  width: 20px; height: 20px; display: flex; justify-content: center; align-items: center;
  background: #0b1325; border-radius: 50%; border: 1px solid rgba(255,255,255,0.1);
}
.task-item.loading .task-icon { border-color: #42e3a4; box-shadow: 0 0 8px rgba(66,227,164,0.4); }
.icon-dot { width: 4px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 50%; }
.icon-check { color: #42e3a4; font-size: 10px; }
.icon-spinner { width: 10px; height: 10px; border: 2px solid rgba(66,227,164,0.2); border-top-color: #42e3a4; border-radius: 50%; animation: spin 0.8s linear infinite; }

.task-info { flex: 1; display: flex; align-items: center; gap: 12px; margin-left: 10px; }
.task-index { font-family: 'Courier New', monospace; font-size: 10px; color: rgba(255,255,255,0.2); letter-spacing: 1px; margin-right: 8px; }
.task-item.loading .task-index, .task-item.done .task-index { color: #42e3a4; }
.task-name { font-size: 14px; color: rgba(255, 255, 255, 0.6); }
.task-item.done .task-name { color: #fff; }

.task-meta { text-align: right; min-width: 60px; }
.time-cost { font-family: 'Courier New', monospace; font-size: 11px; color: #42e3a4; opacity: 0.9; }
.processing-dots { color: rgba(66,227,164,0.4); font-size: 12px; animation: pulse 1s infinite; }
.fade-in-text { animation: fadeIn 0.5s ease; }
.item-progress-line { position: absolute; bottom: 0; left: 0; height: 1px; background: #42e3a4; transition: width 0.4s ease; }

.action-area {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 90px;
  background: linear-gradient(180deg, transparent 0%, rgba(11,19,37,0.8) 100%);
  margin-top: auto;
}
.liquid-btn {
  position: relative; border: none; outline: none;
  background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);
  width: 200px; height: 44px; border-radius: 22px;
  cursor: pointer; overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex; justify-content: center; align-items: center;
}
.liquid-btn::before {
  content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(90deg, #42e3a4, #2ecc71);
  opacity: 0.8; z-index: 0; transform: scaleX(0); transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}
.liquid-btn:hover::before { transform: scaleX(1); }
.btn-content { position: relative; z-index: 2; color: #fff; font-size: 14px; font-weight: 500; letter-spacing: 1px; mix-blend-mode: overlay; }
.liquid-btn:hover .btn-content { mix-blend-mode: normal; color: #0b1325; font-weight: bold; }
.shine { position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); transform: skewX(-20deg); }
.liquid-btn:hover .shine { left: 200%; transition: 0.8s ease-in-out; }
.loading-hint { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 10px; }

/* ================= 结果页：去除顶部多余空白 ================= */
.results-section { 
  padding: 5px 15px 15px 15px; /* 将 padding-top 从 15px 减小到 5px */
}

.result-info { display: flex; gap: 10px; margin-bottom: 12px; padding: 10px; background: rgba(66, 227, 164, 0.05); border-radius: 6px; border: 1px solid rgba(66, 227, 164, 0.1); }
.info-item { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.info-label { font-size: 11px; color: rgba(255, 255, 255, 0.5); }
.info-value { font-size: 13px; font-weight: bold; color: #fff; }

.prediction-metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.metric-card { padding: 8px 5px; background: rgba(66, 227, 164, 0.05); border: 1px solid rgba(66, 227, 164, 0.1); border-radius: 6px; text-align: center; }
.metric-label { font-size: 10px; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px; }
.metric-value { font-size: 16px; font-weight: bold; color: #42e3a4; }
.metric-value.trend-up { color: #ff6b6b; }
.metric-value.trend-down { color: #69f0ae; }
.metric-unit { font-size: 9px; color: rgba(255, 255, 255, 0.4); }

.prediction-details { margin-bottom: 12px; }
.detail-title { font-size: 12px; font-weight: bold; color: #42e3a4; margin-bottom: 8px; border-left: 2px solid #42e3a4; padding-left: 6px; }
.detail-content { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.detail-item { display: flex; justify-content: space-between; padding: 6px 8px; background: rgba(255,255,255,0.03); border-radius: 4px; }
.detail-label { font-size: 11px; color: rgba(255,255,255,0.6); }
.detail-value { font-size: 11px; font-weight: bold; color: #fff; }
.detail-value.action-buy { color: #ff6b6b; }
.detail-value.action-wait { color: #69f0ae; }

.prediction-timeline { margin-bottom: 12px; padding: 10px; background: rgba(66, 227, 164, 0.02); border-radius: 8px; border: 1px solid rgba(66, 227, 164, 0.1); }
.timeline-title { font-size: 12px; font-weight: bold; color: #42e3a4; margin-bottom: 10px; border-left: 2px solid #42e3a4; padding-left: 6px; }
.timeline-chart { display: flex; justify-content: space-between; align-items: flex-end; height: 100px; padding-top: 10px; width: 100%; }
.timeline-item { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; flex: 1; height: 100%; position: relative; }
.timeline-bar-wrapper { width: 100%; display: flex; justify-content: center; align-items: flex-end; transition: height 0.5s ease; min-height: 4px; }
.timeline-bar { width: 40%; max-width: 20px; min-width: 6px; height: 100%; background: linear-gradient(180deg, #42e3a4 0%, rgba(66, 227, 164, 0.1) 100%); border-radius: 4px 4px 0 0; }
.timeline-item .timeline-price { font-size: 10px; color: #42e3a4; margin-bottom: 2px; transform: scale(0.9); white-space: nowrap; }
.timeline-label { margin-top: 6px; font-size: 10px; color: rgba(255, 255, 255, 0.5); transform: scale(0.9); white-space: nowrap; }

.prediction-report { 
  background: linear-gradient(135deg, rgba(66, 227, 164, 0.05) 0%, rgba(11, 19, 37, 0.2) 100%); 
  border: 1px solid rgba(66, 227, 164, 0.15); 
  border-radius: 8px; 
  padding: 10px; /* 略微减小 padding */
  position: relative; 
  overflow: hidden; 
}
.prediction-report::before { content: ''; position: absolute; top: 0; left: 0; width: 3px; height: 100%; background: #42e3a4; }
.report-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: #42e3a4; font-size: 13px; font-weight: bold; }
.report-text { font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.8); text-align: justify; }
.mt-2 { margin-top: 6px; }
.highlight { color: #fff; font-weight: bold; background: rgba(66, 227, 164, 0.1); padding: 0 4px; border-radius: 2px; }
.text-red { color: #ff6b6b; }
.text-green { color: #69f0ae; }
.report-footer { margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; font-size: 10px; color: rgba(255, 255, 255, 0.3); font-family: monospace; }

/* 动画定义保持不变 */
.fade-in { animation: fadeIn 0.5s ease forwards; opacity: 0; }
.fade-in-up { animation: fadeInUp 0.5s ease forwards; opacity: 0; }
.slide-in { animation: slideInLeft 0.3s ease forwards; opacity: 0; }
.slide-up { animation: slideUpBar 0.4s ease forwards; opacity: 0; }
.fade-up-enter-active { transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.fade-up-enter-from { opacity: 0; transform: translateY(20px); }

@keyframes fadeIn { to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideInLeft { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideUpBar { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 50% { opacity: 0.5; } }
</style>