<template>
  <div class="side-decor right-panel">
    <div class="panel-title">农产品交易量监测</div>

    <div class="selector-section">
      <div class="selector-label">选择监测品种</div>
      <div class="tech-select-wrapper">
        <el-select
          v-model="selectedProduct"
          placeholder="请选择农产品"
          filterable
          popper-class="tech-select-dropdown-green"
          class="tech-select"
          @change="handleProductChange"
        >
          <el-option-group
            v-for="group in productOptions"
            :key="group.oneLevel"
            :label="group.oneLevel"
          >
            <el-option
              v-for="item in group.items"
              :key="item.varietyname"
              :label="item.varietyname"
              :value="item.varietyname"
            >
              <span class="option-item">
                <span class="option-category">{{ item.twoLevel || group.oneLevel }}</span>
                <span class="option-name">{{ item.varietyname }}</span>
              </span>
            </el-option>
          </el-option-group>
        </el-select>
      </div>
    </div>

    <div class="divider-line"></div>

    <div class="price-ranking-section">
      <div class="section-title">未来5天价格预测</div>
      <div class="ranking-list">
        <div
          v-for="(item, index) in provincePriceRanking"
          :key="item.day"
          class="ranking-item"
        >
          <div class="day-label">{{ item.day }}</div>
          <div class="price-info">
            <span class="price-value">{{ item.price }}</span>
            <span class="price-unit">元/斤</span>
          </div>
          <div class="probability-badge">
            <span class="probability-value">{{ (item.probability * 100).toFixed(0) }}%</span>
            <span class="probability-label">概率</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider-line"></div>

    <div class="weather-monitor">
      <slot name="content"></slot>
    </div>

    <div class="v-ruler">
      <span v-for="i in 8" :key="i" class="tick"></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getAllVaegettableTypes } from '../../api/requestFuntion.js'
import { mapProduct, mapLocation } from '../../stores/store.js'

const emit = defineEmits(['product-change'])

const mapProductStore = mapProduct()
const mapLocationStore = mapLocation()
const productOptions = ref([])
const selectedProduct = ref(mapProductStore.currentProduct)

// 省份价格排名数据
const provincePriceRanking = ref([])

const mockPriceDataGroups = [
  [
    { day: '第1天', price: 8.5, probability: 0.85 },
    { day: '第2天', price: 8.3, probability: 0.82 },
    { day: '第3天', price: 8.1, probability: 0.78 },
    { day: '第4天', price: 8.0, probability: 0.75 },
    { day: '第5天', price: 7.9, probability: 0.72 },
  ],
  [
    { day: '第1天', price: 9.2, probability: 0.88 },
    { day: '第2天', price: 9.0, probability: 0.85 },
    { day: '第3天', price: 8.8, probability: 0.82 },
    { day: '第4天', price: 8.6, probability: 0.80 },
    { day: '第5天', price: 8.5, probability: 0.78 },
  ],
  [
    { day: '第1天', price: 7.9, probability: 0.80 },
    { day: '第2天', price: 7.7, probability: 0.78 },
    { day: '第3天', price: 7.5, probability: 0.75 },
    { day: '第4天', price: 7.4, probability: 0.72 },
    { day: '第5天', price: 7.3, probability: 0.70 },
  ],
]

// 简单的伪随机数生成器（基于种子）
const seededRandom = (seed) => {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 根据蔬菜名称和城市生成5天预测数据
const generatePredictionData = (productName, cityName) => {
  let basePrice = 0
  const province = mapLocationStore.currentProvince || '河南省'
  
  if (province === '河南省' && productName === '大白菜') {
    basePrice = 1.5 + Math.random() * 1.5
  } else if (province === '河南省' && productName === '黄瓜') {
    basePrice = 5.5 + Math.random() * 2.5
  } else if (province === '四川省' && productName === '黄瓜') {
    basePrice = 4 + Math.random() * 4
  } else if (province === '四川省' && productName === '大白菜') {
    basePrice = 2 + Math.random() * 1
  } else {
    basePrice = 5 + seededRandom(productName.length + cityName.length) * 5
  }
  
  const data = []
  const today = new Date()
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0].substring(5)
    
    const daySeed = (productName.charCodeAt(i % productName.length || 0) + cityName.charCodeAt(i % cityName.length || 0)) * i
    const priceVariation = (seededRandom(daySeed) - 0.5) * (basePrice * 0.2)
    const probability = 0.6 + seededRandom(daySeed + 100) * 0.35
    
    data.push({
      day: dateStr,
      price: Math.max(1, (basePrice + priceVariation).toFixed(1)),
      probability: Math.min(0.95, Math.max(0.5, probability))
    })
  }
  
  return data
}

// 更新省份价格排名
const updateProvincePriceRanking = () => {
  const productName = selectedProduct.value || '大白菜'
  const cityName = mapLocationStore.currentCity || '郑州市'
  const predictionData = generatePredictionData(productName, cityName)
  provincePriceRanking.value = predictionData
  console.log(`更新 ${productName} (${cityName}) 的5天价格预测：`, predictionData)
}

// 1. 加载数据的逻辑
const loadProductOptions = async () => {
  try {
    const data = await getAllVaegettableTypes()
    if (data) {
      const groupedData = {}
      data.forEach((item) => {
        if (!item.oneLevel) return

        if (!groupedData[item.oneLevel]) {
          groupedData[item.oneLevel] = {
            oneLevel: item.oneLevel,
            items: [],
          }
        }
        groupedData[item.oneLevel].items.push(item)
      })
      productOptions.value = Object.values(groupedData)

      if (
        !selectedProduct.value &&
        productOptions.value.length > 0 &&
        productOptions.value[0].items.length > 0
      ) {
        const firstItem = productOptions.value[0].items[0].varietyname
        handleProductChange(firstItem)
      }
    }
  } catch (error) {
    console.error('获取农产品分类数据失败：', error)
  }
}

// 2. 处理选中变化
const handleProductChange = (val) => {
  selectedProduct.value = val
  mapProductStore.setCurrentProduct(val)
  emit('product-change', val)
  updateProvincePriceRanking()
}

// 监听蔬菜变化
watch(
  () => mapProductStore.currentProduct,
  (newProduct) => {
    if (newProduct && newProduct !== selectedProduct.value) {
      selectedProduct.value = newProduct
      updateProvincePriceRanking()
    }
  }
)

// 监听城市变化
watch(
  () => mapLocationStore.currentCity,
  (newCity) => {
    if (newCity) {
      updateProvincePriceRanking()
    }
  }
)

onMounted(() => {
  loadProductOptions()
  updateProvincePriceRanking()
})
</script>

<style scoped>
/* ==================== 
   布局与容器样式 (绿色风)
   ==================== */
.side-decor {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 22%;
  max-width: 300px;
  height: 85%;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: auto;
}

.right-panel {
  right: 20px;
  /* 绿色边框 */
  border-right: 1px solid rgba(66, 227, 164, 0.3);
  padding-right: 15px;
  text-align: right;
  align-items: flex-end;
  /* 绿色渐变背景 */
  background: linear-gradient(270deg, rgba(66, 227, 164, 0.08), transparent);
}

.panel-title {
  font-size: 16px;
  color: #42e3a4;
  font-weight: bold;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(66, 227, 164, 0.6);
  white-space: nowrap;
  width: 100%;
  text-align: right;
  margin-bottom: 8px;
  border-bottom: 2px solid rgba(66, 227, 164, 0.1);
  padding-bottom: 6px;
}

.selector-section {
  width: 100%;
  margin-bottom: 6px;
}

.selector-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
  letter-spacing: 1px;
  text-align: right;
}

.selector-label::before {
  content: '▼';
  font-size: 10px;
  color: #42e3a4;
  margin-right: 4px;
}

.tech-select-wrapper {
  position: relative;
  width: 100%;
}

.tech-select {
  width: 100%;
}

.divider-line {
  width: 100%;
  height: 1px;
  background: repeating-linear-gradient(
    90deg,
    rgba(66, 227, 164, 0.4) 0,
    rgba(66, 227, 164, 0.4) 4px,
    transparent 4px,
    transparent 8px
  );
  margin: 6px 0;
}

.price-ranking-section {
  width: 100%;
  margin: 10px 0;
  flex-shrink: 0;
}

.section-title {
  font-size: 12px;
  color: #42e3a4;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: right;
  letter-spacing: 1px;
  text-shadow: 0 0 6px rgba(66, 227, 164, 0.4);
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  background: rgba(66, 227, 164, 0.05);
  border: 1px solid rgba(66, 227, 164, 0.15);
  border-radius: 3px;
  transition: all 0.3s ease;
  min-height: 32px;
}

.ranking-item:hover {
  background: rgba(66, 227, 164, 0.12);
  border-color: rgba(66, 227, 164, 0.3);
  box-shadow: 0 0 10px rgba(66, 227, 164, 0.15);
}

.day-label {
  width: 45px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  flex-shrink: 0;
}

.price-info {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 3px;
  justify-content: center;
}

.price-value {
  font-size: 15px;
  font-weight: bold;
  color: #42e3a4;
  font-family: 'Arial', sans-serif;
}

.price-unit {
  font-size: 10px;
  color: rgba(66, 227, 164, 0.7);
}

.probability-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(66, 227, 164, 0.1);
  border: 1px solid rgba(66, 227, 164, 0.2);
  border-radius: 3px;
  padding: 3px 6px;
  min-width: 50px;
}

.probability-value {
  font-size: 12px;
  font-weight: bold;
  color: #42e3a4;
  line-height: 1.1;
}

.probability-label {
  font-size: 9px;
  color: rgba(66, 227, 164, 0.6);
  margin-top: 1px;
}

.weather-monitor {
  flex: 1;
  overflow: hidden;
  width: 100%;
  min-height: 0;
}

.v-ruler {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  opacity: 0.5;
  padding-top: 6px;
  align-items: flex-end;
  flex-shrink: 0;
}

.tick {
  width: 8px;
  height: 2px;
  background: #42e3a4;
  box-shadow: 0 0 5px rgba(66, 227, 164, 0.5);
}

/* ==================== 
   输入框样式强力覆盖 
   /* ==================== */
:deep(.el-input__wrapper) {
  background-color: transparent !important;
  border: 1px solid rgba(66, 227, 164, 0.3) !important;
  box-shadow: none !important;
  border-radius: 2px;
  padding: 6px 12px !important;
  transition: all 0.3s ease;
}

/* 鼠标悬停时的输入框 */
:deep(.el-input__wrapper:hover) {
  border-color: rgba(66, 227, 164, 0.5) !important;
  box-shadow: 0 0 8px rgba(66, 227, 164, 0.15) !important;
}

/* 选中/聚焦时的输入框 */
:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(66, 227, 164, 0.7) !important;
  box-shadow: 0 0 12px rgba(66, 227, 164, 0.2) !important;
}

/* 输入文字样式 */
:deep(.el-input__inner) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-weight: 500;
  font-size: 14px;
  text-align: right;
  font-family: 'Microsoft YaHei', sans-serif;
  background-color: transparent !important;
  background-image: none !important;
}

/* 覆盖Element UI select的wrapper默认白色背景 */
:deep(.el-select__wrapper) {
  background-color: transparent !important;
  background-image: none !important;
}

/* 确保输入框容器也完全透明 */
:deep(.el-input) {
  background-color: transparent !important;
}

/* 占位符颜色 */
:deep(.el-input__inner::placeholder) {
  color: rgba(66, 227, 164, 0.4);
}

/* 右侧箭头图标 */
:deep(.el-select__caret) {
  color: rgba(66, 227, 164, 0.7) !important;
  font-size: 14px;
}
</style>

<style>
/* 下拉菜单容器 */
.tech-select-dropdown-green.el-popper {
  background: rgba(4, 20, 15, 0.9) !important;
  border: 1px solid rgba(66, 227, 164, 0.3) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  backdrop-filter: blur(8px);
}

/* 隐藏原本的小三角箭头 */
.tech-select-dropdown-green .el-popper__arrow::before {
  background: rgba(4, 20, 15, 0.9) !important;
  border: 1px solid rgba(66, 227, 164, 0.3) !important;
}

/* 分组标题 */
.tech-select-dropdown-green .el-select-group__title {
  color: rgba(66, 227, 164, 0.8) !important;
  font-size: 11px;
  border-bottom: 1px solid rgba(66, 227, 164, 0.15);
  padding: 8px 12px;
  background: rgba(66, 227, 164, 0.05);
  font-weight: 500;
}

/* 选项样式 */
.tech-select-dropdown-green .el-select-dropdown__item {
  color: rgba(255, 255, 255, 0.85) !important;
  padding: 0 12px !important;
  height: 36px;
  line-height: 36px;
  font-size: 13px;
}

/* 选项悬停 */
.tech-select-dropdown-green .el-select-dropdown__item.hover,
.tech-select-dropdown-green .el-select-dropdown__item:hover {
  background-color: rgba(66, 227, 164, 0.12) !important;
}

/* 选中状态 */
.tech-select-dropdown-green .el-select-dropdown__item.selected {
  color: #42e3a4 !important;
  font-weight: 500;
  background: rgba(66, 227, 164, 0.1) !important;
}

/* 自定义选项内部布局 */
.tech-select-dropdown-green .option-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 选项左侧的小标签 */
.tech-select-dropdown-green .option-category {
  font-size: 10px;
  color: rgba(66, 227, 164, 0.7);
  border: 1px solid rgba(66, 227, 164, 0.3);
  border-radius: 2px;
  padding: 0 4px;
  height: 16px;
  line-height: 14px;
}

.tech-select-dropdown-green .option-name {
  font-size: 13px;
}
</style>
