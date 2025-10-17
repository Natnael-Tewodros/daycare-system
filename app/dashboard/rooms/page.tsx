"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

  return (
    <div className="p-4 space-y-4">
      {loading && <p className="text-muted-foreground">Loading rooms...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-4">
        {rooms.map((room: any) => (
          <Card key={room.id}>
            <CardHeader>
              <CardTitle>{room.name}</CardTitle>
            </CardHeader>
            <CardContent>
              Age Range: {room.ageRange} <br/>
              Children: 
              <ul className="ml-4 list-disc">
                {room.children.map((child: any) => (
                  <li key={child.id}>{child.fullName} ({new Date(child.dateOfBirth).getFullYear()})</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
