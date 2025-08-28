import { useEffect, useState } from "react";
import { fetchTechnologies, type FetchTechParams } from "./technologies.api";
import type { Technology } from "./technologies.types";

export function useTechnologies(params: FetchTechParams) {
  const [data, setData] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTechnologies(params)
      .then((rows) => {
        if (alive) setData(rows);
      })
      .catch((e) => {
        if (alive) setError(e as Error);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [JSON.stringify(params)]);

  return { data, loading, error };
}
