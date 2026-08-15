# N3 文法研修室

把逐页校对后的 N3 语法内容整理成适合电脑与手机阅读的静态网站。

## 功能

- 按第1部、第2部、第3部和模拟试验组织课程
- 每个学习单元分为语法、练习、重点辨析和答案解析
- 全文搜索
- 夜读模式与字号调整
- 使用浏览器本地保存当前课程和完成进度
- GitHub Pages 自动构建与发布

## 本地预览

需要 Node.js 24。

1. 运行 npm ci
2. 运行 npm run dev
3. 打开终端显示的本地地址

## GitHub Pages

项目已经包含 .github/workflows/deploy-pages.yml。推送到 GitHub 后，在仓库的
Settings → Pages 中把 Source 设为 GitHub Actions；之后推送到 main 会自动构建。

## 内容更新

网站显示的数据来自 public/content.md。校正版有更新时，用新版本替换此文件后重新构建。

## 版权提醒

教材正文可能受著作权保护。本项目没有附带公开传播教材内容的授权。请仅在确认拥有相应权利
或已获得许可后公开仓库和 GitHub Pages；否则应保留为个人本地使用，或只发布自己原创的学习笔记。

GitHub 官方说明：一般情况下，GitHub Pages 网站会公开在互联网上，即使源仓库是私有仓库。
只有符合条件的 GitHub Enterprise Cloud 组织站点才能配置私有 Pages 访问控制。
