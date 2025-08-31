import axios from "axios";
import type { TechDetails } from "./tech-details.mock";
const http = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });
export async function fetchTechnologyDetails(id: string): Promise<TechDetails> {
  const { data } = await http.get(`/tecnologies/${id}`); // o el endpoint que expongas
  return data;
}
