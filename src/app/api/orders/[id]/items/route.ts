import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// POST /api/orders/[id]/items - 向现有订单组添加耗材明细
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { reagentName, type, price, orderDate } = body;

    // 验证必填字段
    if (!reagentName || price === undefined) {
      return NextResponse.json(
        { error: "请填写试剂名称和价格" },
        { status: 400 }
      );
    }

    // 检查订单组是否存在
    const orderGroup = await prisma.orderGroup.findUnique({
      where: { id },
    });

    if (!orderGroup) {
      return NextResponse.json({ error: "订单组不存在" }, { status: 404 });
    }

    // 权限检查：学生只能向自己的订单添加明细
    if (user.role !== "ADMIN" && orderGroup.userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 创建新的耗材明细
    const orderItem = await prisma.orderItem.create({
      data: {
        orderGroupId: id,
        reagentName,
        type: type || "PUBLIC_REAGENT",
        price: parseFloat(price) || 0,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
      },
    });

    return NextResponse.json(orderItem, { status: 201 });
  } catch (error) {
    console.error("添加耗材明细错误:", error);
    return NextResponse.json(
      { error: "添加失败，请稍后重试" },
      { status: 500 }
    );
  }
}
