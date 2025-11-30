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

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/enrollment-requests");
      if (response.ok) {
        const data = await response.json();
        const list: EnrollmentRequest[] = data.data || [];
        // Group multiple same-day submissions by same parent email
        const byDayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
        const grouped = new Map<string, EnrollmentRequest>();
        for (const r of list) {
          const email = (r.email || "").toLowerCase();
          const key = `${byDayKey(r.createdAt)}|${email}`;
          if (!grouped.has(key)) grouped.set(key, r);
        }
        setRequests(Array.from(grouped.values()));
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
        // try to parse json error first
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
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
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
        // Update the local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? { ...req, status, updatedAt: new Date().toISOString() }
              : req
          )
        );
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
          <Button
            onClick={fetchRequests}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Requests List */}
        {(() => {
          const visible =
            filter === "pending"
              ? requests.filter((r) => r.status === "pending")
              : requests;
          return visible.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filter === "pending"
                    ? "No Pending Requests"
                    : "No Enrollment Requests"}
                </h3>
                <p className="text-gray-600">
                  {filter === "pending"
                    ? "All caught up for now."
                    : "There are no enrollment requests to review at this time."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {visible.map((request) => (
                <Card
                  key={request.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {request.parentName}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">
                          {request.status}
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Application Details (Parent first) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Parent Name
                            </p>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">{request.parentName}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Email
                            </p>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">{request.email}</p>
                            </div>
                          </div>

                          {request.phone && (
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                Phone
                              </p>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <p className="text-sm">{request.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* Organization and Site parsed from notes if present */}
                          {request.notes &&
                            request.notes.includes("Organization:") && (
                              <div>
                                <p className="text-sm font-medium text-gray-600">
                                  Organization & Site
                                </p>
                                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                                  {request.notes
                                    .split("\n")
                                    .filter(Boolean)
                                    .filter(
                                      (l) =>
                                        l.startsWith("Organization:") ||
                                        l.startsWith("Site:")
                                    )
                                    .join("\n")}
                                </div>
                              </div>
                            )}

                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Application Date
                            </p>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">
                                {new Date(
                                  request.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Last Updated
                            </p>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">
                                {new Date(
                                  request.updatedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {request.notes && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Description
                          </p>
                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-line">
                            {request.notes}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {request.status === "pending" && (
                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            onClick={() =>
                              updateRequestStatus(request.id, "approved")
                            }
                            disabled={actionLoading === request.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Approve
                          </Button>
                          <Button
                            onClick={() =>
                              updateRequestStatus(request.id, "rejected")
                            }
                            disabled={actionLoading === request.id}
                            variant="destructive"
                          >
                            {actionLoading === request.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Reject
                          </Button>
                          <Button
                            onClick={() => deleteRequest(request.id)}
                            disabled={actionLoading === request.id}
                            variant="outline"
                            className="text-red-700 border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
