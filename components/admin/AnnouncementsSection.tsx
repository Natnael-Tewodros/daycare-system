"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Bell, Edit, Eye, EyeOff } from "lucide-react";
import type { Announcement } from "@/app/dashboard/admin-management/types";

type AnnouncementsSectionProps = {
  announcements: Announcement[];
  isCreatingAnnouncement: boolean;
  editingAnnouncementId: number | null;
  announcementForm: { title: string; content: string; type: string; isActive: boolean; visibilityDays: number | null };
  setAnnouncementForm: (f: AnnouncementsSectionProps["announcementForm"]) => void;
  setIsCreatingAnnouncement: (v: boolean) => void;
  handleAnnouncementSubmit: (e: React.FormEvent) => void;
  handleEditAnnouncement: (a: Announcement) => void;
  handleDeleteAnnouncement: (id: number) => void;
  resetAnnouncementForm: () => void;
  getTypeColor: (type: string) => string;
  getVisibilityText: (days: number | null) => string;
  formatDate: (dateString: string) => string;
};

export default function AnnouncementsSection(props: AnnouncementsSectionProps) {
  const {
    announcements,
    isCreatingAnnouncement,
    editingAnnouncementId,
    announcementForm,
    setAnnouncementForm,
    setIsCreatingAnnouncement,
    handleAnnouncementSubmit,
    handleEditAnnouncement,
    handleDeleteAnnouncement,
    resetAnnouncementForm,
    getTypeColor,
    getVisibilityText,
    formatDate,
  } = props;

  return (
    <>
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
                      visibilityDays: value === "permanent" ? null : parseInt(value),
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTypeColor(announcement.type)}>{announcement.type}</Badge>
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
                  <p className="text-sm text-gray-600 mt-1">{formatDate(announcement.createdAt)}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 line-clamp-3 mb-4">{announcement.content}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEditAnnouncement(announcement)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteAnnouncement(announcement.id)} className="text-red-600 hover:text-red-700">
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
            <p className="text-gray-600 mb-4">Create your first announcement to share information with parents.</p>
            <Button onClick={() => setIsCreatingAnnouncement(true)}>Create Announcement</Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}



