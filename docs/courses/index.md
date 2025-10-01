---
layout: doc
layoutClass: doc-layout
sidebar: false
---
# 教程分享
> 分享一些学习过程中的经验与技巧，持续更新中...

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
