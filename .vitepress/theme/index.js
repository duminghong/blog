import DefaultTheme from 'vitepress/theme'
import { useData } from "vitepress";
import { h, watch } from "vue";
import './styles/custom.css'

import Layout from "./Layout.vue";
import Features from "./components/Features.vue";


/**
 * 根据给定的值更新页面样式
 * 此函数通过添加或移除样式来改变页面的视觉效果
 * @param {boolean} value - 一个布尔值，用于决定是否应用特定样式
 */
let homeStyle = undefined;
function updateHomeStyle(value) {

    if (value) {
        if (homeStyle) return
        homeStyle = document.createElement('style')
        homeStyle.innerHTML = `
            :root {
              animation: rainbow 12s linear infinite;
            }`
        document.body.appendChild(homeStyle)
    } else {
        if (!homeStyle) return

        homeStyle.remove()
        homeStyle = undefined
    }
}

export default {
    extends: DefaultTheme,
    Layout: ()=>{
        const props = {};
        //noinspection all
        const { frontmatter } = useData();
        /* 添加自定义class */
        if (frontmatter.value?.layoutClass) {
            props.class = frontmatter.value.layoutClass;
        }
        return h(Layout, props, {});
    },
    enhanceApp({app, router}){
        // 注册自定义全局组件
        app.component('Features', Features)

        // 监听路由的相对路径变化
        if (typeof window !== 'undefined') {
            watch(
                () => router.route.data.relativePath,
                () => updateHomeStyle(location.pathname === '/'),
                {immediate: true},
            )
        }
    }
}