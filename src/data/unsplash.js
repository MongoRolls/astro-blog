const unsplashConfig = {
    // Unsplash API配置
    unsplash: {
        // 直接泄露，感觉没什么用（
        accessKey: 'jVPuYBnhE6EPu3velt7izC6cwJgO2Ttk_0VvwRAr0ms',
        searchEndpoint: 'https://api.unsplash.com/search/photos',
        perPage: 30, // 增加每页返回数量以随机选择
        coverImageFolder: 'public/cover-images',
        imageWidth: 1200,
        imageHeight: 630, // 16:9的比例适合卡片
        cropMode: 'entropy', // 智能裁剪，保留图片中最重要的部分
        // 搜索关键词列表 - 动漫风格、明亮色彩、二次元、无真实人类、优美风景
        query: 'anime' // 关键词
    }
};

export default unsplashConfig;
