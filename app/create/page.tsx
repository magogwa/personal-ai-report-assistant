"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

type Template = { id: string; name: string; reportType: string };

import { Suspense } from "react";

function CreateInner() {
  const [step, setStep] = useState(1);
  const searchParams = useSearchParams();
  const [reportType, setReportType] = useState(searchParams.get("type") || "General Report");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [projectName, setProjectName] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [department, setDepartment] = useState("");
  const [responsibleOfficer, setResponsibleOfficer] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [selectedDaily, setSelectedDaily] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [achievements, setAchievements] = useState("");
  const [challenges, setChallenges] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [planned, setPlanned] = useState("");
  const [aiInstructions, setAiInstructions] = useState("");
  const [docs, setDocs] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");

  useEffect(() => {
    fetch("/api/templates").then((r) => r.json()).then((t: Template[]) => {
      setTemplates(t);
    }).catch(() => {});
    fetch("/api/reports").then((r) => r.json()).then((rs: any[]) => {
      setDailyReports(rs.filter((r) => r.reportType === "Daily Report"));
    }).catch(() => {});
  }, []);

  const filteredTemplates = templates.filter((t) => t.reportType === reportType);

  const uploadDoc = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/documents", { method: "POST", body: fd });
    const data = await res.json();
    setDocs((d) => [...d, data]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const saveDraft = async () => {
    setSaving(true);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, reportType, templateId: templateId || null, projectName, reportingPeriod,
        department, responsibleOfficer, rawNotes: rawNotes + (selectedDaily.length ? "\n\nSource daily reports:\n" + dailyReports.filter((d) => selectedDaily.includes(d.id)).map((d) => d.content || d.rawNotes || "").join("\n---\n") : ""), aiInstructions, supportingDocs: docs,
      }),
    });
    const data = await res.json();
    setSavedId(data.id);
    setSaving(false);
  };

  const steps = ["Select type", "Select template", "Enter info", "Upload docs", "Review", "Save"];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Create Report</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {steps.map((s, i) => (
          <span key={s} className={`px-3 py-1 rounded text-sm ${step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>{i + 1}. {s}</span>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded shadow p-4">
          <label className="block mb-2 font-medium">Report type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border rounded px-3 py-2 w-full">
            <option>Daily Report</option>
            <option>Weekly Report</option>
            <option>General Report</option>
            <option>Research Report</option>
          </select>
          <button onClick={() => setStep(2)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Next</button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded shadow p-4">
          <label className="block mb-2 font-medium">Template (optional)</label>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="border rounded px-3 py-2 w-full">
            <option value="">None (use default structure)</option>
            {filteredTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 rounded border">Back</button>
            <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white rounded shadow p-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Report title" className="border rounded px-3 py-2 w-full" />
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project/programme name" className="border rounded px-3 py-2 w-full" />
          <input value={reportingPeriod} onChange={(e) => setReportingPeriod(e.target.value)} placeholder="Reporting period" className="border rounded px-3 py-2 w-full" />
          <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department/location" className="border rounded px-3 py-2 w-full" />
          <input value={responsibleOfficer} onChange={(e) => setResponsibleOfficer(e.target.value)} placeholder="Responsible officer" className="border rounded px-3 py-2 w-full" />
          {reportType === "Weekly Report" && dailyReports.length > 0 && (
            <div className="border rounded p-3">
              <div className="flex gap-2 mb-2">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
              </div>
              <p className="font-medium mb-2">Select daily reports to include</p>
              {dailyReports.filter((d) => {
                const dt = new Date(d.createdAt).toISOString().slice(0, 10);
                if (startDate && dt < startDate) return false;
                if (endDate && dt > endDate) return false;
                return true;
              }).map((d) => (
                <label key={d.id} className="block text-sm">
                  <input type="checkbox" checked={selectedDaily.includes(d.id)} onChange={(e) => {
                    setSelectedDaily((s) => e.target.checked ? [...s, d.id] : s.filter((x) => x !== d.id));
                  }} /> {d.title} ({new Date(d.createdAt).toLocaleDateString()})
                </label>
              ))}
            </div>
          )}
          <textarea value={rawNotes} onChange={(e) => setRawNotes(e.target.value)} placeholder="Activities conducted" rows={6} className="border rounded px-3 py-2 w-full" />
          <button type="button" onClick={async () => { const res = await fetch("/api/suggest-activities", { method: "POST" }); const d = await res.json(); if (d.result) setRawNotes(d.result); }} className="bg-indigo-600 text-white px-4 py-2 rounded">Suggest activities</button>
          <textarea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} placeholder="Additional AI instructions" rows={3} className="border rounded px-3 py-2 w-full" />
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 rounded border">Back</button>
            <button onClick={() => setStep(4)} className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white rounded shadow p-4">
          <label className="block mb-2 font-medium">Supporting documents</label>
          <input ref={fileRef} type="file" multiple accept=".docx,.pdf,.xlsx,.csv,.txt" className="border rounded px-3 py-2 w-full" />
          <button onClick={uploadDoc} className="mt-2 bg-gray-200 px-4 py-2 rounded">Upload selected</button>
          <ul className="mt-3 text-sm">
            {docs.map((d, i) => <li key={i}>{d.name} ({Math.round(d.size / 1024)} KB)</li>)}
          </ul>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep(3)} className="px-4 py-2 rounded border">Back</button>
            <button onClick={() => setStep(5)} className="bg-blue-600 text-white px-4 py-2 rounded">Next</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="bg-white rounded shadow p-4 space-y-2">
          <h2 className="font-semibold">Review extracted information</h2>
          <p><b>Title:</b> {title}</p>
          <p><b>Type:</b> {reportType}</p>
          <p><b>Project:</b> {projectName}</p>
          <p><b>Period:</b> {reportingPeriod}</p>
          <p><b>Department:</b> {department}</p>
          <p><b>Officer:</b> {responsibleOfficer}</p>
          <p><b>Notes:</b> {rawNotes.slice(0, 200)}{rawNotes.length > 200 ? "..." : ""}</p>
          <p><b>Documents:</b> {docs.length}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep(4)} className="px-4 py-2 rounded border">Back</button>
            <button onClick={() => { saveDraft(); setStep(6); }} className="bg-blue-600 text-white px-4 py-2 rounded">Save Draft</button>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="bg-white rounded shadow p-4">
          {saving ? <p>Saving...</p> : savedId ? <p className="text-green-600">Draft saved. ID: {savedId}</p> : <p>Ready.</p>}
          <a href="/reports" className="mt-4 inline-block bg-gray-200 px-4 py-2 rounded">Go to My Reports</a>
        </div>
      )}
    </div>
  );
}

export default function Create() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <CreateInner />
    </Suspense>
  );
}