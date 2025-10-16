<template>
  <Layout>
    <template #doc-after>
      <!-- 首页 Layout 使用的是 doc 所以需要判断，如果是 page 不会使用插槽 -->
      <Comment v-if="!isHome" :key="page.filePath"></Comment>
      <el-backtop :right="100" :bottom="100" />
    </template>
  </Layout>
</template>

<script setup>
import { unref, computed } from 'vue';
import { useData } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import Comment from './components/Comment.vue';

const { page } = useData();
const { Layout } = DefaultTheme;
const isHome = computed(() => unref(page)?.filePath.indexOf('index.md') != -1 || unref(page)?.filePath.indexOf('about.md') != -1);
</script>