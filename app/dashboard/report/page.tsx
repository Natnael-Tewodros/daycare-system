"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Building, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Activity,
  FileText,
  Download,
  Plus,
  Eye
} from "lucide-react";
import Image from "next/image";

// Types
interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string | Date;
  gender: string;
  profilePic?: string;
  parentName?: string;
  relationship?: string;
  organization?: string;
  site?: string;
}

interface Attendance {
  id: number;
  childId: number;
  status: string;
  checkInTime?: string | Date;
  checkOutTime?: string | Date;
  broughtBy?: string;
  takenBy?: string;
  createdAt: string | Date;
  child: {
    id: number;
    fullName: string;
    parentName?: string;
  };
}

interface Servant {
  id: number;
  fullName: string;
  email?: string;
  phone: string;
  site: string;
  organizationType: string;
  assignedRoom?: {
    id: number;
    name: string;
  };
}

interface Organization {
  id: number;
  name: string;
  type: string;
  childrenCount?: number;
}

// Age calculation
const calculateAge = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [children, setChildren] = useState<Child[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [servants, setServants] = useState<Servant[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState({
    totalChildren: 0,
    presentToday: 0,
    absentToday: 0,
    totalServants: 0,
    totalOrganizations: 0,
    attendanceRate: 0
  });

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data individually to handle partial failures
      const fetchData = async (url: string, name: string) => {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            console.log(`${name} data loaded successfully`);
            return data;
          } else {
            console.error(`Failed to fetch ${name}:`, res.status, res.statusText);
            return []; // Return empty array as fallback
          }
        } catch (err) {
          console.error(`Error fetching ${name}:`, err);
          return []; // Return empty array as fallback
        }
      };

      // Fetch all data in parallel
      const [childrenData, attendanceData, servantsData, organizationsData] = await Promise.all([
        fetchData('/api/children', 'Children'),
        fetchData('/api/attendance', 'Attendance'),
        fetchData('/api/servants', 'Servants'),
        fetchData('/api/organization', 'Organizations')
      ]);

      // If servants data failed, show a message but don't break the page
      if (servantsData.length === 0) {
        console.warn('Servants data could not be loaded - this section will be empty');
      }

      // Set the data
      setChildren(childrenData);
      setAttendance(attendanceData);
      setServants(servantsData);
      setOrganizations(organizationsData);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendanceData.filter((a: Attendance) => 
        new Date(a.createdAt).toISOString().split('T')[0] === today
      );
      
      const presentToday = todayAttendance.filter((a: Attendance) => a.status === 'present').length;
      const absentToday = todayAttendance.filter((a: Attendance) => a.status === 'absent').length;
      const attendanceRate = childrenData.length > 0 ? (presentToday / childrenData.length) * 100 : 0;

      setStats({
        totalChildren: childrenData.length,
        presentToday,
        absentToday,
        totalServants: servantsData.length,
        totalOrganizations: organizationsData.length,
        attendanceRate
      });

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load daycare information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading daycare information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button onClick={fetchAllData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daycare Report Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive overview of all daycare operations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChildren}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled children
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.attendanceRate.toFixed(1)}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentToday}</div>
            <p className="text-xs text-muted-foreground">
              Not present today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServants}</div>
            <p className="text-xs text-muted-foreground">
              Active caregivers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
            <CardDescription>Latest check-ins and check-outs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attendance.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.status === 'present' ? 'bg-green-500' : 
                      record.status === 'absent' ? 'bg-red-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium">{record.child.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.status === 'present' ? 'Present' : 
                         record.status === 'absent' ? 'Absent' : 'Late'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.createdAt).toLocaleTimeString()}
                    </p>
                    {record.broughtBy && (
                      <p className="text-xs text-muted-foreground">
                        Brought by: {record.broughtBy}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {attendance.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No attendance records for today
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Children Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Children Overview
            </CardTitle>
            <CardDescription>Recent children registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {children.slice(0, 5).map((child) => (
                <div key={child.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {child.profilePic ? (
                    <Image
                      src={child.profilePic}
                      alt={child.fullName}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{child.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {calculateAge(child.dateOfBirth)} years • {child.gender}
                    </p>
                    {child.parentName && (
                      <p className="text-xs text-muted-foreground">
                        Parent: {child.parentName}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {child.organization || 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations & Staff */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Organizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organizations
            </CardTitle>
            <CardDescription>Children by organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {org.type.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {org.childrenCount || 0} children
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Staff Members
            </CardTitle>
            <CardDescription>Active caregivers and staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {servants.length > 0 ? (
                servants.slice(0, 5).map((servant) => (
                  <div key={servant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{servant.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {servant.phone} • {servant.site}
                      </p>
                      {servant.assignedRoom && (
                        <p className="text-xs text-muted-foreground">
                          Room: {servant.assignedRoom.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {servant.organizationType}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Staff data unavailable</p>
                  <p className="text-sm text-muted-foreground">Check console for details</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <UserCheck className="h-6 w-6" />
              <span>Check In/Out</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Add Child</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Create Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Eye className="h-6 w-6" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}