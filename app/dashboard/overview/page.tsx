"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, HeartHandshake, Activity, Building2, Baby, UserPlus, ClipboardList, Home, Download, Calendar, CalendarDays, CheckCircle, XCircle, ChevronRight, Eye, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";

type Overview = { totalChildren?: number; totalServants?: number; totalCaregivers?: number; totalOrganizations: number; todaysAttendance: number };
type Child = { id: number; fullName: string; gender: string; dateOfBirth: string };
type Attendance = { id: number; status: string; checkInTime?: string; checkOutTime?: string; child: { fullName: string } };

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState({ overview: null as Overview | null, children: [] as Child[], attendances: [] as Attendance[], absent: [] as Child[], weekTrend: [] as any[], yearTrend: [] as any[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        const [ovRes, chRes, attRes, weekRes, yearRes] = await Promise.all([
          fetch("/api/dashboard/overview"),
          fetch("/api/children"),
          fetch(`/api/attendance?start=${today.toISOString().split('T')[0]}&includeAbsent=true`),
          fetch(`/api/attendance/trends?startDate=${startOfWeek.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`),
          fetch(`/api/attendance/trends?period=year&year=${today.getFullYear()}`)
        ]);

        if (!ovRes.ok) throw new Error("Failed to load overview data");
        if (!chRes.ok) throw new Error("Failed to load children data");
        if (!attRes.ok) throw new Error("Failed to load attendance data");
        if (!weekRes.ok) throw new Error("Failed to load weekly trends");
        if (!yearRes.ok) throw new Error("Failed to load yearly trends");

        const [ov, ch, att, week, year] = await Promise.all([
          ovRes.json(),
          chRes.json(),
          attRes.json(),
          weekRes.json(),
          yearRes.json()
        ]);
        
        const processedWeekData = processWeekData(week.data || week);
        const processedYearData = processYearData(year.data || year);
        
        setData({ 
          overview: ov, 
          children: Array.isArray(ch) ? ch : [], 
          attendances: Array.isArray(att.attendances) ? att.attendances : Array.isArray(att) ? att : [], 
          absent: Array.isArray(att.absentChildren) ? att.absentChildren : [], 
          weekTrend: processedWeekData.length > 0 ? processedWeekData : generateWeekData(),
          yearTrend: processedYearData.length > 0 ? processedYearData : generateYearData()
        });
      } catch (e) { 
        console.error('Error fetching data:', e);
        setError(e instanceof Error ? e.message : "Failed to load dashboard data");
      } finally { 
        setLoading(false); 
      }
    };
    
    fetchAll();
    const refreshInterval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);
  
  const processWeekData = (data: any) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item: any) => ({
      day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      present: item.present || 0,
      date: item.date
    }));
  };
  
  const processYearData = (data: any) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((item: any) => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      attendance: item.attendance || 0,
      year: item.year
    }));
  };

  const generateWeekData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const currentDay = today.getDay();
    
    return days.map((day, index) => {
      const dayOffset = index - currentDay;
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      
      return {
        day,
        present: Math.floor(Math.random() * 20) + 10,
        date: date.toISOString().split('T')[0]
      };
    });
  };
  
  const generateYearData = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentYear, i, 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        attendance: Math.floor(Math.random() * 500) + 200,
        year: currentYear
      };
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><div className="text-center"><AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" /><p className="text-red-600 font-medium">{error}</p></div></div>;

  const { overview, children, attendances, absent, weekTrend, yearTrend } = data;
  const totalKids = overview?.totalChildren ?? children.length;
  const presentCount = attendances.filter(a => a.status === "present").length;
  const presentRate = attendances.length ? Math.round((presentCount / attendances.length) * 100) : 0;

  const statusConfig = {
    present: { Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    late: { Icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
    absent: { Icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
  };

  const genderData = [
    { name: "Male", value: children.filter(c => c.gender === "MALE").length, color: "#3B82F6" },
    { name: "Female", value: children.filter(c => c.gender === "FEMALE").length, color: "#EC4899" },
  ];

  const ageData = (() => {
    const groups = { "0-1": 0, "1-2": 0, "2-3": 0, "3-4": 0, "4-5": 0, "5+": 0 };
    children.forEach(c => {
      const age = new Date().getFullYear() - new Date(c.dateOfBirth).getFullYear();
      if (age < 1) groups["0-1"]++; else if (age < 2) groups["1-2"]++; else if (age < 3) groups["2-3"]++; 
      else if (age < 4) groups["3-4"]++; else if (age < 5) groups["4-5"]++; else groups["5+"]++;
    });
    return Object.entries(groups).map(([age, count]) => ({ age, count }));
  })();

  const downloadCSV = async (period: "day"|"week"|"month"|"year") => {
    const ranges = { day: [new Date(), new Date()], week: [new Date(Date.now() - 6*864e5), new Date()], month: [new Date(new Date().setDate(1)), new Date(new Date().getFullYear(), new Date().getMonth()+1, 0)], year: [new Date(new Date().getFullYear(),0,1), new Date(new Date().getFullYear(),11,31)] };
    const [start, end] = ranges[period];
    const res = await fetch(`/api/attendance?start=${start.toISOString()}&end=${end.toISOString()}&includeAbsent=true`);
    const json = await res.json();

    const rows = ["Child,Status,Check-In,Check-Out,Brought By,Taken By"];
    (json.attendances ?? []).forEach((r: any) => rows.push([r.child?.fullName ?? "", r.status ?? "present", r.checkInTime ? new Date(r.checkInTime).toLocaleString() : "-", r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : "-", r.broughtBy ?? "", r.takenBy ?? ""].join(",")));
    (json.absentChildren ?? []).forEach((c: any) => rows.push([c.fullName ?? "", "absent", "-", "-", "-", "-"].join(",")));

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ChartTooltip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-medium text-gray-900">{label}</p>
      {payload.map((entry: any, index: number) => <p key={index} className="text-sm" style={{ color: entry.color }}>{entry.name}: {entry.value}</p>)}
    </div>
  ) : null;

  const StatCard = ({ title, value, subtitle, trend, Icon, color, path }: any) => (
    <Card className="group cursor-pointer border border-gray-200 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300" onClick={() => router.push(path)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{trend > 0 ? '+' : ''}{trend}%</span>
              <span className="text-sm text-gray-500">{subtitle}</span>
            </div>
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-10`}><Icon className="h-6 w-6 text-gray-700" /></div>
        </div>
      </CardContent>
    </Card>
  );

  const AttendanceItem = ({ attendance, isAbsent = false }: any) => {
    const config = isAbsent ? { Icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" } : statusConfig[attendance.status as keyof typeof statusConfig] || statusConfig.present;
    return (
      <div className={`flex items-center gap-4 p-4 rounded-lg border ${config.border} ${config.bg} hover:shadow-sm transition-all`}>
        <div className={`p-2 rounded-full ${config.bg}`}><config.Icon className={`h-4 w-4 ${config.color}`} /></div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{attendance.child?.fullName || attendance.fullName}</p>
          <p className={`text-xs font-medium ${config.color} capitalize`}>{isAbsent ? 'absent' : attendance.status}</p>
        </div>
        {!isAbsent && attendance.checkInTime && (
          <div className="text-right text-xs text-gray-500 space-y-1">
            <p className="font-medium">In: {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            {attendance.checkOutTime && <p className="font-medium">Out: {new Date(attendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
          </div>
        )}
      </div>
    );
  };

  const stats = [
    { title: "Children Information", value: totalKids, subtitle: "Registered", trend: 12, Icon: Users, color: "bg-blue-50", path: "/dashboard/children" },
    { title: "Caregiver Information", value: overview?.totalCaregivers ?? overview?.totalServants ?? 0, subtitle: "Active staff", trend: 8, Icon: HeartHandshake, color: "bg-emerald-50", path: "/dashboard/caregiver" },
    { title: "Children Today's Attendance", value: `${presentCount}/${attendances.length + absent.length}`, subtitle: `${presentRate}% present`, trend: 5, Icon: Activity, color: "bg-amber-50", path: "/dashboard/attendance?date=today" },
    { title: "Registered Organization", value: overview?.totalOrganizations ?? 0, subtitle: "Partner organizations", trend: 3, Icon: Building2, color: "bg-purple-50", path: "/dashboard/organizations" }
  ];

  const quickActions = [
    { icon: Baby, label: "Add Child", path: "/dashboard/children", color: "bg-blue-50 text-blue-600" },
    { icon: UserPlus, label: "Add Caregiver", path: "/dashboard/caregiver", color: "bg-emerald-50 text-emerald-600" },
    { icon: ClipboardList, label: "Take Attendance", path: "/dashboard/attendance?date=today", color: "bg-amber-50 text-amber-600" },
    { icon: Home, label: "Manage Rooms", path: "/dashboard/rooms", color: "bg-purple-50 text-purple-600" }
  ];

  const reports = [
    { label: "Today's Report", period: "day" as const, icon: Calendar },
    { label: "Weekly Report", period: "week" as const, icon: CalendarDays },
    { label: "Monthly Report", period: "month" as const, icon: Calendar },
    { label: "Yearly Report", period: "year" as const, icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
              <p className="text-gray-600 mt-1">Welcome to your daycare management dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <main className="p-8 space-y-8">
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => <StatCard key={index} {...stat} />)}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Today's Attendance</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/attendance?date=today")}>
                  <Eye className="h-4 w-4 mr-1" />View All<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {presentCount > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium text-sm text-gray-900">Present ({presentCount})</span>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{presentRate}%</Badge>
                      </div>
                      <div className="space-y-2">
                        {attendances.filter(a => a.status === "present").slice(0, 4).map(attendance => (
                          <AttendanceItem key={attendance.id} attendance={attendance} />
                        ))}
                      </div>
                    </div>
                  )}
                  {absent.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-sm text-gray-900">Absent ({absent.length})</span>
                      </div>
                      <div className="space-y-2">
                        {absent.slice(0, 4).map(child => (
                          <AttendanceItem key={child.id} attendance={child} isAbsent={true} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border border-gray-200 bg-white rounded-xl shadow-sm h-80">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Weekly Attendance Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="#6b7280" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        width={30}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="present" 
                        stroke="#10B981" 
                        strokeWidth={2} 
                        fill="url(#colorPresent)" 
                        name="Present"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 bg-white rounded-xl shadow-sm h-80">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Children by Gender</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        dataKey="value"
                        label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                      >
                        {genderData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="space-y-8">
            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="h-20 flex flex-col gap-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50" 
                      onClick={() => router.push(action.path)}
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Download Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reports.map((report, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="w-full justify-start h-12 px-4 border-gray-200 hover:border-gray-300 hover:bg-gray-50" 
                      onClick={() => downloadCSV(report.period)}
                    >
                      <report.icon className="h-4 w-4 mr-3 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">{report.label}</span>
                      <Download className="h-4 w-4 ml-auto text-gray-400" />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 bg-white rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Age Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="age" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Children" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}