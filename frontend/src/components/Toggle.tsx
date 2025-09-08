export default function Toggle({ checked, onChange }:{ checked: boolean; onChange:(v:boolean)=>void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition px-1 ${checked?'bg-green-500':'bg-slate-300'}`}
      title={checked ? "Bezahlt" : "Offen"}
    >
      <div className={`w-4 h-4 bg-white rounded-full transition ${checked?'translate-x-6':''}`}></div>
    </button>
  );
}
