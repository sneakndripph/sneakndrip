"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Shield, User, Trash2, X, Eye, EyeOff, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in: string | null;
};

const ROLES = ["customer", "admin"];

const inputCls = "w-full px-3.5 py-2.5 text-admin bg-paper border border-line rounded-md text-ink placeholder:text-ink-3 focus:outline-none focus:border-line-strong transition-colors duration-admin-fast";
const labelCls = "block text-admin-eyebrow text-ink-3 mb-1.5";

function RoleIcon({ role, className }: { role: string; className?: string }) {
  return role === "admin" ? <Shield className={className} /> : <User className={className} />;
}

function RoleDropdown({ value, onChange, open, setOpen }: {
  value: string; onChange: (r: string) => void; open: boolean; setOpen: (o: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [setOpen]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-admin bg-paper border rounded-md text-ink focus:outline-none transition-colors duration-admin-fast ${
          open ? "border-line-strong" : "border-line"
        }`}>
        <div className="flex items-center gap-2">
          <RoleIcon role={value} className="w-3.5 h-3.5 text-ink-3" />
          <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-ink-3 transition-transform duration-admin-fast ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-md border border-line bg-paper shadow-lg">
          {ROLES.map(r => (
            <button key={r} type="button" onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-admin-sm text-left border-b border-line last:border-b-0 transition-colors duration-admin-fast ${
                value === r ? "bg-admin-row-hover text-ink font-medium" : "text-ink-2 hover:bg-admin-row-hover"
              }`}>
              <div className="flex items-center gap-2">
                <RoleIcon role={r} className="w-3.5 h-3.5" />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </div>
              {value === r && <Check className="w-3.5 h-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "customer" });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [viewRoleOpen, setViewRoleOpen] = useState(false);
  const [viewRole, setViewRole] = useState("customer");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
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
      toast.success("User created");
    } else {
      const err = await res.json().catch(() => ({}));
      const errorMessage = err.error as string | undefined;
      setFormError(errorMessage ?? "Failed to create user");
      toast.error(errorMessage || "Couldn't create user. Try again.");
    }
    setSaving(false);
  }

  async function executeDelete() {
    if (!deleteTarget) return;
    const userName = deleteTarget.full_name || deleteTarget.email;
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errorMessage = err.error as string | undefined;
      toast.error(errorMessage || "Couldn't delete user. Try again.");
      throw new Error("delete failed");
    }
    setViewUser(null);
    loadUsers();
    toast.success(`${userName} deleted`);
  }

  function openViewUser(u: UserRow) {
    setViewUser(u);
    setViewRole(u.role);
    setViewRoleOpen(false);
  }

  async function handleViewRoleChange(role: string) {
    if (!viewUser) return;
    setViewRoleOpen(false);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: viewUser.id, role, full_name: viewUser.full_name }),
    });
    if (!res.ok) {
      toast.error("Couldn't change role. Try again.");
      return;
    }
    setViewRole(role);
    setUsers(prev => prev.map(u => u.id === viewUser.id ? { ...u, role } : u));
    setViewUser(prev => prev ? { ...prev, role } : null);
    toast.success(`Role changed to ${role}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p className="text-admin-eyebrow text-ink-3 mb-1">Access</p>
          <h1 className="text-admin-hero text-ink font-display font-medium tracking-[-0.02em]">Staff users</h1>
          <p className="text-admin-sm text-ink-3 mt-0.5">{users.length} accounts</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-admin-sm font-medium rounded-md bg-ink text-paper hover:opacity-90 transition-opacity duration-admin-fast">
          <UserPlus className="w-4 h-4" /> Add user
        </button>
      </div>

      {/* Table */}
      <div className="bg-paper border border-line rounded-md overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-admin-sm text-ink-3">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-admin-sm text-ink-3">No users found.</div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-admin-sm hidden md:table">
              <thead>
                <tr className="border-b border-line bg-paper-2">
                  {["Name", "Email", "Role", "Created", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-admin-eyebrow text-ink-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}
                    className="border-b border-line last:border-b-0 hover:bg-admin-row-hover cursor-pointer transition-colors duration-admin-fast"
                    onClick={() => openViewUser(u)}>
                    <td className="px-5 py-4 font-medium text-ink">{u.full_name || "—"}</td>
                    <td className="px-5 py-4 text-ink-2">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-admin-micro font-medium ${
                        u.role === "admin" ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"
                      }`}>
                        <RoleIcon role={u.role} className="w-3 h-3" />
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ink-3">
                      {new Date(u.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDeleteTarget(u)} disabled={u.id === currentUserId}
                        className="p-1.5 rounded text-state-error hover:bg-state-error/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-admin-fast"
                        title={u.id === currentUserId ? "You cannot delete your own account" : "Delete user"}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-line">
              {users.map(u => (
                <button key={u.id} onClick={() => openViewUser(u)} className="w-full text-left p-4 hover:bg-admin-row-hover transition-colors duration-admin-fast">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-ink">{u.full_name || "—"}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-admin-micro font-medium shrink-0 ${
                      u.role === "admin" ? "bg-ink text-paper" : "bg-paper-2 text-ink-2"
                    }`}>
                      <RoleIcon role={u.role} className="w-3 h-3" />
                      {u.role}
                    </span>
                  </div>
                  <p className="text-admin-sm text-ink-2">{u.email}</p>
                  <p className="text-admin-micro text-ink-3 mt-1">
                    Joined {new Date(u.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="w-full max-w-md rounded-md bg-paper border border-line p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-admin-title text-ink">Create new user</h2>
              <button onClick={() => setShowModal(false)} className="text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-3.5 py-2.5 rounded-md text-admin-sm font-medium bg-state-error/10 text-state-error border border-state-error/30">
                {formError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className={labelCls}>Full name</label>
                <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Juan Dela Cruz" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email address *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@email.com" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Temporary password *</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters" required className={`${inputCls} pr-11`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink transition-colors duration-admin-fast">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <RoleDropdown value={form.role} onChange={r => setForm(f => ({ ...f, role: r }))} open={roleOpen} setOpen={setRoleOpen} />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 text-admin-sm font-medium rounded-md bg-ink text-paper hover:opacity-90 disabled:opacity-50 transition-opacity duration-admin-fast">
                  {saving ? "Creating…" : "Create user"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View user modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60"
          onClick={e => { if (e.target === e.currentTarget) setViewUser(null); }}>
          <div className="w-full max-w-md rounded-md overflow-hidden bg-paper border border-line">
            <div className="flex items-start justify-between px-6 py-4 border-b border-line">
              <div>
                <p className="text-admin-title text-ink">{viewUser.full_name || "—"}</p>
                <p className="text-admin-sm text-ink-3 mt-0.5">{viewUser.email}</p>
              </div>
              <button onClick={() => setViewUser(null)} className="text-ink-3 hover:text-ink transition-colors duration-admin-fast mt-1">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Role</label>
                <RoleDropdown value={viewRole} onChange={handleViewRoleChange} open={viewRoleOpen} setOpen={setViewRoleOpen} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-admin-sm">
                <div>
                  <p className="text-admin-eyebrow text-ink-3 mb-1">Joined</p>
                  <p className="text-ink">
                    {new Date(viewUser.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-admin-eyebrow text-ink-3 mb-1">Last sign in</p>
                  <p className="text-ink">
                    {viewUser.last_sign_in
                      ? new Date(viewUser.last_sign_in).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-2.5">
              <button onClick={() => setDeleteTarget(viewUser)} disabled={viewUser.id === currentUserId}
                className="px-4 py-2.5 text-admin-sm font-medium rounded-md border border-state-error text-state-error hover:bg-state-error/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-admin-fast"
                title={viewUser.id === currentUserId ? "You cannot delete your own account" : undefined}>
                Delete
              </button>
              <button onClick={() => setViewUser(null)}
                className="flex-1 py-2.5 text-admin-sm font-medium rounded-md border border-line text-ink-2 hover:border-line-strong transition-colors duration-admin-fast">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Delete this user?"
        description="This permanently removes their admin access. Cannot delete yourself."
        confirmLabel="Delete user"
        variant="destructive"
      />
    </div>
  );
}
