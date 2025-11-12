# JavaScript事件循环代码分析库

这个库用于分析JavaScript代码并生成事件循环演示所需的数据，可以与现有的EventLoop组件无缝集成。

## 功能特点

- 解析JavaScript代码并识别其中的同步/异步操作
- 生成事件循环可视化演示所需的数据结构
- 支持多种异步操作类型（定时器、Promise、网络请求等）
- 可扩展的任务类型映射系统
- 与现有EventLoop组件无缝集成

## 安装依赖

在使用这个库之前，需要安装以下依赖：

```bash
npm install @babel/parser @babel/traverse
```

## 基本用法

### 1. 创建代码分析器

```javascript
import { createCodeAnalyzer } from './CodeAnalyzer.js';

// 创建代码分析器实例
const analyzer = createCodeAnalyzer({
  // 自定义配置选项
  customTaskMapping: {
    // 添加自定义任务类型映射
    'myCustomFunction': 'microtask'
  }
});
```

### 2. 分析JavaScript代码

```javascript
// 要分析的JavaScript代码
const code = `
console.log('脚本开始');

setTimeout(() => {
  console.log('定时器回调');
}, 0);

Promise.resolve().then(() => {
  console.log('Promise回调');
});

console.log('脚本结束');
`;

// 分析代码并生成任务数据
const tasks = analyzer.analyze(code);

// 生成事件循环演示数据
const demoData = analyzer.generateDemoData(tasks);
```

### 3. 使用便捷函数

```javascript
import { analyzeCodeForEventLoop } from './CodeAnalyzer.js';

// 直接分析代码并生成演示数据
const demoData = analyzeCodeForEventLoop(code);
```

## 事件循环类型

库支持以下事件循环类型：

- `synchronous`: 同步任务
- `microtask`: 微任务（Promise、process.nextTick等）
- `timer`: 定时器任务（setTimeout、setInterval等）
- `event`: 事件任务（addEventListener、onclick等）
- `network`: 网络任务（fetch、XMLHttpRequest等）
- `file`: 文件I/O任务（fs.readFile、fs.writeFile等）
- `rendering`: 渲染任务

## 任务数据结构

每个任务对象包含以下属性：

```javascript
{
  id: 'task_1',           // 任务唯一ID
  type: 'synchronous',    // 任务类型
  task: '声明变量',        // 任务描述
  taskName: '变量声明',    // 任务名称
  codeNumbers: [1, 2],    // 代码行号
  createTask: {           // 创建的任务（可选）
    taskId: 'timer_123',
    type: 'timer'
  },
  status: 'pending',      // 任务状态
  runTime: 1000,          // 执行时间（毫秒）
  deleteCallStack: []     // 调用栈删除规则
}
```

## 与EventLoop组件集成

### 1. 在Vue组件中使用

```vue
<template>
  <div>
    <MainThread
      :taskData="taskData"
      :result="result"
      @changeCodeRunColor="changeCodeRunColor"
      @update:result="updateResult"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { analyzeCodeForEventLoop } from './CodeAnalyzer.js';
import MainThread from './MainThread.vue';

// 任务数据
const taskData = ref([]);
// 执行结果
const result = ref([]);

// 分析代码
const analyzeCode = () => {
  const code = `
  console.log('脚本开始');
  setTimeout(() => {
    console.log('定时器回调');
  }, 0);
  console.log('脚本结束');
  `;
  
  const { tasks } = analyzeCodeForEventLoop(code);
  taskData.value = tasks;
};

// 初始化
analyzeCode();
</script>
```

### 2. 使用示例组件

可以直接使用 `CodeAnalyzerExample.vue` 组件作为参考，它展示了如何将代码分析库与EventLoop组件集成。

## 高级用法

### 1. 自定义任务类型映射

```javascript
const analyzer = createCodeAnalyzer({
  customTaskMapping: {
    // 添加自定义任务类型映射
    'myCustomAsyncFunction': 'microtask',
    'myCustomNetworkFunction': 'network'
  }
});
```

### 2. 自定义解析器选项

```javascript
const analyzer = createCodeAnalyzer({
  parserOptions: {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'decorators-legacy',
      'classProperties',
      // 其他插件...
    ]
  }
});
```

### 3. 分析任务依赖关系

```javascript
// 分析代码
const tasks = analyzer.analyze(code);

// 分析任务之间的依赖关系
analyzer.analyzeTaskDependencies(tasks);

// 生成演示数据
const demoData = analyzer.generateDemoData(tasks);
```

## 注意事项

1. 确保代码是有效的JavaScript语法，否则解析可能会失败
2. 某些复杂的异步操作可能无法自动识别，需要手动添加任务
3. 分析结果可能需要根据实际情况进行调整
4. 在生产环境中使用时，建议添加错误处理和边界情况处理

## 扩展开发

如果需要扩展这个库的功能，可以考虑：

1. 添加更多任务类型支持
2. 改进依赖关系分析算法
3. 添加更精确的执行时间估算
4. 支持更多JavaScript语法特性
5. 添加代码执行模拟功能

## 示例代码

可以参考 `CodeAnalyzerExample.vue` 文件，它展示了如何使用这个库创建一个完整的事件循环演示应用。