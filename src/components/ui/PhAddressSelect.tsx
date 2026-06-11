"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";

type Loc = { code: string; name: string };
type Step = "region" | "province" | "city" | "barangay";

interface Props {
  province: string;
  city: string;
  barangay: string;
  onProvinceChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onBarangayChange: (v: string) => void;
  showErrors?: boolean;
}

// Simplified region groups matching the reference UI
const GROUPS = [
  { name: "Metro Manila",  regionCodes: ["130000000"], skipProvince: true },
  { name: "North Luzon",   regionCodes: ["010000000", "020000000", "030000000", "140000000"], skipProvince: false },
  { name: "South Luzon",   regionCodes: ["040000000", "050000000", "170000000"], skipProvince: false },
  { name: "Visayas",       regionCodes: ["060000000", "070000000", "080000000"], skipProvince: false },
  { name: "Mindanao",      regionCodes: ["090000000", "100000000", "110000000", "120000000", "160000000", "190000000"], skipProvince: false },
];

async function phFetch(type: string, code: string): Promise<Loc[]> {
  try {
    const res = await fetch(`/api/ph-address?type=${type}&code=${encodeURIComponent(code)}`);
    const data = await res.json();
    return Array.isArray(data) ? (data as Loc[]).sort((a, b) => a.name.localeCompare(b.name)) : [];
  } catch {
    return [];
  }
}

export default function PhAddressSelect({
  province, city, barangay,
  onProvinceChange, onCityChange, onBarangayChange,
  showErrors = false,
}: Props) {
  const [step, setStep]           = useState<Step>("region");
  const [group, setGroup]         = useState<typeof GROUPS[0] | null>(null);
  const [provinces, setProvinces] = useState<Loc[]>([]);
  const [cities, setCities]       = useState<Loc[]>([]);
  const [barangays, setBarangays] = useState<Loc[]>([]);
  const [provCode, setProvCode]   = useState("");
  const [cityCode, setCityCode]   = useState("");
  const [loading, setLoading]     = useState(false);

  const summary = [group?.name, province, city, barangay].filter(Boolean).join(" / ") || "Select region to start";

  async function pickGroup(g: typeof GROUPS[0]) {
    setGroup(g);
    setProvCode(""); setCityCode("");
    setProvinces([]); setCities([]); setBarangays([]);
    onProvinceChange(""); onCityChange(""); onBarangayChange("");
    setLoading(true);

    if (g.skipProvince) {
      onProvinceChange("Metro Manila");
      const data = await phFetch("cities-region", g.regionCodes[0]);
      setCities(data);
      setStep("city");
    } else {
      const all = await Promise.all(g.regionCodes.map(c => phFetch("provinces", c)));
      setProvinces(all.flat().sort((a, b) => a.name.localeCompare(b.name)));
      setStep("province");
    }
    setLoading(false);
  }

  async function pickProvince(p: Loc) {
    setProvCode(p.code);
    onProvinceChange(p.name); onCityChange(""); onBarangayChange("");
    setCityCode(""); setCities([]); setBarangays([]);
    setLoading(true);
    const data = await phFetch("cities-prov", p.code);
    setCities(data);
    setStep("city");
    setLoading(false);
  }

  async function pickCity(c: Loc) {
    setCityCode(c.code);
    onCityChange(c.name); onBarangayChange("");
    setBarangays([]);
    setLoading(true);
    const data = await phFetch("barangays", c.code);
    setBarangays(data);
    setStep("barangay");
    setLoading(false);
  }

  function pickBarangay(b: Loc) {
    onBarangayChange(b.name);
  }

  type TabDef = { key: Step; label: string; value: string; enabled: boolean };
  const tabs: TabDef[] = ([
    { key: "region"   as Step, label: "Region",   value: group?.name ?? "",  enabled: true },
    { key: "province" as Step, label: "Province", value: province,           enabled: !!group && !group.skipProvince },
    { key: "city"     as Step, label: "City",     value: city,               enabled: !!group },
    { key: "barangay" as Step, label: "Barangay", value: barangay,           enabled: !!cityCode },
  ] as TabDef[]).filter(t => t.enabled);

  const opts: Loc[] = step === "province" ? provinces : step === "city" ? cities : step === "barangay" ? barangays : [];

  const errStyle: React.CSSProperties = { color: BRAND.red, fontSize: "0.7rem", marginTop: 4, fontWeight: 600 };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.7rem", fontWeight: 700,
    textTransform: "uppercase" as const, letterSpacing: "0.05em",
    marginBottom: 6, color: BRAND.black,
  };

  return (
    <div className="sm:col-span-2">
      <label style={labelStyle}>
        Region / Province / City / Barangay <span style={{ color: BRAND.red }}>*</span>
      </label>

      {/* Summary */}
      <div style={{
        background: "#F8F7F6",
        border: `1px solid ${BRAND.border}`,
        padding: "10px 16px",
        fontSize: "0.875rem",
        color: group ? BRAND.black : BRAND.muted,
        marginBottom: 2,
      }}>
        {summary}
      </div>

      {/* Picker panel */}
      <div style={{ border: `1px solid ${BRAND.border}`, borderTop: "none", background: BRAND.card }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BRAND.border}` }}>
          {tabs.map(t => (
            <button key={t.key} type="button"
              onClick={() => (t.value || t.key === "region") ? setStep(t.key) : undefined}
              style={{
                flex: 1,
                padding: "9px 6px",
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.04em",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${step === t.key ? BRAND.teal : "transparent"}`,
                color: step === t.key ? BRAND.teal : t.value ? BRAND.black : BRAND.muted,
                cursor: (t.value || t.key === "region") ? "pointer" : "default",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Options */}
        <div style={{ padding: "12px 14px", maxHeight: 170, overflowY: "auto" }}>
          {loading && (
            <p style={{ fontSize: "0.8rem", color: BRAND.muted }}>Loading…</p>
          )}

          {/* Region chips */}
          {!loading && step === "region" && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {GROUPS.map(g => (
                <button key={g.name} type="button" onClick={() => pickGroup(g)}
                  style={{
                    padding: "7px 16px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    border: `1px solid ${group?.name === g.name ? BRAND.teal : BRAND.border}`,
                    background: group?.name === g.name ? BRAND.teal : "transparent",
                    color: group?.name === g.name ? "#fff" : BRAND.black,
                    cursor: "pointer",
                  }}>
                  {g.name}
                </button>
              ))}
            </div>
          )}

          {/* Province / City / Barangay chips */}
          {!loading && step !== "region" && opts.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {opts.map(loc => {
                const isSelected =
                  step === "province" ? province === loc.name :
                  step === "city"     ? city === loc.name :
                                        barangay === loc.name;
                return (
                  <button key={loc.code} type="button"
                    onClick={() =>
                      step === "province" ? pickProvince(loc) :
                      step === "city"     ? pickCity(loc) :
                                           pickBarangay(loc)
                    }
                    style={{
                      padding: "5px 11px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      border: `1px solid ${isSelected ? BRAND.teal : BRAND.border}`,
                      background: isSelected ? BRAND.teal : "transparent",
                      color: isSelected ? "#fff" : BRAND.black,
                      cursor: "pointer",
                    }}>
                    {loc.name}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && step !== "region" && opts.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: BRAND.muted }}>
              {step === "province" ? "No provinces found." :
               step === "city"     ? "No cities found." :
                                     "No barangays found."}
            </p>
          )}
        </div>
      </div>

      {showErrors && !province && <p style={errStyle}>Province is required</p>}
      {showErrors && !city    && <p style={errStyle}>City / Municipality is required</p>}
      {showErrors && !barangay && <p style={errStyle}>Barangay is required</p>}
    </div>
  );
}
