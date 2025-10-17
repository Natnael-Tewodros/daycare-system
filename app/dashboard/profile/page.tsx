"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const [user, setUser] = useState<any | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const fetchProfile = async () => {
    setMessage("");
    const res = await fetch('/api/users/me', { credentials: 'include' as RequestCredentials });
    const data = await res.json();
    if (res.ok) {
      setUser(data);
    } else {
      setMessage(data.error || 'Failed to load profile');
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const saveProfile = async () => {
    setMessage("");
    // Client-side validation: require current password when changing password
    if (newPassword && !currentPassword) {
      setMessage('Please enter your current password to set a new password');
      return;
    }

    const payload: any = {
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    };

    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' as RequestCredentials,
      body: JSON.stringify(payload),
    });
    let data: any = null;
    const contentType = res.headers.get('content-type') || '';
    try {
      data = contentType.includes('application/json') ? await res.json() : await res.text();
    } catch (_) {}
    if (res.ok) {
      const changedPassword = Boolean(newPassword);
      setMessage(changedPassword ? 'Password updated successfully' : 'Profile updated');
      setCurrentPassword("");
      setNewPassword("");
      if (typeof data === 'object') {
        setUser(data);
      }
    } else {
      const errorMsg = typeof data === 'string' ? data : (data?.error || 'Update failed');
      setMessage(errorMsg);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Username field removed per requirement: only password changes allowed */}
          <div>
            <Label>Current Password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
          </div>
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={saveProfile}>Save Changes</Button>
            {message && <span className="ml-3 text-sm text-muted-foreground">{message}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


