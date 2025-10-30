"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Edit, Mail, Phone } from "lucide-react";
import type { Servant, Room, ChildRow } from "@/app/dashboard/caregiver/types";

type CaregiversTableProps = {
  servants: Servant[];
  rooms: Room[];
  children: ChildRow[];
  onUpdateRoomInline: (servantId: number, roomId: string) => void;
  onOpenEdit: (s: Servant) => void;
  onDelete: (id: number) => void;
};

export default function CaregiversTable({ servants, rooms, children, onUpdateRoomInline, onOpenEdit, onDelete }: CaregiversTableProps) {
  return (
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
          {servants.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                No caregivers found.
              </TableCell>
            </TableRow>
          ) : (
            servants.map((s) => {
              const assignedKids = children.filter((c) => c.assignedServantId === s.id);
              return (
                <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">#{s.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.organizationType.replace(/_/g, " ")}</p>
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
                      <Link href={`/uploads/${s.medicalReport}`} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                        <Download className="h-3.5 w-3.5" />
                        View
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select value={s.assignedRoomId?.toString() ?? "none"} onValueChange={(v) => onUpdateRoomInline(s.id, v)}>
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
                      <span className="font-semibold">{assignedKids.length}</span> {assignedKids.length === 1 ? "child" : "children"}
                      {assignedKids.length > 0 && (
                        <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                          {assignedKids.slice(0, 2).map((c) => (
                            <div key={c.id} className="truncate">• {c.fullName}</div>
                          ))}
                          {assignedKids.length > 2 && <div>+{assignedKids.length - 2} more</div>}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(s.createdAt as any).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => onOpenEdit(s)} className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(s.id)}>
                        ✕
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
  );
}



