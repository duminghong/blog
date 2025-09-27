---
layout: doc
layoutClass: doc-layout
sidebar: false
---
# 教程分享
> 分享一些学习过程中的经验与技巧，持续更新中...

<ul>
    <li v-for="list in sidebar[0].items" :key="list.link">
    <a :href="list.link">{{ list.text }}</a>
    </li>
</ul>

<script setup>
import { useSidebar } from 'vitepress/theme'

const { sidebar,sidebarGroups } = useSidebar()
</script>
