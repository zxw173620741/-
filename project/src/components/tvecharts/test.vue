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
                    <div class="panel-title" :title="currentRegionName">{{ currentRegionName }}</div>
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
            <div class="panel-title">农产品价格监测</div>
            
            <div class="selector-section">
                <div class="selector-label">选择农产品品种</div>
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

            <div class="content-box">
                <div v-if="loadingPrice" class="placeholder-text">
                    <span class="blinking">价格数据加载中...</span>
                </div>
                <div v-else-if="priceData.length === 0" class="placeholder-text">
                    请选择农产品查看价格数据
                </div>
                <div v-else class="price-list">
                    <div class="price-header">
                        <span class="header-province">地区</span>
                        <span class="header-price">价格</span>
                    </div>
                    <div class="price-items">
                        <div v-for="(item, index) in displayPriceData" :key="index" class="price-item">
                            <span class="province-name">{{ item.province }}</span>
                            <span class="price-value">{{ item.price }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="divider-line"></div>

            <div class="panel-title">农产品交易量监测</div>

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
                            <span class="date-text">{{ item.market || '未知市场' }}</span>
                            <span class="weather-icon">📊</span>
                        </div>
                        <div class="row-right">
                            <span class="temp-text">{{ item.volume }}吨</span>
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
import { ElMessage } from 'element-plus';
import ChinaMap from './ChinaMap.vue';
import { get7DayWeather, getAllVegetableTypes, getVegetableProvincePrice, selectVolume, selectKind } from '/src/api/requestFuntion.js';

const props = defineProps({
    cityData: { type: Array, default: () => [] }
});

const chinaMapRef = ref(null);
const currentRegionName = ref('北京');
const weatherForecast = ref([]);
const loading = ref(false);

const selectedProduct = ref('大白菜');
const productOptions = ref([]);
const priceData = ref([]);
const loadingPrice = ref(false);
const currentYear = ref(new Date().getFullYear());

const volumeData = ref([]);
const loadingVolume = ref(false);

// 城市蔬菜品类数据
const cityVegetableData = ref([]);
const loadingCityVegetable = ref(false);

// 判断是否需要显示返回按钮
const isDrillDown = computed(() => {
    return currentRegionName.value !== '北京';
});

// 省会/城市 映射表 (保持原样)
const provinceCapitalMap = {
    '北京市': { name: '北京市', code: '101010100' },
    '上海市': { name: '上海市', code: '101020100' },
    '天津市': { name: '天津市', code: '101030100' },
    '重庆市': { name: '重庆市', code: '101040100' },
    '河北省': { name: '石家庄市', code: '101090101' },
    '山西省': { name: '太原市', code: '101100101' },
    '辽宁省': { name: '沈阳市', code: '101070101' },
    '吉林省': { name: '长春市', code: '101060101' },
    '黑龙江省': { name: '哈尔滨市', code: '101050101' },
    '江苏省': { name: '南京市', code: '101190101' },
    '浙江省': { name: '杭州市', code: '101210101' },
    '安徽省': { name: '合肥市', code: '101220101' },
    '福建省': { name: '福州市', code: '101230101' },
    '江西省': { name: '南昌市', code: '101240101' },
    '山东省': { name: '济南市', code: '101120101' },
    '河南省': { name: '郑州市', code: '101180101' },
    '湖北省': { name: '武汉市', code: '101200101' },
    '湖南省': { name: '长沙市', code: '101250101' },
    '广东省': { name: '广州市', code: '101280101' },
    '广西壮族自治区': { name: '南宁市', code: '101300101' },
    '海南省': { name: '海口市', code: '101310101' },
    '四川省': { name: '成都市', code: '101270101' },
    '贵州省': { name: '贵阳市', code: '101260101' },
    '云南省': { name: '昆明市', code: '101290101' },
    '西藏自治区': { name: '拉萨市', code: '101140101' },
    '陕西省': { name: '西安市', code: '101110101' },
    '甘肃省': { name: '兰州市', code: '101160101' },
    '青海省': { name: '西宁市', code: '101150101' },
    '宁夏回族自治区': { name: '银川市', code: '101170101' },
    '新疆维吾尔自治区': { name: '乌鲁木齐市', code: '101130101' },
    '内蒙古自治区': { name: '呼和浩特市', code: '101080101' },
    '台湾省': { name: '台北市', code: '101340101' },
    '香港特别行政区': { name: '香港', code: '101320101' },
    '澳门特别行政区': { name: '澳门', code: '101330101' },
    '蚌埠市': { name: '蚌埠市', code: '101220201' }
};

const cityCodeMap = {
    '合肥市': '101220101', '蚌埠市': '101220201', '芜湖市': '101220301', '淮南市': '101220401',
    '马鞍山市': '101220501', '淮北市': '101220601', '铜陵市': '101220701', '安庆市': '101220801',
    '阜阳市': '101220901', '黄山市': '101221001', '滁州市': '101221101', '宿州市': '101221201',
    '六安市': '101221301', '亳州市': '101221401', '池州市': '101221501', '宣城市': '101221601',
    '北京市': '101010100', '上海市': '101020100', '天津市': '101030100', '重庆市': '101040100',
    '广州市': '101280101', '深圳市': '101280601', '杭州市': '101210101', '南京市': '101190101',
    '成都市': '101270101', '武汉市': '101200101', '西安市': '101110101', '苏州市': '101190401',
    '青岛市': '101120201', '郑州市': '101180101', '长沙市': '101250101', '宁波市': '101210401',
    '济南市': '101120101', '无锡市': '101190201', '佛山市': '101280800', '东莞市': '101281601',
    '福州市': '101230101', '厦门市': '101230201', '沈阳市': '101070101', '大连市': '101070201',
    '长春市': '101060101', '哈尔滨市': '101050101', '南昌市': '101240101', '昆明市': '101290101',
    '贵阳市': '101260101', '南宁市': '101300101', '兰州市': '101160101', '太原市': '101100101',
    '石家庄市': '101090101', '呼和浩特市': '101080101', '乌鲁木齐市': '101130101', '拉萨市': '101140101',
    '银川市': '101170101', '西宁市': '101150101', '海口市': '101310101',
};

const weatherIconMap = {
    '晴': '☀️', '多云': '⛅', '阴': '☁️', '阵雨': '🌦️',
    '雷阵雨': '⛈️', '小雨': '🌧️', '中雨': '🌧️', '大雨': '🌧️',
    '暴雨': '🌧️', '雪': '❄️', '雾': '🌫️', '霾': '🌫️'
};

const getWeatherIcon = (text) => weatherIconMap[text] || '🌤️';
const formatDay = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

const displayPriceData = computed(() => {
    return priceData.value.slice(0, 8).map(item => ({
        province: item.provinceName || item.province || item.name || '未知',
        price: item.price ? `${item.price.toFixed(2)}元/斤` : '暂无数据'
    }));
});

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

const fetchPriceData = async (productName) => {
    loadingPrice.value = true;
    try {
        const response = await getVegetableProvincePrice(productName, currentYear.value);
        if (response.data && response.data.data) {
            priceData.value = response.data.data;
        } else if (Array.isArray(response.data)) {
            priceData.value = response.data;
        } else {
            priceData.value = [];
        }
    } catch (error) {
        console.error('获取价格数据失败:', error);
        priceData.value = [];
    } finally {
        loadingPrice.value = false;
    }
};

const handleProductChange = (productName) => {
    if (productName) {
        fetchPriceData(productName);
        fetchVolumeData(productName);
    }
};

const fetchVolumeData = async (productName) => {
    loadingVolume.value = true;
    try {
        const response = await selectVolume({ varietyname: productName }, '/user/selectVolume');
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

// --- 核心逻辑 ---
const handleMapChange = async (regionName) => {
    if (regionName === '北京') {
        resetToDefault();
        return;
    }
    let targetCode = '';
    let displayName = regionName;

    if (provinceCapitalMap[regionName]) {
        targetCode = provinceCapitalMap[regionName].code;
        displayName = provinceCapitalMap[regionName].name;
    } else if (cityCodeMap[regionName]) {
        targetCode = cityCodeMap[regionName];
    }

    if (targetCode) {
        // 先设置loading状态清空旧数据
        loading.value = true;
        currentRegionName.value = displayName;
        await fetchWeather(targetCode);
    }
};

const handleBackToChina = async () => {
    await chinaMapRef.value?.backToChina();
};

const resetToDefault = () => {
    loading.value = true;
    currentRegionName.value = '北京';
    fetchWeather('101010100');
};

const fetchWeather = async (code) => {
    // 注意：这里移除了 loading.value = true，因为上面调用前已经设置了，
    // 或者是为了避免闪烁，可以在这里加，但要保证逻辑连贯
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
    /* 增加一点宽度以容纳数据 */
    max-width: 300px;
    height: 85%;
    /* 保持高度 */
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
    /* 防止头部被压缩 */
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
    border: 1px solid #00f7ff;
    background: rgba(0, 20, 40, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    pointer-events: auto;
    /* 确保可点击 */
}

.mini-back-btn:hover {
    background: #00f7ff;
    box-shadow: 0 0 10px #00f7ff;
}

.mini-back-btn:hover .arrow-icon {
    color: #000;
}

.arrow-icon {
    font-size: 12px;
    color: #00f7ff;
    padding-right: 2px;
    /* 视觉居中修正 */
}

.divider-line {
    width: 100%;
    height: 1px;
    background: repeating-linear-gradient(90deg, rgba(0, 247, 255, 0.3) 0, rgba(0, 247, 255, 0.3) 4px, transparent 4px, transparent 8px);
    margin: 5px 0;
    flex-shrink: 0;
}

/* ==================== 
   4. 天气列表样式 (核心修改：Flex平分)
   ==================== */
.weather-monitor {
    flex: 1;
    /* 占据剩余所有空间 */
    overflow: hidden;
    /* 禁止出现滚动条，强制在一屏内显示 */
    display: flex;
    flex-direction: column;
    padding-top: 5px;
    min-height: 0;
    /* Firefox Flex bug fix */
}

.weather-list {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    /* 关键：不需要 justify-content: space-between，让子元素flex:1自动平分 */
}

.weather-row {
    flex: 1;
    /* 核心修改：每一行都平分剩余空间，高度完全一致 */
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
    width: 42px;
    /* 固定宽度对齐 */
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    /* 与列表保持间距 */
    flex-shrink: 0;
}

.tick {
    width: 8px;
    height: 1px;
    background: #00f7ff;
}

.content-box {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(0, 247, 255, 0.1);
    background: rgba(0, 247, 255, 0.02);
    margin-top: 10px;
    width: 100%;
}

.placeholder-text {
    color: rgba(0, 247, 255, 0.5);
    font-size: 12px;
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
    background-image: linear-gradient(rgba(0, 247, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 247, 255, 0.05) 1px, transparent 1px);
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
    border: 1px dashed rgba(0, 247, 255, 0.1);
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

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

@keyframes rotate {
    from {
        transform: translate(-50%, -50%) rotate(0deg);
    }

    to {
        transform: translate(-50%, -50%) rotate(360deg);
    }
}

@keyframes rotate-reverse {
    from {
        transform: translate(-50%, -50%) rotate(360deg);
    }

    to {
        transform: translate(-50%, -50%) rotate(0deg);
    }
}

@keyframes scan {
    0% {
        top: -100%;
        opacity: 0;
    }

    50% {
        opacity: 1;
    }

    100% {
        top: 100%;
        opacity: 0;
    }
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
    color: rgba(0, 247, 255, 0.6);
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(0, 247, 255, 0.1);
    border-radius: 2px;
    border: 1px solid rgba(0, 247, 255, 0.2);
}

.option-name {
    color: rgba(255, 255, 255, 0.9);
}

/* ==================== 
   7. 价格列表样式
   ==================== */
.price-list {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.price-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background: rgba(0, 247, 255, 0.1);
    border-bottom: 1px solid rgba(0, 247, 255, 0.2);
    font-size: 11px;
    color: #00f7ff;
    font-weight: bold;
    letter-spacing: 1px;
}

.price-items {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.price-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    transition: all 0.2s;
}

.price-item:hover {
    background: rgba(0, 247, 255, 0.08);
    border-bottom-color: rgba(0, 247, 255, 0.3);
}

.province-name {
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
}

.price-value {
    color: #00f7ff;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 13px;
}

.price-items::-webkit-scrollbar {
    width: 4px;
}

.price-items::-webkit-scrollbar-track {
    background: rgba(0, 247, 255, 0.05);
}

.price-items::-webkit-scrollbar-thumb {
    background: rgba(0, 247, 255, 0.3);
    border-radius: 2px;
}

.price-items::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 247, 255, 0.5);
}
</style>