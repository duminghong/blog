# Blog

[duminghong's blog](https://blog.duminghong.com/)

## 项目介绍

这是 duminghong 的个人博客，记录了我在技术、生活等方面的思考和分享。

## 依赖

- **详情侧边栏**：使用 [vitepress-sidebar](https://vitepress-sidebar.cdget.com/zhHans/) 生成详细的侧边栏导航。
- **图表系统**： 
  - 使用 [Mermaid](https://mermaid.js.org/) 绘制图表，支持流程图、序列图、类图等。[Mermaid 中文网](https://mermaid.nodejs.cn/)
  - 配置 [vitepress-plugin-mermaid](https://github.com/emersonbottero/vitepress-plugin-mermaid) 插件，实现 `Vitepress` 里图表的渲染。
  - 使用 [svg-pan-zoom](https://github.com/bumbu/svg-pan-zoom) 实现图表的缩放和拖动。
- **评论系统**：使用 [utterances](https://utteranc.es/) 提供 GitHub Issues 评论系统。
- **部署和托管**：使用 [vercel](https://vercel.com/) 进行快速部署和托管。
- **搜索**：使用 [Docsearch](https://docsearch.algolia.com/) 通过 [Algolia](https://algolia.com/) 搜索。