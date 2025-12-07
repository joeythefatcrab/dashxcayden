export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
        <p className="text-muted-foreground">
          Platform-wide overview and management
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Static Test Page</h2>
        <p className="text-gray-600">
          If you can see this, the superadmin route is working correctly.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          The database queries will be added back once we confirm the route works.
        </p>
      </div>
    </div>
  );
}
