"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Clock,
  AlertCircle,
  Users,
  Building2,
  Backpack,
  Activity,
  CalendarDays,
  ArrowRight,
  Baby,
  HeartHandshake,
  FileText,
  CheckCircle,
  XCircle,
  Zap,
  ClipboardList,
  Home,
  Calendar,
  UserPlus,
  Bell,
  Eye,
  Download,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

type OverviewData = {
  totalChildren?: number;
  totalServants: number;
  totalOrganizations: number;
  totalAttendance: number;
  todaysAttendance: number;
  pendingEnrollmentRequests?: number;
};

type Child = {
  id: number;
  fullName: string;
  parentName: string;
  gender: string;
  dateOfBirth: string;
};

type AttendanceItem = {
  id: number;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  broughtBy: string | null;
  takenBy: string | null;
  child: { id: number; fullName: string };
};

type Servant = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string;
  site: string;
  organizationType: string;
};

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [absentChildren, setAbsentChildren] = useState<Child[]>([]);
  const [servants, setServants] = useState<Servant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingServants, setLoadingServants] = useState(true);
  const [attendanceTrendData, setAttendanceTrendData] = useState<any[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([]);

  /* ------------------------------------------------------------------ */
  /* --------------------------- FETCH LOGIC -------------------------- */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          overviewRes,
          childrenRes,
          attendanceRes,
          servantsRes,
          weekRes,
          yearRes,
        ] = await Promise.all([
          fetch("/api/dashboard/overview"),
          fetch("/api/children"),
          fetch(`/api/attendance?start=${new Date().toISOString()}&includeAbsent=true`),
          fetch("/api/servants"),
          fetch("/api/attendance/trends?period=week"),
          fetch("/api/attendance/trends?period=year"),
        ]);

        if (!overviewRes.ok) throw new Error("overview");
        if (!childrenRes.ok) throw new Error("children");
        if (!attendanceRes.ok) throw new Error("attendance");
        if (!servantsRes.ok) throw new Error("servants");
        if (!weekRes.ok) throw new Error("week");
        if (!yearRes.ok) throw new Error("year");

        const [
          overviewJson,
          childrenJson,
          attendanceJson,
          servantsJson,
          weekJson,
          yearJson,
        ] = await Promise.all([
          overviewRes.json(),
          childrenRes.json(),
          attendanceRes.json(),
          servantsRes.json(),
          weekRes.json(),
          yearRes.json(),
        ]);

        setData(overviewJson);
        setChildren(childrenJson);
        setAttendances(attendanceJson.attendances ?? attendanceJson);
        setAbsentChildren(attendanceJson.absentChildren ?? []);
        setServants(servantsJson);
        setAttendanceTrendData(weekJson.data ?? []);
        setMonthlyTrendData(yearJson.data ?? []);
      } catch (err) {
        setError("Failed to load dashboard data. Please refresh.");
      } finally {
        setLoadingChildren(false);
        setLoadingServants(false);
      }
    };

    fetchAll();
  }, []);

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );

  if (!data || loadingChildren || loadingServants)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );

  const totalChildren = data.totalChildren ?? children.length;

  /* ------------------------------------------------------------------ */
  /* --------------------------- HELPERS ----------------------------- */
  /* ------------------------------------------------------------------ */
  const getAttendanceStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return { Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" };
      case "late":
        return { Icon: Clock, color: "text-amber-600", bg: "bg-amber-50" };
      case "absent":
        return { Icon: XCircle, color: "text-red-600", bg: "bg-red-50" };
      default:
        return { Icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-50" };
    }
  };

  const calculateAttendanceRate = () => {
    if (!attendances.length) return 0;
    const present = attendances.filter((a) => a.status === "present").length;
    return Math.round((present / attendances.length) * 100);
  };

  const genderData = [
    { name: "Male", value: children.filter((c) => c.gender === "MALE").length, color: "#0EA5E9" },
    { name: "Female", value: children.filter((c) => c.gender === "FEMALE").length, color: "#EC4899" },
  ];

  const ageGroupData = (() => {
    const groups: Record<string, number> = { "0-1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0, "5+": 0 };
    children.forEach((c) => {
      const age = new Date().getFullYear() - new Date(c.dateOfBirth).getFullYear();
      if (age < 1) groups["0-1"]++;
      else if (age < 2) groups["1-2"]++;
      else if (age < 3) groups["2-3"]++;
      else if (age < 4) groups["3-4"]++;
      else if (age < 5) groups["4-5"]++;
      else groups["5+"]++;
    });
    return Object.entries(groups).map(([age, count]) => ({
      age,
      count,
      percentage: Math.round((count / children.length) * 100),
    }));
  })();

  /* ------------------------------------------------------------------ */
  /* -------------------------- DOWNLOAD CSV -------------------------- */
  /* ------------------------------------------------------------------ */
  const downloadAttendance = async (period: "day" | "week" | "month" | "year") => {
    let start = new Date();
    let end = new Date();

    switch (period) {
      case "day":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "year":
        start = new Date(start.getFullYear(), 0, 1);
        end = new Date(start.getFullYear(), 11, 31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    const res = await fetch(
      `/api/attendance?start=${start.toISOString()}&end=${end.toISOString()}&includeAbsent=true`
    );
    const json = await res.json();

    const rows: string[] = [
      "Child,Status,Check-In,Check-Out,Brought By,Taken By,Parent,Relationship",
    ];

    (json.attendances ?? []).forEach((r: any) => {
      rows.push(
        [
          r.child?.fullName ?? "",
          r.status ?? "present",
          r.checkInTime ? new Date(r.checkInTime).toLocaleString() : "-",
          r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "-",
          r.broughtBy ?? "",
          r.takenBy ?? "",
          r.child?.parentName ?? "",
          r.child?.relationship ?? "",
        ]
          .map((s) => s.replace(/,/g, " "))
          .join(",")
      );
    });

    (json.absentChildren ?? []).forEach((c: any) => {
      rows.push(
        [
          c.fullName ?? "",
          "absent",
          "-",
          "-",
          "-",
          "-",
          c.parentName ?? "",
          c.relationship ?? "",
        ].join(",")
      );
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ------------------------------------------------------------------ */
  /* ------------------------------ UI ------------------------------- */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50">
      {/* HERO HEADER */}
      <header className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-indigo-700 py-16 text-white">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Daycare Dashboard Overview
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* KPI CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Children Information",
              value: totalChildren,
              icon: Users,
              color: "from-sky-500 to-blue-600",
              badge: "+12%",
              onClick: () => router.push("/dashboard/children"),
            },
            {
              title: "Caregivers Information",
              value: data.totalServants,
              icon: HeartHandshake,
              color: "from-emerald-500 to-teal-600",
              badge: "+8%",
              onClick: () => router.push("/dashboard/caregiver"),
            },
            {
              title: " children Today's Attendance",
              value: data.todaysAttendance || 0,
              icon: Activity,
              color: "from-amber-500 to-orange-600",
              badge: `${calculateAttendanceRate()}%`,
              onClick: () => router.push("/dashboard/attendance?date=today"),
            },
            {
              title: "Registerd Organizations Information",
              value: data.totalOrganizations,
              icon: Building2,
              color: "from-purple-500 to-indigo-600",
              badge: "+5%",
              onClick: () => router.push("/dashboard/organizations"),
            },
          ].map((kpi, idx) => (
            <Card
              key={idx}
              className="group cursor-pointer overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 bg-white"
              onClick={kpi.onClick}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${kpi.color} text-white`}>
                    <kpi.icon className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-0">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {kpi.badge}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-3xl font-bold text-gray-800">{kpi.value}</p>
                <p className="text-sm text-gray-600 mt-1">{kpi.title}</p>
                <p className="flex items-center gap-1 mt-3 text-xs text-teal-600 font-medium">
                  <ArrowRight className="h-3 w-3" />
                  View details
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* ENROLLMENT REQUESTS */}
        {data.pendingEnrollmentRequests !== undefined && (
          <Card
            className="cursor-pointer rounded-xl shadow-md hover:shadow-xl transition-all border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50"
            onClick={() => router.push("/dashboard/enrollment-requests")}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-indigo-800">
                    {data.pendingEnrollmentRequests}
                  </p>
                  <p className="text-sm text-indigo-600">
                    {data.pendingEnrollmentRequests === 1 ? "Pending Request" : "Pending Requests"}
                  </p>
                </div>
              </div>
              {data.pendingEnrollmentRequests > 0 && (
                <Badge className="bg-red-500 text-white animate-pulse">
                  <Bell className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
            </CardHeader>
          </Card>
        )}

        {/* TODAY'S ATTENDANCE */}
        <Card className="rounded-xl shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl font-semibold text-teal-800">
                <Activity className="h-5 w-5 text-teal-600" />
                Today's Attendance
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/attendance?date=today")}
              >
                <Eye className="h-4 w-4 mr-1" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {attendances.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-emerald-700 mb-3">
                  <CheckCircle className="h-5 w-5" />
                  Present ({attendances.length})
                </h3>
                <div className="space-y-3">
                  {attendances.slice(0, 5).map((a) => {
                    const { Icon, color, bg } = getAttendanceStatus(a.status);
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <div className={`${bg} p-2 rounded-full`}>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{a.child.fullName}</p>
                          <p className={`text-xs ${color} font-medium`}>
                            {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-600">
                          {a.checkInTime && (
                            <p>In: {new Date(a.checkInTime).toLocaleTimeString()}</p>
                          )}
                          {a.checkOutTime && (
                            <p>Out: {new Date(a.checkOutTime).toLocaleTimeString()}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {absentChildren.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-red-700 mb-3">
                  <XCircle className="h-5 w-5" />
                  Absent ({absentChildren.length})
                </h3>
                <div className="space-y-3">
                  {absentChildren.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition"
                    >
                      <div className="bg-red-100 p-2 rounded-full">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{c.fullName}</p>
                        <p className="text-xs text-red-600 font-medium">Absent</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QUICK ACTIONS */}
        <Card className="rounded-xl shadow-lg bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-gray-800">
              <Zap className="h-5 w-5 text-yellow-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Baby, label: "Add Child", path: "/dashboard/children" },
                { icon: UserPlus, label: "Add Caregiver", path: "/dashboard/caregiver" },
                { icon: ClipboardList, label: "Record Attendance", path: "/dashboard/attendance?date=today" },
                { icon: Home, label: "Manage Rooms", path: "/dashboard/rooms" },
              ].map((a, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-24 flex flex-col gap-2 hover:shadow-md hover:border-teal-300 transition"
                  onClick={() => router.push(a.path)}
                >
                  <a.icon className="h-6 w-6 text-teal-600" />
                  <span className="text-sm font-medium">{a.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ANALYTICS DASHBOARD */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 7-Day Trend */}
            <Card className="rounded-xl shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-teal-800">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Attendance Trend (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceTrendData.length ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={attendanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="present" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="absent" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="late" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-12">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card className="rounded-xl shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-pink-800">
                  <Users className="h-5 w-5 text-pink-600" />
                  Gender Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {genderData.map((e, i) => (
                        <Cell key={`cell-${i}`} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age Groups */}
            <Card className="rounded-xl shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-emerald-800">
                  <Baby className="h-5 w-5 text-emerald-600" />
                  Age Group Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ageGroupData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Yearly Trend */}
          <Card className="rounded-xl shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-indigo-800">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Yearly Overview (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyTrendData.length ? (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="enrollment" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-20">No yearly data available</p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* DOWNLOAD REPORTS */}
        <Card className="rounded-xl shadow-lg bg-gradient-to-r from-indigo-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-indigo-800">
              <Download className="h-5 w-5 text-indigo-600" />
              Download Attendance Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Today", period: "day" as const, icon: Calendar },
                { label: "Week", period: "week" as const, icon: CalendarDays },
                { label: "Month", period: "month" as const, icon: Calendar },
                { label: "Year", period: "year" as const, icon: Calendar },
              ].map((btn) => (
                <Button
                  key={btn.period}
                  variant="outline"
                  className="h-20 flex flex-col gap-2 hover:bg-indigo-100 hover:border-indigo-300 transition"
                  onClick={() => downloadAttendance(btn.period)}
                >
                  <btn.icon className="h-6 w-6 text-indigo-600" />
                  <span className="text-sm font-medium">{btn.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}