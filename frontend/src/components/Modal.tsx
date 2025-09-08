import React from "react";

export default function Modal({ open, onClose, title, children }:{
  open: boolean; onClose: ()=>void; title: string; children: React.ReactNode
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
