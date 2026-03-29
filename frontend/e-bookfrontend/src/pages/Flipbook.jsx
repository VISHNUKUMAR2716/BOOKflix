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
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-slate-100 to-indigo-100"} min-h-screen flex flex-col items-center relative`}>

      {/* BACK BUTTON */}

      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 px-4 py-2 bg-gray-800 text-white rounded-lg shadow hover:bg-gray-700 transition"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mt-6">
        📖 Book Reader
      </h1>

      {/* CONTROLS */}

      <div className="flex flex-wrap gap-4 mt-6 justify-center">

        <button onClick={prevPage} className="px-4 py-2 bg-indigo-600 text-white rounded">
          Prev
        </button>

        <button onClick={nextPage} className="px-4 py-2 bg-indigo-600 text-white rounded">
          Next
        </button>

        <button onClick={() => setZoom(zoom + 0.2)} className="px-4 py-2 bg-blue-600 text-white rounded">
          Zoom +
        </button>

        <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.6))} className="px-4 py-2 bg-blue-600 text-white rounded">
          Zoom -
        </button>

        <button onClick={() => setDarkMode(!darkMode)} className="px-4 py-2 bg-gray-800 text-white rounded">
          Dark Mode
        </button>

        <button onClick={addBookmark} className="px-4 py-2 bg-green-600 text-white rounded">
          Bookmark
        </button>

      </div>

      {/* TTS & TRANSLATION CONTROLS */}
      <div className="flex flex-wrap gap-4 mt-6 justify-center items-center bg-white/50 p-4 rounded-xl shadow-sm border border-gray-200">
        <button 
          onClick={readAloud} 
          className={`px-4 py-2 text-white font-medium rounded transition ${isSpeaking ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'}`}
          title="Select text to read only the selection, otherwise reads the whole page"
        >
          {isSpeaking ? "⏹ Stop Reading" : "🔊 Read Selection / Page"}
        </button>

        <div className="flex items-center gap-2 border-l border-gray-300 pl-4 ml-2">
          <select 
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
            className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded shadow hover:scale-105 transition-transform ${isTranslating ? 'opacity-70 cursor-not-allowed' : ''}`}
            title="Select text to translate only the selection, otherwise translates the whole page"
          >
            {isTranslating ? "Translating..." : "🌍 Translate Selection"}
          </button>
        </div>
      </div>

      {/* AUDIO BOOK PLAYER */}
      {audioUrl && (
        <div className="mt-6 bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">🎧 Listen to Audio Book</p>
          <audio controls src={audioUrl} className="w-80" />
        </div>
      )}

      {/* TRANSLATED TEXT DISPLAY */}
      {translatedText && (
        <div className="mt-6 w-full max-w-2xl bg-yellow-50 p-5 rounded-xl border border-yellow-200 shadow-sm relative">
          <button 
            onClick={() => setTranslatedText("")}
            className="absolute top-2 right-3 text-gray-500 hover:text-red-500 font-bold"
          >
            ✕
          </button>
          <h3 className="font-bold text-gray-800 mb-2">Translated Text:</h3>
          <p className="text-gray-700 leading-relaxed text-sm">{translatedText}</p>
        </div>
      )}

      {/* PAGE SLIDER */}

      {numPages && (
        <input
          type="range"
          min="0"
          max={numPages - 1}
          value={currentPage}
          onChange={(e) => goToPage(Number(e.target.value))}
          className="w-96 mt-6"
        />
      )}

      {/* PAGE NUMBER */}

      {numPages && (
        <div className="mt-4 flex gap-3 items-center">

          <input
            type="number"
            min="1"
            max={numPages}
            placeholder="Go to page"
            className="border px-3 py-1 rounded w-32 text-black"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                goToPage(Number(e.target.value) - 1);
              }
            }}
          />

          <span>
            Page {currentPage + 1} / {numPages}
          </span>

        </div>
      )}

      {/* BOOK AREA */}

      <div className="flex justify-center items-center mt-10 w-full">

        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center"
          }}
        >

          <div className="relative bg-gray-200 p-6 rounded-lg shadow-2xl flex justify-center">

            {/* BOOK SPINE */}

            <div className="absolute left-1/2 top-0 h-full w-10 -translate-x-1/2 pointer-events-none z-10">

              <div className="absolute inset-0 bg-gradient-to-r 
              from-transparent 
              via-gray-300 
              to-transparent opacity-70"></div>

              <div className="absolute inset-0 bg-gradient-to-r 
              from-transparent 
              via-gray-500 
              to-transparent opacity-30 blur-sm"></div>

            </div>

            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >

              <HTMLFlipBook
                ref={bookRef}
                width={PAGE_WIDTH}
                height={PAGE_HEIGHT}
                size="fixed"
                showCover={true}
                drawShadow={true}
                usePortrait={false}
                className="shadow-xl"
                onFlip={(e) => {
                  setCurrentPage(e.data);
                  playFlipSound();
                }}
              >

                {Array.from(new Array(numPages), (_, index) => (

                  <div
                    key={index}
                    className="bg-white flex items-center justify-center overflow-hidden"
                    style={{
                      width: PAGE_WIDTH,
                      height: PAGE_HEIGHT
                    }}
                  >

                    <Page
                      pageNumber={index + 1}
                      width={PAGE_WIDTH}
                      renderAnnotationLayer={false}
                      renderTextLayer={true}
                    />

                  </div>

                ))}

              </HTMLFlipBook>

            </Document>

          </div>

        </div>

      </div>

      {/* BOOKMARK LIST */}

      {bookmarks.length > 0 && (

        <div className="mt-10">

          <h2 className="font-semibold mb-3">
            Bookmarks
          </h2>

          <div className="flex gap-3 flex-wrap justify-center">

            {bookmarks.map((page, index) => (

              <button
                key={index}
                onClick={() => goToPage(page)}
                className="px-3 py-1 bg-yellow-500 text-white rounded"
              >
                Page {page + 1}
              </button>

            ))}

          </div>

        </div>

      )}

    </div>
  );
}