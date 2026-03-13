"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Apple,
  BarChart3,
  Beef,
  Beer,
  Brain,
  Clock3,
  Droplets,
  Download,
  Flame,
  Heart,
  Moon,
  Shield,
  Sparkles,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

/* ═══════════════════════  SHARED LAYER  ═══════════════════════ */

type Status = "good" | "warning" | "danger"
type RiskBand = "Green" | "Yellow" | "Red" | "Purple"

interface GraphDatum { label: string; value: number; color?: string }
interface GraphSpec { title: string; subtitle: string; unit?: string; values: GraphDatum[] }

interface NutritionSnapshotV3 {
  toolId: string; toolName: string; recordedAt: string; healthScore: number
  riskClass: RiskBand; clinicalNote: string
  projection3Month: number; projection1Year: number
  tags: string[]; domain: "cardiometabolic" | "immune" | "recovery" | "performance" | "micronutrient" | "hydration" | "behavioral" | "supplement"
  weightKg?: number; calories?: number; proteinG?: number; carbsG?: number; fatG?: number
}

interface ExtraStateV3 {
  snapshot: NutritionSnapshotV3; graphs: GraphSpec[]; clinicalNote: string; research: Record<string, unknown>
}

const DASHBOARD_KEY = "nutrition-metabolic-dashboard-v1"

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function r0(v: number) { return Math.round(v) }
function r1(v: number) { return Math.round(v * 10) / 10 }
function r2(v: number) { return Math.round(v * 100) / 100 }

function toStatus(b: RiskBand): Status { return b === "Green" ? "good" : b === "Yellow" ? "warning" : "danger" }
function bandCls(b: RiskBand) { return b === "Green" ? "bg-emerald-500" : b === "Yellow" ? "bg-amber-400" : b === "Purple" ? "bg-violet-600" : "bg-rose-500" }
function scoreBand(s: number, purple = false): RiskBand { if (purple) return "Purple"; if (s >= 78) return "Green"; if (s >= 58) return "Yellow"; return "Red" }

function loadSnaps(): NutritionSnapshotV3[] {
  if (typeof window === "undefined") return []
  try { const r = window.localStorage.getItem(DASHBOARD_KEY); return r ? JSON.parse(r) as NutritionSnapshotV3[] : [] } catch { return [] }
}
function saveSnap(s: NutritionSnapshotV3) {
  if (typeof window === "undefined") return
  const e = loadSnaps().filter(x => x.toolId !== s.toolId)
  window.localStorage.setItem(DASHBOARD_KEY, JSON.stringify([s, ...e].slice(0, 40)))
}
function mkSnap(d: Omit<NutritionSnapshotV3, "recordedAt">): NutritionSnapshotV3 { return { ...d, recordedAt: new Date().toISOString() } }

function buildResearch(title: string, tags: string[], snap: NutritionSnapshotV3, data: Record<string, unknown>) {
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
    <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} step={step ?? 0.1} className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50" /></div>)
}
function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (<div className="space-y-1"><label className="text-sm font-medium">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>)
}
function GraphCard({ graph }: { graph: GraphSpec }) {
  const mx = Math.max(...graph.values.map(i => i.value), 1)
  return (<Card><CardHeader className="pb-3"><CardTitle className="text-base">{graph.title}</CardTitle><CardDescription>{graph.subtitle}</CardDescription></CardHeader>
    <CardContent className="space-y-3">{graph.values.map(i => (<div key={i.label} className="space-y-1"><div className="flex items-center justify-between text-sm"><span>{i.label}</span><span className="font-medium">{i.value}{graph.unit ? ` ${graph.unit}` : ""}</span></div>
      <div className="h-2 rounded-full bg-muted"><div className={`h-2 rounded-full ${i.color ?? "bg-sky-500"}`} style={{ width: `${Math.max(6, (i.value / mx) * 100)}%` }} /></div></div>))}</CardContent></Card>)
}

/* ── Dashboard ── */
function Suite3Dashboard({ snap }: { snap: NutritionSnapshotV3 }) {
  const [snaps, setSnaps] = useState<NutritionSnapshotV3[]>([])
  useEffect(() => { setSnaps(loadSnaps()) }, [snap.recordedAt])
  const m = useMemo(() => {
    const l = snaps.length ? snaps : [snap]
    const avg = (items: NutritionSnapshotV3[]) => items.length ? r0(items.reduce((s, i) => s + i.healthScore, 0) / items.length) : 0
    const global = avg(l)
    const behavioral = avg(l.filter(i => i.domain === "behavioral"))
    const supplement = avg(l.filter(i => i.domain === "supplement"))
    const performance = avg(l.filter(i => i.domain === "performance" || i.domain === "recovery"))
    const metabolic = avg(l.filter(i => i.domain === "cardiometabolic" || i.domain === "behavioral"))
    const correlation: string[] = []
    const alc = l.find(i => i.toolId === "alcohol-calorie-calculator")
    const caf = l.find(i => i.toolId === "caffeine-half-life")
    const fast = l.find(i => i.toolId === "eating-window-16-8")
    if (alc && caf) correlation.push("Alcohol vs Caffeine behavioral cross-check active — sleep and recovery impact can be correlated.")
    if (alc && fast) correlation.push("Alcohol vs Fasting window synced — caloric disruption from alcohol modulates fasting efficacy.")
    if (!correlation.length) correlation.push("Run more linked tools to expand cross-calculator intelligence.")
    return { global, behavioral, supplement, performance, metabolic, correlation, p3: clamp(r0(100 - (100 - global) * 0.8), 0, 100), p12: clamp(r0(100 - (100 - global) * 0.66), 0, 100) }
  }, [snap, snaps])
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-950 dark:to-slate-900">
      <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Brain className="h-5 w-5 text-cyan-600" />Central Nutrition Intelligence — Suite 3</CardTitle>
        <CardDescription>Behavioral analytics, supplement stacking safety, metabolic flexibility, and cross-calculator intelligence.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Global Score</div><div className="mt-1 text-2xl font-semibold">{m.global}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Behavioral</div><div className="mt-1 text-2xl font-semibold">{m.behavioral}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Supplement</div><div className="mt-1 text-2xl font-semibold">{m.supplement}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Performance</div><div className="mt-1 text-2xl font-semibold">{m.performance}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Metabolic</div><div className="mt-1 text-2xl font-semibold">{m.metabolic}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">1-Year Trajectory</div><div className="mt-1 text-2xl font-semibold">{m.p12}</div></div>
        </div>
        <div className="rounded-xl border bg-background/80 p-4"><div className="mb-2 text-sm font-medium">Cross-Calculator Intelligence</div>
          <ul className="space-y-2 text-sm text-muted-foreground">{m.correlation.map(c => <li key={c}>{c}</li>)}</ul>
          <div className="mt-3 text-xs text-muted-foreground">3-month projection: {m.p3}/100</div></div>
      </CardContent></Card>)
}

function ResultExtras({ title, extra }: { title: string; extra: ExtraStateV3 }) {
  const rp = buildResearch(title, extra.snapshot.tags, extra.snapshot, extra.research)
  return (<div className="space-y-6">
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-cyan-600" />Risk Visualization & Clinical Export</CardTitle>
      <CardDescription>Meter, graphs, risk code, projection model, research-grade export.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div><div className="mb-2 flex items-center justify-between text-sm"><span>Risk</span><span className="font-medium">{extra.snapshot.riskClass}</span></div>
          <div className="h-3 rounded-full bg-muted"><div className={`h-3 rounded-full ${bandCls(extra.snapshot.riskClass)}`} style={{ width: `${Math.max(8, extra.snapshot.healthScore)}%` }} /></div>
          <div className="mt-2 text-sm text-muted-foreground">3-month {extra.snapshot.projection3Month}/100 · 1-year {extra.snapshot.projection1Year}/100</div></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{extra.graphs.map(g => <GraphCard key={g.title} graph={g} />)}</div>
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground"><div className="mb-1 font-medium text-foreground">Clinical Note</div>{extra.clinicalNote}</div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => exportJson(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-research.json`, rp)}><Download className="mr-2 h-4 w-4" />Research JSON</Button>
          <Button type="button" variant="outline" onClick={() => exportCsv(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-research.csv`, { ...extra.research, riskClass: extra.snapshot.riskClass, score: extra.snapshot.healthScore })}><Download className="mr-2 h-4 w-4" />CSV Export</Button>
        </div></CardContent></Card>
    <Suite3Dashboard snap={extra.snapshot} /></div>)
}

function useExtra() { return useState<ExtraStateV3 | null>(null) }

/* ═══════════════════════  35. ALCOHOL CALORIE CALCULATOR  ═══════════════════════ */

export function AdvancedAlcoholCalorieCalculator() {
  const [drinkType, setDrinkType] = useState("beer")
  const [volume, setVolume] = useState(500)
  const [abv, setAbv] = useState(5)
  const [frequency, setFrequency] = useState(4)
  const [weight, setWeight] = useState(78)
  const [alt, setAlt] = useState(28)
  const [ast, setAst] = useState(24)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const alcoholGrams = r1(volume * (abv / 100) * 0.789)
    const alcoholCal = r0(alcoholGrams * 7)
    const mixerCal = drinkType === "beer" ? r0(volume * 0.38) : drinkType === "wine" ? r0(volume * 0.12) : r0(volume * 0.05)
    const totalDrinkCal = alcoholCal + mixerCal
    const weeklyLoad = r0(totalDrinkCal * frequency)
    const fatOxSuppression = clamp(r0(alcoholGrams * 0.73 + frequency * 4), 0, 100)
    const weightGainProb = clamp(r0(weeklyLoad / 70 + fatOxSuppression * 0.2), 0, 100)
    const sleepDisruption = clamp(r0(alcoholGrams * 0.45 + (frequency > 4 ? 18 : 6)), 0, 100)
    const nafldRisk = clamp(r0((alt > 40 ? 28 : alt > 30 ? 14 : 4) + (ast > 40 ? 22 : ast > 30 ? 10 : 4) + weeklyLoad * 0.008 + (frequency > 5 ? 16 : 4)), 0, 100)
    const testosteroneSuppression = clamp(r0(alcoholGrams * 0.35 + (frequency > 5 ? 14 : 4)), 0, 100)
    const recoveryImpairment = clamp(r0(fatOxSuppression * 0.5 + sleepDisruption * 0.35), 0, 100)
    const bingeRisk = clamp(r0((alcoholGrams > 60 ? 35 : alcoholGrams > 40 ? 20 : 6) + (frequency > 5 ? 18 : 4)), 0, 100)
    const liverStress6m = clamp(r0(nafldRisk * 0.7 + weeklyLoad * 0.004), 0, 100)
    const hormonalDisruption = clamp(r0(testosteroneSuppression * 0.6 + sleepDisruption * 0.3), 0, 100)
    const score = clamp(r0(100 - nafldRisk * 0.3 - fatOxSuppression * 0.2 - sleepDisruption * 0.15 - weightGainProb * 0.1), 5, 95)
    const purple = nafldRisk > 65 || (alt > 55 && ast > 55)
    const band = scoreBand(score, purple)
    const note = `Alcohol contributes ${weeklyLoad} kcal/week of hidden calories. ${purple ? "Liver enzyme pattern warrants hepatology screening." : nafldRisk > 40 ? "Moderate liver stress detected — consider reducing frequency." : "Current intake pattern is within manageable range."}`

    const snap = mkSnap({ toolId: "alcohol-calorie-calculator", toolName: "Alcohol Calorie Calculator", healthScore: purple ? Math.min(score, 38) : score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [purple ? "clinical-supervision" : "behavioral-risk", nafldRisk > 40 ? "liver-stress" : "calorie-awareness"], domain: "behavioral", weightKg: weight, calories: weeklyLoad })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Weekly Alcohol Calories", value: `${weeklyLoad} kcal`, status: toStatus(band), description: `${alcoholGrams} g alcohol per drink × ${frequency}/week` },
      healthScore: snap.healthScore,
      metrics: [
        { label: "Per Drink Calories", value: totalDrinkCal, unit: "kcal", status: totalDrinkCal < 150 ? "good" : totalDrinkCal < 300 ? "warning" : "danger" },
        { label: "Alcohol Grams", value: alcoholGrams, unit: "g", status: alcoholGrams < 20 ? "good" : alcoholGrams < 40 ? "warning" : "danger" },
        { label: "Fat Oxidation Suppression", value: `${fatOxSuppression}%`, status: fatOxSuppression < 30 ? "good" : fatOxSuppression < 55 ? "warning" : "danger" },
        { label: "Weight Gain Probability", value: `${weightGainProb}%`, status: weightGainProb < 30 ? "good" : weightGainProb < 55 ? "warning" : "danger" },
        { label: "Sleep Disruption Index", value: `${sleepDisruption}%`, status: sleepDisruption < 30 ? "good" : sleepDisruption < 55 ? "warning" : "danger" },
        { label: "NAFLD Risk Score", value: `${nafldRisk}%`, status: nafldRisk < 25 ? "good" : nafldRisk < 50 ? "warning" : "danger" },
        { label: "Testosterone Suppression", value: `${testosteroneSuppression}%`, status: testosteroneSuppression < 25 ? "good" : testosteroneSuppression < 50 ? "warning" : "danger" },
        { label: "Recovery Impairment", value: `${recoveryImpairment}%`, status: recoveryImpairment < 30 ? "good" : recoveryImpairment < 55 ? "warning" : "danger" },
        { label: "Binge Risk Detection", value: `${bingeRisk}%`, status: bingeRisk < 25 ? "good" : bingeRisk < 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Binge-Risk Detection", description: `Binge risk score: ${bingeRisk}%. ${bingeRisk > 50 ? "Pattern suggests binge-level intake. Single session >60 g alcohol significantly impairs hepatic recovery." : "Current per-session intake is within moderate bounds."}`, priority: "high", category: "Behavioral" },
        { title: "Liver Stress Projection", description: `6-month liver stress: ${liverStress6m}%. ${liverStress6m > 40 ? "Elevated ALT/AST combined with weekly load warrants periodic liver function monitoring." : "Liver enzyme profile does not currently flag concern."}`, priority: "high", category: "Hepatology" },
        { title: "Hormonal Disruption", description: `Disruption index: ${hormonalDisruption}%. Alcohol suppresses testosterone and disrupts sleep architecture, compounding recovery impairment.`, priority: "medium", category: "Hormonal" },
      ],
      detailedBreakdown: { drinkType, volume, abv, frequency, weight, alt, ast, alcoholGrams, alcoholCal, totalDrinkCal, weeklyLoad, fatOxSuppression, weightGainProb, sleepDisruption, nafldRisk, testosteroneSuppression, recoveryImpairment, bingeRisk, liverStress6m, hormonalDisruption, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Calorie Meter", subtitle: "Per drink & weekly load", unit: "kcal", values: [{ label: "Per Drink", value: totalDrinkCal, color: "bg-amber-500" }, { label: "Weekly", value: weeklyLoad, color: "bg-rose-500" }] },
      { title: "Weekly Impact", subtitle: "Metabolic disruption factors", values: [{ label: "Fat Ox Suppression", value: fatOxSuppression, color: bandCls(scoreBand(100 - fatOxSuppression)) }, { label: "Sleep Disruption", value: sleepDisruption, color: bandCls(scoreBand(100 - sleepDisruption)) }] },
      { title: "Liver Risk Indicator", subtitle: "NAFLD and enzyme stress", values: [{ label: "NAFLD Risk", value: nafldRisk, color: nafldRisk < 25 ? "bg-emerald-500" : nafldRisk < 50 ? "bg-amber-500" : "bg-rose-500" }, { label: "6M Projection", value: liverStress6m, color: liverStress6m < 30 ? "bg-emerald-500" : "bg-amber-500" }] },
    ], research: buildResearch("Alcohol Calorie Calculator", snap.tags, snap, { alcoholGrams, totalDrinkCal, weeklyLoad, fatOxSuppression, weightGainProb, sleepDisruption, nafldRisk, testosteroneSuppression, recoveryImpairment, bingeRisk, liverStress6m, hormonalDisruption }) })
  }

  return <ComprehensiveHealthTemplate title="Alcohol Calorie Calculator" description="Metabolic disruption analyzer with hidden calorie quantification, fat oxidation suppression, NAFLD risk, hormonal disruption index, and liver stress projection." toolId="alcohol-calorie-calculator" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Alcohol Calorie Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Alcohol Calorie Calculator" description="Advanced alcohol calorie calculator with metabolic disruption, liver risk, and hormonal impact analysis." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectInput label="Drink Type" value={drinkType} onChange={setDrinkType} options={[{ value: "beer", label: "Beer" }, { value: "wine", label: "Wine" }, { value: "spirits", label: "Spirits" }]} />
      <NumInput label="Volume" value={volume} onChange={setVolume} min={30} max={2000} step={10} suffix="mL" />
      <NumInput label="Alcohol %" value={abv} onChange={setAbv} min={1} max={70} step={0.5} suffix="ABV" />
      <NumInput label="Frequency" value={frequency} onChange={setFrequency} min={0} max={14} step={1} suffix="per week" />
      <NumInput label="Body Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <NumInput label="ALT (optional)" value={alt} onChange={setAlt} min={5} max={200} suffix="U/L" />
      <NumInput label="AST (optional)" value={ast} onChange={setAst} min={5} max={200} suffix="U/L" />
    </div>} />
}

/* ═══════════════════════  36. 16:8 FASTING CALCULATOR  ═══════════════════════ */

export function AdvancedEatingWindow168Calculator() {
  const [sleepTime, setSleepTime] = useState(23)
  const [wakeTime, setWakeTime] = useState(7)
  const [workStart, setWorkStart] = useState(9)
  const [workEnd, setWorkEnd] = useState(18)
  const [goal, setGoal] = useState("fatLoss")
  const [glucose, setGlucose] = useState(95)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const fastStart = r0((sleepTime - 4 + 24) % 24)
    const eatStart = (fastStart + 16) % 24
    const eatEnd = (eatStart + 8) % 24
    const insulinExposure = r1(8 * 1.4)
    const fatOxWindow = r1(Math.max(0, 16 - 12) * 1.2)
    const autophagyProb = clamp(r0(30 + (16 - 12) * 12 + (goal === "fatLoss" ? 8 : 0)), 5, 95)
    const glucoseStabilization = clamp(r0(72 - Math.max(0, glucose - 100) * 1.5 + (goal === "fatLoss" ? 6 : 0)), 5, 95)
    const cortisolAlignment = clamp(r0(80 - Math.abs(eatStart - (wakeTime + 1)) * 5 - Math.abs(eatEnd - (sleepTime - 3 + 24) % 24) * 4), 5, 95)
    const adherenceProjection = clamp(r0(cortisolAlignment * 0.5 + glucoseStabilization * 0.3 + 15), 5, 95)
    const weightProjection = goal === "fatLoss" ? clamp(r1(0.3 * (adherenceProjection / 100) * 4), 0, 4) : 0
    const score = clamp(r0(cortisolAlignment * 0.35 + glucoseStabilization * 0.3 + autophagyProb * 0.2 + 10), 5, 95)
    const band = scoreBand(score)
    const note = `Optimal eating window: ${eatStart}:00 – ${eatEnd}:00. Fasting starts ${fastStart}:00. ${cortisolAlignment >= 70 ? "Circadian alignment is strong." : "Consider adjusting window to better match your cortisol rhythm."}`

    const snap = mkSnap({ toolId: "eating-window-16-8", toolName: "16:8 Fasting Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 6), 0, 100), projection1Year: clamp(r0(score + 10), 0, 100), tags: [goal === "fatLoss" ? "fat-oxidation" : "metabolic-flexibility", cortisolAlignment >= 70 ? "circadian-aligned" : "timing-risk"], domain: "behavioral" })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Eating Window", value: `${eatStart}:00 – ${eatEnd}:00`, status: toStatus(band), description: `16h fast · ${insulinExposure}h insulin exposure` },
      healthScore: score,
      metrics: [
        { label: "Fasting Start", value: `${fastStart}:00`, status: "good" },
        { label: "Eat Window", value: `${eatStart}:00–${eatEnd}:00`, status: toStatus(band) },
        { label: "Insulin Exposure", value: `${insulinExposure} hrs`, status: insulinExposure <= 12 ? "good" : "warning" },
        { label: "Fat Oxidation Window", value: `${fatOxWindow} hrs`, status: fatOxWindow >= 3 ? "good" : "warning" },
        { label: "Autophagy Probability", value: `${autophagyProb}%`, status: autophagyProb >= 60 ? "good" : autophagyProb >= 40 ? "warning" : "danger" },
        { label: "Glucose Stabilization", value: `${glucoseStabilization}/100`, status: glucoseStabilization >= 65 ? "good" : glucoseStabilization >= 50 ? "warning" : "danger" },
        { label: "Cortisol Alignment", value: `${cortisolAlignment}/100`, status: cortisolAlignment >= 70 ? "good" : cortisolAlignment >= 50 ? "warning" : "danger" },
        { label: "Adherence Projection", value: `${adherenceProjection}/100`, status: adherenceProjection >= 65 ? "good" : adherenceProjection >= 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Glucose Stabilization", description: `Glucose stabilization score: ${glucoseStabilization}/100. ${glucose > 100 ? "Fasting glucose is elevated — the 16:8 pattern can improve insulin sensitivity by 15-20% over 8 weeks." : "Fasting glucose is normal — maintaining this window preserves metabolic health."}`, priority: "high", category: "Glucose" },
        { title: "Cortisol Rhythm Alignment", description: `Alignment: ${cortisolAlignment}/100. Eating window should start 1-2 hrs after waking and end 3+ hrs before sleep for optimal circadian synchronization.`, priority: "high", category: "Circadian" },
        { title: "Weight Trend Projection", description: `At current adherence, estimated ${weightProjection} kg fat loss over 4 weeks. This depends on maintaining caloric deficit within the eating window.`, priority: "medium", category: "Weight" },
      ],
      detailedBreakdown: { sleepTime, wakeTime, workStart, workEnd, goal, glucose, fastStart, eatStart, eatEnd, insulinExposure, fatOxWindow, autophagyProb, glucoseStabilization, cortisolAlignment, adherenceProjection, weightProjection, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Timeline Visualization", subtitle: "Fasting and eating phases", unit: "hrs", values: [{ label: "Fast Phase", value: 16, color: "bg-violet-500" }, { label: "Eat Phase", value: 8, color: "bg-emerald-500" }] },
      { title: "Fat Burn Phase", subtitle: "Oxidation and autophagy", values: [{ label: "Fat Ox Window", value: fatOxWindow, color: "bg-amber-500" }, { label: "Autophagy", value: autophagyProb, color: bandCls(scoreBand(autophagyProb)) }] },
      { title: "Adherence Score", subtitle: "Projected consistency", values: [{ label: "Adherence", value: adherenceProjection, color: bandCls(scoreBand(adherenceProjection)) }, { label: "Cortisol Fit", value: cortisolAlignment, color: bandCls(scoreBand(cortisolAlignment)) }] },
    ], research: buildResearch("16:8 Fasting Calculator", snap.tags, snap, { fastStart, eatStart, eatEnd, insulinExposure, fatOxWindow, autophagyProb, glucoseStabilization, cortisolAlignment, adherenceProjection }) })
  }

  return <ComprehensiveHealthTemplate title="16:8 Fasting Calculator" description="Time-restricted feeding optimizer with circadian-aligned eating window, autophagy probability, glucose stabilization, and cortisol rhythm alignment." toolId="eating-window-16-8" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="16:8 Fasting Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="16:8 Fasting Calculator" description="Advanced 16:8 intermittent fasting calculator with circadian alignment, autophagy, and glucose stabilization." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Sleep Time" value={sleepTime} onChange={setSleepTime} min={20} max={26} step={1} suffix="24h clock" />
      <NumInput label="Wake Time" value={wakeTime} onChange={setWakeTime} min={4} max={12} step={1} suffix="24h clock" />
      <NumInput label="Work Start" value={workStart} onChange={setWorkStart} min={5} max={14} step={1} suffix="24h clock" />
      <NumInput label="Work End" value={workEnd} onChange={setWorkEnd} min={14} max={23} step={1} suffix="24h clock" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscle", label: "Muscle Gain" }]} />
      <NumInput label="Fasting Glucose (optional)" value={glucose} onChange={setGlucose} min={60} max={250} suffix="mg/dL" />
    </div>} />
}

/* ═══════════════════════  37. CARB CYCLING PLANNER  ═══════════════════════ */

export function AdvancedCarbCyclingPlanner() {
  const [weight, setWeight] = useState(78)
  const [bodyFat, setBodyFat] = useState(18)
  const [trainingDays, setTrainingDays] = useState(4)
  const [goal, setGoal] = useState("fatLoss")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const lbm = r1(weight * (1 - bodyFat / 100))
    const highCarbG = r0(lbm * (goal === "muscle" ? 4.5 : goal === "fatLoss" ? 3 : 3.5))
    const lowCarbG = r0(lbm * (goal === "fatLoss" ? 0.8 : 1.2))
    const restDays = 7 - trainingDays
    const weeklyAvg = r0((highCarbG * trainingDays + lowCarbG * restDays) / 7)
    const glycogenDepletion = clamp(r0((7 - trainingDays) * 12 + (lowCarbG < 80 ? 18 : 6)), 5, 95)
    const insulinSensitivity = clamp(r0(55 + glycogenDepletion * 0.35 - (weeklyAvg > 350 ? 12 : 0)), 5, 95)
    const fatAdaptation = clamp(r0(insulinSensitivity * 0.5 + glycogenDepletion * 0.35), 5, 95)
    const hormonalBalance = clamp(r0(75 - Math.abs(trainingDays - 4) * 6 + (goal === "muscle" ? 8 : 0)), 5, 95)
    const metabolicFlexibility = clamp(r0((insulinSensitivity + fatAdaptation) / 2), 5, 95)
    const score = clamp(r0(metabolicFlexibility * 0.4 + hormonalBalance * 0.3 + insulinSensitivity * 0.2 + 8), 5, 95)
    const band = scoreBand(score)
    const note = `Carb cycling: ${highCarbG}g on ${trainingDays} training days, ${lowCarbG}g on ${restDays} rest days. Weekly average ${weeklyAvg}g. ${metabolicFlexibility >= 70 ? "Metabolic flexibility is strong." : "Increase low-carb day adherence to improve fat adaptation."}`

    const snap = mkSnap({ toolId: "carb-cycling-planner", toolName: "Carb Cycling Planner", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 6), 0, 100), projection1Year: clamp(r0(score + 9), 0, 100), tags: [goal === "fatLoss" ? "fat-adaptation" : "glycogen-loading", metabolicFlexibility >= 70 ? "metabolic-flex" : "plateau-break"], domain: "performance", weightKg: weight, carbsG: weeklyAvg })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Weekly Carb Average", value: `${weeklyAvg} g/day`, status: toStatus(band), description: `High ${highCarbG}g · Low ${lowCarbG}g` },
      healthScore: score,
      metrics: [
        { label: "High Carb Day", value: `${highCarbG} g`, status: "good" },
        { label: "Low Carb Day", value: `${lowCarbG} g`, status: "good" },
        { label: "Weekly Average", value: `${weeklyAvg} g`, status: "good" },
        { label: "Glycogen Depletion", value: `${glycogenDepletion}/100`, status: glycogenDepletion >= 50 ? "good" : "warning" },
        { label: "Insulin Sensitivity", value: `${insulinSensitivity}/100`, status: insulinSensitivity >= 65 ? "good" : insulinSensitivity >= 50 ? "warning" : "danger" },
        { label: "Fat Adaptation", value: `${fatAdaptation}/100`, status: fatAdaptation >= 60 ? "good" : fatAdaptation >= 45 ? "warning" : "danger" },
        { label: "Metabolic Flexibility", value: `${metabolicFlexibility}/100`, status: metabolicFlexibility >= 65 ? "good" : metabolicFlexibility >= 50 ? "warning" : "danger" },
        { label: "Hormonal Balance", value: `${hormonalBalance}/100`, status: hormonalBalance >= 65 ? "good" : hormonalBalance >= 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Weekly Schedule", description: `Train days (${trainingDays}x): ${highCarbG}g carbs centered around workouts. Rest days (${restDays}x): ${lowCarbG}g carbs with higher fat intake. This rotation prevents metabolic adaptation.`, priority: "high", category: "Schedule" },
        { title: "Plateau Break Strategy", description: `Metabolic flexibility: ${metabolicFlexibility}/100. Cycling carbs prevents the metabolic slowdown that occurs with persistent low-carb dieting. Re-feed days restore leptin and thyroid function.`, priority: "high", category: "Strategy" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, bodyFat, trainingDays, goal, lbm, highCarbG, lowCarbG, weeklyAvg, glycogenDepletion, insulinSensitivity, fatAdaptation, hormonalBalance, metabolicFlexibility, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Weekly Carb Calendar", subtitle: "High vs low carb days", unit: "g", values: [{ label: "High Day", value: highCarbG, color: "bg-sky-500" }, { label: "Low Day", value: lowCarbG, color: "bg-amber-500" }, { label: "Average", value: weeklyAvg, color: "bg-slate-500" }] },
      { title: "Metabolic Flexibility", subtitle: "Adaptation scores", values: [{ label: "Flexibility", value: metabolicFlexibility, color: bandCls(scoreBand(metabolicFlexibility)) }, { label: "Fat Adaptation", value: fatAdaptation, color: bandCls(scoreBand(fatAdaptation)) }] },
      { title: "Hormonal Response", subtitle: "Balance and insulin", values: [{ label: "Hormonal", value: hormonalBalance, color: bandCls(scoreBand(hormonalBalance)) }, { label: "Insulin Sensitivity", value: insulinSensitivity, color: bandCls(scoreBand(insulinSensitivity)) }] },
    ], research: buildResearch("Carb Cycling Planner", snap.tags, snap, { highCarbG, lowCarbG, weeklyAvg, glycogenDepletion, insulinSensitivity, fatAdaptation, metabolicFlexibility, hormonalBalance }) })
  }

  return <ComprehensiveHealthTemplate title="Carb Cycling Planner" description="Metabolic flexibility engine with AI weekly schedule, glycogen depletion index, insulin sensitivity prediction, fat adaptation score, and plateau break strategy." toolId="carb-cycling-planner" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Carb Cycling Planner" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Carb Cycling Planner" description="Advanced carb cycling planner with metabolic flexibility, insulin sensitivity, and hormonal balance scoring." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Body Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <NumInput label="Body Fat" value={bodyFat} onChange={setBodyFat} min={5} max={50} step={0.5} suffix="%" />
      <NumInput label="Training Days" value={trainingDays} onChange={setTrainingDays} min={2} max={7} step={1} suffix="/week" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "muscle", label: "Muscle Gain" }, { value: "maintenance", label: "Maintenance" }]} />
    </div>} />
}

/* ═══════════════════════  38. PALEO MACRO CALCULATOR  ═══════════════════════ */

export function AdvancedPaleoMacroCalculator() {
  const [weight, setWeight] = useState(75)
  const [activity, setActivity] = useState("moderate")
  const [goal, setGoal] = useState("maintenance")
  const [carbTolerance, setCarbTolerance] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const actMult = activity === "sedentary" ? 1.2 : activity === "moderate" ? 1.55 : 1.8
    const goalMult = goal === "fatLoss" ? 0.85 : goal === "muscle" ? 1.1 : 1.0
    const tdee = r0(weight * 22 * actMult * goalMult)
    const proteinG = r0(weight * (goal === "muscle" ? 2.2 : 1.8))
    const carbFrac = carbTolerance === "low" ? 0.15 : carbTolerance === "moderate" ? 0.25 : 0.35
    const carbG = r0(tdee * carbFrac / 4)
    const proteinCal = proteinG * 4
    const carbCal = carbG * 4
    const fatCal = Math.max(0, tdee - proteinCal - carbCal)
    const fatG = r0(fatCal / 9)
    const nutrientDensity = clamp(r0(72 + (carbTolerance === "low" ? 8 : 0) - (goal === "muscle" ? 4 : 0)), 5, 95)
    const inflammationScore = clamp(r0(100 - nutrientDensity * 0.6 - (activity === "active" ? 8 : 0)), 5, 95)
    const gutHealth = clamp(r0(nutrientDensity * 0.6 + (carbTolerance === "moderate" ? 12 : 6)), 5, 95)
    const score = clamp(r0(nutrientDensity * 0.35 + gutHealth * 0.3 + (100 - inflammationScore) * 0.25 + 8), 5, 95)
    const band = scoreBand(score)
    const note = `Paleo macros: ${proteinG}g protein, ${fatG}g healthy fats, ${carbG}g whole-food carbs on ${tdee} kcal/day. ${nutrientDensity >= 75 ? "Nutrient density is excellent." : "Increase vegetable and organ meat variety for better density."}`

    const snap = mkSnap({ toolId: "paleo-macro-calculator", toolName: "Paleo Macro Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [inflammationScore < 35 ? "anti-inflammatory" : "nutrient-density", "ancestral-diet"], domain: "performance", weightKg: weight, proteinG, carbsG: carbG, fatG, calories: tdee })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Paleo TDEE", value: `${tdee} kcal`, status: toStatus(band), description: `P${proteinG}g · F${fatG}g · C${carbG}g` },
      healthScore: score,
      metrics: [
        { label: "Protein", value: `${proteinG} g`, status: "good" },
        { label: "Healthy Fats", value: `${fatG} g`, status: "good" },
        { label: "Whole-Food Carbs", value: `${carbG} g`, status: "good" },
        { label: "Nutrient Density", value: `${nutrientDensity}/100`, status: nutrientDensity >= 70 ? "good" : nutrientDensity >= 55 ? "warning" : "danger" },
        { label: "Inflammation Score", value: `${inflammationScore}%`, status: inflammationScore < 30 ? "good" : inflammationScore < 55 ? "warning" : "danger" },
        { label: "Gut Health Score", value: `${gutHealth}/100`, status: gutHealth >= 65 ? "good" : gutHealth >= 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Food Substitution", description: `Replace grains with sweet potato/squash. Use coconut or avocado oil instead of seed oils. Prioritize grass-fed meats and wild-caught fish for optimal omega-3:6 ratio.`, priority: "high", category: "Substitution" },
        { title: "Inflammation Control", description: `Score: ${inflammationScore}%. Remove dairy, grains, legumes, and processed sugar. Autoimmune protocol (AIP) variant may further reduce inflammation if baseline score stays elevated.`, priority: "high", category: "Inflammation" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, activity, goal, carbTolerance, tdee, proteinG, fatG, carbG, nutrientDensity, inflammationScore, gutHealth, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Macro Pie", subtitle: "Protein, fat, carbs", unit: "g", values: [{ label: "Protein", value: proteinG, color: "bg-sky-500" }, { label: "Fat", value: fatG, color: "bg-amber-500" }, { label: "Carbs", value: carbG, color: "bg-emerald-500" }] },
      { title: "Inflammation Risk", subtitle: "Lower is better", values: [{ label: "Inflammation", value: inflammationScore, color: inflammationScore < 30 ? "bg-emerald-500" : inflammationScore < 55 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Gut & Nutrient Density", subtitle: "Quality markers", values: [{ label: "Gut Health", value: gutHealth, color: bandCls(scoreBand(gutHealth)) }, { label: "Density", value: nutrientDensity, color: bandCls(scoreBand(nutrientDensity)) }] },
    ], research: buildResearch("Paleo Macro Calculator", snap.tags, snap, { tdee, proteinG, fatG, carbG, nutrientDensity, inflammationScore, gutHealth }) })
  }

  return <ComprehensiveHealthTemplate title="Paleo Macro Calculator" description="Ancestral diet model with modern metabolic alignment, nutrient density comparison, inflammation score, gut health estimate, and AI food substitution." toolId="paleo-macro-calculator" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Paleo Macro Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Paleo Macro Calculator" description="Advanced paleo macro calculator with inflammation score, gut health, and nutrient density analysis." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }]} />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscle", label: "Muscle Gain" }]} />
      <SelectInput label="Carb Tolerance" value={carbTolerance} onChange={setCarbTolerance} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
    </div>} />
}

/* ═══════════════════════  39. VEGAN PROTEIN CALCULATOR  ═══════════════════════ */

export function AdvancedVeganProteinCalculator() {
  const [weight, setWeight] = useState(72)
  const [activity, setActivity] = useState("moderate")
  const [trainingFreq, setTrainingFreq] = useState(4)
  const [legumeSoy, setLegumeSoy] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const proteinNeed = r0(weight * (activity === "active" ? 2.0 : activity === "moderate" ? 1.6 : 1.2))
    const diaas = legumeSoy === "high" ? 0.91 : legumeSoy === "moderate" ? 0.82 : 0.72
    const effectiveProtein = r0(proteinNeed * diaas)
    const leucineThreshold = r1(effectiveProtein / (proteinNeed / weight) * 0.07)
    const eaaAdequacy = clamp(r0(diaas * 95 + (legumeSoy === "high" ? 6 : 0)), 5, 100)
    const muscleSynthesisProb = clamp(r0(eaaAdequacy * 0.55 + (trainingFreq >= 4 ? 18 : 8) + (leucineThreshold >= 2.5 ? 12 : 0)), 5, 95)
    const complementPairing = legumeSoy === "high" ? "Rice + Beans, Tofu + Quinoa" : legumeSoy === "moderate" ? "Lentils + Rice, Hummus + Pita" : "Combine 3+ plant sources per meal"
    const ironCrossCheck = clamp(r0(legumeSoy === "high" ? 72 : legumeSoy === "moderate" ? 58 : 42), 5, 95)
    const b12CrossCheck = clamp(r0(25 + (legumeSoy === "high" ? 8 : 0)), 5, 95)
    const leanMassTrend = clamp(r0(muscleSynthesisProb * 0.6 + eaaAdequacy * 0.25), 5, 95)
    const score = clamp(r0(muscleSynthesisProb * 0.35 + eaaAdequacy * 0.3 + ironCrossCheck * 0.15 + 12), 5, 95)
    const band = scoreBand(score)
    const note = `Vegan protein need: ${proteinNeed}g, effective after DIAAS correction: ${effectiveProtein}g. ${muscleSynthesisProb >= 65 ? "Muscle synthesis probability is favorable." : "Increase complementary protein pairing and leucine-rich foods."}`

    const snap = mkSnap({ toolId: "vegan-protein-calculator", toolName: "Vegan Protein Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [eaaAdequacy < 75 ? "amino-acid-gap" : "plant-muscle", "vegan-nutrition"], domain: "recovery", weightKg: weight, proteinG: effectiveProtein })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Protein Need", value: `${proteinNeed} g/day`, status: toStatus(band), description: `DIAAS-corrected: ${effectiveProtein}g effective` },
      healthScore: score,
      metrics: [
        { label: "Raw Need", value: `${proteinNeed} g`, status: "good" },
        { label: "DIAAS Factor", value: `${r2(diaas)}`, status: diaas >= 0.85 ? "good" : diaas >= 0.75 ? "warning" : "danger" },
        { label: "Effective Protein", value: `${effectiveProtein} g`, status: effectiveProtein >= proteinNeed * 0.85 ? "good" : "warning" },
        { label: "Leucine Threshold", value: `${leucineThreshold} g/meal`, status: leucineThreshold >= 2.5 ? "good" : "warning" },
        { label: "EAA Adequacy", value: `${eaaAdequacy}%`, status: eaaAdequacy >= 80 ? "good" : eaaAdequacy >= 65 ? "warning" : "danger" },
        { label: "Muscle Synthesis", value: `${muscleSynthesisProb}%`, status: muscleSynthesisProb >= 65 ? "good" : muscleSynthesisProb >= 50 ? "warning" : "danger" },
        { label: "Iron Status", value: `${ironCrossCheck}/100`, status: ironCrossCheck >= 60 ? "good" : ironCrossCheck >= 45 ? "warning" : "danger" },
        { label: "B12 Cross-Check", value: `${b12CrossCheck}/100`, status: b12CrossCheck >= 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Complementary Pairing", description: `Best combinations: ${complementPairing}. These pairings complete the amino acid profile and raise effective DIAAS closer to animal-protein equivalence.`, priority: "high", category: "Pairing" },
        { title: "Iron + B12 Alert", description: `Iron: ${ironCrossCheck}/100, B12: ${b12CrossCheck}/100. Vegans must supplement B12 and pair iron-rich foods with vitamin C. Consider fortified nutritional yeast and algae-based omega-3.`, priority: "high", category: "Micronutrient" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, activity, trainingFreq, legumeSoy, proteinNeed, diaas, effectiveProtein, leucineThreshold, eaaAdequacy, muscleSynthesisProb, ironCrossCheck, b12CrossCheck, leanMassTrend, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Protein Adequacy", subtitle: "Raw vs effective", unit: "g", values: [{ label: "Raw Need", value: proteinNeed, color: "bg-slate-500" }, { label: "Effective", value: effectiveProtein, color: "bg-sky-500" }] },
      { title: "Amino Acid Radar", subtitle: "Quality markers", values: [{ label: "EAA", value: eaaAdequacy, color: bandCls(scoreBand(eaaAdequacy)) }, { label: "Leucine", value: r0(leucineThreshold * 20), color: leucineThreshold >= 2.5 ? "bg-emerald-500" : "bg-amber-500" }, { label: "MPS", value: muscleSynthesisProb, color: bandCls(scoreBand(muscleSynthesisProb)) }] },
      { title: "Lean Mass Trend", subtitle: "Growth projection", values: [{ label: "Trend", value: leanMassTrend, color: bandCls(scoreBand(leanMassTrend)) }] },
    ], research: buildResearch("Vegan Protein Calculator", snap.tags, snap, { proteinNeed, diaas, effectiveProtein, leucineThreshold, eaaAdequacy, muscleSynthesisProb, ironCrossCheck, b12CrossCheck, leanMassTrend }) })
  }

  return <ComprehensiveHealthTemplate title="Vegan Protein Calculator" description="Plant-based muscle optimizer with DIAAS correction, amino acid adequacy, leucine threshold, AI complementary protein pairing, and iron/B12 cross-check." toolId="vegan-protein-calculator" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Vegan Protein Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Vegan Protein Calculator" description="Advanced vegan protein calculator with DIAAS correction, amino acid radar, and muscle synthesis probability." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Activity" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }]} />
      <NumInput label="Training Frequency" value={trainingFreq} onChange={setTrainingFreq} min={0} max={7} step={1} suffix="/week" />
      <SelectInput label="Legume/Soy Intake" value={legumeSoy} onChange={setLegumeSoy} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (daily soy/legumes)" }]} />
    </div>} />
}

/* ═══════════════════════  40. NUTRIENT DENSITY SCORE  ═══════════════════════ */

export function AdvancedNutrientDensityScore() {
  const [foodLogQuality, setFoodLogQuality] = useState(65)
  const [totalCalories, setTotalCalories] = useState(2200)
  const [micronutrientCoverage, setMicronutrientCoverage] = useState(68)
  const [processedFoodPct, setProcessedFoodPct] = useState(28)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const per100kcal = r1(micronutrientCoverage / (totalCalories / 100))
    const nutrientScore = clamp(r0(per100kcal * 18 + foodLogQuality * 0.35), 5, 100)
    const microAdequacy = clamp(r0(micronutrientCoverage), 5, 100)
    const antiInflammatory = clamp(r0(nutrientScore * 0.6 + (100 - processedFoodPct) * 0.3), 5, 95)
    const ultraProcessedPenalty = clamp(r0(processedFoodPct * 1.2), 0, 100)
    const weeklyTrend = clamp(r0(nutrientScore * 0.7 + foodLogQuality * 0.2), 5, 95)
    const score = clamp(r0(nutrientScore * 0.35 + microAdequacy * 0.25 + antiInflammatory * 0.2 + (100 - ultraProcessedPenalty) * 0.1 + 5), 5, 95)
    const band = scoreBand(score)
    const note = `Nutrient density: ${nutrientScore}/100. ${per100kcal} nutrients per 100 kcal. ${ultraProcessedPenalty > 35 ? "High ultra-processed food penalty — shift toward whole foods." : "Processed food load is manageable."}`

    const snap = mkSnap({ toolId: "nutrient-density-score", toolName: "Nutrient Density Score", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [ultraProcessedPenalty > 35 ? "processed-penalty" : "nutrient-rich", "food-quality"], domain: "micronutrient", calories: totalCalories })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Nutrient Density", value: `${nutrientScore}/100`, status: toStatus(band), description: `${per100kcal} nutrients per 100 kcal` },
      healthScore: score,
      metrics: [
        { label: "Score per 100 kcal", value: per100kcal, status: per100kcal >= 4 ? "good" : per100kcal >= 2.5 ? "warning" : "danger" },
        { label: "Micronutrient Adequacy", value: `${microAdequacy}%`, status: microAdequacy >= 75 ? "good" : microAdequacy >= 55 ? "warning" : "danger" },
        { label: "Anti-Inflammatory", value: `${antiInflammatory}/100`, status: antiInflammatory >= 65 ? "good" : antiInflammatory >= 50 ? "warning" : "danger" },
        { label: "Ultra-Processed Penalty", value: `${ultraProcessedPenalty}%`, status: ultraProcessedPenalty < 25 ? "good" : ultraProcessedPenalty < 45 ? "warning" : "danger" },
        { label: "Weekly Quality Trend", value: `${weeklyTrend}/100`, status: weeklyTrend >= 65 ? "good" : weeklyTrend >= 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Food Ranking", description: `Top nutrient-dense swaps: replace chips with nuts, soda with sparkling water, white bread with sourdough. Each swap improves density score by 3-5 points.`, priority: "high", category: "Ranking" },
        { title: "Grocery Optimization", description: `Processed food penalty: ${ultraProcessedPenalty}%. Shop perimeter of store first (produce, protein, dairy). Aim for <20% ultra-processed intake for optimal density.`, priority: "high", category: "Optimization" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { foodLogQuality, totalCalories, micronutrientCoverage, processedFoodPct, per100kcal, nutrientScore, microAdequacy, antiInflammatory, ultraProcessedPenalty, weeklyTrend, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Density Score", subtitle: "0–100 nutrient quality index", values: [{ label: "Density", value: nutrientScore, color: bandCls(band) }] },
      { title: "Heatmap Proxy", subtitle: "Quality vs penalty", values: [{ label: "Anti-Inflammatory", value: antiInflammatory, color: bandCls(scoreBand(antiInflammatory)) }, { label: "Processed Penalty", value: ultraProcessedPenalty, color: ultraProcessedPenalty < 25 ? "bg-emerald-500" : ultraProcessedPenalty < 45 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Weekly Food Quality", subtitle: "Trend over time", values: [{ label: "Trend", value: weeklyTrend, color: bandCls(scoreBand(weeklyTrend)) }] },
    ], research: buildResearch("Nutrient Density Score", snap.tags, snap, { per100kcal, nutrientScore, microAdequacy, antiInflammatory, ultraProcessedPenalty, weeklyTrend }) })
  }

  return <ComprehensiveHealthTemplate title="Nutrient Density Score" description="Food quality intelligence index with nutrients per 100 kcal scoring, ultra-processed penalty, anti-inflammatory index, AI food ranking, and grocery optimization." toolId="nutrient-density-score" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Nutrient Density Score" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Nutrient Density Score" description="Advanced nutrient density calculator with food quality index, anti-inflammatory scoring, and grocery optimization." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Food Log Quality" value={foodLogQuality} onChange={setFoodLogQuality} min={0} max={100} step={1} suffix="/100" />
      <NumInput label="Total Calories" value={totalCalories} onChange={setTotalCalories} min={800} max={5000} step={50} suffix="kcal" />
      <NumInput label="Micronutrient Coverage" value={micronutrientCoverage} onChange={setMicronutrientCoverage} min={0} max={100} step={1} suffix="%" />
      <NumInput label="Processed Food %" value={processedFoodPct} onChange={setProcessedFoodPct} min={0} max={100} step={1} suffix="%" />
    </div>} />
}

/* ═══════════════════════  41. CAFFEINE HALF-LIFE CALCULATOR  ═══════════════════════ */

export function AdvancedCaffeineHalfLifeCalculator() {
  const [caffeineMg, setCaffeineMg] = useState(200)
  const [timeConsumed, setTimeConsumed] = useState(14)
  const [age, setAge] = useState(35)
  const [smoking, setSmoking] = useState("no")
  const [pregnancy, setPregnancy] = useState("no")
  const [bedtime, setBedtime] = useState(23)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const baseHalfLife = pregnancy === "yes" ? 11 : smoking === "yes" ? 3.5 : age > 60 ? 7 : 5.5
    const hoursToBed = ((bedtime - timeConsumed) + 24) % 24
    const halvings = hoursToBed / baseHalfLife
    const remainingAtBed = r0(caffeineMg / Math.pow(2, halvings))
    const sleepDisruptionProb = clamp(r0(remainingAtBed > 100 ? 72 : remainingAtBed > 50 ? 48 : remainingAtBed > 25 ? 28 : 10), 0, 100)
    const cortisolInteraction = clamp(r0((timeConsumed < 10 ? 22 : 8) + caffeineMg * 0.05), 0, 100)
    const cutoffTime = r0((bedtime - baseHalfLife * 2.5 + 24) % 24)
    const sleepSafety = clamp(r0(100 - sleepDisruptionProb), 5, 95)
    const score = clamp(r0(sleepSafety * 0.55 + (100 - cortisolInteraction) * 0.25 + 15), 5, 95)
    const band = scoreBand(score)
    const note = `Half-life: ${r1(baseHalfLife)} hrs. At bedtime (${bedtime}:00), ~${remainingAtBed} mg caffeine remains. ${remainingAtBed > 50 ? "Sleep protection alert: reduce afternoon caffeine or consume earlier." : "Caffeine should be mostly cleared by bedtime."}`

    const snap = mkSnap({ toolId: "caffeine-half-life", toolName: "Caffeine Half-Life Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [sleepDisruptionProb > 50 ? "sleep-risk" : "sleep-safe", "caffeine-management"], domain: "behavioral" })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Remaining at Bedtime", value: `${remainingAtBed} mg`, status: toStatus(band), description: `Half-life: ${r1(baseHalfLife)} hrs · Cut-off: ${cutoffTime}:00` },
      healthScore: score,
      metrics: [
        { label: "Half-Life", value: `${r1(baseHalfLife)} hrs`, status: baseHalfLife <= 5.5 ? "good" : "warning" },
        { label: "Caffeine at Bedtime", value: `${remainingAtBed} mg`, status: remainingAtBed < 25 ? "good" : remainingAtBed < 50 ? "warning" : "danger" },
        { label: "Sleep Disruption Prob", value: `${sleepDisruptionProb}%`, status: sleepDisruptionProb < 25 ? "good" : sleepDisruptionProb < 50 ? "warning" : "danger" },
        { label: "Cortisol Interaction", value: `${cortisolInteraction}%`, status: cortisolInteraction < 25 ? "good" : cortisolInteraction < 50 ? "warning" : "danger" },
        { label: "Recommended Cutoff", value: `${cutoffTime}:00`, status: "good" },
        { label: "Sleep Safety", value: `${sleepSafety}/100`, status: sleepSafety >= 65 ? "good" : sleepSafety >= 50 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Sleep Protection Alert", description: `${remainingAtBed > 50 ? "⚠️ High caffeine at bedtime. Move last caffeine intake before " + cutoffTime + ":00 to protect sleep architecture." : "✓ Caffeine clearance looks adequate for sleep protection."}`, priority: "high", category: "Sleep" },
        { title: "Personalized Cutoff", description: `Your metabolism suggests a cutoff time of ${cutoffTime}:00 (${r1(baseHalfLife * 2.5)} hrs before bed). ${pregnancy === "yes" ? "Pregnancy doubles half-life — limit total intake to 200 mg/day." : smoking === "yes" ? "Smoking accelerates clearance but doesn't eliminate disruption." : ""}`, priority: "high", category: "Timing" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { caffeineMg, timeConsumed, age, smoking, pregnancy, bedtime, baseHalfLife, hoursToBed, halvings: r2(halvings), remainingAtBed, sleepDisruptionProb, cortisolInteraction, cutoffTime, sleepSafety, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Clearance Curve", subtitle: "Caffeine decline over time", unit: "mg", values: [{ label: "Consumed", value: caffeineMg, color: "bg-amber-500" }, { label: "At Bedtime", value: remainingAtBed, color: remainingAtBed < 25 ? "bg-emerald-500" : remainingAtBed < 50 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Sleep Safety", subtitle: "Protection indicator", values: [{ label: "Safety", value: sleepSafety, color: bandCls(band) }, { label: "Disruption", value: sleepDisruptionProb, color: sleepDisruptionProb < 25 ? "bg-emerald-500" : sleepDisruptionProb < 50 ? "bg-amber-500" : "bg-rose-500" }] },
      { title: "Cortisol Overlay", subtitle: "Morning caffeine interaction", values: [{ label: "Cortisol", value: cortisolInteraction, color: cortisolInteraction < 25 ? "bg-emerald-500" : cortisolInteraction < 50 ? "bg-amber-500" : "bg-rose-500" }] },
    ], research: buildResearch("Caffeine Half-Life Calculator", snap.tags, snap, { caffeineMg, baseHalfLife, remainingAtBed, sleepDisruptionProb, cortisolInteraction, cutoffTime, sleepSafety }) })
  }

  return <ComprehensiveHealthTemplate title="Caffeine Half-Life Calculator" description="Sleep protection engine with personalized clearance curve, sleep disruption probability, cortisol interaction, and AI cutoff time recommendation." toolId="caffeine-half-life" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Caffeine Half-Life Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Caffeine Half-Life Calculator" description="Advanced caffeine half-life calculator with sleep protection, cortisol interaction, and personalized cutoff timing." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Caffeine Consumed" value={caffeineMg} onChange={setCaffeineMg} min={20} max={800} step={10} suffix="mg" />
      <NumInput label="Time Consumed" value={timeConsumed} onChange={setTimeConsumed} min={5} max={22} step={1} suffix="24h" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Smoking" value={smoking} onChange={setSmoking} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Pregnancy" value={pregnancy} onChange={setPregnancy} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <NumInput label="Bedtime" value={bedtime} onChange={setBedtime} min={20} max={26} step={1} suffix="24h" />
    </div>} />
}

/* ═══════════════════════  42. CREATINE INTAKE CALCULATOR  ═══════════════════════ */

export function AdvancedCreatineIntakeCalculator() {
  const [weight, setWeight] = useState(80)
  const [trainingType, setTrainingType] = useState("strength")
  const [vegetarian, setVegetarian] = useState("no")
  const [kidneyHealth, setKidneyHealth] = useState("normal")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const loadingDose = r0(weight * 0.3)
    const loadingSplit = r0(loadingDose / 4)
    const maintenanceDose = r1(weight * 0.04 + (vegetarian === "yes" ? 1 : 0))
    const muscleSaturation = clamp(r0(65 + (vegetarian === "yes" ? 18 : 8) + (trainingType === "strength" ? 10 : 4)), 5, 95)
    const performanceGain = clamp(r0(muscleSaturation * 0.55 + (trainingType === "strength" ? 16 : trainingType === "mixed" ? 10 : 6)), 5, 95)
    const hydrationAdjust = r0(weight * 35 + 500)
    const kidneyAlert = kidneyHealth === "impaired"
    const score = clamp(r0(kidneyAlert ? 35 : performanceGain * 0.5 + muscleSaturation * 0.3 + 12), 5, 95)
    const band = scoreBand(score, kidneyAlert)
    const note = `Loading: ${loadingDose}g/day (${loadingSplit}g × 4) for 5-7 days, then ${maintenanceDose}g/day maintenance. ${kidneyAlert ? "Kidney impairment detected — consult physician before supplementing." : "No contraindications detected."}`

    const realSnap = mkSnap({ toolId: "creatine-intake", toolName: "Creatine Intake Calculator", healthScore: kidneyAlert ? Math.min(score, 36) : score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 6), 0, 100), projection1Year: clamp(r0(score + 10), 0, 100), tags: [kidneyAlert ? "clinical-supervision" : "performance-support", vegetarian === "yes" ? "vegetarian-boost" : "creatine-standard"], domain: "supplement", weightKg: weight })
    saveSnap(realSnap)

    setResult({
      primaryMetric: { label: "Maintenance Dose", value: `${maintenanceDose} g/day`, status: toStatus(band), description: `Loading: ${loadingDose}g/day for 5-7 days` },
      healthScore: realSnap.healthScore,
      metrics: [
        { label: "Loading Phase", value: `${loadingDose} g/day`, status: "good" },
        { label: "Split Dose", value: `${loadingSplit}g × 4`, status: "good" },
        { label: "Maintenance", value: `${maintenanceDose} g/day`, status: "good" },
        { label: "Muscle Saturation", value: `${muscleSaturation}%`, status: muscleSaturation >= 70 ? "good" : muscleSaturation >= 55 ? "warning" : "danger" },
        { label: "Performance Gain", value: `${performanceGain}%`, status: performanceGain >= 65 ? "good" : performanceGain >= 50 ? "warning" : "danger" },
        { label: "Hydration Need", value: `${hydrationAdjust} mL/day`, status: "good" },
      ],
      recommendations: [
        { title: "AI Hydration Adjustment", description: `Creatine increases water retention. Target ${hydrationAdjust} mL/day during loading phase. Inadequate hydration reduces efficacy and can cause cramping.`, priority: "high", category: "Hydration" },
        { title: "Kidney Safety", description: kidneyAlert ? "⚠️ Kidney impairment flagged. Creatine supplementation should be supervised by a physician in this context." : "Creatine is safe for healthy kidneys at recommended doses. No evidence of kidney damage in healthy individuals.", priority: kidneyAlert ? "high" : "medium", category: "Safety" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, trainingType, vegetarian, kidneyHealth, loadingDose, loadingSplit, maintenanceDose, muscleSaturation, performanceGain, hydrationAdjust, score },
    })
    setExtra({ snapshot: realSnap, clinicalNote: note, graphs: [
      { title: "Dose Schedule", subtitle: "Loading vs maintenance", unit: "g", values: [{ label: "Loading/day", value: loadingDose, color: "bg-sky-500" }, { label: "Maintenance/day", value: maintenanceDose, color: "bg-emerald-500" }] },
      { title: "Performance Score", subtitle: "Saturation and gain probability", values: [{ label: "Saturation", value: muscleSaturation, color: bandCls(scoreBand(muscleSaturation)) }, { label: "Performance", value: performanceGain, color: bandCls(scoreBand(performanceGain)) }] },
      { title: "Strength Trend", subtitle: "Expected improvement", values: [{ label: "Score", value: realSnap.healthScore, color: bandCls(band) }] },
    ], research: buildResearch("Creatine Intake Calculator", realSnap.tags, realSnap, { loadingDose, maintenanceDose, muscleSaturation, performanceGain, hydrationAdjust }) })
  }

  return <ComprehensiveHealthTemplate title="Creatine Intake Calculator" description="ATP performance engine with loading/maintenance protocol, muscle saturation estimate, AI hydration adjustment, kidney safety alert, and performance gain probability." toolId="creatine-intake" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Creatine Intake Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Creatine Intake Calculator" description="Advanced creatine calculator with loading protocol, muscle saturation, hydration adjustment, and kidney safety." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Training Type" value={trainingType} onChange={setTrainingType} options={[{ value: "strength", label: "Strength" }, { value: "mixed", label: "Mixed" }, { value: "endurance", label: "Endurance" }]} />
      <SelectInput label="Vegetarian" value={vegetarian} onChange={setVegetarian} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Kidney Health" value={kidneyHealth} onChange={setKidneyHealth} options={[{ value: "normal", label: "Normal" }, { value: "impaired", label: "Impaired" }]} />
    </div>} />
}

/* ═══════════════════════  43. BETA-ALANINE DOSAGE  ═══════════════════════ */

export function AdvancedBetaAlanineDosage() {
  const [weight, setWeight] = useState(78)
  const [intensity, setIntensity] = useState("high")
  const [duration, setDuration] = useState(60)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const baseDose = intensity === "high" ? 5.5 : intensity === "moderate" ? 4 : 3.2
    const adjustedDose = r1(clamp(baseDose * (weight / 75), 2, 6.4))
    const splitDoses = Math.ceil(adjustedDose / 1.6)
    const perSplit = r1(adjustedDose / splitDoses)
    const lactateBuffering = clamp(r0(adjustedDose * 12 + (duration > 45 ? 14 : 6)), 5, 95)
    const tinglingRisk = clamp(r0(perSplit > 2 ? 45 : perSplit > 1.6 ? 28 : 12), 0, 100)
    const fatigueDelay = r1(clamp(lactateBuffering * 0.08 + 1.5, 0, 12))
    const performanceThreshold = clamp(r0(lactateBuffering * 0.55 + (intensity === "high" ? 18 : 8)), 5, 95)
    const enduranceGain = clamp(r0(lactateBuffering * 0.4 + fatigueDelay * 5), 5, 95)
    const score = clamp(r0(performanceThreshold * 0.4 + lactateBuffering * 0.3 + (100 - tinglingRisk) * 0.15 + 10), 5, 95)
    const band = scoreBand(score)
    const note = `Beta-alanine: ${adjustedDose}g/day split into ${splitDoses} doses of ${perSplit}g. ${tinglingRisk > 40 ? "Split doses smaller to reduce paresthesia." : "Tingling risk is manageable at current split."}`

    const snap = mkSnap({ toolId: "beta-alanine-dosage", toolName: "Beta-Alanine Dosage", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [intensity === "high" ? "high-intensity" : "endurance", "carnosine-loading"], domain: "supplement", weightKg: weight })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Daily Dose", value: `${adjustedDose} g`, status: toStatus(band), description: `${splitDoses} × ${perSplit}g splits` },
      healthScore: score,
      metrics: [
        { label: "Total Dose", value: `${adjustedDose} g/day`, status: "good" },
        { label: "Split Schedule", value: `${splitDoses} × ${perSplit}g`, status: "good" },
        { label: "Lactate Buffering", value: `${lactateBuffering}/100`, status: lactateBuffering >= 65 ? "good" : lactateBuffering >= 50 ? "warning" : "danger" },
        { label: "Tingling Risk", value: `${tinglingRisk}%`, status: tinglingRisk < 25 ? "good" : tinglingRisk < 45 ? "warning" : "danger" },
        { label: "Fatigue Delay", value: `${fatigueDelay} min`, status: fatigueDelay >= 3 ? "good" : "warning" },
        { label: "Endurance Gain", value: `${enduranceGain}%`, status: enduranceGain >= 60 ? "good" : enduranceGain >= 45 ? "warning" : "danger" },
      ],
      recommendations: [
        { title: "AI Performance Threshold", description: `Performance score: ${performanceThreshold}/100. Beta-alanine takes 2-4 weeks of daily loading to build intramuscular carnosine. Expect meaningful fatigue delay after 4+ weeks.`, priority: "high", category: "Performance" },
        { title: "Paresthesia Management", description: `Tingling risk: ${tinglingRisk}%. ${tinglingRisk > 35 ? "Use sustained-release form or split into smaller doses (≤1.6g per serving)." : "Current split should minimize paresthesia."}`, priority: "medium", category: "Side Effects" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, intensity, duration, baseDose, adjustedDose, splitDoses, perSplit, lactateBuffering, tinglingRisk, fatigueDelay, performanceThreshold, enduranceGain, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Dosage Timeline", subtitle: "Daily split protocol", unit: "g", values: Array.from({ length: splitDoses }, (_, i) => ({ label: `Dose ${i + 1}`, value: perSplit, color: "bg-sky-500" })) },
      { title: "Fatigue Delay Score", subtitle: "Minutes gained", values: [{ label: "Delay", value: fatigueDelay, color: "bg-emerald-500" }, { label: "Buffering", value: lactateBuffering, color: bandCls(scoreBand(lactateBuffering)) }] },
      { title: "Endurance Improvement", subtitle: "Projected gain", values: [{ label: "Endurance", value: enduranceGain, color: bandCls(scoreBand(enduranceGain)) }] },
    ], research: buildResearch("Beta-Alanine Dosage", snap.tags, snap, { adjustedDose, splitDoses, lactateBuffering, tinglingRisk, fatigueDelay, performanceThreshold, enduranceGain }) })
  }

  return <ComprehensiveHealthTemplate title="Beta-Alanine Dosage Calculator" description="Buffering capacity model with weight-adjusted dosing, lactate buffering index, fatigue delay score, paresthesia risk, and AI performance threshold prediction." toolId="beta-alanine-dosage" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Beta-Alanine Dosage" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Beta-Alanine Dosage Calculator" description="Advanced beta-alanine dosage calculator with buffering index, fatigue delay, and tingling risk management." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Workout Intensity" value={intensity} onChange={setIntensity} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
      <NumInput label="Workout Duration" value={duration} onChange={setDuration} min={15} max={180} step={5} suffix="min" />
    </div>} />
}

/* ═══════════════════════  44. CITRULLINE MALATE DOSAGE  ═══════════════════════ */

export function AdvancedCitrullineMalateDosage() {
  const [weight, setWeight] = useState(78)
  const [workoutType, setWorkoutType] = useState("strength")
  const [goal, setGoal] = useState("pump")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const baseDose = goal === "pump" ? 8 : goal === "endurance" ? 6 : 7
    const adjustedDose = r1(clamp(baseDose * (weight / 75), 4, 10))
    const noProduction = clamp(r0(adjustedDose * 8 + (workoutType === "strength" ? 12 : 6)), 5, 95)
    const bloodFlowEnhancement = clamp(r0(noProduction * 0.65 + 15), 5, 95)
    const recoveryImprovement = clamp(r0(bloodFlowEnhancement * 0.4 + adjustedDose * 3), 5, 95)
    const pumpProbability = clamp(r0(noProduction * 0.7 + (goal === "pump" ? 12 : 4)), 5, 95)
    const stackCompatibility = clamp(r0(82 - (adjustedDose > 9 ? 12 : 0)), 5, 95)
    const score = clamp(r0(noProduction * 0.3 + bloodFlowEnhancement * 0.3 + recoveryImprovement * 0.2 + 12), 5, 95)
    const band = scoreBand(score)
    const note = `Citrulline malate: ${adjustedDose}g pre-workout. NO production estimate: ${noProduction}/100. ${pumpProbability >= 70 ? "Strong pump probability." : "Adequate blood flow support."}`

    const snap = mkSnap({ toolId: "citrulline-malate", toolName: "Citrulline Malate Dosage", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [goal === "pump" ? "nitric-oxide" : "endurance-support", "vasodilation"], domain: "supplement", weightKg: weight })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "Pre-Workout Dose", value: `${adjustedDose} g`, status: toStatus(band), description: `NO Production: ${noProduction}/100` },
      healthScore: score,
      metrics: [
        { label: "Recommended Dose", value: `${adjustedDose} g`, status: "good" },
        { label: "NO Production", value: `${noProduction}/100`, status: noProduction >= 65 ? "good" : noProduction >= 50 ? "warning" : "danger" },
        { label: "Blood Flow", value: `${bloodFlowEnhancement}/100`, status: bloodFlowEnhancement >= 65 ? "good" : bloodFlowEnhancement >= 50 ? "warning" : "danger" },
        { label: "Recovery Boost", value: `${recoveryImprovement}%`, status: recoveryImprovement >= 55 ? "good" : recoveryImprovement >= 40 ? "warning" : "danger" },
        { label: "Pump Probability", value: `${pumpProbability}%`, status: pumpProbability >= 65 ? "good" : pumpProbability >= 50 ? "warning" : "danger" },
        { label: "Stack Compatibility", value: `${stackCompatibility}/100`, status: stackCompatibility >= 70 ? "good" : "warning" },
      ],
      recommendations: [
        { title: "AI Stack Compatibility", description: `Compatibility: ${stackCompatibility}/100. Citrulline pairs well with beta-alanine and creatine. Avoid combining with high-dose arginine (competitive absorption).`, priority: "high", category: "Stacking" },
        { title: "Timing", description: `Take ${adjustedDose}g 30-60 minutes pre-workout on an empty stomach for best absorption. Citrulline converts to arginine in the kidneys, sustaining NO levels longer than arginine itself.`, priority: "medium", category: "Timing" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, workoutType, goal, baseDose, adjustedDose, noProduction, bloodFlowEnhancement, recoveryImprovement, pumpProbability, stackCompatibility, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "Dose Recommendation", subtitle: "Pre-workout citrulline", unit: "g", values: [{ label: "Dose", value: adjustedDose, color: "bg-sky-500" }] },
      { title: "Pump Probability Meter", subtitle: "NO and blood flow", values: [{ label: "NO Production", value: noProduction, color: bandCls(scoreBand(noProduction)) }, { label: "Pump", value: pumpProbability, color: bandCls(scoreBand(pumpProbability)) }] },
      { title: "Performance Trend", subtitle: "Recovery and flow", values: [{ label: "Blood Flow", value: bloodFlowEnhancement, color: bandCls(scoreBand(bloodFlowEnhancement)) }, { label: "Recovery", value: recoveryImprovement, color: bandCls(scoreBand(recoveryImprovement)) }] },
    ], research: buildResearch("Citrulline Malate Dosage", snap.tags, snap, { adjustedDose, noProduction, bloodFlowEnhancement, recoveryImprovement, pumpProbability, stackCompatibility }) })
  }

  return <ComprehensiveHealthTemplate title="Citrulline Malate Dosage Calculator" description="Nitric oxide optimizer with weight-adjusted dosing, blood flow enhancement score, pump probability meter, recovery improvement, and AI stack compatibility check." toolId="citrulline-malate" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="Citrulline Malate Dosage" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Citrulline Malate Dosage Calculator" description="Advanced citrulline malate calculator with NO production, pump probability, and stack compatibility." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Workout Type" value={workoutType} onChange={setWorkoutType} options={[{ value: "strength", label: "Strength" }, { value: "mixed", label: "Mixed" }, { value: "endurance", label: "Endurance" }]} />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "pump", label: "Maximum Pump" }, { value: "endurance", label: "Endurance" }, { value: "recovery", label: "Recovery" }]} />
    </div>} />
}

/* ═══════════════════════  45. BCAA DOSAGE CALCULATOR  ═══════════════════════ */

export function AdvancedBCAADosageCalculator() {
  const [weight, setWeight] = useState(78)
  const [totalProtein, setTotalProtein] = useState(140)
  const [trainingType, setTrainingType] = useState("strength")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtra()

  const calculate = () => {
    const proteinPerKg = r1(totalProtein / weight)
    const proteinSufficient = proteinPerKg >= 1.6
    const bcaaDose = proteinSufficient ? r1(clamp(weight * 0.06, 3, 8)) : r1(clamp(weight * 0.1, 5, 12))
    const leucineAdequacy = clamp(r0(proteinPerKg * 35 + (proteinSufficient ? 15 : 0)), 5, 100)
    const muscleBreakdownSuppression = clamp(r0(leucineAdequacy * 0.55 + bcaaDose * 3), 5, 95)
    const mpsContribution = clamp(r0(leucineAdequacy * 0.4 + (trainingType === "strength" ? 16 : 8)), 5, 95)
    const unnecessaryFlag = proteinSufficient
    const costEffectiveness = proteinSufficient ? clamp(r0(30 + (proteinPerKg - 1.6) * 15), 5, 95) : clamp(r0(72 - proteinPerKg * 10), 5, 95)
    const recoveryBenefit = clamp(r0(muscleBreakdownSuppression * 0.45 + mpsContribution * 0.35), 5, 95)
    const score = clamp(r0(recoveryBenefit * 0.35 + leucineAdequacy * 0.25 + costEffectiveness * 0.2 + 12), 5, 95)
    const band = scoreBand(score)
    const note = `BCAA dose: ${bcaaDose}g pre/intra workout. ${unnecessaryFlag ? "⚠️ Protein intake is already sufficient (" + proteinPerKg + "g/kg) — BCAA supplementation may be unnecessary. Whole protein sources already provide adequate BCAAs." : "Below optimal protein — BCAAs can help bridge the amino acid gap during training."}`

    const snap = mkSnap({ toolId: "bcaa-dosage", toolName: "BCAA Dosage Calculator", healthScore: score, riskClass: band, clinicalNote: note, projection3Month: clamp(r0(score + 5), 0, 100), projection1Year: clamp(r0(score + 8), 0, 100), tags: [unnecessaryFlag ? "redundancy-flag" : "amino-gap", trainingType === "strength" ? "muscle-preservation" : "endurance-support"], domain: "supplement", weightKg: weight, proteinG: totalProtein })
    saveSnap(snap)

    setResult({
      primaryMetric: { label: "BCAA Dose", value: `${bcaaDose} g`, status: toStatus(band), description: unnecessaryFlag ? "May be unnecessary — protein sufficient" : "Recommended pre/intra workout" },
      healthScore: score,
      metrics: [
        { label: "Recommended Dose", value: `${bcaaDose} g`, status: "good" },
        { label: "Leucine Adequacy", value: `${leucineAdequacy}%`, status: leucineAdequacy >= 75 ? "good" : leucineAdequacy >= 55 ? "warning" : "danger" },
        { label: "Muscle Protection", value: `${muscleBreakdownSuppression}/100`, status: muscleBreakdownSuppression >= 65 ? "good" : muscleBreakdownSuppression >= 50 ? "warning" : "danger" },
        { label: "MPS Contribution", value: `${mpsContribution}/100`, status: mpsContribution >= 60 ? "good" : mpsContribution >= 45 ? "warning" : "danger" },
        { label: "Cost-Effectiveness", value: `${costEffectiveness}/100`, status: costEffectiveness >= 60 ? "good" : costEffectiveness >= 40 ? "warning" : "danger" },
        { label: "Recovery Benefit", value: `${recoveryBenefit}/100`, status: recoveryBenefit >= 60 ? "good" : recoveryBenefit >= 45 ? "warning" : "danger" },
        { label: "Protein Sufficient?", value: unnecessaryFlag ? "Yes — BCAA optional" : "No — BCAA beneficial", status: unnecessaryFlag ? "warning" : "good" },
      ],
      recommendations: [
        { title: "AI Protein Sufficiency Check", description: `Protein: ${proteinPerKg}g/kg. ${unnecessaryFlag ? "Your total protein already delivers 18-25% BCAAs naturally. Supplementing BCAAs on top adds cost without proven additional benefit when protein is adequate." : "BCAAs can fill the amino acid gap when total protein is below 1.6g/kg. Prioritize raising whole protein intake as the primary strategy."}`, priority: "high", category: "Sufficiency" },
        { title: "Cost-Effectiveness Alert", description: `Score: ${costEffectiveness}/100. ${costEffectiveness < 45 ? "Consider redirecting BCAA budget toward whey/casein protein instead — better amino acid profile per dollar." : "BCAA supplementation has reasonable cost-benefit in your context."}`, priority: "medium", category: "Cost" },
        { title: "Clinical Focus", description: note, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, totalProtein, trainingType, proteinPerKg, proteinSufficient, bcaaDose, leucineAdequacy, muscleBreakdownSuppression, mpsContribution, costEffectiveness, recoveryBenefit, score },
    })
    setExtra({ snapshot: snap, clinicalNote: note, graphs: [
      { title: "BCAA Need Indicator", subtitle: "Dose and necessity", values: [{ label: "Dose", value: bcaaDose, color: "bg-sky-500" }, { label: "Sufficiency Flag", value: unnecessaryFlag ? 85 : 25, color: unnecessaryFlag ? "bg-amber-500" : "bg-emerald-500" }] },
      { title: "Muscle Protection", subtitle: "Breakdown suppression", values: [{ label: "Protection", value: muscleBreakdownSuppression, color: bandCls(scoreBand(muscleBreakdownSuppression)) }, { label: "MPS", value: mpsContribution, color: bandCls(scoreBand(mpsContribution)) }] },
      { title: "Cost-Effectiveness", subtitle: "Smart supplement decision", values: [{ label: "Cost-Value", value: costEffectiveness, color: bandCls(scoreBand(costEffectiveness)) }, { label: "Recovery", value: recoveryBenefit, color: bandCls(scoreBand(recoveryBenefit)) }] },
    ], research: buildResearch("BCAA Dosage Calculator", snap.tags, snap, { bcaaDose, leucineAdequacy, muscleBreakdownSuppression, mpsContribution, costEffectiveness, recoveryBenefit, proteinSufficient }) })
  }

  return <ComprehensiveHealthTemplate title="BCAA Dosage Calculator" description="Muscle preservation model with AI protein sufficiency check, leucine adequacy, MPS contribution index, cost-effectiveness alert, and smart supplement decision engine." toolId="bcaa-dosage" calculate={calculate} result={result} resultExtras={extra ? <ResultExtras title="BCAA Dosage Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="BCAA Dosage Calculator" description="Advanced BCAA dosage calculator with protein sufficiency check, muscle protection, and cost-effectiveness analysis." categoryName="Nutrition & Calorie Tracking" />} inputs={
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <NumInput label="Total Protein Intake" value={totalProtein} onChange={setTotalProtein} min={20} max={300} suffix="g/day" />
      <SelectInput label="Training Type" value={trainingType} onChange={setTrainingType} options={[{ value: "strength", label: "Strength" }, { value: "endurance", label: "Endurance" }, { value: "mixed", label: "Mixed" }]} />
    </div>} />
}
