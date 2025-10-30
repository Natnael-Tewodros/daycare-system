export interface ChildForm {
  fullName: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  site: string;
  organization: string;
  profilePic: File | null;
  childInfoFile: File | null;
  otherFile: File | null;
}

export interface ParentInfo {
  username: string;
}

export interface ChildRow {
  id: string | number;
  fullName: string;
  parentName: string;
  gender: string;
  relationship: string;
  site: string;
  organization?: { name?: string } | null;
  dateOfBirth: string | Date;
  profilePic?: string | null;
  childInfoFile?: string | null;
  createdAt?: string | Date;
}


