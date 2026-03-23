import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// GET /api/orders/[id] - 获取单个订单组详情
export async function GET(
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

    const orderGroup = await prisma.orderGroup.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        orderItems: true,
      },
    });

    if (!orderGroup) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 权限检查：学生只能查看自己的订单
    if (user.role !== "ADMIN" && orderGroup.userId !== user.id) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }

    // 序列化数据（处理 Decimal 类型）
    const serializedOrder = {
      ...orderGroup,
      orderItems: orderGroup.orderItems.map((item: any) => ({
        ...item,
        price: Number(item.price),
      })),
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("获取订单详情错误:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - 更新订单组（发票信息、核查/报销状态）
export async function PUT(
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

    const existingOrder = await prisma.orderGroup.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 权限检查：学生只能更新自己的订单，管理员可以更新所有
    if (user.role !== "ADMIN" && existingOrder.userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    // 学生只能更新发票信息，管理员可以更新核查/报销状态
    const updateData: any = {};
    
    // 原有的统一发票字段（向后兼容）
    if (body.invoiceNumber !== undefined) {
      updateData.invoiceNumber = body.invoiceNumber;
    }
    if (body.invoiceDate !== undefined) {
      updateData.invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : null;
    }
    
    // 新增：按类型分离的发票字段
    if (body.publicInvoiceNumber !== undefined) {
      updateData.publicInvoiceNumber = body.publicInvoiceNumber;
    }
    if (body.publicInvoiceDate !== undefined) {
      updateData.publicInvoiceDate = body.publicInvoiceDate ? new Date(body.publicInvoiceDate) : null;
    }
    if (body.personalInvoiceNumber !== undefined) {
      updateData.personalInvoiceNumber = body.personalInvoiceNumber;
    }
    if (body.personalInvoiceDate !== undefined) {
      updateData.personalInvoiceDate = body.personalInvoiceDate ? new Date(body.personalInvoiceDate) : null;
    }
    
    // 管理员可以更新核查/报销状态
    if (user.role === "ADMIN") {
      // 原有的整体状态（向后兼容）
      if (body.isVerified !== undefined) {
        updateData.isVerified = body.isVerified;
      }
      if (body.isReimbursed !== undefined) {
        updateData.isReimbursed = body.isReimbursed;
      }
      
      // 新增：按类型分离的核查/报销状态
      if (body.isPublicVerified !== undefined) {
        updateData.isPublicVerified = body.isPublicVerified;
      }
      if (body.isPublicReimbursed !== undefined) {
        updateData.isPublicReimbursed = body.isPublicReimbursed;
      }
      if (body.isPersonalVerified !== undefined) {
        updateData.isPersonalVerified = body.isPersonalVerified;
      }
      if (body.isPersonalReimbursed !== undefined) {
        updateData.isPersonalReimbursed = body.isPersonalReimbursed;
      }
    }

    const updatedOrder = await prisma.orderGroup.update({
      where: { id },
      data: updateData,
      include: {
        orderItems: true,
      },
    });

    // 序列化数据（处理 Decimal 类型）
    const serializedOrder = {
      ...updatedOrder,
      orderItems: updatedOrder.orderItems.map((item: any) => ({
        ...item,
        price: Number(item.price),
      })),
    };

    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("更新订单错误:", error);
    return NextResponse.json(
      { error: "更新失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - 删除订单组
export async function DELETE(
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

    const existingOrder = await prisma.orderGroup.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    // 权限检查：学生只能删除自己的订单，管理员可以删除所有
    if (user.role !== "ADMIN" && existingOrder.userId !== user.id) {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    await prisma.orderGroup.delete({
      where: { id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除订单错误:", error);
    return NextResponse.json(
      { error: "删除失败，请稍后重试" },
      { status: 500 }
    );
  }
}