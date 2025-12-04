"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  Baby,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface EnrollmentRequest {
  id: number;
  parentName: string;
  childName: string;
  childAge: number;
  email: string;
  phone?: string;
  preferredStartDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApplicationStatusPage() {
  const [enrollmentRequests, setEnrollmentRequests] = useState<
    EnrollmentRequest[]
  >([]);
  const [rawResults, setRawResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Get parent info from localStorage
    const storedParentInfo = localStorage.getItem("parentInfo");
    if (storedParentInfo) {
      const parent = JSON.parse(storedParentInfo);
      fetchEnrollmentRequests(parent.email);
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchEnrollmentRequests = async (parentEmail: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/enrollment-requests");
      if (response.ok) {
        const data = await response.json();
        // Keep raw API results for debugging when parents report missing entries
        setRawResults(Array.isArray(data.data) ? data.data : []);
        console.debug("/api/enrollment-requests raw data:", data);
        // Filter requests for this parent
        const userRequests: EnrollmentRequest[] = (data.data || [])
          .filter(
            (req: EnrollmentRequest) =>
              req.email.toLowerCase() === parentEmail.toLowerCase()
          )
          .map((r: any) => ({
            ...r,
            status: String(r.status || "pending").toLowerCase(),
          }));
        // Group by same-day submissions (avoid duplicates from multi-child forms)
        const byDayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
        const grouped = new Map<string, EnrollmentRequest>();
        for (const r of userRequests) {
          const key = `${byDayKey(r.createdAt)}|${r.email.toLowerCase()}`;
          if (!grouped.has(key)) grouped.set(key, r);
        }
        setEnrollmentRequests(Array.from(grouped.values()));
      } else {
        setError("Failed to fetch enrollment requests");
      }
    } catch (err) {
      console.error("Error fetching enrollment requests:", err);
      setError("An error occurred while fetching requests");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = (requestId: number) => {
    router.push(`/parent-application?update=${requestId}`);
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (
      !confirm(
        "Are you sure you want to cancel this application? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/enrollment-requests/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remove the request from local state
        setEnrollmentRequests((prev) =>
          prev.filter((req) => req.id !== requestId)
        );
        setSuccessMessage("Application cancelled successfully");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(
          errorData.message || errorData.error || "Failed to cancel application"
        );
      }
    } catch (error) {
      console.error("Error cancelling application:", error);
      setError("An error occurred while cancelling the application");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
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
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return 'Congratulations! Your application has been approved. The admin will register your child and you will be able to see their information in the "My Children" section once registration is complete.';
      case "rejected":
        return "Unfortunately, your application has been rejected. Please contact the daycare administration for more information.";
      case "pending":
        return "Your application is currently under review. We will notify you once a decision has been made.";
      default:
        return "Application status is unknown. Please contact support.";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Application Status
            </h1>
            <p className="text-gray-600">
              Track your daycare enrollment applications
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/parent-application")}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}
      {/* Success Message */}
      {successMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Applications List */}
      {enrollmentRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Applications Found
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted any daycare applications yet.
            </p>
            {rawResults && rawResults.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">
                  Debug: API returned applications for these emails:
                </p>
                <div className="mt-2 text-xs text-gray-700">
                  {Array.from(
                    new Set(
                      rawResults.map((r: any) =>
                        String(r.email || "").toLowerCase()
                      )
                    )
                  )
                    .filter(Boolean)
                    .slice(0, 20)
                    .map((e: string) => (
                      <div key={e}>{e}</div>
                    ))}
                </div>
              </div>
            )}
            <Button
              onClick={() => router.push("/parent-application")}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit Your First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollmentRequests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Baby className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">
                        {request.childName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Age: {request.childAge} years
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeColor(request.status)}>
                    {getStatusIcon(request.status)}
                    <span className="ml-1 capitalize">{request.status}</span>
                  </Badge>
                </div>

                <Alert className={getStatusBadgeColor(request.status)}>
                  <AlertDescription>
                    {getStatusMessage(request.status)}
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {request.status === "pending" && (
                    <>
                      <Button
                        onClick={() => handleUpdateRequest(request.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Update Application
                      </Button>
                      <Button
                        onClick={() => handleDeleteRequest(request.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Cancel Application
                      </Button>
                    </>
                  )}
                  {request.status === "approved" && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-800 text-sm font-medium">
                        ✅ Your application has been approved! The admin will
                        register your child and you will be notified once the
                        registration is complete.
                      </p>
                    </div>
                  )}
                </div>

                {/* Application Details */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p>
                      <strong>Application Date:</strong>{" "}
                      {formatDate(request.createdAt)}
                    </p>
                    <p>
                      <strong>Last Updated:</strong>{" "}
                      {formatDate(request.updatedAt)}
                    </p>
                    {request.preferredStartDate && (
                      <p>
                        <strong>Preferred Start:</strong>{" "}
                        {formatDate(request.preferredStartDate)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p>
                      <strong>Parent:</strong> {request.parentName}
                    </p>
                    <p>
                      <strong>Email:</strong> {request.email}
                    </p>
                    {request.phone && (
                      <p>
                        <strong>Phone:</strong> {request.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {request.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Additional Information:
                    </p>
                    <p className="text-sm text-gray-600">{request.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {enrollmentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-800">
                  {
                    enrollmentRequests.filter((req) => req.status === "pending")
                      .length
                  }
                </p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-800">
                  {
                    enrollmentRequests.filter(
                      (req) => req.status === "approved"
                    ).length
                  }
                </p>
                <p className="text-sm text-green-600">Approved</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-800">
                  {
                    enrollmentRequests.filter(
                      (req) => req.status === "rejected"
                    ).length
                  }
                </p>
                <p className="text-sm text-red-600">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
