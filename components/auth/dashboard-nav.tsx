"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Home, BookOpen, FileText, Users, LogOut, Menu, Settings,
  Search, RotateCcw, MessageSquare, UserCog, Shield, ChevronDown,
  ClipboardList, Activity, CalendarCheck, Clock, UserSearch,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function DashboardNav() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [revisionCount, setRevisionCount] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);
  const router = useRouter();
  const role = session?.user?.role;

  useEffect(() => {
    if (role === "STUDENT") {
      fetch("/api/student/revision-count")
        .then((r) => r.json())
        .then((d) => setRevisionCount(d.count || 0))
        .catch(() => {});
    }
  }, [role]);

  useEffect(() => {
    if (role !== "ADMIN" && role !== "SUPERADMIN") return;
    const poll = () => {
      fetch("/api/admin/pending-reports")
        .then((r) => r.json())
        .then((d) => setPendingReports(d.count || 0))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [role]);

  if (!session?.user) return null;
  // @ts-ignore
  const isImpersonating = session.user.isImpersonating || false;

  const handleExitQAMode = async () => {
    setIsExiting(true);
    try {
      const response = await fetch("/api/superadmin/impersonate", { method: "DELETE" });
      if (response.ok) {
        router.push("/superadmin/overview");
        router.refresh();
      }
    } catch {
      setIsExiting(false);
    }
  };

  const isAdmin = role === "ADMIN" || role === "SUPERADMIN";

  // ── Nav item groups ──────────────────────────────────────────────────────────

  const adminPeopleMenu = [
    { name: "Manage Parents", href: "/parents", icon: Users },
    { name: "Assign Students", href: "/assign-students", icon: UserCog },
    { name: "Impersonate User", href: "/admin/impersonate", icon: UserSearch },
  ];

  const adminContentMenu = [
    { name: "Curricula", href: "/curricula", icon: BookOpen },
    { name: "Curriculum Access", href: "/curriculum-access", icon: Shield },
    { name: "Programs", href: "/programs", icon: CalendarCheck },
  ];

  const adminTrackMenu = [
    { name: "Reports", href: "/monthly-reports", icon: FileText },
    { name: "Activities", href: "/activities", icon: Activity },
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ];

  const studentNav = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Program", href: "/my-program", icon: CalendarCheck },
    { name: "My Courses", href: "/my-courses", icon: BookOpen },
    { name: "My Submissions", href: "/my-submissions", icon: ClipboardList },
    { name: "My Time", href: "/my-time", icon: Clock },
    { name: "Browse Courses", href: "/browse-courses", icon: Search },
  ];

  const parentNav = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Students", href: "/students", icon: Users },
    { name: "Curricula", href: "/curricula", icon: BookOpen },
    { name: "Reports", href: "/monthly-reports", icon: FileText },
  ];

  // ── Shared link style ────────────────────────────────────────────────────────

  const navLink = "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground whitespace-nowrap";
  const dropTrigger = `${navLink} outline-none`;

  // ── Desktop nav renderers ────────────────────────────────────────────────────

  const renderAdminNav = () => (
    <>
      <Link href="/dashboard" className={navLink}>
        <Home className="h-4 w-4" />
        Dashboard
      </Link>

      <NavDropdown label="People" icon={<Users className="h-4 w-4" />} triggerClass={dropTrigger} items={adminPeopleMenu} />
      <NavDropdown label="Content" icon={<BookOpen className="h-4 w-4" />} triggerClass={dropTrigger} items={adminContentMenu} />
      <NavDropdown label="Track" icon={<Activity className="h-4 w-4" />} triggerClass={dropTrigger} items={adminTrackMenu} badge={pendingReports} />
    </>
  );

  const renderStudentNav = () => (
    <>
      {studentNav.map((item) => (
        <Link key={item.name} href={item.href} className={navLink}>
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
        <Link key={item.name} href={item.href} className={navLink}>
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </>
  );

  // ── User initials avatar ─────────────────────────────────────────────────────

  const displayName = session.user.name || session.user.email || "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // ── Mobile nav ───────────────────────────────────────────────────────────────

  const renderMobileNav = () => {
    const mobileLink = "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground";
    const close = () => setMobileMenuOpen(false);

    if (isAdmin) {
      return (
        <>
          <Link href="/dashboard" className={mobileLink} onClick={close}><Home className="h-4 w-4" />Dashboard</Link>
          <MobileGroup label="People" items={adminPeopleMenu} onClose={close} />
          <MobileGroup label="Content" items={adminContentMenu} onClose={close} />
          <MobileGroup label="Track" items={adminTrackMenu} onClose={close} />
          <Link href="/admin/impersonate" className={mobileLink} onClick={close}><UserSearch className="h-4 w-4" />Impersonate User</Link>
          <Link href="/settings" className={mobileLink} onClick={close}><Settings className="h-4 w-4" />Settings</Link>
        </>
      );
    }
    if (role === "PARENT") {
      return (
        <>
          {parentNav.map((item) => (
            <Link key={item.name} href={item.href} className={mobileLink} onClick={close}>
              <item.icon className="h-4 w-4" />{item.name}
            </Link>
          ))}
          <Link href="/settings" className={mobileLink} onClick={close}><Settings className="h-4 w-4" />Settings</Link>
        </>
      );
    }
    return (
      <>
        {studentNav.map((item) => (
          <Link key={item.name} href={item.href} className={mobileLink} onClick={close}>
            <item.icon className="h-4 w-4" />
            {item.name}
            {item.name === "My Program" && revisionCount > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                {revisionCount > 9 ? "9+" : revisionCount}
              </span>
            )}
          </Link>
        ))}
        <Link href="/settings" className={mobileLink} onClick={close}><Settings className="h-4 w-4" />Settings</Link>
      </>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold whitespace-nowrap">
            HomeschoolHero
          </Link>
          <nav className="hidden items-center gap-4 lg:flex">
            {isAdmin ? renderAdminNav() : role === "PARENT" ? renderParentNav() : renderStudentNav()}
          </nav>
        </div>

        {/* Right: action buttons + user menu */}
        <div className="flex items-center gap-2">
          {/* Exit impersonation */}
          {isImpersonating && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExitQAMode}
              disabled={isExiting}
              className="hidden bg-orange-50 text-orange-700 hover:bg-orange-100 md:flex"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Exit QA
            </Button>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-2 rounded-full border px-2 py-1 text-sm hover:bg-muted transition-colors outline-none">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {initials || "?"}
                </span>
                <span className="max-w-[120px] truncate text-muted-foreground">{session.user.name || session.user.email}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-3 py-2">
                <p className="text-sm font-medium truncate">{session.user.name || "—"}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {role}
                </span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-destructive cursor-pointer focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile menu toggle */}
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

// ── Helper components ──────────────────────────────────────────────────────────

function NavDropdown({
  label,
  icon,
  triggerClass,
  items,
  badge,
}: {
  label: string;
  icon: React.ReactNode;
  triggerClass: string;
  items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  badge?: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClass}>
        {icon}
        {label}
        {badge && badge > 0 ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        ) : null}
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item) => (
          <DropdownMenuItem key={item.name} asChild>
            <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileGroup({
  label,
  items,
  onClose,
}: {
  label: string;
  items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  onClose: () => void;
}) {
  return (
    <div className="pl-2 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      {items.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground pl-4"
          onClick={onClose}
        >
          <item.icon className="h-4 w-4" />
          {item.name}
        </Link>
      ))}
    </div>
  );
}
