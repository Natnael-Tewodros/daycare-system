'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, ArrowRightLeft, Users } from 'lucide-react';
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
  site: 'HEADOFFICE' | 'OPERATION';
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

interface Child {
  id: number;
  fullName: string;
  dateOfBirth: string | Date;
  gender: string;
  assignedServantId?: number | null;
  servant?: {
    id: number;
    fullName: string;
  } | null;
}

export default function CaregiversPage() {
  const [servants, setServants] = useState<Servant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showAssignChildrenDialog, setShowAssignChildrenDialog] = useState(false);
  const [selectedServant, setSelectedServant] = useState<Servant | null>(null);
  const [currentMedicalReport, setCurrentMedicalReport] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    assignedRoomId: 'none',
    medicalReportFile: null as File | null,
    site: '' as '' | 'HEADOFFICE' | 'OPERATION',
    organizationType: 'INSA' as '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY',
    assignedByChildIds: [] as number[],
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferData, setTransferData] = useState({
    caregiverId: '',
    roomId: ''
  });
  const [assignChildrenData, setAssignChildrenData] = useState({
    caregiverId: '',
    selectedChildren: [] as number[]
  });

  useEffect(() => {
    fetchServants();
    fetchRooms();
    fetchChildren();
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

  const fetchChildren = async () => {
    try {
      console.log('Fetching children...');
      // Try with explicit URL to avoid any issues
      const response = await fetch('/api/children', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Children response status:', response.status);
      console.log('Children response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched children data:', data);
        console.log('Number of children:', data.length);
        
        if (Array.isArray(data)) {
          // Map the data to include assignedServantId from servant object
          const mappedChildren = data.map((child: any) => ({
            ...child,
            assignedServantId: child.servant ? child.servant.id : null
          }));
          
          console.log('Mapped children:', mappedChildren);
          setChildren(mappedChildren);
        } else {
          console.error('Children data is not an array:', data);
          setChildren([]);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch children:', response.status, errorText);
        setChildren([]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([]);
    }
  };

  const openCreateDialog = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      assignedRoomId: 'none',
      medicalReportFile: null,
      site: '' as '' | 'HEADOFFICE' | 'OPERATION',
      organizationType: 'INSA' as '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY',
      assignedByChildIds: [] as number[],
    });
    setErrors({});
    setShowCreateDialog(true);
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

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.site) {
      newErrors.site = 'Site is required';
    }
    
    if (!formData.organizationType) {
      newErrors.organizationType = 'Organization type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkEmailExists = async (email: string, excludeId?: number) => {
    try {
      const response = await fetch(`/api/servants/check-email?email=${encodeURIComponent(email)}${excludeId ? `&excludeId=${excludeId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
    return false;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Check if email already exists
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      setErrors({ email: 'A caregiver with this email already exists' });
      setIsSubmitting(false);
      return;
    }
    
    const fd = new FormData();
    fd.append('fullName', formData.fullName);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    if (formData.medicalReportFile) {
      fd.append('medicalReport', formData.medicalReportFile);
    }
    fd.append('assignedRoomId', formData.assignedRoomId);
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
          medicalReportFile: null,
          site: '' as '' | 'HEADOFFICE' | 'OPERATION',
          organizationType: 'INSA' as '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY',
          assignedByChildIds: [] as number[],
        });
        setErrors({});
        fetchServants();
        alert('Caregiver created successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create caregiver');
      }
    } catch (error) {
      console.error('Error creating caregiver:', error);
      alert('Error creating caregiver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    if (!selectedServant) return;
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Check if email already exists (excluding current caregiver)
    const emailExists = await checkEmailExists(formData.email, selectedServant.id);
    if (emailExists) {
      setErrors({ email: 'A caregiver with this email already exists' });
      setIsSubmitting(false);
      return;
    }
    
    const fd = new FormData();
    fd.append('fullName', formData.fullName);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    if (formData.medicalReportFile) {
      fd.append('medicalReport', formData.medicalReportFile);
    }
    fd.append('assignedRoomId', formData.assignedRoomId);
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
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          assignedRoomId: 'none',
          medicalReportFile: null,
          site: '' as '' | 'HEADOFFICE' | 'OPERATION',
          organizationType: 'INSA' as '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY',
          assignedByChildIds: [] as number[],
        });
        setErrors({});
        fetchServants();
        alert('Caregiver updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update caregiver');
      }
    } catch (error) {
      console.error('Error updating caregiver:', error);
      alert('Error updating caregiver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (servantId: number) => {
    if (!confirm('Are you sure you want to delete this caregiver? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/servants/${servantId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchServants();
        alert('Caregiver deleted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete caregiver');
      }
    } catch (error) {
      console.error('Error deleting caregiver:', error);
      alert('Error deleting caregiver');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.caregiverId || !transferData.roomId) {
      alert('Please select both caregiver and room');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('assignedRoomId', transferData.roomId);
      
      await fetch(`/api/servants/${transferData.caregiverId}`, {
        method: 'PUT',
        body: formData
      });
      
      setShowTransferDialog(false);
      setTransferData({ caregiverId: '', roomId: '' });
      fetchServants();
      alert('Caregiver transferred successfully!');
    } catch (error) {
      console.error('Error transferring caregiver:', error);
      alert('Error transferring caregiver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignChildren = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignChildrenData.caregiverId || assignChildrenData.selectedChildren.length === 0) {
      alert('Please select a caregiver and at least one child');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('assignedServantId', assignChildrenData.caregiverId);
      formData.append('childIds', JSON.stringify(assignChildrenData.selectedChildren));
      
      await fetch('/api/children/assign-caregiver', {
        method: 'POST',
        body: formData
      });
      
      setShowAssignChildrenDialog(false);
      setAssignChildrenData({ caregiverId: '', selectedChildren: [] });
      fetchChildren();
      alert('Children assigned successfully!');
    } catch (error) {
      console.error('Error assigning children:', error);
      alert('Error assigning children');
    } finally {
      setIsSubmitting(false);
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
            <CardTitle>Caregivers</CardTitle>
            <div className="flex gap-2">
              <Dialog open={showAssignChildrenDialog} onOpenChange={setShowAssignChildrenDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setAssignChildrenData({ caregiverId: '', selectedChildren: [] })}>
                    <Users className="mr-2 h-4 w-4" /> Assign Children
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setTransferData({ caregiverId: '', roomId: '' })}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Room
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Add Caregiver
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Caregiver</DialogTitle>
                  <DialogDescription>
                    Add a new caregiver to the system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                    />
                    {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="caregiver@example.com"
                    />
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                    {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Assigned Site *</Label>
                  <Select value={formData.site} onValueChange={(value) => handleInputChange('site', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEADOFFICE">Head Office</SelectItem>
                      <SelectItem value="OPERATION">Operation</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.site && <p className="text-sm text-red-600">{errors.site}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationType">Assigned Organization Type *</Label>
                  <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSA">INSA</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                      <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.organizationType && <p className="text-sm text-red-600">{errors.organizationType}</p>}
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicalReport">Medical Report (PDF only)</Label>
                    <Input
                      id="medicalReport"
                      type="file"
                      accept=".pdf"
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
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Caregiver'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Transfer Caregiver</DialogTitle>
                  <DialogDescription>
                    Transfer a caregiver to a different room.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleTransfer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="caregiver">Select Caregiver *</Label>
                    <Select value={transferData.caregiverId} onValueChange={(value) => setTransferData(prev => ({ ...prev, caregiverId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select caregiver" />
                      </SelectTrigger>
                      <SelectContent>
                        {servants.map((servant) => (
                          <SelectItem key={servant.id} value={servant.id.toString()}>
                            {servant.fullName} {servant.assignedRoom && `(Current: ${servant.assignedRoom.name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Select Room *</Label>
                    <Select value={transferData.roomId} onValueChange={(value) => setTransferData(prev => ({ ...prev, roomId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Transferring...' : 'Transfer Caregiver'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={showAssignChildrenDialog} onOpenChange={setShowAssignChildrenDialog}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Assign Children to Caregiver</DialogTitle>
                  <DialogDescription>
                    Select a caregiver and assign multiple children to them.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAssignChildren} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="caregiver">Select Caregiver *</Label>
                    <Select value={assignChildrenData.caregiverId} onValueChange={(value) => setAssignChildrenData(prev => ({ ...prev, caregiverId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select caregiver" />
                      </SelectTrigger>
                      <SelectContent>
                        {servants.map((servant) => (
                          <SelectItem key={servant.id} value={servant.id.toString()}>
                            {servant.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Select Children *</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchChildren}
                      >
                        Refresh
                      </Button>
                    </div>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                      {children.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500">No children available</p>
                          <p className="text-xs text-gray-400 mt-1">Click Refresh to reload data</p>
                        </div>
                      ) : (
                        children.map((child) => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`child-${child.id}`}
                            checked={assignChildrenData.selectedChildren.includes(child.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAssignChildrenData(prev => ({
                                  ...prev,
                                  selectedChildren: [...prev.selectedChildren, child.id]
                                }));
                              } else {
                                setAssignChildrenData(prev => ({
                                  ...prev,
                                  selectedChildren: prev.selectedChildren.filter(id => id !== child.id)
                                }));
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`child-${child.id}`} className="text-sm">
                            {child.fullName} ({child.gender}) - {new Date(child.dateOfBirth).toLocaleDateString()}
                          </label>
                        </div>
                        ))
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Assigning...' : 'Assign Children'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            </div>
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
                <TableHead>Assigned Children</TableHead>
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
                  <TableCell>
                    {children.filter(child => child.assignedServantId === servant.id).length} children
                  </TableCell>
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
            <DialogTitle>Edit Caregiver</DialogTitle>
            <DialogDescription>
              Update the caregiver's information.
            </DialogDescription>
          </DialogHeader>
          {selectedServant && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                />
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="caregiver@example.com"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>
                <div className="space-y-2">
                  <Label htmlFor="site">Assigned Site *</Label>
                  <Select value={formData.site} onValueChange={(value) => handleInputChange('site', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select site" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEADOFFICE">Head Office</SelectItem>
                      <SelectItem value="OPERATION">Operation</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.site && <p className="text-sm text-red-600">{errors.site}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationType">Assigned Organization Type *</Label>
                  <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INSA">INSA</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                      <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.organizationType && <p className="text-sm text-red-600">{errors.organizationType}</p>}
                </div>
              <div className="space-y-2">
                <Label htmlFor="medicalReport">Medical Report</Label>
                {currentMedicalReport && (
                  <p className="text-sm text-muted-foreground mb-2">Current: {currentMedicalReport}</p>
                )}
                <Input
                  id="medicalReport"
                  type="file"
                  accept=".pdf"
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
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Caregiver'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}