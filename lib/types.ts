export type PersonName = "Kavita" | "Riya" | "Meera";

export interface FlatInputs {
  rent: number;
  rentPerPerson: number;
  bathrooms: number;
  distHinjewadi: number;
  distGym: number;
  distFamily: number;
  liftOrGround: boolean;
  parking: boolean;
  petFriendly: boolean;
}

export interface RawRow {
  timestamp: string;
  name: string;
  address: string;
  checkins: string[];
  rent: number | null;
  bathrooms: number | null;
  distHinjewadi: number | null;
  distGym: number | null;
  distFamily: number | null;
}

export interface PersonTradeOff {
  gets: string[];
  givesUp: string[];
}

export interface RankedFlat {
  rank: number;
  address: string;
  foundBy: string;
  score: number;
  reason: string;
  tradeOff: string;
  perPerson: Record<PersonName, PersonTradeOff>;
  inputs: FlatInputs;
}

export interface NearMiss {
  address: string;
  foundBy: string;
  brokenRule: string;
  inputs: FlatInputs;
}

export interface NotChosenFlat {
  address: string;
  foundBy: string;
  why: string;
}

export interface MatchSettings {
  requireLiftOrGround: boolean;
  maxDistHinjewadi: number;
  maxDistGym: number;
}

export const DEFAULT_SETTINGS: MatchSettings = {
  requireLiftOrGround: true,
  maxDistHinjewadi: 6,
  maxDistGym: 5,
};

export interface MatchResult {
  source: "sheet" | "fallback";
  note: string;
  fetchedAt: string;
  totalResponses: number;
  qualifyingCount: number;
  reasonsBy: Record<string, string[]>;
  top: RankedFlat[];
  nearMisses: NearMiss[];
  relaxHint: string | null;
  notChosen: NotChosenFlat[];
  settings: MatchSettings;
}
