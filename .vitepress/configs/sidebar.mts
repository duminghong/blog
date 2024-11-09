/*
  侧边栏：数组形式的侧边栏是固定的，路径变化则高亮不同的菜单
  侧边栏菜单最简单的形式是传递单个链接数组。第一级定义侧边栏的"部分"。它应该包含text（该部分的标题）和items（实际的导航链接）。（最多 6 层深度）
  link：实际md文件的路径，不带.md后缀，并始终以/开头。如果在链接末尾添加尾部斜杠，它将显示相应目录的index.md。（以srcDir目录为基础）
  高亮：当前页面与link相同时才会高亮。

  多个侧边栏：可以根据页面路径显示不同的侧边栏。最常用的是根据顶部导航设置不同的侧边栏
  应该传递一个对象而不是数组

  可折叠侧边栏组：向侧边栏组添加collapsed选项，它会显示一个切换按钮来隐藏/显示每个部分。默认是false（打开）。如果要默认折叠，则设为true
*/
import { generateSidebar } from "vitepress-sidebar";
const vitepressSidebarOptions = { 
    documentRootPath: "/docs/",
    excludePattern: ['**/about.md','**/README.md','**/index.md'], 
    
    collapsed: false, //折叠组关闭 
    collapseDepth: 2, //折叠组2级菜单 

    removePrefixAfterOrdering: true, //删除前缀，必须与prefixSeparator一起使用
    prefixSeparator: ".", //删除前缀的符号
};
export const sidebar = generateSidebar([
    {
        ...vitepressSidebarOptions,
        scanStartPath: 'notes',
        resolvePath: '/notes/',
        rootGroupText: '学习笔记'
    },
    {
        ...vitepressSidebarOptions,
        scanStartPath: 'courses',
        resolvePath: '/courses/',
        rootGroupText: '教程分享'
    },
    {
        ...vitepressSidebarOptions,
        scanStartPath: 'works',
        resolvePath: '/works/',
        rootGroupText: '工作记录'
    }
]);