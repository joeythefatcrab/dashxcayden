import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InviteUserForm } from "@/components/superadmin/InviteUserForm";
import { InviteCodeManager } from "@/components/admin/InviteCodeManager";

export default async function UsersPage() {
  // Fetch all users
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const roleColors: Record<string, string> = {
    SUPERADMIN: "bg-purple-100 text-purple-800",
    ADMIN: "bg-blue-100 text-blue-800",
    PARENT: "bg-green-100 text-green-800",
    STUDENT: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">Manage all users across the platform</p>
      </div>

      <InviteUserForm />

      <InviteCodeManager isSuperAdmin />

      <Card>
        <CardHeader>
          <CardTitle>{users.length} Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="secondary"
                    className={roleColors[user.role] || ""}
                  >
                    {user.role}
                  </Badge>
                  <p className="text-sm text-gray-400 w-24 text-right">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
