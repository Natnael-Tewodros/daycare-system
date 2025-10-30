"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Key } from "lucide-react";
import type { User } from "@/app/dashboard/admin-management/types";

type PasswordModalProps = {
  open: boolean;
  users: User[];
  selectedUserId: string | null;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  newPassword: string;
  confirmPassword: string;
  setNewPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  error: string | null;
  passwordLoading: boolean;
  onClose: () => void;
  onUpdate: () => void;
};

export default function PasswordModal(props: PasswordModalProps) {
  const {
    open,
    users,
    selectedUserId,
    showPassword,
    setShowPassword,
    newPassword,
    confirmPassword,
    setNewPassword,
    setConfirmPassword,
    error,
    passwordLoading,
    onClose,
    onUpdate,
  } = props;

  if (!open) return null;

  return (
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
              Updating password for: <strong>{users.find((u) => u.id === selectedUserId)?.name}</strong>
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
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <div className="flex gap-2 pt-4">
            <Button onClick={onUpdate} disabled={passwordLoading || !newPassword || !confirmPassword} className="flex-1">
              {passwordLoading ? "Updating..." : "Update Password"}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={passwordLoading}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



