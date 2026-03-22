# 手动执行 Migration 指南

由于网络原因，Prisma Migrate 暂时无法自动连接到 Neon 数据库。请按以下步骤手动执行：

## 方法一：在 Neon 控制台执行（推荐）

1. 访问 https://console.neon.tech
2. 进入您的项目 `neondb`
3. 点击左侧 "SQL Editor"
4. 复制并执行以下 SQL：

```sql
-- 添加联合唯一约束，确保同一用户在同一个月对同一供应商只有一个订单卡片
CREATE UNIQUE INDEX "OrderGroup_userId_month_supplierName_key" 
ON "OrderGroup"("userId", "month", "supplierName");
```

5. 执行成功后，记录 migration：
```bash
npx prisma migrate resolve --applied add_order_group_unique_constraint
```

## 方法二：等待网络恢复后自动执行

当网络恢复后，在项目目录运行：
```bash
npx prisma migrate dev --name add_order_group_unique_constraint
```

## 验证 Migration 是否成功

执行以下命令检查：
```bash
npx prisma db pull
```

如果成功，schema 中应该包含：
```prisma
@@unique([userId, month, supplierName])
```

## 注意事项

- 在生产环境执行前，请确保没有重复的数据（同一用户、同月、同供应商有多条记录）
- 如果有重复数据，需要先手动合并或删除重复记录
