"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  User,
  RefreshCw,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";

interface EnrollmentRequest {
  id: number;
  parentName: string;
  childName: string;
  childAge: number;
  email: string;
  phone?: string;
  preferredStartDate?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export default function AdminEnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<EnrollmentRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      // Request server-side filtering when admin wants only pending items
      const params = new URLSearchParams();
      if (filter === "pending") params.set("status", "pending");
      // keep newest first by default
      params.set("sort", "desc");
      const response = await fetch(
        `/api/enrollment-requests?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        // Use the full list returned by the API; do not deduplicate here so
        // admins can see every enrollment request.
        const list: EnrollmentRequest[] = (data.data || []).map((r: any) => ({
          ...r,
          status: String(r.status || "pending").toLowerCase(),
          email: String(r.email || "")
            .toLowerCase()
            .trim(),
        }));
        setRequests(list as EnrollmentRequest[]);
      } else {
        setError("Failed to fetch enrollment requests");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("An error occurred while fetching requests");
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId: number) => {
    if (!confirm("Delete this pending enrollment request?")) return;
    try {
      setActionLoading(requestId);
      const res = await fetch(`/api/enrollment-requests/${requestId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        let errText = "Failed to delete request";
        try {
          const j = await res.json();
          errText = j.error || j.message || errText;
        } catch {
          try {
            errText = await res.text();
          } catch {}
        }
        throw new Error(errText);
      }
      // Refresh the list from server to ensure consistent state (and notifications)
      await fetchRequests();
      setSuccessMessage("Enrollment request deleted");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications:updated"));
      }
    } catch (err) {
      setError((err as Error).message || "Failed to delete request");
    } finally {
      setActionLoading(null);
    }
  };

  const updateRequestStatus = async (
    requestId: number,
    status: "approved" | "rejected"
  ) => {
    setActionLoading(requestId);

    try {
      const response = await fetch(`/api/enrollment-requests`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: requestId, status }),
      });

      if (response.ok) {
        // Refresh from server to keep list and any notifications accurate
        await fetchRequests();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("notifications:updated"));
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update request status");
      }
    } catch (err) {
      console.error("Error updating request:", err);
      setError("An error occurred while updating the request");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Parse parent gender from notes heuristics to determine priority
  const parseParentGender = (notes?: string | null) => {
    if (!notes) return "N/A";
    try {
      const txt = String(notes).toUpperCase();
      if (txt.includes("PARENT GENDER") && txt.includes("FEMALE"))
        return "Female";
      if (
        txt.includes("MOTHER") ||
        txt.includes("WOMAN") ||
        txt.includes("WOMEN")
      )
        return "Female";
      if (txt.includes("FATHER") || txt.includes("MAN")) return "Male";
      return "N/A";
    } catch {
      return "N/A";
    }
  };

  const getRequestType = (r: EnrollmentRequest) => {
    const g = parseParentGender(r.notes);
    return g === "Female" ? "Priority" : "Ordinary";
  };

  const getStatusCounts = () => {
    const counts = requests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      pending: counts.pending || 0,
      approved: counts.approved || 0,
      rejected: counts.rejected || 0,
      total: requests.length,
    };
  };

  const statusCounts = getStatusCounts();

  const filtered = requests.filter((r) => {
    if (filter === "pending" && r.status !== "pending") return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.parentName || "").toLowerCase().includes(s) ||
      (r.email || "").toLowerCase().includes(s) ||
      (r.phone || "").toLowerCase().includes(s) ||
      (r.childName || "").toLowerCase().includes(s)
    );
  });

  // pagination: reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [filter, search, requests]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openView = (r: EnrollmentRequest) => {
    setSelected(r);
    setDialogOpen(true);
  };

  const closeView = () => {
    setDialogOpen(false);
    setSelected(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading enrollment requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enrollment Requests Management
          </h1>
          <p className="text-lg text-gray-600">
            Review and manage daycare enrollment applications
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {/* Success Message */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statusCounts.total}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {statusCounts.pending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {statusCounts.approved}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {statusCounts.rejected}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex rounded-md border border-blue-200 overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${
                filter === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => setFilter("pending")}
            >
              Pending
            </button>
            <button
              className={`px-3 py-1 text-sm ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
          </div>
          <div className="flex-1 max-w-sm">
            <Input
              placeholder="Search by parent, email, phone, child..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={fetchRequests}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Table list */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Enrollment Requests
              </h3>
              <p className="text-gray-600">
                There are no enrollment requests that match your filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <tr>
                    <TableHead className="w-32">Date</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-48">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {paginated.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{r.parentName}</TableCell>
                      <TableCell>{r.childName || "-"}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{r.phone || "-"}</TableCell>
                      <TableCell>
                        {(() => {
                          const isPriority =
                            parseParentGender(r.notes) === "Female";
                          const absoluteIdx =
                            (page - 1) * pageSize + paginated.indexOf(r);
                          return isPriority
                            ? "Priority"
                            : `Queue ${absoluteIdx + 1}`;
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(r.status)}>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              updateRequestStatus(r.id, "approved")
                            }
                            disabled={
                              actionLoading === r.id || r.status !== "pending"
                            }
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            onClick={() =>
                              updateRequestStatus(r.id, "rejected")
                            }
                            disabled={
                              actionLoading === r.id || r.status !== "pending"
                            }
                            size="sm"
                            variant="destructive"
                          >
                            Reject
                          </Button>
                          <Button
                            onClick={() => openView(r)}
                            size="sm"
                            variant="outline"
                          >
                            View
                          </Button>
                          {filter === "all" ? (
                            <Button
                              onClick={() => deleteRequest(r.id)}
                              disabled={actionLoading === r.id}
                              size="sm"
                              variant="outline"
                              className="text-red-700 border-red-200"
                            >
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        {/* Pagination controls */}
        {filtered.length > pageSize && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </Button>
              <div className="text-sm">
                Page {page} / {totalPages}
              </div>
              <Button
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Details dialog */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) closeView();
            else setDialogOpen(open);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enrollment Request</DialogTitle>
            </DialogHeader>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Parent</p>
                  <p className="text-base text-gray-900">
                    {selected.parentName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Child</p>
                  <p className="text-base text-gray-900">
                    {selected.childName || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-sm text-gray-900">{selected.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Phone</p>
                    <p className="text-sm text-gray-900">
                      {selected.phone || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={getStatusBadgeColor(selected.status)}>
                    {selected.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Submitted</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selected.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Last updated
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(selected.updatedAt).toLocaleString()}
                  </p>
                </div>
                {selected.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Notes</p>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                      {selected.notes}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>No request selected</p>
            )}
            <DialogFooter>
              <div className="flex items-center gap-2">
                {selected && selected.status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        if (selected)
                          updateRequestStatus(selected.id, "approved");
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (selected)
                          updateRequestStatus(selected.id, "rejected");
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {filter === "all" && selected && (
                  <Button
                    variant="outline"
                    className="text-red-700 border-red-200"
                    onClick={() => {
                      if (selected) deleteRequest(selected.id);
                    }}
                  >
                    Delete
                  </Button>
                )}
                <DialogClose asChild>
                  <Button onClick={closeView}>Close</Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
