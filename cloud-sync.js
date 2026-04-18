/**
 * 跨设备云同步（可选）：Firebase Firestore 单文档存储与本地一致的键值。
 * 需在 Firebase 控制台创建项目、启用 Firestore，并按 firestore.rules.example 配置规则。
 */
(function (global) {
    var COLLECTION = 'wilsonSiteSync';
    var DEBOUNCE_MS = 1800;
    var SKIP_PUSH_MS = 2500;

    var pushTimer = null;
    var unsubscribe = null;
    var skipPushUntil = 0;
    var lastAppliedSnapshotVersion = 0;

    function isSyncableKey(key) {
        if (!key) return false;
        if (key.indexOf('cloudSync') === 0) return false;
        if (key === 'adminLoggedIn' || key === 'userType') return false;
        if (key === 'cloudSyncLastVersion') return false;
        return (
            key === 'pageStructure' ||
            key === 'websiteNews' ||
            key === 'chatMessages' ||
            key === 'siteImageOverrides' ||
            key === 'siteImageOriginalSrc' ||
            key === 'globalHistory' ||
            key === 'contentMergeInfoToIntroDone' ||
            key.indexOf('content_') === 0
        );
    }

    function collectBundle() {
        var data = {};
        var i;
        var k;
        var v;
        for (i = 0; i < localStorage.length; i++) {
            k = localStorage.key(i);
            if (isSyncableKey(k)) {
                v = localStorage.getItem(k);
                if (v !== null) {
                    data[k] = v;
                }
            }
        }
        return data;
    }

    function applyBundle(data) {
        if (!data || typeof data !== 'object') return;
        Object.keys(data).forEach(function (k) {
            if (isSyncableKey(k) && typeof data[k] === 'string') {
                localStorage.setItem(k, data[k]);
            }
        });
    }

    function readConfig() {
        var enabled = localStorage.getItem('cloudSyncEnabled') === 'true';
        var cfg = null;
        try {
            cfg = JSON.parse(localStorage.getItem('cloudSyncFirebaseConfig') || 'null');
        } catch (e1) {
            cfg = null;
        }
        var token = (localStorage.getItem('cloudSyncToken') || '').trim();
        return { enabled: enabled, cfg: cfg, token: token };
    }

    /**
     * 仅读 window.__WILSON_PUBLIC_CLOUD_SYNC__（sync-public-config.js），供未配置 localStorage 的访客拉取。
     */
    function readPublicCloudSync() {
        var p = global.__WILSON_PUBLIC_CLOUD_SYNC__;
        if (!p || typeof p !== 'object') {
            return { cfg: null, token: '' };
        }
        var tok = (p.syncDocId || '').trim();
        var cfg = p.firebaseConfig;
        if (!cfg || typeof cfg !== 'object' || !cfg.apiKey) {
            return { cfg: null, token: tok };
        }
        return { cfg: cfg, token: tok };
    }

    /**
     * 管理员已启用且配置完整时优先用 localStorage；否则若 sync-public-config.js 已填写则用公开配置（访客也可拉取）。
     */
    function getEffectiveConfig() {
        var ls = readConfig();
        if (ls.enabled && ls.cfg && ls.token) {
            return { cfg: ls.cfg, token: ls.token, source: 'local' };
        }
        var pub = readPublicCloudSync();
        if (pub.cfg && pub.token) {
            return { cfg: pub.cfg, token: pub.token, source: 'public' };
        }
        return null;
    }

    function getFirestoreRefs() {
        var c = getEffectiveConfig();
        if (!c || !c.cfg || !c.token) {
            return null;
        }
        if (!global.firebase || !firebase.firestore) {
            return null;
        }
        if (!firebase.apps.length) {
            firebase.initializeApp(c.cfg);
        }
        var db = firebase.firestore();
        return {
            db: db,
            docRef: db.collection(COLLECTION).doc(c.token),
            source: c.source
        };
    }

    function estimateBlobBytes(blob) {
        try {
            return new Blob([JSON.stringify(blob)]).size;
        } catch (e2) {
            return JSON.stringify(blob).length * 2;
        }
    }

    function bumpSkipPush() {
        skipPushUntil = Date.now() + SKIP_PUSH_MS;
    }

    /**
     * 首次进入页面前拉取云端（若已启用）。在 restoreSavedPages 之前调用。
     */
    function pullOnceBeforeRestore() {
        var refs = getFirestoreRefs();
        if (!refs) {
            return Promise.resolve(false);
        }
        return refs.docRef
            .get()
            .then(function (snap) {
                if (!snap.exists) {
                    return false;
                }
                var d = snap.data() || {};
                var ver = typeof d.version === 'number' ? d.version : 0;
                var last = parseInt(localStorage.getItem('cloudSyncLastVersion') || '0', 10) || 0;
                if (ver <= last) {
                    return false;
                }
                var blob = d.blob || d.data || {};
                bumpSkipPush();
                applyBundle(blob);
                localStorage.setItem('cloudSyncLastVersion', String(ver));
                lastAppliedSnapshotVersion = ver;
                return true;
            })
            .catch(function (err) {
                console.warn('[云同步] 拉取失败', err);
                return false;
            });
    }

    function pushNow() {
        if (Date.now() < skipPushUntil) {
            return Promise.resolve();
        }
        if (localStorage.getItem('adminLoggedIn') !== 'true') {
            return Promise.resolve();
        }
        if (!getEffectiveConfig()) {
            return Promise.resolve();
        }
        var refs = getFirestoreRefs();
        if (!refs) {
            return Promise.resolve();
        }
        var blob = collectBundle();
        var bytes = estimateBlobBytes(blob);
        if (bytes > 950000) {
            console.warn('[云同步] 数据约 ' + Math.round(bytes / 1024) + ' KB，接近 Firestore 单文档上限，上传可能失败。请减小嵌入图片体积。');
        }
        return refs.docRef.get().then(function (snap) {
            var prev = 0;
            if (snap.exists) {
                var pd = snap.data() || {};
                prev = typeof pd.version === 'number' ? pd.version : 0;
            }
            var version = Math.max(Date.now(), prev + 1);
            return refs.docRef
                .set({
                    version: version,
                    blob: blob,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(function () {
                    localStorage.setItem('cloudSyncLastVersion', String(version));
                    lastAppliedSnapshotVersion = version;
                });
        });
    }

    function schedulePush() {
        if (Date.now() < skipPushUntil) {
            return;
        }
        if (localStorage.getItem('adminLoggedIn') !== 'true') {
            return;
        }
        if (!getEffectiveConfig()) {
            return;
        }
        clearTimeout(pushTimer);
        pushTimer = setTimeout(function () {
            pushNow().catch(function (e) {
                console.warn('[云同步] 上传失败', e);
            });
        }, DEBOUNCE_MS);
    }

    function stopListener() {
        if (typeof unsubscribe === 'function') {
            unsubscribe();
            unsubscribe = null;
        }
    }

    function handleRemoteBlob(blob, version) {
        var hadPage = blob && typeof blob.pageStructure === 'string';
        var keys = blob ? Object.keys(blob) : [];

        if (typeof global.loadChatMessages === 'function') {
            global.loadChatMessages();
        }
        if (typeof global.renderChatMessages === 'function') {
            global.renderChatMessages();
        }
        if (typeof global.loadNewsList === 'function') {
            global.loadNewsList();
        }
        if (typeof global.updateNewsDisplay === 'function') {
            global.updateNewsDisplay();
        }
        if (typeof global.applyAllSiteImagesFromStorage === 'function') {
            global.applyAllSiteImagesFromStorage();
        }

        global.dispatchEvent(
            new CustomEvent('wilson-cloud-sync-applied', {
                detail: { keys: keys, version: version, hadPageStructure: hadPage }
            })
        );

        if (typeof global.wilsonRefreshAdminHistoryFromStorage === 'function') {
            global.wilsonRefreshAdminHistoryFromStorage();
        }

        if (hadPage) {
            global.location.reload();
        } else if (typeof global.restoreSavedPages === 'function') {
            try {
                global.restoreSavedPages();
            } catch (e3) {
                console.warn('[云同步] 局部恢复页面失败', e3);
            }
        }
    }

    function startListener() {
        stopListener();
        var refs = getFirestoreRefs();
        if (!refs) {
            return;
        }
        unsubscribe = refs.docRef.onSnapshot(
            function (snap) {
                if (!snap.exists) {
                    return;
                }
                var d = snap.data() || {};
                var ver = typeof d.version === 'number' ? d.version : 0;
                if (ver <= lastAppliedSnapshotVersion) {
                    var lastStored = parseInt(localStorage.getItem('cloudSyncLastVersion') || '0', 10) || 0;
                    if (ver <= lastStored) {
                        return;
                    }
                }
                var blob = d.blob || d.data || {};
                bumpSkipPush();
                applyBundle(blob);
                localStorage.setItem('cloudSyncLastVersion', String(ver));
                lastAppliedSnapshotVersion = ver;
                handleRemoteBlob(blob, ver);
            },
            function (err) {
                console.warn('[云同步] 实时监听错误', err);
            }
        );
    }

    global.wilsonScheduleCloudSyncPush = schedulePush;
    global.__wilsonCloudSyncPull = pullOnceBeforeRestore;
    global.wilsonCloudSyncStartListener = startListener;
    global.wilsonCloudSyncStopListener = stopListener;
    global.wilsonCloudSyncPushNow = pushNow;
    /** 管理后台「立即拉取」：若有新数据已写入 localStorage，整页刷新以统一界面状态 */
    global.wilsonCloudSyncPullNow = function () {
        return pullOnceBeforeRestore().then(function (changed) {
            if (changed) {
                global.location.reload();
            }
            return changed;
        });
    };
})(window);
