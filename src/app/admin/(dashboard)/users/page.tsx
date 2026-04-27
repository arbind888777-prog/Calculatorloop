"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { AdminInput } from "@/components/admin/ui/Input"
import { AdminSelect } from "@/components/admin/ui/Select"
import { Modal as AdminModal } from "@/components/admin/ui/Modal"
import { PageLoader } from "@/components/admin/ui/Spinner"

interface UserItem {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  lastVisit: string
}

// ── Toast Component ─────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      padding: "12px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      background: type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
      border: `1px solid ${type === "success" ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
      color: type === "success" ? "#10b981" : "#f87171",
      display: "flex", alignItems: "center", gap: "8px",
      animation: "slideInRight 0.3s ease",
    }}>
      <span>{type === "success" ? "✅" : "❌"}</span>
      {message}
    </div>
  )
}

// ── Delete Confirm Modal ─────────────────────────
function ConfirmModal({
  isOpen, message, onConfirm, onCancel, loading
}: { isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  if (!isOpen) return null
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
    }}>
      <div style={{
        background: "#131d2e", border: "1px solid #1c2a3d", borderRadius: "14px",
        padding: "28px", maxWidth: "380px", width: "100%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)"
      }}>
        <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "16px" }}>⚠️</div>
        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#cbd5e1", textAlign: "center", lineHeight: 1.6 }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <AdminButton variant="outline" onClick={onCancel}>Cancel</AdminButton>
          <AdminButton variant="danger" onClick={onConfirm} loading={loading}>Delete</AdminButton>
        </div>
      </div>
    </div>
  )
}

// ── Avatar Initials ──────────────────────────────
function UserAvatar({ name, email, role }: { name: string | null; email: string; role: string }) {
  const initials = name
    ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase()
  const colors: Record<string, string> = {
    SUPER_ADMIN: "linear-gradient(135deg,#ef4444,#b91c1c)",
    EDITOR: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
    USER: "linear-gradient(135deg,#6366f1,#4338ca)"
  }
  return (
    <div style={{
      width: "36px", height: "36px", borderRadius: "50%",
      background: colors[role] || colors.USER,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0
    }}>
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const { data: session } = useSession()
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN"

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingUserId, setEditingUserId] = useState("")
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "USER" })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  // Debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setDebouncedSearch(val); setPage(1) }, 350)
  }

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (roleFilter) params.set("role", roleFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch {
      console.error("Failed to fetch users")
    }
    setLoading(false)
  }, [page, debouncedSearch, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Auto switch to card view on mobile
  useEffect(() => {
    const check = () => setViewMode(window.innerWidth < 640 ? "cards" : "table")
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const openCreateModal = () => {
    setModalMode("create")
    setFormData({ name: "", email: "", password: "", role: "USER" })
    setFormError("")
    setIsModalOpen(true)
  }

  const openEditModal = (user: UserItem) => {
    setModalMode("edit")
    setEditingUserId(user.id)
    setFormData({ name: user.name || "", email: user.email, password: "", role: user.role })
    setFormError("")
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setFormError("")
    if (!formData.email || !formData.role) { setFormError("Email and role are required"); return }
    if (modalMode === "create" && (!formData.password || formData.password.length < 8)) {
      setFormError("Password must be at least 8 characters"); return
    }
    setFormLoading(true)
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create user") }
        showToast("User created successfully!")
      } else {
        const res = await fetch(`/api/admin/users/${editingUserId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to update user") }
        showToast("User updated successfully!")
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setFormError(msg)
    }
    setFormLoading(false)
  }

  const confirmDelete = (user: UserItem) => setDeleteTarget(user)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to delete user") }
      showToast("User deleted.")
      fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      showToast(msg, "error")
    }
    setDeleteLoading(false)
    setDeleteTarget(null)
  }

  const roleCounts = { SUPER_ADMIN: 0, EDITOR: 0, USER: 0 }
  users.forEach(u => { if (u.role in roleCounts) roleCounts[u.role as keyof typeof roleCounts]++ })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmModal
        isOpen={!!deleteTarget}
        message={`Are you sure you want to permanently delete "${deleteTarget?.email}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
        {[
          { label: "Super Admins", count: roleCounts.SUPER_ADMIN, color: "#ef4444", icon: "🛡️" },
          { label: "Editors", count: roleCounts.EDITOR, color: "#3b82f6", icon: "✏️" },
          { label: "Users", count: roleCounts.USER, color: "#6366f1", icon: "👥" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#131d2e", border: "1px solid #1c2a3d", borderRadius: "12px",
            padding: "16px", display: "flex", alignItems: "center", gap: "12px"
          }}>
            <span style={{ fontSize: "20px" }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#5a7090" }}>{total} total users</p>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Toggle View */}
          <div style={{ display: "flex", background: "#0f1623", border: "1px solid #1c2a3d", borderRadius: "8px", padding: "2px" }}>
            {(["table", "cards"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer",
                fontSize: "11px", fontWeight: 600,
                background: viewMode === m ? "#3b82f6" : "transparent",
                color: viewMode === m ? "#fff" : "#64748b",
                transition: "all 0.2s"
              }}>{m === "table" ? "⊞ Table" : "⊟ Cards"}</button>
            ))}
          </div>
          {isSuperAdmin && (
            <AdminButton variant="primary" size="sm" onClick={openCreateModal}>+ Add User</AdminButton>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <AdminInput
            placeholder="🔍  Search by name or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div style={{ width: "150px" }}>
          <AdminSelect
            options={[
              { value: "", label: "All Roles" },
              { value: "SUPER_ADMIN", label: "Super Admin" },
              { value: "EDITOR", label: "Editor" },
              { value: "USER", label: "User" },
            ]}
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* Content */}
      <AdminCard noPadding>
        {loading ? (
          <PageLoader message="Loading users..." />
        ) : viewMode === "table" ? (
          /* ── Desktop Table ── */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["User", "Email", "Role", "Joined", "Last Visit", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "48px", color: "#5a7090" }}>
                      <div style={{ fontSize: "32px", marginBottom: "12px" }}>👤</div>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      style={{ borderBottom: "1px solid rgba(28,42,61,0.4)", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.04)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <UserAvatar name={user.name} email={user.email} role={user.role} />
                          <span style={{ fontWeight: 500, color: "#e2e8f0" }}>{user.name || "—"}</span>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ color: "#94a3b8" }}>{user.email}</span></td>
                      <td style={tdStyle}>
                        <Badge color={user.role === "SUPER_ADMIN" ? "red" : user.role === "EDITOR" ? "blue" : "gray"} dot>
                          {user.role}
                        </Badge>
                      </td>
                      <td style={tdStyle}><span style={{ color: "#94a3b8" }}>{new Date(user.createdAt).toLocaleDateString()}</span></td>
                      <td style={tdStyle}><span style={{ color: "#94a3b8" }}>{new Date(user.lastVisit).toLocaleDateString()}</span></td>
                      <td style={tdStyle}>
                        {isSuperAdmin && (
                          <div style={{ display: "flex", gap: "6px" }}>
                            <AdminButton variant="ghost" size="sm" onClick={() => openEditModal(user)}>Edit</AdminButton>
                            {session?.user?.id !== user.id && (
                              <AdminButton variant="danger" size="sm" onClick={() => confirmDelete(user)}>Delete</AdminButton>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Mobile Card View ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#1c2a3d" }}>
            {users.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#5a7090", background: "#131d2e" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>👤</div>
                No users found.
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} style={{
                  background: "#131d2e", padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: "14px",
                  transition: "background 0.15s"
                }}>
                  <UserAvatar name={user.name} email={user.email} role={user.role} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: "14px", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.name || "—"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.email}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                      <Badge color={user.role === "SUPER_ADMIN" ? "red" : user.role === "EDITOR" ? "blue" : "gray"} dot>
                        {user.role}
                      </Badge>
                      <span style={{ fontSize: "11px", color: "#475569" }}>
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      <AdminButton variant="ghost" size="sm" onClick={() => openEditModal(user)}>Edit</AdminButton>
                      {session?.user?.id !== user.id && (
                        <AdminButton variant="danger" size="sm" onClick={() => confirmDelete(user)}>Del</AdminButton>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </AdminCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</AdminButton>
          <span style={{ fontSize: "12px", color: "#5a7090", padding: "0 8px" }}>Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</AdminButton>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Add New User" : "Edit User"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {formError && (
            <div style={{ padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#f87171", fontSize: "12px" }}>
              {formError}
            </div>
          )}
          <AdminInput label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <AdminInput label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} readOnly={modalMode === "edit"} />
          <AdminSelect
            label="Role"
            options={[
              { value: "USER", label: "User" },
              { value: "EDITOR", label: "Editor" },
              { value: "SUPER_ADMIN", label: "Super Admin" },
            ]}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          />
          <AdminInput
            label={modalMode === "create" ? "Password" : "New Password (leave blank to keep current)"}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <AdminButton variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</AdminButton>
            <AdminButton variant="primary" onClick={handleSave} loading={formLoading}>
              {modalMode === "create" ? "Create User" : "Save Changes"}
            </AdminButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: "left", padding: "10px 14px", color: "#5a7090",
  fontWeight: 600, fontSize: "11px", textTransform: "uppercase",
  letterSpacing: "0.5px", borderBottom: "1px solid #1c2a3d", whiteSpace: "nowrap"
}
const tdStyle: React.CSSProperties = { padding: "12px 14px" }
