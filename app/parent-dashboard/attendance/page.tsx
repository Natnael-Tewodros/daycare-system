"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Child {
  id: number;
  fullName: string;
  attendances: Attendance[];
}

interface Attendance {
  id: number;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  broughtBy?: string;
  takenBy?: string;
  createdAt: string;
}

export default function AttendancePage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchChildrenData(userId);
    }
  }, []);

  useEffect(() => {
    const childParam = searchParams.get('child');
    if (childParam) {
      setSelectedChild(parseInt(childParam));
    }
  }, [searchParams]);

  const fetchChildrenData = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parent/children?parentId=${userId}`);
      if (response.ok) {
        const childrenData = await response.json();
        setChildren(childrenData);
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching children data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'late':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getAttendanceStats = (attendances: Attendance[]) => {
    const total = attendances.length;
    const present = attendances.filter(a => a.status.toLowerCase() === 'present').length;
    const absent = attendances.filter(a => a.status.toLowerCase() === 'absent').length;
    const late = attendances.filter(a => a.status.toLowerCase() === 'late').length;
    
    return { total, present, absent, late };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
        <p className="text-gray-600 mb-6">
          You don't have any children registered in the daycare system yet.
        </p>
      </div>
    );
  }

  const currentChild = children.find(child => child.id === selectedChild);
  const stats = currentChild ? getAttendanceStats(currentChild.attendances) : { total: 0, present: 0, absent: 0, late: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Records</h1>
          <p className="text-gray-600 mt-1">Track your child's attendance history</p>
        </div>
      </div>

      {/* Child Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Select Child:</label>
            <Select value={selectedChild?.toString() || ""} onValueChange={(value) => setSelectedChild(parseInt(value))}>
              <SelectTrigger className="w-64">
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      {child.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectTrigger>
            </Select>
          </div>
        </CardContent>
      </Card>

      {currentChild && (
        <>
          {/* Attendance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Days</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">Late</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance History - {currentChild.fullName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentChild.attendances.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance records found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentChild.attendances.map((attendance) => (
                    <div key={attendance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attendance.status)}
                          <Badge className={getStatusColor(attendance.status)}>
                            {attendance.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(attendance.createdAt)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {attendance.checkInTime && (
                              <span>In: {formatTime(attendance.checkInTime)}</span>
                            )}
                            {attendance.checkOutTime && (
                              <span>Out: {formatTime(attendance.checkOutTime)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {attendance.broughtBy && (
                          <p>Brought by: {attendance.broughtBy}</p>
                        )}
                        {attendance.takenBy && (
                          <p>Taken by: {attendance.takenBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

