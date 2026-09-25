# 小齐今天吃什么 · 小红书小工具

个人私藏食单小工具，纯 HTML/CSS/JS 实现，零网络请求。

---

## 🚀 快速启动

### 方式一：一键脚本（推荐）

```bash
cd xiaoqi-minitool
./serve.sh
```

自动编译 + 启动服务器 + 打开浏览器，访问 http://localhost:8080

### 方式二：手动编译运行

```bash
# 编译 Rust 服务器（仅首次或修改了 dev-server.rs 时需要）
rustc dev-server.rs -o dev-server -O

# 启动服务器
./dev-server
```

### 方式三：直接打开

直接用浏览器打开 `index.html` 也能用，但部分功能（如摇一摇）需要 http 协议。

---

## 📁 项目结构

```
xiaoqi-minitool/
├── index.html          # 入口页面
├── styles.css          # 样式文件（Stitch 设计系统）
├── main.js             # 交互逻辑
├── data.js             # 餐厅数据 + 配置开关
├── dev-server.rs       # Rust 本地开发服务器
├── dev-server          # 编译后的二进制（git 忽略）
└── serve.sh            # 一键启动脚本
```

---

## ⚙️ 配置开关

在 `data.js` 顶部修改 `XIAOQI_CONFIG`：

```javascript
var XIAOQI_CONFIG = {
  show_rating: false,    // 是否显示评分
  show_review: false,    // 是否显示评论/小齐说
  show_price: false      // 是否显示人均价格
};
```

改成 `true` 即显示，`false` 即隐藏。

---

## 🎯 功能页面

| 页面 | 路径 | 说明 |
|---|---|---|
| 今天吃啥 | 首页 | 翻牌推荐，支持摇一摇换菜 |
| 全部食单 | 列表页 | 搜索 + 分类筛选 |
| 餐厅详情 | 底部弹层 | 招牌菜、地址、避坑提示 |
| 城市选择 | 抽屉页 | 切换不同城市的食单 |

---

## 🔧 开发说明

- 修改 `data.js` 后刷新页面即可生效
- 修改 `styles.css` 后刷新页面即可生效
- 修改 `index.html` 后刷新页面即可生效
- 修改 `main.js` 后刷新页面即可生效
- 服务器禁用了缓存，无需硬刷新

---

## 📦 打包发布

直接将 `xiaoqi-minitool` 目录下的文件（除了 `dev-server` 和 `dev-server.rs`）打包成 zip，入口文件为 `index.html`。
