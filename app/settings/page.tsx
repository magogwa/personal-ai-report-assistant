"use client";
import { useState, useEffect } from "react";

export default function Settings() {
  const [status, setStatus] = useState("");
  const [guideline, setGuideline] = useState("");
  const [showGuideline, setShowGuideline] = useState(false);
  useEffect(() => { fetch("/api/settings").then((r) => r.json()).then((s) => setGuideline(s.guideline || "")).catch(() => {}); }, []);
  const saveGuideline = async () => {
    const p = prompt("Enter password to save Guideline:");
    if (p !== "10203040") { if (p !== null) alert("Incorrect password"); return; }
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guideline }) });
    setStatus("Guideline saved");
  };
  const backup = () => {
    window.location.href = "/api/backup";
  };
  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = await fetch("/api/restore", { method: "POST", headers: { "Content-Type": "application/json" }, body: text });
    setStatus(res.ok ? "Restored successfully" : "Restore failed");
  };
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-white rounded shadow p-4 space-y-4">
        <div>
          <button onClick={() => {
            const p = prompt("Enter password to access Guideline:");
            if (p === "10203040") setShowGuideline((s) => !s);
            else if (p !== null) alert("Incorrect password");
          }} className="font-semibold mb-2 text-indigo-600">Guideline {showGuideline ? "▲" : "▼"}</button>
          {showGuideline && (
            <>
              <textarea value={guideline} onChange={(e) => setGuideline(e.target.value)} rows={8} className="border rounded px-3 py-2 w-full" placeholder="Paste your reporting guideline here. It will be used as reference for all AI generations." />
              <div className="mt-2 flex gap-2 items-center">
                <input type="file" accept=".md,.txt" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setGuideline(await f.text()); }} className="border rounded px-3 py-2" />
                <button onClick={saveGuideline} className="bg-blue-600 text-white px-4 py-2 rounded">Save Guideline</button>
              </div>
            </>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Backup</h2>
          <button onClick={backup} className="bg-blue-600 text-white px-4 py-2 rounded">Download Backup (db.json)</button>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Restore</h2>
          <input type="file" accept=".json" onChange={restore} />
          {status && <p className="mt-2 text-sm">{status}</p>}
        </div>
      </div>
    </div>
  );
}