export type ClassificationSystem = "DDC" | "LCC";

export interface SpineLabel {
  id: string;
  title: string;
  author: string;
  year: string;
  subject?: string;
  system: ClassificationSystem;
  classNumber: string;
  cutterNumber: string;
  prefix: string; // e.g. "REF", "FIC", "J"
  suffix: string; // e.g. "c.1", "v.2"
  volume: string;
  copyNum: string;
  lines: string[]; // Final calculated text lines for rendering
  explanation: string; // Reasoning for call number choice
  colorCode: string; // Theme color based on classification
  timestamp: number;
}

export interface ClassificationSuggestion {
  classNumber: string;
  cutterNumber: string;
  subjectCategory: string;
  explanation: string;
}

export interface ClassificationResult {
  main: ClassificationSuggestion;
  alternates: ClassificationSuggestion[];
}

export interface PrintConfig {
  sheetType: "single" | "grid";
  columns: number;
  rows: number;
  labelWidth: number; // in mm
  labelHeight: number; // in mm
  fontSize: number; // in px
  fontFamily: "serif" | "sans" | "mono";
  uppercase: boolean;
  showColorCode: boolean;
  showOuterBorder: boolean;
  startPosition: number; // index of Avery grid (0-indexed, e.g. skip first 3 labels if sheet is partially used)
  duplicateCopies: number; // number of print copies per queued label item
}

export const SYSTEM_OPTIONS: { value: ClassificationSystem; label: string; desc: string }[] = [
  {
    value: "DDC",
    label: "Dewey Decimal Classification (DDC)",
    desc: "Numerical system (000-999) widely used in public & school libraries.",
  },
  {
    value: "LCC",
    label: "Library of Congress Classification (LCC)",
    desc: "Alphanumeric system used mostly in academic & research libraries.",
  },
];

// Aesthetic theme options for label styling
export const LABEL_THEME_COLORS: Record<string, string> = {
  // DDC Classes
  "000": "#64748b", // Computer science & info (Slate)
  "100": "#a855f7", // Philosophy & psychology (Purple)
  "200": "#ec4899", // Religion (Pink)
  "300": "#3b82f6", // Social sciences (Blue)
  "400": "#14b8a6", // Language (Teal)
  "500": "#22c55e", // Pure science (Green)
  "600": "#eab308", // Technology / Applied (Yellow)
  "700": "#f97316", // Arts & recreation (Orange)
  "800": "#ef4444", // Literature (Red)
  "900": "#8b5cf6", // History & geography (Indigo)
  // Default LCC or other
  "LCC": "#10b981", // Alphanumeric greens
  "DEFAULT": "#0f172a", // Dark charcoal
};

// Gets background/text style based on Dewey or LCC number
export function getClassificationColor(classNum: string, system: ClassificationSystem): string {
  if (system === "LCC") {
    return LABEL_THEME_COLORS.LCC;
  }
  const clean = classNum.trim();
  if (!clean) return LABEL_THEME_COLORS.DEFAULT;
  const match = clean.match(/^(\d{3})/);
  if (match) {
    const hundredGroup = Math.floor(parseInt(match[1], 10) / 100) * 100;
    const groupStr = hundredGroup.toString().padStart(3, "0");
    return LABEL_THEME_COLORS[groupStr] || LABEL_THEME_COLORS.DEFAULT;
  }
  return LABEL_THEME_COLORS.DEFAULT;
}
