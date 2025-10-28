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
  Sparkles,
  ArrowRight,
  UserPlus2,
  Heart,
  Star,
  Gamepad2,
  Flower2,
  Rainbow
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Function to get room icon based on room name
const getRoomIcon = (roomName: string) => {
  const name = roomName.toLowerCase();
  if (name.includes('infants') || name.includes('room 1')) {
    return <Baby className="h-8 w-8 text-white" />;
  } else if (name.includes('toddlers') || name.includes('room 2')) {
    return <Flower2 className="h-8 w-8 text-white" />;
  } else if (name.includes('growing stars') || name.includes('room 3')) {
    return <Rainbow className="h-8 w-8 text-white" />;
  }
  return <Baby className="h-8 w-8 text-white" />;
};

// Function to get room icon gradient colors
const getRoomIconColors = (roomName: string) => {
  const name = roomName.toLowerCase();
  if (name.includes('infants') || name.includes('room 1')) {
    return 'from-pink-500 to-rose-500';
  } else if (name.includes('toddlers') || name.includes('room 2')) {
    return 'from-blue-500 to-cyan-500';
  } else if (name.includes('growing stars') || name.includes('room 3')) {
    return 'from-purple-500 to-violet-500';
  }
  return 'from-blue-500 to-indigo-500';
};

// Function to calculate age in months
const calculateAgeInMonths = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  
  // More accurate age calculation that considers the day
  let ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
  
  // If the current day is before the birth day, subtract one month
  if (now.getDate() < birthDate.getDate()) {
    ageInMonths--;
  }
  
  console.log(`Age calculation: birthDate=${birthDate.toISOString()}, now=${now.toISOString()}, ageInMonths=${ageInMonths}`);
  return ageInMonths;
};

// Function to categorize children by age groups
const categorizeChildrenByAge = (children: any[]) => {
  console.log('Categorizing children:', children);
  // Deduplicate children by id to avoid duplicates across views
  const uniqueChildrenMap = new Map(children.map((c: any) => [c.id, c]));
  const uniqueChildren = Array.from(uniqueChildrenMap.values());
  
  const infants = uniqueChildren.filter(child => {
    const age = calculateAgeInMonths(child.dateOfBirth);
    const isInfant = age >= 3 && age <= 12; // 3-12 months
    console.log(`Child ${child.fullName}: age=${age} months, isInfant=${isInfant}, dateOfBirth=${child.dateOfBirth}`);
    return isInfant;
  });
  
  const toddlers = uniqueChildren.filter(child => {
    const age = calculateAgeInMonths(child.dateOfBirth);
    const isToddler = age >= 13 && age <= 24; // 13-24 months (1-2 years)
    console.log(`Child ${child.fullName}: age=${age} months, isToddler=${isToddler}, dateOfBirth=${child.dateOfBirth}`);
    return isToddler;
  });
  
  const growingStars = uniqueChildren.filter(child => {
    const age = calculateAgeInMonths(child.dateOfBirth);
    const isGrowingStar = age >= 25 && age <= 48; // 25-48 months (2-4 years)
    console.log(`Child ${child.fullName}: age=${age} months, isGrowingStar=${isGrowingStar}, dateOfBirth=${child.dateOfBirth}`);
    return isGrowingStar;
  });
  
  console.log('Categorization results:', { infants: infants.length, toddlers: toddlers.length, growingStars: growingStars.length });
  
  return { infant: infants, toddler: toddlers, growingStar: growingStars };
};

export default function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [allChildren, setAllChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningChild, setAssigningChild] = useState<number | null>(null);
  const [selectedChild, setSelectedChild] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [caregiverChildren, setCaregiverChildren] = useState<{[key: number]: any[]}>({});
  const [showAssignChildDialog, setShowAssignChildDialog] = useState(false);
  const [assignChildData, setAssignChildData] = useState({
    childId: '',
    caregiverId: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/rooms");
      // Deduplicate by name then sort
      const uniqueByName = Array.from(new Map(res.data.map((r: any) => [r.name, r])).values());
      const sortedRooms = uniqueByName.sort((a: any, b: any) => a.name.localeCompare(b.name));
      setRooms(sortedRooms);
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
      console.log('Fetched children:', res.data);
      // Deduplicate by child id at source
      const unique = Array.from(new Map(res.data.map((c: any) => [c.id, c])).values());
      setAllChildren(unique);
      
      // Organize children by caregiver ID
      const childrenByCaregiver: {[key: number]: any[]} = {};
      unique.forEach((child: any) => {
        if (child.servant && child.servant.id) {
          if (!childrenByCaregiver[child.servant.id]) {
            childrenByCaregiver[child.servant.id] = [];
          }
          childrenByCaregiver[child.servant.id].push(child);
        }
      });
      setCaregiverChildren(childrenByCaregiver);
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

  const assignChildToCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignChildData.childId || !assignChildData.caregiverId) {
      alert('Please select both child and caregiver');
      return;
    }

    try {
      setIsAssigning(true);
      const formData = new FormData();
      formData.append('assignedServantId', assignChildData.caregiverId);
      formData.append('childIds', JSON.stringify([parseInt(assignChildData.childId)]));
      
      const response = await fetch('/api/children/assign-caregiver', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowAssignChildDialog(false);
        setAssignChildData({ childId: '', caregiverId: '' });
        fetchAllChildren(); // Refresh children data
        alert('Child assigned to caregiver successfully!');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Failed to assign child'}`);
      }
    } catch (error) {
      console.error('Error assigning child to caregiver:', error);
      alert('Error assigning child to caregiver');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRoomClick = (room: any) => {
    setSelectedRoom(room);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Baby className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Children</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rooms.reduce((sum, room: any) => sum + (room.children?.length || 0), 0)}
                </p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {rooms.reduce((sum, room: any) => sum + (room.assignedChildren?.length || 0), 0)} Assigned
                  </span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {rooms.reduce((sum, room: any) => 
                      sum + (room.servants?.reduce((servantSum: number, servant: any) => 
                        servantSum + (caregiverChildren[servant.id]?.length || 0), 0) || 0), 0
                    )} to Caregivers
                  </span>
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {rooms.reduce((sum, room: any) => sum + (room.unassignedChildren?.length || 0), 0)} Available
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {rooms.map((room: any) => (
              <Card 
                key={room.id} 
                onClick={() => handleRoomClick(room)}
                className="group bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl overflow-hidden cursor-pointer min-h-[280px] flex flex-col"
              >
                <CardHeader className="pb-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-100">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className={`p-4 bg-gradient-to-r ${getRoomIconColors(room.name)} rounded-2xl shadow-lg`}>
                        {getRoomIcon(room.name)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-2xl font-bold text-gray-800">
                        {room.name}
                      </CardTitle>
                      <p className="text-lg text-gray-600 font-medium">
                        {room.ageRange}
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium px-3 py-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {room.assignedChildren?.length || 0} Assigned
                      </Badge>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-sm font-medium px-3 py-1">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {room.unassignedChildren?.length || 0} Available
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  <div className="text-center space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Users className="h-5 w-5" />
                        <span className="text-sm font-medium">{room.servants?.length || 0} Caregivers</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Baby className="h-5 w-5" />
                        <span className="text-sm font-medium">{room.children?.length || 0} Children</span>
                      </div>
                      {room.servants && room.servants.length > 0 && (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <UserCheck className="h-4 w-4" />
                          <span className="text-xs font-medium">
                            {room.servants.reduce((sum: number, servant: any) => 
                              sum + (caregiverChildren[servant.id]?.length || 0), 0
                            )} Assigned to Caregivers
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-2 text-blue-600 group-hover:text-blue-700 transition-colors">
                        <span className="text-sm font-semibold">Click to view details</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
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

        {/* Room Detail Modal */}
        {selectedRoom && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-r ${getRoomIconColors(selectedRoom.name)} rounded-xl shadow-sm`}>
                      {getRoomIcon(selectedRoom.name)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-800">
                        {selectedRoom.name}
                      </CardTitle>
                      <p className="text-lg text-gray-600 font-medium mt-1">
                        {selectedRoom.ageRange}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedRoom(null)}
                    className="h-10 px-4 border-gray-200 hover:border-gray-300 rounded-xl font-semibold"
                  >
                    ✕ Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Assigned Children</p>
                        <p className="text-2xl font-bold text-blue-800">{selectedRoom.assignedChildren?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Available Children</p>
                        <p className="text-2xl font-bold text-orange-800">{selectedRoom.unassignedChildren?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Caregivers</p>
                        <p className="text-2xl font-bold text-purple-800">{selectedRoom.servants?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Caregivers Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserCheck className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Caregivers</h3>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {selectedRoom.servants?.length || 0}
                      </Badge>
                    </div>
                    <Dialog open={showAssignChildDialog} onOpenChange={setShowAssignChildDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAssignChildData({ childId: '', caregiverId: '' })}
                        >
                          <UserPlus2 className="h-4 w-4 mr-2" />
                          Assign Child
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                  {selectedRoom.servants && selectedRoom.servants.length > 0 ? (
                    <div className="space-y-4">
                      {selectedRoom.servants.map((caregiver: any) => {
                        const assignedChildren = caregiverChildren[caregiver.id] || [];
                        return (
                          <div key={caregiver.id} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100 overflow-hidden">
                            {/* Caregiver Header */}
                            <div className="flex items-center gap-4 p-4">
                              <div className="p-2 bg-white rounded-full shadow-sm">
                                <Users className="h-5 w-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-lg text-gray-800">{caregiver.fullName}</p>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {assignedChildren.length} children
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                  {caregiver.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-4 w-4" />
                                      <span>{caregiver.email}</span>
                                    </div>
                                  )}
                                  {caregiver.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-4 w-4" />
                                      <span>{caregiver.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Assigned Children */}
                            {assignedChildren.length > 0 && (
                              <div className="px-4 pb-4">
                                <div className="border-t border-purple-200 pt-3">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <Baby className="h-4 w-4" />
                                    Assigned Children
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {assignedChildren.map((child: any) => (
                                      <div key={child.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-purple-100">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-800 truncate">
                                            {child.fullName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {child.gender} • {calculateAgeInMonths(child.dateOfBirth)} months
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {assignedChildren.length === 0 && (
                              <div className="px-4 pb-4">
                                <div className="border-t border-purple-200 pt-3">
                                  <p className="text-sm text-gray-500 text-center py-2">
                                    No children assigned yet
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                      <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No caregivers assigned to this room</p>
                    </div>
                  )}
                </div>

                {/* Assign Child Dialog */}
                <Dialog open={showAssignChildDialog} onOpenChange={setShowAssignChildDialog}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Assign Child to Caregiver</DialogTitle>
                      <DialogDescription>
                        Select a child and assign them to a caregiver in this room.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={assignChildToCaregiver} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="child">Select Child *</Label>
                        <Select value={assignChildData.childId} onValueChange={(value) => setAssignChildData(prev => ({ ...prev, childId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select child" />
                          </SelectTrigger>
                          <SelectContent>
                            {(() => {
                              console.log('=== ASSIGN CHILD TO CAREGIVER DEBUG ===');
                              console.log('All children count:', allChildren.length);
                              console.log('All children:', allChildren);
                              console.log('Selected room:', selectedRoom);
                              console.log('Selected room ID:', selectedRoom?.id);
                              
                              // Get all children in the selected room
                              // Check both child.room?.id and potentially a roomId field
                              const roomChildren = allChildren.filter((child: any) => {
                                const roomIdMatch = (child.room?.id === selectedRoom.id) || (child.roomId === selectedRoom.id);
                                console.log(`Child "${child.fullName}" (ID: ${child.id}):`, {
                                  room: child.room,
                                  roomId: child.room?.id,
                                  roomIdField: child.roomId,
                                  selectedRoomId: selectedRoom.id,
                                  matches: roomIdMatch
                                });
                                return roomIdMatch;
                              });
                              
                              console.log('Children in room:', roomChildren.length);
                              
                              // Filter to only unassigned children
                              const unassignedChildren = roomChildren.filter((child: any) => {
                                const isUnassigned = !child.servant || child.servant === null || child.servant.id === null;
                                console.log(`Child ${child.fullName}: isUnassigned=${isUnassigned}`);
                                return isUnassigned;
                              });
                              
                              console.log('Unassigned children in room:', unassignedChildren.length);
                              console.log('Unassigned children list:', unassignedChildren);
                              
                              const { infant, toddler, growingStar } = categorizeChildrenByAge(unassignedChildren);
                              
                              return (
                                <>
                                  {infant.length > 0 && (
                                    <>
                                      <div className="px-2 py-1 text-xs font-semibold text-pink-600 bg-pink-50">👶 Infants (3-12 months)</div>
                                      {infant.map((child: any) => (
                                        <SelectItem key={child.id} value={child.id.toString()}>
                                          {child.fullName} ({child.gender}) - {calculateAgeInMonths(child.dateOfBirth)} months
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                  {toddler.length > 0 && (
                                    <>
                                      <div className="px-2 py-1 text-xs font-semibold text-yellow-600 bg-yellow-50">🧒 Toddlers (1-2 years)</div>
                                      {toddler.map((child: any) => (
                                        <SelectItem key={child.id} value={child.id.toString()}>
                                          {child.fullName} ({child.gender}) - {Math.floor(calculateAgeInMonths(child.dateOfBirth) / 12)}y {calculateAgeInMonths(child.dateOfBirth) % 12}m
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                  {growingStar.length > 0 && (
                                    <>
                                      <div className="px-2 py-1 text-xs font-semibold text-purple-600 bg-purple-50">⭐ Growing Stars (2-4 years)</div>
                                      {growingStar.map((child: any) => (
                                        <SelectItem key={child.id} value={child.id.toString()}>
                                          {child.fullName} ({child.gender}) - {Math.floor(calculateAgeInMonths(child.dateOfBirth) / 12)}y {calculateAgeInMonths(child.dateOfBirth) % 12}m
                                        </SelectItem>
                                      ))}
                                    </>
                                  )}
                                  {unassignedChildren.length === 0 && (
                                    <div className="px-2 py-1 text-xs text-gray-500">
                                      {roomChildren.length === 0 
                                        ? 'No children in this room yet' 
                                        : 'All children in this room are already assigned to caregivers'}
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="caregiver">Select Caregiver *</Label>
                        <Select value={assignChildData.caregiverId} onValueChange={(value) => setAssignChildData(prev => ({ ...prev, caregiverId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select caregiver" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedRoom.servants?.map((caregiver: any) => (
                              <SelectItem key={caregiver.id} value={caregiver.id.toString()}>
                                {caregiver.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isAssigning}>
                          {isAssigning ? 'Assigning...' : 'Assign Child'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Children Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Baby className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">Children</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {selectedRoom.children?.length || 0}
                      </Badge>
                    </div>
                  </div>

                  {selectedRoom.children && selectedRoom.children.length > 0 ? (
                    <div className="space-y-6">
                      {(() => {
                        const { infant, toddler, growingStar } = categorizeChildrenByAge(selectedRoom.children || []);
                        
                        return (
                          <>
                            {/* 1. Infant Section - First */}
                            {infant.length > 0 && (
                              <div>
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-pink-100 rounded-lg">
                                    <Heart className="h-5 w-5 text-pink-600" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-pink-700">Infants (3-12 months)</h4>
                                  <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                                    {infant.length}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {infant.map((child: any) => {
                                    const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                                    const isAssigned = child.servant && child.servant.id;
                                    return (
                                      <div key={child.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                                        isAssigned 
                                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' 
                                          : 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-100'
                                      }`}>
                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                          {isAssigned ? (
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                          ) : (
                                            <Heart className="h-5 w-5 text-pink-600" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-semibold text-lg text-gray-800">{child.fullName}</p>
                                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{ageInMonths} months</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">
                                              Infants
                                            </span>
                                            <span className="text-xs text-gray-400">(Age: {ageInMonths}m)</span>
                                            {isAssigned && (
                                              <>
                                                <span className="text-gray-300">•</span>
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                  Assigned
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 2. Toddler Section - Second */}
                            {toddler.length > 0 && (
                              <div>
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-yellow-100 rounded-lg">
                                    <Gamepad2 className="h-5 w-5 text-yellow-600" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-yellow-700">Toddlers (1-2 years)</h4>
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    {toddler.length}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {toddler.map((child: any) => {
                                    const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                                    const isAssigned = child.servant && child.servant.id;
                                    return (
                                      <div key={child.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                                        isAssigned 
                                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' 
                                          : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-100'
                                      }`}>
                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                          {isAssigned ? (
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                          ) : (
                                            <Gamepad2 className="h-5 w-5 text-yellow-600" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-semibold text-lg text-gray-800">{child.fullName}</p>
                                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{Math.floor(ageInMonths / 12)}y {ageInMonths % 12}m</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                                              Toddlers
                                            </span>
                                            <span className="text-xs text-gray-400">(Age: {ageInMonths}m)</span>
                                            {isAssigned && (
                                              <>
                                                <span className="text-gray-300">•</span>
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                  Assigned
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 3. Growing Star Section - Third */}
                            {growingStar.length > 0 && (
                              <div>
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="p-2 bg-purple-100 rounded-lg">
                                    <Star className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <h4 className="text-lg font-semibold text-purple-700">Growing Stars (2-4 years)</h4>
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                    {growingStar.length}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {growingStar.map((child: any) => {
                                    const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                                    const isAssigned = child.servant && child.servant.id;
                                    return (
                                      <div key={child.id} className={`flex items-center gap-4 p-4 rounded-xl border ${
                                        isAssigned 
                                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100' 
                                          : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-100'
                                      }`}>
                                        <div className="p-2 bg-white rounded-full shadow-sm">
                                          {isAssigned ? (
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                          ) : (
                                            <Star className="h-5 w-5 text-purple-600" />
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-semibold text-lg text-gray-800">{child.fullName}</p>
                                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{Math.floor(ageInMonths / 12)}y {ageInMonths % 12}m</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                                              Growing Stars
                                            </span>
                                            <span className="text-xs text-gray-400">(Age: {ageInMonths}m)</span>
                                            {isAssigned && (
                                              <>
                                                <span className="text-gray-300">•</span>
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                                  Assigned
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                      <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No children in this room</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
