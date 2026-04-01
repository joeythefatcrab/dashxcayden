"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Home, BookOpen, FileText, Users, LogOut, Menu, Settings, Search, RotateCcw, MessageSquare, UserCog, Clock, Shield, ChevronDown, ClipboardList, Activity, CalendarCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function DashboardNav() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [revisionCount, setRevisionCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (role === "STUDENT") {
      fetch("/api/student/revision-count")
        .then((r) => r.json())
        .then((d) => setRevisionCount(d.count || 0))
        .catch(() => {});
    }
  }, [role]);

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

  // Admin navigation groups
  const adminPeopleMenu = [
    { name: "Manage Parents", href: "/parents", icon: Users },
    { name: "Assign Students", href: "/assign-students", icon: UserCog },
  ];

  const adminCurriculumMenu = [
    { name: "Curricula", href: "/curricula", icon: BookOpen },
    { name: "Curriculum Access", href: "/curriculum-access", icon: Shield },
    { name: "Programs", href: "/programs", icon: CalendarCheck },
  ];

  // Student navigation
  const studentNav = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Program", href: "/my-program", icon: CalendarCheck },
    { name: "My Courses", href: "/my-courses", icon: BookOpen },
    { name: "My Submissions", href: "/my-submissions", icon: ClipboardList },
    { name: "My Time", href: "/my-time", icon: Clock },
    { name: "Browse Courses", href: "/browse-courses", icon: Search },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Parent navigation
  const parentNav = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Students", href: "/students", icon: Users },
    { name: "Curricula", href: "/curricula", icon: BookOpen },
    { name: "Reports", href: "/monthly-reports", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const renderAdminNav = () => (
    <>
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
        <Home className="h-4 w-4" />
        Dashboard
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap outline-none">
          <Users className="h-4 w-4" />
          People
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {adminPeopleMenu.map((item) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap outline-none">
          <BookOpen className="h-4 w-4" />
          Curriculum
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {adminCurriculumMenu.map((item) => (
            <DropdownMenuItem key={item.name} asChild>
              <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Link href="/messages" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
        <MessageSquare className="h-4 w-4" />
        Messages
      </Link>

      <Link href="/monthly-reports" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
        <FileText className="h-4 w-4" />
        Reports
      </Link>

      <Link href="/activities" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
        <Activity className="h-4 w-4" />
        Activities
      </Link>

      <Link href="/settings" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap">
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </>
  );

  const renderStudentNav = () => (
    <>
      {studentNav.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
        >
          <item.icon className="h-4 w-4" />
          {item.name}
          {item.name === "My Program" && revisionCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {revisionCount > 9 ? "9+" : revisionCount}
            </span>
          )}
        </Link>
      ))}
    </>
  );

  const renderParentNav = () => (
    <>
      {parentNav.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </>
  );

  // Mobile navigation
  const renderMobileNav = () => {
    if (role === "ADMIN" || role === "SUPERADMIN") {
      return (
        <>
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="pl-2 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">People</p>
            {adminPeopleMenu.map((item) => (
              <Link key={item.name} href={item.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground pl-4" onClick={() => setMobileMenuOpen(false)}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pl-2 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Curriculum</p>
            {adminCurriculumMenu.map((item) => (
              <Link key={item.name} href={item.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground pl-4" onClick={() => setMobileMenuOpen(false)}>
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
          <Link href="/messages" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            <MessageSquare className="h-4 w-4" />
            Messages
          </Link>
          <Link href="/monthly-reports" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            <FileText className="h-4 w-4" />
            Reports
          </Link>
          <Link href="/programs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            <CalendarCheck className="h-4 w-4" />
            Programs
          </Link>
          <Link href="/settings" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </>
      );
    } else if (role === "PARENT") {
      return parentNav.map((item) => (
        <Link key={item.name} href={item.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ));
    } else {
      return studentNav.map((item) => (
        <Link key={item.name} href={item.href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
          <item.icon className="h-4 w-4" />
          {item.name}
          {item.name === "My Program" && revisionCount > 0 && (
            <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {revisionCount > 9 ? "9+" : revisionCount}
            </span>
          )}
        </Link>
      ));
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold whitespace-nowrap">
            HomeschoolHero
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-4 lg:flex">
            {role === "ADMIN" || role === "SUPERADMIN" ? renderAdminNav() : role === "PARENT" ? renderParentNav() : renderStudentNav()}
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
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t bg-background px-4 py-4 lg:hidden">
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
            {renderMobileNav()}
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
