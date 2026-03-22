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

  // 获取所有存在的月份
  const monthGroups = await prisma.orderGroup.findMany({
    select: {
      month: true,
    },
    distinct: ["month"],
    orderBy: { month: "desc" },
  });

  const months = monthGroups.map((g) => g.month);

  // 获取所有学生用户（用于管理员选择查看）
  const students = user.role === "ADMIN" 
    ? await prisma.user.findMany({
        where: { role: "STUDENT", isApproved: true },
        select: { id: true, username: true },
      })
    : [];

  return (
    <DashboardView
      session={session as any}
      months={months}
      students={JSON.parse(JSON.stringify(students))}
    />
  );
}