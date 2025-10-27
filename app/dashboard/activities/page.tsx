"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, AlertTriangle, Heart, CheckCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActivityForm {
  recipients: string[];
  subject: string;
  description: string;
  attachments: File[];
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<any>(null);
  const [readActivities, setReadActivities] = useState<Set<number>>(new Set());
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const [formData, setFormData] = useState<ActivityForm>({
    recipients: [],
    subject: "",
    description: "",
    attachments: [],
  });
  const [allParents, setAllParents] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data);
      
      // Load read activities from localStorage
      const readActivitiesJson = localStorage.getItem('readActivities');
      if (readActivitiesJson) {
        const readArray = JSON.parse(readActivitiesJson);
        setReadActivities(new Set(readArray));
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const res = await fetch("/api/children");
      const data = await res.json();
      console.log("Fetched children data:", data);
      
      // Store children data for parent lookup
      setChildren(data);
      
      // Get unique parent emails from all children
      const uniqueParents = Array.from(
        new Map(
          data
            .filter((child: any) => child.parentEmail)
            .map((child: any) => [
              child.parentEmail,
              { email: child.parentEmail, name: child.parentName || 'Parent' }
            ])
        ).values()
      );
      
      console.log("Extracted parent emails:", uniqueParents);
      setAllParents(uniqueParents);
      
      if (uniqueParents.length === 0) {
        console.warn("No parent emails found in children data");
      }
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const getParentInfo = (activity: any) => {
    // Check if this is an activity sent TO admin (FROM a parent)
    const sentToAdmin = activity.recipients?.some((r: string) => 
      r.toLowerCase().includes('admin') || r === 'admin@daycare.com'
    );
    
    if (!sentToAdmin) return null;
    
    // If children haven't loaded yet, return null
    if (!children || children.length === 0) {
      console.log('Children data not loaded yet');
      return null;
    }
    
    const description = activity.description || '';
    const subject = activity.subject || '';
    
    console.log('Checking activity for parent info:', { subject, description, recipients: activity.recipients, childrenCount: children.length });
    
    // Method 1: Try to extract child name from description (pattern: "Child: {name}")
    const childNameMatch = description.match(/Child:\s*([^\n]+)/i);
    if (childNameMatch && childNameMatch[1]) {
      let childName = childNameMatch[1].trim();
      const child = children.find((c: any) => 
        childName.toLowerCase() === c.fullName?.toLowerCase()
      );
      
      if (child) {
        console.log('Found parent via description:', child.parentName);
        return {
          name: child.parentName || child.fullName,
          email: child.parentEmail || 'Unknown',
          childName: child.fullName
        };
      }
    }
    
    // Method 2: Try to extract from subject (pattern: "Absence Notice: {childName} - {date}")
    const subjectMatch = subject.match(/Absence Notice:\s*([^-]+?)\s*-/i);
    if (subjectMatch && subjectMatch[1]) {
      let childName = subjectMatch[1].trim();
      const child = children.find((c: any) => 
        childName.toLowerCase() === c.fullName?.toLowerCase()
      );
      
      if (child) {
        console.log('Found parent via subject:', child.parentName);
        return {
          name: child.parentName || child.fullName,
          email: child.parentEmail || 'Unknown',
          childName: child.fullName
        };
      }
    }
    
    // Method 3: Search all children to find any mention in description or subject
    for (const child of children) {
      if (child.fullName) {
        const fullNameLower = child.fullName.toLowerCase();
        if (
          description.toLowerCase().includes(fullNameLower) ||
          subject.toLowerCase().includes(fullNameLower)
        ) {
          console.log('Found parent via search:', child.parentName);
          return {
            name: child.parentName || child.fullName,
            email: child.parentEmail || 'Unknown',
            childName: child.fullName
          };
        }
      }
    }
    
    // Method 4: If no match found but it's sent to admin, try to get any parent email if available
    if (sentToAdmin && children.length > 0) {
      // Return generic parent info as fallback
      const firstChild = children.find((c: any) => c.parentName && c.parentEmail);
      if (firstChild) {
        console.log('Using fallback parent:', firstChild.parentName);
        return {
          name: firstChild.parentName || 'Parent',
          email: firstChild.parentEmail || 'parent@example.com',
          childName: firstChild.fullName || 'N/A'
        };
      }
    }
    
    console.log('No parent info found for activity');
    return null;
  };

  useEffect(() => {
    fetchActivities();
    fetchParents();
  }, []);

  const handleInputChange = (field: keyof ActivityForm, value: string | string[] | File[]) => {
    setFormData({ ...formData, [field]: value as any });
  };

  const handleRecipientToggle = (email: string) => {
    setFormData({
      ...formData,
      recipients: formData.recipients.includes(email)
        ? formData.recipients.filter((e) => e !== email)
        : [...formData.recipients, email],
    });
  };

  const handleSelectAllRecipients = () => {
    if (formData.recipients.length === allParents.length) {
      setFormData({ ...formData, recipients: [] });
    } else {
      setFormData({ ...formData, recipients: allParents.map((p) => p.email) });
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, attachments: files });
  };

  const handleCreate = async () => {
    if (!formData.subject) {
      alert("Please fill in the subject field");
      return;
    }
    if (formData.recipients.length === 0) {
      alert("Please select at least one recipient");
      return;
    }

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("subject", formData.subject);
      submitData.append("description", formData.description);
      submitData.append("recipients", JSON.stringify(formData.recipients));

      // Append files
      formData.attachments.forEach((file) => {
        submitData.append("attachments", file);
      });

      const response = await fetch("/api/activities", {
        method: "POST",
        body: submitData,
      });

      const responseData = await response.json();

      if (response.ok) {
        alert(`Activity created successfully and sent to ${responseData.notifiedParents} parents!`);
        setShowCreateDialog(false);
        setFormData({
          recipients: [],
          subject: "",
          description: "",
          attachments: [],
        });
        fetchActivities();
      } else {
        alert(`Error: ${responseData.error || "Failed to create activity"}`);
      }
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Error creating activity");
    } finally {
      setIsLoading(false);
    }
  };

  const openViewDialog = (activity: any) => {
    setViewingActivity(activity);
    // Mark as read when viewing
    setReadActivities(prev => {
      const newSet = new Set(prev).add(activity.id);
      // Save to localStorage
      localStorage.setItem('readActivities', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
    setShowViewDialog(true);
  };

  const markAsRead = (activityId: number) => {
    setReadActivities(prev => {
      const newSet = new Set(prev).add(activityId);
      // Save to localStorage
      localStorage.setItem('readActivities', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const isActivityUnread = (activityId: number) => {
    return !readActivities.has(activityId);
  };

  const needsAttention = (activity: any) => {
    if (!activity) return false;
    const subject = activity.subject?.toLowerCase() || '';
    return subject.includes('absence notice') || 
           subject.includes('sick report') ||
           (activity.description?.toLowerCase() || '').includes('⛔ absent');
  };

  const isReceivedActivity = (activity: any) => {
    // Check if sent to admin (from a parent)
    return activity.recipients?.some((r: string) => 
      r.toLowerCase().includes('admin') || r === 'admin@daycare.com'
    );
  };

  const receivedActivities = activities.filter(isReceivedActivity);
  const sentActivities = activities.filter(a => !isReceivedActivity(a));

  const openEditDialog = (activity: any) => {
    setEditingActivity(activity);
    setFormData({
      recipients: activity.recipients || [],
      subject: activity.subject,
      description: activity.description || "",
      attachments: [],
    });
    setShowEditDialog(true);
  };

  const handleEdit = async () => {
    if (!editingActivity) return;

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("subject", formData.subject);
      submitData.append("description", formData.description);
      submitData.append("recipients", JSON.stringify(formData.recipients));

      // Append new files
      formData.attachments.forEach((file) => {
        submitData.append("attachments", file);
      });

      const response = await fetch(`/api/activities/${editingActivity.id}`, {
        method: "PUT",
        body: submitData,
      });

      if (response.ok) {
        alert("Activity updated successfully!");
        setShowEditDialog(false);
        setEditingActivity(null);
        fetchActivities();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to update activity"}`);
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      alert("Error updating activity");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Activity deleted successfully!");
        fetchActivities();
      } else {
        alert("Error deleting activity");
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert("Error deleting activity");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Activities & Messages</h1>
          <p className="text-slate-600">
            {activeTab === 'received' 
              ? 'View activities received from parents' 
              : 'View and send activities to parents'}
          </p>
        </div>
        {activeTab === 'sent' && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activities</CardTitle>
              <CardDescription>
                Manage sent and received activities and announcements
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {receivedActivities.filter(a => isActivityUnread(a.id)).length > 0 && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  {receivedActivities.filter(a => isActivityUnread(a.id)).length} New
                </Badge>
              )}
              {receivedActivities.filter(a => needsAttention(a)).length > 0 && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {receivedActivities.filter(a => needsAttention(a)).length}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('received')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'received'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📨 Received ({receivedActivities.length})
              {receivedActivities.filter(a => isActivityUnread(a.id)).length > 0 && (
                <Badge className="ml-2 bg-red-600">{receivedActivities.filter(a => isActivityUnread(a.id)).length}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'sent'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ✉️ Sent ({sentActivities.length})
            </button>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : activeTab === 'received' && receivedActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No received activities yet
            </div>
          ) : activeTab === 'sent' && sentActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No sent activities yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Attachments</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(activeTab === 'received' ? receivedActivities : sentActivities).map((activity, idx) => (
                  <TableRow
                    key={activity.id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-blue-50 transition-colors ${
                      isActivityUnread(activity.id) ? 'border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {isActivityUnread(activity.id) && (
                          <Badge variant="outline" className="w-fit text-xs bg-blue-100 text-blue-800 border-blue-300">
                            NEW
                          </Badge>
                        )}
                        {needsAttention(activity) && (
                          <Badge className="w-fit flex items-center gap-1 text-xs bg-blue-100 text-blue-800 border-blue-300">
                            <AlertTriangle className="h-3 w-3" />
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const parentInfo = getParentInfo(activity);
                        const isSentToAdmin = activity.recipients?.some((r: string) => 
                          r.toLowerCase().includes('admin') || r === 'admin@daycare.com'
                        );
                        
                        if (parentInfo) {
                          return (
                            <div className="text-sm">
                              <div className="font-medium text-green-700">👤 {parentInfo.name}</div>
                              <div className="text-xs text-slate-500">{parentInfo.email}</div>
                              <div className="text-xs text-blue-600">👶 {parentInfo.childName}</div>
                            </div>
                          );
                        }
                        
                        // If sent to admin but no parent info found, try to show as "Parent"
                        if (isSentToAdmin) {
                          return (
                            <div className="text-sm text-orange-700">
                              👤 Parent (Identifying...)
                            </div>
                          );
                        }
                        
                        return (
                          <div className="text-sm text-slate-500">
                            👨‍💼 Admin
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {activity.recipients?.some((r: string) => 
                          r.toLowerCase().includes('admin') || r === 'admin@daycare.com'
                        ) ? (
                          <div className="text-blue-600 font-medium">👨‍💼 Admin</div>
                        ) : (
                          <>
                            {activity.recipients?.length || 0} parent(s)
                            {activity.recipients?.slice(0, 2).map((r: string, idx: number) => (
                              <div key={idx} className="text-xs text-slate-500 truncate max-w-xs">
                                📧 {r}
                              </div>
                            ))}
                            {activity.recipients && activity.recipients.length > 2 && (
                              <div className="text-xs text-slate-500">
                                +{activity.recipients.length - 2} more
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {activity.subject}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 truncate max-w-xs">
                        {activity.description || "No description"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {activity.attachments?.length || 0} file(s)
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isActivityUnread(activity.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(activity.id)}
                            title="Mark as Read"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark as Read
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(activity)}
                          title="View Details"
                        >
                          View
                        </Button>
                        {activeTab === 'sent' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(activity)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(activity.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {activeTab === 'sent' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Sent Activities</h3>
              <p className="text-sm text-blue-700">
                Activities you have sent to parents will appear here. Click "Compose" to send a new announcement or message.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create Activity Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compose Activity</DialogTitle>
            <DialogDescription>
              Create an activity that will be sent to selected parent emails
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>To *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllRecipients}
                  className="text-xs"
                >
                  {formData.recipients.length === allParents.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                {allParents.length === 0 ? (
                  <div className="text-sm text-slate-500 space-y-2">
                    <p>No parent emails available</p>
                    <p className="text-xs text-orange-600">
                      💡 Make sure you have registered children with parent email addresses in the Children page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allParents.map((parent) => (
                      <div key={parent.email} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`recipient-${parent.email}`}
                          checked={formData.recipients.includes(parent.email)}
                          onChange={() => handleRecipientToggle(parent.email)}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`recipient-${parent.email}`}
                          className="text-sm cursor-pointer"
                        >
                          {parent.name} ({parent.email})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.recipients.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {formData.recipients.length} recipient(s) selected
                </p>
              )}
            </div>

            {/* Subject */}
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Enter activity subject"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the activity..."
                rows={5}
              />
            </div>

            {/* Attachments */}
            <div>
              <Label htmlFor="attachments">Attachments (Images or PDFs)</Label>
              <Input
                id="attachments"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleAttachmentChange}
                className="cursor-pointer"
              />
              {formData.attachments.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1">
                    {formData.attachments.length} file(s) selected:
                  </p>
                  <div className="space-y-1">
                    {Array.from(formData.attachments).map((file, idx) => (
                      <div key={idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update the activity information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>To *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllRecipients}
                  className="text-xs"
                >
                  {formData.recipients.length === allParents.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                {allParents.length === 0 ? (
                  <div className="text-sm text-slate-500 space-y-2">
                    <p>No parent emails available</p>
                    <p className="text-xs text-orange-600">
                      💡 Make sure you have registered children with parent email addresses.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allParents.map((parent) => (
                      <div key={parent.email} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-recipient-${parent.email}`}
                          checked={formData.recipients.includes(parent.email)}
                          onChange={() => handleRecipientToggle(parent.email)}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`edit-recipient-${parent.email}`}
                          className="text-sm cursor-pointer"
                        >
                          {parent.name} ({parent.email})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {formData.recipients.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  {formData.recipients.length} recipient(s) selected
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-subject">Subject *</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Enter activity subject"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the activity..."
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="edit-attachments">Add More Attachments (Images or PDFs)</Label>
              <Input
                id="edit-attachments"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleAttachmentChange}
                className="cursor-pointer"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Activity Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingActivity?.subject}
              {needsAttention(viewingActivity) && (
                <Badge className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-300">
                  <AlertTriangle className="h-3 w-3" />
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Full activity details
            </DialogDescription>
          </DialogHeader>
          
          {viewingActivity && (
            <div className="space-y-4">
              {/* Sender Information */}
              {(() => {
                const parentInfo = getParentInfo(viewingActivity);
                if (parentInfo) {
                  return (
                    <div>
                      <Label className="font-semibold">From (Parent)</Label>
                      <div className="mt-2 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-semibold">Name:</span> {parentInfo.name}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Email:</span> {parentInfo.email}
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Child:</span> {parentInfo.childName}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div>
                    <Label className="font-semibold">From</Label>
                    <div className="mt-2 p-3 bg-slate-50 rounded-md">
                      <div className="text-sm text-slate-500">Admin</div>
                    </div>
                  </div>
                );
              })()}

              {/* Recipients */}
              <div>
                <Label className="font-semibold">Recipients</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-md">
                  <div className="space-y-1">
                    {viewingActivity.recipients?.map((recipient: string, idx: number) => (
                      <div key={idx} className="text-sm">
                        📧 {recipient}
                      </div>
                    ))}
                    {(!viewingActivity.recipients || viewingActivity.recipients.length === 0) && (
                      <p className="text-slate-500">No recipients</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="font-semibold">Description</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-md min-h-[100px]">
                  <p className="text-sm whitespace-pre-wrap">
                    {viewingActivity.description || "No description provided"}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {viewingActivity.attachments && viewingActivity.attachments.length > 0 && (
                <div>
                  <Label className="font-semibold">Attachments ({viewingActivity.attachments.length})</Label>
                  <div className="mt-2 space-y-2">
                    {viewingActivity.attachments.map((attachment: string, idx: number) => (
                      <a
                        key={idx}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <span className="text-lg">📎</span>
                        <span className="text-sm text-blue-600 hover:underline">
                          {attachment.split('/').pop()}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <Label className="font-semibold">Date</Label>
                <div className="mt-2 p-3 bg-slate-50 rounded-md">
                  <p className="text-sm">
                    {new Date(viewingActivity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowViewDialog(false);
                if (viewingActivity) {
                  setReadActivities(prev => {
                    const newSet = new Set(prev).add(viewingActivity.id);
                    localStorage.setItem('readActivities', JSON.stringify(Array.from(newSet)));
                    return newSet;
                  });
                }
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
