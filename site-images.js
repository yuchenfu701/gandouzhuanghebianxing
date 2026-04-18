/**
 * 全站默认图片配置（可改为本地路径或自有 CDN URL）
 * 修改此对象即可统一更换占位图/示例图。
 */
window.SITE_DEFAULT_IMAGES = {
    /** 首页横幅：本地图（勿改） */
    hero: 'hero-home.png',
    /** 简介页：医患沟通 / 健康关怀 */
    introHeader: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=480&h=360&fit=crop&q=80',
    /** 简介内「实用信息」横幅：用药与健康指导 */
    infoBanner: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=640&h=384&fit=crop&q=80',
    /** 医学研究：实验室与科研 */
    research: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=480&h=320&fit=crop&q=80',
    /** 支持我们·致谢区：感恩与社群 */
    donorsDecorative: 'https://images.unsplash.com/photo-1559027615-cd8628902d4a?w=480&h=320&fit=crop&q=80',
    /** 分区等非 news_* 键的兜底图（可改为本地路径） */
    newsDefault: 'https://images.unsplash.com/photo-1504711434969-e33886174f5c?w=480&h=360&fit=crop&q=80',
    /** 角色：患者与家属 */
    rolePatient: 'https://images.unsplash.com/photo-1516627145497-ae989cbd9524?w=240&h=240&fit=crop&q=80',
    /** 角色：医生 */
    roleDoctor: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=240&h=240&fit=crop&q=80',
    /** 角色：研究者 */
    roleResearcher: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=240&h=240&fit=crop&q=80',
    /** 角色：企业 */
    roleCompany: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=240&h=240&fit=crop&q=80',
    /** 捐款二维码：项目内文件 */
    qrDonation: 'f6e6f21e2455a7be1ffbd036a5e3886f.jpg'
};

const SITE_IMAGE_OVERRIDES_KEY = 'siteImageOverrides';
const SITE_IMAGE_ORIGINAL_SRC_KEY = 'siteImageOriginalSrc';

function themeHueBase(theme) {
    const map = {
        gene: 156,
        clinical: 204,
        mrna: 270,
        smallmol: 32,
        pipeline: 212,
        nano: 258,
        guideline: 134,
        consensus: 186,
        oncology: 4,
        comorbid: 228,
        differential: 40,
        default: 142
    };
    return map[theme] !== undefined ? map[theme] : map.default;
}

/** 按主题叠加简单图形，便于区分新闻类型（均为离线 SVG） */
function buildNewsCardShapes(theme) {
    switch (theme) {
        case 'gene':
            return (
                '<path d="M90 200c40-55 80-55 120 0s80 55 120 0 80-55 120 0" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="5"/>' +
                '<path d="M90 220c40 55 80 55 120 0s80-55 120 0 80 55 120 0" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="5"/>'
            );
        case 'clinical':
            return (
                '<rect x="188" y="118" width="104" height="124" rx="14" fill="rgba(255,255,255,0.1)"/>' +
                '<path d="M240 148v52M214 174h52" stroke="rgba(255,255,255,0.28)" stroke-width="6" stroke-linecap="round"/>'
            );
        case 'mrna':
            return (
                '<circle cx="160" cy="200" r="10" fill="rgba(255,255,255,0.2)"/>' +
                '<circle cx="220" cy="170" r="10" fill="rgba(255,255,255,0.18)"/>' +
                '<circle cx="280" cy="200" r="10" fill="rgba(255,255,255,0.2)"/>' +
                '<circle cx="340" cy="230" r="10" fill="rgba(255,255,255,0.16)"/>' +
                '<path d="M170 200 L210 175 L270 200 L330 225" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>'
            );
        case 'smallmol':
            return (
                '<polygon points="240,130 290,200 240,270 190,200" fill="none" stroke="rgba(255,255,255,0.26)" stroke-width="4"/>' +
                '<polygon points="320,150 360,200 320,250 280,200" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>'
            );
        case 'pipeline':
            return (
                '<path d="M80 260 L160 200 L240 220 L320 150 L400 170" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>' +
                '<circle cx="160" cy="200" r="8" fill="rgba(255,255,255,0.35)"/>' +
                '<circle cx="320" cy="150" r="8" fill="rgba(255,255,255,0.35)"/>'
            );
        case 'nano':
            return (
                '<circle cx="200" cy="160" r="36" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>' +
                '<circle cx="280" cy="200" r="48" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>' +
                '<path d="M236 160 L264 200" stroke="rgba(255,255,255,0.25)" stroke-width="4"/>'
            );
        case 'guideline':
            return (
                '<rect x="160" y="120" width="160" height="12" rx="3" fill="rgba(255,255,255,0.22)"/>' +
                '<rect x="160" y="150" width="200" height="10" rx="3" fill="rgba(255,255,255,0.14)"/>' +
                '<rect x="160" y="176" width="180" height="10" rx="3" fill="rgba(255,255,255,0.14)"/>' +
                '<rect x="160" y="202" width="140" height="10" rx="3" fill="rgba(255,255,255,0.12)"/>'
            );
        case 'consensus':
            return (
                '<ellipse cx="220" cy="200" rx="56" ry="72" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>' +
                '<ellipse cx="300" cy="200" rx="56" ry="72" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>'
            );
        case 'oncology':
            return (
                '<path d="M260 120c-50 60-50 120 0 180c50-60 50-120 0-180z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.22)" stroke-width="3"/>' +
                '<circle cx="260" cy="210" r="28" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="4"/>'
            );
        case 'comorbid':
            return (
                '<circle cx="210" cy="200" r="70" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>' +
                '<circle cx="290" cy="200" r="70" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>'
            );
        case 'differential':
            return (
                '<circle cx="240" cy="200" r="88" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="4"/>' +
                '<line x1="268" y1="172" x2="312" y2="128" stroke="rgba(255,255,255,0.35)" stroke-width="6" stroke-linecap="round"/>'
            );
        default:
            return (
                '<circle cx="400" cy="70" r="95" fill="rgba(255,255,255,0.08)"/>' +
                '<circle cx="72" cy="288" r="64" fill="rgba(0,0,0,0.07)"/>'
            );
    }
}

/**
 * 新闻卡片配图（纯 SVG data URL；theme 由 window.NEWS_COVER_THEMES['news_id'] 提供）
 * @param {number} newsId
 * @param {string} [theme]
 */
function buildNewsCardPlaceholderDataUrl(newsId, theme) {
    const id = Math.max(1, parseInt(newsId, 10) || 1);
    const t = theme || 'default';
    const base = themeHueBase(t);
    const h1 = (base + id * 4) % 360;
    const h2 = (base + id * 4 + 18) % 360;
    const gid = 'g' + id + '_' + String(t).replace(/[^a-z0-9]/gi, 'x');
    const shapes = buildNewsCardShapes(t);
    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">' +
        '<defs><linearGradient id="' +
        gid +
        '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0%" stop-color="hsl(' +
        h1 +
        ',44%,42%)"/>' +
        '<stop offset="100%" stop-color="hsl(' +
        h2 +
        ',46%,24%)"/>' +
        '</linearGradient></defs>' +
        '<rect width="480" height="360" fill="url(#' +
        gid +
        ')"/>' +
        shapes +
        '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function getSiteImageOverrides() {
    try {
        const raw = localStorage.getItem(SITE_IMAGE_OVERRIDES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function getSiteImageOriginals() {
    try {
        return JSON.parse(localStorage.getItem(SITE_IMAGE_ORIGINAL_SRC_KEY) || '{}');
    } catch (e) {
        return {};
    }
}

function rememberOriginalSiteImageSrc(key, src) {
    if (!key || !src) return;
    const m = getSiteImageOriginals();
    if (!m[key]) {
        m[key] = src;
        localStorage.setItem(SITE_IMAGE_ORIGINAL_SRC_KEY, JSON.stringify(m));
        if (typeof window.wilsonScheduleCloudSyncPush === 'function') {
            window.wilsonScheduleCloudSyncPush();
        }
    }
}

/**
 * 为无 key 的图片分配持久 key（用于管理员全局点选）
 */
function ensureSiteImageKeyForElement(img) {
    if (!img || img.tagName !== 'IMG') return '';
    let key = img.getAttribute('data-site-image');
    if (key) return key;
    key = 'auto_' + Math.random().toString(36).slice(2, 11);
    rememberOriginalSiteImageSrc(key, img.currentSrc || img.src || '');
    img.setAttribute('data-site-image', key);
    return key;
}

function getSiteImageUrl(key) {
    if (!key) return '';
    const overrides = getSiteImageOverrides();
    if (overrides[key]) return overrides[key];
    if (window.SITE_DEFAULT_IMAGES && window.SITE_DEFAULT_IMAGES[key]) {
        return window.SITE_DEFAULT_IMAGES[key];
    }
    if (key.indexOf('news_') === 0) {
        const nid = parseInt(key.replace(/^news_/, ''), 10) || 1;
        const th = (window.NEWS_COVER_THEMES && window.NEWS_COVER_THEMES[key]) || 'default';
        return buildNewsCardPlaceholderDataUrl(nid, th);
    }
    if (key.indexOf('section_') === 0 && window.SITE_DEFAULT_IMAGES && window.SITE_DEFAULT_IMAGES.newsDefault) {
        return window.SITE_DEFAULT_IMAGES.newsDefault;
    }
    const originals = getSiteImageOriginals();
    if (originals[key]) return originals[key];
    return '';
}

/**
 * 保存单张覆盖并刷新 DOM 中对应 data-site-image
 */
function setSiteImageOverride(key, url) {
    const overrides = getSiteImageOverrides();
    if (url === null || url === undefined || url === '') {
        delete overrides[key];
    } else {
        overrides[key] = url;
    }
    try {
        localStorage.setItem(SITE_IMAGE_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (e) {
        console.error('保存图片覆盖失败:', e);
        alert('浏览器存储空间不足，无法保存图片。请尝试缩小图片或使用更短的内容。');
        throw e;
    }
    if (typeof window.wilsonScheduleCloudSyncPush === 'function') {
        window.wilsonScheduleCloudSyncPush();
    }
    applySiteImageToDom(key, url || getSiteImageUrl(key));
}

function clearSiteImageOverride(key) {
    setSiteImageOverride(key, null);
}

function getDefaultImageUrlForKey(key) {
    if (window.SITE_DEFAULT_IMAGES && window.SITE_DEFAULT_IMAGES[key]) {
        return window.SITE_DEFAULT_IMAGES[key];
    }
    const originals = getSiteImageOriginals();
    return originals[key] || '';
}

/**
 * 不含用户覆盖时的「模板」地址（用于判断 DOM 是否已替换）
 */
function getBaseTemplateUrlForKey(key) {
    if (!key) return '';
    if (window.SITE_DEFAULT_IMAGES && window.SITE_DEFAULT_IMAGES[key]) {
        return window.SITE_DEFAULT_IMAGES[key];
    }
    if (key.indexOf('news_') === 0) {
        const nid = parseInt(key.replace(/^news_/, ''), 10) || 1;
        const th = (window.NEWS_COVER_THEMES && window.NEWS_COVER_THEMES[key]) || 'default';
        return buildNewsCardPlaceholderDataUrl(nid, th);
    }
    if (key.indexOf('section_') === 0 && window.SITE_DEFAULT_IMAGES && window.SITE_DEFAULT_IMAGES.newsDefault) {
        return window.SITE_DEFAULT_IMAGES.newsDefault;
    }
    const originals = getSiteImageOriginals();
    return originals[key] || '';
}

function normalizeUrlForCompare(u) {
    if (!u) return '';
    try {
        return new URL(u, document.baseURI || window.location.href).href;
    } catch (e) {
        return u;
    }
}

/**
 * 从当前 DOM 把已显示的图片写回 siteImageOverrides（解决仅改 DOM 未写入或写入失败）
 * 在每次保存 pageStructure 之前调用。
 */
function syncDomImagesToOverridesFromDom() {
    const overrides = getSiteImageOverrides();

    function upsert(key, srcRaw) {
        const src = (srcRaw || '').trim();
        if (!key || !src) return;
        if (src.indexOf('data:image') === 0) {
            overrides[key] = src;
            return;
        }
        const base = getBaseTemplateUrlForKey(key);
        const sN = normalizeUrlForCompare(src);
        const bN = normalizeUrlForCompare(base);
        if (base && sN === bN) {
            delete overrides[key];
            return;
        }
        if (!base && src) {
            overrides[key] = src;
            return;
        }
        overrides[key] = src;
    }

    document.querySelectorAll('[data-site-image]').forEach(function (el) {
        const key = el.getAttribute('data-site-image');
        if (!key) return;
        let src = '';
        if (el.tagName === 'IMG') {
            src = el.currentSrc || el.src || '';
        } else {
            const im = el.querySelector('img');
            if (im) src = im.currentSrc || im.src || '';
        }
        upsert(key, src);
    });

    try {
        localStorage.setItem(SITE_IMAGE_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch (e) {
        console.error('写入 siteImageOverrides 失败（可能超出存储配额）:', e);
        throw e;
    }
    if (typeof window.wilsonScheduleCloudSyncPush === 'function') {
        window.wilsonScheduleCloudSyncPush();
    }
}

/**
 * 从 pageStructure 根对象恢复图片相关 localStorage（与单独键互为备份）
 */
function hydrateSiteImageStateFromPageData(pageData) {
    if (!pageData || !pageData.__siteImageState) return;
    const st = pageData.__siteImageState;
    try {
        const embedded = st.overrides && typeof st.overrides === 'object' ? st.overrides : {};
        const existing = getSiteImageOverrides();
        const merged = Object.assign({}, existing, embedded);
        localStorage.setItem(SITE_IMAGE_OVERRIDES_KEY, JSON.stringify(merged));

        if (st.originals && typeof st.originals === 'object') {
            const exO = getSiteImageOriginals();
            const mergedO = Object.assign({}, exO, st.originals);
            localStorage.setItem(SITE_IMAGE_ORIGINAL_SRC_KEY, JSON.stringify(mergedO));
        }
    } catch (e) {
        console.warn('从页面结构恢复图片状态失败:', e);
    }
}

/**
 * 将已保存的覆盖应用到页面（含 img[data-site-image] 与 .site-visual 内 img）
 */
function applyAllSiteImagesFromStorage() {
    document.querySelectorAll('[data-site-image]').forEach(function (el) {
        const key = el.getAttribute('data-site-image');
        if (!key) return;
        const url = getSiteImageUrl(key);
        if (!url) return;
        if (el.tagName === 'IMG') {
            el.src = url;
        } else {
            const img = el.querySelector('img');
            if (img) img.src = url;
        }
    });
}

function applySiteImageToDom(key, url) {
    if (!key || !url) return;
    document.querySelectorAll('[data-site-image="' + key.replace(/"/g, '') + '"]').forEach(function (el) {
        if (el.tagName === 'IMG') {
            el.src = url;
        } else {
            const img = el.querySelector('img');
            if (img) img.src = url;
        }
    });
    const qrClass = '.qr-image[data-site-image="' + key.replace(/"/g, '') + '"]';
    document.querySelectorAll(qrClass).forEach(function (img) {
        img.src = url;
    });
}

window.getSiteImageUrl = getSiteImageUrl;
window.getSiteImageOverrides = getSiteImageOverrides;
window.setSiteImageOverride = setSiteImageOverride;
window.clearSiteImageOverride = clearSiteImageOverride;
window.getSiteImageOriginals = getSiteImageOriginals;
window.applyAllSiteImagesFromStorage = applyAllSiteImagesFromStorage;
window.applySiteImageToDom = applySiteImageToDom;
window.ensureSiteImageKeyForElement = ensureSiteImageKeyForElement;
window.rememberOriginalSiteImageSrc = rememberOriginalSiteImageSrc;
window.getDefaultImageUrlForKey = getDefaultImageUrlForKey;
window.syncDomImagesToOverridesFromDom = syncDomImagesToOverridesFromDom;
window.hydrateSiteImageStateFromPageData = hydrateSiteImageStateFromPageData;
window.buildNewsCardPlaceholderDataUrl = buildNewsCardPlaceholderDataUrl;
