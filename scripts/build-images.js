#!/usr/bin/env node

/**
 * 构建脚本：为所有博客文章生成封面图片
 * 可以在构建前运行此脚本，确保所有文章都有封面图片
 */

// 导入必要的模块
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import unsplashConfig from '../src/data/unsplash.js';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取Unsplash API配置
const UNSPLASH_API_CONFIG = unsplashConfig.unsplash || {
    accessKey: '',
    searchEndpoint: 'https://api.unsplash.com/search/photos',
    perPage: 30,
    coverImageFolder: 'public/cover-images',
    imageWidth: 1200,
    imageHeight: 630,
    cropMode: 'entropy'
};

// 确保封面图片目录存在
function ensureCoverImageDirExists() {
    if (!fs.existsSync(UNSPLASH_API_CONFIG.coverImageFolder)) {
        fs.mkdirSync(UNSPLASH_API_CONFIG.coverImageFolder, { recursive: true });
    }
}

// 检查封面图片是否已存在
function coverImageExists(postId) {
    return fs.existsSync(path.join(UNSPLASH_API_CONFIG.coverImageFolder, `${postId}.jpg`));
}

// 获取封面图片的URL路径
function getCoverImagePath(postId) {
    return `/cover-images/${postId}.jpg`;
}

// 获取Unsplash图片并保存
async function fetchAndSaveCoverImage(postId, query = 'technology') {
    ensureCoverImageDirExists();

    // 如果图片已存在，直接返回路径
    if (coverImageExists(postId)) {
        return getCoverImagePath(postId);
    }

    try {
        // 生成随机页码 (1-10)
        const randomPage = Math.floor(Math.random() * 10) + 1;

        // 构建API请求URL，添加随机页码和排序方式
        const sortOptions = ['relevant', 'latest'];
        const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)];

        const url = `${UNSPLASH_API_CONFIG.searchEndpoint}?query=${encodeURIComponent(UNSPLASH_API_CONFIG.query)}&per_page=${UNSPLASH_API_CONFIG.perPage}&page=${randomPage}&order_by=${randomSort}&orientation=landscape`;

        // 发送API请求
        const response = await fetch(url, {
            headers: {
                Authorization: `Client-ID ${UNSPLASH_API_CONFIG.accessKey}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error('未找到图片');
        }

        // 随机选择一张图片
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const rawImageUrl = data.results[randomIndex].urls.raw;

        // 构建带尺寸和裁剪参数的URL
        const imageUrl = `${rawImageUrl}&w=${UNSPLASH_API_CONFIG.imageWidth}&h=${UNSPLASH_API_CONFIG.imageHeight}&fit=crop&crop=${UNSPLASH_API_CONFIG.cropMode}`;

        // 下载并保存图片
        await downloadImage(imageUrl, `${postId}.jpg`);

        return getCoverImagePath(postId);
    } catch (error) {
        console.error('获取Unsplash图片时出错:', error);
        return ''; // 出错时返回空字符串
    }
}

// 下载图片函数
function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(UNSPLASH_API_CONFIG.coverImageFolder, filename);
        const fileStream = fs.createWriteStream(filePath);

        https
            .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`下载失败，HTTP状态码: ${response.statusCode}`));
                    return;
                }

                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
            })
            .on('error', (error) => {
                reject(error);
            });

        fileStream.on('error', (error) => {
            reject(error);
        });
    });
}

// 从content文件夹读取博客文章
async function getAllBlogPosts() {
    // 博客文章存储路径
    const blogPath = path.join(process.cwd(), 'src', 'content', 'blog');

    try {
        // 读取目录内容
        const files = fs.readdirSync(blogPath);

        // 过滤出.md和.mdx文件
        const mdFiles = files.filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));

        // 返回文件名作为ID（不包含扩展名）
        return mdFiles.map((file) => path.parse(file).name);
    } catch (error) {
        console.error('读取博客文章失败:', error);
        return [];
    }
}

/**
 * 预构建所有博客文章的封面图片
 */
async function preBuildAllCoverImages() {
    console.log('开始生成所有博客文章的封面图片...');

    try {
        // 获取所有博客文章ID
        const allBlogPostIds = await getAllBlogPosts();
        console.log(`找到 ${allBlogPostIds.length} 篇博客文章`);

        // 记录处理结果
        let existingCount = 0;
        let generatedCount = 0;
        let errorCount = 0;

        // 处理每篇文章
        for (const postId of allBlogPostIds) {
            try {
                // 检查是否已有封面图片
                if (coverImageExists(postId)) {
                    existingCount++;
                    continue;
                }

                // 使用文章ID作为搜索关键词
                console.log(`为文章 '${postId}' 生成封面图片`);

                // 获取并保存封面图片
                await fetchAndSaveCoverImage(postId);
                generatedCount++;

                // 短暂延迟，避免 API 速率限制
                await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`为文章 '${postId}' 生成封面图片失败:`, error);
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
            totalCount: allBlogPostIds.length
        };
    } catch (error) {
        console.error('生成封面图片过程中出错:', error);
        throw error;
    }
}

// 主函数
async function main() {
    console.log('====== 开始构建博客文章封面图片 ======');

    try {
        // 生成所有封面图片
        const result = await preBuildAllCoverImages();

        console.log('====== 封面图片构建完成 ======');
        console.log('统计信息:');
        console.log(`- 总文章数: ${result.totalCount}`);
        console.log(`- 已有封面图片: ${result.existingCount}`);
        console.log(`- 新生成封面图片: ${result.generatedCount}`);
        console.log(`- 失败: ${result.errorCount}`);

        // 如果有错误，提示但不终止构建
        if (result.errorCount > 0) {
            console.warn(`警告: ${result.errorCount} 篇文章的封面图片生成失败，请查看日志以获取详细信息。`);
        }

        // 成功完成
        process.exit(0);
    } catch (error) {
        console.error('封面图片构建过程中发生错误:');
        console.error(error);
        process.exit(1);
    }
}

// 执行主函数
main();
