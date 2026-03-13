"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Apple,
  BarChart3,
  Beef,
  Brain,
  Clock3,
  Droplets,
  Download,
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

type Status = "good" | "warning" | "danger"
type RiskBand = "Green" | "Yellow" | "Red" | "Purple"

interface GraphDatum {
  label: string
  value: number
  color?: string
}

interface GraphSpec {
  title: string
  subtitle: string
  unit?: string
  values: GraphDatum[]
}

interface NutritionSnapshotV2 {
  toolId: string
  toolName: string
  recordedAt: string
  healthScore: number
  riskClass: RiskBand | "Green" | "Yellow" | "Red"
  clinicalNote: string
  projection3Month: number
  projection1Year: number
  tags: string[]
  domain: "cardiometabolic" | "immune" | "recovery" | "performance" | "micronutrient" | "hydration"
  weightKg?: number
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  potassiumMg?: number
  sodiumMg?: number
  vitaminDNgMl?: number
  calciumMg?: number
  fastingGlucose?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  serumMarker?: number
}

interface ExtraStateV2 {
  snapshot: NutritionSnapshotV2
  graphs: GraphSpec[]
  clinicalNote: string
  research: Record<string, unknown>
}

const DASHBOARD_STORAGE_KEY = "nutrition-metabolic-dashboard-v1"

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function round0(value: number) {
  return Math.round(value)
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function toStatus(risk: RiskBand | "Green" | "Yellow" | "Red"): Status {
  if (risk === "Green") return "good"
  if (risk === "Yellow") return "warning"
  return "danger"
}

function bandClass(risk: RiskBand | "Green" | "Yellow" | "Red") {
  if (risk === "Green") return "bg-emerald-500"
  if (risk === "Yellow") return "bg-amber-400"
  if (risk === "Purple") return "bg-violet-600"
  return "bg-rose-500"
}

function scoreToBand(score: number, forcePurple = false): RiskBand {
  if (forcePurple) return "Purple"
  if (score >= 78) return "Green"
  if (score >= 58) return "Yellow"
  return "Red"
}

function estimateCalories(weightKg: number, factor: number) {
  return round0(weightKg * 28 * factor)
}

function loadSnapshots(): NutritionSnapshotV2[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY)
    return raw ? JSON.parse(raw) as NutritionSnapshotV2[] : []
  } catch {
    return []
  }
}

function saveSnapshot(snapshot: NutritionSnapshotV2) {
  if (typeof window === "undefined") return
  const existing = loadSnapshots().filter(entry => entry.toolId !== snapshot.toolId)
  const next = [snapshot, ...existing].slice(0, 36)
  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(next))
}

function createSnapshot(data: Omit<NutritionSnapshotV2, "recordedAt">): NutritionSnapshotV2 {
  return {
    ...data,
    recordedAt: new Date().toISOString(),
  }
}

function buildResearchPayload(title: string, tags: string[], snapshot: NutritionSnapshotV2, payload: Record<string, unknown>) {
  return {
    title,
    tags,
    capturedAt: snapshot.recordedAt,
    snapshot,
    research: payload,
    fhirBundle: {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Observation",
            status: "final",
            code: { text: title },
            valueString: `${snapshot.healthScore}/100 ${snapshot.riskClass}`,
            note: [{ text: snapshot.clinicalNote }],
          },
        },
      ],
    },
    hl7Message: [
      "MSH|^~\\&|CalculatorLoop|Nutrition|Research|Clinical|20260309||ORU^R01|1|P|2.5",
      `OBR|1|||${title}`,
      `OBX|1|TX|RISK^Risk Classification||${snapshot.riskClass}`,
      `OBX|2|NM|SCORE^Health Score||${snapshot.healthScore}`,
    ],
  }
}

function exportJson(filename: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = window.URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function exportCsv(filename: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const rows = Object.entries(payload).map(([key, value]) => `${key},"${String(typeof value === "object" ? JSON.stringify(value) : value).replace(/"/g, '""')}"`)
  const blob = new Blob([["field,value", ...rows].join("\n")], { type: "text/csv;charset=utf-8" })
  const url = window.URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label}
        {suffix && <span className="ml-1 text-muted-foreground">({suffix})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        min={min}
        max={max}
        step={step ?? 0.1}
        className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50"
      />
    </div>
  )
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function GraphCard({ graph }: { graph: GraphSpec }) {
  const max = Math.max(...graph.values.map(item => item.value), 1)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{graph.title}</CardTitle>
        <CardDescription>{graph.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {graph.values.map(item => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className="font-medium">
                {item.value}
                {graph.unit ? ` ${graph.unit}` : ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className={`h-2 rounded-full ${item.color ?? "bg-sky-500"}`}
                style={{ width: `${Math.max(6, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function EnhancedNutritionDashboard({ currentSnapshot }: { currentSnapshot: NutritionSnapshotV2 }) {
  const [snapshots, setSnapshots] = useState<NutritionSnapshotV2[]>([])

  useEffect(() => {
    setSnapshots(loadSnapshots())
  }, [currentSnapshot.recordedAt])

  const model = useMemo(() => {
    const list = snapshots.length ? snapshots : [currentSnapshot]
    const average = (items: NutritionSnapshotV2[]) => items.length ? round0(items.reduce((sum, item) => sum + item.healthScore, 0) / items.length) : 0
    const globalNutritionScore = average(list)
    const cardiometabolic = average(list.filter(item => item.domain === "cardiometabolic" || item.domain === "hydration"))
    const recovery = average(list.filter(item => item.domain === "recovery" || item.domain === "performance"))
    const immune = average(list.filter(item => item.domain === "immune" || item.domain === "micronutrient"))
    const performance = average(list.filter(item => item.domain === "performance" || item.domain === "recovery"))
    const deficiencyHits = list.filter(item => item.tags.some(tag => tag.includes("deficiency")) || item.healthScore < 58)
    const deficiencyMap = deficiencyHits.length ? deficiencyHits.map(item => `${item.toolName}: ${item.riskClass}`) : ["No active deficiency cluster stored yet."]
    const vitaminD = list.find(item => item.toolId === "vitamin-d-calculator")
    const calcium = list.find(item => item.toolId === "calcium-intake-calculator")
    const potassium = list.find(item => item.toolId === "potassium-intake")
    const hydration = list.find(item => item.toolId === "hydration-electrolyte-calculator")
    const pre = list.find(item => item.toolId === "pre-workout-nutrition")
    const post = list.find(item => item.toolId === "post-workout-nutrition")
    const proteinTiming = list.find(item => item.toolId === "protein-timing-calculator")
    const correlations: string[] = []

    if (potassium && hydration) {
      correlations.push("Potassium vs Sodium and Hydration synced: electrolyte planning can be aligned against blood pressure and sweat loss.")
    }
    if (vitaminD && calcium) {
      correlations.push("Vitamin D vs Calcium correlation active: bone support now reads serum support alongside intake adequacy.")
    }
    if (proteinTiming && (pre || post)) {
      correlations.push("Protein vs Workout modules integrated: timing, pre-fuel, and post-recovery can be sequenced together.")
    }
    if (!correlations.length) {
      correlations.push("Run more linked tools to expand cross-calculator intelligence.")
    }

    return {
      globalNutritionScore,
      cardiometabolic,
      recovery,
      immune,
      performance,
      deficiencyMap,
      correlationText: correlations,
      projection3Month: clamp(round0(100 - (100 - globalNutritionScore) * 0.8), 0, 100),
      projection1Year: clamp(round0(100 - (100 - globalNutritionScore) * 0.66), 0, 100),
    }
  }, [currentSnapshot, snapshots])

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-950 dark:to-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-cyan-600" />
          Central Nutrition Intelligence Dashboard
        </CardTitle>
        <CardDescription>
          Shared central data layer with standard risk scoring, projection modelling, deficiency clustering, and cross-calculator intelligence.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Global Nutrition Score</div><div className="mt-1 text-2xl font-semibold">{model.globalNutritionScore}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Cardiometabolic</div><div className="mt-1 text-2xl font-semibold">{model.cardiometabolic}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Recovery</div><div className="mt-1 text-2xl font-semibold">{model.recovery}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Immune</div><div className="mt-1 text-2xl font-semibold">{model.immune}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">Performance Index</div><div className="mt-1 text-2xl font-semibold">{model.performance}</div></div>
          <div className="rounded-xl border bg-background/80 p-3"><div className="text-xs text-muted-foreground">1-Year Trajectory</div><div className="mt-1 text-2xl font-semibold">{model.projection1Year}</div></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="mb-2 text-sm font-medium">Cross-Calculator Intelligence</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {model.correlationText.map(item => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="mb-2 text-sm font-medium">Deficiency Map</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {model.deficiencyMap.map(item => <li key={item}>{item}</li>)}
            </ul>
            <div className="mt-3 text-xs text-muted-foreground">3-month adaptive projection: {model.projection3Month}/100.</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NutritionResultExtras({ title, extra }: { title: string; extra: ExtraStateV2 }) {
  const researchPackage = buildResearchPayload(title, extra.snapshot.tags, extra.snapshot, extra.research)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-cyan-600" />
            Standard Risk Visualization And Clinical Export
          </CardTitle>
          <CardDescription>
            Meter, trend graph, comparison chart, risk code, projection model, and research-grade export.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Risk color code</span>
              <span className="font-medium">{extra.snapshot.riskClass}</span>
            </div>
            <div className="h-3 rounded-full bg-muted">
              <div className={`h-3 rounded-full ${bandClass(extra.snapshot.riskClass)}`} style={{ width: `${Math.max(8, extra.snapshot.healthScore)}%` }} />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">3-month projection {extra.snapshot.projection3Month}/100, 1-year projection {extra.snapshot.projection1Year}/100.</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {extra.graphs.map(graph => <GraphCard key={graph.title} graph={graph} />)}
          </div>
          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">Clinical Note</div>
            {extra.clinicalNote}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => exportJson(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-research.json`, researchPackage)}>
              <Download className="mr-2 h-4 w-4" />
              Research JSON
            </Button>
            <Button type="button" variant="outline" onClick={() => exportCsv(`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-research.csv`, { ...extra.research, riskClass: extra.snapshot.riskClass, score: extra.snapshot.healthScore })}>
              <Download className="mr-2 h-4 w-4" />
              CSV Export
            </Button>
          </div>
        </CardContent>
      </Card>
      <EnhancedNutritionDashboard currentSnapshot={extra.snapshot} />
    </div>
  )
}

function useExtraState() {
  return useState<ExtraStateV2 | null>(null)
}

export function AdvancedPotassiumIntakeCalculator() {
  const [age, setAge] = useState(38)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(78)
  const [foodIntake, setFoodIntake] = useState(2800)
  const [systolic, setSystolic] = useState(132)
  const [diastolic, setDiastolic] = useState(84)
  const [sodiumIntake, setSodiumIntake] = useState(3200)
  const [egfr, setEgfr] = useState(82)
  const [diureticUse, setDiureticUse] = useState("no")
  const [serumPotassium, setSerumPotassium] = useState(4.2)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = gender === "male" ? 3400 : 2600
    const adequacy = round0((foodIntake / rda) * 100)
    const naKRatio = round2(sodiumIntake / Math.max(foodIntake, 1))
    const bpReductionPotential = round1(Math.max(0, (foodIntake - 2000) / 700) + (naKRatio < 1 ? 1.2 : 0))
    const muscleCrampProbability = clamp(round0((foodIntake < 2600 ? 28 : 8) + (diureticUse === "yes" ? 18 : 0) + Math.max(0, 4.0 - serumPotassium) * 45), 0, 100)
    const hyperkalemiaRisk = clamp(round0((egfr < 60 ? 26 : 0) + (egfr < 30 ? 34 : 0) + (foodIntake > 4200 ? 14 : 0) + (serumPotassium > 5 ? 32 : 0)), 0, 100)
    const dashScore = clamp(round0(adequacy * 0.55 - Math.max(0, naKRatio - 1) * 20 + 30), 5, 100)
    const electrolyteBalanceScore = clamp(round0(100 - hyperkalemiaRisk * 0.4 - muscleCrampProbability * 0.25 + dashScore * 0.2), 5, 95)
    const hypertensionProjection = clamp(round0((100 - electrolyteBalanceScore) + Math.max(0, systolic - 120) * 0.8), 0, 100)
    const purple = egfr < 30 || serumPotassium >= 5.5
    const band = scoreToBand(electrolyteBalanceScore, purple)
    const clinicalNote = `Potassium support is ${adequacy >= 100 ? "adequate" : "below target"}. Kidney function and serum potassium decide whether increasing intake is protective or needs clinical supervision.`

    const snapshot = createSnapshot({
      toolId: "potassium-intake",
      toolName: "Potassium Intake Calculator",
      healthScore: purple ? Math.min(electrolyteBalanceScore, 40) : electrolyteBalanceScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(electrolyteBalanceScore + 6), 0, 100),
      projection1Year: clamp(round0(electrolyteBalanceScore + 9), 0, 100),
      tags: [band === "Purple" ? "clinical-supervision" : "potassium-balance", adequacy < 100 ? "deficiency-risk" : "cardio-support"],
      domain: "cardiometabolic",
      weightKg: weight,
      potassiumMg: foodIntake,
      sodiumMg: sodiumIntake,
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      serumMarker: serumPotassium,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Potassium Adequacy", value: `${adequacy}%`, status: toStatus(band), description: `${foodIntake} mg vs ${rda} mg`, icon: Heart },
      healthScore: snapshot.healthScore,
      metrics: [
        { label: "RDA Comparison", value: `${foodIntake}/${rda} mg`, status: adequacy >= 100 ? "good" : adequacy >= 80 ? "warning" : "danger", icon: Shield },
        { label: "Sodium:Potassium", value: `${naKRatio}:1`, status: naKRatio <= 1 ? "good" : naKRatio <= 1.6 ? "warning" : "danger", icon: Waves },
        { label: "BP Reduction Potential", value: `${bpReductionPotential} mmHg`, status: bpReductionPotential >= 2 ? "good" : "warning", icon: TrendingUp },
        { label: "Cramp Probability", value: `${muscleCrampProbability}%`, status: muscleCrampProbability < 30 ? "good" : muscleCrampProbability < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Hyperkalemia Risk", value: `${hyperkalemiaRisk}%`, status: hyperkalemiaRisk < 25 ? "good" : hyperkalemiaRisk < 50 ? "warning" : "danger", icon: AlertTriangle },
        { label: "DASH Compatibility", value: `${dashScore}/100`, status: dashScore >= 70 ? "good" : dashScore >= 50 ? "warning" : "danger", icon: Apple },
        { label: "6M Hypertension Risk", value: `${hypertensionProjection}%`, status: hypertensionProjection < 30 ? "good" : hypertensionProjection < 55 ? "warning" : "danger", icon: BarChart3 },
      ],
      recommendations: [
        { title: "AI Sodium-Potassium Correction", description: `Push potassium-rich foods if intake is low and sodium intake stays high. Aim to bring sodium:potassium toward 1:1 for better blood pressure response.`, priority: "high", category: "Correction" },
        { title: "Kidney Safety Alert", description: band === "Purple" ? "Kidney safety alert triggered. Do not aggressively raise potassium without nephrology guidance because CKD or serum potassium is already unsafe." : "Kidney safety screen does not currently block potassium improvement.", priority: band === "Purple" ? "high" : "medium", category: "Safety" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { age, gender, weight, foodIntake, systolic, diastolic, sodiumIntake, egfr, diureticUse, serumPotassium, rda, adequacy, naKRatio, bpReductionPotential, muscleCrampProbability, hyperkalemiaRisk, electrolyteBalanceScore, hypertensionProjection },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Intake vs RDA Meter", subtitle: "Potassium adequacy", unit: "mg", values: [{ label: "Intake", value: foodIntake, color: "bg-sky-500" }, { label: "RDA", value: rda, color: "bg-slate-500" }] },
        { title: "Sodium-Potassium Ratio", subtitle: "Lower is better", values: [{ label: "Current Ratio", value: naKRatio, color: naKRatio <= 1 ? "bg-emerald-500" : naKRatio <= 1.6 ? "bg-amber-500" : bandClass(band) }, { label: "Target", value: 1, color: "bg-slate-500" }] },
        { title: "BP Impact Graph", subtitle: "Current and projected pressure", unit: "mmHg", values: [{ label: "Systolic", value: systolic, color: "bg-rose-500" }, { label: "Potential Reduction", value: bpReductionPotential, color: "bg-emerald-500" }] },
      ],
      research: buildResearchPayload("Potassium Intake Calculator", snapshot.tags, snapshot, { rda, adequacy, naKRatio, bpReductionPotential, muscleCrampProbability, hyperkalemiaRisk, dashScore, hypertensionProjection }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <NumInput label="Daily Food Potassium" value={foodIntake} onChange={setFoodIntake} min={500} max={7000} step={50} suffix="mg" />
      <NumInput label="Systolic BP" value={systolic} onChange={setSystolic} min={90} max={190} suffix="mmHg" />
      <NumInput label="Diastolic BP" value={diastolic} onChange={setDiastolic} min={55} max={120} suffix="mmHg" />
      <NumInput label="Sodium Intake" value={sodiumIntake} onChange={setSodiumIntake} min={500} max={7000} step={50} suffix="mg" />
      <NumInput label="Kidney Function eGFR" value={egfr} onChange={setEgfr} min={10} max={130} suffix="mL/min" />
      <SelectInput label="Diuretic Use" value={diureticUse} onChange={setDiureticUse} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <NumInput label="Serum Potassium" value={serumPotassium} onChange={setSerumPotassium} min={2.5} max={6.5} step={0.1} suffix="mmol/L" />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Potassium Intake Calculator" description="Electro-cardiac stability engine for potassium adequacy, sodium balance, kidney safety, blood pressure response, and arrhythmia-aware screening." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="potassium-intake" resultExtras={extra ? <NutritionResultExtras title="Potassium Intake Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Potassium Intake Calculator" description="Advanced potassium intake calculator with sodium ratio, blood pressure, kidney safety, and DASH compatibility analysis." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedZincIntakeCalculator() {
  const [age, setAge] = useState(33)
  const [gender, setGender] = useState("male")
  const [dietType, setDietType] = useState("veg")
  const [frequentInfections, setFrequentInfections] = useState("yes")
  const [hairLoss, setHairLoss] = useState("no")
  const [serumZinc, setSerumZinc] = useState(76)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = gender === "male" ? 11 : 8
    const estimatedIntake = dietType === "veg" ? 8.2 : 11.8
    const bioavailability = dietType === "veg" ? 0.74 : 0.92
    const effectiveIntake = round1(estimatedIntake * bioavailability)
    const immuneScore = clamp(round0(effectiveIntake / rda * 65 + (frequentInfections === "no" ? 20 : 0) + (serumZinc >= 80 ? 12 : 4)), 5, 95)
    const testosteroneSupport = clamp(round0((gender === "male" ? 42 : 28) + effectiveIntake * 4 - (hairLoss === "yes" ? 8 : 0)), 5, 95)
    const recoveryScore = clamp(round0(immuneScore * 0.55 + testosteroneSupport * 0.35 + (hairLoss === "no" ? 10 : 0)), 5, 95)
    const supplementSafety = clamp(round0((estimatedIntake > 20 ? 18 : 4) + (serumZinc > 120 ? 36 : 0)), 0, 100)
    const symptomMatch = clamp(round0((frequentInfections === "yes" ? 22 : 4) + (hairLoss === "yes" ? 18 : 4) + (serumZinc < 75 ? 24 : 0)), 0, 100)
    const finalScore = clamp(round0(100 - symptomMatch * 0.45 - supplementSafety * 0.15 + immuneScore * 0.22), 5, 95)
    const band = scoreToBand(finalScore)
    const clinicalNote = `Zinc adequacy looks ${effectiveIntake >= rda ? "supportive" : "borderline"}. Vegetarian phytate load can materially reduce absorption, so symptoms and serum zinc help decide whether food-first correction is enough.`

    const snapshot = createSnapshot({
      toolId: "zinc-intake-calculator",
      toolName: "Zinc Intake Calculator",
      healthScore: finalScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(finalScore + 5), 0, 100),
      projection1Year: clamp(round0(finalScore + 8), 0, 100),
      tags: [dietType === "veg" ? "bioavailability-adjustment" : "immune-support", finalScore < 58 ? "deficiency-risk" : "hormonal-support"],
      domain: "immune",
      serumMarker: serumZinc,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Zinc Adequacy", value: `${round0(effectiveIntake / rda * 100)}%`, status: toStatus(band), description: `${effectiveIntake} mg effective zinc`, icon: Shield },
      healthScore: finalScore,
      metrics: [
        { label: "RDA Comparison", value: `${effectiveIntake}/${rda} mg`, status: effectiveIntake >= rda ? "good" : "warning", icon: Shield },
        { label: "Bioavailability", value: `${round0(bioavailability * 100)}%`, status: dietType === "veg" ? "warning" : "good", icon: Apple },
        { label: "Immune Function", value: `${immuneScore}/100`, status: immuneScore >= 70 ? "good" : immuneScore >= 50 ? "warning" : "danger", icon: Heart },
        { label: "Hormonal Support", value: `${testosteroneSupport}/100`, status: testosteroneSupport >= 65 ? "good" : testosteroneSupport >= 50 ? "warning" : "danger", icon: TrendingUp },
        { label: "Recovery Score", value: `${recoveryScore}/100`, status: recoveryScore >= 65 ? "good" : recoveryScore >= 50 ? "warning" : "danger", icon: Activity },
        { label: "Symptom Match", value: `${symptomMatch}%`, status: symptomMatch < 30 ? "good" : symptomMatch < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Supplement Safety", value: `${supplementSafety}%`, status: supplementSafety < 25 ? "good" : supplementSafety < 50 ? "warning" : "danger", icon: AlertTriangle },
      ],
      recommendations: [
        { title: "AI Deficiency Symptom Matching", description: `Current symptom pattern suggests ${symptomMatch < 30 ? "low" : symptomMatch < 55 ? "moderate" : "high"} zinc-deficiency alignment. Food-first correction is preferable before adding high supplemental doses.`, priority: "high", category: "Symptoms" },
        { title: "Vegetarian Phytate Correction", description: dietType === "veg" ? "Soaking, sprouting, and fermentation improve zinc absorption. Pair zinc-rich foods with lower-phytate meal patterns when possible." : "Animal-protein pattern already supports better zinc bioavailability.", priority: "medium", category: "Absorption" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { age, gender, dietType, frequentInfections, hairLoss, serumZinc, rda, estimatedIntake, bioavailability, effectiveIntake, immuneScore, testosteroneSupport, recoveryScore, supplementSafety, symptomMatch, finalScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Zinc Adequacy Meter", subtitle: "RDA vs effective intake", unit: "mg", values: [{ label: "Effective Intake", value: effectiveIntake, color: "bg-sky-500" }, { label: "RDA", value: rda, color: "bg-slate-500" }] },
        { title: "Immune Support Rating", subtitle: "Higher is better", values: [{ label: "Immune", value: immuneScore, color: bandClass(scoreToBand(immuneScore)) }, { label: "Recovery", value: recoveryScore, color: bandClass(scoreToBand(recoveryScore)) }] },
        { title: "Hormonal Support Index", subtitle: "Support probability", values: [{ label: "Hormonal", value: testosteroneSupport, color: testosteroneSupport >= 65 ? "bg-emerald-500" : testosteroneSupport >= 50 ? "bg-amber-500" : "bg-rose-500" }] },
      ],
      research: buildResearchPayload("Zinc Intake Calculator", snapshot.tags, snapshot, { rda, effectiveIntake, bioavailability, immuneScore, testosteroneSupport, recoveryScore, supplementSafety, symptomMatch }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <SelectInput label="Diet Type" value={dietType} onChange={setDietType} options={[{ value: "veg", label: "Vegetarian" }, { value: "nonveg", label: "Non-Vegetarian" }]} />
      <SelectInput label="Frequent Infections" value={frequentInfections} onChange={setFrequentInfections} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Hair Loss" value={hairLoss} onChange={setHairLoss} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <NumInput label="Serum Zinc" value={serumZinc} onChange={setSerumZinc} min={40} max={150} suffix="mcg/dL" />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Zinc Intake Calculator" description="Immune and hormonal optimizer with phytate-aware bioavailability, symptom matching, recovery score, and supplement safety alert." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="zinc-intake-calculator" resultExtras={extra ? <NutritionResultExtras title="Zinc Intake Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Zinc Intake Calculator" description="Advanced zinc intake calculator for immune function, phytate correction, and hormonal support." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedVitaminCIntakeEstimator() {
  const [fruitVegServings, setFruitVegServings] = useState(4)
  const [smoking, setSmoking] = useState("no")
  const [stressLevel, setStressLevel] = useState(6)
  const [supplementUse, setSupplementUse] = useState(250)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = smoking === "yes" ? 125 : 90
    const smokingAdjustment = smoking === "yes" ? 35 : 0
    const intake = round0(fruitVegServings * 28 + supplementUse)
    const adequacy = round0((intake / rda) * 100)
    const antioxidantCapacity = clamp(round0(adequacy * 0.55 + fruitVegServings * 7 - stressLevel * 3), 5, 95)
    const collagenEstimate = clamp(round0(intake / 2.2), 0, 100)
    const recoverySpeed = clamp(round0(antioxidantCapacity * 0.55 + collagenEstimate * 0.35), 5, 95)
    const oxidativeStress = clamp(round0(stressLevel * 9 + (smoking === "yes" ? 18 : 0) - intake * 0.06), 0, 100)
    const infectionResistance = clamp(round0(antioxidantCapacity * 0.7 - oxidativeStress * 0.2 + 18), 5, 95)
    const finalScore = clamp(round0(100 - oxidativeStress * 0.4 + antioxidantCapacity * 0.25), 5, 95)
    const band = scoreToBand(finalScore)
    const clinicalNote = `Vitamin C support is ${adequacy >= 100 ? "adequate" : "borderline"}. Smoking and chronic stress can materially raise antioxidant demand even when nominal intake looks acceptable.`

    const snapshot = createSnapshot({
      toolId: "vitamin-c-intake",
      toolName: "Vitamin C Intake Estimator",
      healthScore: finalScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(finalScore + 5), 0, 100),
      projection1Year: clamp(round0(finalScore + 8), 0, 100),
      tags: [adequacy < 100 ? "deficiency-risk" : "antioxidant-support", smoking === "yes" ? "smoking-adjustment" : "recovery-support"],
      domain: "immune",
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Vitamin C Adequacy", value: `${adequacy}%`, status: toStatus(band), description: `${intake} mg vs ${rda} mg`, icon: Apple },
      healthScore: finalScore,
      metrics: [
        { label: "RDA Comparison", value: `${intake}/${rda} mg`, status: adequacy >= 100 ? "good" : "warning", icon: Shield },
        { label: "Smoking Adjustment", value: `+${smokingAdjustment} mg`, status: smoking === "yes" ? "warning" : "good", icon: AlertTriangle },
        { label: "Antioxidant Capacity", value: `${antioxidantCapacity}/100`, status: antioxidantCapacity >= 70 ? "good" : antioxidantCapacity >= 50 ? "warning" : "danger", icon: Sparkles },
        { label: "Collagen Synthesis", value: `${collagenEstimate}%`, status: collagenEstimate >= 60 ? "good" : collagenEstimate >= 40 ? "warning" : "danger", icon: Activity },
        { label: "Recovery Speed", value: `${recoverySpeed}/100`, status: recoverySpeed >= 65 ? "good" : recoverySpeed >= 50 ? "warning" : "danger", icon: TrendingUp },
        { label: "Oxidative Stress", value: `${oxidativeStress}%`, status: oxidativeStress < 30 ? "good" : oxidativeStress < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Infection Resistance", value: `${infectionResistance}/100`, status: infectionResistance >= 65 ? "good" : infectionResistance >= 50 ? "warning" : "danger", icon: Heart },
      ],
      recommendations: [
        { title: "AI Oxidative Stress Model", description: `Stress and smoking push antioxidant demand upward. Increase colorful fruit and vegetable density before relying only on pills when oxidative stress stays high.`, priority: "high", category: "Oxidative Stress" },
        { title: "Collagen And Recovery", description: `Current model suggests ${collagenEstimate}% collagen support and ${recoverySpeed}/100 recovery speed. Pair vitamin C with protein-rich meals if tissue repair is a goal.`, priority: "medium", category: "Recovery" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { fruitVegServings, smoking, stressLevel, supplementUse, rda, smokingAdjustment, intake, adequacy, antioxidantCapacity, collagenEstimate, recoverySpeed, oxidativeStress, infectionResistance, finalScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Adequacy Meter", subtitle: "Vitamin C intake vs target", unit: "mg", values: [{ label: "Intake", value: intake, color: "bg-sky-500" }, { label: "RDA", value: rda, color: "bg-slate-500" }] },
        { title: "Immune Strength Indicator", subtitle: "Antioxidant and infection support", values: [{ label: "Antioxidant", value: antioxidantCapacity, color: bandClass(scoreToBand(antioxidantCapacity)) }, { label: "Infection Resistance", value: infectionResistance, color: bandClass(scoreToBand(infectionResistance)) }] },
        { title: "Stress Overlay", subtitle: "Oxidative stress vs recovery", values: [{ label: "Stress Load", value: oxidativeStress, color: oxidativeStress < 30 ? "bg-emerald-500" : oxidativeStress < 55 ? "bg-amber-500" : "bg-rose-500" }, { label: "Recovery", value: recoverySpeed, color: bandClass(scoreToBand(recoverySpeed)) }] },
      ],
      research: buildResearchPayload("Vitamin C Intake Estimator", snapshot.tags, snapshot, { rda, smokingAdjustment, intake, adequacy, antioxidantCapacity, collagenEstimate, recoverySpeed, oxidativeStress, infectionResistance }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Fruit/Vegetable Intake" value={fruitVegServings} onChange={setFruitVegServings} min={0} max={15} step={1} suffix="servings/day" />
      <SelectInput label="Smoking Status" value={smoking} onChange={setSmoking} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <NumInput label="Stress Level" value={stressLevel} onChange={setStressLevel} min={1} max={10} step={1} suffix="/10" />
      <NumInput label="Supplement Use" value={supplementUse} onChange={setSupplementUse} min={0} max={2000} step={50} suffix="mg" />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Vitamin C Intake Estimator" description="Oxidative stress analyzer with smoking correction, antioxidant capacity, collagen synthesis, recovery prediction, and infection resistance modelling." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="vitamin-c-intake" resultExtras={extra ? <NutritionResultExtras title="Vitamin C Intake Estimator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Vitamin C Intake Estimator" description="Advanced vitamin C intake estimator with antioxidant, collagen, recovery, and smoking-adjusted analysis." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedVitaminB12Calculator() {
  const [age, setAge] = useState(47)
  const [dietType, setDietType] = useState("vegetarian")
  const [metforminUse, setMetforminUse] = useState("yes")
  const [serumB12, setSerumB12] = useState(320)
  const [neuropathySymptoms, setNeuropathySymptoms] = useState("mild")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = 2.4
    const intake = dietType === "vegan" ? 0.5 : dietType === "vegetarian" ? 1.4 : 4.2
    const absorption = clamp(round1((age > 60 ? 0.55 : 0.8) - (metforminUse === "yes" ? 0.15 : 0)), 0.2, 0.95)
    const effectiveIntake = round2(intake * absorption)
    const anemiaRisk = clamp(round0((serumB12 < 250 ? 28 : 10) + (effectiveIntake < rda ? 22 : 6) + (metforminUse === "yes" ? 12 : 0)), 0, 100)
    const neuroRisk = clamp(round0((serumB12 < 250 ? 36 : serumB12 < 350 ? 18 : 6) + (neuropathySymptoms === "moderate" ? 24 : neuropathySymptoms === "mild" ? 12 : 0)), 0, 100)
    const homocysteineImpact = clamp(round0((rda - effectiveIntake) * 18 + (serumB12 < 300 ? 14 : 4)), 0, 100)
    const cognitiveProjection = clamp(round0(neuroRisk * 0.7 + homocysteineImpact * 0.2), 0, 100)
    const purple = serumB12 < 180 || neuropathySymptoms === "moderate"
    const score = clamp(round0(100 - anemiaRisk * 0.35 - neuroRisk * 0.4 - homocysteineImpact * 0.15), 5, 95)
    const band = scoreToBand(score, purple)
    const clinicalNote = `B12 pattern suggests ${purple ? "clinical review" : effectiveIntake >= rda ? "adequate support" : "borderline intake"}. Vegetarians, elderly adults, and metformin users deserve more aggressive screening when symptoms appear.`

    const snapshot = createSnapshot({
      toolId: "vitamin-b12-intake",
      toolName: "Vitamin B12 Calculator",
      healthScore: purple ? Math.min(score, 40) : score,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(score + 6), 0, 100),
      projection1Year: clamp(round0(score + 10), 0, 100),
      tags: [band === "Purple" ? "clinical-supervision" : "neurology-support", effectiveIntake < rda ? "deficiency-risk" : "anemia-screen"],
      domain: "micronutrient",
      serumMarker: serumB12,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "B12 Adequacy", value: `${round0(effectiveIntake / rda * 100)}%`, status: toStatus(band), description: `${effectiveIntake} mcg effective`, icon: Brain },
      healthScore: snapshot.healthScore,
      metrics: [
        { label: "RDA Comparison", value: `${effectiveIntake}/${rda} mcg`, status: effectiveIntake >= rda ? "good" : "warning", icon: Shield },
        { label: "Absorption Probability", value: `${round0(absorption * 100)}%`, status: absorption >= 0.7 ? "good" : absorption >= 0.5 ? "warning" : "danger", icon: Activity },
        { label: "Anemia Risk", value: `${anemiaRisk}%`, status: anemiaRisk < 30 ? "good" : anemiaRisk < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Neurological Risk", value: `${neuroRisk}%`, status: neuroRisk < 30 ? "good" : neuroRisk < 55 ? "warning" : "danger", icon: Brain },
        { label: "Homocysteine Impact", value: `${homocysteineImpact}%`, status: homocysteineImpact < 30 ? "good" : homocysteineImpact < 55 ? "warning" : "danger", icon: Heart },
        { label: "Cognitive Projection", value: `${cognitiveProjection}%`, status: cognitiveProjection < 30 ? "good" : cognitiveProjection < 55 ? "warning" : "danger", icon: TrendingUp },
      ],
      recommendations: [
        { title: "AI Neuropathy Alert", description: band === "Purple" ? "Neuropathy or very low B12 marker suggests clinician-guided evaluation instead of self-correcting alone." : "Current model does not force urgent neurological escalation, but symptoms still deserve monitoring.", priority: "high", category: "Neurology" },
        { title: "Metformin And Age Factor", description: metforminUse === "yes" ? "Metformin reduces B12 absorption over time. Consider more consistent B12 exposure and periodic serum review." : "No metformin-related B12 penalty applied.", priority: "medium", category: "Absorption" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { age, dietType, metforminUse, serumB12, neuropathySymptoms, rda, intake, absorption, effectiveIntake, anemiaRisk, neuroRisk, homocysteineImpact, cognitiveProjection, score },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "B12 Adequacy Meter", subtitle: "Effective intake vs RDA", unit: "mcg", values: [{ label: "Effective", value: effectiveIntake, color: "bg-sky-500" }, { label: "RDA", value: rda, color: "bg-slate-500" }] },
        { title: "Nerve Protection Score", subtitle: "Lower neuro risk is better", values: [{ label: "Neuro Risk", value: neuroRisk, color: neuroRisk < 30 ? "bg-emerald-500" : neuroRisk < 55 ? "bg-amber-500" : bandClass(band) }, { label: "Anemia Risk", value: anemiaRisk, color: anemiaRisk < 30 ? "bg-emerald-500" : anemiaRisk < 55 ? "bg-amber-500" : "bg-rose-500" }] },
        { title: "Fatigue Overlay", subtitle: "Serum marker and cognitive drift", values: [{ label: "Serum B12", value: serumB12, color: "bg-sky-500" }, { label: "Cognitive Risk", value: cognitiveProjection, color: cognitiveProjection < 30 ? "bg-emerald-500" : cognitiveProjection < 55 ? "bg-amber-500" : bandClass(band) }] },
      ],
      research: buildResearchPayload("Vitamin B12 Calculator", snapshot.tags, snapshot, { rda, effectiveIntake, absorption, anemiaRisk, neuroRisk, homocysteineImpact, cognitiveProjection }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Diet Type" value={dietType} onChange={setDietType} options={[{ value: "vegan", label: "Vegan" }, { value: "vegetarian", label: "Vegetarian" }, { value: "mixed", label: "Mixed" }]} />
      <SelectInput label="Metformin Use" value={metforminUse} onChange={setMetforminUse} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <NumInput label="Serum B12" value={serumB12} onChange={setSerumB12} min={80} max={1200} suffix="pg/mL" />
      <SelectInput label="Neuropathy Symptoms" value={neuropathySymptoms} onChange={setNeuropathySymptoms} options={[{ value: "none", label: "None" }, { value: "mild", label: "Mild" }, { value: "moderate", label: "Moderate" }]} />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Vitamin B12 Calculator" description="Neurological protection engine with absorption probability, anemia risk, neuropathy alert, homocysteine impact, and cognitive risk projection." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="vitamin-b12-intake" resultExtras={extra ? <NutritionResultExtras title="Vitamin B12 Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Vitamin B12 Calculator" description="Advanced B12 calculator with absorption, anemia, neuropathy, and cognitive risk analysis." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedFolateIntakeCalculator() {
  const [age, setAge] = useState(28)
  const [pregnancy, setPregnancy] = useState("yes")
  const [diet, setDiet] = useState("average")
  const [serumFolate, setSerumFolate] = useState(7)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = pregnancy === "yes" ? 600 : 400
    const dietIntake = diet === "rich" ? 520 : diet === "average" ? 360 : 230
    const adequacy = round0((dietIntake / rda) * 100)
    const ntdRisk = clamp(round0((pregnancy === "yes" ? 22 : 6) + (dietIntake < rda ? 24 : 8) + (serumFolate < 6 ? 26 : serumFolate < 10 ? 14 : 4)), 0, 100)
    const homocysteineCorrection = clamp(round0(adequacy * 0.75 + serumFolate * 3.2), 5, 95)
    const anemiaInteraction = clamp(round0((serumFolate < 6 ? 28 : 10) + (dietIntake < rda ? 18 : 6)), 0, 100)
    const pregnancySafety = clamp(round0(100 - ntdRisk * 0.45 + homocysteineCorrection * 0.15), 5, 95)
    const purple = pregnancy === "yes" && serumFolate < 5
    const band = scoreToBand(pregnancySafety, purple)
    const clinicalNote = `Folate support is ${adequacy >= 100 ? "adequate" : "below prenatal preference"}. Pregnancy planning or active pregnancy warrants tighter folate adequacy because neural tube risk is time-sensitive.`

    const snapshot = createSnapshot({
      toolId: "folate-intake-calculator",
      toolName: "Folate Intake Calculator",
      healthScore: purple ? Math.min(pregnancySafety, 42) : pregnancySafety,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(pregnancySafety + 5), 0, 100),
      projection1Year: clamp(round0(pregnancySafety + 8), 0, 100),
      tags: [pregnancy === "yes" ? "prenatal-support" : "folate-balance", adequacy < 100 ? "deficiency-risk" : "homocysteine-support"],
      domain: "micronutrient",
      serumMarker: serumFolate,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Folate Adequacy", value: `${adequacy}%`, status: toStatus(band), description: `${dietIntake} mcg vs ${rda} mcg`, icon: Heart },
      healthScore: snapshot.healthScore,
      metrics: [
        { label: "RDA Comparison", value: `${dietIntake}/${rda} mcg`, status: adequacy >= 100 ? "good" : "warning", icon: Shield },
        { label: "Pregnancy Adjustment", value: `${rda} mcg`, status: pregnancy === "yes" ? "warning" : "good", icon: Apple },
        { label: "NTD Risk", value: `${ntdRisk}%`, status: ntdRisk < 25 ? "good" : ntdRisk < 50 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Homocysteine Correction", value: `${homocysteineCorrection}/100`, status: homocysteineCorrection >= 65 ? "good" : homocysteineCorrection >= 50 ? "warning" : "danger", icon: TrendingUp },
        { label: "Anemia Interaction", value: `${anemiaInteraction}%`, status: anemiaInteraction < 30 ? "good" : anemiaInteraction < 55 ? "warning" : "danger", icon: Activity },
        { label: "Pregnancy Safety", value: `${pregnancySafety}/100`, status: toStatus(band), icon: Shield },
      ],
      recommendations: [
        { title: "AI Prenatal Alert", description: band === "Purple" ? "Clinical supervision advised because pregnancy safety and serum folate suggest a stronger prenatal folate correction is needed." : "Prenatal folate remains worth keeping above the minimum threshold before and during early pregnancy.", priority: "high", category: "Prenatal" },
        { title: "Homocysteine Support", description: `Correction index is ${homocysteineCorrection}/100. Higher folate adequacy usually improves methylation support and reduces homocysteine-related vascular pressure.`, priority: "medium", category: "Cardiovascular" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { age, pregnancy, diet, serumFolate, rda, dietIntake, adequacy, ntdRisk, homocysteineCorrection, anemiaInteraction, pregnancySafety },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Adequacy Meter", subtitle: "Intake vs target", unit: "mcg", values: [{ label: "Intake", value: dietIntake, color: "bg-sky-500" }, { label: "RDA", value: rda, color: "bg-slate-500" }] },
        { title: "Pregnancy Safety Score", subtitle: "Higher is better", values: [{ label: "Safety", value: pregnancySafety, color: bandClass(band) }, { label: "NTD Risk", value: ntdRisk, color: ntdRisk < 25 ? "bg-emerald-500" : ntdRisk < 50 ? "bg-amber-500" : bandClass(band) }] },
        { title: "Consistency Trend", subtitle: "Folate support proxy", values: [{ label: "Serum", value: serumFolate * 10, color: "bg-emerald-500" }, { label: "Homocysteine Correction", value: homocysteineCorrection, color: "bg-sky-500" }] },
      ],
      research: buildResearchPayload("Folate Intake Calculator", snapshot.tags, snapshot, { rda, dietIntake, adequacy, ntdRisk, homocysteineCorrection, anemiaInteraction, pregnancySafety }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={50} suffix="yrs" />
      <SelectInput label="Pregnancy Status" value={pregnancy} onChange={setPregnancy} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Diet" value={diet} onChange={setDiet} options={[{ value: "poor", label: "Low Folate Diet" }, { value: "average", label: "Average" }, { value: "rich", label: "Folate-Rich" }]} />
      <NumInput label="Serum Folate" value={serumFolate} onChange={setSerumFolate} min={2} max={30} step={0.1} suffix="ng/mL" />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Folate Intake Calculator" description="DNA and pregnancy support module with prenatal adjustment, neural tube risk estimate, homocysteine correction, and anemia interaction modelling." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="folate-intake-calculator" resultExtras={extra ? <NutritionResultExtras title="Folate Intake Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Folate Intake Calculator" description="Advanced folate calculator with prenatal safety, homocysteine support, and anemia interaction analysis." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedProteinTimingOptimizer() {
  const [weight, setWeight] = useState(78)
  const [trainingTime, setTrainingTime] = useState(18)
  const [totalProtein, setTotalProtein] = useState(150)
  const [age, setAge] = useState(38)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const perMealProtein = round1(clamp(weight * (age > 55 ? 0.45 : 0.35), 20, 55))
    const meals = clamp(round0(totalProtein / perMealProtein), 3, 6)
    const leucineThreshold = round1(perMealProtein * 0.09)
    const mpsSpikeDuration = round1(2.5 + perMealProtein / 25)
    const sarcopeniaTiming = clamp(round0((age > 60 ? 28 : 12) + (perMealProtein < weight * 0.3 ? 18 : 6)), 0, 100)
    const nightProteinScore = clamp(round0((totalProtein / weight) * 25 + (trainingTime >= 17 ? 14 : 6)), 5, 95)
    const scheduleScore = clamp(round0(100 - sarcopeniaTiming * 0.35 + nightProteinScore * 0.25), 5, 95)
    const band = scoreToBand(scheduleScore)
    const clinicalNote = `Protein timing plan supports ${meals} anchor meals at roughly ${perMealProtein} g each. Older age increases the need to hit stronger per-meal protein doses to protect muscle protein synthesis.`

    const snapshot = createSnapshot({
      toolId: "protein-timing-calculator",
      toolName: "Protein Timing Optimizer",
      healthScore: scheduleScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(scheduleScore + 6), 0, 100),
      projection1Year: clamp(round0(scheduleScore + 9), 0, 100),
      tags: [scheduleScore < 58 ? "timing-risk" : "mps-support", age > 55 ? "sarcopenia-prevention" : "performance-support"],
      domain: "recovery",
      weightKg: weight,
      proteinG: totalProtein,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Per Meal Protein", value: `${perMealProtein} g`, status: toStatus(band), description: `${meals} structured meals/day`, icon: Beef },
      healthScore: scheduleScore,
      metrics: [
        { label: "Per Meal Protein", value: `${perMealProtein} g`, status: perMealProtein >= weight * 0.3 ? "good" : "warning", icon: Shield },
        { label: "Leucine Threshold", value: `${leucineThreshold} g`, status: leucineThreshold >= 2.5 ? "good" : "warning", icon: Zap },
        { label: "MPS Spike Duration", value: `${mpsSpikeDuration} hrs`, status: "good", icon: Activity },
        { label: "Sarcopenia Timing", value: `${sarcopeniaTiming}%`, status: sarcopeniaTiming < 30 ? "good" : sarcopeniaTiming < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Night Protein", value: `${nightProteinScore}/100`, status: nightProteinScore >= 65 ? "good" : nightProteinScore >= 50 ? "warning" : "danger", icon: Moon },
      ],
      recommendations: [
        { title: "AI Meal Scheduling", description: `Distribute protein across ${meals} feedings and anchor one protein-rich meal after training. Older users should bias toward the upper end of the per-meal range.`, priority: "high", category: "Scheduling" },
        { title: "Night Protein Optimization", description: `A late-day protein feeding can support overnight muscle retention, especially when training occurs in the evening or age-related anabolic resistance is a concern.`, priority: "medium", category: "Recovery" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, trainingTime, totalProtein, age, perMealProtein, meals, leucineThreshold, mpsSpikeDuration, sarcopeniaTiming, nightProteinScore, scheduleScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Protein Timing Timeline", subtitle: "Structured meal dosing", unit: "g", values: Array.from({ length: meals }, (_, index) => ({ label: `Meal ${index + 1}`, value: perMealProtein, color: index === meals - 1 ? "bg-amber-500" : "bg-sky-500" })) },
        { title: "Anabolic Window", subtitle: "MPS support markers", values: [{ label: "Leucine", value: leucineThreshold, color: leucineThreshold >= 2.5 ? "bg-emerald-500" : "bg-amber-500" }, { label: "MPS Hours", value: mpsSpikeDuration, color: "bg-sky-500" }] },
        { title: "Lean Mass Progression Proxy", subtitle: "Risk versus support", values: [{ label: "Night Support", value: nightProteinScore, color: bandClass(scoreToBand(nightProteinScore)) }, { label: "Sarcopenia Timing", value: sarcopeniaTiming, color: sarcopeniaTiming < 30 ? "bg-emerald-500" : sarcopeniaTiming < 55 ? "bg-amber-500" : "bg-rose-500" }] },
      ],
      research: buildResearchPayload("Protein Timing Optimizer", snapshot.tags, snapshot, { perMealProtein, meals, leucineThreshold, mpsSpikeDuration, sarcopeniaTiming, nightProteinScore, scheduleScore }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <NumInput label="Training Time" value={trainingTime} onChange={setTrainingTime} min={5} max={22} step={1} suffix="24h" />
      <NumInput label="Total Protein Intake" value={totalProtein} onChange={setTotalProtein} min={40} max={280} suffix="g/day" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Protein Timing Optimizer" description="Muscle synthesis scheduler with per-meal protein targets, leucine threshold, anabolic timing, sarcopenia prevention, and night protein optimization." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="protein-timing-calculator" resultExtras={extra ? <NutritionResultExtras title="Protein Timing Optimizer" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Protein Timing Optimizer" description="Advanced protein timing optimizer for MPS scheduling, leucine threshold, and sarcopenia prevention." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedPreWorkoutNutritionPlanner() {
  const [workoutType, setWorkoutType] = useState("strength")
  const [duration, setDuration] = useState(75)
  const [bodyWeight, setBodyWeight] = useState(78)
  const [goal, setGoal] = useState("performance")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const carbMultiplier = workoutType === "endurance" ? 1.2 : workoutType === "mixed" ? 0.8 : 0.55
    const carbLoading = round0(bodyWeight * carbMultiplier)
    const proteinAmount = round0(bodyWeight * 0.22)
    const fluidNeed = round0(bodyWeight * 6 + duration * 3)
    const glycogenStatus = clamp(round0(52 + duration * 0.25 + (goal === "performance" ? 12 : 4)), 5, 95)
    const performancePrediction = clamp(round0(glycogenStatus * 0.6 + carbLoading * 0.15 - (goal === "fatLoss" ? 8 : 0)), 5, 95)
    const giSelection = workoutType === "endurance" ? "Medium-High GI carbs 60-120 min pre-session" : "Moderate GI carbs with light fiber 60-90 min pre-session"
    const readiness = clamp(round0(performancePrediction * 0.7 + 20), 5, 95)
    const band = scoreToBand(readiness)
    const clinicalNote = `Pre-workout fueling suggests ${carbLoading} g carbs, ${proteinAmount} g protein, and ${fluidNeed} mL fluid. Match GI choice to session type rather than using the same meal for every workout.`

    const snapshot = createSnapshot({
      toolId: "pre-workout-nutrition",
      toolName: "Pre-Workout Nutrition Planner",
      healthScore: readiness,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(readiness + 5), 0, 100),
      projection1Year: clamp(round0(readiness + 8), 0, 100),
      tags: [readiness < 58 ? "fueling-risk" : "performance-support", workoutType === "endurance" ? "glycogen-support" : "training-fuel"],
      domain: "performance",
      weightKg: bodyWeight,
      carbsG: carbLoading,
      proteinG: proteinAmount,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Fuel Readiness", value: `${readiness}/100`, status: toStatus(band), description: `${carbLoading} g carbs pre-workout`, icon: Zap },
      healthScore: readiness,
      metrics: [
        { label: "Carb Loading", value: `${carbLoading} g`, status: "good", icon: Apple },
        { label: "Protein Amount", value: `${proteinAmount} g`, status: "good", icon: Beef },
        { label: "Fluid Need", value: `${fluidNeed} mL`, status: "good", icon: Droplets },
        { label: "Glycogen Status", value: `${glycogenStatus}/100`, status: glycogenStatus >= 65 ? "good" : glycogenStatus >= 50 ? "warning" : "danger", icon: Activity },
        { label: "Performance Prediction", value: `${performancePrediction}/100`, status: performancePrediction >= 65 ? "good" : performancePrediction >= 50 ? "warning" : "danger", icon: TrendingUp },
      ],
      recommendations: [
        { title: "AI Workout-Type Adaptation", description: `Use ${giSelection}. Endurance sessions tolerate a larger carb dose, while shorter strength sessions often perform better with lighter pre-training stomach load.`, priority: "high", category: "Fueling" },
        { title: "Hydration Timing", description: `Take most of the ${fluidNeed} mL in the 90 minutes before training rather than all at once immediately before the session.`, priority: "medium", category: "Hydration" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { workoutType, duration, bodyWeight, goal, carbLoading, proteinAmount, fluidNeed, glycogenStatus, performancePrediction, readiness, giSelection },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Fuel Readiness Meter", subtitle: "Readiness score", values: [{ label: "Readiness", value: readiness, color: bandClass(band) }, { label: "Performance", value: performancePrediction, color: bandClass(scoreToBand(performancePrediction)) }] },
        { title: "Carb Timing Chart", subtitle: "Pre-workout macro plan", unit: "g", values: [{ label: "Carbs", value: carbLoading, color: "bg-sky-500" }, { label: "Protein", value: proteinAmount, color: "bg-amber-500" }] },
        { title: "Hydration Overlay", subtitle: "Fluid and glycogen", values: [{ label: "Fluid mL", value: fluidNeed, color: "bg-cyan-500" }, { label: "Glycogen Score", value: glycogenStatus, color: bandClass(scoreToBand(glycogenStatus)) }] },
      ],
      research: buildResearchPayload("Pre-Workout Nutrition Planner", snapshot.tags, snapshot, { carbLoading, proteinAmount, fluidNeed, glycogenStatus, performancePrediction, readiness, giSelection }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectInput label="Workout Type" value={workoutType} onChange={setWorkoutType} options={[{ value: "strength", label: "Strength" }, { value: "mixed", label: "Mixed" }, { value: "endurance", label: "Endurance" }]} />
      <NumInput label="Duration" value={duration} onChange={setDuration} min={20} max={240} step={5} suffix="min" />
      <NumInput label="Body Weight" value={bodyWeight} onChange={setBodyWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "performance", label: "Performance" }, { value: "muscle", label: "Muscle Gain" }]} />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Pre-Workout Nutrition Planner" description="Performance fuel model with carb loading, protein, fluid need, glycogen readiness, and workout-specific GI adaptation." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="pre-workout-nutrition" resultExtras={extra ? <NutritionResultExtras title="Pre-Workout Nutrition Planner" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Pre-Workout Nutrition Planner" description="Advanced pre-workout planner with fuel readiness, carb timing, hydration, and performance prediction." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedPostWorkoutNutritionGuide() {
  const [intensity, setIntensity] = useState("high")
  const [bodyWeight, setBodyWeight] = useState(78)
  const [proteinIntake, setProteinIntake] = useState(28)
  const [carbIntake, setCarbIntake] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const proteinRequirement = round0(bodyWeight * 0.3)
    const carbRequirement = round1(bodyWeight * (intensity === "high" ? 1.2 : intensity === "moderate" ? 1.0 : 0.8))
    const proteinGap = Math.max(0, proteinRequirement - proteinIntake)
    const carbGap = Math.max(0, carbRequirement - carbIntake)
    const domsReduction = clamp(round0(65 - proteinGap * 6 - carbGap * 1.2), 0, 100)
    const recoveryTime = round1(Math.max(8, 30 - domsReduction * 0.18 + proteinGap * 0.8))
    const electrolyteRestoration = clamp(round0(58 + (intensity === "high" ? 18 : 8) - proteinGap * 3), 5, 95)
    const recoveryScore = clamp(round0(100 - proteinGap * 7 - carbGap * 1.8 + electrolyteRestoration * 0.2), 5, 95)
    const band = scoreToBand(recoveryScore)
    const clinicalNote = `Post-workout nutrition is ${proteinGap === 0 && carbGap === 0 ? "on target" : "under target"}. Glycogen restoration and protein repair both matter for recovery speed, especially after harder sessions.`

    const snapshot = createSnapshot({
      toolId: "post-workout-nutrition",
      toolName: "Post-Workout Nutrition Guide",
      healthScore: recoveryScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(recoveryScore + 6), 0, 100),
      projection1Year: clamp(round0(recoveryScore + 8), 0, 100),
      tags: [recoveryScore < 58 ? "recovery-risk" : "muscle-repair", intensity === "high" ? "glycogen-repletion" : "rehab-support"],
      domain: "recovery",
      weightKg: bodyWeight,
      proteinG: proteinIntake,
      carbsG: carbIntake,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Recovery Meter", value: `${recoveryScore}/100`, status: toStatus(band), description: `Protein ${proteinRequirement} g, carbs ${carbRequirement} g`, icon: Activity },
      healthScore: recoveryScore,
      metrics: [
        { label: "Protein Requirement", value: `${proteinRequirement} g`, status: proteinGap === 0 ? "good" : "warning", icon: Beef },
        { label: "Carb Replenishment", value: `${carbRequirement} g`, status: carbGap === 0 ? "good" : "warning", icon: Apple },
        { label: "DOMS Reduction", value: `${domsReduction}%`, status: domsReduction >= 60 ? "good" : domsReduction >= 40 ? "warning" : "danger", icon: TrendingUp },
        { label: "Recovery Time", value: `${recoveryTime} hrs`, status: recoveryTime <= 16 ? "good" : recoveryTime <= 22 ? "warning" : "danger", icon: Clock3 },
        { label: "Electrolyte Restoration", value: `${electrolyteRestoration}/100`, status: electrolyteRestoration >= 65 ? "good" : electrolyteRestoration >= 50 ? "warning" : "danger", icon: Droplets },
      ],
      recommendations: [
        { title: "AI Recovery Score", description: `Current recovery score is ${recoveryScore}/100. Close the gaps in protein and carbs first before adding exotic recovery supplements.`, priority: "high", category: "Recovery" },
        { title: "Electrolyte Restoration", description: `Harder sessions raise electrolyte needs. Combine post-workout fueling with sodium and fluid replacement when sweat loss is meaningful.`, priority: "medium", category: "Electrolytes" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { intensity, bodyWeight, proteinIntake, carbIntake, proteinRequirement, carbRequirement, proteinGap, carbGap, domsReduction, recoveryTime, electrolyteRestoration, recoveryScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Recovery Meter", subtitle: "Overall restoration score", values: [{ label: "Recovery", value: recoveryScore, color: bandClass(band) }, { label: "DOMS Reduction", value: domsReduction, color: bandClass(scoreToBand(domsReduction)) }] },
        { title: "Muscle Repair Index", subtitle: "Requirement vs intake", unit: "g", values: [{ label: "Protein Need", value: proteinRequirement, color: "bg-slate-500" }, { label: "Protein Intake", value: proteinIntake, color: "bg-sky-500" }, { label: "Carb Need", value: carbRequirement, color: "bg-amber-500" }] },
        { title: "Workout Recovery Trend", subtitle: "Faster recovery is better", values: [{ label: "Recovery Hours", value: recoveryTime, color: recoveryTime <= 16 ? "bg-emerald-500" : recoveryTime <= 22 ? "bg-amber-500" : "bg-rose-500" }] },
      ],
      research: buildResearchPayload("Post-Workout Nutrition Guide", snapshot.tags, snapshot, { proteinRequirement, carbRequirement, proteinGap, carbGap, domsReduction, recoveryTime, electrolyteRestoration, recoveryScore }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectInput label="Workout Intensity" value={intensity} onChange={setIntensity} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
      <NumInput label="Body Weight" value={bodyWeight} onChange={setBodyWeight} min={35} max={220} suffix="kg" />
      <NumInput label="Protein Intake" value={proteinIntake} onChange={setProteinIntake} min={0} max={100} suffix="g" />
      <NumInput label="Carb Intake" value={carbIntake} onChange={setCarbIntake} min={0} max={200} suffix="g" />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Post-Workout Nutrition Guide" description="Recovery intelligence tool with protein requirement, carb replenishment, DOMS reduction, electrolyte restoration, and recovery-time prediction." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="post-workout-nutrition" resultExtras={extra ? <NutritionResultExtras title="Post-Workout Nutrition Guide" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Post-Workout Nutrition Guide" description="Advanced post-workout nutrition guide with muscle repair, glycogen restoration, DOMS, and recovery prediction." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedMealFrequencyCalculator() {
  const [totalCalories, setTotalCalories] = useState(2200)
  const [workHours, setWorkHours] = useState(9)
  const [fastingWindow, setFastingWindow] = useState(14)
  const [goal, setGoal] = useState("fatLoss")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const suggestedMeals = clamp(round0((totalCalories / 700) + (goal === "muscle" ? 1 : 0) - (fastingWindow >= 16 ? 1 : 0)), 2, 6)
    const insulinExposure = round1(suggestedMeals * 1.8)
    const metabolicFlexibility = clamp(round0(68 + (fastingWindow - 12) * 4 - (suggestedMeals - 3) * 6), 5, 95)
    const hungerHormone = clamp(round0(52 + (workHours > 10 ? 12 : 4) + (goal === "fatLoss" ? 10 : 0) - fastingWindow * 1.2), 0, 100)
    const circadianAlignment = clamp(round0(82 - Math.max(0, workHours - 9) * 6 - Math.max(0, suggestedMeals - 4) * 5), 5, 95)
    const hypoglycemiaRisk = clamp(round0((fastingWindow >= 16 ? 20 : 6) + (suggestedMeals <= 2 ? 16 : 6) + (goal === "fatLoss" ? 10 : 4)), 0, 100)
    const finalScore = clamp(round0(100 - hungerHormone * 0.25 - hypoglycemiaRisk * 0.3 + metabolicFlexibility * 0.25), 5, 95)
    const band = scoreToBand(finalScore)
    const clinicalNote = `Meal pattern suggests ${suggestedMeals} meals/day. Appetite control depends on total calories, schedule stress, and fasting duration together rather than meal count alone.`

    const snapshot = createSnapshot({
      toolId: "meal-frequency-calculator",
      toolName: "Meal Frequency Calculator",
      healthScore: finalScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(finalScore + 5), 0, 100),
      projection1Year: clamp(round0(finalScore + 8), 0, 100),
      tags: [finalScore < 58 ? "frequency-risk" : "circadian-support", hypoglycemiaRisk > 45 ? "hypoglycemia-watch" : "appetite-control"],
      domain: "cardiometabolic",
      calories: totalCalories,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Suggested Meals", value: `${suggestedMeals}/day`, status: toStatus(band), description: `${insulinExposure} hrs insulin exposure`, icon: Clock3 },
      healthScore: finalScore,
      metrics: [
        { label: "Meals / Day", value: suggestedMeals, status: "good", icon: Apple },
        { label: "Insulin Exposure", value: `${insulinExposure} hrs`, status: insulinExposure <= 7 ? "good" : insulinExposure <= 9 ? "warning" : "danger", icon: TrendingUp },
        { label: "Metabolic Flexibility", value: `${metabolicFlexibility}/100`, status: metabolicFlexibility >= 65 ? "good" : metabolicFlexibility >= 50 ? "warning" : "danger", icon: Activity },
        { label: "Hunger Hormone Model", value: `${hungerHormone}%`, status: hungerHormone < 35 ? "good" : hungerHormone < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Circadian Alignment", value: `${circadianAlignment}/100`, status: circadianAlignment >= 65 ? "good" : circadianAlignment >= 50 ? "warning" : "danger", icon: Moon },
        { label: "Hypoglycemia Alert", value: `${hypoglycemiaRisk}%`, status: hypoglycemiaRisk < 30 ? "good" : hypoglycemiaRisk < 55 ? "warning" : "danger", icon: AlertTriangle },
      ],
      recommendations: [
        { title: "AI Circadian Alignment", description: `Use ${suggestedMeals} meals within your current schedule. Larger eating windows or long workdays can justify slightly fewer, more structured meals instead of constant grazing.`, priority: "high", category: "Timing" },
        { title: "Appetite Control", description: `Hunger model is ${hungerHormone}%. If appetite is hard to control, increase meal protein and fiber before increasing meal count.`, priority: "medium", category: "Appetite" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { totalCalories, workHours, fastingWindow, goal, suggestedMeals, insulinExposure, metabolicFlexibility, hungerHormone, circadianAlignment, hypoglycemiaRisk, finalScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Meal Timing Timeline", subtitle: "Proposed frequency", unit: "meals", values: [{ label: "Suggested Meals", value: suggestedMeals, color: bandClass(band) }] },
        { title: "Hormonal Balance Score", subtitle: "Flexibility and hunger", values: [{ label: "Flexibility", value: metabolicFlexibility, color: bandClass(scoreToBand(metabolicFlexibility)) }, { label: "Hunger", value: hungerHormone, color: hungerHormone < 35 ? "bg-emerald-500" : hungerHormone < 55 ? "bg-amber-500" : "bg-rose-500" }] },
        { title: "Insulin Exposure", subtitle: "Lower can improve metabolic control", values: [{ label: "Exposure Hours", value: insulinExposure, color: insulinExposure <= 7 ? "bg-emerald-500" : insulinExposure <= 9 ? "bg-amber-500" : "bg-rose-500" }] },
      ],
      research: buildResearchPayload("Meal Frequency Calculator", snapshot.tags, snapshot, { suggestedMeals, insulinExposure, metabolicFlexibility, hungerHormone, circadianAlignment, hypoglycemiaRisk, finalScore }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Total Calories" value={totalCalories} onChange={setTotalCalories} min={1000} max={5000} step={50} suffix="kcal" />
      <NumInput label="Work Schedule" value={workHours} onChange={setWorkHours} min={4} max={16} step={1} suffix="hrs" />
      <NumInput label="Fasting Window" value={fastingWindow} onChange={setFastingWindow} min={10} max={20} step={1} suffix="hrs" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscle", label: "Muscle Gain" }]} />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Meal Frequency Calculator" description="Metabolic pattern analyzer with suggested meals per day, insulin exposure duration, hunger hormone model, circadian alignment, and hypoglycemia alert." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="meal-frequency-calculator" resultExtras={extra ? <NutritionResultExtras title="Meal Frequency Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Meal Frequency Calculator" description="Advanced meal frequency calculator with circadian alignment, insulin exposure, and hunger modelling." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedPortionSizeCalculator() {
  const [foodItem, setFoodItem] = useState("rice")
  const [calorieTarget, setCalorieTarget] = useState(450)
  const [goal, setGoal] = useState("fatLoss")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const densities: Record<string, { kcalPer100g: number; satiety: number; gl: number }> = {
      rice: { kcalPer100g: 130, satiety: 48, gl: 28 },
      pasta: { kcalPer100g: 157, satiety: 45, gl: 25 },
      chicken: { kcalPer100g: 165, satiety: 78, gl: 1 },
      nuts: { kcalPer100g: 610, satiety: 52, gl: 4 },
      salad: { kcalPer100g: 35, satiety: 72, gl: 3 },
      potato: { kcalPer100g: 86, satiety: 74, gl: 19 },
    }
    const profile = densities[foodItem]
    const portionGrams = round0((calorieTarget / profile.kcalPer100g) * 100)
    const calorieDensity = profile.kcalPer100g
    const overeatingProbability = clamp(round0((calorieDensity > 250 ? 30 : 10) + (goal === "fatLoss" ? 16 : 6) - profile.satiety * 0.2), 0, 100)
    const satietyScore = clamp(round0(profile.satiety - calorieDensity * 0.04 + (goal === "fatLoss" ? 8 : 0)), 5, 95)
    const glycemicLoadImpact = clamp(round0(profile.gl + (portionGrams / 100) * 4), 0, 100)
    const portionConsistency = clamp(round0(100 - overeatingProbability * 0.45 + satietyScore * 0.25), 5, 95)
    const band = scoreToBand(portionConsistency)
    const plateGuide = foodItem === "salad" ? "Half plate" : foodItem === "chicken" ? "Palm and a half" : portionGrams < 220 ? "One cupped hand" : "One and a half cupped hands"
    const clinicalNote = `Portion sizing for ${foodItem} suggests ${portionGrams} g for a ${calorieTarget} kcal target. Energy density and satiety determine whether that portion is easy to repeat consistently.`

    const snapshot = createSnapshot({
      toolId: "portion-size-calculator",
      toolName: "Portion Size Calculator",
      healthScore: portionConsistency,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(portionConsistency + 5), 0, 100),
      projection1Year: clamp(round0(portionConsistency + 8), 0, 100),
      tags: [portionConsistency < 58 ? "portion-risk" : "portion-control", goal === "fatLoss" ? "energy-density" : "performance-portion"],
      domain: "performance",
      calories: calorieTarget,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Portion Size", value: `${portionGrams} g`, status: toStatus(band), description: plateGuide, icon: Apple },
      healthScore: portionConsistency,
      metrics: [
        { label: "Portion Grams", value: `${portionGrams} g`, status: "good", icon: Shield },
        { label: "Calorie Density", value: `${calorieDensity} kcal/100g`, status: calorieDensity < 175 ? "good" : calorieDensity < 300 ? "warning" : "danger", icon: BarChart3 },
        { label: "Overeating Probability", value: `${overeatingProbability}%`, status: overeatingProbability < 30 ? "good" : overeatingProbability < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Satiety Score", value: `${satietyScore}/100`, status: satietyScore >= 65 ? "good" : satietyScore >= 50 ? "warning" : "danger", icon: Activity },
        { label: "Glycemic Load Impact", value: `${glycemicLoadImpact}`, status: glycemicLoadImpact < 20 ? "good" : glycemicLoadImpact < 35 ? "warning" : "danger", icon: TrendingUp },
        { label: "Consistency Score", value: `${portionConsistency}/100`, status: toStatus(band), icon: Heart },
      ],
      recommendations: [
        { title: "AI Plate Visualization", description: `Use ${plateGuide} as the practical portion image guide for ${foodItem}. Visual consistency usually works better than trying to micromanage every gram manually.`, priority: "high", category: "Visualization" },
        { title: "Behavioral Risk Alert", description: overeatingProbability >= 55 ? "High energy density or low satiety increases overeating risk. Add volume foods or lean protein to buffer appetite." : "Current food choice is compatible with portion control when plated deliberately.", priority: "medium", category: "Behavior" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { foodItem, calorieTarget, goal, portionGrams, calorieDensity, overeatingProbability, satietyScore, glycemicLoadImpact, portionConsistency, plateGuide },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Portion Size Guide", subtitle: "Target grams", unit: "g", values: [{ label: "Portion", value: portionGrams, color: "bg-sky-500" }] },
        { title: "Calorie Meter", subtitle: "Density and satiety", values: [{ label: "Density", value: calorieDensity, color: calorieDensity < 175 ? "bg-emerald-500" : calorieDensity < 300 ? "bg-amber-500" : "bg-rose-500" }, { label: "Satiety", value: satietyScore, color: bandClass(scoreToBand(satietyScore)) }] },
        { title: "Consistency Trend", subtitle: "Behavioral risk overlay", values: [{ label: "Consistency", value: portionConsistency, color: bandClass(band) }, { label: "Overeating", value: overeatingProbability, color: overeatingProbability < 30 ? "bg-emerald-500" : overeatingProbability < 55 ? "bg-amber-500" : "bg-rose-500" }] },
      ],
      research: buildResearchPayload("Portion Size Calculator", snapshot.tags, snapshot, { portionGrams, calorieDensity, overeatingProbability, satietyScore, glycemicLoadImpact, portionConsistency, plateGuide }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectInput label="Food Item" value={foodItem} onChange={setFoodItem} options={[{ value: "rice", label: "Rice" }, { value: "pasta", label: "Pasta" }, { value: "chicken", label: "Chicken" }, { value: "nuts", label: "Nuts" }, { value: "salad", label: "Salad" }, { value: "potato", label: "Potato" }]} />
      <NumInput label="Calorie Target" value={calorieTarget} onChange={setCalorieTarget} min={50} max={1200} step={10} suffix="kcal" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "performance", label: "Performance" }]} />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Portion Size Calculator" description="Energy density optimizer with portion grams, satiety score, overeating probability, glycemic impact, and AI plate visualization guidance." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="portion-size-calculator" resultExtras={extra ? <NutritionResultExtras title="Portion Size Calculator" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Portion Size Calculator" description="Advanced portion size calculator with energy density, satiety, behavioral risk, and visual plate guidance." categoryName="Nutrition & Calorie Tracking" />} />
}

export function AdvancedMicronutrientTracker() {
  const [foodLogScore, setFoodLogScore] = useState(68)
  const [supplementCount, setSupplementCount] = useState(2)
  const [labFlags, setLabFlags] = useState(1)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const vitaminScore = clamp(round0(foodLogScore * 0.75 + supplementCount * 4), 5, 100)
    const mineralScore = clamp(round0(foodLogScore * 0.68 + supplementCount * 5 - labFlags * 8), 5, 100)
    const deficiencyClustering = clamp(round0(100 - (vitaminScore + mineralScore) / 2 + labFlags * 16), 0, 100)
    const toxicityRisk = clamp(round0(supplementCount * 12 + Math.max(0, foodLogScore - 90) * 0.4), 0, 100)
    const immuneScore = clamp(round0(vitaminScore * 0.55 + mineralScore * 0.2), 5, 100)
    const boneScore = clamp(round0(mineralScore * 0.55 + vitaminScore * 0.15), 5, 100)
    const cognitiveScore = clamp(round0(vitaminScore * 0.35 + mineralScore * 0.35 - labFlags * 6), 5, 100)
    const performanceScore = clamp(round0(foodLogScore * 0.5 + mineralScore * 0.3), 5, 100)
    const nutritionScore = clamp(round0(100 - deficiencyClustering * 0.35 - toxicityRisk * 0.18 + (immuneScore + boneScore + cognitiveScore + performanceScore) * 0.08), 5, 95)
    const purple = labFlags >= 4 || (toxicityRisk > 70 && deficiencyClustering > 55)
    const band = scoreToBand(nutritionScore, purple)
    const clinicalNote = `Micronutrient pattern shows ${deficiencyClustering < 30 ? "limited clustering" : deficiencyClustering < 55 ? "moderate clustering" : "high clustering"} of nutrition risk. Food quality, supplement density, and abnormal labs need to be interpreted together.`

    const snapshot = createSnapshot({
      toolId: "micronutrient-tracker",
      toolName: "Micronutrient Tracker",
      healthScore: purple ? Math.min(nutritionScore, 38) : nutritionScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(nutritionScore + 6), 0, 100),
      projection1Year: clamp(round0(nutritionScore + 10), 0, 100),
      tags: [purple ? "clinical-supervision" : "nutrient-balance", deficiencyClustering > 50 ? "deficiency-risk" : "research-profile"],
      domain: "micronutrient",
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Global Nutrition Score", value: `${snapshot.healthScore}/100`, status: toStatus(band), description: `${band} risk profile`, icon: Brain },
      healthScore: snapshot.healthScore,
      metrics: [
        { label: "% RDA Vitamins", value: `${vitaminScore}%`, status: vitaminScore >= 70 ? "good" : vitaminScore >= 50 ? "warning" : "danger", icon: Apple },
        { label: "% RDA Minerals", value: `${mineralScore}%`, status: mineralScore >= 70 ? "good" : mineralScore >= 50 ? "warning" : "danger", icon: Shield },
        { label: "Deficiency Clustering", value: `${deficiencyClustering}%`, status: deficiencyClustering < 30 ? "good" : deficiencyClustering < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Toxicity Risk", value: `${toxicityRisk}%`, status: toxicityRisk < 25 ? "good" : toxicityRisk < 50 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Immune Score", value: `${immuneScore}/100`, status: immuneScore >= 65 ? "good" : immuneScore >= 50 ? "warning" : "danger", icon: Heart },
        { label: "Bone Score", value: `${boneScore}/100`, status: boneScore >= 65 ? "good" : boneScore >= 50 ? "warning" : "danger", icon: Activity },
        { label: "Cognitive Score", value: `${cognitiveScore}/100`, status: cognitiveScore >= 65 ? "good" : cognitiveScore >= 50 ? "warning" : "danger", icon: Brain },
        { label: "Performance Index", value: `${performanceScore}/100`, status: performanceScore >= 65 ? "good" : performanceScore >= 50 ? "warning" : "danger", icon: TrendingUp },
      ],
      recommendations: [
        { title: "AI Deficiency Prediction", description: deficiencyClustering >= 55 ? "Deficiency cluster signal is high. Re-check dietary diversity before layering more supplements on top." : "Current diet pattern does not show a heavy deficiency cluster, but lab-driven blind spots can still exist.", priority: "high", category: "Deficiency" },
        { title: "Interaction Matrix", description: `Nutrition system scores are Immune ${immuneScore}, Bone ${boneScore}, Cognitive ${cognitiveScore}, Performance ${performanceScore}. Use these domains to prioritize the next interventions instead of chasing every nutrient equally.`, priority: "medium", category: "Integration" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { foodLogScore, supplementCount, labFlags, vitaminScore, mineralScore, deficiencyClustering, toxicityRisk, immuneScore, boneScore, cognitiveScore, performanceScore, nutritionScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Radar Proxy", subtitle: "Multi-domain nutrient intelligence", values: [{ label: "Immune", value: immuneScore, color: bandClass(scoreToBand(immuneScore)) }, { label: "Bone", value: boneScore, color: bandClass(scoreToBand(boneScore)) }, { label: "Cognitive", value: cognitiveScore, color: bandClass(scoreToBand(cognitiveScore)) }, { label: "Performance", value: performanceScore, color: bandClass(scoreToBand(performanceScore)) }] },
        { title: "Deficiency Heatmap Proxy", subtitle: "Risk concentration", values: [{ label: "Deficiency Cluster", value: deficiencyClustering, color: deficiencyClustering < 30 ? "bg-emerald-500" : deficiencyClustering < 55 ? "bg-amber-500" : bandClass(band) }, { label: "Toxicity", value: toxicityRisk, color: toxicityRisk < 25 ? "bg-emerald-500" : toxicityRisk < 50 ? "bg-amber-500" : bandClass(band) }] },
        { title: "1-Year Projection", subtitle: "Adaptive micronutrient outlook", values: [{ label: "Current", value: snapshot.healthScore, color: bandClass(band) }, { label: "1-Year", value: snapshot.projection1Year, color: "bg-sky-500" }] },
      ],
      research: buildResearchPayload("Micronutrient Tracker", snapshot.tags, snapshot, { vitaminScore, mineralScore, deficiencyClustering, toxicityRisk, immuneScore, boneScore, cognitiveScore, performanceScore, nutritionScore }),
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Daily Food Log Quality" value={foodLogScore} onChange={setFoodLogScore} min={0} max={100} step={1} suffix="/100" />
      <NumInput label="Supplement Intake" value={supplementCount} onChange={setSupplementCount} min={0} max={12} step={1} suffix="items/day" />
      <NumInput label="Lab Report Flags" value={labFlags} onChange={setLabFlags} min={0} max={8} step={1} suffix="flags" />
    </div>
  )

  return <ComprehensiveHealthTemplate title="Micronutrient Tracker" description="Total nutrient intelligence hub with deficiency clustering, toxicity risk, immune/bone/cognitive/performance scoring, and research-grade central nutrition profiling." inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking" toolId="micronutrient-tracker" resultExtras={extra ? <NutritionResultExtras title="Micronutrient Tracker" extra={extra} /> : null} seoContent={<SeoContentGenerator title="Micronutrient Tracker" description="Advanced micronutrient tracker with deficiency clustering, toxicity risk, interaction scoring, and 1-year projection." categoryName="Nutrition & Calorie Tracking" />} />
}