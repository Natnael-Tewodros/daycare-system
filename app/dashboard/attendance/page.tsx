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
  const [children, setChildren] = useState<Child[]>([]);
  const [childSearch, setChildSearch] = useState<string>("");
  const [showChildResults, setShowChildResults] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  const [checkInData, setCheckInData] = useState({
    childId: "",
    broughtBy: "",
    checkInTime: new Date().toISOString().slice(0, 16),
  });

  const [checkOutData, setCheckOutData] = useState({
    takenBy: "",
    checkOutTime: new Date().toISOString().slice(0, 16),
  });

  const downloadCsv = (rows: Attendance[]) => {
    const headers = ['Child','Check-In','Check-Out','Brought By','Taken By'];
    const csvRows = [headers.join(',')];
    for (const r of rows) {
      const cols = [
        (r.child?.fullName || '').replace(/,/g, ' '),
        r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '-',
        r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : '-',
        (r.broughtBy || '').replace(/,/g, ' '),
        (r.takenBy || '').replace(/,/g, ' '),
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
      setChildren(data);
    } catch (err) {
      setError("Failed to load children");
      console.error(err);
    }
  };

  const fetchAttendance = async (range?: 'day' | 'week' | 'all') => {
    try {
      setLoading(true);
      let url = "/api/attendance";
      if (range === 'day') {
        const start = new Date(); start.setHours(0,0,0,0);
        url += `?start=${start.toISOString()}`;
      } else if (range === 'week') {
        const end = new Date(); end.setHours(23,59,59,999);
        const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0);
        url += `?start=${start.toISOString()}&end=${end.toISOString()}`;
      }
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

  useEffect(() => {
    fetchChildren();
    fetchAttendance('day');
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInData.childId) {
      setError("Please select a child");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...checkInData,
          childId: parseInt(checkInData.childId), // Ensure number
        }),
      });
      if (!res.ok) throw new Error("Failed to check in");
      setCheckInOpen(false);
      setCheckInData({
        childId: "",
        broughtBy: "",
        checkInTime: new Date().toISOString().slice(0, 16),
      });
      fetchAttendance();
    } catch (err) {
      setError("Failed to check in child");
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
        <div className="flex justify-between mb-4">
          <Button onClick={() => setCheckInOpen(true)} disabled={loading}>
            {loading ? "Loading..." : "Check In"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchAttendance('day')}>Today</Button>
            <Button variant="outline" onClick={() => fetchAttendance('week')}>This Week</Button>
            <Button variant="outline" onClick={() => fetchAttendance('all')}>All</Button>
            <Button variant="outline" onClick={() => downloadCsv(attendance)}>Download CSV</Button>
          </div>
        </div>

        {/* Check-In Modal */}
        <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Child Check-In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCheckIn} className="space-y-3">
              <div>
                <Label>Search Child</Label>
                <Input
                  placeholder="Type child name"
                  value={childSearch}
                  onChange={(e) => { setChildSearch(e.target.value); setShowChildResults(true); }}
                  onFocus={() => setShowChildResults(true)}
                />
                {checkInData.childId && (
                  <div className="mt-1 text-sm text-gray-600">Selected: {children.find(c => String(c.id) === checkInData.childId)?.fullName || 'Unknown'}</div>
                )}
                {showChildResults && (
                  <div className="max-h-40 overflow-auto mt-2 border rounded">
                    {children
                      .filter(c => c.fullName.toLowerCase().includes(childSearch.toLowerCase()))
                      .slice(0, 20)
                      .map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${checkInData.childId === String(child.id) ? 'bg-gray-100' : ''}`}
                          onClick={() => {
                            setCheckInData({ ...checkInData, childId: String(child.id) });
                            setChildSearch(child.fullName);
                            setShowChildResults(false);
                          }}
                        >
                          {child.fullName}
                        </button>
                      ))}
                    {childSearch && children.filter(c => c.fullName.toLowerCase().includes(childSearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
                    )}
                  </div>
                )}
              </div>

              {/* Status removed; server defaults to 'present' */}

              <div>
                <Label>Brought By</Label>
                <Input
                  value={checkInData.broughtBy || ""}
                  onChange={(e) => setCheckInData({ ...checkInData, broughtBy: e.target.value || "" })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label>Check-In Time</Label>
                <Input
                  type="datetime-local"
                  value={checkInData.checkInTime}
                  onChange={(e) => setCheckInData({ ...checkInData, checkInTime: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Check-Out Modal */}
        <Dialog open={checkOutOpen} onOpenChange={setCheckOutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Child Check-Out</DialogTitle>
              {selectedAttendance && (
                <p className="text-sm text-muted-foreground">
                  For: {selectedAttendance.child.fullName}
                </p>
              )}
            </DialogHeader>
            <form onSubmit={handleCheckOut} className="space-y-3">
              <div>
                <Label>Taken By</Label>
                <Input
                  value={checkOutData.takenBy || ""}
                  onChange={(e) => setCheckOutData({ ...checkOutData, takenBy: e.target.value || "" })}
                  placeholder={`Optional${selectedAttendance?.child?.parentName ? ` (e.g., ${selectedAttendance.child.parentName} - ${selectedAttendance.child.relationship?.toLowerCase()})` : ''}`}
                />
              </div>

              <div>
                <Label>Check-Out Time</Label>
                <Input
                  type="datetime-local"
                  value={checkOutData.checkOutTime}
                  onChange={(e) => setCheckOutData({ ...checkOutData, checkOutTime: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Confirm Check-Out"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Attendance Table */}
        {loading ? (
          <p>Loading attendance...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Child</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead>Brought By</TableHead>
                <TableHead>Taken By</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.map((att) => (
                <TableRow key={att.id}>
                  <TableCell>{att.child?.fullName || "Unknown"}</TableCell>
                  <TableCell>{att.checkInTime ? new Date(att.checkInTime).toLocaleString() : "-"}</TableCell>
                  <TableCell>{att.checkOutTime ? new Date(att.checkOutTime).toLocaleString() : "-"}</TableCell>
                  <TableCell>{att.broughtBy || "-"}</TableCell>
                  <TableCell>{att.takenBy || "-"}</TableCell>
                  <TableCell>
                    {!att.checkOutTime && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAttendance(att);
                          setCheckOutOpen(true);
                          setCheckOutData({
                            takenBy: "",
                            checkOutTime: new Date().toISOString().slice(0, 16),
                          });
                        }}
                      >
                        Check Out
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {attendance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No attendance records for today.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}