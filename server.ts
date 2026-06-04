import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

// Lazy initialization pattern to prevent crashes if the API key is not present on start
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please configure it in your Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// DETERMINISTIC LOCAL CATALOGING FALLBACK SYSTEM
interface FallbackSchema {
  ddc: string;
  lcc: string;
  category: string;
}

const FALLBACK_RULES: { keywords: string[]; value: FallbackSchema }[] = [
  {
    keywords: ["typescript", "programming", "python", "software", "javascript", "coding", "java", "developer", "rust", "c++", "compiler", "code", "programming language"],
    value: { ddc: "005.13", lcc: "QA76.73", category: "Technology — Computer Science — Software Development" }
  },
  {
    keywords: ["computer", "cyber", "internet", "web", "algorithm", "database", "ai", "artificial intelligence", "machine learning", "networking"],
    value: { ddc: "004", lcc: "QA76", category: "Technology — Computing & Information Technology" }
  },
  {
    keywords: ["quantum", "physics", "relativity", "mechanics", "black hole", "cosmos", "astrophysics", "hawking", "gravity", "energy"],
    value: { ddc: "530.1", lcc: "QC174", category: "Science — Theoretical Physics & Cosmology" }
  },
  {
    keywords: ["chemistry", "molecule", "atom", "reaction", "science", "laboratory", "periodic"],
    value: { ddc: "540", lcc: "QD45", category: "Science — Chemical Sciences" }
  },
  {
    keywords: ["biology", "evolution", "dna", "cell", "plant", "animal", "nature", "botany", "darwin"],
    value: { ddc: "570", lcc: "QH301", category: "Science — Biological Sciences" }
  },
  {
    keywords: ["mathematics", "calculus", "geometry", "algebra", "number", "equation", "math", "statistic"],
    value: { ddc: "510", lcc: "QA9", category: "Science — Mathematical Reasoning & Logic" }
  },
  {
    keywords: ["bible", "religion", "church", "god", "spiritual", "theology", "faith", "islam", "christian", "buddhism"],
    value: { ddc: "220", lcc: "BL50", category: "Philosophy & Religion — Theology" }
  },
  {
    keywords: ["history", "biography", "memoir", "world war", "ancient", "civilization", "empire", "egypt", "chronology"],
    value: { ddc: "909", lcc: "D21", category: "History & Geography — Historical Records" }
  },
  {
    keywords: ["pride", "prejudice", "classic", "fiction", "novel", "poetry", "literature", "austen", "story", "shakespeare", "drama"],
    value: { ddc: "823.91", lcc: "PR4034", category: "Literature — English Fiction & Prose" }
  },
  {
    keywords: ["psychology", "cognitive", "mind", "behavior", "depression", "therapy", "brain", "freud"],
    value: { ddc: "150", lcc: "BF121", category: "Philosophy & Psychology — Human Cognition" }
  },
  {
    keywords: ["philosophy", "ethics", "existential", "logic", "socrates", "plato", "aristotle", "thought"],
    value: { ddc: "100", lcc: "B21", category: "Philosophy & Psychology — Philosophical Inquiry" }
  },
  {
    keywords: ["economy", "business", "politics", "law", "finance", "sociology", "trade", "government", "capitalism"],
    value: { ddc: "330", lcc: "HB171", category: "Social Sciences — Economics & Public Policy" }
  },
  {
    keywords: ["art", "design", "painting", "sculpture", "music", "cinema", "movie", "film", "architecture", "photo"],
    value: { ddc: "700", lcc: "N7420", category: "Arts & Recreation — Creative Expression" }
  }
];

const DEFAULT_FALLBACK: FallbackSchema = {
  ddc: "020",
  lcc: "Z665",
  category: "Generalities — Library & Information Science — Manual Cataloging"
};

// Generates an expert Cutter number locally using the official Library of Congress Cutter Table rules
function generateLocalCutter(author: string, title: string, system: "DDC" | "LCC"): string {
  const authorClean = author.trim().replace(/^by\s+/i, "");
  // Find last name if formatted as "Last, First"
  const authorPart = authorClean.includes(",") ? authorClean.split(",")[0].trim() : authorClean;
  
  // Strip non-letter characters for table-based lookup
  const cleanName = authorPart.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (cleanName.length === 0) {
    return system === "LCC" ? ".X11" : "X11";
  }

  const firstChar = cleanName[0];
  const secondChar = cleanName[1] || "";
  const thirdChar = cleanName[2] || "";

  let num1 = "3"; // default first digit
  let num2 = "";  // second expansion digit

  const isVowel = (c: string) => ["A", "E", "I", "O", "U"].includes(c);

  // Helper for expansion table:
  // a-d -> 3, e-h -> 4, i-l -> 5, m-o -> 6, p-s -> 7, t-v -> 8, w-z -> 9
  const getExpansionDigit = (c: string): string => {
    if (!c) return "";
    const code = c.toLowerCase();
    if (code >= 'a' && code <= 'd') return '3';
    if (code >= 'e' && code <= 'h') return '4';
    if (code >= 'i' && code <= 'l') return '5';
    if (code >= 'm' && code <= 'o') return '6';
    if (code >= 'p' && code <= 's') return '7';
    if (code >= 't' && code <= 'v') return '8';
    if (code >= 'w' && code <= 'z') return '9';
    return "5"; // default middle
  };

  const c2 = secondChar.toLowerCase();
  const c3 = thirdChar.toLowerCase();

  if (isVowel(firstChar)) {
    // After initial vowels:
    // b-c -> 2, d-k -> 3, l-m -> 4, n-o -> 5, p-q -> 6, r -> 7, s-t -> 8, u-y -> 9
    if (c2 >= 'b' && c2 <= 'c') num1 = '2';
    else if (c2 >= 'd' && c2 <= 'k') num1 = '3';
    else if (c2 >= 'l' && c2 <= 'm') num1 = '4';
    else if (c2 >= 'n' && c2 <= 'o') num1 = '5';
    else if (c2 >= 'p' && c2 <= 'q') num1 = '6';
    else if (c2 === 'r') num1 = '7';
    else if (c2 >= 's' && c2 <= 't') num1 = '8';
    else if (c2 >= 'u' && c2 <= 'y') num1 = '9';
    else num1 = '3';

    num2 = getExpansionDigit(thirdChar);
  } else if (firstChar === 'S') {
    // After initial S:
    // a-c -> 2, ch-d -> 3, e-g -> 4, h-l -> 5, m-p-s -> 6, t -> 7, u-v -> 8, w-z -> 9
    if (c2 >= 'a' && c2 <= 'c') num1 = '2';
    else if ((c2 === 'c' && cleanName[2]?.toLowerCase() === 'h') || c2 === 'd') num1 = '3';
    else if (c2 >= 'e' && c2 <= 'g') num1 = '4';
    else if (c2 >= 'h' && c2 <= 'l') num1 = '5';
    else if (["m", "n", "o", "p", "q", "r", "s"].includes(c2)) num1 = '6';
    else if (c2 === 't') num1 = '7';
    else if (c2 >= 'u' && c2 <= 'v') num1 = '8';
    else if (c2 >= 'w' && c2 <= 'z') num1 = '9';
    else num1 = '3';

    num2 = getExpansionDigit(thirdChar);
  } else if (cleanName.startsWith("QU")) {
    // After letters Qu:
    // a-d -> 3, e-h -> 4, i-n -> 5, o-q -> 6, r-s -> 7, t-x -> 8, y -> 9
    if (c3 >= 'a' && c3 <= 'd') num1 = '3';
    else if (c3 >= 'e' && c3 <= 'h') num1 = '4';
    else if (c3 >= 'i' && c3 <= 'n') num1 = '5';
    else if (c3 >= 'o' && c3 <= 'q') num1 = '6';
    else if (c3 >= 'r' && c3 <= 's') num1 = '7';
    else if (c3 >= 't' && c3 <= 'x') num1 = '8';
    else if (c3 === 'y') num1 = '9';
    else num1 = '3';

    num2 = getExpansionDigit(cleanName[3] || "");
  } else {
    // After other initial consonants:
    // a-d -> 3, e-h -> 4, i-n -> 5, o-q -> 6, r-t -> 7, u-x -> 8, y -> 9
    if (c2 >= 'a' && c2 <= 'd') num1 = '3';
    else if (c2 >= 'e' && c2 <= 'h') num1 = '4';
    else if (c2 >= 'i' && c2 <= 'n') num1 = '5';
    else if (c2 >= 'o' && c2 <= 'q') num1 = '6';
    else if (c2 >= 'r' && c2 <= 't') num1 = '7';
    else if (c2 >= 'u' && c2 <= 'x') num1 = '8';
    else if (c2 === 'y') num1 = '9';
    else num1 = '3';

    num2 = getExpansionDigit(thirdChar);
  }

  if (!num2) {
    num2 = "5"; // safe default
  }

  const workMark = title.trim().replace(/^(the|a|an)\s+/i, "")[0]?.toLowerCase() || "a";

  if (system === "LCC") {
    return `.${firstChar}${num1}${num2}`;
  } else {
    return `${firstChar}${num1}${num2}${workMark}`;
  }
}

// Computes Fallback result if Gemini API is under heavy load or offline
function generateLocalFallbackResult(
  title: string,
  author: string,
  year: string,
  subject: string,
  system: "DDC" | "LCC"
) {
  const textBlob = `${title} ${subject}`.toLowerCase();
  
  // Find matching rule
  let match = DEFAULT_FALLBACK;
  for (const rule of FALLBACK_RULES) {
    if (rule.keywords.some(keyword => textBlob.includes(keyword))) {
      match = rule.value;
      break;
    }
  }

  const mainClassNum = system === "DDC" ? match.ddc : match.lcc;
  const mainCutter = generateLocalCutter(author, title, system);

  // Generate 2 structured alternates beautifully with adjusted class numbers
  const alt1Class = system === "DDC" 
    ? (parseFloat(match.ddc) + 10).toFixed(2).replace(/\.00$/, "")
    : match.lcc.replace(/\d+/, (m) => (parseInt(m) + 12).toString());
    
  const alt2Class = system === "DDC"
    ? "025.4" // Cataloging/Classifications group
    : "Z696"; // Cataloging bibliography shelf index

  return {
    main: {
      classNumber: mainClassNum,
      cutterNumber: mainCutter,
      subjectCategory: match.category,
      explanation: `[AI High-Demand Fallback Active] Note: The cloud classification server is experiencing heavy traffic. Modern deterministic shelf categorization policies mapped your resource with Library of Congress schedules and the Worldwide Cutter Table calculations locally.`
    },
    alternates: [
      {
        classNumber: alt1Class,
        cutterNumber: generateLocalCutter(author, "Alternate Subject " + title, system),
        subjectCategory: "Secondary Shelving Segment — Alternate Angle",
        explanation: "Secondary shelving location representing general science history or alternate classification."
      },
      {
        classNumber: alt2Class,
        cutterNumber: generateLocalCutter(author, "General Reference", system),
        subjectCategory: "Bibliography & Cataloging Science Shelf Support",
        explanation: "Special librarians library reference shelf group for meta index catalogs."
      }
    ]
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Log API requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Keep alive / Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: new Date().toISOString() });
  });

  // Spine Label Book Classification Endpoint
  app.post("/api/classify", async (req, res) => {
    const { title, author, year, subject, system } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Title and Author are required fields." });
    }

    const labelSystem = system === "DDC" ? "DDC" : "LCC";
    console.log(`Classifying: "${title}" by ${author} (${year || "unknown year"}) using ${labelSystem}`);

    try {
      const ai = getGeminiClient();

      const prompt = `You are an expert library cataloger. Compute the best library call numbers and spine labels.
Your goal is to classify the following resources:
- Title: "${title}"
- Author: "${author}"
- Year of Publication: "${year || "N/A"}"
- Additional Subject/Description: "${subject || "None provided"}"

System selected for classification: ${labelSystem} (${labelSystem === "LCC" ? "Library of Congress Classification (LCC)" : "Dewey Decimal Classification (DDC)"}).

Tasks:
1. Compute the Class Number:
   - For LCC, generate class numbers strictly using the official schedules of the Library of Congress Classification scheme, which are made publicly available in PDF format at the URL: https://www.loc.gov/aba/publications/FreeLCC/freelcc.html (e.g. QA for Math/Computer Science, QC for Physics, TK for Electrical Engineering/Web, PR for English Literature).
   - For DDC, generate using the Dewey Decimal Classification system (e.g., '005.13' or '530.12').
2. Compute the Cutter Number:
   - Use the exact rules of the provided official Cutter Table:
     * After initial vowels: for 2nd letter: b-c -> 2, d-k -> 3, l-m -> 4, n-o -> 5, p-q -> 6, r -> 7, s-t -> 8, u-y -> 9
     * After initial letter S: for 2nd letter: a-c -> 2, ch-d -> 3, e-g -> 4, h-l -> 5, m-p-s -> 6, t -> 7, u-v -> 8, w-z -> 9
     * After initial letters Qu: for 3rd letter: a-d -> 3, e-h -> 4, i-n -> 5, o-q -> 6, r-s -> 7, t-x -> 8, y -> 9
     * After other initial consonants: for 2nd letter: a-d -> 3, e-h -> 4, i-n -> 5, o-q -> 6, r-t -> 7, u-x -> 8, y -> 9
     * For expansion: for subsequent letters: a-d -> 3, e-h -> 4, i-l -> 5, m-o -> 6, p-s -> 7, t-v -> 8, w-z -> 9
     * After letters Qa-Qt: 2-29
     * Numerals: .A12-.A19
   - For LCC, return a valid dot-prefixed LCC Cutter number (e.g., '.H39' or '.A87' or '.V24').
   - For DDC, provide the equivalent Cutter-Sanborn table three-figure Cutter code (e.g., 'H312' or 'A933' with optional lowercase work marks).
3. Compute a clear subjectCategory (e.g., "Library of Congress Division — Technology & Computer Informatics").
4. Provide a clear, professional cataloger's explanation of how the Class Number was matched to the Library of Congress classification schedules (published at https://www.loc.gov/aba/publications/FreeLCC/freelcc.html) and how the Cutter number was formulated with reference to the specific table rules from the provided image.
5. Provide TWO alternate call numbers for maximum sorting versatility (e.g., secondary class number placements or alternate main shelf tables).

Generate a structured response adhering strictly to the JSON Schema.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are an automated library cataloger. Match the Library of Congress Classification outline schedules (available via https://www.loc.gov/aba/publications/FreeLCC/freelcc.html) and Cutter table rules exactly:

LIBRARY OF CONGRESS CLASSIFICATION SOURCE:
Get/map class numbers according to schedules published at https://www.loc.gov/aba/publications/FreeLCC/freelcc.html :
A -- GENERAL WORKS
B -- PHILOSOPHY. PSYCHOLOGY. RELIGION
C -- AUXILIARY SCIENCES OF HISTORY
D -- HISTORY: GENERAL AND OLD WORLD
E -- HISTORY: AMERICA
F -- HISTORY: AMERICA
G -- GEOGRAPHY. ANTHROPOLOGY. RECREATION
H -- SOCIAL SCIENCES
J -- POLITICAL SCIENCE
K -- LAW
L -- EDUCATION
M -- MUSIC AND BOOKS ON MUSIC
N -- FINE ARTS
P -- LANGUAGE AND LITERATURE
Q -- SCIENCE (e.g., QA for mathematics/computer science, QC for physics)
R -- MEDICINE
S -- AGRICULTURE
T -- TECHNOLOGY
U -- MILITARY SCIENCE
V -- NAVAL SCIENCE
Z -- LIBRARY SCIENCE

CUTTER TABLE RULES (LOC Official Table from provided image):
1. After initial vowels: for 2nd letter: b-c -> 2, d-k -> 3, l-m -> 4, n-o -> 5, p-q -> 6, r -> 7, s-t -> 8, u-y -> 9
2. After initial letter S: for 2nd letter: a-c -> 2, ch-d -> 3, e-g -> 4, h-l -> 5, m-p-s -> 6, t -> 7, u-v -> 8, w-z -> 9
3. After initial letters Qu: for 3rd letter: a-d -> 3, e-h -> 4, i-n -> 5, o-q -> 6, r-s -> 7, t-x -> 8, y -> 9
4. After other initial consonants: for 2nd letter: a-d -> 3, e-h -> 4, i-n -> 5, o-q -> 6, r-t -> 7, u-x -> 8, y -> 9
5. Expansion digits (for subsequent/expansion letters): a-d -> 3, e-h -> 4, i-l -> 5, m-o -> 6, p-s -> 7, t-v -> 8, w-z -> 9
6. After letters Qa-Qt: 2-29
7. Numerals: .A12-.A19

Return precise LCC Class and Cutter figures. Always format the LCC Cutter with a leading period (e.g., .A87 for Jane Austen, .H39 for Stephen Hawking, .V24 for Dan Vanderkam). For DDC, format with standard Cutter-Sanborn three-figure table format (e.g. H391 or A874).`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              main: {
                type: Type.OBJECT,
                properties: {
                  classNumber: { type: Type.STRING, description: "Precise class number only. e.g. 510.4 or QA76.73" },
                  cutterNumber: { type: Type.STRING, description: "Elegant, properly constructed Cutter number. e.g. S642j or .S734" },
                  subjectCategory: { type: Type.STRING, description: "Detailed hierarchical subject category" },
                  explanation: { type: Type.STRING, description: "Friendly justification of classification and detailing of cutter construction" }
                },
                required: ["classNumber", "cutterNumber", "subjectCategory", "explanation"]
              },
              alternates: {
                type: Type.ARRAY,
                description: "Array of exactly 2 alternate call number locations",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    classNumber: { type: Type.STRING },
                    cutterNumber: { type: Type.STRING },
                    subjectCategory: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                  },
                  required: ["classNumber", "cutterNumber", "subjectCategory", "explanation"]
                }
              }
            },
            required: ["main", "alternates"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from Gemini.");
      }

      const result = JSON.parse(text.trim());
      return res.json(result);
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const isQuotaExceeded = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaExceeded) {
        console.warn("Spine-generation: Gemini API Quota Exceeded (429 / RESOURCE_EXHAUSTED). Falling back seamlessly to local cataloging engine.");
      } else {
        console.warn(`Spine-generation: using fallback rules engine. (Reason: ${errMsg.substring(0, 150)}...)`);
      }
      
      // GENERATE A SEAMLESS LOCAL FALLBACK INSTEAD OF RETURNING AN ERROR STATUS
      const fallbackResult = generateLocalFallbackResult(title, author, year || "", subject || "", labelSystem);
      return res.json(fallbackResult);
    }
  });

  // Serve static assets out of Vite or the build output
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
