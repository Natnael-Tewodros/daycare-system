"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  UserCog,
  LayoutDashboard,
  LogOut,
  FileText,
  Activity,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  DoorOpen,
  Briefcase,
  MapPin,
  Bell,
  Shield,
  Settings,
  User,
  ChevronDown,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  badge?: number;
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Children", href: "/dashboard/children", icon: Users },
  { name: "Caregiver", href: "/dashboard/caregiver", icon: UserCog },
  { name: "Activities", href: "/dashboard/activities", icon: Activity }, // FIXED: No "00"
  { name: "Attendance", href: "/dashboard/attendance", icon: UserCheck },
  { name: "Rooms", href: "/dashboard/rooms", icon: DoorOpen },
  { name: "Organization", href: "/dashboard/organization", icon: Briefcase },
  { name: "Sites", href: "/dashboard/sites", icon: MapPin },
  { name: "Enrollment Requests", href: "/dashboard/enrollment-requests", icon: FileText },
  { name: "Announcements", href: "/dashboard/announcements", icon: Bell },
  { name: "Report", href: "/dashboard/report", icon: BarChart3 },
  { name: "User Management", href: "/dashboard/admin-management", icon: Shield },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [activitiesBadge, setActivitiesBadge] = useState<number>(0);

  // Fetch unread activities
  useEffect(() => {
    const fetchUnreadActivities = async () => {
      try {
        const response = await fetch("/api/activities");
        if (response.ok) {
          const activities = await response.json();
          const readActivitiesJson = localStorage.getItem("readActivities");
          const readActivities = readActivitiesJson
            ? new Set(JSON.parse(readActivitiesJson))
            : new Set();

          const unread = activities.filter((activity: any) => {
            const needsAttention =
              activity.subject?.toLowerCase().includes("absence notice") ||
              activity.subject?.toLowerCase().includes("sick report");
            return !readActivities.has(activity.id) && needsAttention;
          }).length;

          setActivitiesBadge(unread);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      }
    };

    fetchUnreadActivities();
    const interval = setInterval(fetchUnreadActivities, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("token");
      document.cookie = "userId=; Max-Age=0; path=/";
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getPageTitle = (path: string): string => {
    const item = sidebarItems.find(
      (i) => path === i.href || path.startsWith(i.href + "/")
    );
    return item?.name || "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-[#1A202C] text-white flex flex-col transition-all duration-300 border-r border-gray-700",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo & Title */}
        <div
          className={cn(
            "flex items-center border-b border-gray-700",
            isCollapsed ? "p-3 justify-center" : "p-4 justify-start gap-3"
          )}
        >
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
            <Image
              src="/Logo_of_Ethiopian_INSA.png"
              alt="INSA Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-white">Daycare Admin</h2>
              <p className="text-xs text-gray-400 leading-tight">
                INSA Management System
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;

            // Only highlight exact match or child routes (not parent)
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));

            const badge = item.name === "Activities" ? activitiesBadge : item.badge;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center" : "justify-start gap-3",
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}

                {/* Badge - Only show if > 0 */}
                {badge && badge > 0 && !isCollapsed && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                    {badge}
                  </span>
                )}
                {badge && badge > 0 && isCollapsed && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isCollapsed ? "justify-center" : "justify-start gap-3",
              "text-gray-300 hover:bg-gray-800 hover:text-white"
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle(pathname)}
              </h1>
            </div>

            {/* User Dropdown */}
            <div className="relative group">
              <button
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-haspopup="true"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  A
                </div>
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>

              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="p-2">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Profile & Settings</span>
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Dropdown visibility fix */}
      <style jsx>{`
        button[aria-haspopup="true"]:focus ~ div,
        button[aria-haspopup="true"]:focus-within ~ div,
        .group:hover > div,
        .group:focus-within > div {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </div>
  );
} 