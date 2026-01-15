import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Heart, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Pill, 
  Loader2, 
  Trash2, 
  Plus,
  Info,
  ClipboardList,
  X,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Clock,
  History,
  Sparkles,
  FileSearch,
  LayoutGrid,
  Activity,
  AlertTriangle,
  Beaker,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { useCareStore } from './store';
import { parsePrescription, checkInteractions } from './geminiService';
import { DoseStatus, Medicine } from './types';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const formatTime = (isoStr: string) => {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const getTimingIcon = (slot: string) => {
  const s = slot.toLowerCase();
  if (s.includes('morning')) return <Sunrise className="w-4 h-4" />;
  if (s.includes('afternoon')) return <Sun className="w-4 h-4" />;
  if (s.includes('evening')) return <Sunset className="w-4 h-4" />;
  if (s.includes('night')) return <Moon className="w-4 h-4" />;
  return <Clock className="w-4 h-4" />;
};

const getStatusColor = (status: DoseStatus) => {
  switch (status) {
    case DoseStatus.TAKEN: return 'text-green-500 bg-green-50';
    case DoseStatus.MISSED: return 'text-red-500 bg-red-50';
    default: return 'text-gray-400 bg-gray-50';
  }
};

type ProcessingStep = 'idle' | 'scanning' | 'analyzing' | 'organizing';

const App: React.FC = () => {
  const { 
    medicines, 
    doses, 
    history, 
    remedies, 
    generateSchedule, 
    toggleDose, 
    clearAll, 
    addRemedy, 
    removeRemedy, 
    updateInteractions 
  } = useCareStore();
  
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [remedyInput, setRemedyInput] = useState('');
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = processingStep !== 'idle';
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isUploading) {
      interval = window.setInterval(() => {
        setProgressValue(prev => {
          if (prev >= 95) return prev;
          return prev + (Math.random() * 5);
        });
      }, 300);
    } else {
      setProgressValue(0);
    }
    return () => clearInterval(interval);
  }, [isUploading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingStep('scanning');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setTimeout(() => setProcessingStep('analyzing'), 1000);
        const extractedMedicines = await parsePrescription(base64);
        setProcessingStep('organizing');
        await new Promise(resolve => setTimeout(resolve, 800));

        if (extractedMedicines.length > 0) {
          generateSchedule(extractedMedicines);
          toast.success(`Schedule updated with ${extractedMedicines.length} items!`);
        } else {
          toast.error("I couldn't find any clear medicine details.");
        }
        setProcessingStep('idle');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to read prescription.");
      setProcessingStep('idle');
    }
  };

  const handleAddRemedy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remedyInput.trim()) return;
    addRemedy(remedyInput.trim());
    setRemedyInput('');
  };

  const handleCheckInteractions = async () => {
    if (medicines.length === 0 || remedies.length === 0) {
      toast.error("Need both prescriptions and OTC remedies to check.");
      return;
    }
    setIsCheckingInteractions(true);
    const loadingToast = toast.loading("Analyzing safety and interactions...");
    try {
      const interactions = await checkInteractions(medicines, remedies);
      updateInteractions(interactions);
      const count = Object.keys(interactions).length;
      if (count > 0) {
        toast.error(`Caution: Found ${count} potential interactions.`, { id: loadingToast });
      } else {
        toast.success("No critical interactions found.", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Failed to check interactions.", { id: loadingToast });
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const currentDoses = doses.filter(d => d.date === selectedDate);
  const uniqueDates: string[] = Array.from(new Set(doses.map(d => d.date))).sort() as string[];
  
  const dailyProgress = useMemo(() => {
    if (currentDoses.length === 0) return 0;
    const taken = currentDoses.filter(d => d.status === DoseStatus.TAKEN).length;
    return Math.round((taken / currentDoses.length) * 100);
  }, [currentDoses]);

  const getProcessingMessage = () => {
    switch (processingStep) {
      case 'scanning': return { title: 'Scanning Image', icon: <FileSearch />, desc: 'digitizing your prescription...' };
      case 'analyzing': return { title: 'AI Analysis', icon: <Sparkles />, desc: 'extracting medicine names and dosages...' };
      case 'organizing': return { title: 'Organizing Care', icon: <LayoutGrid />, desc: 'setting up your weekly schedule...' };
      default: return { title: '', icon: null, desc: '' };
    }
  };

  const procInfo = getProcessingMessage();

  return (
    <div className="min-h-screen bg-[#FFF8F9] text-gray-900 pb-32">
      <Toaster position="top-center" />
      
      {/* Sleek Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-rose-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 p-2 rounded-xl shadow-lg shadow-rose-200">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">CareCompanion</h1>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest leading-none">Healthy Together</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {medicines.length > 0 && (
              <button 
                onClick={() => setShowHistory(true)}
                className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                title="Activity Log"
                aria-label="View Activity Log"
              >
                <Activity className="w-5 h-5" />
              </button>
            )}
            {medicines.length > 0 && (
              <button 
                onClick={() => window.confirm("Clear all data and schedules?") && clearAll()}
                className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                title="Clear Data"
                aria-label="Clear All Data"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-8">
        {medicines.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-rose-200 blur-3xl rounded-full opacity-30 animate-pulse" />
              <div className="relative bg-white p-8 rounded-[40px] shadow-2xl shadow-rose-100 border border-rose-50">
                <Upload className="w-16 h-16 text-rose-300 mx-auto" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 font-display">Start Her Care Plan</h2>
            <p className="text-gray-500 max-w-xs mb-8">
              Simply snap a photo of the doctor's prescription. AI will handle the scheduling for you.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-rose-200 active:scale-95 disabled:opacity-50 overflow-hidden"
            >
              {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
              {isUploading ? "Processing..." : "Upload New Prescription"}
            </button>
            <input 
              type="file" 
              id="prescription-upload-main"
              name="prescription_main"
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <aside className="lg:col-span-1 space-y-6">
              {/* Prescribed Plan */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-rose-100/50">
                <div className="flex items-center gap-2 mb-6">
                  <ClipboardList className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-gray-800 font-display">Prescribed Plan</h3>
                </div>
                <div className="space-y-4">
                  {medicines.map((med) => (
                    <motion.div 
                      key={med.id}
                      onClick={() => setViewingMedicine(med)}
                      className="group p-4 rounded-2xl bg-rose-50/50 border border-rose-100 hover:bg-rose-50 transition-all cursor-pointer hover:shadow-md hover:shadow-rose-100/50 active:scale-95"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-bold text-gray-800 text-sm leading-tight group-hover:text-rose-600 transition-colors truncate">{med.name}</span>
                          {med.potentialInteractions && (
                            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 animate-pulse ${med.potentialInteractions.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                          )}
                        </div>
                        <Info className="w-3.5 h-3.5 text-rose-300 group-hover:text-rose-500 transition-colors" />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-[10px] font-bold px-2 py-1 bg-white rounded-full text-rose-500 uppercase tracking-tighter border border-rose-100">
                          {med.dosage}
                        </span>
                        <span className="text-[10px] font-medium px-2 py-1 bg-white rounded-full text-gray-500 border border-gray-100">
                          {med.frequency}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Remedies & OTC Section */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-blue-100/50">
                <div className="flex items-center gap-2 mb-4">
                   <Beaker className="w-5 h-5 text-blue-500" />
                   <h3 className="font-bold text-gray-800 font-display">OTC & Remedies</h3>
                </div>
                
                <form onSubmit={handleAddRemedy} className="mb-4 flex gap-2">
                  <input 
                    type="text" 
                    id="remedy-input-field"
                    name="remedy_name"
                    value={remedyInput}
                    onChange={(e) => setRemedyInput(e.target.value)}
                    placeholder="e.g. Vitamin C, Ibuprofen"
                    className="flex-1 text-xs px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-blue-300"
                  />
                  <button 
                    type="submit" 
                    className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    aria-label="Add Remedy"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex flex-wrap gap-2 min-h-[2rem]">
                  {remedies.map(r => (
                    <span key={r} className="group flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                      {r}
                      <button onClick={() => removeRemedy(r)} className="hover:text-blue-800" aria-label={`Remove ${r}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {remedies.length === 0 && <p className="text-[10px] text-gray-400 italic">No remedies added</p>}
                </div>

                {remedies.length > 0 && (
                  <button 
                    onClick={handleCheckInteractions}
                    disabled={isCheckingInteractions}
                    className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                  >
                    {isCheckingInteractions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                    {isCheckingInteractions ? 'Analyzing...' : 'Check Safety Interactions'}
                  </button>
                )}
              </div>

              {/* Daily Progress Card */}
              <div className="bg-rose-500 rounded-[32px] p-6 text-white shadow-lg shadow-rose-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Heart className="w-24 h-24" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Daily Goal</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">{dailyProgress}%</span>
                  <span className="text-xs font-medium opacity-80">Completed</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyProgress}%` }}
                    className="h-full bg-white shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                  />
                </div>
              </div>
            </aside>

            <section className="lg:col-span-2 space-y-6">
              {/* Date Scroll */}
              <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                {uniqueDates.map((dateStr) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center w-16 h-20 rounded-[24px] transition-all border ${
                        isSelected 
                          ? "bg-white text-rose-500 border-rose-200 shadow-xl shadow-rose-100 scale-110" 
                          : "bg-transparent text-gray-400 border-transparent hover:text-gray-600"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                        {new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-xl font-bold mt-1">
                        {new Date(dateStr).getDate()}
                      </span>
                      {isSelected && <div className="w-1 h-1 bg-rose-500 rounded-full mt-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Doses List */}
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {currentDoses.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-medium">
                      No doses scheduled for this date.
                    </div>
                  ) : (
                    currentDoses.map((dose, idx) => {
                      const med = medicines.find(m => m.id === dose.medicineId);
                      const isTaken = dose.status === DoseStatus.TAKEN;
                      const isMissed = dose.status === DoseStatus.MISSED;

                      return (
                        <motion.div
                          layout
                          key={dose.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`relative group bg-white p-5 rounded-[28px] border transition-all duration-300 ${
                            isTaken ? "border-green-100 bg-green-50/10" : isMissed ? "border-red-100 bg-red-50/10" : "border-gray-100 hover:border-rose-100 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${
                                isTaken ? "bg-green-100 text-green-600" : isMissed ? "bg-red-100 text-red-600" : "bg-rose-50 text-rose-500"
                              }`}>
                                <Pill className="w-6 h-6" />
                              </div>
                              <div className="cursor-pointer" onClick={() => med && setViewingMedicine(med)}>
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-bold transition-all ${isTaken ? "text-green-800 line-through opacity-50" : "text-gray-800"}`}>
                                    {dose.medicineName}
                                  </h4>
                                  {med?.potentialInteractions && (
                                    <AlertTriangle className={`w-3.5 h-3.5 animate-pulse ${med.potentialInteractions.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                    isTaken ? "bg-green-100 text-green-600" : isMissed ? "bg-red-100 text-red-600" : "bg-rose-100 text-rose-500"
                                  }`}>
                                    {dose.timeSlot}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium">{med?.dosage}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => toggleDose(dose.id, isTaken ? DoseStatus.PENDING : DoseStatus.TAKEN)}
                                className={`p-3 rounded-2xl transition-all active:scale-90 ${
                                  isTaken 
                                    ? "bg-green-500 text-white shadow-lg shadow-green-200" 
                                    : "bg-gray-50 text-gray-300 hover:bg-green-50 hover:text-green-500"
                                }`}
                                aria-label="Mark as taken"
                              >
                                <CheckCircle2 className="w-6 h-6" />
                              </button>
                              <button
                                onClick={() => toggleDose(dose.id, isMissed ? DoseStatus.PENDING : DoseStatus.MISSED)}
                                className={`p-3 rounded-2xl transition-all active:scale-90 ${
                                  isMissed 
                                    ? "bg-red-500 text-white shadow-lg shadow-red-200" 
                                    : "bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500"
                                }`}
                                aria-label="Mark as missed"
                              >
                                <XCircle className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Activity History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
               <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 font-display">Care Activity Log</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Past updates & changes</p>
                    </div>
                 </div>
                 <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-rose-50 text-gray-400 rounded-full transition-colors" aria-label="Close History">
                    <X className="w-5 h-5" />
                 </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium">
                      No activity recorded yet.
                    </div>
                  ) : (
                    history.map((entry, idx) => (
                      <motion.div 
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="flex gap-4 group"
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm mt-1.5 ${
                            entry.status === DoseStatus.TAKEN ? 'bg-green-500' : entry.status === DoseStatus.MISSED ? 'bg-red-500' : 'bg-gray-300'
                          }`} />
                          {idx !== history.length - 1 && <div className="w-[2px] flex-1 bg-gray-100 my-1" />}
                        </div>
                        <div className="pb-6">
                           <div className="flex items-baseline justify-between gap-4 mb-1">
                              <span className="text-sm font-bold text-gray-800">{entry.medicineName}</span>
                              <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">{formatTime(entry.timestamp)}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${getStatusColor(entry.status)}`}>
                                {entry.status}
                              </span>
                              <span className="text-[10px] text-gray-400">Scheduled for {entry.timeSlot} • {formatDate(entry.date)}</span>
                           </div>
                        </div>
                      </motion.div>
                    ))
                  )}
               </div>

               <div className="p-6 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => setShowHistory(false)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                  >
                    Done
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Processing Overlay Modal */}
      <AnimatePresence>
        {isUploading && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 border border-rose-50 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[30px] flex items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-10 h-10"
                >
                  {procInfo.icon}
                </motion.div>
                <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                   className="absolute inset-2 border-2 border-dashed border-rose-200 rounded-full"
                />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 font-display mb-2">{procInfo.title}</h2>
              <p className="text-sm text-gray-500 italic mb-8 h-5 flex items-center justify-center gap-1">
                {procInfo.desc}
              </p>

              <div className="w-full h-3 bg-rose-50 rounded-full overflow-hidden border border-rose-100 mb-2">
                <motion.div 
                  className="h-full bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                  style={{ width: `${progressValue}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <div className="w-full flex justify-between px-1">
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Progress</span>
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{Math.floor(progressValue)}%</span>
              </div>

              <div className="mt-8 flex items-center gap-2 text-rose-400 animate-pulse">
                <Heart className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-bold uppercase tracking-widest">CareCompanion AI</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Medicine Detail Modal */}
      <AnimatePresence>
        {viewingMedicine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingMedicine(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 right-0 h-32 bg-rose-500 -z-10" />
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setViewingMedicine(null)}
                  className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 pt-12 overflow-y-auto">
                {/* Ultra-Prominent Structured Interaction Alert at the TOP */}
                {viewingMedicine.potentialInteractions && (() => {
                  const interaction = viewingMedicine.potentialInteractions;
                  const isHigh = interaction.severity === 'high';
                  const bgColor = isHigh ? 'bg-red-50' : 'bg-amber-50';
                  const borderColor = isHigh ? 'border-red-200' : 'border-amber-200';
                  const textColor = isHigh ? 'text-red-800' : 'text-amber-800';
                  const labelColor = isHigh ? 'text-red-600' : 'text-amber-600';
                  const Icon = isHigh ? ShieldAlert : AlertCircle;

                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mb-8 p-5 rounded-[28px] border-2 ${borderColor} ${bgColor} shadow-lg shadow-${isHigh ? 'red' : 'amber'}-100/50 flex flex-col gap-3 relative overflow-hidden`}
                    >
                      {isHigh && (
                        <motion.div 
                          animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute -top-6 -left-6 w-28 h-28 bg-red-400 rounded-full blur-3xl -z-0"
                        />
                      )}
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`p-2.5 rounded-2xl ${isHigh ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'} shadow-md`}>
                          <motion.div
                            animate={isHigh ? { rotate: [-10, 10, -10] } : {}}
                            transition={{ repeat: Infinity, duration: 0.3 }}
                          >
                            <Icon className="w-5 h-5" />
                          </motion.div>
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${labelColor}`}>
                            {isHigh ? 'High Priority Alert' : 'Safety Precaution'}
                          </p>
                          <h3 className={`text-base font-bold ${textColor}`}>{interaction.summary}</h3>
                        </div>
                      </div>

                      <div className={`text-xs ${textColor} leading-relaxed font-medium bg-white/50 p-4 rounded-2xl border border-${isHigh ? 'red' : 'amber'}-200/40 relative z-10`}>
                        <p className="font-bold mb-1 opacity-60 uppercase text-[9px] tracking-widest">Details:</p>
                        {interaction.detail}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <Info className={`w-3.5 h-3.5 ${labelColor}`} />
                        <p className={`text-[10px] font-bold ${labelColor} uppercase italic`}>
                           Professional medical advice is recommended
                        </p>
                      </div>
                    </motion.div>
                  );
                })()}

                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-rose-100/50 border border-rose-50 mb-6 text-center">
                  <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Pill className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 font-display mb-1">{viewingMedicine.name}</h2>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">{viewingMedicine.dosage}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="text-xs font-medium text-gray-500">{viewingMedicine.frequency}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Timings */}
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Daily Timings</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {viewingMedicine.timings.map((time) => (
                        <div key={time} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="text-rose-500">
                            {getTimingIcon(time)}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl text-rose-500 shadow-sm">
                        <History className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-rose-800">Total Duration</span>
                    </div>
                    <span className="text-lg font-bold text-rose-600">{viewingMedicine.durationDays} Days</span>
                  </div>
                </div>

                <button
                  onClick={() => setViewingMedicine(null)}
                  className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent New Rx Floating Action Button */}
      {medicines.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-3 px-6 py-4 bg-rose-500 text-white rounded-[24px] font-bold shadow-2xl shadow-rose-200 border-4 border-white active:bg-rose-600 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span>{isUploading ? "Uploading..." : "New Rx"}</span>
          </motion.button>
          <input 
            type="file" 
            id="prescription-upload-fab"
            name="prescription_fab"
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />
        </div>
      )}

      {/* Decorative Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-rose-200/20 blur-[100px] rounded-full -z-10" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-blue-100/20 blur-[120px] rounded-full -z-10" />
    </div>
  );
};

export default App;