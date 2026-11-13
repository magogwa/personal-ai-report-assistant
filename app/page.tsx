"use client";
import { useEffect, useState } from "react";

type Stats = { total: number; drafts: number; completed: number; templates: number };

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, drafts: 0, completed: 0, templates: 0 });

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "Total Reports", value: stats.total },
    { label: "Draft Reports", value: stats.drafts },
    { label: "Completed Reports", value: stats.completed },
    { label: "Templates", value: stats.templates },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {cards.map((c) => (
          <a key={c.label} href={c.label === "Templates" ? "/templates" : "/reports"} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 hover:-translate-y-1 cursor-pointer block">
            <p className="text-gray-500 text-sm font-medium">{c.label}</p>
            <p className="text-4xl font-bold text-indigo-600 mt-2">{c.value}</p>
          </a>
        ))}
      </div>
      <div className="flex gap-4 flex-wrap">
        <a href="/create" className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform">Create New Report</a>
        <a href="/create?type=Weekly%20Report" className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform border border-indigo-200">Generate Weekly Report</a>
        <a href="/templates" className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform border border-indigo-200">Manage Templates</a>
        <a href="/reports" className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform border border-indigo-200">View Reports</a>
      </div>
    </div>
  );
}