import React, { useState, useEffect } from "react";
import { BookOpen, User, Calendar, Tag, Sparkles, AlertCircle, HelpCircle, ArrowRight, RotateCw } from "lucide-react";
import { SYSTEM_OPTIONS, ClassificationSystem, ClassificationResult } from "../types";

interface LabelFormProps {
  onClassifySuccess: (
    result: ClassificationResult,
    meta: { title: string; author: string; year: string; subject: string; system: ClassificationSystem }
  ) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

const BIBLIO_LOADER_PHRASES = [
  "Consulting bibliographic schemas...",
  "Running Dewey Decimal classification algorithms...",
  "Computing Cutter-Sanborn alphanumeric codes...",
  "Formatting shelf call coordinates...",
  "Assessing subject category thresholds...",
  "Reviewing Library of Congress guidelines..."
];

export default function LabelForm({ onClassifySuccess, isLoading, setIsLoading }: LabelFormProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [subject, setSubject] = useState("");
  const [system, setSystem] = useState<ClassificationSystem>("LCC");
  const [err, setErr] = useState<string | null>(null);
  const [loaderTextIndex, setLoaderTextIndex] = useState(0);

  // Dynamic loader rotation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoaderTextIndex((prev) => (prev + 1) % BIBLIO_LOADER_PHRASES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle classification request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      setErr("Please provide both a book title and author name.");
      return;
    }

    setErr(null);
    setIsLoading(true);
    setLoaderTextIndex(0);

    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          year: year.trim(),
          subject: subject.trim(),
          system
        })
      });

      let responseData: any = null;
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        try {
          responseData = await response.json();
        } catch (jsonErr) {
          console.error("Failed to parse JSON response:", jsonErr);
        }
      }

      if (!response.ok) {
        const errorMsg = responseData?.error || `Server responded with status ${response.status}. Please try again shortly.`;
        throw new Error(errorMsg);
      }

      if (!responseData) {
        throw new Error("Received an invalid non-JSON response from the server. Please check that the server is online and try again.");
      }

      onClassifySuccess(responseData, {
        title: title.trim(),
        author: author.trim(),
        year: year.trim(),
        subject: subject.trim(),
        system
      });
    } catch (error: any) {
      console.error(error);
      setErr(error.message || "Failed to reach the classification service. Please check your Gemini API configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  // Pre-fill fields for easy librarian testing
  const loadDemoBook = (demo: { title: string; author: string; year: string; subject: string; system: ClassificationSystem }) => {
    setTitle(demo.title);
    setAuthor(demo.author);
    setYear(demo.year);
    setSubject(demo.subject);
    setSystem(demo.system);
    setErr(null);
  };

  const DEMO_BOOKS = [
    {
      title: "The Ultimate Guide to TypeScript",
      author: "Dan Vanderkam",
      year: "2020",
      subject: "Computer science textbook on advanced web programming and static type safety in TypeScript",
      system: "LCC" as const
    },
    {
      title: "Brief History of Time",
      author: "Stephen Hawking",
      year: "1988",
      subject: "Cosmology, theoretical physics, black holes and thermal universe concepts explained simply.",
      system: "LCC" as const
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      year: "1813",
      subject: "Classic English literature, romance, social class in 19th-century England",
      system: "LCC" as const
    }
  ];

  return (
    <div id="label-form-card" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Header section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/30 rounded-lg text-indigo-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">AI Cataloging Intake</h2>
            <p className="text-xs text-slate-300">Catalog resources and generate spine coordinates</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Core inputs */}
        <div className="space-y-4">
          {/* Resource Title */}
          <div>
            <label htmlFor="title-inp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              Resource Title <span className="text-rose-500 font-medium text-[10px] lowercase italic">* required</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <BookOpen className="h-4 w-4" />
              </span>
              <input
                id="title-inp"
                type="text"
                placeholder="e.g. Introduction to Quantum Mechanics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent bg-slate-50/50 focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          {/* Author Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="author-inp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                Author Name <span className="text-rose-500 font-medium text-[10px] lowercase italic">* required</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="author-inp"
                  type="text"
                  placeholder="e.g. Griffiths, David J."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent bg-slate-50/50 focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {/* Publication Year */}
            <div>
              <label htmlFor="year-inp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Publication Year
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </span>
                <input
                  id="year-inp"
                  type="number"
                  placeholder="e.g. 2018"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={isLoading}
                  min="500"
                  max="2100"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent bg-slate-50/50 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Classification Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Classification Coordinate Standard
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SYSTEM_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setSystem(opt.value)}
                  disabled={isLoading}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                    system === opt.value
                      ? "border-slate-800 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-700"
                  }`}
                >
                  <span className="text-xs font-semibold tracking-wide">{opt.value}</span>
                  <span className={`text-[10px] mt-1 pr-1 leading-relaxed ${system === opt.value ? "text-slate-300" : "text-slate-500"}`}>
                    {opt.label.split(" (")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject Context */}
          <div>
            <label htmlFor="subject-inp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              Subject Context / Descriptive Keys <span className="text-slate-400 font-normal normal-case italic text-[10px]">highly recommended</span>
            </label>
            <div className="relative">
              <span className="absolute top-2.5 left-3 text-slate-400">
                <Tag className="h-4 w-4" />
              </span>
              <textarea
                id="subject-inp"
                rows={2}
                placeholder="e.g. Textbook containing principles and formulas of textbook mechanics for quantum physics college course level"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent bg-slate-50/50 focus:bg-white transition-colors resize-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Adding subject tags helps the AI cataloger distinguish context (e.g., differentiating computer hacking, culinary cooking, or botanical hacking).
            </p>
          </div>
        </div>

        {/* Error State */}
        {err && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Cataloging failure: </span>
              {err}
            </div>
          </div>
        )}

        {/* Catalog Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
            isLoading
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:translate-y-px cursor-pointer"
          }`}
        >
          {isLoading ? (
            <>
              <RotateCw className="h-4 w-4 animate-spin text-slate-400" />
              <span>{BIBLIO_LOADER_PHRASES[loaderTextIndex]}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate call coordinates</span>
            </>
          )}
        </button>
      </form>

      {/* Demo helper shortcuts */}
      <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
          <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>Quick Demo Presets</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DEMO_BOOKS.map((demo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadDemoBook(demo)}
              disabled={isLoading}
              className="px-2.5 py-2 text-left bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center justify-between group disabled:opacity-50"
            >
              <div className="truncate pr-2">
                <span className="font-semibold text-slate-700 text-[11px] block truncate group-hover:text-indigo-600">
                  {demo.title}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {demo.system} • {demo.author.split(",")[0]}
                </span>
              </div>
              <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
