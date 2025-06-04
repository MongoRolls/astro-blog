export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
    icon?: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

// Unsplash API配置接口
export interface UnsplashConfig {
    accessKey: string;
    searchEndpoint: string;
    perPage: number;
    coverImageFolder: string;
    imageWidth: number;
    imageHeight: number;
    cropMode: string;
    query: string;
}

export interface Friend {
    avatar: string;
    name: string;
    description: string;
    tags: string[];
    link?: string;
    github?: string;
}

export type SiteConfig = {
    logo?: Image;
    title: string;
    website?: string;
    ossWebsite?: string;
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    postsPerPage?: number;
    projectsPerPage?: number;
    friends: Friend[];
    unsplash?: UnsplashConfig; // 添加Unsplash配置
};

const siteConfig: SiteConfig = {
    title: 'MongoRolls',
    website: 'https://mongorolls.cn',
    ossWebsite: 'https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com/',
    subtitle: 'a Frontend Engineer',
    description: 'Blog by MongoRolls',
    logo: {
        src: '/rspack-logo.png'
    },
    image: {
        src: '/rspack-logo.png',
        alt: 'MongoRolls - Astro.js and Tailwind CSS theme'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        // {
        //     text: 'Projects',
        //     href: '/projects'
        // },
        {
            text: 'Blog',
            href: '/blog'
        },
        {
            text: 'Tags',
            href: '/tags'
        },
        {
            text: 'Friends',
            href: '/friends'
        },
        // {
        //     text: 'RSS',
        //     href: '/rss.xml'
        // }
    ],
    socialLinks: [
        {
            text: 'github',
            href: 'https://github.com/MongoRolls'
        },
        {
            text: 'QQ',
            href: 'http://wpa.qq.com/msgrd?v=3&uin=1467513807&site=qq&menu=yes'
        }
    ],
    hero: {
        title: 'Hi There & Welcome to My Blog',
        text: '在这里我会分享各类技术问题&有趣的算法&生活分享， 欢迎你阅读这些文章，并希望这些文章对你有所启发',
        image: {
            src: 'https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com/img/blog-cover.webp',
            alt: '博客临时封面图'
        },
        actions: [
            {
                text: '👋 About Me',
                href: '/about'
            },
            {
                text: '🪁 To Wiki',
                href: 'https://www.dgutcs.wiki/'
            },
            {
                text: '👀 Markdown Style',
                href: '/style'
            }
        ]
    },
    postsPerPage: 6,
    projectsPerPage: 4,
    friends: [
        {
            avatar: '/friends/hongshen.png',
            name: '红神',
            description: '莞青CTO',
            tags: ['快手', '小黑盒', '后端'],
            github: 'https://github.com/interca/'
        },
        {
            avatar: '/friends/bantang.png',
            name: '半糖',
            description: '开源大佬',
            tags: ['小米', '百度', '后端'],
            github: 'https://github.com/BanTanger'
        },
        {
            avatar: '/friends/jinyu.png',
            name: '金鱼',
            description: 'ab实验室，ak实验室',
            tags: ['字节', '小鹅通', '后端'],
            github: 'https://github.com/dbinggo'
        }
    ] as Friend[],
    // Unsplash API配置
    unsplash: {
        accessKey: 'jVPuYBnhE6EPu3velt7izC6cwJgO2Ttk_0VvwRAr0ms',
        searchEndpoint: 'https://api.unsplash.com/search/photos',
        perPage: 30, // 增加每页返回数量以随机选择
        coverImageFolder: 'public/cover-images',
        imageWidth: 1200,
        imageHeight: 630, // 16:9的比例适合卡片
        cropMode: 'entropy', // 智能裁剪，保留图片中最重要的部分
        query: 'nature landscape'// 搜索关键词
    }
};

export default siteConfig;
