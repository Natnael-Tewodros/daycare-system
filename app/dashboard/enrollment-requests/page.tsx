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
  Baby,
  Building,
  RefreshCw
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
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function AdminEnrollmentRequestsPage() {
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch('/api/enrollment-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        setError("Failed to fetch enrollment requests");
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError("An error occurred while fetching requests");
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: number, status: 'approved' | 'rejected') => {
    setActionLoading(requestId);
    
    try {
      const response = await fetch(`/api/enrollment-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update the local state
        setRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status, updatedAt: new Date().toISOString() }
              : req
          )
        );
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update request status");
      }
    } catch (err) {
      console.error('Error updating request:', err);
      setError("An error occurred while updating the request");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
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
      total: requests.length
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading enrollment requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enrollment Requests Management</h1>
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

        {/* Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.total}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
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
                  <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
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
                  <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
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
        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrollment Requests</h3>
              <p className="text-gray-600">
                There are no enrollment requests to review at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Baby className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{request.childName}</CardTitle>
                        <p className="text-sm text-gray-600">Age: {request.childAge} years</p>
                      </div>
                    </div>
                    <Badge className={getStatusBadgeColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Application Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Parent Name</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <p className="text-sm">{request.parentName}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <p className="text-sm">{request.email}</p>
                          </div>
                        </div>

                        {request.phone && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Phone</p>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">{request.phone}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {request.preferredStartDate && (
                          <div>
                            <p className="text-sm font-medium text-gray-600">Preferred Start Date</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <p className="text-sm">{new Date(request.preferredStartDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium text-gray-600">Application Date</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-600">Last Updated</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="text-sm">{new Date(request.updatedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {request.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Additional Notes</p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{request.notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {request.status === 'pending' && (
                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          onClick={() => updateRequestStatus(request.id, 'approved')}
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
                          onClick={() => updateRequestStatus(request.id, 'rejected')}
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
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
