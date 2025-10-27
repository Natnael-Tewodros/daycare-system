"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  Building2,
  Activity,
  CalendarDays,
  ArrowRight,
  Baby,
  Heart,
  Star,
  Sparkles,
  Clock as ClockIcon,
  UserCheck,
  Eye,
  Plus,
  Settings,
  Bell,
  Shield,
  GraduationCap,
  Home,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserPlus,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Timer,
  Target,
  Zap,
  Award,
  BookOpen,
  HeartHandshake,
  Stethoscope,
  ClipboardList,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "lucide-react";

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
  takenBy: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  child: { id: number; fullName: string };
};

type Servant = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string;
  site: string;
  organizationType: string;
  assignedRoom?: {
    id: number;
    name: string;
  } | null;
  children?: Array<{
    id: number;
    fullName: string;
  }>;
};

export default function OverviewPage() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [absentChildren, setAbsentChildren] = useState<Child[]>([]);
  const [servants, setServants] = useState<Servant[]>([]);
  const [me, setMe] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingServants, setLoadingServants] = useState(true);
  const [attendanceTrendData, setAttendanceTrendData] = useState<any[]>([]);
  const [monthlyTrendData, setMonthlyTrendData] = useState<any[]>([]);

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
        // Fetch today's attendance with absent children
        const today = new Date();
        today.setHours(0,0,0,0);
        const res = await fetch(`/api/attendance?start=${today.toISOString()}&includeAbsent=true`);
        if (!res.ok) {
          throw new Error(`Attendance API error: ${res.status}`);
        }
        const json = await res.json();
        
        if (json.attendances && json.absentChildren) {
          setAttendances(json.attendances);
          setAbsentChildren(json.absentChildren);
        } else {
          setAttendances(json);
          setAbsentChildren([]);
        }
      } catch (err) {
        console.error("Fetch attendance error:", err);
        // Non-fatal for overview
      }
    };

    const fetchServants = async () => {
      try {
        const res = await fetch("/api/servants");
        if (!res.ok) {
          throw new Error(`Servants API error: ${res.status}`);
        }
        const json = await res.json();
        setServants(json);
        setLoadingServants(false);
      } catch (err) {
        console.error("Fetch servants error:", err);
        setError("Failed to load caregivers data.");
        setLoadingServants(false);
      }
    };

    const fetchAttendanceTrends = async () => {
      try {
        const res = await fetch("/api/attendance/trends?period=week");
        if (!res.ok) {
          throw new Error(`Attendance trends API error: ${res.status}`);
        }
        const json = await res.json();
        setAttendanceTrendData(json.data || []);
      } catch (err) {
        console.error("Fetch attendance trends error:", err);
      }
    };

    const fetchMonthlyTrends = async () => {
      try {
        const res = await fetch("/api/attendance/trends?period=year");
        if (!res.ok) {
          throw new Error(`Monthly trends API error: ${res.status}`);
        }
        const json = await res.json();
        setMonthlyTrendData(json.data || []);
      } catch (err) {
        console.error("Fetch monthly trends error:", err);
      }
    };

    fetchOverview();
    fetchChildren();
    fetchAttendances();
    fetchServants();
    fetchAttendanceTrends();
    fetchMonthlyTrends();
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
  if (!data || loadingChildren || loadingServants) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );

  // Use computed totalChildren if not provided by overview
  const totalChildren = data.totalChildren || children.length;

  // Helper functions for enhanced display
  const getAttendanceStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
      case 'late': return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'absent': return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' };
      default: return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const getAgeGroup = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    const ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 12) return { name: 'Tiny Tots', icon: Baby, color: 'text-pink-600' };
    if (ageInMonths < 24) return { name: 'Little Explorers', icon: Heart, color: 'text-blue-600' };
    if (ageInMonths < 48) return { name: 'Growing Stars', icon: Star, color: 'text-green-600' };
    return { name: 'Big Kids', icon: GraduationCap, color: 'text-purple-600' };
  };

  const calculateAttendanceRate = () => {
    if (attendances.length === 0) return 0;
    const presentCount = attendances.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendances.length) * 100);
  };

  // Chart data preparation
  const getAttendanceChartData = () => {
    // Use real data from API if available, otherwise return empty array
    if (attendanceTrendData.length > 0) {
      return attendanceTrendData;
    }
    
    // Return empty structure if no data yet
    return [];
  };

  const getGenderDistribution = () => {
    const male = children.filter(c => c.gender === 'MALE').length;
    const female = children.filter(c => c.gender === 'FEMALE').length;
    return [
      { name: 'Male', value: male, color: '#3B82F6' },
      { name: 'Female', value: female, color: '#EC4899' }
    ];
  };

  const getAgeGroupDistribution = () => {
    const ageGroups = {
      '0-1': 0,
      '1-2': 0,
      '2-3': 0,
      '3-4': 0,
      '4-5': 0,
      '5+': 0
    };

    children.forEach(child => {
      const age = new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear();
      if (age < 1) ageGroups['0-1']++;
      else if (age < 2) ageGroups['1-2']++;
      else if (age < 3) ageGroups['2-3']++;
      else if (age < 4) ageGroups['3-4']++;
      else if (age < 5) ageGroups['4-5']++;
      else ageGroups['5+']++;
    });

    return Object.entries(ageGroups).map(([age, count]) => ({
      age,
      count,
      percentage: Math.round((count / children.length) * 100)
    }));
  };

  const getAttendanceStatusData = () => {
    const present = attendances.filter(a => a.status === 'present').length;
    const absent = attendances.filter(a => a.status === 'absent').length;
    const late = attendances.filter(a => a.status === 'late').length;
    
    return [
      { name: 'Present', value: present, color: '#10B981' },
      { name: 'Absent', value: absent, color: '#EF4444' },
      { name: 'Late', value: late, color: '#F59E0B' }
    ];
  };

  const getMonthlyTrend = () => {
    // Use real data from API if available
    if (monthlyTrendData.length > 0) {
      return monthlyTrendData;
    }
    
    // Return empty structure if no data yet
    return [];
  };

  // Download functions
  const downloadAttendance = async (period: 'day' | 'week' | 'month' | 'year') => {
    try {
      let startDate = new Date();
      let endDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 6);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(startDate.getFullYear(), 0, 1);
          endDate = new Date(startDate.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
      }

      const res = await fetch(`/api/attendance?start=${startDate.toISOString()}&end=${endDate.toISOString()}&includeAbsent=true`);
      if (!res.ok) throw new Error("Failed to fetch attendance data");
      const data = await res.json();
      
      const headers = ['Child','Status','Check-In','Check-Out','Brought By','Taken By','Parent','Relationship'];
      const csvRows = [headers.join(',')];
      
      // Add present children
      if (data.attendances) {
        for (const r of data.attendances) {
          const cols = [
            (r.child?.fullName || '').replace(/,/g, ' '),
            r.status || 'present',
            r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '-',
            r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : '-',
            (r.broughtBy || '').replace(/,/g, ' '),
            (r.takenBy || '').replace(/,/g, ' '),
            (r.child?.parentName || '').replace(/,/g, ' '),
            (r.child?.relationship || '').replace(/,/g, ' '),
          ];
          csvRows.push(cols.join(','));
        }
      }
      
      // Add absent children
      if (data.absentChildren) {
        for (const child of data.absentChildren) {
          const cols = [
            (child.fullName || '').replace(/,/g, ' '),
            'absent',
            '-',
            '-',
            '-',
            '-',
            (child.parentName || '').replace(/,/g, ' '),
            (child.relationship || '').replace(/,/g, ' '),
          ];
          csvRows.push(cols.join(','));
        }
      }
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download attendance data");
    }
  };

  // Navigation handlers
  const navigateToChildren = () => router.push('/dashboard/children');
  const navigateToCaregivers = () => router.push('/dashboard/caregiver');
  const navigateToOrganizations = () => router.push('/dashboard/organizations');
  const navigateToTodaysAttendance = () => router.push('/dashboard/attendance?date=today');
  const navigateToTotalAttendance = () => router.push('/dashboard/attendance');
  const navigateToEnrollmentRequests = () => router.push('/dashboard/enrollment-requests');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Modern Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Daycare Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">Comprehensive overview of your daycare operations</p>
          </div>
        </div>

        {/* Professional KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Children Card */}
          <Card 
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-blue-100 hover:border-blue-200"
            onClick={navigateToChildren}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-1 text-blue-800">{totalChildren}</div>
              <div className="text-blue-600 text-sm font-medium">Total Children</div>
              <div className="flex items-center gap-1 mt-2 text-blue-500 text-xs">
                <ArrowRight className="h-3 w-3" />
                View all children
              </div>
            </CardContent>
          </Card>

          {/* Caregivers Card */}
          <Card 
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-orange-100 hover:border-orange-200"
            onClick={navigateToCaregivers}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full">
                  <HeartHandshake className="h-6 w-6 text-orange-600" />
                </div>
                <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-1 text-orange-800">{data.totalServants}</div>
              <div className="text-orange-600 text-sm font-medium">Caregivers</div>
              <div className="flex items-center gap-1 mt-2 text-orange-500 text-xs">
                <ArrowRight className="h-3 w-3" />
                Manage caregivers
              </div>
            </CardContent>
          </Card>

          {/* Attendance Card */}
          <Card 
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-yellow-100 hover:border-yellow-200"
            onClick={navigateToTodaysAttendance}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full">
                  <Activity className="h-6 w-6 text-yellow-600" />
                </div>
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  {calculateAttendanceRate()}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-1 text-yellow-800">{data.todaysAttendance || 0}</div>
              <div className="text-yellow-600 text-sm font-medium">Today's Attendance</div>
              <div className="flex items-center gap-1 mt-2 text-yellow-500 text-xs">
                <ArrowRight className="h-3 w-3" />
                View attendance
              </div>
            </CardContent>
          </Card>

          {/* Organizations Card */}
          <Card 
            className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-orange-100 hover:border-orange-200"
            onClick={navigateToOrganizations}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full">
                  <Building2 className="h-6 w-6 text-orange-600" />
                </div>
                <Badge className="bg-orange-50 text-orange-700 border-orange-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold mb-1 text-orange-800">{data.totalOrganizations}</div>
              <div className="text-orange-600 text-sm font-medium">Organizations</div>
              <div className="flex items-center gap-1 mt-2 text-orange-500 text-xs">
                <ArrowRight className="h-3 w-3" />
                View organizations
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrollment Requests Card */}
        {data.pendingEnrollmentRequests !== undefined && (
          <div className="mt-6">
            <Card 
              className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-indigo-100 hover:border-indigo-200"
              onClick={navigateToEnrollmentRequests}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-full">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  {data.pendingEnrollmentRequests > 0 && (
                    <Badge className="bg-red-500 text-white border-red-600 animate-pulse">
                      <Bell className="h-3 w-3 mr-1" />
                      New
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold mb-1 text-indigo-800">{data.pendingEnrollmentRequests}</div>
                <div className="text-indigo-600 text-sm font-medium">
                  {data.pendingEnrollmentRequests === 1 ? 'Enrollment Request' : 'Enrollment Requests'}
                </div>
                <div className="flex items-center gap-1 mt-2 text-indigo-500 text-xs">
                  <ArrowRight className="h-3 w-3" />
                  Review requests
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          {/* Attendance Information */}
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Today's Attendance
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={navigateToTodaysAttendance}>
                    <Eye className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Present Children */}
              {attendances.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Present Children ({attendances.length})
                  </h4>
                  <div className="space-y-3">
                    {attendances.slice(0, 3).map((attendance) => {
                      const statusInfo = getAttendanceStatus(attendance.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div key={attendance.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                          <div className={`w-8 h-8 ${statusInfo.bg} rounded-full flex items-center justify-center`}>
                            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{attendance.child.fullName}</p>
                            <div className="flex flex-col gap-1 mt-1">
                              <p className={`text-xs ${statusInfo.color} font-medium`}>
                                {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                              </p>
                              {attendance.checkInTime && (
                                <p className="text-xs text-gray-600">
                                  Checked in: {new Date(attendance.checkInTime).toLocaleString()}
                                </p>
                              )}
                              {attendance.checkOutTime && (
                                <p className="text-xs text-gray-600">
                                  Checked out: {new Date(attendance.checkOutTime).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {attendance.broughtBy && (
                              <p className="text-xs text-muted-foreground">
                                by {attendance.broughtBy}
                              </p>
                            )}
                            {attendance.takenBy && (
                              <p className="text-xs text-muted-foreground">
                                taken by {attendance.takenBy}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {attendances.length > 3 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" onClick={navigateToTodaysAttendance}>
                          View {attendances.length - 3} more present
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Absent Children */}
              {absentChildren.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Absent Children ({absentChildren.length})
                  </h4>
                  <div className="space-y-3">
                    {absentChildren.slice(0, 3).map((child) => (
                      <div key={child.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{child.fullName}</p>
                          <p className="text-xs text-red-600 font-medium">Absent</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {child.parentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {child.relationship}
                          </p>
                        </div>
                      </div>
                    ))}
                    {absentChildren.length > 3 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" onClick={navigateToTodaysAttendance}>
                          View {absentChildren.length - 3} more absent
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No attendance recorded */}
              {attendances.length === 0 && absentChildren.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No attendance recorded today</p>
                  <Button className="mt-4" onClick={navigateToTodaysAttendance}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Attendance
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


        {/* Quick Actions Section */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-slate-50 to-gray-50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
                  onClick={navigateToChildren}
                >
                  <Baby className="h-6 w-6 text-blue-600" />
                  <span className="text-sm">Add Child</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200"
                  onClick={navigateToCaregivers}
                >
                  <UserPlus className="h-6 w-6 text-green-600" />
                  <span className="text-sm">Add Caregiver</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
                  onClick={navigateToTodaysAttendance}
                >
                  <ClipboardList className="h-6 w-6 text-purple-600" />
                  <span className="text-sm">Record Attendance</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-200"
                  onClick={() => router.push('/dashboard/rooms')}
                >
                  <Home className="h-6 w-6 text-orange-600" />
                  <span className="text-sm">Manage Rooms</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professional Analytics Dashboard */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Analytics Dashboard</h2>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Attendance Trend Chart */}
            <Card className="bg-white shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Attendance Trend (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getAttendanceChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getAttendanceChartData()}>
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
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No attendance data available for the last 7 days</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gender Distribution */}
            <Card className="bg-white shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-600" />
                  Gender Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getGenderDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getGenderDistribution().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age Group Distribution */}
            <Card className="bg-white shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Baby className="h-5 w-5 text-green-600" />
                  Age Group Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getAgeGroupDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Attendance Status */}
            <Card className="bg-white shadow-xl border-0">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Today's Attendance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getAttendanceStatusData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getAttendanceStatusData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend Chart */}
          <Card className="bg-white shadow-xl border-0 mb-8">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Monthly Trends (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getMonthlyTrend().length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={getMonthlyTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={3} />
                    <Line type="monotone" dataKey="enrollment" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">No monthly trend data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Download Attendance Section */}
        <div className="mt-8">
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Download Attendance Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-200"
                  onClick={() => downloadAttendance('day')}
                >
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  <span className="text-sm">Today's Report</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-200"
                  onClick={() => downloadAttendance('week')}
                >
                  <CalendarDays className="h-6 w-6 text-indigo-600" />
                  <span className="text-sm">Weekly Report</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-200"
                  onClick={() => downloadAttendance('month')}
                >
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  <span className="text-sm">Monthly Report</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-200"
                  onClick={() => downloadAttendance('year')}
                >
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  <span className="text-sm">Yearly Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}