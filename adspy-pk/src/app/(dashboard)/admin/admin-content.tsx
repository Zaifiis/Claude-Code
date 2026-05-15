"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export function AdminContent() {
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/logs").then((r) => r.json()),
    ]).then(([u, l]) => {
      setUsers(u.users ?? []);
      setLogs(l.logs ?? []);
    }).finally(() => setLoading(false));
  }, []);

  async function triggerSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/cron/sync", {
        headers: { "x-cron-secret": prompt("Enter CRON_SECRET:") ?? "" },
      });
      const data = await res.json();
      if (res.ok) toast.success(`Sync complete! ${data.adsFound} ads, ${data.productsFound} products`);
      else toast.error(data.error ?? "Sync failed");
    } catch {
      toast.error("Sync request failed");
    } finally {
      setSyncing(false);
    }
  }

  async function updateUser(userId: string, plan: string) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan } : u));
    toast.success("User updated");
  }

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />) : [
          { label: "Total Users", value: users.length, icon: Users },
          { label: "PRO Users", value: users.filter((u) => u.plan === "PRO").length, icon: CheckCircle },
          { label: "Sync Logs", value: logs.length, icon: Clock },
          { label: "Last Sync", value: logs[0] ? timeAgo(logs[0].createdAt) : "Never", icon: RefreshCw },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 flex items-center gap-3">
              <Icon className="h-8 w-8 text-slate-400" />
              <div>
                <p className="text-xl font-bold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync control */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Sync</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-4">Trigger the daily sync job manually. This calls the Facebook Ads Library API across all keywords.</p>
          <Button onClick={triggerSync} loading={syncing}>
            <RefreshCw className="h-4 w-4" />
            Trigger Sync Now
          </Button>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-48 rounded-lg" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Name", "Email", "Plan", "Role", "Saved", "Searches", "Joined", "Actions"].map((h) => (
                      <th key={h} className="text-left pb-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 pr-4 font-medium text-slate-900">{u.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-slate-600 text-xs">{u.email}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.plan === "PRO" ? "warning" : "secondary"}>{u.plan}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={u.role === "ADMIN" ? "destructive" : "secondary"}>{u.role}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{u._count?.savedProducts ?? 0}</td>
                      <td className="py-3 pr-4 text-slate-600">{u._count?.searches ?? 0}</td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="py-3">
                        <Select
                          value={u.plan}
                          onChange={(e) => updateUser(u.id, e.target.value)}
                          className="w-24 text-xs"
                        >
                          <option value="FREE">FREE</option>
                          <option value="PRO">PRO</option>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync logs */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-48 rounded-lg" /> : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm">
                  {log.status === "SUCCESS" ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ) : log.status === "FAILED" ? (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="text-slate-600 text-xs">{formatDate(log.createdAt)}</span>
                  <span className="text-slate-700">{log.adsFound} ads · {log.productsFound} products</span>
                  {log.duration && <span className="text-slate-400 text-xs">{(log.duration / 1000).toFixed(1)}s</span>}
                  {log.errorMessage && <span className="text-red-500 text-xs ml-auto truncate max-w-xs">{log.errorMessage}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
