"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ChildForm } from "@/app/dashboard/children/types";

type ChildFormCardProps = {
  child: ChildForm;
  index: number;
  formCount: number;
  isLoading: boolean;
  onChildChange: (
    index: number,
    field: keyof ChildForm,
    value: string | File | null
  ) => void;
  onSubmit: (child: ChildForm, index: number) => void;
  onRemove: (index: number) => void;
};

export default function ChildFormCard({
  child,
  index,
  formCount,
  isLoading,
  onChildChange,
  onSubmit,
  onRemove,
}: ChildFormCardProps) {
  return (
    <Card
      key={index}
      className="shadow-lg border border-slate-200 rounded-xl transition-all hover:shadow-xl"
    >
      <CardHeader className="bg-slate-50 rounded-t-xl flex items-center justify-between">
        <CardTitle className="text-xl font-semibold text-slate-800">
          Child Information {formCount > 1 ? `#${index + 1}` : ""}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          className="text-slate-500 hover:text-red-600"
          aria-label="Remove child form"
        >
          ✖
        </Button>
      </CardHeader>
      <div className="px-6 pt-3 text-xs text-slate-500">Fields marked with <span className="text-red-600">*</span> are required.</div>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div>
          <Label className="text-sm font-medium text-slate-700">Full Name <span className="text-red-600">*</span></Label>
          <Input
            value={child.fullName}
            onChange={(e) => onChildChange(index, "fullName", e.target.value)}
            className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter child's full name"
            aria-required="true"
            required
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Relationship <span className="text-red-600">*</span></Label>
          <Select
            value={child.relationship}
            onValueChange={(v) => onChildChange(index, "relationship", v)}
          >
            <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500" aria-required="true">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FATHER">Father</SelectItem>
              <SelectItem value="MOTHER">Mother</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {child.relationship === "OTHER" && (
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Upload Document for Other (PDF only)
            </Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => onChildChange(index, "otherFile", e.target.files?.[0] || null)}
              className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <Label className="text-sm font-medium text-slate-700">Gender <span className="text-red-600">*</span></Label>
          <Select
            value={child.gender}
            onValueChange={(v) => onChildChange(index, "gender", v)}
          >
            <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500" aria-required="true">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Date of Birth <span className="text-red-600">*</span></Label>
          <Input
            type="date"
            value={child.dateOfBirth}
            onChange={(e) => onChildChange(index, "dateOfBirth", e.target.value)}
            className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
            aria-required="true"
            required
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Site <span className="text-red-600">*</span></Label>
          <Select
            value={child.site}
            onValueChange={(v) => onChildChange(index, "site", v)}
          >
            <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500" aria-required="true">
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HEADOFFICE">Head Office</SelectItem>
              <SelectItem value="OPERATION">Operation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Organization <span className="text-red-600">*</span></Label>
          <Select
            value={child.organization}
            onValueChange={(v) => onChildChange(index, "organization", v)}
          >
            <SelectTrigger className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500" aria-required="true">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INSA">INSA</SelectItem>
              <SelectItem value="AI">AI</SelectItem>
              <SelectItem value="MINISTRY_OF_PEACE">Ministry of Peace</SelectItem>
              <SelectItem value="FINANCE_SECURITY">Finance Security</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Profile Picture (Images only)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => onChildChange(index, "profilePic", e.target.files?.[0] || null)}
            className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">Child Info File (PDF only)</Label>
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => onChildChange(index, "childInfoFile", e.target.files?.[0] || null)}
            className="mt-1 border-slate-300 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 rounded-b-xl">
        <Button
          onClick={() => onSubmit(child, index)}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "✅ Register This Child"}
        </Button>
      </CardFooter>
    </Card>
  );
}



