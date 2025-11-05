<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { TaskName, Colors } from './config.js';
import MyMardown from '../MyMardown.vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  isFullscreen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['changeCodeRunColor']);

const consoleData = computed(() => {
  return props.data.filter((item) => item.console);
});

// 执行结果内容区域引用
const resultContentRef = ref(null);

// 设置当前运行代码背景色
const setCurrentRunColor = (task, isScroll = false) => {
  emit('changeCodeRunColor', task, isScroll);
};

// 监听结果数据，如果有新数据，滚动到底部
watch(
  () => props.data,
  (newVal, oldVal) => {
    if (newVal.length > 0) {
      scrollToBottom();
    }
  }
);

// 滚动到执行结果区域底部
const scrollToBottom = () => {
  nextTick(() => {
    if (resultContentRef.value) {
      const conEle = resultContentRef.value.querySelector('.el-timeline');
      // 获取的高度
      const height = conEle.clientHeight - 200;
      resultContentRef.value.scrollTop = height;
    }
  });
};

// 鼠标移入，高亮显示当前结果
const onShowResult = (task) => {
  const taskIndex = props.data.findIndex((item) => item.id === task.id);
  if (taskIndex !== -1) {
    const conDomEle = resultContentRef.value.querySelector('.el-timeline');
    const resultDomEles = resultContentRef.value.querySelectorAll('.el-timeline-item');
    const curResult = resultDomEles[taskIndex];
    if (!curResult) return;
    // 获取相对位置，并滚动
    const top =
      curResult.offsetTop -
      resultContentRef.value.offsetTop -
      resultContentRef.value.clientHeight / 2 +
      curResult.clientHeight / 2;
    resultContentRef.value.scrollTop = top;

    // 添加类名
    conDomEle.classList.add('active');
    resultDomEles.forEach((item) => {
      item.classList.remove('active');
    });
    curResult.classList.add('active');

    // 代码高亮
    setCurrentRunColor(task);
  }
};
// 鼠标移出去掉类名
const removeResultClass = () => {
  const conDomEle = resultContentRef.value.querySelector('.el-timeline');
  const resultDomEles = resultContentRef.value.querySelectorAll('.el-timeline-item');
  conDomEle.classList.remove('active');
  resultDomEles.forEach((item) => {
    item.classList.remove('active');
  });
};

// 暴露方法给父组件
defineExpose({
  scrollToBottom
});
</script>

<template>
  <div
    class="execution-result flex1"
    :class="{ 'is-fullscreen': isFullscreen }"
    v-if="data.length > 0"
  >
    <div class="execution-result-title b">执行结果</div>
    <div class="execution-result-history flex flex-wrap gap4 p8">
      <div
        class="taskbox flex cur_p"
        v-for="task in data"
        :key="task.id"
        @mouseenter="onShowResult(task)"
        @mouseleave="removeResultClass"
      >
        <el-tooltip effect="dark" :content="task.task" raw-content placement="top">
          <el-tag
            effect="dark"
            :color="Colors[task.type].text"
            :style="{ borderColor: Colors[task.type].border }"
            disable-transitions
          >
            {{ task.taskName }}
          </el-tag>
        </el-tooltip>
      </div>
    </div>
    <div class="execution-result-box flex flex1">
      <div class="result-content flex1 flex_line">
        <div class="result-content-title">执行线</div>
        <div class="result-content-timeline flex1" ref="resultContentRef">
          <el-timeline style="max-width: 600px">
            <el-timeline-item
              v-for="task in data"
              :key="task.id"
              :timestamp="TaskName[task.type]"
              :style="{ '--current-result-color': Colors[task.type].bg }"
              placement="top"
              @mouseenter="setCurrentRunColor(task)"
            >
              <template #dot>
                <div class="result-content-dot" :style="{ color: Colors[task.type].text }"></div>
              </template>
              <div class="f13 b">{{ task.task }}</div>
              <MyMardown class="content f12" :content="task.result" />
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <!-- 控制台区域 -->
      <div class="console-section">
        <div class="console-title flex_m">输出</div>
        <el-scrollbar max-height="200px">
          <div class="console-content">
            <div
              class="console-item flex_lr_m"
              v-for="task in consoleData"
              :key="task.id"
              @mouseenter="onShowResult(task)"
              @mouseleave="removeResultClass"
            >
              <div>{{ task.console }}</div>
              <div
                class="line"
                v-if="task.codeNumbers && task.codeNumbers.length > 0"
                @click="setCurrentRunColor(task, true)"
              >
                行号:{{ task.codeNumbers.join(',') }}
              </div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
// 变量定义
@border-color: #e1e4e8;
@bg-color-light: #f6f8fa;
@text-color-primary: #24292e;
@spacing-medium: 16px;
.execution-result {
  &-title {
    height: 40px;
    line-height: 40px;
    margin-top: 0;
    padding: 0 @spacing-medium;
    font-size: 16px;
    color: @text-color-primary;
    background-color: @bg-color-light;
    border-top: 1px solid @border-color;
    border-bottom: 1px solid @border-color;
  }
  .result-content {
    min-height: 40px;
    border-right: 1px solid @border-color;
    font-size: 12px;

    &-title {
      height: 28px;
      padding: 0 @spacing-medium;
      font-size: 12px;
      background-color: #edf2fa;
      border-bottom: 1px solid #d3e3fd;
    }
    &-timeline {
      max-height: 400px;
      overflow: hidden;
      overflow-y: auto;
    }
    &-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid currentColor;
      background-color: currentColor;
      transform-origin: center;
      transition: transform 0.1s ease-in-out;
      z-index: 3;
      cursor: pointer;
      margin-left: -1px;

      &:hover {
        transform: scale(1.2);
        background-color: #fff;
      }
    }

    .content {
      :deep(p) {
        margin: 0;
        line-height: inherit;
      }
    }
  }
  // 调试数据
  .console-section {
    min-width: 200px;
    width: 30%;
    background-color: #fff;

    .console-title {
      height: 28px;
      padding: 0 @spacing-medium;
      font-size: 12px;
      background-color: #edf2fa;
      border-bottom: 1px solid #d3e3fd;
    }

    .console-content {
      min-height: 40px;
      padding: 0 @spacing-medium;
      font-size: 12px;

      .console-item {
        border-bottom: 1px solid #d3e3fd;
        cursor: zoom-in;

        .line {
          font-size: 10px;
          color: #0b57d0;
          text-decoration: underline;
          cursor: pointer;
        }

        &:hover {
          background-color: #f8f9fa;
        }

        &:last-child {
          border-bottom: 0;
        }
      }
    }
  }

  // 全屏模式
  &.is-fullscreen {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .result-content-timeline {
      max-height: 100%;
    }
  }

  // 覆盖默认样式
  :deep(.el-timeline) {
    list-style: none;
    margin: 0;
    padding: 20px;
    max-width: 100% !important;
    .el-timeline-item__dot {
      z-index: 1;
    }
    .el-timeline-item {
      margin: 0;
      cursor: pointer;
      // 激活项，添加投影
      &.active,
      &:hover {
        z-index: 2;
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 200%;
          height: 100%;
          padding-bottom: 10px;
          transform: translate(-50%, -10px);
          background-color: var(--current-result-color);
          box-sizing: content-box;
          z-index: 1;
          // 投影
          box-shadow: 0 0 10px 4px rgba(0, 0, 0, 0.1);
        }
        .el-timeline-item__tail {
          z-index: -1;
        }
        .el-timeline-item__wrapper {
          z-index: 1;
        }
      }
    }
    // 蒙版-毛玻璃
    &.active {
      position: relative;
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(2px);
        z-index: 2;
      }
    }
  }
}
</style>
