<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch, nextTick } from 'vue'
import { Colors, EventLoopTypes, MainThreadConfig, MicrotaskQueueConfig, TaskQueueConfig, TaskName } from '../config/eventLoop.config.js'
import { decodeBase64, decodeBase64ToJson } from '../utils/index.js'

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
})

// 解码Base64高亮代码
const highlightedCodeHtml = computed(() => {
  return decodeBase64(props.highlightedCodeBase64) || '';
})

// 解码Base64数据
const data = computed(() => {
  return decodeBase64ToJson(props.dataBase64);
})

// 任务数据
const taskData = computed(() => {
  return data.value.runSteps || []
})
// 获取所有任务类型
const runTypes = computed(() => {
  const list = taskData.value.map(item => item.type)
  return [...new Set(list)]
})

// 代码内容引用
const codeContentRef = ref(null)
// 执行结果区域滚动条引用
const scrollbarRef = ref(null)
// 执行结果内容区域引用
const resultContentRef = ref(null)
// 组件根元素引用，用于全屏功能
const componentRef = ref(null)
// 全屏状态
const isFullscreen = ref(false)
// 执行结果数据
const resultDatas = ref([])
// 执行历史记录，用于分步功能
const executionHistory = ref([])

// 重置提示弹窗
const dialogVisible = ref(false)
// 重置弹窗确认回调
const handleResetConfirm = () => {
  dialogVisible.value = false
  // 重置事件循环状态
  resetEventLoop()
}


// 事件循环模拟
// 主线程 - 负责执行JavaScript代码的线程
const mainThread = reactive({
  callStack: [],        // 调用栈 - 存储函数执行上下文
  isRunning: false,     // 事件循环运行状态
  isPaused: false,      // 事件循环暂停状态
  isStepMode: false,    // 是否为单步执行模式
  currentTask: null,    // 当前正在执行的任务
})

// 同步任务队列 - 按代码顺序存储同步任务
const synchronousTaskQueue = reactive({
  tasks: []
})

// 微任务队列 - 在每个宏任务后立即执行
const microtaskQueue = reactive({
  tasks: []
})

// 宏任务队列 - 不同类型的队列
const macrotaskQueue = reactive({})
Object.keys(TaskQueueConfig).forEach(key => {
  if (runTypes.value.includes(key)) {
    macrotaskQueue[key] = {
      priority: TaskQueueConfig[key].priority,
      tasks: []
    }
  }
})

// 设置当前运行代码背景色
const setCurrentRunColor = (task, isScroll = false) => {
  const lineElements = codeContentRef.value.querySelectorAll('.line-number')
  const lineCodeElements = codeContentRef.value.querySelectorAll('.line')
  // 移除其他任务的背景色
  lineElements.forEach(line => {
    line.classList.remove('current-run')
  })
  lineCodeElements.forEach(line => {
    line.classList.remove('current-run')
  })
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
    codeContentRef.value.style.setProperty('--current-code-run-line-color', Colors[task.type].border);
    codeContentRef.value.style.setProperty('--current-code-run-line-number-color', Colors[task.type].text);
  }
  // 添加当前任务的背景色
  task.codeNumbers.forEach(num => {
    if (num > 0 && num <= lineElements.length) {
      lineElements[num - 1].classList.add('current-run')
      lineCodeElements[num - 1].classList.add('current-run')
    }
  })
  // 计算当前执行的代码行的偏移量
  const firstCodeNumber = task.codeNumbers[0]
  const currentLine = lineElements[firstCodeNumber - 1]
  if (currentLine && scrollbarRef.value) {
    console.log(currentLine.offsetTop)
    nextTick(() => {
      // 滚动到当前行
      scrollbarRef.value.setScrollTop(currentLine.offsetTop - 30)
    })
  }

  // 代码区显示到当前视口
  isScroll && codeContentRef.value.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  });
}

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
  !isCreate && setCurrentRunColor(task)

  // 如果是同步任务或微任务，使用对应的处理器
  if (taskHandlers[task.type]) {
    return taskHandlers[task.type](task);
  }

  // 其他宏任务 - 推入对应队列
  if (macrotaskQueue[task.type]) {
    macrotaskQueue[task.type].tasks.push(task);
    return true;
  }

  return false;
}

// 执行任务
const runTask = (task) => {
  // 检查任务是否存在
  if (!task || !task.type) {
    console.error('任务数据无效:', task);
    return;
  }

  // 设置当前运行代码的背景色
  setCurrentRunColor(task)

  task.status = 'running'
  mainThread.currentTask = task;

  // 存储结果
  resultDatas.value.push(task);

  nextTick(() => {
    // 滚动到执行结果区域底部
    if (resultContentRef.value) {
      const conEle = resultContentRef.value.querySelector('.el-timeline')
      // 获取的高度
      const height = conEle.clientHeight - 200;
      resultContentRef.value.scrollTop = height
    }
  })

  // 是否创建任务
  if (task.createTask && task.createTask.type) {
    const { taskId, type } = task.createTask;
    const createTask = taskData.value.find(item => item.id === taskId)
    if (createTask) {
      addTask(createTask, true)
      return;
    }
  }
}

// 从队列获取下一个宏任务
const getNextMacrotask = () => {
  // 按优先级执行宏任务
  const queues = Object.keys(macrotaskQueue)
    .filter(key => macrotaskQueue[key].tasks.length > 0)
    .sort((a, b) => TaskQueueConfig[a].priority - TaskQueueConfig[b].priority)

  return queues.length > 0 ? macrotaskQueue[queues[0]].tasks.shift() : null
}


// 初始化事件循环
let currentTaskIndex = 0;
const initRun = (time = 1000) => {
  if (currentTaskIndex == 0) {
    // 添加初始化结果
    const initTask = {
      id: 'init',
      type: EventLoopTypes.SYNCHRONOUS,
      codeNumbers: [],
      task: '初始化',
      result: '按序执行同步任务，全局上下文入栈'
    }
    resultDatas.value.push(initTask)
  }
  // 初始化同步任务队列
  const synchronousTasks = taskData.value.filter(task => task.type === EventLoopTypes.SYNCHRONOUS)
  // 检查是否还有同步任务
  if (currentTaskIndex >= synchronousTasks.length) {
    // 所有同步任务准备完毕
    setTimeout(() => {
      // 去掉背景色
      setCurrentRunColor(null)
      // 执行事件循环
      eventLoop(time)
    }, 1000)
    return;
  }
  // 当前同步任务
  const currentTask = synchronousTasks[currentTaskIndex];
  // 检查任务是否存在
  if (!currentTask || !currentTask.type) {
    console.error('任务数据无效:', currentTask);
    return;
  }
  // 添加当前任务到事件循环队列
  addTask(currentTask)
  currentTaskIndex++

  // 如果不是单步模式，则继续自动执行
  if (!mainThread.isStepMode) {
    setTimeout(() => {
      initRun(time)
    }, 100)
  }
}

const beginRun = (time = 1000) => {
  if (mainThread.isRunning && !mainThread.isPaused) return
  // 如果已有结果
  if (resultDatas.value.length > 0) {
    // 显示重置提示弹窗
    dialogVisible.value = true;
    return
  }

  mainThread.isRunning = true
  mainThread.isPaused = false
  initRun(time)
}

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
    resultDatas: [...resultDatas.value],
    currentTaskIndex
  }

  // 保存宏任务队列状态
  Object.keys(macrotaskQueue).forEach(key => {
    currentState.macrotaskQueue[key] = [...macrotaskQueue[key].tasks]
  })

  // 添加到历史记录
  executionHistory.value.push(currentState)
}

// 执行任务的通用函数
const processTask = (task, time = 1000) => {
  if (!task) return false;

  // 保存当前状态到历史记录
  saveStateToHistory()

  // 将任务推入调用栈执行
  mainThread.callStack.push(task)

  // 如果不是单步模式，则使用setTimeout继续执行
  if (!mainThread.isStepMode) {
    setTimeout(() => {
      // 继续执行事件循环
      eventLoop(time)
    }, task.runTime || 500)
  }

  return true;
}

// 事件循环核心逻辑
const eventLoop = (time = 1000) => {
  // 如果是暂停状态，则不继续执行
  if (mainThread.isPaused && !mainThread.isStepMode) {
    return
  }

  // 如果是单步模式，执行一步后暂停
  if (mainThread.isStepMode) {
    mainThread.isPaused = true
  }

  // 1. 首先处理调用栈中的任务（函数调用）
  if (mainThread.callStack.length > 0) {
    // 执行调用栈中的任务（后进先出）
    const callStackTask = mainThread.callStack[mainThread.callStack.length - 1]
    if (callStackTask) {
      // 保存当前状态到历史记录
      saveStateToHistory()

      // 设置当前任务状态为运行中
      runTask(callStackTask)
      // 执行完成，从调用栈中弹出当前任务
      mainThread.callStack.pop()
      setTimeout(() => {
        // 设置当前任务状态为已完成
        callStackTask.status = 'completed'
        // 如果不是单步模式，继续执行下一个任务
        if (!mainThread.isStepMode) {
          eventLoop(time);
        }
      }, callStackTask.runTime || 500)
    }
    return;
  }

  // 2. 处理同步任务队列（按代码顺序执行）
  if (synchronousTaskQueue.tasks.length > 0) {
    const syncTask = synchronousTaskQueue.tasks.shift()
    if (processTask(syncTask, time)) {
      return;
    }
  }

  // 3. 处理微任务队列，在宏任务执行完成后
  if (microtaskQueue.tasks.length > 0) {
    const microtask = microtaskQueue.tasks.shift()
    if (processTask(microtask, time)) {
      return;
    }
  }

  // 4. 检查是否还有宏任务
  const nextMacrotask = getNextMacrotask()
  if (processTask(nextMacrotask, time)) {
    return;
  }

  // 5. 没有任务了，事件循环结束
  mainThread.isRunning = false
  mainThread.isStepMode = false
  // 清空调用栈
  mainThread.callStack = []
  // 清空当前任务
  mainThread.currentTask = null
}

// 切换运行/暂停状态
const toggleRunPause = () => {
  if (!mainThread.isRunning) {
    // 如果没有运行，则开始运行
    beginRun()
  } else if (mainThread.isPaused) {
    // 如果已暂停，则继续运行
    resumeEventLoop()
  } else {
    // 如果正在运行，则暂停
    pauseEventLoop()
  }
}

// 暂停事件循环
const pauseEventLoop = () => {
  mainThread.isPaused = true
}

// 继续事件循环
const resumeEventLoop = () => {
  if (!mainThread.isRunning) return
  mainThread.isPaused = false
  eventLoop()
}

// 单步执行 - 下一步
const stepNext = (time = 1000) => {
  if (!mainThread.isRunning) {
    // 如果没有运行，则开始运行并设置为单步模式
    mainThread.isStepMode = true
    initRun(time)
  } else {
    // 如果已经在运行，则继续下一步
    mainThread.isPaused = false
    eventLoop(time)
    mainThread.isPaused = true
  }
}

// 单步执行 - 上一步
const stepBack = () => {
  if (executionHistory.value.length === 0) return

  // 获取上一步的状态
  const previousState = executionHistory.value.pop()

  // 恢复上一步的状态
  if (previousState.mainThread) {
    Object.assign(mainThread, previousState.mainThread)
    // 确保上一步后设置为暂停状态，以便下一步按钮可用
    mainThread.isPaused = true
  }
  // 恢复上一步的同步任务队列
  if (previousState.synchronousTaskQueue) {
    synchronousTaskQueue.tasks = [...previousState.synchronousTaskQueue]
  }

  // 恢复上一步的微任务队列
  if (previousState.microtaskQueue) {
    microtaskQueue.tasks = [...previousState.microtaskQueue]
  }

  // 恢复上一步的宏任务队列
  if (previousState.macrotaskQueue) {
    Object.keys(macrotaskQueue).forEach(key => {
      if (previousState.macrotaskQueue[key]) {
        macrotaskQueue[key].tasks = [...previousState.macrotaskQueue[key]]
      }
    })
  }
  // 恢复上一步的结果数据
  if (previousState.resultDatas) {
    resultDatas.value = [...previousState.resultDatas]
  }

  // 恢复上一步的当前任务索引
  if (previousState.currentTaskIndex !== undefined) {
    currentTaskIndex = previousState.currentTaskIndex
  }

  // 设置当前运行代码的背景色
  if (mainThread.currentTask) {
    setCurrentRunColor(mainThread.currentTask)
  }
}

// 重置事件循环
const resetEventLoop = () => {
  currentTaskIndex = 0;
  microtaskQueue.tasks = []
  synchronousTaskQueue.tasks = []  // 重置同步任务队列
  Object.values(macrotaskQueue).forEach(queue => {
    queue.tasks = []
  })
  mainThread.callStack = []
  mainThread.currentTask = null
  mainThread.isRunning = false
  mainThread.isPaused = false
  mainThread.isStepMode = false
  scrollbarRef.value.setScrollTop(0)
  resultDatas.value = []
  executionHistory.value = []
  // 重置颜色
  setCurrentRunColor(null)
}

// 获取按钮文本
const getButtonText = () => {
  if (!mainThread.isRunning) {
    return '运行'
  } else if (mainThread.isPaused) {
    return '继续'
  } else {
    return '暂停'
  }
}

// 进入全屏
const enterFullscreen = () => {
  const element = componentRef.value
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.webkitRequestFullscreen) { /* Safari */
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) { /* IE11 */
    element.msRequestFullscreen()
  }
  isFullscreen.value = true
}

// 退出全屏
const exitFullscreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen()
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen()
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen()
  }
  isFullscreen.value = false
}

// 切换全屏状态
const toggleFullscreen = () => {
  if (isFullscreen.value) {
    exitFullscreen()
  } else {
    enterFullscreen()
  }
}

// 监听callStack变化
watch(() => mainThread.callStack, (n, o) => {
  // console.log('调用栈变化:', n, o)
}, { deep: true })

// 监听全屏状态变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 全屏事件类型数组，用于统一添加和移除监听器
const fullscreenEventTypes = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange'
]

onMounted(() => {
  // 添加全屏状态变化监听器
  fullscreenEventTypes.forEach(eventType => {
    document.addEventListener(eventType, handleFullscreenChange)
  })
})

// 组件卸载时移除监听器
onUnmounted(() => {
  fullscreenEventTypes.forEach(eventType => {
    document.removeEventListener(eventType, handleFullscreenChange)
  })
})
</script>

<template>
  <div class="codeRunTask" ref="componentRef">
    <div class="codeRunTask-header flex_lr_m">
      <div>{{ title || '事件循环模拟' }}</div>
      <div class="flex gap10">
        <button class="codeRunTask-header-btn-run" @click="toggleRunPause()" :disabled="false">
          {{ getButtonText() }}
        </button>
        <button class="codeRunTask-header-btn-step-back" @click="stepBack()" :disabled="executionHistory.length === 0">
          上一步
        </button>
        <button class="codeRunTask-header-btn-step" @click="stepNext()"
          :disabled="mainThread.isRunning && !mainThread.isPaused">
          下一步
        </button>
        <button class="codeRunTask-header-btn-reset" @click="resetEventLoop()">
          重置
        </button>
        <button class="codeRunTask-header-btn-fullscreen" @click="toggleFullscreen()">
          {{ isFullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>
    </div>
    <!-- 功能区 -->
    <div class="codeRunTask-container">
      <div class="codeRunTask-code">
        <el-scrollbar ref="scrollbarRef">
          <div v-html="highlightedCodeHtml" ref="codeContentRef"></div>
        </el-scrollbar>
      </div>

      <!-- 事件循环可视化 -->
      <div class="codeRunTask-visualization">
        <!-- 主线程区域 -->
        <div class="thread-section">
          <div class="flex_lr_m">
            <el-tooltip effect="dark" placement="top-start">
              <template #content>
                <div class="pre">{{ MainThreadConfig.tip }}</div>
              </template>
              <h3>{{ MainThreadConfig.name }}</h3>
            </el-tooltip>
            <div class="thread-status">
              状态: <span :class="{ 'status-running': mainThread.isRunning }">
                {{ mainThread.isRunning ? '运行中' : '空闲' }}
              </span>
            </div>
          </div>
          <!-- 当前任务 -->
          <div class="current-task flex_m mb10">
            <div class="mr5">当前执行: </div>
            <el-tag effect="dark" :color="Colors[mainThread.currentTask.type].text"
              :style="{ borderColor: Colors[mainThread.currentTask.type].text }" v-if="mainThread.currentTask">
              {{ mainThread.currentTask.taskName }}
            </el-tag>
          </div>
          <div class="task-container flex items-center">
            <!-- 调用栈 -->
            <el-tooltip effect="dark" placement="top-start">
              <template #content>
                <div class="pre">{{ MainThreadConfig.callStack.tip }}</div>
              </template>
              <h4 class="stack-title">{{ MainThreadConfig.callStack.name }}:</h4>
            </el-tooltip>
            <el-scrollbar class="flex1">
              <div class="stack-list flex_m gap4"
                :style="{ backgroundColor: Colors.mainThread.bg, color: Colors.mainThread.text }">
                <el-tag effect="dark" :color="Colors[item.type].text" :style="{ borderColor: Colors[item.type].text }"
                  v-for="(item, index) in mainThread.callStack" :key="index">
                  {{ item.taskName }}
                </el-tag>
              </div>
            </el-scrollbar>
          </div>
        </div>
        <!-- 同步任务队列区域 -->
        <div class="queue-section" v-if="synchronousTaskQueue.tasks.length > 0">
          <div class="flex">
            <el-tooltip effect="dark" content="同步任务队列存储按代码顺序排列的同步任务，这些任务会被依次推入调用栈执行" placement="top-start">
              <h3>同步任务</h3>
            </el-tooltip>
          </div>
          <div class="queue-item flex items-center">
            <el-scrollbar class="queue-content"
              :style="{ backgroundColor: Colors.synchronous.bg, color: Colors.synchronous.text }">
              <div class="flex_m gap4">
                <el-tag effect="dark" :color="Colors[task.type].text" v-for="task in synchronousTaskQueue.tasks"
                  :key="task.id" :class="`task-${task.status}`" :style="{ borderColor: Colors.synchronous.border }">
                  {{ task.taskName }}
                </el-tag>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <!-- 微队列区域 -->
        <div class="queue-section">
          <div class="flex">
            <el-tooltip effect="dark" :content="MicrotaskQueueConfig.tip" placement="top-start">
              <h3>{{ MicrotaskQueueConfig.name }}</h3>
            </el-tooltip>
          </div>
          <div class="queue-item flex items-center">
            <el-scrollbar class="queue-content"
              :style="{ backgroundColor: MicrotaskQueueConfig.color.bg, color: MicrotaskQueueConfig.color.text }">
              <div class="flex_m gap4">
                <el-tag effect="dark" :color="Colors[task.type].text" v-for="task in microtaskQueue.tasks"
                  :key="task.id" :class="`task-${task.status}`"
                  :style="{ borderColor: MicrotaskQueueConfig.color.border }">
                  {{ task.taskName }}
                </el-tag>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <!-- 任务队列区域 -->
        <div class="queue-section" v-if="Object.keys(macrotaskQueue).length > 0">
          <div class="flex">
            <el-tooltip effect="dark" content="消息队列(宏任务队列)是浏览器用于存储待处理任务(消息)的队列，当执行完微队列中的所有任务后，会从队列中取出一个任务执行。"
              placement="top-start">
              <h3>消息队列（宏队列）</h3>
            </el-tooltip>
          </div>
          <div class="queues-list">
            <div class="queue-item flex items-center" v-for="(queue, key) in macrotaskQueue" :key="key">
              <el-tooltip effect="dark" :content="TaskQueueConfig[key].tip" placement="top-start">
                <h4 class="queue-name cursor-pointer">{{ TaskQueueConfig[key].name }}</h4>
              </el-tooltip>
              <div class="queue-content" :style="{ backgroundColor: Colors[key].bg, color: Colors[key].text }">
                <div class="task-list">
                  <div v-for="(task, index) in queue.tasks" :key="task.id" class="task-item"
                    :class="`task-${task.status}`" :style="{ borderColor: Colors[key].border }">
                    {{ index + 1 }}. {{ task.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 执行结果区域 -->
        <div class="execution-result">
          <h3>执行结果</h3>
          <div class="result-content" ref="resultContentRef">
            <el-timeline style="max-width: 600px">
              <el-timeline-item v-for="data in resultDatas" :key="data.id" :timestamp="TaskName[data.type]"
                placement="top">
                <template #dot>
                  <el-tooltip content="点击定位" placement="top">
                    <div class="result-content-dot" :style="{ color: Colors[data.type].text }"
                      @click="setCurrentRunColor(data, true)"></div>
                  </el-tooltip>
                </template>
                <div class="f13 b">{{ data.task }}</div>
                <div class="f12">{{ data.result }}</div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>
    </div>

    <!-- 控制台区域 -->
    <div class="console-section">
      <div class="console-title flex_m">控制台</div>
      <el-scrollbar max-height="200px">
        <div class="console-content">
          <div class="console-item flex_lr_m" v-for="task in resultDatas" :key="task.id" v-show="task.console"
            @click="setCurrentRunColor(task, true)">
            <div>{{ task.console }}</div>
            <div class="line" v-if="task.codeNumbers && task.codeNumbers.length > 0">行号:{{ task.codeNumbers.join(',') }}
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <!-- 重置提示 -->
    <el-dialog v-model="dialogVisible" width="400px" title="确认重置吗？">
      <span>运行已结束，重新开始请先重置。</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleResetConfirm">
            确认重置
          </el-button>
        </div>
      </template>
    </el-dialog>
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
    &-btn-pause,
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

      // 运行中状态
      &.is-running {
        background-color: #f66a0a;

        &:hover:not(:disabled) {
          background-color: #ea580c;
        }
      }

      // 暂停状态
      &.is-paused {
        background-color: #f66a0a;

        &:hover:not(:disabled) {
          background-color: #ea580c;
        }
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

    &-btn-pause {
      background-color: #f66a0a;
      color: white;
      border: 1px solid rgba(27, 31, 35, 0.15);

      &:disabled {
        background-color: #fbd38d;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background-color: #ea580c;
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


  &-container {}

  // 代码内容区域
  &-code {
    height: 400px;
    background-color: var(--vp-code-block-bg);

    // 重置样式
    :deep(div[class*='language-']) {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      border-radius: 0 !important;
    }
  }

  // 可视化区域
  &-visualization {
    padding: @spacing-medium;
    padding-bottom: 0;
    background-color: #fff;
    border-top: 1px solid @border-color;

    // 线程和队列区域
    .thread-section,
    .queue-section,
    .execution-result {
      margin-bottom: @spacing-medium;

      h3 {
        margin-top: 0;
        font-size: 16px;
        color: @text-color-primary;
      }
    }

    // 任务容器
    .task-container {
      margin-bottom: @spacing-medium;

      // 调用栈
      .stack-title {
        width: 70px;
        font-weight: bold;
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }

      .stack-list {
        padding: @spacing-small;
        height: 42px;
        border: 1px solid;
        border-radius: @border-radius;
        background-color: @bg-color-light;
      }

      // 微任务检查点
      .microtask-checkpoint {
        padding: 4px 8px;
        background-color: @warning-bg;
        border: 1px solid @warning-border;
        border-radius: @border-radius-small;
        font-size: 12px;
        font-weight: bold;
      }
    }

    // 线程状态
    .thread-status {
      margin-bottom: @spacing-small;
      font-size: 14px;

      .status-running {
        color: @success-color;
        font-weight: bold;
      }
    }

    // 当前任务
    .current-task {
      padding: @spacing-small;
      background-color: @bg-color-light;
      border-radius: @border-radius-small;

      font-size: 14px;
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
        flex: 1;
        height: 42px;
        padding: @spacing-small;
        border: 1px solid;
        border-radius: @border-radius;
        background-color: #fff;

        // 任务列表
        .task-list {
          padding: @spacing-small;
          height: 42px;
          overflow-y: auto;
        }
      }
    }

    .execution-result {
      .result-content {
        padding: @spacing-small @spacing-medium;
        background-color: @bg-color-light;
        min-height: 40px;

        font-size: 12px;
        border-radius: @border-radius-small;
        overflow: hidden;
        max-height: 400px;
        overflow-y: auto;

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

      &-code,
      &-visualization {
        flex: 1;
        min-height: 0;
        min-width: 0;
        height: auto;
      }

      &-code {
        border-right: 1px solid @border-color;
      }

      &-visualization {
        border-top: 0;
        display: flex;
        flex-direction: column;

        .execution-result {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;

          .result-content {
            max-height: 100vh;
            flex: 1;
            min-height: 0;
          }
        }
      }


    }
  }
}

// 调试数据
.console-section {
  background-color: #fff;
  border-top: 1px solid @border-color;

  .console-title {
    height: 28px;
    padding: 0 @spacing-medium;
    font-size: 12px;
    background-color: #edf2fa;
    border-bottom: 1px solid #D3E3FD;
  }

  .console-content {
    min-height: 40px;
    padding: 0 @spacing-medium;
    font-size: 12px;

    .console-item {
      border-bottom: 1px solid #D3E3FD;

      &:last-child {
        border-bottom: 0;
      }

      .line {
        font-size: 12px;
        color: #0B57D0;
        text-decoration: underline;
        cursor: pointer;
      }
    }
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

.execution-result {
  :deep(.el-timeline) {
    list-style: none;
    margin: 0;
    padding: 20px 0 0 2px;
    max-width: 100% !important;

    .el-timeline-item {
      margin: 0;
    }
  }
}
</style>
