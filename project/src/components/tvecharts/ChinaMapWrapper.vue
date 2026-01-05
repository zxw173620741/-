<template>
    <div class="tech-map-wrapper">
        <div class="scan-light"></div>
        <div class="radar-ring ring-1"></div>
        <div class="radar-ring ring-2"></div>
        <div class="corner top-left"></div>
        <div class="corner top-right"></div>
        <div class="corner bottom-left"></div>
        <div class="corner bottom-right"></div>
        <div class="decor-grid"></div>

        <div class="side-decor left-panel">
            <div class="panel-header">
                <div class="header-left">
                    <transition name="fade">
                        <div v-if="isDrillDown" class="mini-back-btn" @click="handleBackToChina" title="返回上级">
                            <span class="arrow-icon">❮</span>
                        </div>
                    </transition>
                </div>

                <div class="header-content">
                    <div class="panel-title" :title="mapCityStore.currentRegionName">{{ mapCityStore.currentRegionName }}</div>
                    <div class="sub-title">气象实时监测</div>
                </div>

                <div class="header-right"></div>
            </div>

            <div class="divider-line"></div>

            <div class="weather-monitor">
                <div v-if="loading" class="no-data">
                    <span class="blinking">数据同步中...</span>
                </div>
                <div v-else-if="weatherForecast.length === 0" class="no-data">
                    <span>暂无数据</span>
                </div>
                <div v-else class="weather-list">
                    <div v-for="(day, index) in weatherForecast" :key="day.fxDate" class="weather-row">
                        <div class="row-left">
                            <span class="date-text">{{ index === 0 ? '今日' : formatDay(day.fxDate) }}</span>
                            <span class="weather-icon">{{ getWeatherIcon(day.textDay) }}</span>
                        </div>
                        <div class="row-right">
                            <span class="temp-text">
                                {{ day.tempMin }}°/<span class="max-temp">{{ day.tempMax }}°</span>
                            </span>
                            <span class="condition-text">{{ day.textDay }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="v-ruler">
                <span v-for="i in 8" :key="i" class="tick"></span>
            </div>
        </div>

        <div class="side-decor right-panel">
            <div class="panel-title">农产品交易量监测</div>
            
            <div class="selector-section">
                <div class="selector-label">选择监测品种</div>
                <div class="tech-select-wrapper">
                    <el-select 
                        v-model="selectedProduct" 
                        placeholder="请选择农产品" 
                        filterable
                        popper-class="tech-select-dropdown"
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
                                    <span class="option-category">{{ item.twoLevel }}</span>
                                    <span class="option-name">{{ item.varietyname }}</span>
                                </span>
                            </el-option>
                        </el-option-group>
                    </el-select>
                </div>
            </div>

            <div class="divider-line"></div>

            <div class="weather-monitor">
                <div v-if="loadingVolume" class="no-data">
                    <span class="blinking">交易量数据同步中...</span>
                </div>
                <div v-else-if="volumeData.length === 0" class="no-data">
                    <span>暂无交易量数据</span>
                </div>
                <div v-else class="weather-list">
                    <div v-for="(item, index) in volumeData" :key="index" class="weather-row">
                        <div class="row-left">
                            <span class="weather-icon">📊</span>
                            <span class="date-text" style="width: auto;">{{ item.market || '未知市场' }}</span>
                        </div>
                        <div class="row-right">
                            <span class="temp-text">{{ item.volume }}<span style="font-size:10px; color:#aaa">吨</span></span>
                            <span class="condition-text">{{ item.date || '今日' }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="v-ruler">
                <span v-for="i in 8" :key="i" class="tick"></span>
            </div>
        </div>

        <div class="decor-label">智慧农业数据分析平台 // 实时监控</div>

        <div class="map-core">
            <ChinaMap ref="chinaMapRef" :city-data="cityData" @region-change="handleMapChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import ChinaMap from './ChinaMap.vue';
// 移除了 getVegetableProvincePrice，保留 selectVolume 等
import { get7DayWeather, getAllVegetableTypes, selectVolume } from '/src/api/requestFuntion.js';
import { mapCity } from '/src/store/store.js';

// --- 导入 JSON 映射文件 ---
import provinceCapitalMap from '/src/assets/json/provinceCapitalMap.json';
import cityCodeMap from '/src/assets/json/cityCodeMap.json';
import weatherIconMap from '/src/assets/json/weatherIconMap.json';

const props = defineProps({
    cityData: { type: Array, default: () => [] }
});

const chinaMapRef = ref(null);
const mapCityStore = mapCity();
const selectedProduct = ref(mapCityStore.currentProduct);

// 天气相关
const weatherForecast = ref([]);
const loading = ref(false);

// 农产品相关
const productOptions = ref([]);
const volumeData = ref([]);
const loadingVolume = ref(false);

// 判断是否需要显示返回按钮
const isDrillDown = computed(() => {
    return mapCityStore.currentRegionName !== '北京';
});

// 获取天气图标
const getWeatherIcon = (text) => weatherIconMap[text] || '🌤️';

// 格式化日期
const formatDay = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 加载农产品下拉选项
const loadProductOptions = async () => {
    try {
        const response = await getAllVegetableTypes();
        if (response.data && response.data.data) {
            const groupedData = {};
            response.data.data.forEach(item => {
                if (!groupedData[item.oneLevel]) {
                    groupedData[item.oneLevel] = {
                        oneLevel: item.oneLevel,
                        items: []
                    };
                }
                groupedData[item.oneLevel].items.push(item);
            });
            productOptions.value = Object.values(groupedData);
        }
    } catch (error) {
        console.error('获取农产品分类数据失败：', error);
    }
};

// 监听农产品切换
const handleProductChange = (productName) => {
    if (productName) {
        mapCityStore.setCurrentProduct(productName);
        fetchVolumeData(productName);
    }
};

// 获取交易量数据 (使用 selectVolume)
const fetchVolumeData = async (productName) => {
    loadingVolume.value = true;
    try {
        // 构造查询参数
        const query = { varietyname: productName };
        // 调用 api/requestFuntion.js 中的 selectVolume(query, url)
        const response = await selectVolume(query, '/user/selectVolume');
        
        if (response.data && response.data.code === '0') {
            volumeData.value = response.data.data || [];
        } else {
            volumeData.value = [];
        }
    } catch (error) {
        console.error('获取交易量数据失败:', error);
        volumeData.value = [];
    } finally {
        loadingVolume.value = false;
    }
};

// --- 核心逻辑：地图切换处理 ---
const handleMapChange = async (regionName) => {
    if (regionName === '北京') {
        resetToDefault();
        return;
    }
    let targetCode = '';
    let displayName = regionName;

    // 使用导入的 JSON 映射
    if (provinceCapitalMap[regionName]) {
        targetCode = provinceCapitalMap[regionName].code;
        displayName = provinceCapitalMap[regionName].name;
    } else if (cityCodeMap[regionName]) {
        targetCode = cityCodeMap[regionName];
    }

    if (targetCode) {
        loading.value = true;
        mapCityStore.setCurrentRegionName(displayName);
        await fetchWeather(targetCode);
        
        // 城市改变时，刷新交易量数据
        if (selectedProduct.value) {
            await fetchVolumeData(selectedProduct.value);
        }
    }
};

// 返回全国视图
const handleBackToChina = async () => {
    await chinaMapRef.value?.backToChina();
};

// 重置到默认状态
const resetToDefault = () => {
    loading.value = true;
    mapCityStore.resetCity();
    fetchWeather('101010100');
};

// 获取天气数据
const fetchWeather = async (code) => {
    try {
        const res = await get7DayWeather(code);
        if (res.data && res.data.code === "200") {
            weatherForecast.value = res.data.daily;
        }
    } catch (e) {
        console.error("天气获取失败", e);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchWeather('101010100');
    loadProductOptions();
    // 初始加载默认产品的交易量
    if (selectedProduct.value) {
        fetchVolumeData(selectedProduct.value);
    }
});
</script>

<style scoped>
/* ==================== 
   1. 基础容器与背景 
   ==================== */
.tech-map-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 15px;
    box-sizing: border-box;
    background-color: #0a192f;
    background-image: linear-gradient(rgba(10, 25, 47, 0.7), rgba(10, 25, 47, 0.7)), url('/img/bg.png');
    background-size: cover;
    overflow: hidden;
    color: #fff;
    font-family: 'Microsoft YaHei', sans-serif;
}

/* ==================== 
   2. 侧边面板 (布局) 
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
    gap: 10px;
    pointer-events: auto;
}

.left-panel {
    left: 20px;
    border-left: 1px solid rgba(0, 247, 255, 0.3);
    padding-left: 15px;
    background: linear-gradient(90deg, rgba(0, 247, 255, 0.1), transparent);
}

.right-panel {
    right: 20px;
    border-right: 1px solid rgba(0, 247, 255, 0.3);
    padding-right: 15px;
    text-align: right;
    align-items: flex-end;
}

/* ==================== 
   3. 头部 Header (布局固定) 
   ==================== */
.panel-header {
    position: relative;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5px;
    flex-shrink: 0;
}

.header-left,
.header-right {
    width: 30px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.header-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.panel-title {
    font-size: 18px;
    color: #00f7ff;
    font-weight: bold;
    letter-spacing: 1px;
    text-shadow: 0 0 5px rgba(0, 247, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    text-align: center;
}

/* 右侧标题样式覆写 */
.right-panel .panel-title {
    text-align: right;
    width: 100%;
}

.sub-title {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1;
    margin-top: 4px;
}

/* 返回按钮 */
.mini-back-btn {
    width: 24px;
    height: 24px;
    border: 1px solid #45d0b2;
    background: rgba(0, 20, 40, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
}

.mini-back-btn:hover {
    background: #45d0b2;
    box-shadow: 0 0 10px #45d0b2;
}

.mini-back-btn:hover .arrow-icon {
    color: #000;
}

.arrow-icon {
    font-size: 12px;
    color: #45d0b2;
    padding-right: 2px;
}

.divider-line {
    width: 100%;
    height: 1px;
    background: repeating-linear-gradient(90deg, rgba(69, 208, 178, 0.3) 0, rgba(69, 208, 178, 0.3) 4px, transparent 4px, transparent 8px);
    margin: 5px 0;
    flex-shrink: 0;
}

/* ==================== 
   4. 通用列表样式 (天气 & 交易量)
   ==================== */
.weather-monitor {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-top: 5px;
    min-height: 0;
}

.weather-list {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.weather-row {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 5px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    box-sizing: border-box;
}

.weather-row:last-child {
    border-bottom: none;
}

.row-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.date-text {
    color: rgba(255, 255, 255, 0.7);
    width: 40px;
    font-size: 13px;
    font-weight: 500;
}

.weather-icon {
    font-size: 16px;
    width: 25px;
    text-align: center;
}

.row-right {
    text-align: right;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: flex-end;
    flex: 1;
}

.temp-text {
    color: #fff;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 14px;
    letter-spacing: 0;
}

.max-temp {
    color: #00f7ff;
}

.condition-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    min-width: 42px;
    text-align: right;
    white-space: nowrap;
}

.no-data {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.3);
    font-size: 14px;
}

/* ==================== 
   5. 装饰动画与组件 
   ==================== */
.v-ruler {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    opacity: 0.3;
    padding-top: 10px;
    flex-shrink: 0;
}

.tick {
    width: 8px;
    height: 1px;
    background: #00f7ff;
}

/* 地图核心 */
.map-core {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 10;
}

/* 角落 */
.corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid #00f7ff;
    box-shadow: 0 0 8px #00f7ff;
    z-index: 20;
}

.top-left {
    top: 0;
    left: 0;
    border-right: 0;
    border-bottom: 0;
}

.top-right {
    top: 0;
    right: 0;
    border-left: 0;
    border-bottom: 0;
}

.bottom-left {
    bottom: 0;
    left: 0;
    border-right: 0;
    border-top: 0;
}

.bottom-right {
    bottom: 0;
    right: 0;
    border-left: 0;
    border-top: 0;
}

.decor-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(rgba(69, 208, 178, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(69, 208, 178, 0.05) 1px, transparent 1px);
    background-size: 30px 30px;
    z-index: 1;
    pointer-events: none;
}

.radar-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px dashed rgba(69, 208, 178, 0.1);
    z-index: 2;
    pointer-events: none;
}

.ring-1 {
    width: 60%;
    aspect-ratio: 1;
    animation: rotate 20s linear infinite;
}

.ring-2 {
    width: 85%;
    aspect-ratio: 1;
    border-style: dotted;
    animation: rotate-reverse 30s linear infinite;
}

.scan-light {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: linear-gradient(180deg, transparent 0%, rgba(0, 247, 255, 0.08) 50%, transparent 100%);
    background-size: 100% 200%;
    animation: scan 4s linear infinite;
    z-index: 5;
    pointer-events: none;
}

.decor-label {
    position: absolute;
    bottom: 10px;
    right: 20px;
    font-size: 10px;
    color: rgba(0, 247, 255, 0.4);
    font-family: monospace;
    z-index: 20;
}

.blinking {
    animation: blink 1.5s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes rotate {
    from { transform: translate(-50%, -50%) rotate(0deg); }
    to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes rotate-reverse {
    from { transform: translate(-50%, -50%) rotate(360deg); }
    to { transform: translate(-50%, -50%) rotate(0deg); }
}

@keyframes scan {
    0% { top: -100%; opacity: 0; }
    50% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* ==================== 
   6. 科技风格选择器样式
   ==================== */
.selector-section {
    margin-bottom: 10px;
    margin-top: 10px;
}

.selector-label {
    font-size: 11px;
    color: rgba(0, 247, 255, 0.7);
    margin-bottom: 8px;
    letter-spacing: 1px;
    text-transform: uppercase;
}

.tech-select-wrapper {
    position: relative;
}

.tech-select {
    width: 100%;
}

:deep(.tech-select .el-input__wrapper) {
    background: rgba(0, 20, 40, 0.9);
    border: 1px solid rgba(0, 247, 255, 0.3);
    box-shadow: 0 0 10px rgba(0, 247, 255, 0.1), inset 0 0 5px rgba(0, 247, 255, 0.05);
    border-radius: 4px;
    padding: 4px 12px;
    transition: all 0.3s;
}

:deep(.tech-select .el-input__wrapper:hover) {
    border-color: rgba(0, 247, 255, 0.6);
    box-shadow: 0 0 15px rgba(0, 247, 255, 0.2), inset 0 0 8px rgba(0, 247, 255, 0.08);
}

:deep(.tech-select .el-input__wrapper.is-focus) {
    border-color: #00f7ff;
    box-shadow: 0 0 20px rgba(0, 247, 255, 0.3), inset 0 0 10px rgba(0, 247, 255, 0.1);
}

:deep(.tech-select .el-input__inner) {
    color: #00f7ff;
    font-size: 13px;
    font-family: 'Microsoft YaHei', sans-serif;
}

:deep(.tech-select .el-input__inner::placeholder) {
    color: rgba(0, 247, 255, 0.4);
}

:deep(.tech-select .el-select__caret) {
    color: #00f7ff;
}

/* 下拉菜单样式 */
:deep(.tech-select-dropdown) {
    background: rgba(0, 20, 40, 0.95) !important;
    border: 1px solid rgba(0, 247, 255, 0.4);
    box-shadow: 0 0 20px rgba(0, 247, 255, 0.2);
    backdrop-filter: blur(10px);
}

:deep(.tech-select-dropdown .el-select-group__title) {
    background: rgba(0, 247, 255, 0.1);
    color: #00f7ff;
    font-size: 12px;
    font-weight: bold;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(0, 247, 255, 0.2);
}

:deep(.tech-select-dropdown .el-select-dropdown__item) {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    padding: 8px 12px;
    transition: all 0.2s;
}

:deep(.tech-select-dropdown .el-select-dropdown__item:hover) {
    background: rgba(0, 247, 255, 0.15);
    color: #00f7ff;
}

:deep(.tech-select-dropdown .el-select-dropdown__item.is-selected) {
    background: rgba(0, 247, 255, 0.2);
    color: #00f7ff;
    font-weight: bold;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 8px;
}

.option-category {
    color: rgba(69, 208, 178, 0.6);
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(69, 208, 178, 0.1);
    border-radius: 2px;
    border: 1px solid rgba(69, 208, 178, 0.2);
}

.option-name {
    color: rgba(255, 255, 255, 0.9);
}
</style>