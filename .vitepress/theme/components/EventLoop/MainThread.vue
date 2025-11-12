<script setup>
import { ref, reactive, computed, nextTick } from 'vue';
import { useMotion } from '@vueuse/motion';
import {
  Colors,
  EventLoopTypes,
  MainThreadConfig,
  MicrotaskQueueConfig,
  RenderingQueueConfig,
  TaskQueueConfig,
  TaskName
} from './config.js';

import Task from './Task.vue';

const props = defineProps({
  taskData: {
    type: Array,
    required: true
  },
  isFullscreen: {
    type: Boolean,
    default: false
  },
  result: {
    type: Array,
    default: () => []
  }
});

// 定义emits
const emit = defineEmits([
  'changeCodeRunColor',
  'update:result',
  'resetConfirm',
  'changeCodeScrollTop'
]);

// 获取所有任务类型
const runTypes = computed(() => {
  const list = props.taskData.map((item) => item.type);
  return [...new Set(list)];
});
// 运行任务列表
const runTasks = computed(() => {
  return props.taskData.map((task) => ({
    ...task,
    deleteCallStack: task.deleteCallStack || [task.id]
  }));
});

// 执行历史记录
const executionHistory = ref([]);
// 当前任务索引
const currentTaskIndex = ref(0);

// 元素引用，用于动画效果
const moveStackTargetRef = ref(null);
const mainThreadRef = ref(null);

// 设置源元素引用
const sourceElements = reactive({});
const setSourceRef = (el, id) => {
  if (el) sourceElements[id] = el;
};

// 任务结果区域引用
const taskResultRef = ref(null);

// 移动元素到目标位置
const moveToTarget = async (source, target, isOneself = false) => {
  if (!source || !target) return;

  const componentDomEl = mainThreadRef.value || document.body;
  const sourceDomEl = source?.$el || source?.el || source;
  const targetDomEl = target?.$el || target?.el || target;

  const componentRect = componentDomEl.getBoundingClientRect();
  const sourceRect = sourceDomEl.querySelector('.el-tag').getBoundingClientRect();
  // 获取目标位置
  if (!isOneself) {
    targetDomEl.style.width = `${sourceRect.width}px`;
    targetDomEl.style.height = `${sourceRect.height}px`;
  }
  const targetRect = targetDomEl.getBoundingClientRect();
  // 创建克隆元素用于动画，如果要移动自身，就克隆自己，否则克隆源元素
  const clone = isOneself ? targetDomEl.cloneNode(true) : sourceDomEl.cloneNode(true);

  const cloneWidth = isOneself ? targetRect.width : sourceRect.width;
  const cloneHeight = isOneself ? targetRect.height : sourceRect.height;

  // 设置克隆元素的样式
  clone.style.cssText = `
    position: absolute;
    left: ${sourceRect.left - componentRect.left + (isOneself ? sourceRect.width - 9 : 0)}px;
    top: ${sourceRect.top - componentRect.top - (isOneself ? sourceRect.height - 9 : 0)}px;
    width: ${cloneWidth}px;
    height: ${cloneHeight}px;
    z-index: 9999;
    pointer-events: none;
  `;

  componentDomEl.appendChild(clone);

  // 获取下一个元素
  const nextSource = sourceDomEl.nextElementSibling;
  nextSource && (nextSource.style.marginLeft = `${sourceRect.width + 4}px`);

  // 执行移动动画
  const { apply } = useMotion(clone, {
    initial: {
      x: 0,
      y: 0,
      opacity: 1
    },
    move: {
      // 计算目标位置
      x: targetRect.left - sourceRect.left - (isOneself ? sourceRect.width - 9 : 0),
      y: targetRect.top - sourceRect.top + (isOneself ? sourceRect.height - 9 : 0),
      opacity: 0.8,
      transition: {
        duration: 200,
        ease: 'easeInOut'
      }
    }
  });

  // 等待DOM更新
  await nextTick();

  // 下一个任务位置移动
  nextSource && nextSource.classList.add('move');
  nextSource && (nextSource.style.marginLeft = '0');

  // 获取目标位置
  if (targetDomEl) {
    // 应用移动动画
    await apply('move');
  }
  nextSource && nextSource.classList.remove('move');

  // 清理克隆元素
  if (clone.parentNode) {
    componentDomEl.removeChild(clone);
  }
};

// 移动任务到调用栈
const moveToCallStack = async (task) => {
  // 获取源元素
  const sourceEl = sourceElements[task.type + task.id];
  if (!sourceEl) return;
  await moveToTarget(sourceEl, moveStackTargetRef.value);
};

// 从调用栈移动任务到任务队列
const moveToTaskQueue = async (task, createTask) => {
  await nextTick();
  // 获取源元素
  const sourceEl = sourceElements['callStack' + task.id];
  // 目标元素 - 任务队列
  const targetEl = sourceElements[createTask.type + createTask.id];
  if (!sourceEl || !targetEl) return;
  targetEl.style.opacity = 0;
  await moveToTarget(sourceEl, targetEl, true);
  targetEl.style.opacity = 1;
};

// 任务结果显示
const showTaskResult = (content, type, time = 1000) => {
  if (!taskResultRef.value) return;
  // 创建结果元素
  const resultDom = document.createElement('div');
  resultDom.classList.add('result');
  resultDom.textContent = content;
  resultDom.style.color = Colors[type].text;
  // 追加到结果区域
  taskResultRef.value.appendChild(resultDom);
  setTimeout(() => {
    taskResultRef.value.removeChild(resultDom);
  }, time);
};

// 事件循环模拟
// 主线程 - 负责执行JavaScript代码的线程
const mainThread = reactive({
  callStack: [], // 调用栈 - 存储函数执行上下文
  isRunning: false, // 事件循环运行状态
  isPaused: false, // 事件循环暂停状态
  isStepMode: false, // 是否为单步执行模式
  currentTask: null // 当前正在执行的任务
});

// 同步任务队列 - 按代码顺序存储同步任务
const synchronousTaskQueue = reactive({
  tasks: []
});

// 微任务队列 - 在每个宏任务后立即执行
const microtaskQueue = reactive({
  tasks: []
});

// 宏任务队列 - 不同类型的队列
const macrotaskQueue = reactive({});
Object.keys(TaskQueueConfig).forEach((key) => {
  if (runTypes.value.includes(key)) {
    macrotaskQueue[key] = {
      priority: TaskQueueConfig[key].priority,
      tasks: []
    };
  }
});

// 渲染队列 - 存储渲染任务，清空微任务队列后，如果需要进行渲染，进入渲染阶段
const renderQueue = reactive({
  tasks: []
});

// 事件循环控制方法
// 任务类型与处理器的映射
const taskHandlers = {
  [EventLoopTypes.SYNCHRONOUS]: (task) => {
    synchronousTaskQueue.tasks.push(task);
    return true;
  },
  [EventLoopTypes.MICROTASK]: (task) => {
    microtaskQueue.tasks.push(task);
    return true;
  },
  [EventLoopTypes.RENDERING]: (task) => {
    renderQueue.tasks.push(task);
    return true;
  }
};
// 添加任务到队列
const addTask = (task, isCreate = false) => {
  // 检查任务是否存在
  if (!task || !task.type) {
    console.error('无效的任务:', task);
    return false;
  }

  // 设置当前运行代码的背景色
  !isCreate && changeCodeRunColor(task);

  // 如果是同步任务、微任务、渲染任务，使用对应的处理器
  if (taskHandlers[task.type]) {
    return taskHandlers[task.type](task);
  }

  // 其他宏任务 - 推入对应队列
  if (macrotaskQueue[task.type]) {
    macrotaskQueue[task.type].tasks.push(task);
    return true;
  }

  return false;
};

// 执行任务
const runTask = async (task) => {
  // 检查任务是否存在
  if (!task || !task.type) {
    console.error('任务数据无效:', task);
    return;
  }

  // 设置当前运行代码的背景色
  changeCodeRunColor(task);

  task.status = 'running';
  mainThread.currentTask = task;

  // 存储结果
  emit('update:result', [...props.result, task]);

  // 是否创建任务
  if (task.createTask && task.createTask.type) {
    const { taskId, type } = task.createTask;
    const createTask = runTasks.value.find((item) => item.id === taskId);
    if (createTask) {
      // 显示任务结果
      showTaskResult(
        `创建${TaskName[createTask.type]} ${createTask.taskName}`,
        createTask.type,
        createTask.runTime
      );
      addTask(createTask, true);
      // 移动到任务队列
      await moveToTaskQueue(task, createTask);
      return;
    }
  }
};

// 从队列获取下一个宏任务
const getNextMacrotask = () => {
  // 按优先级执行宏任务
  const queues = Object.keys(macrotaskQueue)
    .filter((key) => macrotaskQueue[key].tasks.length > 0)
    .sort((a, b) => TaskQueueConfig[a].priority - TaskQueueConfig[b].priority);
  if (queues.length > 0) {
    moveToCallStack(macrotaskQueue[queues[0]].tasks[0]);
    return macrotaskQueue[queues[0]].tasks.shift();
  }
  return null;
};

// 初始化运行
const initRun = (time = 1000) => {
  if (currentTaskIndex.value == 0) {
    // 添加初始化结果
    const initTask = {
      id: 'init',
      type: EventLoopTypes.SYNCHRONOUS,
      codeNumbers: [],
      task: '初始化',
      taskName: '全局执行上下文',
      result: '按序执行同步任务，全局执行上下文入栈'
    };
    // 添加初始化结果
    emit('update:result', [...props.result, initTask]);

    // 全局上下文入栈
    mainThread.callStack.push(initTask);
  }
  // 初始化同步任务队列
  const synchronousTasks = runTasks.value.filter(
    (task) => task.type === EventLoopTypes.SYNCHRONOUS
  );
  // 检查是否还有同步任务
  if (currentTaskIndex.value >= synchronousTasks.length) {
    // 所有同步任务准备完毕
    setTimeout(() => {
      // 去掉背景色
      changeCodeRunColor(null);
      // 执行事件循环
      eventLoop(time);
    }, 1000);
    return;
  }
  // 当前同步任务
  const currentTask = synchronousTasks[currentTaskIndex.value];
  // 检查任务是否存在
  if (!currentTask || !currentTask.type) {
    console.error('任务数据无效:', currentTask);
    return;
  }
  // 添加当前任务到事件循环队列
  addTask(currentTask);
  currentTaskIndex.value++;

  // 如果不是单步模式，则继续自动执行
  if (!mainThread.isStepMode) {
    setTimeout(() => {
      initRun(time);
    }, 100);
  }
};

// 开始运行
const beginRun = (time = 1000) => {
  if (mainThread.isRunning && !mainThread.isPaused) return;
  // 如果已有结果
  if (props.result.length > 0) {
    // 显示重置提示弹窗
    emit('resetConfirm');
    return;
  }
  mainThread.isRunning = true;
  mainThread.isPaused = false;
  initRun(time);
};

// 保存当前状态到历史记录
const saveStateToHistory = () => {
  // 保存当前状态
  const currentState = {
    mainThread: {
      callStack: [...mainThread.callStack],
      currentTask: mainThread.currentTask,
      isRunning: mainThread.isRunning,
      isPaused: mainThread.isPaused,
      isStepMode: mainThread.isStepMode
    },
    synchronousTaskQueue: [...synchronousTaskQueue.tasks],
    microtaskQueue: [...microtaskQueue.tasks],
    macrotaskQueue: {},
    renderQueue: [...renderQueue.tasks],
    resultDatas: props.result ? [...props.result] : [],
    currentTaskIndex: currentTaskIndex.value
  };

  // 保存宏任务队列状态
  Object.keys(macrotaskQueue).forEach((key) => {
    currentState.macrotaskQueue[key] = [...macrotaskQueue[key].tasks];
  });

  // 添加到历史记录
  executionHistory.value.push(currentState);
};

// 执行任务的通用函数
const processTask = (task, time = 1000) => {
  if (!task) return false;
  // 保存当前状态到历史记录
  saveStateToHistory();

  // 将任务推入调用栈执行
  setTimeout(() => {
    mainThread.callStack.push(task);
  }, 200);

  // 如果不是单步模式，则使用setTimeout继续执行
  if (!mainThread.isStepMode) {
    setTimeout(() => {
      // 继续执行事件循环
      eventLoop(time);
    }, 700);
  }

  return true;
};

// 事件循环核心逻辑
const eventLoop = async (time = 1000) => {
  // 如果是暂停状态，则不继续执行
  if (mainThread.isPaused && !mainThread.isStepMode) {
    return;
  }

  // 如果是单步模式，执行一步后暂停
  if (mainThread.isStepMode) {
    mainThread.isPaused = true;
  }

  // 1. 首先处理调用栈中的任务（函数调用）,全局上下文始终存在
  if (mainThread.callStack.length > 1) {
    // 执行调用栈中的任务（后进先出）
    const callStackTask = mainThread.callStack[mainThread.callStack.length - 1];

    // 检查任务是否已完成
    if (callStackTask && callStackTask.status !== 'completed') {
      // 保存当前状态到历史记录
      saveStateToHistory();

      // 设置当前任务状态为运行中
      runTask(callStackTask);

      setTimeout(() => {
        callStackTask.status = 'completed';

        // 任务执行完成后，根据deleteCallStack数组处理调用栈的弹出
        processCallStackDeletion(callStackTask);

        // 如果不是单步模式，继续执行下一个任务
        if (!mainThread.isStepMode) {
          eventLoop(time);
        }
      }, callStackTask.runTime || 500);
      return;
    }
  }

  // 2. 处理同步任务队列（按代码顺序执行）
  if (synchronousTaskQueue.tasks.length > 0) {
    moveToCallStack(synchronousTaskQueue.tasks[0]);
    const syncTask = synchronousTaskQueue.tasks.shift();
    if (processTask(syncTask, time)) {
      return;
    }
  }

  // 3. 处理微任务队列，在宏任务执行完成后
  if (microtaskQueue.tasks.length > 0) {
    moveToCallStack(microtaskQueue.tasks[0]);
    const microtask = microtaskQueue.tasks.shift();
    if (processTask(microtask, time)) {
      return;
    }
  }

  // 4. 渲染阶段，在微任务执行完成后
  if (renderQueue.tasks.length > 0) {
    moveToCallStack(renderQueue.tasks[0]);
    const renderTask = renderQueue.tasks.shift();
    if (processTask(renderTask, time)) {
      return;
    }
  }

  // 5. 检查是否还有宏任务
  const nextMacrotask = getNextMacrotask();
  if (processTask(nextMacrotask, time)) {
    return;
  }

  // 6. 没有任务了，事件循环结束
  mainThread.isRunning = false;
  mainThread.isStepMode = false;
  // 清空调用栈
  // mainThread.callStack = [];
  // 清空当前任务
  mainThread.currentTask = null;
};

// 切换运行/暂停状态
const toggleRunPause = () => {
  if (!mainThread.isRunning) {
    // 如果没有运行，则开始运行
    beginRun();
  } else if (mainThread.isPaused) {
    // 如果已暂停，则继续运行
    resumeEventLoop();
  } else {
    // 如果正在运行，则暂停
    pauseEventLoop();
  }
};

// 暂停事件循环
const pauseEventLoop = () => {
  mainThread.isPaused = true;
};

// 继续事件循环
const resumeEventLoop = () => {
  if (!mainThread.isRunning) return;
  mainThread.isPaused = false;
  eventLoop();
};

// 单步执行 - 下一步
const stepNext = (time = 1000) => {
  if (!mainThread.isRunning) {
    // 如果没有运行，则开始运行并设置为单步模式
    mainThread.isStepMode = true;
    initRun(time);
  } else {
    // 如果已经在运行，则继续下一步
    mainThread.isPaused = false;
    eventLoop(time);
    mainThread.isPaused = true;
  }
};

// 单步执行 - 上一步
const stepBack = () => {
  if (executionHistory.value.length === 0) return;

  // 获取上一步的状态
  const previousState = executionHistory.value.pop();

  // 恢复上一步的状态
  if (previousState.mainThread) {
    Object.assign(mainThread, previousState.mainThread);
    // 确保上一步后设置为暂停状态，以便下一步按钮可用
    mainThread.isPaused = true;
  }
  // 恢复上一步的同步任务队列
  if (previousState.synchronousTaskQueue) {
    synchronousTaskQueue.tasks = [...previousState.synchronousTaskQueue];
  }

  // 恢复上一步的微任务队列
  if (previousState.microtaskQueue) {
    microtaskQueue.tasks = [...previousState.microtaskQueue];
  }
  // 恢复上一步的渲染队列
  if (previousState.renderQueue) {
    renderQueue.tasks = [...previousState.renderQueue];
  }

  // 恢复上一步的宏任务队列
  if (previousState.macrotaskQueue) {
    Object.keys(macrotaskQueue).forEach((key) => {
      if (previousState.macrotaskQueue[key]) {
        macrotaskQueue[key].tasks = [...previousState.macrotaskQueue[key]];
      }
    });
  }
  // 恢复上一步的结果数据
  if (previousState.resultDatas) {
    emit('update:result', [...previousState.resultDatas]);
  }

  // 恢复上一步的当前任务索引
  if (previousState.currentTaskIndex !== undefined) {
    currentTaskIndex.value = previousState.currentTaskIndex;
  }

  // 设置当前运行代码的背景色
  if (mainThread.currentTask) {
    changeCodeRunColor(mainThread.currentTask);
  }
};

// 重置事件循环
const resetEventLoop = () => {
  currentTaskIndex.value = 0;
  microtaskQueue.tasks = [];
  renderQueue.tasks = []; // 清空渲染队列
  synchronousTaskQueue.tasks = []; // 重置同步任务队列
  Object.values(macrotaskQueue).forEach((queue) => {
    queue.tasks = [];
  });
  mainThread.callStack = [];
  mainThread.currentTask = null;
  mainThread.isRunning = false;
  mainThread.isPaused = false;
  mainThread.isStepMode = false;
  executionHistory.value = [];

  // 清空执行结果
  emit('update:result', []);
  // 重置颜色
  changeCodeRunColor(null);
  // 滚动到执行结果区域顶部
  scrollCodeTop(0);
};

// 滚动到执行结果区域顶部
const scrollCodeTop = (top) => {
  emit('changeCodeScrollTop', top);
};

// 设置当前运行代码的背景色
const changeCodeRunColor = (task) => {
  emit('changeCodeRunColor', task);
};

// 根据deleteCallStack数组处理调用栈的弹出
const processCallStackDeletion = (task) => {
  if (!task || !task.deleteCallStack || !Array.isArray(task.deleteCallStack)) {
    return;
  }
  // 从调用栈中删除指定的任务
  task.deleteCallStack.forEach((id) => {
    const index = mainThread.callStack.findIndex((task) => task.id == id);
    if (index !== -1) {
      const deleteTask = mainThread.callStack[index];
      // 删除自己
      if (task.id === id) {
        mainThread.callStack.splice(index, 1);
      } else {
        // 不是删除自己，延时处理
        setTimeout(() => {
          // 提示
          showTaskResult(`${deleteTask.taskName}出栈`, deleteTask.type, 2000);
          mainThread.callStack.splice(index, 1);
        }, (deleteTask.runTime || 1000) / 2);
      }
    }
  });
};

// 计算是否可以执行下一步
const canStepNext = computed(() => {
  return mainThread.isRunning && (mainThread.isPaused || mainThread.isStepMode);
});

// 计算是否可以执行上一步
const canStepBack = computed(() => {
  return executionHistory.value.length > 0;
});

// 暴露方法给父组件
defineExpose({
  toggleRunPause,
  stepNext,
  stepBack,
  resetEventLoop,
  isRunning: computed(() => mainThread.isRunning),
  isPaused: computed(() => mainThread.isPaused),
  canStepNext,
  canStepBack
});
</script>

<template>
  <div class="main-thread rel pb20" :class="{ 'is-fullscreen': isFullscreen }" ref="mainThreadRef">
    <div class="thread-title flex_lr_m">
      <el-tooltip
        effect="dark"
        placement="top-start"
        :content="MainThreadConfig.tip.replace(/\n/g, '<br>')"
        raw-content
      >
        <span class="b">{{ MainThreadConfig.name }}</span>
      </el-tooltip>
      <div class="thread-status flex_m">
        <div>状态:</div>
        <span :class="{ 'status-running': mainThread.isRunning }">
          {{ mainThread.isRunning ? '运行中' : '空闲' }}
        </span>
      </div>
    </div>
    <!-- 主线程区域 -->
    <div class="thread-container flex">
      <!-- 调用栈 -->
      <div class="call-stack-container flex_line">
        <el-tooltip
          effect="dark"
          placement="top-start"
          :content="MainThreadConfig.callStack.tip.replace(/\n/g, '<br>')"
          raw-content
        >
          <div class="stack-title b">{{ MainThreadConfig.callStack.name }}:</div>
        </el-tooltip>
        <div
          class="stack-list rel"
          :style="{ backgroundColor: Colors.mainThread.bg, color: Colors.mainThread.text }"
        >
          <el-scrollbar>
            <div class="stack-list-box flex_line_end_c pl8 pr8 pt8 flex1 gap2">
              <div
                class="task w flex_c p4"
                :class="{ active: task.status === 'running' }"
                :ref="(el) => setSourceRef(el, 'callStack' + task.id)"
                v-for="(task, index) in mainThread.callStack"
                :key="index"
              >
                <Task
                  :task="task"
                  :hidden="mainThread.currentTask && mainThread.currentTask.id === task.id"
                />
              </div>
              <div class="mover-target p4" ref="moveStackTargetRef"></div>
            </div>
          </el-scrollbar>
          <div class="task-result abs l0 t0 w" ref="taskResultRef"></div>
        </div>
      </div>

      <div class="flex1">
        <!-- 当前任务 -->
        <!-- <div class="current-task">
          <h4 class="current-task-title mr5">当前执行</h4>
          <div class="current-task-content flex_m gap4">
            <el-tag
              effect="dark"
              :color="Colors[mainThread.currentTask.type].text"
              :style="{ borderColor: Colors[mainThread.currentTask.type].text }"
              v-if="mainThread.currentTask"
            >
              {{ mainThread.currentTask.taskName }}
            </el-tag>
          </div>
        </div> -->
        <!-- 同步任务队列区域 -->
        <div class="queue-section">
          <div class="flex">
            <el-tooltip
              effect="dark"
              content="同步任务队列存储按代码顺序排列的同步任务，这些任务会被依次推入调用栈执行"
              raw-content
              placement="top-start"
            >
              <div class="queue-section-title b">同步任务</div>
            </el-tooltip>
          </div>
          <div class="queue-item">
            <el-scrollbar
              class="queue-content"
              :style="{
                backgroundColor: Colors.synchronous.bg,
                color: Colors.synchronous.text
              }"
            >
              <div class="flex_m gap4 p8 pt9">
                <div
                  class="taskbox flex"
                  :class="{ mr12: task.createTask && task.createTask.type }"
                  :ref="(el) => setSourceRef(el, 'synchronous' + task.id)"
                  v-for="task in synchronousTaskQueue.tasks"
                  :key="task.id"
                >
                  <Task :task="task" />
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
        <!-- 微队列区域 -->
        <div class="queue-section">
          <div class="flex">
            <el-tooltip
              effect="dark"
              placement="top-start"
              :content="MicrotaskQueueConfig.tip.replace(/\n/g, '<br>')"
              raw-content
            >
              <div class="queue-section-title b">{{ MicrotaskQueueConfig.name }}</div>
            </el-tooltip>
          </div>
          <div class="queue-item">
            <el-scrollbar
              class="queue-content"
              :style="{
                backgroundColor: MicrotaskQueueConfig.color.bg,
                color: MicrotaskQueueConfig.color.text
              }"
            >
              <div class="flex_m gap4 p8 pt9">
                <div
                  class="taskbox flex"
                  :class="{ mr12: task.createTask && task.createTask.type }"
                  :ref="(el) => setSourceRef(el, 'microtask' + task.id)"
                  v-for="task in microtaskQueue.tasks"
                  :key="task.id"
                >
                  <Task :task="task" />
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
        <!-- 渲染队列区域 -->
        <div class="queue-section">
          <div class="flex">
            <el-tooltip
              effect="dark"
              :content="RenderingQueueConfig.tip.replace(/\n/g, '<br>')"
              raw-content
              placement="top-start"
            >
              <div class="queue-section-title b">{{ RenderingQueueConfig.name }}</div>
            </el-tooltip>
          </div>
          <div class="queue-item">
            <el-scrollbar
              class="queue-content"
              :style="{
                backgroundColor: RenderingQueueConfig.color.bg,
                color: RenderingQueueConfig.color.text
              }"
            >
              <div class="flex_m gap4 p8 pt9">
                <div
                  class="taskbox flex"
                  :class="{ mr12: task.createTask && task.createTask.type }"
                  :ref="(el) => setSourceRef(el, 'rendering' + task.id)"
                  v-for="task in renderQueue.tasks"
                  :key="task.id"
                >
                  <Task :task="task" />
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
        <!-- 任务队列区域 -->
        <div class="queue-section">
          <div class="flex">
            <el-tooltip
              effect="dark"
              content="宏任务队列(消息队列)是浏览器用于存储待处理任务(消息)的队列<br>当执行完微队列中的所有任务后，会从队列中取出一个任务执行。"
              raw-content
              placement="top-start"
            >
              <div class="queue-section-title b">宏队列（消息队列）</div>
            </el-tooltip>
          </div>
          <div class="queues-list" v-if="Object.keys(macrotaskQueue).length > 0">
            <div
              class="queue-item flex items-center"
              v-for="(queue, key) in macrotaskQueue"
              :key="key"
            >
              <div class="flex_m">
                <el-tooltip
                  effect="dark"
                  :content="TaskQueueConfig[key].tip.replace(/\n/g, '<br>')"
                  raw-content
                  placement="top-start"
                >
                  <div class="queue-name b cursor-pointer">{{ TaskQueueConfig[key].name }}</div>
                </el-tooltip>
              </div>

              <el-scrollbar
                class="queue-content flex1"
                :style="{ backgroundColor: Colors[key].bg, color: Colors[key].text }"
              >
                <div class="flex_m gap4 p8 pt9">
                  <div
                    class="taskbox flex"
                    :class="{ mr12: task.createTask && task.createTask.type }"
                    :ref="(el) => setSourceRef(el, key + task.id)"
                    v-for="task in queue.tasks"
                    :key="task.id"
                  >
                    <Task :task="task" />
                  </div>
                </div>
              </el-scrollbar>
            </div>
          </div>
          <div class="queues-list o3" v-else>
            <div class="queue-item">
              <div class="queue-content f12 flex_m p8">当前无宏任务</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
@warning-bg: #fff3cd;
@warning-border: #ffeaa7;
@border-radius: 6px;
@border-radius-small: 4px;
@spacing-small: 8px;
@spacing-medium: 16px;
.main-thread {
  background-color: #fff;
  border-top: 1px solid @border-color;

  .thread-title {
    height: 40px;
    line-height: 40px;
    margin-top: 0;
    padding: 0 @spacing-medium;
    font-size: 16px;
    color: @text-color-primary;
    background-color: @bg-color-light;
    border-bottom: 1px solid @border-color;
  }

  .thread-container {
    padding: 0 @spacing-medium;
  }

  .mover-target {
    box-sizing: border-box;
    min-width: 1px;
    border: 2px solid transparent;
  }
  .queue-section {
    margin-top: @spacing-medium;
    &-title {
      font-size: 15px;
      cursor: pointer;
    }
    // 队列项
    .queue-item {
      .queue-name {
        width: 70px;
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .queue-content {
        height: 44px;
        border: 1px solid;
        border-radius: @border-radius;
        background-color: #fff;
        .taskbox {
          &.move {
            transition: all 0.2s;
          }
        }
      }
    }
  }

  // 调用栈容器
  .call-stack-container {
    width: 30%;
    margin-right: @spacing-medium;

    // 调用栈
    .stack-title {
      font-size: 14px;
      line-height: 40px;
      cursor: pointer;
    }

    .stack-list {
      height: 100%;
      border: 1px solid;
      border-radius: @border-radius;
      background-color: @bg-color-light;
      .task {
        transition: all 0.2s;
        position: relative;
        color: transparent;
        border: 2px dashed currentColor;
        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 4px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-left: 10px solid currentColor;
          z-index: 2;
        }
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 4px;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 5px solid transparent;
          border-bottom: 5px solid transparent;
          border-right: 10px solid currentColor;
          z-index: 2;
        }
        &.active {
          color: @success-color;
        }
      }
      .task-result {
        :deep(.result) {
          position: absolute;
          width: 100%;
          left: 0;
          text-align: center;
          font-size: 10px;
          animation: resultUp 0.2s ease-in both;
        }
      }

      :deep(.el-scrollbar__view) {
        min-height: 100%;
        display: flex;
        flex-direction: column;
      }
    }
  }

  // 线程状态
  .thread-status {
    font-size: 14px;

    .status-running {
      color: @success-color;
      font-weight: bold;
    }
  }

  // 当前任务
  .current-task {
    &-title {
      margin-top: 0;
      font-size: 14px;
    }
    &-content {
      padding: @spacing-small;
      background-color: @bg-color-light;
      border-radius: @border-radius-small;
      min-height: 42px;
    }
  }

  // 全屏状态
  &.is-fullscreen {
    height: auto;
    border-top: 0;
    display: flex;
    flex-direction: column;
  }
}

// 任务结果动画
@keyframes resultUp {
  0% {
    opacity: 0;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
