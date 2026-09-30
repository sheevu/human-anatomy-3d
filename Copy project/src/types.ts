export type Row = {
  name: string;
  value: string;
  unit: string;
  range: string;
  status?: string;
  organ?: string | null;
};

export type Profile = {
  id: string;
  name: string;
  relationship: string;
  dob: string;
  bloodGroup: string;
  notes: string;
  authorized?: boolean;
};

export type Report = {
  id: string;
  title: string;
  date: string;
  lab: string;
  type: 'lab' | 'prescription' | 'medicine';
  rows: Row[];
  text: string;
  medicines: string;
  verified: true;
  fileId?: string | null;
  createdAt?: string;
};

export type KYCData = {
  fullName: string;
  nationality: string;
  country: string;
  stateCity: string;
  idType: string;
  idNumber: string;
  dob: string;
  gender: string;
  phone: string;
  consent: boolean;
};

export type User = {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
  kycVerified?: boolean;
  phone?: string;
  dob?: string;
  gender?: string;
  kyc?: KYCData;
};

export type ServiceStatus = {
  storage: string;
  ocr: string;
  ai: boolean;
  medicine: string;
};

export type DiabetesRecord = {
  id: string;
  profileId: string;
  date: string;
  time: string;
  timing: 'before_food' | 'after_food' | 'bedtime' | 'random';
  value: number;
  unit: 'mg/dL';
  notes?: string;
  status: 'low' | 'normal' | 'elevated' | 'high';
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  language: 'en' | 'hi';
  suggestedQuestions?: string[];
};
