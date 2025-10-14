"use client";

import { useEffect, useState } from "react";
import { prisma } from "@/lib/prisma"; // only if you fetch server-side
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

type Room = {
  id: number;
  name: string;
  ageRange: string;
  childrenCount: number;
  servantsCount: number;
};

export default function RoomPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoom, setNewRoom] = useState({ name: "", ageRange: "" });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const res = await fetch("/api/rooms");
    const data = await res.json();
    setRooms(data);
  };

  const handleAddRoom = async () => {
    if (!newRoom.name || !newRoom.ageRange) return;
    await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRoom),
    });
    setNewRoom({ name: "", ageRange: "" });
    fetchRooms();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Rooms</h1>

      {/* Add Room Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mb-4">Add Room</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Room Name"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            />
            <Input
              placeholder="Age Range (e.g., 3 months - 1 year)"
              value={newRoom.ageRange}
              onChange={(e) => setNewRoom({ ...newRoom, ageRange: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddRoom}>Create Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Age Range</TableCell>
            <TableCell>Children Count</TableCell>
            <TableCell>Servants Count</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell>{room.name}</TableCell>
              <TableCell>{room.ageRange}</TableCell>
              <TableCell>{room.childrenCount}</TableCell>
              <TableCell>{room.servantsCount}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="destructive" size="sm" className="ml-2">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
