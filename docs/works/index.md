---
layout: doc
layoutClass: doc-layout
sidebar: false
---
# 工作记录

> 一些工作中遇到的有意思的需求或者注意点，记录一下，持续更新中...

<ul>
    <li v-for="list in sidebar[0].items" :key="list.link">
      <template v-if="list.items&&list.items.length>0">
        <span>{{ list.text }}</span>
        <ul>
          <li v-for="item in list.items" :key="item.link">
            <a :href="item.link">{{ item.text }}</a>
          </li>
        </ul>
      </template>
      <a v-else :href="list.link">{{ list.text }}</a>
    </li>
</ul>

<script setup>
import { useSidebar } from 'vitepress/theme'

const { sidebar,sidebarGroups } = useSidebar()
</script>
