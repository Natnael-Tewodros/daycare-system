'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, ArrowRightLeft, Users, Search, Mail, Phone, MapPin, Building, UserCheck, Baby, BabyIcon, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import CaregiverForm from '@/components/caregiver/CaregiverForm';

const PAGE_SIZE = 8;

export default function CaregiversPage() {
  interface Room {
    id: string;
    name: string;
    ageRange?: string;
    organization?: {
      id: string;
      name: string;
    };
  }

  interface Child {
    id: string;
    fullName: string;
    caregiver?: { id: string };
    assignedServantId?: string | null;
  }

  const [servants, setServants] = useState<Caregiver[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  interface Caregiver {
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    assignedRoomId: string;
    site: '' | 'HEADOFFICE' | 'OPERATION';
    organizationType: '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY';
    medicalReportFile: File | null;
  }

  const [selected, setSelected] = useState<Caregiver | null>(null);
  const [form, setForm] = useState<Caregiver>({ 
    fullName: '', 
    email: '', 
    phone: '', 
    assignedRoomId: 'none', 
    site: '', 
    organizationType: '', 
    medicalReportFile: null 
  });

  const handleFormChange = (patch: Partial<Caregiver>) => {
    setForm(prev => ({ ...prev, ...patch }));
  };
  interface FormErrors {
    [key: string]: string;
  }
  const [errors, setErrors] = useState<FormErrors>({});
  const [transfer, setTransfer] = useState<{ caregiverId: string; roomId: string }>({ 
    caregiverId: '', 
    roomId: '' 
  });
  
  const [assign, setAssign] = useState<{ 
    caregiverId: string; 
    selectedChildren: string[] 
  }>({ 
    caregiverId: '', 
    selectedChildren: [] 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/caregivers/caregivers').then(r => r.json()).then(setServants),
      fetch('/api/rooms')
        .then(r => r.json())
        .then(rooms => {
          // Sort rooms: Infant -> Toddler -> Growing Star -> Others
          const sortedRooms = [...rooms].sort((a, b) => {
            const order: Record<string, number> = { 
              'infant': 1, 
              'toddler': 2, 
              'growing star': 3 
            };
            const aKey = a.name.toLowerCase();
            const bKey = b.name.toLowerCase();
            return (order[aKey] || 99) - (order[bKey] || 99);
          });
          setRooms(sortedRooms);
        }),
      fetch('/api/children').then(r => r.json()).then(data => setChildren(data.map(c => ({ ...c, assignedServantId: c.servant?.id ?? c.caregiver?.id ?? null }))))
    ]).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => 
    servants.filter(s => 
      (s.fullName?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (s.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (s.phone || '').includes(search)
    ), [servants, search]
  );

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const resetForm = () => setForm({
    fullName: '',
    email: '',
    phone: '',
    assignedRoomId: 'none',
    site: '',
    organizationType: '',
    medicalReportFile: null
  });

  const saveServant = async (e: React.FormEvent, id?: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Log the form data before sending
      console.log('Form state:', {
        ...form,
        medicalReportFile: form.medicalReportFile ? 'File attached' : 'No file'
      });
      
      const fd = new FormData();
      
      // Add all form fields, ensuring we don't send undefined values
      const formFields = {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        assignedRoomId: form.assignedRoomId,
        site: form.site,
        organizationType: form.organizationType,
        hasMedicalReport: !!form.medicalReportFile
      };
      
      console.log('Prepared form data:', formFields);
      
      // Append non-empty fields to FormData
      Object.entries(formFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          fd.append(key, String(value));
        }
      });
      
      // Handle file upload separately
      if (form.medicalReportFile) {
        fd.append('medicalReportFile', form.medicalReportFile);
      }
      
      const endpoint = id ? `/api/caregivers/${id}` : '/api/caregivers';
      console.log('Sending to:', endpoint);
      
      const res = await fetch(endpoint, { 
        method: id ? 'PUT' : 'POST', 
        body: fd,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      let responseData: any = {};
      try {
        const contentType = res.headers.get('content-type');
        const responseText = await res.text();
        
        if (responseText) {
          if (contentType && contentType.includes('application/json')) {
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              console.error('Failed to parse JSON response', e);
              responseData = { error: responseText || 'Invalid JSON response' };
            }
          } else {
            // Try to parse as JSON anyway, but fallback to text
            try {
              responseData = JSON.parse(responseText);
            } catch (e) {
              responseData = { error: responseText || `Server error: ${res.status} ${res.statusText || 'Unknown error'}` };
            }
          }
        }
      } catch (e) {
        console.error('Failed to read response', e);
        responseData = { error: 'Failed to read server response' };
      }
      
      if (!res.ok) {
        const errorInfo = {
          status: res.status,
          statusText: res.statusText,
          response: responseData,
        };
        console.error('Error details:', errorInfo);
        
        // Handle validation errors
        if (responseData.details && typeof responseData.details === 'object') {
          setErrors(responseData.details);
        } else if (responseData.error) {
          setErrors({ submit: responseData.error });
        } else if (responseData.message) {
          setErrors({ submit: responseData.message });
        } else {
          setErrors({ 
            submit: `Server error: ${res.status} ${res.statusText || 'Unknown error'}. Please try again.` 
          });
        }
        return;
      }
      
      setOpenCreate(false); 
      setOpenEdit(false);
      resetForm();
      const updatedCaregivers = await fetch('/api/caregivers').then(r => r.json());
      setServants(updatedCaregivers);
    } catch (error) {
      console.error('Error saving caregiver:', error);
      setErrors({ submit: 'Failed to save caregiver. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteServant = async (id: string) => {
    if (confirm('Delete caregiver?')) {
      try {
        const response = await fetch(`/api/caregivers/${id}`, { 
          method: 'DELETE' 
        });
        if (response.ok) {
          setServants(s => s.filter(x => x.id !== id));
        } else {
          console.error('Failed to delete caregiver');
        }
      } catch (error) {
        console.error('Error deleting caregiver:', error);
      }
    }
  };

  const updateRoom = async (id, roomId) => {
    await fetch(`/api/caregivers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedRoomId: roomId === 'none' ? null : +roomId }),
    });
    setServants(s => s.map(x => x.id === id ? { ...x, assignedRoomId: roomId === 'none' ? null : +roomId } : x));
  };

  const assignChildren = async () => {
    if (!assign.caregiverId || !assign.selectedChildren.length) return;
    const formData = new FormData();
    formData.append('assignedServantId', assign.caregiverId);
    formData.append('childIds', JSON.stringify(assign.selectedChildren));
    
    const response = await fetch('/api/children/assign-caregiver', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      setOpenAssign(false);
      // Refresh children data after assignment
      const childrenData = await fetch('/api/children').then(r => r.json());
      setChildren(childrenData.map((c: any) => ({ ...c, assignedServantId: c.servant?.id ?? c.caregiver?.id ?? null })));
    } else {
      const errorData = await response.json();
      alert(`Error: ${errorData.error || 'Failed to assign children'}`);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-96" />
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />)}
      </div>
    </div>
  );

  const TableHeader = ({ children }) => (
    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase bg-gray-50">{children}</th>
  );

  const TableCell = ({ children, className = "" }) => (
    <td className={`px-6 py-4 text-sm text-gray-900 ${className}`}>{children}</td>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Caregiver Management</h1>
              <p className="text-gray-600 mt-1">Manage caregivers and their assignments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Search and Actions */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-80">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search caregivers..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
                </div>
                <Badge variant="secondary">{filtered.length} Caregivers</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={openAssign} onOpenChange={setOpenAssign}>
                  <DialogTrigger asChild><Button variant="outline" onClick={() => setAssign({ caregiverId: '', selectedChildren: [] })}><UserCheck className="h-4 w-4 mr-2" />Assign</Button></DialogTrigger>
                </Dialog>
                <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
                  <DialogTrigger asChild><Button variant="outline" onClick={() => setTransfer({ caregiverId: '', roomId: '' })}><ArrowRightLeft className="h-4 w-4 mr-2" />Transfer</Button></DialogTrigger>
                </Dialog>
                <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                  <DialogTrigger asChild><Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add</Button></DialogTrigger>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Children search results showing their caregiver */}
        {search.trim() && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 text-sm font-medium text-gray-700">
                Children matching “{search}”
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {children
                  .filter(c => (c.fullName || '').toLowerCase().includes(search.toLowerCase()))
                  .slice(0, 8)
                  .map(child => {
                    const caregiver = servants.find(s => s.id?.toString() === child.assignedServantId?.toString());
                    return (
                      <div key={child.id} className="flex items-center justify-between rounded-lg border p-3 bg-white">
                        <div>
                          <div className="font-medium text-gray-900">{child.fullName}</div>
                          <div className="text-xs text-gray-500">Caregiver: {caregiver?.fullName || 'Unassigned'}</div>
                        </div>
                        <Badge variant={caregiver ? 'default' : 'secondary'} className="whitespace-nowrap">
                          {caregiver ? 'Assigned' : 'Unassigned'}
                        </Badge>
                      </div>
                    );
                  })}
                {children.filter(c => (c.fullName || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
                  <div className="text-sm text-gray-500">No children found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200">
                  <TableHeader>Caregiver</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Room</TableHeader>
                  <TableHeader>Organization</TableHeader>
                  <TableHeader>Medical</TableHeader>
                  <TableHeader>Children</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map(servant => {
                    const assignedChildren = children.filter(c => c.assignedServantId === servant.id);
                    return (
                      <tr key={servant.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                              {servant.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium">{servant.fullName}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-gray-400" />{servant.email}</div>
                            <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-gray-400" />{servant.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={servant.assignedRoomId?.toString() ?? 'none'} onValueChange={v => updateRoom(servant.id, v)}>
                            <SelectTrigger className="min-w-48">
                              <SelectValue placeholder="Select room" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No room assigned</SelectItem>
                              {rooms.map(room => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    {room.name.toLowerCase().includes('infant') ? (
                                      <Baby className="h-4 w-4 text-pink-500" />
                                    ) : room.name.toLowerCase().includes('toddler') ? (
                                      <BabyIcon className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <Sprout className="h-4 w-4 text-green-500" />
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-medium">{room.name}</span>
                                      {room.ageRange && (
                                        <span className="text-xs text-gray-500">{room.ageRange}</span>
                                      )}
                                      {room.organization?.name && (
                                        <span className="text-xs text-gray-400">{room.organization.name}</span>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit"><Building className="h-3 w-3" />{servant.site}</Badge>
                            <div className="text-xs text-gray-500">{servant.organizationType}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {servant.medicalReport ? (
                            <a href={servant.medicalReport} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm">View</a>
                          ) : <span className="text-gray-400 text-sm">No report</span>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Badge variant={assignedChildren.length ? "default" : "secondary"}>{assignedChildren.length} children</Badge>
                            {assignedChildren.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {assignedChildren.slice(0, 2).map(child => <div key={child.id}>• {child.fullName}</div>)}
                                {assignedChildren.length > 2 && <div className="text-gray-400">+{assignedChildren.length - 2} more</div>}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setSelected(servant); setForm({ 
                              fullName: servant.fullName ?? '', 
                              email: servant.email ?? '', 
                              phone: servant.phone ?? '', 
                              assignedRoomId: servant.assignedRoomId?.toString() ?? 'none',
                              site: servant.site ?? '',
                              organizationType: servant.organizationType ?? '',
                              medicalReportFile: null
                            }); setOpenEdit(true); }} className="text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteServant(servant.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {paginated.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No caregivers found</h3>
                <p className="text-gray-500 mb-4">{search ? 'Try different search terms' : 'Add your first caregiver'}</p>
                {!search && (
                  <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                    <DialogTrigger asChild>
                      <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" />Add Caregiver</Button>
                    </DialogTrigger>
                  </Dialog>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog open={openCreate || openEdit} onOpenChange={openEdit ? setOpenEdit : setOpenCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{openEdit ? 'Edit' : 'Add'} Caregiver</DialogTitle>
          </DialogHeader>
          <CaregiverForm 
            rooms={rooms} 
            form={form} 
            errors={errors} 
            isSubmitting={isSubmitting}
            onChange={handleFormChange} 
            onSubmit={(e) => saveServant(e, selected?.id)}
            currentReportLabel={selected?.medicalReportFile ? 'Update Medical Report' : ''}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Transfer Caregiver</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={transfer.caregiverId} onValueChange={v => setTransfer(t => ({ ...t, caregiverId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select caregiver" /></SelectTrigger>
              <SelectContent>{servants.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={transfer.roomId} onValueChange={v => setTransfer(t => ({ ...t, roomId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No room</SelectItem>
                {rooms.map(r => <SelectItem key={r.id} value={r.id.toString()}><MapPin className="h-4 w-4 inline mr-2" />{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => updateRoom(+transfer.caregiverId, transfer.roomId)} className="w-full"><ArrowRightLeft className="h-4 w-4 mr-2" />Transfer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign Children</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Select value={assign.caregiverId} onValueChange={v => setAssign(a => ({ ...a, caregiverId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select caregiver" /></SelectTrigger>
              <SelectContent>{servants.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}</SelectContent>
            </Select>
            <div className="max-h-60 overflow-y-auto border rounded p-3 space-y-2 bg-gray-50">
              {children.map(child => (
                <label key={child.id} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer">
                  <input type="checkbox" checked={assign.selectedChildren.includes(child.id)} onChange={e => setAssign(a => ({ ...a, selectedChildren: e.target.checked ? [...a.selectedChildren, child.id] : a.selectedChildren.filter(id => id !== child.id) }))} />
                  <div>
                    <div className="font-medium text-sm">{child.fullName}</div>
                    <div className="text-xs text-gray-500">{child.gender} • {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : 'No DOB'}</div>
                  </div>
                </label>
              ))}
            </div>
            <Button onClick={assignChildren} className="w-full"><UserCheck className="h-4 w-4 mr-2" />Assign Children</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}