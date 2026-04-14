"use client"

import { useState, useEffect, useCallback } from "react"
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

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [editingUserId, setEditingUserId] = useState("")
  
  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER"
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState("")

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "20")
      if (search) params.set("search", search)
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
  }, [page, search, roleFilter])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const openCreateModal = () => {
    setModalMode("create")
    setFormData({ name: "", email: "", password: "", role: "USER" })
    setFormError("")
    setIsModalOpen(true)
  }

  const openEditModal = (user: UserItem) => {
    setModalMode("edit")
    setEditingUserId(user.id)
    setFormData({
      name: user.name || "",
      email: user.email,
      password: "", // empty for edit
      role: user.role
    })
    setFormError("")
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setFormError("")
    if (!formData.email || !formData.role) {
      setFormError("Email and role are required")
      return
    }
    if (modalMode === "create" && (!formData.password || formData.password.length < 8)) {
      setFormError("Password must be at least 8 characters")
      return
    }

    setFormLoading(true)
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to create user")
        }
      } else {
        const res = await fetch(`/api/admin/users/${editingUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to update user")
        }
      }
      setIsModalOpen(false)
      fetchUsers()
    } catch (err: any) {
      setFormError(err.message)
    }
    setFormLoading(false)
  }

  const handleDelete = async (user: UserItem) => {
    if (!window.confirm(`Are you sure you want to delete user ${user.email}?`)) return

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete user")
      }
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#5a7090" }}>
          {total} total users
        </p>
        {isSuperAdmin && (
          <AdminButton variant="primary" size="sm" onClick={openCreateModal}>
            + Add User
          </AdminButton>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <AdminInput
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
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

      <AdminCard noPadding>
        {loading ? (
          <PageLoader message="Loading users..." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Name", "Email", "Role", "Joined", "Last Visit", "Actions"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#5a7090" }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      style={{ borderBottom: "1px solid rgba(28,42,61,0.4)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(59,130,246,0.03)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 500, color: "#e2e8f0" }}>{user.name || "—"}</span>
                      </td>
                      <td style={tdStyle}>{user.email}</td>
                      <td style={tdStyle}>
                        <Badge color={user.role === "SUPER_ADMIN" ? "red" : user.role === "EDITOR" ? "blue" : "gray"}>
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
                              <AdminButton variant="danger" size="sm" onClick={() => handleDelete(user)}>Delete</AdminButton>
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
        )}
      </AdminCard>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <AdminButton variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</AdminButton>
          <span style={{ fontSize: "12px", color: "#5a7090" }}>Page {page} of {totalPages}</span>
          <AdminButton variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AdminButton>
        </div>
      )}

      {/* Modal */}
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
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

const thStyle: React.CSSProperties = { textAlign: "left", padding: "10px 14px", color: "#5a7090", fontWeight: 600, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1c2a3d", whiteSpace: "nowrap" }
const tdStyle: React.CSSProperties = { padding: "12px 14px", whiteSpace: "nowrap" }
