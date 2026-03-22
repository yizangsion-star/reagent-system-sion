# 部署说明 - 课题组试剂与发票在线管理系统

## 部署到 Vercel

本项目已配置为自动部署到 Vercel。代码推送到 GitHub 后，Vercel 会自动检测并部署。

### 当前部署状态

- **Vercel 项目 URL**: https://reagent-system-eight.vercel.app
- **GitHub 仓库**: https://github.com/yizangsion-star/reagent-system-sion

### 环境变量配置

请在 Vercel 项目后台 (https://vercel.com/dashboard) 添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_EO3N0dHfBSmk@ep-broad-base-anq4atc8.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_SECRET` | `reagent-system-secret-key-2026-change-in-production` |
| `NEXTAUTH_URL` | `https://reagent-system-eight.vercel.app` |

### 部署步骤

1. **推送代码到 GitHub**
   ```bash
   cd reagent-system
   git add .
   git commit -m "部署消息"
   git push
   ```

2. **Vercel 自动部署**
   - Vercel 会在检测到 Git 仓库更新后自动重新部署
   - 可在 Vercel 后台查看部署进度和日志

3. **数据库迁移**
   - 首次部署时，Vercel 会自动执行 `prisma migrate deploy` 和 `prisma db seed`
   - 如果自动迁移失败，需要手动执行：
     ```bash
     npx prisma generate
     npx prisma migrate deploy
     npx prisma db seed
     ```

### 默认管理员账号

部署完成后，使用以下账号登录：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |

### 注意事项

1. `.env` 文件已被 `.gitignore` 忽略，**不要**将其提交到 Git
2. 生产环境的环境变量应在 Vercel 后台配置
3. `NEXTAUTH_SECRET` 在生产环境中应使用更安全的随机字符串

### 生成更安全的 NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 故障排查

如果部署后网站无法访问：

1. 检查 Vercel 部署日志是否有错误
2. 确认数据库连接字符串正确
3. 确认 `NEXTAUTH_URL` 与实际域名匹配
4. 检查 Prisma Schema 是否与数据库同步