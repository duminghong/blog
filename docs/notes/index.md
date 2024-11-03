---
layout: doc
sidebar: false
---
# 学习笔记

<ul>
    <li v-for="list in sidebar[0].items" :key="list.link">
    <a :href="list.link">{{ list.text }}</a>
    </li>
</ul>

<script setup>
import { useSidebar } from 'vitepress/theme'

const { sidebar,sidebarGroups } = useSidebar()
</script>
