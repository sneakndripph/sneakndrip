"use client";

import { useState, useEffect } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { UserPlus, Shield, User, Trash2, X, Eye, EyeOff } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
};

const ROLES = ["customer", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "customer" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: string; role: string } | null>(null);

  async function loadUsers() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const { users: u } = await res.json();
      setUsers(u);
    }
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ email: "", password: "", full_name: "", role: "customer" });
      loadUsers();
    } else {
      const err = await res.json().catch(() => ({}));
      setFormError(err.error ?? "Failed to create user");
    }
    setSaving(false);
  }

  async function handleRoleChange(id: string, role: string, full_name: string) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role, full_name }),
    });
    setEditingRole(null);
    loadUsers();
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadUsers();
  }

  const inputCls = "w-full px-4 py-3 text-sm focus:outline-none transition-colors";
  const inputStyle = { background: "#F8F7F6", border: `1px solid ${BRAND.border}`, color: BRAND.black };

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontFamily: FONTS.display, fontSize: "2rem", letterSpacing: "0.04em", color: BRAND.black }}>USERS</h1>
          <p className="text-sm mt-1" style={{ color: BRAND.muted }}>{users.length} accounts</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-80"
          style={{ background: BRAND.teal, color: "#fff" }}
        >
          <UserPlus className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BRAND.border}`, background: BRAND.card }}>
        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: BRAND.muted }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm" style={{ color: BRAND.muted }}>No users found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BRAND.border}`, background: "#F8F7F6" }}>
                {["User", "Role", "Joined", "Last Sign In", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? `1px solid ${BRAND.border}` : "none" }}>
                  <td className="px-5 py-4">
                    <p className="font-semibold" style={{ color: BRAND.black }}>{u.full_name || "—"}</p>
                    <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>{u.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    {editingRole?.id === u.id ? (
                      <select
                        value={editingRole.role}
                        onChange={e => setEditingRole({ id: u.id, role: e.target.value })}
                        onBlur={() => handleRoleChange(u.id, editingRole.role, u.full_name)}
                        className="text-xs px-2 py-1 focus:outline-none"
                        style={{ border: `1px solid ${BRAND.teal}`, background: BRAND.card, color: BRAND.black }}
                        autoFocus
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingRole({ id: u.id, role: u.role })}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                        style={{
                          background: u.role === "admin" ? `${BRAND.teal}18` : `${BRAND.border}`,
                          color: u.role === "admin" ? BRAND.teal : BRAND.muted,
                        }}
                      >
                        {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {u.role}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: BRAND.muted }}>
                    {new Date(u.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: BRAND.muted }}>
                    {u.last_sign_in
                      ? new Date(u.last_sign_in).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                      : "Never"}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className="p-1.5 rounded transition-opacity hover:opacity-70"
                      style={{ color: BRAND.red }}
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl p-7" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-lg" style={{ color: BRAND.black }}>Create New User</h2>
              <button onClick={() => setShowModal(false)} style={{ color: BRAND.muted }}><X className="w-5 h-5" /></button>
            </div>

            {formError && (
              <div className="mb-4 px-4 py-3 rounded text-sm font-medium"
                style={{ background: `${BRAND.red}12`, color: BRAND.red, border: `1px solid ${BRAND.red}30` }}>
                {formError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Full Name</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Juan Dela Cruz" className={inputCls} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                  onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                  Email Address <span style={{ color: BRAND.red }}>*</span>
                </label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@email.com" required className={inputCls} style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                  onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>
                  Password <span style={{ color: BRAND.red }}>*</span>
                </label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters" required className={`${inputCls} pr-12`} style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                    onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: BRAND.muted }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: BRAND.black }}>Role</label>
                <div className="relative">
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className={inputCls} style={{ ...inputStyle, appearance: "none", paddingRight: 36, cursor: "pointer" }}
                    onFocus={e => (e.currentTarget.style.borderColor = BRAND.teal)}
                    onBlur={e => (e.currentTarget.style.borderColor = BRAND.border)}>
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-xs" style={{ color: BRAND.muted }}>▼</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-opacity hover:opacity-70"
                  style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.muted }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 font-bold text-sm uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: BRAND.teal }}>
                  {saving ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
