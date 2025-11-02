"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, UserCog, Activity, Bell, UserCheck,
  DoorOpen, Briefcase, MapPin, FileText, BarChart3, Shield,
  Settings, LogOut, PanelLeftClose, PanelLeftOpen, ChevronDown
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface MenuItem {
  name: string;
  href: string;
  icon: React.FC<any>;
  showBadge?: boolean;
  badgeCount?: number;
}

const MENU_ITEMS: MenuItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Children", href: "/dashboard/children", icon: Users },
  { name: "Caregiver", href: "/dashboard/caregiver", icon: UserCog },
  { name: "Activities", href: "/dashboard/activities", icon: Activity },
  { 
    name: "Notifications", 
    href: "/dashboard/notifications", 
    icon: Bell,
    showBadge: true,
    badgeCount: 0
  },
  { name: "Attendance", href: "/dashboard/attendance", icon: UserCheck },
  { name: "Rooms", href: "/dashboard/rooms", icon: DoorOpen },
  { name: "Organization", href: "/dashboard/organization", icon: Briefcase },
  { name: "Sites", href: "/dashboard/sites", icon: MapPin },
  { 
    name: "Enrollment", 
    href: "/dashboard/enrollment-requests", 
    icon: FileText,
    showBadge: true,
    badgeCount: 0
  },
  { name: "Announcements", href: "/dashboard/announcements", icon: Bell },
  { name: "Reports", href: "/dashboard/report", icon: BarChart3 },
  { name: "Admins", href: "/dashboard/admin-management", icon: Shield },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [badge, setBadge] = useState(0);
  const [pendingEnrollments, setPendingEnrollments] = useState(0);
  const [user, setUser] = useState({ name: "Admin User", image: null as string | null });

  /* ────── Fetch user, notifications & enrollment requests ────── */
  useEffect(() => {
    const init = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const [userRes, notifRes, enrollmentRes] = await Promise.all([
          fetch("/api/users/me", { credentials: "include", headers: userId ? { "x-user-id": userId } : {} }),
          fetch("/api/activities?senderType=parent&recipientEmail=admin@daycare.com&isRead=false"),
          fetch("/api/enrollment-requests?status=pending")
        ]);

        if (userRes.ok) {
          const data = await userRes.json();
          setUser({ name: data.name || "Admin User", image: data.profileImage });
        }

        if (notifRes.ok) {
          const data = await notifRes.json();
          const count = data.length;
          setBadge(count);
          const notificationsItem = MENU_ITEMS.find(item => item.name === "Notifications");
          if (notificationsItem) {
            notificationsItem.badgeCount = count;
          }
        }

        if (enrollmentRes.ok) {
          const data = await enrollmentRes.json();
          const count = data.length || 0;
          setPendingEnrollments(count);
          const enrollmentItem = MENU_ITEMS.find(item => item.name === "Enrollment");
          if (enrollmentItem) {
            enrollmentItem.badgeCount = count;
          }
        }
      } catch (e) { 
        console.error("Error in dashboard init:", e); 
      }
    };

    init();
    const interval = setInterval(init, 10_000);
    const handler = () => init();
    window.addEventListener("notifications:updated", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications:updated", handler);
    };
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "userId=; Max-Age=0; path=/";
    setTimeout(() => router.push("/"), 300);
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href) && pathname.charAt(href.length) === "/";
  };

  const title = MENU_ITEMS.find(i => isActive(i.href))?.name ?? "Dashboard";
  const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-gray-100 font-sans antialiased">
      {/* ────── Sidebar (hidden when collapsed) ────── */}
      <aside
        className={cn(
          "bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col transition-all duration-300 border-r border-slate-700 shadow-2xl",
          collapsed ? "w-0 overflow-hidden" : "w-64"
        )}
      >
        {/* Logo only - no collapse button here */}
        <div className="flex items-center p-4 border-b border-slate-700 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-md overflow-hidden p-1">
              <Image src="/Logo_of_Ethiopian_INSA.png" alt="INSA" width={36} height={36} className="rounded-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Daycare Admin</h2>
              <p className="text-xs text-slate-400">INSA Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasBadge = item.showBadge && (item.badgeCount ?? 0) > 0;

            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active ? "bg-blue-600 text-white shadow-md" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {hasBadge && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badgeCount}
                        </span>
                      )}
                    </div>
                    <span className={cn("ml-3", collapsed && "hidden")}>
                      {item.name}
                    </span>
                  </div>
                </Link>

                {/* Hover tooltip */}
                <div
                  className={cn(
                    "absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg",
                    "opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50",
                    "shadow-xl border border-slate-700 flex items-center gap-2"
                  )}
                >
                  <span>{item.name}</span>
                  {hasBadge && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ────── Main area ────── */}
      <div className={cn("flex-1 flex flex-col min-w-0", collapsed && "ml-0")}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Only the icon - no text */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition"
                aria-label={collapsed ? "Open sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </button>
              
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            </div>

            {/* User dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {user.image ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-blue-500">
                    <Image src={`/uploads/${user.image}`} alt="Avatar" width={36} height={36} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {initials}
                  </div>
                )}
                <span className="font-medium text-gray-700 hidden sm:block">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200">
                <div className="p-2">
                  <Link href="/dashboard/profile" className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={logout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" /> {loggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gradient-to-b from-gray-50 to-white">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Tooltip visibility fix */}
      <style jsx>{`
        .group:hover > div,
        .group:focus-within > div {
          opacity: 1;
          visibility: visible;
        }
      `}</style>
    </div>
  );
}