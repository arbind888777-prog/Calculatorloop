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
  Fish,
  Flame,
  Heart,
  Moon,
  Scale,
  Shield,
  Sun,
  TrendingUp,
  Waves,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

type Status = "good" | "warning" | "danger"

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

interface NutritionSnapshot {
  toolId: string
  toolName: string
  recordedAt: string
  healthScore: number
  riskClass: "Green" | "Yellow" | "Red"
  clinicalNote: string
  projection3Month: number
  projection1Year: number
  weightKg?: number
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  ldl?: number
  hdl?: number
  triglycerides?: number
  fastingGlucose?: number
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  activityMinutes?: number
}

interface ExtraState {
  snapshot: NutritionSnapshot
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

function statusFromBand(band: "Green" | "Yellow" | "Red"): Status {
  if (band === "Green") return "good"
  if (band === "Yellow") return "warning"
  return "danger"
}

function bandFromScore(score: number): "Green" | "Yellow" | "Red" {
  if (score >= 75) return "Green"
  if (score >= 50) return "Yellow"
  return "Red"
}

function getBandClasses(band: "Green" | "Yellow" | "Red") {
  if (band === "Green") return "bg-emerald-500"
  if (band === "Yellow") return "bg-amber-400"
  return "bg-rose-500"
}

function toMmolGlucose(mgDl: number) {
  return mgDl / 18
}

function estimateCaloriesFromWeight(weightKg: number, activityFactor: number) {
  return round0(weightKg * 28 * activityFactor)
}

function loadSnapshots(): NutritionSnapshot[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(DASHBOARD_STORAGE_KEY)
    return raw ? JSON.parse(raw) as NutritionSnapshot[] : []
  } catch {
    return []
  }
}

function saveSnapshot(snapshot: NutritionSnapshot) {
  if (typeof window === "undefined") return
  const existing = loadSnapshots().filter(entry => entry.toolId !== snapshot.toolId)
  const next = [snapshot, ...existing].slice(0, 24)
  window.localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(next))
}

function exportResearchPayload(toolName: string, payload: Record<string, unknown>) {
  if (typeof window === "undefined") return
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = window.URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = `${toolName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-research-export.json`
  anchor.click()
  window.URL.revokeObjectURL(url)
}

function createSnapshot(data: Omit<NutritionSnapshot, "recordedAt">): NutritionSnapshot {
  return { ...data, recordedAt: new Date().toISOString() }
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
  const maxValue = Math.max(...graph.values.map(item => item.value), 1)
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
                style={{ width: `${Math.max(6, (item.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function CentralMetabolicHealthDashboard({ currentSnapshot }: { currentSnapshot: NutritionSnapshot }) {
  const [snapshots, setSnapshots] = useState<NutritionSnapshot[]>([])

  useEffect(() => {
    setSnapshots(loadSnapshots())
  }, [currentSnapshot.recordedAt])

  const model = useMemo(() => {
    const list = snapshots.length ? snapshots : [currentSnapshot]
    const avgHealthScore = round0(list.reduce((sum, item) => sum + item.healthScore, 0) / list.length)
    const band = bandFromScore(avgHealthScore)
    const latestWeight = list.find(item => typeof item.weightKg === "number")?.weightKg
    const calorieEntries = list.filter(item => typeof item.calories === "number")
    const avgCalories = calorieEntries.length
      ? round0(calorieEntries.reduce((sum, item) => sum + (item.calories ?? 0), 0) / calorieEntries.length)
      : 0
    const bpEntry = list.find(item => item.bloodPressureSystolic && item.bloodPressureDiastolic)
    const lipidEntry = list.find(item => item.ldl || item.triglycerides)
    const glucoseEntry = list.find(item => item.fastingGlucose)
    const findings: string[] = []

    if (bpEntry && (bpEntry.bloodPressureSystolic ?? 0) >= 130) {
      findings.push("Blood pressure linked nutrition watch: sodium and hydration strategy need tighter control.")
    }
    if (lipidEntry && ((lipidEntry.ldl ?? 0) >= 130 || (lipidEntry.triglycerides ?? 0) >= 150)) {
      findings.push("Lipid risk signal: align fat quality and omega-3 modules to lower atherogenic load.")
    }
    if (glucoseEntry && (glucoseEntry.fastingGlucose ?? 0) >= 100) {
      findings.push("Glycemic drift detected: carb tolerance, fasting window, and meal GL need correlation.")
    }
    if (latestWeight && avgCalories) {
      findings.push(`Shared field sync active: weight ${latestWeight} kg with average energy intake ${avgCalories} kcal/day.`)
    }

    const projection3Month = clamp(round0(100 - (100 - avgHealthScore) * 0.82), 0, 100)
    const projection1Year = clamp(round0(100 - (100 - avgHealthScore) * 0.68), 0, 100)
    const diseaseRisk = clamp(round0((100 - avgHealthScore) * 1.15), 0, 100)

    return {
      avgHealthScore,
      band,
      avgCalories,
      trackedModules: list.length,
      findings,
      projection3Month,
      projection1Year,
      diseaseRisk,
    }
  }, [currentSnapshot, snapshots])

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-950 dark:to-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-sky-600" />
          Central Metabolic Health Dashboard
        </CardTitle>
        <CardDescription>
          Shared nutrition, lab, blood pressure, calorie, macro, and activity intelligence across independent modules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border bg-background/80 p-3">
            <div className="text-xs text-muted-foreground">Adaptive Health Score</div>
            <div className="mt-1 text-2xl font-semibold">{model.avgHealthScore}/100</div>
          </div>
          <div className="rounded-xl border bg-background/80 p-3">
            <div className="text-xs text-muted-foreground">Risk Band</div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-semibold">
              <span className={`inline-block h-3 w-3 rounded-full ${getBandClasses(model.band)}`} />
              {model.band}
            </div>
          </div>
          <div className="rounded-xl border bg-background/80 p-3">
            <div className="text-xs text-muted-foreground">3-Month Projection</div>
            <div className="mt-1 text-2xl font-semibold">{model.projection3Month}/100</div>
          </div>
          <div className="rounded-xl border bg-background/80 p-3">
            <div className="text-xs text-muted-foreground">1-Year Trajectory</div>
            <div className="mt-1 text-2xl font-semibold">{model.projection1Year}/100</div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="mb-2 text-sm font-medium">AI Engine Workflow</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Data collect: shared snapshots from all nutrition subcategory tools.</li>
              <li>Risk score generate: module score blended into dashboard risk band.</li>
              <li>Cross-calculator correlation: glucose, lipids, blood pressure, macros, hydration, and weight.</li>
              <li>Prediction model run: 3-month and 1-year metabolic trajectory.</li>
              <li>Personalized adjustment: dashboard findings update after each module run.</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-background/80 p-4">
            <div className="mb-2 text-sm font-medium">Cross-Calculator Findings</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {(model.findings.length ? model.findings : ["More modules improve correlation quality."]).map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-muted-foreground">
              Disease risk model: {model.diseaseRisk}% composite nutrition-linked risk pressure based on current stored snapshots.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MetabolicResultExtras({ title, extra }: { title: string; extra: ExtraState }) {
  const bandStatus = statusFromBand(extra.snapshot.riskClass)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-rose-500" />
            Risk Classification And Clinical Projection
          </CardTitle>
          <CardDescription>
            Visual meter, graph projection, clinical note, and research export for {title}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Heart / metabolic color band</span>
              <span className="font-medium">
                {extra.snapshot.riskClass}: {extra.snapshot.riskClass === "Green" ? "Cardio safe" : extra.snapshot.riskClass === "Yellow" ? "Moderate risk" : "High atherogenic risk"}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-3 rounded-full ${getBandClasses(extra.snapshot.riskClass)}`}
                style={{ width: `${Math.max(8, extra.snapshot.healthScore)}%` }}
              />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Adaptive score {extra.snapshot.healthScore}/100 with {bandStatus} status for this module.
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {extra.graphs.map(graph => (
              <GraphCard key={graph.title} graph={graph} />
            ))}
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">Clinical Note</div>
            {extra.clinicalNote}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => exportResearchPayload(title, extra.research)}>
              <Download className="mr-2 h-4 w-4" />
              Research Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <CentralMetabolicHealthDashboard currentSnapshot={extra.snapshot} />
    </div>
  )
}

function useExtraState() {
  return useState<ExtraState | null>(null)
}

export function AdvancedFatIntakeCalculator() {
  const [age, setAge] = useState(34)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(76)
  const [calories, setCalories] = useState(2300)
  const [goal, setGoal] = useState("maintenance")
  const [ldl, setLdl] = useState(120)
  const [hdl, setHdl] = useState(48)
  const [triglycerides, setTriglycerides] = useState(140)
  const [familyHistory, setFamilyHistory] = useState("no")
  const [diabetes, setDiabetes] = useState("no")
  const [oilType, setOilType] = useState("olive")
  const [transFat, setTransFat] = useState(0.8)
  const [omega3, setOmega3] = useState(1.2)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const totalFatMin = round0((calories * 0.2) / 9)
    const totalFatMax = round0((calories * 0.35) / 9)
    const goalPct = goal === "fatLoss" ? 0.25 : goal === "muscleGain" ? 0.32 : 0.3
    const targetFat = round0((calories * goalPct) / 9)
    const satLimit = round0((calories * 0.1) / 9)
    const oilProfiles: Record<string, { quality: number; omega6Load: number; saturatedLoad: number }> = {
      olive: { quality: 88, omega6Load: 6, saturatedLoad: 1.2 },
      mustard: { quality: 90, omega6Load: 2.5, saturatedLoad: 0.9 },
      canola: { quality: 84, omega6Load: 2.2, saturatedLoad: 1.1 },
      sunflower: { quality: 56, omega6Load: 18, saturatedLoad: 1.2 },
      soybean: { quality: 52, omega6Load: 12, saturatedLoad: 1.3 },
      ghee: { quality: 38, omega6Load: 1.5, saturatedLoad: 2.8 },
      palm: { quality: 25, omega6Load: 20, saturatedLoad: 3.1 },
    }
    const profile = oilProfiles[oilType]
    const omegaRatio = round1(profile.omega6Load / Math.max(omega3, 0.2))
    const aip = round2(Math.log10(Math.max(triglycerides / Math.max(hdl, 1), 1.01)))
    const predictedLdlShift = round1((profile.saturatedLoad - 1.3) * 7 + transFat * 7 - omega3 * 4 + (diabetes === "yes" ? 4 : 0))
    const inflammationScore = clamp(round0(25 + transFat * 18 + Math.max(0, omegaRatio - 4) * 5 + (diabetes === "yes" ? 10 : 0)), 0, 100)
    const fatQualityScore = clamp(round0(profile.quality - transFat * 12 - Math.max(0, omegaRatio - 4) * 4 - (familyHistory === "yes" ? 5 : 0)), 0, 100)
    const cvdRiskScore = clamp(round0(100 - fatQualityScore + Math.max(0, ldl - 100) * 0.2 + Math.max(0, triglycerides - 150) * 0.08 + (familyHistory === "yes" ? 8 : 0)), 0, 100)
    const healthScore = clamp(100 - cvdRiskScore, 5, 95)
    const band = bandFromScore(healthScore)
    const clinicalNote = `Dietary fat pattern suggests ${band === "Green" ? "cardio-safe" : band === "Yellow" ? "moderate atherogenic" : "high atherogenic"} exposure. Prioritize ${oilType === "olive" || oilType === "mustard" ? "continuing monounsaturated / balanced oils" : "replacing current oil with olive, mustard, or canola"}, keep trans fat under 0.5 g/day, and push omega-3 toward 2 g/day if LDL or triglycerides remain elevated.`

    const snapshot = createSnapshot({
      toolId: "fat-intake-calculator",
      toolName: "Fat Intake Calculator",
      healthScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(healthScore + (omega3 >= 2 ? 8 : 3) - transFat * 3), 0, 100),
      projection1Year: clamp(round0(healthScore + (band === "Red" ? 12 : 8)), 0, 100),
      weightKg: weight,
      calories,
      fatG: targetFat,
      ldl,
      hdl,
      triglycerides,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: {
        label: "Target Fat Intake",
        value: `${targetFat} g/day`,
        status: statusFromBand(band),
        description: `${totalFatMin}-${totalFatMax} g acceptable range`,
        icon: Beef,
      },
      healthScore,
      metrics: [
        { label: "Total Fat Range", value: `${totalFatMin}-${totalFatMax} g`, status: "good", icon: Beef },
        { label: "Saturated Fat Limit", value: `${satLimit} g`, status: band === "Red" ? "danger" : "good", icon: Flame },
        { label: "Trans Fat Exposure", value: `${transFat} g`, status: transFat <= 0.5 ? "good" : transFat <= 1.5 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Omega 6:3 Ratio", value: `${omegaRatio}:1`, status: omegaRatio <= 4 ? "good" : omegaRatio <= 8 ? "warning" : "danger", icon: Fish },
        { label: "Atherogenic Index", value: aip, status: aip < 0.11 ? "good" : aip < 0.21 ? "warning" : "danger", icon: Heart },
        { label: "Fat Quality Score", value: `${fatQualityScore}/100`, status: statusFromBand(band), icon: Shield },
        { label: "Predicted LDL Shift", value: `${predictedLdlShift > 0 ? "+" : ""}${predictedLdlShift} mg/dL`, status: predictedLdlShift <= 0 ? "good" : predictedLdlShift <= 8 ? "warning" : "danger", icon: TrendingUp },
        { label: "Inflammation Score", value: `${inflammationScore}/100`, status: inflammationScore < 35 ? "good" : inflammationScore < 60 ? "warning" : "danger", icon: Flame },
        { label: "10Y Dietary CVD Risk", value: `${cvdRiskScore}%`, status: statusFromBand(band), icon: Heart },
      ],
      recommendations: [
        { title: "AI Dietary Fat Correction", description: `Aim for ${targetFat} g/day total fat with saturated fat under ${satLimit} g and trans fat near zero. Shift cooking oil toward high-quality unsaturated options and increase omega-3 intake if ratio stays above 4:1.`, priority: "high", category: "Correction" },
        { title: "Lipid Panel Prediction", description: `Current model predicts ${predictedLdlShift > 0 ? "an LDL rise" : "an LDL reduction"} of ${Math.abs(predictedLdlShift)} mg/dL if current fat quality persists. Most leverage is from oil swap, omega-3 increase, and trans fat elimination.`, priority: "high", category: "Prediction" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        age,
        gender,
        weight,
        calories,
        goal,
        oilType,
        totalFatMin,
        totalFatMax,
        targetFat,
        satLimit,
        transFat,
        omega3,
        omegaRatio,
        aip,
        fatQualityScore,
        predictedLdlShift,
        inflammationScore,
        cvdRiskScore,
      },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Fat Breakdown", subtitle: "Daily target composition", unit: "g", values: [
          { label: "Target Fat", value: targetFat, color: "bg-sky-500" },
          { label: "Sat Fat Limit", value: satLimit, color: "bg-amber-500" },
          { label: "Trans Fat", value: Math.max(transFat, 0.1), color: "bg-rose-500" },
        ] },
        { title: "Omega Ratio", subtitle: "Lower is better", values: [
          { label: "Current", value: omegaRatio, color: omegaRatio <= 4 ? "bg-emerald-500" : omegaRatio <= 8 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Target", value: 4, color: "bg-slate-500" },
        ] },
        { title: "Predicted Cholesterol Change", subtitle: "Modeled diet effect", unit: "mg/dL", values: [
          { label: "LDL Shift", value: Math.abs(predictedLdlShift), color: predictedLdlShift <= 0 ? "bg-emerald-500" : "bg-rose-500" },
          { label: "LDL Now", value: ldl, color: "bg-sky-500" },
        ] },
      ],
      research: { snapshot, aip, omegaRatio, predictedLdlShift, inflammationScore, cvdRiskScore },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={250} suffix="kg" />
      <NumInput label="Total Calories" value={calories} onChange={setCalories} min={1000} max={5000} step={50} suffix="kcal" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscleGain", label: "Muscle Gain" }]} />
      <NumInput label="LDL" value={ldl} onChange={setLdl} min={50} max={260} suffix="mg/dL" />
      <NumInput label="HDL" value={hdl} onChange={setHdl} min={20} max={120} suffix="mg/dL" />
      <NumInput label="Triglycerides" value={triglycerides} onChange={setTriglycerides} min={40} max={500} suffix="mg/dL" />
      <SelectInput label="Family History Of CVD" value={familyHistory} onChange={setFamilyHistory} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Diabetes" value={diabetes} onChange={setDiabetes} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Cooking Oil Type" value={oilType} onChange={setOilType} options={[
        { value: "olive", label: "Olive" },
        { value: "mustard", label: "Mustard" },
        { value: "canola", label: "Canola" },
        { value: "sunflower", label: "Sunflower" },
        { value: "soybean", label: "Soybean" },
        { value: "ghee", label: "Ghee" },
        { value: "palm", label: "Palm" },
      ]} />
      <NumInput label="Trans Fat Intake" value={transFat} onChange={setTransFat} min={0} max={8} step={0.1} suffix="g" />
      <NumInput label="Omega-3 Intake" value={omega3} onChange={setOmega3} min={0.1} max={6} step={0.1} suffix="g" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Fat Intake Calculator"
      description="Lipid metabolic intelligence for fat dose, fat quality, omega balance, inflammation load, and heart risk color classification."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="fat-intake-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Fat Intake Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Fat Intake Calculator" description="Advanced fat quality, LDL shift, omega ratio, and dietary CVD risk calculator." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedCarbCalculator() {
  const [weight, setWeight] = useState(74)
  const [activity, setActivity] = useState("moderate")
  const [bodyFat, setBodyFat] = useState(22)
  const [fastingGlucose, setFastingGlucose] = useState(94)
  const [hba1c, setHba1c] = useState(5.4)
  const [trainingType, setTrainingType] = useState("mixed")
  const [goal, setGoal] = useState("maintenance")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const activityFactor = activity === "sedentary" ? 1.2 : activity === "light" ? 1.35 : activity === "moderate" ? 1.5 : 1.72
    const estimatedCalories = estimateCaloriesFromWeight(weight, activityFactor)
    let carbFactor = goal === "fatLoss" ? 2.4 : goal === "maintenance" ? 3.3 : 4.1
    carbFactor += trainingType === "endurance" ? 1.1 : trainingType === "strength" ? 0.4 : 0.7
    carbFactor -= Math.max(0, bodyFat - 18) * 0.03
    carbFactor -= Math.max(0, fastingGlucose - 90) * 0.015
    carbFactor -= Math.max(0, hba1c - 5.2) * 0.4
    carbFactor = clamp(carbFactor, 1.5, 6.2)
    const carbs = round0(weight * carbFactor)
    const carbPct = round0((carbs * 4 / estimatedCalories) * 100)
    const netCarbs = round0(carbs * 0.88)
    const glycemicLoad = round0(netCarbs * 0.42 + Math.max(0, fastingGlucose - 90) * 0.6)
    const insulinLoad = round0(netCarbs + weight * 0.45)
    const sensitivityIndex = clamp(round0(100 - fastingGlucose * 0.45 - (hba1c - 5) * 18 - bodyFat * 0.65 + (activityFactor - 1.1) * 25), 5, 95)
    const toleranceScore = clamp(round0((sensitivityIndex * 0.7) + (trainingType === "endurance" ? 12 : trainingType === "mixed" ? 8 : 4)), 5, 95)
    const fatStorageProbability = clamp(round0(100 - toleranceScore + Math.max(0, carbPct - 45) * 0.8), 5, 95)
    const predictedPostMeal = round0(fastingGlucose + glycemicLoad * 0.6 - Math.min(18, sensitivityIndex * 0.12))
    const diabetesRisk = clamp(round0((fastingGlucose - 80) * 1.2 + (hba1c - 5) * 28 + Math.max(0, bodyFat - 20) * 0.7), 0, 100)
    const healthScore = clamp(round0(100 - diabetesRisk * 0.8 - Math.max(0, fatStorageProbability - 45) * 0.3), 5, 95)
    const band = bandFromScore(healthScore)
    const clinicalNote = `Carb tolerance is ${toleranceScore >= 75 ? "strong" : toleranceScore >= 55 ? "moderate" : "limited"}. If fasting glucose or HbA1c trends upward, tighten glycemic load, shift more carbs around training, and prefer low-GL whole-food sources.`

    const snapshot = createSnapshot({
      toolId: "carb-calculator",
      toolName: "Carb Calculator",
      healthScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(healthScore + (goal === "fatLoss" ? 6 : 4)), 0, 100),
      projection1Year: clamp(round0(healthScore + (toleranceScore >= 70 ? 10 : 6)), 0, 100),
      weightKg: weight,
      calories: estimatedCalories,
      carbsG: carbs,
      fastingGlucose,
      activityMinutes: activity === "sedentary" ? 20 : activity === "light" ? 35 : activity === "moderate" ? 50 : 70,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Daily Carbs", value: `${carbs} g`, status: statusFromBand(band), description: `${carbPct}% of estimated calories`, icon: Apple },
      healthScore,
      metrics: [
        { label: "Carb Range", value: `${round0(carbs * 0.9)}-${round0(carbs * 1.1)} g`, status: statusFromBand(band), icon: Apple },
        { label: "% Of Calories", value: `${carbPct}%`, status: carbPct <= 50 ? "good" : carbPct <= 58 ? "warning" : "danger", icon: Flame },
        { label: "Net Carbs", value: `${netCarbs} g`, status: "good", icon: Scale },
        { label: "Daily GL", value: glycemicLoad, status: glycemicLoad < 80 ? "good" : glycemicLoad < 110 ? "warning" : "danger", icon: BarChart3 },
        { label: "Insulin Load", value: insulinLoad, status: insulinLoad < 180 ? "good" : insulinLoad < 240 ? "warning" : "danger", icon: Zap },
        { label: "Sensitivity Index", value: `${sensitivityIndex}/100`, status: sensitivityIndex >= 70 ? "good" : sensitivityIndex >= 50 ? "warning" : "danger", icon: Shield },
        { label: "Carb Tolerance", value: `${toleranceScore}/100`, status: toleranceScore >= 70 ? "good" : toleranceScore >= 50 ? "warning" : "danger", icon: Activity },
        { label: "Fat Storage Probability", value: `${fatStorageProbability}%`, status: fatStorageProbability < 35 ? "good" : fatStorageProbability < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Post-Meal Glucose", value: `${predictedPostMeal} mg/dL`, status: predictedPostMeal < 140 ? "good" : predictedPostMeal < 170 ? "warning" : "danger", icon: TrendingUp },
      ],
      recommendations: [
        { title: "AI Carb Cycling Planner", description: `Base target ${carbs} g/day. Use ${round0(carbs * 1.15)} g on training-heavy days and ${round0(carbs * 0.8)} g on low-activity days to align glucose control with performance.`, priority: "high", category: "Cycling" },
        { title: "Glucose Prediction", description: `Predicted post-meal glucose is ${predictedPostMeal} mg/dL. Keep meals protein-anchored and bias carbs around workouts if you want lower glycemic drift.`, priority: "high", category: "Prediction" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, activity, bodyFat, fastingGlucose, hba1c, trainingType, goal, estimatedCalories, carbs, carbPct, netCarbs, glycemicLoad, insulinLoad, sensitivityIndex, toleranceScore, fatStorageProbability, predictedPostMeal },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Carb Range", subtitle: "Recommended min-max target", unit: "g", values: [
          { label: "Min", value: round0(carbs * 0.9), color: "bg-emerald-500" },
          { label: "Target", value: carbs, color: "bg-sky-500" },
          { label: "Max", value: round0(carbs * 1.1), color: "bg-amber-500" },
        ] },
        { title: "GL Meter", subtitle: "Daily glycemic pressure", values: [
          { label: "Current GL", value: glycemicLoad, color: glycemicLoad < 80 ? "bg-emerald-500" : glycemicLoad < 110 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Preferred Ceiling", value: 80, color: "bg-slate-500" },
        ] },
        { title: "Blood Sugar Risk", subtitle: "Post-meal curve expectation", unit: "mg/dL", values: [
          { label: "Fasting", value: fastingGlucose, color: "bg-sky-500" },
          { label: "Predicted Peak", value: predictedPostMeal, color: predictedPostMeal < 140 ? "bg-emerald-500" : "bg-rose-500" },
        ] },
      ],
      research: { snapshot, glycemicLoad, insulinLoad, sensitivityIndex, toleranceScore, fatStorageProbability, predictedPostMeal },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Activity" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
      <NumInput label="Body Fat" value={bodyFat} onChange={setBodyFat} min={6} max={55} suffix="%" />
      <NumInput label="Fasting Glucose" value={fastingGlucose} onChange={setFastingGlucose} min={60} max={180} suffix="mg/dL" />
      <NumInput label="HbA1c" value={hba1c} onChange={setHba1c} min={4.5} max={10} step={0.1} suffix="%" />
      <SelectInput label="Training Type" value={trainingType} onChange={setTrainingType} options={[{ value: "strength", label: "Strength" }, { value: "mixed", label: "Mixed" }, { value: "endurance", label: "Endurance" }]} />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "performance", label: "Performance" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Carb Calculator"
      description="Glycemic load optimizer with insulin sensitivity, carb tolerance prediction, fat storage probability, and post-meal glucose modeling."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="carb-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Carb Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Carb Calculator" description="Advanced carb tolerance and glycemic load optimizer for metabolic flexibility and insulin sensitivity." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedVitaminDCalculator() {
  const [age, setAge] = useState(36)
  const [skinTone, setSkinTone] = useState("medium")
  const [sunExposure, setSunExposure] = useState(20)
  const [uvIndex, setUvIndex] = useState(6)
  const [supplementDose, setSupplementDose] = useState(1000)
  const [serumVitaminD, setSerumVitaminD] = useState(24)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = age >= 70 ? 800 : 600
    const skinFactor = skinTone === "light" ? 1.2 : skinTone === "medium" ? 1 : skinTone === "olive" ? 0.82 : 0.68
    const sunlightIU = round0(sunExposure * uvIndex * 42 * skinFactor)
    const currentIntake = supplementDose + sunlightIU
    const deficiencyProbability = clamp(round0((serumVitaminD < 20 ? 70 : serumVitaminD < 30 ? 38 : 12) + Math.max(0, 25 - sunExposure) * 0.8), 0, 100)
    const calciumAbsorption = clamp(round0(18 + serumVitaminD * 0.65), 15, 42)
    const seasonalSwing = round0((uvIndex < 4 ? -8 : uvIndex > 7 ? 5 : 0) + (sunExposure < 15 ? -6 : 0))
    const autoimmuneAssociation = clamp(round0(100 - serumVitaminD * 2.1), 5, 95)
    const predictedSerumTarget = clamp(round1(serumVitaminD + supplementDose / 1000 * 3.5 + sunlightIU / 1000 * 4.2 + seasonalSwing), 8, 110)
    const toxicityRisk = supplementDose > 4000 || predictedSerumTarget > 100
    const boneHealthScore = clamp(round0(calciumAbsorption * 2.1 + predictedSerumTarget * 0.8 - deficiencyProbability * 0.45), 5, 95)
    const healthScore = toxicityRisk ? Math.min(60, boneHealthScore) : boneHealthScore
    const band = bandFromScore(healthScore)
    const classification = serumVitaminD < 12 ? "Severe" : serumVitaminD < 20 ? "Moderate" : serumVitaminD <= 50 ? "Optimal" : "Excess"
    const clinicalNote = `Vitamin D status is ${classification.toLowerCase()}. Bone and immune support improve most once serum 25(OH)D reaches roughly 30-50 ng/mL while avoiding long-term dosing above 4000 IU/day unless clinician-guided.`

    const snapshot = createSnapshot({
      toolId: "vitamin-d-calculator",
      toolName: "Vitamin D Intake Calculator",
      healthScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(healthScore + (supplementDose >= 1000 ? 8 : 4)), 0, 100),
      projection1Year: clamp(round0(healthScore + (classification === "Optimal" ? 6 : 10)), 0, 100),
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Serum Prediction", value: `${predictedSerumTarget} ng/mL`, status: toxicityRisk ? "danger" : statusFromBand(band), description: classification, icon: Sun },
      healthScore,
      metrics: [
        { label: "RDA", value: `${rda} IU`, status: "good", icon: Shield },
        { label: "Sunlight Estimate", value: `${sunlightIU} IU`, status: sunlightIU >= 400 ? "good" : "warning", icon: Sun },
        { label: "Supplement", value: `${supplementDose} IU`, status: supplementDose <= 4000 ? "good" : "danger", icon: Apple },
        { label: "Deficiency Probability", value: `${deficiencyProbability}%`, status: deficiencyProbability < 25 ? "good" : deficiencyProbability < 50 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Calcium Absorption", value: `${calciumAbsorption}%`, status: calciumAbsorption >= 28 ? "good" : "warning", icon: Scale },
        { label: "Seasonal Swing", value: `${seasonalSwing > 0 ? "+" : ""}${seasonalSwing} ng/mL`, status: seasonalSwing >= 0 ? "good" : "warning", icon: TrendingUp },
        { label: "Autoimmune Association", value: `${autoimmuneAssociation}%`, status: autoimmuneAssociation < 35 ? "good" : autoimmuneAssociation < 60 ? "warning" : "danger", icon: Heart },
        { label: "Toxicity Alert", value: toxicityRisk ? "Triggered" : "Safe", status: toxicityRisk ? "danger" : "good", icon: AlertTriangle },
        { label: "Bone Health Score", value: `${boneHealthScore}/100`, status: statusFromBand(band), icon: Activity },
      ],
      recommendations: [
        { title: "AI Supplement Recommendation", description: `Current intake is ${currentIntake} IU/day when sunlight and supplements are combined. Keep total routine near the lowest dose that maintains 25(OH)D in the optimal 30-50 ng/mL range.`, priority: "high", category: "Supplementation" },
        { title: "Toxicity Guardrail", description: toxicityRisk ? "Current plan may overshoot safe vitamin D exposure. Reduce supplement dose or re-check serum level before continuing." : "No toxicity flag from current dose model. Continue periodic serum monitoring.", priority: toxicityRisk ? "high" : "medium", category: "Safety" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { age, skinTone, sunExposure, uvIndex, supplementDose, serumVitaminD, rda, sunlightIU, currentIntake, deficiencyProbability, calciumAbsorption, seasonalSwing, autoimmuneAssociation, predictedSerumTarget, toxicityRisk, boneHealthScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Serum Prediction Gauge", subtitle: "Target 30-50 ng/mL", unit: "ng/mL", values: [
          { label: "Current", value: serumVitaminD, color: "bg-sky-500" },
          { label: "Predicted", value: predictedSerumTarget, color: toxicityRisk ? "bg-rose-500" : "bg-emerald-500" },
        ] },
        { title: "Input Sources", subtitle: "Vitamin D inflow", unit: "IU", values: [
          { label: "Sun", value: sunlightIU, color: "bg-amber-500" },
          { label: "Supplement", value: supplementDose, color: "bg-sky-500" },
          { label: "RDA", value: rda, color: "bg-slate-500" },
        ] },
        { title: "Deficiency Risk", subtitle: "Lower is better", values: [
          { label: "Risk", value: deficiencyProbability, color: deficiencyProbability < 25 ? "bg-emerald-500" : deficiencyProbability < 50 ? "bg-amber-500" : "bg-rose-500" },
        ] },
      ],
      research: { snapshot, deficiencyProbability, calciumAbsorption, predictedSerumTarget, toxicityRisk, classification },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Skin Tone" value={skinTone} onChange={setSkinTone} options={[{ value: "light", label: "Light" }, { value: "medium", label: "Medium" }, { value: "olive", label: "Olive" }, { value: "dark", label: "Dark" }]} />
      <NumInput label="Sun Exposure" value={sunExposure} onChange={setSunExposure} min={0} max={120} step={5} suffix="min/day" />
      <NumInput label="Location UV Index" value={uvIndex} onChange={setUvIndex} min={0} max={12} step={1} suffix="UV" />
      <NumInput label="Supplement Dose" value={supplementDose} onChange={setSupplementDose} min={0} max={10000} step={100} suffix="IU" />
      <NumInput label="25(OH)D Lab Value" value={serumVitaminD} onChange={setSerumVitaminD} min={5} max={120} step={1} suffix="ng/mL" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Vitamin D Intake Calculator"
      description="Bone and immunity optimizer with sunlight integration, deficiency modeling, serum prediction, toxicity alert, and bone risk scoring."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="vitamin-d-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Vitamin D Intake Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Vitamin D Intake Calculator" description="Advanced vitamin D calculator with sunlight, supplementation, and serum prediction intelligence." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedIronIntakeCalculator() {
  const [gender, setGender] = useState("female")
  const [age, setAge] = useState(29)
  const [pregnancy, setPregnancy] = useState("no")
  const [dietType, setDietType] = useState("veg")
  const [ferritin, setFerritin] = useState(28)
  const [hemoglobin, setHemoglobin] = useState(12.4)
  const [vitaminC, setVitaminC] = useState(80)
  const [heavyPeriods, setHeavyPeriods] = useState("yes")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = pregnancy === "yes" ? 27 : gender === "male" ? 8 : age < 51 ? 18 : 8
    const hemeRatio = dietType === "nonveg" ? 0.35 : 0.08
    const nonHemeRatio = 1 - hemeRatio
    const absorptionCorrection = round1(1 + vitaminC / 250 + (dietType === "veg" ? -0.12 : 0.08))
    const estimatedAbsorbed = round1(rda * absorptionCorrection * (dietType === "nonveg" ? 0.18 : 0.1))
    const anemiaRisk = clamp(round0((ferritin < 30 ? 32 : 8) + (hemoglobin < 12 ? 42 : hemoglobin < 13 ? 16 : 4) + (heavyPeriods === "yes" ? 12 : 0) + (pregnancy === "yes" ? 18 : 0) + (dietType === "veg" ? 8 : 0)), 0, 100)
    const overloadRisk = clamp(round0((ferritin > 200 ? 40 : 5) + (gender === "male" && ferritin > 300 ? 25 : 0)), 0, 100)
    const fatigueIndex = clamp(round0((15 - hemoglobin) * 7 + Math.max(0, 40 - ferritin) * 0.8), 0, 100)
    const healthScore = clamp(round0(100 - anemiaRisk * 0.75 - overloadRisk * 0.2), 5, 95)
    const band = bandFromScore(healthScore)
    const clinicalNote = `Iron status suggests ${anemiaRisk >= 60 ? "high anemia risk" : anemiaRisk >= 35 ? "moderate anemia pressure" : "generally adequate iron stores"}. Ferritin and hemoglobin should be interpreted together, especially in menstruating, pregnant, vegetarian, and athletic populations.`

    const snapshot = createSnapshot({
      toolId: "iron-intake-calculator",
      toolName: "Iron Intake Calculator",
      healthScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(healthScore + (vitaminC >= 75 ? 7 : 4)), 0, 100),
      projection1Year: clamp(round0(healthScore + (anemiaRisk >= 60 ? 12 : 6)), 0, 100),
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Iron Adequacy", value: `${estimatedAbsorbed} mg absorbed`, status: statusFromBand(band), description: `${rda} mg RDA benchmark`, icon: Beef },
      healthScore,
      metrics: [
        { label: "RDA", value: `${rda} mg`, status: "good", icon: Shield },
        { label: "Heme Ratio", value: `${round0(hemeRatio * 100)}%`, status: hemeRatio >= 0.2 ? "good" : "warning", icon: Beef },
        { label: "Non-Heme Ratio", value: `${round0(nonHemeRatio * 100)}%`, status: "good", icon: Apple },
        { label: "Vitamin C Correction", value: `${absorptionCorrection}x`, status: vitaminC >= 75 ? "good" : "warning", icon: Zap },
        { label: "Ferritin", value: `${ferritin} ng/mL`, status: ferritin >= 40 ? "good" : ferritin >= 20 ? "warning" : "danger", icon: BarChart3 },
        { label: "Hemoglobin", value: `${hemoglobin} g/dL`, status: hemoglobin >= 12 ? "good" : hemoglobin >= 11 ? "warning" : "danger", icon: Heart },
        { label: "Anemia Risk", value: `${anemiaRisk}%`, status: anemiaRisk < 35 ? "good" : anemiaRisk < 60 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Overload Risk", value: `${overloadRisk}%`, status: overloadRisk < 25 ? "good" : overloadRisk < 50 ? "warning" : "danger", icon: Flame },
        { label: "Fatigue Index", value: `${fatigueIndex}/100`, status: fatigueIndex < 35 ? "good" : fatigueIndex < 55 ? "warning" : "danger", icon: Activity },
      ],
      recommendations: [
        { title: "AI Anemia Alert", description: `Absorption-adjusted iron delivery is ${estimatedAbsorbed} mg. Use vitamin C with iron-rich meals, and consider clinician-guided lab re-check if ferritin stays below 30 ng/mL or hemoglobin trends downward.`, priority: "high", category: "Anemia" },
        { title: "Menstrual / Pregnancy Adjustment", description: heavyPeriods === "yes" || pregnancy === "yes" ? "Loss burden is elevated, so ferritin reserve matters more than intake alone. Monitor symptoms like fatigue, hair loss, or shortness of breath." : "No extra physiologic iron loss flag added.", priority: "medium", category: "Adjustment" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { gender, age, pregnancy, dietType, ferritin, hemoglobin, vitaminC, heavyPeriods, rda, hemeRatio, nonHemeRatio, absorptionCorrection, estimatedAbsorbed, anemiaRisk, overloadRisk, fatigueIndex },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Iron Adequacy Meter", subtitle: "Absorption-adjusted iron", unit: "mg", values: [
          { label: "Absorbed", value: estimatedAbsorbed, color: "bg-sky-500" },
          { label: "RDA", value: rda, color: "bg-slate-500" },
        ] },
        { title: "Anemia Risk", subtitle: "Lower is better", values: [
          { label: "Risk", value: anemiaRisk, color: anemiaRisk < 35 ? "bg-emerald-500" : anemiaRisk < 60 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Fatigue", value: fatigueIndex, color: fatigueIndex < 35 ? "bg-emerald-500" : fatigueIndex < 55 ? "bg-amber-500" : "bg-rose-500" },
        ] },
        { title: "Ferritin Trend Proxy", subtitle: "Store status markers", values: [
          { label: "Ferritin", value: ferritin, color: "bg-sky-500" },
          { label: "Hemoglobin x10", value: hemoglobin * 10, color: "bg-amber-500" },
        ] },
      ],
      research: { snapshot, estimatedAbsorbed, anemiaRisk, overloadRisk, fatigueIndex },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} />
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={80} suffix="yrs" />
      <SelectInput label="Pregnancy" value={pregnancy} onChange={setPregnancy} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <SelectInput label="Diet Type" value={dietType} onChange={setDietType} options={[{ value: "veg", label: "Vegetarian" }, { value: "nonveg", label: "Non-Vegetarian" }]} />
      <NumInput label="Ferritin" value={ferritin} onChange={setFerritin} min={5} max={400} suffix="ng/mL" />
      <NumInput label="Hemoglobin" value={hemoglobin} onChange={setHemoglobin} min={6} max={18} step={0.1} suffix="g/dL" />
      <NumInput label="Vitamin C Intake" value={vitaminC} onChange={setVitaminC} min={0} max={300} step={5} suffix="mg" />
      <SelectInput label="Heavy Periods" value={heavyPeriods} onChange={setHeavyPeriods} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Iron Intake Calculator"
      description="Anemia risk analyzer with ferritin, hemoglobin, heme absorption correction, overload screening, and fatigue performance modeling."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="iron-intake-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Iron Intake Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Iron Intake Calculator" description="Advanced iron intake calculator for anemia risk, ferritin, hemoglobin, and absorption correction." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedHydrationElectrolyteCalculator() {
  const [weight, setWeight] = useState(72)
  const [climate, setClimate] = useState("temperate")
  const [activityDuration, setActivityDuration] = useState(60)
  const [sweatRate, setSweatRate] = useState(0.9)
  const [systolic, setSystolic] = useState(122)
  const [diastolic, setDiastolic] = useState(80)
  const [sodiumIntake, setSodiumIntake] = useState(2400)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const climateFactor = climate === "cold" ? 0.95 : climate === "temperate" ? 1 : climate === "warm" ? 1.12 : 1.28
    const fluidRequirement = round0(weight * 35 * climateFactor + activityDuration * 12)
    const sweatLiters = round1((activityDuration / 60) * sweatRate)
    const sodiumLoss = round0(sweatLiters * 850)
    const potassiumNeed = round0(3500 + sweatLiters * 220)
    const magnesiumNeed = round0(380 + sweatLiters * 35)
    const electrolyteRatio = round1((sodiumIntake / 1000) / Math.max(potassiumNeed / 1000, 0.1))
    const hyponatremiaRisk = clamp(round0((fluidRequirement / 1000 > 3.8 ? 18 : 6) + (sodiumIntake < 1800 ? 28 : 8) + (sweatLiters > 1.5 ? 22 : 8) + (systolic < 105 ? 15 : 0)), 0, 100)
    const heatStrokeRisk = clamp(round0((climate === "hot" ? 36 : climate === "warm" ? 18 : 6) + activityDuration * 0.25 + sweatRate * 18), 0, 100)
    const hydrationScore = clamp(round0(100 - hyponatremiaRisk * 0.45 - heatStrokeRisk * 0.35 + Math.min(12, sodiumIntake / 500)), 5, 95)
    const band = bandFromScore(hydrationScore)
    const clinicalNote = `Hydration plan indicates ${band === "Green" ? "good fluid-electrolyte balance" : band === "Yellow" ? "moderate electrolyte management risk" : "high fluid balance instability"}. Pair sweat replacement with sodium and potassium strategy instead of water alone during longer or hotter sessions.`

    const snapshot = createSnapshot({
      toolId: "hydration-electrolyte-calculator",
      toolName: "Hydration & Electrolyte Calculator",
      healthScore: hydrationScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(hydrationScore + (climate === "hot" ? 4 : 7)), 0, 100),
      projection1Year: clamp(round0(hydrationScore + 8), 0, 100),
      weightKg: weight,
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      activityMinutes: activityDuration,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Fluid Requirement", value: `${round1(fluidRequirement / 1000)} L/day`, status: statusFromBand(band), description: `Sweat loss ${sweatLiters} L`, icon: Droplets },
      healthScore: hydrationScore,
      metrics: [
        { label: "Fluid Need", value: `${fluidRequirement} mL`, status: "good", icon: Droplets },
        { label: "Sodium Loss", value: `${sodiumLoss} mg`, status: sodiumLoss < 1200 ? "good" : "warning", icon: Waves },
        { label: "Potassium Need", value: `${potassiumNeed} mg`, status: "good", icon: Heart },
        { label: "Magnesium Need", value: `${magnesiumNeed} mg`, status: "good", icon: Zap },
        { label: "Electrolyte Ratio", value: `${electrolyteRatio}:1`, status: electrolyteRatio < 0.8 ? "good" : electrolyteRatio < 1.1 ? "warning" : "danger", icon: BarChart3 },
        { label: "Hyponatremia Risk", value: `${hyponatremiaRisk}%`, status: hyponatremiaRisk < 30 ? "good" : hyponatremiaRisk < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Heat Stroke Risk", value: `${heatStrokeRisk}%`, status: heatStrokeRisk < 30 ? "good" : heatStrokeRisk < 55 ? "warning" : "danger", icon: Flame },
        { label: "Hydration Score", value: `${hydrationScore}/100`, status: statusFromBand(band), icon: Activity },
      ],
      recommendations: [
        { title: "AI Sweat Profile", description: `Estimated sweat rate is ${sweatRate} L/hour. Replace around ${round0(sodiumLoss * 1.1)} mg sodium and keep potassium-rich foods in the same day to improve fluid retention and performance.`, priority: "high", category: "Sweat" },
        { title: "BP-Linked Sodium Adjustment", description: systolic >= 130 ? "Blood pressure is elevated, so sodium replacement should be targeted to exercise losses rather than raising all-day intake." : "Current blood pressure does not force extra sodium restriction beyond usual cardio guidelines.", priority: "medium", category: "Blood Pressure" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, climate, activityDuration, sweatRate, systolic, diastolic, sodiumIntake, fluidRequirement, sweatLiters, sodiumLoss, potassiumNeed, magnesiumNeed, electrolyteRatio, hyponatremiaRisk, heatStrokeRisk, hydrationScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Electrolyte Balance", subtitle: "Replacement priorities", unit: "mg", values: [
          { label: "Sodium", value: sodiumLoss, color: "bg-amber-500" },
          { label: "Potassium", value: potassiumNeed, color: "bg-emerald-500" },
          { label: "Magnesium", value: magnesiumNeed, color: "bg-sky-500" },
        ] },
        { title: "Risk Classification", subtitle: "Fluid balance risk", values: [
          { label: "Hyponatremia", value: hyponatremiaRisk, color: hyponatremiaRisk < 30 ? "bg-emerald-500" : hyponatremiaRisk < 55 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Heat Stroke", value: heatStrokeRisk, color: heatStrokeRisk < 30 ? "bg-emerald-500" : heatStrokeRisk < 55 ? "bg-amber-500" : "bg-rose-500" },
        ] },
        { title: "Performance Hydration Score", subtitle: "Higher is better", values: [
          { label: "Score", value: hydrationScore, color: getBandClasses(band) },
        ] },
      ],
      research: { snapshot, fluidRequirement, sodiumLoss, potassiumNeed, magnesiumNeed, electrolyteRatio, hyponatremiaRisk, heatStrokeRisk },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={35} max={220} suffix="kg" />
      <SelectInput label="Climate" value={climate} onChange={setClimate} options={[{ value: "cold", label: "Cold" }, { value: "temperate", label: "Temperate" }, { value: "warm", label: "Warm" }, { value: "hot", label: "Hot" }]} />
      <NumInput label="Activity Duration" value={activityDuration} onChange={setActivityDuration} min={0} max={240} step={5} suffix="min" />
      <NumInput label="Sweat Rate" value={sweatRate} onChange={setSweatRate} min={0.3} max={2.5} step={0.1} suffix="L/hr" />
      <NumInput label="Systolic BP" value={systolic} onChange={setSystolic} min={90} max={180} suffix="mmHg" />
      <NumInput label="Diastolic BP" value={diastolic} onChange={setDiastolic} min={55} max={110} suffix="mmHg" />
      <NumInput label="Daily Sodium Intake" value={sodiumIntake} onChange={setSodiumIntake} min={800} max={6000} step={50} suffix="mg" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Hydration & Electrolyte Calculator"
      description="Fluid balance model with sweat sodium loss, potassium and magnesium needs, hyponatremia risk, heat stroke risk, and athlete-mode hydration scoring."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="hydration-electrolyte-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Hydration & Electrolyte Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Hydration & Electrolyte Calculator" description="Advanced hydration and electrolyte calculator with sweat loss, heat risk, and sodium balance modeling." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedKetoMacroCalculator() {
  const [weight, setWeight] = useState(82)
  const [bodyFat, setBodyFat] = useState(24)
  const [goal, setGoal] = useState("fatLoss")
  const [activity, setActivity] = useState("moderate")
  const [bloodKetones, setBloodKetones] = useState(0.7)
  const [glucose, setGlucose] = useState(96)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const activityFactor = activity === "light" ? 1.3 : activity === "moderate" ? 1.45 : 1.65
    const calories = estimateCaloriesFromWeight(weight, activityFactor)
    const proteinPct = goal === "muscle" ? 0.24 : 0.22
    const carbPct = bloodKetones >= 1 ? 0.06 : 0.08
    const fatPct = 1 - proteinPct - carbPct
    const fatG = round0((calories * fatPct) / 9)
    const proteinG = round0((calories * proteinPct) / 4)
    const carbG = round0((calories * carbPct) / 4)
    const netCarbLimit = round0(Math.max(20, carbG - 8))
    const ketonePrediction = round1(Math.max(0.2, bloodKetones + (netCarbLimit <= 30 ? 0.5 : 0.15) - (activity === "high" ? 0.1 : 0)))
    const gki = round2(toMmolGlucose(glucose) / Math.max(bloodKetones, 0.1))
    const adaptationWeeks = round1(Math.max(2, 6 - bloodKetones - (activity === "high" ? 0.5 : 0)))
    const ketoFluRisk = clamp(round0((bloodKetones < 0.5 ? 28 : 10) + (netCarbLimit < 25 ? 16 : 6) + (activity === "high" ? 14 : 6)), 0, 100)
    const electrolyteNeed = round0(weight * 32 + (activity === "high" ? 550 : 280))
    const ketosisScore = clamp(round0(100 - gki * 7 - ketoFluRisk * 0.25 + ketonePrediction * 14), 5, 95)
    const band = bandFromScore(ketosisScore)
    const clinicalNote = `Ketosis probability is ${ketosisScore >= 75 ? "strong" : ketosisScore >= 50 ? "moderate" : "limited"}. Improve adaptation with tighter net carb control, electrolyte support, and patience during the first ${adaptationWeeks} weeks.`

    const snapshot = createSnapshot({
      toolId: "keto-macro-calculator",
      toolName: "Keto Macro Calculator",
      healthScore: ketosisScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(ketosisScore + 7), 0, 100),
      projection1Year: clamp(round0(ketosisScore + 10), 0, 100),
      weightKg: weight,
      calories,
      proteinG,
      carbsG: carbG,
      fatG,
      fastingGlucose: glucose,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Ketosis Probability", value: `${ketosisScore}/100`, status: statusFromBand(band), description: `GKI ${gki}`, icon: Flame },
      healthScore: ketosisScore,
      metrics: [
        { label: "Fat", value: `${fatG} g`, status: "good", icon: Beef },
        { label: "Protein", value: `${proteinG} g`, status: "good", icon: Shield },
        { label: "Carbs", value: `${carbG} g`, status: carbG <= 40 ? "good" : "warning", icon: Apple },
        { label: "Net Carb Limit", value: `${netCarbLimit} g`, status: netCarbLimit <= 30 ? "good" : "warning", icon: Scale },
        { label: "Predicted Ketones", value: `${ketonePrediction} mmol/L`, status: ketonePrediction >= 0.8 ? "good" : "warning", icon: Zap },
        { label: "GKI", value: gki, status: gki <= 6 ? "good" : gki <= 9 ? "warning" : "danger", icon: BarChart3 },
        { label: "Adaptation Timeline", value: `${adaptationWeeks} weeks`, status: adaptationWeeks <= 3.5 ? "good" : "warning", icon: Clock3 },
        { label: "Keto Flu Risk", value: `${ketoFluRisk}%`, status: ketoFluRisk < 30 ? "good" : ketoFluRisk < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Electrolyte Need", value: `${electrolyteNeed} mg sodium`, status: "good", icon: Droplets },
      ],
      recommendations: [
        { title: "AI Macro Recalibration", description: `Start around ${fatPct * 100}% fat, ${proteinPct * 100}% protein, and ${carbPct * 100}% carbs, then re-check blood ketones after 7-10 days.`, priority: "high", category: "Macros" },
        { title: "Electrolyte Requirement", description: `Target roughly ${electrolyteNeed} mg sodium daily plus potassium-rich low-carb foods to reduce keto flu and support performance.`, priority: "high", category: "Electrolytes" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { weight, bodyFat, goal, activity, bloodKetones, glucose, calories, fatPct, proteinPct, carbPct, fatG, proteinG, carbG, netCarbLimit, ketonePrediction, gki, adaptationWeeks, ketoFluRisk, electrolyteNeed, ketosisScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Macro Pie Proxy", subtitle: "Ketogenic macro emphasis", unit: "g", values: [
          { label: "Fat", value: fatG, color: "bg-amber-500" },
          { label: "Protein", value: proteinG, color: "bg-sky-500" },
          { label: "Carbs", value: carbG, color: "bg-emerald-500" },
        ] },
        { title: "Ketosis Meter", subtitle: "Current vs predicted ketones", unit: "mmol/L", values: [
          { label: "Current", value: bloodKetones, color: "bg-slate-500" },
          { label: "Predicted", value: ketonePrediction, color: "bg-emerald-500" },
        ] },
        { title: "Adaptation Timeline", subtitle: "Weeks to stable ketosis", unit: "weeks", values: [
          { label: "Timeline", value: adaptationWeeks, color: adaptationWeeks <= 3.5 ? "bg-emerald-500" : "bg-amber-500" },
        ] },
      ],
      research: { snapshot, netCarbLimit, ketonePrediction, gki, adaptationWeeks, ketoFluRisk, electrolyteNeed },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={40} max={220} suffix="kg" />
      <NumInput label="Body Fat" value={bodyFat} onChange={setBodyFat} min={6} max={50} suffix="%" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscle", label: "Lean Muscle" }]} />
      <SelectInput label="Activity" value={activity} onChange={setActivity} options={[{ value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
      <NumInput label="Blood Ketones" value={bloodKetones} onChange={setBloodKetones} min={0.1} max={5} step={0.1} suffix="mmol/L" />
      <NumInput label="Glucose" value={glucose} onChange={setGlucose} min={60} max={180} suffix="mg/dL" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Keto Macro Calculator"
      description="Ketosis intelligence engine with macro targeting, GKI, keto adaptation timeline, keto flu risk, and electrolyte support."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="keto-macro-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Keto Macro Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Keto Macro Calculator" description="Advanced keto macro calculator with GKI, ketosis probability, and electrolyte planning." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedIntermittentFastingWindowCalculator() {
  const [sleepStart, setSleepStart] = useState(23)
  const [sleepEnd, setSleepEnd] = useState(7)
  const [workStart, setWorkStart] = useState(9)
  const [workEnd, setWorkEnd] = useState(18)
  const [goal, setGoal] = useState("fatLoss")
  const [glucose, setGlucose] = useState(92)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const sleepHours = sleepEnd > sleepStart ? sleepEnd - sleepStart : 24 - sleepStart + sleepEnd
    const baseFast = goal === "fatLoss" ? 15 : goal === "maintenance" ? 14 : 13
    const fastingWindow = clamp(round0(baseFast + Math.max(0, glucose - 90) * 0.05 - (gender === "female" ? 1 : 0)), 12, 18)
    const eatingWindow = 24 - fastingWindow
    const insulinDrop = round0(fastingWindow * 3.2 + Math.max(0, glucose - 90) * 0.4)
    const autophagyProbability = clamp(round0((fastingWindow - 12) * 14 + (sleepHours >= 7 ? 8 : 0)), 0, 100)
    const alignmentPenalty = Math.abs((workStart - 9) * 2) + (sleepStart > 24 ? 0 : Math.max(0, sleepStart - 23) * 4)
    const cortisolImpact = clamp(round0(18 + alignmentPenalty + (sleepHours < 7 ? 16 : 4)), 0, 100)
    const hypoglycemiaRisk = clamp(round0((glucose < 80 ? 32 : 8) + (fastingWindow >= 16 ? 18 : 6) + (gender === "female" ? 6 : 0)), 0, 100)
    const fastingScore = clamp(round0(100 - cortisolImpact * 0.35 - hypoglycemiaRisk * 0.3 + autophagyProbability * 0.25), 5, 95)
    const band = bandFromScore(fastingScore)
    const feedStart = clamp(workStart + 1, 6, 14)
    const feedEnd = feedStart + eatingWindow
    const clinicalNote = `Recommended fasting window is ${fastingWindow}:${eatingWindow}. Best results come when the eating window starts near daylight hours and avoids late-night calorie load, especially if glucose control is the main goal.`

    const snapshot = createSnapshot({
      toolId: "intermittent-fasting-window",
      toolName: "Intermittent Fasting Window",
      healthScore: fastingScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(fastingScore + 6), 0, 100),
      projection1Year: clamp(round0(fastingScore + 9), 0, 100),
      fastingGlucose: glucose,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Fasting Window", value: `${fastingWindow} hrs`, status: statusFromBand(band), description: `Eating window ${eatingWindow} hrs`, icon: Clock3 },
      healthScore: fastingScore,
      metrics: [
        { label: "Recommended Fast", value: `${fastingWindow} hrs`, status: statusFromBand(band), icon: Clock3 },
        { label: "Eating Window", value: `${eatingWindow} hrs`, status: "good", icon: Apple },
        { label: "Insulin Drop", value: `${insulinDrop}%`, status: insulinDrop >= 40 ? "good" : "warning", icon: TrendingUp },
        { label: "Autophagy Probability", value: `${autophagyProbability}%`, status: autophagyProbability >= 50 ? "good" : "warning", icon: Activity },
        { label: "Cortisol Impact", value: `${cortisolImpact}%`, status: cortisolImpact < 35 ? "good" : cortisolImpact < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Hypoglycemia Risk", value: `${hypoglycemiaRisk}%`, status: hypoglycemiaRisk < 30 ? "good" : hypoglycemiaRisk < 55 ? "warning" : "danger", icon: Zap },
      ],
      recommendations: [
        { title: "AI Window Adjustment", description: `Suggested eating window is ${feedStart}:00 to ${feedEnd}:00. Keep the first meal close to active hours and avoid stacking most calories near bedtime.`, priority: "high", category: "Timing" },
        { title: "Female Hormone / Stress Guardrail", description: gender === "female" ? "Use shorter fasts on high-stress or poor-sleep days and avoid pushing fasting duration if energy, sleep, or cycle regularity worsen." : "No additional female-specific fasting guardrail applied.", priority: "medium", category: "Hormones" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { sleepStart, sleepEnd, workStart, workEnd, goal, glucose, gender, sleepHours, fastingWindow, eatingWindow, insulinDrop, autophagyProbability, cortisolImpact, hypoglycemiaRisk, fastingScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Fasting Timeline", subtitle: "Recommended circadian plan", unit: "hrs", values: [
          { label: "Fast", value: fastingWindow, color: "bg-sky-500" },
          { label: "Eat", value: eatingWindow, color: "bg-amber-500" },
        ] },
        { title: "Fat Burn Phase", subtitle: "Longer windows raise fat oxidation", values: [
          { label: "Autophagy", value: autophagyProbability, color: autophagyProbability >= 50 ? "bg-emerald-500" : "bg-amber-500" },
          { label: "Insulin Drop", value: insulinDrop, color: "bg-sky-500" },
        ] },
        { title: "Risk Controls", subtitle: "Stress and glucose safety", values: [
          { label: "Cortisol", value: cortisolImpact, color: cortisolImpact < 35 ? "bg-emerald-500" : cortisolImpact < 55 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Hypoglycemia", value: hypoglycemiaRisk, color: hypoglycemiaRisk < 30 ? "bg-emerald-500" : hypoglycemiaRisk < 55 ? "bg-amber-500" : "bg-rose-500" },
        ] },
      ],
      research: { snapshot, insulinDrop, autophagyProbability, cortisolImpact, hypoglycemiaRisk, feedStart, feedEnd },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Sleep Start" value={sleepStart} onChange={setSleepStart} min={18} max={24} step={1} suffix="24h" />
      <NumInput label="Wake Time" value={sleepEnd} onChange={setSleepEnd} min={0} max={12} step={1} suffix="24h" />
      <NumInput label="Work Start" value={workStart} onChange={setWorkStart} min={5} max={14} step={1} suffix="24h" />
      <NumInput label="Work End" value={workEnd} onChange={setWorkEnd} min={12} max={24} step={1} suffix="24h" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "glucose", label: "Glucose Control" }]} />
      <NumInput label="Glucose" value={glucose} onChange={setGlucose} min={65} max={180} suffix="mg/dL" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Intermittent Fasting Window"
      description="Circadian metabolic model with fasting window selection, insulin drop estimate, autophagy probability, cortisol rhythm impact, and hypoglycemia alert."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="intermittent-fasting-window"
      resultExtras={extra ? <MetabolicResultExtras title="Intermittent Fasting Window" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Intermittent Fasting Window" description="Advanced fasting window planner with circadian alignment, autophagy probability, and glucose safety modeling." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedMealCalorieBreakdownCalculator() {
  const [foodItems, setFoodItems] = useState(4)
  const [portionSize, setPortionSize] = useState(420)
  const [calories, setCalories] = useState(760)
  const [protein, setProtein] = useState(36)
  const [carbs, setCarbs] = useState(78)
  const [fat, setFat] = useState(22)
  const [fiber, setFiber] = useState(10)
  const [gi, setGi] = useState(58)
  const [cookingMethod, setCookingMethod] = useState("grilled")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const calorieDensity = round1(calories / Math.max(portionSize / 100, 0.1))
    const proteinCal = protein * 4
    const carbCal = carbs * 4
    const fatCal = fat * 9
    const gl = round1((gi * Math.max(0, carbs - fiber)) / 100)
    const insulinSpike = clamp(round0(gl * 2.3 + protein * 0.45 - fiber * 1.2), 0, 100)
    const thermicEffect = round0(proteinCal * 0.22 + carbCal * 0.08 + fatCal * 0.03)
    const methodImpact = cookingMethod === "fried" ? 16 : cookingMethod === "grilled" ? 6 : cookingMethod === "boiled" ? -4 : 2
    const adherenceScore = clamp(round0(100 - calorieDensity * 5 + fiber * 2 + protein * 0.7 - methodImpact), 5, 95)
    const band = bandFromScore(adherenceScore)
    const clinicalNote = `Meal profile is ${adherenceScore >= 75 ? "well balanced" : adherenceScore >= 50 ? "moderately energy-dense" : "high impact for overeating and glucose drift"}. Use more fiber and protein if satiety or glucose control is the priority.`

    const snapshot = createSnapshot({
      toolId: "meal-calorie-breakdown",
      toolName: "Meal Calorie Breakdown",
      healthScore: adherenceScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(adherenceScore + 5), 0, 100),
      projection1Year: clamp(round0(adherenceScore + 8), 0, 100),
      calories,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Meal Calories", value: `${calories} kcal`, status: statusFromBand(band), description: `${foodItems} items`, icon: Flame },
      healthScore: adherenceScore,
      metrics: [
        { label: "Protein", value: `${protein} g`, status: protein >= 25 ? "good" : "warning", icon: Shield },
        { label: "Carbs", value: `${carbs} g`, status: "good", icon: Apple },
        { label: "Fat", value: `${fat} g`, status: fat <= 30 ? "good" : "warning", icon: Beef },
        { label: "GI/GL", value: `${gi} / ${gl}`, status: gl < 20 ? "good" : gl < 30 ? "warning" : "danger", icon: BarChart3 },
        { label: "Insulin Spike", value: `${insulinSpike}%`, status: insulinSpike < 35 ? "good" : insulinSpike < 55 ? "warning" : "danger", icon: TrendingUp },
        { label: "Thermic Effect", value: `${thermicEffect} kcal`, status: thermicEffect >= 60 ? "good" : "warning", icon: Activity },
        { label: "Calorie Density", value: `${calorieDensity} kcal/100g`, status: calorieDensity < 175 ? "good" : calorieDensity < 250 ? "warning" : "danger", icon: Scale },
      ],
      recommendations: [
        { title: "AI Portion Correction", description: calorieDensity >= 220 ? `Portion is energy-dense. Dropping ${round0(portionSize * 0.15)} g or swapping some starch for vegetables would improve satiety.` : "Portion density is reasonable for most goals.", priority: "high", category: "Portion" },
        { title: "Thermic Effect Insight", description: `Estimated thermic effect is ${thermicEffect} kcal. Meals with more protein and intact fiber produce a larger metabolic cost and often better satiety.`, priority: "medium", category: "Metabolism" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { foodItems, portionSize, calories, protein, carbs, fat, fiber, gi, cookingMethod, calorieDensity, gl, insulinSpike, thermicEffect, adherenceScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Meal Macro Chart", subtitle: "Energy contributors", unit: "g", values: [
          { label: "Protein", value: protein, color: "bg-sky-500" },
          { label: "Carbs", value: carbs, color: "bg-amber-500" },
          { label: "Fat", value: fat, color: "bg-rose-500" },
        ] },
        { title: "Calorie Density Meter", subtitle: "Lower improves satiety", values: [
          { label: "Density", value: calorieDensity, color: calorieDensity < 175 ? "bg-emerald-500" : calorieDensity < 250 ? "bg-amber-500" : "bg-rose-500" },
        ] },
        { title: "Glycemic Impact", subtitle: "Meal glucose load", values: [
          { label: "GL", value: gl, color: gl < 20 ? "bg-emerald-500" : gl < 30 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Insulin Spike", value: insulinSpike, color: insulinSpike < 35 ? "bg-emerald-500" : insulinSpike < 55 ? "bg-amber-500" : "bg-rose-500" },
        ] },
      ],
      research: { snapshot, calorieDensity, gl, insulinSpike, thermicEffect, adherenceScore },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Food Items" value={foodItems} onChange={setFoodItems} min={1} max={12} step={1} suffix="items" />
      <NumInput label="Portion Size" value={portionSize} onChange={setPortionSize} min={100} max={1200} step={10} suffix="g" />
      <NumInput label="Calories" value={calories} onChange={setCalories} min={50} max={2000} step={10} suffix="kcal" />
      <NumInput label="Protein" value={protein} onChange={setProtein} min={0} max={120} suffix="g" />
      <NumInput label="Carbs" value={carbs} onChange={setCarbs} min={0} max={220} suffix="g" />
      <NumInput label="Fat" value={fat} onChange={setFat} min={0} max={120} suffix="g" />
      <NumInput label="Fiber" value={fiber} onChange={setFiber} min={0} max={40} suffix="g" />
      <NumInput label="GI" value={gi} onChange={setGi} min={0} max={110} suffix="GI" />
      <SelectInput label="Cooking Method" value={cookingMethod} onChange={setCookingMethod} options={[{ value: "boiled", label: "Boiled" }, { value: "grilled", label: "Grilled" }, { value: "baked", label: "Baked" }, { value: "fried", label: "Fried" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Meal Calorie Breakdown"
      description="Analyze meal calories, macro spread, glycemic load, insulin spike potential, thermic effect, and portion-driven energy density."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="meal-calorie-breakdown"
      resultExtras={extra ? <MetabolicResultExtras title="Meal Calorie Breakdown" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Meal Calorie Breakdown" description="Advanced meal calorie breakdown with glycemic load, macro analysis, and thermic effect." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedNutritionLabelCalculator() {
  const [servingSize, setServingSize] = useState(45)
  const [calories, setCalories] = useState(220)
  const [protein, setProtein] = useState(6)
  const [carbs, setCarbs] = useState(28)
  const [fat, setFat] = useState(8)
  const [sodium, setSodium] = useState(420)
  const [sugar, setSugar] = useState(14)
  const [fiber, setFiber] = useState(2)
  const [additives, setAdditives] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const dvCalories = round0((calories / 2000) * 100)
    const dvCarbs = round0((carbs / 275) * 100)
    const dvFat = round0((fat / 78) * 100)
    const dvSodium = round0((sodium / 2300) * 100)
    const dvSugar = round0((sugar / 50) * 100)
    const hiddenSugarFlag = sugar >= 10 && fiber <= 2 && protein <= 5
    const ultraProcessedScore = clamp(round0(additives * 11 + sugar * 1.5 + Math.max(0, sodium - 300) * 0.03 - protein * 1.2 - fiber * 3), 0, 100)
    const novaClass = ultraProcessedScore >= 65 ? "NOVA 4" : ultraProcessedScore >= 45 ? "NOVA 3" : ultraProcessedScore >= 25 ? "NOVA 2" : "NOVA 1"
    const additiveRisk = clamp(round0(additives * 14 + Math.max(0, sodium - 350) * 0.04), 0, 100)
    const healthRating = clamp(round0(100 - ultraProcessedScore * 0.65 - additiveRisk * 0.25 - Math.max(0, dvSodium - 15)), 5, 95)
    const band = bandFromScore(healthRating)
    const clinicalNote = `Label quality reads as ${band === "Green" ? "generally acceptable" : band === "Yellow" ? "moderately processed" : "heavily processed"}. Ingredient complexity, sugar density, and sodium are the fastest levers for public-health risk.`

    const snapshot = createSnapshot({
      toolId: "nutrition-label-calculator",
      toolName: "Nutrition Label Calculator",
      healthScore: healthRating,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(healthRating + 4), 0, 100),
      projection1Year: clamp(round0(healthRating + 7), 0, 100),
      calories,
      proteinG: protein,
      carbsG: carbs,
      fatG: fat,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Health Rating", value: `${healthRating}/100`, status: statusFromBand(band), description: novaClass, icon: Shield },
      healthScore: healthRating,
      metrics: [
        { label: "% DV Calories", value: `${dvCalories}%`, status: dvCalories <= 12 ? "good" : "warning", icon: Flame },
        { label: "% DV Carbs", value: `${dvCarbs}%`, status: dvCarbs <= 18 ? "good" : "warning", icon: Apple },
        { label: "% DV Fat", value: `${dvFat}%`, status: dvFat <= 20 ? "good" : "warning", icon: Beef },
        { label: "% DV Sodium", value: `${dvSodium}%`, status: dvSodium <= 15 ? "good" : dvSodium <= 25 ? "warning" : "danger", icon: Waves },
        { label: "% DV Sugar", value: `${dvSugar}%`, status: dvSugar <= 20 ? "good" : "danger", icon: AlertTriangle },
        { label: "Ultra-Processed Score", value: `${ultraProcessedScore}/100`, status: ultraProcessedScore < 35 ? "good" : ultraProcessedScore < 60 ? "warning" : "danger", icon: BarChart3 },
        { label: "Hidden Sugar Flag", value: hiddenSugarFlag ? "Yes" : "No", status: hiddenSugarFlag ? "danger" : "good", icon: AlertTriangle },
        { label: "Additive Risk", value: `${additiveRisk}/100`, status: additiveRisk < 35 ? "good" : additiveRisk < 60 ? "warning" : "danger", icon: Activity },
      ],
      recommendations: [
        { title: "AI Label Interpretation", description: `This serving provides ${dvSodium}% sodium DV and ${dvSugar}% sugar DV. It scores ${ultraProcessedScore}/100 for processing intensity, so it is best treated as an occasional rather than staple food if the score stays high.`, priority: "high", category: "Interpretation" },
        { title: "NOVA Classification", description: `${novaClass} classification estimated from additive load, sugar density, and fiber-protein balance. Lower-NOVA choices are usually easier to fit into cardio-metabolic risk reduction plans.`, priority: "medium", category: "NOVA" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { servingSize, calories, protein, carbs, fat, sodium, sugar, fiber, additives, dvCalories, dvCarbs, dvFat, dvSodium, dvSugar, hiddenSugarFlag, ultraProcessedScore, novaClass, additiveRisk, healthRating },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Health Rating Score", subtitle: "Label quality summary", values: [
          { label: "Rating", value: healthRating, color: getBandClasses(band) },
          { label: "Processing", value: ultraProcessedScore, color: ultraProcessedScore < 35 ? "bg-emerald-500" : ultraProcessedScore < 60 ? "bg-amber-500" : "bg-rose-500" },
        ] },
        { title: "Daily Value Exposure", subtitle: "Percent DV per serving", unit: "%", values: [
          { label: "Sodium", value: dvSodium, color: "bg-amber-500" },
          { label: "Sugar", value: dvSugar, color: "bg-rose-500" },
          { label: "Fat", value: dvFat, color: "bg-sky-500" },
        ] },
        { title: "Additive Risk", subtitle: "Lower is better", values: [
          { label: "Additives", value: additiveRisk, color: additiveRisk < 35 ? "bg-emerald-500" : additiveRisk < 60 ? "bg-amber-500" : "bg-rose-500" },
        ] },
      ],
      research: { snapshot, dvCalories, dvCarbs, dvFat, dvSodium, dvSugar, hiddenSugarFlag, ultraProcessedScore, novaClass, additiveRisk },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Serving Size" value={servingSize} onChange={setServingSize} min={10} max={300} step={5} suffix="g" />
      <NumInput label="Calories" value={calories} onChange={setCalories} min={0} max={1200} suffix="kcal" />
      <NumInput label="Protein" value={protein} onChange={setProtein} min={0} max={60} suffix="g" />
      <NumInput label="Carbs" value={carbs} onChange={setCarbs} min={0} max={150} suffix="g" />
      <NumInput label="Fat" value={fat} onChange={setFat} min={0} max={80} suffix="g" />
      <NumInput label="Sodium" value={sodium} onChange={setSodium} min={0} max={3000} suffix="mg" />
      <NumInput label="Sugar" value={sugar} onChange={setSugar} min={0} max={80} suffix="g" />
      <NumInput label="Fiber" value={fiber} onChange={setFiber} min={0} max={30} suffix="g" />
      <NumInput label="Additives Count" value={additives} onChange={setAdditives} min={0} max={20} step={1} suffix="count" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Nutrition Label Calculator"
      description="Clinical food label interpretation with percent daily values, hidden sugar detection, NOVA class, additive risk, and public-health nutrition scoring."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="nutrition-label-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Nutrition Label Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Nutrition Label Calculator" description="Advanced nutrition label calculator with NOVA class, daily value analysis, and additive risk scoring." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedOmega3IntakeCalculator() {
  const [fishFrequency, setFishFrequency] = useState(2)
  const [supplementDose, setSupplementDose] = useState(600)
  const [ldl, setLdl] = useState(118)
  const [hdl, setHdl] = useState(46)
  const [triglycerides, setTriglycerides] = useState(165)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const fishDerived = round0((fishFrequency * 650) / 7)
    const totalOmega3 = fishDerived + supplementDose
    const omegaRatio = round1(12000 / Math.max(totalOmega3, 200))
    const inflammationReduction = clamp(round0(totalOmega3 / 100), 0, 35)
    const triglycerideImprovement = clamp(round0(totalOmega3 / 150), 0, 30)
    const antiInflammatoryScore = clamp(round0(totalOmega3 / 20 - Math.max(0, triglycerides - 150) * 0.15 + 35), 5, 95)
    const cvdCorrection = clamp(round0(antiInflammatoryScore - Math.max(0, ldl - 100) * 0.22 - Math.max(0, triglycerides - 150) * 0.18), 5, 95)
    const band = bandFromScore(cvdCorrection)
    const clinicalNote = `EPA+DHA intake is ${totalOmega3} mg/day. Cardio-metabolic benefit becomes more reliable once intake moves toward 1000-2000 mg/day, especially when triglycerides are elevated.`

    const snapshot = createSnapshot({
      toolId: "omega3-intake-calculator",
      toolName: "Omega-3 Intake Calculator",
      healthScore: cvdCorrection,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(cvdCorrection + 7), 0, 100),
      projection1Year: clamp(round0(cvdCorrection + 10), 0, 100),
      ldl,
      hdl,
      triglycerides,
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "EPA + DHA Total", value: `${totalOmega3} mg/day`, status: statusFromBand(band), description: `${omegaRatio}:1 omega-6:3 ratio proxy`, icon: Fish },
      healthScore: cvdCorrection,
      metrics: [
        { label: "Fish-Derived", value: `${fishDerived} mg/day`, status: fishFrequency >= 2 ? "good" : "warning", icon: Fish },
        { label: "Supplement", value: `${supplementDose} mg/day`, status: supplementDose >= 500 ? "good" : "warning", icon: Shield },
        { label: "Omega 6:3 Ratio", value: `${omegaRatio}:1`, status: omegaRatio <= 4 ? "good" : omegaRatio <= 8 ? "warning" : "danger", icon: BarChart3 },
        { label: "Inflammation Reduction", value: `${inflammationReduction}%`, status: inflammationReduction >= 15 ? "good" : "warning", icon: Flame },
        { label: "TG Improvement", value: `${triglycerideImprovement}%`, status: triglycerideImprovement >= 10 ? "good" : "warning", icon: TrendingUp },
        { label: "Anti-Inflammatory Score", value: `${antiInflammatoryScore}/100`, status: antiInflammatoryScore >= 70 ? "good" : antiInflammatoryScore >= 50 ? "warning" : "danger", icon: Heart },
        { label: "CVD Risk Correction", value: `${cvdCorrection}/100`, status: statusFromBand(band), icon: Activity },
      ],
      recommendations: [
        { title: "AI Anti-Inflammatory Score", description: `Total EPA+DHA is ${totalOmega3} mg/day. Increase oily fish frequency or supplement dose if triglycerides stay above 150 mg/dL or ratio remains above 4:1.`, priority: "high", category: "Inflammation" },
        { title: "Triglyceride Improvement Prediction", description: `Current model estimates roughly ${triglycerideImprovement}% triglyceride improvement with the current omega-3 intake pattern, assuming adherence for several weeks.`, priority: "medium", category: "Prediction" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { fishFrequency, supplementDose, ldl, hdl, triglycerides, fishDerived, totalOmega3, omegaRatio, inflammationReduction, triglycerideImprovement, antiInflammatoryScore, cvdCorrection },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Ratio Graph", subtitle: "Lower omega-6:3 ratio is preferred", values: [
          { label: "Current Ratio", value: omegaRatio, color: omegaRatio <= 4 ? "bg-emerald-500" : omegaRatio <= 8 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Target", value: 4, color: "bg-slate-500" },
        ] },
        { title: "Target Comparison", subtitle: "EPA + DHA intake", unit: "mg", values: [
          { label: "Current", value: totalOmega3, color: "bg-sky-500" },
          { label: "Target", value: 1000, color: "bg-emerald-500" },
        ] },
        { title: "Lipid Response", subtitle: "Predicted triglyceride benefit", values: [
          { label: "TG Improvement", value: triglycerideImprovement, color: "bg-emerald-500" },
          { label: "Inflammation Reduction", value: inflammationReduction, color: "bg-amber-500" },
        ] },
      ],
      research: { snapshot, totalOmega3, omegaRatio, inflammationReduction, triglycerideImprovement, antiInflammatoryScore, cvdCorrection },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Fish Intake Frequency" value={fishFrequency} onChange={setFishFrequency} min={0} max={7} step={1} suffix="times/week" />
      <NumInput label="Supplement Dose" value={supplementDose} onChange={setSupplementDose} min={0} max={4000} step={100} suffix="mg/day" />
      <NumInput label="LDL" value={ldl} onChange={setLdl} min={50} max={250} suffix="mg/dL" />
      <NumInput label="HDL" value={hdl} onChange={setHdl} min={20} max={100} suffix="mg/dL" />
      <NumInput label="Triglycerides" value={triglycerides} onChange={setTriglycerides} min={40} max={500} suffix="mg/dL" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Omega-3 Intake Calculator"
      description="Inflammation and cardiology nutrition tool with EPA+DHA totals, omega ratio modeling, triglyceride prediction, and CVD risk correction."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="omega3-intake-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Omega-3 Intake Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Omega-3 Intake Calculator" description="Advanced omega-3 intake calculator with EPA DHA totals, omega ratio, and triglyceride prediction." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedCalciumIntakeCalculator() {
  const [age, setAge] = useState(44)
  const [gender, setGender] = useState("female")
  const [dairyServings, setDairyServings] = useState(2)
  const [vitaminDLevel, setVitaminDLevel] = useState(24)
  const [supplement, setSupplement] = useState(300)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = age >= 51 || age <= 18 ? 1200 : 1000
    const dietaryCalcium = dairyServings * 300 + 120
    const totalCalcium = dietaryCalcium + supplement
    const absorption = clamp(round0(22 + vitaminDLevel * 0.45 - Math.max(0, age - 50) * 0.15), 18, 38)
    const adequacy = round0((totalCalcium / rda) * 100)
    const fractureRisk = clamp(round0((adequacy < 90 ? 28 : 8) + (vitaminDLevel < 20 ? 24 : 8) + (age > 60 ? 18 : 6) + (gender === "female" && age > 50 ? 12 : 0)), 0, 100)
    const boneLossRate = round1(Math.max(0.2, 1.8 - adequacy * 0.008 - vitaminDLevel * 0.02))
    const boneHealthScore = clamp(round0(adequacy * 0.55 + absorption * 1.2 - fractureRisk * 0.25), 5, 95)
    const band = bandFromScore(boneHealthScore)
    const clinicalNote = `Calcium plan is ${adequacy >= 100 ? "adequate" : "below target"}. Fracture risk modeling improves most when calcium adequacy and vitamin D sufficiency are both addressed rather than calcium alone.`

    const snapshot = createSnapshot({
      toolId: "calcium-intake-calculator",
      toolName: "Calcium Intake Calculator",
      healthScore: boneHealthScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(boneHealthScore + 5), 0, 100),
      projection1Year: clamp(round0(boneHealthScore + 9), 0, 100),
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Calcium Adequacy", value: `${adequacy}%`, status: statusFromBand(band), description: `${totalCalcium} mg / ${rda} mg`, icon: Scale },
      healthScore: boneHealthScore,
      metrics: [
        { label: "RDA", value: `${rda} mg`, status: "good", icon: Shield },
        { label: "Dietary Calcium", value: `${dietaryCalcium} mg`, status: "good", icon: Apple },
        { label: "Supplement", value: `${supplement} mg`, status: supplement <= 600 ? "good" : "warning", icon: Zap },
        { label: "Absorption Estimate", value: `${absorption}%`, status: absorption >= 28 ? "good" : "warning", icon: Activity },
        { label: "Fracture Risk", value: `${fractureRisk}%`, status: fractureRisk < 30 ? "good" : fractureRisk < 55 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Bone Loss Rate", value: `${boneLossRate}%/yr`, status: boneLossRate <= 0.7 ? "good" : boneLossRate <= 1.1 ? "warning" : "danger", icon: TrendingUp },
        { label: "Bone Health Score", value: `${boneHealthScore}/100`, status: statusFromBand(band), icon: Heart },
      ],
      recommendations: [
        { title: "AI Osteoporosis Alert", description: fractureRisk >= 55 ? "Bone-support plan is underpowered. Improve calcium adequacy, vitamin D status, and strength training exposure." : "Current calcium plan is workable, but vitamin D sufficiency still matters for long-term bone retention.", priority: "high", category: "Bone" },
        { title: "Absorption Guidance", description: `Estimated absorption is ${absorption}%. Split larger calcium doses and avoid relying only on supplements if diet quality can be improved.`, priority: "medium", category: "Absorption" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { age, gender, dairyServings, vitaminDLevel, supplement, rda, dietaryCalcium, totalCalcium, absorption, adequacy, fractureRisk, boneLossRate, boneHealthScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Calcium Adequacy Meter", subtitle: "Target intake coverage", unit: "mg", values: [
          { label: "Current", value: totalCalcium, color: "bg-sky-500" },
          { label: "RDA", value: rda, color: "bg-slate-500" },
        ] },
        { title: "Bone Health Score", subtitle: "Higher is better", values: [
          { label: "Score", value: boneHealthScore, color: getBandClasses(band) },
          { label: "Fracture Risk", value: fractureRisk, color: fractureRisk < 30 ? "bg-emerald-500" : fractureRisk < 55 ? "bg-amber-500" : "bg-rose-500" },
        ] },
        { title: "Intake Trend Proxy", subtitle: "Diet vs supplement", unit: "mg", values: [
          { label: "Diet", value: dietaryCalcium, color: "bg-emerald-500" },
          { label: "Supplement", value: supplement, color: "bg-amber-500" },
        ] },
      ],
      research: { snapshot, totalCalcium, absorption, adequacy, fractureRisk, boneLossRate, boneHealthScore },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} />
      <NumInput label="Dairy Intake" value={dairyServings} onChange={setDairyServings} min={0} max={8} step={1} suffix="servings/day" />
      <NumInput label="Vitamin D Level" value={vitaminDLevel} onChange={setVitaminDLevel} min={5} max={100} suffix="ng/mL" />
      <NumInput label="Calcium Supplement" value={supplement} onChange={setSupplement} min={0} max={1500} step={50} suffix="mg" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Calcium Intake Calculator"
      description="Bone mineral density support with calcium adequacy, absorption estimate, fracture risk projection, and bone loss modeling."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="calcium-intake-calculator"
      resultExtras={extra ? <MetabolicResultExtras title="Calcium Intake Calculator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Calcium Intake Calculator" description="Advanced calcium intake calculator with absorption, fracture risk, and bone loss projection." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

export function AdvancedMagnesiumIntakeEstimator() {
  const [age, setAge] = useState(34)
  const [gender, setGender] = useState("female")
  const [dietQuality, setDietQuality] = useState("average")
  const [stressLevel, setStressLevel] = useState(7)
  const [sleepHours, setSleepHours] = useState(6.3)
  const [crampsPerWeek, setCrampsPerWeek] = useState(3)
  const [magnesiumRichServings, setMagnesiumRichServings] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [extra, setExtra] = useExtraState()

  const calculate = () => {
    const rda = gender === "male" ? (age >= 31 ? 420 : 400) : (age >= 31 ? 320 : 310)
    const dietBase = dietQuality === "poor" ? 180 : dietQuality === "average" ? 250 : 320
    const intakeEstimate = round0(dietBase + magnesiumRichServings * 45)
    const deficiencyProbability = clamp(round0((intakeEstimate < rda ? 42 : 12) + stressLevel * 4 + Math.max(0, 7 - sleepHours) * 8 + crampsPerWeek * 4), 0, 100)
    const sleepImprovement = clamp(round0(Math.max(0, rda - intakeEstimate) * 0.05 + stressLevel * 1.8), 0, 35)
    const insulinSensitivityEffect = clamp(round0(intakeEstimate / rda * 55 + (sleepHours - 6) * 8 - stressLevel * 3), 5, 95)
    const migraineRisk = clamp(round0(stressLevel * 7 + crampsPerWeek * 6 + Math.max(0, rda - intakeEstimate) * 0.08), 0, 100)
    const healthScore = clamp(round0(100 - deficiencyProbability * 0.6 - migraineRisk * 0.2 + insulinSensitivityEffect * 0.25), 5, 95)
    const band = bandFromScore(healthScore)
    const clinicalNote = `Magnesium pattern suggests ${deficiencyProbability >= 60 ? "high deficiency likelihood" : deficiencyProbability >= 35 ? "moderate deficiency pressure" : "reasonably supported status"}. Stress, sleep loss, cramps, and poor diet quality often amplify the need for magnesium-rich foods.`

    const snapshot = createSnapshot({
      toolId: "magnesium-intake",
      toolName: "Magnesium Intake Estimator",
      healthScore,
      riskClass: band,
      clinicalNote,
      projection3Month: clamp(round0(healthScore + 6), 0, 100),
      projection1Year: clamp(round0(healthScore + 9), 0, 100),
    })
    saveSnapshot(snapshot)

    setResult({
      primaryMetric: { label: "Magnesium Score", value: `${healthScore}/100`, status: statusFromBand(band), description: `${intakeEstimate} mg vs ${rda} mg`, icon: Moon },
      healthScore,
      metrics: [
        { label: "Estimated Intake", value: `${intakeEstimate} mg`, status: intakeEstimate >= rda ? "good" : "warning", icon: Apple },
        { label: "RDA", value: `${rda} mg`, status: "good", icon: Shield },
        { label: "Deficiency Probability", value: `${deficiencyProbability}%`, status: deficiencyProbability < 35 ? "good" : deficiencyProbability < 60 ? "warning" : "danger", icon: AlertTriangle },
        { label: "Sleep Improvement", value: `${sleepImprovement}%`, status: sleepImprovement >= 15 ? "good" : "warning", icon: Moon },
        { label: "Insulin Sensitivity", value: `${insulinSensitivityEffect}/100`, status: insulinSensitivityEffect >= 60 ? "good" : "warning", icon: Zap },
        { label: "Migraine Risk", value: `${migraineRisk}%`, status: migraineRisk < 35 ? "good" : migraineRisk < 60 ? "warning" : "danger", icon: Brain },
        { label: "Cramps Frequency", value: `${crampsPerWeek}/week`, status: crampsPerWeek <= 1 ? "good" : crampsPerWeek <= 3 ? "warning" : "danger", icon: Activity },
      ],
      recommendations: [
        { title: "AI Stress Correlation", description: `Stress level ${stressLevel}/10 is materially increasing magnesium pressure. Improve intake from nuts, seeds, legumes, cocoa, and leafy greens before relying only on supplements.`, priority: "high", category: "Stress" },
        { title: "Sleep And Neuromuscular Support", description: `Estimated sleep improvement from correcting magnesium gap is ${sleepImprovement}%. Cramps and short sleep usually improve when both intake and hydration are addressed.`, priority: "medium", category: "Sleep" },
        { title: "Clinical Focus", description: clinicalNote, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: { age, gender, dietQuality, stressLevel, sleepHours, crampsPerWeek, magnesiumRichServings, rda, intakeEstimate, deficiencyProbability, sleepImprovement, insulinSensitivityEffect, migraineRisk, healthScore },
    })

    setExtra({
      snapshot,
      clinicalNote,
      graphs: [
        { title: "Magnesium Score", subtitle: "Overall adequacy", values: [
          { label: "Score", value: healthScore, color: getBandClasses(band) },
          { label: "Deficiency", value: deficiencyProbability, color: deficiencyProbability < 35 ? "bg-emerald-500" : deficiencyProbability < 60 ? "bg-amber-500" : "bg-rose-500" },
        ] },
        { title: "Sleep vs Magnesium", subtitle: "Support potential", values: [
          { label: "Sleep Gain", value: sleepImprovement, color: "bg-sky-500" },
          { label: "Insulin Sensitivity", value: insulinSensitivityEffect, color: "bg-emerald-500" },
        ] },
        { title: "Neurology Risk", subtitle: "Migraine and cramps pressure", values: [
          { label: "Migraine Risk", value: migraineRisk, color: migraineRisk < 35 ? "bg-emerald-500" : migraineRisk < 60 ? "bg-amber-500" : "bg-rose-500" },
          { label: "Cramps x10", value: crampsPerWeek * 10, color: crampsPerWeek <= 1 ? "bg-emerald-500" : crampsPerWeek <= 3 ? "bg-amber-500" : "bg-rose-500" },
        ] },
      ],
      research: { snapshot, intakeEstimate, deficiencyProbability, sleepImprovement, insulinSensitivityEffect, migraineRisk },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "female", label: "Female" }, { value: "male", label: "Male" }]} />
      <SelectInput label="Diet Quality" value={dietQuality} onChange={setDietQuality} options={[{ value: "poor", label: "Poor" }, { value: "average", label: "Average" }, { value: "good", label: "Good" }]} />
      <NumInput label="Stress Level" value={stressLevel} onChange={setStressLevel} min={1} max={10} step={1} suffix="/10" />
      <NumInput label="Sleep Hours" value={sleepHours} onChange={setSleepHours} min={3} max={10} step={0.1} suffix="hrs" />
      <NumInput label="Cramps Frequency" value={crampsPerWeek} onChange={setCrampsPerWeek} min={0} max={14} step={1} suffix="per week" />
      <NumInput label="Magnesium-Rich Servings" value={magnesiumRichServings} onChange={setMagnesiumRichServings} min={0} max={8} step={1} suffix="per day" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Magnesium Intake Estimator"
      description="Neuromuscular optimizer with deficiency probability, sleep impact, insulin sensitivity effect, migraine risk association, and stress-linked magnesium scoring."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Nutrition & Calorie Tracking"
      toolId="magnesium-intake"
      resultExtras={extra ? <MetabolicResultExtras title="Magnesium Intake Estimator" extra={extra} /> : null}
      seoContent={<SeoContentGenerator title="Magnesium Intake Estimator" description="Advanced magnesium estimator with deficiency, sleep, insulin sensitivity, and migraine risk analysis." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}