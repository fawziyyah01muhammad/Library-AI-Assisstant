import React, { useState, useRef } from "react";
import { Printer, Trash2, ArrowLeft, ArrowRight, Settings2, Sparkles, Plus, AlertCircle, LayoutGrid, CheckCircle2, Download, FileSpreadsheet, FileText, Layers, Bookmark } from "lucide-react";
import { SpineLabel, PrintConfig, getClassificationColor } from "../types";

interface LabelBatchPrinterProps {
  batch: SpineLabel[];
  onRemoveFromBatch: (id: string) => void;
  onClearBatch: () => void;
  onUpdateBatchItem: (updated: SpineLabel) => void;
  onAddManualItem: (newLabel: SpineLabel) => void;
}

const DEFAULT_PRINT_CONFIG: PrintConfig = {
  sheetType: "grid",
  columns: 3,
  rows: 10,
  labelWidth: 66,   // 2.62 inches (~66mm) standard Avery 5160
  labelHeight: 25.4, // 1 inch (25.4mm)
  fontSize: 10,
  fontFamily: "mono",
  uppercase: true,
  showColorCode: false,
  showOuterBorder: true,
  startPosition: 0,
  duplicateCopies: 10,
};

export default function LabelBatchPrinter({
  batch,
  onRemoveFromBatch,
  onClearBatch,
  onUpdateBatchItem,
  onAddManualItem,
}: LabelBatchPrinterProps) {
  const [cfg, setCfg] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthor, setManualAuthor] = useState("");
  const [manualClassNum, setManualClassNum] = useState("");
  const [manualCutterNum, setManualCutterNum] = useState("");
  
  const [groupByResource, setGroupByResource] = useState(true);
  const [showPrintHeaders, setShowPrintHeaders] = useState(true);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState("");

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Helper function to trigger a native file download
  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllCombinedCSV = () => {
    if (batch.length === 0) return;
    const headers = ["Title", "Author", "Year", "System", "Class Number", "Cutter Number", "Copy Index", "Call Number Lines"];
    const rows: string[][] = [];
    
    batch.forEach((label) => {
      const callLines = label.lines.join(" / ");
      for (let c = 1; c <= cfg.duplicateCopies; c++) {
        rows.push([
          `"${label.title.replace(/"/g, '""')}"`,
          `"${label.author.replace(/"/g, '""')}"`,
          `"${label.year || ""}"`,
          `"${label.system}"`,
          `"${label.classNumber}"`,
          `"${label.cutterNumber}"`,
          `"${c}"`,
          `"${callLines.replace(/"/g, '""')}"`
        ]);
      }
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadFile(csvContent, "num_library_combined_labels.csv", "text/csv;charset=utf-8;");
    setDownloadSuccessMsg("Successfully downloaded combined CSV with all resource labels!");
    setTimeout(() => setDownloadSuccessMsg(""), 4000);
  };

  const downloadAllCombinedTXT = () => {
    if (batch.length === 0) return;
    let content = `==================================================\n`;
    content += `     NUM LIBRARY ASSISTANT - COMBINED SPINE LABELS\n`;
    content += `==================================================\n`;
    content += `Generated Date: ${new Date().toLocaleDateString()}\n`;
    content += `Total Resources: ${batch.length} titles\n`;
    content += `Copies Per Resource: ${cfg.duplicateCopies}x duplicates\n`;
    content += `Total Labels: ${batch.length * cfg.duplicateCopies} labels\n`;
    content += `==================================================\n\n`;

    batch.forEach((label, idx) => {
      content += `RESOURCE #${idx + 1}: ${label.title.toUpperCase()}\n`;
      content += `--------------------------------------------------\n`;
      content += `Title: ${label.title}\n`;
      content += `Author: ${label.author} (${label.year || "N/A"})\n`;
      content += `System: ${label.system === "LCC" ? "Library of Congress (LCC)" : "Dewey Decimal (DDC)"}\n`;
      content += `Call Number Code: ${label.lines.join("  /  ")}\n`;
      content += `Total Copies Requested: ${cfg.duplicateCopies}\n\n`;
      
      content += `[PRINTED SPINES FOR THIS TITLE]\n`;
      const maxLineLen = Math.max(...label.lines.map(l => l.length), 16);
      const border = "+" + "-".repeat(maxLineLen + 6) + "+";
      
      for (let c = 1; c <= cfg.duplicateCopies; c++) {
        content += `Copy #${c} of ${cfg.duplicateCopies}:\n`;
        content += ` ${border}\n`;
        label.lines.forEach((line) => {
          const padLeft = Math.floor((maxLineLen - line.length) / 2);
          const padRight = maxLineLen - line.length - padLeft;
          content += ` |   ${" ".repeat(padLeft)}${line}${" ".repeat(padRight)}   |\n`;
        });
        content += ` ${border}\n\n`;
      }
      content += `\n==================================================\n\n`;
    });

    downloadFile(content, "num_library_combined_labels.txt", "text/plain;charset=utf-8;");
    setDownloadSuccessMsg("Successfully downloaded combined TXT index with all resource labels!");
    setTimeout(() => setDownloadSuccessMsg(""), 4000);
  };

  const escapeHtml = (text: string) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const downloadAllCombinedDOC = () => {
    if (batch.length === 0) return;

    let docHtml = `\
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>NUM Library Assistant - Combined Spine Labels</title>
  <!--[if mso]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #334155;
      margin: 15mm;
      background-color: #ffffff;
    }
    .header-main {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 12px;
    }
    .main-title {
      font-size: 22pt;
      font-weight: bold;
      color: #4f46e5;
      margin: 0;
    }
    .subtitle {
      font-size: 10pt;
      color: #64748b;
      margin-top: 5px;
      margin-bottom: 0;
    }
    .resource-section {
      margin-top: 25px;
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .resource-title-header {
      background-color: transparent;
      padding: 2px 0px;
      margin-bottom: 2px;
      border: none;
    }
    .resource-name {
      font-size: 13pt;
      font-weight: bold;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .resource-meta {
      font-size: 9pt;
      color: #475569;
      margin: 0;
    }
    .label-grid-table {
      border-collapse: separate;
      border-spacing: 12px;
      margin-top: 2px;
      margin-bottom: 20px;
    }
    .label-spine-cell {
      border: 1px solid #94a3b8;
      background-color: #ffffff;
      padding: 0;
      vertical-align: middle;
      text-align: center;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="header-main">
    <h1 class="main-title">NUM Library Assistant</h1>
    <p class="subtitle">Spine Labels print-ready Word document • Generated on ${new Date().toLocaleDateString()}</p>
  </div>
`;

    batch.forEach((item, bIdx) => {
      const callLinesStr = item.lines.join("  /  ");
      docHtml += `
  <div class="resource-section">
    <div class="resource-title-header">
      <h2 class="resource-name">${bIdx + 1}. ${escapeHtml(item.title || "Untitled Document")}</h2>
      <p class="resource-meta">
        <strong>Author:</strong> ${escapeHtml(item.author || "Unknown")} | 
        <strong>Classification:</strong> ${item.system === "LCC" ? "Library of Congress (LCC)" : "Dewey Decimal (DDC)"} | 
        <strong>Call Number:</strong> ${escapeHtml(callLinesStr)}
      </p>
    </div>
      `;

      docHtml += `
    <table class="label-grid-table">
      <tr>
      `;

      const columnsCount = cfg.columns || 3;
      for (let c = 0; c < cfg.duplicateCopies; c++) {
        if (c > 0 && c % columnsCount === 0) {
          docHtml += `
      </tr>
      <tr>
          `;
        }

        const cardBgColor = cfg.showColorCode ? getClassificationColor(item.classNumber, item.system) : "#ffffff";
        const cellFontStyle = cfg.fontFamily === "mono" 
          ? "font-family: 'Courier New', Courier, monospace;" 
          : cfg.fontFamily === "serif" 
            ? "font-family: 'Times New Roman', Times, serif;" 
            : "font-family: Arial, Helvetica, sans-serif;";
        const textCaseStyle = cfg.uppercase ? "text-transform: uppercase;" : "";

        docHtml += `
        <td class="label-spine-cell" style="width: ${cfg.labelWidth}mm; height: ${cfg.labelHeight}mm; min-width: ${cfg.labelWidth}mm; min-height: ${cfg.labelHeight}mm; background-color: #ffffff;">
          <table style="width: 100%; height: 100%; border-collapse: collapse; margin: 0; padding: 0;">
            <tr style="height: 100%;">
              <td style="text-align: center; vertical-align: middle; padding: 10px; ${cellFontStyle}">
                <div style="font-size: ${cfg.fontSize}pt; ${textCaseStyle} font-weight: bold; line-height: 1.35; color: #000000;">
                  ${item.lines.map(line => `
                    <div style="margin: 2px 0; white-space: nowrap; overflow: hidden;">${escapeHtml(cfg.uppercase ? line.toUpperCase() : line)}</div>
                  `).join('')}
                </div>
              </td>
            </tr>
          </table>
        </td>
        `;
      }

      docHtml += `
      </tr>
    </table>
  </div>
      `;
    });

    docHtml += `
</body>
</html>
`;

    downloadFile(docHtml, "num_library_labels_document.doc", "application/msword;charset=utf-8;");
    setDownloadSuccessMsg("Successfully downloaded Word Document containing all library titles and their matching spine labels!");
    setTimeout(() => setDownloadSuccessMsg(""), 4000);
  };

  const downloadAsCSV = (label: SpineLabel, copies: number) => {
    const headers = ["Title", "Author", "Year", "System", "Class Number", "Cutter Number", "Call Number Lines"];
    const rows = [];
    const callLines = label.lines.join(" / ");
    for (let c = 1; c <= copies; c++) {
      rows.push([
        `"${label.title.replace(/"/g, '""')}"`,
        `"${label.author.replace(/"/g, '""')}"`,
        `"${label.year || ""}"`,
        `"${label.system}"`,
        `"${label.classNumber}"`,
        `"${label.cutterNumber}"`,
        `"${callLines.replace(/"/g, '""')}"`
      ]);
    }
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const safeTitle = label.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").substring(0, 30) || "resource_labels";
    downloadFile(csvContent, `${safeTitle}_labels.csv`, "text/csv;charset=utf-8;");
  };

  const downloadAsTXT = (label: SpineLabel, copies: number) => {
    let content = `==================================================\n`;
    content += `        NUM LIBRARY ASSISTANT - SPINE LABELS\n`;
    content += `==================================================\n`;
    content += `Resource Title: ${label.title}\n`;
    content += `Author:         ${label.author} (${label.year || "N/A"})\n`;
    content += `Classification: ${label.system === "LCC" ? "Library of Congress (LCC)" : "Dewey Decimal (DDC)"}\n`;
    content += `Copies Count:   ${copies} copies\n`;
    content += `--------------------------------------------------\n\n`;
    
    // ASCII frame around the label copies mockup
    const maxLineLen = Math.max(...label.lines.map(l => l.length), 16);
    const border = "+" + "-".repeat(maxLineLen + 6) + "+";
    
    content += `[SAMPLED COMPLETED SHELF LABEL DESIGN]\n`;
    content += ` ${border}\n`;
    content += ` |   ${" ".repeat(maxLineLen)}   |\n`;
    label.lines.forEach((line) => {
      const padLeft = Math.floor((maxLineLen - line.length) / 2);
      const padRight = maxLineLen - line.length - padLeft;
      content += ` |   ${" ".repeat(padLeft)}${line}${" ".repeat(padRight)}   |\n`;
    });
    content += ` |   ${" ".repeat(maxLineLen)}   |\n`;
    content += ` ${border}\n\n`;
    
    content += `[QUEUE METADATA DETAILS]\n`;
    label.lines.forEach((line, i) => {
      content += `Line ${i + 1}: ${line}\n`;
    });
    
    const safeTitle = label.title.toLowerCase().replace(/[^a-z0-9]+/g, "_").substring(0, 30) || "spine_label";
    downloadFile(content, `${safeTitle}_spine_label.txt`, "text/plain;charset=utf-8;");
  };

  const handlePrint = () => {
    // Generate isolated print styles dynamically, clone print sheet and trigger printing cleanly
    const printContent = printAreaRef.current?.innerHTML || "";
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to open the print screen window.");
      return;
    }

    const fontFamilyLink = cfg.fontFamily === "mono" 
      ? `"JetBrains Mono", "Courier New", monospace` 
      : cfg.fontFamily === "serif" 
        ? `Georgia, Cambria, serif` 
        : `system-ui, -apple-system, sans-serif`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Library Spine Labels Print Job</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Space+Grotesk:wght@500;700&display=swap');
            @page {
              size: letter;
              margin: 12mm 15mm 12mm 15mm;
            }
            body {
              font-family: ${fontFamilyLink};
              margin: 0;
              padding: 0;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .resource-group {
              margin-bottom: 8mm;
              page-break-inside: avoid;
            }
            .resource-print-header {
              font-family: system-ui, -apple-system, sans-serif;
              margin-bottom: 1mm;
              padding-bottom: 0mm;
              border-bottom: none;
              color: #1e293b;
              display: flex;
              flex-direction: column;
              gap: 0.5mm;
            }
            .resource-print-header h4 {
              margin: 0;
              font-size: 11pt;
              font-weight: 700;
              color: #0f172a;
            }
            .resource-print-header p {
              margin: 0;
              font-size: 8.5pt;
              color: #475569;
            }
            .print-hidden-header {
              display: none !important;
            }
            .print-grid {
              display: grid;
              grid-template-columns: repeat(${cfg.columns}, minmax(0, 1fr));
              gap: 3.5mm 4.5mm;
              width: 100%;
            }
            .print-label {
              box-sizing: border-box;
              width: ${cfg.labelWidth}mm;
              height: ${cfg.labelHeight}mm;
              padding: 2.5mm;
              border: ${cfg.showOuterBorder ? "1px solid #cbd5e1" : "1px transparent"};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              position: relative;
              overflow: hidden;
              background-color: white;
              page-break-inside: avoid;
            }
            .color-bar {
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 3.5mm;
              background-color: var(--color-code);
            }
            .color-bar-top {
              position: absolute;
              left: 0;
              right: 0;
              top: 0;
              height: 2.5mm;
              background-color: var(--color-code);
            }
            .lines-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              width: 100%;
              line-height: 1.25;
              font-weight: 700;
              font-size: ${cfg.fontSize}pt;
              margin-left: ${cfg.showColorCode ? "3mm" : "0"};
            }
            .lines-container.top-bar {
              margin-left: 0;
              margin-top: 1.5mm;
            }
            .cutter-line {
              letter-spacing: 0.05em;
            }
          </style>
        </head>
        <body>
          ${groupByResource 
            ? `<div class="grouped-print-container">${printContent}</div>` 
            : `<div class="print-grid">${printContent}</div>`
          }
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Add manually computed label entry
  const handleAddManualLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClassNum.trim() || !manualCutterNum.trim()) return;

    const newLabel: SpineLabel = {
      id: "manual-" + Math.random().toString(36).substr(2, 9),
      title: manualTitle.trim() || "Manual Shelf Resource",
      author: manualAuthor.trim() || "Librarian input",
      year: new Date().getFullYear().toString(),
      system: cfg.sheetType === "grid" ? "DDC" : "LCC",
      classNumber: manualClassNum.trim().toUpperCase(),
      cutterNumber: manualCutterNum.trim().toUpperCase(),
      prefix: "",
      suffix: "",
      volume: "",
      copyNum: "",
      lines: [manualClassNum.trim().toUpperCase(), manualCutterNum.trim().toUpperCase()],
      explanation: "Manually entered classification coordinates on the grid.",
      colorCode: "#64748b",
      timestamp: Date.now(),
    };

    onAddManualItem(newLabel);
    setManualTitle("");
    setManualAuthor("");
    setManualClassNum("");
    setManualCutterNum("");
  };

  // Distribute active labels beginning at the specific start offset value to let librarians reuse sheets
  // We duplicate each item to cfg.duplicateCopies copies
  const copiesCount = cfg.duplicateCopies || 1;
  const activeLabels: SpineLabel[] = [];
  batch.forEach((label) => {
    for (let c = 0; c < copiesCount; c++) {
      activeLabels.push(label);
    }
  });

  // Compute total layout slots (e.g. 30 for 3x10 Avery layout)
  // We need to automatically expand pages if the skips and duplicates exceed one single page layout
  const totalRequiredSlots = cfg.startPosition + activeLabels.length;
  const slotsPerPage = cfg.columns * cfg.rows;
  const pagesNeeded = Math.max(1, Math.ceil(totalRequiredSlots / slotsPerPage));
  const totalGridSlots = pagesNeeded * slotsPerPage;
  const gridCells = Array.from({ length: totalGridSlots });

  let labelIndex = 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Settings Side Pane (4 Cols) */}
      <div className="xl:col-span-4 space-y-6">
        {/* Dimensions Configuration card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Settings2 className="h-4.5 w-4.5 text-indigo-600" />
            <span>Spine & Sheet Specifications</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Label sheet format selector */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Print Layout Pattern</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCfg({ ...cfg, sheetType: "grid", columns: 3, rows: 10 })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    cfg.sheetType === "grid"
                      ? "border-slate-800 bg-slate-900 text-white"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-bold text-xs">Multi-Label Grid</span>
                  <span className="text-[9px] opacity-70">Avery 5160 index sheet</span>
                </button>
                <button
                  onClick={() => setCfg({ ...cfg, sheetType: "single", columns: 1, rows: 1 })}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    cfg.sheetType === "single"
                      ? "border-slate-800 bg-slate-900 text-white"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="block font-bold text-xs">Continuous Loop</span>
                  <span className="text-[9px] opacity-70">Spine tape / roll printer</span>
                </button>
              </div>
            </div>

            {/* Custom Grid Dimensions (if grid is active) */}
            {cfg.sheetType === "grid" && (
              <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label htmlFor="columns-val" className="block text-[10px] font-semibold text-slate-600 mb-1">Columns</label>
                  <input
                    id="columns-val"
                    type="number"
                    min="1"
                    max="6"
                    value={cfg.columns}
                    onChange={(e) => setCfg({ ...cfg, columns: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-2 py-1 bg-white border border-slate-250 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <div>
                  <label htmlFor="rows-val" className="block text-[10px] font-semibold text-slate-600 mb-1">Rows per page</label>
                  <input
                    id="rows-val"
                    type="number"
                    min="1"
                    max="20"
                    value={cfg.rows}
                    onChange={(e) => setCfg({ ...cfg, rows: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-2 py-1 bg-white border border-slate-250 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Metric Dimensions */}
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="w-mm-val" className="block text-[10px] font-semibold text-slate-500">Label Width (mm)</label>
                <input
                  id="w-mm-val"
                  type="number"
                  step="0.1"
                  value={cfg.labelWidth}
                  onChange={(e) => setCfg({ ...cfg, labelWidth: parseFloat(e.target.value) || 12 })}
                  className="w-full p-2 border border-slate-200 mt-1 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label htmlFor="h-mm-val" className="block text-[10px] font-semibold text-slate-500">Label Height (mm)</label>
                <input
                  id="h-mm-val"
                  type="number"
                  step="0.1"
                  value={cfg.labelHeight}
                  onChange={(e) => setCfg({ ...cfg, labelHeight: parseFloat(e.target.value) || 12 })}
                  className="w-full p-2 border border-slate-200 mt-1 rounded-lg font-mono text-xs"
                />
              </div>
            </div>

            {/* Offset setup to reuse tape */}
            {cfg.sheetType === "grid" && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="skip-index-val" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center justify-between">
                    <span>Re-use Sheet Skipping Offset</span>
                    <span className="text-[9px] text-indigo-600 font-mono">Index: #{cfg.startPosition}</span>
                  </label>
                  <input
                    id="skip-index-val"
                    type="range"
                    min="0"
                    max={Math.max(1, totalGridSlots - 1)}
                    value={cfg.startPosition}
                    onChange={(e) => setCfg({ ...cfg, startPosition: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-650 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 leading-normal block mt-1">
                    Skips the first {cfg.startPosition} blank cells to print on a partially utilized Avery sheet. Perfect for preventing paper waste!
                  </span>
                </div>

                {/* Copies Per Label Section */}
                <div className="bg-indigo-55 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                  <label htmlFor="duplicate-copies-range" className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Duplicates Per Label</span>
                    <span className="font-mono text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      {cfg.duplicateCopies}x {cfg.duplicateCopies === 1 ? "Copy" : "Copies"}
                    </span>
                  </label>

                  <div className="flex items-center gap-2 mb-2">
                    <input
                      id="duplicate-copies-range"
                      type="range"
                      min="1"
                      max="30"
                      value={cfg.duplicateCopies}
                      onChange={(e) => setCfg({ ...cfg, duplicateCopies: parseInt(e.target.value, 10) || 1 })}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Fast Preset Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setCfg({ ...cfg, duplicateCopies: 1 })}
                      className={`py-1 px-2 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                        cfg.duplicateCopies === 1
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      Single (1x)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCfg({ ...cfg, duplicateCopies: 5 })}
                      className={`py-1 px-2 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                        cfg.duplicateCopies === 5
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      5 Copies
                    </button>
                    <button
                      type="button"
                      onClick={() => setCfg({ ...cfg, duplicateCopies: 10 })}
                      className={`py-1 px-2 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                        cfg.duplicateCopies === 10
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      10 Copies
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    Set high-volume duplications for multiple books or card attachments. Selecting <strong>10 Copies</strong> formats the sheet precisely per your request!
                  </p>
                </div>
              </div>
            )}

            {/* Font specs */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="font-fam" className="block text-[10px] font-semibold text-slate-500 mb-1">Font Family</label>
                  <select
                    id="font-fam"
                    value={cfg.fontFamily}
                    onChange={(e) => setCfg({ ...cfg, fontFamily: e.target.value as any })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="mono">JetBrains Mono</option>
                    <option value="serif">Georgia Serif</option>
                    <option value="sans">System Sans-Serif</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="font-sz" className="block text-[10px] font-semibold text-slate-500 mb-1">Font Pt Size</label>
                  <input
                    id="font-sz"
                    type="number"
                    value={cfg.fontSize}
                    onChange={(e) => setCfg({ ...cfg, fontSize: parseInt(e.target.value, 10) || 8 })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2.5 pt-2">
                <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.uppercase}
                    onChange={(e) => setCfg({ ...cfg, uppercase: e.target.checked })}
                    className="rounded border-slate-300 accent-indigo-600 h-3.5 w-3.5"
                  />
                  <span>Force uppercase text formatting</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.showColorCode}
                    onChange={(e) => setCfg({ ...cfg, showColorCode: e.target.checked })}
                    className="rounded border-slate-300 accent-indigo-600 h-3.5 w-3.5"
                  />
                  <span>Show colored visual category strip</span>
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.showOuterBorder}
                    onChange={(e) => setCfg({ ...cfg, showOuterBorder: e.target.checked })}
                    className="rounded border-slate-300 accent-indigo-600 h-3.5 w-3.5"
                  />
                  <span>Show subtle layout label gridlines</span>
                </label>
              </div>

              {/* Organization and Grouping Specs */}
              <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grouping & Downloader</span>
                <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <label className="flex items-start gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={groupByResource}
                      onChange={(e) => setGroupByResource(e.target.checked)}
                      className="rounded border-slate-300 accent-indigo-600 h-4 w-4 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-slate-800">Group by Library Resource</span>
                      <span className="block text-[9px] text-slate-400 leading-tight">
                        Displays headers before multiple copies with dynamic CSV/TXT download buttons.
                      </span>
                    </div>
                  </label>

                  {groupByResource && (
                    <label className="flex items-start gap-2 font-medium text-slate-705 cursor-pointer ml-6 border-l border-slate-200 pl-2.5">
                      <input
                        type="checkbox"
                        checked={showPrintHeaders}
                        onChange={(e) => setShowPrintHeaders(e.target.checked)}
                        className="rounded border-slate-300 accent-indigo-600 h-3.5 w-3.5 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="block text-[11px] font-bold text-slate-800">Print headers in final PDF</span>
                        <span className="block text-[9px] text-slate-400 leading-tight">
                          Show title header when printing. Disable for blank sticker alignments.
                        </span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Addition Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3.5">
            <Plus className="h-4.5 w-4.5 text-emerald-600" />
            <span>Add Manual Spine Label</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-normal">
            Need a quick label without AI classification? Add one instantly into the printer queue:
          </p>

          <form onSubmit={handleAddManualLabel} className="space-y-3.5 text-xs">
            <input
              type="text"
              placeholder="Book Title (Optional annotation)"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg"
            />
            <input
              type="text"
              placeholder="Author Last Name (Optional)"
              value={manualAuthor}
              onChange={(e) => setManualAuthor(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Class (e.g. 823.91)"
                value={manualClassNum}
                onChange={(e) => setManualClassNum(e.target.value)}
                className="px-2.5 py-2 border border-slate-200 rounded-lg font-mono uppercase"
                required
              />
              <input
                type="text"
                placeholder="Cutter (e.g. H391p)"
                value={manualCutterNum}
                onChange={(e) => setManualCutterNum(e.target.value)}
                className="px-2.5 py-2 border border-slate-200 rounded-lg font-mono uppercase"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!manualClassNum || !manualCutterNum}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg tracking-wider uppercase transition-colors text-[10px] cursor-pointer disabled:opacity-40"
            >
              Merge into sheet
            </button>
          </form>
        </div>
      </div>

      {/* Main Print Preview Area (8 Cols) */}
      <div className="xl:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-indigo-600 animate-pulse" />
                <span>Physical Print Preview Sheet</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current queue contains <span className="font-bold text-indigo-600">{batch.length} spine labels</span> ({batch.length * cfg.duplicateCopies} total label copies).
              </p>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={onClearBatch}
                className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer select-none transition-colors"
              >
                Clear Queue
              </button>

              {batch.length > 0 && (
                <>
                  <button
                    onClick={downloadAllCombinedCSV}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none transition-all"
                    title="Download all titles inside a single combined CSV spreadsheet"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Download All (CSV)</span>
                  </button>
                  <button
                    onClick={downloadAllCombinedTXT}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none transition-all"
                    title="Download all titles sequentially inside one single combined TXT label document"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Download All (TXT)</span>
                  </button>
                  <button
                    onClick={downloadAllCombinedDOC}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-850 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none transition-all"
                    title="Download all titles styled perfectly in a single Microsoft Word (.doc) document"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-650" />
                    <span>Download All (Word .DOC)</span>
                  </button>
                </>
              )}

              <button
                onClick={handlePrint}
                disabled={batch.length === 0}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Trigger Printer Dialog</span>
              </button>
            </div>
          </div>

          {downloadSuccessMsg && (
            <div className="mb-4 px-3.5 py-2.5 bg-emerald-50 border border-emerald-250/60 rounded-xl text-emerald-800 text-[11px] font-medium flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span>{downloadSuccessMsg}</span>
            </div>
          )}

          {batch.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-150 rounded-2xl bg-slate-55/30 max-w-xl mx-auto my-6 px-4">
              <div className="inline-flex p-3 bg-slate-105 rounded-full text-slate-400 mb-3">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Print Queue Empty</h4>
              <p className="text-xs text-slate-500 mt-2.5 max-w-xs mx-auto leading-relaxed">
                Input a book above or choose an interactive quick-load suggestion to populate call numbers and stack the print pool.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Skip Warning indicator */}
              {cfg.sheetType === "grid" && cfg.startPosition > 0 && (
                <div className="px-3.5 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-indigo-800 flex items-center gap-2.5">
                  <div className="px-1.5 py-0.5 bg-indigo-600 text-white rounded font-mono text-[9px] font-bold">REUSE</div>
                  <span>
                    Note: The first <strong>{cfg.startPosition}</strong> positions are locked blank. Labels will start plotting from position <strong>#{cfg.startPosition + 1}</strong>.
                  </span>
                </div>
              )}

              {/* Responsive Container mimicking physical Letter proportions */}
              <div className="overflow-x-auto p-4 bg-slate-100/60 border border-slate-100 rounded-2xl flex justify-center">
                {/* Simulated A4/Letter proportion sheet */}
                <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-200 p-[12mm] min-w-[700px] w-full max-w-[850px] min-h-[500px]">
                  {/* Real Grid container that gets fed into print iframe */}
                  <div ref={printAreaRef} className="w-full space-y-8 print:space-y-6">
                    {groupByResource ? (
                      batch.map((item, bIdx) => {
                        const itemCopies = Array.from({ length: cfg.duplicateCopies });
                        return (
                          <div key={item.id} className="resource-group relative pb-6 border-b border-dashed border-slate-205 last:border-0 last:pb-0 page-break-inside-avoid">
                            {/* Visual Resource Header */}
                            <div className={`resource-print-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-transparent py-0.5 mb-0.5 select-none print:bg-transparent print:border-none print:p-0 ${showPrintHeaders ? "" : "print-hidden-header"}`}>
                              <div>
                                <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md print:hidden">
                                  Resource Item #{bIdx + 1}
                                </span>
                                <h4 className="text-xs font-extrabold text-slate-800 leading-snug mt-1 flex items-center gap-1.5 print:text-[10pt] print:font-bold">
                                  <Bookmark className="h-3 w-3 text-indigo-500 print:hidden" />
                                  <span>{item.title || "Untitled Document"}</span>
                                </h4>
                                <p className="text-[10px] font-medium text-slate-500 mt-0.5 print:text-[8.5pt]">
                                  By <span className="font-semibold text-slate-700">{item.author || "Unknown"}</span> ({item.year || "N/A"}) • Call: <span className="font-mono font-bold text-slate-900">{item.lines.join(" ")}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 print:hidden">
                                <button
                                  type="button"
                                  onClick={() => downloadAsCSV(item, cfg.duplicateCopies)}
                                  className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-sm select-none"
                                  title="Download Avery compatible label CSV file"
                                >
                                  <FileSpreadsheet className="h-3 w-3 text-emerald-600" />
                                  <span>CSV</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadAsTXT(item, cfg.duplicateCopies)}
                                  className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-sm select-none"
                                  title="Download structured ASCII label TXT index card"
                                >
                                  <Download className="h-3 w-3 text-indigo-600" />
                                  <span>TXT Label</span>
                                </button>
                              </div>
                            </div>

                            {/* Label Copies subgrid */}
                            <div className="print-grid grid w-full gap-[3.5mm_4.5mm]" style={{ gridTemplateColumns: `repeat(${cfg.columns}, minmax(0, 1fr))` }}>
                              {itemCopies.map((_, cIdx) => (
                                <div
                                  key={`${item.id}-copy-${cIdx}`}
                                  className="print-label relative border border-slate-300 bg-white group flex flex-col items-center justify-center overflow-hidden hover:border-indigo-600 rounded transition-all"
                                  style={{
                                    width: "100%",
                                    height: `${cfg.labelHeight}mm`,
                                    padding: "2.5mm",
                                  }}
                                >
                                  {cfg.showColorCode && (
                                    <div
                                      className="color-bar absolute left-0 top-0 bottom-0 w-[3mm] transition-all"
                                      style={{ 
                                        backgroundColor: getClassificationColor(item.classNumber, item.system),
                                        "--color-code": getClassificationColor(item.classNumber, item.system) 
                                      } as any}
                                    />
                                  )}

                                  <div 
                                    className={`lines-container flex flex-col items-center justify-center text-center w-full font-bold ${
                                      cfg.fontFamily === "mono" 
                                        ? "font-mono" 
                                        : cfg.fontFamily === "serif" 
                                          ? "font-serif" 
                                          : "font-sans"
                                    }`}
                                    style={{
                                      fontSize: `${cfg.fontSize}pt`,
                                      textTransform: cfg.uppercase ? "uppercase" : "none",
                                      paddingLeft: cfg.showColorCode ? "3.5mm" : "0"
                                    }}
                                  >
                                    {item.lines.map((line, lIdx) => (
                                      <span key={lIdx} className="block tracking-wide truncate max-w-full leading-normal">
                                        {cfg.uppercase ? line.toUpperCase() : line}
                                      </span>
                                    ))}
                                  </div>

                                  <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity print:hidden flex items-center gap-1 bg-white/80 backdrop-blur-sm p-0.5 rounded shadow-sm border border-slate-100">
                                    <span className="text-[8px] font-mono font-bold text-indigo-600 px-1 py-0.5 rounded">
                                      Copy {cIdx + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onRemoveFromBatch(item.id)}
                                      className="p-0.5 text-rose-650 hover:bg-rose-50 rounded cursor-pointer"
                                      title="Remove from batch"
                                    >
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* Flat Unified Print/Display Grid (Classic Avery Sheet Alignment) */
                      <div className="print-grid grid w-full gap-[3.5mm_4.5mm]" style={{ gridTemplateColumns: `repeat(${cfg.columns}, minmax(0, 1fr))` }}>
                        {cfg.sheetType === "grid" ? (
                          gridCells.map((_, idx) => {
                            const isSkipped = idx < cfg.startPosition;
                            const labelItem = !isSkipped ? activeLabels[labelIndex++] : null;

                            return (
                              <div
                                key={idx}
                                id={`preview-cell-${idx}`}
                                className={`print-label relative border flex flex-col items-center justify-center transition-all overflow-hidden ${
                                  isSkipped 
                                    ? "border-dashed border-slate-200 bg-slate-50/40 opacity-30 select-none min-h-[40px]" 
                                    : labelItem 
                                      ? "border-slate-300 bg-white group min-h-[40px] hover:border-slate-800" 
                                      : "border-dotted border-slate-150 bg-slate-20/20 select-none min-h-[41px]"
                                }`}
                                style={{
                                  width: "100%",
                                  height: `${cfg.labelHeight}mm`,
                                  padding: "2.5mm",
                                }}
                              >
                                {isSkipped && (
                                  <span className="text-[9px] font-mono text-slate-400 font-medium select-none">SKIPPED #{idx + 1}</span>
                                )}

                                {labelItem ? (
                                  <>
                                    {cfg.showColorCode && (
                                      <div
                                        className="color-bar absolute left-0 top-0 bottom-0 w-[3mm] transition-all"
                                        style={{ 
                                          backgroundColor: getClassificationColor(labelItem.classNumber, labelItem.system),
                                          "--color-code": getClassificationColor(labelItem.classNumber, labelItem.system) 
                                        } as any}
                                      />
                                    )}

                                    <div 
                                      className={`lines-container flex flex-col items-center justify-center text-center w-full select-all font-bold transition-all ${
                                        cfg.fontFamily === "mono" 
                                          ? "font-mono" 
                                          : cfg.fontFamily === "serif" 
                                            ? "font-serif" 
                                            : "font-sans"
                                      }`}
                                      style={{
                                        fontSize: `${cfg.fontSize}pt`,
                                        textTransform: cfg.uppercase ? "uppercase" : "none",
                                        paddingLeft: cfg.showColorCode ? "3.5mm" : "0"
                                      }}
                                    >
                                      {labelItem.lines.map((line, lIdx) => (
                                        <span key={lIdx} className="block tracking-wide truncate max-w-full leading-relaxed">
                                          {cfg.uppercase ? line.toUpperCase() : line}
                                        </span>
                                      ))}
                                    </div>

                                    <div className="absolute inset-0 bg-slate-900/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 select-none pointer-events-none group-hover:pointer-events-auto p-2">
                                      <div className="truncate text-center">
                                        <span className="text-[10px] font-bold text-white block truncate mb-1.5 px-1 max-w-full">
                                          {labelItem.title}
                                        </span>
                                        <div className="flex justify-center gap-1">
                                          <button
                                            onClick={() => onRemoveFromBatch(labelItem.id)}
                                            className="p-1 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer pointer-events-auto"
                                            title="Drop from layout grid"
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                            <span>Remove</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  !isSkipped && (
                                    <span className="text-[8px] italic text-slate-350">EMPTY SLOT</span>
                                  )
                                )}
                              </div>
                            );
                          })
                        ) : (
                          activeLabels.map((labelItem, idx) => (
                            <div
                              key={`${labelItem.id}-copy-${idx}`}
                              className="print-label relative border border-slate-300 bg-white group flex flex-col items-center justify-center p-[2.5mm] overflow-hidden hover:border-slate-800"
                              style={{
                                width: `${cfg.labelWidth}mm`,
                                height: `${cfg.labelHeight}mm`,
                                margin: "0 auto 4mm auto",
                              }}
                            >
                              {cfg.showColorCode && (
                                <div
                                  className="color-bar absolute left-0 top-0 bottom-0 w-[3mm]"
                                  style={{ 
                                    backgroundColor: getClassificationColor(labelItem.classNumber, labelItem.system),
                                    "--color-code": getClassificationColor(labelItem.classNumber, labelItem.system) 
                                  } as any}
                                />
                              )}

                              <div 
                                className={`lines-container flex flex-col items-center justify-center text-center w-full font-bold ${
                                  cfg.fontFamily === "mono" ? "font-mono" : cfg.fontFamily === "serif" ? "font-serif" : "font-sans"
                                }`}
                                style={{
                                  fontSize: `${cfg.fontSize}pt`,
                                  textTransform: cfg.uppercase ? "uppercase" : "none",
                                  paddingLeft: cfg.showColorCode ? "3.5mm" : "0"
                                }}
                              >
                                {labelItem.lines.map((line, lIdx) => (
                                  <span key={lIdx} className="block tracking-wide truncate max-w-full leading-normal">
                                    {cfg.uppercase ? line.toUpperCase() : line}
                                  </span>
                                ))}
                              </div>

                              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onRemoveFromBatch(labelItem.id)}
                                  className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Delete cell"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Printable Batch queue overview list */}
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 p-3 font-semibold text-slate-800 border-b border-slate-100 flex items-center justify-between">
                  <span>Queued Items Ledger ({batch.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Actions update printable lines dynamically</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                  {batch.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-white hover:bg-slate-50/50 flex items-center justify-between gap-4">
                      <div className="truncate flex items-center gap-3">
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{item.title}</span>
                          <span className="text-[10px] text-slate-500 block">
                            By {item.author} ({item.year}) • Class system: <span className="font-semibold text-indigo-600 uppercase">{item.system}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="font-mono bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded text-[11px] whitespace-nowrap">
                          {item.lines.join(" / ")}
                        </div>
                        <button
                          onClick={() => onRemoveFromBatch(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all cursor-pointer"
                          title="Erase from printing lot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
