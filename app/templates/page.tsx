"use client";
import { useEffect, useState, useRef } from "react";

type Template = { id: string; name: string; category: string; reportType: string; createdAt: string };

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [reportType, setReportType] = useState("General Report");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => fetch("/api/templates").then((r) => r.json()).then(setTemplates).catch(() => {});
  useEffect(() => { load(); }, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", name || file.name);
    fd.append("category", category);
    fd.append("reportType", reportType);
    await fetch("/api/templates", { method: "POST", body: fd });
    setName("");
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/templates?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Templates</h1>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Upload Template</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="border rounded px-3 py-2" />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="border rounded px-3 py-2" />
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border rounded px-3 py-2">
            <option>Daily Report</option>
            <option>Weekly Report</option>
            <option>General Report</option>
            <option>Research Report</option>
          </select>
          <input ref={fileRef} type="file" accept=".docx,.pdf,.txt" className="border rounded px-3 py-2" />
        </div>
        <button onClick={upload} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded">Upload</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">{t.name}</h3>
            <p className="text-sm text-gray-500">{t.category} · {t.reportType}</p>
            <p className="text-xs text-gray-400">{t.createdAt}</p>
            <button onClick={() => remove(t.id)} className="mt-2 text-red-600 text-sm">Delete</button>
          </div>
        ))}
        {templates.length === 0 && <p className="text-gray-500">No templates yet.</p>}
      </div>
    </div>
  );
}