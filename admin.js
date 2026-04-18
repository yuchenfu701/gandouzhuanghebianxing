/* ============================================
   管理员功能模块
   ============================================ */

// 管理员账号密码（默认，可以修改）
const ADMIN_CONFIG = {
    username: 'admin',
    password: 'admin123'
};

// 超级管理员账号密码
const SUPER_ADMIN_CONFIG = {
    username: '付',
    password: '120701'
};

// 当前登录用户类型
let currentUserType = null; // 'admin' 或 'superadmin'

// 初始化管理员功能
document.addEventListener('DOMContentLoaded', function() {
    initAdmin();
});

/**
 * 初始化管理员功能
 */
function initAdmin() {
    // 检查是否已登录
    checkAdminLogin();
    
    // 管理员入口按钮
    const adminEntry = document.getElementById('adminEntry');
    if (adminEntry) {
        adminEntry.addEventListener('click', function() {
            showAdminLogin();
        });
    }
    
    // 登录表单
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // 关闭登录弹窗
    const loginClose = document.getElementById('adminLoginClose');
    const cancelLogin = document.getElementById('cancelLogin');
    if (loginClose) loginClose.addEventListener('click', hideAdminLogin);
    if (cancelLogin) cancelLogin.addEventListener('click', hideAdminLogin);
    
    // 退出登录
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }
    
    // 标签页切换
    initAdminTabs();
    
    // 新闻管理
    initNewsManagement();
    
    // 内容管理
    initContentManagement();
    
    // 历史记录管理（超级管理员）
    initHistoryManagement();
    
    // 对话系统
    initChatSystem();
    
    // 根据用户类型显示/隐藏历史记录标签
    updateAdminTabs();
}

/**
 * 更新管理员标签页显示
 */
function updateAdminTabs() {
    const historyTab = document.getElementById('historyTab');
    if (historyTab) {
        if (currentUserType === 'superadmin') {
            historyTab.style.display = 'block';
        } else {
            historyTab.style.display = 'none';
        }
    }
}

/**
 * 检查管理员登录状态
 */
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const userType = localStorage.getItem('userType');
    currentUserType = userType || null;
    
    const adminBtn = document.getElementById('adminBtn');
    const adminEntry = document.getElementById('adminEntry');
    const adminHeader = document.querySelector('.admin-header h1');
    
    if (isLoggedIn) {
        if (adminBtn) adminBtn.style.display = 'block';
        if (adminEntry) adminEntry.style.display = 'none';
        
        // 更新标题显示用户类型
        if (adminHeader) {
            if (userType === 'superadmin') {
                adminHeader.textContent = '超级管理员后台';
            } else {
                adminHeader.textContent = '管理员后台';
            }
        }
        
        // 更新标签页显示
        updateAdminTabs();
    } else {
        if (adminBtn) adminBtn.style.display = 'none';
        if (adminEntry) adminEntry.style.display = 'block';
    }
}

/**
 * 显示登录弹窗
 */
function showAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 隐藏登录弹窗
 */
function hideAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    // 清空表单
    const form = document.getElementById('adminLoginForm');
    if (form) form.reset();
    const error = document.getElementById('loginError');
    if (error) error.style.display = 'none';
}

/**
 * 处理登录
 */
function handleLogin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    // 检查是否是超级管理员
    if (username === SUPER_ADMIN_CONFIG.username && password === SUPER_ADMIN_CONFIG.password) {
        // 超级管理员登录成功
        currentUserType = 'superadmin';
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('userType', 'superadmin');
        hideAdminLogin();
        checkAdminLogin();
        switchToAdminPage();
        return;
    }
    
    // 检查是否是普通管理员
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        // 管理员登录成功
        currentUserType = 'admin';
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('userType', 'admin');
        hideAdminLogin();
        checkAdminLogin();
        switchToAdminPage();
    } else {
        // 登录失败
        if (errorDiv) {
            errorDiv.textContent = '账号或密码错误！';
            errorDiv.style.display = 'block';
        }
    }
}

/**
 * 离开管理员页时恢复主内容区显示（#admin 在 <main> 外时曾隐藏 main）
 */
function showMainContentAfterAdmin() {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.paddingTop = '';
        mainContent.style.display = '';
    }
}

/**
 * 退出登录
 */
function logout() {
    localStorage.setItem('adminLoggedIn', 'false');
    checkAdminLogin();
    
    // 切换到首页
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    navItems.forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('data-page') === 'home') {
            nav.classList.add('active');
        }
    });
    
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === 'home') {
            page.classList.add('active');
        }
    });

    showMainContentAfterAdmin();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * 切换到管理员页面
 */
function switchToAdminPage() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const mainContent = document.getElementById('mainContent');
    
    navItems.forEach(nav => {
        nav.classList.remove('active');
        if (nav.getAttribute('data-page') === 'admin' || nav.id === 'adminBtn') {
            nav.classList.add('active');
        }
    });
    
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === 'admin') {
            page.classList.add('active');
        }
    });
    if (mainContent) {
        mainContent.style.paddingTop = '0';
        mainContent.style.display = 'none';
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 刷新新闻列表
    loadNewsList();
}

/**
 * 初始化标签页切换
 */
function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 切换标签按钮状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 切换标签内容
            tabContents.forEach(content => {
                content.classList.remove('active');
                const contentId = content.id;
                
                if (targetTab === 'news' && contentId === 'adminNewsTab') {
                    content.classList.add('active');
                } else if (targetTab === 'content' && contentId === 'adminContentTab') {
                    content.classList.add('active');
                } else if (targetTab === 'history' && contentId === 'adminHistoryTab') {
                    content.classList.add('active');
                    // 加载历史记录（只有超级管理员可以看到）
                    if (currentUserType === 'superadmin') {
                        loadHistoryList();
                    }
                } else if (targetTab === 'chat' && contentId === 'adminChatTab') {
                    content.classList.add('active');
                    // 渲染聊天消息
                    renderChatMessages();
                }
            });
        });
    });
}

/**
 * 初始化新闻管理
 */
function initNewsManagement() {
    // 添加新闻按钮
    const addNewsBtn = document.getElementById('addNewsBtn');
    if (addNewsBtn) {
        addNewsBtn.addEventListener('click', function() {
            showNewsModal();
        });
    }
    
    // 新闻表单提交
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNews();
        });
    }
    
    // 关闭新闻弹窗
    const newsModalClose = document.getElementById('newsModalClose');
    const cancelNews = document.getElementById('cancelNews');
    if (newsModalClose) newsModalClose.addEventListener('click', hideNewsModal);
    if (cancelNews) cancelNews.addEventListener('click', hideNewsModal);
    
    // 加载新闻列表
    loadNewsList();
}

/**
 * 加载新闻列表
 */
function loadNewsList() {
    const newsList = document.getElementById('newsList');
    if (!newsList) return;
    
    const news = getNewsFromStorage();
    
    if (news.length === 0) {
        newsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">暂无新闻，点击"添加新闻"按钮添加第一条新闻</p>';
        return;
    }
    
    newsList.innerHTML = '';
    news.forEach((item, index) => {
        const newsItem = document.createElement('div');
        newsItem.className = 'admin-list-item';
        newsItem.innerHTML = `
            <div class="admin-list-item-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="date">日期：${item.date}</div>
            </div>
            <div class="admin-list-item-actions">
                <button class="btn-edit" onclick="editNews(${index})">编辑</button>
                <button class="btn-delete" onclick="deleteNews(${index})">删除</button>
            </div>
        `;
        newsList.appendChild(newsItem);
    });
}

/**
 * 从localStorage获取新闻
 */
function getNewsFromStorage() {
    const stored = localStorage.getItem('websiteNews');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            if (Array.isArray(data) && data.length > 0) {
                if (typeof window.isLegacyPlaceholderNewsCatalog === 'function' && window.isLegacyPlaceholderNewsCatalog(data)) {
                    const fresh = typeof window.getDefaultNewsCatalog === 'function' ? window.getDefaultNewsCatalog() : data;
                    try {
                        localStorage.setItem('websiteNews', JSON.stringify(fresh));
                    } catch (err) {
                        console.warn('自动升级新闻目录写入失败', err);
                    }
                    return fresh;
                }
                return data;
            }
        } catch (e) {
            console.warn('websiteNews 解析失败', e);
        }
    }
    if (typeof window.getDefaultNewsCatalog === 'function') {
        return window.getDefaultNewsCatalog();
    }
    return [];
}

/**
 * 保存新闻到localStorage
 */
function saveNewsToStorage(news) {
    localStorage.setItem('websiteNews', JSON.stringify(news));
    // 触发新闻更新事件
    if (typeof window.updateNewsDisplay === 'function') {
        window.updateNewsDisplay();
    }
}

/**
 * 显示新闻编辑弹窗
 */
function showNewsModal(index = null) {
    const modal = document.getElementById('newsModal');
    const form = document.getElementById('newsForm');
    const title = document.getElementById('newsModalTitle');
    
    if (index !== null) {
        // 编辑模式
        const news = getNewsFromStorage();
        const item = news[index];
        document.getElementById('newsId').value = index;
        document.getElementById('newsTitle').value = item.title;
        document.getElementById('newsDescription').value = item.description;
        document.getElementById('newsDate').value = item.date;
        if (title) title.textContent = '编辑新闻';
    } else {
        // 添加模式
        form.reset();
        document.getElementById('newsId').value = '';
        if (title) title.textContent = '添加新闻';
    }
    
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 隐藏新闻弹窗
 */
function hideNewsModal() {
    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * 保存新闻
 */
function saveNews() {
    const id = document.getElementById('newsId').value;
    const title = document.getElementById('newsTitle').value;
    const description = document.getElementById('newsDescription').value;
    const date = document.getElementById('newsDate').value;
    
    let news = getNewsFromStorage();
    
    if (id !== '') {
        // 编辑
        const index = parseInt(id);
        news[index] = {
            ...news[index],
            title,
            description,
            date
        };
    } else {
        // 添加
        const newId = news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
        news.push({
            id: newId,
            title,
            description,
            date,
            image: `news${newId}`,
            coverTheme: 'default',
            category: '',
            links: [],
            sourceNote: ''
        });
    }
    
    saveNewsToStorage(news);
    loadNewsList();
    hideNewsModal();
    
    // 记录历史
    recordHistory('news', '新闻修改', id !== '' ? '编辑了新闻' : '添加了新新闻');
}

/**
 * 编辑新闻
 */
function editNews(index) {
    showNewsModal(index);
}

/**
 * 删除新闻
 */
function deleteNews(index) {
    if (confirm('确定要删除这条新闻吗？')) {
        let news = getNewsFromStorage();
        news.splice(index, 1);
        saveNewsToStorage(news);
        loadNewsList();
    }
}

/**
 * 初始化内容管理
 */
function initContentManagement() {
    // 编辑内容按钮
    const editBtns = document.querySelectorAll('.edit-content-btn');
    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showContentModal(section);
        });
    });
    
    // 内容表单提交
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveContent();
        });
    }
    
    // 关闭内容弹窗
    const contentModalClose = document.getElementById('contentModalClose');
    const cancelContent = document.getElementById('cancelContent');
    if (contentModalClose) contentModalClose.addEventListener('click', hideContentModal);
    if (cancelContent) cancelContent.addEventListener('click', hideContentModal);
}

/**
 * 显示内容编辑弹窗
 */
function showContentModal(section) {
    const modal = document.getElementById('contentModal');
    const title = document.getElementById('contentModalTitle');
    const sectionInput = document.getElementById('contentSection');
    
    if (sectionInput) sectionInput.value = section;
    
    // 根据板块加载内容
    const content = getContentFromStorage(section);
    document.getElementById('contentTitle').value = content.title || '';
    document.getElementById('contentText').value = content.text || '';
    
    if (title) {
        const sectionNames = {
            intro: '简介页面（含原信息中心内容）',
            research: '医学研究'
        };
        title.textContent = `编辑${sectionNames[section] || '内容'}`;
    }
    
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 隐藏内容弹窗
 */
function hideContentModal() {
    const modal = document.getElementById('contentModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * 从localStorage获取内容
 */
function getContentFromStorage(section) {
    const stored = localStorage.getItem(`content_${section}`);
    if (stored) {
        return JSON.parse(stored);
    }
    return { title: '', text: '' };
}

/**
 * 保存内容
 */
function saveContent() {
    const section = document.getElementById('contentSection').value;
    const title = document.getElementById('contentTitle').value;
    const text = document.getElementById('contentText').value;
    
    const content = { title, text };
    localStorage.setItem(`content_${section}`, JSON.stringify(content));
    
    hideContentModal();
    alert('内容已保存！');
    
    // 记录历史
    recordHistory('content', '内容修改', `修改了${section}板块的内容`);
}

// 管理员按钮点击事件
const adminBtn = document.getElementById('adminBtn');
if (adminBtn) {
    adminBtn.addEventListener('click', function(e) {
        e.preventDefault();
        switchToAdminPage();
    });
}

/* ============================================
   历史记录管理功能（超级管理员）
   ============================================ */

// 全局修改历史记录
let globalHistory = [];

/**
 * 初始化历史记录管理
 */
function initHistoryManagement() {
    // 加载历史记录
    loadGlobalHistory();
    
    // 监听所有修改操作
    setupHistoryTracking();
    
    // 如果是超级管理员，加载历史记录列表
    if (currentUserType === 'superadmin') {
        loadHistoryList();
    }
}

/**
 * 设置历史记录追踪
 */
function setupHistoryTracking() {
    // 监听新闻保存
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        const originalSubmit = newsForm.onsubmit;
        newsForm.addEventListener('submit', function() {
            setTimeout(() => {
                recordHistory('news', '新闻修改', '修改了新闻列表');
            }, 100);
        });
    }
    
    // 监听内容保存
    const contentForm = document.getElementById('contentForm');
    if (contentForm) {
        contentForm.addEventListener('submit', function() {
            setTimeout(() => {
                recordHistory('content', '内容修改', '修改了页面内容');
            }, 100);
        });
    }
}

/**
 * 记录历史修改
 */
function recordHistory(type, action, description) {
    const historyItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userType: currentUserType || 'admin',
        type: type, // 'news', 'content', 'layout', etc.
        action: action,
        description: description,
        data: getCurrentState(),
        reverted: false
    };
    
    globalHistory.push(historyItem);
    saveGlobalHistory();
    
    // 如果是超级管理员，更新历史记录显示
    if (currentUserType === 'superadmin') {
        loadHistoryList();
    }
}

/**
 * 获取当前状态
 */
function getCurrentState() {
    return {
        news: getNewsFromStorage(),
        pageStructure: localStorage.getItem('pageStructure'),
        siteImageOverrides: localStorage.getItem('siteImageOverrides'),
        siteImageOriginalSrc: localStorage.getItem('siteImageOriginalSrc'),
        timestamp: new Date().toISOString()
    };
}

/**
 * 保存全局历史记录
 */
function saveGlobalHistory() {
    localStorage.setItem('globalHistory', JSON.stringify(globalHistory));
}

/**
 * 加载全局历史记录
 */
function loadGlobalHistory() {
    const stored = localStorage.getItem('globalHistory');
    if (stored) {
        globalHistory = JSON.parse(stored);
    } else {
        globalHistory = [];
    }
}

/**
 * 加载历史记录列表
 */
function loadHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (globalHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">暂无历史记录</p>';
        return;
    }
    
    // 按时间倒序排列
    const sortedHistory = [...globalHistory].reverse();
    
    historyList.innerHTML = '';
    sortedHistory.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item' + (item.reverted ? ' reverted' : '');
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-item-info">
                    <h3>${item.action}</h3>
                    <span class="history-time">${formatTime(item.timestamp)}</span>
                    <span class="history-user">${item.userType === 'superadmin' ? '超级管理员' : '管理员'}</span>
                </div>
                ${!item.reverted ? `<button class="btn-danger btn-revert" data-id="${item.id}">否定修改</button>` : '<span class="reverted-badge">已否定</span>'}
            </div>
            <p class="history-description">${item.description}</p>
            <div class="history-details" style="display: none;">
                <pre>${JSON.stringify(item.data, null, 2)}</pre>
            </div>
        `;
        
        // 点击展开详情
        historyItem.querySelector('.history-item-info').addEventListener('click', function() {
            const details = historyItem.querySelector('.history-details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        });
        
        // 否定修改按钮
        const revertBtn = historyItem.querySelector('.btn-revert');
        if (revertBtn) {
            revertBtn.addEventListener('click', function() {
                revertHistory(item.id);
            });
        }
        
        historyList.appendChild(historyItem);
    });
}

/**
 * 格式化时间
 */
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 否定/回退修改
 */
function revertHistory(historyId) {
    const historyItem = globalHistory.find(item => item.id === historyId);
    if (!historyItem || historyItem.reverted) return;
    
    if (!confirm('确定要否定这项修改吗？这将恢复到修改前的状态。')) {
        return;
    }
    
    // 恢复数据
    if (historyItem.data) {
        if (historyItem.data.news) {
            localStorage.setItem('websiteNews', JSON.stringify(historyItem.data.news));
        }
        if (historyItem.data.pageStructure) {
            localStorage.setItem('pageStructure', historyItem.data.pageStructure);
        }
        if (historyItem.data.siteImageOverrides !== undefined) {
            localStorage.setItem('siteImageOverrides', historyItem.data.siteImageOverrides || '{}');
        }
        if (historyItem.data.siteImageOriginalSrc !== undefined) {
            localStorage.setItem('siteImageOriginalSrc', historyItem.data.siteImageOriginalSrc || '{}');
        }
    }
    
    // 标记为已否定
    historyItem.reverted = true;
    historyItem.revertedBy = currentUserType;
    historyItem.revertedAt = new Date().toISOString();
    
    saveGlobalHistory();
    loadHistoryList();
    
    // 刷新页面显示
    if (typeof loadNewsList === 'function') {
        loadNewsList();
    }
    if (typeof window.updateNewsDisplay === 'function') {
        window.updateNewsDisplay();
    }
    if (typeof applyAllSiteImagesFromStorage === 'function') {
        applyAllSiteImagesFromStorage();
    }

    alert('修改已否定，已恢复到修改前的状态');
}

/* ============================================
   对话系统功能
   ============================================ */

let chatMessages = [];

/**
 * 初始化对话系统
 */
function initChatSystem() {
    loadChatMessages();
    renderChatMessages();
    
    const sendBtn = document.getElementById('sendChatBtn');
    const chatInput = document.getElementById('chatInput');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
}

/**
 * 发送消息
 */
function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (!message) return;
    
    const chatMessage = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        userType: currentUserType || 'admin',
        username: currentUserType === 'superadmin' ? '超级管理员' : '管理员',
        message: message
    };
    
    chatMessages.push(chatMessage);
    saveChatMessages();
    renderChatMessages();
    
    chatInput.value = '';
    chatInput.focus();
}

/**
 * 渲染消息列表
 */
function renderChatMessages() {
    const chatMessagesDiv = document.getElementById('chatMessages');
    if (!chatMessagesDiv) return;
    
    chatMessagesDiv.innerHTML = '';
    
    if (chatMessages.length === 0) {
        chatMessagesDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">暂无消息</p>';
        return;
    }
    
    chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message ' + (msg.userType === 'superadmin' ? 'superadmin' : 'admin');
        messageDiv.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-username">${msg.username}</span>
                <span class="chat-time">${formatTime(msg.timestamp)}</span>
            </div>
            <div class="chat-message-content">${escapeHtml(msg.message)}</div>
        `;
        chatMessagesDiv.appendChild(messageDiv);
    });
    
    // 滚动到底部
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

/**
 * HTML转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 保存聊天消息
 */
function saveChatMessages() {
    localStorage.setItem('chatMessages', JSON.stringify(chatMessages));
}

/**
 * 加载聊天消息
 */
function loadChatMessages() {
    const stored = localStorage.getItem('chatMessages');
    if (stored) {
        chatMessages = JSON.parse(stored);
    } else {
        chatMessages = [];
    }
}

