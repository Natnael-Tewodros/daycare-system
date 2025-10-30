"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react";
import type { EnrollmentRequest } from "@/app/dashboard/admin-management/types";

type EnrollmentSectionProps = {
  enrollmentRequests: EnrollmentRequest[];
  searchText: string;
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  setSearchText: (v: string) => void;
  setStatusFilter: (v: 'all' | 'pending' | 'approved' | 'rejected') => void;
  getStatusBadgeColor: (status: string) => string;
  getStatusIcon: (status: string) => JSX.Element;
  detailOpen: boolean;
  setDetailOpen: (open: boolean) => void;
  selectedRequest: EnrollmentRequest | null;
  setSelectedRequest: (r: EnrollmentRequest | null) => void;
  updateEnrollmentStatus: (id: number, status: 'pending' | 'approved' | 'rejected') => void;
};

export default function EnrollmentSection(props: EnrollmentSectionProps) {
  const {
    enrollmentRequests,
    searchText,
    statusFilter,
    setSearchText,
    setStatusFilter,
    getStatusBadgeColor,
    getStatusIcon,
    detailOpen,
    setDetailOpen,
    selectedRequest,
    setSelectedRequest,
    updateEnrollmentStatus,
  } = props;

  return (
    <>
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by child, parent, or email..."
                className="w-72"
              />
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {enrollmentRequests.length} requests
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {enrollmentRequests
          .filter((r) => (statusFilter === 'all' ? true : r.status === statusFilter))
          .filter((r) => {
            const q = searchText.toLowerCase();
            return (
              !q ||
              r.childName.toLowerCase().includes(q) ||
              r.parentName.toLowerCase().includes(q) ||
              r.email.toLowerCase().includes(q)
            );
          })
          .map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{r.childName}</CardTitle>
                      <p className="text-sm text-muted-foreground">Age: {r.childAge}</p>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeColor(r.status)}>
                    {getStatusIcon(r.status)}
                    <span className="ml-1 capitalize">{r.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Parent</p>
                    <p className="font-medium">{r.parentName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium break-all">{r.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-medium">{r.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Preferred Start</p>
                    <p className="font-medium">{r.preferredStartDate ? new Date(r.preferredStartDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Applied</p>
                    <p className="font-medium">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Updated</p>
                    <p className="font-medium">{new Date(r.updatedAt).toLocaleDateString()}</p>
                  </div>
                  {r.notes && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600">Notes</p>
                      <p className="font-medium whitespace-pre-wrap bg-gray-50 p-3 rounded-md">
                        {r.notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 justify-end mt-4">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(r); setDetailOpen(true); }}>
                    Details
                  </Button>
                  <Button size="sm" variant="outline" className="text-green-700 hover:text-green-800 hover:bg-green-50" disabled={r.status==='approved'} onClick={() => updateEnrollmentStatus(r.id, 'approved')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-700 hover:text-red-800 hover:bg-red-50" disabled={r.status==='rejected'} onClick={() => updateEnrollmentStatus(r.id, 'rejected')}>
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {enrollmentRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrollment Requests</h3>
            <p className="text-gray-600">No enrollment requests have been submitted yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{enrollmentRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{enrollmentRequests.filter(req => req.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{enrollmentRequests.filter(req => req.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{selectedRequest.childName}</div>
                  <div className="text-sm text-gray-600">Age: {selectedRequest.childAge}</div>
                </div>
                <Badge className={getStatusBadgeColor(selectedRequest.status)}>
                  {getStatusIcon(selectedRequest.status)}
                  <span className="ml-1 capitalize">{selectedRequest.status}</span>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Parent</div>
                  <div className="text-sm">{selectedRequest.parentName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Email</div>
                  <div className="text-sm">{selectedRequest.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Phone</div>
                  <div className="text-sm">{selectedRequest.phone || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Preferred Start</div>
                  <div className="text-sm">{selectedRequest.preferredStartDate ? new Date(selectedRequest.preferredStartDate).toLocaleDateString() : '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Applied</div>
                  <div className="text-sm">{new Date(selectedRequest.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Last Updated</div>
                  <div className="text-sm">{new Date(selectedRequest.updatedAt).toLocaleDateString()}</div>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Notes</div>
                  <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="text-red-700 hover:text-red-800 hover:bg-red-50"
                  disabled={selectedRequest.status==='rejected'}
                  onClick={() => { updateEnrollmentStatus(selectedRequest.id, 'rejected'); setDetailOpen(false); }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={selectedRequest.status==='approved'}
                  onClick={() => { updateEnrollmentStatus(selectedRequest.id, 'approved'); setDetailOpen(false); }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}



