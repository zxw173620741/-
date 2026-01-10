import { defineStore } from 'pinia'
import provinceCapitalMap from '../assets/json/provinceCapitalMap.json'

// ==========================================
// 1. 地理位置 Store (管理地图联动)
// ==========================================
export const mapLocation = defineStore('mapLocationPinia', {
  state: () => {
    return {
      currentProvince: '河南省', // 省
      currentCity: '郑州市',     // 市
      currentDistrict: '',     // 区县 (默认为空)
    }
  },
  actions: {
    // 设置省份 -> 自动设置为对应省会城市，重置区
    setCurrentProvince(province) {
      this.currentProvince = province
      this.currentCity = provinceCapitalMap[province]?.name || ''
      this.currentDistrict = ''
    },

    // 设置城市 -> 自动重置区
    setCurrentCity(city) {
      this.currentCity = city
      this.currentDistrict = ''
    },

    // 设置区县
    setCurrentDistrict(district) {
      this.currentDistrict = district
    },

    // 重置回默认状态
    resetLocation() {
      this.currentProvince = '河南省'
      this.currentCity = '郑州市'
      this.currentDistrict = ''
    },
  },
})

// ==========================================
// 2. 农作物/蔬菜 Store (管理业务筛选)
// ==========================================
export const mapProduct = defineStore('mapProductPinia', {
  state: () => {
    return {
      currentProduct: '大白菜', // 当前选中的蔬菜
    }
  },
  actions: {
    // 设置农作物
    setCurrentProduct(product) {
      this.currentProduct = product
    },

    // 重置农作物 (可选)
    resetProduct() {
      this.currentProduct = '大白菜'
    }
  },
})

// ==========================================
// 3. 价格预测数据缓存 Store (管理预测数据)
// ==========================================
export const pricePredictionCache = defineStore('pricePredictionCachePinia', {
  state: () => {
    return {
      cache: {}, // 缓存数据，key格式: "省-市-区-蔬菜名"
    }
  },
  actions: {
    // 生成缓存key
    generateCacheKey(province, city, district, productName) {
      return `${province}-${city}-${district}-${productName}`
    },

    // 获取缓存数据
    getCache(province, city, district, productName) {
      const key = this.generateCacheKey(province, city, district, productName)
      return this.cache[key] || null
    },

    // 设置缓存数据
    setCache(province, city, district, productName, data) {
      const key = this.generateCacheKey(province, city, district, productName)
      this.cache[key] = data
    },

    // 清除指定缓存
    clearCache(province, city, district, productName) {
      const key = this.generateCacheKey(province, city, district, productName)
      delete this.cache[key]
    },

    // 清除所有缓存
    clearAllCache() {
      this.cache = {}
    }
  },
  persist: true // 启用持久化存储
})

// ==========================================
// 4. 语音播报 Store (管理语音播报状态)
// ==========================================
export const voiceBroadcast = defineStore('voiceBroadcastPinia', {
  state: () => {
    return {
      isEnabled: false, // 语音播报是否开启，默认为未开启
    }
  },
  actions: {
    // 切换语音播报状态
    toggleVoiceBroadcast() {
      this.isEnabled = !this.isEnabled
    },

    // 开启语音播报
    enableVoiceBroadcast() {
      this.isEnabled = true
    },

    // 关闭语音播报
    disableVoiceBroadcast() {
      this.isEnabled = false
    },
  },
  persist: true // 启用持久化存储
})