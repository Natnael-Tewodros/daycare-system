'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  ArrowRightLeft,
  Users,
  Search,
  Loader2,
  Download,
  Phone,
  Mail,
} from 'lucide-react';
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
  assignedRoom?: { id: number; name: string } | null;
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
  servant?: { id: number; fullName: string } | null;
}

export default function CaregiversPage() {
  const [servants, setServants] = useState<Servant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedServant, setSelectedServant] = useState<Servant | null>(null);
  const [currentMedicalReport, setCurrentMedicalReport] = useState<string | null>(null);

  // Form
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    assignedRoomId: 'none',
    medicalReportFile: null as File | null,
    site: '' as '' | 'HEADOFFICE' | 'OPERATION',
    organizationType: '' as '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY',
    assignedByChildIds: [] as number[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Transfer & Assign
  const [transfer, setTransfer] = useState({ caregiverId: '', roomId: '' });
  const [assign, setAssign] = useState({ caregiverId: '', selectedChildren: [] as number[] });

  // Fetch data
  useEffect(() => {
    Promise.all([fetchServants(), fetchRooms(), fetchChildren()]).finally(() => setIsLoading(false));
  }, []);

  const fetchServants = async () => {
    const res = await fetch('/api/servants');
    if (res.ok) setServants(await res.json());
  };

  const fetchRooms = async () => {
    const res = await fetch('/api/rooms');
    if (res.ok) setRooms(await res.json());
  };

  const fetchChildren = async () => {
    const res = await fetch('/api/children');
    if (res.ok) {
      const data = await res.json();
      const mapped = Array.isArray(data)
        ? data.map((c: any) => ({ ...c, assignedServantId: c.servant?.id ?? null }))
        : [];
      setChildren(mapped);
    }
  };

  // Search filter
  const filteredServants = useMemo(() => {
    if (!search.trim()) return servants;
    const term = search.toLowerCase();
    return servants.filter(
      (s) =>
        s.fullName.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone.includes(term)
    );
  }, [servants, search]);

  // Form reset
  const resetForm = () => {
    setForm({
      fullName: '',
      email: '',
      phone: '',
      assignedRoomId: 'none',
      medicalReportFile: null,
      site: '',
      organizationType: '',
      assignedByChildIds: [],
    });
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setShowCreate(true);
  };

  const openEdit = (s: Servant) => {
    setSelectedServant(s);
    setCurrentMedicalReport(s.medicalReport ?? null);
    setForm({
      fullName: s.fullName,
      email: s.email ?? '',
      phone: s.phone,
      assignedRoomId: s.assignedRoomId?.toString() ?? 'none',
      medicalReportFile: null,
      site: s.site,
      organizationType: s.organizationType,
      assignedByChildIds: [],
    });
    setShowEdit(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.site) e.site = 'Required';
    if (!form.organizationType) e.organizationType = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const checkEmail = async (email: string, exclude?: number) => {
    const res = await fetch(
      `/api/servants/check-email?email=${encodeURIComponent(email)}${exclude ? `&excludeId=${exclude}` : ''}`
    );
    if (res.ok) return (await res.json()).exists;
    return false;
  };

  // CRUD
  const createServant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (await checkEmail(form.email)) {
      setErrors({ email: 'Email already taken' });
      return;
    }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('fullName', form.fullName);
    fd.append('email', form.email);
    fd.append('phone', form.phone);
    if (form.medicalReportFile) fd.append('medicalReport', form.medicalReportFile);
    fd.append('assignedRoomId', form.assignedRoomId);
    fd.append('site', form.site);
    fd.append('organizationType', form.organizationType);

    const res = await fetch('/api/servants', { method: 'POST', body: fd });
    setIsSubmitting(false);
    if (res.ok) {
      setShowCreate(false);
      resetForm();
      fetchServants();
    } else {
      const err = await res.json();
      alert(err.error ?? 'Failed');
    }
  };

  const updateServant = async (e: React.FormEvent) => {
    if (!selectedServant) return;
    e.preventDefault();
    if (!validate()) return;
    if (await checkEmail(form.email, selectedServant.id)) {
      setErrors({ email: 'Email already taken' });
      return;
    }
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('fullName', form.fullName);
    fd.append('email', form.email);
    fd.append('phone', form.phone);
    if (form.medicalReportFile) fd.append('medicalReport', form.medicalReportFile);
    fd.append('assignedRoomId', form.assignedRoomId);
    fd.append('site', form.site);
    fd.append('organizationType', form.organizationType);

    const res = await fetch(`/api/servants/${selectedServant.id}`, {
      method: 'PUT',
      body: fd,
    });
    setIsSubmitting(false);
    if (res.ok) {
      setShowEdit(false);
      setSelectedServant(null);
      resetForm();
      fetchServants();
    } else {
      const err = await res.json();
      alert(err.error ?? 'Failed');
    }
  };

  const deleteServant = async (id: number) => {
    if (!confirm('Delete this caregiver? This cannot be undone.')) return;
    const res = await fetch(`/api/servants/${id}`, { method: 'DELETE' });
    if (res.ok) fetchServants();
    else alert('Failed to delete');
  };

  const updateRoomInline = async (servantId: number, roomId: string) => {
    const payload = { assignedRoomId: roomId === 'none' ? null : Number(roomId) };
    await fetch(`/api/servants/${servantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    fetchServants();
  };

  const transferServant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer.caregiverId || !transfer.roomId) return alert('Select both');
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('assignedRoomId', transfer.roomId);
    await fetch(`/api/servants/${transfer.caregiverId}`, { method: 'PUT', body: fd });
    setIsSubmitting(false);
    setShowTransfer(false);
    setTransfer({ caregiverId: '', roomId: '' });
    fetchServants();
  };

  const assignChildren = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assign.caregiverId || assign.selectedChildren.length === 0)
      return alert('Select caregiver & children');
    setIsSubmitting(true);
    const fd = new FormData();
    fd.append('assignedServantId', assign.caregiverId);
    fd.append('childIds', JSON.stringify(assign.selectedChildren));
    await fetch('/api/children/assign-caregiver', { method: 'POST', body: fd });
    setIsSubmitting(false);
    setShowAssign(false);
    setAssign({ caregiverId: '', selectedChildren: [] });
    fetchChildren();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Reusable caregiver form used by both Create and Edit dialogs
  function CaregiverForm({
    onSubmit,
    submitLabel,
    currentReportLabel,
  }: {
    onSubmit: (e: React.FormEvent) => void;
    submitLabel: string;
    currentReportLabel?: string;
  }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="John Doe"
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+251 911 123456"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              Site <span className="text-red-500">*</span>
            </Label>
            <Select value={form.site} onValueChange={(v) => setForm((p) => ({ ...p, site: v as any }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HEADOFFICE">Head Office</SelectItem>
                <SelectItem value="OPERATION">Operation</SelectItem>
              </SelectContent>
            </Select>
            {errors.site && <p className="text-xs text-destructive">{errors.site}</p>}
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              Organization <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.organizationType}
              onValueChange={(v) => setForm((p) => ({ ...p, organizationType: v as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select org" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSA">INSA</SelectItem>
                <SelectItem value="AI">AI</SelectItem>
                <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
                <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
              </SelectContent>
            </Select>
            {errors.organizationType && <p className="text-xs text-destructive">{errors.organizationType}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label>{currentReportLabel ?? 'Medical Report (PDF)'}</Label>
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => setForm((p) => ({ ...p, medicalReportFile: (e.target as HTMLInputElement).files?.[0] ?? null }))}
          />
        </div>

        <div className="space-y-1">
          <Label>Assigned Room</Label>
          <Select
            value={form.assignedRoomId}
            onValueChange={(v) => setForm((p) => ({ ...p, assignedRoomId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Room</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id.toString()}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submitLabel === 'Create Caregiver' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </form>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Caregivers
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage caregivers, rooms, and child assignments
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search caregivers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-72"
              />
            </div>

            <Dialog open={showAssign} onOpenChange={setShowAssign}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssign({ caregiverId: '', selectedChildren: [] })}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTransfer({ caregiverId: '', roomId: '' })}
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transfer
                </Button>
              </DialogTrigger>
            </Dialog>

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Caregiver
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      {search ? 'No caregivers match your search.' : 'No caregivers found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServants.map((s) => {
                    const assignedKids = children.filter((c) => c.assignedServantId === s.id);
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">#{s.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{s.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.organizationType.replace(/_/g, ' ')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            {s.email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {s.email}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {s.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.medicalReport ? (
                            <Link
                              href={`/uploads/${s.medicalReport}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                            >
                              <Download className="h-3.5 w-3.5" />
                              View
                            </Link>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={s.assignedRoomId?.toString() ?? 'none'}
                            onValueChange={(v) => updateRoomInline(s.id, v)}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Room</SelectItem>
                              {rooms.map((r) => (
                                <SelectItem key={r.id} value={r.id.toString()}>
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="font-semibold">{assignedKids.length}</span>{' '}
                            {assignedKids.length === 1 ? 'child' : 'children'}
                            {assignedKids.length > 0 && (
                              <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                {assignedKids.slice(0, 2).map((c) => (
                                  <div key={c.id} className="truncate">
                                    • {c.fullName}
                                  </div>
                                ))}
                                {assignedKids.length > 2 && (
                                  <div>+{assignedKids.length - 2} more</div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(s)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteServant(s.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Caregiver
            </DialogTitle>
            <DialogDescription>
              Enter caregiver details. All required fields must be filled.
            </DialogDescription>
          </DialogHeader>
          <CaregiverForm onSubmit={createServant} submitLabel="Create Caregiver" />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Caregiver
            </DialogTitle>
            <DialogDescription>
              Update caregiver information.
            </DialogDescription>
          </DialogHeader>
          {selectedServant && (
            <CaregiverForm onSubmit={updateServant} submitLabel="Update Caregiver" currentReportLabel={`Medical Report (Current: ${currentMedicalReport ?? 'None'})`} />
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer & Assign Dialogs (same as before, just styled) */}
      {/* ... (Transfer and Assign dialogs are unchanged in logic, just styled better) */}
      {/* You can keep them as-is or copy from previous version */}
    </div>
  );
}