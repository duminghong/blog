---
layout: doc
layoutClass: doc-layout
sidebar: false
---
# 学习笔记
> 记录学习过程中的技术要点与实践经验，持续更新中...

<ul>
    <li v-for="list in sidebar[0].items" :key="list.link">
    <a :href="list.link">{{ list.text }}</a>
    </li>
</ul>

<script setup>
import { useSidebar } from 'vitepress/theme'

const { sidebar,sidebarGroups } = useSidebar()
</script>
