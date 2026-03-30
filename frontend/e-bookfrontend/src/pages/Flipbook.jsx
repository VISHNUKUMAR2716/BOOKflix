import { useLocation, useNavigate } from "react-router-dom";
import HTMLFlipBook from "react-pageflip";
import { Document, Page, pdfjs } from "react-pdf";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "react-pdf/dist/Page/TextLayer.css";

import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function FlipBook() {

  const location = useLocation();
  const navigate = useNavigate();
  const { pdfUrl, audioUrl } = location.state || {};

  const bookRef = useRef(null);
  const flipSound = useRef(null);

  const PAGE_WIDTH = 420;
  const PAGE_HEIGHT = 600;

  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);

  /* TTS & Translation State */
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [languages, setLanguages] = useState([]);

  /* INITIALIZE SOUND & LANGUAGES */

  useEffect(() => {
    flipSound.current = new Audio("/sounds/page-flip.mp3");
    flipSound.current.volume = 0.6;
    
    // Fetch active translation languages
    const fetchLanguages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("https://bookflix-1-o3od.onrender.com/api/languages/active", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.length > 0) {
          setLanguages(res.data);
          setTargetLang(res.data[0].code);
        }
      } catch (err) {
        console.error("Error fetching languages", err);
      }
    };
    fetchLanguages();
  }, []);

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        No Book Selected
      </div>
    );
  }

  /* TEXT EXTRACTION & TTS */

  const extractText = async (pageIndex) => {
    try {
      const doc = await pdfjs.getDocument(pdfUrl).promise;
      const page = await doc.getPage(pageIndex + 1);
      const textContent = await page.getTextContent();
      return textContent.items.map((item) => item.str).join(" ");
    } catch (err) {
      console.error("Text extraction failed", err);
      return "";
    }
  };

  const readAloud = async () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Use selected text if available, otherwise read the whole page.
    let text = window.getSelection().toString().trim();
    if (!text) {
      text = await extractText(currentPage);
    }
    
    if (!text.trim()) return alert("No text selected or found on this page.");

    const utterance = new SpeechSynthesisUtterance(text);
    if (targetLang) {
      utterance.lang = targetLang;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const translateAndRead = async () => {
    setIsTranslating(true);
    setTranslatedText("");
    let text = window.getSelection().toString().trim();
    if (!text) {
      text = await extractText(currentPage);
    }
    
    if (!text.trim()) {
      setIsTranslating(false);
      return alert("No text selected or found to translate.");
    }

    try {
      // Free API limit is 500 chars/request. We chunk it into 450 char segments.
      const chunkText = (str, length) => {
        const chunks = [];
        let i = 0;
        while (i < str.length) {
          let end = i + length;
          if (end < str.length) {
            const lastSpace = str.lastIndexOf(" ", end);
            if (lastSpace > i) end = lastSpace;
          }
          chunks.push(str.substring(i, end));
          i = end + (str[end] === " " ? 1 : 0);
        }
        return chunks;
      };

      const chunks = chunkText(text, 450);
      let fullTranslation = "";

      // Fetch sequentially to avoid rate limiting
      for (let chunk of chunks) {
        if (!chunk.trim()) continue;
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|${targetLang}`);
        const data = await res.json();
        
        // If the API warns about limits, it stores it in responseDetails or translatedText
        if (data.responseData?.translatedText && !data.responseData.translatedText.includes("QUERY LENGTH LIMIT")) {
          fullTranslation += data.responseData.translatedText + " ";
        } else {
          console.error("Translation API Error:", data);
          if (fullTranslation.length === 0) {
            fullTranslation = "API Limit Exceeded: " + (data.responseDetails || data.responseData?.translatedText);
          }
          break; // Stop if there is a rate limit or error
        }
      }

      const finalResult = fullTranslation.trim();
      setTranslatedText(finalResult);

      if (!finalResult.includes("API Limit")) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(finalResult);
        utterance.lang = targetLang;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      alert("Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  /* PAGE FLIP SOUND */

  const playFlipSound = () => {
    if (flipSound.current) {
      flipSound.current.pause();
      flipSound.current.currentTime = 0;
      flipSound.current.play().catch(() => {});
    }
  };

  /* PAGE NAVIGATION */

  const nextPage = () => bookRef.current.pageFlip().flipNext();
  const prevPage = () => bookRef.current.pageFlip().flipPrev();

  const goToPage = (page) => {
    bookRef.current.pageFlip().flip(page);
  };

  /* KEYBOARD CONTROLS */

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  /* BOOKMARK */

  const addBookmark = () => {
    if (!bookmarks.includes(currentPage)) {
      setBookmarks([...bookmarks, currentPage]);
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 font-sans ${darkMode ? "bg-gray-950 text-gray-100" : "bg-[#f4f7fb] text-gray-800"}`}>
      
      {/* BACKGROUND DECORATIONS (Vibrant Blobs) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-500/20 rounded-full blur-[140px] pointer-events-none" />

      {/* GLASSMORPHISM NAV BAR */}
      <nav className={`w-full fixed top-0 z-50 backdrop-blur-2xl px-6 py-4 flex items-center justify-between shadow-sm border-b transition-colors duration-300 ${darkMode ? "bg-gray-900/60 border-gray-800" : "bg-white/60 border-gray-200/50"}`}>
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition ${darkMode ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700" : "bg-white hover:bg-gray-50 text-gray-800 shadow-sm border border-gray-200"}`}
          >
            ← <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 hidden md:block"></div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <span className="text-2xl sm:text-3xl drop-shadow-sm">📖</span> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">BookFlix Reader</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-full transition shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700 text-yellow-400 hover:bg-gray-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`} title="Toggle Dark Mode">
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button onClick={addBookmark} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition text-white shadow-md hover:-translate-y-0.5 bg-emerald-500 hover:bg-emerald-600 border border-emerald-400/50">
            🔖 <span className="hidden sm:inline">Add Bookmark</span>
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <div className="pt-28 pb-32 flex flex-col xl:flex-row items-center xl:items-start justify-center gap-12 px-4 min-h-screen relative z-10 w-full max-w-7xl mx-auto">
        
        {/* LEFT/TOP: TOOLS PANEL (TTS, Translating) */}
        <div className={`flex flex-col gap-6 p-6 rounded-2xl shadow-xl backdrop-blur-xl border w-full xl:w-80 shrink-0 transition-colors duration-300 ${darkMode ? "bg-gray-800/80 border-gray-700" : "bg-white/80 border-white/60"}`}>
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg flex items-center gap-2 tracking-tight">🎧 Focus Tools</h3>
            <p className="text-xs opacity-70 font-medium">Text to speech & Translation</p>
          </div>
          
          <button 
            onClick={readAloud} 
            className={`w-full py-3.5 px-4 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 ${isSpeaking ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/30' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5'}`}
          >
            {isSpeaking ? "⏹ Stop Dictation" : "▶ Read Aloud"}
          </button>

          <hr className={`border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`} />

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌍</span>
              <span className="font-bold text-sm tracking-tight">Translate Content</span>
            </div>
            <select 
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border outline-none font-semibold text-sm appearance-none shadow-sm transition-colors ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-800"} focus:ring-2 focus:ring-indigo-500`}
            >
              {languages.length > 0 ? (
                languages.map(lang => (
                  <option key={lang._id} value={lang.code}>{lang.name}</option>
                ))
              ) : (
                <option value="es">Spanish</option>
              )}
            </select>
            <button 
              onClick={translateAndRead} 
              disabled={isTranslating}
              className={`w-full py-3.5 px-4 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 text-white bg-[#3182ce] hover:bg-[#2b6cb0] hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 ${isTranslating ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isTranslating ? "Translating..." : "Aあ Translate"}
            </button>
          </div>
          
          {translatedText && (
            <div className={`mt-2 p-4 rounded-xl relative shadow-inner ${darkMode ? "bg-yellow-900/20 border border-yellow-700/50" : "bg-yellow-50 border border-yellow-200"}`}>
              <button onClick={() => setTranslatedText("")} className="absolute top-2 right-2 text-red-500 font-bold hover:scale-110 transition">✕</button>
              <h4 className="text-xs font-bold text-yellow-600 dark:text-yellow-400 mb-1 uppercase tracking-wider">Result</h4>
              <p className="text-sm font-medium leading-relaxed">{translatedText}</p>
            </div>
          )}

          {/* AUDIO PLAYER */}
          {audioUrl && (
             <div className="pt-2">
                <h4 className="flex items-center gap-2 font-bold text-sm tracking-tight mb-3">
                  <span className="text-lg">💿</span> Audiobook
                </h4>
                <audio controls src={audioUrl} className="w-full h-10" />
             </div>
          )}
        </div>

        {/* CENTER: THE LOGICAL BOOK CONTAINER */}
        <div className="flex flex-col items-center justify-center w-full max-w-4xl">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center", transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <div className={`relative p-3 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] flex justify-center ${darkMode ? "bg-[#36251c]" : "bg-[#4a2e1b]"}`}>
              
              {/* BOOK SPINE SHADING */}
              <div className="absolute left-1/2 top-0 h-full w-14 -translate-x-1/2 pointer-events-none z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/50 to-transparent"></div>
                <div className="absolute inset-x-4 top-0 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>

              <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                <HTMLFlipBook
                  ref={bookRef}
                  width={PAGE_WIDTH}
                  height={PAGE_HEIGHT}
                  size="fixed"
                  showCover={true}
                  drawShadow={true}
                  usePortrait={false}
                  className="shadow-2xl"
                  onFlip={(e) => {
                    setCurrentPage(e.data);
                    playFlipSound();
                  }}
                >
                  {Array.from(new Array(numPages), (_, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-center overflow-hidden border-r relative transition-colors duration-500 ${darkMode ? "bg-[#cfc4b2] border-black/20" : "bg-[#fdfbf6] border-black/10"}`}
                      style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
                    >
                      {/* Inner page shadow for realism */}
                      <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.04)] pointer-events-none"></div>
                      <Page
                        pageNumber={index + 1}
                        width={PAGE_WIDTH}
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                        className={`transition-all duration-500 ${darkMode ? "sepia-[0.3] contrast-[1.05]" : "sepia-[0.05]"}`}
                      />
                    </div>
                  ))}
                </HTMLFlipBook>
              </Document>

            </div>
          </div>
          
          {/* BOOKMARKS DISPLAY LIST */}
          {bookmarks.length > 0 && (
            <div className="mt-12 max-w-2xl flex gap-3 flex-wrap justify-center w-full">
              {bookmarks.map((page, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(page)}
                  className={`px-4 py-2 text-sm font-bold rounded-xl shadow-sm hover:scale-105 transition-all ${darkMode ? "bg-gray-800 text-emerald-400 border border-emerald-500/30 hover:bg-gray-700" : "bg-white text-emerald-600 border border-gray-200 hover:bg-gray-50"}`}
                >
                  <span className="opacity-50 mr-1 text-xs">GO TO</span>
                  Page {page + 1}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM FLOATING ISLAND DOCK */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-auto">
        <div className={`flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 sm:gap-5 px-6 py-3.5 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-colors duration-300 border ${darkMode ? "bg-gray-900/90 border-gray-700/80 text-white" : "bg-gray-900/95 border-gray-800 text-white shadow-gray-900/30"}`}>
          
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full">
            <button onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))} className="p-2 hover:bg-white/20 rounded-full transition active:scale-95" title="Zoom Out">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
            </button>
            <span className="text-xs font-bold font-mono px-1 w-12 text-center text-gray-300">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(zoom + 0.1)} className="p-2 hover:bg-white/20 rounded-full transition active:scale-95" title="Zoom In">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="w-px h-8 bg-white/20 hidden sm:block mx-1"></div>

          <button onClick={prevPage} className="p-3 bg-indigo-500 hover:bg-indigo-400 rounded-full transition shadow-md hover:shadow-indigo-500/40 active:scale-95" title="Previous Page">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <div className="flex flex-col items-center min-w-[150px] sm:min-w-[200px] bg-white/5 px-4 py-1.5 rounded-2xl border border-white/10">
            {numPages && (
              <span className="text-[11px] font-bold tracking-widest mb-1.5 text-gray-400 uppercase">
                Progress <span className="text-white ml-2">{currentPage + 1} / {numPages}</span>
              </span>
            )}
            {numPages && (
              <input
                type="range"
                min="0"
                max={numPages - 1}
                value={currentPage}
                onChange={(e) => goToPage(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none"
              />
            )}
          </div>

          <button onClick={nextPage} className="p-3 bg-indigo-500 hover:bg-indigo-400 rounded-full transition shadow-md hover:shadow-indigo-500/40 active:scale-95" title="Next Page">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
          </button>

        </div>
      </div>

    </div>
  );
}