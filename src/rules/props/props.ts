import type { ZoneKind } from "../../mocks/technologies.types";

export type SubzoneRule = {
  id: string;
  name: string;
  requiredTechs?: string[];
  optionalTechs?: string[];
  requiredChecks?: string[];
};

export type ZoneRuleSet = {
  zone: ZoneKind;
  subzones: SubzoneRule[];
};
