import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";
import UserManagementView from "./user-management-view";

export default async function UserManagementPage() {
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

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 获取所有用户
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

  return (
    <UserManagementView
      users={JSON.parse(JSON.stringify(users))}
    />
  );
}