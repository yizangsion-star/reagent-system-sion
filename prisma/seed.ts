import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 创建默认管理员账号
  const adminUsername = "admin";
  const adminPassword = "admin123";

  // 检查管理员是否已存在
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log("管理员账号已存在，跳过创建");
    return;
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // 创建管理员
  const admin = await prisma.user.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
      role: "ADMIN",
      isApproved: true,
    },
  });

  console.log(`✅ 管理员账号创建成功:`);
  console.log(`   用户名：${admin.username}`);
  console.log(`   密码：${adminPassword}`);
  console.log(`   角色：管理员 (ADMIN)`);
  console.log(`   状态：已审核 (isApproved=true)`);
  console.log(`\n⚠️  请及时修改默认密码！`);
}

main()
  .catch((e) => {
    console.error("Seed 执行失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });