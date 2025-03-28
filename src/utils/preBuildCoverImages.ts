import { getCollection } from 'astro:content';
import { fetchAndSaveCoverImage, coverImageExists } from './unsplashCover';

/**
 * 预构建所有博客文章的封面图片
 * 可以在构建过程中运行此函数，确保所有文章都有封面图片
 */
export async function preBuildAllCoverImages() {
  console.log('开始生成所有博客文章的封面图片...');
  
  try {
    // 获取所有博客文章
    const allBlogPosts = await getCollection('blog');
    console.log(`找到 ${allBlogPosts.length} 篇博客文章`);
    
    // 记录处理结果
    let existingCount = 0;
    let generatedCount = 0;
    let errorCount = 0;
    
    // 处理每篇文章
    for (const post of allBlogPosts) {
      try {
        // 检查是否已有封面图片
        if (coverImageExists(post.id)) {
          console.log(`文章 '${post.id}' 已有封面图片`);
          existingCount++;
          continue;
        }
        
        // 根据文章标题或标签作为搜索关键词
        const searchQuery = post.data.tags ? post.data.tags.join(' ') : post.data.title;
        console.log(`为文章 '${post.id}' 生成封面图片，关键词: ${searchQuery}`);
        
        // 获取并保存封面图片
        await fetchAndSaveCoverImage(post.id, searchQuery);
        generatedCount++;
        
        // 短暂延迟，避免 API 速率限制
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`为文章 '${post.id}' 生成封面图片失败:`, error);
        errorCount++;
      }
    }
    
    // 输出处理结果
    console.log('封面图片生成完成!');
    console.log(`已有封面图片: ${existingCount}`);
    console.log(`新生成封面图片: ${generatedCount}`);
    console.log(`失败: ${errorCount}`);
    
    return {
      existingCount,
      generatedCount,
      errorCount,
      totalCount: allBlogPosts.length
    };
  } catch (error) {
    console.error('生成封面图片过程中出错:', error);
    throw error;
  }
} 