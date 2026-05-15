import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/dashboard/header";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6">
        <DashboardContent userName={session?.user?.name ?? "User"} />
      </div>
    </div>
  );
}
