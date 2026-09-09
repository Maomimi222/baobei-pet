# 宝贝宠物养成 · 部署到 Gitee Pages

本目录已初始化为 git 仓库，可直接推送到 Gitee Pages 作为稳定静态站点。

## 前置条件
- Gitee 账号（https://gitee.com），并完成 **实名认证**（Gitee Pages 强制要求）。
- 仓库需设为 **公开**（免费版 Pages 仅支持公开仓库）。
- 本地已 `git init` 并提交（本目录已完成）。

## 一键发布步骤
1. 在 Gitee 新建仓库，例如 `baobei-pet`（**公开**）。
2. 本地推送（已 commit，仓库根目录即站点根）：
   ```bash
   git remote add origin https://gitee.com/<你的用户名>/baobei-pet.git
   git push -u origin master
   ```
   > 推送鉴权：Gitee 已不支持密码推送，需用 **私人令牌(PAT)**。
   > 生成位置：Gitee → 设置 → 私人令牌 → 生成（勾选 `projects` 权限）。
   > 密码框粘贴 PAT 即可。
3. 仓库页 → **服务** → **Gitee Pages** → 部署分支选 `master`、部署目录选 `根目录` → 点击「启动」。
4. 访问地址：`https://<你的用户名>.gitee.io/baobei-pet/`

## ⚠️ 关键坑（务必看）
- **每次更新代码后，必须回到 Gitee Pages 设置页点一次「更新」**，否则线上不会变（不像 GitHub Pages 自动构建）。
- 更新流程：① 本地改完 `git add -A && git commit && git push`；② 到 Gitee Pages 点「更新」。
- 版本号：index.html 里 `?v=20260909` 是缓存击穿用。更新时建议把版本号 +1（如 `?v=20260910`）以突破浏览器缓存；但仍需点「更新」。
- 仓库必须公开，否则 Pages 无法启用（或需开通会员）。

## 国内访问说明
- 页面唯一外部依赖是 Google Fonts（ZCOOL KuaiLe / Baloo 2）。CSS 已配置中文系统字体回退
  （`PingFang SC` / `Microsoft YaHei`），即使 Google 被墙，文字也正常显示，仅字体观感略不同，不影响功能。
- 若想 100% 自包含字体，可后续把字体文件放到 `assets/fonts/` 并改 CSS（可选优化）。

## 迁入孩子已有的学习进度
旧域名 `app.workbuddy.link` 已失效（404）。若平板上**还没导出过进度**，请尽快在平板浏览器打开旧地址，
用控制台运行 `copy(localStorage.getItem('baobei_pet_v4'))` 取出进度码，先存到微信/备忘录（救命备份）。
然后在 Gitee 新站：「家长后台 → 💾进度备份与恢复 → 📥恢复进度」粘贴导入即可。

## 后续
- 拿到 Gitee 地址后，可重新生成一张指向新地址的二维码（替换 `qrcode_new.png`）。
- 想要自己的短域名/自定义域名，可后续在 Gitee Pages 绑 CNAME（自定义域名需会员或单独配置）。
