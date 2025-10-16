import { defineConfig } from 'vitepress'
import { nav, sidebar, algolia } from './configs'
import { withMermaid } from 'vitepress-plugin-mermaid'
import UnoCSS from 'unocss/vite'
import JSON5 from 'json5'

// https://vitepress.dev/reference/site-config
export default defineConfig(withMermaid({
  // 全局title，标签页标题。若站点有title，则该全局title为后缀。若站点没有title，则该全局title就为整个标题
  // 首页标题：index.md的title | 全局title。其他页标题：第一个<h1>标头的文本内容 | 全局title
  title: "Duminghong",

  // 自定义标题后缀（覆盖上面的title），或自定义整个标题。有:title符号-自定义整个标题。为false-禁止标题后缀
  titleTemplate: ':title - Duminghong',

  // 网站的描述。页面 HTML 中呈现为<meta>标记。
  description: "我不二，我很纯洁。",

  // 站点的 lang 属性。页面 HTML 中呈现为<html lang="en-US">标记。
  lang: 'cn-ZH',

  // 站点将部署到的基本 URL。始终以斜线开头和结尾
  base: '/',

  // 当设置为true时，VitePress 将从 URL 中删除尾随的.html（启用此功能可能需要在您的托管平台上进行额外配置。为了让它工作，您的服务器必须能够在访问/foo时提供/foo.html而无需重定向。）
  cleanUrls: true,

  // 源目录（包括运行时和打包时使用的目录）：Markdown 源文件所在的位置，默认是项目根目录。将已该目录为基础搜寻.md文件进行构建
  srcDir: './docs',

  // 构建时，不构建哪些md文件
  srcExclude: ['**/README.md'],

  // 站点的打包构建输出位置，相对于项目根目录。默认: ./.vitepress/dist
  // outDir: './dist',

  // 打包后用于存放资源文件的目录。默认：assetsDir
  // assetsDir: 'static',

  // 缓存文件的目录，相对于项目根目录。默认: ./.vitepress/cache
  // cacheDir: './.vitepress/.vite',

  // 当设置为true时，VitePress 不会因死链接而导致构建失败
  // ignoreDeadLinks:true,

  // 主题:默认: true。是否启用深色模式（通过将.dark类添加到<html>元素）。true-启用深色，dark-默认深色，false-禁止切换
  // appearance: true,
  sitemap: {
    hostname: 'https://blog.duminghong.com/'
  },

  // 是否使用 Git 获取每个页面的最后更新时间戳。时间戳将包含在每个页面的页面数据中，可通过 useData 访问。
  lastUpdated: true,

  // Vite配置
  vite: {
    plugins: [
      UnoCSS()
    ]
  },

  /*
   * 配置 Markdown 解析器选项。 VitePress 使用 Markdown-it 作为解析器
   */
  markdown: {
    // 自定义主体的语法突出显示，使用已有的主题
    theme: {
      light: 'vitesse-light',
      dark: 'vitesse-dark'
    },
    // 代码块显示行号
    lineNumbers: true,
    // markdown-it-anchor 插件的 options
    anchor: {
      slugify(str) {
        return encodeURIComponent(str)
      }
    },

    // 配置Markdown-it实例
    config(md) {
      // md.use(componentPreview)
      // md.use(containerPreview)

      // 自定义代码块渲染规则
      const defaultFence = md.renderer.rules.fence;
      md.renderer.rules.fence = function (tokens, idx, options, env, self) {
        const token = tokens[idx];
        const info = token.info.trim();

        // 检查是否是自定义代码块
        if (info.includes('codeRunTask')) {
          // 解析参数
          const params = info.split(' ');
          const language = params.length > 0 ? params[0] : 'javascript';
          const title = params.length > 2 ? params[2] : '';

          // 获取数据
          let data = {};
          // 从token.content中提取数据
          const content = token.content;
          if (content) {
            // 提取JSON格式的数据块，支持对象和数组
            const jsonMatch = content.match(/---\s*\ndata:\s*(\{[\s\S]*?\}|\[[\s\S]*?\])\s*---\n?/);
            // 只有在找到匹配的数据块时才执行替换操作
            if (jsonMatch) {
              // 将content去掉匹配的数据块
              const cleanedContent = content.replace(jsonMatch[0], '');
              tokens[idx].content = cleanedContent;

              try {
                // 使用JSON5解析，支持单引号、注释、尾随逗号等非标准JSON格式
                // 先移除控制字符和不间断空格
                let cleanedJson = jsonMatch[1]
                  .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
                  .replace(/\u00A0/g, ' '); // 将不间断空格替换为普通空格

                // 使用JSON5解析
                data = JSON5.parse(cleanedJson);
              } catch (e) {
                console.error('JSON5解析失败:', e);
                console.error('原始数据:', jsonMatch[1]);
              }
            }
          }

          // 使用默认的代码高亮处理
          const highlightedCode = defaultFence.call(self, tokens, idx, options, env, self);

          // 返回自定义组件的HTML，包含高亮代码和数据
          // 使用Base64编码HTML内容和数据，避免属性中的特殊字符问题
          // 使用UTF-8编码确保中文字符正确处理
          const highlightedCodeBase64 = Buffer.from(highlightedCode, 'utf8').toString('base64');
          const dataBase64 = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');

          return `<CodeRunTask title="${title}" language="${language}" data-base64="${dataBase64}" highlighted-code-base64="${highlightedCodeBase64}"></CodeRunTask>`;
        }

        // 如果不是自定义代码块，使用默认渲染
        return defaultFence(tokens, idx, options, env, self);
      };
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // 导航栏左侧的标题之前的logo。接受路径字符串或对象来为亮/暗模式设置不同的logo。
    logo: {
      light: '/logo_light.png',
      dark: '/logo_dark.png'
    },

    // 导航栏左侧的标题（默认引用 config.title 值的站点标题）
    siteTitle: "Blog",

    // 导航菜单项的配置
    nav,

    // 侧边栏菜单项的配置
    sidebar,

    search: {
      provider: 'algolia',
      options: algolia
    },

    // false可防止渲染旁路容器，true会将旁边渲染到右侧，left会将一侧呈现在左侧（默认值: true）
    aside: true,

    // 在大纲中显示的标题级别。（默认值: 2）'deep'等于[2, 6]，表示除h1之外的所有标题级别都显示在大纲中
    outline: 'deep',

    // 自定义右侧边栏的标题（位于大纲链接的顶部）（默认值: On this page）
    outlineTitle: '当前页导航',

    // 定义此选项以在导航中显示带有图标的社交帐户链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/duminghong/blog' }
    ],

    // 页脚配置。您可以在页脚上添加消息或版权文本，但是，只有当页面不包含侧边栏时才会显示它。这是由于设计方面的考虑。（注意：当 SideBar 可见时，页脚将不会显示。）
    footer: {
      message: '创作不易请尊重他人劳动成果，转载请注明出处',
      copyright: `Copyright © 2013-${new Date().getFullYear()} duminghong.com <a class="foot-link" href="https://beian.miit.gov.cn" target="_blank">京ICP备15049230号-1</a>`
    },

    // 自定义最后更新文本和日期格式。
    lastUpdated: {
      text: '上次更新时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },

    // 可用于自定义上一个和下一个链接上方显示的文本。也可用于全局禁用上一个/下一个链接。
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },

    // 可用于自定义深色模式开关标签。该标签仅显示在移动视图中。（移动端）（默认值: Appearance）
    darkModeSwitchLabel: '切换主题',

    // 可用于自定义侧边栏菜单标签。该标签仅显示在移动视图中。（默认值: Menu）
    sidebarMenuLabel: '菜单',

    // 可用于自定义返回顶部按钮的标签。该标签仅显示在移动视图中。（默认值: Return to top）
    returnToTopLabel: '返回顶部',

    // 是否在Markdown中的外部链接旁显示外部链接图标。
    externalLinkIcon: true,

    // 可用于自定义导航栏中语言切换按钮的 aria-label。仅当您使用 i18n 时才使用此选项。（默认值: Change language）
    langMenuLabel: '切换语言'
  },

  // 打包完成前钩子（执行一次）
  async buildEnd(siteConfig) {
    // console.log('打包结束执行')
  },

  /*
   * 构建钩子，在 SSG 渲染完成时调用。它将允许您在 SSG 期间处理传送内容。(每一个md文件构建成html文件时的钩子，content是构建后的html内容。要构建多少个md就执行多少次)
   * 注意：打包时才会执行。
   */
  async postRender(context) {
    // console.log('执行---------每个md文件打包构建时都会执行')
    // ...
  },

  /*
   * 构建钩子，用于在生成每个页面之前转换头部。它将允许您添加无法静态添加到 VitePress 配置中的头条目
   * 注意：打包时才会执行。
   */
  async transformHead(context) {
    // context：是整个配置，可以在打包时动态修改head配置（不要改变 context 内的任何内容。）
    // 只需返回要增加的head配置，它们将自动与现有条目合并
    // console.log('返回需要动态增加的head配置')
  },

  /*
   * 构建钩子，用于在保存到磁盘之前转换每个页面的内容
   * 注意：打包时才会执行。
   */
  async transformHtml(code, id, context) {
    // console.log('id: ', id); // html文件名
    // console.log('code: ', code); // html代码
    // ...
  },

  /*
   * 是一个用于转换每个页面的 pageData 的钩子。您可以直接改变 pageData 或返回更改后的值，这些值将合并到 PageData 中
   * 注意：只有该钩子运行和打包时都会执行。
   */
  async transformPageData(pageData, { siteConfig }) {
    // 初始化打开新页面就会执行，类似与vue的mounted钩子
    // pageData.title = pageData.title + '**-*！'
  },
}))
