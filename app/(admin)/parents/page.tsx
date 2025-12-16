import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ParentManager } from "@/components/admin/ParentManager";

export default async function AdminParentsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Fetch all parents (single organization - all admins see all parents)
  const parents = await db.user.findMany({
    where: {
      role: "PARENT",
    },
    include: {
      children: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          enrollments: {
            include: {
              curriculum: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          children: true,
          curricula: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serialize dates for client component
  const serializedParents = parents.map(parent => ({
    ...parent,
    createdAt: parent.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Parents</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage all parent accounts under your administration.
        </p>
      </div>

      <ParentManager parents={serializedParents} />
    </div>
  );
}
