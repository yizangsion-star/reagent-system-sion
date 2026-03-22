import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// GET /api/admin/users - 获取所有用户列表
export async function GET() {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isApproved: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("获取用户列表错误:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - 管理用户（审核、修改角色）
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 检查是否为管理员
    const admin = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: "参数错误" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "approve":
        result = await prisma.user.update({
          where: { id: userId },
          data: { isApproved: true },
        });
        break;

      case "make_admin":
        result = await prisma.user.update({
          where: { id: userId },
          data: { role: "ADMIN", isApproved: true },
        });
        break;

      case "remove_admin":
        // 不能删除最后一个管理员
        const adminCount = await prisma.user.count({
          where: { role: "ADMIN" },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "至少需要保留一个管理员" },
            { status: 400 }
          );
        }
        result = await prisma.user.update({
          where: { id: userId },
          data: { role: "STUDENT" },
        });
        break;

      default:
        return NextResponse.json(
          { error: "无效的操作" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("用户管理错误:", error);
    return NextResponse.json(
      { error: "操作失败，请稍后重试" },
      { status: 500 }
    );
  }
}