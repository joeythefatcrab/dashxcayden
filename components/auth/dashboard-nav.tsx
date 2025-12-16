"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Home, BookOpen, FileText, Users, LogOut, Menu, Settings, Search, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DashboardNav() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();

  if (!session?.user) return null;

  const role = session.user.role;
  // @ts-ignore - Check if impersonating
  const isImpersonating = session.user.isImpersonating || false;

  const handleExitQAMode = async () => {
    setIsExiting(true);
    try {
      const response = await fetch("/api/superadmin/impersonate", {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/superadmin/overview");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to exit QA mode:", error);
      setIsExiting(false);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["PARENT", "STUDENT", "ADMIN"] },
    { name: "My Courses", href: "/my-courses", icon: BookOpen, roles: ["STUDENT"] },
    { name: "Browse Courses", href: "/browse-courses", icon: Search, roles: ["STUDENT"] },
    { name: "Manage Parents", href: "/parents", icon: Users, roles: ["ADMIN"] },
    { name: "Curricula", href: "/curricula", icon: BookOpen, roles: ["PARENT", "ADMIN"] },
    { name: "My Students", href: "/students", icon: Users, roles: ["PARENT"] },
    { name: "Reports", href: "/reports", icon: FileText, roles: ["PARENT", "ADMIN"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["PARENT", "ADMIN", "STUDENT", "SUPERADMIN", "TEACHER"] },
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
          {/* QA Mode Exit Button */}
          {isImpersonating && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitQAMode}
              disabled={isExiting}
              className="hidden bg-orange-50 text-orange-700 hover:bg-orange-100 md:flex"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Exit QA Mode
            </Button>
          )}

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
            {/* QA Mode Exit Button (Mobile) */}
            {isImpersonating && (
              <button
                onClick={handleExitQAMode}
                disabled={isExiting}
                className="flex items-center gap-2 rounded-md bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
              >
                <RotateCcw className="h-4 w-4" />
                Exit QA Mode
              </button>
            )}
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
