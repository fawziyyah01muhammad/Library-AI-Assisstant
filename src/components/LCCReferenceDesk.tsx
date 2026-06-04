import React, { useState } from "react";
import { BookOpen, Table, HelpCircle, ArrowRight, User } from "lucide-react";

export default function LCCReferenceDesk() {
  const [activeTab, setActiveTab] = useState<"outline" | "cutter" | "tester">("cutter");
  const [testAuthor, setTestAuthor] = useState("Stephen Hawking");
  const [testTitle, setTestTitle] = useState("Brief History of Time");

  // LC Cutter implementation for the interactive simulation
  const simulateCutter = (author: string, title: string) => {
    const authorClean = author.trim().replace(/^by\s+/i, "");
    const authorPart = authorClean.includes(",") ? authorClean.split(",")[0].trim() : authorClean;
    const cleanName = authorPart.replace(/[^a-zA-Z]/g, "").toUpperCase();

    if (cleanName.length === 0) {
      return {
        formula: "Empty input",
        steps: ["No letters found in author name."],
        result: ".X11"
      };
    }

    const firstChar = cleanName[0];
    const secondChar = cleanName[1] || "";
    const thirdChar = cleanName[2] || "";

    let num1 = "3";
    let num2 = "5";
    const steps: string[] = [];

    const isVowel = (c: string) => ["A", "E", "I", "O", "U"].includes(c);
    const getExpansionDigit = (c: string): { digit: string; desc: string } => {
      if (!c) return { digit: "5", desc: "No letter (defaulting to 5)" };
      const code = c.toLowerCase();
      if (code >= 'a' && code <= 'd') return { digit: '3', desc: `'${c}' falls in [a-d] range -> 3` };
      if (code >= 'e' && code <= 'h') return { digit: '4', desc: `'${c}' falls in [e-h] range -> 4` };
      if (code >= 'i' && code <= 'l') return { digit: '5', desc: `'${c}' falls in [i-l] range -> 5` };
      if (code >= 'm' && code <= 'o') return { digit: '6', desc: `'${c}' falls in [m-o] range -> 6` };
      if (code >= 'p' && code <= 's') return { digit: '7', desc: `'${c}' falls in [p-s] range -> 7` };
      if (code >= 't' && code <= 'v') return { digit: '8', desc: `'${c}' falls in [t-v] range -> 8` };
      if (code >= 'w' && code <= 'z') return { digit: '9', desc: `'${c}' falls in [w-z] range -> 9` };
      return { digit: "5", desc: "default -> 5" };
    };

    const c2 = secondChar.toLowerCase();
    const c3 = thirdChar.toLowerCase();

    steps.push(`Primary Initial Letter: '${firstChar}'`);

    if (isVowel(firstChar)) {
      steps.push(`Rule: Initial letter is a VOWEL (A, E, I, O, U)`);
      if (c2 >= 'b' && c2 <= 'c') { num1 = '2'; steps.push(`2nd letter '${secondChar}' is [b-c] -> 2`); }
      else if (c2 >= 'd' && c2 <= 'k') { num1 = '3'; steps.push(`2nd letter '${secondChar}' is [d-k] -> 3`); }
      else if (c2 >= 'l' && c2 <= 'm') { num1 = '4'; steps.push(`2nd letter '${secondChar}' is [l-m] -> 4`); }
      else if (c2 >= 'n' && c2 <= 'o') { num1 = '5'; steps.push(`2nd letter '${secondChar}' is [n-o] -> 5`); }
      else if (c2 >= 'p' && c2 <= 'q') { num1 = '6'; steps.push(`2nd letter '${secondChar}' is [p-q] -> 6`); }
      else if (c2 === 'r') { num1 = '7'; steps.push(`2nd letter '${secondChar}' is 'r' -> 7`); }
      else if (c2 >= 's' && c2 <= 't') { num1 = '8'; steps.push(`2nd letter '${secondChar}' is [s-t] -> 8`); }
      else if (c2 >= 'u' && c2 <= 'y') { num1 = '9'; steps.push(`2nd letter '${secondChar}' is [u-y] -> 9`); }
      else { num1 = '3'; steps.push(`2nd letter non-matching (using standard 3)`); }

      const exp = getExpansionDigit(thirdChar);
      num2 = exp.digit;
      steps.push(`Expansion for 3rd letter '${thirdChar || "N/A"}': ${exp.desc}`);
    } else if (firstChar === 'S') {
      steps.push(`Rule: Initial letter is 'S'`);
      if (c2 >= 'a' && c2 <= 'c') { num1 = '2'; steps.push(`2nd letter '${secondChar}' is [a-c] -> 2`); }
      else if ((c2 === 'c' && cleanName[2]?.toLowerCase() === 'h') || c2 === 'd') { num1 = '3'; steps.push(`2nd letter or cluster is 'ch'/'d' -> 3`); }
      else if (c2 >= 'e' && c2 <= 'g') { num1 = '4'; steps.push(`2nd letter '${secondChar}' is [e-g] -> 4`); }
      else if (c2 >= 'h' && c2 <= 'l') { num1 = '5'; steps.push(`2nd letter '${secondChar}' is [h-l] -> 5`); }
      else if (["m", "n", "o", "p", "q", "r", "s"].includes(c2)) { num1 = '6'; steps.push(`2nd letter '${secondChar}' is [m-p-s] cluster -> 6`); }
      else if (c2 === 't') { num1 = '7'; steps.push(`2nd letter '${secondChar}' is 't' -> 7`); }
      else if (c2 >= 'u' && c2 <= 'v') { num1 = '8'; steps.push(`2nd letter '${secondChar}' is [u-v] -> 8`); }
      else if (c2 >= 'w' && c2 <= 'z') { num1 = '9'; steps.push(`2nd letter '${secondChar}' is [w-z] -> 9`); }
      else { num1 = '3'; steps.push(`2nd letter non-matching (using standard 3)`); }

      const exp = getExpansionDigit(thirdChar);
      num2 = exp.digit;
      steps.push(`Expansion for 3rd letter '${thirdChar || "N/A"}': ${exp.desc}`);
    } else if (cleanName.startsWith("QU")) {
      steps.push(`Rule: Initial letters are 'Qu'`);
      if (c3 >= 'a' && c3 <= 'd') { num1 = '3'; steps.push(`3rd letter '${thirdChar}' is [a-d] -> 3`); }
      else if (c3 >= 'e' && c3 <= 'h') { num1 = '4'; steps.push(`3rd letter '${thirdChar}' is [e-h] -> 4`); }
      else if (c3 >= 'i' && c3 <= 'n') { num1 = '5'; steps.push(`3rd letter '${thirdChar}' is [i-n] -> 5`); }
      else if (c3 >= 'o' && c3 <= 'q') { num1 = '6'; steps.push(`3rd letter '${thirdChar}' is [o-q] -> 6`); }
      else if (c3 >= 'r' && c3 <= 's') { num1 = '7'; steps.push(`3rd letter '${thirdChar}' is [r-s] -> 7`); }
      else if (c3 >= 't' && c3 <= 'x') { num1 = '8'; steps.push(`3rd letter '${thirdChar}' is [t-x] -> 8`); }
      else if (c3 === 'y') { num1 = '9'; steps.push(`3rd letter '${thirdChar}' is 'y' -> 9`); }
      else { num1 = '3'; steps.push(`3rd letter non-matching (using standard 3)`); }

      const fourth = cleanName[3] || "";
      const exp = getExpansionDigit(fourth);
      num2 = exp.digit;
      steps.push(`Expansion for 4th letter '${fourth || "N/A"}': ${exp.desc}`);
    } else {
      steps.push(`Rule: Other initial consonant`);
      if (c2 >= 'a' && c2 <= 'd') { num1 = '3'; steps.push(`2nd letter '${secondChar}' is [a-d] -> 3`); }
      else if (c2 >= 'e' && c2 <= 'h') { num1 = '4'; steps.push(`2nd letter '${secondChar}' is [e-h] -> 4`); }
      else if (c2 >= 'i' && c2 <= 'n') { num1 = '5'; steps.push(`2nd letter '${secondChar}' is [i-n] -> 5`); }
      else if (c2 >= 'o' && c2 <= 'q') { num1 = '6'; steps.push(`2nd letter '${secondChar}' is [o-q] -> 6`); }
      else if (c2 >= 'r' && c2 <= 't') { num1 = '7'; steps.push(`2nd letter '${secondChar}' is [r-t] -> 7`); }
      else if (c2 >= 'u' && c2 <= 'x') { num1 = '8'; steps.push(`2nd letter '${secondChar}' is [u-x] -> 8`); }
      else if (c2 === 'y') { num1 = '9'; steps.push(`2nd letter '${secondChar}' is 'y' -> 9`); }
      else { num1 = '3'; steps.push(`2nd letter non-matching (using standard 3)`); }

      const exp = getExpansionDigit(thirdChar);
      num2 = exp.digit;
      steps.push(`Expansion for 3rd letter '${thirdChar || "N/A"}': ${exp.desc}`);
    }

    const workMark = title.trim().replace(/^(the|a|an)\s+/i, "")[0]?.toLowerCase() || "a";
    return {
      formula: `.${firstChar} + ${num1} + ${num2} (Workmark: ${workMark})`,
      steps,
      result: `.${firstChar}${num1}${num2}`
    };
  };

  const simulationValue = simulateCutter(testAuthor, testTitle);

  return (
    <div id="lcc-reference-desk-section" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header Banner */}
      <div className="bg-slate-900 px-4 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Classification Reference Desk</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Official LOC Tables Bound</span>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50 p-1">
        <button
          onClick={() => setActiveTab("cutter")}
          className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeTab === "cutter"
              ? "bg-white text-indigo-700 shadow-xs border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Cutter Ranges
        </button>
        <button
          onClick={() => setActiveTab("outline")}
          className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeTab === "outline"
              ? "bg-white text-indigo-700 shadow-xs border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          LCC Outline
        </button>
        <button
          onClick={() => setActiveTab("tester")}
          className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            activeTab === "tester"
              ? "bg-white text-indigo-700 shadow-xs border-b-2 border-indigo-600"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Cutter Test Tool
        </button>
      </div>

      {/* Tab Area Content */}
      <div className="p-4 min-h-[290px]">
        {activeTab === "outline" && (
          <div className="space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-800 flex flex-col gap-1">
              <span>Library of Congress Main Classes</span>
              <a
                href="https://www.loc.gov/aba/publications/FreeLCC/freelcc.html"
                target="_blank"
                rel="noreferrer"
                className="text-[9px] text-indigo-600 hover:underline font-mono"
              >
                Source: www.loc.gov/aba/publications/FreeLCC/freelcc.html
              </a>
            </h5>
            <div className="text-[10px] text-slate-600 space-y-1.5 max-h-[220px] overflow-y-auto pr-1 select-none font-mono">
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">A</span> General Works</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">B</span> Philosophy, Psychology, Religion</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">C</span> Auxiliary Sciences of History</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">D</span> History: General and Old World</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">E-F</span> History: America</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">G</span> Geography, Anthropology, Recreation</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">H</span> Social Sciences</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">J</span> Political Science</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">K</span> Law</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">L</span> Education</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">M</span> Music and Books on Music</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">N</span> Fine Arts</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">P</span> Language and Literature</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">Q</span> Science (QA Math, QC Physics)</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">R</span> Medicine</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">S</span> Agriculture</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">T</span> Technology (TK Electrical/Web)</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">U</span> Military Science</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">V</span> Naval Science</div>
              <div className="flex items-center gap-1.5 p-1 hover:bg-slate-50 rounded"><span className="text-indigo-600 font-bold min-w-[20px]">Z</span> Library Science</div>
            </div>
          </div>
        )}

        {activeTab === "cutter" && (
          <div className="space-y-3">
            <h5 className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <Table className="h-3.5 w-3.5 text-indigo-500" />
              <span>Library of Congress Cutter Table</span>
            </h5>

            <div className="text-[10px] text-slate-600 space-y-2.5 font-sans leading-relaxed">
              <div>
                <span className="font-extrabold text-indigo-850 block bg-slate-100 px-1.5 py-0.5 rounded mb-1 text-[9px] uppercase tracking-wide">1. After initial Vowels</span>
                <span className="font-mono bg-indigo-50 text-indigo-900 border border-indigo-100 rounded px-1 text-[9px] mr-1">Second letter:</span>
                b-c <strong className="text-indigo-600 font-bold">2</strong>, d-k <strong className="text-indigo-600 font-bold">3</strong>, l-m <strong className="text-indigo-600 font-bold">4</strong>, n-o <strong className="text-indigo-600 font-bold">5</strong>, p-q <strong className="text-indigo-600 font-bold">6</strong>, r <strong className="text-indigo-600 font-bold">7</strong>, s-t <strong className="text-indigo-600 font-bold">8</strong>, u-y <strong className="text-indigo-600 font-bold">9</strong>
              </div>

              <div>
                <span className="font-extrabold text-indigo-850 block bg-slate-100 px-1.5 py-0.5 rounded mb-1 text-[9px] uppercase tracking-wide">2. After initial letter "S"</span>
                <span className="font-mono bg-indigo-50 text-indigo-900 border border-indigo-100 rounded px-1 text-[9px] mr-1">Second letter:</span>
                a-c <strong className="text-indigo-600 font-bold">2</strong>, ch-d <strong className="text-indigo-600 font-bold">3</strong>, e-g <strong className="text-indigo-600 font-bold">4</strong>, h-l <strong className="text-indigo-600 font-bold">5</strong>, m-p-s <strong className="text-indigo-600 font-bold">6</strong>, t <strong className="text-indigo-600 font-bold">7</strong>, u-v <strong className="text-indigo-600 font-bold">8</strong>, w-z <strong className="text-indigo-600 font-bold">9</strong>
              </div>

              <div>
                <span className="font-extrabold text-indigo-850 block bg-slate-100 px-1.5 py-0.5 rounded mb-1 text-[9px] uppercase tracking-wide">3. After the letters "Qu"</span>
                <span className="font-mono bg-indigo-50 text-indigo-900 border border-indigo-100 rounded px-1 text-[9px] mr-1">Third letter:</span>
                a-d <strong className="text-indigo-600 font-bold">3</strong>, e-h <strong className="text-indigo-600 font-bold">4</strong>, i-n <strong className="text-indigo-600 font-bold">5</strong>, o-q <strong className="text-indigo-600 font-bold">6</strong>, r-s <strong className="text-indigo-600 font-bold">7</strong>, t-x <strong className="text-indigo-600 font-bold">8</strong>, y <strong className="text-indigo-600 font-bold">9</strong>
              </div>

              <div>
                <span className="font-extrabold text-indigo-850 block bg-slate-100 px-1.5 py-0.5 rounded mb-1 text-[9px] uppercase tracking-wide">4. After other initial Consonants</span>
                <span className="font-mono bg-indigo-50 text-indigo-900 border border-indigo-100 rounded px-1 text-[9px] mr-1">Second letter:</span>
                a-d <strong className="text-indigo-600 font-bold">3</strong>, e-h <strong className="text-indigo-600 font-bold">4</strong>, i-n <strong className="text-indigo-600 font-bold">5</strong>, o-q <strong className="text-indigo-600 font-bold">6</strong>, r-t <strong className="text-indigo-600 font-bold">7</strong>, u-x <strong className="text-indigo-600 font-bold">8</strong>, y <strong className="text-indigo-600 font-bold">9</strong>
              </div>

              <div>
                <span className="font-extrabold text-indigo-850 block bg-slate-100 px-1.5 py-0.5 rounded mb-1 text-[9px] uppercase tracking-wide">5. Expansion Factor</span>
                <span className="font-mono bg-indigo-50 text-indigo-900 border border-indigo-100 rounded px-1 text-[9px] mr-1">Subsequent:</span>
                a-d <strong className="text-indigo-600 font-bold">3</strong>, e-h <strong className="text-indigo-600 font-bold">4</strong>, i-l <strong className="text-indigo-600 font-bold">5</strong>, m-o <strong className="text-indigo-600 font-bold">6</strong>, p-s <strong className="text-indigo-600 font-bold">7</strong>, t-v <strong className="text-indigo-600 font-bold">8</strong>, w-z <strong className="text-indigo-600 font-bold">9</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tester" && (
          <div className="space-y-4">
            <h5 className="text-[11px] font-bold text-slate-800">
              Cutter Number Real-Time Resolver
            </h5>

            <div className="space-y-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Author Name / Entry</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={testAuthor}
                    onChange={(e) => setTestAuthor(e.target.value)}
                    placeholder="e.g. Stephen Hawking"
                    className="w-full text-xs font-semibold pl-8 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Reference Title</label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Brief History"
                  className="w-full text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all animate-none"
                />
              </div>
            </div>

            {/* Resolved outputs */}
            <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100/60 font-mono text-[10px]">
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-[9px] font-bold text-slate-500">Cutter Result:</span>
                <span className="text-[11px] font-black text-indigo-700 bg-white border border-indigo-100 px-2 py-0.5 rounded">
                  {simulationValue.result}
                </span>
              </div>
              <div className="text-slate-500 text-[8px] mb-2 font-mono">
                Formula: {simulationValue.formula}
              </div>
              
              <div className="border-t border-indigo-100/80 pt-1.5 space-y-1 text-slate-600 text-[9px]">
                {simulationValue.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-1">
                    <span className="text-indigo-500 font-extrabold">→</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
