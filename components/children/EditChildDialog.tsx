"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import type { ChildForm } from "@/app/dashboard/children/types";

type EditChildDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoading: boolean;
  editFormData: ChildForm;
  setEditFormData: (value: ChildForm) => void;
  onSubmit: () => void;
};

export default function EditChildDialog({
  open,
  onOpenChange,
  isLoading,
  editFormData,
  setEditFormData,
  onSubmit,
}: EditChildDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Child Information</DialogTitle>
          <DialogDescription>
            Update the child information below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                placeholder="Enter child's full name"
              />
            </div>
            <div>
              <Label htmlFor="edit-relationship">Relationship *</Label>
              <Input
                id="edit-relationship"
                value={editFormData.relationship}
                onChange={(e) => setEditFormData({ ...editFormData, relationship: e.target.value })}
                placeholder="e.g., Son, Daughter"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-gender">Gender *</Label>
              <Select
                value={editFormData.gender}
                onValueChange={(value) => setEditFormData({ ...editFormData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-dateOfBirth">Date of Birth *</Label>
              <Input
                id="edit-dateOfBirth"
                type="date"
                value={editFormData.dateOfBirth}
                onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-site">Site *</Label>
              <Select
                value={editFormData.site}
                onValueChange={(value) => setEditFormData({ ...editFormData, site: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEADOFFICE">HEADOFFICE</SelectItem>
                  <SelectItem value="BRANCH1">BRANCH1</SelectItem>
                  <SelectItem value="BRANCH2">BRANCH2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-organization">Organization *</Label>
              <Select
                value={editFormData.organization}
                onValueChange={(value) => setEditFormData({ ...editFormData, organization: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSA">INSA</SelectItem>
                  <SelectItem value="OTHER">OTHER</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-profilePic">Profile Picture</Label>
              <Input
                id="edit-profilePic"
                type="file"
                accept="image/*"
                onChange={(e) => setEditFormData({ ...editFormData, profilePic: e.target.files?.[0] || null })}
              />
            </div>
            <div>
              <Label htmlFor="edit-childInfoFile">Child Information File</Label>
              <Input
                id="edit-childInfoFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setEditFormData({ ...editFormData, childInfoFile: e.target.files?.[0] || null })}
              />
            </div>
            <div>
              <Label htmlFor="edit-otherFile">Other File</Label>
              <Input
                id="edit-otherFile"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={(e) => setEditFormData({ ...editFormData, otherFile: e.target.files?.[0] || null })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Updating..." : "Update Child"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



