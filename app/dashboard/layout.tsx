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
        "bg-gradient-to-b from-blue-900 to-blue-800 text-white border-r border-blue-800 transition-all duration-300 shadow-lg",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "p-4 border-b border-blue-700 flex items-center",
          isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
        )}>
          <div className={cn("flex items-center", isCollapsed ? "hidden" : "flex")}>
            <h2 className="text-xl font-bold tracking-tight text-white">Daycare Admin</h2>
          </div>
        </div>
        <nav className="p-4 flex flex-col gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-lg px-3 py-2.5 transition-all duration-200",
                  isCollapsed ? "justify-center px-2" : "gap-3",
                  isActive
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-blue-200 hover:bg-blue-800/50 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "group-hover:text-white")} />
                {!isCollapsed && (
                  <span className="text-sm font-medium truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setIsCollapsed((v) => !v)}
              className="flex items-center justify-center rounded-lg p-2 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              {isCollapsed ? (
                <PanelLeftOpen className="h-5 w-5 text-gray-600" />
              ) : (
                <PanelLeftClose className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              disabled={isPending}
              className={cn(
                "flex items-center gap-2 rounded-md px-6 py-3 transition-all duration-200 text-md font-semibold shadow-sm",
                isPending
                  ? "bg-blue-700/30 text-blue-400 cursor-not-allowed"
                  : "bg-blue-900 text-white hover:bg-blue-600 hover:text-white hover:shadow-md  shadow-sm  "
              )}
            >
              <LogOut className="w-4 h-4" />
              {isPending ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}