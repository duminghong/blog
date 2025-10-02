// import svgPanZoom from 'svg-pan-zoom';

// 存储已处理的 mermaid 元素 ID，避免重复处理
const processedMermaidIds = new Set();

/**
 * 为 Mermaid 图表添加缩放和平移功能
 */
export async function setupMermaidPanZoom() {
  // 确保在浏览器环境中运行
  if (typeof window === 'undefined') {
    return;
  }

  // 动态导入 svg-pan-zoom 库，只在浏览器环境中执行
  let svgPanZoom;
  try {
    const module = await import('svg-pan-zoom');
    svgPanZoom = module.default || module;
  } catch (error) {
    console.error('Failed to import svg-pan-zoom:', error);
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

    // 为 SVG 添加包装器，使其能够正确显示和缩放
    if (!container.classList.contains('mermaid-pan-zoom-wrapper')) {
      // 添加样式类
      container.classList.add('mermaid-pan-zoom-wrapper');
      svgElement.classList.add('mermaid-svg');

      // 获取SVG的实际高度
      // 方法1: 使用getBoundingClientRect获取渲染后的实际高度
      const boundingRect = svgElement.getBoundingClientRect();
      const svgHeight = boundingRect.height;

      // 方法2: 尝试从SVG的属性中获取高度
      let svgHeightAttr = svgElement.getAttribute('height');
      if (svgHeightAttr) {
        // 如果高度属性存在，转换为数字
        svgHeightAttr = parseInt(svgHeightAttr);
        console.log('SVG高度(属性):', svgHeightAttr);
      }

      console.log('SVG高度(getBoundingClientRect):', svgHeight);

      // 设置SVG的样式，确保它能够正确缩放和显示完整
      svgElement.style.maxWidth = '100%';
      // 保留原始高度，确保图表完全显示
      if (svgHeight > 0) {
        svgElement.style.minHeight = `${svgHeight}px`;
      } else {
        svgElement.style.minHeight = '200px'; // 设置默认最小高度
      }
      svgElement.style.display = 'block'; // 确保SVG作为块级元素显示

      // 为容器添加内边距，确保内容不会被裁剪
      container.style.padding = '10px';

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

        // 添加是否启用控制开关，使用switch样式
        const switchContainer = document.createElement('div');
        switchContainer.className = 'mermaid-switch-container';
        switchContainer.innerHTML = `
          <label class="mermaid-switch-label">
            启用缩放
            <input type="checkbox" class="mermaid-switch-input" ${zoomEnabled ? 'checked' : ''}>
            <span class="mermaid-switch-slider"></span>
          </label>
        `;
        container.appendChild(switchContainer);

        // 添加切换开关的事件监听
        const switchInput = switchContainer.querySelector('.mermaid-switch-input');
        switchInput.addEventListener('change', (e) => {
          zoomEnabled = e.target.checked;
          panZoomInstance.setZoomEnabled(zoomEnabled);
          svgElement.style.cursor = zoomEnabled ? 'grab' : 'default';
        });

        // 添加双击重置功能
        svgElement.addEventListener('dblclick', () => {
          panZoomInstance.reset();
        });

        // 添加提示信息
        const tooltip = document.createElement('div');
        tooltip.className = 'mermaid-tooltip';
        tooltip.innerText = '提示：使用鼠标滚轮缩放，拖拽平移，双击重置';
        container.appendChild(tooltip);

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