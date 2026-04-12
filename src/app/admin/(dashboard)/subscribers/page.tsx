"use client"

import { useState, useEffect } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminTable } from "@/components/admin/ui/Table"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { Spinner } from "@/components/admin/ui/Spinner"
import { Mail, Trash2, Power, PowerOff } from "lucide-react"

interface Subscriber extends Record<string, unknown> {
  id: string
  email: string
  name: string | null
  subscribedAt: string
  active: boolean
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/admin/subscribers")
      if (res.ok) {
        const data = await res.json()
        setSubscribers(data.subscribers || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentState })
      })
      if (res.ok) fetchSubscribers()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this subscriber?")) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" })
      if (res.ok) fetchSubscribers()
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const columns = [
    { 
      key: "email", 
      header: "Email",
      render: (s: Subscriber) => (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Mail size={14} color="#64748b" />
          <span>{s.email}</span>
        </div>
      )
    },
    { 
      key: "name", 
      header: "Name",
      render: (s: Subscriber) => s.name || "—"
    },
    { 
      key: "subscribedAt", 
      header: "Subscribed On",
      render: (s: Subscriber) => formatDate(s.subscribedAt)
    },
    { 
      key: "status", 
      header: "Status",
      render: (s: Subscriber) => (
        s.active ? (
          <Badge color="green">Active</Badge>
        ) : (
          <Badge color="gray">Unsubscribed</Badge>
        )
      )
    },
    { 
      key: "actions", 
      header: "",
      render: (s: Subscriber) => (
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <AdminButton 
             variant="ghost" 
             size="sm"
             onClick={(e) => { e.stopPropagation(); handleToggleActive(s.id, s.active); }}
             icon={s.active ? <PowerOff size={14} /> : <Power size={14} color="#10b981" />}
          />
          <AdminButton 
             variant="ghost" 
             size="sm" 
             onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
             icon={<Trash2 size={14} color="#ef4444" />}
          />
        </div>
      )
    }
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0", color: "#e2e8f0" }}>Newsletter Audience</h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>Manage your community subscribers and email delivery</p>
        </div>
      </div>

      <AdminCard title="Subscriber List">
        {loading ? (
          <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
            <Spinner size={32} />
          </div>
        ) : (
          <AdminTable 
            columns={columns} 
            data={subscribers} 
            emptyMessage="No one has subscribed to the newsletter yet." 
          />
        )}
      </AdminCard>
    </div>
  )
}
