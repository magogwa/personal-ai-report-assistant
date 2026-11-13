"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

export default function Editor() {
  const params = useParams();
  const id = params?.id as string;
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((rs) => {
      const r = rs.find((x: any) => x.id === id);
      if (r) { setTitle(r.title); setContent(r.content || ""); setSource(r.rawNotes || ""); }
    });
  }, [id]);

  const pushHistory = (c: string) => { setHistory((h) => [...h, content]); setRedoStack([]); setContent(c); };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [content, ...r]);
    setHistory((h) => h.slice(0, -1));
    setContent(prev);
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((h) => [...h, content]);
    setRedoStack((r) => r.slice(1));
    setContent(next);
  };

  const aiAction = async (action: string) => {
    setActiveAction(action); setAiProgress(10);
    const timer = setInterval(() => setAiProgress((p) => Math.min(p + 8, 90)), 400);
    const sel = window.getSelection()?.toString() || content;
    const res = await fetch("/api/edit-section", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: sel, action, source }) });
    const data = await res.json();
    clearInterval(timer); setAiProgress(100);
    if (sel === content) pushHistory(data.result); else document.execCommand("insertText", false, data.result);
    setTimeout(() => { setActiveAction(null); setAiProgress(0); }, 400);
  };

  const save = async () => {
    await fetch("/api/reports", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content }) });
  };

  useEffect(() => {
    const t = setInterval(save, 10000);
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } };
    window.addEventListener("keydown", onKey);
    return () => { clearInterval(t); window.removeEventListener("keydown", onKey); };
  }, [content]);

  const exportTxt = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title || "report"}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <h1 className="text-xl font-bold">{title}</h1>
        <button onClick={undo} className="px-3 py-1 border rounded active:scale-95 active:opacity-70 transition">Undo</button>
        <button onClick={redo} className="px-3 py-1 border rounded active:scale-95 active:opacity-70 transition">Redo</button>
        <button onClick={save} className="px-3 py-1 bg-blue-600 text-white rounded active:scale-95 active:opacity-70 transition">Save</button>
        <button onClick={exportTxt} className="px-3 py-1 bg-gray-200 rounded active:scale-95 active:opacity-70 transition">Export TXT</button>
        <button onClick={exportPdf} className="px-3 py-1 bg-gray-200 rounded active:scale-95 active:opacity-70 transition">Print/PDF</button>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {["improve","professional","expand","summarize","clarity","formal","consistency"].map((a) => (
          <button key={a} onClick={() => aiAction(a)} disabled={!!activeAction} className="relative px-3 py-1 bg-gray-200 rounded text-sm disabled:opacity-50 overflow-hidden">
            {a}
            {activeAction === a && (
              <span className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${aiProgress}%` }}></span>
            )}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="bg-white rounded shadow p-6 min-h-[60vh] prose max-w-none"
        dangerouslySetInnerHTML={{ __html: (content || "").replace(/\n/g, "<br/>") }}
        onBlur={(e) => setContent((e.target as any).innerText)}
      />
    </div>
  );
}