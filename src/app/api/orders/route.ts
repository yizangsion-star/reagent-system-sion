import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// 获取订单列表
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

    // 管理员可以看到所有订单，学生只能看到自己的
    const orders = await prisma.reagentOrder.findMany({
      where: user.role === "ADMIN" ? {} : { userId: user.id },
      include: { user: true },
      orderBy: { orderDate: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("获取订单错误:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 创建新订单
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
    const { reagentName, type, orderDate, price, invoiceNumber, invoiceDate } = body;

    if (!reagentName || !type || !orderDate || !price) {
      return NextResponse.json(
        { error: "请填写必填字段" },
        { status: 400 }
      );
    }

    const order = await prisma.reagentOrder.create({
      data: {
        userId: user.id,
        reagentName,
        type,
        orderDate: new Date(orderDate),
        price: parseFloat(price),
        invoiceNumber: invoiceNumber || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("创建订单错误:", error);
    return NextResponse.json(
      { error: "创建失败，请稍后重试" },
      { status: 500 }
    );
  }
}