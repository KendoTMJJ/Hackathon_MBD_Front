import { useEffect, useState } from "react";
import {
  fetchTechnologyDetailsMock,
  type TechDetails,
} from "../components/TechnicalSheet/tech-details.mock";

export function useTechnologyDetails(id?: string | null) {
  const [data, setData] = useState<TechDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    fetchTechnologyDetailsMock(id)
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e as Error);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  return { data, loading, error };
}
