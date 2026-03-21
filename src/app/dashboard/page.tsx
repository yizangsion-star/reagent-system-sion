import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";
import DashboardView from "./dashboard-view";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // 检查用户是否已审核
  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
  });

  if (!user?.isApproved) {
    redirect("/pending");
  }

  // 获取用户的所有试剂订单
  const orders = await prisma.reagentOrder.findMany({
    where: user.role === "ADMIN" ? {} : { userId: user.id },
    include: { user: true },
    orderBy: { orderDate: "desc" },
  });

  // 获取统计数据
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthOrders = await prisma.reagentOrder.findMany({
    where: {
      orderDate: { gte: currentMonth },
      ...(user.role !== "ADMIN" && { userId: user.id }),
    },
  });

  const totalSpent = monthOrders.reduce(
    (sum, order) => sum + Number(order.price),
    0
  );

  return (
    <DashboardView
      session={{
        user: {
          id: (session.user as any)?.id || "",
          username: (session.user as any)?.username || "",
          role: (session.user as any)?.role || "STUDENT",
        },
      }}
      orders={JSON.parse(JSON.stringify(orders))}
      totalSpent={totalSpent}
    />
  );
}