import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// GET /api/orders - 获取订单数据
// 查询参数：
// - month: 年月 (例如 "2026-03")，可选，不传则获取所有月份
// - userId: 用户 ID，仅管理员可用
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (!user?.isApproved) {
      return NextResponse.json({ error: "账号未审核" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const targetUserId = searchParams.get("userId");

    // 构建查询条件
    let whereClause: any = {};

    // 管理员可以选择查看特定用户的数据，学生只能查看自己的
    if (user.role === "ADMIN") {
      if (targetUserId) {
        whereClause.userId = targetUserId;
      }
    } else {
      whereClause.userId = user.id;
    }

    // 按月份过滤
    if (month) {
      whereClause.month = month;
    }

    // 获取订单组（包含耗材明细）
    const orderGroups = await prisma.orderGroup.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        orderItems: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 序列化数据（处理 Decimal 类型）
    const serializedGroups = orderGroups.map(group => ({
      ...group,
      orderItems: group.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
      })),
    }));

    return NextResponse.json(serializedGroups);
  } catch (error) {
    console.error("获取订单错误:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// POST /api/orders - 创建或更新供应商子项（订单组）
// 使用 upsert 实现智能创建/添加：同一用户同月同供应商只有一个卡片
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (!user?.isApproved) {
      return NextResponse.json({ error: "账号未审核" }, { status: 403 });
    }

    const body = await request.json();
    const {
      month,
      supplierName,
      invoiceNumber,
      invoiceDate,
      orderItems,
    } = body;

    // 验证必填字段
    if (!month || !supplierName) {
      return NextResponse.json(
        { error: "请填写必填字段（年月、供应商名称）" },
        { status: 400 }
      );
    }

    // 验证月份格式 (YYYY-MM)
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return NextResponse.json(
        { error: "月份格式应为 YYYY-MM (例如：2026-03)" },
        { status: 400 }
      );
    }

    // 使用 upsert 实现智能创建/更新
    // 如果该用户在该月份已有该供应商的卡片，则更新；否则创建新卡片
    const orderGroup = await prisma.orderGroup.upsert({
      where: {
        userId_month_supplierName: {
          userId: user.id,
          month,
          supplierName,
        },
      },
      update: {
        // 如果提供了发票信息，则更新
        ...(invoiceNumber !== undefined && { invoiceNumber: invoiceNumber || null }),
        ...(invoiceDate !== undefined && { invoiceDate: invoiceDate ? new Date(invoiceDate) : null }),
      },
      create: {
        userId: user.id,
        month,
        supplierName,
        invoiceNumber: invoiceNumber || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
      },
    });

    // 创建耗材明细（如果有）
    if (orderItems && orderItems.length > 0) {
      await prisma.orderItem.createMany({
        data: orderItems.map((item: any) => ({
          orderGroupId: orderGroup.id,
          reagentName: item.reagentName,
          type: item.type || "PUBLIC_REAGENT",
          price: parseFloat(item.price) || 0,
          orderDate: item.orderDate ? new Date(item.orderDate) : new Date(),
        })),
      });
    }

    // 返回包含明细的完整订单组
    const result = await prisma.orderGroup.findUnique({
      where: { id: orderGroup.id },
      include: {
        orderItems: true,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("创建订单错误:", error);
    return NextResponse.json(
      { error: "创建失败，请稍后重试" },
      { status: 500 }
    );
  }
}