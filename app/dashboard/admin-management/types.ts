export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: 'ADMIN' | 'PARENT';
  createdAt: string;
}

export interface EnrollmentRequest {
  id: number;
  parentName: string;
  childName: string;
  childAge: number;
  email: string;
  phone?: string;
  preferredStartDate?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  visibilityDays: number | null;
  createdAt: string;
  updatedAt: string;
}


