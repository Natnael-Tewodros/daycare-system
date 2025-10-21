"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Baby, 
  Users, 
  UserPlus,
  UserMinus,
  Phone,
  Mail,
  Home,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Building2,
  UserCheck,
  Sparkles
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Function to calculate age in months
const calculateAgeInMonths = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  return (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
};

export default function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [allChildren, setAllChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningChild, setAssigningChild] = useState<number | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>("");

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/rooms");
      setRooms(res.data);
      setError(null);
    } catch (e: any) {
      console.error('Fetch rooms error:', e);
      setError(e?.response?.data?.error || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllChildren = async () => {
    try {
      const res = await axios.get("/api/children");
      setAllChildren(res.data);
    } catch (e: any) {
      console.error('Fetch children error:', e);
    }
  };

  const assignChildToRoom = async (roomId: number, childId: string) => {
    try {
      const res = await axios.put(`/api/children/${childId}/assign-room`, {
        roomId: roomId
      });
      
      if (res.data.success) {
        await fetchRooms();
        await fetchAllChildren();
        setAssigningChild(null);
        setSelectedChild("");
        alert('Child assigned to room successfully!');
      }
    } catch (e: any) {
      console.error('Assign child error:', e);
      alert(e?.response?.data?.error || 'Failed to assign child to room');
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchAllChildren();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Daycare Rooms
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Currently registered children and room management</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Live Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Real-time Updates</span>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Baby className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Children</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rooms.reduce((sum, room: any) => sum + (room.children?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Caregivers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rooms.reduce((sum, room: any) => sum + (room.servants?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">Loading room data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-700 font-medium text-lg mb-2">Error Loading Rooms</p>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchRooms} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rooms.map((room: any) => (
              <Card key={room.id} className="group bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg shadow-sm">
                        <Home className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-800">{room.name}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs font-medium">
                        <Baby className="h-3 w-3 mr-1" />
                        {room.children?.length || 0}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                        <Users className="h-3 w-3 mr-1" />
                        {room.servants?.length || 0}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Caregivers Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-purple-100 rounded-md">
                            <UserCheck className="h-4 w-4 text-purple-600" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Caregivers</p>
                        </div>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          {room.servants?.length || 0}
                        </Badge>
                      </div>
                      {room.servants && room.servants.length > 0 ? (
                        <div className="space-y-2">
                          {room.servants.slice(0, 2).map((caregiver: any) => (
                            <div key={caregiver.id} className="flex items-center gap-3 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                              <div className="p-1 bg-white rounded-full shadow-sm">
                                <Users className="h-3 w-3 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-800">{caregiver.fullName}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {caregiver.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate max-w-20">{caregiver.email}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {room.servants.length > 2 && (
                            <p className="text-xs text-gray-500 text-center py-1 bg-gray-50 rounded-md">
                              +{room.servants.length - 2} more caregivers
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3 bg-gray-50 rounded-lg border border-gray-200">
                          <UserCheck className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-500">No caregivers assigned</p>
                        </div>
                      )}
                    </div>

                    {/* Children Section - Main Focus */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-green-100 rounded-md">
                            <Baby className="h-4 w-4 text-green-600" />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Currently Registered</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAssigningChild(room.id)}
                          className="h-7 px-3 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300 transition-colors"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Child
                        </Button>
                      </div>
                      
                      {room.children && room.children.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {room.children.map((child: any) => {
                            const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                            return (
                              <div key={child.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100 hover:shadow-sm transition-shadow">
                                <div className="p-1 bg-white rounded-full shadow-sm">
                                  <Baby className="h-3 w-3 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-gray-800">{child.fullName}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{Math.floor(ageInMonths / 12)}y {ageInMonths % 12}m</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                      {child.organization?.name || 'Unknown Org'}
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                      Active
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                          <Baby className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 font-medium">No children registered</p>
                          <p className="text-xs text-gray-400 mt-1">Click "Add Child" to assign children</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Child Assignment Modal */}
        {assigningChild && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg shadow-sm">
                    <Baby className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-gray-800">Assign Child to Room</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label htmlFor="child-select" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    Select Child
                  </Label>
                  <Select value={selectedChild} onValueChange={setSelectedChild}>
                    <SelectTrigger className="h-12 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl">
                      <SelectValue placeholder="Choose a child to assign" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-0 shadow-lg">
                      {allChildren
                        .filter((child: any) => !child.roomId)
                        .map((child: any) => {
                          const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                          return (
                            <SelectItem key={child.id} value={child.id.toString()} className="rounded-lg">
                              <div className="flex items-center gap-3 py-2">
                                <div className="p-1 bg-green-100 rounded-full">
                                  <Baby className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800">{child.fullName}</span>
                                  <span className="text-xs text-gray-500">
                                    {Math.floor(ageInMonths / 12)}y {ageInMonths % 12}m • {child.parentName}
                                  </span>
                                  <span className="text-xs text-blue-600 font-medium">
                                    {child.organization?.name || 'Unknown Org'}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      if (selectedChild) {
                        assignChildToRoom(assigningChild, selectedChild);
                      }
                    }}
                    disabled={!selectedChild}
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Assign Child
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAssigningChild(null);
                      setSelectedChild("");
                    }}
                    className="h-12 px-6 border-gray-200 hover:border-gray-300 rounded-xl font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
