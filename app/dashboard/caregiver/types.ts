export interface Servant {
  id: number;
  fullName: string;
  email: string | null;
  phone: string;
  medicalReport?: string | null;
  assignedRoomId?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  site: 'HEADOFFICE' | 'OPERATION';
  organizationType: 'INSA' | 'AI' | 'MINISTRY_OF_PEACE' | 'FINANCE_SECURITY';
  assignedRoom?: { id: number; name: string } | null;
}

export interface Room {
  id: number;
  name: string;
}

export interface ChildRow {
  id: number;
  fullName: string;
  dateOfBirth: string | Date;
  gender: string;
  assignedServantId?: number | null;
  servant?: { id: number; fullName: string } | null;
}


