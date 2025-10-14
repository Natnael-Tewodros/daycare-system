"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  ClipboardList,
  UserCog,
  Building2,
  LayoutDashboard,
  LogOut,
  FileText,
  Activity,
  PlusCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useTransition, useState } from "react";

const sidebarItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Children", href: "/dashboard/children", icon: Users },
  { name: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
  { name: "Caregiver", href: "/dashboard/caregiver", icon: UserCog },
  { name: "Rooms", href: "/dashboard/rooms", icon: Home },
  { name: "Organizations", href: "/dashboard/organizations", icon: Building2 },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Status", href: "/dashboard/status", icon: Activity },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    // Clear local session/token
    localStorage.removeItem("token");

    // Smooth redirect to login
    startTransition(() => {
      router.replace("/login");
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={cn(
        "bg-blue-900 text-white border-r border-blue-800 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "p-4 border-b border-blue-800 flex items-center",
          isCollapsed ? "justify-center" : "justify-center"
        )}>
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-white">Daycare Admin</h2>
          )}
        </div>
        <nav className="p-4 flex flex-col gap-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-md transition-colors",
                  isCollapsed ? "justify-center px-0 py-2" : "gap-3 px-4 py-2",
                  isActive ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-800 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4 border-t border-blue-800">
          <button
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setIsCollapsed((v) => !v)}
            className={cn(
              "w-full flex items-center justify-center rounded-md",
              "bg-blue-800/50 hover:bg-blue-800 text-white transition-colors",
              isCollapsed ? "h-10" : "gap-2 px-3 py-2"
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-4">
        <div className="flex justify-between items-center px-6 pb-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              disabled={isPending}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-2 transition text-sm font-medium",
                isPending
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <LogOut className="w-4 h-4" />
              {isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 pb-6">{children}</div>
      </main>
    </div>
  );
}
