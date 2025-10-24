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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Image, Plus, Edit, Trash2, Eye } from "lucide-react";

interface ActivityForm {
  childId: string;
  title: string;
  description: string;
  activityType: string;
  date: string;
  duration: string;
  notes: string;
  images: File[];
}

interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string;
  gender: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [formData, setFormData] = useState<ActivityForm>({
    childId: "",
    title: "",
    description: "",
    activityType: "",
    date: "",
    duration: "",
    notes: "",
    images: [],
  });

  const activityTypes = [
    { value: "LEARNING", label: "Learning" },
    { value: "PLAY", label: "Play" },
    { value: "MEAL", label: "Meal" },
    { value: "NAP", label: "Nap" },
    { value: "OUTDOOR", label: "Outdoor" },
    { value: "ART", label: "Art" },
    { value: "MUSIC", label: "Music" },
    { value: "STORY", label: "Story" },
    { value: "EXERCISE", label: "Exercise" },
    { value: "OTHER", label: "Other" },
  ];

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(data);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const res = await fetch("/api/children");
      const data = await res.json();
      setChildren(data);
    } catch (error) {
      console.error("Error fetching children:", error);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchChildren();
  }, []);

  const handleInputChange = (field: keyof ActivityForm, value: string | File[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, images: files });
  };

  const handleCreate = async () => {
    if (!formData.childId || !formData.title || !formData.activityType || !formData.date) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("childId", formData.childId);
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("activityType", formData.activityType);
      submitData.append("date", formData.date);
      submitData.append("duration", formData.duration);
      submitData.append("notes", formData.notes);

      formData.images.forEach((image, index) => {
        submitData.append(`images`, image);
      });

      const response = await fetch("/api/activities", {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        alert("Activity created successfully!");
        setShowCreateDialog(false);
        setFormData({
          childId: "",
          title: "",
          description: "",
          activityType: "",
          date: "",
          duration: "",
          notes: "",
          images: [],
        });
        fetchActivities();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || "Failed to create activity"}`);
      }
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Error creating activity");
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (activity: any) => {
    setEditingActivity(activity);
    setFormData({
      childId: activity.childId.toString(),
      title: activity.title,
      description: activity.description || "",
      activityType: activity.activityType,
      date: new Date(activity.date).toISOString().split('T')[0],
      duration: activity.duration?.toString() || "",
      notes: activity.notes || "",
      images: [],
    });
    setShowEditDialog(true);
  };

  const handleEdit = async () => {
    if (!editingActivity) return;

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("activityType", formData.activityType);
      submitData.append("date", formData.date);
      submitData.append("duration", formData.duration);
      submitData.append("notes", formData.notes);

      formData.images.forEach((image, index) => {
        submitData.append(`images`, image);
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

  const getActivityTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      LEARNING: "bg-blue-100 text-blue-800",
      PLAY: "bg-green-100 text-green-800",
      MEAL: "bg-orange-100 text-orange-800",
      NAP: "bg-purple-100 text-purple-800",
      OUTDOOR: "bg-yellow-100 text-yellow-800",
      ART: "bg-pink-100 text-pink-800",
      MUSIC: "bg-indigo-100 text-indigo-800",
      STORY: "bg-teal-100 text-teal-800",
      EXERCISE: "bg-red-100 text-red-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Child Activities</h1>
          <p className="text-slate-600">Manage and record daily activities for children</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activities List</CardTitle>
          <CardDescription>
            View and manage all recorded activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No activities recorded yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity, idx) => (
                  <TableRow
                    key={activity.id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <TableCell className="font-medium">
                      {activity.child?.fullName || "Unknown Child"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        {activity.description && (
                          <div className="text-sm text-slate-600 truncate max-w-xs">
                            {activity.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActivityTypeColor(activity.activityType)}>
                        {activityTypes.find(t => t.value === activity.activityType)?.label || activity.activityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(activity.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {activity.duration ? `${activity.duration} min` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(activity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(activity.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Activity Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>
              Record a new activity for a child
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="childId">Child *</Label>
                <Select
                  value={formData.childId}
                  onValueChange={(value) => handleInputChange("childId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id.toString()}>
                        {child.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="activityType">Activity Type *</Label>
                <Select
                  value={formData.activityType}
                  onValueChange={(value) => handleInputChange("activityType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter activity title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the activity..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the activity..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="images">Activity Photos</Label>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="text-sm text-slate-500 mt-1">
                You can select multiple images
              </p>
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
              {isLoading ? "Creating..." : "Create Activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Activity Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update the activity information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-activityType">Activity Type *</Label>
                <Select
                  value={formData.activityType}
                  onValueChange={(value) => handleInputChange("activityType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-title">Activity Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter activity title"
              />
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the activity..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="e.g., 30"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes about the activity..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="edit-images">Add More Photos</Label>
              <Input
                id="edit-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
              />
              <p className="text-sm text-slate-500 mt-1">
                You can select multiple images to add
              </p>
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
    </div>
  );
}
