import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// 获取单个订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (!user?.isApproved) {
      return NextResponse.json({ error: "账号未审核" }, { status: 403 });
    }

    const order = await prisma.reagentOrder.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 学生只能查看自己的订单
    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return NextResponse.json({ error: "无权限查看" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("获取订单错误:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 更新订单
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (!user?.isApproved) {
      return NextResponse.json({ error: "账号未审核" }, { status: 403 });
    }

    const order = await prisma.reagentOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 学生只能编辑自己的订单，管理员可以编辑所有订单
    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return NextResponse.json({ error: "无权限编辑" }, { status: 403 });
    }

    const body = await request.json();
    const {
      reagentName,
      type,
      orderDate,
      price,
      invoiceNumber,
      invoiceDate,
      isVerified,
      isReimbursed,
    } = body;

    const updateData: Record<string, any> = {};
    if (reagentName !== undefined) updateData.reagentName = reagentName;
    if (type !== undefined) updateData.type = type;
    if (orderDate !== undefined) updateData.orderDate = new Date(orderDate);
    if (price !== undefined) updateData.price = parseFloat(price);
    if (invoiceNumber !== undefined) updateData.invoiceNumber = invoiceNumber;
    if (invoiceDate !== undefined)
      updateData.invoiceDate = invoiceDate ? new Date(invoiceDate) : null;
    // 只有管理员可以修改核查和报销状态
    if (user.role === "ADMIN") {
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (isReimbursed !== undefined) updateData.isReimbursed = isReimbursed;
    }

    const updatedOrder = await prisma.reagentOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("更新订单错误:", error);
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// 删除订单
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (!user?.isApproved) {
      return NextResponse.json({ error: "账号未审核" }, { status: 403 });
    }

    const order = await prisma.reagentOrder.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 学生只能删除自己的订单，管理员可以删除所有订单
    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return NextResponse.json({ error: "无权限删除" }, { status: 403 });
    }

    await prisma.reagentOrder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除订单错误:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}
