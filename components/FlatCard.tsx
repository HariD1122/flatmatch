import { RankedFlat } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

function rupee(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function InputTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-muted px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-foreground-muted">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export default function FlatCard({ flat }: { flat: RankedFlat }) {
  const isFirst = flat.rank === 1;

  return (
    <div
      className={`rounded-2xl bg-surface p-5 shadow-sm border ${
        isFirst ? "border-accent border-2 shadow-md" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl">{MEDALS[flat.rank - 1]}</div>
          <h3 className="mt-1 text-lg font-semibold leading-snug">{flat.address}</h3>
          <p className="text-sm text-foreground-muted">found by {flat.foundBy}</p>
        </div>
        <div className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-strong">
          {flat.score}/100
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-strong">
        {flat.reason}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <InputTile label="Total rent" value={rupee(flat.inputs.rent)} />
        <InputTile label="Per person" value={rupee(flat.inputs.rentPerPerson)} />
        <InputTile label="To Hinjewadi" value={`${flat.inputs.distHinjewadi} km`} />
        <InputTile label="To gym" value={`${flat.inputs.distGym} km`} />
        <InputTile label="To family" value={`${flat.inputs.distFamily} km`} />
        <InputTile label="Bathrooms" value={String(flat.inputs.bathrooms)} />
        <InputTile label="Lift/ground" value={flat.inputs.liftOrGround ? "Yes" : "No"} />
        <InputTile label="Parking" value={flat.inputs.parking ? "Yes" : "No"} />
        <InputTile label="Pet friendly" value={flat.inputs.petFriendly ? "Yes" : "No"} />
      </div>

      <p className="mt-3 text-xs text-foreground-muted">
        <span className="font-medium text-foreground">Compromises: </span>
        {flat.tradeOff}
      </p>
    </div>
  );
}
