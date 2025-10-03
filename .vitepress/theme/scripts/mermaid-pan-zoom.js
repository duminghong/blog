// import svgPanZoom from 'svg-pan-zoom';

// 存储已处理的 mermaid 元素 ID，避免重复处理
const processedMermaidIds = new Set();

// 全局存储导入的库
let svgPanZoom = null;
let snapdom = null;
let librariesLoaded = false;

/**
 * 初始化所需的库
 */
export async function initializeLibraries() {
  // 确保在浏览器环境中运行
  if (typeof window === 'undefined') {
    return false;
  }

  // 如果库已经加载，直接返回
  if (librariesLoaded) {
    return true;
  }

  try {
    // 动态导入 svg-pan-zoom 库，只在浏览器环境中执行
    const svgPanZoomModule = await import('svg-pan-zoom');
    svgPanZoom = svgPanZoomModule.default || svgPanZoomModule;

    // 动态导入snapdom库，用于导出SVG
    const snapdomModule = await import('@zumer/snapdom');
    snapdom = snapdomModule.default || snapdomModule.snapdom || snapdomModule;

    librariesLoaded = true;
    return true;
  } catch (error) {
    console.error('Failed to import libraries:', error);
    return false;
  }
}

/**
 * 确保SVG元素完全加载
 * @param {SVGElement} svgElement - 要检查的SVG元素
 * @returns {Promise<void>} - 当SVG加载完成时解析的Promise
 */
export async function ensureSvgLoaded(svgElement) {
  return new Promise((resolve) => {
    // 检查SVG是否已经加载完成
    if (svgElement.complete || svgElement.readyState === 4) {
      resolve();
    } else {
      // 如果SVG尚未加载完成，等待加载完成事件
      svgElement.addEventListener('load', () => resolve());
      // 设置超时，以防load事件永远不会触发
      setTimeout(() => resolve(), 3000);
    }
  });
}

/**
 * 创建Mermaid图表的UI控件（提示信息和缩放/平移开关）
 * @param {HTMLElement} container - 包含Mermaid图表的容器元素
 * @param {boolean} zoomEnabled - 初始状态是否启用缩放
 * @param {Object} panZoomInstance - svg-pan-zoom实例
 * @returns {Object} - 包含创建的UI控件的引用对象
 */
function createMermaidControls(container, zoomEnabled, panZoomInstance) {
  // 创建提示信息
  const tooltip = document.createElement('div');
  tooltip.className = 'mermaid-tooltip';
  tooltip.innerText = '提示：使用鼠标滚轮缩放，拖拽平移，双击重置';
  container.appendChild(tooltip);

  // 创建开关容器
  const switchContainer = Object.assign(document.createElement('div'), {
    className: 'mermaid-switch-container'
  });

  // 创建开关标签和输入
  const switchLabel = Object.assign(document.createElement('label'), {
    className: 'mermaid-switch-label',
    innerHTML: `
      <input type="checkbox" class="mermaid-switch-input" ${zoomEnabled ? 'checked' : ''}>
      缩放/平移
      <span class="mermaid-switch-core">
        <span class="mermaid-switch-button"></span>
      </span>
    `
  });

  switchContainer.appendChild(switchLabel);
  container.appendChild(switchContainer);

  // 获取开关元素的引用
  const switchInput = switchLabel.querySelector('.mermaid-switch-input');

  // 添加开关事件监听
  switchInput.addEventListener('change', function () {
    const isEnabled = this.checked;
    if (isEnabled) {
      // 启用缩放和拖拽
      panZoomInstance.enablePan();
      panZoomInstance.enableZoom();
      tooltip.style.display = 'block';
    } else {
      // 禁用缩放和拖拽
      panZoomInstance.disablePan();
      panZoomInstance.disableZoom();
      tooltip.style.display = 'none';
    }
    // 更新SVG光标样式
    const svgElement = container.querySelector('svg');
    if (svgElement) {
      svgElement.style.cursor = isEnabled ? 'grab' : 'default';
    }
  });

  // 返回创建的UI控件引用
  return {
    tooltip,
    switchInput,
    switchContainer
  };
}


/**
 * 导出Mermaid图表为PNG图片
 * @param {HTMLElement} container - 包含Mermaid图表的容器元素
 * @param {string} [filename] - 可选的文件名，如果不提供则使用时间戳
 */
async function exportMermaidToPng(container, filename) {
  try {
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      console.error('容器中未找到SVG元素');
      return;
    }
    // 获取svgElement的大小
    const boundingRect = svgElement.getBoundingClientRect();
    const svgWidth = boundingRect.width;
    const svgHeight = boundingRect.height;

    // 复制SVG元素，避免修改原始元素
    const svgCopy = svgElement.cloneNode(true);

    // 添加水印插入到容器中
    // 使用CSS background-image和SVG data URI创建平铺文字背景
    const textBgSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='50' viewBox='0 0 200 100'%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' fill='%23C0C0C0' fill-opacity='0.3' transform='rotate(30, 100, 50)'%3EPowered by Duminghong%3C/text%3E%3C/svg%3E`;

    // 创建一个容器来包裹SVG
    const containerSvg = document.createElement('div');
    // 设置容器样式，平铺文字背景
    containerSvg.style.cssText = `
      width: ${svgWidth}px; 
      height: ${svgHeight}px; 
      background-color: #ffffff; 
      background-image: url("${textBgSvg}"); 
      background-repeat: repeat; 
      overflow: hidden; 
      position: fixed; 
      padding: 10px;
      left: -99999px; 
      top: -99999px;
    `;
    containerSvg.appendChild(svgCopy);
    // 添加到文档中，确保可以被snapdom访问
    document.body.appendChild(containerSvg);

    // 使用snapdom将SVG转换为PNG
    const result = await snapdom(containerSvg, {
      backgroundColor: 'transparent', // 设置透明背景
      scale: 2 // 缩放比例，默认是1，这里设置为2倍
    });
    // 删除临时容器
    document.body.removeChild(containerSvg);
    // 下载图片
    await result.download({ format: 'png', filename: filename || `DuBlog-image-${Date.now()}` });
  } catch (error) {
    console.error('导出功能错误:', error);
  }
}

/**
 * 创建导出按钮并添加到容器中
 * @param {HTMLElement} container - 要添加按钮的容器
 */
function createExportButton(container) {
  const exportButton = document.createElement('button');
  exportButton.className = 'mermaid-export-button';
  exportButton.textContent = '导出图片';

  exportButton.addEventListener('click', () => {
    exportMermaidToPng(container);
  });

  container.appendChild(exportButton);
  return exportButton;
}

/**
 * 为 Mermaid 图表添加缩放和平移功能
 */
export async function setupMermaidPanZoom() {
  // 确保在浏览器环境中运行
  if (typeof window === 'undefined') {
    return;
  }

  // 初始化库
  const libsInitialized = await initializeLibraries();
  if (!libsInitialized) {
    return;
  }

  // 获取所有的 mermaid 图表容器
  const mermaidContainers = document.querySelectorAll('.mermaid');

  mermaidContainers.forEach((container, index) => {
    // 获取容器内的 SVG 元素
    const svgElement = container.querySelector('svg');
    if (!svgElement) return;

    // 为 SVG 元素添加唯一 ID（如果没有）
    let svgId = svgElement.id;
    if (!svgId) {
      svgId = `mermaid-svg-${Date.now()}-${index}`;
      svgElement.id = svgId;
    }

    // 跳过已经处理过的元素
    if (processedMermaidIds.has(svgId)) return;
    processedMermaidIds.add(svgId);

    // 为容器添加内边距，确保内容不会被裁剪
    container.style.padding = '10px';

    // 添加导出功能
    createExportButton(container, svgElement);

    // 为 SVG 添加包装器，使其能够正确显示和缩放
    if (!container.classList.contains('mermaid-pan-zoom-wrapper')) {
      // 添加样式类
      container.classList.add('mermaid-pan-zoom-wrapper');
      svgElement.classList.add('mermaid-svg');

      // 获取SVG的实际高度 使用getBoundingClientRect获取渲染后的实际高度
      const boundingRect = svgElement.getBoundingClientRect();
      const svgHeight = boundingRect.height;

      // 设置SVG的样式，确保它能够正确缩放和显示完整
      svgElement.style.maxWidth = '100%';
      svgElement.style.display = 'block'; // 确保SVG作为块级元素显示
      // 保留原始高度，确保图表完全显示
      if (svgHeight > 0) {
        svgElement.style.minHeight = `${svgHeight}px`;
      } else {
        svgElement.style.minHeight = '200px'; // 设置默认最小高度
      }

      // 获取容器之前的标签
      const previousSibling = container.previousElementSibling;
      let zoomEnabled = true;
      // 如果存在前一个元素，并且包含属性mermaid-zoom
      if (previousSibling && previousSibling.hasAttribute('mermaid-zoom')) {
        // 获取zoomEnabled属性
        zoomEnabled = previousSibling.getAttribute('mermaid-zoom') === 'true';
      }
      if (!zoomEnabled) {
        // 禁用缩放功能
        svgElement.style.cursor = 'default';
        return;
      }
      // 应用 svg-pan-zoom
      try {
        // 等待SVG加载完成
        ensureSvgLoaded(svgElement).then(() => {
          const panZoomInstance = svgPanZoom(svgElement, {
            zoomEnabled: zoomEnabled,         // 启用缩放功能
            controlIconsEnabled: false, // 显示缩放控制图标
            fit: true,                 // 自动调整图表大小以适应容器
            center: true,              // 自动将图表居中显示在容器中
            minZoom: 0.1,              // 最小缩放比例（原始大小的10%）
            maxZoom: 10,               // 最大缩放比例（原始大小的10倍）
            zoomScaleSensitivity: 0.2, // 鼠标滚轮缩放的敏感度
            dblClickZoomEnabled: true, // 启用双击缩放功能
            mouseWheelZoomEnabled: true, // 启用鼠标滚轮缩放功能
            beforeZoom: function () {  // 缩放前的回调函数
              // 保存原始尺寸，确保缩放不会改变容器尺寸
              return true;
            }
          });

          // 添加双击重置功能
          svgElement.addEventListener('dblclick', () => {
            panZoomInstance.reset();
          });

          // 创建Mermaid图表的UI控件
          createMermaidControls(container, zoomEnabled, panZoomInstance);
        });
      } catch (error) {
        console.error('Failed to initialize svg-pan-zoom for mermaid:', error);
      }
    }
  });
}

/**
 * 清理已处理的 Mermaid ID，用于路由变化时
 */
export function clearProcessedMermaidIds() {
  processedMermaidIds.clear();
}