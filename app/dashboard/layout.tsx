"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
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
  User,
  Settings,
  BarChart3,
  Bell,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// Sidebar items definition
interface SidebarItem {
  name: string;
  href: string;
  icon: any;
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Children", href: "/dashboard/children", icon: Users },
  { name: "Caregiver", href: "/dashboard/caregiver", icon: UserCog },
  { name: "Attendance", href: "/dashboard/attendance", icon: UserCheck },
  { name: "Rooms", href: "/dashboard/rooms", icon: DoorOpen },
  { name: "Organization", href: "/dashboard/organization", icon: Briefcase },
  { name: "Sites", href: "/dashboard/sites", icon: MapPin },
  { name: "Announcements", href: "/dashboard/announcements", icon: Bell },
  { name: "Report", href: "/dashboard/report", icon: FileText },
  { name: "User Management", href: "/dashboard/admin-management", icon: Shield },
  { name: "Status", href: "/dashboard/status", icon: Activity },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("token");
      // Expire cookie set by login route
      document.cookie = "userId=; Max-Age=0; path=/";
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };



  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        "bg-[#1A202C] text-white border-r border-gray-700 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "p-4 border-b border-gray-700 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/Logo_of_Ethiopian_INSA.png"
                  alt="INSA Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Daycare Admin</h2>
                <p className="text-xs text-gray-400">INSA Daycare Management System</p>
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-1">
              <Image
                src="/Logo_of_Ethiopian_INSA.png"
                alt="INSA Logo"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  isCollapsed ? "justify-center" : "gap-3",
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left Side - Menu Button and Page Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-5 h-5 text-gray-600" />
                ) : (
                  <PanelLeftClose className="w-5 h-5 text-gray-600" />
                )}
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle(pathname)}
              </h1>
            </div>
            
            
            {/* Right Side - Logout */}
            <div className="relative">
              <details className="group">
                <summary className="list-none flex items-center gap-2 cursor-pointer select-none">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-5 w-5 text-gray-700" />
                  </span>
                </summary>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-1 z-50">
                  <Link href="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                  </button>
                </div>
              </details>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper function to get page title from pathname
function getPageTitle(pathname: string): string {
  const item = sidebarItems.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  );
  return item?.name || "Dashboard";
}