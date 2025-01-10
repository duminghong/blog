---
layoutClass: doc-layout
---

# htmx笔记
> htmx是一种经过设计的JavaScript库，旨在简化前端开发中的交互性操作。它提供了一种简单的方式来处理表单提交、数据获取、以及页面更新等操作，而无需编写大量的JavaScript代码。

## 关键特性
- **基于HTML**：htmx使用HTML扩展属性（称为HX属性）来标记和定义交互行为，使得开发人员能够直观地将交互操作与现有的HTML结构集成在一起。
- **轻量级**：htmx的核心库非常小巧，仅需几KB的文件大小，可以轻松集成到现有项目中，无需引入庞大的前端框架。
- **无依赖性**：htmx不依赖于特定的后端技术或框架，可以与任何服务器端编程语言和框架一起使用，为开发人员提供了更大的灵活性和选择性。

## 原理
htmx 的实现原理是通过 AJAX、HTML5 和 WebSocket 等技术，将前端和后端的交互方式从传统的请求-响应模式转变为增量更新模式，从而实现了无刷新、无跳转的动态页面更新。具体来说，htmx 通过在 HTML标签中添加自定义属性，如 hx-get、hx-post、hx-trigger 等，来指定需要执行的 AJAX 请求、响应后的操作以及触发 AJAX 请求的事件等。在响应返回后，htmx 会根据响应的内容和指定的操作，更新页面中的部分内容，从而实现了动态更新页面的效果。此外，htmx 还支持一些高级特性，如服务器推送、表单验证、动画效果等，可以帮助开发者更加方便地实现复杂的交互效果。

## 应用场景
htmx适用于各种Web应用场景，包括单页应用程序、动态表单验证、实时更新和数据展示等。它可以用于改善用户界面的交互性，提供更流畅的用户体验，并减少对服务器的不必要请求，从而提高性能和响应速度。

## 安装
- **script**: [htmx](https://unpkg.com/htmx.org@2.0.3)
- **npm**: ```npm install htmx.org --save```

## api
##### AJAX 请求:
- `hx-get`: 向给定的 `URL` 发出 `get` 请求
- `hx-post`: 向给定的 `URL` 发出 `post` 请求
- `hx-put`: 向给定的 `URL` 发出 `put` 请求
- `hx-patch`: 向给定的 `URL` 发出 `patch` 请求
- `hx-delete`: 向给定的 `URL` 发出 `delete` 请求
```html
<button hx-put="/messages">
    Put To Messages
</button>
```

- `hx-vals`: 请求参数，以JSON格式指定
```html
<button hx-trigger="click" hx-post="/messages" hx-vals='{"id": 1, "name": "John"}'>
    Post To Messages
</button>
```
在上面的例子中，当按钮被点击时，会触发一个 `post` 请求到 `/messages` URL，并且请求体中包含 `id` 和 `name` 两个参数。


- `hx-swap`: 响应处理，指定如何处理服务器响应。
```html
<div hx-get="/messages" hx-swap="outerHTML">
    <h1>Messages</h1>
    <ul id="messages"></ul>
</div>
```
在上面的例子中，当 `hx-get` 请求成功返回时，会将响应内容替换 `div` 元素的内容。


- `hx-headers`: 请求头，以JSON格式指定
```html
<button hx-trigger="click" hx-post="/messages" hx-headers='{"Authorization": "Bearer token"}'>
    Post To Messages
</button>
```


- `hx-timeout`: 请求超时时间，以毫秒为单位
```html
<button hx-trigger="click" hx-post="/messages" hx-timeout="5000">
    Post To Messages
</button>
```


- `hx-retry`: 请求重试次数，以毫秒为单位
```html
<button hx-trigger="click" hx-post="/messages" hx-retry="3">
    Post To Messages
</button>
```


- `hx-redirect`: 请求重定向，指定重定向的URL
```html
<button hx-trigger="click" hx-post="/messages" hx-redirect="/success">
    Post To Messages
</button>
```


- `hx-animation`: 请求动画，指定动画效果
```html
<button hx-trigger="click" hx-post="/messages" hx-animation="fade-in">
    Post To Messages
</button>
```


- `hx-verify`: 请求验证，指定验证函数
```html
<button hx-trigger="click" hx-post="/messages" hx-verify="verifyForm">Post To Messages</button>
<button hx-trigger="click" hx-post="/messages" hx-verify="return confirm('Are you sure?')">
    Post To Messages
</button>
```
在上面的例子中，当按钮被点击时，会触发一个 `post` 请求到 `/messages` URL，并且会先执行 `verifyForm` 函数进行验证，如果验证通过，则发送请求，否则不发送请求。


- `hx-error`: 请求错误处理，指定错误处理函数
```html
<button hx-trigger="click" hx-post="/messages" hx-error="handleError">Post To Messages</button>
```
##### 触发器
- `input` `textarea` `select`: 触发`change`事件
- `form`: 由`submit`事件触发
- 其余一切都由事件`click`触发

如果需要自定义触发器，可以使用`hx-trigger`属性，并指定触发器名称和触发器参数。例如：
```html
<button hx-trigger="click" hx-post="/messages">
    Post To Messages
</button>
```
在上面的例子中，当按钮被点击时，会触发一个 `post` 请求到 `/messages` URL。

- 修饰符
    - once: 只触发一次
    - changed: 当值发生变化时触发
    - delay:(time interval): 延迟触发，例如，`delay:500` 表示延迟 500 毫秒再触发。
    - throttle:(time interval): 节流触发，例如，`throttle:500` 表示每 500 毫秒触发一次。
    - from:(CSS Selector) 指定触发器从哪个元素触发，可用于键盘快捷键等。例如，`from:button` 表示从按钮元素触发。
    ```html
    <input type="text" name="q"
        hx-get="/trigger_delay"
        hx-trigger="keyup changed delay:500ms"
        hx-target="#search-results"
        placeholder="Search...">
    <div id="search-results"></div>
    ```

