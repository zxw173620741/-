import { defineStore } from 'pinia'

//定义数据并且对外暴露
// store就是定义共享状态的包装对象
// 内部包含四个属性： id 唯一标识 state 完整类型推理，推荐使用箭头函数 存放的数据 getters 类似属性计算，存储放对数据
// 操作的方法 actions 存储数据的复杂业务逻辑方法
// 理解： store类似Java中的实体类， id就是类名， state 就是装数据值的属性 getters就是get方法，actions就是对数据操作的其他方法
export const definedPerson = defineStore("jobberPinia",
    {
        //        id: 'jobberPinia', //必须唯一
        state: () => { // state中用于定义数据
            return {//状态，也就是响应式数据
                province: '安徽省',
                vegetable: '大葱'
            }
        }
    }
)

export const userVegetable = defineStore("userPinia",
    {
        state: () => {
            return { vegetable: '大葱' }
        }
    }
)

export const mapCity = defineStore("mapCityPinia",
    {
        //当前选择的城市省份农作物
        state: () => {
            return {
                currentCity: '北京',
                currentRegionName: '北京',
                currentProduct: '大白菜'
            }
        },
        actions: {
            setCurrentCity(city) {
                this.currentCity = city
            },
            setCurrentRegionName(regionName) {
                this.currentRegionName = regionName
            },
            setCurrentProduct(product) {
                this.currentProduct = product
            },
            resetCity() {
                this.currentCity = '北京'
                this.currentRegionName = '北京'
            }
        }
    }
)