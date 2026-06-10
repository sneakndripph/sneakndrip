"use client";

import { useState, useEffect } from "react";
import { BRAND } from "@/lib/constants";

type Loc = { code: string; name: string };

interface Props {
  province: string;
  city: string;
  barangay: string;
  onProvinceChange: (name: string) => void;
  onCityChange: (name: string) => void;
  onBarangayChange: (name: string) => void;
  showErrors?: boolean;
}

const BASE = "https://psgc.cloud/api";

const sel: React.CSSProperties = {
  background: "#F8F7F6",
  border: `1px solid ${BRAND.border}`,
  color: BRAND.black,
  width: "100%",
  padding: "12px 16px",
  fontSize: "0.875rem",
  appearance: "none" as const,
  WebkitAppearance: "none",
  outline: "none",
  cursor: "pointer",
};

export default function PhAddressSelect({
  province, city, barangay,
  onProvinceChange, onCityChange, onBarangayChange,
  showErrors = false,
}: Props) {
  const [provinces, setProvinces] = useState<Loc[]>([]);
  const [cities, setCities] = useState<Loc[]>([]);
  const [barangays, setBarangays] = useState<Loc[]>([]);
  const [provCode, setProvCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [loadingProv, setLoadingProv] = useState(true);
  const [loadingCity, setLoadingCity] = useState(false);
  const [loadingBrgy, setLoadingBrgy] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/provinces.json`)
      .then(r => r.json())
      .then((d: Loc[]) => setProvinces(d.slice().sort((a, b) => a.name.localeCompare(b.name))))
      .finally(() => setLoadingProv(false));
  }, []);

  function pickProvince(code: string) {
    const found = provinces.find(p => p.code === code);
    setProvCode(code);
    setCityCode("");
    setCities([]);
    setBarangays([]);
    onProvinceChange(found?.name ?? "");
    onCityChange("");
    onBarangayChange("");
    if (!code) return;
    setLoadingCity(true);
    fetch(`${BASE}/provinces/${code}/cities-municipalities.json`)
      .then(r => r.json())
      .then((d: Loc[]) => setCities(d.slice().sort((a, b) => a.name.localeCompare(b.name))))
      .finally(() => setLoadingCity(false));
  }

  function pickCity(code: string) {
    const found = cities.find(c => c.code === code);
    setCityCode(code);
    setBarangays([]);
    onCityChange(found?.name ?? "");
    onBarangayChange("");
    if (!code) return;
    setLoadingBrgy(true);
    fetch(`${BASE}/cities-municipalities/${code}/barangays.json`)
      .then(r => r.json())
      .then((d: Loc[]) => setBarangays(d.slice().sort((a, b) => a.name.localeCompare(b.name))))
      .finally(() => setLoadingBrgy(false));
  }

  function pickBarangay(code: string) {
    const found = barangays.find(b => b.code === code);
    onBarangayChange(found?.name ?? "");
  }

  const errStyle: React.CSSProperties = { color: BRAND.red, fontSize: "0.7rem", marginTop: 4, fontWeight: 600 };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, color: BRAND.black };

  return (
    <>
      {/* Province */}
      <div>
        <label style={labelStyle}>Province <span style={{ color: BRAND.red }}>*</span></label>
        <div style={{ position: "relative" }}>
          <select
            value={provCode}
            onChange={e => pickProvince(e.target.value)}
            style={{ ...sel, paddingRight: 36 }}
            onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
            onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)}
          >
            <option value="">{loadingProv ? "Loading provinces…" : "Select Province"}</option>
            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: BRAND.muted, fontSize: 12 }}>▼</span>
        </div>
        {showErrors && !province && <p style={errStyle}>Province is required</p>}
      </div>

      {/* City / Municipality */}
      <div>
        <label style={labelStyle}>City / Municipality <span style={{ color: BRAND.red }}>*</span></label>
        <div style={{ position: "relative" }}>
          <select
            value={cityCode}
            onChange={e => pickCity(e.target.value)}
            disabled={!provCode}
            style={{ ...sel, paddingRight: 36, opacity: !provCode ? 0.5 : 1 }}
            onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
            onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)}
          >
            <option value="">{loadingCity ? "Loading cities…" : "Select City / Municipality"}</option>
            {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: BRAND.muted, fontSize: 12 }}>▼</span>
        </div>
        {showErrors && !city && <p style={errStyle}>City / Municipality is required</p>}
      </div>

      {/* Barangay */}
      <div>
        <label style={labelStyle}>Barangay <span style={{ color: BRAND.red }}>*</span></label>
        <div style={{ position: "relative" }}>
          <select
            value={barangays.find(b => b.name === barangay)?.code ?? ""}
            onChange={e => pickBarangay(e.target.value)}
            disabled={!cityCode}
            style={{ ...sel, paddingRight: 36, opacity: !cityCode ? 0.5 : 1 }}
            onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
            onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)}
          >
            <option value="">{loadingBrgy ? "Loading barangays…" : "Select Barangay"}</option>
            {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: BRAND.muted, fontSize: 12 }}>▼</span>
        </div>
        {showErrors && !barangay && <p style={errStyle}>Barangay is required</p>}
      </div>
    </>
  );
}
