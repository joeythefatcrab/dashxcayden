"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useTransition } from "react";

interface Organization {
  id: string;
  name: string;
}

interface UserFiltersProps {
  organizations: Organization[];
}

export function UserFilters({ organizations }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [org, setOrg] = useState(searchParams.get("org") || "all");

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (role !== "all") params.set("role", role);
    if (org !== "all") params.set("org", org);

    startTransition(() => {
      router.push(`/superadmin/users${params.toString() ? `?${params.toString()}` : ""}`);
    });
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              const params = new URLSearchParams();
              if (e.target.value) params.set("search", e.target.value);
              if (role !== "all") params.set("role", role);
              if (org !== "all") params.set("org", org);
              startTransition(() => {
                router.push(
                  `/superadmin/users${params.toString() ? `?${params.toString()}` : ""}`
                );
              });
            }}
            className="pl-8"
          />
        </div>
      </div>

      {/* Role Filter */}
      <div className="w-[180px]">
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (e.target.value !== "all") params.set("role", e.target.value);
            if (org !== "all") params.set("org", org);
            startTransition(() => {
              router.push(
                `/superadmin/users${params.toString() ? `?${params.toString()}` : ""}`
              );
            });
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Roles</option>
          <option value="SUPERADMIN">Superadmin</option>
          <option value="ADMIN">Admin</option>
          <option value="PARENT">Parent</option>
          <option value="STUDENT">Student</option>
        </select>
      </div>

      {/* Organization Filter */}
      <div className="w-[220px]">
        <select
          value={org}
          onChange={(e) => {
            setOrg(e.target.value);
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (role !== "all") params.set("role", role);
            if (e.target.value !== "all") params.set("org", e.target.value);
            startTransition(() => {
              router.push(
                `/superadmin/users${params.toString() ? `?${params.toString()}` : ""}`
              );
            });
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="all">All Organizations</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
