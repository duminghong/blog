/*
 * @Author: duminghong i@duminghong.com
 * @Date: 2025-10-05 13:52:28
 * @LastEditors: duminghong i@duminghong.com
 * @LastEditTime: 2025-10-05 13:52:31
 * @Description: 
 */
/**
 * 全局复制事件拦截器，用于在复制内容后添加水印
 * 功能说明：拦截document的copy事件，获取选中的文本，在其后添加自定义水印信息
 */

/**
 * 初始化复制事件拦截器
 * @param {Object} options - 配置选项
 * @param {string} options.watermarkText - 要添加的水印文本
 * @param {boolean} options.excludeCodeBlocks - 是否排除代码块内容
 */
export function setupCopyWithWatermark(options = {}) {
  // 确保在浏览器环境中运行
  if (typeof window !== 'undefined') {
    // 默认配置
    const defaultOptions = {
      watermarkText: '\n\n本文内容来源于 https://blog.duminghong.com\n请尊重原创，转载请注明出处',
      excludeCodeBlocks: false
    };

    // 合并配置
    const config = { ...defaultOptions, ...options };

    /**
     * 处理复制事件
     * @param {ClipboardEvent} e - 复制事件对象
     */
    function handleCopy(e) {
      try {
        // 获取选中的文本
        const selectedText = window.getSelection().toString().trim();

        // 如果没有选中文本，则不处理
        if (!selectedText) return;

        // 检查是否需要排除代码块
        if (config.excludeCodeBlocks) {
          const activeElement = document.activeElement;
          // 检查当前活动元素是否为代码编辑器或代码块
          if (activeElement &&
            (activeElement.tagName === 'TEXTAREA' ||
              activeElement.contentEditable === 'true' ||
              activeElement.closest('pre') ||
              activeElement.closest('code'))) {
            return;
          }
        }

        // 在选中文本后添加水印
        const textWithWatermark = selectedText + config.watermarkText;

        // 阻止默认的复制行为
        e.preventDefault();

        // 设置剪贴板内容
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', textWithWatermark);
        } else if (window.clipboardData) {
          // 兼容旧版IE
          window.clipboardData.setData('Text', textWithWatermark);
        }
      } catch (error) {
        console.error('处理复制事件时出错:', error);
        // 如果出错，则不阻止默认行为
      }
    }

    // 添加复制事件监听器
    document.addEventListener('copy', handleCopy);

    // 返回一个清理函数，用于移除事件监听器
    return function cleanup() {
      document.removeEventListener('copy', handleCopy);
    };
  }

  // 如果不是在浏览器环境中，返回一个空的清理函数
  return function cleanup() { };
}

// 默认导出初始化函数
export default setupCopyWithWatermark;