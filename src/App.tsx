import { useState, useEffect } from "react";
import { 
  Library, 
  Sparkles, 
  Printer, 
  FolderLock, 
  BookMarked, 
  Check, 
  Play, 
  HelpCircle, 
  Bookmark, 
  Compass, 
  Layers,
  FileSpreadsheet,
  Plus,
  Flame,
  UserCheck
} from "lucide-react";
import LabelForm from "./components/LabelForm";
import LabelPreview from "./components/LabelPreview";
import LabelBatchPrinter from "./components/LabelBatchPrinter";
import LCCReferenceDesk from "./components/LCCReferenceDesk";
import { SpineLabel, ClassificationResult, ClassificationSystem, getClassificationColor } from "./types";

export default function App() {
  const [activeLabel, setActiveLabel] = useState<SpineLabel | null>(null);
  const [alternates, setAlternates] = useState<ClassificationResult["alternates"]>([]);
  const [batch, setBatch] = useState<SpineLabel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "printing">("catalog");
  const [notification, setNotification] = useState<string | null>(null);

  // Restore existing batch queue from localstorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem("library_spine_batch");
      if (stored) {
        setBatch(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load spine label batch from localStorage", e);
    }
  }, []);

  // Persist batch modifications
  const saveBatch = (updatedBatch: SpineLabel[]) => {
    setBatch(updatedBatch);
    try {
      localStorage.setItem("library_spine_batch", JSON.stringify(updatedBatch));
    } catch (e) {
      console.error("Failed to persist batch", e);
    }
  };

  // Set selected item from the form result
  const handleClassifySuccess = (
    result: ClassificationResult,
    meta: { title: string; author: string; year: string; subject: string; system: ClassificationSystem }
  ) => {
    const mainCall = result.main;
    const initialLines: string[] = [];
    
    // Assemble standard initial display line set
    if (meta.system === "DDC") {
      initialLines.push(mainCall.classNumber);
      initialLines.push(mainCall.cutterNumber);
      if (meta.year) initialLines.push(meta.year);
    } else {
      // Library of Congress
      initialLines.push(mainCall.classNumber);
      initialLines.push(mainCall.cutterNumber);
      if (meta.year) initialLines.push(meta.year);
    }

    const newLabel: SpineLabel = {
      id: "ai-" + Math.random().toString(36).substr(2, 9),
      title: meta.title,
      author: meta.author,
      year: meta.year,
      subject: mainCall.subjectCategory,
      system: meta.system,
      classNumber: mainCall.classNumber,
      cutterNumber: mainCall.cutterNumber,
      prefix: "",
      suffix: "",
      volume: "",
      copyNum: "",
      lines: initialLines,
      explanation: mainCall.explanation,
      colorCode: getClassificationColor(mainCall.classNumber, meta.system),
      timestamp: Date.now(),
    };

    setActiveLabel(newLabel);
    setAlternates(result.alternates || []);
    
    showToast(`⚡ Computed Call Number: ${mainCall.classNumber} ${mainCall.cutterNumber}!`);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Overriding/editing values coordinates directly
  const handleUpdateActiveLabel = (updated: SpineLabel) => {
    setActiveLabel(updated);
  };

  // Add the currently prepared label into the printable queue layout
  const handleAddToBatch = () => {
    if (!activeLabel) return;
    const uniqueLabel: SpineLabel = {
      ...activeLabel,
      id: "ai-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now(),
    };
    const updated = [...batch, uniqueLabel];
    saveBatch(updated);
    showToast(`✨ Admitted "${activeLabel.title}" into physical layout grid.`);
  };

  const handleRemoveFromBatch = (id: string) => {
    const updated = batch.filter((item) => item.id !== id);
    saveBatch(updated);
    showToast("Label cleared from printing sheet list.");
  };

  const handleClearBatch = () => {
    if (window.confirm("Are you sure you want to empty the batch queue? All formatted layout positions will be reset.")) {
      saveBatch([]);
      showToast("Printing queue emptied.");
    }
  };

  const handleUpdateBatchItem = (updatedItem: SpineLabel) => {
    const updated = batch.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    saveBatch(updated);
  };

  const handleAddManualItem = (manualLabel: SpineLabel) => {
    const updated = [...batch, manualLabel];
    saveBatch(updated);
    showToast("Manual spine coordinates joined into preview sheet!");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Toast Notification block */}
      {notification && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50 border border-slate-800 animate-slideUp">
          <div className="h-2 w-2 rounded-full bg-indigo-505 bg-indigo-500 animate-ping"></div>
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header / Utility Rail */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-rose-100/40 shadow-sm z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 rounded-xl text-indigo-400">
              <Library className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">
                  NUM Library Assistant
                </h1>
                <span className="hidden sm:inline-block bg-indigo-150 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  AI Grounded
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Library of Congress (LCC) & Worldwide Cutter Classification Console
              </p>
            </div>
          </div>

          {/* Tab Navigation selectors */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              id="tab-catalog"
              onClick={() => setActiveTab("catalog")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="h-4 w-4" />
              <span>Catalog Desk</span>
            </button>
            <button
              id="tab-printing"
              onClick={() => {
                setActiveTab("printing");
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 relative cursor-pointer ${
                activeTab === "printing"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Printer className="h-4 w-4" />
              <span>Print Sheet Grid</span>
              {batch.length > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-indigo-650 bg-indigo-600 text-white font-bold text-[9px] h-4 min-w-4 px-1 flex items-center justify-center rounded-full shadow border-2 border-white">
                  {batch.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Work Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === "catalog" ? (
          <div className="space-y-8">
            {/* Split Panel: Form Entry on left (5 cols), active preview mock on right (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column Entry form */}
              <div className="lg:col-span-5 space-y-6">
                <LabelForm
                  onClassifySuccess={handleClassifySuccess}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />

                {/* LCC and Cutter table reference side widget */}
                <LCCReferenceDesk />
              </div>

              {/* Right Column Active Generation workspace */}
              <div className="lg:col-span-7">
                {activeLabel ? (
                  <div className="space-y-6">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600/10 text-indigo-700 rounded-lg shrink-0">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Coordinate Calculation Complete!
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Modify variables or select alternates below if catalog shelf classification needs redirection.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleAddToBatch}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow transition-all whitespace-nowrap cursor-pointer"
                      >
                        Queue into Sheet
                      </button>
                    </div>

                    <LabelPreview
                      label={activeLabel}
                      alternates={alternates}
                      onChangeLabel={handleUpdateActiveLabel}
                      onAddToBatch={handleAddToBatch}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
                    <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4 inline-flex">
                      <BookMarked className="h-10 w-10" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No Active Book Selected</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-2.5 leading-relaxed">
                      Fill out the cataloging intake form or select one of the prepopulated demo books to instantiate code-generation.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl">
                      <span>1. Input Title</span>
                      <span className="text-slate-300">•</span>
                      <span>2. AI Assigns Call Coordinates</span>
                      <span className="text-slate-300">•</span>
                      <span>3. Adjust Alignment & Print</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Global Avery Batch layout customizer view */
          <div className="space-y-6">
            <LabelBatchPrinter
              batch={batch}
              onRemoveFromBatch={handleRemoveFromBatch}
              onClearBatch={handleClearBatch}
              onUpdateBatchItem={handleUpdateBatchItem}
              onAddManualItem={handleAddManualItem}
            />
          </div>
        )}
      </main>
    </div>
  );
}
