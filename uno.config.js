import { defineConfig, presetAttributify, presetWind3, transformerVariantGroup, transformerDirectives, transformerCompileClass } from 'unocss'

export default defineConfig({
  presets: [
    presetAttributify(),
    presetWind3()
  ],
  transformers: [
    transformerVariantGroup(), // 包裹多个 class
    transformerDirectives(), // 在 css 里使用原子化 class
    transformerCompileClass() // 将多个 class 编译成一个
  ],
  // 添加以下配置，确保自定义规则优先级高于预设
  rules: [
    // 尺寸相关规则
    ['wh', { 'width': '100%', 'height': '100%' }],
    ['w', { 'width': '100%' }],
    ['h', { 'height': '100%' }],
    ['w50', { 'width': '50%' }],
    ['h50', { 'height': '50%' }],
    ['hvh', { 'height': '100vh' }],
    ['minh', { 'min-height': '100vh' }],
    [/^av([.\d]+)$/, ([_, num]) => ({ 'width': `${num}px`, 'height': `${num}px` })],
    [/^size([.\d]+)$/, ([_, num]) => ({ 'width': `${num}px`, 'height': `${num}px` })],

    // 定位相关规则
    ['rel', { 'position': 'relative' }],
    ['abs', { 'position': 'absolute' }],
    ['fixed', { 'position': 'fixed' }],
    [/^zx([.\d]+)$/, ([_, num]) => ({ 'z-index': num })],
    [/^t-([.\d]+)$/, ([_, num]) => ({ 'top': `${num}px` })],
    [/^b-([.\d]+)$/, ([_, num]) => ({ 'bottom': `${num}px` })],
    [/^l-([.\d]+)$/, ([_, num]) => ({ 'left': `${num}px` })],
    [/^r-([.\d]+)$/, ([_, num]) => ({ 'right': `${num}px` })],
    ['cm', { 'position': 'absolute', 'left': '50%', 'top': '50%', 'transform': 'translate(-50%, -50%)' }],
    ['t0', { 'top': '0' }],
    ['t50', { 'top': '50%' }],
    ['t100', { 'top': '100%' }],
    ['b0', { 'bottom': '0' }],
    ['b50', { 'bottom': '50%' }],
    ['b100', { 'bottom': '100%' }],
    ['l0', { 'left': '0' }],
    ['l50', { 'left': '50%' }],
    ['l100', { 'left': '100%' }],
    ['r0', { 'right': '0' }],
    ['r50', { 'right': '50%' }],
    ['r100', { 'right': '100%' }],

    // 溢出和可见性相关规则
    ['ovh', { 'overflow': 'hidden' }],
    ['ova', { 'overflow': 'auto' }],
    ['vh', { 'visibility': 'hidden' }],
    ['vv', { 'visibility': 'visible' }],

    // 显示相关规则
    ['dn', { 'display': 'none' }],
    ['db', { 'display': 'block' }],
    ['di', { 'display': 'inline' }],
    ['dib', { 'display': 'inline-block' }],
    ['box_bb', { 'box-sizing': 'border-box' }],

    // 浮动和清除浮动相关规则
    ['l', { 'float': 'left' }],
    ['r', { 'float': 'right' }],
    ['cl', { 'clear': 'both' }],

    // 垂直居中相关规则
    ['middle', { 'display': 'inline-block', 'vertical-align': 'middle', 'width': '0', 'height': '100%' }],

    // 弹性布局相关规则
    ['flex0', { 'flex': 0, 'min-width': 0 }],
    ['flex1', { 'flex': 1, 'min-width': 0, 'min-height': 0 }],
    ['flex3', { 'flex': 3 }],
    ['flex_nosize', { 'flex-shrink': 0 }],
    ['flex_autosize', { 'flex-grow': 1 }],

    // 透明度相关规则
    [/^o([.\d]+)$/, ([_, num]) => ({ 'opacity': `${num / 10}` })],

    // 边框相关规则
    [/^bdr([.\d]+)$/, ([_, num]) => ({ 'border-radius': `${num}px` })],

    // 边距相关规则
    [/^m([.\d]+)$/, ([_, num]) => ({ 'margin': `${num}px` })],
    [/^ml([.\d]+)$/, ([_, num]) => ({ 'margin-left': `${num}px` })],
    [/^mr([.\d]+)$/, ([_, num]) => ({ 'margin-right': `${num}px` })],
    [/^mt([.\d]+)$/, ([_, num]) => ({ 'margin-top': `${num}px` })],
    [/^mb([.\d]+)$/, ([_, num]) => ({ 'margin-bottom': `${num}px` })],
    [/^p([.\d]+)$/, ([_, num]) => ({ 'padding': `${num}px` })],
    [/^pl([.\d]+)$/, ([_, num]) => ({ 'padding-left': `${num}px` })],
    [/^pr([.\d]+)$/, ([_, num]) => ({ 'padding-right': `${num}px` })],
    [/^pt([.\d]+)$/, ([_, num]) => ({ 'padding-top': `${num}px` })],
    [/^pb([.\d]+)$/, ([_, num]) => ({ 'padding-bottom': `${num}px` })],

    [/^gap([.\d]+)$/, ([_, num]) => ({ 'gap': `${num}px` })],

    // 字体相关规则
    [/^f([.\d]+)$/, ([_, num]) => ({ 'font-size': `${num}px` })],
    ['n', { 'font-weight': '400', 'font-style': 'normal' }],
    ['b', { 'font-weight': '700' }],
    ['i', { 'font-style': 'italic' }],
    ['tdl', { 'text-decoration': 'underline' }],
    ['tdd', { 'text-decoration': 'line-through' }],
    ['tc', { 'text-align': 'center' }],
    ['tr', { 'text-align': 'right' }],
    ['tl', { 'text-align': 'left' }],
    ['th_tj', { 'text-align': 'justify' }],
    ['tj', { 'text-align': 'justify' }],
    ['vm', { 'vertical-align': 'middle' }],
    ['vb', { 'vertical-align': 'bottom' }],
    ['vt', { 'vertical-align': 'top' }],
    ['vn', { 'vertical-align': '-10rpx' }],
    ['lt-1', { 'letter-spacing': '-2rpx' }],
    ['lt0', { 'letter-spacing': '0' }],
    ['lt1', { 'letter-spacing': '2rpx' }],
    ['nowrap', { 'white-space': 'nowrap' }],
    ['bk', { 'word-wrap': 'break-word' }],
    ['wb', { 'white-space': 'normal', 'word-break': 'break-all' }],
    ['wn', { 'word-break': 'normal' }],
    ['ell', { 'white-space': 'nowrap', 'text-overflow': 'ellipsis', 'overflow': 'hidden' }],
    ['ell_2', { 'display': '-webkit-box', '-webkit-box-orient': 'vertical', '-webkit-line-clamp': '2' }],
    ['ell_3', { 'display': '-webkit-box', '-webkit-box-orient': 'vertical', '-webkit-line-clamp': '3' }],
    ['no_select', { 'user-select': 'none' }],
    ['text_select', { 'user-select': 'text' }],
    ['pre', { 'white-space': 'pre-wrap' }],

    ['no-drag', { '-webkit-app-region': 'no-drag' }],

    // 行高相关规则
    [/^lh([.\d]+)$/, ([_, num]) => ({ 'line-height': `${num}px` })],
    ['lh1', { 'line-height': '1' }],

    // 背景相关规则
    ['bg_cover', { 'background-size': 'cover', 'background-repeat': 'no-repeat', 'background-position': 'center' }],
    ['bg_contain', { 'background-size': 'contain', 'background-repeat': 'no-repeat', 'background-position': 'center' }],
    [/^bg_o([.\d]+)$/, ([_, num]) => ({ 'background-color': `rgba(0,0,0,${num / 10})` })],

    // 指针相关
    ['cur_p', { 'cursor': 'pointer' }],
    ['cur_not', { 'cursor': 'not-allowed' }],
  ],
  variants: [
    // 可以在这里添加变体
  ],
  // 通过 shortcuts 将多个 class 组合成一个。该配置通常用于全局样式、主题、背景等。
  shortcuts: [
    {
      'flex-wrap': 'flex flex-wrap',
      'flex-end': 'flex flex-row-reverse',
      'flex-b': 'flex items-end',
      'flex-tb': 'flex flex-col justify-between',
      'flex-tb-c': 'flex flex-col items-center justify-between',
      'flex-line': 'flex flex-col',
      'flex-line-c': 'flex flex-col items-center',
      'flex-line-m': 'flex flex-col justify-center',
      'flex-line-c-m': 'flex flex-col items-center justify-center',
      'flex-line-end': 'flex flex-col-reverse',
      'flex-lr': 'flex justify-between',
      'flex-lr-b': 'flex justify-between items-end',
      'flex-lr-m': 'flex justify-between items-center',
      'flex-c-m': 'flex justify-center items-center',
      'flex-c': 'flex justify-center',
      'flex-m': 'flex items-center',
    },
  ],
  // 在这里添加你的自定义主题
  theme: {
    colors: {
      primary: 'var(--vp-c-brand)',
      'primary-light': 'var(--vp-c-brand-light)',
      'primary-lighter': 'var(--vp-c-brand-lighter)',
      'primary-dark': 'var(--vp-c-brand-dark)',
      'primary-darker': 'var(--vp-c-brand-darker)',
    }
  },
})