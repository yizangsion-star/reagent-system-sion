import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// POST /api/order-items - 向订单组添加耗材明细
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
    const { orderGroupId, reagentName, type, price, orderDate } = body;

    // 验证必填字段
    if (!orderGroupId || !reagentName || !type || !price) {
      return NextResponse.json(
        { error: "请填写必填字段" },
        { status: 400 }
      );
    }

    // 验证订单组存在且属于当前用户（或管理员）
    const orderGroup = await prisma.orderGroup.findUnique({
      where: { id: orderGroupId },
    });

    if (!orderGroup) {
      return NextResponse.json({ error: "订单组不存在" }, { status: 404 });
    }

    // 权限检查：学生只能向自己的订单组添加耗材
    if (user.role !== "ADMIN" && orderGroup.userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 创建耗材明细
    const orderItem = await prisma.orderItem.create({
      data: {
        orderGroupId,
        reagentName,
        type,
        price: parseFloat(price),
        orderDate: orderDate ? new Date(orderDate) : new Date(),
      },
    });

    return NextResponse.json(orderItem, { status: 201 });
  } catch (error) {
    console.error("添加耗材错误:", error);
    return NextResponse.json(
      { error: "添加失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// PUT /api/order-items - 更新耗材明细
export async function PUT(request: NextRequest) {
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
    const { id, reagentName, type, price, orderDate } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少耗材 ID" }, { status: 400 });
    }

    // 验证耗材存在
    const existingItem = await prisma.orderItem.findUnique({
      where: { id },
      include: { orderGroup: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "耗材不存在" }, { status: 404 });
    }

    // 权限检查：学生只能更新自己的耗材
    if (user.role !== "ADMIN" && existingItem.orderGroup.userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 更新耗材
    const updatedItem = await prisma.orderItem.update({
      where: { id },
      data: {
        reagentName: reagentName || existingItem.reagentName,
        type: type || existingItem.type,
        price: price ? parseFloat(price) : existingItem.price,
        orderDate: orderDate ? new Date(orderDate) : existingItem.orderDate,
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("更新耗材错误:", error);
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// DELETE /api/order-items - 删除耗材明细
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少耗材 ID" }, { status: 400 });
    }

    // 验证耗材存在
    const existingItem = await prisma.orderItem.findUnique({
      where: { id },
      include: { orderGroup: true },
    });

    if (!existingItem) {
      return NextResponse.json({ error: "耗材不存在" }, { status: 404 });
    }

    // 权限检查：学生只能删除自己的耗材
    if (user.role !== "ADMIN" && existingItem.orderGroup.userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    await prisma.orderItem.delete({
      where: { id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除耗材错误:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}