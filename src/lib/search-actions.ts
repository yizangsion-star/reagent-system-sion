"use server";

import { prisma } from "./prismadb";
import { auth } from "./auth";

export interface SearchResult {
  id: string;
  reagentName: string;
  type: string;
  price: number;
  orderDate: string;
  orderGroup: {
    id: string;
    month: string;
    supplierName: string;
    invoiceNumber: string | null;
    invoiceDate: string | null;
    isVerified: boolean;
    isReimbursed: boolean;
    user: {
      id: string;
      username: string;
    };
  };
}

/**
 * 全局搜索试剂/耗材
 * @param query 搜索关键词
 * @returns 匹配的 OrderItem 列表，包含关联的 OrderGroup 和 User 信息
 */
export async function searchReagents(query: string): Promise<{
  success: boolean;
  data?: SearchResult[];
  error?: string;
}> {
  try {
    // 验证用户登录状态
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "未登录" };
    }

    // 去除前后空格，如果为空则返回空结果
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return { success: true, data: [] };
    }

    // 执行搜索查询
    // 注意：使用 mode: 'insensitive' 实现 PostgreSQL 不区分大小写搜索
    const results = await prisma.orderItem.findMany({
      where: {
        reagentName: {
          contains: trimmedQuery,
          mode: "insensitive", // PostgreSQL 不区分大小写搜索
        },
      },
      include: {
        orderGroup: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        orderGroup: {
          month: "desc", // 按月份倒序排列（最新的在前）
        },
      },
    });

    // 转换数据格式
    const formattedResults: SearchResult[] = results.map((item) => ({
      id: item.id,
      reagentName: item.reagentName,
      type: item.type,
      price: Number(item.price),
      orderDate: item.orderDate.toISOString(),
      orderGroup: {
        id: item.orderGroup.id,
        month: item.orderGroup.month,
        supplierName: item.orderGroup.supplierName,
        invoiceNumber: item.orderGroup.invoiceNumber,
        invoiceDate: item.orderGroup.invoiceDate?.toISOString() || null,
        isVerified: item.orderGroup.isVerified,
        isReimbursed: item.orderGroup.isReimbursed,
        user: {
          id: item.orderGroup.user.id,
          username: item.orderGroup.user.username,
        },
      },
    }));

    return { success: true, data: formattedResults };
  } catch (error) {
    console.error("搜索试剂失败:", error);
    return { success: false, error: "搜索失败，请稍后重试" };
  }
}
