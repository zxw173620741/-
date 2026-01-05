<template>
    <div class="map-container">
        <div ref="chartRef" class="echarts-box"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef, watch } from 'vue';
import * as echarts from 'echarts';
import { mapCity } from '/src/store/store.js';

const mapCityStore = mapCity();

// --- 新增：定义向父组件发送事件 ---
const emit = defineEmits(['region-change']);


const props = defineProps({
    cityData: {
        type: Array,
        default: () => []
    }
});

// 省份映射表 (保持你原有的)
const provinceCodeMap = {
    // 直辖市
    '北京市': '110000',
    '天津市': '120000',
    '上海市': '310000',
    '重庆市': '500000',

    // 省
    '河北省': '130000',
    '山西省': '140000',
    '辽宁省': '210000',
    '吉林省': '220000',
    '黑龙江省': '230000',
    '江苏省': '320000',
    '浙江省': '330000',
    '安徽省': '340000',
    '福建省': '350000',
    '江西省': '360000',
    '山东省': '370000',
    '河南省': '410000',
    '湖北省': '420000',
    '湖南省': '430000',
    '广东省': '440000',
    '海南省': '460000',
    '四川省': '510000',
    '贵州省': '520000',
    '云南省': '530000',
    '陕西省': '610000',
    '甘肃省': '620000',
    '青海省': '630000',
    '台湾省': '710000',

    // 自治区
    '内蒙古自治区': '150000',
    '广西壮族自治区': '450000',
    '西藏自治区': '540000',
    '宁夏回族自治区': '640000',
    '新疆维吾尔自治区': '650000',

    // 特别行政区
    '香港特别行政区': '810000',
    '澳门特别行政区': '820000'
};

const chartRef = ref(null);
const chartInstance = shallowRef(null);
const currentMap = ref('china');

const loadMapData = async (mapName, adcode) => {
    chartInstance.value.showLoading({
        text: '系统数据加载中...',
        color: '#00f7ff',
        textColor: '#00f7ff',
        maskColor: 'rgba(10, 30, 60, 0.5)'
    });

    try {
        const response = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${adcode}_full.json`);
        const geoJson = await response.json();

        echarts.registerMap(mapName, geoJson);
        currentMap.value = mapName;

        chartInstance.value.hideLoading();
        setOptions(mapName);
    } catch (error) {
        console.error('地图加载失败:', error);
        chartInstance.value.hideLoading();
    }
};

const backToChina = async () => {
    await loadMapData('china', '100000');
    mapCityStore.resetCity();
    emit('region-change', '北京');
};
defineExpose({
    backToChina
});

const initChart = async () => {
    if (!chartRef.value) return;
    chartInstance.value = echarts.init(chartRef.value);

    await loadMapData('china', '100000');

    // --- 监听点击事件 ---
    chartInstance.value.on('click', (params) => {
        if (params.componentType === 'geo') {
            // 1. 如果还在全国地图，并且点击了省份
            if (currentMap.value === 'china') {
                const adcode = provinceCodeMap[params.name];
                if (adcode) {
                    // 下钻地图
                    loadMapData(params.name, adcode);
                    // 【核心修改】通知父组件：用户选择了这个省份
                    mapCityStore.setCurrentCity(params.name);
                    mapCityStore.setCurrentRegionName(params.name);
                    emit('region-change', params.name);
                }
            }
            // 2. 如果已经是省份地图，点击了具体的市 (需要 GeoJSON 有市级数据支持)
            else {
                // 尝试加载市级地图（如果有数据支持）
                // 这里我们假设市级adcode是在省级adcode基础上加上0101
                const cityAdcode = `${provinceCodeMap[currentMap.value]}0101`;
                loadMapData(params.name, cityAdcode)
                    .catch(() => {
                        // 如果加载失败，说明没有市级数据，只通知父组件
                        console.log('没有市级地图数据，仅更新天气信息');
                    })
                    .finally(() => {
                        // 无论是否加载成功，都通知父组件更新天气信息
                        mapCityStore.setCurrentCity(params.name);
                        mapCityStore.setCurrentRegionName(params.name);
                        emit('region-change', params.name);
                    });
            }
        }
    });
};

// ... setOptions, watch, handleResize, lifecycle hooks 保持不变 (可以直接复用你之前的代码) ...
// 为了节省篇幅，这里省略 setOptions 具体配置，请直接保留你之前写好的 setOptions
const setOptions = (mapName) => {
    if (!chartInstance.value) return;
    // ... 你的 setOptions 代码 ...
    // 确保把之前的 setOptions 完整代码放这里
    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderColor: '#45d0b2',
            borderWidth: 1,
            textStyle: { color: '#fff' }
        },
        geo: {
            map: mapName,
            roam: true,
            zoom: 1.2,
            label: {
                show: mapName !== 'china',
                color: '#45d0b2',
                fontSize: 10
            },
            itemStyle: {
                areaColor: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [{ offset: 0, color: 'rgba(69, 208, 178, 0.2)' }, { offset: 1, color: 'rgba(0, 20, 60, 0.8)' }]
                },
                borderColor: '#45d0b2',
                borderWidth: 1.5,
                shadowColor: 'rgba(69, 208, 178, 0.7)',
                shadowBlur: 10
            },
            emphasis: {
                label: { show: true, color: '#fff' },
                itemStyle: { areaColor: 'rgba(69, 208, 178, 0.8)' }
            }
        },
        series: [] // 省略 series 配置以节省空间，请保留原有的
    };
    chartInstance.value.setOption(option, true);
};

const handleResize = () => chartInstance.value?.resize();

onMounted(() => {
    initChart();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    chartInstance.value?.dispose();
});
</script>

<style scoped>
/* ... 保持原有样式 ... */
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
