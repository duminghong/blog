/**
 * JavaScript事件循环代码分析库
 * 用于分析JavaScript代码并生成事件循环演示所需的数据
 */

import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

// 事件循环类型
export const EventLoopTypes = {
  SYNCHRONOUS: 'synchronous',
  MICROTASK: 'microtask',
  EVENT: 'event',
  TIMER: 'timer',
  NETWORK: 'network',
  FILE: 'file',
  RENDERING: 'rendering'
};

// 任务类型映射
const TaskTypeMapping = {
  // 同步操作
  'FunctionDeclaration': EventLoopTypes.SYNCHRONOUS,
  'VariableDeclaration': EventLoopTypes.SYNCHRONOUS,
  'ExpressionStatement': EventLoopTypes.SYNCHRONOUS,
  
  // 微任务
  'Promise': EventLoopTypes.MICROTASK,
  'process.nextTick': EventLoopTypes.MICROTASK,
  'MutationObserver': EventLoopTypes.MICROTASK,
  'queueMicrotask': EventLoopTypes.MICROTASK,
  
  // 宏任务 - 定时器
  'setTimeout': EventLoopTypes.TIMER,
  'setInterval': EventLoopTypes.TIMER,
  'setImmediate': EventLoopTypes.TIMER,
  
  // 宏任务 - 事件
  'addEventListener': EventLoopTypes.EVENT,
  'onclick': EventLoopTypes.EVENT,
  'onload': EventLoopTypes.EVENT,
  
  // 宏任务 - 网络
  'fetch': EventLoopTypes.NETWORK,
  'XMLHttpRequest': EventLoopTypes.NETWORK,
  'axios': EventLoopTypes.NETWORK,
  
  // 宏任务 - 文件I/O (Node.js)
  'fs.readFile': EventLoopTypes.FILE,
  'fs.writeFile': EventLoopTypes.FILE,
};

/**
 * JavaScript代码分析器类
 */
export class EventLoopCodeAnalyzer {
  constructor(options = {}) {
    this.options = {
      // 解析器选项
      parserOptions: {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread',
          'asyncGenerators',
          'functionBind',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'dynamicImport',
          'nullishCoalescingOperator',
          'optionalChaining'
        ]
      },
      // 自定义任务类型映射
      customTaskMapping: {},
      ...options
    };
    
    // 合并自定义任务类型映射
    this.taskTypeMapping = { ...TaskTypeMapping, ...this.options.customTaskMapping };
  }
  
  /**
   * 分析JavaScript代码并生成事件循环任务数据
   * @param {string} code - JavaScript代码
   * @returns {Array} 任务数据数组
   */
  analyze(code) {
    try {
      // 解析代码为AST
      const ast = parse(code, this.options.parserOptions);
      
      // 任务数据数组
      const tasks = [];
      
      // 用于生成唯一ID的计数器
      let taskIdCounter = 1;
      
      // 遍历AST
      traverse(ast, {
        // 进入函数节点
        enter: (path) => {
          const node = path.node;
          
          // 获取节点位置信息
          const loc = node.loc;
          if (!loc) return;
          
          // 获取代码行号
          const codeNumbers = [loc.start.line];
          if (loc.end.line !== loc.start.line) {
            // 如果是多行代码，添加结束行号
            codeNumbers.push(loc.end.line);
          }
          
          // 根据节点类型创建任务
          const task = this.createTaskFromNode(node, taskIdCounter++, codeNumbers);
          
          if (task) {
            tasks.push(task);
          }
        }
      });
      
      // 分析任务之间的依赖关系
      this.analyzeTaskDependencies(tasks);
      
      // 按代码行号排序任务
      tasks.sort((a, b) => {
        const aLine = a.codeNumbers ? a.codeNumbers[0] : 0;
        const bLine = b.codeNumbers ? b.codeNumbers[0] : 0;
        return aLine - bLine;
      });
      
      return tasks;
    } catch (error) {
      console.error('代码分析失败:', error);
      return [];
    }
  }
  
  /**
   * 根据AST节点创建任务
   * @param {Object} node - AST节点
   * @param {number} id - 任务ID
   * @param {Array} codeNumbers - 代码行号
   * @returns {Object|null} 任务对象或null
   */
  createTaskFromNode(node, id, codeNumbers) {
    // 获取节点类型
    const nodeType = node.type;
    
    // 默认为同步任务
    let taskType = EventLoopTypes.SYNCHRONOUS;
    let taskName = '';
    let taskDescription = '';
    let createTask = null;
    
    // 根据节点类型确定任务类型和描述
    switch (nodeType) {
      case 'FunctionDeclaration':
        taskName = `函数: ${node.id ? node.id.name : '匿名函数'}`;
        taskDescription = `声明函数 ${node.id ? node.id.name : '匿名函数'}`;
        break;
        
      case 'VariableDeclaration':
        taskName = `变量声明`;
        taskDescription = `声明变量`;
        break;
        
      case 'ExpressionStatement':
        // 检查是否是函数调用
        if (node.expression.type === 'CallExpression') {
          const callInfo = this.analyzeCallExpression(node.expression);
          taskType = callInfo.type;
          taskName = callInfo.name;
          taskDescription = callInfo.description;
          createTask = callInfo.createTask;
        }
        break;
        
      case 'ReturnStatement':
        taskName = `返回语句`;
        taskDescription = `返回值`;
        break;
        
      default:
        // 其他节点类型，默认为同步任务
        taskName = nodeType;
        taskDescription = `执行 ${nodeType}`;
    }
    
    // 创建任务对象
    return {
      id: `task_${id}`,
      type: taskType,
      task: taskDescription,
      taskName,
      codeNumbers,
      createTask,
      status: 'pending',
      runTime: 1000, // 默认执行时间1秒
      deleteCallStack: [] // 默认不删除调用栈中的任务
    };
  }
  
  /**
   * 分析函数调用表达式
   * @param {Object} callExpression - 函数调用表达式节点
   * @returns {Object} 调用信息
   */
  analyzeCallExpression(callExpression) {
    const callee = callExpression.callee;
    let functionName = '';
    let taskType = EventLoopTypes.SYNCHRONOUS;
    let description = '';
    let createTask = null;
    
    // 获取函数名
    if (callee.type === 'Identifier') {
      functionName = callee.name;
    } else if (callee.type === 'MemberExpression') {
      // 处理对象方法调用，如 setTimeout, console.log 等
      const object = callee.object;
      const property = callee.property;
      
      if (object.type === 'Identifier' && property.type === 'Identifier') {
        functionName = `${object.name}.${property.name}`;
      } else if (property.type === 'Identifier') {
        functionName = property.name;
      }
    }
    
    // 根据函数名确定任务类型
    if (this.taskTypeMapping[functionName]) {
      taskType = this.taskTypeMapping[functionName];
    }
    
    // 设置任务描述
    switch (functionName) {
      case 'setTimeout':
      case 'setInterval':
        description = `创建${functionName}定时器`;
        // 创建一个宏任务
        createTask = {
          taskId: `timer_${Date.now()}`,
          type: EventLoopTypes.TIMER
        };
        break;
        
      case 'Promise':
        description = `创建Promise对象`;
        // 创建一个微任务
        createTask = {
          taskId: `promise_${Date.now()}`,
          type: EventLoopTypes.MICROTASK
        };
        break;
        
      case 'fetch':
        description = `发起网络请求`;
        // 创建一个网络任务
        createTask = {
          taskId: `fetch_${Date.now()}`,
          type: EventLoopTypes.NETWORK
        };
        break;
        
      default:
        description = `调用函数 ${functionName}`;
    }
    
    return {
      name: functionName,
      type: taskType,
      description,
      createTask
    };
  }
  
  /**
   * 分析任务之间的依赖关系
   * @param {Array} tasks - 任务数组
   */
  analyzeTaskDependencies(tasks) {
    // 这里可以实现更复杂的依赖关系分析
    // 例如，分析回调函数、Promise链等
    
    // 简单实现：如果任务创建了其他任务，则设置依赖关系
    tasks.forEach(task => {
      if (task.createTask && task.createTask.taskId) {
        // 查找被创建的任务
        const createdTask = tasks.find(t => t.id === task.createTask.taskId);
        if (createdTask) {
          // 设置被创建任务的类型
          createdTask.type = task.createTask.type;
        }
      }
    });
  }
  
  /**
   * 生成事件循环演示数据
   * @param {Array} tasks - 任务数组
   * @returns {Object} 演示数据
   */
  generateDemoData(tasks) {
    // 按类型分组任务
    const tasksByType = {
      [EventLoopTypes.SYNCHRONOUS]: [],
      [EventLoopTypes.MICROTASK]: [],
      [EventLoopTypes.TIMER]: [],
      [EventLoopTypes.EVENT]: [],
      [EventLoopTypes.NETWORK]: [],
      [EventLoopTypes.FILE]: [],
      [EventLoopTypes.RENDERING]: []
    };
    
    // 将任务分组
    tasks.forEach(task => {
      if (tasksByType[task.type]) {
        tasksByType[task.type].push(task);
      }
    });
    
    return {
      tasks,
      tasksByType,
      // 其他演示数据...
    };
  }
}

/**
 * 创建代码分析器的便捷函数
 * @param {Object} options - 配置选项
 * @returns {EventLoopCodeAnalyzer} 代码分析器实例
 */
export function createCodeAnalyzer(options) {
  return new EventLoopCodeAnalyzer(options);
}

/**
 * 分析JavaScript代码并生成事件循环演示数据
 * @param {string} code - JavaScript代码
 * @param {Object} options - 配置选项
 * @returns {Object} 演示数据
 */
export function analyzeCodeForEventLoop(code, options = {}) {
  const analyzer = createCodeAnalyzer(options);
  const tasks = analyzer.analyze(code);
  return analyzer.generateDemoData(tasks);
}