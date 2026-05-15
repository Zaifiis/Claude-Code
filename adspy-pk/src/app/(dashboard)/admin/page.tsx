import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { AdminContent } from "./admin-content";

export const metadata: Metadata = { title: "Admin Panel" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");
  return (
    <div>
      <Header title="Admin Panel" />
      <div className="p-6">
        <AdminContent />
      </div>
    </div>
  );
}
