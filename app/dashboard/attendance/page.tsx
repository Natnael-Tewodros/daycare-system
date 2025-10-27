"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Assuming you have an Alert component; add if needed

type Attendance = {
  id: number;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  broughtBy: string | null;
  takenBy: string | null;
  createdAt: string;
  child: { id: number; fullName: string };
};

type Child = { id: number; fullName: string; parentName?: string; relationship?: string };

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'today' | 'yesterday' | 'week' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [checkOutData, setCheckOutData] = useState({
    takenBy: "",
    checkOutTime: new Date().toISOString().slice(0, 16),
  });

  const downloadCsv = (rows: Attendance[]) => {
    const headers = ['Child','Status','Check-In','Check-Out','Brought By','Taken By','Parent','Relationship'];
    const csvRows = [headers.join(',')];
    
    // Get all children and their attendance status
    const allChildrenWithAttendance = allChildren.map(child => {
      const attendance = rows.find(att => att.childId === child.id);
      return {
        child,
        attendance
      };
    });
    
    // Add all children with their attendance status
    for (const { child, attendance } of allChildrenWithAttendance) {
      const cols = [
        (child.fullName || '').replace(/,/g, ' '),
        attendance ? attendance.status : 'absent',
        attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleString() : '-',
        attendance?.checkOutTime ? new Date(attendance.checkOutTime).toLocaleString() : '-',
        (attendance?.broughtBy || '').replace(/,/g, ' '),
        (attendance?.takenBy || '').replace(/,/g, ' '),
        (child.parentName || '').replace(/,/g, ' '),
        (child.relationship || '').replace(/,/g, ' '),
      ];
      csvRows.push(cols.join(','));
    }
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchChildren = async () => {
    try {
      const res = await fetch("/api/children");
      if (!res.ok) throw new Error("Failed to fetch children");
      const data = await res.json();
      setAllChildren(data);
      setFilteredChildren(data);
    } catch (err) {
      setError("Failed to load children");
      console.error(err);
    }
  };

  const fetchAttendance = async (filter: 'today' | 'yesterday' | 'week' | 'all' | 'custom', customDateValue?: string) => {
    try {
      setLoading(true);
      let url = "/api/attendance";
      
      if (filter === 'today') {
        const start = new Date(); 
        start.setHours(0,0,0,0);
        url += `?start=${start.toISOString()}`;
      } else if (filter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0,0,0,0);
        const endYesterday = new Date(yesterday);
        endYesterday.setHours(23,59,59,999);
        url += `?start=${yesterday.toISOString()}&end=${endYesterday.toISOString()}`;
      } else if (filter === 'week') {
        const end = new Date(); 
        end.setHours(23,59,59,999);
        const start = new Date(end); 
        start.setDate(start.getDate() - 6); 
        start.setHours(0,0,0,0);
        url += `?start=${start.toISOString()}&end=${end.toISOString()}`;
      } else if (filter === 'custom' && customDateValue) {
        const customStart = new Date(customDateValue);
        customStart.setHours(0,0,0,0);
        const customEnd = new Date(customDateValue);
        customEnd.setHours(23,59,59,999);
        url += `?start=${customStart.toISOString()}&end=${customEnd.toISOString()}`;
      }
      // For 'all', no date filters are applied
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      setAttendance(data);
    } catch (err) {
      setError("Failed to load attendance");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredChildren(allChildren);
    } else {
      const filtered = allChildren.filter(child =>
        child.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (child.parentName && child.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredChildren(filtered);
    }
  }, [searchTerm, allChildren]);

  useEffect(() => {
    fetchChildren();
    fetchAttendance('today');
  }, []);

  const handleAttendanceAction = async (childId: number, status: 'present' | 'absent' | 'late', broughtBy?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: childId,
          status: status,
          broughtBy: broughtBy || null,
          checkInTime: status === 'present' || status === 'late' ? new Date().toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error(`Failed to mark as ${status}`);
      fetchAttendance();
    } catch (err) {
      setError(`Failed to mark child as ${status}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendance) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: selectedAttendance.id, 
          takenBy: checkOutData.takenBy,
          checkOutTime: checkOutData.checkOutTime,
        }),
      });
      if (!res.ok) throw new Error("Failed to check out");
      setCheckOutOpen(false);
      setSelectedAttendance(null);
      setCheckOutData({
        takenBy: "",
        checkOutTime: new Date().toISOString().slice(0, 16),
      });
      fetchAttendance();
    } catch (err) {
      setError("Failed to check out child");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Management</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Search children by name or parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <Button 
              variant={currentFilter === 'today' ? 'default' : 'outline'} 
              onClick={() => {
                setCurrentFilter('today');
                fetchAttendance('today');
              }}
            >
              Today
            </Button>
            <Button 
              variant={currentFilter === 'yesterday' ? 'default' : 'outline'} 
              onClick={() => {
                setCurrentFilter('yesterday');
                fetchAttendance('yesterday');
              }}
            >
              Yesterday
            </Button>
            <Button 
              variant={currentFilter === 'week' ? 'default' : 'outline'} 
              onClick={() => {
                setCurrentFilter('week');
                fetchAttendance('week');
              }}
            >
              This Week
            </Button>
            <Button 
              variant={currentFilter === 'all' ? 'default' : 'outline'} 
              onClick={() => {
                setCurrentFilter('all');
                fetchAttendance('all');
              }}
            >
              All
            </Button>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-40"
              />
              <Button 
                variant={currentFilter === 'custom' ? 'default' : 'outline'} 
                onClick={() => {
                  setCurrentFilter('custom');
                  fetchAttendance('custom', customDate);
                }}
              >
                Custom Date
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadCsv(attendance)}>Download CSV</Button>
          </div>
        </div>

        {/* Check-Out Modal */}
        <Dialog open={checkOutOpen} onOpenChange={setCheckOutOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Child Check-Out</DialogTitle>
              {selectedAttendance && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Child:</strong> {selectedAttendance.child.fullName}
                  </p>
                  {selectedAttendance.checkInTime && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Checked In:</strong> {new Date(selectedAttendance.checkInTime).toLocaleString()}
                    </p>
                  )}
                  {selectedAttendance.broughtBy && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Brought By:</strong> {selectedAttendance.broughtBy}
                    </p>
                  )}
                </div>
              )}
            </DialogHeader>
            <form onSubmit={handleCheckOut} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="takenBy" className="text-sm font-semibold">Who is picking up the child? *</Label>
                <Input
                  id="takenBy"
                  value={checkOutData.takenBy || ""}
                  onChange={(e) => setCheckOutData({ ...checkOutData, takenBy: e.target.value || "" })}
                  placeholder={`Enter name${selectedAttendance?.child?.parentName ? ` (e.g., ${selectedAttendance.child.parentName})` : ''}`}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the name of the person picking up the child
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutTime" className="text-sm font-semibold">Check-Out Time *</Label>
                <Input
                  id="checkOutTime"
                  type="datetime-local"
                  value={checkOutData.checkOutTime}
                  onChange={(e) => setCheckOutData({ ...checkOutData, checkOutTime: e.target.value })}
                  required
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Current time is automatically set. You can adjust if needed.
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Please verify the pickup person's identity before confirming checkout.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCheckOutOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading ? "Processing..." : "Confirm Check-Out"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Current Filter Display */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">
            {currentFilter === 'today' && 'Today\'s Attendance'}
            {currentFilter === 'yesterday' && 'Yesterday\'s Attendance - Children Who Didn\'t Check In'}
            {currentFilter === 'week' && 'This Week\'s Attendance'}
            {currentFilter === 'all' && 'All Attendance Records'}
            {currentFilter === 'custom' && `Attendance for ${new Date(customDate).toLocaleDateString()}`}
          </h3>
          <p className="text-sm text-blue-600">
            {currentFilter === 'today' && 'Mark attendance for today'}
            {currentFilter === 'yesterday' && 'View children who were absent yesterday'}
            {currentFilter === 'week' && 'View attendance records for the past 7 days'}
            {currentFilter === 'all' && 'View all attendance records'}
            {currentFilter === 'custom' && 'View attendance for the selected date'}
          </p>
        </div>

        {/* Children List with Attendance Actions */}
        {loading ? (
          <p>Loading children...</p>
        ) : (
          <div className="space-y-4">
            {filteredChildren.map((child) => {
              // Find attendance record for this child
              const childAttendance = attendance.find(att => att.childId === child.id);
              const isPresent = childAttendance && (childAttendance.status === 'present' || childAttendance.status === 'late');
              const isAbsent = childAttendance && childAttendance.status === 'absent';
              const isLate = childAttendance && childAttendance.status === 'late';
              
              return (
                <div key={child.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {child.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{child.fullName}</h3>
                        <p className="text-sm text-gray-600">
                          {child.parentName} • {child.relationship}
                        </p>
                        {childAttendance && (
                          <div className="flex flex-col gap-1 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full inline-block w-fit ${
                              isPresent ? 'bg-green-100 text-green-800' :
                              isLate ? 'bg-yellow-100 text-yellow-800' :
                              isAbsent ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {childAttendance.status.charAt(0).toUpperCase() + childAttendance.status.slice(1)}
                            </span>
                            {childAttendance.checkInTime && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-700">Checked in:</span>
                                <span className="text-gray-600">
                                  {new Date(childAttendance.checkInTime).toLocaleString()}
                                </span>
                              </div>
                            )}
                            {childAttendance.checkOutTime && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-700">Checked out:</span>
                                <span className="text-gray-600">
                                  {new Date(childAttendance.checkOutTime).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!childAttendance ? (
                      // No attendance record - show all options
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleAttendanceAction(child.id, 'present')}
                          disabled={loading}
                        >
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                          onClick={() => handleAttendanceAction(child.id, 'late')}
                          disabled={loading}
                        >
                          Late
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => handleAttendanceAction(child.id, 'absent')}
                          disabled={loading}
                        >
                          Absent
                        </Button>
                      </>
                    ) : (
                      // Has attendance record - show check out or status change options
                      <>
                        {!childAttendance.checkOutTime && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAttendance(childAttendance);
                              setCheckOutOpen(true);
                              setCheckOutData({
                                takenBy: "",
                                checkOutTime: new Date().toISOString().slice(0, 16),
                              });
                            }}
                            disabled={loading}
                          >
                            Check Out
                          </Button>
                        )}
                        {childAttendance.checkOutTime && (
                          <span className="text-sm text-gray-500 font-medium">
                            ✓ Checked Out
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            
            {filteredChildren.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? 'No children found matching your search.' : 
                   currentFilter === 'yesterday' ? 'No children were absent yesterday.' :
                   currentFilter === 'week' ? 'No attendance records for this week.' :
                   currentFilter === 'all' ? 'No attendance records found.' :
                   'No children found.'}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}