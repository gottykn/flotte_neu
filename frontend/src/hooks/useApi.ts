import { useEffect, useState } from "react";

export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    fn().then(d => { if (active) setData(d); })
       .catch(e => active && setError(e))
       .finally(() => active && setLoading(false));
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: () => fn().then(setData) };
}
