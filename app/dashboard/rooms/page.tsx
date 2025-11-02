"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle, Clock, Sparkles, Users, Baby, AlertCircle, Home, BabyIcon, Sprout } from "lucide-react";
import RoomCard from "@/components/rooms/RoomCard";
import RoomDetailModal from "@/components/rooms/RoomDetailModal";

// Helpers moved to components/rooms/utils

export default function RoomPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [allChildren, setAllChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [caregiverChildren, setCaregiverChildren] = useState<{[key: number]: any[]}>({});

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/rooms");
      
      // Ensure rooms are in the correct order: Infant -> Toddler -> Growing Star
      const orderedRooms = res.data.sort((a: any, b: any) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Define order: Infant (1), Toddler (2), Growing Star (3)
        const getOrder = (name: string): number => {
          if (name.includes('infant')) return 1;
          if (name.includes('toddler')) return 2;
          if (name.includes('growing star') || name.includes('growing start')) return 3;
          return 99; // Other rooms go last
        };
        
        return getOrder(aName) - getOrder(bName);
      });
      
      setRooms(orderedRooms);
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
      return unique;
    } catch (e: any) {
      console.error('Fetch children error:', e);
      return [];
    }
  };

  const refreshData = async () => { 
    await fetchRooms(); 
    await fetchAllChildren();
    // Refresh selected room if one is open
    if (selectedRoom) {
      const roomsRes = await axios.get("/api/rooms");
      const orderedRooms = roomsRes.data.sort((a: any, b: any) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Define order: Infant (1), Toddler (2), Growing Star (3)
        const getOrder = (name: string): number => {
          if (name.includes('infant')) return 1;
          if (name.includes('toddler')) return 2;
          if (name.includes('growing star') || name.includes('growing star')) return 3;
          return 99; // Other rooms go last
        };
        
        return getOrder(aName) - getOrder(bName);
      });
      const updatedRoom = orderedRooms.find((r: any) => r.id === selectedRoom.id);
      if (updatedRoom) {
        setSelectedRoom(updatedRoom);
      }
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
              <RoomCard key={room.id} room={room} caregiverChildren={caregiverChildren} onClick={handleRoomClick} />
            ))}
          </div>
        )}

        {/* Child Assignment Modal removed (unused) */}

        {selectedRoom && (
          <RoomDetailModal 
            selectedRoom={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            caregiverChildren={caregiverChildren}
            allChildren={allChildren}
            onRefresh={refreshData}
          />
        )}
      </div>
    </div>
  );
}
