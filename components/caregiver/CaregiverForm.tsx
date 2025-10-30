"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Room } from "@/app/dashboard/caregiver/types";

type CaregiverFormProps = {
  rooms: Room[];
  form: {
    fullName: string;
    email: string;
    phone: string;
    assignedRoomId: string;
    medicalReportFile: File | null;
    site: '' | 'HEADOFFICE' | 'OPERATION';
    organizationType: '' | 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY';
  };
  errors: Record<string, string>;
  isSubmitting: boolean;
  currentReportLabel?: string;
  onChange: (patch: Partial<CaregiverFormProps["form"]>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function CaregiverForm({ rooms, form, errors, isSubmitting, currentReportLabel, onChange, onSubmit }: CaregiverFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="flex items-center gap-1">Full Name <span className="text-red-500">*</span></Label>
          <Input value={form.fullName} onChange={(e) => onChange({ fullName: e.target.value })} placeholder="John Doe" />
          {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-1">Phone <span className="text-red-500">*</span></Label>
          <Input value={form.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+251 911 123456" />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="flex items-center gap-1">Email <span className="text-red-500">*</span></Label>
        <Input type="email" value={form.email} onChange={(e) => onChange({ email: e.target.value })} placeholder="john@example.com" />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="flex items-center gap-1">Site <span className="text-red-500">*</span></Label>
          <Select value={form.site} onValueChange={(v) => onChange({ site: v as any })}>
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
          <Label className="flex items-center gap-1">Organization <span className="text-red-500">*</span></Label>
          <Select value={form.organizationType} onValueChange={(v) => onChange({ organizationType: v as any })}>
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
        <Input type="file" accept=".pdf" onChange={(e) => onChange({ medicalReportFile: (e.target as HTMLInputElement).files?.[0] ?? null })} />
      </div>

      <div className="space-y-1">
        <Label>Assigned Room</Label>
        <Select value={form.assignedRoomId} onValueChange={(v) => onChange({ assignedRoomId: v })}>
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
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}



