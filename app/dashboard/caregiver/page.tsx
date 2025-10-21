'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Servant {
  id: number;
  fullName: string;
  email: string | null;
  phone: string;
  medicalReport?: string | null;
  assignedRoomId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  canTransferRooms: boolean;
  site: 'INSA' | 'OPERATION';
  organizationType: 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY';
  assignedRoom?: {
    id: number;
    name: string; // Assuming Room has a name field
  } | null;
}

interface Room {
  id: number;
  name: string;
}

export default function ServantsPage() {
  const [servants, setServants] = useState<Servant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedServant, setSelectedServant] = useState<Servant | null>(null);
  const [currentMedicalReport, setCurrentMedicalReport] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    assignedRoomId: 'none',
    canTransferRooms: false,
    medicalReportFile: null as File | null,
    site: '' as '' | 'INSA' | 'OPERATION',
    organizationType: '' as '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY',
    assignedByChildIds: [] as number[],
  });

  useEffect(() => {
    fetchServants();
    fetchRooms();
  }, []);

  const fetchServants = async () => {
    try {
      const response = await fetch('/api/servants');
      if (response.ok) {
        const data = await response.json();
        setServants(data);
      }
    } catch (error) {
      console.error('Error fetching servants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const updateCaregiverRoom = async (caregiverId: number, roomId: string) => {
    try {
      const response = await fetch(`/api/servants/${caregiverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assignedRoomId: roomId === 'none' ? null : parseInt(roomId)
        })
      });

      if (response.ok) {
        // Refresh the servants list
        await fetchServants();
        alert('Room assignment updated successfully!');
      } else {
        alert('Failed to update room assignment');
      }
    } catch (error) {
      console.error('Error updating room assignment:', error);
      alert('Error updating room assignment');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('fullName', formData.fullName);
    if (formData.email) fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    if (formData.medicalReportFile) {
      fd.append('medicalReport', formData.medicalReportFile);
    }
    fd.append('assignedRoomId', formData.assignedRoomId);
    fd.append('canTransferRooms', formData.canTransferRooms.toString());
    fd.append('site', formData.site);
    fd.append('organizationType', formData.organizationType);
    formData.assignedByChildIds.forEach((id) => fd.append('assignedByChildIds', String(id)));
    try {
      const response = await fetch('/api/servants', {
        method: 'POST',
        body: fd,
      });
      if (response.ok) {
        setShowCreateDialog(false);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          assignedRoomId: 'none',
          canTransferRooms: false,
          medicalReportFile: null,
        });
        fetchServants();
      }
    } catch (error) {
      console.error('Error creating servant:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    if (!selectedServant) return;
    const fd = new FormData();
    fd.append('fullName', formData.fullName);
    if (formData.email) fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    if (formData.medicalReportFile) {
      fd.append('medicalReport', formData.medicalReportFile);
    }
    fd.append('assignedRoomId', formData.assignedRoomId);
    fd.append('canTransferRooms', formData.canTransferRooms.toString());
    fd.append('site', formData.site);
    fd.append('organizationType', formData.organizationType);
    formData.assignedByChildIds.forEach((id) => fd.append('assignedByChildIds', String(id)));
    try {
      const response = await fetch(`/api/servants/${selectedServant.id}`, {
        method: 'PUT',
        body: fd,
      });
      if (response.ok) {
        setShowEditDialog(false);
        setSelectedServant(null);
        setCurrentMedicalReport(null);
        fetchServants();
      }
    } catch (error) {
      console.error('Error updating servant:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this servant?')) {
      try {
        const response = await fetch(`/api/servants/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchServants();
        }
      } catch (error) {
        console.error('Error deleting servant:', error);
      }
    }
  };

  const openEditDialog = (servant: Servant) => {
    setSelectedServant(servant);
    setCurrentMedicalReport(servant.medicalReport || null);
    setFormData({
      fullName: servant.fullName,
      email: servant.email || '',
      phone: servant.phone,
      assignedRoomId: servant.assignedRoomId ? servant.assignedRoomId.toString() : 'none',
      canTransferRooms: servant.canTransferRooms,
      medicalReportFile: null,
      site: servant.site,
      organizationType: servant.organizationType,
      assignedByChildIds: [],
    });
    setShowEditDialog(true);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (file: File | null) => {
    setFormData((prev) => ({ ...prev, medicalReportFile: file }));
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Servants</CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Servant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Servant</DialogTitle>
                  <DialogDescription>
                    Add a new servant to the system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                    type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Assigned Site</Label>
                  <Select value={formData.site} onValueChange={(value) => handleInputChange('site', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSA">INSA</SelectItem>
                      <SelectItem value="OPERATION">OPERATION</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationType">Assigned Organization Type</Label>
                  <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSA">INSA</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="MINISTRY_OF_PEACE">MINISTRY_OF_PEACE</SelectItem>
                      <SelectItem value="FINANCE_SECURITY">FINANCE_SECURITY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalReport">Medical Report</Label>
                    <Input
                      id="medicalReport"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedRoomId">Assigned Room</Label>
                    <Select value={formData.assignedRoomId} onValueChange={(value) => handleInputChange('assignedRoomId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Room</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="canTransferRooms"
                      checked={formData.canTransferRooms}
                      onCheckedChange={(checked) => handleInputChange('canTransferRooms', checked)}
                    />
                    <Label htmlFor="canTransferRooms">Can Transfer Rooms</Label>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Medical Report</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Can Transfer Rooms</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servants.map((servant) => (
                <TableRow key={servant.id}>
                  <TableCell>{servant.id}</TableCell>
                  <TableCell>{servant.fullName}</TableCell>
                  <TableCell>{servant.email}</TableCell>
                  <TableCell>{servant.phone}</TableCell>
                  <TableCell>
                    {servant.medicalReport ? (
                      <Link
                        href={`/uploads/${servant.medicalReport}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Download
                      </Link>
                    ) : (
                      'None'
                    )}
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={servant.assignedRoomId?.toString() || 'none'} 
                      onValueChange={(value) => updateCaregiverRoom(servant.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Room</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{servant.canTransferRooms ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{new Date(servant.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(servant)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(servant.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Servant</DialogTitle>
            <DialogDescription>
              Update the servant's information.
            </DialogDescription>
          </DialogHeader>
          {selectedServant && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Assigned Site</Label>
                  <Select value={formData.site} onValueChange={(value) => handleInputChange('site', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSA">INSA</SelectItem>
                      <SelectItem value="OPERATION">OPERATION</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationType">Assigned Organization Type</Label>
                  <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSA">INSA</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="MINISTRY_OF_PEACE">MINISTRY_OF_PEACE</SelectItem>
                      <SelectItem value="FINANCE_SECURITY">FINANCE_SECURITY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <div className="space-y-2">
                <Label htmlFor="medicalReport">Medical Report</Label>
                {currentMedicalReport && (
                  <p className="text-sm text-muted-foreground mb-2">Current: {currentMedicalReport}</p>
                )}
                <Input
                  id="medicalReport"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedRoomId">Assigned Room</Label>
                <Select value={formData.assignedRoomId} onValueChange={(value) => handleInputChange('assignedRoomId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Room</SelectItem>
                    {rooms.map((room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="canTransferRooms"
                  checked={formData.canTransferRooms}
                  onCheckedChange={(checked) => handleInputChange('canTransferRooms', checked)}
                />
                <Label htmlFor="canTransferRooms">Can Transfer Rooms</Label>
              </div>
              <DialogFooter>
                <Button type="submit">Update</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}