import { PrismaClient, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始 seeding 数据库...')

  // 创建管理员账号
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      role: Role.ADMIN,
      isApproved: true,
    },
  })
  console.log('✅ 创建管理员账号：admin / admin123')

  // 创建学生账号
  const studentPassword = await bcrypt.hash('student123', 10)
  const student1 = await prisma.user.upsert({
    where: { username: '张三' },
    update: {},
    create: {
      username: '张三',
      password: studentPassword,
      role: Role.STUDENT,
      isApproved: true,
    },
  })
  console.log('✅ 创建学生账号：张三 / student123')

  const student2 = await prisma.user.upsert({
    where: { username: '李四' },
    update: {},
    create: {
      username: '李四',
      password: studentPassword,
      role: Role.STUDENT,
      isApproved: true,
    },
  })
  console.log('✅ 创建学生账号：李四 / student123')

  // 创建待审核学生
  const pendingPassword = await bcrypt.hash('pending123', 10)
  const pending = await prisma.user.upsert({
    where: { username: '王五' },
    update: {},
    create: {
      username: '王五',
      password: pendingPassword,
      role: Role.STUDENT,
      isApproved: false,
    },
  })
  console.log('✅ 创建待审核账号：王五 / pending123')

  // =====================================
  // 创建示例订单数据（四层嵌套结构）
  // =====================================
  console.log('\n📦 创建示例订单数据...')

  // 张三 - 2026 年 3 月 - 诺唯赞
  const group1 = await prisma.orderGroup.create({
    data: {
      userId: student1.id,
      month: '2026-03',
      supplierName: '诺唯赞',
      invoiceNumber: '202603010001',
      invoiceDate: new Date('2026-03-05'),
      isVerified: true,
      isReimbursed: true,
      orderItems: {
        create: [
          {
            reagentName: 'DMEM 培养基 高糖 500ml',
            type: 'PUBLIC_REAGENT',
            price: 350.00,
            orderDate: new Date('2026-03-01'),
          },
          {
            reagentName: 'PBS 缓冲液 500ml',
            type: 'PUBLIC_REAGENT',
            price: 120.00,
            orderDate: new Date('2026-03-01'),
          },
        ],
      },
    },
  })
  console.log('✅ 创建订单组：张三 - 2026 年 3 月 - 诺唯赞 (2 项耗材)')

  // 张三 - 2026 年 3 月 - 生工
  const group2 = await prisma.orderGroup.create({
    data: {
      userId: student1.id,
      month: '2026-03',
      supplierName: '生工',
      invoiceNumber: '202603020002',
      invoiceDate: new Date('2026-03-06'),
      isVerified: true,
      isReimbursed: false,
      orderItems: {
        create: [
          {
            reagentName: 'Mfn3 多克隆抗体 100μl',
            type: 'PERSONAL_REAGENT',
            price: 1280.00,
            orderDate: new Date('2026-03-02'),
          },
        ],
      },
    },
  })
  console.log('✅ 创建订单组：张三 - 2026 年 3 月 - 生工 (1 项耗材)')

  // 李四 - 2026 年 3 月 - Thermo
  const group3 = await prisma.orderGroup.create({
    data: {
      userId: student2.id,
      month: '2026-03',
      supplierName: 'Thermo',
      invoiceNumber: '202603050003',
      invoiceDate: new Date('2026-03-08'),
      isVerified: false,
      isReimbursed: false,
      orderItems: {
        create: [
          {
            reagentName: '质粒提取试剂盒 50 次',
            type: 'PUBLIC_REAGENT',
            price: 890.00,
            orderDate: new Date('2026-03-05'),
          },
        ],
      },
    },
  })
  console.log('✅ 创建订单组：李四 - 2026 年 3 月 - Thermo (1 项耗材)')

  // 李四 - 2026 年 3 月 -  Sigma
  const group4 = await prisma.orderGroup.create({
    data: {
      userId: student2.id,
      month: '2026-03',
      supplierName: 'Sigma',
      // 无发票信息
      isVerified: false,
      isReimbursed: false,
      orderItems: {
        create: [
          {
            reagentName: '胎牛血清 500ml',
            type: 'PERSONAL_REAGENT',
            price: 2100.00,
            orderDate: new Date('2026-03-08'),
          },
        ],
      },
    },
  })
  console.log('✅ 创建订单组：李四 - 2026 年 3 月 - Sigma (1 项耗材，待开票)')

  // 张三 - 2026 年 2 月 - 诺唯赞（历史数据）
  const group5 = await prisma.orderGroup.create({
    data: {
      userId: student1.id,
      month: '2026-02',
      supplierName: '诺唯赞',
      invoiceNumber: '202602010001',
      invoiceDate: new Date('2026-02-05'),
      isVerified: true,
      isReimbursed: true,
      orderItems: {
        create: [
          {
            reagentName: 'RNA 提取试剂盒 50 次',
            type: 'PUBLIC_REAGENT',
            price: 1560.00,
            orderDate: new Date('2026-02-01'),
          },
        ],
      },
    },
  })
  console.log('✅ 创建订单组：张三 - 2026 年 2 月 - 诺唯赞 (1 项耗材)')

  console.log('\n✅ Seeding 完成！')
  console.log('\n📊 数据概览:')
  console.log('   - 用户：4 人 (1 管理员，2 学生，1 待审核)')
  console.log('   - 订单组：5 个')
  console.log('   - 耗材明细：6 项')
}

main()
  .catch((e) => {
    console.error('❌ Seeding 失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })