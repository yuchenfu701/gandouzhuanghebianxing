# 肝豆状核变性患者信息平台

面向肝豆状核变性（Wilson 病）患者、家属与专业人员的信息网站：疾病介绍、新闻资讯、医学研究摘要、支持我们（捐赠与致谢）及管理员内容维护。

## 技术说明

- **纯静态站点**：`index.html` + `styles.css` + `script.js` + `site-images.js` + `admin.js` + `editor.js`
- **本地存储**：内容编辑、新闻列表、全站配图等使用浏览器 `localStorage`（无后端数据库）
- **部署**：任意静态托管即可（GitHub Pages、Gitee Pages、Netlify、服务器 Nginx 等）

## 本地预览

用浏览器直接打开项目根目录下的 `index.html`，或使用本地静态服务器（推荐，避免部分浏览器对 `file://` 的限制）：

```bash
# 已安装 Node 时示例
npx --yes serve .
```

浏览器访问终端里提示的地址（一般为 `http://localhost:3000`）。

## 发布到 GitHub（网站）

### 1. 在 GitHub 新建空仓库

在 GitHub 上创建仓库（例如 `wilson-disease-info`），**不要**勾选添加 README（避免首次推送冲突）。

### 2. 本地推送（首次）

在项目根目录执行（将 `你的用户名` 和 `仓库名` 换成自己的）：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

若使用 SSH：

```bash
git remote add origin git@github.com:你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 3. 开启 GitHub Pages

1. 打开仓库 **Settings → Pages**
2. **Source** 选择 **Deploy from a branch**
3. Branch 选 **`main`**，文件夹选 **`/ (root)`**
4. 保存后等待 1～2 分钟，页面会给出站点地址：`https://你的用户名.github.io/仓库名/`

仓库根目录已包含 **`.nojekyll`** 文件，避免 GitHub 用 Jekyll 处理导致部分路径异常。

### 4. 后续更新

```bash
git add -A
git commit -m "更新说明"
git push
```

## 项目结构（主要文件）

| 文件 | 说明 |
|------|------|
| `index.html` | 页面结构、导航与各板块 |
| `styles.css` | 全站样式与响应式布局 |
| `script.js` | 导航、新闻、捐赠、氛围背景等交互 |
| `site-images.js` | 默认配图与管理员换图逻辑 |
| `admin.js` | 管理员登录、新闻与内容管理 |
| `editor.js` | 可视化编辑模式（类 PPT 工具栏） |
| `hero-home.png` | 首页横幅默认图 |
| `f6e6f21e2455a7be1ffbd036a5e3886f.jpg` | 捐赠二维码等资源图 |

## 许可与声明

本站医学与新闻类内容为整理自公开资料，仅供学习参考，**不能替代**执业医师的诊疗意见。
