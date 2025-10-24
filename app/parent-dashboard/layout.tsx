"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  User,
  LogOut,
  Baby,
  HeartHandshake,
  Building,
  PanelLeftClose,
  PanelLeftOpen,
  Settings
} from "lucide-react";

interface ParentLayoutProps {
  children: React.ReactNode;
}

export default function ParentLayout({ children }: ParentLayoutProps) {
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get parent info from localStorage (set during login)
    const storedParentInfo = localStorage.getItem('parentInfo');
    if (storedParentInfo) {
      const parent = JSON.parse(storedParentInfo);
      setParentInfo(parent);
      setLoading(false);
    } else {
      // Redirect to login if no parent info
      router.push('/login');
    }
  }, [router]);

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      localStorage.removeItem('parentInfo');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      sessionStorage.removeItem('token');
      // Expire cookie set by login route
      document.cookie = "userId=; Max-Age=0; path=/";
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/parent-dashboard',
      icon: Home,
      current: pathname === '/parent-dashboard'
    },
    {
      name: 'My Children',
      href: '/parent-dashboard/children',
      icon: Baby,
      current: pathname === '/parent-dashboard/children'
    },
    {
      name: 'Application Status',
      href: '/parent-dashboard/application-status',
      icon: FileText,
      current: pathname === '/parent-dashboard/application-status'
    },
    {
      name: 'New Request',
      href: '/parent-dashboard/request',
      icon: Users,
      current: pathname === '/parent-dashboard/request'
    }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`bg-[#1A202C] text-white border-r border-gray-700 transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}>
        <div className={`p-4 border-b border-gray-700 flex items-center ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                <HeartHandshake className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Parent Portal</h2>
                <p className="text-xs text-gray-400">Daycare Management</p>
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center p-1">
              <HeartHandshake className="h-8 w-8 text-blue-600" />
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                  isCollapsed ? "justify-center" : "gap-3"
                } ${
                  item.current
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
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
            
            {/* Right Side - User Menu */}
            <div className="relative">
              <details className="group">
                <summary className="list-none flex items-center gap-2 cursor-pointer select-none">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-5 w-5 text-gray-700" />
                  </span>
                </summary>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-1 z-50">
                  <Link href="/parent-dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50">
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
  const navigation = [
    { name: "Dashboard", href: "/parent-dashboard" },
    { name: "My Children", href: "/parent-dashboard/children" },
    { name: "Application Status", href: "/parent-dashboard/application-status" },
    { name: "New Request", href: "/parent-dashboard/request" }
  ];
  
  const item = navigation.find(item => 
    pathname === item.href || pathname.startsWith(item.href + '/')
  );
  return item?.name || "Parent Dashboard";
}

