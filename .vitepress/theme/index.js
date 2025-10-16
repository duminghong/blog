import DefaultTheme from 'vitepress/theme'
import { useData } from "vitepress";
import { h, watch } from "vue";

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import Layout from "./Layout.vue";
import Features from "./components/Features.vue";
import CodeRunTask from "./components/CodeRunTask.vue";

import './styles/custom.css'
import './styles/mermaid-pan-zoom.css'
import 'virtual:uno.css'

import { setupMermaidPanZoom, clearProcessedMermaidIds } from './scripts/mermaid-pan-zoom.js'
import { setupCopyWithWatermark } from './scripts/copy-with-watermark.js'

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
  Layout: () => {
    const props = {};
    //noinspection all
    const { frontmatter } = useData();
    /* 添加自定义class */
    if (frontmatter.value?.layoutClass) {
      props.class = frontmatter.value.layoutClass;
    }
    return h(Layout, props, {});
  },
  enhanceApp({ app, router }) {
    app.use(ElementPlus)
    // 注册自定义全局组件
    app.component('Features', Features)
    app.component('CodeRunTask', CodeRunTask)

    // 监听路由的相对路径变化
    if (typeof window !== 'undefined') {
      watch(
        () => router.route.data.relativePath,
        (newPath, oldPath) => {
          updateHomeStyle(newPath === '/');

          // 当路由变化时，清除已处理的 Mermaid ID
          clearProcessedMermaidIds();

          // 延迟执行，确保页面内容已加载
          setTimeout(() => {
            setupMermaidPanZoom();
          }, 300);
        },
        { immediate: true },
      )

      // 在页面加载完成后初始化 Mermaid 缩放和平移功能
      window.addEventListener('load', () => {
        setupMermaidPanZoom();
      });

      // 在页面内容更新时（如动态加载内容）重新初始化
      const observer = new MutationObserver((mutations) => {
        let shouldSetup = false;
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length > 0) {
            shouldSetup = true;
          }
        });
        if (shouldSetup) {
          setupMermaidPanZoom();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // 初始化全局复制事件拦截器，添加水印
      setupCopyWithWatermark();
    }
  }
}