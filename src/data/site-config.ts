export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

<<<<<<< HEAD
=======


>>>>>>> 4bc333f (feat: update blog)
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
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    postsPerPage?: number;
    projectsPerPage?: number;
    friends: Friend[];
};

const siteConfig: SiteConfig = {
    title: 'MongoRolls',
    subtitle: 'a Frontend Engineer',
    description: 'Blog by MongoRolls',
    logo: {
        src: '/logo.png'
    },
    image: {
        src: '/logo.png',
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
        }
    ],
<<<<<<< HEAD
    footerNavLinks: [
        {
            text: 'About',
            href: '/about'
        },
    ],
=======
>>>>>>> 4bc333f (feat: update blog)
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
            src: '/tech/netease-b.webp',
            alt: 'wcis kawaii'
        },
        actions: [
            {
                text: '👋 About Me',
                href: '/about'
            }
        ]
    },
<<<<<<< HEAD
    postsPerPage: 4,
=======
    postsPerPage: 6,
>>>>>>> 4bc333f (feat: update blog)
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
            tags: ['字节预备', '小鹅通', '后端'],
            github: 'https://github.com/dbinggo'
        }
    ] as Friend[]
};

export default siteConfig;
