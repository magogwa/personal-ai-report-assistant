"use client";
import { useEffect, useState } from "react";

type Report = { id: string; title: string; reportType: string; status: string; createdAt: string; content?: string };

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const load = () => fetch("/api/reports").then((r) => r.json()).then(setReports).catch(() => {});
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
    load();
  };

  const filtered = reports.filter((r) =>
    (r.title.toLowerCase().includes(search.toLowerCase()) || (r.content || "").toLowerCase().includes(search.toLowerCase())) &&
    (filterType === "" || r.reportType === filterType)
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Reports</h1>
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title" className="border rounded px-3 py-2" />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All types</option>
          <option>Daily Report</option>
          <option>Weekly Report</option>
          <option>General Report</option>
          <option>Research Report</option>
        </select>
      </div>
      <div className="grid gap-3">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded shadow p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{r.title}</h3>
              <p className="text-sm text-gray-500">{r.reportType} · {r.status} · {new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <a href={`/reports/${r.id}/edit`} className="text-green-600 text-sm">Edit</a>
              {generating === r.id ? (
                <div className="w-32">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
                </div>
              ) : (
                <button onClick={async () => {
                  setGenerating(r.id); setProgress(10);
                  const timer = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 500);
                  await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId: r.id }) });
                  clearInterval(timer); setProgress(100);
                  setTimeout(() => { setGenerating(null); setProgress(0); load(); }, 500);
                }} className="text-blue-600 text-sm">Generate</button>
              )}
              <a href={`/api/export-docx?id=${r.id}`} className="text-purple-600 text-sm">Download DOCX</a>
              <button onClick={() => remove(r.id)} className="text-red-600 text-sm">Delete</button>
            </div>
            <a href={`/reports/${r.id}/edit`} className="text-gray-600 text-sm">View report</a>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-gray-500">No reports yet.</p>}
      </div>
    </div>
  );
}