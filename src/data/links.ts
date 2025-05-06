// 导航链接数据类型定义
export interface Link {
    id: string;
    title: string;
    url: string;
    icon?: string;
    description?: string;
}

export interface Category {
    id: string;
    name: string;
    links: Link[];
}

// 示例导航链接数据
const categories: Category[] = [
    {
        id: 'productivity',
        name: '生产力工具',
        links: [
            {
                id: 'notion',
                title: 'Notion',
                url: 'https://www.notion.so',
                icon: '📝',
                description: '多功能笔记和知识管理工具'
            },
            {
                id: 'todoist',
                title: 'Todoist',
                url: 'https://todoist.com',
                icon: '✅',
                description: '任务管理工具'
            },
            {
                id: 'calendar',
                title: 'Google Calendar',
                url: 'https://calendar.google.com',
                icon: '📅',
                description: '日程管理工具'
            }
        ]
    },
    {
        id: 'development',
        name: '开发资源',
        links: [
            {
                id: 'github',
                title: 'GitHub',
                url: 'https://github.com',
                icon: '💻',
                description: '代码托管与版本控制平台'
            },
            {
                id: 'stackoverflow',
                title: 'Stack Overflow',
                url: 'https://stackoverflow.com',
                icon: '🔍',
                description: '程序员问答社区'
            },
            {
                id: 'mdn',
                title: 'MDN Web Docs',
                url: 'https://developer.mozilla.org',
                icon: '📚',
                description: 'Web开发文档资源'
            }
        ]
    },
    {
        id: 'entertainment',
        name: '娱乐',
        links: [
            {
                id: 'youtube',
                title: 'YouTube',
                url: 'https://www.youtube.com',
                icon: '🎬',
                description: '视频分享平台'
            },
            {
                id: 'netflix',
                title: 'Netflix',
                url: 'https://www.netflix.com',
                icon: '🍿',
                description: '流媒体视频服务'
            },
            {
                id: 'spotify',
                title: 'Spotify',
                url: 'https://www.spotify.com',
                icon: '🎵',
                description: '音乐流媒体服务'
            }
        ]
    },
    {
        id: 'social',
        name: '社交媒体',
        links: [
            {
                id: 'twitter',
                title: 'Twitter',
                url: 'https://twitter.com',
                icon: '🐦',
                description: '社交媒体平台'
            },
            {
                id: 'linkedin',
                title: 'LinkedIn',
                url: 'https://www.linkedin.com',
                icon: '👔',
                description: '职业社交网络'
            },
            {
                id: 'instagram',
                title: 'Instagram',
                url: 'https://www.instagram.com',
                icon: '📸',
                description: '图片分享社交平台'
            }
        ]
    }
];

export default categories; 