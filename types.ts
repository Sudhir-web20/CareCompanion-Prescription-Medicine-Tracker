
export enum DoseStatus {
  PENDING = 'pending',
  TAKEN = 'taken',
  MISSED = 'missed'
}

export interface Interaction {
  severity: 'high' | 'medium';
  summary: string;
  detail: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g., "Twice daily"
  timings: string[]; // e.g., ["Morning", "Night"]
  durationDays: number;
  potentialInteractions?: Interaction;
}

export interface Dose {
  id: string;
  medicineId: string;
  medicineName: string;
  date: string; // ISO string (YYYY-MM-DD)
  timeSlot: string; // "Morning", "Afternoon", "Evening", "Night"
  status: DoseStatus;
}

export interface HistoryEntry {
  id: string;
  medicineName: string;
  timeSlot: string;
  date: string; // The date of the dose
  timestamp: string; // When the change happened
  status: DoseStatus;
}

export interface CareState {
  medicines: Medicine[];
  doses: Dose[];
  history: HistoryEntry[];
  remedies: string[];
  lastExtractionDate: string | null;
}
