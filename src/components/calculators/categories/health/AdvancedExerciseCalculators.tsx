"use client"

import { useState } from "react"
import { Activity, Dumbbell, Heart, TrendingUp, Timer, Zap, Medal, Bike } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

// ─── Shared helpers ───────────────────────────────────────────────────────────
function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
function r2(n: number) { return Math.round(n * 100) / 100 }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

function NumInput({ label, val, set, min, max, step, suffix }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}{suffix && <span className="text-muted-foreground ml-1">({suffix})</span>}</label>
      <input type="number" value={val} onChange={e => set(Number(e.target.value))} min={min} max={max} step={step ?? 1}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
    </div>
  )
}

function SelectInput({ label, val, set, options }: { label: string; val: string; set: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select value={val} onChange={e => set(e.target.value)}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ─── 1. One Rep Max Calculator ───────────────────────────────────────────────
export function OneRepMaxCalculator() {
  const [weight, setWeight] = useState(100)
  const [reps, setReps] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 1, 1000)
    const r = clamp(Math.round(reps), 1, 30)

    const epley = w * (1 + r / 30)
    const brzycki = r > 1 ? w * (36 / (37 - r)) : w
    const lombardi = Math.pow(w * r, 0.1) * w
    const mayhew = (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))
    const lander = (100 * w) / (101.3 - 2.67123 * r)
    const average = (epley + brzycki + mayhew + lander) / 4

    const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50]

    setResult({
      primaryMetric: { label: "Estimated 1 Rep Max (Epley)", value: r1(epley), unit: "kg", status: "good", description: `Based on ${w} kg × ${r} reps` },
      healthScore: Math.min(100, r0(average / 1.5)),
      metrics: [
        { label: "Epley Formula", value: r1(epley), unit: "kg", status: "good" },
        { label: "Brzycki Formula", value: r1(brzycki), unit: "kg", status: "good" },
        { label: "Mayhew Formula", value: r1(mayhew), unit: "kg", status: "normal" },
        { label: "Lander Formula", value: r1(lander), unit: "kg", status: "normal" },
        { label: "Average 1RM", value: r1(average), unit: "kg", status: "good" },
        ...pcts.map(p => ({
          label: `${p}% of 1RM`, value: r1(average * p / 100), unit: "kg", status: "normal" as const
        }))
      ],
      recommendations: [
        { title: "Training Loads", description: `For strength (1-5 reps): ${r1(average * 0.85)}–${r1(average * 1.0)} kg. For hypertrophy (6-12 reps): ${r1(average * 0.67)}–${r1(average * 0.80)} kg. For endurance (13+ reps): below ${r1(average * 0.67)} kg.`, priority: "high", category: "Training" },
        { title: "Safety Note", description: "1RM estimates are predictions. Always test with proper warm-up and a spotter. These formulas are most accurate for 3-10 rep sets.", priority: "medium", category: "Safety" },
        { title: "Progressive Overload", description: `Aim to increase your 1RM by 2.5-5% every 2-4 weeks. Your next goal: ${r1(epley * 1.05)} kg.`, priority: "low", category: "Progress" }
      ],
      detailedBreakdown: { "Lift Weight": `${w} kg`, "Reps Performed": r, "Best Estimate (avg)": `${r1(average)} kg` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="one-rep-max" title="One Rep Max Calculator"
      description="Estimate your 1RM using Epley, Brzycki, Mayhew & Lander formulas. Get full training load percentages."
      icon={Dumbbell} calculate={calculate} onClear={() => { setWeight(100); setReps(5); setResult(null) }}
      values={[weight, reps]} result={result}
      seoContent={<SeoContentGenerator title="One Rep Max Calculator" description="Estimate maximum lifting capacity." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Weight Lifted" val={weight} set={setWeight} min={1} max={1000} step={0.5} suffix="kg" />
        <NumInput label="Repetitions Performed" val={reps} set={setReps} min={1} max={30} />
      </div>} />
  )
}

// ─── 2. VO2 Max Calculator ────────────────────────────────────────────────────
export function VO2MaxCalculator() {
  const [testType, setTestType] = useState("rockport")
  const [weight, setWeight] = useState(70)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [mile_time, setMileTime] = useState(12)
  const [hr, setHr] = useState(140)
  const [distance_12min, setDistance12Min] = useState(2400)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let vo2max = 0

    if (testType === "rockport") {
      // Rockport Walk Test
      vo2max = 132.853 - (0.0769 * (weight * 2.20462)) - (0.3877 * age) + (6.315 * (gender === "male" ? 1 : 0)) - (3.2649 * mile_time) - (0.1565 * hr)
    } else {
      // Cooper 12-min Run Test
      vo2max = (distance_12min - 504.9) / 44.73
    }
    vo2max = Math.max(15, vo2max)

    let category = ""
    let status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (gender === "male") {
      if (age < 30) { category = vo2max > 55 ? "Excellent" : vo2max > 46 ? "Good" : vo2max > 42 ? "Above Average" : vo2max > 38 ? "Average" : vo2max > 35 ? "Below Average" : "Poor"; status = vo2max > 46 ? "good" : vo2max > 38 ? "normal" : "warning" }
      else if (age < 40) { category = vo2max > 54 ? "Excellent" : vo2max > 45 ? "Good" : vo2max > 41 ? "Above Average" : vo2max > 36 ? "Average" : vo2max > 32 ? "Below Average" : "Poor"; status = vo2max > 45 ? "good" : vo2max > 36 ? "normal" : "warning" }
      else { category = vo2max > 50 ? "Excellent" : vo2max > 42 ? "Good" : vo2max > 36 ? "Above Average" : vo2max > 32 ? "Average" : vo2max > 28 ? "Below Average" : "Poor"; status = vo2max > 42 ? "good" : vo2max > 32 ? "normal" : "warning" }
    } else {
      if (age < 30) { category = vo2max > 49 ? "Excellent" : vo2max > 40 ? "Good" : vo2max > 36 ? "Above Average" : vo2max > 32 ? "Average" : vo2max > 28 ? "Below Average" : "Poor"; status = vo2max > 40 ? "good" : vo2max > 32 ? "normal" : "warning" }
      else { category = vo2max > 45 ? "Excellent" : vo2max > 36 ? "Good" : vo2max > 32 ? "Above Average" : vo2max > 28 ? "Average" : vo2max > 24 ? "Below Average" : "Poor"; status = vo2max > 36 ? "good" : vo2max > 28 ? "normal" : "warning" }
    }

    const mets = r1(vo2max / 3.5)

    setResult({
      primaryMetric: { label: "VO2 Max", value: r1(vo2max), unit: "mL/kg/min", status, description: `${category} aerobic fitness for your age/gender` },
      healthScore: Math.min(100, r0(vo2max * 1.5)),
      metrics: [
        { label: "VO2 Max", value: r1(vo2max), unit: "mL/kg/min", status },
        { label: "Fitness Category", value: category, status },
        { label: "METs Equivalent", value: mets, status: "normal" },
        { label: "Oxygen Volume", value: r0(vo2max * weight / 1000 * 60), unit: "L/hr at max", status: "normal" }
      ],
      recommendations: [
        { title: "Improving VO2 Max", description: "High-Intensity Interval Training (HIIT) 2-3×/week is the most effective way to increase VO2 max. Gains of 5-20% are achievable in 12-16 weeks.", priority: "high", category: "Training" },
        { title: "Cardiovascular Health Link", description: `VO2 max of ${r1(vo2max)} mL/kg/min puts you in the "${category}" category. A high VO2 max is strongly linked to lower cardiovascular disease risk and longer lifespan.`, priority: "medium", category: "Health" },
        { title: "Race Pace Prediction", description: `Estimated 5K pace: ${r0(60 / (vo2max * 0.8 / 210))} min/km. Half-marathon pace: ${r0(60 / (vo2max * 0.75 / 210))} min/km.`, priority: "low", category: "Performance" }
      ],
      detailedBreakdown: { "Test Used": testType === "rockport" ? "Rockport Walk Test" : "Cooper 12-min Run", "VO2 Max": `${r1(vo2max)} mL/kg/min`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vo2-max-calculator" title="VO2 Max Calculator"
      description="Estimate aerobic capacity using Rockport Walk Test or Cooper 12-min Run. Includes fitness category and race pace predictions."
      icon={Activity} calculate={calculate} onClear={() => { setTestType("rockport"); setWeight(70); setAge(30); setGender("male"); setMileTime(12); setHr(140); setResult(null) }}
      values={[testType, weight, age, gender, mile_time, hr, distance_12min]} result={result}
      seoContent={<SeoContentGenerator title="VO2 Max Calculator" description="Measure aerobic fitness level." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Test Type" val={testType} set={setTestType} options={[{ value: "rockport", label: "Rockport Walk Test (1 mile walk)" }, { value: "cooper", label: "Cooper 12-Minute Run Test" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="yr" />
        </div>
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        {testType === "rockport" ? <>
          <NumInput label="1-Mile Walk Time" val={mile_time} set={setMileTime} min={5} max={30} step={0.5} suffix="min" />
          <NumInput label="Heart Rate at End of Walk" val={hr} set={setHr} min={60} max={220} suffix="bpm" />
        </> : <NumInput label="Distance Covered in 12 Minutes" val={distance_12min} set={setDistance12Min} min={500} max={5000} step={10} suffix="meters" />}
      </div>} />
  )
}

// ─── 3. Max Heart Rate Calculator ────────────────────────────────────────────
export function MaxHeartRateCalculator() {
  const [age, setAge] = useState(30)
  const [formula, setFormula] = useState("formula220")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    const mhr_classic = 220 - a
    const mhr_gulati = 206 - 0.88 * a          // for women
    const mhr_hfmax = 208 - 0.7 * a            // Tanaka
    const mhr_inbar = 205.8 - 0.685 * a
    const mhr = formula === "formula220" ? mhr_classic : formula === "tanaka" ? mhr_hfmax : formula === "gulati" ? mhr_gulati : mhr_inbar

    const zones = [
      { name: "Zone 1 – Recovery", pct: "50-60%", min: r0(mhr * 0.5), max: r0(mhr * 0.6), desc: "Very light — warm-up/cool-down" },
      { name: "Zone 2 – Fat Burn", pct: "60-70%", min: r0(mhr * 0.6), max: r0(mhr * 0.7), desc: "Light effort — improves endurance base" },
      { name: "Zone 3 – Aerobic", pct: "70-80%", min: r0(mhr * 0.7), max: r0(mhr * 0.8), desc: "Moderate effort — improves cardiovascular fitness" },
      { name: "Zone 4 – Threshold", pct: "80-90%", min: r0(mhr * 0.8), max: r0(mhr * 0.9), desc: "Hard effort — improves speed and performance" },
      { name: "Zone 5 – Max", pct: "90-100%", min: r0(mhr * 0.9), max: mhr, desc: "Maximum effort — short bursts only" },
    ]

    setResult({
      primaryMetric: { label: "Maximum Heart Rate", value: mhr, unit: "bpm", status: "good", description: "Your theoretical maximum heart rate" },
      metrics: [
        { label: "MHR (220–age)", value: mhr_classic, unit: "bpm", status: "normal" },
        { label: "MHR (Tanaka)", value: r0(mhr_hfmax), unit: "bpm", status: "normal" },
        { label: "MHR (Gulati, women)", value: r0(mhr_gulati), unit: "bpm", status: "normal" },
        { label: "MHR (Inbar)", value: r0(mhr_inbar), unit: "bpm", status: "normal" },
        ...zones.map(z => ({ label: `${z.name}`, value: `${z.min}–${z.max}`, unit: "bpm", status: "normal" as const }))
      ],
      recommendations: [
        { title: "Train in Zone 2 for Base Fitness", description: `Zone 2 (${r0(mhr * 0.6)}–${r0(mhr * 0.7)} bpm) is the sweet spot for building aerobic base and fat oxidation. 60-70% of weekly training should be in this zone.`, priority: "high", category: "Training" },
        { title: "Zone 4/5 for Performance", description: `High-intensity zones (${r0(mhr * 0.8)}+ bpm) should be used 1-2×/week maximum. Overuse leads to injury and overtraining.`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: Object.fromEntries(zones.map(z => [z.name, `${z.min}–${z.max} bpm (${z.pct})`]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="max-heart-rate-calculator" title="Max Heart Rate Calculator"
      description="Calculate your maximum heart rate with 4 formulas and get precise training zones for all 5 intensity levels."
      icon={Heart} calculate={calculate} onClear={() => { setAge(30); setResult(null) }}
      values={[age, formula]} result={result}
      seoContent={<SeoContentGenerator title="Max Heart Rate Calculator" description="Estimate maximum heart rate by age." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
        <SelectInput label="Formula" val={formula} set={setFormula} options={[{ value: "formula220", label: "Classic (220 – Age)" }, { value: "tanaka", label: "Tanaka (208 – 0.7×Age)" }, { value: "gulati", label: "Gulati (Women: 206 – 0.88×Age)" }, { value: "inbar", label: "Inbar (205.8 – 0.685×Age)" }]} />
      </div>} />
  )
}

// ─── 4. Karvonen / Heart Rate Reserve Calculator ──────────────────────────────
export function KarvonenFormulaCalculator() {
  const [age, setAge] = useState(30)
  const [rhr, setRhr] = useState(60)
  const [intensity, setIntensity] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const mhr = 220 - clamp(age, 10, 90)
    const hrr = mhr - clamp(rhr, 30, 120)
    const target = r0(hrr * (clamp(intensity, 30, 100) / 100) + rhr)

    const zones = [50, 60, 65, 70, 75, 80, 85, 90].map(pct => ({
      pct, bpm: r0(hrr * (pct / 100) + rhr)
    }))

    setResult({
      primaryMetric: { label: `Target HR at ${intensity}%`, value: target, unit: "bpm", status: "good", description: `Karvonen formula: HRR × ${intensity}% + RHR` },
      metrics: [
        { label: "Max Heart Rate (220-age)", value: mhr, unit: "bpm", status: "normal" },
        { label: "Resting Heart Rate", value: rhr, unit: "bpm", status: rhr < 60 ? "good" : rhr < 80 ? "normal" : "warning" },
        { label: "Heart Rate Reserve", value: hrr, unit: "bpm", status: "good" },
        { label: `Target at ${intensity}%`, value: target, unit: "bpm", status: "good" },
        ...zones.map(z => ({ label: `${z.pct}% intensity`, value: z.bpm, unit: "bpm", status: "normal" as const }))
      ],
      recommendations: [
        { title: "The Karvonen Advantage", description: `The Karvonen method accounts for your resting heart rate (${rhr} bpm), giving more personalized intensity targets than simple MHR-based zones. At ${intensity}%, your target is ${target} bpm.`, priority: "high", category: "Training" },
        { title: "Measure RHR Accurately", description: "Measure RHR first thing in the morning before getting out of bed, over 3-5 days and take the average for best accuracy.", priority: "medium", category: "Accuracy" }
      ],
      detailedBreakdown: { "MHR": `${mhr} bpm`, "RHR": `${rhr} bpm`, "HRR": `${hrr} bpm`, "Target Zone": `${target} bpm at ${intensity}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="karvonen-formula" title="Karvonen Formula Calculator"
      description="Calculate personalized target heart rate zones using Heart Rate Reserve — more accurate than simple MHR percentage methods."
      icon={Heart} calculate={calculate} onClear={() => { setAge(30); setRhr(60); setIntensity(70); setResult(null) }}
      values={[age, rhr, intensity]} result={result}
      seoContent={<SeoContentGenerator title="Karvonen Formula Calculator" description="Calculate target heart rate zones." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
        <NumInput label="Resting Heart Rate" val={rhr} set={setRhr} min={30} max={120} suffix="bpm" />
        <NumInput label="Desired Intensity" val={intensity} set={setIntensity} min={30} max={100} suffix="%" />
      </div>} />
  )
}

// ─── 5. Pace Calculator ────────────────────────────────────────────────────────
export function PaceCalculator() {
  const [mode, setMode] = useState("find_pace")
  const [distKm, setDistKm] = useState(5)
  const [timeMin, setTimeMin] = useState(30)
  const [paceSec, setPaceSec] = useState(360)  // sec/km
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let computedPace = 0, computedTime = 0, computedDist = 0

    if (mode === "find_pace") {
      computedPace = (timeMin * 60) / distKm
      computedTime = timeMin
      computedDist = distKm
    } else if (mode === "find_time") {
      computedTime = (paceSec * distKm) / 60
      computedPace = paceSec
      computedDist = distKm
    } else {
      computedDist = (timeMin * 60) / paceSec
      computedPace = paceSec
      computedTime = timeMin
    }

    const paceMin = Math.floor(computedPace / 60)
    const paceSecs = Math.round(computedPace % 60)
    const paceStr = `${paceMin}:${paceSecs.toString().padStart(2, "0")} min/km`
    const speedKph = r2(3600 / computedPace)
    const totMin = Math.floor(computedTime)
    const totSec = Math.round((computedTime - totMin) * 60)

    const races = [
      { name: "5K", dist: 5 },
      { name: "10K", dist: 10 },
      { name: "Half Marathon", dist: 21.0975 },
      { name: "Marathon", dist: 42.195 },
    ].map(r => {
      const secs = computedPace * r.dist
      const h = Math.floor(secs / 3600)
      const m = Math.floor((secs % 3600) / 60)
      const s = Math.round(secs % 60)
      return { name: r.name, time: h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}` }
    })

    setResult({
      primaryMetric: { label: "Pace", value: paceStr, status: "good", description: `Speed: ${speedKph} km/h` },
      metrics: [
        { label: "Pace", value: paceStr, status: "good" },
        { label: "Speed", value: speedKph, unit: "km/h", status: "good" },
        { label: "Distance", value: r2(computedDist), unit: "km", status: "normal" },
        { label: "Total Time", value: `${totMin}:${totSec.toString().padStart(2, "0")}`, status: "normal" },
        ...races.map(r => ({ label: `Race Prediction: ${r.name}`, value: r.time, status: "normal" as const }))
      ],
      recommendations: [
        { title: "Easily Achievable Improvements", description: `Increasing cadence to 170-180 spm could improve your pace by 5-10%. Focus on short, quick strides rather than long, slow ones.`, priority: "medium", category: "Running Form" },
        { title: "Training Pace Guidelines", description: `Easy runs: ${paceMin + 1}:${paceSecs.toString().padStart(2, "0")} – ${paceMin + 2}:${paceSecs.toString().padStart(2, "0")} min/km. Tempo: ${paceMin - 1}:${paceSecs.toString().padStart(2, "0")} min/km.`, priority: "low", category: "Training" }
      ],
      detailedBreakdown: { "Pace": paceStr, "Speed": `${speedKph} km/h`, "Distance": `${r2(computedDist)} km` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pace-calculator" title="Running Pace Calculator"
      description="Calculate running/walking pace, time, or distance. Includes race finish time predictions for 5K, 10K, Half Marathon & Marathon."
      icon={Activity} calculate={calculate} onClear={() => { setDistKm(5); setTimeMin(30); setPaceSec(360); setResult(null) }}
      values={[mode, distKm, timeMin, paceSec]} result={result}
      seoContent={<SeoContentGenerator title="Pace Calculator" description="Calculate running/walking pace." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Calculate" val={mode} set={setMode} options={[{ value: "find_pace", label: "Find Pace (from distance + time)" }, { value: "find_time", label: "Find Time (from distance + pace)" }, { value: "find_dist", label: "Find Distance (from time + pace)" }]} />
        {(mode === "find_pace" || mode === "find_time") && <NumInput label="Distance" val={distKm} set={setDistKm} min={0.1} max={200} step={0.1} suffix="km" />}
        {(mode === "find_pace" || mode === "find_dist") && <NumInput label="Total Time" val={timeMin} set={setTimeMin} min={1} max={600} step={0.5} suffix="minutes" />}
        {(mode === "find_time" || mode === "find_dist") && <NumInput label="Pace" val={Math.round(paceSec)} set={setPaceSec} min={120} max={1200} step={5} suffix="sec/km" />}
      </div>} />
  )
}

// ─── 6. Calories Burned – MET-based ──────────────────────────────────────────
function metCalories(met: number, weightKg: number, durationMin: number) {
  return r0(met * weightKg * (durationMin / 60))
}

function MetCaloriesCalculator({ toolId, title, description, icon: Icon, activities }: {
  toolId: string; title: string; description: string; icon: any
  activities: { label: string; met: number }[]
}) {
  const [weight, setWeight] = useState(70)
  const [duration, setDuration] = useState(30)
  const [actIdx, setActIdx] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const act = activities[actIdx]
    const kcal = metCalories(act.met, weight, duration)
    const allActivities = activities.map(a => ({
      label: a.label, value: metCalories(a.met, weight, duration), unit: "kcal", status: "normal" as const
    }))

    setResult({
      primaryMetric: { label: `Calories Burned: ${act.label}`, value: kcal, unit: "kcal", status: "good", description: `${duration} min at ${weight} kg` },
      metrics: [
        { label: "Duration", value: duration, unit: "min", status: "normal" },
        { label: "Body Weight", value: weight, unit: "kg", status: "normal" },
        { label: "MET Value", value: act.met, status: "normal" },
        ...allActivities
      ],
      recommendations: [
        { title: "Calorie Burn Context", description: `You burned approximately ${kcal} kcal in ${duration} minutes. To lose 0.5 kg of fat, you need to burn ~3,500 kcal through exercise or diet deficit.`, priority: "high", category: "Weight Management" },
        { title: "Increase Intensity Gradually", description: "Even a 10-15% increase in exercise intensity can significantly boost calorie burn without proportionally increasing fatigue.", priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Activity": act.label, "MET": act.met, "Duration": `${duration} min`, "Calories": `${kcal} kcal`, "Per Minute": `${r1(kcal / duration)} kcal/min` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId={toolId} title={title} description={description}
      icon={Icon} calculate={calculate} onClear={() => { setWeight(70); setDuration(30); setActIdx(0); setResult(null) }}
      values={[weight, duration, actIdx]} result={result}
      seoContent={<SeoContentGenerator title={title} description={description} categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Activity" val={String(actIdx)} set={v => setActIdx(Number(v))} options={activities.map((a, i) => ({ value: String(i), label: a.label }))} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
        </div>
      </div>} />
  )
}

export function CaloriesBurnedWalkingCalculator() {
  return <MetCaloriesCalculator toolId="calories-burned-walking" title="Calories Burned Walking"
    description="Calculate calories burned while walking. Includes flat ground, uphill, treadmill & brisk walking MET values."
    icon={Activity}
    activities={[
      { label: "Slow walk (2 km/h)", met: 2.0 }, { label: "Moderate walk (3.5 km/h)", met: 3.0 },
      { label: "Brisk walk (5 km/h)", met: 3.8 }, { label: "Fast walk (6.4 km/h)", met: 5.0 },
      { label: "Walking uphill", met: 6.0 }, { label: "Nordic walking", met: 6.8 }
    ]} />
}

export function CaloriesBurnedRunningCalculator() {
  return <MetCaloriesCalculator toolId="calories-burned-running" title="Calories Burned Running"
    description="Estimate calories burned while running at different speeds, including intervals and trail running."
    icon={Activity}
    activities={[
      { label: "Jogging (8 km/h)", met: 7.0 }, { label: "Running (9.6 km/h)", met: 9.8 },
      { label: "Running (11 km/h)", met: 10.5 }, { label: "Running (12 km/h)", met: 11.0 },
      { label: "Fast running (14 km/h)", met: 12.5 }, { label: "Sprint racing (16+ km/h)", met: 14.5 },
      { label: "Trail running – moderate", met: 8.0 }, { label: "Treadmill running (incline)", met: 10.0 }
    ]} />
}

export function SwimmingCaloriesCalculator() {
  return <MetCaloriesCalculator toolId="swimming-calories-burned" title="Swimming Calories Calculator"
    description="Estimate calories burned while swimming different strokes and intensities."
    icon={Activity}
    activities={[
      { label: "Leisurely swimming", met: 5.8 }, { label: "Freestyle – slow", met: 7.0 },
      { label: "Freestyle – fast", met: 9.8 }, { label: "Backstroke", met: 7.0 },
      { label: "Breaststroke", met: 10.3 }, { label: "Butterfly", met: 13.8 }, { label: "Water polo", met: 10.0 }
    ]} />
}

export function HIITCaloriesCalculator() {
  return <MetCaloriesCalculator toolId="hiit-workout-calculator" title="HIIT Workout Calorie Calculator"
    description="Calculate calories burned during HIIT, circuit training, and high-intensity bootcamp sessions."
    icon={Zap}
    activities={[
      { label: "HIIT – moderate effort", met: 8.0 }, { label: "HIIT – vigorous", met: 12.3 },
      { label: "Circuit training", met: 8.0 }, { label: "Tabata protocol", met: 13.5 },
      { label: "Bootcamp class", met: 10.0 }, { label: "CrossFit style WOD", met: 12.0 }
    ]} />
}

export function StepsToCaloriesCalculator() {
  const [steps, setSteps] = useState(10000)
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const strideLengthM = height * 0.415 / 100                    // stride length ~41.5% of height
    const distKm = steps * strideLengthM / 1000
    const kcal = r0(distKm * 0.72 * weight / 70 * 60)            // ~60 kcal/km for 70kg avg
    const met = 3.5
    const timeMin = r0((distKm / 5) * 60)                         // assume 5 km/h

    setResult({
      primaryMetric: { label: "Calories Burned", value: kcal, unit: "kcal", status: "good", description: `${steps.toLocaleString()} steps = ~${r1(distKm)} km` },
      metrics: [
        { label: "Steps", value: steps.toLocaleString(), status: "good" },
        { label: "Estimated Distance", value: r1(distKm), unit: "km", status: "normal" },
        { label: "Estimated Time", value: timeMin, unit: "min", status: "normal" },
        { label: "Stride Length", value: r1(strideLengthM * 100), unit: "cm", status: "normal" },
        { label: "Calories Burned", value: kcal, unit: "kcal", status: "good" },
        { label: "Steps for 500 kcal", value: r0(500 / kcal * steps), unit: "steps", status: "normal" }
      ],
      recommendations: [
        { title: "10,000 Steps/Day Goal", description: `At your weight (${weight} kg), 10,000 steps burns approximately ${r0(r1(10000 * height * 0.415 / 100 / 1000) * 0.72 * weight / 70 * 60)} kcal. This is equivalent to ~${r1(10000 * height * 0.415 / 100 / 1000)} km of walking.`, priority: "high", category: "Daily Activity" },
        { title: "Gradual Increase", description: "Increase daily steps by 500-1000 per week until reaching your target. Even 20-minute walks add 2,000-2,500 steps.", priority: "medium", category: "Habit Building" }
      ],
      detailedBreakdown: { "Steps": steps.toLocaleString(), "Distance": `${r1(distKm)} km`, "Calories": `${kcal} kcal` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="steps-to-calories" title="Steps to Calories Calculator"
      description="Convert daily step count to calories burned. Personalized by weight and height for accurate estimates."
      icon={Activity} calculate={calculate} onClear={() => { setSteps(10000); setWeight(70); setHeight(170); setResult(null) }}
      values={[steps, weight, height]} result={result}
      seoContent={<SeoContentGenerator title="Steps to Calories Calculator" description="Estimate calories burned from steps." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Daily Steps" val={steps} set={setSteps} min={100} max={100000} step={100} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={100} max={250} suffix="cm" />
        </div>
      </div>} />
  )
}

// ─── 7. Strength Training 1RM calculators ─────────────────────────────────────
function StrengthLiftCalculator({ toolId, title, lift }: { toolId: string; title: string; lift: string }) {
  const [weight, setWeight] = useState(80)
  const [reps, setReps] = useState(5)
  const [gender, setGender] = useState("male")
  const [bodyWeight, setBodyWeight] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 1, 1000)
    const r = clamp(Math.round(reps), 1, 30)
    const bw = clamp(bodyWeight, 30, 300)
    const orm = r1(w * (1 + r / 30))
    const bwRatio = r2(orm / bw)

    // Strength standards (bodyweight ratios)
    const standards = gender === "male"
      ? { beginner: 0.5, novice: 0.75, intermediate: 1.0, advanced: 1.5, elite: 2.0 }
      : { beginner: 0.25, novice: 0.5, intermediate: 0.75, advanced: 1.25, elite: 1.75 }

    let level = "Untrained"
    if (bwRatio >= standards.elite) level = "Elite"
    else if (bwRatio >= standards.advanced) level = "Advanced"
    else if (bwRatio >= standards.intermediate) level = "Intermediate"
    else if (bwRatio >= standards.novice) level = "Novice"
    else if (bwRatio >= standards.beginner) level = "Beginner"

    setResult({
      primaryMetric: { label: `${lift} 1RM Estimate`, value: orm, unit: "kg", status: "good", description: `${(bwRatio * 100).toFixed(0)}% of bodyweight – ${level}` },
      metrics: [
        { label: "Estimated 1RM", value: orm, unit: "kg", status: "good" },
        { label: "Bodyweight Ratio", value: bwRatio, unit: "× BW", status: bwRatio > 1.5 ? "good" : bwRatio > 1.0 ? "normal" : "warning" },
        { label: "Strength Level", value: level, status: bwRatio >= standards.intermediate ? "good" : "normal" },
        { label: "Next Level Target", value: r1(bw * (bwRatio >= standards.elite ? standards.elite : Object.values(standards).find(v => v > bwRatio) ?? standards.elite)), unit: "kg", status: "normal" },
        { label: "85% Training Weight", value: r1(orm * 0.85), unit: "kg", status: "normal" },
        { label: "75% Training Weight", value: r1(orm * 0.75), unit: "kg", status: "normal" },
        { label: "65% Training Weight", value: r1(orm * 0.65), unit: "kg", status: "normal" },
      ],
      recommendations: [
        { title: "Strength Standards", description: `Your ${lift} is at the ${level} level at ${bwRatio.toFixed(2)}× bodyweight. Intermediate standard: ${r1(bw * standards.intermediate)} kg. Advanced: ${r1(bw * standards.advanced)} kg.`, priority: "high", category: "Standards" },
        { title: "Progressive Overload", description: `For strength gains, add 2.5 kg/week for lower body and 1-2.5 kg/week for upper body lifts. Focus on form over weight.`, priority: "medium", category: "Programming" }
      ],
      detailedBreakdown: { "Lift": lift, "1RM": `${orm} kg`, "BW Ratio": `${bwRatio}×`, "Level": level }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId={toolId} title={title}
      description={`Calculate your ${lift} 1 rep max and see where you stand on strength standards for your bodyweight.`}
      icon={Dumbbell} calculate={calculate} onClear={() => { setWeight(80); setReps(5); setResult(null) }}
      values={[weight, reps, gender, bodyWeight]} result={result}
      seoContent={<SeoContentGenerator title={title} description={`${lift} strength calculator`} categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Weight Lifted" val={weight} set={setWeight} min={1} max={1000} step={0.5} suffix="kg" />
        </div>
        <NumInput label="Reps Completed" val={reps} set={setReps} min={1} max={30} />
      </div>} />
  )
}

export function BenchPressCalculator() { return <StrengthLiftCalculator toolId="bench-press-calculator" title="Bench Press Calculator" lift="Bench Press" /> }
export function SquatStrengthCalculator() { return <StrengthLiftCalculator toolId="squat-strength-calculator" title="Squat Strength Calculator" lift="Squat" /> }
export function DeadliftCalculator() { return <StrengthLiftCalculator toolId="deadlift-calculator" title="Deadlift Calculator" lift="Deadlift" /> }

// ─── 8. Wilks Score Calculator ─────────────────────────────────────────────────
export function WilksScoreCalculator() {
  const [bw, setBw] = useState(80)
  const [total, setTotal] = useState(300)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(bw, 30, 300)
    const t = clamp(total, 50, 2000)

    const a = gender === "male"
      ? [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8]
      : [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-5, -9.054e-8]

    const denom = a[0] + a[1]*w + a[2]*w**2 + a[3]*w**3 + a[4]*w**4 + a[5]*w**5
    const wilks = denom !== 0 ? r1(500 / denom * t) : 0

    let level = ""
    if (wilks >= 500) level = "Elite / World-class"
    else if (wilks >= 400) level = "Advanced Competitive"
    else if (wilks >= 300) level = "Competitively Strong"
    else if (wilks >= 200) level = "Intermediate"
    else level = "Beginner/Novice"

    setResult({
      primaryMetric: { label: "Wilks Score", value: wilks, status: wilks >= 400 ? "good" : wilks >= 250 ? "normal" : "warning", description: `${level}` },
      metrics: [
        { label: "Wilks Score", value: wilks, status: "good" },
        { label: "Strength Level", value: level, status: "normal" },
        { label: "Bodyweight", value: w, unit: "kg", status: "normal" },
        { label: "Total Lifted", value: t, unit: "kg", status: "normal" },
        { label: "Wilks per kg total", value: r2(wilks / t), status: "normal" }
      ],
      recommendations: [
        { title: "Wilks Score Milestones", description: "200+ = Beginner. 300+ = Intermediate/Club competitor. 400+ = Nationally competitive. 500+ = Elite/International level.", priority: "high", category: "Standards" }
      ],
      detailedBreakdown: { "Gender": gender, "Bodyweight": `${w} kg`, "Total": `${t} kg`, "Wilks": wilks, "Level": level }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="wilks-score-calculator" title="Wilks Score Calculator"
      description="Calculate Wilks coefficient to compare powerlifting performance across different bodyweights. Used in powerlifting competitions."
      icon={Trophy} calculate={calculate} onClear={() => { setBw(80); setTotal(300); setResult(null) }}
      values={[bw, total, gender]} result={result}
      seoContent={<SeoContentGenerator title="Wilks Score Calculator" description="Calculate Wilks coefficient for powerlifting." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Bodyweight" val={bw} set={setBw} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Total Lifted (S+B+D)" val={total} set={setTotal} min={50} max={2000} step={2.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 9. Training Zone Calculator ─────────────────────────────────────────────
export function TrainingZoneCalculator() {
  const [age, setAge] = useState(30)
  const [rhr, setRhr] = useState(60)
  const [fitness, setFitness] = useState("average")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const mhr = 208 - 0.7 * clamp(age, 10, 90)
    const hrr = mhr - clamp(rhr, 30, 120)

    const zones = [
      { name: "Zone 1 – Active Recovery", low: 0.5, high: 0.6, benefit: "Recovery, fat oxidation, low impact" },
      { name: "Zone 2 – Endurance", low: 0.6, high: 0.7, benefit: "Aerobic base, fat metabolism, mitochondria" },
      { name: "Zone 3 – Tempo", low: 0.7, high: 0.8, benefit: "Improved aerobic efficiency, VO2 max" },
      { name: "Zone 4 – Threshold", low: 0.8, high: 0.9, benefit: "Lactate threshold, speed endurance" },
      { name: "Zone 5 – VO2 Max", low: 0.9, high: 1.0, benefit: "Maximum aerobic capacity, peak power" },
    ].map(z => ({
      ...z,
      minBpm: r0(hrr * z.low + rhr),
      maxBpm: z.high === 1 ? r0(mhr) : r0(hrr * z.high + rhr),
    }))

    setResult({
      primaryMetric: { label: "Max Heart Rate (Tanaka)", value: r0(mhr), unit: "bpm", status: "good", description: `HRR = ${r0(hrr)} bpm — 5 training zones calculated` },
      metrics: zones.map(z => ({
        label: z.name, value: `${z.minBpm}–${z.maxBpm}`, unit: "bpm", status: "normal" as const, description: z.benefit
      })),
      recommendations: [
        { title: "80/20 Training Distribution", description: `Elite endurance athletes spend 80% of training in Zones 1-2 (${r0(hrr * 0.5 + rhr)}–${r0(hrr * 0.7 + rhr)} bpm) and 20% in Zones 4-5 (${r0(hrr * 0.8 + rhr)}+ bpm). This balance maximizes adaptation while preventing burnout.`, priority: "high", category: "Training" },
        { title: "Zone 2 is Key", description: `Zone 2 (${r0(hrr * 0.6 + rhr)}–${r0(hrr * 0.7 + rhr)} bpm) is the foundation of aerobic fitness. You should be able to hold a conversation at this intensity.`, priority: "medium", category: "Aerobic Base" }
      ],
      detailedBreakdown: Object.fromEntries(zones.map(z => [z.name, `${z.minBpm}–${z.maxBpm} bpm`]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="training-zone-calculator" title="Training Zone Calculator"
      description="Calculate all 5 heart rate training zones using Karvonen method. Includes time distribution guidelines for optimal training."
      icon={TrendingUp} calculate={calculate} onClear={() => { setAge(30); setRhr(60); setResult(null) }}
      values={[age, rhr, fitness]} result={result}
      seoContent={<SeoContentGenerator title="Training Zone Calculator" description="Calculate optimal training zones." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <NumInput label="Resting Heart Rate" val={rhr} set={setRhr} min={30} max={120} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ─── 10. MET Calculator ────────────────────────────────────────────────────────
export function METCalculator() {
  const [met, setMet] = useState(8.0)
  const [weight, setWeight] = useState(70)
  const [duration, setDuration] = useState(45)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const m = clamp(met, 0.5, 25)
    const w = clamp(weight, 20, 300)
    const d = clamp(duration, 1, 480)

    const kcal = r0(m * w * (d / 60))
    const vo2 = r1(m * 3.5)          // mL/kg/min
    const perMin = r1(m * w / 60 * 1000 / 1000)

    const intensity = m < 3 ? "Light" : m < 6 ? "Moderate" : m < 9 ? "Vigorous" : "Very Vigorous"

    setResult({
      primaryMetric: { label: "Calories Burned", value: kcal, unit: "kcal", status: "good", description: `MET ${m} × ${w} kg × ${d} min → ${intensity} intensity` },
      metrics: [
        { label: "MET Value", value: m, status: "normal" },
        { label: "Intensity Category", value: intensity, status: m >= 6 ? "good" : "normal" },
        { label: "Calories Burned", value: kcal, unit: "kcal", status: "good" },
        { label: "VO2 Equivalent", value: vo2, unit: "mL/kg/min", status: "normal" },
        { label: "Calories per Minute", value: r1(kcal / d), unit: "kcal/min", status: "normal" },
        { label: "Calories per Hour", value: r0(kcal * 60 / d), unit: "kcal/hr", status: "normal" }
      ],
      recommendations: [
        { title: "MET Reference Points", description: "< 3 METs = Light (walking slowly, light yoga). 3-6 METs = Moderate (brisk walking, cycling). > 6 METs = Vigorous (running, HIIT). Your activity at MET " + m + " is classified as " + intensity + ".", priority: "high", category: "Activity Guide" },
        { title: "Weekly Activity Goal", description: `WHO recommends 150-300 min/week of moderate (3-6 MET) or 75-150 min/week of vigorous (>6 MET) activity. ${intensity === "Vigorous" || intensity === "Very Vigorous" ? "Your activity counts double toward this goal!" : ""}`, priority: "medium", category: "Health Guidelines" }
      ],
      detailedBreakdown: { "MET": m, "Weight": `${w} kg`, "Duration": `${d} min`, "Intensity": intensity, "Calories": `${kcal} kcal` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="met-calculator" title="MET Calculator"
      description="Calculate calories burned from MET (Metabolic Equivalent of Task) value. Covers any physical activity with its MET rating."
      icon={Zap} calculate={calculate} onClear={() => { setMet(8.0); setWeight(70); setDuration(45); setResult(null) }}
      values={[met, weight, duration]} result={result}
      seoContent={<SeoContentGenerator title="MET Calculator" description="Estimate MET value and activity intensity." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="MET Value" val={met} set={setMet} min={0.5} max={25} step={0.1} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
        </div>
      </div>} />
  )
}

// ─── 11. Strength Volume Calculator ──────────────────────────────────────────
export function StrengthVolumeCalculator() {
  const [sets, setSets] = useState(4)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(Math.round(sets), 1, 50)
    const r = clamp(Math.round(reps), 1, 100)
    const w = clamp(weight, 1, 1000)
    const vol = s * r * w
    const orm = r1(w * (1 + r / 30))
    const inol = r1(s * r / (100 - (r / orm * 100)))

    setResult({
      primaryMetric: { label: "Total Volume", value: vol.toLocaleString(), unit: "kg", status: "good", description: `${s} sets × ${r} reps × ${w} kg` },
      metrics: [
        { label: "Total Volume", value: vol.toLocaleString(), unit: "kg", status: "good" },
        { label: "Sets", value: s, status: "normal" },
        { label: "Reps per Set", value: r, status: "normal" },
        { label: "Weight per Rep", value: w, unit: "kg", status: "normal" },
        { label: "Estimated 1RM", value: orm, unit: "kg", status: "normal" },
        { label: "Volume per Set", value: r * w, unit: "kg", status: "normal" },
        { label: "INOL (Intensity-Volume)", value: inol > 0 ? inol : "n/a", status: "normal" }
      ],
      recommendations: [
        { title: "Volume Targets", description: `Hypertrophy: 10-20 sets/muscle/week. Strength: 4-8 heavy sets/muscle/week. Your current session volume is ${vol.toLocaleString()} kg.`, priority: "high", category: "Programming" },
        { title: "Track Volume Over Time", description: "Progressive overload through increasing volume (more sets/reps) or intensity (heavier weight) is the key driver of muscle growth.", priority: "medium", category: "Progress" }
      ],
      detailedBreakdown: { "Sets × Reps × Weight": `${s} × ${r} × ${w}`, "Total Volume": `${vol.toLocaleString()} kg`, "Estimated 1RM": `${orm} kg` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="strength-volume-calculator" title="Strength Training Volume Calculator"
      description="Calculate total training volume (sets × reps × load) for any exercise. Monitor weekly volume for progressive overload."
      icon={Dumbbell} calculate={calculate} onClear={() => { setSets(4); setReps(10); setWeight(80); setResult(null) }}
      values={[sets, reps, weight]} result={result}
      seoContent={<SeoContentGenerator title="Strength Training Volume Calculator" description="Calculate total training volume." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Sets" val={sets} set={setSets} min={1} max={50} />
          <NumInput label="Reps" val={reps} set={setReps} min={1} max={100} />
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={1} max={1000} step={0.5} />
        </div>
      </div>} />
  )
}

// ─── 12. Power-to-Weight Ratio ────────────────────────────────────────────────
export function PowerToWeightCalculator() {
  const [power, setPower] = useState(250)
  const [weight, setWeight] = useState(70)
  const [sport, setSport] = useState("cycling")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const p = clamp(power, 50, 3000)
    const w = clamp(weight, 20, 300)
    const ratio = r2(p / w)

    let level = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (sport === "cycling") {
      if (ratio >= 6.5) { level = "World Tour Pro"; status = "good" }
      else if (ratio >= 5.5) { level = "Pro/Elite Amateur"; status = "good" }
      else if (ratio >= 4.5) { level = "Cat 1-2/Advanced"; status = "good" }
      else if (ratio >= 3.5) { level = "Cat 3-4/Intermediate"; status = "normal" }
      else if (ratio >= 2.5) { level = "Cat 5/Beginner"; status = "normal" }
      else { level = "Recreational"; status = "warning" }
    }

    setResult({
      primaryMetric: { label: "Power-to-Weight Ratio", value: ratio, unit: "W/kg", status, description: `${level} cyclist` },
      metrics: [
        { label: "Power Output", value: p, unit: "W", status: "good" },
        { label: "Body Weight", value: w, unit: "kg", status: "normal" },
        { label: "W/kg Ratio", value: ratio, unit: "W/kg", status },
        { label: "Level", value: level, status },
        { label: "For 4.0 W/kg, need", value: r0(w * 4.0), unit: "W", status: "normal" },
        { label: "For 5.0 W/kg, need", value: r0(w * 5.0), unit: "W", status: "normal" },
      ],
      recommendations: [
        { title: "Improving W/kg", description: `You can improve W/kg by raising FTP (watts) through structured training, or reducing body weight while maintaining power. A 1 kg weight loss = +${r2(ratio - p / (w - 1))} W/kg gain at current power.`, priority: "high", category: "Performance" }
      ],
      detailedBreakdown: { "Power": `${p} W`, "Weight": `${w} kg`, "W/kg": ratio, "Level": level }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="power-to-weight" title="Power-to-Weight Ratio Calculator"
      description="Calculate cycling power-to-weight ratio (W/kg) and compare against competitive cycling performance levels."
      icon={Bike} calculate={calculate} onClear={() => { setPower(250); setWeight(70); setResult(null) }}
      values={[power, weight, sport]} result={result}
      seoContent={<SeoContentGenerator title="Power-to-Weight Ratio" description="Calculate cycling power-to-weight." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Power (FTP/Avg)" val={power} set={setPower} min={50} max={3000} suffix="W" />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 13. FTP Calculator ────────────────────────────────────────────────────────
export function FTPCalculator() {
  const [test20min, setTest20Min] = useState(280)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const p = clamp(test20min, 50, 2000)
    const w = clamp(weight, 20, 300)
    const ftp = r0(p * 0.95)
    const wkg = r2(ftp / w)

    const zones = [
      { name: "Zone 1 – Active Recovery", low: 0, high: 0.55 },
      { name: "Zone 2 – Endurance", low: 0.55, high: 0.75 },
      { name: "Zone 3 – Tempo", low: 0.75, high: 0.90 },
      { name: "Zone 4 – Lactate Threshold", low: 0.90, high: 1.05 },
      { name: "Zone 5 – VO2 Max", low: 1.05, high: 1.20 },
      { name: "Zone 6 – Anaerobic", low: 1.20, high: 1.50 },
      { name: "Zone 7 – Neuromuscular", low: 1.50, high: 999 },
    ].map(z => ({ ...z, minW: r0(ftp * z.low), maxW: z.high === 999 ? r0(ftp * 2) : r0(ftp * z.high) }))

    setResult({
      primaryMetric: { label: "FTP", value: ftp, unit: "W", status: "good", description: `${wkg} W/kg – based on 95% of 20-min test` },
      metrics: [
        { label: "FTP (Functional Threshold Power)", value: ftp, unit: "W", status: "good" },
        { label: "20-min Test Power", value: p, unit: "W", status: "normal" },
        { label: "W/kg", value: wkg, unit: "W/kg", status: "normal" },
        ...zones.map(z => ({ label: z.name, value: `${z.minW}–${z.maxW}`, unit: "W", status: "normal" as const }))
      ],
      recommendations: [
        { title: "FTP Testing Protocol", description: "After a 20-min all-out effort, FTP = 95% of average power. Retest every 6-8 weeks. FTP typically improves 5-15% in the first training season.", priority: "high", category: "Testing" }
      ],
      detailedBreakdown: { "20-min Power": `${p} W`, "FTP (95%)": `${ftp} W`, "W/kg": wkg }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ftp-calculator" title="FTP Calculator"
      description="Calculate Functional Threshold Power (FTP) from 20-minute test power. Includes all 7 power training zones."
      icon={Bike} calculate={calculate} onClear={() => { setTest20Min(280); setWeight(70); setResult(null) }}
      values={[test20min, weight]} result={result}
      seoContent={<SeoContentGenerator title="FTP Calculator" description="Estimate Functional Threshold Power." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="20-Minute Average Power" val={test20min} set={setTest20Min} min={50} max={2000} suffix="W" />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
      </div>} />
  )
}

// ─── 14. MAF 180 Calculator ────────────────────────────────────────────────────
export function MAF180Calculator() {
  const [age, setAge] = useState(30)
  const [category, setCategory] = useState("healthy")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    let base = 180 - a
    if (category === "recovering") base -= 10
    else if (category === "minor_injury") base -= 5
    else if (category === "2years") base += 5

    const mafHr = base

    setResult({
      primaryMetric: { label: "MAF 180 Heart Rate", value: mafHr, unit: "bpm", status: "good", description: "Maximum Aerobic Function training heart rate" },
      metrics: [
        { label: "MAF Heart Rate", value: mafHr, unit: "bpm", status: "good" },
        { label: "Age Adjustment Base", value: 180 - a, unit: "bpm", status: "normal" },
        { label: "Category Adjustment", value: category === "recovering" ? "-10" : category === "minor_injury" ? "-5" : category === "2years" ? "+5" : "0", status: "normal" },
        { label: "Upper Limit Zone", value: mafHr, unit: "bpm", status: "good" },
        { label: "Lower Limit (10 below)", value: mafHr - 10, unit: "bpm", status: "normal" },
      ],
      recommendations: [
        { title: "Training at MAF HR", description: `Stay below ${mafHr} bpm for all aerobic training. Initially you'll feel slow, but you'll gradually get faster at the same heart rate as aerobic efficiency improves.`, priority: "high", category: "MAF Method" },
        { title: "MAF Test", description: "Run 1 mile at MAF HR every 3-4 weeks. If your pace improves, your aerobic system is developing. Track your MAF pace as a progress indicator.", priority: "medium", category: "Testing" }
      ],
      detailedBreakdown: { "Age": a, "Base (180 - age)": 180 - a, "Category": category, "MAF HR": `${mafHr} bpm`, "Training Range": `${mafHr - 10}–${mafHr} bpm` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="maf-180" title="MAF 180 Calculator"
      description="Calculate your Maximum Aerobic Function heart rate using Dr. Phil Maffetone's 180-minus-age formula."
      icon={Heart} calculate={calculate} onClear={() => { setAge(30); setCategory("healthy"); setResult(null) }}
      values={[age, category]} result={result}
      seoContent={<SeoContentGenerator title="MAF 180 Calculator" description="Calculate max aerobic heart rate." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
        <SelectInput label="Health Category" val={category} set={setCategory} options={[{ value: "recovering", label: "Recovering from major illness/surgery (-10)" }, { value: "minor_injury", label: "Minor injury or inconsistent training (-5)" }, { value: "healthy", label: "Healthy, training consistently (0)" }, { value: "2years", label: "Training consistently 2+ years with improvement (+5)" }]} />
      </div>} />
  )
}

// ─── 15. Cooper Test Calculator ──────────────────────────────────────────────
export function CooperTestCalculator() {
  const [distance, setDistance] = useState(2400)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distance, 500, 5000)
    const vo2max = r1((d - 504.9) / 44.73)

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    const male = gender === "male"
    if (male) {
      if (d >= 2800) { category = "Excellent"; status = "good" }
      else if (d >= 2400) { category = "Good"; status = "good" }
      else if (d >= 2200) { category = "Above Average"; status = "normal" }
      else if (d >= 1600) { category = "Average"; status = "normal" }
      else { category = "Below Average"; status = "warning" }
    } else {
      if (d >= 2600) { category = "Excellent"; status = "good" }
      else if (d >= 2200) { category = "Good"; status = "good" }
      else if (d >= 1900) { category = "Above Average"; status = "normal" }
      else if (d >= 1500) { category = "Average"; status = "normal" }
      else { category = "Below Average"; status = "warning" }
    }

    setResult({
      primaryMetric: { label: "Cooper Test VO2 Max", value: vo2max, unit: "mL/kg/min", status, description: `${category} aerobic fitness for your age/gender` },
      metrics: [
        { label: "Distance Covered", value: d, unit: "m", status: "good" },
        { label: "VO2 Max Estimate", value: vo2max, unit: "mL/kg/min", status },
        { label: "Fitness Category", value: category, status },
        { label: "Average Pace", value: `${r1(12 / d * 1000)} min/km`, status: "normal" }
      ],
      recommendations: [
        { title: "Cooper Test Interpretation", description: `${d}m in 12 minutes gives an estimated VO2 max of ${vo2max} mL/kg/min — classified as "${category}". The world record 12-minute run is approximately 3,900m for men.`, priority: "high", category: "Results" },
        { title: "Training to Improve", description: `To improve by one category, target ${category === "Below Average" ? "1800" : category === "Average" ? "2300" : category === "Above Average" ? "2500" : "3000"}m in 12 minutes. Interval training 2×/week will help most.`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Distance": `${d} m`, "VO2 Max": `${vo2max} mL/kg/min`, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cooper-test-calculator" title="Cooper Test Calculator"
      description="Calculate VO2 max estimate from the Cooper 12-minute run/walk test. Includes fitness category by age and gender."
      icon={Activity} calculate={calculate} onClear={() => { setDistance(2400); setAge(30); setGender("male"); setResult(null) }}
      values={[distance, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Cooper Test Calculator" description="Estimate fitness level from Cooper 12-min run test." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Distance Covered in 12 Minutes" val={distance} set={setDistance} min={500} max={5000} step={10} suffix="m" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={80} suffix="yr" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// small import for Trophy icon
import { Trophy } from "lucide-react"
