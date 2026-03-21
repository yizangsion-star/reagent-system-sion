import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";
import UserManagementView from "./user-management-view";

export default async function UserManagementPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // 检查是否为管理员
  const user = await prisma.user.findUnique({
    where: { id: session.user?.id },
  });

  if (user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 获取所有用户
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <UserManagementView users={JSON.parse(JSON.stringify(users))} />;
}