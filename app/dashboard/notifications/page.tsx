"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Bell } from "lucide-react";
import { toast } from "sonner";

type Activity = {
  id: number;
  subject: string;
  description?: string | null;
  attachments: string[];
  createdAt: string;
};

export default function NotificationsPage() {
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"unread" | "all">("unread");
  const [messages, setMessages] = useState<Activity[]>([]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        senderType: "parent",
        recipientEmail: "admin@daycare.com",
      });

      if (filter === "unread") params.set("isRead", "false");

      const res = await fetch(`/api/activities?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      toast.error((err as Error).message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const markAsRead = async (activityId: number) => {
    try {
      // Optimistic remove for unread filter
      if (filter === "unread") {
        setMessages(prev => prev.filter(m => m.id !== activityId));
      }

      const res = await fetch(`/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });

      if (!res.ok) {
        // revert if failed
        await fetchMessages();
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          throw new Error(j.error || j.message || "Failed to mark as read");
        } catch {
          throw new Error(text || "Failed to mark as read");
        }
      }

      // Record locally so layout's unread calculation respects this immediately
      try {
        const readJson = localStorage.getItem("readActivities") || '[]';
        const current = new Set<number>(JSON.parse(readJson));
        current.add(activityId);
        localStorage.setItem("readActivities", JSON.stringify(Array.from(current)));
      } catch {}

      toast.success("Marked as read");
      // Notify layout to refresh the unread badge immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications:updated'));
      }
      if (filter === "all") {
        // Refresh to reflect badge/state changes
        await fetchMessages();
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to mark as read");
    }
  };

  const deleteMessage = async (activityId: number) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch('/api/activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activityId })
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const j = JSON.parse(text);
          throw new Error(j.error || j.message || 'Failed to delete message');
        } catch {
          throw new Error(text || 'Failed to delete message');
        }
      }

      setMessages(prev => prev.filter(m => m.id !== activityId));
      toast.success('Message deleted');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete message');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
              disabled={loading}
            >
              Unread
            </Button>
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              disabled={loading}
            >
              All
            </Button>
          </div>
        </div>

        <Separator />

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No notifications.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <Card key={m.id} className="hover:shadow transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{m.subject}</CardTitle>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(m.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {filter === "unread" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(m.id)}
                          title="Mark as read"
                          className="text-green-700 border-green-200 hover:bg-green-50"
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteMessage(m.id)}
                        title="Delete message"
                        className="text-red-700 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {m.description && (
                  <CardContent className="pt-0 pb-4">
                    <div className="mt-2 text-gray-700 whitespace-pre-line">
                      {m.description}
                    </div>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        <Badge variant="secondary">{m.attachments.length} attachment(s)</Badge>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


