import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// 扩展 dayjs 功能
dayjs.extend(timezone);
dayjs.extend(utc);

const dirs = [
  path.join(__dirname, '../docs/notes'),
  path.join(__dirname, '../docs/courses')
];

function getFeatures(count = 3) {
  const fileStats = [];

  dirs.forEach(dir => {
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.md') && file !== 'index.md');
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        fileStats.push({ file, mtime: stats.mtime, dir });
      }
    });
  });

  // 按修改时间降序排序
  fileStats.sort((a, b) => b.mtime - a.mtime);

  // 获取最近的 count 篇文章
  const recentFiles = fileStats.slice(0, count).map(item => item);

  const features = recentFiles.map(({ file, dir, mtime }) => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    const title = frontmatter ? frontmatter[1].match(/title:\s*(.*)/)[1] : file.replace(/\.md$/, '');

    // 使用 marked 解析 Markdown 内容
    const htmlContent = marked(content);

    // 先移除所有图片标签
    const contentWithoutImages = htmlContent.replace(/<img[^>]*>/g, '');

    // 提取第一张图片的链接
    const imageMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    const firstImage = imageMatch ? imageMatch[1] : null;

    // 提取摘要
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

    // 将 mtime 转换为中国时区的时间格式
    const formattedTime = dayjs(mtime).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');

    // 新增 source 字段
    const source = path.basename(dir);

    return {
      title,
      details: excerpt,
      link: `/${path.relative(path.join(__dirname, '../docs'), dir).replace(/\\/g, '/')}/${file.replace(/\.md$/, '')}`,
      firstImage,
      time: formattedTime,
      source, // 新增的 source 字段
    };
  });

  return features;
}

export { getFeatures };