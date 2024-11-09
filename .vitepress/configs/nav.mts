/*
  顶部导航
  导航链接也可以是下拉菜单。在选项上设置items键。
  link：实际md文件的路径，不带.md后缀，并始终以/开头。如果在链接末尾添加尾部斜杠，它将显示相应目录的index.md。（以srcDir目录为基础）
  高亮：默认只有当前页面与link相同时才会高亮。为使该导航下的所有页面都可以高亮，需使用activeMatch自定义匹配路径
  注意：activeMatch 应该是正则表达式字符串，但必须将其定义为字符串。不能在这里使用实际的 RegExp 对象，因为它在构建期间不可序列化。
*/
export const nav = [
    { 
        text: '🔥 编程导航', 
        items: [
            { 
                text: '🚀 教程分享', 
                link: '/courses/'
            },
            { 
                text: '📚 学习笔记', 
                link: '/notes/'
            },
            { 
                text: '⛑️ 工作记录', 
                link: '/works/'
            },
        ]
    },
    {
        text: '🎨 关于我',
        link:'/about.md'
    }
];