// app/dashboard/layout.tsx
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
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Search,
  X,
} from "lucide-react";
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
  { name: "Staff", href: "/dashboard/staff", icon: UserCog },
  { name: "Attendance", href: "/dashboard/attendance", icon: UserCheck },
  { name: "Activities", href: "/dashboard/activities", icon: Activity },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Center Info", href: "/dashboard/center", icon: Building2 },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Mock data for search functionality
const mockSearchData = [
  { id: 1, name: "John Smith", type: "child", date: "2024-01-15", room: "Toddlers" },
  { id: 2, name: "Sarah Johnson", type: "staff", date: "2024-01-15", role: "Teacher" },
  { id: 3, name: "Mike Wilson", type: "child", date: "2024-01-14", room: "Infants" },
  { id: 4, name: "Emily Brown", type: "staff", date: "2024-01-16", role: "Assistant" },
  { id: 5, name: "Activity: Arts & Crafts", type: "activity", date: "2024-01-15" },
  { id: 6, name: "Report: Monthly Summary", type: "report", date: "2024-01-01" },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleLogout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === "") {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    // Enhanced search logic
    const results = mockSearchData.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase()) ||
      item.date.includes(query) ||
      (item.room && item.room.toLowerCase().includes(query.toLowerCase())) ||
      (item.role && item.role.toLowerCase().includes(query.toLowerCase()))
    );

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const getSearchResultIcon = (type: string) => {
    switch (type) {
      case 'child': return Users;
      case 'staff': return UserCog;
      case 'activity': return Activity;
      case 'report': return FileText;
      default: return Search;
    }
  };

  const handleResultClick = (result: any) => {
    // Navigate based on result type
    switch (result.type) {
      case 'child':
        router.push('/dashboard/children');
        break;
      case 'staff':
        router.push('/dashboard/staff');
        break;
      case 'activity':
        router.push('/dashboard/activities');
        break;
      case 'report':
        router.push('/dashboard/reports');
        break;
    }
    clearSearch();
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
          {!isCollapsed && (
            <h2 className="text-xl font-bold text-white">Daycare Admin</h2>
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

        {/* Removed logout button from sidebar */}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header - UPDATED LAYOUT */}
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
            
            {/* Center - Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, date, type, room, role..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchResults.map((result) => {
                      const ResultIcon = getSearchResultIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                        >
                          <ResultIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{result.name}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {result.type} • {result.date}
                              {result.room && ` • ${result.room}`}
                              {result.role && ` • ${result.role}`}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* No Results Message */}
                {showSearchResults && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Side - Notifications and Logout */}
            <div className="flex items-center gap-3">
              {/* Notifications Bell */}
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isLoggingOut
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                )}
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
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