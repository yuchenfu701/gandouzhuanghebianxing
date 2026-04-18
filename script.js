/* ============================================
   页面导航和切换功能
   ============================================ */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initAmbientBackground();
    initAmbientClickRipples();
    initInteractiveCardTilt();
    mergeLegacyInfoContentIntoIntro();
    // 先恢复保存的页面内容
    restoreSavedPages();
    if (typeof applyAllSiteImagesFromStorage === 'function') {
        applyAllSiteImagesFromStorage();
    }

    initNavigation();
    initQuickAccess();
    initNews();
    initNewsArticleModal();
    initArticleEmbedViewer();
    initMemberRoles();
    initDonors();
    initQRModal();

    if (typeof applyAllSiteImagesFromStorage === 'function') {
        applyAllSiteImagesFromStorage();
    }
});

/**
 * 全站底层氛围：追光 + 色块视差（节流）；减少动效时仅保留静态底图
 */
function initAmbientBackground() {
    if (window.__ambientBackgroundBound) {
        return;
    }
    window.__ambientBackgroundBound = true;

    var root = document.documentElement;
    var reduced = false;
    try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e1) {
        reduced = false;
    }

    root.style.setProperty('--ambient-x', '50%');
    root.style.setProperty('--ambient-y', '36%');
    root.style.setProperty('--shift-x', '0px');
    root.style.setProperty('--shift-y', '0px');

    if (reduced) {
        return;
    }

    var raf = null;
    function setPointerGlow(clientX, clientY) {
        var w = Math.max(window.innerWidth, 1);
        var h = Math.max(window.innerHeight, 1);
        var nx = clientX / w - 0.5;
        var ny = clientY / h - 0.5;
        root.style.setProperty('--ambient-x', ((clientX / w) * 100).toFixed(2) + '%');
        root.style.setProperty('--ambient-y', ((clientY / h) * 100).toFixed(2) + '%');
        /* 视差位移（像素），幅度适中 */
        root.style.setProperty('--shift-x', (nx * 42).toFixed(1) + 'px');
        root.style.setProperty('--shift-y', (ny * 36).toFixed(1) + 'px');
    }

    function resetGlow() {
        root.style.setProperty('--ambient-x', '50%');
        root.style.setProperty('--ambient-y', '36%');
        root.style.setProperty('--shift-x', '0px');
        root.style.setProperty('--shift-y', '0px');
    }

    window.addEventListener(
        'mousemove',
        function (e) {
            if (raf !== null) {
                return;
            }
            raf = window.requestAnimationFrame(function () {
                raf = null;
                setPointerGlow(e.clientX, e.clientY);
            });
        },
        { passive: true }
    );

    window.addEventListener('mouseleave', resetGlow, { passive: true });
}

/**
 * 点击空白处出现扩散涟漪（不阻挡链接、表单、弹窗）
 */
function initAmbientClickRipples() {
    if (window.__ambientRippleBound) {
        return;
    }
    var reduced = false;
    try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e2) {
        reduced = false;
    }
    if (reduced) {
        return;
    }

    var fx = document.getElementById('ambientFx');
    if (!fx) {
        return;
    }
    window.__ambientRippleBound = true;

    var skip = 'a, button, input, textarea, select, option, label, [role="dialog"], [role="button"], .nav-item, .toolbar-btn, .news-detail-link, .article-embed-btn, .close, .admin-close, .qr-close, .role-btn, .edit-mode .editable-section, .edit-mode .access-card';

    document.addEventListener(
        'click',
        function (e) {
            if (e.button !== 0) {
                return;
            }
            if (e.target.closest(skip)) {
                return;
            }
            var ring = document.createElement('span');
            ring.className = 'ambient-click-ring';
            ring.style.left = e.clientX + 'px';
            ring.style.top = e.clientY + 'px';
            fx.appendChild(ring);
            window.setTimeout(function () {
                if (ring.parentNode) {
                    ring.parentNode.removeChild(ring);
                }
            }, 700);
        },
        true
    );
}

/**
 * 主内容区卡片随指针轻微 3D 倾斜（精细指针设备；编辑模式关闭）
 */
function initInteractiveCardTilt() {
    if (window.__cardTiltBound) {
        return;
    }
    var reduced = false;
    var finePointer = true;
    try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        finePointer = window.matchMedia('(pointer: fine)').matches;
    } catch (e3) {
        reduced = false;
        finePointer = true;
    }
    if (reduced || !finePointer) {
        return;
    }

    var main = document.getElementById('mainContent');
    if (!main) {
        return;
    }
    window.__cardTiltBound = true;

    var tiltSelector = '.news-card, .access-card, .research-card, .role-card, .info-card, .donor-card';
    var raf = null;
    var lastEl = null;
    var lastMove = { clientX: 0, clientY: 0, card: null };

    function clearTilt(el) {
        if (el && el.style) {
            el.style.transform = '';
        }
    }

    main.addEventListener(
        'mousemove',
        function (e) {
            if (document.body.classList.contains('edit-mode')) {
                clearTilt(lastEl);
                lastEl = null;
                lastMove.card = null;
                return;
            }
            var card = e.target.closest(tiltSelector);
            if (!card || !main.contains(card)) {
                if (lastEl) {
                    clearTilt(lastEl);
                }
                lastEl = null;
                lastMove.card = null;
                return;
            }
            lastMove.clientX = e.clientX;
            lastMove.clientY = e.clientY;
            lastMove.card = card;
            if (raf !== null) {
                return;
            }
            raf = window.requestAnimationFrame(function () {
                raf = null;
                if (document.body.classList.contains('edit-mode')) {
                    return;
                }
                var el = lastMove.card;
                if (!el || !main.contains(el)) {
                    return;
                }
                var rect = el.getBoundingClientRect();
                var px = (lastMove.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
                var py = (lastMove.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
                var maxT = 7;
                var rx = Math.max(Math.min(-py * maxT * 1.2, maxT), -maxT);
                var ry = Math.max(Math.min(px * maxT * 1.4, maxT), -maxT);
                el.style.transform =
                    'perspective(880px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(0)';
                if (lastEl && lastEl !== el) {
                    clearTilt(lastEl);
                }
                lastEl = el;
            });
        },
        { passive: true }
    );

    main.addEventListener(
        'mouseleave',
        function () {
            clearTilt(lastEl);
            lastEl = null;
        },
        { passive: true }
    );

    document.addEventListener(
        'scroll',
        function () {
            clearTilt(lastEl);
            lastEl = null;
        },
        { passive: true, capture: true }
    );
}

/**
 * 将旧版「信息中心」后台文案合并到「简介」并清理独立存储键
 */
function mergeLegacyInfoContentIntoIntro() {
    if (localStorage.getItem('contentMergeInfoToIntroDone') === 'true') return;
    const infoRaw = localStorage.getItem('content_info');
    if (!infoRaw) {
        localStorage.setItem('contentMergeInfoToIntroDone', 'true');
        return;
    }
    try {
        const info = JSON.parse(infoRaw);
        let intro = { title: '', text: '' };
        const introRaw = localStorage.getItem('content_intro');
        if (introRaw) intro = JSON.parse(introRaw);
        const merged = {
            title: intro.title || info.title || '',
            text: (intro.text || '') + (intro.text ? '\n\n' : '') + '【原信息中心板块】\n' + (info.title ? info.title + '\n' : '') + (info.text || '')
        };
        localStorage.setItem('content_intro', JSON.stringify(merged));
        localStorage.removeItem('content_info');
    } catch (e) {
        console.warn('合并信息中心文案失败', e);
    }
    localStorage.setItem('contentMergeInfoToIntroDone', 'true');
}

/**
 * 恢复保存的页面内容
 */
function restoreSavedPages() {
    const savedData = localStorage.getItem('pageStructure');
    if (!savedData) return;
    
    try {
        const pageData = JSON.parse(savedData);

        if (typeof hydrateSiteImageStateFromPageData === 'function') {
            hydrateSiteImageStateFromPageData(pageData);
        }

        Object.keys(pageData).forEach(pageId => {
            if (pageId === '__siteImageState') return;
            const page = document.getElementById(pageId);
            if (!page) return;

            const data = pageData[pageId];
            if (!data || typeof data !== 'object') return;
            
            // 如果保存的是完整HTML
            if (data.html) {
                // 只恢复section的内容和样式，保留页面结构
                if (data.sections && Array.isArray(data.sections)) {
                    data.sections.forEach(sectionData => {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = sectionData.html;
                        const savedSection = tempDiv.firstElementChild;
                        
                        if (savedSection) {
                            // 找到对应的section
                            const sectionId = savedSection.getAttribute('data-section') || savedSection.id;
                            const existingSection = page.querySelector(`[data-section="${sectionId}"]`) || 
                                                   (sectionId ? page.querySelector(`#${sectionId}`) : null);
                            
                            if (existingSection) {
                                // 恢复样式
                                if (sectionData.style) {
                                    existingSection.style.position = sectionData.style.position || '';
                                    existingSection.style.top = sectionData.style.top || '';
                                    existingSection.style.left = sectionData.style.left || '';
                                    existingSection.style.zIndex = sectionData.style.zIndex || '';
                                    existingSection.style.width = sectionData.style.width || '';
                                }
                                
                                // 恢复内容（保留结构，只更新文本内容）
                                const savedTexts = savedSection.querySelectorAll('.editable-title, .editable-text, h1, h2, h3, h4, h5, h6, p');
                                const existingTexts = existingSection.querySelectorAll('.editable-title, .editable-text, h1, h2, h3, h4, h5, h6, p');
                                
                                savedTexts.forEach((savedText, index) => {
                                    if (existingTexts[index]) {
                                        existingTexts[index].textContent = savedText.textContent;
                                        if (savedText.style.color) {
                                            existingTexts[index].style.color = savedText.style.color;
                                        }
                                    }
                                });
                                
                                // 恢复原始位置信息
                                if (sectionData.originalIndex !== undefined && sectionData.originalIndex !== '') {
                                    existingSection.dataset.originalIndex = sectionData.originalIndex;
                                }
                                if (sectionData.originalTopSaved) {
                                    existingSection.dataset.originalTopSaved = sectionData.originalTopSaved;
                                }
                                if (sectionData.originalLeftSaved) {
                                    existingSection.dataset.originalLeftSaved = sectionData.originalLeftSaved;
                                }
                                // 标记已保存原始位置
                                if (sectionData.originalTopSaved || sectionData.originalLeftSaved) {
                                    existingSection.dataset.originalPositionSaved = 'true';
                                }
                            }
                        }
                    });
                }
            }
        });
    } catch (e) {
        console.error('恢复页面内容失败:', e);
    }
}

/**
 * 切换到指定页面（导航栏与快速入口共用）
 * @param {string} targetPage data-page / section id
 * @param {HTMLElement|null} clickedNavItem 若来自顶部导航，传入被点击的 .nav-item 以便高亮一致
 * @returns {boolean} 是否切换成功
 */
function navigateToPage(targetPage, clickedNavItem) {
    if (!targetPage) return false;

    if (targetPage === 'admin') {
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (!isLoggedIn) {
            if (typeof showAdminLogin === 'function') {
                showAdminLogin();
            }
            return false;
        }
    }

    const targetPageElement = document.getElementById(targetPage);
    if (!targetPageElement) return false;

    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const mainContent = document.getElementById('mainContent');

    navItems.forEach(function (nav) {
        nav.classList.remove('active');
    });
    if (clickedNavItem && clickedNavItem.classList && clickedNavItem.classList.contains('nav-item')) {
        clickedNavItem.classList.add('active');
    } else {
        navItems.forEach(function (nav) {
            if (nav.getAttribute('data-page') === targetPage) {
                nav.classList.add('active');
            }
        });
    }

    pages.forEach(function (page) {
        page.classList.toggle('active', page.id === targetPage);
    });

    if (targetPage === 'admin') {
        if (mainContent) {
            mainContent.style.paddingTop = '0';
            mainContent.style.display = 'none';
        }
        if (typeof loadNewsList === 'function') {
            setTimeout(function () {
                loadNewsList();
            }, 100);
        }
    } else {
        if (mainContent) {
            mainContent.style.paddingTop = '';
            mainContent.style.display = '';
        }
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    return true;
}

window.navigateToPage = navigateToPage;

/**
 * 初始化导航功能
 * 处理顶部导航栏的点击事件，实现页面切换
 */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');
            navigateToPage(targetPage, item);
        });
    });
}

/**
 * 初始化快速入口功能
 * 处理首页快速入口卡片的点击事件
 */
function initQuickAccess() {
    const accessCards = document.querySelectorAll('.access-card');

    accessCards.forEach(function (card) {
        card.addEventListener('click', function () {
            /* 编辑模式下不跳转，但不要用 stopPropagation，以便选择工具能收到点击 */
            if (document.body.classList.contains('edit-mode')) {
                return;
            }
            const targetPage = card.getAttribute('data-page');
            navigateToPage(targetPage, null);
        });
    });
}

/* ============================================
   新闻页面功能
   ============================================ */

// 获取新闻数据（从localStorage或使用默认数据）
/**
 * 资讯中心默认目录（与病原所、企业新闻稿、学术期刊等公开信息一致；外链以新窗口打开）
 */
function getDefaultNewsCatalog() {
    return [
        {
            id: 1,
            category: '基因治疗：突破性进展与临床试验',
            title: 'AAV8-tATP7B 基因治疗药物临床前研究证实有效性与安全性',
            description:
                '2026年3月，中国医学科学院病原生物学研究所李武平团队与上海交通大学医学院范建高团队合作研发了一种基于 AAV8 载体的新型基因治疗药物。临床前研究表明，该药物能有效恢复铜稳态、逆转肝损伤，且在跨物种毒性研究中未观察到全身性毒性反应。',
            date: '2026-03-12',
            coverTheme: 'gene',
            links: [{ label: '阅读原文：病原所·科研进展', url: 'https://www.ipbcams.ac.cn/kyjz/3023.html' }]
        },
        {
            id: 2,
            category: '基因治疗：突破性进展与临床试验',
            title: '国产基因疗法 LY-M003 获美国 FDA 批准直接进入临床 II 期',
            description:
                '2025年11月，凌意生物自主研发的 LY-M003 注射液获 FDA 许可直接进入 II 期临床试验。这是全球首个采用铜离子动态调控表达技术的 AAV 基因疗法，其初步临床观察展现出良好的安全性。',
            date: '2025-11',
            coverTheme: 'gene',
            links: [{ label: '阅读原文：凌意生物', url: 'http://www.lingyimed.com/newsinfo/10822750.html' }]
        },
        {
            id: 3,
            category: '基因治疗：突破性进展与临床试验',
            title: '锦篮基因 GC310 注射液启动 I/II 期临床试验',
            description:
                '2025年12月，锦篮基因研发的 AAV 基因治疗药物 GC310 在北京协和医院启动了 I/II 期临床试验，旨在评价其安全性与耐受性。该药物已于同年2月获得国家药监局临床试验许可。',
            date: '2025-12-26',
            coverTheme: 'clinical',
            links: [
                { label: '临床试验启动会报道', url: 'https://www.bj-genecradle.com/news/338' },
                { label: '获国家药监局临床试验许可（IND）', url: 'https://www.bj-genecradle.com/news/276' }
            ]
        },
        {
            id: 4,
            category: '基因治疗：突破性进展与临床试验',
            title: '全球首例青少年患者接受肝豆状核变性基因治疗',
            description:
                '2025年7月，浙江大学医学院附属第一医院成功为一名青少年肝豆状核变性患者完成了基因治疗，这是全球首例。所用药物为 LY-M003，治疗后患者状态良好，未见明显不良反应。',
            date: '2025-08-18',
            coverTheme: 'clinical',
            links: [{ label: '阅读原文：医药魔方转载', url: 'https://bydrug.pharmcube.com/news/detail/bd5a79556f131d4b8af6fcd9a1e050d6' }]
        },
        {
            id: 5,
            category: '基因治疗：突破性进展与临床试验',
            title: '新型 mRNA 疗法 DSL101 临床研究登记',
            description:
                '一项评价 ATP7B 信使核糖核酸/脂质纳米粒（DSL101）治疗肝豆状核变性的临床研究已在中国临床试验注册中心登记。该研究旨在探索通过 mRNA 技术治疗该病的潜力。',
            date: '2025-11-10',
            coverTheme: 'mrna',
            links: [{ label: '查看登记信息（摩熵医药）', url: 'https://www.pharnexcloud.com/data/lcsy_d066ac090d9d47988af0435db6b66409.html' }]
        },
        {
            id: 6,
            category: '新药研发与创新疗法',
            title: '新药 ARBM-101 可快速清除肝脏铜',
            description:
                '一项发表于《Biomedicine & Pharmacotherapy》的研究发现，新型化合物 ARBM-101 能通过胆汁/粪便途径在几分钟内快速清除肝脏中过量的铜，有望用于治疗 WD 引发的急性或慢性肝损伤。',
            date: '2025',
            coverTheme: 'smallmol',
            sourceNote: '英文文献',
            links: [{ label: 'ScienceDirect 论文页', url: 'https://www.sciencedirect.com/science/article/pii/S0753332225010613' }]
        },
        {
            id: 7,
            category: '新药研发与创新疗法',
            title: '靶向铜减少疗法 ALXN1840 完成 III 期临床入组',
            description:
                '根据行业管线分析，阿斯利康旗下 Alexion 公司研发的 ALXN1840 已完成 III 期临床试验入组，它是一种每日一次的口服靶向铜减少疗法；全球另有多个 WD 相关项目在推进。',
            date: '2025',
            coverTheme: 'pipeline',
            sourceNote: '英文资讯',
            links: [
                {
                    label: '阅读原文（MedPath / DelveInsight 等）',
                    url: 'https://trial.medpath.com/news/872f4e53ba884d24/wilson-disease-pipeline-shows-promise-with-alxn1840-completing-phase-iii-trial-and-five-companies-advancing-novel-therapies'
                }
            ]
        },
        {
            id: 8,
            category: '新药研发与创新疗法',
            title: '新型脑靶向纳米药物有望缓解铜中毒',
            description:
                '2025年5月，研究人员开发了一种载脂蛋白 E 包被的脂质体纳米载体，用于递送新型螯合剂 MiADMSA。该制剂能有效穿透血脑屏障，为治疗 WD 的神经系统症状提供了新策略。',
            date: '2025-05-15',
            coverTheme: 'nano',
            links: [{ label: '生物通报道', url: 'https://www.ebiotrade.com/newsf/2025-5/20250515054635851.htm' }]
        },
        {
            id: 9,
            category: '临床指南与专家共识',
            title: '《2025年欧洲肝病学会/欧洲罕见病网络临床实践指南：肝豆状核变性》发布',
            description:
                '2025年4月，欧洲肝病学会发布了最新版肝豆状核变性指南。新版指南对诊断流程、治疗策略等进行了细致更新，特别强调了血清可交换铜在诊断和监测中的地位，并新增了神经精神症状的对症治疗建议。',
            date: '2025-04',
            coverTheme: 'guideline',
            links: [{ label: '摘译（临床肝胆病杂志）', url: 'https://cjournal.hep.com.cn/1001-5256/CN/10.12449/JCH250507' }]
        },
        {
            id: 10,
            category: '临床指南与专家共识',
            title: '《中国肝豆状核变性肾脏损害中西医结合管理专家共识》发布',
            description:
                '2025年，中国中西医结合学会神经科专业委员会发布了该共识。共识由多学科专家共同制定，旨在优化 WD 肾脏损害的诊疗与管理，因为肾脏是 WD 第三大受累器官，但常被忽视。',
            date: '2025-06-11',
            coverTheme: 'consensus',
            links: [{ label: '丁香园用药助手·指南摘要', url: 'https://drugs.dxy.cn/pc/clinicalGuidelines/pOnEgHs9OEmyUlciMqjOZ1A' }]
        },
        {
            id: 11,
            category: '罕见病例报告',
            title: '肝豆状核变性合并原发性肝癌 1 例报告',
            description:
                '肝豆状核变性虽可进展为肝硬化，但在此基础上并发原发性肝癌的病例极为罕见。该报告详细介绍了 1 例此类患者的诊疗经过，并对相关文献进行了回顾。',
            date: '2025-04-30',
            coverTheme: 'oncology',
            sourceNote: '英文摘要 / 中文正文',
            links: [{ label: 'PubMed 条目', url: 'https://pubmed.ncbi.nlm.nih.gov/40331394/' }]
        },
        {
            id: 12,
            category: '罕见病例报告',
            title: '肌萎缩侧索硬化合并潜伏型肝豆状核变性 1 例',
            description:
                '该病例报告了一例 36 岁男性患者同时患有肌萎缩侧索硬化（ALS）和潜伏型肝豆状核变性（WD）的罕见情况，为临床诊治提供了重要参考。',
            date: '2025',
            coverTheme: 'comorbid',
            links: [{ label: '中华医学期刊网', url: 'https://rs.yiigle.com/cmaid/1598747' }]
        },
        {
            id: 13,
            category: '罕见病例报告',
            title: '易误诊为肝豆状核变性的自身免疫性肝炎 1 例',
            description:
                '该病例展示了一名 38 岁女性患者，其血清学检查显示铜蓝蛋白降低、24h 尿铜增高，但最终通过基因检测排除了肝豆状核变性，确诊为自身免疫性肝炎。这提醒临床医生诊断需结合基因检测综合判断。',
            date: '2025',
            coverTheme: 'differential',
            links: [{ label: '梅斯医学病例报道', url: 'https://news.medlive.cn/liver/info-progress/show-232553_35.html' }]
        }
    ];
}

window.getDefaultNewsCatalog = getDefaultNewsCatalog;

/** 早期版本内置的 6 条占位新闻标题（与之一致则自动升级为新版目录） */
var LEGACY_PLACEHOLDER_NEWS_TITLES = [
    '肝豆状核变性新药研究取得重大突破',
    '国际肝豆状核变性日宣传活动成功举办',
    '基因检测技术助力早期诊断',
    '患者支持网络正式上线',
    '肝移植技术为重症患者带来希望',
    '低铜饮食指南更新发布'
];

function isLegacyPlaceholderNewsCatalog(arr) {
    if (!Array.isArray(arr) || arr.length !== LEGACY_PLACEHOLDER_NEWS_TITLES.length) {
        return false;
    }
    for (var i = 0; i < LEGACY_PLACEHOLDER_NEWS_TITLES.length; i++) {
        if (!arr[i] || arr[i].title !== LEGACY_PLACEHOLDER_NEWS_TITLES[i]) {
            return false;
        }
    }
    return true;
}

window.isLegacyPlaceholderNewsCatalog = isLegacyPlaceholderNewsCatalog;

/**
 * 若本地仍为旧版 6 条占位数据，则一次性替换为 getDefaultNewsCatalog 并写回 localStorage
 */
function migrateLegacyNewsInStorageIfNeeded(data) {
    if (!isLegacyPlaceholderNewsCatalog(data)) {
        return data;
    }
    var fresh = getDefaultNewsCatalog();
    try {
        localStorage.setItem('websiteNews', JSON.stringify(fresh));
    } catch (e) {
        console.warn('自动升级新闻目录写入失败（可能存储已满）', e);
        return fresh;
    }
    return fresh;
}

function getNewsData() {
    const stored = localStorage.getItem('websiteNews');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (Array.isArray(data) && data.length > 0) {
                return migrateLegacyNewsInStorageIfNeeded(data);
            }
        } catch (err) {
            console.warn('websiteNews 解析失败，已使用默认新闻列表', err);
        }
    }
    return getDefaultNewsCatalog();
}

/**
 * 渲染新闻列表（供搜索与初始化复用）
 */
function renderNewsList(newsList) {
    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return;

    newsGrid.innerHTML = '';

    if (newsList.length === 0) {
        newsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">未找到相关新闻</p>';
        return;
    }

    window.NEWS_COVER_THEMES = window.NEWS_COVER_THEMES || {};
    newsList.forEach(function (news) {
        window.NEWS_COVER_THEMES['news_' + news.id] = news.coverTheme || 'default';
    });

    newsList.forEach(function (news) {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        newsCard.setAttribute('role', 'button');
        newsCard.setAttribute('tabindex', '0');
        newsCard.dataset.newsId = String(news.id);
        const imgKey = 'news_' + news.id;
        const safeTitle = news.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeDesc = news.description.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeCat = (news.category || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const safeNote = (news.sourceNote || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const catHtml = safeCat ? '<p class="news-card-category">' + safeCat + '</p>' : '';
        const noteHtml = safeNote ? '<span class="news-card-badge">' + safeNote + '</span>' : '';
        const safeAlt = String(news.title || '').replace(/"/g, '&quot;');
        newsCard.innerHTML =
            '<div class="news-image site-visual">' +
            '<img src="" alt="' +
            safeAlt +
            '" data-site-image="' +
            imgKey +
            '" loading="lazy">' +
            '</div>' +
            catHtml +
            '<div class="news-card-title-row">' +
            '<h3>' +
            safeTitle +
            '</h3>' +
            noteHtml +
            '</div>' +
            '<p class="news-card-excerpt">' +
            safeDesc +
            '</p>' +
            '<p class="news-card-date">' +
            news.date +
            '</p>';
        newsGrid.appendChild(newsCard);
    });

    if (typeof applyAllSiteImagesFromStorage === 'function') {
        applyAllSiteImagesFromStorage();
    }
}

/**
 * 初始化新闻页面
 * 生成新闻列表并实现搜索功能
 */
/**
 * 新闻卡片点击打开详情弹窗（事件委托，搜索重绘后仍有效）
 */
function initNewsArticleModal() {
    const grid = document.getElementById('newsGrid');
    const modal = document.getElementById('newsDetailModal');
    if (!grid || !modal || window.__newsArticleModalBound) {
        return;
    }
    window.__newsArticleModalBound = true;

    const titleEl = document.getElementById('newsDetailTitle');
    const dateEl = document.getElementById('newsDetailDate');
    const bodyEl = document.getElementById('newsDetailBody');
    const imgEl = document.getElementById('newsDetailImage');
    const closeBtn = document.getElementById('newsDetailClose');

    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function openForNewsId(id) {
        const list = getNewsData();
        const item = list.find(function (n) {
            return String(n.id) === String(id);
        });
        if (!item || !titleEl || !dateEl || !bodyEl) {
            return;
        }
        titleEl.textContent = item.title;
        dateEl.textContent = item.date || '';
        bodyEl.textContent = '';
        const introP = document.createElement('p');
        introP.className = 'news-detail-intro';
        introP.textContent = item.description || '';
        bodyEl.appendChild(introP);
        if (item.category) {
            const catP = document.createElement('p');
            catP.className = 'news-detail-category';
            catP.textContent = item.category;
            bodyEl.appendChild(catP);
        }
        if (item.sourceNote) {
            const noteP = document.createElement('p');
            noteP.className = 'news-detail-source-note';
            noteP.textContent = item.sourceNote;
            bodyEl.appendChild(noteP);
        }
        if (item.links && item.links.length > 0) {
            const linkWrap = document.createElement('div');
            linkWrap.className = 'news-detail-links';
            item.links.forEach(function (lnk) {
                if (!lnk || !lnk.url) {
                    return;
                }
                const a = document.createElement('a');
                a.href = lnk.url;
                a.className = 'news-detail-link';
                a.setAttribute('role', 'button');
                a.textContent = lnk.label || lnk.url;
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    if (typeof window.openArticleEmbedViewer === 'function') {
                        window.openArticleEmbedViewer(lnk.url, lnk.label || item.title);
                    }
                });
                linkWrap.appendChild(a);
            });
            const linkHint = document.createElement('p');
            linkHint.className = 'news-detail-links-hint';
            linkHint.textContent =
                '点击上方按钮将在本站内全屏打开原文，无需新开浏览器标签；若页面空白，多为对方网站禁止嵌入，请使用「新窗口打开」。';
            linkWrap.appendChild(linkHint);
            bodyEl.appendChild(linkWrap);
        }
        if (imgEl) {
            const key = 'news_' + item.id;
            const url = typeof getSiteImageUrl === 'function' ? getSiteImageUrl(key) : '';
            imgEl.src = url || '';
            imgEl.alt = item.title || '';
        }
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    grid.addEventListener('click', function (e) {
        if (document.body.classList.contains('edit-mode')) {
            return;
        }
        const card = e.target.closest('.news-card');
        if (!card || !grid.contains(card)) {
            return;
        }
        const id = card.dataset.newsId;
        if (id) {
            openForNewsId(id);
        }
    });

    grid.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') {
            return;
        }
        const card = e.target.closest('.news-card');
        if (!card || !grid.contains(card)) {
            return;
        }
        e.preventDefault();
        const id = card.dataset.newsId;
        if (id && !document.body.classList.contains('edit-mode')) {
            openForNewsId(id);
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') {
            return;
        }
        const embed = document.getElementById('articleEmbedModal');
        if (embed && embed.classList.contains('active')) {
            if (typeof window.closeArticleEmbedViewer === 'function') {
                window.closeArticleEmbedViewer();
            }
            return;
        }
        if (modal.classList.contains('active')) {
            closeModal();
        }
    });
}

/**
 * 站内 iframe 打开外链原文（不跳转离开本站；无法嵌入时由用户改用新窗口）
 */
function initArticleEmbedViewer() {
    const modal = document.getElementById('articleEmbedModal');
    const frame = document.getElementById('articleEmbedFrame');
    const closeBtn = document.getElementById('articleEmbedClose');
    const openBlank = document.getElementById('articleEmbedOpenBlank');
    const titleEl = document.getElementById('articleEmbedTitle');
    if (!modal || !frame || window.__articleEmbedViewerBound) {
        return;
    }
    window.__articleEmbedViewerBound = true;

    function restoreBodyScrollIfNoModals() {
        const detail = document.getElementById('newsDetailModal');
        if (!detail || !detail.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }

    function closeArticleEmbedViewer() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        frame.src = 'about:blank';
        restoreBodyScrollIfNoModals();
    }

    window.closeArticleEmbedViewer = closeArticleEmbedViewer;

    window.openArticleEmbedViewer = function (url, titleText) {
        if (!url || !frame) {
            return;
        }
        if (titleEl) {
            titleEl.textContent = titleText || '原文浏览';
        }
        if (openBlank) {
            openBlank.href = url;
        }
        frame.setAttribute('src', url);
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeArticleEmbedViewer);
    }
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeArticleEmbedViewer();
        }
    });
}

function initNews() {
    const searchInput = document.getElementById('newsSearch');

    if (searchInput && !window.__newsSearchInputBound) {
        window.__newsSearchInputBound = true;
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase().trim();
            const newsData = getNewsData();

            if (searchTerm === '') {
                renderNewsList(newsData);
                return;
            }

            const filteredNews = newsData.filter(function (news) {
                const t = (news.title || '').toLowerCase();
                const d = (news.description || '').toLowerCase();
                const c = (news.category || '').toLowerCase();
                const linkHay = (news.links || [])
                    .map(function (l) {
                        return ((l && l.label) || '') + ' ' + ((l && l.url) || '');
                    })
                    .join(' ')
                    .toLowerCase();
                return (
                    t.includes(searchTerm) ||
                    d.includes(searchTerm) ||
                    c.includes(searchTerm) ||
                    linkHay.includes(searchTerm)
                );
            });

            renderNewsList(filteredNews);
        });
    }

    renderNewsList(getNewsData());
}

/**
 * 更新新闻显示（供管理员模块调用）
 */
window.updateNewsDisplay = function () {
    renderNewsList(getNewsData());
};

/* ============================================
   会员中心功能
   ============================================ */

// 不同角色的详细信息
const roleDetails = {
    patient: {
        title: '患者/家属捐赠指南',
        content: `
            <p>作为患者或家属，您的支持对我们来说意义重大。您的捐赠将直接用于：</p>
            <ul>
                <li>支持其他困难患者的医疗费用</li>
                <li>开展患者教育和支持活动</li>
                <li>建立患者互助网络</li>
                <li>提供心理支持和咨询服务</li>
            </ul>
            <p>无论金额大小，每一份捐赠都是对患者群体的关爱。您可以通过扫描捐赠二维码进行捐赠，也可以联系我们的工作人员了解更多方式。</p>
        `
    },
    doctor: {
        title: '医生捐赠指南',
        content: `
            <p>作为医疗专业人士，您的支持推动着医学研究和临床实践的发展。您的捐赠将用于：</p>
            <ul>
                <li>支持医学研究和临床试验</li>
                <li>开展医生培训和学术交流</li>
                <li>建立医疗资源共享平台</li>
                <li>推动诊疗指南的更新和完善</li>
            </ul>
            <p>我们欢迎医疗专业人士以各种形式支持我们的工作，包括资金支持、专业知识分享、临床经验交流等。</p>
        `
    },
    researcher: {
        title: '研究者捐赠指南',
        content: `
            <p>作为研究人员，您的参与促进着科学知识的积累和突破。您的捐赠将用于：</p>
            <ul>
                <li>支持基础研究和应用研究项目</li>
                <li>资助年轻研究人员的科研工作</li>
                <li>组织学术会议和研究交流</li>
                <li>建立研究数据共享平台</li>
            </ul>
            <p>我们欢迎研究机构和个人研究者以资金、设备、数据或专业知识的形式支持我们的研究工作。</p>
        `
    },
    company: {
        title: '企业捐赠指南',
        content: `
            <p>作为企业，您的支持推动着新药研发和医疗技术的进步。您的捐赠将用于：</p>
            <ul>
                <li>支持新药研发和临床试验</li>
                <li>资助医疗器械的研发和改进</li>
                <li>开展患者援助项目</li>
                <li>支持医学教育和培训</li>
            </ul>
            <p>我们欢迎制药企业、医疗器械公司等以资金、药品、设备或技术支持的形式参与我们的工作。我们承诺透明公开地使用每一笔捐赠，并定期公布资金使用情况。</p>
        `
    }
};

/**
 * 初始化会员中心角色选择功能
 */
function initMemberRoles() {
    const roleCards = document.querySelectorAll('.role-card');
    const modal = document.getElementById('roleModal');
    const roleDetailsDiv = document.getElementById('roleDetails');
    const closeBtn = document.querySelector('#roleModal .close');

    if (!modal || !roleDetailsDiv) return;

    // 点击角色卡片显示详情
    roleCards.forEach(card => {
        card.addEventListener('click', function () {
            const role = this.getAttribute('data-role');
            const details = roleDetails[role];

            if (details) {
                roleDetailsDiv.innerHTML = `
                    <h2>${details.title}</h2>
                    ${details.content}
                `;
                modal.style.display = 'block';
            }
        });
    });

    // 关闭模态框
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            modal.style.display = 'none';
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/* ============================================
   捐赠者列表功能
   ============================================ */

// 示例捐赠者数据
const donorsData = [
    { name: '张**', amount: '5000元' },
    { name: '李**', amount: '3000元' },
    { name: '王**', amount: '2000元' },
    { name: '刘**', amount: '10000元' },
    { name: '陈**', amount: '1500元' },
    { name: '赵**', amount: '8000元' },
    { name: '孙**', amount: '2500元' },
    { name: '周**', amount: '6000元' },
    { name: '吴**', amount: '3500元' },
    { name: '郑**', amount: '4500元' },
    { name: '钱**', amount: '5500元' },
    { name: '孙**', amount: '12000元' },
    { name: '李**', amount: '2800元' },
    { name: '王**', amount: '7200元' },
    { name: '张**', amount: '3800元' },
    { name: '刘**', amount: '9200元' },
    { name: '陈**', amount: '1800元' },
    { name: '赵**', amount: '6500元' },
    { name: '周**', amount: '4200元' },
    { name: '吴**', amount: '5800元' }
];

/**
 * 初始化捐赠者列表
 */
function initDonors() {
    const donorsList = document.getElementById('donorsList');
    if (!donorsList) return;

    donorsList.innerHTML = '';

    // 按捐赠金额排序（降序）
    const sortedDonors = [...donorsData].sort((a, b) => {
        const amountA = parseInt(a.amount);
        const amountB = parseInt(b.amount);
        return amountB - amountA;
    });
    
    // 渲染捐赠者列表
    sortedDonors.forEach(donor => {
        const donorCard = document.createElement('div');
        donorCard.className = 'donor-card';
        donorCard.innerHTML = `
            <div class="donor-name">${donor.name}</div>
            <div class="donor-amount">${donor.amount}</div>
        `;
        donorsList.appendChild(donorCard);
    });
}

/* ============================================
   二维码全屏弹窗功能
   ============================================ */

/**
 * 初始化二维码弹窗功能
 * 点击二维码后全屏显示，点击关闭按钮或背景关闭
 */
function initQRModal() {
    const qrTrigger = document.getElementById('qrTrigger');
    const qrModal = document.getElementById('qrModal');
    const qrClose = document.getElementById('qrClose');
    
    // 点击二维码打开全屏弹窗
    if (qrTrigger) {
        qrTrigger.addEventListener('click', function() {
            qrModal.classList.add('active');
            // 防止背景滚动
            document.body.style.overflow = 'hidden';
        });
    }
    
    // 点击关闭按钮关闭弹窗
    if (qrClose) {
        qrClose.addEventListener('click', function() {
            closeQRModal();
        });
    }
    
    // 点击弹窗背景关闭
    if (qrModal) {
        qrModal.addEventListener('click', function(e) {
            // 如果点击的是背景（不是内容区域），则关闭
            if (e.target === qrModal) {
                closeQRModal();
            }
        });
    }
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && qrModal.classList.contains('active')) {
            closeQRModal();
        }
    });
}

/**
 * 关闭二维码弹窗
 */
function closeQRModal() {
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        qrModal.classList.remove('active');
        // 恢复背景滚动
        document.body.style.overflow = '';
    }
}

/* ============================================
   平滑滚动功能
   ============================================ */

// 为所有内部链接添加平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

/* ============================================
   页面加载动画
   ============================================ */

// 页面加载时的淡入效果
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

