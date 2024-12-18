---
layoutClass: doc-layout
---

# 在vue项目中使用vw

## 安装
*   [postcss-import](https://github.com/postcss/postcss-import)
*   [postcss-url](https://github.com/postcss/postcss-url)
    ```
    npm i postcss-import postcss-url --save-dev
    ```

*   [postcss-aspect-ratio-mini](https://github.com/yisibl/postcss-aspect-ratio-mini)
*   [postcss-px-to-viewport](https://github.com/evrone/postcss-px-to-viewport)
*   [postcss-write-svg](https://github.com/jonathantneal/postcss-write-svg)
*   [postcss-cssnext](https://github.com/MoOx/postcss-cssnext)
*   [cssnano](https://github.com/ben-eb/cssnano)
    ```
    npm i postcss-aspect-ratio-mini postcss-px-to-viewport postcss-write-svg postcss-cssnext cssnano --S
    ```
*   cssnano-preset-advanced
    ```
    npm i cssnano-preset-advanced --save-dev
    ```

## 配置 ```postcss.config.js```
```
module.exports = {
  "plugins": {
    "postcss-import": {},
    "postcss-url": {},
    "postcss-aspect-ratio-mini": {},
    "postcss-write-svg": {
      utf8: false
    },
    "postcss-cssnext": {},
    "postcss-px-to-viewport": { 
      "viewportWidth": 375, // 视窗的宽度，对应的是我们设计稿的宽度，一般是750
      "viewportHeight": 667, // 视窗的高度，根据750设备的宽度来指定，一般指定1334
      "unitPrecision": 4, // 指定`px`转换为视窗单位值的小数位数（很多时候无法整除）
      "viewportUnit": 'vw', // 指定需要转换成的视窗单位，建议使用vw
      "selectorBlackList": ['.ignore', '.hairlines'], // 指定不转换为视窗单位的类，可以自定义，可以无限添加,建议定义一至两个通用的类名
      "minPixelValue": 1, // 小于或等于`1px`不转换为视窗单位，你也可以设置为你想要的值
      "mediaQuery": false // 允许在媒体查询中转换`px`
    },
    "cssnano": { 
      "preset": "advanced", 
      "autoprefixer": false, // cssnext也具备autoprefixer功能，所以把cssnano的设置为false
      "postcss-zindex": false , // 避免 cssnano 重新计算 z-index
    }
  }
}
```



-------------------------------------------
##### 原文：
[如何在Vue项目中使用vw实现移动端适配](https://www.w3cplus.com/mobile/vw-layout-in-vue.html)