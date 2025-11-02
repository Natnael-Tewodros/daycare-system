"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Paperclip, Send, Users, Clock, X, Plus,
  Check, ChevronsUpDown, Edit, Trash2
} from "lucide-react";
import { format } from "date-fns";

interface Parent { email: string; name: string }
interface Activity {
  id: number;
  subject: string;
  description?: string;
  recipients: string[];
  attachments: string[];
  createdAt: string;
  senderType?: 'admin' | 'parent';
}

export default function AdminActivityPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Parent[]>([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sent, setSent] = useState<Activity[]>([]);
  // Received messages are handled via the notifications dropdown in the layout
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"sent">("sent");
  const [open, setOpen] = useState(false);
  // Badge count is handled in the dashboard layout

  useEffect(() => { fetchParents(); }, []);
  useEffect(() => { if (tab === "sent") fetchSent(); }, [tab]);

  const fetchParents = async () => {
    const res = await fetch("/api/parents");
    if (res.ok) setParents(await res.json());
  };

  const fetchSent = async () => {
    try {
      const res = await fetch("/api/activities?senderType=admin");
      if (!res.ok) throw new Error("Failed to fetch sent activities");
      
      const activities = await res.json();
      
      // Filter to only include activities sent by admin (not received)
      const sentActivities = activities.filter((activity: Activity) => 
        activity.senderType === 'admin' && 
        (!activity.recipients.includes('admin@daycare.com') || 
         activity.recipients.length > 1)
      );
      
      setSent(sentActivities);
    } catch (error) {
      console.error("Error fetching sent activities:", error);
      toast.error("Failed to load sent activities");
    }
  };

  // Received activities are not shown here; they are surfaced in the notifications dropdown

  const toggleSelectAll = () => {
    if (selectedRecipients.length === parents.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(parents);
    }
  };

  const toggleRecipient = (parent: Parent) => {
    setSelectedRecipients(prev =>
      prev.some(p => p.email === parent.email)
        ? prev.filter(p => p.email !== parent.email)
        : [...prev, parent]
    );
  };

  const startEdit = (act: Activity) => {
    setSubject(act.subject);
    setDescription(act.description || "");
    setSelectedRecipients(parents.filter(p => act.recipients.includes(p.email)));
    setFiles([]);
    setEditingId(act.id);
    setShowCompose(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipients.length) return toast.error("Select at least one parent");

    setLoading(true);
    const formData = new FormData();
    formData.append("subject", subject);
    formData.append("description", description);
    formData.append("recipients", JSON.stringify(selectedRecipients.map(r => r.email)));
    files.forEach(f => formData.append("attachments", f));

    const url = "/api/activities";
    const method = editingId ? "PATCH" : "POST";
    
    // If editing, add the ID to the form data
    if (editingId) {
      formData.append("id", editingId.toString());
    }

    try {
      const res = await fetch(url, { 
        method,
        body: formData,
      });
      if (res.ok) {
        toast.success(editingId ? "Updated!" : "Sent!");
        resetForm();
        fetchSent();
      } else toast.error("Failed");
    } catch {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubject(""); setDescription(""); setSelectedRecipients([]); setFiles([]);
    setEditingId(null); setShowCompose(false);
  };

  const deleteActivity = async (id: number) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch('/api/activities', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });
      
      if (res.ok) {
        toast.success("Message deleted successfully");
        fetchSent();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete message");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while deleting the message");
    }
  };

  // Mark-as-read is handled from the notifications dropdown in the layout

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* COMPOSE BUTTON */}
        <div className="flex justify-end">
          <Button
            onClick={() => { resetForm(); setShowCompose(true); }}
            size="lg"
            className="flex items-center gap-2 font-semibold shadow-md"
          >
            <Plus className="w-5 h-5" />
             Notification
          </Button>
        </div>

        {/* COMPOSE FORM */}
        {showCompose && (
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                {editingId ? "Edit Message" : "Send Update"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* SEARCHABLE RECIPIENTS + SELECT ALL */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="w-4 h-4" /> To
                  </Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-12"
                      >
                        {selectedRecipients.length > 0
                          ? `${selectedRecipients.length} selected`
                          : "Select parents..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search parents..." />
                        <CommandList>
                          <CommandEmpty>No parent found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-64">
                              {/* SELECT ALL */}
                              <CommandItem
                                onSelect={toggleSelectAll}
                                className="font-semibold"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedRecipients.length === parents.length ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                {selectedRecipients.length === parents.length ? "Deselect All" : "Select All"}
                              </CommandItem>

                              {/* PARENTS */}
                              {parents.map(parent => (
                                <CommandItem
                                  key={parent.email}
                                  onSelect={() => toggleRecipient(parent)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedRecipients.some(p => p.email === parent.email)
                                        ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <div>
                                    <p className="font-medium">{parent.name}</p>
                                    <p className="text-xs text-gray-500">{parent.email}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {/* BADGES */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedRecipients.map(p => (
                      <Badge key={p.email} variant="secondary">
                        {p.name}
                        <X
                          className="w-3 h-3 ml-1 cursor-pointer"
                          onClick={() => setSelectedRecipients(prev => prev.filter(r => r.email !== p.email))}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} required />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Attachments
                  </Label>
                  <Input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {files.map((f, i) => (
                      <Badge key={i} variant="outline">
                        {f.name.slice(0, 20)}...
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading || !selectedRecipients.length} className="flex-1">
                    {loading ? "Saving..." : editingId ? "Update" : "Send"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* SENT LIST ONLY */}
        <div className="w-full mt-6 space-y-4">
          {sent.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No messages sent yet.</p>
          ) : (
            sent.map(act => (
              <ActivityCard
                key={act.id}
                act={act}
                onEdit={() => startEdit(act)}
                onDelete={() => deleteActivity(act.id)}
                canEdit={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ACTIVITY CARD WITH EDIT/DELETE */
function ActivityCard({
  act,
  onEdit,
  onDelete,
  onMarkAsRead,
  canEdit,
  isReceived = false,
}: {
  act: Activity & { senderType?: string; createdAt: string };
  onEdit: () => void;
  onDelete: () => void;
  onMarkAsRead?: () => void;
  canEdit: boolean;
  isReceived?: boolean;
}) {
  const formattedDate = new Date(act.createdAt).toLocaleString();

  return (
    <Card className="hover:shadow transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <CardTitle className="text-lg">{act.subject}</CardTitle>
            <div className="text-sm text-gray-500 mt-1">
              {formattedDate}
              {act.senderType === 'parent' && ' • From Parent'}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isReceived && onMarkAsRead && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead();
                }} 
                className="text-green-600 hover:text-green-700"
                title="Mark as Read"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            {canEdit && (
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }} 
                className="text-blue-600 hover:text-blue-700"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }} 
              className="text-red-600 hover:text-red-700"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        {/* Message Content */}
        {act.description && (
          <div className="mt-2 text-gray-700 whitespace-pre-line">
            {act.description.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
            ))}
          </div>
        )}
        
        {/* Attachments */}
        {act.attachments && act.attachments.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Attachments:</div>
            <div className="flex flex-wrap gap-2">
              {act.attachments.map((attachment, index) => (
                <a 
                  key={index} 
                  href={attachment} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                  {attachment.split('/').pop()}
                </a>
              ))}
            </div>
          </div>
        )}
        
        {/* Recipients (for sent messages) */}
        {canEdit && act.recipients && act.recipients.length > 0 && (
          <div className="mt-4 text-sm text-gray-500">
            <span className="font-medium">To:</span> {act.recipients.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 