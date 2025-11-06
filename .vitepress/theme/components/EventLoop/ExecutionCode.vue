<script setup>
import { ref, computed, nextTick } from 'vue';
import { decodeBase64, decodeBase64ToJson } from '../../utils/index.js';
import { Colors } from './config.js';

const props = defineProps({
  // 高亮代码Base64字符串
  data: {
    type: String,
    default: ''
  },
  // 是否为全屏
  isFullscreen: {
    type: Boolean,
    default: false
  },
  // 是否为事件循环模拟
  isSimulator: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['setCurrentRunColor']);

// 解码Base64高亮代码
const codeHtml = computed(() => {
  return decodeBase64(props.data) || '';
});

// 代码内容引用
const codeContentRef = ref(null);
// 代码滚动引用
const scrollbarRef = ref(null);

// 设置当前运行代码背景色
const setCurrentRunColor = (task, isScroll = false) => {
  const lineElements = codeContentRef.value.querySelectorAll('.line-number');
  const lineCodeElements = codeContentRef.value.querySelectorAll('.line');
  // 移除其他任务的背景色
  lineElements.forEach((line) => {
    line.classList.remove('current-run');
  });
  lineCodeElements.forEach((line) => {
    line.classList.remove('current-run');
  });
  // 检查任务和代码内容是否存在
  if (!task || !task.type || !codeContentRef.value) {
    return;
  }

  // 检查是否有代码行号
  if (!task.codeNumbers || !Array.isArray(task.codeNumbers)) {
    return;
  }

  // 设置CSS变量，确保style对象存在
  if (Colors[task.type] && Colors[task.type].bg && codeContentRef.value.style) {
    codeContentRef.value.style.setProperty(
      '--current-code-run-line-color',
      Colors[task.type].border
    );
    codeContentRef.value.style.setProperty(
      '--current-code-run-line-number-color',
      Colors[task.type].text
    );
  }
  // 添加当前任务的背景色
  task.codeNumbers.forEach((num) => {
    if (num > 0 && num <= lineElements.length) {
      lineElements[num - 1].classList.add('current-run');
      lineCodeElements[num - 1].classList.add('current-run');
    }
  });

  // 计算当前执行的代码行的偏移量
  const firstCodeNumber = task.codeNumbers[0];
  const currentLine = lineElements[firstCodeNumber - 1];
  if (currentLine) {
    nextTick(() => {
      // 滚动到当前行
      setScrollTop(currentLine.offsetTop - 30);
    });
  }

  // 代码区显示到当前视口
  isScroll &&
    codeContentRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
};

// 设置滚动条位置
const setScrollTop = (top) => {
  if (scrollbarRef.value) {
    nextTick(() => {
      scrollbarRef.value.setScrollTop(top);
    });
  }
};

// 暴露方法给父组件
defineExpose({
  setCurrentRunColor,
  setScrollTop
});
</script>

<template>
  <div class="execution-code" :class="{ 'is-fullscreen': isFullscreen }">
    <el-scrollbar ref="scrollbarRef" :height="isSimulator ? '400px' : 'auto'">
      <div v-html="codeHtml" ref="codeContentRef"></div>
    </el-scrollbar>
  </div>
</template>

<style lang="less" scoped>
@border-color: #e1e4e8;
.execution-code {
  background-color: var(--vp-code-block-bg);

  // 重置样式
  :deep(div[class*='language-']) {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    border-radius: 0 !important;
  }

  // 全屏状态
  &.is-fullscreen {
    flex: 1;
    min-height: 0;
    min-width: 0;
    height: auto;
    border-right: 1px solid @border-color;
  }
}

:deep(.language-javascript) {
  .line {
    display: inline-block;
    width: 100%;

    &.current-run {
      background-color: var(--current-code-run-line-color);
    }
  }

  .line-number {
    display: inline-block;
    width: 100%;

    &.current-run {
      color: #fff;
      background-color: var(--current-code-run-line-number-color);
    }
  }
}
</style>
