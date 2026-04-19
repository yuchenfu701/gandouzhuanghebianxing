/**
 * 左下角 AI 入口：确认后加载 Coze WebChat SDK 并打开与 Bot 的对话。
 * Token 在浏览器中可见，正式环境建议改为后端签发短期令牌。
 */
(function () {
    var SDK_URL =
        'https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.10/libs/cn/index.js';
    var BOT_ID = '7559970067795083290';
    var COZE_TOKEN =
        'pat_qXONATe0RvkB0caZ414sAXoR8SyV0D5pDwI5HpKG0dsHKlQgGnLOzQGKt3nFu27I';

    var cozeClient = null;
    var sdkLoadPromise = null;

    function loadCozeSDK() {
        if (typeof CozeWebSDK !== 'undefined' && CozeWebSDK.WebChatClient) {
            return Promise.resolve();
        }
        if (sdkLoadPromise) {
            return sdkLoadPromise;
        }
        sdkLoadPromise = new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = SDK_URL;
            s.async = true;
            s.setAttribute('data-coze-chat-sdk', '1');
            s.onload = function () {
                resolve();
            };
            s.onerror = function () {
                reject(new Error('Coze SDK 脚本无法加载'));
            };
            document.head.appendChild(s);
        });
        return sdkLoadPromise;
    }

    function initCozeClient() {
        if (cozeClient) {
            return Promise.resolve(cozeClient);
        }
        return loadCozeSDK().then(function () {
            if (typeof CozeWebSDK === 'undefined' || !CozeWebSDK.WebChatClient) {
                throw new Error('CozeWebSDK 未就绪');
            }
            cozeClient = new CozeWebSDK.WebChatClient({
                config: {
                    bot_id: String(BOT_ID).trim()
                },
                componentProps: {
                    title: 'Coze'
                },
                ui: {
                    base: {
                        icon: 'https://lf-coze-web-cdn.coze.cn/obj/coze-web-cn/obric/coze/favicon.1970.png',
                        layout: 'pc',
                        zIndex: 10000
                    },
                    asstBtn: {
                        isNeed: false
                    }
                },
                auth: {
                    type: 'token',
                    token: COZE_TOKEN,
                    onRefreshToken: function () {
                        return COZE_TOKEN;
                    }
                }
            });
            return cozeClient;
        });
    }

    function openConfirmModal() {
        var modal = document.getElementById('aiAssistantConfirmModal');
        if (!modal) {
            return;
        }
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeConfirmModal() {
        var modal = document.getElementById('aiAssistantConfirmModal');
        if (!modal) {
            return;
        }
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    document.addEventListener('DOMContentLoaded', function () {
        var fab = document.getElementById('aiAssistantFab');
        var btnYes = document.getElementById('aiAssistantConfirmYes');
        var btnNo = document.getElementById('aiAssistantConfirmNo');
        var modal = document.getElementById('aiAssistantConfirmModal');

        if (fab) {
            fab.addEventListener('click', function () {
                openConfirmModal();
            });
        }

        if (btnNo) {
            btnNo.addEventListener('click', function () {
                closeConfirmModal();
            });
        }

        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    closeConfirmModal();
                }
            });
        }

        if (btnYes) {
            btnYes.addEventListener('click', function () {
                closeConfirmModal();
                initCozeClient()
                    .then(function (client) {
                        if (client && typeof client.showChatBot === 'function') {
                            client.showChatBot();
                        }
                    })
                    .catch(function (err) {
                        console.error('[Coze]', err);
                        alert('AI 对话加载失败，请检查网络或稍后重试。');
                    });
            });
        }
    });
})();
