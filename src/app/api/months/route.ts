import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

// GET /api/months - 获取所有存在的年月列表
// 返回格式：["2026-03", "2026-02", ...] 按时间倒序
export async function GET() {
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

    // 从 OrderGroup 表中获取所有不同的月份
    const orderGroups = await prisma.orderGroup.findMany({
      select: {
        month: true,
      },
      distinct: ["month"],
      orderBy: { month: "desc" },
    });

    // 提取月份数组
    const months = orderGroups.map((g) => g.month);

    return NextResponse.json(months);
  } catch (error) {
    console.error("获取月份列表错误:", error);
    return NextResponse.json(
      { error: "获取失败，请稍后重试" },
      { status: 500 }
    );
  }
}