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
} from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useTransition } from "react";

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
      <aside className="w-64 bg-background border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-center text-foreground">Daycare Admin</h2>
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
                  "flex items-center gap-3 px-4 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-4">
        <div className="flex justify-between items-center px-6 pb-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-3">
            <ModeToggle />
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
