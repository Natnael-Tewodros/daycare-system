"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Shield, 
  UserCheck,
  RefreshCw,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Bell
} from "lucide-react";
import UsersGrid from "@/components/admin/UsersGrid";
import EnrollmentSection from "@/components/admin/EnrollmentSection";
import AnnouncementsSection from "@/components/admin/AnnouncementsSection";
import PasswordModal from "@/components/admin/PasswordModal";
import type { User, EnrollmentRequest, Announcement } from "./types";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

 

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
          <UsersGrid
            users={users}
            getRoleBadgeColor={getRoleBadgeColor}
            getRoleIcon={getRoleIcon}
            updateUserRole={updateUserRole}
            openPasswordModal={openPasswordModal}
            deleteUser={deleteUser}
          />
        )}

        {/* Enrollment Requests Tab */}
        {activeTab === 'enrollment' && (
          <EnrollmentSection
            enrollmentRequests={enrollmentRequests}
            searchText={searchText}
            statusFilter={statusFilter}
            setSearchText={setSearchText}
            setStatusFilter={setStatusFilter as any}
            getStatusBadgeColor={getStatusBadgeColor}
            getStatusIcon={getStatusIcon}
            detailOpen={detailOpen}
            setDetailOpen={setDetailOpen}
            selectedRequest={selectedRequest}
            setSelectedRequest={setSelectedRequest}
            updateEnrollmentStatus={updateEnrollmentStatus}
          />
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <AnnouncementsSection
            announcements={announcements}
            isCreatingAnnouncement={isCreatingAnnouncement}
            editingAnnouncementId={editingAnnouncementId}
            announcementForm={announcementForm}
            setAnnouncementForm={setAnnouncementForm as any}
            setIsCreatingAnnouncement={setIsCreatingAnnouncement}
            handleAnnouncementSubmit={handleAnnouncementSubmit}
            handleEditAnnouncement={handleEditAnnouncement}
            handleDeleteAnnouncement={handleDeleteAnnouncement}
            resetAnnouncementForm={resetAnnouncementForm}
            getTypeColor={getTypeColor}
            getVisibilityText={getVisibilityText}
            formatDate={formatDate}
          />
        )}
      </div>

      <PasswordModal
        open={passwordModalOpen}
        users={users}
        selectedUserId={selectedUserId}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        setNewPassword={setNewPassword}
        setConfirmPassword={setConfirmPassword}
        error={error}
        passwordLoading={passwordLoading}
        onClose={() => setPasswordModalOpen(false)}
        onUpdate={updatePassword}
      />
    </div>
  );
}
