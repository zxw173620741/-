// 导入创建路由对象需要使用的函数
import { createRouter, createWebHashHistory } from "vue-router";

//创建一个路由对象
const router = createRouter({
  //history属性用于记录路由的历史
  history: createWebHashHistory(),
  // 用于定义多个不同的路径和组件之间的对应关系
  routes: [
    {
      path: "/",
      component: () => import("/src/pages/user.vue"),
    },
    {
      path: "/user",
      component: () => import("/src/pages/user.vue"),
    },
    {
      path: "/jobber",
      component: () => import("/src/pages/jobber.vue"),
    },
    {
      path: "/market",
      component: () => import("/src/pages/market.vue"),
    },
    {
      path: "/ai",
      component: () => import("/src/pages/ai.vue"),
    },
    {
      path: "/SunriseChart",
      component: () => import("/src/pages/SunriseChart.vue"),
    },
    {
      path: "/dashboard",
      component: () => import("/src/pages/Dashboard.vue"),
      meta: { hideAside: true }
    },
  ],
});
//向外暴露router
export default router;
