<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';

import {
  Colors,
  EventLoopTypes,
  MainThreadConfig,
  MicrotaskQueueConfig,
  TaskName,
  TaskQueueConfig
} from './EventLoop/config.js';
import { decodeBase64, decodeBase64ToJson } from '../utils/index.js';
import ExecutionResult from './EventLoop/ExecutionResult.vue';
import ExecutionCode from './EventLoop/ExecutionCode.vue';
import MainThread from './EventLoop/MainThread.vue';

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  dataBase64: {
    type: String,
    default: ''
  },
  highlightedCodeBase64: {
    type: String,
    default: ''
  }
});

// 解码Base64数据
const data = computed(() => {
  return decodeBase64ToJson(props.dataBase64);
});

// 任务数据
const taskData = computed(() => {
  return data.value.runSteps || [];
});

// 组件根元素引用，用于全屏功能
const componentRef = ref(null);
// 全屏状态
const isFullscreen = ref(false);

// 代码内容引用
const executionCodeRef = ref(null);
// 执行结果区域引用
const executionResultRef = ref(null);
// 主线程组件引用
const mainThreadRef = ref(null);

// 执行结果数据
const resultDatas = ref([]);

// 重置提示弹窗
const dialogVisible = ref(false);
// 处理重置确认
const handleResetConfirm = () => {
  dialogVisible.value = false;
  // 调用MainThread组件的重置方法
  mainThreadRef.value?.resetEventLoop();
  nextTick(() => {
    // 开始
    mainThreadRef.value?.toggleRunPause();
  });
};

// 更新代码区滚动位置
const onChangeCodeScrollTop = (top) => {
  if (executionCodeRef.value) {
    executionCodeRef.value.setScrollTop(top);
  }
};

// 设置当前运行代码背景色
const setCurrentRunColor = (task, isScroll = false) => {
  // 通过ExecutionCode组件来设置代码高亮
  if (executionCodeRef.value) {
    executionCodeRef.value.setCurrentRunColor(task, isScroll);
  }
};

// 获取按钮文本
const getButtonText = () => {
  if (!mainThreadRef.value || !mainThreadRef.value.isRunning) {
    return '运行';
  } else if (mainThreadRef.value.isPaused) {
    return '继续';
  } else {
    return '暂停';
  }
};

// 进入全屏
const enterFullscreen = () => {
  const element = componentRef.value;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    /* Safari */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    /* IE11 */
    element.msRequestFullscreen();
  }
  isFullscreen.value = true;
};

// 退出全屏
const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE11 */
    document.msExitFullscreen();
  }
  isFullscreen.value = false;
};

// 切换全屏状态
const toggleFullscreen = () => {
  if (isFullscreen.value) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
};

// 全屏事件类型数组，用于统一添加和移除监听器
const fullscreenEventTypes = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange'
];

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

onMounted(() => {
  // 添加全屏状态变化监听器
  fullscreenEventTypes.forEach((eventType) => {
    document.addEventListener(eventType, handleFullscreenChange);
  });
});

onUnmounted(() => {
  // 移除全屏状态变化监听器
  fullscreenEventTypes.forEach((eventType) => {
    document.removeEventListener(eventType, handleFullscreenChange);
  });
});
</script>
<template>
  <ClientOnly>
    <div class="codeRunTask" ref="componentRef">
      <div class="codeRunTask-header flex_lr_m">
        <div>{{ title || '事件循环模拟' }}</div>
        <div class="flex gap10">
          <button
            class="codeRunTask-header-btn-run"
            @click="mainThreadRef?.toggleRunPause()"
            :disabled="false"
          >
            {{ getButtonText() || '运行' }}
          </button>
          <button
            class="codeRunTask-header-btn-step-back"
            @click="mainThreadRef?.stepBack()"
            :disabled="!mainThreadRef?.canStepBack"
          >
            上一步
          </button>
          <button
            class="codeRunTask-header-btn-step"
            @click="mainThreadRef?.stepNext()"
            :disabled="!mainThreadRef?.canStepNext"
          >
            下一步
          </button>
          <button class="codeRunTask-header-btn-reset" @click="mainThreadRef?.resetEventLoop()">
            重置
          </button>
          <button class="codeRunTask-header-btn-fullscreen" @click="toggleFullscreen()">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </button>
        </div>
      </div>
      <!-- 功能区 -->
      <div class="codeRunTask-container">
        <!-- 代码区 -->
        <ExecutionCode
          ref="executionCodeRef"
          :data="highlightedCodeBase64"
          :is-fullscreen="isFullscreen"
        />
        <div class="fullscreen-container flex1">
          <!-- 事件循环可视化 -->
          <MainThread
            ref="mainThreadRef"
            :task-data="taskData"
            :is-fullscreen="isFullscreen"
            v-model:result="resultDatas"
            @changeCodeRunColor="setCurrentRunColor"
            @changeCodeScrollTop="onChangeCodeScrollTop"
            @resetConfirm="dialogVisible = true"
          />
          <!-- 执行结果区域 -->
          <ExecutionResult
            ref="executionResultRef"
            :data="resultDatas"
            :is-fullscreen="isFullscreen"
            @changeCodeRunColor="setCurrentRunColor"
          />
        </div>
      </div>

      <!-- 重置提示 -->
      <el-dialog v-model="dialogVisible" width="400px" title="确认开始吗？">
        <span>运行已结束，重新开始请先重置。</span>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleResetConfirm"> 重置并开始 </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </ClientOnly>
</template>
<style lang="less" scoped>
// 变量定义
@border-color: #e1e4e8;
@bg-color-light: #f6f8fa;
@bg-color-hover: #f3f4f6;
@text-color-primary: #24292e;
@success-color: #2ea44f;
@success-color-hover: #2c974b;
@success-color-disabled: #94d3a2;
@border-radius: 6px;
@border-radius-small: 4px;
@spacing-small: 8px;
@spacing-medium: 16px;

// 主容器
.codeRunTask {
  margin: 16px 0;
  border: 1px solid @border-color;
  border-radius: @border-radius;
  overflow: hidden;

  // 滚动条样式
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
    cursor: pointer;
  }

  ::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.4);
  }

  // 标题区域
  &-header {
    padding: @spacing-small @spacing-medium;
    background-color: @bg-color-light;
    border-bottom: 1px solid @border-color;
    font-weight: 600;
    font-size: 14px;

    // 运行和重置按钮
    &-btn-run,
    &-btn-reset,
    &-btn-step,
    &-btn-step-back,
    &-btn-fullscreen {
      padding: 4px 12px;
      border-radius: @border-radius-small;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    &-btn-run {
      background-color: @success-color;
      color: white;
      border: 1px solid rgba(27, 31, 35, 0.15);

      &:disabled {
        background-color: @success-color-disabled;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background-color: @success-color-hover;
      }
    }

    &-btn-reset {
      background-color: @bg-color-light;
      color: @text-color-primary;
      border: 1px solid rgba(27, 31, 35, 0.15);

      &:hover {
        background-color: @bg-color-hover;
      }
    }

    &-btn-step {
      background-color: #8250df;
      color: white;
      border: 1px solid rgba(27, 31, 35, 0.15);

      &:disabled {
        background-color: #cbb8f7;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background-color: #6b44bc;
      }
    }

    &-btn-step-back {
      background-color: #cf222e;
      color: white;
      border: 1px solid rgba(27, 31, 35, 0.15);

      &:disabled {
        background-color: #fdaeb7;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background-color: #a40e26;
      }
    }

    &-btn-fullscreen {
      background-color: #0d7477;
      color: white;
      border: 1px solid rgba(27, 31, 35, 0.15);

      &:hover {
        background-color: #0a5d60;
      }
    }
  }

  // 全屏状态样式
  &:fullscreen {
    background-color: #f8f9fa;
    box-sizing: border-box;
    height: 100vh;
    border-radius: 0;
    display: flex;
    flex-direction: column;

    .codeRunTask {
      &-container {
        flex: 1;
        min-height: 0;
        min-width: 0;
        display: flex;
      }
    }
  }
}
</style>
