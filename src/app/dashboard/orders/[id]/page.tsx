import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";
import OrderDetailView from "./order-detail-view";

// 强制动态渲染
export const dynamic = "force-dynamic";
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
  });

  if (!user?.isApproved) {
    redirect("/pending");
  }

  const order = await prisma.reagentOrder.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!order) {
    redirect("/dashboard");
  }

  // 学生只能查看自己的订单
  if (user.role !== "ADMIN" && order.userId !== user.id) {
    redirect("/dashboard");
  }

  return (
    <OrderDetailView
      order={JSON.parse(JSON.stringify(order))}
      isAdmin={user.role === "ADMIN"}
    />
  );
}