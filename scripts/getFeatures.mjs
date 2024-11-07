/*
 * @Author: duminghong i@duminghong.com
 * @Date: 2024-11-01 20:15:25
 * @LastEditors: duminghong i@duminghong.com
 * @LastEditTime: 2024-11-07 12:09:15
 * @Description: 
 */
import { marked } from 'marked';
import dayjs from 'dayjs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

const dirs = [
  join(__dirname, 'docs/notes'),
  join(__dirname, 'docs/courses')
];

function getFeatures(count = 3) {
  const fileStats = [];

  dirs.forEach(dir => {
    const files = readdirSync(dir).filter(file => file.endsWith('.md') && file !== 'index.md');
    files.forEach(file => {
      const filePath = join(dir, file);
      const stats = statSync(filePath);
      if (stats.isFile()) {
        fileStats.push({ file, mtime: stats.mtime, dir });
      }
    });
  });

  fileStats.sort((a, b) => b.mtime - a.mtime);

  const recentFiles = fileStats.slice(0, count).map(item => item);

  const features = recentFiles.map(({ file, dir, mtime }) => {
    const filePath = join(dir, file);
    const content = readFileSync(filePath, 'utf-8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    const title = frontmatter ? frontmatter[1].match(/title:\s*(.*)/)[1] : file.replace(/\.md$/, '');

    const htmlContent = marked(content);

    const contentWithoutImages = htmlContent.replace(/<img[^>]*>/g, '');
    const imageMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/);
    const firstImage = imageMatch ? imageMatch[1] : null;

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

    excerpt = excerpt.replace(/<[^>]+>/g, '').trim();

    const formattedTime = dayjs(mtime).format('YYYY-MM-DD HH:mm:ss');

    const source = join(dir).split('/').pop();

    return {
      title,
      details: excerpt,
      link: `/${join(dir).replace(join(__dirname, 'docs'), '').replace(/\\/g, '/')}/${file.replace(/\.md$/, '')}`,
      firstImage,
      time: formattedTime,
      source,
    };
  });

  return features;
}

try {
  const features = getFeatures();

  const targetDir = join(__dirname, '.vitepress/theme/data');
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const outputPath = join(targetDir, 'features.js');
  const fileContent = `export default ${JSON.stringify(features, null, 2)}`;
  writeFileSync(outputPath, fileContent);

  res.status(200).json({ message: `Features generated and saved to ${outputPath}` });
  console.log(`Features generated and saved to ${outputPath}` )
} catch (error) {
  console.log(error.message );
}