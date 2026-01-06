<template>
  <div class="warning-module">
    <div class="module-title">
      <span class="icon">⚠️</span> 预警提示
    </div>

    <div class="alert-list">
      <div 
        v-for="(item, index) in alertData" 
        :key="index" 
        class="alert-item"
        :class="item.level"
      >
        <div class="alert-icon-wrapper">
          <div class="alert-icon">
            🔔
          </div>
        </div>

        <div class="alert-content">
          <div class="alert-text">{{ item.message }}</div>
          <div class="alert-time">{{ item.time }}</div>
        </div>
        
        <div class="bg-glow"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 模拟数据
const alertData = ref([
  { level: 'high', message: '检测到大白菜价格异常波动，涨幅超过15%', time: '10:23:45' },
  { level: 'medium', message: '辽宁省局部地区出现低温霜冻预警', time: '09:15:10' },
  { level: 'low', message: '部分农产品交易量数据未更新', time: '08:05:00' },
]);
</script>

<style scoped>
/* 容器基础样式 */
.warning-module {
  width: 100%;
  height: 100%; /* 根据父容器自适应 */
  background: rgba(0, 20, 40, 0.5); /* 深色背景 */
  padding: 10px;
  box-sizing: border-box;
  color: #fff;
}

.module-title {
  font-size: 18px;
  font-weight: bold;
  color: #00f0ff; /* 青色科技感标题 */
  margin-bottom: 15px;
  border-left: 4px solid #00f0ff;
  padding-left: 10px;
}

/* 单条预警卡片样式 */
.alert-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  position: relative;
  background: linear-gradient(90deg, rgba(0, 255, 150, 0.1) 0%, rgba(0,0,0,0) 100%);
  border: 1px solid rgba(0, 255, 150, 0.3);
  overflow: hidden; /* 防止光效溢出 */
}

/* 不同等级的颜色控制 (动态类名) */
.alert-item.high {
  border-left: 4px solid #ff4d4f; /* 红色 */
  background: linear-gradient(90deg, rgba(255, 77, 79, 0.15) 0%, rgba(0,0,0,0) 100%);
}
.alert-item.high .alert-icon { color: #ff4d4f; border-color: #ff4d4f; }

.alert-item.medium {
  border-left: 4px solid #faad14; /* 橙色 */
  background: linear-gradient(90deg, rgba(250, 173, 20, 0.15) 0%, rgba(0,0,0,0) 100%);
}
.alert-item.medium .alert-icon { color: #faad14; border-color: #faad14; }

.alert-item.low {
  border-left: 4px solid #00f0ff; /* 青色 */
}

/* 图标样式 */
.alert-icon-wrapper {
  margin-right: 15px;
}
.alert-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #00f0ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: rgba(0,0,0,0.3);
  box-shadow: 0 0 10px inset; /* 内发光效果 */
}

/* 文本样式 */
.alert-content {
  flex: 1;
}
.alert-text {
  font-size: 14px;
  margin-bottom: 4px;
  /* 文本超出省略 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; 
  overflow: hidden;
}
.alert-time {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

/* 简单的进入动画 */
.alert-item {
  animation: slideIn 0.5s ease-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>