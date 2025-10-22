// 事件循环模拟配置文件

// 类型定义
export const EventLoopTypes = {
  MAIN_THREAD: 'mainThread',   // 主线程
  CALL_STACK: 'callStack',      // 调用栈
  SYNCHRONOUS: 'synchronous',  // 同步任务
  MICROTASK: 'microtask',      // 微队列
  EVENT: 'event',              // 事件队列
  TIMER: 'timer',              // 延时队列
  NETWORK: 'network',          // 网络队列
  FILE: 'file',                // 文件队列
  RENDERING: 'rendering'       // 渲染队列
}

// 任务优先级定义
// 执行顺序
// 1.首先执行调用栈中的所有同步代码
// 2.调用栈为空后，检查微任务队列，执行所有微任务
// 3.微任务队列为空后，从宏任务队列中取出一个任务执行
// 4.重复步骤2-3，直到调用栈和微任务队列都为空
export const TaskPriority = {
  [EventLoopTypes.SYNCHRONOUS]: 0,  //同步任务不是一个队列 ，是指直接执行的同步代码，优先级最高，会阻塞其他任务的执行
  [EventLoopTypes.MICROTASK]: 1,
  [EventLoopTypes.EVENT]: 2,
  [EventLoopTypes.TIMER]: 3,
  [EventLoopTypes.NETWORK]: 4,
  [EventLoopTypes.FILE]: 5,
  [EventLoopTypes.RENDERING]: 6
}

export const TaskName = {
  [EventLoopTypes.SYNCHRONOUS]: '同步任务',
  [EventLoopTypes.MICROTASK]: '微任务',
  [EventLoopTypes.EVENT]: '事件任务',
  [EventLoopTypes.TIMER]: '延时任务',
  [EventLoopTypes.NETWORK]: '网络任务',
  [EventLoopTypes.FILE]: '文件任务',
  [EventLoopTypes.RENDERING]: '渲染任务'
}

// 颜色定义
export const Colors = {
  // 主线程颜色
  mainThread: {
    bg: '#f3f3f3',
    border: '#606060',
    text: '#333'
  },
  // 同步任务颜色
  synchronous: {
    bg: '#e6f7ff',
    border: '#91d5ff',
    text: '#096dd9'
  },
  // 微队列颜色
  microtask: {
    bg: '#f6ffed',
    border: '#b7eb8f',
    text: '#389e0d'
  },
  // 事件队列颜色
  event: {
    bg: '#fff7e6',
    border: '#ffd591',
    text: '#d46b08'
  },
  // 延时队列颜色
  timer: {
    bg: '#fff1f0',
    border: '#ffa39e',
    text: '#cf1322'
  },
  // 网络队列颜色
  network: {
    bg: '#f9f0ff',
    border: '#d3adf7',
    text: '#722ed1'
  },
  // 文件队列颜色
  file: {
    bg: '#fff0f6',
    border: '#ffadd2',
    text: '#c41d7f'
  },
  // 渲染队列颜色
  rendering: {
    bg: '#e6fffb',
    border: '#87e8de',
    text: '#08979c'
  }
}


// 渲染主线程配置
export const MainThreadConfig = {
  name: '渲染主线程',
  tip: '渲染主线程是浏览器渲染进程中的核心线程，负责协调和管理整个渲染流程。\n它通过事件循环机制来处理各种任务，包括解析HTML/CSS、执行JavaScript、处理事件、布局和绘制等',
  color: Colors.mainThread
}

// 渲染线程配置
// 整个渲染流程中的线程协作可以概括为以下步骤：
// 1.网络线程 获取HTML文档后，产生渲染任务并传递给渲染主线程的消息队列（渲染队列）
// 2.渲染主线程 取出任务，执行HTML解析、样式计算、布局、分层和绘制指令生成
// 3.合成线程 接收绘制指令，进行图层分块，并协调光栅化过程
// 4.光栅化线程 将分块后的图层转换为位图，通常利用GPU加速
// 5.GPU线程 接收合成线程的最终合成结果，完成屏幕成像
export const RenderingThreadConfig = {
  name: '渲染线程',
  tip: '渲染线程是现代浏览器渲染进程中独立于主线程的专门线程集合，包含合成线程、光栅化线程和GPU线程。\n它们共同协作实现流畅滚动和动画，是现代浏览器高性能渲染的关键组件。',
  queue: 'rendering',
  // 子线程
  subThreads: {
    compositing: {
      name: '合成线程',
      tip: '合成线程负责图层管理和分块处理，将多个图层合并为最终的合成图像。'
    },
    raster: {
      name: '光栅化线程',
      tip: '光栅化线程将矢量图形转换为位图像素数据。'
    },
    gpu: {
      name: 'GPU线程',
      tip: 'GPU线程负责处理图形渲染任务，如绘制2D和3D图形、处理变换和动画等。'
    }
  }
}


// 事件线程配置
export const EventThreadConfig = {
  name: '事件线程',
  tip: '事件线程负责监听用户交互事件，如点击、滚动、键盘输入等，当事件触发时，将事件添加到事件队列中',
  queue: 'event'
}

// 计时线程配置
export const TimerThreadConfig = {
  name: '计时线程',
  tip: '计时线程负责处理延时任务，如setTimeout和setInterval等',
  queue: 'timer'
}

// 网络线程配置
export const NetworkThreadConfig = {
  name: '网络线程',
  tip: '网络线程负责处理网络请求，如XMLHttpRequest、Fetch API等',
  queue: 'network'
}


// Web Worker线程配置
export const WorkerThreadConfig = {
  name: 'Web Worker线程',
  tip: 'Web Worker线程是浏览器中运行的独立于主线程的JavaScript线程，它可以在后台执行复杂的计算或I/O操作，而不会阻塞主线程的执行',
  queue: 'rendering'
}



// 微队列配置
export const MicrotaskQueueConfig = {
  name: '微队列',
  tip: '微队列中的任务会在当前宏任务执行完毕后立即执行',
  priority: TaskPriority[EventLoopTypes.MICROTASK],
  type: EventLoopTypes.MICROTASK,
  color: Colors.microtask
}

// 消息队列（宏任务队列）配置
export const TaskQueueConfig = {
  event: {
    name: '交互队列',
    tip: '交互队列中的任务会在用户交互事件触发时执行',
    priority: TaskPriority[EventLoopTypes.EVENT],
    type: EventLoopTypes.EVENT,
    color: Colors.event
  },
  timer: {
    name: '延时队列',
    tip: '延时队列中的任务会在指定的延时时间后执行',
    priority: TaskPriority[EventLoopTypes.TIMER],
    type: EventLoopTypes.TIMER,
    color: Colors.timer
  },
  network: {
    name: '网络队列',
    tip: '网络队列主要执行与网络请求相关的任务，网络队列中的任务会在网络请求完成时执行',
    priority: TaskPriority[EventLoopTypes.NETWORK],
    type: EventLoopTypes.NETWORK,
    color: Colors.network
  },
  file: {
    name: '文件队列',
    tip: '文件队列中的任务会在文件操作完成时执行，node环境下才有文件队列',
    priority: TaskPriority[EventLoopTypes.FILE],
    type: EventLoopTypes.FILE,
    color: Colors.file
  },
  rendering: {
    name: '渲染队列',
    tip: '渲染任务是一种特殊的宏任务，会在当前宏任务执行完毕后，浏览器有空闲时间时执行',
    priority: TaskPriority[EventLoopTypes.RENDERING],
    type: EventLoopTypes.RENDERING,
    color: Colors.rendering
  }
}