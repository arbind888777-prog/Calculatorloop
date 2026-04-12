"use client"

import { useState, useEffect } from "react"
import { AdminCard } from "@/components/admin/ui/Card"
import { AdminTable } from "@/components/admin/ui/Table"
import { AdminButton } from "@/components/admin/ui/Button"
import { Badge } from "@/components/admin/ui/Badge"
import { Modal } from "@/components/admin/ui/Modal"
import { AdminInput } from "@/components/admin/ui/Input"
import { AdminSelect } from "@/components/admin/ui/Select"
import { Spinner } from "@/components/admin/ui/Spinner"
import { KeyRound, CheckCircle2, Copy } from "lucide-react"

interface ApiKey extends Record<string, unknown> {
  id: string
  clientName: string
  plan: string
  callsLimit: number
  callsUsed: number
  isActive: boolean
  createdAt: string
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newKeyData, setNewKeyData] = useState({ clientName: "", plan: "FREE" })
  
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/admin/api-keys")
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKeyData)
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedKey(data.key)
        setNewKeyData({ clientName: "", plan: "FREE" })
        fetchKeys()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action will break connected dependents immediately.")) return;
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" })
      if (res.ok) fetchKeys()
    } catch (err) {
      console.error(err)
    }
  }

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const columns = [
    { key: "clientName", header: "Client Name" },
    { 
      key: "plan", 
      header: "Plan Limits",
      render: (item: ApiKey) => (
        <div>
          <Badge color="blue">{item.plan}</Badge>
          <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>
            Max {item.callsLimit >= 9999999 ? "∞" : item.callsLimit.toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: "usage",
      header: "Usage",
      render: (item: ApiKey) => {
        const pct = Math.min((item.callsUsed / item.callsLimit) * 100, 100);
        const color = pct > 90 ? "#ef4444" : "#10b981";
        return (
          <div>
            <div style={{ width: "100%", maxWidth: "120px", background: "#1e293b", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, background: color, height: "100%" }} />
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
              {item.callsUsed.toLocaleString()} / {item.callsLimit >= 9999999 ? "Unlimited" : item.callsLimit.toLocaleString()}
            </div>
          </div>
        )
      }
    },
    {
      key: "status",
      header: "Status",
      render: (item: ApiKey) => (
        item.isActive 
          ? <Badge color="green" dot>Active</Badge> 
          : <Badge color="red">Revoked</Badge>
      )
    },
    {
      key: "actions",
      header: "",
      render: (item: ApiKey) => (
        item.isActive ? (
          <div style={{ textAlign: "right" }}>
            <AdminButton 
               variant="danger" 
               size="sm" 
               onClick={(e) => { e.stopPropagation(); handleRevoke(item.id); }}
            >
              Revoke Access
            </AdminButton>
          </div>
        ) : null
      )
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 4px 0", color: "#e2e8f0" }}>API Key Management</h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "14px" }}>Provision and revoke external platform credentials</p>
        </div>
        <AdminButton 
           variant="primary" 
           icon={<KeyRound size={16} />} 
           onClick={() => setShowModal(true)}
        >
          Generate New Key
        </AdminButton>
      </div>

      <AdminCard title="Active Client Keys">
        {loading ? (
          <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
            <Spinner size={32} />
          </div>
        ) : (
          <AdminTable 
            columns={columns} 
            data={keys} 
            emptyMessage="No external API credentials have been provisioned." 
          />
        )}
      </AdminCard>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setGeneratedKey(null)
        }}
        title="Generate New API Key"
        footer={
          !generatedKey && (
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", width: "100%" }}>
              <AdminButton variant="ghost" onClick={() => setShowModal(false)}>Cancel</AdminButton>
              <AdminButton 
                variant="primary" 
                onClick={handleCreate} 
                disabled={!newKeyData.clientName || creating}
                loading={creating}
              >
                Generate Secure Key
              </AdminButton>
            </div>
          )
        }
      >
        {!generatedKey ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
            <AdminInput 
              label="Client / App Name" 
              placeholder="e.g. Acme Corp internal"
              value={newKeyData.clientName}
              onChange={(e) => setNewKeyData(prev => ({ ...prev, clientName: e.target.value }))}
            />
            <AdminSelect 
              label="Pricing Plan Restrictions" 
              options={[
                { label: "Free (100 msgs)", value: "FREE" },
                { label: "Starter (10k msgs)", value: "STARTER" },
                { label: "Pro (100k msgs)", value: "PRO" },
                { label: "Enterprise (Unlimited)", value: "ENTERPRISE" }
              ]}
              value={newKeyData.plan}
              onChange={(e) => setNewKeyData(prev => ({ ...prev, plan: e.target.value }))}
            />
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CheckCircle2 size={48} color="#10b981" style={{ marginBottom: "16px" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#10b981", fontSize: "18px" }}>Key Created Successfully</h3>
            <p style={{ margin: "0 0 24px 0", color: "#94a3b8", fontSize: "14px" }}>
              Please copy this key immediately. You will not be able to see it again.
            </p>
            <div style={{ 
              display: "flex", alignItems: "center", gap: "10px", 
              background: "#0f172a", padding: "12px", borderRadius: "8px", 
              width: "100%", border: "1px solid #1e293b" 
            }}>
              <span style={{ flex: 1, fontFamily: "monospace", fontSize: "14px", color: "#e2e8f0", wordBreak: "break-all", textAlign: "left" }}>
                {generatedKey}
              </span>
              <AdminButton variant="outline" size="sm" onClick={copyToClipboard} icon={!copied ? <Copy size={14}/> : undefined}>
                {copied ? "Copied!" : ""}
              </AdminButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
