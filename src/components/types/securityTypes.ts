export interface SecurityNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon: string;
    category: SecurityCategory;
    manufacturer?: string;
    description?: string;
    specifications?: string[];
    zone?: SecurityZone;
  };
}

export interface SecurityZone {
  id: string;
  name: string;
  color: string;
  description: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export type SecurityCategory =
  | "firewall"
  | "waf"
  | "proxy"
  | "nac"
  | "ips"
  | "ids"
  | "siem"
  | "endpoint"
  | "encryption"
  | "authentication"
  | "monitoring"
  | "backup"
  | "server"
  | "network";

export interface SecurityTechnology {
  id: string;
  name: string;
  icon: string;
  category: SecurityCategory;
  manufacturer: string;
  description: string;
  specifications: string[];
  color: string;
}
