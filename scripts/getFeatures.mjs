import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import dayjs from 'dayjs';
import { fileURLToPath } from 'url';

// 扩展 dayjs 功能
// dayjs.extend(timezone);
// dayjs.extend(utc);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
  path.join(process.cwd(), 'docs/notes'),
  path.join(process.cwd(), 'docs/courses')
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
    // const formattedTime = dayjs(mtime).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');
    const formattedTime = dayjs(mtime).format('YYYY-MM-DD HH:mm:ss');

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

// 创建目标目录
const targetDir = path.join(process.cwd(), '.vitepress/theme/data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 生成 JSON 数据
const features = getFeatures();

// 写入文件
const outputPath = path.join(targetDir, 'features.js');
const fileContent = `export default ${JSON.stringify(features, null, 2)}`;
fs.writeFileSync(outputPath, fileContent);
console.log(`Features generated and saved to ${outputPath}`);