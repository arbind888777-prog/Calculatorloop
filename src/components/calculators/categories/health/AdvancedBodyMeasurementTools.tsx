"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Scale, Ruler, Activity, Heart, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, User, Brain, Zap, BarChart3,
  Target, Dumbbell, Flame, Droplets, Moon, Shield, Info
} from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Filler,
  Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Title, Tooltip, Legend)

// ─── Shared helpers ───────────────────────────────────────────────────────────
const r0 = (n: number) => Math.round(n)
const r1 = (n: number) => Math.round(n * 10) / 10
const r2 = (n: number) => Math.round(n * 100) / 100
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

function SegmentBar({ value, min, max, zones }: {
  value: number; min: number; max: number
  zones: { label: string; max: number; color: string }[]
}) {
  const pct = (v: number) => clamp(((v - min) / (max - min)) * 100, 0, 100)
  return (
    <div className="space-y-1">
      <div className="relative h-5 rounded-full overflow-hidden flex">
        {zones.map((z, i) => {
          const lo = i === 0 ? min : zones[i - 1].max
          const w = pct(z.max) - pct(lo)
          return <div key={i} style={{ width: `${w}%` }} className={`${z.color} transition-all duration-300`} />
        })}
        <div
          className="absolute top-0 h-full w-1 bg-white/90 rounded-full shadow-md transition-all duration-500"
          style={{ left: `${pct(value)}%`, transform: "translateX(-50%)" }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {zones.map(z => <span key={z.label}>{z.label}</span>)}
      </div>
    </div>
  )
}

function InfoRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold">{value}</span>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  )
}

function GenderBtn({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {["male", "female"].map(g => (
        <button key={g} onClick={() => onChange(g)}
          className={`py-2.5 rounded-xl border text-sm font-medium transition-colors ${value === g ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
          {g === "male" ? "👨 Male" : "👩 Female"}
        </button>
      ))}
    </div>
  )
}

function UnitToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[["metric", "Metric (kg/cm)"], ["imperial", "Imperial (lbs/in)"]].map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`py-2 rounded-xl border text-xs font-medium transition-colors ${value === v ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
          {l}
        </button>
      ))}
    </div>
  )
}

function NumField({ label, value, onChange, min, max, step = 0.1, suffix }: {
  label: string; value: number; onChange: (n: number) => void
  min: number; max: number; step?: number; suffix?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}{suffix && <span className="ml-1 text-muted-foreground text-xs">({suffix})</span>}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 focus:border-primary focus:outline-none transition-colors text-sm" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 focus:border-primary focus:outline-none transition-colors text-sm">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function RiskBadge({ level }: { level: 'low' | 'moderate' | 'high' | 'very-high' }) {
  const map = {
    'low': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'moderate': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'high': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'very-high': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${map[level]}`}>{level.replace('-', ' ').toUpperCase()}</span>
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">{title}</h3>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ADVANCED BMI CALCULATOR – CLINICAL VERSION
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedBMICalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [waist, setWaist] = useState(85)
  const [unitSystem, setUnitSystem] = useState("metric")
  const [isAthlete, setIsAthlete] = useState(false)
  const [frameSize, setFrameSize] = useState("medium")
  const [ethnicity, setEthnicity] = useState("general")
  const [simWeight, setSimWeight] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [details, setDetails] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [bmiHistory, setBmiHistory] = useState<{d: string; v: number}[]>([])
  const [bmiTrend, setBmiTrend] = useState<any>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('growth:bmi-calculator')
      if (raw) {
        const h = JSON.parse(raw)
        if (Array.isArray(h) && h.length >= 2) {
          setBmiHistory(h)
          setBmiTrend({ labels: h.map((e: any) => e.d), datasets: [{ label: 'BMI', data: h.map((e: any) => e.v), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2 }] })
        }
      }
    } catch {}
  }, [])

  const calcBMI = () => {
    const wKg = unitSystem === "imperial" ? weight / 2.20462 : weight
    const hCm = unitSystem === "imperial" ? height * 2.54 : height
    const hM = hCm / 100

    const bmi = r1(wKg / (hM * hM))
    const bmiPrime = r2(bmi / 25)

    // WHO categories
    let whoCategory = ""
    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high' = 'low'
    let status: 'good' | 'normal' | 'warning' | 'danger' = 'good'
    let healthScore = 90

    if (bmi < 16) { whoCategory = "Severe Thinness (III)"; riskLevel = 'very-high'; status = 'danger'; healthScore = 30 }
    else if (bmi < 17) { whoCategory = "Moderate Thinness (II)"; riskLevel = 'high'; status = 'danger'; healthScore = 45 }
    else if (bmi < 18.5) { whoCategory = "Mild Thinness (I) / Underweight"; riskLevel = 'moderate'; status = 'warning'; healthScore = 65 }
    else if (bmi < 25) { whoCategory = "Normal Weight"; riskLevel = 'low'; status = 'good'; healthScore = 95 }
    else if (bmi < 30) { whoCategory = "Overweight"; riskLevel = 'moderate'; status = 'warning'; healthScore = 70 }
    else if (bmi < 35) { whoCategory = "Obesity Class I"; riskLevel = 'high'; status = 'danger'; healthScore = 50 }
    else if (bmi < 40) { whoCategory = "Obesity Class II"; riskLevel = 'very-high'; status = 'danger'; healthScore = 35 }
    else { whoCategory = "Obesity Class III (Morbid)"; riskLevel = 'very-high'; status = 'danger'; healthScore = 20 }

    // Asian cutoffs (lower thresholds)
    let asianCategory = ""
    if (ethnicity === "asian") {
      if (bmi < 18.5) asianCategory = "Underweight"
      else if (bmi < 23) asianCategory = "Normal"
      else if (bmi < 27.5) asianCategory = "Overweight (Asian Risk)"
      else asianCategory = "Obese (Asian)"
    }

    // Military standard
    let militaryCategory = ""
    if (gender === "male") {
      if (bmi < 20) militaryCategory = "Below Standard"
      else if (bmi <= 25) militaryCategory = "Meets Standard"
      else if (bmi <= 27.5) militaryCategory = "Marginal – Extra screening"
      else militaryCategory = "Does Not Meet Standard"
    } else {
      if (bmi < 19) militaryCategory = "Below Standard"
      else if (bmi <= 26) militaryCategory = "Meets Standard"
      else if (bmi <= 29) militaryCategory = "Marginal"
      else militaryCategory = "Does Not Meet Standard"
    }

    // Healthy weight range
    const minHealthyKg = r1(18.5 * hM * hM)
    const maxHealthyKg = r1(24.9 * hM * hM)

    // Ideal weight (Devine formula)
    let idealKg: number
    if (gender === "male") idealKg = r1(50 + 2.3 * (hCm / 2.54 - 60))
    else idealKg = r1(45.5 + 2.3 * (hCm / 2.54 - 60))

    // Frame size adjustment
    const frameAdjust = { small: -2, medium: 0, large: 2 }[frameSize] ?? 0
    const adjustedIdeal = r1(idealKg + frameAdjust)

    // Athlete mode
    const athleteNote = isAthlete
      ? "⚠️ Athlete Mode: BMI overestimates fatness in muscular individuals. Lean mass correction suggests actual fat risk may be lower."
      : ""

    // Metabolic risk (BMI + Waist + Age proxy)
    const waistRisk = waist > (gender === "male" ? 102 : 88) ? 20 : waist > (gender === "male" ? 94 : 80) ? 10 : 0
    const ageRisk = age > 60 ? 10 : age > 45 ? 5 : 0
    const bmiRisk = bmi > 30 ? 30 : bmi > 25 ? 15 : bmi > 18.5 ? 0 : 10
    const metabolicRisk = clamp(bmiRisk + waistRisk + ageRisk, 0, 100)

    // Weight change simulation
    const simKg = wKg - simWeight
    const simBMI = r1(simKg / (hM * hM))

    // Z-score approximation (adult — deviation from mean BMI 22)
    const zScore = r2((bmi - 22) / 3.5)

    // Mortality J-curve risk (simplified - optimal risk at BMI 22-24)
    const mortalityRisk = bmi < 18.5 ? "↑↑ Elevated (underweight)" :
      bmi < 22 ? "↑ Slightly above optimal" :
      bmi < 25 ? "✓ Lowest risk zone" :
      bmi < 30 ? "↑ Moderate increase" :
      bmi < 35 ? "↑↑ High increase" : "↑↑↑ Very High"

    setDetails({ bmi, bmiPrime, whoCategory, asianCategory, militaryCategory, minHealthyKg, maxHealthyKg, adjustedIdeal, athleteNote, metabolicRisk, simBMI, riskLevel, zScore, mortalityRisk, healthScore, status })

    setResult({
      primaryMetric: { label: "BMI (Body Mass Index)", value: bmi, unit: "kg/m²", status, description: whoCategory, icon: Scale },
      healthScore,
      metrics: [
        { label: "BMI Value", value: bmi, unit: "kg/m²", status, icon: Scale },
        { label: "BMI Prime", value: bmiPrime, unit: "", status: bmiPrime >= 0.74 && bmiPrime <= 1 ? 'good' : 'warning', icon: Activity },
        { label: "WHO Category", value: whoCategory, unit: "", status, icon: AlertTriangle },
        { label: "Healthy Weight Min", value: minHealthyKg, unit: "kg", status: 'normal', icon: TrendingDown },
        { label: "Healthy Weight Max", value: maxHealthyKg, unit: "kg", status: 'normal', icon: TrendingUp },
        { label: "Ideal Weight (Devine)", value: adjustedIdeal, unit: "kg", status: 'normal', icon: Target },
        { label: "Metabolic Risk %", value: metabolicRisk, unit: "%", status: metabolicRisk > 30 ? 'danger' : metabolicRisk > 15 ? 'warning' : 'good', icon: Heart },
        { label: "Z-Score", value: zScore, unit: "", status: Math.abs(zScore) < 1.5 ? 'good' : 'warning', icon: BarChart3 },
      ],
      recommendations: [
        {
          title: whoCategory,
          description: athleteNote || `Your BMI of ${bmi} kg/m² places you in the "${whoCategory}" category. BMI Prime of ${bmiPrime} (1.0 = upper Normal boundary). Ideal healthy weight: ${minHealthyKg}–${maxHealthyKg} kg.`,
          priority: status === 'good' ? 'low' : status === 'warning' ? 'medium' : 'high',
          category: "Assessment"
        },
        {
          title: "Weight Change Simulation",
          description: `If you reduce weight by ${simWeight} kg → your BMI becomes ${simBMI} kg/m². Start with small, sustainable goals of 0.5–1 kg/week.`,
          priority: 'medium',
          category: "Simulation"
        },
        {
          title: "Mortality Risk (J-Curve)",
          description: `${mortalityRisk}. The J-shaped mortality curve shows lowest risk at BMI 22–24 for most adults. ${ethnicity === "asian" ? `Asian cutoff: ${asianCategory}.` : ""}`,
          priority: 'medium',
          category: "Clinical"
        },
        ...(militaryCategory ? [{
          title: "Military Standard",
          description: `Military fitness standard: ${militaryCategory}. Combatant Command standards typically require BMI 20–25 for males and 19–26 for females.`,
          priority: 'low' as const,
          category: "Standards"
        }] : []),
      ],
      detailedBreakdown: {
        "BMI": `${bmi} kg/m²`,
        "BMI Prime": bmiPrime,
        "WHO Category": whoCategory,
        ...(asianCategory ? { "Asian Category": asianCategory } : {}),
        "Military Standard": militaryCategory,
        "Healthy Range": `${minHealthyKg}–${maxHealthyKg} kg`,
        "Ideal Weight": `${adjustedIdeal} kg (${frameSize} frame)`,
        "Metabolic Risk": `${metabolicRisk}%`,
        "Simulation (−${simWeight} kg)": `BMI → ${simBMI}`,
        "Mortality Risk Zone": mortalityRisk,
        "Z-Score": zScore,
      }
    })
    setChartData({
      isDoughnut: true,
      labels: ['Underweight <18.5', 'Normal 18.5–25', 'Overweight 25–30', 'Obese ≥30'],
      datasets: [{
        data: [18.5, 6.5, 5, 10],
        backgroundColor: [
          bmi < 18.5 ? '#3b82f6' : 'rgba(59,130,246,0.25)',
          bmi >= 18.5 && bmi < 25 ? '#22c55e' : 'rgba(34,197,94,0.25)',
          bmi >= 25 && bmi < 30 ? '#f59e0b' : 'rgba(245,158,11,0.25)',
          bmi >= 30 ? '#ef4444' : 'rgba(239,68,68,0.25)',
        ],
        borderColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 1.5,
      }]
    })
    // Growth tracking
    const _bmiEntry = { d: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), v: bmi }
    const _bmiHistNew = [...bmiHistory.slice(-9), _bmiEntry]
    setBmiHistory(_bmiHistNew)
    if (_bmiHistNew.length >= 2) {
      setBmiTrend({ labels: _bmiHistNew.map(e => e.d), datasets: [{ label: 'BMI', data: _bmiHistNew.map(e => e.v), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2 }] })
    }
    try { localStorage.setItem('growth:bmi-calculator', JSON.stringify(_bmiHistNew)) } catch {}
  }

  const inputs = (
    <div className="space-y-4">
      <UnitToggle value={unitSystem} onChange={setUnitSystem} />
      <GenderBtn value={gender} onChange={setGender} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Weight" value={weight} onChange={setWeight} min={20} max={300} suffix={unitSystem === "metric" ? "kg" : "lbs"} />
        <NumField label="Height" value={height} onChange={setHeight} min={100} max={250} suffix={unitSystem === "metric" ? "cm" : "in"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Age" value={age} onChange={setAge} min={5} max={100} step={1} suffix="years" />
        <NumField label="Waist" value={waist} onChange={setWaist} min={40} max={200} suffix="cm" />
      </div>
      <SelectField label="Ethnicity Risk Threshold" value={ethnicity} onChange={setEthnicity}
        options={[{ value: "general", label: "General (WHO)" }, { value: "asian", label: "Asian (Lower cutoffs)" }]} />
      <SelectField label="Body Frame Size" value={frameSize} onChange={setFrameSize}
        options={[{ value: "small", label: "Small Frame" }, { value: "medium", label: "Medium Frame" }, { value: "large", label: "Large Frame" }]} />
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
        <span className="text-sm font-medium">🏋️ Athlete Mode (High Muscle Mass)</span>
        <button onClick={() => setIsAthlete(!isAthlete)}
          className={`w-11 h-6 rounded-full transition-colors ${isAthlete ? "bg-primary" : "bg-muted"} relative`}>
          <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${isAthlete ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      <NumField label="Simulate Weight Reduction" value={simWeight} onChange={setSimWeight} min={0} max={50} step={0.5} suffix="kg" />
      {details && (
        <div className="space-y-3 pt-2">
          <SegmentBar value={details.bmi} min={10} max={45}
            zones={[
              { label: "Underweight", max: 18.5, color: "bg-blue-400" },
              { label: "Normal", max: 25, color: "bg-green-500" },
              { label: "Overweight", max: 30, color: "bg-yellow-400" },
              { label: "Obese I", max: 35, color: "bg-orange-500" },
              { label: "Obese II+", max: 45, color: "bg-red-600" },
            ]} />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <ResultCard title="Classifications">
              <InfoRow label="WHO" value={details.whoCategory} />
              {details.asianCategory && <InfoRow label="Asian (Lower)" value={details.asianCategory} />}
              <InfoRow label="Military" value={details.militaryCategory} />
              <InfoRow label="Risk Level" value={details.riskLevel.replace('-', ' ').toUpperCase()} />
            </ResultCard>
            <ResultCard title="Simulations">
              <InfoRow label="−{simWeight} kg BMI" value={`${details.simBMI} kg/m²`} />
              <InfoRow label="Metabolic Risk" value={`${details.metabolicRisk}%`} />
              <InfoRow label="Z-Score" value={details.zScore} />
              <InfoRow label="Mortality Zone" value={details.mortalityRisk} />
            </ResultCard>
          </div>
        </div>
      )}
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 BMI Category Distribution</p>
          <div style={{ height: '160px' }}>
            <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 12 } } } }} />
          </div>
        </div>
      )}
      {bmiTrend && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">📊 BMI Growth Trend</p>
            <button onClick={() => { setBmiHistory([]); setBmiTrend(null); try { localStorage.removeItem('growth:bmi-calculator') } catch {} }} className="text-xs text-red-500 hover:underline">Clear</button>
          </div>
          <div style={{ height: '140px' }}>
            <Line data={bmiTrend} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { suggestedMin: 15, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 }, maxRotation: 30 } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="BMI Calculator – Advanced Clinical Version"
      description="WHO classifications, BMI Prime, metabolic risk, athlete mode, weight simulation & mortality J-curve analysis."
      inputs={inputs}
      calculate={calcBMI}
      result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setDetails(null); setChartData(null) }}
      values={[weight, height, age, gender, waist, unitSystem, isAthlete, frameSize, ethnicity, simWeight]}
      seoContent={<SeoContentGenerator title="Advanced BMI Calculator" description="Clinical BMI with WHO categories, BMI Prime, metabolic risk assessment, athlete mode, weight simulation & mortality J-curve." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ADVANCED BMR CALCULATOR – METABOLIC ENGINE
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedBMRCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [activity, setActivity] = useState("moderate")
  const [bodyFatPct, setBodyFatPct] = useState(20)
  const [goal, setGoal] = useState("fat-loss")
  const [macroStyle, setMacroStyle] = useState("balanced")
  const [unitSystem, setUnitSystem] = useState("metric")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [tables, setTables] = useState<any>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [bmrHistory, setBmrHistory] = useState<{d: string; v: number}[]>([])
  const [bmrTrend, setBmrTrend] = useState<any>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('growth:bmr-calculator')
      if (raw) {
        const h = JSON.parse(raw)
        if (Array.isArray(h) && h.length >= 2) {
          setBmrHistory(h)
          setBmrTrend({ labels: h.map((e: any) => e.d), datasets: [{ label: 'TDEE (kcal)', data: h.map((e: any) => e.v), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2 }] })
        }
      }
    } catch {}
  }, [])

  const ACT = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extra: 1.9 }
  const ACT_LABEL = { sedentary: "Sedentary (desk job)", light: "Light (1-3×/wk)", moderate: "Moderate (3-5×/wk)", active: "Heavy (6-7×/wk)", extra: "Athlete/2x/day" }

  const calc = () => {
    const wKg = unitSystem === "imperial" ? weight / 2.20462 : weight
    const hCm = unitSystem === "imperial" ? height * 2.54 : height

    // Multiple formulas
    const mifflin = gender === "male" ? 10 * wKg + 6.25 * hCm - 5 * age + 5 : 10 * wKg + 6.25 * hCm - 5 * age - 161
    const harrisBenedict = gender === "male" ? 88.362 + 13.397 * wKg + 4.799 * hCm - 5.677 * age : 447.593 + 9.247 * wKg + 3.098 * hCm - 4.330 * age
    const leanMass = wKg * (1 - bodyFatPct / 100)
    const katchMcArdle = 370 + 21.6 * leanMass
    const cunningham = 500 + 22 * leanMass

    const bmr = r0(mifflin) // Primary
    const actMult = ACT[activity as keyof typeof ACT] ?? 1.55
    const tdee = r0(bmr * actMult)

    // Goal calories
    const fatLoss = r0(tdee - 500)
    const aggressiveFatLoss = r0(tdee - 750)
    const muscleGain = r0(tdee + 300)
    const maintenance = tdee

    // Adaptive thermogenesis (metabolic slowdown estimation)
    const adaptiveCorrection = r0(tdee * 0.05) // ~5% metabolic adaptation

    // TEF — Thermic Effect of Food
    const proteinTEF = 0.25, carbTEF = 0.05, fatTEF = 0.03
    // Balanced macro split TEF estimate
    const tef = r0(tdee * (proteinTEF * 0.3 + carbTEF * 0.4 + fatTEF * 0.3))

    // NEAT estimation
    const neat = r0(tdee * 0.15) // ~15% of TDEE

    // Macro splits by goal
    const macros: Record<string, { p: number; c: number; f: number; label: string }> = {
      "fat-loss": { p: 0.35, c: 0.4, f: 0.25, label: "High Protein / Fat Loss" },
      "muscle-gain": { p: 0.3, c: 0.45, f: 0.25, label: "Muscle Gain / Hypertrophy" },
      "keto": { p: 0.25, c: 0.05, f: 0.7, label: "Ketogenic" },
      "high-protein": { p: 0.4, c: 0.35, f: 0.25, label: "High Protein" },
      "balanced": { p: 0.25, c: 0.5, f: 0.25, label: "Balanced" },
    }
    const targetCals = goal === "fat-loss" ? fatLoss : goal === "muscle-gain" ? muscleGain : maintenance
    const ms = macros[macroStyle] ?? macros["balanced"]
    const proteinG = r0((targetCals * ms.p) / 4)
    const carbG = r0((targetCals * ms.c) / 4)
    const fatG = r0((targetCals * ms.f) / 9)

    // 30/60/90 day weight projection (simplified Hall model)
    const dailyDeficit = goal === "fat-loss" ? -500 : goal === "muscle-gain" ? 300 : 0
    const project = (days: number) => r1(wKg - (dailyDeficit * days) / 7700)

    const formulaTable = [
      { name: "Mifflin-St Jeor", bmr: r0(mifflin), tdee: r0(mifflin * actMult), note: "Best for general population" },
      { name: "Harris-Benedict", bmr: r0(harrisBenedict), tdee: r0(harrisBenedict * actMult), note: "Classic formula (1919)" },
      { name: "Katch-McArdle", bmr: r0(katchMcArdle), tdee: r0(katchMcArdle * actMult), note: "Best when body fat % known" },
      { name: "Cunningham", bmr: r0(cunningham), tdee: r0(cunningham * actMult), note: "For athletes" },
    ]

    setTables({ formulaTable, proteinG, carbG, fatG, ms, tef, neat, adaptiveCorrection, p30: project(30), p60: project(60), p90: project(90) })

    const status: 'good' | 'normal' | 'warning' | 'danger' = bmr > 1200 ? 'good' : 'warning'
    setResult({
      primaryMetric: { label: "BMR (Mifflin-St Jeor)", value: bmr, unit: "kcal/day", status: 'good', description: "Calories burned at complete rest", icon: Flame },
      healthScore: 85,
      metrics: [
        { label: "BMR", value: bmr, unit: "kcal", status: 'good', icon: Flame },
        { label: "TDEE", value: tdee, unit: "kcal", status: 'normal', icon: Activity },
        { label: "Fat Loss Calories", value: fatLoss, unit: "kcal", status: 'normal', icon: TrendingDown },
        { label: "Muscle Gain Calories", value: muscleGain, unit: "kcal", status: 'normal', icon: TrendingUp },
        { label: "TEF (Thermic Effect)", value: tef, unit: "kcal", status: 'normal', icon: Zap },
        { label: "NEAT Estimate", value: neat, unit: "kcal", status: 'normal', icon: Activity },
        { label: "Adaptive Correction", value: adaptiveCorrection, unit: "kcal", status: 'warning', icon: Brain },
        { label: "Protein Target", value: proteinG, unit: "g", status: 'good', icon: Dumbbell },
      ],
      recommendations: [
        {
          title: "Multi-Formula Comparison",
          description: `Mifflin: ${r0(mifflin)} | Harris-Benedict: ${r0(harrisBenedict)} | Katch-McArdle: ${r0(katchMcArdle)} | Cunningham: ${r0(cunningham)} kcal. Variation between formulas indicates estimation range.`,
          priority: 'medium', category: "Formulas"
        },
        {
          title: "Adaptive Thermogenesis Warning",
          description: `After prolonged dieting, metabolism can slow by ~${r0((adaptiveCorrection / tdee) * 100)}% (${adaptiveCorrection} kcal). Use reverse dieting or refeed days to reset metabolism.`,
          priority: 'high', category: "Adaptation"
        },
        {
          title: "Macro Split: ${ms.label}",
          description: `Protein: ${proteinG}g | Carbs: ${carbG}g | Fat: ${fatG}g. TEF bonus: ${tef} kcal/day from digestion. NEAT (non-exercise): ~${neat} kcal/day.`,
          priority: 'medium', category: "Nutrition"
        },
        {
          title: "Weight Projection",
          description: `At current ${goal === "fat-loss" ? "-500 kcal deficit" : goal === "muscle-gain" ? "+300 kcal surplus" : "maintenance"}: 30 days → ${tables?.p30 ?? "—"} kg | 60 days → ${tables?.p60 ?? "—"} kg | 90 days → ${tables?.p90 ?? "—"} kg.`,
          priority: 'medium', category: "Projection"
        },
      ],
      detailedBreakdown: {
        "BMR (Mifflin)": `${bmr} kcal`, "TDEE": `${tdee} kcal`,
        "Fat Loss": `${fatLoss} kcal`, "Muscle Gain": `${muscleGain} kcal`,
        "TEF": `${tef} kcal`, "NEAT": `${neat} kcal`, "Adaptive Correction": `${adaptiveCorrection} kcal`,
        "Protein": `${proteinG}g`, "Carbs": `${carbG}g`, "Fat": `${fatG}g`,
        "30-Day Weight": `${tables?.p30 ?? "—"} kg`, "60-Day Weight": `${tables?.p60 ?? "—"} kg`, "90-Day Weight": `${tables?.p90 ?? "—"} kg`,
      }
    })
    setChartData({
      labels: ['Mifflin-St Jeor', 'Harris-Benedict', 'Katch-McArdle', 'Cunningham'],
      datasets: [{
        label: 'BMR (kcal/day)',
        data: [r0(mifflin), r0(harrisBenedict), r0(katchMcArdle), r0(cunningham)],
        backgroundColor: ['rgba(59,130,246,0.75)', 'rgba(34,197,94,0.75)', 'rgba(245,158,11,0.75)', 'rgba(168,85,247,0.75)'],
        borderColor: ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7'],
        borderWidth: 1.5,
      }]
    })
    // Growth tracking – track TDEE
    const _bmrEntry = { d: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), v: tdee }
    const _bmrHistNew = [...bmrHistory.slice(-9), _bmrEntry]
    setBmrHistory(_bmrHistNew)
    if (_bmrHistNew.length >= 2) {
      setBmrTrend({ labels: _bmrHistNew.map(e => e.d), datasets: [{ label: 'TDEE (kcal)', data: _bmrHistNew.map(e => e.v), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2 }] })
    }
    try { localStorage.setItem('growth:bmr-calculator', JSON.stringify(_bmrHistNew)) } catch {}
  }

  const inputs = (
    <div className="space-y-4">
      <UnitToggle value={unitSystem} onChange={setUnitSystem} />
      <GenderBtn value={gender} onChange={setGender} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix={unitSystem === "metric" ? "kg" : "lbs"} />
        <NumField label="Height" value={height} onChange={setHeight} min={100} max={250} suffix={unitSystem === "metric" ? "cm" : "in"} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Age" value={age} onChange={setAge} min={10} max={100} step={1} suffix="years" />
        <NumField label="Body Fat %" value={bodyFatPct} onChange={setBodyFatPct} min={3} max={60} step={0.5} suffix="%" />
      </div>
      <SelectField label="Activity Level" value={activity} onChange={setActivity}
        options={Object.entries(ACT_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
      <SelectField label="Goal" value={goal} onChange={setGoal}
        options={[{ value: "fat-loss", label: "Fat Loss" }, { value: "muscle-gain", label: "Muscle Gain" }, { value: "maintenance", label: "Maintenance" }]} />
      <SelectField label="Macro Split Style" value={macroStyle} onChange={setMacroStyle}
        options={[
          { value: "balanced", label: "Balanced" }, { value: "fat-loss", label: "High Protein / Fat Loss" },
          { value: "muscle-gain", label: "Muscle Gain" }, { value: "keto", label: "Ketogenic" }, { value: "high-protein", label: "High Protein" },
        ]} />
      {tables && (
        <ResultCard title="Formula Comparison Table">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-muted-foreground"><th className="text-left pb-1">Formula</th><th className="text-right">BMR</th><th className="text-right">TDEE</th></tr></thead>
              <tbody>{tables.formulaTable.map((f: any) => (
                <tr key={f.name} className="border-b border-border/20">
                  <td className="py-1 text-left">{f.name}</td>
                  <td className="text-right font-medium">{f.bmr}</td>
                  <td className="text-right font-medium">{f.tdee}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </ResultCard>
      )}
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 BMR Formula Comparison</p>
          <div style={{ height: '170px' }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 } } } } }} />
          </div>
        </div>
      )}
      {bmrTrend && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">📊 TDEE Trend History</p>
            <button onClick={() => { setBmrHistory([]); setBmrTrend(null); try { localStorage.removeItem('growth:bmr-calculator') } catch {} }} className="text-xs text-red-500 hover:underline">Clear</button>
          </div>
          <div style={{ height: '140px' }}>
            <Line data={bmrTrend} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 }, maxRotation: 30 } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="BMR Calculator – Advanced Metabolic Engine"
      description="Multi-formula BMR/TDEE, adaptive thermogenesis, TEF, NEAT, macro splits & 90-day weight projection."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setTables(null); setChartData(null) }}
      values={[weight, height, age, gender, activity, bodyFatPct, goal, macroStyle, unitSystem]}
      seoContent={<SeoContentGenerator title="Advanced BMR Calculator" description="BMR & TDEE with Mifflin, Harris-Benedict, Katch-McArdle formulas, adaptive thermogenesis & macro planning." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ADVANCED BODY FAT CALCULATOR – RESEARCH GRADE
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedBodyFatCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [waist, setWaist] = useState(82)
  const [neck, setNeck] = useState(36)
  const [hip, setHip] = useState(95)
  const [gender, setGender] = useState("male")
  const [age, setAge] = useState(30)
  const [method, setMethod] = useState("navy")
  // 3-site skinfold (Jackson-Pollock)
  const [chest, setChest] = useState(12)
  const [abdominal, setAbdominal] = useState(20)
  const [thigh, setThigh] = useState(18)
  // Female 3-site
  const [tricep, setTricep] = useState(18)
  const [suprailiac, setSuprailiac] = useState(16)
  // 7-site extra
  const [subscapular, setSubscapular] = useState(14)
  const [axilla, setAxilla] = useState(15)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [bfHistory, setBfHistory] = useState<{d: string; v: number}[]>([])
  const [bfTrend, setBfTrend] = useState<any>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('growth:body-fat-calculator')
      if (raw) {
        const h = JSON.parse(raw)
        if (Array.isArray(h) && h.length >= 2) {
          setBfHistory(h)
          setBfTrend({ labels: h.map((e: any) => e.d), datasets: [{ label: 'Body Fat %', data: h.map((e: any) => e.v), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2 }] })
        }
      }
    } catch {}
  }, [])

  const calc = () => {
    const wKg = weight
    const hCm = height
    const hM = hCm / 100
    const bmi = wKg / (hM * hM)

    let bodyFat = 0
    let methodName = ""

    if (method === "navy") {
      // US Navy Method
      if (gender === "male") {
        const logVal = Math.max(1, waist - neck)
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(logVal) + 0.15456 * Math.log10(Math.max(1, hCm))) - 450
      } else {
        const logVal = Math.max(1, waist + hip - neck)
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(logVal) + 0.22100 * Math.log10(Math.max(1, hCm))) - 450
      }
      methodName = "US Navy"
    } else if (method === "bmi-based") {
      // Deurenberg formula
      bodyFat = 1.2 * bmi + 0.23 * age - 10.8 * (gender === "male" ? 1 : 0) - 5.4
      methodName = "BMI-Based (Deurenberg)"
    } else if (method === "3site") {
      // Jackson-Pollock 3-site
      if (gender === "male") {
        const sum = chest + abdominal + thigh
        const density = 1.10938 - 0.0008267 * sum + 0.0000016 * sum * sum - 0.0002574 * age
        bodyFat = (495 / density) - 450
      } else {
        const sum = tricep + suprailiac + thigh
        const density = 1.0994921 - 0.0009929 * sum + 0.0000023 * sum * sum - 0.0001392 * age
        bodyFat = (495 / density) - 450
      }
      methodName = "Jackson-Pollock 3-Site"
    } else {
      // 7-site Jackson-Pollock
      const sum = gender === "male"
        ? chest + abdominal + thigh + subscapular + axilla + tricep + suprailiac
        : chest + abdominal + thigh + subscapular + axilla + tricep + suprailiac
      const density = gender === "male"
        ? 1.112 - 0.00043499 * sum + 0.00000055 * sum * sum - 0.00028826 * age
        : 1.097 - 0.00046971 * sum + 0.00000056 * sum * sum - 0.00012828 * age
      bodyFat = (495 / density) - 450
      methodName = "Jackson-Pollock 7-Site"
    }

    bodyFat = clamp(r1(bodyFat), 2, 70)
    const fatMass = r1(wKg * bodyFat / 100)
    const leanMass = r1(wKg - fatMass)

    // Essential fat (minimum survivable)
    const essentialFat = gender === "male" ? 3 : 12
    const storageFat = r1(bodyFat - essentialFat)
    const excessFat = r1(Math.max(0, fatMass - wKg * essentialFat / 100))

    // Target fat %
    const targetFat = gender === "male"
      ? (age < 30 ? 13 : age < 50 ? 17 : 20)
      : (age < 30 ? 21 : age < 50 ? 24 : 27)
    const targetFatMass = r1(wKg * targetFat / 100)
    const fatToLose = r1(Math.max(0, fatMass - targetFatMass))

    // Visceral fat index (waist-based surrogate)
    const visceralRisk = waist > (gender === "male" ? 102 : 88) ? "High" : waist > (gender === "male" ? 94 : 80) ? "Moderate" : "Low"

    // Fat distribution pattern
    const whr = waist / hip
    const fatDistrib = gender === "male"
      ? (whr > 0.9 ? "Android (Apple) – Central Obesity" : "Gynoid (Pear) – Lower Body Fat")
      : (whr > 0.85 ? "Android (Apple) – Central Obesity" : "Gynoid (Pear) – Lower Body Fat")

    // Sarcopenic obesity flag: high fat + low lean mass
    const leanRatio = leanMass / wKg
    const sarcopenicFlag = bodyFat > 35 && leanRatio < 0.60

    // DEXA accuracy comparison
    const dexa = r1(bodyFat + (Math.random() * 2 - 1)) // ±2% from DEXA
    const category = gender === "male"
      ? bodyFat < 6 ? "Essential Fat" : bodyFat < 14 ? "Athletic" : bodyFat < 18 ? "Fitness" : bodyFat < 25 ? "Average" : "Obese"
      : bodyFat < 14 ? "Essential Fat" : bodyFat < 21 ? "Athletic" : bodyFat < 25 ? "Fitness" : bodyFat < 32 ? "Average" : "Obese"

    const status: 'good' | 'normal' | 'warning' | 'danger' =
      category === "Athletic" || category === "Fitness" ? 'good' :
      category === "Average" ? 'normal' : 'danger'

    setResult({
      primaryMetric: { label: "Body Fat %", value: bodyFat, unit: "%", status, description: `${category} – ${methodName} method`, icon: User },
      healthScore: status === 'good' ? 90 : status === 'normal' ? 70 : 45,
      metrics: [
        { label: "Body Fat %", value: bodyFat, unit: "%", status, icon: User },
        { label: "Fat Mass", value: fatMass, unit: "kg", status, icon: Scale },
        { label: "Lean Mass", value: leanMass, unit: "kg", status: 'good', icon: Dumbbell },
        { label: "Essential Fat", value: essentialFat, unit: "%", status: 'normal', icon: CheckCircle },
        { label: "Storage Fat", value: storageFat, unit: "%", status: storageFat > 20 ? 'warning' : 'normal', icon: Activity },
        { label: "Target Fat %", value: targetFat, unit: "%", status: 'normal', icon: Target },
        { label: "Fat to Lose", value: fatToLose, unit: "kg", status: fatToLose > 5 ? 'warning' : 'good', icon: TrendingDown },
        { label: "Visceral Risk", value: visceralRisk, unit: "", status: visceralRisk === "High" ? 'danger' : visceralRisk === "Moderate" ? 'warning' : 'good', icon: AlertTriangle },
      ],
      recommendations: [
        {
          title: `Body Fat: ${category}`,
          description: `${methodName}: ${bodyFat}%. Fat mass: ${fatMass} kg | Lean mass: ${leanMass} kg. DEXA estimated range: ~${r1(bodyFat - 2)}–${r1(bodyFat + 2)}%.`,
          priority: status === 'good' ? 'low' : 'high', category: "Assessment"
        },
        {
          title: "Fat Distribution Pattern",
          description: `${fatDistrib}. Visceral fat risk: ${visceralRisk}. Waist: ${waist} cm. ${gender === "male" ? "Risk threshold: 94 cm (moderate), 102 cm (high)." : "Risk threshold: 80 cm (moderate), 88 cm (high)."}`,
          priority: 'high', category: "Distribution"
        },
        ...(sarcopenicFlag ? [{
          title: "⚠️ Sarcopenic Obesity Risk Detected",
          description: "High body fat combined with low lean mass indicates sarcopenic obesity — a condition associated with metabolic disease, insulin resistance & functional decline. Consult a healthcare provider.",
          priority: 'high' as const, category: "Clinical Alert"
        }] : []),
        {
          title: "Fat Loss Target",
          description: `Target body fat: ${targetFat}% for your age/gender. Fat to lose: ${fatToLose} kg. Reduce by 0.5–1 kg/week via 500 kcal daily deficit with resistance training.`,
          priority: 'medium', category: "Goal"
        },
      ],
      detailedBreakdown: {
        "Method": methodName, "Body Fat %": `${bodyFat}%`, "Fat Mass": `${fatMass} kg`,
        "Lean Mass": `${leanMass} kg`, "Essential Fat": `${essentialFat}%`, "Storage Fat": `${storageFat}%`,
        "Category": category, "Fat Distribution": fatDistrib, "Visceral Risk": visceralRisk,
        "Target Fat %": `${targetFat}%`, "Fat to Lose": `${fatToLose} kg`,
        "Sarcopenic Flag": sarcopenicFlag ? "YES – Seek medical advice" : "No",
      }
    })
    setChartData({
      isDoughnut: true,
      labels: ['Fat Mass', 'Lean Mass'],
      datasets: [{
        data: [fatMass, leanMass],
        backgroundColor: ['rgba(239,68,68,0.75)', 'rgba(34,197,94,0.75)'],
        borderColor: ['#ef4444', '#22c55e'],
        borderWidth: 1.5,
      }]
    })
    // Growth tracking – track body fat %
    const _bfEntry = { d: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), v: bodyFat }
    const _bfHistNew = [...bfHistory.slice(-9), _bfEntry]
    setBfHistory(_bfHistNew)
    if (_bfHistNew.length >= 2) {
      setBfTrend({ labels: _bfHistNew.map(e => e.d), datasets: [{ label: 'Body Fat %', data: _bfHistNew.map(e => e.v), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2 }] })
    }
    try { localStorage.setItem('growth:body-fat-calculator', JSON.stringify(_bfHistNew)) } catch {}
  }

  const inputs = (
    <div className="space-y-4">
      <GenderBtn value={gender} onChange={setGender} />
      <SelectField label="Calculation Method" value={method} onChange={setMethod}
        options={[
          { value: "navy", label: "US Navy (Waist/Neck/Hip)" },
          { value: "bmi-based", label: "BMI-Based (Deurenberg)" },
          { value: "3site", label: "Jackson-Pollock 3-Site Skinfold" },
          { value: "7site", label: "Jackson-Pollock 7-Site Skinfold" },
        ]} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Weight (kg)" value={weight} onChange={setWeight} min={30} max={300} />
        <NumField label="Height (cm)" value={height} onChange={setHeight} min={100} max={250} step={1} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Age" value={age} onChange={setAge} min={10} max={100} step={1} suffix="years" />
        <NumField label="Waist (cm)" value={waist} onChange={setWaist} min={40} max={200} />
      </div>
      {(method === "navy" || method === "bmi-based") && (
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Neck (cm)" value={neck} onChange={setNeck} min={20} max={70} />
          {gender === "female" && <NumField label="Hip (cm)" value={hip} onChange={setHip} min={50} max={200} />}
        </div>
      )}
      {(method === "3site" || method === "7site") && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Skinfold measurements (mm):</p>
          <div className="grid grid-cols-3 gap-2">
            {gender === "male" ? (
              <><NumField label="Chest" value={chest} onChange={setChest} min={1} max={80} step={0.5} />
                <NumField label="Abdominal" value={abdominal} onChange={setAbdominal} min={1} max={100} step={0.5} />
                <NumField label="Thigh" value={thigh} onChange={setThigh} min={1} max={80} step={0.5} /></>
            ) : (
              <><NumField label="Tricep" value={tricep} onChange={setTricep} min={1} max={80} step={0.5} />
                <NumField label="Suprailiac" value={suprailiac} onChange={setSuprailiac} min={1} max={80} step={0.5} />
                <NumField label="Thigh" value={thigh} onChange={setThigh} min={1} max={80} step={0.5} /></>
            )}
          </div>
          {method === "7site" && (
            <div className="grid grid-cols-2 gap-2">
              <NumField label="Subscapular" value={subscapular} onChange={setSubscapular} min={1} max={80} step={0.5} />
              <NumField label="Axilla/Midaxillary" value={axilla} onChange={setAxilla} min={1} max={80} step={0.5} />
              {gender === "male" && <NumField label="Tricep" value={tricep} onChange={setTricep} min={1} max={80} step={0.5} />}
              {gender === "female" && <NumField label="Chest" value={chest} onChange={setChest} min={1} max={80} step={0.5} />}
            </div>
          )}
        </div>
      )}
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 Fat vs Lean Mass</p>
          <div style={{ height: '160px' }}>
            <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 12 } } } }} />
          </div>
        </div>
      )}
      {bfTrend && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">📊 Body Fat % Trend</p>
            <button onClick={() => { setBfHistory([]); setBfTrend(null); try { localStorage.removeItem('growth:body-fat-calculator') } catch {} }} className="text-xs text-red-500 hover:underline">Clear</button>
          </div>
          <div style={{ height: '140px' }}>
            <Line data={bfTrend} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { suggestedMin: 0, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 }, maxRotation: 30 } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Body Fat Calculator – Research Grade"
      description="US Navy, Jackson-Pollock 3/7-Site skinfold & BMI methods with visceral fat index, fat distribution & sarcopenic obesity detection."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[weight, height, waist, neck, hip, gender, age, method, chest, abdominal, thigh, tricep, suprailiac, subscapular, axilla]}
      seoContent={<SeoContentGenerator title="Advanced Body Fat Calculator" description="Research-grade body fat estimation using Navy, skinfold & BMI methods with visceral fat assessment." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. LEAN BODY MASS CALCULATOR – MUSCLE INTELLIGENCE MODEL
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedLeanBodyMassCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [bodyFat, setBodyFat] = useState(20)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [wrist, setWrist] = useState(17)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  const calc = () => {
    const hM = height / 100
    const bmi = weight / (hM * hM)

    // Lean body mass
    const lbm = r1(weight * (1 - bodyFat / 100))

    // FFMI (Fat-Free Mass Index)
    const ffmi = r2(lbm / (hM * hM))
    const ffmiNorm = r2(lbm / (hM * hM) + 6.1 * (1.8 - hM)) // height-normalized

    // Natural muscle limit (Berkhan/Martin formula)
    const naturalLimit = gender === "male"
      ? r1((height - 100) * 1.0) // Martin Berkhan formula
      : r1((height - 100) * 0.9)

    // FFMI natural ceiling
    const ffmiCeiling = gender === "male" ? 25 : 22

    // Muscle-to-fat ratio
    const muscleFatRatio = r2(lbm / Math.max(0.1, weight - lbm))

    // Age-adjusted score (sarcopenia threshold)
    const ageFactor = age > 60 ? 0.7 : age > 50 ? 0.85 : age > 40 ? 0.95 : 1.0
    const ageAdjustedLBM = r1(lbm * ageFactor)

    // Sarcopenia risk (EWGSOP2 criteria)
    // Low lean mass: <20 kg women, <27 kg men (rough screening)
    const sarcopenicThresh = gender === "male" ? 27 : 20
    const sarcopeniaRisk = lbm < sarcopenicThresh ? "High" : lbm < sarcopenicThresh + 5 ? "Moderate" : "Low"

    // Frame size from wrist
    const frameSize = gender === "male"
      ? wrist < 16.5 ? "Small" : wrist < 19 ? "Medium" : "Large"
      : wrist < 15 ? "Small" : wrist < 17 ? "Medium" : "Large"

    // Muscle gain projection
    const gainPerMonth = gender === "male" ? (age < 30 ? 1.5 : age < 40 ? 1.0 : 0.7) : (age < 30 ? 0.8 : 0.5)
    const toNaturalLimit = r1(Math.max(0, naturalLimit - lbm))
    const monthsToLimit = r0(toNaturalLimit / gainPerMonth)

    const ffmiStatus = ffmi > ffmiCeiling ? "Above Natural Ceiling" : ffmi > (ffmiCeiling - 3) ? "Advanced" : ffmi > (ffmiCeiling - 7) ? "Intermediate" : "Beginner/Untrained"
    const status: 'good' | 'normal' | 'warning' | 'danger' = sarcopeniaRisk === "High" ? 'danger' : sarcopeniaRisk === "Moderate" ? 'warning' : 'good'

    setResult({
      primaryMetric: { label: "Lean Body Mass", value: lbm, unit: "kg", status, description: ffmiStatus, icon: Dumbbell },
      healthScore: status === 'good' ? 88 : status === 'warning' ? 65 : 40,
      metrics: [
        { label: "Lean Body Mass", value: lbm, unit: "kg", status, icon: Dumbbell },
        { label: "FFMI", value: ffmi, unit: "kg/m²", status: ffmi < ffmiCeiling ? 'good' : 'warning', icon: BarChart3 },
        { label: "FFMI (Height-Norm)", value: ffmiNorm, unit: "kg/m²", status: 'normal', icon: Ruler },
        { label: "Natural Muscle Limit", value: naturalLimit, unit: "kg LBM", status: 'normal', icon: Target },
        { label: "Muscle-Fat Ratio", value: muscleFatRatio, unit: "", status: muscleFatRatio > 3 ? 'good' : 'warning', icon: Activity },
        { label: "Age-Adjusted LBM", value: ageAdjustedLBM, unit: "kg", status: 'normal', icon: User },
        { label: "Sarcopenia Risk", value: sarcopeniaRisk, unit: "", status: sarcopeniaRisk === "High" ? 'danger' : sarcopeniaRisk === "Moderate" ? 'warning' : 'good', icon: AlertTriangle },
        { label: "Fat Mass", value: r1(weight - lbm), unit: "kg", status: 'normal', icon: Scale },
      ],
      recommendations: [
        {
          title: `FFMI Status: ${ffmiStatus}`,
          description: `FFMI: ${ffmi} kg/m² (Height-normalized: ${ffmiNorm}). Natural ceiling: ${ffmiCeiling} kg/m² for ${gender}. ${ffmi > ffmiCeiling ? "⚠️ Above natural ceiling — may indicate PED use." : `${toNaturalLimit} kg of lean mass gain potential remaining.`}`,
          priority: 'medium', category: "Muscle Assessment"
        },
        {
          title: "Natural Muscle Potential",
          description: `Target lean mass (natural limit): ${naturalLimit} kg. Currently at ${lbm} kg. To reach natural limit: ~${monthsToLimit} months of consistent training at ~${gainPerMonth} kg/month gain rate.`,
          priority: 'medium', category: "Goal Planning"
        },
        {
          title: `Sarcopenia Risk: ${sarcopeniaRisk}`,
          description: `Age-adjusted lean mass: ${ageAdjustedLBM} kg. ${sarcopeniaRisk === 'High' ? '⚠️ Lean mass is critically low — progressive resistance training & protein intake ≥1.6g/kg/day recommended urgently.' : 'Maintain with 2-3 resistance sessions per week + protein ≥1.2g/kg/day.'}`,
          priority: sarcopeniaRisk === "High" ? 'high' : 'low', category: "Clinical"
        },
        {
          title: "Body Frame Context",
          description: `Wrist circumference ${wrist} cm → ${frameSize} frame (${gender}). Frame size affects ideal weight & muscle distribution norms.`,
          priority: 'low', category: "Context"
        },
      ],
      detailedBreakdown: {
        "Lean Body Mass": `${lbm} kg`, "Fat Mass": `${r1(weight - lbm)} kg`,
        "FFMI": `${ffmi} kg/m²`, "FFMI (Norm)": `${ffmiNorm}`, "Natural Ceiling": `${ffmiCeiling}`,
        "Natural Limit (LBM)": `${naturalLimit} kg`, "Muscle-Fat Ratio": muscleFatRatio,
        "Sarcopenia Risk": sarcopeniaRisk, "Frame Size": frameSize, "Age-Adj LBM": `${ageAdjustedLBM} kg`,
      }
    })
    setChartData({
      labels: ['Your FFMI', 'Natural Ceiling', 'Lean Mass (kg)', 'Natural Limit (kg)'],
      datasets: [{
        label: 'Muscle Analysis',
        data: [ffmi, ffmiCeiling, lbm, naturalLimit],
        backgroundColor: [
          ffmi > ffmiCeiling ? 'rgba(239,68,68,0.75)' : 'rgba(59,130,246,0.75)',
          'rgba(34,197,94,0.75)',
          'rgba(168,85,247,0.75)',
          'rgba(245,158,11,0.75)',
        ],
        borderColor: ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b'],
        borderWidth: 1.5,
      }]
    })
  }

  const inputs = (
    <div className="space-y-4">
      <GenderBtn value={gender} onChange={setGender} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Weight (kg)" value={weight} onChange={setWeight} min={30} max={300} />
        <NumField label="Height (cm)" value={height} onChange={setHeight} min={100} max={250} step={1} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Body Fat %" value={bodyFat} onChange={setBodyFat} min={2} max={70} step={0.5} />
        <NumField label="Age" value={age} onChange={setAge} min={10} max={100} step={1} suffix="years" />
      </div>
      <NumField label="Wrist Circumference (cm)" value={wrist} onChange={setWrist} min={10} max={30} step={0.5} suffix="cm (for frame size)" />
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 Muscle Intelligence Chart</p>
          <div style={{ height: '170px' }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 } } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Lean Body Mass Calculator – Muscle Intelligence"
      description="FFMI, natural muscle ceiling, sarcopenia risk, age-adjusted lean mass & muscle gain projection."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[weight, height, bodyFat, age, gender, wrist]}
      seoContent={<SeoContentGenerator title="Lean Body Mass Calculator" description="Calculate lean mass, FFMI, natural muscle limit, sarcopenia risk & muscle gain projection." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. BODY SURFACE AREA – ADVANCED CLINICAL MODE
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedBSACalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [isChild, setIsChild] = useState(false)
  const [burnPct, setBurnPct] = useState(0)
  const [drug, setDrug] = useState("carboplatin")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  const CHEMO_DOSES: Record<string, { name: string; dose: number; unit: string }> = {
    carboplatin: { name: "Carboplatin (AUC5)", dose: 5, unit: "mg/mL·min (AUC)" },
    cisplatin: { name: "Cisplatin", dose: 75, unit: "mg/m²" },
    doxorubicin: { name: "Doxorubicin", dose: 60, unit: "mg/m²" },
    paclitaxel: { name: "Paclitaxel", dose: 175, unit: "mg/m²" },
    cyclophosphamide: { name: "Cyclophosphamide", dose: 600, unit: "mg/m²" },
  }

  const calc = () => {
    const wKg = weight
    const hCm = height
    const hM = hCm / 100

    // Multi-formula BSA
    const mosteller = Math.sqrt((hCm * wKg) / 3600)
    const dubois = 0.007184 * Math.pow(wKg, 0.425) * Math.pow(hCm, 0.725)
    const haycock = 0.024265 * Math.pow(wKg, 0.5378) * Math.pow(hCm, 0.3964)
    const gehan = 0.0235 * Math.pow(hCm, 0.42246) * Math.pow(wKg, 0.51456)
    const fujimoto = 0.008883 * Math.pow(hCm, 0.663) * Math.pow(wKg, 0.444)
    const monsteller2 = 0.016667 * Math.pow(hCm, 0.5) * Math.pow(wKg, 0.5)
    const avg = r2((mosteller + dubois + haycock + gehan) / 4)

    // Drug dosing
    const d = CHEMO_DOSES[drug]
    const carboplatinDose = drug === "carboplatin"
      ? r0(d.dose * (25 + 0)) // Calvert formula simplified (GFR ~25 assumed, adjust as needed)
      : r0(d.dose * mosteller)

    // Pediatric scaling
    const pediatricDose = r2(mosteller / 1.73) // relative to standard adult

    // Rule of 9 burn assessment
    const burnAreas = [
      { area: "Head & Neck", pct: 9 }, { area: "Right Arm", pct: 9 }, { area: "Left Arm", pct: 9 },
      { area: "Anterior Trunk", pct: 18 }, { area: "Posterior Trunk", pct: 18 },
      { area: "Right Leg", pct: 18 }, { area: "Left Leg", pct: 18 }, { area: "Perineum", pct: 1 },
    ]
    const burnBSA = burnPct > 0 ? r2(mosteller * burnPct / 100) : 0

    // Cardiac index support (normal CO = 5 L/min)
    const cardiacIndex = r2(5.0 / mosteller)

    // Clinical classification
    const normal = (gender: string) => gender === "male" ? "1.9–2.2 m²" : "1.6–1.9 m²"
    const status: 'good' | 'normal' | 'warning' = mosteller >= 1.4 && mosteller <= 2.5 ? 'good' : 'warning'

    setResult({
      primaryMetric: { label: "BSA (Mosteller)", value: r2(mosteller), unit: "m²", status, description: "Primary formula for clinical dosing", icon: Ruler },
      healthScore: 80,
      metrics: [
        { label: "Mosteller", value: r2(mosteller), unit: "m²", status, icon: Ruler },
        { label: "DuBois", value: r2(dubois), unit: "m²", status, icon: Ruler },
        { label: "Haycock (Pediatric)", value: r2(haycock), unit: "m²", status, icon: Ruler },
        { label: "Gehan-George", value: r2(gehan), unit: "m²", status, icon: Ruler },
        { label: "Fujimoto", value: r2(fujimoto), unit: "m²", status, icon: Ruler },
        { label: "Average BSA", value: avg, unit: "m²", status, icon: Activity },
        { label: "Cardiac Index", value: cardiacIndex, unit: "L/min/m²", status: cardiacIndex >= 2.5 && cardiacIndex <= 4.0 ? 'good' : 'warning', icon: Heart },
        { label: "Pediatric Scaling", value: pediatricDose, unit: "× std", status: 'normal', icon: User },
      ],
      recommendations: [
        {
          title: "Formula Comparison",
          description: `Mosteller: ${r2(mosteller)} | DuBois: ${r2(dubois)} | Haycock: ${r2(haycock)} | Gehan: ${r2(gehan)} | Fujimoto: ${r2(fujimoto)} m². Average: ${avg} m².`,
          priority: 'medium', category: "Formulas"
        },
        {
          title: `Chemotherapy Dosing: ${d.name}`,
          description: `Estimated dose: ${carboplatinDose} ${d.unit}. Pediatric scaling factor: ${pediatricDose}× standard dose. Always confirm with oncology pharmacist before clinical use.`,
          priority: 'high', category: "Clinical Dosing"
        },
        {
          title: "Cardiac Index",
          description: `Cardiac Index (CO/BSA) = ${cardiacIndex} L/min/m². Normal range: 2.5–4.0 L/min/m². ${cardiacIndex >= 2.5 && cardiacIndex <= 4.0 ? "✓ Within normal range." : "⚠️ Outside normal range — clinical evaluation recommended."}`,
          priority: 'medium', category: "Hemodynamics"
        },
        ...(burnPct > 0 ? [{
          title: `Burn Assessment (${burnPct}% TBSA)`,
          description: `Rule of Nines TBSA: ${burnPct}%. Approximate BSA affected: ${burnBSA} m². Burns >20% TBSA are critical and require ICU management. Fluid resuscitation: ${r0(4 * wKg * burnPct)} mL in first 24h (Parkland formula).`,
          priority: 'high' as const, category: "Burns"
        }] : []),
      ],
      detailedBreakdown: {
        "Mosteller": `${r2(mosteller)} m²`, "DuBois": `${r2(dubois)} m²`, "Haycock": `${r2(haycock)} m²`,
        "Gehan": `${r2(gehan)} m²`, "Avg BSA": `${avg} m²`, "Cardiac Index": `${cardiacIndex}`,
        "Chemo Dose": `${carboplatinDose} ${d.unit}`, "Burn TBSA": `${burnPct}%`, "Burn BSA": `${burnBSA} m²`,
      }
    })
    setChartData({
      labels: ['Mosteller', 'DuBois', 'Haycock', 'Gehan', 'Fujimoto'],
      datasets: [{
        label: 'BSA (m²)',
        data: [r2(mosteller), r2(dubois), r2(haycock), r2(gehan), r2(fujimoto)],
        backgroundColor: ['rgba(59,130,246,0.75)', 'rgba(34,197,94,0.75)', 'rgba(245,158,11,0.75)', 'rgba(239,68,68,0.75)', 'rgba(168,85,247,0.75)'],
        borderColor: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'],
        borderWidth: 1.5,
      }]
    })
  }

  const inputs = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Weight (kg)" value={weight} onChange={setWeight} min={3} max={300} />
        <NumField label="Height (cm)" value={height} onChange={setHeight} min={30} max={250} step={1} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Age" value={age} onChange={setAge} min={0} max={100} step={1} suffix="years" />
        <NumField label="Burn TBSA %" value={burnPct} onChange={setBurnPct} min={0} max={100} step={1} suffix="% (0 if none)" />
      </div>
      <SelectField label="Chemotherapy Drug" value={drug} onChange={setDrug}
        options={Object.entries(CHEMO_DOSES).map(([v, d]) => ({ value: v, label: d.name }))} />
      <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl text-xs text-orange-700 dark:text-orange-400">
        ⚠️ Clinical dosing results are educational estimates only. Always verify with a qualified pharmacist or physician.
      </div>
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 BSA Formula Comparison</p>
          <div style={{ height: '170px' }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 } } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Body Surface Area – Advanced Clinical Mode"
      description="5-formula BSA comparison, chemotherapy dosing, cardiac index, pediatric scaling & burn assessment."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[weight, height, age, burnPct, drug]}
      seoContent={<SeoContentGenerator title="Body Surface Area Calculator" description="Clinical BSA with DuBois, Mosteller, Haycock formulas, chemo dosing & burn assessment." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. WAIST-TO-HIP RATIO – CARDIOMETABOLIC MODEL
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedWaistHipRatioCalculator() {
  const [waist, setWaist] = useState(85)
  const [hip, setHip] = useState(95)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  const calc = () => {
    const whr = r2(waist / hip)
    const wthr = r2(waist / height)  // waist-to-height

    // WHO classification
    let whoClass = ""
    let riskLevel: 'low' | 'moderate' | 'high' | 'very-high'
    let status: 'good' | 'normal' | 'warning' | 'danger'
    if (gender === "male") {
      if (whr < 0.85) { whoClass = "Low Risk"; riskLevel = 'low'; status = 'good' }
      else if (whr < 0.90) { whoClass = "Moderate Risk"; riskLevel = 'moderate'; status = 'normal' }
      else { whoClass = "High Cardiovascular Risk"; riskLevel = 'high'; status = 'danger' }
    } else {
      if (whr < 0.75) { whoClass = "Low Risk"; riskLevel = 'low'; status = 'good' }
      else if (whr < 0.85) { whoClass = "Moderate Risk"; riskLevel = 'moderate'; status = 'normal' }
      else { whoClass = "High Cardiovascular Risk"; riskLevel = 'high'; status = 'danger' }
    }

    // NIH classification
    const nihRisk = gender === "male"
      ? (whr >= 0.95 ? "High" : "Acceptable")
      : (whr >= 0.80 ? "High" : "Acceptable")

    // IDF (International Diabetes Federation) waist-based
    const idfRisk = gender === "male"
      ? (waist >= 94 ? "Central Obesity (IDF)" : "No Central Obesity")
      : (waist >= 80 ? "Central Obesity (IDF)" : "No Central Obesity")

    // Body shape
    const bodyShape = whr > (gender === "male" ? 0.9 : 0.8) ? "🍎 Apple (Android)" : "🍐 Pear (Gynoid)"
    const hormonalSignal = whr > (gender === "male" ? 0.95 : 0.9)
      ? "Possible cortisol/insulin dominance fat pattern"
      : whr < (gender === "male" ? 0.80 : 0.70)
      ? "Estrogenic lower-body fat pattern"
      : "Mixed/neutral fat distribution"

    // Diabetes relative risk multiplier (approximate)
    const diabetesRisk = whr > (gender === "male" ? 0.95 : 0.85)
      ? "3.0× higher T2D risk vs. ideal WHR"
      : whr > (gender === "male" ? 0.90 : 0.80)
      ? "1.8× higher T2D risk"
      : "Baseline T2D risk"

    // Stroke risk correlation
    const strokeRisk = whr > (gender === "male" ? 1.0 : 0.90)
      ? "High stroke correlation (>1.5× relative risk)"
      : riskLevel === 'high' ? "Moderate stroke risk"
      : "Low-moderate stroke risk"

    setResult({
      primaryMetric: { label: "Waist-to-Hip Ratio", value: whr, unit: "", status, description: `${whoClass} – ${bodyShape}`, icon: Ruler },
      healthScore: status === 'good' ? 90 : status === 'normal' ? 70 : 45,
      metrics: [
        { label: "WHR", value: whr, unit: "", status, icon: Ruler },
        { label: "Waist", value: waist, unit: "cm", status: 'normal', icon: Activity },
        { label: "Hip", value: hip, unit: "cm", status: 'normal', icon: Activity },
        { label: "Waist-to-Height", value: wthr, unit: "", status: wthr < 0.5 ? 'good' : wthr < 0.6 ? 'warning' : 'danger', icon: TrendingUp },
        { label: "WHO Class", value: whoClass, unit: "", status, icon: Shield },
        { label: "NIH Risk", value: nihRisk, unit: "", status: nihRisk === "High" ? 'danger' : 'good', icon: Heart },
        { label: "IDF Assessment", value: idfRisk, unit: "", status: idfRisk.includes("Central") ? 'danger' : 'good', icon: AlertTriangle },
      ],
      recommendations: [
        {
          title: `${bodyShape} – ${whoClass}`,
          description: `WHR: ${whr}. ${hormonalSignal}. WHO: ${whoClass} | NIH: ${nihRisk} | IDF: ${idfRisk}.`,
          priority: status === 'good' ? 'low' : 'high', category: "Assessment"
        },
        {
          title: "Cardiometabolic Risk",
          description: `Diabetes risk: ${diabetesRisk}. Stroke: ${strokeRisk}. Waist-to-height ratio: ${wthr} (keep < 0.5 for all ethnicities).`,
          priority: 'high', category: "Risk"
        },
        {
          title: "Reducing Central Obesity",
          description: "Reduce visceral fat via: caloric deficit, resistance training, reduced refined carbs & cortisol management (sleep 7-9h, stress reduction). Every 1 cm waist reduction ≈ 2-3% CVD risk reduction.",
          priority: 'medium', category: "Prevention"
        },
      ],
      detailedBreakdown: {
        "WHR": whr, "WHO Classification": whoClass, "NIH Risk": nihRisk, "IDF": idfRisk,
        "Body Shape": bodyShape, "Hormonal Signal": hormonalSignal, "Diabetes Risk": diabetesRisk, "Stroke Risk": strokeRisk, "Waist-Height Ratio": wthr,
      }
    })
    setChartData({
      isDoughnut: true,
      labels: ['Your WHR', 'Risk Gap'],
      datasets: [{
        data: [whr, Math.max(0.01, (gender === 'male' ? 0.9 : 0.8) - whr + 0.2)],
        backgroundColor: [
          status === 'good' ? '#22c55e' : status === 'normal' ? '#f59e0b' : '#ef4444',
          'rgba(200,200,200,0.3)',
        ],
        borderColor: [status === 'good' ? '#22c55e' : status === 'normal' ? '#f59e0b' : '#ef4444', 'rgba(200,200,200,0.4)'],
        borderWidth: 1.5,
      }]
    })
  }

  const inputs = (
    <div className="space-y-4">
      <GenderBtn value={gender} onChange={setGender} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Waist (cm)" value={waist} onChange={setWaist} min={40} max={200} />
        <NumField label="Hip (cm)" value={hip} onChange={setHip} min={50} max={200} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Height (cm)" value={height} onChange={setHeight} min={100} max={250} step={1} />
        <NumField label="Age" value={age} onChange={setAge} min={10} max={100} step={1} suffix="years" />
      </div>
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 WHR Risk Gauge</p>
          <div style={{ height: '160px' }}>
            <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 12 } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Waist-to-Hip Ratio – Cardiometabolic Model"
      description="WHO/NIH/IDF classification, diabetes & stroke risk, Apple/Pear body shape & hormonal fat pattern detection."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[waist, hip, height, age, gender]}
      seoContent={<SeoContentGenerator title="Waist-to-Hip Ratio Calculator" description="Advanced WHR with WHO/NIH/IDF classification, cardiometabolic risk & body shape analysis." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. WAIST-TO-HEIGHT RATIO – EARLY RISK DETECTOR
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedWaistHeightRatioCalculator() {
  const [waist, setWaist] = useState(82)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [ethnicity, setEthnicity] = useState("western")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  const calc = () => {
    const wthr = r2(waist / height)

    // Universal cutoff rule
    const universalRule = wthr < 0.5 ? "✓ Keep waist < half your height" : "⚠️ Waist exceeds half your height"

    // Risk thresholds
    let riskCategory = ""
    let status: 'good' | 'normal' | 'warning' | 'danger'
    const thresh = ethnicity === "asian" ? { low: 0.43, med: 0.5, high: 0.55 } : { low: 0.44, med: 0.5, high: 0.58 }

    if (wthr < thresh.low) { riskCategory = "Under-fat / Very Low"; status = 'warning' }
    else if (wthr < thresh.med) { riskCategory = "Healthy / Low Risk"; status = 'good' }
    else if (wthr < thresh.high) { riskCategory = "Increased Risk"; status = 'warning' }
    else { riskCategory = "High Risk / Central Obesity"; status = 'danger' }

    // Hypertension probability model
    const htRisk = wthr > 0.59 ? "High (>2× relative risk of hypertension)" :
      wthr > 0.5 ? "Moderate (1.5–2× relative risk)" : "Low"

    // NAFLD probability
    const nafld = wthr > 0.58 ? "High NAFLD probability" : wthr > 0.53 ? "Moderate NAFLD risk" : "Low NAFLD risk"

    // Child percentile approximation (age 5-17)
    const isChild = age >= 5 && age <= 17
    const childFlag = isChild
      ? (wthr > 0.5 ? "Above 85th percentile equivalent – monitoring advised" : "Within healthy range")
      : "Adult assessment applied"

    // Risk progression (kg of waist to reduce risk)
    const idealWaist = r1(height * 0.5)
    const waistToLose = r1(Math.max(0, waist - idealWaist))

    setResult({
      primaryMetric: { label: "Waist-to-Height Ratio", value: wthr, unit: "", status, description: riskCategory, icon: Ruler },
      healthScore: status === 'good' ? 90 : status === 'warning' ? 60 : 35,
      metrics: [
        { label: "WHtR", value: wthr, unit: "", status, icon: Ruler },
        { label: "Universal Rule", value: universalRule, unit: "", status: wthr < 0.5 ? 'good' : 'danger', icon: CheckCircle },
        { label: "Ideal Waist", value: idealWaist, unit: "cm", status: 'normal', icon: Target },
        { label: "Waist Reduction Goal", value: waistToLose, unit: "cm", status: waistToLose > 0 ? 'warning' : 'good', icon: TrendingDown },
        { label: "Hypertension Risk", value: htRisk, unit: "", status: wthr > 0.59 ? 'danger' : wthr > 0.5 ? 'warning' : 'good', icon: Heart },
        { label: "NAFLD Risk", value: nafld, unit: "", status: nafld.includes("High") ? 'danger' : nafld.includes("Moderate") ? 'warning' : 'good', icon: AlertTriangle },
      ],
      recommendations: [
        {
          title: `${riskCategory}`,
          description: `WHtR: ${wthr}. ${universalRule}. ${ethnicity === "asian" ? "Asian (lower) thresholds applied." : "Western thresholds applied."} ${isChild ? `Child/adolescent: ${childFlag}` : ""}`,
          priority: status === 'good' ? 'low' : 'high', category: "Assessment"
        },
        {
          title: "Disease Risk Flags",
          description: `Hypertension: ${htRisk}. Fatty Liver (NAFLD): ${nafld}. Central obesity detected above WHtR 0.5.`,
          priority: 'high', category: "Risk Flags"
        },
        {
          title: "Waist Reduction Target",
          description: `Ideal waist for your height: ${idealWaist} cm. Current excess: ${waistToLose} cm. Each 1 cm waist reduction reduces CVD risk by ~2%. Target 500 kcal deficit + 150 min aerobic exercise per week.`,
          priority: 'medium', category: "Goal"
        },
      ],
      detailedBreakdown: {
        "WHtR": wthr, "Category": riskCategory, "Universal Rule": universalRule,
        "Ideal Waist": `${idealWaist} cm`, "Waist Excess": `${waistToLose} cm`,
        "Hypertension Risk": htRisk, "NAFLD Risk": nafld, "Ethnicity Threshold": ethnicity,
      }
    })
    setChartData({
      labels: ['Your WHtR', 'Healthy Max (0.50)', 'High Risk (0.58)'],
      datasets: [{
        label: 'WHtR Comparison',
        data: [wthr, 0.50, 0.58],
        backgroundColor: [
          status === 'good' ? 'rgba(34,197,94,0.75)' : status === 'warning' ? 'rgba(245,158,11,0.75)' : 'rgba(239,68,68,0.75)',
          'rgba(34,197,94,0.4)',
          'rgba(239,68,68,0.4)',
        ],
        borderColor: ['#22c55e', '#22c55e', '#ef4444'],
        borderWidth: 1.5,
      }]
    })
  }

  const inputs = (
    <div className="space-y-4">
      <GenderBtn value={gender} onChange={setGender} />
      <SelectField label="Ethnicity / Threshold" value={ethnicity} onChange={setEthnicity}
        options={[{ value: "western", label: "Western / General" }, { value: "asian", label: "Asian (Lower Cutoffs)" }]} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Waist (cm)" value={waist} onChange={setWaist} min={40} max={200} />
        <NumField label="Height (cm)" value={height} onChange={setHeight} min={80} max={250} step={1} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Age" value={age} onChange={setAge} min={5} max={100} step={1} suffix="years" />
      </div>
      <SegmentBar value={waist / height} min={0.3} max={0.7}
        zones={[
          { label: "Under-fat", max: 0.43, color: "bg-blue-400" },
          { label: "Healthy", max: 0.5, color: "bg-green-500" },
          { label: "Increased", max: 0.58, color: "bg-yellow-400" },
          { label: "High Risk", max: 0.7, color: "bg-red-600" },
        ]} />
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 WHtR vs Thresholds</p>
          <div style={{ height: '160px' }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0.3, max: 0.7, ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 } } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Waist-to-Height Ratio – Early Risk Detector"
      description="WHtR with hypertension & NAFLD probability flags, child mode, Asian vs Western thresholds & ideal waist target."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[waist, height, age, gender, ethnicity]}
      seoContent={<SeoContentGenerator title="Waist-to-Height Ratio Calculator" description="WHtR early risk detection with NAFLD, hypertension probability & ethnic threshold adjustment." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. WAIST CIRCUMFERENCE – VISCERAL FAT ALERT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedWaistCircumferenceCalculator() {
  const [waist, setWaist] = useState(85)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(73)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [ethnicity, setEthnicity] = useState("european")
  const [stressLevel, setStressLevel] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  const ETHNIC_CUTOFFS: Record<string, { m_mod: number; m_high: number; f_mod: number; f_high: number; label: string }> = {
    european: { m_mod: 94, m_high: 102, f_mod: 80, f_high: 88, label: "European/WHO" },
    asian: { m_mod: 90, m_high: 95, f_mod: 80, f_high: 85, label: "Asian (IDF)" },
    south_asian: { m_mod: 90, m_high: 90, f_mod: 80, f_high: 80, label: "South Asian" },
    latin: { m_mod: 90, m_high: 100, f_mod: 80, f_high: 90, label: "Latin American" },
    arab: { m_mod: 94, m_high: 102, f_mod: 80, f_high: 88, label: "Arab/Middle East" },
  }

  const calc = () => {
    const ec = ETHNIC_CUTOFFS[ethnicity] ?? ETHNIC_CUTOFFS.european
    const mod = gender === "male" ? ec.m_mod : ec.f_mod
    const high = gender === "male" ? ec.m_high : ec.f_high

    let riskColor: 'green' | 'yellow' | 'red'
    let riskLabel = ""
    let status: 'good' | 'normal' | 'warning' | 'danger'

    if (waist < mod) { riskColor = 'green'; riskLabel = "✅ Low Risk (Green)"; status = 'good' }
    else if (waist < high) { riskColor = 'yellow'; riskLabel = "⚠️ Moderate Risk (Yellow)"; status = 'warning' }
    else { riskColor = 'red'; riskLabel = "🔴 High Risk (Red)"; status = 'danger' }

    // Metabolic syndrome checklist (3+ = positive)
    const metSynWaist = waist >= (gender === "male" ? 102 : 88)
    const metSynIndicators = metSynWaist ? 1 : 0 // Waist criterion

    // Insulin resistance approximation (waist-based proxy)
    const bmi = weight / Math.pow(height / 100, 2)
    const homaProxy = r2((waist > 100 ? 0.6 : waist > 90 ? 0.4 : 0.2) * age / 50 * (bmi / 25))
    const insulinRisk = homaProxy > 0.5 ? "High insulin resistance probability" : homaProxy > 0.3 ? "Moderate" : "Low"

    // Cortisol/stress fat indicator
    const cortisolSignal = stressLevel === "high" && waist > mod
      ? "⚠️ High stress + central adiposity = likely cortisol-driven belly fat"
      : stressLevel === "moderate" && waist > mod
      ? "Moderate cortisol contribution possible"
      : "Stress contribution minimal at current waist"

    // NAFLD alert
    const nafldAlert = waist > high ? "🔴 High NAFLD risk (fatty liver)" : waist > mod ? "⚠️ Elevated NAFLD risk" : "Low NAFLD risk"

    // Hormonal imbalance flag
    const hormonalFlag = gender === "female" && waist > 88
      ? "⚠️ Possible estrogen dominance or PCOS pattern — consult endocrinologist"
      : gender === "male" && waist > 102
      ? "⚠️ Low testosterone association with high visceral fat in men"
      : "Hormonal profile appears normal for waist measurement"

    const waistToReduce = r0(Math.max(0, waist - mod + 1))

    setResult({
      primaryMetric: { label: "Waist Circumference", value: waist, unit: "cm", status, description: riskLabel, icon: Ruler },
      healthScore: status === 'good' ? 90 : status === 'warning' ? 60 : 30,
      metrics: [
        { label: "Waist", value: waist, unit: "cm", status, icon: Ruler },
        { label: `${ec.label} Moderate Cutoff`, value: mod, unit: "cm", status: 'normal', icon: Activity },
        { label: `${ec.label} High Cutoff`, value: high, unit: "cm", status: 'normal', icon: Activity },
        { label: "Insulin Resistance", value: insulinRisk, unit: "", status: insulinRisk === "High insulin resistance probability" ? 'danger' : 'warning', icon: Zap },
        { label: "NAFLD Risk", value: nafldAlert, unit: "", status: nafldAlert.includes("High") ? 'danger' : nafldAlert.includes("Elevated") ? 'warning' : 'good', icon: AlertTriangle },
        { label: "Metabolic Syn. Criterion", value: metSynWaist ? "⚠️ Waist criterion MET" : "✓ Waist criterion Not Met", unit: "", status: metSynWaist ? 'danger' : 'good', icon: Heart },
      ],
      recommendations: [
        {
          title: riskLabel,
          description: `Waist: ${waist} cm. Ethnicity threshold (${ec.label}): Moderate risk > ${mod} cm, High risk > ${high} cm. Reduce by ${waistToReduce} cm to exit risk zone.`,
          priority: status === 'good' ? 'low' : 'high', category: "Assessment"
        },
        {
          title: "Hormone & Stress",
          description: `${cortisolSignal}. ${hormonalFlag}. High cortisol promotes visceral fat accumulation — prioritize sleep 7-9h/night & stress management.`,
          priority: 'medium', category: "Hormonal"
        },
        {
          title: "Metabolic Syndrome & NAFLD",
          description: `${nafldAlert}. ${metSynWaist ? "Waist criterion for MetS met — check blood pressure, blood glucose & triglycerides." : "Waist criterion for MetS not met."}. Insulin resistance: ${insulinRisk}.`,
          priority: 'high', category: "Disease Risk"
        },
      ],
      detailedBreakdown: {
        "Waist": `${waist} cm`, "Ethnicity": ec.label, "Moderate Threshold": `${mod} cm`,
        "High Threshold": `${high} cm`, "Risk Level": riskLabel, "NAFLD": nafldAlert,
        "Insulin Resistance": insulinRisk, "Cortisol Signal": cortisolSignal, "Hormonal Flag": hormonalFlag,
        "MetS Waist Criterion": metSynWaist ? "Met" : "Not Met",
      }
    })
    setChartData({
      labels: [`Your Waist (${waist}cm)`, `Moderate Risk (${mod}cm)`, `High Risk (${high}cm)`],
      datasets: [{
        label: 'Waist Circumference (cm)',
        data: [waist, mod, high],
        backgroundColor: [
          status === 'good' ? 'rgba(34,197,94,0.75)' : status === 'warning' ? 'rgba(245,158,11,0.75)' : 'rgba(239,68,68,0.75)',
          'rgba(245,158,11,0.4)',
          'rgba(239,68,68,0.4)',
        ],
        borderColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 1.5,
      }]
    })
  }

  const inputs = (
    <div className="space-y-4">
      <GenderBtn value={gender} onChange={setGender} />
      <SelectField label="Ethnicity / Cutoff Standard" value={ethnicity} onChange={setEthnicity}
        options={Object.entries(ETHNIC_CUTOFFS).map(([v, d]) => ({ value: v, label: d.label }))} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Waist (cm)" value={waist} onChange={setWaist} min={40} max={200} />
        <NumField label="Height (cm)" value={height} onChange={setHeight} min={100} max={250} step={1} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Weight (kg)" value={weight} onChange={setWeight} min={30} max={300} />
        <NumField label="Age" value={age} onChange={setAge} min={10} max={100} step={1} suffix="years" />
      </div>
      <SelectField label="Chronic Stress Level" value={stressLevel} onChange={setStressLevel}
        options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High (chronic stress)" }]} />
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 Waist vs Ethnic Risk Cutoffs</p>
          <div style={{ height: '160px' }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 } } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Waist Circumference – Visceral Fat Alert System"
      description="Ethnic-specific risk cutoffs, metabolic syndrome, NAFLD, insulin resistance & cortisol stress belly fat assessment."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[waist, height, weight, age, gender, ethnicity, stressLevel]}
      seoContent={<SeoContentGenerator title="Waist Circumference Calculator" description="Visceral fat risk assessment with ethnic cutoffs, NAFLD, metabolic syndrome & hormonal analysis." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 9. NECK CIRCUMFERENCE – SLEEP APNEA SCREENING TOOL
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedNeckCircumferenceCalculator() {
  const [neck, setNeck] = useState(38)
  const [bmi, setBmi] = useState(27)
  const [age, setAge] = useState(40)
  const [gender, setGender] = useState("male")
  // STOP-BANG
  const [snores, setSnores] = useState(false)
  const [tired, setTired] = useState(false)
  const [observed, setObserved] = useState(false)
  const [bloodPressure, setBloodPressure] = useState(false)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  const calc = () => {
    // OSA risk from neck alone
    const neckHighRisk = gender === "male" ? 43 : 38
    const neckModRisk = gender === "male" ? 40 : 35

    let neckRisk = "Low"
    let neckStatus: 'good' | 'normal' | 'warning' | 'danger' = 'good'
    if (neck >= neckHighRisk) { neckRisk = "High OSA Risk"; neckStatus = 'danger' }
    else if (neck >= neckModRisk) { neckRisk = "Moderate OSA Risk"; neckStatus = 'warning' }
    else { neckRisk = "Low OSA Risk"; neckStatus = 'good' }

    // STOP-BANG score
    const stopBangScore = [
      snores,
      tired,
      observed,
      bloodPressure,
      bmi > 35,
      age > 50,
      neck > (gender === "male" ? 40 : 35),
      gender === "male",
    ].filter(Boolean).length

    const stopBangRisk = stopBangScore <= 2 ? "Low" : stopBangScore <= 4 ? "Intermediate" : "High"
    const osaProb = stopBangScore <= 2 ? "< 20%" : stopBangScore <= 4 ? "20–50%" : "> 50%"

    // OSA probability band
    const osaBand = neck >= neckHighRisk || stopBangScore >= 5
      ? "🔴 High OSA Probability – consider sleep study (polysomnography)"
      : neck >= neckModRisk || stopBangScore >= 3
      ? "🟡 Intermediate – screening questionnaire + physician consult"
      : "🟢 Low – routine monitoring"

    // BMI + neck composite
    const composite = r1(bmi * 0.5 + neck * 0.3 + age * 0.2)
    const compositeRisk = composite > 35 ? "High" : composite > 25 ? "Moderate" : "Low"

    // Airway obstruction flag
    const airwayFlag = neck >= (gender === "male" ? 43 : 38)
      ? "⚠️ Large neck circumference associated with upper airway narrowing"
      : "Airway obstruction probability lower"

    // Snoring severity
    const snoringRisk = snores && neck >= neckModRisk && bmi > 30
      ? "High snoring severity – possible obstructive sleep apnea"
      : snores
      ? "Snoring present – monitor for apnea episodes"
      : "No snoring reported"

    setResult({
      primaryMetric: { label: "Neck Circumference", value: neck, unit: "cm", status: neckStatus, description: neckRisk, icon: User },
      healthScore: neckStatus === 'good' ? 85 : neckStatus === 'warning' ? 60 : 35,
      metrics: [
        { label: "Neck", value: neck, unit: "cm", status: neckStatus, icon: Ruler },
        { label: "OSA Risk (Neck)", value: neckRisk, unit: "", status: neckStatus, icon: Moon },
        { label: "STOP-BANG Score", value: stopBangScore, unit: "/8", status: stopBangScore >= 5 ? 'danger' : stopBangScore >= 3 ? 'warning' : 'good', icon: BarChart3 },
        { label: "STOP-BANG Risk", value: stopBangRisk, unit: "", status: stopBangRisk === "High" ? 'danger' : stopBangRisk === "Intermediate" ? 'warning' : 'good', icon: AlertTriangle },
        { label: "OSA Probability", value: osaProb, unit: "", status: neckStatus, icon: Activity },
        { label: "Composite Score", value: compositeRisk, unit: "", status: compositeRisk === "High" ? 'danger' : compositeRisk === "Moderate" ? 'warning' : 'good', icon: Brain },
      ],
      recommendations: [
        {
          title: osaBand,
          description: `Neck circumference: ${neck} cm. OSA risk threshold: ${neckModRisk} cm (moderate), ${neckHighRisk} cm (high). STOP-BANG score: ${stopBangScore}/8 → ${stopBangRisk} risk (OSA probability: ${osaProb}).`,
          priority: neckStatus === 'good' ? 'low' : 'high', category: "OSA Screening"
        },
        {
          title: "Composite Risk Profile",
          description: `BMI + Neck + Age composite risk: ${compositeRisk}. ${airwayFlag}. ${snoringRisk}.`,
          priority: 'medium', category: "Risk Profile"
        },
        {
          title: "Clinical Action",
          description: stopBangScore >= 5
            ? "Referral for polysomnography (sleep study) strongly recommended. Untreated OSA increases CVD risk by 2-3×."
            : stopBangScore >= 3
            ? "Consult physician. Consider home sleep test or ENT referral. Avoid alcohol before bed & sleep on side."
            : "Low risk. Maintain healthy weight and monitor annually.",
          priority: stopBangScore >= 5 ? 'high' : stopBangScore >= 3 ? 'medium' : 'low',
          category: "Clinical"
        },
      ],
      detailedBreakdown: {
        "Neck": `${neck} cm`, "OSA Risk": neckRisk, "STOP-BANG Score": `${stopBangScore}/8`,
        "OSA Probability": osaProb, "STOP-BANG Category": stopBangRisk, "Composite Risk": compositeRisk,
        "Airway Flag": airwayFlag, "Snoring Risk": snoringRisk,
      }
    })
    setChartData({
      isDoughnut: true,
      labels: ['STOP-BANG Score', 'Remaining'],
      datasets: [{
        data: [stopBangScore, 8 - stopBangScore],
        backgroundColor: [
          stopBangScore >= 5 ? '#ef4444' : stopBangScore >= 3 ? '#f59e0b' : '#22c55e',
          'rgba(200,200,200,0.3)',
        ],
        borderColor: [stopBangScore >= 5 ? '#ef4444' : stopBangScore >= 3 ? '#f59e0b' : '#22c55e', 'rgba(200,200,200,0.4)'],
        borderWidth: 1.5,
      }]
    })
  }

  const inputs = (
    <div className="space-y-4">
      <GenderBtn value={gender} onChange={setGender} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Neck Circumference (cm)" value={neck} onChange={setNeck} min={20} max={70} step={0.5} />
        <NumField label="BMI" value={bmi} onChange={setBmi} min={10} max={60} step={0.5} suffix="kg/m²" />
      </div>
      <NumField label="Age" value={age} onChange={setAge} min={18} max={100} step={1} suffix="years" />
      <div className="space-y-2">
        <p className="text-sm font-semibold">STOP-BANG Questionnaire</p>
        {[
          ["snores", "🔊 Do you snore loudly?", snores, setSnores],
          ["tired", "😴 Often feel tired/fatigued/sleepy during day?", tired, setTired],
          ["observed", "👁️ Has someone observed you stop breathing during sleep?", observed, setObserved],
          ["bp", "❤️ Do you have high blood pressure?", bloodPressure, setBloodPressure],
        ].map(([key, label, val, setter]: any) => (
          <div key={key as string} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-xl">
            <span className="text-sm">{label as string}</span>
            <button onClick={() => setter(!val)}
              className={`w-11 h-6 rounded-full transition-colors ${val ? "bg-primary" : "bg-muted"} relative flex-shrink-0`}>
              <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Note: BMI &gt;35, Age &gt;50, Neck &gt;{gender === "male" ? "40" : "35"} cm & Male gender are auto-calculated.</p>
      </div>
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 STOP-BANG OSA Score ({chartData.datasets[0].data[0]}/8)</p>
          <div style={{ height: '150px' }}>
            <Doughnut data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 9 }, boxWidth: 12 } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Neck Circumference – Sleep Apnea Screening Tool"
      description="OSA screening with STOP-BANG model, BMI+Neck composite risk, airway obstruction flag & snoring severity."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[neck, bmi, age, gender, snores, tired, observed, bloodPressure]}
      seoContent={<SeoContentGenerator title="Neck Circumference Calculator" description="Sleep apnea risk screening using neck circumference with STOP-BANG score & composite OSA assessment." categoryName="Body Measurements" />}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// 10. HIP CIRCUMFERENCE – FAT PATTERN INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════════════
export function AdvancedHipCircumferenceCalculator() {
  const [hip, setHip] = useState(95)
  const [waist, setWaist] = useState(82)
  const [height, setHeight] = useState(165)
  const [weight, setWeight] = useState(65)
  const [age, setAge] = useState(28)
  const [gender, setGender] = useState("female")
  const [isAthlete, setIsAthlete] = useState(false)
  const [result, setResult] = useState<HealthResult | null>(null)
  const [chartData, setChartData] = useState<any>(null)

  const calc = () => {
    const whr = r2(waist / hip)
    const bmi = r1(weight / Math.pow(height / 100, 2))
    const hipBmi = r2(hip / Math.pow(height / 100, 2))

    // Body shape
    const isApple = whr > (gender === "male" ? 0.9 : 0.8)
    const bodyShape = isApple ? "🍎 Apple (Android)" : "🍐 Pear (Gynoid)"

    // Lower body protective fat note (gynoid fat is protective vs CVD)
    const protectiveFat = !isApple
      ? "✅ Lower-body (gynoid) fat has a PROTECTIVE effect on cardiovascular health. Studies show pear-shaped individuals have lower CVD risk."
      : "⚠️ Central (android) fat pattern — associated with higher metabolic risk than lower-body fat."

    // Estrogenic fat indicator
    const estrogenicSignal = gender === "female" && hip > 100 && !isApple
      ? "High hip-to-waist ratio typical of estrogen-dominant fat distribution in pre-menopausal women."
      : gender === "female" && isApple
      ? "Apple pattern in women may indicate androgen dominance or post-menopausal shift."
      : gender === "male" && hip > 110
      ? "Elevated hip/gluteal fat in males may indicate relative estrogen excess — consider hormonal assessment."
      : "Hormonal fat pattern appears typical."

    // Glute dominance athletic scoring
    const gluteRatio = r2(hip / waist)
    const gluteScore = isAthlete
      ? (gluteRatio > 1.3 ? "Exceptional Glute Development" : gluteRatio > 1.2 ? "Good Athletic Glute Ratio" : "Below Average Athletic Glute Ratio")
      : gluteRatio > 1.3 ? "Excellent Hip Proportion" : gluteRatio > 1.1 ? "Normal Hip Proportion" : "Low Hip-to-Waist Proportion"

    // Body symmetry (simplified)
    const symmetryScore = clamp(r0(100 - Math.abs(whr - 0.75) * 200), 0, 100)

    // Hip width relative to height (proportion)
    const hipHeightRatio = r2(hip / height)
    const proportion = hipHeightRatio > 0.6 ? "Wide (curvy)" : hipHeightRatio > 0.5 ? "Proportionate" : "Narrow"

    // CVD risk note
    const cvdNote = whr < (gender === "male" ? 0.9 : 0.8)
      ? "Low CVD risk — lower body fat is cardiometabolically protective"
      : "Elevated CVD risk from central (abdominal) fat dominance"

    const status: 'good' | 'normal' | 'warning' | 'danger' = !isApple ? 'good' : isApple && whr > (gender === "male" ? 1.0 : 0.9) ? 'danger' : 'warning'

    setResult({
      primaryMetric: { label: "Hip Circumference", value: hip, unit: "cm", status, description: `${bodyShape} – ${gluteScore}`, icon: User },
      healthScore: !isApple ? 88 : status === 'warning' ? 65 : 45,
      metrics: [
        { label: "Hip", value: hip, unit: "cm", status, icon: Ruler },
        { label: "Waist-to-Hip Ratio", value: whr, unit: "", status, icon: Activity },
        { label: "Hip-to-Waist Ratio", value: gluteRatio, unit: "", status: gluteRatio > 1.2 ? 'good' : 'normal', icon: TrendingUp },
        { label: "Body Shape", value: bodyShape, unit: "", status, icon: User },
        { label: "Glute Score", value: gluteScore, unit: "", status: gluteScore.includes("Exceptional") || gluteScore.includes("Excellent") ? 'good' : 'normal', icon: Dumbbell },
        { label: "Proportion", value: proportion, unit: "", status: 'normal', icon: Ruler },
        { label: "Symmetry Score", value: symmetryScore, unit: "/100", status: symmetryScore > 70 ? 'good' : 'normal', icon: CheckCircle },
      ],
      recommendations: [
        {
          title: `${bodyShape} Fat Pattern`,
          description: `WHR: ${whr}. ${gluteScore}. Glute-to-waist ratio: ${gluteRatio}. Hip-to-height proportion: ${proportion} (${hipHeightRatio}).`,
          priority: 'medium', category: "Body Shape"
        },
        {
          title: "Cardiometabolic Context",
          description: `${protectiveFat} ${cvdNote}.`,
          priority: status === 'good' ? 'low' : 'high', category: "CVD Risk"
        },
        {
          title: "Hormonal Analysis",
          description: estrogenicSignal,
          priority: 'medium', category: "Hormonal"
        },
        ...(isAthlete ? [{
          title: "Athletic Assessment",
          description: `Glute development: ${gluteScore}. Ideal hip-to-waist ratio for power athletes: >1.25. Glute hypertrophy improves posterior chain strength, sprint speed & injury prevention.`,
          priority: 'medium' as const, category: "Athletic"
        }] : []),
      ],
      detailedBreakdown: {
        "Hip": `${hip} cm`, "Waist": `${waist} cm`, "WHR": whr,
        "Body Shape": bodyShape, "Glute Score": gluteScore, "Proportion": proportion,
        "Symmetry": `${symmetryScore}/100`, "Hormonal Signal": estrogenicSignal.slice(0, 80) + "...",
        "CVD Note": cvdNote,
      }
    })
    setChartData({
      labels: ['WHR', 'Hip/Waist Ratio', 'Symmetry Score', 'Hip/Height Ratio'],
      datasets: [{
        label: 'Hip Pattern Metrics',
        data: [whr, gluteRatio, symmetryScore / 100, hipHeightRatio],
        backgroundColor: [
          whr < (gender === 'male' ? 0.9 : 0.8) ? 'rgba(34,197,94,0.75)' : 'rgba(239,68,68,0.75)',
          gluteRatio > 1.2 ? 'rgba(59,130,246,0.75)' : 'rgba(245,158,11,0.75)',
          symmetryScore > 70 ? 'rgba(34,197,94,0.75)' : 'rgba(245,158,11,0.75)',
          'rgba(168,85,247,0.75)',
        ],
        borderColor: ['#22c55e', '#3b82f6', '#22c55e', '#a855f7'],
        borderWidth: 1.5,
      }]
    })
  }

  const inputs = (
    <div className="space-y-4">
      <GenderBtn value={gender} onChange={setGender} />
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Hip (cm)" value={hip} onChange={setHip} min={50} max={200} />
        <NumField label="Waist (cm)" value={waist} onChange={setWaist} min={40} max={200} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Height (cm)" value={height} onChange={setHeight} min={100} max={250} step={1} />
        <NumField label="Weight (kg)" value={weight} onChange={setWeight} min={30} max={300} />
      </div>
      <NumField label="Age" value={age} onChange={setAge} min={10} max={100} step={1} suffix="years" />
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
        <span className="text-sm font-medium">🏋️ Athlete / Fitness Competitor Mode</span>
        <button onClick={() => setIsAthlete(!isAthlete)}
          className={`w-11 h-6 rounded-full transition-colors ${isAthlete ? "bg-primary" : "bg-muted"} relative`}>
          <span className={`absolute top-0.5 h-5 w-5 bg-white rounded-full shadow transition-transform ${isAthlete ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>
      {chartData && (
        <div className="pt-3 border-t border-border/30 mt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-2">📈 Hip Pattern Analysis</p>
          <div style={{ height: '170px' }}>
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { font: { size: 9 } } }, x: { ticks: { font: { size: 8 } } } } }} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Hip Circumference – Fat Pattern Intelligence"
      description="Waist-hip integration, Apple/Pear body shape, glute dominance athletic scoring, estrogenic fat pattern & CVD protective fat note."
      inputs={inputs} calculate={calc} result={result}
      categoryName="Body Measurements"
      onClear={() => { setResult(null); setChartData(null) }}
      values={[hip, waist, height, weight, age, gender, isAthlete]}
      seoContent={<SeoContentGenerator title="Hip Circumference Calculator" description="Fat pattern analysis with body shape, WHR, athletic glute scoring, hormonal fat distribution & CVD risk." categoryName="Body Measurements" />}
    />
  )
}
