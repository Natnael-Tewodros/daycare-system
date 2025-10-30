"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Key, Trash2, UserCheck, Shield, Users } from "lucide-react";
import type { User } from "@/app/dashboard/admin-management/types";

type UsersGridProps = {
  users: User[];
  getRoleBadgeColor: (role: string) => string;
  getRoleIcon: (role: string) => JSX.Element;
  updateUserRole: (userId: string, role: 'ADMIN' | 'PARENT') => void;
  openPasswordModal: (userId: string) => void;
  deleteUser: (userId: string) => void;
};

export default function UsersGrid({ users, getRoleBadgeColor, getRoleIcon, updateUserRole, openPasswordModal, deleteUser }: UsersGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <UserCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{user.id}</p>
                  </div>
                </div>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1">{user.role}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>

                {user.username && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Username</p>
                    <p className="text-sm">@{user.username}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-600">Role</p>
                  <Select
                    value={user.role}
                    onValueChange={(newRole: 'ADMIN' | 'PARENT') => updateUserRole(user.id, newRole)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="PARENT">Parent</SelectItem>
                      </SelectContent>
                    </SelectTrigger>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPasswordModal(user.id)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Update Password
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteUser(user.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">No users have been created yet.</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'ADMIN').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Parents</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'PARENT').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}



