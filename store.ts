
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CareState, Medicine, Dose, DoseStatus, HistoryEntry, Interaction } from './types';

interface CareStore extends CareState {
  addMedicines: (medicines: Medicine[]) => void;
  toggleDose: (doseId: string, status: DoseStatus) => void;
  clearAll: () => void;
  generateSchedule: (medicines: Medicine[]) => void;
  addRemedy: (name: string) => void;
  removeRemedy: (name: string) => void;
  updateInteractions: (interactions: Record<string, Interaction>) => void;
}

export const useCareStore = create<CareStore>()(
  persist(
    (set) => ({
      medicines: [],
      doses: [],
      history: [],
      remedies: [],
      lastExtractionDate: null,

      addMedicines: (newMedicines) => set((state) => ({
        medicines: [...state.medicines, ...newMedicines],
      })),

      addRemedy: (name) => set((state) => ({
        remedies: state.remedies.includes(name) ? state.remedies : [...state.remedies, name]
      })),

      removeRemedy: (name) => set((state) => ({
        remedies: state.remedies.filter(r => r !== name)
      })),

      updateInteractions: (interactions) => set((state) => ({
        medicines: state.medicines.map(med => ({
          ...med,
          potentialInteractions: interactions[med.id] || undefined
        }))
      })),

      generateSchedule: (newMedicines) => set((state) => {
        const today = new Date();
        const newDoses: Dose[] = [];

        newMedicines.forEach((med) => {
          for (let i = 0; i < 10; i++) { // Generate for 10 days
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            med.timings.forEach((slot) => {
              newDoses.push({
                id: `${med.id}-${dateStr}-${slot}`,
                medicineId: med.id,
                medicineName: med.name,
                date: dateStr,
                timeSlot: slot,
                status: DoseStatus.PENDING,
              });
            });
          }
        });

        return {
          medicines: [...state.medicines, ...newMedicines],
          doses: [...state.doses, ...newDoses],
          lastExtractionDate: new Date().toISOString(),
        };
      }),

      toggleDose: (doseId, status) => set((state) => {
        const targetDose = state.doses.find(d => d.id === doseId);
        if (!targetDose) return state;

        if (targetDose.status === status) return state;

        const historyEntry: HistoryEntry = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          medicineName: targetDose.medicineName,
          timeSlot: targetDose.timeSlot,
          date: targetDose.date,
          timestamp: new Date().toISOString(),
          status
        };

        return {
          doses: state.doses.map((d) => 
            d.id === doseId ? { ...d, status } : d
          ),
          history: [historyEntry, ...state.history].slice(0, 100)
        };
      }),

      clearAll: () => set({ medicines: [], doses: [], history: [], remedies: [], lastExtractionDate: null }),
    }),
    {
      name: 'care-companion-storage',
    }
  )
);
