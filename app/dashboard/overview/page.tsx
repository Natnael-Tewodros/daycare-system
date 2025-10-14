"use client";

import { useEffect, useState } from "react";
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

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
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

    fetchOverview();
    fetchChildren();
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
  const navigateToCaregivers = () => router.push('/dashboard/servants');
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

      {/* Stats Row - Clickable Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
              servants <ArrowRight className="h-3 w-3 opacity-70" />
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