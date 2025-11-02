"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const [user, setUser] = useState<any | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const onUploadImage = async (file: File) => {
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include' as RequestCredentials,
        headers: {
          ...(userId ? { 'x-user-id': userId } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUser((prev: any) => prev ? { ...prev, profileImage: data.profileImage } : prev);
        setMessage('Profile image updated');
      } else {
        setMessage(data?.error || 'Failed to upload image');
      }
    } catch (_) {
      setMessage('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const profileImageUrl = user?.profileImage ? `/uploads/${user.profileImage}` : "/placeholder-avatar.svg";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {message && <div className="text-sm text-muted-foreground">{message}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 relative rounded-full overflow-hidden border">
              <Image src={profileImageUrl} alt="Avatar" fill sizes="128px" className="object-cover" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUploadImage(f);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Upload Photo'}
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={user?.name || ''} readOnly placeholder="Name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ''} readOnly placeholder="Email" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


