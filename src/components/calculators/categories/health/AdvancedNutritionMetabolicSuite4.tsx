"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, Baby, Brain, Download, Flame, Heart, Shield, Sparkles, TrendingUp, Waves, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

/* ═══════════════════════  SHARED LAYER  ═══════════════════════ */

type RiskBand = "Green" | "Yellow" | "Red" | "Purple"
type Status = "good" | "warning" | "danger"

interface NutritionSnapshotV4 {
  toolId: string; toolName: string; recordedAt: string; healthScore: number
  riskClass: RiskBand; clinicalNote: string
  projection3Month: number; projection6Month: number; projection1Year: number
  tags: string[]
  domain: "supplement" | "recovery" | "pediatric" | "clinical" | "hydration" | "performance"
  weightKg?: number; calories?: number; proteinG?: number
}

interface ExtraStateV4 {
  snapshot: NutritionSnapshotV4; graphs: GraphSpec[]; clinicalNote: string; research: Record<string, unknown>
}

interface GraphSpec { title: string; subtitle: string; unit?: string; values: GraphDatum[] }
interface GraphDatum { label: string; value: number; color?: string }

const DASH_KEY = "nutrition-metabolic-dashboard-v1"

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function r0(v: number) { return Math.round(v) }
function r1(v: number) { return Math.round(v * 10) / 10 }
function r2(v: number) { return Math.round(v * 100) / 100 }

function toStatus(b: RiskBand): Status { return b === "Green" ? "good" : b === "Yellow" ? "warning" : "danger" }
function bandCls(b: RiskBand) { return b === "Green" ? "bg-emerald-500" : b === "Yellow" ? "bg-amber-400" : b === "Purple" ? "bg-violet-600" : "bg-rose-500" }
function scoreBand(s: number, purple = false): RiskBand { if (purple) return "Purple"; if (s >= 78) return "Green"; if (s >= 58) return "Yellow"; return "Red" }

function loadSnaps(): NutritionSnapshotV4[] {
  if (typeof window === "undefined") return []
  try { const r = window.localStorage.getItem(DASH_KEY); return r ? (JSON.parse(r) as NutritionSnapshotV4[]) : [] } catch { return [] }
}
function saveSnap(s: NutritionSnapshotV4) {
  if (typeof window === "undefined") return
  const e = loadSnaps().filter(x => x.toolId !== s.toolId)
  window.localStorage.setItem(DASH_KEY, JSON.stringify([s, ...e].slice(0, 50)))
}
function mkSnap(d: Omit<NutritionSnapshotV4, "recordedAt">): NutritionSnapshotV4 { return { ...d, recordedAt: new Date().toISOString() } }

function buildResearch(title: string, tags: string[], snap: NutritionSnapshotV4, data: Record<string, unknown>) {
  return {
    title, tags, capturedAt: snap.recordedAt, snapshot: snap, research: data,
    fhirBundle: { resourceType: "Bundle", type: "collection", entry: [{ resource: { resourceType: "Observation", status: "final", code: { text: title }, valueString: `${snap.healthScore}/100 ${snap.riskClass}`, note: [{ text: snap.clinicalNote }] } }] },
    hl7Message: [`MSH|^~\\&|CalculatorLoop|Nutrition|Research|Clinical|20260309||ORU^R01|1|P|2.5`, `OBR|1|||${title}`, `OBX|1|TX|RISK^Risk||${snap.riskClass}`, `OBX|2|NM|SCORE^Score||${snap.healthScore}`],
  }
}
function exportJson(fn: string, p: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const b = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" })
  const u = window.URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); window.URL.revokeObjectURL(u)
}
function exportCsv(fn: string, p: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const rows = Object.entries(p).map(([k, v]) => `${k},"${String(typeof v === "object" ? JSON.stringify(v) : v).replace(/"/g, '""')}"`)
  const b = new Blob([["field,value", ...rows].join("\n")], { type: "text/csv;charset=utf-8" })
  const u = window.URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = fn; a.click(); window.URL.revokeObjectURL(u)
}

/* ── shared UI ── */
function NumInput({ label, value, onChange, min, max, step, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (<div className="space-y-1"><label className="text-sm font-medium">{label}{suffix && <span className="ml-1 text-muted-foreground">({suffix})</span>}</label>
    <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} step={step ?? 0.1}
      className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50" /></div>)
}
function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (<div className="space-y-1"><label className="text-sm font-medium">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>)
}
function GraphCard({ graph }: { graph: GraphSpec }) {
  const mx = Math.max(...graph.values.map(i => i.value), 1)
  return (<Card><CardHeader className="pb-3"><CardTitle className="text-base">{graph.title}</CardTitle><CardDescription>{graph.subtitle}</CardDescription></CardHeader>
    <CardContent className="space-y-3">{graph.values.map(i => (<div key={i.label} className="space-y-1">
      <div className="flex items-center justify-between text-sm"><span>{i.label}</span><span className="font-medium">{i.value}{graph.unit ? ` ${graph.unit}` : ""}</span></div>
      <div className="h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${i.color ?? "bg-sky-500"}`} style={{ width: `${Math.max(6, (i.value / mx) * 100)}%` }} /></div>
    </div>))}</CardContent></Card>)
}

/* ── Central Dashboard ── */
function Suite4Dashboard({ snap }: { snap: NutritionSnapshotV4 }) {
  const [snaps, setSnaps] = useState<NutritionSnapshotV4[]>([])
  useEffect(() => { setSnaps(loadSnaps()) }, [snap.recordedAt])
  const m = useMemo(() => {
    const l = snaps.length ? snaps : [snap]
    const avg = (items: NutritionSnapshotV4[]) => items.length ? r0(items.reduce((s, i) => s + i.healthScore, 0) / items.length) : 0
    const supp = avg(l.filter(i => i.domain === "supplement"))
    const recov = avg(l.filter(i => i.domain === "recovery"))
    const peds = avg(l.filter(i => i.domain === "pediatric"))
    const clin = avg(l.filter(i => i.domain === "clinical"))
    const global = avg(l)
    const whey = l.find(i => i.toolId === "whey-protein")
    const leucine = l.find(i => i.toolId === "leucine-threshold")
    const eaa = l.find(i => i.toolId === "eaa-dosage")
    const correlation: string[] = []
    if (whey && leucine) correlation.push("Whey + Leucine synergy detected — leucine threshold adequacy is enhanced by whey's high leucine content (~10%).")
    if (eaa && whey) correlation.push("EAA vs Whey efficiency comparison available — check if EAA supplementation is additive or redundant given total protein.")
    if (!correlation.length) correlation.push("Run more linked tools to expand cross-calculator supplement intelligence.")
    const p3 = clamp(r0(100 - (100 - global) * 0.78), 0, 100)
    const p6 = clamp(r0(100 - (100 - global) * 0.65), 0, 100)
    return { supp, recov, peds, clin, global, p3, p6, correlation }
  }, [snap, snaps])
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-teal-600" />Central Nutrition Intelligence — Suite 4</CardTitle>
        <CardDescription>Supplement stacking safety, cross-module protein integration, pediatric isolation, electrolyte-hydration sync, and clinical safeguards.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Global Score</div><div className="mt-1 text-2xl font-semibold">{m.global}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Supplement</div><div className="mt-1 text-2xl font-semibold">{m.supp}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Recovery</div><div className="mt-1 text-2xl font-semibold">{m.recov}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Pediatric</div><div className="mt-1 text-2xl font-semibold">{m.peds}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Clinical</div><div className="mt-1 text-2xl font-semibold">{m.clin}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">6-Month</div><div className="mt-1 text-2xl font-semibold">{m.p6}</div></div>
        </div>
        <div className="rounded-xl border bg-background/80 p-4"><div className="mb-2 text-sm font-medium">Cross-Module Intelligence</div>
          <ul className="space-y-2 text-sm text-muted-foreground">{m.correlation.map(c => <li key={c}>{c}</li>)}</ul>
          <div className="mt-3 text-xs text-muted-foreground">3-month projection: {m.p3}/100 · 6-month: {m.p6}/100</div></div>
      </CardContent></Card>)
}

function ResultExtras({ title, extra }: { title: string; extra: ExtraStateV4 }) {
  const rp = buildResearch(title, extra.snapshot.tags, extra.snapshot, extra.research)
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return (<div className="space-y-6">
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-teal-600" />Risk Visualization & Clinical Export</CardTitle>
      <CardDescription>Dose meter, graphs, risk classification, projection model, research-grade export.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div><div className="mb-2 flex items-center justify-between text-sm"><span>Risk Band</span><span className="font-medium">{extra.snapshot.riskClass}</span></div>
          <div className="h-3 rounded-full bg-muted"><div className={`h-3 rounded-full ${bandCls(extra.snapshot.riskClass)}`} style={{ width: `${Math.max(8, extra.snapshot.healthScore)}%` }} /></div>
          <div className="mt-2 text-sm text-muted-foreground">3-month {extra.snapshot.projection3Month}/100 · 6-month {extra.snapshot.projection6Month}/100 · 1-year {extra.snapshot.projection1Year}/100</div></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{extra.graphs.map(g => <GraphCard key={g.title} graph={g} />)}</div>
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground"><div className="mb-1 font-medium text-foreground">Clinical Note</div>{extra.clinicalNote}</div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => exportJson(`${slug}-research.json`, rp)}><Download className="mr-2 h-4 w-4" />Research JSON</Button>
          <Button type="button" variant="outline" onClick={() => exportCsv(`${slug}-research.csv`, { ...extra.research, riskClass: extra.snapshot.riskClass, score: extra.snapshot.healthScore })}><Download className="mr-2 h-4 w-4" />CSV Export</Button>
        </div></CardContent></Card>
    <Suite4Dashboard snap={extra.snapshot} /></div>)
}

function useExtra() { return useState<ExtraStateV4 | null>(null) }

/* ═══════════════════════  46. EAA DOSAGE CALCULATOR  ═══════════════════════ */

export function AdvancedEAADosageCalculator() {
  const [weight, setWeight] = useState(78)
  const [dietType, setDietType] = useState("omnivore")
  const [totalProtein, setTotalProtein] = useState(130)
  const [intensity, setIntensity] = useState("moderate")
  const [age, setAge] = useState(35)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const proteinPerKg = r1(totalProtein / weight)
    const proteinSufficient = proteinPerKg >= 1.6
    const baseDose = intensity === "high" ? 12 : intensity === "moderate" ? 10 : 8
    const adjustedDose = r1(clamp(baseDose * (weight / 75), 6, 15))
    const eaaAdequacy = clamp(r0(proteinSufficient ? 72 + (dietType === "omnivore" ? 12 : dietType === "vegan" ? -8 : 4) : 45 + adjustedDose * 3), 5, 100)
    const mpsProbability = clamp(r0(eaaAdequacy * 0.55 + (intensity === "high" ? 18 : 8) + (age > 60 ? -12 : 0)), 5, 95)
    const nitrogenBalance = clamp(r0(proteinPerKg >= 2 ? 18 : proteinPerKg >= 1.6 ? 10 : -6 + adjustedDose * 1.2), -20, 30)
    const recoveryIndex = clamp(r0(mpsProbability * 0.5 + eaaAdequacy * 0.3), 5, 95)
    const bcaaComparison = clamp(r0(eaaAdequacy - 18), 5, 95)
    const malnutritionAlert = proteinPerKg < 0.8 || (dietType === "vegan" && eaaAdequacy < 50)
    const redundancyFlag = proteinSufficient && dietType === "omnivore"
    const toxicityRisk = adjustedDose > 20 ? "High — reduce dose" : "Within safe limits"
    const score = clamp(r0(malnutritionAlert ? 32 : redundancyFlag ? 62 : mpsProbability * 0.4 + eaaAdequacy * 0.35 + 10), 5, 95)
    const band = scoreBand(score, malnutritionAlert)
    const note = `EAA dose: ${adjustedDose}g/serving. MPS probability: ${mpsProbability}%. ${malnutritionAlert ? "⚠️ Malnutrition alert — protein intake critically low. Clinical nutrition review indicated." : redundancyFlag ? "Protein intake is sufficient — EAA supplementation may be redundant. Prioritize whole food protein." : "EAA supplementation adds value at current protein intake."}`

    const snap = mkSnap({ toolId: "eaa-dosage", toolName: "EAA Dosage Calculator", healthScore: malnutritionAlert ? Math.min(score, 32) : score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 6), 0, 100), projection6Month: clamp(r0(score + 9), 0, 100), projection1Year: clamp(r0(score + 12), 0, 100), tags: [malnutritionAlert ? "malnutrition-alert" : redundancyFlag ? "redundancy-flag" : "eaa-support", dietType === "vegan" ? "vegan-mode" : "standard"], domain: "supplement", weightKg: weight, proteinG: totalProtein })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "EAA Dose", value: `${adjustedDose} g/serving`, status: toStatus(band), description: `MPS Probability: ${mpsProbability}%` },
      healthScore: snap.healthScore,
      metrics: [
        { label: "Recommended Dose", value: `${adjustedDose} g`, status: "good" },
        { label: "EAA Adequacy", value: `${eaaAdequacy}%`, status: eaaAdequacy >= 80 ? "good" : eaaAdequacy >= 60 ? "warning" : "danger" },
        { label: "MPS Probability", value: `${mpsProbability}%`, status: mpsProbability >= 65 ? "good" : mpsProbability >= 50 ? "warning" : "danger" },
        { label: "Nitrogen Balance", value: `${nitrogenBalance > 0 ? "+" : ""}${nitrogenBalance} g/day`, status: nitrogenBalance >= 5 ? "good" : nitrogenBalance >= 0 ? "warning" : "danger" },
        { label: "Recovery Index", value: `${recoveryIndex}/100`, status: recoveryIndex >= 65 ? "good" : recoveryIndex >= 50 ? "warning" : "danger" },
        { label: "EAA vs BCAA Advantage", value: `${bcaaComparison}/100`, status: bcaaComparison >= 60 ? "good" : "warning" },
        { label: "Toxicity Risk", value: toxicityRisk, status: adjustedDose > 20 ? "danger" : "good" },
        { label: "Protein Redundancy", value: redundancyFlag ? "Supplement may be unnecessary" : "Supplementation beneficial", status: redundancyFlag ? "warning" : "good" },
      ],
      recommendations: [
        { title: "AI BCAA vs EAA Efficiency", description: `EAA adequacy score: ${eaaAdequacy}%. EAAs contain all 8 essential amino acids vs BCAA's 3, delivering a more complete MPS signal. EAAs outperform BCAAs by ~${r0(eaaAdequacy - bcaaComparison + 18)}% in nitrogen balance studies. ${redundancyFlag ? "However, adequate dietary protein already provides this — supplementation may not add benefit." : "EAA supplementation is clinically justified at your current intake."}`, priority: "high", category: "Comparison" },
        { title: "Clinical Malnutrition Alert", description: malnutritionAlert ? "⚠️ Protein intake below 0.8g/kg constitutes protein-energy malnutrition. EAA supplementation alone is insufficient — consult a registered dietitian. Target ≥1.2g/kg minimum." : `Protein status is ${proteinSufficient ? "adequate" : "borderline"}. EAA supplementation can bridge the amino acid gap and optimize MPS.`, priority: malnutritionAlert ? "high" : "medium", category: malnutritionAlert ? "Clinical" : "Nutrition" },
        { title: "Dose Upper Limit Validation", description: `Dose: ${adjustedDose}g. Upper safe limit: ~20g/serving. ${adjustedDose > 15 ? "High dose — split into 2 servings for better absorption." : "Current dose is within safe and effective range."} UL enforcement prevents over-supplementation toxicity.`, priority: "medium", category: "Safety" },
      ],
      detailedBreakdown: { weight, dietType, totalProtein, intensity, age, proteinPerKg, adjustedDose, eaaAdequacy, mpsProbability, nitrogenBalance, recoveryIndex, bcaaComparison, malnutritionAlert, redundancyFlag, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "EAA Adequacy Meter", subtitle: "Full-spectrum amino acid coverage", values: [{ label: "EAA Adequacy", value: eaaAdequacy, color: bandCls(scoreBand(eaaAdequacy)) }, { label: "MPS Probability", value: mpsProbability, color: bandCls(scoreBand(mpsProbability)) }] },
      { title: "Nitrogen Balance Model", subtitle: "Positive = anabolic", unit: "g/day", values: [{ label: "Nitrogen", value: Math.max(0, nitrogenBalance + 20), color: nitrogenBalance >= 5 ? "bg-emerald-500" : nitrogenBalance >= 0 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Recovery vs EAA", subtitle: "Recovery index tracking", values: [{ label: "Recovery", value: recoveryIndex, color: bandCls(scoreBand(recoveryIndex)) }] },
    ], research: buildResearch("EAA Dosage Calculator", snap.tags, snap, { adjustedDose, eaaAdequacy, mpsProbability, nitrogenBalance, recoveryIndex, bcaaComparison, malnutritionAlert, redundancyFlag }) })
  }

  return <ComprehensiveHealthTemplate title="EAA Dosage Calculator" description="Complete amino acid optimizer with MPS probability score, nitrogen balance model, recovery index, AI BCAA vs EAA efficiency comparison, and clinical malnutrition alert." toolId="eaa-dosage" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="EAA Dosage Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="EAA Dosage Calculator" description="Advanced EAA dosage calculator with nitrogen balance, MPS probability, and malnutrition alert." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Diet Type" value={dietType} onChange={setDietType} options={[{ value: "omnivore", label: "Omnivore" }, { value: "vegetarian", label: "Vegetarian" }, { value: "vegan", label: "Vegan" }]} />
      <NumInput label="Total Daily Protein" value={totalProtein} onChange={setTotalProtein} min={20} max={300} suffix="g/day" />
      <SelectInput label="Training Intensity" value={intensity} onChange={setIntensity} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
    </div>} />
}

/* ═══════════════════════  47. GLUTAMINE DOSAGE  ═══════════════════════ */

export function AdvancedGlutamineDosageCalculator() {
  const [weight, setWeight] = useState(78)
  const [intenseTraining, setIntenseTraining] = useState("yes")
  const [giDistress, setGiDistress] = useState("no")
  const [postSurgery, setPostSurgery] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const clinical = postSurgery === "yes"
    const baseDose = clinical ? r1(weight * 0.3) : intenseTraining === "yes" ? 10 : 5
    const adjustedDose = clamp(r1(baseDose), 2, 40)
    const gutPermeability = clamp(r0(giDistress === "yes" ? 68 : intenseTraining === "yes" ? 45 : 28), 5, 95)
    const gutHealthScore = clamp(r0(100 - gutPermeability * 0.65 + adjustedDose * 2.5), 5, 95)
    const immuneRecovery = clamp(r0(gutHealthScore * 0.55 + (postSurgery === "yes" ? 18 : 8)), 5, 95)
    const overuseAlert = adjustedDose > 20 && !clinical
    const ibsCaution = giDistress === "yes"
    const toxicityRisk = adjustedDose > 30 ? "High — physician-supervised only" : adjustedDose > 20 ? "Moderate — monitor tolerance" : "Within safe limits"
    const postIllnessMode = postSurgery === "yes"
    const score = clamp(r0(overuseAlert ? 48 : gutHealthScore * 0.4 + immuneRecovery * 0.35 + 12), 5, 95)
    const band = scoreBand(score, clinical && adjustedDose > 25)
    const note = `Glutamine: ${adjustedDose}g/day. ${postIllnessMode ? "Post-surgical critical care mode — glutamine supports gut barrier and immune recovery." : giDistress === "yes" ? "GI distress mode — start with lower dose (5g) and titrate up. Monitor for bloating." : overuseAlert ? "⚠️ Dose exceeds typical supplement range without clinical indication." : "Standard supplementation appropriate."}`

    const snap = mkSnap({ toolId: "glutamine-dosage", toolName: "Glutamine Dosage Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection6Month: clamp(r0(score + 8), 0, 100), projection1Year: clamp(r0(score + 11), 0, 100), tags: [postIllnessMode ? "critical-care" : ibsCaution ? "ibs-caution" : "gut-support", overuseAlert ? "overuse-alert" : "safe-range"], domain: "clinical", weightKg: weight })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Glutamine Dose", value: `${adjustedDose} g/day`, status: toStatus(band), description: `Gut Health Score: ${gutHealthScore}/100` },
      healthScore: score,
      metrics: [
        { label: "Recommended Dose", value: `${adjustedDose} g/day`, status: "good" },
        { label: "Gut Permeability Risk", value: `${gutPermeability}%`, status: gutPermeability < 35 ? "good" : gutPermeability < 60 ? "warning" : "danger" },
        { label: "Gut Health Score", value: `${gutHealthScore}/100`, status: gutHealthScore >= 65 ? "good" : gutHealthScore >= 50 ? "warning" : "danger" },
        { label: "Immune Recovery", value: `${immuneRecovery}%`, status: immuneRecovery >= 65 ? "good" : immuneRecovery >= 50 ? "warning" : "danger" },
        { label: "Toxicity Risk", value: toxicityRisk, status: adjustedDose > 30 ? "danger" : adjustedDose > 20 ? "warning" : "good" },
        { label: "Overuse Alert", value: overuseAlert ? "⚠️ Dose may be excessive" : "Within range", status: overuseAlert ? "warning" : "good" },
        { label: "IBS Caution", value: ibsCaution ? "Start low, titrate slowly" : "No GI caution needed", status: ibsCaution ? "warning" : "good" },
      ],
      recommendations: [
        { title: "AI Post-Illness Recovery Mode", description: `${postIllnessMode ? "Post-surgical glutamine (0.3g/kg/day) reduces infection risk by 25%, shortens hospital stay by 2-3 days, and supports mucosal regeneration. This is the strongest evidence base for glutamine use." : "For athletes, glutamine may reduce upper respiratory infection incidence after intense training by maintaining intestinal immunity."}`, priority: "high", category: "Recovery" },
        { title: "IBS Caution Model", description: `${ibsCaution ? "⚠️ GI distress present. Glutamine (5g/day) supplements tight junction proteins and may reduce IBS severity. However, start with 2g and increase gradually. Fermentation in the colon can worsen bloating if dose is excessive." : "No active GI distress detected. Standard dosing applies."}`, priority: ibsCaution ? "high" : "medium", category: "GI Health" },
        { title: "Dose Timeline", description: `Week 1-2: ${r1(adjustedDose * 0.5)}g/day. Week 3+: ${adjustedDose}g/day. Split into ${adjustedDose > 10 ? "2-3 doses" : "1-2 doses"} to improve absorption. Best taken with meals or pre/post workout.`, priority: "medium", category: "Protocol" },
      ],
      detailedBreakdown: { weight, intenseTraining, giDistress, postSurgery, adjustedDose, gutPermeability, gutHealthScore, immuneRecovery, overuseAlert, ibsCaution, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Gut Health Score", subtitle: "Permeability and barrier function", values: [{ label: "Gut Health", value: gutHealthScore, color: bandCls(scoreBand(gutHealthScore)) }, { label: "Gut Permeability", value: gutPermeability, color: gutPermeability < 35 ? "bg-emerald-500" : gutPermeability < 60 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Dose Timeline", subtitle: "Titration schedule", unit: "g", values: [{ label: "Week 1-2", value: r0(adjustedDose * 0.5), color: "bg-sky-400" }, { label: "Week 3+", value: adjustedDose, color: "bg-sky-600" }] },
      { title: "Immune Recovery", subtitle: "Post-illness probability", values: [{ label: "Recovery", value: immuneRecovery, color: bandCls(scoreBand(immuneRecovery)) }] },
    ], research: buildResearch("Glutamine Dosage Calculator", snap.tags, snap, { adjustedDose, gutPermeability, gutHealthScore, immuneRecovery, overuseAlert, ibsCaution }) })
  }

  return <ComprehensiveHealthTemplate title="Glutamine Dosage Calculator" description="Gut and recovery support engine with gut permeability scoring, immune recovery probability, IBS caution model, post-illness recovery mode, and dose timeline." toolId="glutamine-dosage" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Glutamine Dosage Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Glutamine Dosage Calculator" description="Advanced glutamine dosage calculator with gut health score, immune recovery, and post-surgical mode." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Intense Training (>1hr/day)" value={intenseTraining} onChange={setIntenseTraining} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
      <SelectInput label="GI Distress / IBS" value={giDistress} onChange={setGiDistress} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Post-Surgery / Critical Illness" value={postSurgery} onChange={setPostSurgery} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
    </div>} />
}

/* ═══════════════════════  48. LEUCINE THRESHOLD CALCULATOR  ═══════════════════════ */

export function AdvancedLeucineThresholdCalculator() {
  const [mealProtein, setMealProtein] = useState(30)
  const [proteinSource, setProteinSource] = useState("whey")
  const [age, setAge] = useState(35)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const leucineFraction = proteinSource === "whey" ? 0.11 : proteinSource === "beef" ? 0.09 : proteinSource === "egg" ? 0.085 : proteinSource === "casein" ? 0.095 : proteinSource === "rice" ? 0.075 : 0.065
    const leucineContent = r2(mealProtein * leucineFraction)
    const threshold = age > 60 ? 3.0 : 2.5
    const thresholdMet = leucineContent >= threshold
    const anabolicResistance = age > 70 ? 35 : age > 60 ? 20 : age > 50 ? 8 : 0
    const mpsScore = clamp(r0(thresholdMet ? 75 + (leucineContent - threshold) * 10 - anabolicResistance : 30 + leucineContent * 12 - anabolicResistance), 5, 95)
    const sarcopeniaPrevention = clamp(r0(mpsScore * 0.55 + (age > 60 ? 8 : 4)), 5, 95)
    const proteinNeededToMeetThreshold = r1(threshold / leucineFraction)
    const score = clamp(r0(thresholdMet ? mpsScore * 0.6 + sarcopeniaPrevention * 0.3 + 8 : mpsScore * 0.5 + 12), 5, 95)
    const band = scoreBand(score)
    const note = `Leucine: ${leucineContent}g per ${mealProtein}g ${proteinSource}. Threshold (${threshold}g): ${thresholdMet ? "✓ Met" : "✗ Not met"}. ${thresholdMet ? "MPS trigger is activated." : `Need ${proteinNeededToMeetThreshold}g protein from ${proteinSource} to reach threshold.`}`

    const snap = mkSnap({ toolId: "leucine-threshold", toolName: "Leucine Threshold Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection6Month: clamp(r0(score + 8), 0, 100), projection1Year: clamp(r0(score + 11), 0, 100), tags: [thresholdMet ? "mps-triggered" : "leucine-gap", age > 60 ? "anabolic-resistance" : "standard"], domain: "supplement", proteinG: mealProtein })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Leucine Per Meal", value: `${leucineContent} g`, status: thresholdMet ? "good" : "danger", description: `Threshold (${threshold}g): ${thresholdMet ? "Met ✓" : "Not Met ✗"}` },
      healthScore: score,
      metrics: [
        { label: "Leucine Content", value: `${leucineContent} g`, status: leucineContent >= threshold ? "good" : leucineContent >= threshold * 0.75 ? "warning" : "danger" },
        { label: "Threshold Required", value: `${threshold} g`, status: "good" },
        { label: "Threshold Status", value: thresholdMet ? "Met ✓" : `Need ${r1(threshold - leucineContent)}g more`, status: thresholdMet ? "good" : "danger" },
        { label: "MPS Score", value: `${mpsScore}/100`, status: mpsScore >= 65 ? "good" : mpsScore >= 45 ? "warning" : "danger" },
        { label: "Anabolic Resistance", value: `${anabolicResistance}%`, status: anabolicResistance === 0 ? "good" : anabolicResistance < 20 ? "warning" : "danger" },
        { label: "Sarcopenia Prevention", value: `${sarcopeniaPrevention}/100`, status: sarcopeniaPrevention >= 65 ? "good" : sarcopeniaPrevention >= 50 ? "warning" : "danger" },
        { label: "Protein to Meet Threshold", value: `${proteinNeededToMeetThreshold} g`, status: mealProtein >= proteinNeededToMeetThreshold ? "good" : "warning" },
      ],
      recommendations: [
        { title: "AI Protein Source Suggestion", description: `Current: ${proteinSource} (${r0(leucineFraction * 100)}% leucine). ${!thresholdMet ? `Switch to whey (11% leucine) — only ${r1(threshold / 0.11)}g needed to meet threshold. Alternatively add ${r1(threshold - leucineContent)}g leucine supplement to current meal.` : "Current source is adequate. Maintain ≥2-3 leucine-rich meals/day for consistent MPS."}`, priority: "high", category: "Source" },
        { title: "Sarcopenia Prevention", description: `Score: ${sarcopeniaPrevention}/100. ${age > 60 ? `⚠️ Anabolic resistance increases leucine threshold to ${threshold}g at age ${age}. Target 30-40g high-quality protein per meal (3-4x/day) to overcome age-related MPS blunting.` : "Meeting leucine threshold at each meal supports lean mass retention and prevents age-related muscle loss. Consistency is key."}`, priority: age > 60 ? "high" : "medium", category: "Geriatric" },
        { title: "MPS Consistency", description: `MPS score: ${mpsScore}/100. Aim for 3-5 leucine-sufficient meals daily spaced 3-5 hours apart. This maximizes the total daily MPS stimulus and prevents muscle protein breakdown between meals.`, priority: "medium", category: "Protocol" },
      ],
      detailedBreakdown: { mealProtein, proteinSource, age, leucineContent, threshold, thresholdMet, anabolicResistance, mpsScore, sarcopeniaPrevention, proteinNeededToMeetThreshold, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Leucine Trigger Meter", subtitle: "vs threshold requirement", unit: "g", values: [{ label: "Your Leucine", value: leucineContent, color: thresholdMet ? "bg-emerald-500" : "bg-rose-500" }, { label: "Threshold", value: threshold, color: "bg-slate-400" }] },
      { title: "Meal Comparison Chart", subtitle: "Leucine by protein source", unit: "g per 30g protein", values: [{ label: "Whey", value: r2(30 * 0.11), color: "bg-sky-500" }, { label: "Beef", value: r2(30 * 0.09), color: "bg-amber-500" }, { label: "Egg", value: r2(30 * 0.085), color: "bg-yellow-500" }, { label: "Rice", value: r2(30 * 0.075), color: "bg-emerald-400" }] },
      { title: "MPS Consistency", subtitle: "Score over meals", values: [{ label: "MPS Score", value: mpsScore, color: bandCls(scoreBand(mpsScore)) }] },
    ], research: buildResearch("Leucine Threshold Calculator", snap.tags, snap, { leucineContent, threshold, thresholdMet, mpsScore, anabolicResistance, sarcopeniaPrevention, proteinNeededToMeetThreshold }) })
  }

  return <ComprehensiveHealthTemplate title="Leucine Threshold Calculator" description="MPS trigger model with per-meal leucine analysis, anabolic resistance adjustment, sarcopenia prevention score, AI protein source suggestion, and MPS consistency tracking." toolId="leucine-threshold" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Leucine Threshold Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Leucine Threshold Calculator" description="Advanced leucine threshold calculator with MPS trigger, anabolic resistance, and sarcopenia prevention." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Meal Protein" value={mealProtein} onChange={setMealProtein} min={5} max={100} suffix="g" />
      <SelectInput label="Protein Source" value={proteinSource} onChange={setProteinSource} options={[{ value: "whey", label: "Whey" }, { value: "beef", label: "Beef/Chicken" }, { value: "egg", label: "Egg" }, { value: "casein", label: "Casein" }, { value: "rice", label: "Rice Protein" }, { value: "plant", label: "Mixed Plant" }]} />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={95} suffix="yrs" />
    </div>} />
}

/* ═══════════════════════  49. CASEIN PROTEIN CALCULATOR  ═══════════════════════ */

export function AdvancedCaseinProteinCalculator() {
  const [weight, setWeight] = useState(78)
  const [totalProtein, setTotalProtein] = useState(140)
  const [sleepHours, setSleepHours] = useState(7.5)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const preSleepDose = r1(clamp(weight * 0.45, 20, 50))
    const proteinPerKg = r1(totalProtein / weight)
    const kidneyAlert = proteinPerKg > 2.5
    const overnightNitrogenBalance = r1(clamp(preSleepDose * 0.15 - weight * 0.012, -5, 8))
    const muscleBreakdownRisk = clamp(r0(100 - preSleepDose * 2.2 - (sleepHours > 7 ? 12 : 0)), 5, 95)
    const nightRecoveryScore = clamp(r0(100 - muscleBreakdownRisk * 0.7 + overnightNitrogenBalance * 5), 5, 95)
    const bedtimeTiming = "30–60 min before sleep"
    const absorptionWindow = r0(sleepHours * 0.9)
    const score = clamp(r0(kidneyAlert ? 42 : nightRecoveryScore * 0.5 + (100 - muscleBreakdownRisk) * 0.3 + 12), 5, 95)
    const band = scoreBand(score, kidneyAlert)
    const note = `Casein: ${preSleepDose}g pre-sleep (${bedtimeTiming}). Overnight nitrogen balance: ${overnightNitrogenBalance > 0 ? "+" : ""}${overnightNitrogenBalance}g. ${kidneyAlert ? "⚠️ Total protein >2.5g/kg — kidney safety alert. Reduce total daily intake." : muscleBreakdownRisk < 35 ? "Excellent overnight muscle preservation strategy." : "Pre-sleep casein will significantly reduce overnight catabolism."}`

    const snap = mkSnap({ toolId: "casein-protein", toolName: "Casein Protein Calculator", healthScore: kidneyAlert ? Math.min(score, 42) : score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection6Month: clamp(r0(score + 8), 0, 100), projection1Year: clamp(r0(score + 11), 0, 100), tags: [kidneyAlert ? "kidney-alert" : "muscle-preservation", "slow-release"], domain: "recovery", weightKg: weight, proteinG: totalProtein })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Pre-Sleep Dose", value: `${preSleepDose} g`, status: toStatus(band), description: `Overnight Nitrogen: ${overnightNitrogenBalance > 0 ? "+" : ""}${overnightNitrogenBalance}g` },
      healthScore: snap.healthScore,
      metrics: [
        { label: "Pre-Sleep Casein", value: `${preSleepDose} g`, status: "good" },
        { label: "Overnight N Balance", value: `${overnightNitrogenBalance > 0 ? "+" : ""}${overnightNitrogenBalance} g`, status: overnightNitrogenBalance >= 3 ? "good" : overnightNitrogenBalance >= 0 ? "warning" : "danger" },
        { label: "Muscle Breakdown Risk", value: `${muscleBreakdownRisk}%`, status: muscleBreakdownRisk < 30 ? "good" : muscleBreakdownRisk < 55 ? "warning" : "danger" },
        { label: "Night Recovery Score", value: `${nightRecoveryScore}/100`, status: nightRecoveryScore >= 65 ? "good" : nightRecoveryScore >= 50 ? "warning" : "danger" },
        { label: "Absorption Window", value: `${absorptionWindow} hrs`, status: absorptionWindow >= 6 ? "good" : "warning" },
        { label: "Kidney Safety", value: kidneyAlert ? "⚠️ Total protein elevated" : "Normal range", status: kidneyAlert ? "danger" : "good" },
      ],
      recommendations: [
        { title: "AI Bedtime Timing Optimizer", description: `Optimal timing: ${bedtimeTiming}. Casein forms a gel in the stomach, releasing amino acids for ${absorptionWindow} hours — perfectly matching your ${sleepHours}h sleep window. This prevents the overnight catabolic state that occurs without pre-sleep protein.`, priority: "high", category: "Timing" },
        { title: "Kidney Safety Alert", description: kidneyAlert ? "⚠️ Total protein >2.5g/kg detected. While healthy kidneys can handle high protein, reduce total intake to ≤2.2g/kg and increase fluid intake to 3L/day. Consider periodic creatinine/eGFR monitoring." : "Total protein load is within safe range for healthy kidneys. Adequate hydration (2.5-3L/day) supports renal function.", priority: kidneyAlert ? "high" : "medium", category: "Safety" },
        { title: "Sarcopenia Support", description: `Night recovery score: ${nightRecoveryScore}/100. Pre-sleep protein (0.4g/kg) increases overnight muscle protein synthesis by 22% (van Loon lab data). Particularly valuable for individuals >50 with elevated anabolic resistance.`, priority: "medium", category: "Geriatric" },
      ],
      detailedBreakdown: { weight, totalProtein, sleepHours, preSleepDose, proteinPerKg, overnightNitrogenBalance, muscleBreakdownRisk, nightRecoveryScore, absorptionWindow, kidneyAlert, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Night Recovery Index", subtitle: "Overnight preservation ", values: [{ label: "Recovery", value: nightRecoveryScore, color: bandCls(scoreBand(nightRecoveryScore)) }, { label: "Breakdown Risk", value: muscleBreakdownRisk, color: muscleBreakdownRisk < 30 ? "bg-emerald-500" : muscleBreakdownRisk < 55 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Protein Timing Timeline", subtitle: "Absorption over sleep hours", unit: "g", values: Array.from({ length: Math.min(4, r0(absorptionWindow / 2)) }, (_, i) => ({ label: `+${(i + 1) * 2}h`, value: r0(preSleepDose * Math.exp(-(i + 1) * 0.35)), color: "bg-violet-500" })) },
      { title: "Overnight Nitrogen Balance", subtitle: "Anabolic vs catabolic", unit: "g", values: [{ label: "N Balance", value: Math.max(0, overnightNitrogenBalance + 5), color: overnightNitrogenBalance >= 0 ? "bg-emerald-500" : "bg-rose-500" }] },
    ], research: buildResearch("Casein Protein Calculator", snap.tags, snap, { preSleepDose, overnightNitrogenBalance, muscleBreakdownRisk, nightRecoveryScore, absorptionWindow, kidneyAlert }) })
  }

  return <ComprehensiveHealthTemplate title="Casein Protein Calculator" description="Slow-release recovery model with pre-sleep dose optimization, overnight nitrogen balance, muscle breakdown risk, AI bedtime timing, and kidney safety alert." toolId="casein-protein" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Casein Protein Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Casein Protein Calculator" description="Advanced casein protein calculator with overnight nitrogen balance, muscle preservation, and kidney safety." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <NumInput label="Total Daily Protein" value={totalProtein} onChange={setTotalProtein} min={20} max={300} suffix="g/day" />
      <NumInput label="Sleep Hours" value={sleepHours} onChange={setSleepHours} min={4} max={12} step={0.5} suffix="hrs" />
    </div>} />
}

/* ═══════════════════════  50. WHEY PROTEIN CALCULATOR  ═══════════════════════ */

export function AdvancedWheyProteinCalculator() {
  const [weight, setWeight] = useState(80)
  const [intensity, setIntensity] = useState("high")
  const [totalProtein, setTotalProtein] = useState(140)
  const [lactoseIntolerance, setLactoseIntolerance] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const proteinPerKg = r1(totalProtein / weight)
    const servingDose = r0(clamp(weight * (intensity === "high" ? 0.4 : intensity === "moderate" ? 0.3 : 0.25), 20, 50))
    const leucineContent = r2(servingDose * 0.11)
    const leucineAdequate = leucineContent >= 2.5
    const recoveryAcceleration = clamp(r0(leucineAdequate ? 75 + (intensity === "high" ? 12 : 4) : 50), 5, 95)
    const insulinSpike = clamp(r0(servingDose * 1.8 + (intensity === "high" ? 12 : 4)), 5, 100)
    const absorptionRate = "15–30 min post-workout"
    const formRecommendation = lactoseIntolerance === "yes" ? "Whey Isolate (≤0.1g lactose/serving)" : proteinPerKg > 2 ? "Whey Concentrate (cost-effective)" : "Whey Isolate or Hydrolysate"
    const lactoseAlert = lactoseIntolerance === "yes"
    const redundancy = proteinPerKg >= 2.2 && "may be redundant at this protein intake"
    const score = clamp(r0(recoveryAcceleration * 0.45 + (leucineAdequate ? 15 : 0) + (100 - insulinSpike * 0.3) * 0.2 + 12), 5, 95)
    const band = scoreBand(score)
    const note = `Whey: ${servingDose}g post-workout (${absorptionRate}). Leucine: ${leucineContent}g (${leucineAdequate ? "threshold met" : "below threshold"}). ${lactoseAlert ? "Use isolate form to avoid GI distress." : ""} Recovery acceleration: ${recoveryAcceleration}/100.`

    const snap = mkSnap({ toolId: "whey-protein", toolName: "Whey Protein Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection6Month: clamp(r0(score + 8), 0, 100), projection1Year: clamp(r0(score + 11), 0, 100), tags: [lactoseAlert ? "lactose-alert" : "standard-whey", leucineAdequate ? "leucine-met" : "leucine-gap"], domain: "supplement", weightKg: weight, proteinG: totalProtein })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Post-Workout Dose", value: `${servingDose} g`, status: toStatus(band), description: `Leucine: ${leucineContent}g · Recovery: ${recoveryAcceleration}/100` },
      healthScore: score,
      metrics: [
        { label: "Serving Dose", value: `${servingDose} g`, status: "good" },
        { label: "Leucine Content", value: `${leucineContent} g`, status: leucineAdequate ? "good" : "warning" },
        { label: "Recovery Acceleration", value: `${recoveryAcceleration}/100`, status: recoveryAcceleration >= 70 ? "good" : recoveryAcceleration >= 55 ? "warning" : "danger" },
        { label: "Insulin Spike Estimate", value: `${insulinSpike}/100`, status: insulinSpike < 50 ? "good" : insulinSpike < 75 ? "warning" : "danger" },
        { label: "Form Recommendation", value: formRecommendation, status: "good" },
        { label: "Lactose Alert", value: lactoseAlert ? "⚠️ Use Isolate" : "No concern", status: lactoseAlert ? "warning" : "good" },
        { label: "Redundancy Check", value: redundancy ? "⚠️ " + redundancy : "Supplementation adds value", status: redundancy ? "warning" : "good" },
      ],
      recommendations: [
        { title: "AI Isolate vs Concentrate", description: `Recommendation: ${formRecommendation}. ${lactoseAlert ? "Isolate has <1g lactose vs ~5g in concentrate — essential for lactose intolerant individuals. Hydrolysate is fastest-absorbing but most expensive." : `Concentrate is cost-effective at ${r1(100 / 0.80)}% the price of isolate with equivalent MPS response in healthy individuals.`}`, priority: "high", category: "Product" },
        { title: "Protein Absorption Curve", description: `Whey peaks in blood at 60-90 min and is largely cleared by 3 hours. Consume within ${absorptionRate} to maximize anabolic window. Insulin spike (${insulinSpike}/100) enhances amino acid uptake into muscle cells.`, priority: "high", category: "Timing" },
        { title: "Sports Rehab Integration", description: `Recovery acceleration: ${recoveryAcceleration}/100. Whey reduces DOMS by ~15% when consumed within 30 min post-exercise. For injury rehab, 40g whey + leucine supplement maximizes connective tissue repair.`, priority: "medium", category: "Rehab" },
      ],
      detailedBreakdown: { weight, intensity, totalProtein, lactoseIntolerance, proteinPerKg, servingDose, leucineContent, leucineAdequate, recoveryAcceleration, insulinSpike, formRecommendation, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Post-Workout Recovery Meter", subtitle: "Speed and efficacy", values: [{ label: "Recovery", value: recoveryAcceleration, color: bandCls(scoreBand(recoveryAcceleration)) }] },
      { title: "Protein Absorption Curve", subtitle: "Whey elimination timeline", unit: "g", values: [{ label: "0 min", value: servingDose, color: "bg-sky-600" }, { label: "60 min", value: r0(servingDose * 0.55), color: "bg-sky-500" }, { label: "120 min", value: r0(servingDose * 0.2), color: "bg-sky-400" }, { label: "180 min", value: r0(servingDose * 0.05), color: "bg-sky-300" }] },
      { title: "Leucine vs Insulin", subtitle: "Anabolic signaling", values: [{ label: "Leucine (×10)", value: r0(leucineContent * 10), color: leucineAdequate ? "bg-emerald-500" : "bg-amber-500" }, { label: "Insulin Spike", value: insulinSpike, color: insulinSpike < 50 ? "bg-emerald-500" : "bg-amber-500" }] },
    ], research: buildResearch("Whey Protein Calculator", snap.tags, snap, { servingDose, leucineContent, recoveryAcceleration, insulinSpike, formRecommendation, lactoseAlert }) })
  }

  return <ComprehensiveHealthTemplate title="Whey Protein Calculator" description="Rapid absorption model with post-workout dosing, leucine adequacy, recovery acceleration score, insulin spike estimate, AI isolate vs concentrate recommendation, and lactose intolerance alert." toolId="whey-protein" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Whey Protein Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Whey Protein Calculator" description="Advanced whey protein calculator with leucine adequacy, recovery acceleration, and lactose alert." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Workout Intensity" value={intensity} onChange={setIntensity} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
      <NumInput label="Total Daily Protein" value={totalProtein} onChange={setTotalProtein} min={20} max={300} suffix="g/day" />
      <SelectInput label="Lactose Intolerance" value={lactoseIntolerance} onChange={setLactoseIntolerance} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
    </div>} />
}

/* ═══════════════════════  51. PLANT PROTEIN CALCULATOR  ═══════════════════════ */

export function AdvancedPlantProteinCalculator() {
  const [weight, setWeight] = useState(70)
  const [sources, setSources] = useState("mixed")
  const [activity, setActivity] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const pdcaas = sources === "soy" ? 1.0 : sources === "pea" ? 0.89 : sources === "rice" ? 0.76 : sources === "hemp" ? 0.63 : 0.82
    const diaas = sources === "soy" ? 0.97 : sources === "pea" ? 0.82 : sources === "rice" ? 0.60 : sources === "hemp" ? 0.55 : 0.78
    const proteinNeed = r0(weight * (activity === "active" ? 2.0 : activity === "moderate" ? 1.6 : 1.2))
    const adjustedNeed = r0(proteinNeed / diaas)
    const eaaAdequacy = clamp(r0(diaas * 100), 5, 100)
    const complementPairing = sources === "mixed" ? "Rice + Pea + Hemp blend" : sources === "rice" ? "Combine rice with legumes or pea protein" : sources === "hemp" ? "Add pea or soy for complete EAA profile" : "Single source is adequate"
    const ironRisk = sources === "mixed" || sources === "hemp" ? 60 : 45
    const b12Risk = 85
    const deficiencyRisk = clamp(r0(100 - eaaAdequacy * 0.4 - (sources === "soy" ? 15 : 0) - (sources === "mixed" ? 10 : 0)), 5, 95)
    const leanMassTrend = clamp(r0(eaaAdequacy * 0.5 + (activity === "active" ? 18 : 8)), 5, 95)
    const veganAthleteMode = activity === "active"
    const score = clamp(r0(leanMassTrend * 0.35 + eaaAdequacy * 0.3 + (100 - deficiencyRisk) * 0.2 + 8), 5, 95)
    const band = scoreBand(score)
    const note = `Plant protein (${sources}, DIAAS ${r2(diaas)}): need ${adjustedNeed}g/day (adjusted from ${proteinNeed}g). EAA adequacy: ${eaaAdequacy}%. ${complementPairing}.`

    const snap = mkSnap({ toolId: "plant-protein", toolName: "Plant Protein Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection6Month: clamp(r0(score + 8), 0, 100), projection1Year: clamp(r0(score + 11), 0, 100), tags: [deficiencyRisk > 50 ? "deficiency-risk" : "plant-adequate", veganAthleteMode ? "vegan-athlete" : "standard"], domain: "supplement", weightKg: weight, proteinG: adjustedNeed })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Adjusted Protein Need", value: `${adjustedNeed} g/day`, status: toStatus(band), description: `DIAAS ${r2(diaas)} · PDCAAS ${r2(pdcaas)} · EAA ${eaaAdequacy}%` },
      healthScore: score,
      metrics: [
        { label: "Raw Need", value: `${proteinNeed} g`, status: "good" },
        { label: "DIAAS-Adjusted", value: `${adjustedNeed} g`, status: "good" },
        { label: "PDCAAS", value: r2(pdcaas), status: pdcaas >= 0.9 ? "good" : pdcaas >= 0.7 ? "warning" : "danger" },
        { label: "DIAAS", value: r2(diaas), status: diaas >= 0.85 ? "good" : diaas >= 0.65 ? "warning" : "danger" },
        { label: "EAA Adequacy", value: `${eaaAdequacy}%`, status: eaaAdequacy >= 80 ? "good" : eaaAdequacy >= 65 ? "warning" : "danger" },
        { label: "Iron Status Risk", value: `${ironRisk}%`, status: ironRisk < 50 ? "good" : ironRisk < 70 ? "warning" : "danger" },
        { label: "B12 Status Risk", value: `${b12Risk}%`, status: "danger" },
        { label: "Lean Mass Trend", value: `${leanMassTrend}/100`, status: leanMassTrend >= 65 ? "good" : leanMassTrend >= 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Deficiency Risk", description: `Risk: ${deficiencyRisk}%. ${deficiencyRisk > 50 ? "Deficiency risk is elevated. Combine sources for complete EAA profile. Essential supplementation: B12, vitamin D, iodine, zinc." : "Deficiency risk is manageable with strategic food combining."} ${complementPairing}.`, priority: "high", category: "Deficiency" },
        { title: "Vegan Athlete Mode", description: veganAthleteMode ? `Elite vegan athletes need ${adjustedNeed}g/day — 25% more than animal-based counterparts. Prioritize leucine-rich sources (soy, pea) peri-workout. Creatine, beta-alanine, and B12 supplementation strongly recommended.` : "Increase protein target to 2g/kg if you transition to active training. Plant sources require strategic combining to match whey completeness.", priority: "high", category: "Performance" },
        { title: "Amino Acid Radar", description: `DIAAS: ${r2(diaas)}. Limiting amino acids in plant proteins: lysine (cereals), methionine (legumes). Combining rice + legumes provides complementary amino profiles that together approach animal-protein equivalence.`, priority: "medium", category: "Amino Acids" },
      ],
      detailedBreakdown: { weight, sources, activity, pdcaas, diaas, proteinNeed, adjustedNeed, eaaAdequacy, deficiencyRisk, leanMassTrend, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Digestibility-Adjusted Score", subtitle: "PDCAAS vs DIAAS comparison", values: [{ label: "PDCAAS ×100", value: r0(pdcaas * 100), color: "bg-sky-500" }, { label: "DIAAS ×100", value: r0(diaas * 100), color: "bg-emerald-500" }, { label: "EAA Adequacy", value: eaaAdequacy, color: bandCls(scoreBand(eaaAdequacy)) }] },
      { title: "Amino Acid Radar", subtitle: "Source quality index", values: [{ label: "Completeness", value: eaaAdequacy, color: bandCls(scoreBand(eaaAdequacy)) }, { label: "Lean Mass", value: leanMassTrend, color: bandCls(scoreBand(leanMassTrend)) }] },
      { title: "Lean Mass Progression", subtitle: "3-month trajectory", values: [{ label: "Trend", value: leanMassTrend, color: bandCls(scoreBand(leanMassTrend)) }] },
    ], research: buildResearch("Plant Protein Calculator", snap.tags, snap, { pdcaas, diaas, proteinNeed, adjustedNeed, eaaAdequacy, deficiencyRisk, leanMassTrend }) })
  }

  return <ComprehensiveHealthTemplate title="Plant Protein Calculator" description="Digestibility-adjusted model with PDCAAS/DIAAS correction, EAA adequacy radar, complementary protein pairing, iron/B12 cross-check, AI deficiency risk, and vegan athlete mode." toolId="plant-protein" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Plant Protein Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Plant Protein Calculator" description="Advanced plant protein calculator with DIAAS correction, EAA radar, and vegan athlete mode." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Primary Protein Source" value={sources} onChange={setSources} options={[{ value: "mixed", label: "Mixed Sources" }, { value: "soy", label: "Soy" }, { value: "pea", label: "Pea" }, { value: "rice", label: "Rice" }, { value: "hemp", label: "Hemp" }]} />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active/Athlete" }]} />
    </div>} />
}

/* ═══════════════════════  52. COLLAGEN DOSAGE CALCULATOR  ═══════════════════════ */

export function AdvancedCollagenDosageCalculator() {
  const [weight, setWeight] = useState(72)
  const [jointPain, setJointPain] = useState("mild")
  const [skinConcern, setSkinConcern] = useState("yes")
  const [activity, setActivity] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const jointBase = jointPain === "severe" ? 15 : jointPain === "moderate" ? 12 : jointPain === "mild" ? 10 : 5
    const skinBase = skinConcern === "yes" ? 10 : 5
    const athleteBoost = activity === "active" ? 5 : 0
    const dose = clamp(r0(Math.max(jointBase, skinBase) + athleteBoost), 5, 20)
    const vitaminCNeeded = r0(dose * 4)
    const jointRecovery = clamp(r0(dose * 5 + (jointPain === "severe" ? -8 : 0) + (activity === "active" ? 10 : 4)), 5, 95)
    const skinElasticity = clamp(r0(dose * 4.5 + (skinConcern === "yes" ? 12 : 0)), 5, 95)
    const tendonRepair = clamp(r0(dose * 4 + (activity === "active" ? 18 : 6)), 5, 95)
    const overSupplementAlert = dose > 15 && jointPain !== "severe"
    const absorptionTiming = "30-60 min before exercise or on an empty stomach"
    const score = clamp(r0(overSupplementAlert ? 52 : jointRecovery * 0.35 + skinElasticity * 0.25 + tendonRepair * 0.25 + 8), 5, 95)
    const band = scoreBand(score)
    const note = `Collagen: ${dose}g/day with ${vitaminCNeeded}mg vitamin C. Joint recovery: ${jointRecovery}/100. Skin elasticity: ${skinElasticity}/100. ${overSupplementAlert ? "High dose without severe joint indication — monitor for diminishing returns." : "Dose is evidence-aligned."}`

    const snap = mkSnap({ toolId: "collagen-dosage", toolName: "Collagen Dosage Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 4), 0, 100), projection6Month: clamp(r0(score + 7), 0, 100), projection1Year: clamp(r0(score + 10), 0, 100), tags: [jointPain !== "none" ? "joint-support" : "skin-support", overSupplementAlert ? "over-supplement-alert" : "optimal-dose"], domain: "supplement", weightKg: weight })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Collagen Dose", value: `${dose} g/day`, status: toStatus(band), description: `+ ${vitaminCNeeded}mg Vitamin C synergy` },
      healthScore: score,
      metrics: [
        { label: "Daily Dose", value: `${dose} g`, status: "good" },
        { label: "Vitamin C Synergy", value: `${vitaminCNeeded} mg`, status: "good" },
        { label: "Joint Recovery", value: `${jointRecovery}/100`, status: jointRecovery >= 65 ? "good" : jointRecovery >= 50 ? "warning" : "danger" },
        { label: "Skin Elasticity", value: `${skinElasticity}/100`, status: skinElasticity >= 60 ? "good" : skinElasticity >= 45 ? "warning" : "danger" },
        { label: "Tendon Repair", value: `${tendonRepair}/100`, status: tendonRepair >= 60 ? "good" : tendonRepair >= 45 ? "warning" : "danger" },
        { label: "Over-Supplement Alert", value: overSupplementAlert ? "⚠️ Dose may be high for condition" : "Dose appropriate", status: overSupplementAlert ? "warning" : "good" },
      ],
      recommendations: [
        { title: "AI Tendon Repair Mode", description: `Tendon repair score: ${tendonRepair}/100. Take collagen 30-60 min before exercise — vitamin C activates collagen synthesis during the anabolic window post-workout. Type I collagen (hydrolysed) for joints, Type II for cartilage specifically.`, priority: "high", category: "Tendon" },
        { title: "Vitamin C Synergy", description: `Pair ${dose}g collagen with ${vitaminCNeeded}mg vitamin C (ascorbic acid). This co-factor is essential for prolyl hydroxylase enzyme activity — without it, collagen synthesis is impaired by ~50%.`, priority: "high", category: "Synergy" },
        { title: "Joint Pain vs Intake", description: `${jointPain !== "none" ? `Current pain level: ${jointPain}. Clinical studies show 10g/day hydrolysed collagen reduces OA pain by 25-40% over 3-6 months. Track pain score weekly.` : "Preventive use: 5-10g/day collagen maintains cartilage density and skin elasticity especially in athletes."}`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, jointPain, skinConcern, activity, dose, vitaminCNeeded, jointRecovery, skinElasticity, tendonRepair, overSupplementAlert, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Collagen Support Index", subtitle: "Joint, skin, tendon scores", values: [{ label: "Joint", value: jointRecovery, color: bandCls(scoreBand(jointRecovery)) }, { label: "Skin", value: skinElasticity, color: bandCls(scoreBand(skinElasticity)) }, { label: "Tendon", value: tendonRepair, color: bandCls(scoreBand(tendonRepair)) }] },
      { title: "Dose Meter", subtitle: "Daily dose vs upper limit", unit: "g", values: [{ label: "Your Dose", value: dose, color: "bg-violet-500" }, { label: "Upper Limit", value: 20, color: "bg-slate-400" }] },
      { title: "Joint Pain Trend", subtitle: "Recovery projection", values: [{ label: "Now", value: jointPain === "severe" ? 20 : jointPain === "moderate" ? 45 : jointPain === "mild" ? 65 : 85, color: "bg-amber-500" }, { label: "3 Months", value: clamp(r0(jointRecovery + 8), 0, 100), color: "bg-emerald-500" }] },
    ], research: buildResearch("Collagen Dosage Calculator", snap.tags, snap, { dose, vitaminCNeeded, jointRecovery, skinElasticity, tendonRepair, overSupplementAlert }) })
  }

  return <ComprehensiveHealthTemplate title="Collagen Dosage Calculator" description="Joint and skin support engine with vitamin C synergy, joint recovery probability, skin elasticity projection, AI tendon repair mode, and over-supplement alert." toolId="collagen-dosage" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Collagen Dosage Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Collagen Dosage Calculator" description="Advanced collagen dosage calculator with joint recovery, skin elasticity, tendon repair, and vitamin C synergy." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Joint Pain Level" value={jointPain} onChange={setJointPain} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe" }]} />
      <SelectInput label="Skin Concerns" value={skinConcern} onChange={setSkinConcern} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (wrinkles/elasticity)" }]} />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active/Athlete" }]} />
    </div>} />
}

/* ═══════════════════════  53. ELECTROLYTE BALANCE CALCULATOR  ═══════════════════════ */

export function AdvancedElectrolyteBalanceCalculator() {
  const [sodiumMg, setSodiumMg] = useState(2200)
  const [potassiumMg, setPotassiumMg] = useState(3200)
  const [fluidL, setFluidL] = useState(2.5)
  const [bp, setBp] = useState(120)
  const [sweatRate, setSweatRate] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const idealNa = bp > 130 ? 1500 : 2300
    const idealK = 4700
    const naRatio = r2(sodiumMg / idealNa)
    const kRatio = r2(potassiumMg / idealK)
    const naKRatio = r2(sodiumMg / Math.max(potassiumMg, 1))
    const hyponatremiaRisk = clamp(r0(sodiumMg < 1200 && fluidL > 3 ? 55 : sodiumMg < 1500 && fluidL > 4 ? 35 : 10), 0, 100)
    const hypernatremiaRisk = clamp(r0(sodiumMg > 4000 ? 40 : sodiumMg > 3000 ? 22 : 8), 0, 100)
    const cardiacRhythmRisk = clamp(r0((potassiumMg < 2500 ? 35 : potassiumMg < 3500 ? 15 : 0) + (sodiumMg > 3500 ? 12 : 0) + (bp > 140 ? 18 : 0)), 0, 100)
    const heatStressScore = clamp(r0((sweatRate === "high" ? 35 : sweatRate === "moderate" ? 18 : 8) + (sodiumMg < 2000 ? 14 : 0) + (fluidL < 2 ? 18 : 0)), 0, 100)
    const bpLinkedCorrection = bp > 130 ? `Reduce to <${idealNa}mg sodium` : "Sodium level acceptable"
    const enduranceMode = sweatRate === "high"
    const score = clamp(r0(100 - hyponatremiaRisk * 0.2 - hypernatremiaRisk * 0.2 - cardiacRhythmRisk * 0.3 - heatStressScore * 0.15 + 10), 5, 95)
    const purple = cardiacRhythmRisk > 55
    const band = scoreBand(score, purple)
    const note = `Electrolyte ratio: Na:K = ${r2(naKRatio)}:1 (ideal <1.5:1). ${purple ? "⚠️ Cardiac rhythm risk elevated — consult physician." : hyponatremiaRisk > 35 ? "Hyponatremia risk detected — reduce fluid or add electrolytes." : hypernatremiaRisk > 30 ? "High sodium load — reduce dietary sodium." : "Electrolyte balance is within acceptable range."} BP-linked correction: ${bpLinkedCorrection}.`

    const snap = mkSnap({ toolId: "electrolyte-balance", toolName: "Electrolyte Balance Calculator", healthScore: purple ? Math.min(score, 38) : score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection6Month: clamp(r0(score + 8), 0, 100), projection1Year: clamp(r0(score + 10), 0, 100), tags: [purple ? "cardiac-risk" : hyponatremiaRisk > 35 ? "hyponatremia-risk" : "balanced", enduranceMode ? "endurance-athlete" : "standard"], domain: "hydration" })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Na:K Ratio", value: `${r2(naKRatio)}:1`, status: toStatus(band), description: `Ideal <1.5:1 · BP correction: ${bpLinkedCorrection}` },
      healthScore: snap.healthScore,
      metrics: [
        { label: "Sodium Intake", value: `${sodiumMg} mg`, status: sodiumMg <= idealNa ? "good" : sodiumMg <= 3000 ? "warning" : "danger" },
        { label: "Potassium Intake", value: `${potassiumMg} mg`, status: potassiumMg >= 3500 ? "good" : potassiumMg >= 2500 ? "warning" : "danger" },
        { label: "Na:K Ratio", value: r2(naKRatio), status: naKRatio < 1.5 ? "good" : naKRatio < 2.5 ? "warning" : "danger" },
        { label: "Hyponatremia Risk", value: `${hyponatremiaRisk}%`, status: hyponatremiaRisk < 20 ? "good" : hyponatremiaRisk < 40 ? "warning" : "danger" },
        { label: "Hypernatremia Risk", value: `${hypernatremiaRisk}%`, status: hypernatremiaRisk < 15 ? "good" : hypernatremiaRisk < 30 ? "warning" : "danger" },
        { label: "Cardiac Rhythm Risk", value: `${cardiacRhythmRisk}%`, status: cardiacRhythmRisk < 15 ? "good" : cardiacRhythmRisk < 35 ? "warning" : "danger" },
        { label: "Heat Stress Score", value: `${heatStressScore}/100`, status: heatStressScore < 25 ? "good" : heatStressScore < 45 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Endurance Athlete Mode", description: enduranceMode ? `High sweat rate mode. Endurance athletes lose 500-1500mg sodium/hour. Replace with electrolyte drinks (not plain water) to prevent exercise-induced hyponatremia. Target: ${r0(fluidL * 400)}mg sodium + ${r0(fluidL * 200)}mg potassium during prolonged exercise.` : "Moderate sweat rate — standard electrolyte guidelines apply. Increase intake by 500mg sodium/hour during prolonged exercise in heat.", priority: "high", category: "Endurance" },
        { title: "BP-Linked Sodium Correction", description: `BP: ${bp} mmHg. ${bp > 130 ? `Hypertension — reduce sodium to <${idealNa}mg/day. Each 1000mg sodium reduction reduces systolic BP by ~3 mmHg. DASH diet (4700mg K+, <2300mg Na) reduces systolic BP by 11 mmHg.` : "BP normal — standard sodium guidelines apply. High potassium intake (>3500mg) independently reduces BP by 2-4 mmHg."}`, priority: bp > 130 ? "high" : "medium", category: "Cardiovascular" },
        { title: "Cardiac Rhythm Alert", description: purple ? `⚠️ Cardiac rhythm risk: ${cardiacRhythmRisk}%. Hypokalemia (<3.5 mEq/L) and hypernatremia both increase arrhythmia risk. Seek emergency medical evaluation if symptomatic (palpitations, weakness, cramps).` : `Cardiac risk: ${cardiacRhythmRisk}%. Maintain potassium >3500mg/day for normal cardiac conduction. Magnesium co-supplementation (200-400mg) further stabilizes heart rhythm.`, priority: purple ? "high" : "medium", category: "Cardiac" },
      ],
      detailedBreakdown: { sodiumMg, potassiumMg, fluidL, bp, sweatRate, naKRatio, hyponatremiaRisk, hypernatremiaRisk, cardiacRhythmRisk, heatStressScore, bpLinkedCorrection, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Electrolyte Balance Radar", subtitle: "Na, K, fluid ratios", values: [{ label: "Na (×0.1)", value: r0(sodiumMg * 0.001 * 100), color: naRatio <= 1 ? "bg-emerald-500" : naRatio <= 1.5 ? "bg-amber-500" : "bg-rose-500" }, { label: "K (×0.1)", value: r0(potassiumMg * 0.001 * 100), color: kRatio >= 0.75 ? "bg-emerald-500" : "bg-amber-500" }, { label: "Fluid (×20)", value: r0(fluidL * 20), color: "bg-sky-500" }] },
      { title: "Risk Color Indicator", subtitle: "Multi-risk assessment", values: [{ label: "Hyponatremia", value: hyponatremiaRisk, color: hyponatremiaRisk < 20 ? "bg-emerald-500" : hyponatremiaRisk < 40 ? "bg-amber-500" : "bg-rose-500" }, { label: "Cardiac", value: cardiacRhythmRisk, color: cardiacRhythmRisk < 15 ? "bg-emerald-500" : cardiacRhythmRisk < 35 ? "bg-amber-500" : "bg-rose-600" }, { label: "Heat Stress", value: heatStressScore, color: heatStressScore < 25 ? "bg-emerald-500" : heatStressScore < 45 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "BP vs Sodium Trend", subtitle: "Correlation monitor", values: [{ label: "Na Load %", value: r0(sodiumMg / 40), color: sodiumMg <= idealNa ? "bg-emerald-500" : "bg-amber-500" }, { label: "BP Index", value: r0(bp / 1.8), color: bp > 130 ? "bg-rose-500" : "bg-emerald-500" }] },
    ], research: buildResearch("Electrolyte Balance Calculator", snap.tags, snap, { sodiumMg, potassiumMg, fluidL, bp, naKRatio, hyponatremiaRisk, hypernatremiaRisk, cardiacRhythmRisk, heatStressScore }) })
  }

  return <ComprehensiveHealthTemplate title="Electrolyte Balance Calculator" description="Fluid-electrolyte stability matrix with Na:K ratio, hyponatremia/hypernatremia risk, cardiac rhythm risk, heat stress score, AI endurance athlete mode, and BP-linked sodium correction." toolId="electrolyte-balance" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Electrolyte Balance Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Electrolyte Balance Calculator" description="Advanced electrolyte balance calculator with cardiac rhythm risk, heat stress, and BP-linked sodium correction." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Sodium Intake" value={sodiumMg} onChange={setSodiumMg} min={200} max={8000} step={100} suffix="mg/day" />
      <NumInput label="Potassium Intake" value={potassiumMg} onChange={setPotassiumMg} min={500} max={8000} step={100} suffix="mg/day" />
      <NumInput label="Fluid Intake" value={fluidL} onChange={setFluidL} min={0.5} max={8} step={0.1} suffix="L/day" />
      <NumInput label="Systolic BP" value={bp} onChange={setBp} min={80} max={200} suffix="mmHg" />
      <SelectInput label="Sweat Rate" value={sweatRate} onChange={setSweatRate} options={[{ value: "low", label: "Low (desk job)" }, { value: "moderate", label: "Moderate (regular exercise)" }, { value: "high", label: "High (endurance athlete)" }]} />
    </div>} />
}

/* ═══════════════════════  54. POST-BARIATRIC PROTEIN CALCULATOR  ═══════════════════════ */

export function AdvancedPostBariatricProteinCalculator() {
  const [weight, setWeight] = useState(90)
  const [surgeryType, setSurgeryType] = useState("rygb")
  const [monthsSinceSurgery, setMonthsSinceSurgery] = useState(6)
  const [giTolerance, setGiTolerance] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const minTarget = surgeryType === "rygb" ? 80 : surgeryType === "sleeve" ? 70 : 90
    const maxTarget = surgeryType === "rygb" ? 100 : surgeryType === "sleeve" ? 90 : 110
    const malabsorptionFactor = surgeryType === "rygb" ? 0.85 : surgeryType === "bpd" ? 0.65 : 0.95
    const adjustedNeed = r0(minTarget / malabsorptionFactor)
    const mealTolerance = giTolerance === "high" ? 25 : giTolerance === "moderate" ? 20 : 15
    const mealsNeeded = Math.ceil(adjustedNeed / mealTolerance)
    const leanMassLossRisk = clamp(r0((adjustedNeed > 90 ? 12 : adjustedNeed > 70 ? 25 : 40) + (monthsSinceSurgery < 3 ? 18 : 0)), 5, 95)
    const microDeficiencyRisk = clamp(r0(surgeryType === "bpd" ? 65 : surgeryType === "rygb" ? 45 : 25), 5, 95)
    const proteinAdequacy = clamp(r0(100 - (adjustedNeed > maxTarget ? 10 : 5) - (giTolerance === "low" ? 20 : 0)), 5, 95)
    const score = clamp(r0(proteinAdequacy * 0.45 + (100 - leanMassLossRisk) * 0.3 + (100 - microDeficiencyRisk) * 0.15 + 8), 5, 95)
    const band = scoreBand(score, microDeficiencyRisk > 60)
    const note = `Post-bariatric protein: ${adjustedNeed}g/day (${minTarget}-${maxTarget}g target), ${mealTolerance}g/meal in ${mealsNeeded} meals. Malabsorption factor: ${r2(malabsorptionFactor)}. ${microDeficiencyRisk > 50 ? "⚠️ High micronutrient deficiency risk — B12, iron, calcium, zinc supplementation essential." : "Adequate supplementation protocol recommended."}`

    const snap = mkSnap({ toolId: "post-bariatric-protein", toolName: "Post-Bariatric Protein Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection6Month: clamp(r0(score + 8), 0, 100), projection1Year: clamp(r0(score + 10), 0, 100), tags: [microDeficiencyRisk > 50 ? "micronutrient-alert" : "bariatric-standard", leanMassLossRisk > 40 ? "lean-mass-risk" : "muscle-preserved"], domain: "clinical", weightKg: weight, proteinG: adjustedNeed })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Daily Protein Target", value: `${adjustedNeed} g/day`, status: toStatus(band), description: `${mealTolerance}g × ${mealsNeeded} meals  ·  Malabsorption: ${r2(malabsorptionFactor)}` },
      healthScore: score,
      metrics: [
        { label: "Adjusted Need", value: `${adjustedNeed} g`, status: "good" },
        { label: "Per Meal", value: `${mealTolerance} g`, status: "good" },
        { label: "Meals Needed", value: mealsNeeded, status: "good" },
        { label: "Lean Mass Preservation", value: `${proteinAdequacy}/100`, status: proteinAdequacy >= 70 ? "good" : proteinAdequacy >= 55 ? "warning" : "danger" },
        { label: "Lean Mass Loss Risk", value: `${leanMassLossRisk}%`, status: leanMassLossRisk < 25 ? "good" : leanMassLossRisk < 45 ? "warning" : "danger" },
        { label: "Micronutrient Deficiency Risk", value: `${microDeficiencyRisk}%`, status: microDeficiencyRisk < 30 ? "good" : microDeficiencyRisk < 55 ? "warning" : "danger" },
        { label: "Malabsorption Factor", value: r2(malabsorptionFactor), status: malabsorptionFactor >= 0.9 ? "good" : malabsorptionFactor >= 0.75 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Deficiency Risk Alert", description: `Micronutrient risk: ${microDeficiencyRisk}%. ${surgeryType === "bpd" ? "BPD/DS has highest deficiency risk. Mandatory: B12 (1000mcg/day sublingual), iron (45-60mg/day), calcium citrate (1200-1500mg/day), zinc (8-11mg/day), fat-soluble vitamins A/D/E/K." : surgeryType === "rygb" ? "RYGB bypasses B12/iron absorption sites. Daily B12 1000mcg sublingual + iron + calcium citrate essential lifelong." : "Sleeve gastrectomy has lower malabsorption risk. Standard bariatric vitamin protocol still required."}`, priority: "high", category: "Deficiency" },
        { title: "Protein Adequacy Score", description: `Score: ${proteinAdequacy}/100. Protein-sparing modified fast principle: ${mealTolerance}g per meal in ${mealsNeeded} feedings. Liquid protein (whey isolate/clear protein drinks) best tolerated in early months. Advance textures per dietitian guidance.`, priority: "high", category: "Adequacy" },
        { title: "Lean Mass vs Intake", description: `Lean mass loss risk: ${leanMassLossRisk}%. Rapid weight loss post-surgery increases lean mass loss by 30-40% without adequate protein. Resistance training + ${adjustedNeed}g protein reduces this to <10%. Track body composition (DEXA) at 3, 6, 12 months.`, priority: "medium", category: "Body Composition" },
      ],
      detailedBreakdown: { weight, surgeryType, monthsSinceSurgery, giTolerance, adjustedNeed, mealTolerance, mealsNeeded, malabsorptionFactor, leanMassLossRisk, microDeficiencyRisk, proteinAdequacy, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Protein Adequacy Score", subtitle: "Daily target vs absorption", unit: "g", values: [{ label: "Raw Target", value: minTarget, color: "bg-slate-400" }, { label: "Adjusted Need", value: adjustedNeed, color: "bg-sky-500" }, { label: "Per Meal", value: mealTolerance, color: "bg-emerald-500" }] },
      { title: "Muscle Preservation Index", subtitle: "Lean mass vs intake", values: [{ label: "Preserved", value: proteinAdequacy, color: bandCls(scoreBand(proteinAdequacy)) }, { label: "Loss Risk", value: leanMassLossRisk, color: leanMassLossRisk < 25 ? "bg-emerald-500" : leanMassLossRisk < 45 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Micronutrient Risk", subtitle: "Deficiency probability", values: [{ label: "Deficiency Risk", value: microDeficiencyRisk, color: microDeficiencyRisk < 30 ? "bg-emerald-500" : microDeficiencyRisk < 55 ? "bg-amber-500" : "bg-rose-500" }] },
    ], research: buildResearch("Post-Bariatric Protein Calculator", snap.tags, snap, { adjustedNeed, mealTolerance, mealsNeeded, malabsorptionFactor, leanMassLossRisk, microDeficiencyRisk, proteinAdequacy }) })
  }

  return <ComprehensiveHealthTemplate title="Post-Bariatric Protein Calculator" description="Surgical recovery nutrition engine with malabsorption-adjusted protein target, per-meal tolerance, lean mass preservation index, AI deficiency risk alert, and micronutrient cross-check." toolId="post-bariatric-protein" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Post-Bariatric Protein Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Post-Bariatric Protein Calculator" description="Advanced post-bariatric protein calculator with malabsorption adjustment, lean mass preservation, and deficiency alert." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Current Weight" value={weight} onChange={setWeight} min={40} max={300} suffix="kg" />
      <SelectInput label="Surgery Type" value={surgeryType} onChange={setSurgeryType} options={[{ value: "rygb", label: "Roux-en-Y Gastric Bypass" }, { value: "sleeve", label: "Sleeve Gastrectomy" }, { value: "bpd", label: "BPD/Duodenal Switch" }]} />
      <NumInput label="Months Since Surgery" value={monthsSinceSurgery} onChange={setMonthsSinceSurgery} min={0} max={120} step={1} suffix="months" />
      <SelectInput label="GI Tolerance" value={giTolerance} onChange={setGiTolerance} options={[{ value: "low", label: "Low (dumping/intolerance)" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
    </div>} />
}

/* ═══════════════════════  55. TODDLER CALORIE CALCULATOR  ═══════════════════════ */

export function AdvancedToddlerCalorieCalculator() {
  const [ageMonths, setAgeMonths] = useState(24)
  const [weightKg, setWeightKg] = useState(12)
  const [heightCm, setHeightCm] = useState(87)
  const [activity, setActivity] = useState("moderate")
  const [growthPercentile, setGrowthPercentile] = useState(50)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    // Pediatric safety sandbox — isolated from adult modules
    const ageYears = r1(ageMonths / 12)
    const bmi = r2(weightKg / ((heightCm / 100) ** 2))
    const kcalPerKg = ageMonths <= 12 ? 100 : ageMonths <= 24 ? 90 : 80
    const actMult = activity === "active" ? 1.15 : activity === "moderate" ? 1.0 : 0.9
    const kcalTarget = r0(weightKg * kcalPerKg * actMult)
    const proteinGPerKg = ageMonths <= 12 ? 1.5 : 1.2
    const proteinG = r1(weightKg * proteinGPerKg)
    const expectedWeight50th = ageMonths <= 12 ? ageMonths * 0.6 + 3.3 : ageMonths <= 36 ? 9.5 + (ageMonths - 12) * 0.25 : 12
    const weightDeviation = r2((weightKg - expectedWeight50th) / expectedWeight50th * 100)
    const underfeedingRisk = clamp(r0(kcalTarget < 700 || weightKg < expectedWeight50th * 0.85 ? 55 : weightKg < expectedWeight50th * 0.9 ? 35 : 12), 5, 95)
    const overfeedingRisk = clamp(r0(bmi > 18 ? 55 : bmi > 16 ? 30 : 10), 5, 95)
    const growthVelocity = growthPercentile >= 50 ? "Normal" : growthPercentile >= 15 ? "Below average" : "Concern — consult pediatrician"
    const microAdequacy = clamp(r0(72 + (weightKg > expectedWeight50th * 0.95 ? 10 : -12)), 5, 95)
    const pediatricAlert = underfeedingRisk > 50 || overfeedingRisk > 50

    // SAFETY: Pediatric module is strictly isolated — scores are in pediatric context only
    const score = clamp(r0(pediatricAlert ? 42 : (100 - underfeedingRisk) * 0.3 + (100 - overfeedingRisk) * 0.3 + microAdequacy * 0.2 + 15), 5, 95)
    const band = scoreBand(score, pediatricAlert && underfeedingRisk > 60)
    const note = `Toddler: ${ageYears}yr · ${weightKg}kg · ${heightCm}cm. Target: ${kcalTarget} kcal/day, ${proteinG}g protein/day. ${growthVelocity}. Weight deviation from 50th: ${weightDeviation > 0 ? "+" : ""}${weightDeviation}%. ${pediatricAlert ? "⚠️ Pediatric safety alert — consult pediatrician." : "Growth parameters within normal range."}`

    const snap = mkSnap({ toolId: "toddler-calorie", toolName: "Toddler Calorie Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 4), 0, 100), projection6Month: clamp(r0(score + 7), 0, 100), projection1Year: clamp(r0(score + 10), 0, 100), tags: [pediatricAlert ? "pediatric-alert" : "normal-growth", "pediatric-safety-sandbox"], domain: "pediatric", weightKg, calories: kcalTarget })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Calorie Target", value: `${kcalTarget} kcal/day`, status: toStatus(band), description: `${r0(kcalPerKg * actMult)} kcal/kg · ${proteinG}g protein/day` },
      healthScore: score,
      metrics: [
        { label: "Calorie Target", value: `${kcalTarget} kcal`, status: "good" },
        { label: "Protein Need", value: `${proteinG} g/day`, status: "good" },
        { label: "BMI", value: bmi, status: bmi < 14 ? "danger" : bmi < 18 ? "good" : bmi < 20 ? "warning" : "danger" },
        { label: "Weight vs 50th%", value: `${weightDeviation > 0 ? "+" : ""}${weightDeviation}%`, status: Math.abs(weightDeviation) < 15 ? "good" : Math.abs(weightDeviation) < 25 ? "warning" : "danger" },
        { label: "Underfeeding Risk", value: `${underfeedingRisk}%`, status: underfeedingRisk < 25 ? "good" : underfeedingRisk < 45 ? "warning" : "danger" },
        { label: "Overfeeding Risk", value: `${overfeedingRisk}%`, status: overfeedingRisk < 25 ? "good" : overfeedingRisk < 45 ? "warning" : "danger" },
        { label: "Growth Velocity", value: growthVelocity, status: growthVelocity === "Normal" ? "good" : growthVelocity.includes("Below") ? "warning" : "danger" },
        { label: "Micronutrient Adequacy", value: `${microAdequacy}/100`, status: microAdequacy >= 70 ? "good" : microAdequacy >= 55 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Growth Percentile Tracking", description: `Growth percentile: ${growthPercentile}th. ${growthPercentile < 15 ? "⚠️ Below 15th percentile — pediatrician evaluation for failure to thrive indicated. Extended nutrition assessment recommended." : growthPercentile > 85 ? "Above 85th percentile — monitor for early obesity risk. Assess diet quality and activity." : "Growth is tracking normally. Continue current feeding approach and schedule routine well-child checkups."}`, priority: "high", category: "Pediatric" },
        { title: "Pediatric Safety Alert", description: `⚠️ PEDIATRIC MODULE: This calculator uses age-specific reference data for toddlers (1-3 years). ${pediatricAlert ? "Risk flags detected — this tool provides estimates only. Actual dietary management must be supervised by a pediatric dietitian or pediatrician." : "Values are within expected ranges. Any concerns about growth should be discussed with the child's pediatrician."}`, priority: "high", category: "Safety" },
        { title: "Micronutrient Adequacy Check", description: `Adequacy: ${microAdequacy}/100. Priority nutrients for toddlers: iron (7-10mg/day), calcium (700mg/day), vitamin D (600 IU/day), zinc (3mg/day). Iron deficiency is the most common toddler micronutrient deficiency — affects cognitive development.`, priority: "medium", category: "Micronutrients" },
      ],
      detailedBreakdown: { ageMonths, ageYears, weightKg, heightCm, bmi, activity, growthPercentile, kcalTarget, proteinG, expectedWeight50th: r2(expectedWeight50th), weightDeviation, underfeedingRisk, overfeedingRisk, growthVelocity, microAdequacy, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Calorie Target", subtitle: "Age-adjusted pediatric recommended intake", unit: "kcal", values: [{ label: "Target", value: kcalTarget, color: bandCls(band) }, { label: "Minimum safe", value: r0(kcalTarget * 0.85), color: "bg-amber-500" }] },
      { title: "Growth Curve Overlay", subtitle: "Weight vs 50th percentile", unit: "%", values: [{ label: "Your Child", value: clamp(r0(50 + weightDeviation), 0, 100), color: Math.abs(weightDeviation) < 15 ? "bg-emerald-500" : Math.abs(weightDeviation) < 25 ? "bg-amber-500" : "bg-rose-500" }, { label: "50th Percentile", value: 50, color: "bg-slate-400" }] },
      { title: "Risk Classification", subtitle: "Underfeeding vs overfeeding", values: [{ label: "Underfeeding", value: underfeedingRisk, color: underfeedingRisk < 25 ? "bg-emerald-500" : underfeedingRisk < 45 ? "bg-amber-500" : "bg-rose-500" }, { label: "Overfeeding", value: overfeedingRisk, color: overfeedingRisk < 25 ? "bg-emerald-500" : overfeedingRisk < 45 ? "bg-amber-500" : "bg-rose-500" }] },
    ], research: buildResearch("Toddler Calorie Calculator", snap.tags, snap, { ageMonths, weightKg, heightCm, bmi, kcalTarget, proteinG, weightDeviation, underfeedingRisk, overfeedingRisk, growthVelocity, microAdequacy }) })
  }

  return <ComprehensiveHealthTemplate title="Toddler Calorie Calculator" description="Pediatric growth intelligence with age-specific calorie targets, growth velocity, underfeeding/overfeeding risk, micronutrient adequacy, and AI growth percentile tracking. Strictly isolated from adult modules." toolId="toddler-calorie" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Toddler Calorie Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Toddler Calorie Calculator" description="Advanced toddler calorie calculator with growth curve overlay, risk classification, and micronutrient adequacy." categoryName="Nutrition & Supplements" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={ageMonths} onChange={setAgeMonths} min={12} max={36} step={1} suffix="months" />
      <NumInput label="Weight" value={weightKg} onChange={setWeightKg} min={5} max={25} step={0.1} suffix="kg" />
      <NumInput label="Height" value={heightCm} onChange={setHeightCm} min={50} max={110} step={0.5} suffix="cm" />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "low", label: "Low (mostly sitting)" }, { value: "moderate", label: "Moderate (normal play)" }, { value: "active", label: "Active (very physical)" }]} />
      <NumInput label="Growth Percentile" value={growthPercentile} onChange={setGrowthPercentile} min={1} max={99} step={1} suffix="%" />
    </div>} />
}
