import { MatchSettings } from "@/lib/types";

export default function AdjustPanel({
  settings,
  onChange,
}: {
  settings: MatchSettings;
  onChange: (next: MatchSettings) => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.requireLiftOrGround}
          onChange={(e) => onChange({ ...settings, requireLiftOrGround: e.target.checked })}
          className="h-4 w-4 accent-accent"
        />
        Require lift or ground floor
      </label>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span>Max distance to Hinjewadi</span>
          <span className="font-medium">{settings.maxDistHinjewadi} km</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={settings.maxDistHinjewadi}
          onChange={(e) => onChange({ ...settings, maxDistHinjewadi: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span>Max distance to the gym</span>
          <span className="font-medium">{settings.maxDistGym} km</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={settings.maxDistGym}
          onChange={(e) => onChange({ ...settings, maxDistGym: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>
    </div>
  );
}
