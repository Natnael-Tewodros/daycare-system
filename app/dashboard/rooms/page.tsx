"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Baby, 
  Users, 
  Calendar, 
  Heart, 
  Star, 
  Sparkles,
  Clock,
  UserCheck
} from "lucide-react";
import Image from "next/image";

// Age group configuration
const ageGroups = [
  {
    name: "Tiny Tots",
    description: "3 months - 1 year",
    icon: Baby,
    color: "bg-pink-100 text-pink-800 border-pink-200",
    bgColor: "bg-gradient-to-br from-pink-50 to-rose-50",
    ageRange: { min: 0, max: 12 }
  },
  {
    name: "Little Explorers", 
    description: "1 year - 2 years",
    icon: Heart,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50",
    ageRange: { min: 12, max: 24 }
  },
  {
    name: "Growing Stars",
    description: "2 years - 4 years", 
    icon: Star,
    color: "bg-green-100 text-green-800 border-green-200",
    bgColor: "bg-gradient-to-br from-green-50 to-emerald-50",
    ageRange: { min: 24, max: 48 }
  }
];

// Function to calculate age in months
const calculateAgeInMonths = (dateOfBirth: string | Date): number => {
  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  return (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
};

// Function to get age group for a child
const getAgeGroup = (dateOfBirth: string | Date) => {
  const ageInMonths = calculateAgeInMonths(dateOfBirth);
  return ageGroups.find(group => 
    ageInMonths >= group.ageRange.min && ageInMonths < group.ageRange.max
  ) || ageGroups[0]; // Default to first group
};

// Function to organize rooms by age groups and filter children by age
const organizeRoomsByAgeGroup = (rooms: any[]) => {
  const organizedRooms: { [key: string]: any[] } = {};
  
  ageGroups.forEach(group => {
    organizedRooms[group.name] = [];
  });
  
  rooms.forEach(room => {
    const childrenInRoom = room.children || [];
    const ageGroupCounts: { [key: string]: number } = {};
    
    // Count children in each age group
    childrenInRoom.forEach((child: any) => {
      const ageGroup = getAgeGroup(child.dateOfBirth);
      ageGroupCounts[ageGroup.name] = (ageGroupCounts[ageGroup.name] || 0) + 1;
    });
    
    // Find the dominant age group for this room
    const dominantAgeGroup = Object.keys(ageGroupCounts).reduce((a, b) => 
      ageGroupCounts[a] > ageGroupCounts[b] ? a : b, ageGroups[0].name
    );
    
    if (!organizedRooms[dominantAgeGroup]) {
      organizedRooms[dominantAgeGroup] = [];
    }
    
    // Filter children to only show those matching the age group
    const filteredRoom = {
      ...room,
      children: childrenInRoom.filter((child: any) => {
        const childAgeGroup = getAgeGroup(child.dateOfBirth);
        return childAgeGroup.name === dominantAgeGroup;
      })
    };
    
    organizedRooms[dominantAgeGroup].push(filteredRoom);
  });
  
  return organizedRooms;
};

export default function RoomPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/rooms"); // include children
      setRooms(res.data);
      setError(null);
    } catch (e: any) {
      console.error('Fetch rooms error:', e);
      setError(e?.response?.data?.error || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const organizedRooms = organizeRoomsByAgeGroup(rooms);

  return (
    <div className="p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Daycare Rooms</h1>
        <p className="text-muted-foreground">Organized by age groups for optimal care</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading rooms...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600 text-lg">{error}</p>
          <Button onClick={fetchRooms} className="mt-4">
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {ageGroups.map((ageGroup) => {
            const IconComponent = ageGroup.icon;
            const roomsInGroup = organizedRooms[ageGroup.name] || [];
            const totalChildrenInGroup = roomsInGroup.reduce((sum, room) => sum + (room.children?.length || 0), 0);
            
            return (
              <div key={ageGroup.name} className="space-y-4">
                {/* Age Group Header */}
                <div className={`p-6 rounded-lg ${ageGroup.bgColor} border-2 border-dashed border-gray-200`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${ageGroup.color} bg-white`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{ageGroup.name}</h2>
                      <p className="text-muted-foreground text-lg">{ageGroup.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={`${ageGroup.color}`}>
                          {roomsInGroup.length} room{roomsInGroup.length !== 1 ? 's' : ''}
                        </Badge>
                        <Badge variant="outline" className={ageGroup.color}>
                          {totalChildrenInGroup} children
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rooms in this age group */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {roomsInGroup.map((room: any) => (
                    <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{room.name}</CardTitle>
                          <Badge variant="outline" className={ageGroup.color}>
                            {room.children?.length || 0} children
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{room.children?.length || 0} children enrolled</span>
                          </div>
                          
                          {room.children && room.children.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                Children in this room ({room.children.length}):
                              </p>
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {room.children.slice(0, 5).map((child: any) => {
                                  const childAgeGroup = getAgeGroup(child.dateOfBirth);
                                  const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                                  
                                  return (
                                    <div key={child.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                        <Baby className="h-3 w-3 text-gray-600" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium">{child.fullName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {Math.floor(ageInMonths / 12)}y {ageInMonths % 12}m
                                        </p>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {childAgeGroup.name}
                                      </Badge>
                                    </div>
                                  );
                                })}
                                {room.children.length > 5 && (
                                  <p className="text-xs text-muted-foreground text-center">
                                    +{room.children.length - 5} more children
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          {(!room.children || room.children.length === 0) && (
                            <div className="text-center py-4 text-muted-foreground">
                              <Baby className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No children in this age group</p>
                            </div>
                          )}
                          
                          <Button variant="outline" size="sm" className="w-full">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Manage Room
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {roomsInGroup.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No rooms assigned to {ageGroup.name} yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
