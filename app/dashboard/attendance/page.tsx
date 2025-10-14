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

type Child = { id: number; fullName: string };

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);

  const [checkInData, setCheckInData] = useState({
    childId: "",
    status: "present",
    broughtBy: "",
    checkInTime: new Date().toISOString().slice(0, 16),
  });

  const [checkOutData, setCheckOutData] = useState({
    takenBy: "",
    checkOutTime: new Date().toISOString().slice(0, 16),
  });

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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/attendance");
      if (!res.ok) throw new Error("Failed to fetch attendance");
      const data = await res.json();
      // Filter to show only recent or today's attendances for better UX (optional: adjust as needed)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = data.filter((att: Attendance) => new Date(att.createdAt) >= today);
      setAttendance(filtered);
    } catch (err) {
      setError("Failed to load attendance");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchAttendance();
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
        status: "present",
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
        </div>

        {/* Check-In Modal */}
        <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Child Check-In</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCheckIn} className="space-y-3">
              <div>
                <Label>Child</Label>
                <Select
                  onValueChange={(val) => setCheckInData({ ...checkInData, childId: val })}
                  value={checkInData.childId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  onValueChange={(val) => setCheckInData({ ...checkInData, status: val })}
                  value={checkInData.status}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Brought By</Label>
                <Input
                  value={checkInData.broughtBy || ""}
                  onChange={(e) => setCheckInData({ ...checkInData, broughtBy: e.target.value || null })}
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
                  onChange={(e) => setCheckOutData({ ...checkOutData, takenBy: e.target.value || null })}
                  placeholder="Optional"
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
                <TableHead>Status</TableHead>
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
                  <TableCell className="capitalize">{att.status}</TableCell>
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
                  <TableCell colSpan={7} className="text-center">No attendance records for today.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}