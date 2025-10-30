'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, ArrowRightLeft, Users, Search, Loader2, Mail, Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import CaregiverForm from '@/components/caregiver/CaregiverForm';
import type { Servant, Room, ChildRow } from './types';

const PAGE_SIZE = 8;

export default function CaregiversPage() {
  const [servants, setServants] = useState<Servant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [children, setChildren] = useState<ChildRow[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [selected, setSelected] = useState<Servant | null>(null);

  // Form
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', assignedRoomId: 'none',
    site: '' as any, organizationType: '' as any, medicalReportFile: null as File | null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Transfer & Assign
  const [transfer, setTransfer] = useState({ caregiverId: '', roomId: '' });
  const [assign, setAssign] = useState({ caregiverId: '', selectedChildren: [] as number[] });

  // Fetch
  useEffect(() => {
    Promise.all([
      fetch('/api/servants').then(r => r.ok && r.json().then(setServants)),
      fetch('/api/rooms').then(r => r.ok && r.json().then(setRooms)),
      fetch('/api/children').then(r => r.ok && r.json().then(data => {
        const mapped = (data || []).map((c: any) => ({
          ...c, assignedServantId: c.servant?.id ?? null
        }));
        setChildren(mapped);
      })),
    ]).finally(() => setLoading(false));
  }, []);

  // Filter & Paginate
  const filtered = useMemo(() => {
    if (!search) return servants;
    const term = search.toLowerCase();
    return servants.filter(s =>
      s.fullName.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.phone.includes(term)
    );
  }, [servants, search]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Helpers
  const resetForm = () => setForm({ fullName: '', email: '', phone: '', assignedRoomId: 'none', site: '', organizationType: '', medicalReportFile: null });
  const validate = () => {
    const e: any = {};
    if (!form.fullName) e.fullName = 'Required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone) e.phone = 'Required';
    if (!form.site) e.site = 'Required';
    if (!form.organizationType) e.organizationType = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const checkEmail = async (email: string, id?: number) => {
    const res = await fetch(`/api/servants/check-email?email=${email}${id ? `&excludeId=${id}` : ''}`);
    return res.ok && (await res.json()).exists;
  };

  // CRUD
  const saveServant = async (e: React.FormEvent, id?: number) => {
    e.preventDefault();
    if (!validate()) return;
    if (await checkEmail(form.email, id)) return setErrors({ email: 'Email taken' });

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => v !== null && fd.append(k, v as any));

    const res = await fetch(id ? `/api/servants/${id}` : '/api/servants', {
      method: id ? 'PUT' : 'POST',
      body: fd,
    });

    if (res.ok) {
      setOpenCreate(false); setOpenEdit(false); resetForm();
      fetch('/api/servants').then(r => r.json().then(setServants));
    } else console.warn('Save failed');
  };

  const deleteServant = async (id: number) => {
    if (!confirm('Delete caregiver?')) return;
    await fetch(`/api/servants/${id}`, { method: 'DELETE' });
    setServants(s => s.filter(x => x.id !== id));
  };

  const updateRoom = async (id: number, roomId: string) => {
    await fetch(`/api/servants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedRoomId: roomId === 'none' ? null : +roomId }),
    });
    setServants(s => s.map(x => x.id === id ? { ...x, assignedRoomId: roomId === 'none' ? null : +roomId } : x));
  };

  const transferCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer.caregiverId || !transfer.roomId) return;
    await fetch(`/api/servants/${transfer.caregiverId}`, {
      method: 'PUT',
      body: new FormData(Object.entries({ assignedRoomId: transfer.roomId }).reduce((f, [k, v]) => (f.append(k, v), f), new FormData())),
    });
    setOpenTransfer(false);
    fetch('/api/servants').then(r => r.json().then(setServants));
  };

  const assignChildrenFn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assign.caregiverId || !assign.selectedChildren.length) return;
    await fetch('/api/children/assign-caregiver', {
      method: 'POST',
      body: new FormData(Object.entries({
        assignedServantId: assign.caregiverId,
        childIds: JSON.stringify(assign.selectedChildren),
      }).reduce((f, [k, v]) => (f.append(k, v), f), new FormData())),
    });
    setOpenAssign(false);
    fetch('/api/children').then(r => r.json().then(setChildren));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><div className="h-8 w-48 bg-muted rounded animate-pulse" /></CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" /> Caregivers
            </CardTitle>
            <p className="text-sm text-muted-foreground">Manage caregivers and assignments</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 w-64"
              />
            </div>

            <Dialog open={openAssign} onOpenChange={setOpenAssign}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setAssign({ caregiverId: '', selectedChildren: [] })}>
                  <Users className="h-4 w-4 mr-1" /> Assign
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setTransfer({ caregiverId: '', roomId: '' })}>
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> Transfer
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => { resetForm(); setOpenCreate(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Room</th>
                  <th className="text-left p-3 font-medium">Org</th>
                  <th className="text-left p-3 font-medium">Medical Report</th>
                  <th className="text-center p-3 font-medium">Kids</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginated.map(s => {
                  const room = rooms.find(r => r.id === s.assignedRoomId);
                  const assignedChildren = children.filter(c => c.assignedServantId === s.id);
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{s.fullName}</td>
                      <td className="p-3 text-muted-foreground">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</div>
                          <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Select value={s.assignedRoomId?.toString() ?? 'none'} onValueChange={v => updateRoom(s.id, v)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {rooms.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs">{s.site}</Badge>
                          <Badge variant="outline" className="text-xs">{s.organizationType}</Badge>
                        </div>
                      </td>
                      <td className="p-3">
                        {s.medicalReport ? (
                          <a href={s.medicalReport} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">View</a>
                        ) : (
                          <span className="text-xs text-muted-foreground">No report</span>
                        )}
                      </td>
                      <td className="p-3 text-center align-top">
                        <Badge variant={assignedChildren.length ? 'default' : 'secondary'} className="text-xs mb-1">{assignedChildren.length}</Badge>
                        {assignedChildren.length > 0 && (
                          <div className="mt-1 space-y-1 text-xs text-left">
                            {assignedChildren.map(child => (
                              <div key={child.id} className="border p-1 rounded mb-1 bg-muted/30">
                                <div><b>Name:</b> {child.fullName}</div>
                                <div><b>Gender:</b> {child.gender}</div>
                                <div><b>DOB:</b> {typeof child.dateOfBirth === 'string' ? child.dateOfBirth : new Date(child.dateOfBirth).toLocaleDateString()}</div>
                                {/* Add more fields here if needed */}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                          setSelected(s); setForm({
                            fullName: s.fullName, email: s.email ?? '', phone: s.phone,
                            assignedRoomId: s.assignedRoomId?.toString() ?? 'none',
                            site: s.site, organizationType: s.organizationType, medicalReportFile: null,
                          }); setOpenEdit(true);
                        }}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteServant(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-3 border-t text-sm text-muted-foreground">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={openCreate || openEdit} onOpenChange={openEdit ? setOpenEdit : setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{openEdit ? 'Edit' : 'Add'} Caregiver</DialogTitle>
          </DialogHeader>
          <CaregiverForm
            rooms={rooms}
            form={form}
            errors={errors}
            isSubmitting={false}
            onChange={setForm}
            onSubmit={e => saveServant(e, selected?.id)}
          />
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={openTransfer} onOpenChange={setOpenTransfer}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Transfer Caregiver</DialogTitle></DialogHeader>
          <form onSubmit={transferCaregiver} className="space-y-3">
            <Select value={transfer.caregiverId} onValueChange={v => setTransfer(t => ({ ...t, caregiverId: v }))}>
              <SelectTrigger><SelectValue placeholder="Caregiver" /></SelectTrigger>
              <SelectContent>{servants.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={transfer.roomId} onValueChange={v => setTransfer(t => ({ ...t, roomId: v }))}>
              <SelectTrigger><SelectValue placeholder="Room" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {rooms.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full">Transfer</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={openAssign} onOpenChange={setOpenAssign}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Children</DialogTitle></DialogHeader>
          <form onSubmit={assignChildrenFn} className="space-y-3">
            <Select value={assign.caregiverId} onValueChange={v => setAssign(a => ({ ...a, caregiverId: v }))}>
              <SelectTrigger><SelectValue placeholder="Caregiver" /></SelectTrigger>
              <SelectContent>{servants.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}</SelectContent>
            </Select>
            <div className="max-h-48 overflow-auto border rounded p-2 space-y-1">
              {children.map(c => (
                <label key={c.id} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={assign.selectedChildren.includes(c.id)}
                    onChange={e => setAssign(a => ({
                      ...a,
                      selectedChildren: e.target.checked
                        ? [...a.selectedChildren, c.id]
                        : a.selectedChildren.filter(id => id !== c.id)
                    }))}
                  />
                  {c.fullName}
                </label>
              ))}
            </div>
            <Button type="submit" className="w-full">Assign</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}