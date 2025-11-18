import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ParentManager } from "@/components/admin/ParentManager";

export default async function AdminParentsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Fetch all parents managed by this admin
  const parents = await prisma.user.findMany({
    where: {
      role: "PARENT",
      adminId: session.user.id,
    },
    include: {
      children: {
        include: {
          enrollments: {
            include: {
              curriculum: true,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Parents</h1>
        <p className="mt-2 text-muted-foreground">
          View and manage all parent accounts under your administration.
        </p>
      </div>

      <ParentManager parents={parents} />
    </div>
  );
}
