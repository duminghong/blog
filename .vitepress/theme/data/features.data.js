/*
 * @Author: duminghong i@duminghong.com
 * @Date: 2024-11-08 19:22:17
 * @LastEditors: duminghong i@duminghong.com
 * @LastEditTime: 2025-10-02 13:10:39
 * @Description: 
 */
import { createContentLoader } from 'vitepress'
import dayjs from 'dayjs';

function getSource(url) {
  const match = url.match(/^\/([^/]+)\/.*$/);
  return match ? match[1] : null;
}

function getFileName(path) {
  const match = path.match(/\/([^/]+)$/);
  return match ? match[1] : null;
}

export default createContentLoader('**/*.md', {
  includeSrc: true, // 包含原始 markdown 源?
  render: true,     // 包含渲染的整页 HTML?
  /**
   * 如果为 `boolean`，是否解析并包含摘录? (呈现为 HTML)
   *
   * 如果为 `function`，则控制如何从内容中提取摘录
   *
   * 如果为 `string`，则定义用于提取摘录的自定义分隔符
   * 如果 `excerpt` 为 `true`，则默认分隔符为 `---`
   *
   * @see https://github.com/jonschlinkert/gray-matter#optionsexcerpt
   * @see https://github.com/jonschlinkert/gray-matter#optionsexcerpt_separator
   *
   * @default false
   */
  excerpt: true,    // 包含摘录?
  transform(rawData) {
    return rawData.filter(({ url, frontmatter }) => {
      const name = getFileName(url);
      const time = frontmatter.date;
      return name && name !== 'about' && name !== 'index' && time;
    }).sort((a, b) => {
      return +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date)
    }).slice(0, 3).map(({ url, frontmatter, html }) => {
      // 提取第一张图片的链接
      const imageMatch = html.match(/<img[^>]+src="([^">]+)"/);
      const firstImage = imageMatch ? imageMatch[1] : null;

      // 先移除所有图片标签
      const contentWithoutImages = html.replace(/<img[^>]*>/g, '');
      // 提取摘要(取第一段文本，默认如果 `excerpt` 为 `true`，则默认分隔符为 `---`)
      const excerptMatch = contentWithoutImages.match(/<p>([\s\S]*?)<\/p>/g);
      let excerpt = '';
      if (excerptMatch) {
        for (let i = 0; i < excerptMatch.length; i++) {
          const match = excerptMatch[i].match(/<p>([\s\S]*?)<\/p>/);
          if (match && match[1].trim()) {
            excerpt = match[1].trim();
            break;
          }
        }
      }
      // 去掉所有 HTML 标签
      excerpt = excerpt.replace(/<[^>]+>/g, '').trim();
      return {
        title: frontmatter.title || getFileName(url),
        firstImage,
        link: url,
        details: excerpt,
        time: dayjs(frontmatter.date).format('YYYY-MM-DD HH:mm:ss'),
        source: getSource(url)
      }
    })
  }
})
