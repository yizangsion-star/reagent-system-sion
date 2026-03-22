import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";
import { Navbar } from "@/components/navbar";

interface SearchPageProps {
  searchParams: { q?: string };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user?.isApproved) {
    redirect("/pending");
  }

  const query = searchParams.q?.trim() || "";
  let results: any[] = [];

  // 如果有搜索关键词，执行搜索
  if (query) {
    results = await prisma.orderItem.findMany({
      where: {
        reagentName: {
          contains: query,
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
          month: "desc", // 按月份倒序排列
        },
      },
    });
  }

  const formatPrice = (price: any) => {
    return `¥${Number(price).toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 全局导航栏 */}
      <Navbar
        username={user.username}
        userRole={user.role as "ADMIN" | "STUDENT"}
      />

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 搜索标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">搜索结果</h2>
          {query && (
            <p className="mt-2 text-gray-600">
              关键词：<span className="font-medium text-indigo-600">"{query}"</span>
              <span className="ml-2 text-gray-500">（共找到 {results.length} 条记录）</span>
            </p>
          )}
        </div>

        {/* 无搜索关键词状态 */}
        {!query && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">请输入搜索关键词</h3>
            <p className="mt-2 text-gray-500">在上方搜索框中输入试剂名称，按回车键进行搜索</p>
          </div>
        )}

        {/* 搜索结果为空 */}
        {query && results.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">未找到购买记录</h3>
            <p className="mt-2 text-gray-500">
              未找到包含 "{query}" 的试剂购买记录，请尝试其他关键词
            </p>
          </div>
        )}

        {/* 搜索结果表格 */}
        {query && results.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      试剂/耗材名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      单价
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      供应商
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发票号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      购买月份
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      购买人
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.reagentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            item.type === "PUBLIC_REAGENT"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {item.type === "PUBLIC_REAGENT" ? "公共试剂" : "个人试剂"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.orderGroup.supplierName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.orderGroup.invoiceNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.orderGroup.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.orderGroup.user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              item.orderGroup.isVerified
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {item.orderGroup.isVerified ? "已核查" : "待核查"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              item.orderGroup.isReimbursed
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.orderGroup.isReimbursed ? "已报销" : "未报销"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 结果统计 */}
            <div className="bg-gray-50 px-6 py-3 border-t">
              <p className="text-sm text-gray-600">
                共找到 <span className="font-medium text-gray-900">{results.length}</span> 条记录
                {user.role === "ADMIN" && (
                  <span className="ml-2 text-gray-500">（跨所有用户的购买记录）</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* 返回按钮 */}
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            返回仪表盘
          </Link>
        </div>
      </main>
    </div>
  );
}
