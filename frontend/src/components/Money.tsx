export default function Money({ value }:{ value: number }) {
  return <span className={value<0?"text-red-600":"text-slate-900"}>{value.toFixed(2)} €</span>;
}
