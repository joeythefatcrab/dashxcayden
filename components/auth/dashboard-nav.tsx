"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Home, BookOpen, FileText, Users, LogOut, Menu } from "lucide-react";
import { useState } from "react";

export function DashboardNav() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!session?.user) return null;

  const role = session.user.role;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["PARENT", "STUDENT", "TEACHER", "ADMIN"] },
    { name: "Curricula", href: "/teacher/curricula", icon: BookOpen, roles: ["TEACHER", "ADMIN"] },
    { name: "Reports", href: "/teacher/reports", icon: FileText, roles: ["TEACHER", "ADMIN"] },
    { name: "My Lessons", href: "/student/lessons", icon: BookOpen, roles: ["STUDENT"] },
    { name: "My Students", href: "/parent/students", icon: Users, roles: ["PARENT"] },
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold">
            Homeschool SaaS
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 text-sm md:flex">
            <span className="text-muted-foreground">{session.user.email}</span>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {role}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="hidden md:flex"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
