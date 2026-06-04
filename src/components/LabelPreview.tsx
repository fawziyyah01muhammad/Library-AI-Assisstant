import { useState, useEffect } from "react";
import { Plus, Trash2, Layers, BookMarked, Sparkles, Check, HelpCircle, ArrowRight, Printer, RefreshCw } from "lucide-react";
import { SpineLabel, ClassificationResult, getClassificationColor, ClassificationSystem } from "../types";

interface LabelPreviewProps {
  label: SpineLabel;
  alternates: ClassificationResult["alternates"];
  onChangeLabel: (updated: SpineLabel) => void;
  onAddToBatch: () => void;
}

export default function LabelPreview({ label, alternates, onChangeLabel, onAddToBatch }: LabelPreviewProps) {
  const [autoCompile, setAutoCompile] = useState(true);

  // Compile standard metadata into structured lines when variables change (if in auto mode)
  useEffect(() => {
    if (autoCompile) {
      const computed: string[] = [];
      if (label.prefix.trim()) computed.push(label.prefix.trim().toUpperCase());
      if (label.classNumber.trim()) computed.push(label.classNumber.trim());
      if (label.cutterNumber.trim()) computed.push(label.cutterNumber.trim());
      if (label.year.trim()) computed.push(label.year.trim());
      if (label.volume.trim()) computed.push(`V. ${label.volume.trim()}`.toUpperCase());
      if (label.copyNum.trim()) computed.push(`C. ${label.copyNum.trim()}`.toUpperCase());
      if (label.suffix.trim()) computed.push(label.suffix.trim().toUpperCase());

      // Only update if it actually changed to prevent render loops
      if (JSON.stringify(computed) !== JSON.stringify(label.lines)) {
        onChangeLabel({ ...label, lines: computed });
      }
    }
  }, [
    label.prefix,
    label.classNumber,
    label.cutterNumber,
    label.year,
    label.volume,
    label.copyNum,
    label.suffix,
    autoCompile,
    label.system
  ]);

  const handleLineChange = (index: number, val: string) => {
    setAutoCompile(false); // Switch to manual editing when someone direct types
    const updated = [...label.lines];
    updated[index] = val;
    onChangeLabel({ ...label, lines: updated });
  };

  const handleRemoveLine = (index: number) => {
    setAutoCompile(false);
    const updated = label.lines.filter((_, i) => i !== index);
    onChangeLabel({ ...label, lines: updated });
  };

  const handleAddLine = () => {
    setAutoCompile(false);
    onChangeLabel({ ...label, lines: [...label.lines, ""] });
  };

  const handleResetToAuto = () => {
    setAutoCompile(true);
  };

  // Adopt values from Gemini's alternate suggestion list
  const adoptAlternative = (item: { classNumber: string; cutterNumber: string; explanation: string; subjectCategory: string }) => {
    onChangeLabel({
      ...label,
      classNumber: item.classNumber,
      cutterNumber: item.cutterNumber,
      explanation: item.explanation,
      colorCode: getClassificationColor(item.classNumber, label.system)
    });
  };

  const labelBgColor = getClassificationColor(label.classNumber, label.system);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Visual Spine and Book Mockup (5 Cols) */}
      <div className="lg:col-span-4 flex flex-col items-center justify-center bg-slate-50 border border-slate-100/80 rounded-2xl p-6 min-h-[350px]">
        <div className="text-center mb-6">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">3D Book Placement Preview</span>
          <p className="text-xs text-slate-500 mt-1">Simulates label positioning on the shelf</p>
        </div>

        {/* 3D Stacked Shelf Simulation */}
        <div className="relative w-full max-w-[200px] h-[340px] flex items-end justify-center perspective-[800px] transform-style-3d select-none">
          {/* Wooden Shelf Base */}
          <div className="absolute bottom-0 w-[240px] h-[24px] bg-amber-800 border-t-2 border-amber-730 shadow-md rounded-sm z-0">
            <div className="w-full h-[6px] bg-amber-900 border-b border-amber-950 opacity-50"></div>
          </div>

          {/* Adjacent Shadowy Book Mock in background (left) */}
          <div className="absolute bottom-[22px] left-2 w-[40px] h-[260px] bg-slate-700/80 border-r border-slate-800 rounded-sm opacity-40 shadow-sm skew-y-2 origin-bottom"></div>

          {/* Our Core Active Book Mock */}
          <div className="relative bottom-[22px] w-[58px] h-[280px] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-lg shadow-xl border-l border-slate-900 flex flex-col justify-between p-2 z-10 select-none">
            {/* Book Title vertical text along binding */}
            <div className="flex justify-center items-center mt-6 rotate-90 origin-center whitespace-nowrap text-slate-300">
              <span className="text-[10px] font-medium tracking-wide font-sans text-center max-w-[130px] truncate block">
                {label.title || "UNTITLED RESOURCE"}
              </span>
            </div>

            {/* Simulated Printed Spine Label positioned near spine bottom (standard is ~1.5 inches up) */}
            <div className="bg-white text-black p-1.5 rounded shadow-lg border border-slate-300 w-full flex flex-col items-center justify-center font-mono text-[8px] leading-tight select-none mb-4 uppercase">
              {/* Optional Color Code Bar on spine label itself for category indexing */}
              <div
                className="w-full h-1 mb-1 rounded-sm"
                style={{ backgroundColor: labelBgColor }}
              ></div>
              {label.lines.length > 0 ? (
                label.lines.map((line, idx) => (
                  <span key={idx} className="block text-center tracking-wider font-semibold truncate max-w-full">
                    {line || "•"}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 italic text-[7px]" style={{ textTransform: "none" }}>empty</span>
              )}
            </div>
          </div>

          {/* Adjacent Shadowy Book Mock in background (right) */}
          <div className="absolute bottom-[22px] right-2 w-[52px] h-[290px] bg-indigo-950/40 border-l border-indigo-900 rounded-sm opacity-30 shadow-sm -skew-y-1 origin-bottom"></div>
        </div>

        {/* Color category badge */}
        <div className="mt-4 flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border border-slate-200" style={{ backgroundColor: labelBgColor }} />
          <span className="text-xs font-mono font-semibold text-slate-700">
            {label.system === "DDC" ? "Dewey Group: " + (label.classNumber.match(/^(\d)/)?.[1] || "0") + "00s" : "LCC Alphanumeric"}
          </span>
        </div>
      </div>

      {/* Label Edit and Customizer (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {label.system} Generated Coordinates
              </span>
              <h3 className="text-base font-semibold text-slate-900 mt-1 truncate max-w-md">
                {label.title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {!autoCompile && (
                <button
                  onClick={handleResetToAuto}
                  className="px-2 py-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-100 flex items-center gap-1 transition-all cursor-pointer"
                  title="Recalculate call lines from variables"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Restore Auto</span>
                </button>
              )}
              <button
                onClick={onAddToBatch}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add to Printing Sheet</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Variable Adjustments */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span>Call Variables Override</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prefix-edit" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Shelf Prefix
                  </label>
                  <input
                    id="prefix-edit"
                    type="text"
                    placeholder="e.g. REF, FIC"
                    value={label.prefix}
                    onChange={(e) => onChangeLabel({ ...label, prefix: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label htmlFor="suffix-edit" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Suffix Note
                  </label>
                  <input
                    id="suffix-edit"
                    type="text"
                    placeholder="e.g. OVERSIZE"
                    value={label.suffix}
                    onChange={(e) => onChangeLabel({ ...label, suffix: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="class-edit" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Class Number
                  </label>
                  <input
                    id="class-edit"
                    type="text"
                    value={label.classNumber}
                    onChange={(e) => onChangeLabel({ ...label, classNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="cutter-edit" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Cutter Number
                  </label>
                  <input
                    id="cutter-edit"
                    type="text"
                    value={label.cutterNumber}
                    onChange={(e) => onChangeLabel({ ...label, cutterNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="year-edit" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Pr. Year
                  </label>
                  <input
                    id="year-edit"
                    type="text"
                    value={label.year}
                    onChange={(e) => onChangeLabel({ ...label, year: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label htmlFor="vol-edit" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Volume
                  </label>
                  <input
                    id="vol-edit"
                    type="text"
                    placeholder="e.g. 1, 2"
                    value={label.volume}
                    onChange={(e) => onChangeLabel({ ...label, volume: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label htmlFor="copy-edit" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Copy #
                  </label>
                  <input
                    id="copy-edit"
                    type="text"
                    placeholder="e.g. 1"
                    value={label.copyNum}
                    onChange={(e) => onChangeLabel({ ...label, copyNum: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            {/* Structured Label Lines list (Right Hand Column) */}
            <div className="space-y-3.5 bg-slate-50/40 border border-slate-100 p-4 rounded-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Line-By-Line Label Setup</span>
                </h4>
                <button
                  onClick={handleAddLine}
                  className="px-2 py-0.5 text-[9px] font-bold text-indigo-600 hover:bg-white rounded border border-indigo-100 transition-colors cursor-pointer"
                >
                  + Add Line
                </button>
              </div>

              <div id="editable-label-lines" className="space-y-1.5 max-h-[175px] overflow-y-auto pr-1">
                {label.lines.map((line, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 w-5 text-right">#{idx + 1}</span>
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => handleLineChange(idx, e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800 bg-white"
                    />
                    <button
                      onClick={() => handleRemoveLine(idx)}
                      disabled={label.lines.length <= 1}
                      className="p-1 text-slate-300 hover:text-rose-500 disabled:opacity-20 transition-colors cursor-pointer"
                      title="Deletes line override"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-100">
                {autoCompile ? "⚡ Automatic Mode: Syncing adjustments to spine." : "🛠️ Free Canvas: Overriding call line dimensions."}
              </span>
            </div>
          </div>

          {/* AI Explanation Accordion */}
          <div className="mt-6 pt-5 border-t border-slate-100 leading-relaxed text-xs">
            <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Cataloger Classification Analysis</span>
            </h5>
            
            {label.explanation && label.explanation.includes("Fallback") && (
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3.5 text-slate-700 mb-3.5 leading-relaxed text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs mb-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Precision Local Cataloging Engine Engaged</span>
                </div>
                <p className="text-slate-600">
                  Your classification was resolved instantly using the integrated <strong>Library of Congress Classification schedules</strong> and <strong>Worldwide Cutter Table</strong> tables loaded locally. This ensures seamless production support without cloud service limits!
                </p>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/80 text-slate-600 text-xs">
              <p className="font-medium text-slate-800 mb-1 font-sans text-xs">
                Classification Concept: {label.subject || "Undesignated subject criteria"}
              </p>
              <p className="mt-1 leading-relaxed italic text-slate-600">{label.explanation}</p>
            </div>
          </div>
        </div>

        {/* Gemini Alternates Selection Grid */}
        <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <BookMarked className="h-4 w-4 text-emerald-500" />
            <span>Cross-Disciplinary Shelving Options (AI Proposal)</span>
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Library books occasionally cross genres. Choose a classification code below to swap locations instantly on the shelf.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternates && alternates.length > 0 ? (
              alternates.map((alt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 hover:bg-slate-50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-slate-800 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                        {alt.classNumber} {alt.cutterNumber}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alt Option #{idx + 1}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                      {alt.subjectCategory}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic mb-4">
                      {alt.explanation}
                    </p>
                  </div>
                  <button
                    onClick={() => adoptAlternative(alt)}
                    className="w-full py-1 px-3 bg-white hover:bg-slate-900 hover:text-white text-[10px] font-semibold border border-slate-200 hover:border-slate-950 text-slate-700 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Adopt Alternate Coordinates</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center p-6 text-slate-400 text-xs">
                No alternate categories computed for this book.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
