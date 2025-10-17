"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  Building2,
  Users2,
  Activity,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type OverviewData = {
  totalChildren?: number; // Optional now, will fallback to computed
  totalServants: number;
  totalOrganizations: number;
  totalAttendance: number;
  todaysAttendance: number;
  caregiversByRoom?: Array<{ roomName: string; count: number }>; // Made optional for safety
  // Removed childrenByGender - we'll compute it client-side
};

type Child = {
  id: number;
  idOneToMoney: string;
  fullName: string;
  parentName: string;
  option: string;
  relationship: string;
  officialDocument?: string | null;
  dateOfBirth: string;
  gender: string;
  profilePic?: string | null;
  childInformationDoc?: string | null;
  createdAt: string;
};

type AttendanceItem = {
  id: number;
  status: string;
  createdAt: string;
  broughtBy: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  child: { id: number; fullName: string };
};

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [me, setMe] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch("/api/dashboard/overview");
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const json = await res.json();
        console.log("Fetched overview data:", json); // Debug log
        setData(json);
        setError(null);
      } catch (err) {
        console.error("Fetch overview error:", err);
        setError("Failed to load dashboard data. Please refresh the page.");
      }
    };

    const fetchChildren = async () => {
      try {
        // Fetch all children (no employeeId param for global overview)
        const res = await fetch("/api/children");
        if (!res.ok) {
          throw new Error(`Children API error: ${res.status}`);
        }
        const json = await res.json();
        console.log("Fetched children data:", json); // Debug log: Verify 2 male, 1 female
        setChildren(json);
        setLoadingChildren(false);
      } catch (err) {
        console.error("Fetch children error:", err);
        setError("Failed to load children data for charts.");
        setLoadingChildren(false);
      }
    };

    const fetchAttendances = async () => {
      try {
        const res = await fetch("/api/attendance");
        if (!res.ok) {
          throw new Error(`Attendance API error: ${res.status}`);
        }
        const json = await res.json();
        setAttendances(json);
      } catch (err) {
        console.error("Fetch attendance error:", err);
        // Non-fatal for overview
      }
    };

    fetchOverview();
    fetchChildren();
    fetchAttendances();
    // Fetch current user (demo via localStorage userId)
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (userId) {
      fetch('/api/users/me', { headers: { 'x-user-id': userId }})
        .then(r => r.json())
        .then(setMe)
        .catch(() => {});
    }
  }, []);

  if (error) return <p className="text-center mt-10 text-destructive">{error}</p>;
  if (!data || loadingChildren) return <p className="text-center mt-10 text-foreground">Loading...</p>;

  // Compute childrenByGender from fetched children
  const childrenByGender: Record<string, number> = children.reduce((acc, child) => {
    const gender = child.gender.toLowerCase(); // Normalize to lowercase for consistency
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Use computed totalChildren if not provided by overview
  const totalChildren = data.totalChildren || children.length;

  // Chart data prep - Safe handling
  const caregiversByRoomSafe = data.caregiversByRoom || [];
  const caregiversChartData = {
    labels: caregiversByRoomSafe.map(item => item.roomName),
    datasets: [
      {
        label: 'Caregivers per Room',
        data: caregiversByRoomSafe.map(item => item.count),
        backgroundColor: '#36A2EB', // Simplified, or make theme-aware if needed
      },
    ],
  };

  const childrenGenderChartData = {
    labels: Object.keys(childrenByGender),
    datasets: [
      {
        label: 'Children by Gender',
        data: Object.values(childrenByGender),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'], // Red for female, blue for male, yellow for other
      },
    ],
  };

  // Enhanced chart options for better display
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
      datalabels: { // Optional: If you install chartjs-plugin-datalabels, uncomment and register
        // color: 'white',
        // font: { weight: 'bold' },
        // formatter: (value: number, ctx: any) => value,
      },
    },
  };

  // Navigation handlers
  const navigateToChildren = () => router.push('/dashboard/children');
  const navigateToCaregivers = () => router.push('/dashboard/caregiver');
  const navigateToOrganizations = () => router.push('/dashboard/organizations');
  const navigateToTodaysAttendance = () => router.push('/dashboard/attendance?date=today');
  const navigateToTotalAttendance = () => router.push('/dashboard/attendance');

  // Fallback for empty gender data
  const hasGenderData = Object.keys(childrenByGender).length > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time insights into daycare operations</p>
      </div>

      {/* Top row: Profile + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Profile Card */}
        <Card className="bg-card shadow-lg border-0 overflow-hidden lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5" /> My Profile
              </CardTitle>
              <Link href="/dashboard/profile" className="text-sm text-primary underline">View</Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground grid grid-cols-2 gap-2">
            <div><span className="text-foreground">Name:</span> {me?.name || '-'}</div>
            <div><span className="text-foreground">Email:</span> {me?.email || '-'}</div>
            <div><span className="text-foreground">Username:</span> {me?.username || '-'}</div>
            <div><span className="text-foreground">Role:</span> {me?.role || '-'}</div>
          </CardContent>
        </Card>
        <Card 
          className="bg-card shadow-lg hover:shadow-xl transition-all cursor-pointer border-0 hover:bg-accent hover:text-accent-foreground"
          onClick={navigateToChildren}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-foreground">{totalChildren}</CardTitle>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              Total Children <ArrowRight className="h-3 w-3 opacity-70" />
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-card shadow-lg hover:shadow-xl transition-all cursor-pointer border-0 hover:bg-accent hover:text-accent-foreground"
          onClick={navigateToCaregivers}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-foreground">{data.totalServants}</CardTitle>
              <Users className="h-8 w-8 text-secondary" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              caregiver <ArrowRight className="h-3 w-3 opacity-70" />
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-card shadow-lg hover:shadow-xl transition-all cursor-pointer border-0 hover:bg-accent hover:text-accent-foreground"
          onClick={navigateToOrganizations}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-foreground">{data.totalOrganizations}</CardTitle>
              <Building2 className="h-8 w-8 text-muted" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              Organizations <ArrowRight className="h-3 w-3 opacity-70" />
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-card shadow-lg hover:shadow-xl transition-all cursor-pointer border-0 hover:bg-accent hover:text-accent-foreground"
          onClick={navigateToTodaysAttendance}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-foreground">{data.todaysAttendance || 0}</CardTitle>
              <Activity className="h-8 w-8 text-destructive" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              Today's Attendance <ArrowRight className="h-3 w-3 opacity-70" />
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-card shadow-lg hover:shadow-xl transition-all cursor-pointer border-0 hover:bg-accent hover:text-accent-foreground"
          onClick={navigateToTotalAttendance}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-foreground">{data.totalAttendance || 0}</CardTitle>
              <CalendarDays className="h-8 w-8 text-ring" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
              Total Attendance <ArrowRight className="h-3 w-3 opacity-70" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Children */}
        <Card className="bg-card shadow-lg border-0 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">Recent Children</CardTitle>
          </CardHeader>
          <CardContent>
            {children.length === 0 ? (
              <p className="text-muted-foreground">No children yet.</p>
            ) : (
              <div className="space-y-3">
                {children.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div>
                      <p className="font-medium">{c.fullName}</p>
                      <p className="text-xs text-muted-foreground">Parent: {c.parentName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">Registered</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card className="bg-card shadow-lg border-0 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {attendances.length === 0 ? (
              <p className="text-muted-foreground">No attendance yet today.</p>
            ) : (
              <div className="space-y-3">
                {attendances.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                    <div>
                      <p className="font-medium">{a.child.fullName}</p>
                      <p className={`text-xs ${a.status === 'present' ? 'text-green-600' : a.status === 'late' ? 'text-yellow-600' : 'text-red-600'}`}>{a.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{new Date(a.createdAt).toLocaleTimeString()}</p>
                      <p className="text-xs text-muted-foreground">Recorded</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Children by Gender - Pie Chart */}
        <Card className="bg-card shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users2 className="h-5 w-5 text-primary" />
              Children by Gender
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg font-medium text-foreground mb-4">Total: {totalChildren}</p>
            <div className="h-72 flex items-center justify-center bg-background rounded-lg p-4">
              {hasGenderData ? (
                <Pie 
                  data={childrenGenderChartData} 
                  options={{ 
                    ...chartOptions, 
                    plugins: { title: { display: false } }
                  }} 
                />
              ) : (
                <p className="text-muted-foreground text-center">No gender data available yet. Visit the Children page to add records.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Caregivers by Room - Bar Chart */}
        <Card className="bg-card shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary" />
              Caregivers by Room
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 flex items-center justify-center bg-background rounded-lg p-4">
              {caregiversByRoomSafe.length > 0 ? (
                <Bar 
                  data={caregiversChartData} 
                  options={{ 
                    ...chartOptions, 
                    plugins: { title: { display: false } },
                    scales: { 
                      x: { grid: { color: '#e5e7eb' } },
                      y: { grid: { color: '#e5e7eb' }, beginAtZero: true }
                    }
                  }} 
                />
              ) : (
                <p className="text-muted-foreground text-center">No room data available yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}