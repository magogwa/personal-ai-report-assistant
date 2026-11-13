"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard" },
  { href: "/create", label: "Create Report" },
  { href: "/reports", label: "My Reports" },
  { href: "/templates", label: "Templates" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") document.documentElement.classList.add("dark");
  }, []);
  return (
    <aside className="w-64 bg-gradient-to-b from-indigo-900 to-slate-900 text-white min-h-screen p-5 flex flex-col shadow-xl">
      <h1 className="text-2xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300">Report creator</h1>
      <nav className="flex flex-col gap-2">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`px-4 py-2.5 rounded-lg transition-all duration-200 ${pathname === n.href ? "bg-indigo-600 shadow-lg scale-105" : "hover:bg-indigo-800/50 hover:translate-x-1"}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <button onClick={() => { document.documentElement.classList.toggle("dark"); localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light"); }} className="mt-auto px-4 py-2 rounded-lg bg-indigo-800/50 hover:bg-indigo-700 text-sm">Toggle Dark Mode</button>
    </aside>
  );
}