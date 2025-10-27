"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  UserCog, 
  Shield, 
  UserCheck,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  Key,
  Eye,
  EyeOff,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Calendar,
  Bell
} from "lucide-react";
import { Label } from "@/components/ui/label";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: 'ADMIN' | 'PARENT';
  createdAt: string;
}

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

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  visibilityDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export default function AdminManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'enrollment' | 'announcements'>('users');
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Announcement form state
  const [isCreatingAnnouncement, setIsCreatingAnnouncement] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "GENERAL",
    isActive: true,
    visibilityDays: null as number | null
  });

  useEffect(() => {
    fetchUsers();
    fetchEnrollmentRequests();
    fetchAnnouncements();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      } else {
        setError('Failed to fetch announcements');
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to fetch announcements');
    }
  };

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingAnnouncementId ? `/api/announcements/${editingAnnouncementId}` : '/api/announcements';
      const method = editingAnnouncementId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      });

      if (response.ok) {
        setError(null);
        resetAnnouncementForm();
        fetchAnnouncements();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save announcement');
      }
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError('Failed to save announcement');
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isActive: announcement.isActive,
      visibilityDays: announcement.visibilityDays
    });
    setEditingAnnouncementId(announcement.id);
    setIsCreatingAnnouncement(true);
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setError(null);
        fetchAnnouncements();
      } else {
        setError('Failed to delete announcement');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement');
    }
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: "",
      content: "",
      type: "GENERAL",
      isActive: true,
      visibilityDays: null
    });
    setEditingAnnouncementId(null);
    setIsCreatingAnnouncement(false);
  };

  const fetchEnrollmentRequests = async () => {
    try {
      const response = await fetch('/api/enrollment-requests');
      if (response.ok) {
        const data = await response.json();
        setEnrollmentRequests(data.data || []);
      } else {
        setError('Failed to fetch enrollment requests');
      }
    } catch (err) {
      console.error('Error fetching enrollment requests:', err);
      setError('Failed to fetch enrollment requests');
    } finally {
      setLoading(false);
    }
  };

  const updateEnrollmentStatus = async (requestId: number, status: 'pending' | 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/enrollment-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status }),
      });

      if (response.ok) {
        setEnrollmentRequests(enrollmentRequests.map(req => 
          req.id === requestId ? { ...req, status } : req
        ));
      } else {
        setError('Failed to update enrollment request status');
      }
    } catch (err) {
      console.error('Error updating enrollment request:', err);
      setError('Failed to update enrollment request status');
    }
  };

  const updateUserRole = async (userId: string, newRole: 'ADMIN' | 'PARENT') => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const openPasswordModal = (userId: string) => {
    setSelectedUserId(userId);
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setPasswordModalOpen(true);
  };

  const updatePassword = async () => {
    if (!selectedUserId) return;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${selectedUserId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        setPasswordModalOpen(false);
        setNewPassword("");
        setConfirmPassword("");
        setError(null);
        // Show success message
        alert('Password updated successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Error updating password:', err);
      setError('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PARENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-4 w-4" />;
      case 'PARENT':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IMPORTANT':
        return 'bg-red-100 text-red-800';
      case 'EVENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getVisibilityText = (visibilityDays: number | null) => {
    if (!visibilityDays) return "Permanent";
    if (visibilityDays === 1) return "1 Day";
    if (visibilityDays === 7) return "1 Week";
    if (visibilityDays === 14) return "2 Weeks";
    if (visibilityDays === 30) return "1 Month";
    return `${visibilityDays} Days`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Admin Management
              </h1>
              <p className="text-lg text-muted-foreground">Manage users and enrollment requests</p>
            </div>
            <Button onClick={() => { fetchUsers(); fetchEnrollmentRequests(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === 'users' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('users')}
              className="px-6"
            >
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </Button>
            <Button
              variant={activeTab === 'enrollment' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('enrollment')}
              className="px-6"
            >
              <FileText className="h-4 w-4 mr-2" />
              Enrollment ({enrollmentRequests.length})
            </Button>
            <Button
              variant={activeTab === 'announcements' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('announcements')}
              className="px-6"
            >
              <Bell className="h-4 w-4 mr-2" />
              Announcements ({announcements.length})
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <UserCog className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">@{user.id}</p>
                    </div>
                  </div>
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{user.role}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-sm">{user.email}</p>
                  </div>
                  
                  {user.username && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Username</p>
                      <p className="text-sm">@{user.username}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-600">Role</p>
                    <Select 
                      value={user.role} 
                      onValueChange={(newRole: 'ADMIN' | 'PARENT') => updateUserRole(user.id, newRole)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectContent>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="PARENT">Parent</SelectItem>
                        </SelectContent>
                      </SelectTrigger>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openPasswordModal(user.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Update Password
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">No users have been created yet.</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">
                    {users.filter(user => user.role === 'ADMIN').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Parents</p>
                  <p className="text-2xl font-bold">
                    {users.filter(user => user.role === 'PARENT').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}

        {/* Enrollment Requests Tab */}
        {activeTab === 'enrollment' && (
          <>
            {/* Filters */}
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
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
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

            {/* Card List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {enrollmentRequests
                .filter(r => statusFilter === 'all' ? true : r.status === statusFilter)
                .filter(r => {
                  const q = searchText.toLowerCase();
                  return !q ||
                    r.childName.toLowerCase().includes(q) ||
                    r.parentName.toLowerCase().includes(q) ||
                    r.email.toLowerCase().includes(q);
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
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enrollment Requests</h3>
                  <p className="text-gray-600">No enrollment requests have been submitted yet.</p>
                </CardContent>
              </Card>
            )}

            {/* Enrollment Statistics */}
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
                      <p className="text-2xl font-bold">
                        {enrollmentRequests.filter(req => req.status === 'pending').length}
                      </p>
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
                      <p className="text-2xl font-bold">
                        {enrollmentRequests.filter(req => req.status === 'approved').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          
          {/* Detail Dialog */}
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
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <>
            {/* Create/Edit Announcement Form */}
            {isCreatingAnnouncement && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {editingAnnouncementId ? 'Edit Announcement' : 'Create New Announcement'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="Enter announcement title"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value })}>
                          <SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GENERAL">General</SelectItem>
                              <SelectItem value="IMPORTANT">Important</SelectItem>
                              <SelectItem value="EVENT">Event</SelectItem>
                            </SelectContent>
                          </SelectTrigger>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visibilityDays">Visibility Duration</Label>
                        <Select 
                          value={announcementForm.visibilityDays?.toString() || "permanent"} 
                          onValueChange={(value) => setAnnouncementForm({ 
                            ...announcementForm, 
                            visibilityDays: value === "permanent" ? null : parseInt(value) 
                          })}
                        >
                          <SelectTrigger>
                            <SelectContent>
                              <SelectItem value="permanent">Permanent</SelectItem>
                              <SelectItem value="1">1 Day</SelectItem>
                              <SelectItem value="2">2 Days</SelectItem>
                              <SelectItem value="3">3 Days</SelectItem>
                              <SelectItem value="7">1 Week</SelectItem>
                              <SelectItem value="14">2 Weeks</SelectItem>
                              <SelectItem value="30">1 Month</SelectItem>
                            </SelectContent>
                          </SelectTrigger>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Content *</Label>
                      <textarea
                        id="content"
                        value={announcementForm.content}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                        placeholder="Enter announcement content"
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={announcementForm.isActive}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, isActive: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isActive">Active (visible to parents)</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingAnnouncementId ? 'Update Announcement' : 'Create Announcement'}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetAnnouncementForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Announcements List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(announcement.type)}>
                            {announcement.type}
                          </Badge>
                          {announcement.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Eye className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {getVisibilityText(announcement.visibilityDays)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(announcement.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-3 mb-4">
                      {announcement.content}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAnnouncement(announcement)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {announcements.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Announcements</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first announcement to share information with parents.
                  </p>
                  <Button onClick={() => setIsCreatingAnnouncement(true)}>
                    Create Announcement
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Password Update Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Update User Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUserId && (
                <div className="text-sm text-gray-600">
                  Updating password for: <strong>{users.find(u => u.id === selectedUserId)?.name}</strong>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={updatePassword}
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="flex-1"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPasswordModalOpen(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
