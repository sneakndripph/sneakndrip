"use client";

import { useState, useEffect, useRef } from "react";
import { BRAND, FONTS } from "@/lib/constants";
import { UserPlus, Shield, User, Trash2, X, Eye, EyeOff, ChevronDown, Check } from "lucide-react";

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
  const [roleOpen, setRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement>(null);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [viewRoleOpen, setViewRoleOpen] = useState(false);
  const [viewRole, setViewRole] = useState("customer");
  const viewRoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (viewRoleRef.current && !viewRoleRef.current.contains(e.target as Node)) setViewRoleOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) setRoleOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

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
    setViewUser(null);
    loadUsers();
  }

  function openViewUser(u: UserRow) {
    setViewUser(u);
    setViewRole(u.role);
    setViewRoleOpen(false);
  }

  async function handleViewRoleChange(role: string) {
    if (!viewUser) return;
    setViewRole(role);
    setViewRoleOpen(false);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: viewUser.id, role, full_name: viewUser.full_name }),
    });
    setUsers(prev => prev.map(u => u.id === viewUser.id ? { ...u, role } : u));
    setViewUser(prev => prev ? { ...prev, role } : null);
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
                <tr key={u.id}
                  className="transition-colors hover:bg-black/[0.02] cursor-pointer"
                  style={{ borderBottom: i < users.length - 1 ? `1px solid ${BRAND.border}` : "none" }}
                  onClick={() => openViewUser(u)}>
                  <td className="px-5 py-4">
                    <p className="font-semibold" style={{ color: BRAND.black }}>{u.full_name || "—"}</p>
                    <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>{u.email}</p>
                  </td>
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    {editingRole?.id === u.id ? (
                      <div className="relative inline-block">
                        <div className="shadow-lg overflow-hidden z-50"
                          style={{ background: BRAND.card, border: `1px solid ${BRAND.teal}`, minWidth: 110 }}>
                          {ROLES.map(r => (
                            <button key={r} type="button"
                              onClick={() => { setEditingRole({ id: u.id, role: r }); handleRoleChange(u.id, r, u.full_name); }}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors hover:opacity-80"
                              style={{
                                background: editingRole.role === r ? `${BRAND.teal}12` : "transparent",
                                color: editingRole.role === r ? BRAND.teal : BRAND.black,
                                fontWeight: editingRole.role === r ? 700 : 500,
                              }}>
                              {r === "admin" ? <Shield className="w-3 h-3 mr-1.5 shrink-0" /> : <User className="w-3 h-3 mr-1.5 shrink-0" />}
                              {r}
                              {editingRole.role === r && <Check className="w-3 h-3 ml-auto shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
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
                  <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
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
                <div className="relative" ref={roleRef}>
                  <button type="button" onClick={() => setRoleOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold focus:outline-none transition-colors"
                    style={{ ...inputStyle, border: `1px solid ${roleOpen ? BRAND.teal : BRAND.border}` }}>
                    <div className="flex items-center gap-2">
                      {form.role === "admin" ? <Shield className="w-4 h-4" style={{ color: BRAND.teal }} /> : <User className="w-4 h-4" style={{ color: BRAND.muted }} />}
                      <span style={{ color: BRAND.black }}>{form.role.charAt(0).toUpperCase() + form.role.slice(1)}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: BRAND.muted, transform: roleOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                  {roleOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden shadow-lg"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      {ROLES.map(r => (
                        <button key={r} type="button"
                          onClick={() => { setForm(f => ({ ...f, role: r })); setRoleOpen(false); }}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:opacity-80"
                          style={{
                            background: form.role === r ? `${BRAND.teal}10` : "transparent",
                            color: form.role === r ? BRAND.teal : BRAND.black,
                            borderBottom: `1px solid ${BRAND.border}`,
                            fontWeight: form.role === r ? 700 : 500,
                          }}>
                          <div className="flex items-center gap-2">
                            {r === "admin" ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </div>
                          {form.role === r && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
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

      {/* View user modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div>
                <p className="font-black text-lg" style={{ color: BRAND.black }}>{viewUser.full_name || "—"}</p>
                <p className="text-sm mt-0.5" style={{ color: BRAND.muted }}>{viewUser.email}</p>
              </div>
              <button onClick={() => setViewUser(null)} className="transition-opacity hover:opacity-60 mt-1">
                <X className="w-5 h-5" style={{ color: BRAND.muted }} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.muted }}>Role</label>
                <div className="relative" ref={viewRoleRef}>
                  <button type="button" onClick={() => setViewRoleOpen(o => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold focus:outline-none"
                    style={{ background: BRAND.bg, border: `1px solid ${viewRoleOpen ? BRAND.teal : BRAND.border}`, color: BRAND.black }}>
                    <div className="flex items-center gap-2">
                      {viewRole === "admin" ? <Shield className="w-4 h-4" style={{ color: BRAND.teal }} /> : <User className="w-4 h-4" style={{ color: BRAND.muted }} />}
                      <span>{viewRole.charAt(0).toUpperCase() + viewRole.slice(1)}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: BRAND.muted, transform: viewRoleOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                  {viewRoleOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden shadow-lg"
                      style={{ background: BRAND.card, border: `1px solid ${BRAND.border}` }}>
                      {ROLES.map(r => (
                        <button key={r} type="button"
                          onClick={() => handleViewRoleChange(r)}
                          className="w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-colors hover:opacity-80"
                          style={{
                            background: viewRole === r ? `${BRAND.teal}10` : "transparent",
                            color: viewRole === r ? BRAND.teal : BRAND.black,
                            borderBottom: `1px solid ${BRAND.border}`,
                            fontWeight: viewRole === r ? 700 : 500,
                          }}>
                          <div className="flex items-center gap-2">
                            {r === "admin" ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </div>
                          {viewRole === r && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.muted }}>Joined</p>
                  <p style={{ color: BRAND.black }}>
                    {new Date(viewUser.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: BRAND.muted }}>Last Sign In</p>
                  <p style={{ color: BRAND.black }}>
                    {viewUser.last_sign_in
                      ? new Date(viewUser.last_sign_in).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => { handleDelete(viewUser.id, viewUser.email); }}
                className="px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${BRAND.red}`, color: BRAND.red }}>
                Delete
              </button>
              <button onClick={() => setViewUser(null)}
                className="flex-1 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity hover:opacity-70"
                style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
