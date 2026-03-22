import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

export default async function Home() {
  const session = await auth();

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.user?.id },
    });

    if (user?.isApproved) {
      redirect("/dashboard");
    } else {
      redirect("/pending");
    }
  }

  redirect("/login");
}