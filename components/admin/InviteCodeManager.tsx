"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Plus, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type InviteCode = {
  id: string;
  code: string;
  role: string;
  label: string | null;
  usedAt: string | null;
  usedByEmail: string | null;
  expiresAt: string | null;
  createdAt: string;
};

interface InviteCodeManagerProps {
  isSuperAdmin?: boolean;
}

export function InviteCodeManager({ isSuperAdmin = false }: InviteCodeManagerProps) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [role, setRole] = useState("PARENT");
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [newCode, setNewCode] = useState<{ code: string; signupUrl: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const availableRoles = isSuperAdmin
    ? ["PARENT", "STUDENT", "ADMIN"]
    : ["PARENT", "STUDENT"];

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await fetch("/api/admin/invite-codes");
      if (res.ok) setCodes(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, label: label || undefined, expiresAt: expiresAt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to create code"); return; }
      setNewCode({ code: data.code, signupUrl: data.signupUrl });
      setCodes((prev) => [data, ...prev]);
      setLabel("");
      setExpiresAt("");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Revoke this invite code?")) return;
    const res = await fetch("/api/admin/invite-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setCodes((prev) => prev.filter((c) => c.id !== id));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSignupUrl = (code: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/sign-up?invite=${code}`;
  };

  const roleBadgeClass: Record<string, string> = {
    ADMIN: "bg-blue-100 text-blue-800",
    PARENT: "bg-green-100 text-green-800",
    STUDENT: "bg-gray-100 text-gray-800",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Invite Codes</CardTitle>
            <CardDescription>Single-use links that set the account role automatically</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setShowForm(!showForm); setNewCode(null); }}>
            <Plus className="h-4 w-4 mr-1" />
            New Code
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleCreate} className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Label (optional)</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Johnson Family"
                />
              </div>
            </div>
            <div>
              <Label>Expires (optional)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={creating} size="sm">
              {creating ? "Creating..." : "Generate Code"}
            </Button>
          </form>
        )}

        {newCode && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-green-900">Code created! Share this link:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border rounded px-2 py-1 break-all">
                {newCode.signupUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(newCode.signupUrl, "new")}
              >
                {copiedId === "new" ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No invite codes yet</p>
        ) : (
          <div className="space-y-2">
            {codes.map((c) => {
              const url = getSignupUrl(c.code);
              const isUsed = !!c.usedAt;
              const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${isUsed || isExpired ? "opacity-50" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className={roleBadgeClass[c.role] || ""}>
                        {c.role}
                      </Badge>
                      {c.label && <span className="font-medium">{c.label}</span>}
                      {isUsed && (
                        <span className="text-xs text-muted-foreground">
                          Used by {c.usedByEmail} {formatDistanceToNow(new Date(c.usedAt!), { addSuffix: true })}
                        </span>
                      )}
                      {!isUsed && isExpired && (
                        <span className="text-xs text-destructive">Expired</span>
                      )}
                      {!isUsed && !isExpired && c.expiresAt && (
                        <span className="text-xs text-muted-foreground">
                          Expires {formatDistanceToNow(new Date(c.expiresAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">{c.code}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isUsed && !isExpired && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(url, c.id)}
                        title="Copy signup link"
                      >
                        {copiedId === c.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(c.id)}
                      title="Revoke"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
