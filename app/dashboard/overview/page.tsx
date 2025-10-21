"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [servants, setServants] = useState<Servant[]>([]);
  const [me, setMe] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingServants, setLoadingServants] = useState(true);

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

    fetchOverview();
    fetchChildren();
    fetchAttendances();
    fetchServants();
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

  // Navigation handlers
  const navigateToChildren = () => router.push('/dashboard/children');
  const navigateToCaregivers = () => router.push('/dashboard/caregiver');
  const navigateToOrganizations = () => router.push('/dashboard/organizations');
  const navigateToTodaysAttendance = () => router.push('/dashboard/attendance?date=today');
  const navigateToTotalAttendance = () => router.push('/dashboard/attendance');

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

        {/* Enhanced Statistics Grid */}
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

        {/* Enhanced Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Children Information */}
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Baby className="h-5 w-5 text-blue-600" />
                  Children Overview
                </CardTitle>
                <Button variant="outline" size="sm" onClick={navigateToChildren}>
                  <Eye className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {children.length === 0 ? (
                <div className="text-center py-8">
                  <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No children registered yet</p>
                  <Button className="mt-4" onClick={navigateToChildren}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Children
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {children.slice(0, 4).map((child) => {
                    const ageGroup = getAgeGroup(child.dateOfBirth);
                    const AgeIcon = ageGroup.icon;
                    return (
                      <div key={child.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <AgeIcon className={`h-5 w-5 ${ageGroup.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{child.fullName}</p>
                          <p className="text-xs text-muted-foreground">{child.parentName}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {ageGroup.name}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(child.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {children.length > 4 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" onClick={navigateToChildren}>
                        View {children.length - 4} more children
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caregivers Information */}
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-green-600" />
                  Caregivers
                </CardTitle>
                <Button variant="outline" size="sm" onClick={navigateToCaregivers}>
                  <Eye className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {servants.length === 0 ? (
                <div className="text-center py-8">
                  <HeartHandshake className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No caregivers registered yet</p>
                  <Button className="mt-4" onClick={navigateToCaregivers}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Caregivers
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {servants.slice(0, 4).map((servant) => (
                    <div key={servant.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{servant.fullName}</p>
                        <p className="text-xs text-muted-foreground">{servant.site} • {servant.organizationType}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {servant.assignedRoom?.name || 'Unassigned'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {servant.children?.length || 0} children
                        </p>
                      </div>
                    </div>
                  ))}
                  {servants.length > 4 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" onClick={navigateToCaregivers}>
                        View {servants.length - 4} more caregivers
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Information */}
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Today's Attendance
                </CardTitle>
                <Button variant="outline" size="sm" onClick={navigateToTodaysAttendance}>
                  <Eye className="h-4 w-4 mr-1" />
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {attendances.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No attendance recorded today</p>
                  <Button className="mt-4" onClick={navigateToTodaysAttendance}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Attendance
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendances.slice(0, 4).map((attendance) => {
                    const statusInfo = getAttendanceStatus(attendance.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={attendance.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className={`w-10 h-10 ${statusInfo.bg} rounded-full flex items-center justify-center`}>
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{attendance.child.fullName}</p>
                          <p className={`text-xs ${statusInfo.color} font-medium`}>
                            {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {new Date(attendance.createdAt).toLocaleTimeString()}
                          </p>
                          {attendance.broughtBy && (
                            <p className="text-xs text-muted-foreground">
                              by {attendance.broughtBy}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {attendances.length > 4 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" onClick={navigateToTodaysAttendance}>
                        View {attendances.length - 4} more records
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
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
      </div>
    </div>
  );
}