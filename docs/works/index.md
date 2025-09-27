---
layout: doc
layoutClass: doc-layout
sidebar: false
---
# 工作记录

> 一些工作中遇到的有意思的需求或者注意点，记录一下，持续更新中...

<ul>
    <li v-for="list in sidebar[0].items" :key="list.link">
    <a :href="list.link">{{ list.text }}</a>
    </li>
</ul>

<script setup>
import { useSidebar } from 'vitepress/theme'

const { sidebar,sidebarGroups } = useSidebar()
</script>
