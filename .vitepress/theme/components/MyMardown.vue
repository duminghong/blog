<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import MarkdownIt from 'markdown-it';

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
});

// 创建markdown-it实例
const md = new MarkdownIt({
  html: true, // 允许HTML标签
  linkify: true, // 自动将URL转换为链接
  typographer: true, // 启用一些语言中立的替换 + 引号美化
  breaks: true // 转换'\n'为<br>
});

// 渲染Markdown内容
const renderedContent = computed(() => {
  if (!props.content) return '';
  return md.render(props.content);
});
</script>

<style scoped></style>
