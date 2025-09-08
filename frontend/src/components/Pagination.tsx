export function Pagination({ total, page, pageSize, onPage }:{
  total: number; page: number; pageSize: number; onPage: (p:number)=>void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center gap-2">
      <button className="px-2 py-1 border rounded" disabled={page<=1} onClick={()=>onPage(page-1)}>‹</button>
      <span className="text-sm">Seite {page} / {pages}</span>
      <button className="px-2 py-1 border rounded" disabled={page>=pages} onClick={()=>onPage(page+1)}>›</button>
    </div>
  );
}
