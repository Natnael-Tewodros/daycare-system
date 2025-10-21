"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  Search,
  User,
  Baby
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

export default function ApplicationStatusPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [searched, setSearched] = useState(false);

  const searchApplications = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const response = await fetch('/api/enrollment-requests');
      if (response.ok) {
        const data = await response.json();
        const userRequests = data.data?.filter((req: EnrollmentRequest) => 
          req.email.toLowerCase() === email.toLowerCase()
        ) || [];
        
        setRequests(userRequests);
        
        if (userRequests.length === 0) {
          setError("No applications found for this email address");
        }
      } else {
        setError("Failed to fetch application data");
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError("An error occurred while searching for applications");
    } finally {
      setLoading(false);
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'approved':
        return "Congratulations! Your application has been approved. You will receive further instructions via email.";
      case 'rejected':
        return "Unfortunately, your application was not approved at this time. Please contact us for more information.";
      case 'pending':
        return "Your application is currently under review. We will notify you once a decision has been made.";
      default:
        return "Status unknown. Please contact us for assistance.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-orange-50 to-yellow-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Application Status</h1>
          <p className="text-lg text-gray-600">
            Enter your email address to check the status of your daycare application
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              
              <Button 
                onClick={searchApplications}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 h-11"
              >
                {loading ? "Searching..." : "Search Applications"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {searched && requests.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              Your Applications ({requests.length})
            </h2>
            
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
                    {/* Status Message */}
                    <Alert className={getStatusBadgeColor(request.status)}>
                      <AlertDescription className="text-sm">
                        {getStatusMessage(request.status)}
                      </AlertDescription>
                    </Alert>

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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• If you can't find your application, please check that you're using the correct email address</p>
              <p>• For questions about your application status, please contact the daycare administration</p>
              <p>• If you need to update your application information, please submit a new application</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
