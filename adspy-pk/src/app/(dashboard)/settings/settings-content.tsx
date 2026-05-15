"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Zap, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function SettingsContent() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function saveName() {
    setSaving(true);
    // In a full implementation this would call PATCH /api/settings/profile
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Profile updated");
    setSaving(false);
  }

  const isPro = session?.user?.plan === "PRO";

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Plan */}
      <Card className={isPro ? "border-amber-200 bg-amber-50/30" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Your Plan
              </CardTitle>
              <CardDescription>Current subscription</CardDescription>
            </div>
            <Badge variant={isPro ? "warning" : "secondary"} className="text-sm px-3 py-1">
              {session?.user?.plan ?? "FREE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isPro ? (
            <p className="text-sm text-slate-600">You have full access to all features including unlimited products, CSV export, and advanced filters.</p>
          ) : (
            <div>
              <p className="text-sm text-slate-600 mb-3">You are on the Free plan. Limits: 10 products/day, 5 searches/day, no CSV export.</p>
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                {[
                  "Unlimited products", "CSV / Excel export",
                  "Advanced filters", "Priority sync results",
                  "Saved notes", "Email alerts",
                ].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-slate-700">
                    <span className="text-emerald-500">✓</span> {f}
                  </div>
                ))}
              </div>
              <Button>Upgrade to PRO — $19/month</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-4 w-4" />Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <Input value={session?.user?.email ?? ""} disabled className="bg-slate-50" />
          </div>
          <Button onClick={saveName} loading={saving}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" />Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" placeholder="Current password" />
          <Input type="password" placeholder="New password" />
          <Input type="password" placeholder="Confirm new password" />
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2"><Trash2 className="h-4 w-4" />Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 mb-3">Permanently delete your account and all data. This cannot be undone.</p>
          <Button variant="destructive" size="sm">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
