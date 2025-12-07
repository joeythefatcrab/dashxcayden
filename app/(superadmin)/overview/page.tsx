export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="bg-blue-500 text-white p-4 rounded">
        <h1 className="text-3xl font-bold">Superadmin Dashboard</h1>
        <p className="text-blue-100">
          Platform-wide overview and management
        </p>
      </div>

      <div className="bg-green-100 p-6 rounded-lg border-4 border-green-500">
        <h2 className="text-xl font-semibold mb-4 text-green-900">Static Test Page</h2>
        <p className="text-green-800 text-lg">
          If you can see this GREEN BOX, the superadmin route is working correctly.
        </p>
        <p className="mt-2 text-sm text-green-700">
          The database queries will be added back once we confirm the route works.
        </p>
      </div>

      <div className="bg-red-100 p-6 rounded-lg border-4 border-red-500">
        <h2 className="text-xl font-semibold mb-4 text-red-900">RED BOX TEST</h2>
        <p className="text-red-800 text-lg">
          This is a bright red box for visibility testing.
        </p>
      </div>
    </div>
  );
}
