import { RawRow } from "./types";
import {
  DEFAULT_SETTINGS,
  FlatInputs,
  MatchResult,
  MatchSettings,
  NearMiss,
  NotChosenFlat,
  PersonName,
  PersonTradeOff,
  RankedFlat,
} from "./types";

const PEOPLE: PersonName[] = ["Kavita", "Riya", "Meera"];
const RIYA_RENT_SHARE_TARGET = 8000;
const MIN_PLAUSIBLE_RENT = 5000;

interface Candidate {
  address: string;
  foundBy: string;
  inputs: FlatInputs;
}

function fmtRupee(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function hasIssue(row: RawRow): string | null {
  if (row.rent === null || row.rent === undefined) return "rent is missing";
  if (row.rent < MIN_PLAUSIBLE_RENT) {
    const guess = row.rent * 10;
    return `${fmtRupee(row.rent)} looks like a typo, maybe ${fmtRupee(guess)}?`;
  }
  if (row.bathrooms === null) return "number of bathrooms is missing";
  if (row.distHinjewadi === null) return "distance to Hinjewadi is missing";
  if (row.distGym === null) return "distance to the gym is missing";
  if (row.distFamily === null) return "distance to family is missing";
  if (!row.address) return "address is missing";
  if (!row.name) return "submitter name is missing";
  return null;
}

function toCandidate(row: RawRow): Candidate {
  const liftOrGround = row.checkins.some((c) => c.includes("lift") || c.includes("ground"));
  const parking = row.checkins.some((c) => c.includes("parking"));
  const petFriendly = row.checkins.some((c) => c.includes("pet"));
  const rent = row.rent as number;

  return {
    address: row.address,
    foundBy: row.name,
    inputs: {
      rent,
      rentPerPerson: rent / 3,
      bathrooms: row.bathrooms as number,
      distHinjewadi: row.distHinjewadi as number,
      distGym: row.distGym as number,
      distFamily: row.distFamily as number,
      liftOrGround,
      parking,
      petFriendly,
    },
  };
}

function brokenRules(inputs: FlatInputs, settings: MatchSettings): string[] {
  const broken: string[] = [];
  if (settings.requireLiftOrGround && !inputs.liftOrGround) {
    broken.push("no lift or ground floor");
  }
  if (inputs.distHinjewadi > settings.maxDistHinjewadi) {
    broken.push(
      `Hinjewadi is ${inputs.distHinjewadi}km away (limit ${settings.maxDistHinjewadi}km)`
    );
  }
  if (inputs.distGym > settings.maxDistGym) {
    broken.push(`gym is ${inputs.distGym}km away (limit ${settings.maxDistGym}km)`);
  }
  return broken;
}

function minMax(values: number[]): { min: number; max: number } {
  return { min: Math.min(...values), max: Math.max(...values) };
}

function closeness(dist: number, limit: number): number {
  const v = 1 - dist / limit;
  return Math.max(0, Math.min(1, v));
}

function normalizeCheaperBetter(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return (max - value) / (max - min);
}

function normalizeCloserBetter(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return (max - value) / (max - min);
}

function scoreCandidate(
  c: Candidate,
  settings: MatchSettings,
  rentRange: { min: number; max: number },
  familyRange: { min: number; max: number }
): number {
  const hinj = closeness(c.inputs.distHinjewadi, settings.maxDistHinjewadi);
  const gym = closeness(c.inputs.distGym, settings.maxDistGym);
  const rentScore = normalizeCheaperBetter(c.inputs.rent, rentRange.min, rentRange.max);
  const extras =
    ((c.inputs.parking ? 1 : 0) +
      (c.inputs.petFriendly ? 1 : 0) +
      (c.inputs.bathrooms >= 3 ? 1 : 0) +
      normalizeCloserBetter(c.inputs.distFamily, familyRange.min, familyRange.max)) /
    4;

  return 35 * hinj + 35 * gym + 15 * rentScore + 15 * extras;
}

function personSatisfaction(person: PersonName, inputs: FlatInputs, settings: MatchSettings): number {
  if (person === "Kavita") {
    const hinj = closeness(inputs.distHinjewadi, settings.maxDistHinjewadi);
    const gym = closeness(inputs.distGym, settings.maxDistGym);
    const family = inputs.distFamily <= 8 ? 1 : Math.max(0, 1 - (inputs.distFamily - 8) / 10);
    return (hinj + gym + family) / 3;
  }
  if (person === "Meera") {
    return ((inputs.liftOrGround ? 1 : 0) + (inputs.parking ? 1 : 0)) / 2;
  }
  // Riya
  const rentOk = inputs.rentPerPerson <= RIYA_RENT_SHARE_TARGET ? 1 : 0;
  return (rentOk + (inputs.petFriendly ? 1 : 0) + (inputs.bathrooms >= 3 ? 1 : 0)) / 3;
}

function personTradeOff(person: PersonName, inputs: FlatInputs): PersonTradeOff {
  const gets: string[] = [];
  const givesUp: string[] = [];

  if (person === "Kavita") {
    gets.push(`${inputs.distHinjewadi}km from Hinjewadi`, `${inputs.distGym}km from the gym`);
    if (inputs.distFamily <= 8) gets.push(`family is close (${inputs.distFamily}km)`);
    else givesUp.push(`family is ${inputs.distFamily}km away`);
  } else if (person === "Meera") {
    if (inputs.liftOrGround) gets.push("lift or ground floor");
    else givesUp.push("no lift or ground floor");
    if (inputs.parking) gets.push("parking available");
    else givesUp.push("no parking");
  } else {
    if (inputs.rentPerPerson <= RIYA_RENT_SHARE_TARGET) {
      gets.push(`rent share is ${fmtRupee(inputs.rentPerPerson)}, within her ${fmtRupee(RIYA_RENT_SHARE_TARGET)} target`);
    } else {
      givesUp.push(
        `rent share is ${fmtRupee(inputs.rentPerPerson)}, ${fmtRupee(
          inputs.rentPerPerson - RIYA_RENT_SHARE_TARGET
        )} over her ${fmtRupee(RIYA_RENT_SHARE_TARGET)} target`
      );
    }
    if (inputs.petFriendly) gets.push("pet friendly");
    else givesUp.push("not pet friendly");
    if (inputs.bathrooms >= 3) gets.push(`${inputs.bathrooms} bathrooms`);
    else givesUp.push(`only ${inputs.bathrooms} bathroom(s)`);
  }

  return { gets, givesUp };
}

function buildTradeOffLine(perPerson: Record<PersonName, PersonTradeOff>): string {
  return PEOPLE.map((p) => {
    const t = perPerson[p];
    if (t.givesUp.length === 0) return `${p}: no compromises`;
    return `${p} gives up ${t.givesUp.join(" and ")}`;
  }).join(" · ");
}

function ruleBasedReason(c: Candidate): string {
  const bits: string[] = [];
  bits.push(`${c.inputs.distHinjewadi}km to Hinjewadi`);
  bits.push(`${c.inputs.distGym}km to the gym`);
  if (c.inputs.parking) bits.push("has parking");
  if (c.inputs.petFriendly) bits.push("pet friendly");
  return `A solid balance: ${bits.join(", ")}, at ${fmtRupee(c.inputs.rent)}/month.`;
}

export function runMatch(rows: RawRow[], settings: MatchSettings = DEFAULT_SETTINGS) {
  const reasonsBy: Record<string, string[]> = {};
  const clean: RawRow[] = [];

  for (const row of rows) {
    const issue = hasIssue(row);
    if (issue) {
      const key = row.name || "Unknown";
      reasonsBy[key] = reasonsBy[key] || [];
      reasonsBy[key].push(`${row.address || "This entry"}: ${issue}`);
      continue;
    }
    clean.push(row);
  }

  const candidates = clean.map(toCandidate);
  const qualifying: Candidate[] = [];
  const nearMisses: NearMiss[] = [];
  const notChosen: NotChosenFlat[] = [];

  for (const c of candidates) {
    const broken = brokenRules(c.inputs, settings);
    if (broken.length === 0) {
      qualifying.push(c);
    } else if (broken.length === 1) {
      nearMisses.push({
        address: c.address,
        foundBy: c.foundBy,
        brokenRule: broken[0],
        inputs: c.inputs,
      });
    } else {
      notChosen.push({
        address: c.address,
        foundBy: c.foundBy,
        why: `Doesn't meet ${broken.length} requirements: ${broken.join("; ")}`,
      });
    }
  }

  let relaxHint: string | null = null;
  if (qualifying.length < 3 && nearMisses.length > 0) {
    const closest = [...nearMisses].sort((a, b) => {
      const da = a.inputs.distHinjewadi - settings.maxDistHinjewadi + (a.inputs.distGym - settings.maxDistGym);
      const db = b.inputs.distHinjewadi - settings.maxDistHinjewadi + (b.inputs.distGym - settings.maxDistGym);
      return da - db;
    })[0];
    relaxHint = `Relaxing "${closest.brokenRule}" would let ${closest.address} qualify.`;
  }

  if (qualifying.length === 0) {
    return {
      qualifying,
      top: [] as RankedFlat[],
      nearMisses,
      notChosen,
      relaxHint,
      reasonsBy,
      totalResponses: rows.length,
    };
  }

  const rentRange = minMax(qualifying.map((c) => c.inputs.rent));
  const familyRange = minMax(qualifying.map((c) => c.inputs.distFamily));

  const scored = qualifying
    .map((c) => ({
      candidate: c,
      score: scoreCandidate(c, settings, rentRange, familyRange),
      minSatisfaction: Math.min(...PEOPLE.map((p) => personSatisfaction(p, c.inputs, settings))),
    }))
    .sort((a, b) => {
      if (Math.abs(b.score - a.score) > 0.0001) return b.score - a.score;
      if (Math.abs(b.minSatisfaction - a.minSatisfaction) > 0.0001) {
        return b.minSatisfaction - a.minSatisfaction;
      }
      return a.candidate.inputs.rent - b.candidate.inputs.rent;
    });

  const top3 = scored.slice(0, 3);
  const rest = scored.slice(3);

  for (const s of rest) {
    notChosen.push({
      address: s.candidate.address,
      foundBy: s.candidate.foundBy,
      why: `Qualified with a score of ${Math.round(s.score)}/100, but ranked outside the top 3.`,
    });
  }

  const top: RankedFlat[] = top3.map((s, idx) => {
    const perPerson = Object.fromEntries(
      PEOPLE.map((p) => [p, personTradeOff(p, s.candidate.inputs)])
    ) as Record<PersonName, PersonTradeOff>;

    return {
      rank: idx + 1,
      address: s.candidate.address,
      foundBy: s.candidate.foundBy,
      score: Math.round(s.score),
      reason: ruleBasedReason(s.candidate),
      tradeOff: buildTradeOffLine(perPerson),
      perPerson,
      inputs: s.candidate.inputs,
    };
  });

  return {
    qualifying,
    top,
    nearMisses,
    notChosen,
    relaxHint,
    reasonsBy,
    totalResponses: rows.length,
  };
}

export function buildMatchResult(
  rows: RawRow[],
  source: "sheet" | "fallback",
  note: string,
  settings: MatchSettings = DEFAULT_SETTINGS
): MatchResult {
  const result = runMatch(rows, settings);
  return {
    source,
    note,
    fetchedAt: new Date().toISOString(),
    totalResponses: result.totalResponses,
    qualifyingCount: result.qualifying.length,
    reasonsBy: result.reasonsBy,
    top: result.top,
    nearMisses: result.nearMisses,
    relaxHint: result.relaxHint,
    notChosen: result.notChosen,
    settings,
  };
}
