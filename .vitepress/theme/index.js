/*
 * @Author: duminghong i@duminghong.com
 * @Date: 2024-10-30 11:26:17
 * @LastEditors: duminghong i@duminghong.com
 * @LastEditTime: 2024-11-03 20:55:52
 * @Description: 
 */
import DefaultTheme from 'vitepress/theme'
import './styles/custom.css'


import Layout from "./Layout.vue";
import Features from "./components/Features.vue";

export default {
    extends: DefaultTheme,
    Layout: Layout,
    enhanceApp({app, router}){
        // 注册自定义全局组件
        app.component('Features', Features)
    }
}