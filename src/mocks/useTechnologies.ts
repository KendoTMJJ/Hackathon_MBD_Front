import { useEffect, useState } from "react";

import type { Technology } from "../mocks/technologies.types";
import {
  fetchTechnologies,
  type FetchTechParams,
} from "../hooks/useTecnologies";

export function useTechnologies(params: FetchTechParams) {
  const [data, setData] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchTechnologies(params)
      .then((rows) => alive && setData(rows))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [JSON.stringify(params)]);

  return { data, loading, error };
}
