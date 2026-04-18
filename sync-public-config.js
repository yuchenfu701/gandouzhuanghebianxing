/**
 * 访客自动读取云端站点数据（无需登录管理员）。
 * 将 firebaseConfig、syncDocId 填成与后台「云同步」中相同的一项，保存后重新部署。
 *
 * 安全说明：syncDocId 会出现在网页源码中；当前 Firestore 规则若为「仅匹配该 ID 即可读写」，
 * 则知悉该 ID 的第三方理论上也可写入。请使用足够长的随机 ID，并勿将含真实 ID的文件提交到不信任的公开仓库（若介意）。
 */
window.__WILSON_PUBLIC_CLOUD_SYNC__ = {
    firebaseConfig: null,
    syncDocId: null
};
