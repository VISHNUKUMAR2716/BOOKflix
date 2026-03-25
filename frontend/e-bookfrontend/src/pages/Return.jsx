import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import axios from "axios";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  Type,
  Upload,
  Sparkles
} from "lucide-react";

export default function Return() {
  const navigate = useNavigate();

  const [pages, setPages] = useState([0]);
  const [activePage, setActivePage] = useState(0);

  const editorRefs = useRef([]);

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertOrderedList: false,
    insertUnorderedList: false,
  });

  /* AUTO CREATE PAGE */

  const handleInput = (index) => {
    const editor = editorRefs.current[index];
    if (!editor) return;

    const isOverflowing = editor.scrollHeight > editor.clientHeight;

    if (isOverflowing && index === pages.length - 1) {
      setPages((prev) => [...prev, prev.length]);

      setTimeout(() => {
        editorRefs.current[index + 1]?.focus();
        setActivePage(index + 1);
      }, 50);
    }
  };

  /* DELETE PAGE */

  const handleKeyDown = (e, index) => {
    const editor = editorRefs.current[index];

    if (e.key === "Backspace") {
      const text = editor.innerText.trim();

      if (text === "" && index > 0) {
        e.preventDefault();

        setPages((prev) => prev.filter((_, i) => i !== index));

        setTimeout(() => {
          editorRefs.current[index - 1]?.focus();
          setActivePage(index - 1);
        }, 50);
      }
    }
  };

  /* FORMAT STATE */

  /* FORMAT STATE */

  const updateFormatState = () => {
    setFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikethrough: document.queryCommandState("strikethrough"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
    });
  };

  /* PUBLISH STATE */
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({
    title: "",
    category: "",
    thumbnail: null,
  });
  const [categories, setCategories] = useState([]);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const contentRef = useRef(null); // Reference wrapper for all pages

  useEffect(() => {
    // Fetch categories when component mounts
    axios
      .get("http://localhost:5000/api/books/categories")
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const handlePublishSubmit = async (e) => {
    e.preventDefault();
    setPublishMessage("");

    if (!publishForm.title || !publishForm.category || !publishForm.thumbnail) {
      setPublishMessage("All details must be filled to publish!");
      return;
    }

    setPublishLoading(true);

    try {
      // 1. Generate PDF from A4 pages
      const element = contentRef.current;
      
      // Options to create a proper A4 PDF matching the look
      const opt = {
        margin:       0,
        filename:     `${publishForm.title.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'px', format: [794, 1123], orientation: 'portrait' } 
      };

      // Generate the PDF blob
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      
      // Convert Blob to File
      const pdfFile = new File([pdfBlob], opt.filename, { type: "application/pdf" });

      // 2. Prepare Form Data
      const formData = new FormData();
      formData.append("title", publishForm.title.trim());
      formData.append("author", "Writer"); // Defaulting author or could be dynamic
      formData.append("category", publishForm.category);
      formData.append("thumbnail", publishForm.thumbnail);
      formData.append("pdf", pdfFile);

      const token = localStorage.getItem("token");

      // 3. Upload to backend
      await axios.post(
        "http://localhost:5000/api/books/user-upload",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPublishMessage("✓ Book published effectively!");
      
      setTimeout(() => {
        navigate("/user", { state: { refresh: true } });
      }, 1500);

    } catch (error) {
      console.error(error);
      setPublishMessage("Failed to publish book. Try again.");
    } finally {
      setPublishLoading(false);
    }
  };

  /* AI GENERATION */
  const [isAILoading, setIsAILoading] = useState(false);

  // NOTE: In a real production app, keep this in .env (e.g., import.meta.env.VITE_OPENAI_API_KEY)
  const OPENAI_API_KEY = "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"; 

  const handleAIGenerate = async () => {
    let apiKey = OPENAI_API_KEY;
    if (!apiKey || apiKey === "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") {
      apiKey = prompt("Please enter your OpenAI API Key to use AI features:");
      if (!apiKey) return;
    }

    // Get all text from all pages
    const fullText = editorRefs.current
      .map((ed) => ed?.innerText || "")
      .join("\n")
      .trim();

    if (!fullText) {
      alert("Please write some text first before using the AI to continue the story!");
      return;
    }

    setIsAILoading(true);
    const activeEditor = editorRefs.current[activePage];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // You can change this to "gpt-4" or "gpt-4o" if you have access
          messages: [
            {
              role: "system",
              content: "You are an expert story writer. Continue writing this story seamlessly from where it left off, matching the tone and style. Only return the continuation text itself. Do not include any preambles, titles, or explanations."
            },
            {
              role: "user",
              content: `Here is the story so far:\n\n${fullText}`
            }
          ]
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const generatedText = data.choices[0].message.content;

      // Ensure active editor has focus and move cursor to end
      if (activeEditor) {
        activeEditor.focus();
        
        // Move cursor to the end of the text
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(activeEditor);
        range.collapse(false); // false means 'to the end'
        sel.removeAllRanges();
        sel.addRange(range);

        // Insert text with a leading space for continuity
        document.execCommand("insertText", false, " " + generatedText.trim());
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert(`AI Generation failed: ${error.message}\nPlease check your API Key.`);
    } finally {
      setIsAILoading(false);
    }
  };

  /* APPLY FORMAT */

  const applyCommand = (command, value = null) => {
    const editor = editorRefs.current[activePage];
    if (!editor) return;

    editor.focus();
    
    // For hiliteColor on standard browsers vs older IE
    if (command === "hiliteColor" && !document.queryCommandSupported("hiliteColor")) {
      command = "backColor";
    }

    document.execCommand(command, false, value);
    updateFormatState();
  };

  const buttonStyle = (active) =>
    `p-2 border rounded transition-colors flex items-center justify-center ${
      active
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-white text-gray-600 hover:bg-gray-100 border-transparent hover:border-gray-200"
    }`;

  return (
    <div className="flex flex-col items-center bg-gray-300 min-h-screen">

     {/* TOOLBAR */}

<div className="sticky top-0 w-full bg-white shadow-md py-3 px-6 relative flex items-center justify-between z-10">
        {/* BACK BUTTON LEFT */}
        <button
          onClick={() => navigate("/user")}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 shrink-0"
        >
          ← Back
        </button>

        {/* CENTER FORMAT BUTTONS */}
        <div className="flex gap-4 items-center flex-wrap justify-center flex-1 mx-4">
          {/* Font Style */}
          <div className="flex gap-1 border-r border-gray-300 pr-4">
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("bold")} className={buttonStyle(formats.bold)} title="Bold"><Bold size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("italic")} className={buttonStyle(formats.italic)} title="Italic"><Italic size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("underline")} className={buttonStyle(formats.underline)} title="Underline"><Underline size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("strikethrough")} className={buttonStyle(formats.strikethrough)} title="Strikethrough"><Strikethrough size={18} /></button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-gray-300 pr-4">
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("justifyLeft")} className={buttonStyle(formats.justifyLeft)} title="Align Left"><AlignLeft size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("justifyCenter")} className={buttonStyle(formats.justifyCenter)} title="Center"><AlignCenter size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("justifyRight")} className={buttonStyle(formats.justifyRight)} title="Align Right"><AlignRight size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("justifyFull")} className={buttonStyle(formats.justifyFull)} title="Justify"><AlignJustify size={18} /></button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-4">
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("insertOrderedList")} className={buttonStyle(formats.insertOrderedList)} title="Numbered List"><ListOrdered size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("insertUnorderedList")} className={buttonStyle(formats.insertUnorderedList)} title="Bullet List"><List size={18} /></button>
          </div>

          {/* Indentation */}
          <div className="flex gap-1 border-r border-gray-300 pr-4">
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("outdent")} className={buttonStyle(false)} title="Decrease Indent"><IndentDecrease size={18} /></button>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => applyCommand("indent")} className={buttonStyle(false)} title="Increase Indent"><IndentIncrease size={18} /></button>
          </div>
          
          {/* Font Size/Heading */}
          <div className="flex gap-2 items-center border-r border-gray-300 pr-4">
            <select 
              onChange={(e) => {
                applyCommand("formatBlock", e.target.value);
                e.target.value = "Format"; // reset
              }}
              defaultValue="Format"
              className="px-2 py-1.5 border rounded bg-white text-sm outline-none cursor-pointer text-gray-700"
              title="Text Format"
            >
              <option value="Format" disabled>Format</option>
              <option value="P">Normal Text</option>
              <option value="H1">Heading 1</option>
              <option value="H2">Heading 2</option>
              <option value="H3">Heading 3</option>
            </select>
            
            <select 
              onChange={(e) => {
                applyCommand("fontSize", e.target.value);
                e.target.value = "Size"; // reset
              }}
              defaultValue="Size"
              className="px-2 py-1.5 border rounded bg-white text-sm outline-none cursor-pointer text-gray-700"
              title="Font Size"
            >
              <option value="Size" disabled>Size</option>
              <option value="1">Small</option>
              <option value="3">Normal</option>
              <option value="5">Large</option>
              <option value="7">Huge</option>
            </select>
          </div>

          {/* Colors */}
          <div className="flex gap-3 items-center">
            <div className="flex flex-col items-center gap-1 cursor-pointer" title="Text Color">
              <Type size={16} className="text-gray-700" />
              <input type="color" onChange={(e) => applyCommand("foreColor", e.target.value)} className="w-5 h-5 p-0 border-0 rounded cursor-pointer shadow-sm" />
            </div>
            <div className="flex flex-col items-center gap-1 cursor-pointer" title="Highlight Color">
              <span className="text-[10px] font-bold bg-yellow-200 text-gray-800 px-1 border border-yellow-400 rounded h-4 flex items-center">ab</span>
              <input type="color" onChange={(e) => applyCommand("hiliteColor", e.target.value)} defaultValue="#ffffff" className="w-5 h-5 p-0 border-0 rounded cursor-pointer shadow-sm" />
            </div>
          </div>
        </div>
        
        {/* RIGHT ACTIONS */}
        <div className="flex gap-3 items-center pr-4">
          <button
            onClick={handleAIGenerate}
            disabled={isAILoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors ${
              isAILoading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200"
            }`}
          >
            <Sparkles size={18} className={isAILoading ? "animate-pulse" : ""} />
            {isAILoading ? "Writing..." : "AI Continue"}
          </button>
          
          <div className="w-px h-8 bg-gray-300 mx-1"></div>

          <button
            onClick={() => setShowPublishModal(true)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md font-medium transition-colors"
          >
            <Upload size={18} />
            Publish Book
          </button>
        </div>
      </div>

      {/* PUBLISH MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setShowPublishModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black text-xl font-bold"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Publish Your Work 📚</h2>
            
            {publishMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${publishMessage.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {publishMessage}
              </div>
            )}

            <form onSubmit={handlePublishSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Book Title</label>
                <input 
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter title..."
                  value={publishForm.title}
                  onChange={(e) => setPublishForm({...publishForm, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={publishForm.category}
                  onChange={(e) => setPublishForm({...publishForm, category: e.target.value})}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Book Cover Thumbnail</label>
                <input 
                  type="file" 
                  accept="image/*"
                  required
                  onChange={(e) => setPublishForm({...publishForm, thumbnail: e.target.files[0]})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <button 
                type="submit" 
                disabled={publishLoading}
                className={`w-full py-3 mt-4 rounded-xl font-bold text-white transition ${publishLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg cursor-pointer'}`}
              >
                {publishLoading ? 'Generating PDF & Publishing...' : 'Confirm Publish'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* A4 PAGES */}

      <div ref={contentRef} className="flex flex-col items-center py-10 gap-10">

        {pages.map((_, index) => (
          <div
            key={index}
            className="bg-white shadow-2xl flex flex-col"
            style={{
              width: "794px",
              height: "1123px",
              padding: "60px",
            }}
          >

            <div
              ref={(el) => (editorRefs.current[index] = el)}
              contentEditable
              suppressContentEditableWarning
              onFocus={() => setActivePage(index)}
              onInput={() => handleInput(index)}
              onKeyUp={updateFormatState}
              onMouseUp={updateFormatState}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="flex-1 outline-none text-gray-800 text-lg leading-7"
              style={{
                direction: "ltr",
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                caretColor: "black",
                fontFamily: "Times New Roman",
                cursor: "text",
                overflow: "hidden",
              }}
            />

            <div className="text-center text-gray-400 text-sm pt-4">
              Page {index + 1}
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}