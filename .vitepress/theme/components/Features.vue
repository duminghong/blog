<template>
  <div class="features">
    <div class="item grid-3" v-for="list in features" :key="list.title">
      <a class="link no-icon" :href="list.link">
        <article class="box">
          <div class="icon" :title="sourceData[list.source].name">{{sourceData[list.source].icon}}</div>
          <div class="title">{{list.title}}</div>
          <div class="time">{{ list.time }}</div>
          <div class="details">
            <!-- <img class="cover" :src="list.firstImage" /> -->
            <div>{{list.details}}</div>
          </div>
          <div class="link-text">
            <div class="link-text-value">点击查看 <span class="vpi-arrow-right link-text-icon"></span></div>
          </div>
        </article>
      </a>
    </div>
  </div>
</template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import { useData } from 'vitepress';
  import featuresData from '../data/features';
  
  const features = ref(featuresData);

  const sourceData = ref({
    notes: {
      icon: '📚',
      name: '笔记'
    },
    courses: {
      icon: '🚀',
      name: '教程'
    },
  })
  </script>
  
<style scoped>
.features {
  display: flex;
  flex-wrap: wrap;
  margin: -8px;
}
.features .item {
  padding: 8px;
  width: 100%;
}

@media (min-width: 640px) {
  .item.grid-2,
  .item.grid-4,
  .item.grid-6 {
    width: calc(100% / 2);
  }
}

@media (min-width: 768px) {
  .item.grid-2,
  .item.grid-4 {
    width: calc(100% / 2);
  }

  .item.grid-3,
  .item.grid-6 {
    width: calc(100% / 3);
  }
}

@media (min-width: 960px) {
  .item.grid-4 {
    width: calc(100% / 4);
  }
}
.link {
  display: block;
  border: 1px solid var(--vp-c-bg-soft);
  border-radius: 12px;
  height: 100%;
  background-color: var(--vp-c-bg-soft);
  transition: border-color 0.25s, background-color 0.25s;
  text-decoration: inherit;
  color: var(--vp-c-text-1);
}

.link:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-text-1);
}

.box {
  display: flex;
  flex-direction: column;
  padding: 24px;
  height: 100%;
}

.box > :deep(.VPImage) {
  margin-bottom: 20px;
}
.box .icon{
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    border-radius: 6px;
    background-color: var(--vp-c-default-soft);
    width: 48px;
    height: 48px;
    font-size: 24px;
    transition: background-color .25s;
}
.title {
  line-height: 24px;
  font-size: 16px;
  font-weight: 600;
}

.time{
  padding-top: 8px;
  line-height: 24px;
  font-size: 14px;
  color: var(--vp-c-text-3);
}
.details {
  display: flex;
  flex-grow: 1;
  padding-top: 8px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  /* 最多显示3行 */
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  word-break: break-all;
  white-space: normal;

}
.details .cover{
  width: 120px;
  height: 120px;
}
.link-text {
  padding-top: 8px;
}

.link-text-value {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}

.link-text-icon {
  margin-left: 6px;
}
  </style>