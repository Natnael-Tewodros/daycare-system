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
  Paperclip, Send, Users, Clock, X, Inbox, Plus,
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
  const [received, setReceived] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"sent" | "received">("sent");
  const [open, setOpen] = useState(false);

  useEffect(() => { fetchParents(); }, []);
  useEffect(() => { if (tab === "sent") fetchSent(); if (tab === "received") fetchReceived(); }, [tab]);

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

  const fetchReceived = async () => {
    try {
      // Only fetch activities that are from parents
      const res = await fetch("/api/activities?senderType=parent");
      if (!res.ok) throw new Error("Failed to fetch received activities");
      
      const activities = await res.json();
      
      // Filter to only include activities where admin is a recipient
      const adminActivities = activities.filter((activity: Activity) => 
        activity.recipients.some((recipient: string) => 
          recipient.toLowerCase().includes('admin') || 
          recipient === 'admin@daycare.com'
        )
      );

      setReceived(adminActivities);
    } catch (error) {
      console.error("Error fetching received activities:", error);
      toast.error("Failed to load received activities");
    }
  };

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

    const url = editingId ? `/api/activities/${editingId}` : "/api/activities";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: formData });
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
        tab === "sent" ? fetchSent() : fetchReceived();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete message");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An error occurred while deleting the message");
    }
  };

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
             New Message
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

        {/* TABS */}
        <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-1">
              <Inbox className="w-4 h-4" /> Received
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sent" className="space-y-4 mt-6">
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
          </TabsContent>

          <TabsContent value="received" className="space-y-4 mt-6">
            {received.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No messages received.</p>
            ) : (
              received.map(act => (
                <ActivityCard
                  key={act.id}
                  act={act}
                  onEdit={() => startEdit(act)}
                  onDelete={() => deleteActivity(act.id)}
                  canEdit={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ACTIVITY CARD WITH EDIT/DELETE */
function ActivityCard({
  act,
  onEdit,
  onDelete,
  canEdit,
}: {
  act: Activity & { senderType?: string; createdAt: string };
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
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
            {canEdit && (
              <Button size="sm" variant="ghost" onClick={onEdit} className="text-blue-600">
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-600">
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