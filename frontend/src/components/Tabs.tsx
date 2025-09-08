import React from "react";

export function Tabs({ tabs, current, onChange }:{ tabs: string[]; current: string; onChange:(t:string)=>void }) {
  return (
    <div className="flex gap-2 border-b mb-4">
      {tabs.map(t => (
        <button key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-2 -mb-px border-b-2 ${current===t?'border-blue-600 text-blue-700 font-semibold':'border-transparent text-slate-600 hover:text-slate-900'}`}
        >{t}</button>
      ))}
    </div>
  );
}
