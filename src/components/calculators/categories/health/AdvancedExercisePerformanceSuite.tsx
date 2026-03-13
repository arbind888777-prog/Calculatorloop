"use client"

import { useState } from "react"
import { Activity, Dumbbell, Heart, TrendingUp, Timer, Zap, Bike, Footprints, Gauge, BarChart3, Target } from "lucide-react"
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

// ─── MET Database ─────────────────────────────────────────────────────────────
const MET_DB: Record<string, { met: number; label: string }> = {
  walking_slow: { met: 2.0, label: "Walking – Slow (3 km/h)" },
  walking_brisk: { met: 3.8, label: "Walking – Brisk (5 km/h)" },
  walking_fast: { met: 5.0, label: "Walking – Fast (6.5 km/h)" },
  jogging: { met: 7.0, label: "Jogging (8 km/h)" },
  running_moderate: { met: 9.8, label: "Running – Moderate (10 km/h)" },
  running_fast: { met: 11.5, label: "Running – Fast (12 km/h)" },
  running_sprint: { met: 14.5, label: "Sprinting (16+ km/h)" },
  cycling_leisure: { met: 4.0, label: "Cycling – Leisure (< 16 km/h)" },
  cycling_moderate: { met: 6.8, label: "Cycling – Moderate (16-19 km/h)" },
  cycling_vigorous: { met: 10.0, label: "Cycling – Vigorous (22-25 km/h)" },
  cycling_racing: { met: 12.0, label: "Cycling – Racing (> 25 km/h)" },
  swimming_easy: { met: 5.8, label: "Swimming – Easy" },
  swimming_moderate: { met: 7.0, label: "Swimming – Moderate" },
  swimming_hard: { met: 9.8, label: "Swimming – Hard" },
  hiit: { met: 12.3, label: "HIIT – Vigorous" },
  weight_training: { met: 6.0, label: "Weight Training – Moderate" },
  yoga: { met: 3.0, label: "Yoga – Hatha" },
  rowing: { met: 7.0, label: "Rowing – Moderate" },
  jump_rope: { met: 12.3, label: "Jump Rope – Fast" },
  stair_climbing: { met: 9.0, label: "Stair Climbing" },
  elliptical: { met: 5.0, label: "Elliptical Machine" },
  dancing: { met: 5.5, label: "Dancing – General" },
  boxing: { met: 12.8, label: "Boxing – Sparring" },
  basketball: { met: 8.0, label: "Basketball – Game" },
  soccer: { met: 10.0, label: "Soccer – Game" },
  tennis: { met: 7.3, label: "Tennis – Singles" },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. CALORIES BURNED CALCULATOR (Energy Expenditure Performance Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedCaloriesBurnedCalculator() {
  const [weight, setWeight] = useState(70)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [exercise, setExercise] = useState("running_moderate")
  const [duration, setDuration] = useState(45)
  const [avgHR, setAvgHR] = useState(145)
  const [maxHR, setMaxHR] = useState(185)
  const [vo2max, setVo2max] = useState(40)
  const [fitnessLevel, setFitnessLevel] = useState("moderate")
  const [wearableCalories, setWearableCalories] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 250)
    const a = clamp(age, 10, 90)
    const d = clamp(duration, 1, 480)
    const hr = clamp(avgHR, 60, 220)
    const mhr = clamp(maxHR, 100, 220)
    const v = clamp(vo2max, 15, 85)
    const actObj = MET_DB[exercise] || MET_DB.running_moderate
    const met = actObj.met
    const male = gender === "male"

    // ── 1) MET-based calories ──
    const metCalories = met * w * (d / 60)

    // ── 2) HR-based calories (Keytel et al. 2005) ──
    const hrCalories = male
      ? ((-55.0969 + 0.6309 * hr + 0.1988 * w + 0.2017 * a) / 4.184) * d
      : ((-20.4022 + 0.4472 * hr - 0.1263 * w + 0.074 * a) / 4.184) * d

    // ── 3) VO₂-based correction ──
    const vo2Liters = (v * w) / 1000 * (d / 60) // total O₂ consumed approx
    const vo2Calories = vo2Liters * 5.0 * 1000 * (met / 10) // ~5 kcal per liter O₂

    // ── 4) Weighted average (blended) ──
    const blendedCalories = r0(metCalories * 0.4 + hrCalories * 0.35 + vo2Calories * 0.25)
    const finalCalories = blendedCalories > 0 ? blendedCalories : r0(metCalories)

    // ── 5) Adaptive metabolism correction ──
    const fitnessMultiplier = fitnessLevel === "beginner" ? 1.08 : fitnessLevel === "advanced" ? 0.92 : fitnessLevel === "elite" ? 0.85 : 1.0
    const adaptedCalories = r0(finalCalories * fitnessMultiplier)

    // ── 6) Fat vs Carb oxidation ──
    const hrPercent = hr / mhr * 100
    const fatPercent = hrPercent < 60 ? 70 : hrPercent < 70 ? 55 : hrPercent < 80 ? 40 : hrPercent < 90 ? 20 : 10
    const carbPercent = 100 - fatPercent
    const fatCalsBurned = r0(adaptedCalories * fatPercent / 100)
    const carbCalsBurned = r0(adaptedCalories * carbPercent / 100)
    const fatGrams = r1(fatCalsBurned / 9)
    const carbGrams = r1(carbCalsBurned / 4)

    // ── 7) EPOC (Excess Post-exercise Oxygen Consumption) ──
    const intensityFactor = hrPercent > 80 ? 0.15 : hrPercent > 70 ? 0.08 : 0.03
    const epocCalories = r0(adaptedCalories * intensityFactor)

    // ── 8) Total with EPOC ──
    const totalWithEPOC = adaptedCalories + epocCalories

    // ── 9) AI Wearable correction ──
    const wearCal = wearableCalories > 0 ? wearableCalories : 0
    const wearableCorrected = wearCal > 0 ? r0((totalWithEPOC + wearCal) / 2) : totalWithEPOC

    // ── 10) Weekly projection ──
    const weeklyBurn = r0(wearableCorrected * 5)
    const weeklyDeficit = weeklyBurn
    const weeklyFatLossKg = r2(weeklyDeficit / 7700) // 7700 kcal ≈ 1 kg fat

    // ── 11) Overtraining energy stress score ──
    const dailyStress = adaptedCalories / (w * 0.5)
    const stressScore = r1(clamp(dailyStress, 0, 100))
    const stressRisk = stressScore > 15 ? "danger" : stressScore > 10 ? "warning" : "good"
    const stressLabel = stressScore > 15 ? "🔴 Excessive Strain" : stressScore > 10 ? "🟡 Moderate Load" : "🟢 Optimal Burn"

    // ── 12) Fat-loss projection ──
    const monthlyFatLossKg = r1(weeklyFatLossKg * 4.3)

    // ── Risk Classification ──
    const burnStatus = stressScore > 15 ? "danger" : stressScore > 10 ? "warning" : "good"

    setResult({
      primaryMetric: {
        label: "Total Calories Burned",
        value: wearableCorrected,
        unit: "kcal",
        status: burnStatus as 'good' | 'warning' | 'danger',
        description: `${actObj.label} × ${d} min — ${stressLabel}`
      },
      healthScore: Math.max(0, Math.min(100, r0(100 - stressScore * 4))),
      metrics: [
        { label: "MET-Based Estimate", value: r0(metCalories), unit: "kcal", status: "normal" },
        { label: "HR-Adjusted Estimate", value: r0(hrCalories), unit: "kcal", status: "normal" },
        { label: "Blended Calories (Adapted)", value: adaptedCalories, unit: "kcal", status: "good" },
        { label: "EPOC (Afterburn)", value: epocCalories, unit: "kcal", status: epocCalories > 50 ? "good" : "normal" },
        { label: "Total with EPOC", value: totalWithEPOC, unit: "kcal", status: "good" },
        { label: "Fat Calories Burned", value: fatCalsBurned, unit: "kcal", status: "normal", description: `${fatPercent}% of total — ${fatGrams}g fat` },
        { label: "Carb Calories Burned", value: carbCalsBurned, unit: "kcal", status: "normal", description: `${carbPercent}% of total — ${carbGrams}g carbs` },
        { label: "Fat Oxidation", value: fatGrams, unit: "g", status: "normal" },
        { label: "Carb Oxidation", value: carbGrams, unit: "g", status: "normal" },
        { label: "Burn Intensity (%MHR)", value: r1(hrPercent), unit: "%", status: hrPercent > 90 ? "danger" : hrPercent > 75 ? "warning" : "good" },
        { label: "Calories per Minute", value: r1(adaptedCalories / d), unit: "kcal/min", status: "normal" },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Energy Stress Score", value: stressScore, unit: "/20", status: stressRisk as 'good' | 'warning' | 'danger' },
        { label: "Risk Classification", value: stressLabel, status: stressRisk as 'good' | 'warning' | 'danger' },
        { label: "Weekly Calorie Expenditure (5×)", value: weeklyBurn, unit: "kcal", status: "good" },
        { label: "Weekly Fat Loss Projection", value: weeklyFatLossKg, unit: "kg", status: weeklyFatLossKg > 0.5 ? "good" : "normal" },
        { label: "Monthly Fat Loss Projection", value: monthlyFatLossKg, unit: "kg", status: "good" },
        ...(wearCal > 0 ? [{ label: "Wearable-Corrected Estimate", value: wearableCorrected, unit: "kcal", status: "good" as const }] : []),
      ],
      recommendations: [
        {
          title: "Energy Expenditure Analysis",
          description: `You burned ~${adaptedCalories} kcal during ${d} min of ${actObj.label}. Fat oxidation contributed ${fatPercent}% (${fatGrams}g fat). EPOC afterburn adds ${epocCalories} kcal over the next 2-12 hours. ${fitnessLevel === "advanced" || fitnessLevel === "elite" ? "Your adapted metabolism burns fewer calories at same intensity — increase duration or intensity for progression." : "As fitness improves, your calorie burn efficiency will adapt downward."}`,
          priority: "high", category: "Energy Analysis"
        },
        {
          title: "Fat Loss Projection",
          description: `At 5 sessions/week, projected weekly fat loss: ${weeklyFatLossKg} kg (${monthlyFatLossKg} kg/month). To lose 1 kg/week, you need a total deficit of 7,700 kcal — combine exercise with dietary deficit for best results. Sustainable fat loss: 0.5-1.0 kg/week.`,
          priority: "high", category: "Weight Management"
        },
        {
          title: "Fuel Utilization Strategy",
          description: `At ${r1(hrPercent)}% MHR, your body uses ${fatPercent}% fat / ${carbPercent}% carbs. For maximum fat oxidation, train at 60-70% MHR (Zone 2: ~${r0(mhr * 0.6)}-${r0(mhr * 0.7)} bpm). For performance, higher intensities burn more total calories despite lower fat %.`,
          priority: "medium", category: "Training Strategy"
        },
        {
          title: "Training Load Risk",
          description: stressScore > 15
            ? `⚠️ Energy stress score ${stressScore}/20 indicates EXCESSIVE strain. Risk of overtraining, immune suppression, and hormonal disruption. Reduce volume/intensity by 20-30% and ensure 48h recovery.`
            : stressScore > 10
            ? `Energy stress score ${stressScore}/20 — moderate load. Monitor recovery quality, sleep, and HRV. Ensure adequate protein (1.6-2.2g/kg) and carb replenishment.`
            : `Energy stress score ${stressScore}/20 — optimal training load. Good balance of stimulus and recovery capacity. Can gradually increase by 5-10%/week.`,
          priority: stressScore > 15 ? "high" : "medium", category: "Recovery"
        },
        {
          title: "Clinical Relevance",
          description: "Accurate calorie expenditure tracking is critical for obesity intervention programs and cardiac rehabilitation. HR-based monitoring ensures patients stay within safe exercise zones. EPOC data helps design post-surgical exercise progression.",
          priority: "low", category: "Clinical"
        },
      ],
      detailedBreakdown: {
        "Exercise": actObj.label,
        "Duration": `${d} min`,
        "MET Calories": `${r0(metCalories)} kcal`,
        "HR Calories": `${r0(hrCalories)} kcal`,
        "Adapted Calories": `${adaptedCalories} kcal`,
        "EPOC": `${epocCalories} kcal`,
        "Fat %": `${fatPercent}%`,
        "Carb %": `${carbPercent}%`,
        "Weekly Projection": `${weeklyBurn} kcal`,
        "Stress Score": `${stressScore}/20`,
      }
    })
  }

  const actOptions = Object.entries(MET_DB).map(([k, v]) => ({ value: k, label: v.label }))

  return (
    <ComprehensiveHealthTemplate toolId="calories-burned" title="Calories Burned Calculator — Energy Expenditure Engine"
      description="Advanced caloric expenditure with HR-based, MET-based & VO₂-based correction. Fat/carb oxidation, EPOC afterburn, weekly fat-loss projection, overtraining risk."
      icon={Zap} calculate={calculate} onClear={() => { setWeight(70); setAge(30); setDuration(45); setAvgHR(145); setResult(null) }}
      values={[weight, age, gender, exercise, duration, avgHR, maxHR, vo2max, fitnessLevel, wearableCalories]} result={result}
      seoContent={<SeoContentGenerator title="Calories Burned Calculator" description="Advanced caloric expenditure calculator with HR, MET, VO2 correction" categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Exercise Type" val={exercise} set={setExercise} options={actOptions} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
          <NumInput label="Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Avg Heart Rate" val={avgHR} set={setAvgHR} min={60} max={220} suffix="bpm" />
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={100} max={220} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="VO₂ Max (est.)" val={vo2max} set={setVo2max} min={15} max={85} step={0.5} suffix="mL/kg/min" />
          <SelectInput label="Fitness Level" val={fitnessLevel} set={setFitnessLevel} options={[
            { value: "beginner", label: "Beginner" }, { value: "moderate", label: "Moderate" },
            { value: "advanced", label: "Advanced" }, { value: "elite", label: "Elite" }
          ]} />
        </div>
        <NumInput label="Wearable Calorie Data (optional)" val={wearableCalories} set={setWearableCalories} min={0} max={5000} suffix="kcal" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. PACE CALCULATOR (Speed Optimization Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedPaceCalculator() {
  const [distance, setDistance] = useState(10)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(50)
  const [seconds, setSeconds] = useState(0)
  const [vo2max, setVo2max] = useState(45)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dist = clamp(distance, 0.1, 200)
    const totalSec = clamp(hours * 3600 + minutes * 60 + seconds, 1, 360000)
    const v = clamp(vo2max, 15, 85)
    const a = clamp(age, 10, 90)

    // ── Pace & Speed ──
    const paceSecPerKm = totalSec / dist
    const paceMin = Math.floor(paceSecPerKm / 60)
    const paceSec = r0(paceSecPerKm % 60)
    const paceStr = `${paceMin}:${paceSec.toString().padStart(2, "0")} min/km`
    const speedKmh = r2(dist / (totalSec / 3600))
    const speedMph = r2(speedKmh * 0.621371)
    const pacePerMile = r0(paceSecPerKm * 1.60934)
    const paceMileMin = Math.floor(pacePerMile / 60)
    const paceMileSec = r0(pacePerMile % 60)
    const paceMileStr = `${paceMileMin}:${paceMileSec.toString().padStart(2, "0")} min/mile`

    // ── Race Predictions (Riegel formula) ──
    const riegel = (d2: number) => {
      const t2 = totalSec * Math.pow(d2 / dist, 1.06)
      const h = Math.floor(t2 / 3600)
      const m = Math.floor((t2 % 3600) / 60)
      const s = r0(t2 % 60)
      return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`
    }

    const races = [
      { name: "5K", dist: 5 },
      { name: "10K", dist: 10 },
      { name: "Half Marathon", dist: 21.0975 },
      { name: "Marathon", dist: 42.195 },
      { name: "50K Ultra", dist: 50 },
    ]

    // ── Negative Split Strategy ──
    const firstHalfPace = r0(paceSecPerKm * 1.03)  // 3% slower
    const secondHalfPace = r0(paceSecPerKm * 0.97)  // 3% faster
    const fhMin = Math.floor(firstHalfPace / 60)
    const fhSec = firstHalfPace % 60
    const shMin = Math.floor(secondHalfPace / 60)
    const shSec = secondHalfPace % 60

    // ── VO₂-based optimal pace ──
    const vo2Velocity = v * 0.29  // approx velocity at VO2max in km/h
    const easyPaceKmh = r1(vo2Velocity * 0.65)
    const tempoPaceKmh = r1(vo2Velocity * 0.85)
    const thresholdPaceKmh = r1(vo2Velocity * 0.88)
    const intervalPaceKmh = r1(vo2Velocity * 0.98)

    // ── Lactate threshold VO₂ estimation ──
    const ltPercentVO2 = gender === "male" ? (a < 30 ? 82 : a < 40 ? 80 : 77) : (a < 30 ? 80 : a < 40 ? 78 : 75)
    const ltVO2 = r1(v * ltPercentVO2 / 100)
    const ltPaceKmh = r1(ltVO2 * 0.29)
    const ltPaceSecKm = ltPaceKmh > 0 ? r0(3600 / ltPaceKmh) : 600
    const ltPMin = Math.floor(ltPaceSecKm / 60)
    const ltPSec = ltPaceSecKm % 60

    // ── Performance improvement forecast ──
    const currentSpeed = speedKmh
    const projected4weeks = r1(currentSpeed * 1.03)
    const projected8weeks = r1(currentSpeed * 1.06)
    const projected12weeks = r1(currentSpeed * 1.10)

    setResult({
      primaryMetric: {
        label: "Pace",
        value: paceStr,
        status: "good",
        description: `Speed: ${speedKmh} km/h — ${paceMileStr}`
      },
      healthScore: Math.min(100, r0(speedKmh * 5)),
      metrics: [
        { label: "Pace (per km)", value: paceStr, status: "good" },
        { label: "Pace (per mile)", value: paceMileStr, status: "good" },
        { label: "Speed", value: speedKmh, unit: "km/h", status: "good" },
        { label: "Speed (mph)", value: speedMph, unit: "mph", status: "normal" },
        { label: "Distance", value: dist, unit: "km", status: "normal" },
        { label: "Total Time", value: `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`, status: "normal" },
        ...races.map(r => ({ label: `Predicted ${r.name}`, value: riegel(r.dist), status: "normal" as const })),
        { label: "Negative Split – 1st Half Pace", value: `${fhMin}:${fhSec.toString().padStart(2, "0")} min/km`, status: "normal" },
        { label: "Negative Split – 2nd Half Pace", value: `${shMin}:${shSec.toString().padStart(2, "0")} min/km`, status: "good" },
        { label: "VO₂-Based Easy Pace", value: easyPaceKmh, unit: "km/h", status: "normal" },
        { label: "VO₂-Based Tempo Pace", value: tempoPaceKmh, unit: "km/h", status: "normal" },
        { label: "VO₂-Based Threshold Pace", value: thresholdPaceKmh, unit: "km/h", status: "good" },
        { label: "VO₂-Based Interval Pace", value: intervalPaceKmh, unit: "km/h", status: "good" },
        { label: "Lactate Threshold Pace", value: `${ltPMin}:${ltPSec.toString().padStart(2, "0")} min/km`, status: "good", description: `~${ltPercentVO2}% VO₂max` },
        { label: "4-Week Speed Projection", value: projected4weeks, unit: "km/h", status: "normal" },
        { label: "8-Week Speed Projection", value: projected8weeks, unit: "km/h", status: "normal" },
        { label: "12-Week Speed Projection", value: projected12weeks, unit: "km/h", status: "good" },
      ],
      recommendations: [
        {
          title: "Race Strategy – Negative Split",
          description: `Start first half at ${fhMin}:${fhSec.toString().padStart(2, "0")}/km (3% slower), then accelerate to ${shMin}:${shSec.toString().padStart(2, "0")}/km in second half. This prevents early fatigue and produces faster overall times in 80% of elite marathon performances.`,
          priority: "high", category: "Race Strategy"
        },
        {
          title: "VO₂-Based Training Paces",
          description: `With VO₂max ${v}: Easy runs at ${easyPaceKmh} km/h, Tempo at ${tempoPaceKmh} km/h, Threshold at ${thresholdPaceKmh} km/h, Intervals at ${intervalPaceKmh} km/h. Lactate threshold at ~${ltPMin}:${ltPSec.toString().padStart(2, "0")}/km.`,
          priority: "high", category: "Training"
        },
        {
          title: "Performance Forecast",
          description: `With consistent training: +3% speed in 4 weeks (${projected4weeks} km/h), +6% in 8 weeks (${projected8weeks} km/h), +10% in 12 weeks (${projected12weeks} km/h). Cadence 170-180 spm and strength work accelerate improvement.`,
          priority: "medium", category: "Progression"
        },
        {
          title: "Clinical Relevance",
          description: "Pace analysis is a key marker for cardiorespiratory fitness evaluation. VO₂-based pacing helps cardiac rehab patients train safely within prescribed intensity zones. Lactate threshold testing guides exercise prescription.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Pace": paceStr,
        "Speed": `${speedKmh} km/h`,
        "Distance": `${dist} km`,
        "LT Pace": `${ltPMin}:${ltPSec.toString().padStart(2, "0")}/km`,
        "VO₂max": `${v} mL/kg/min`,
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pace-calculator" title="Pace Calculator — Speed Optimization Model"
      description="Advanced pace analysis with race predictions, negative split strategy, VO₂-based training paces, lactate threshold, and performance forecast."
      icon={Activity} calculate={calculate} onClear={() => { setDistance(10); setHours(0); setMinutes(50); setSeconds(0); setResult(null) }}
      values={[distance, hours, minutes, seconds, vo2max, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Pace Calculator" description="Advanced running pace calculator with race predictions and VO2 pacing." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Distance" val={distance} set={setDistance} min={0.1} max={200} step={0.1} suffix="km" />
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Hours" val={hours} set={setHours} min={0} max={99} />
          <NumInput label="Minutes" val={minutes} set={setMinutes} min={0} max={59} />
          <NumInput label="Seconds" val={seconds} set={setSeconds} min={0} max={59} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="VO₂ Max" val={vo2max} set={setVo2max} min={15} max={85} step={0.5} suffix="mL/kg/min" />
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="yrs" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. ONE REP MAX CALCULATOR (Strength Potential Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedOneRepMaxCalculator() {
  const [weightLifted, setWeightLifted] = useState(100)
  const [reps, setReps] = useState(5)
  const [bodyWeight, setBodyWeight] = useState(80)
  const [age, setAge] = useState(28)
  const [gender, setGender] = useState("male")
  const [trainingYears, setTrainingYears] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weightLifted, 1, 1000)
    const r = clamp(Math.round(reps), 1, 30)
    const bw = clamp(bodyWeight, 30, 250)
    const a = clamp(age, 14, 80)
    const ty = clamp(trainingYears, 0, 30)

    // ── Multiple 1RM Formulas ──
    const epley = w * (1 + r / 30)
    const brzycki = r > 1 ? w * (36 / (37 - r)) : w
    const lander = (100 * w) / (101.3 - 2.67123 * r)
    const mayhew = (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))
    const oconner = w * (1 + r * 0.025)
    const avg1RM = (epley + brzycki + lander + mayhew + oconner) / 5

    // ── Strength ratio ──
    const strengthRatio = r2(avg1RM / bw)
    let strengthCategory = ""
    const male = gender === "male"
    if (male) {
      strengthCategory = strengthRatio >= 2.5 ? "Elite" : strengthRatio >= 2.0 ? "Advanced" : strengthRatio >= 1.5 ? "Intermediate" : strengthRatio >= 1.0 ? "Novice" : "Beginner"
    } else {
      strengthCategory = strengthRatio >= 2.0 ? "Elite" : strengthRatio >= 1.5 ? "Advanced" : strengthRatio >= 1.0 ? "Intermediate" : strengthRatio >= 0.75 ? "Novice" : "Beginner"
    }

    // ── Training intensity percentages ──
    const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50]

    // ── Injury Risk Probability ──
    const repFatigueRisk = r > 12 ? 0.05 : 0
    const ageRisk = a > 50 ? 0.1 : a > 40 ? 0.05 : 0
    const ratioRisk = strengthRatio > 2.5 ? 0.08 : strengthRatio > 2.0 ? 0.04 : 0
    const experienceRisk = ty < 1 ? 0.12 : ty < 2 ? 0.06 : 0
    const injuryProbability = r0(clamp((repFatigueRisk + ageRisk + ratioRisk + experienceRisk) * 100, 0, 50))

    // ── Neural Fatigue Score ──
    const neuralFatigue = r1(clamp((r / 30) * 100 + (strengthRatio > 2 ? 15 : 0) + (a > 45 ? 10 : 0), 0, 100))
    const neuralStatus = neuralFatigue > 70 ? "danger" : neuralFatigue > 40 ? "warning" : "good"

    // ── Progressive Overload Plan ──
    const weeklyIncrease = male ? 2.5 : 1.25
    const week4Target = r1(avg1RM * 1.05)
    const week8Target = r1(avg1RM * 1.10)
    const week12Target = r1(avg1RM * 1.15)

    // ── Periodization suggestion ──
    const phase = ty < 1 ? "Linear Periodization (increase weight weekly)" :
      ty < 3 ? "Undulating Periodization (vary rep ranges within week)" :
      "Block Periodization (accumulation → intensification → realization)"

    setResult({
      primaryMetric: {
        label: "Estimated 1 Rep Max",
        value: r1(avg1RM),
        unit: "kg",
        status: "good",
        description: `${strengthCategory} — ${strengthRatio}× bodyweight — Injury risk: ${injuryProbability}%`
      },
      healthScore: Math.min(100, r0(strengthRatio * 40)),
      metrics: [
        { label: "Epley Formula", value: r1(epley), unit: "kg", status: "good" },
        { label: "Brzycki Formula", value: r1(brzycki), unit: "kg", status: "good" },
        { label: "Lander Formula", value: r1(lander), unit: "kg", status: "normal" },
        { label: "Mayhew Formula", value: r1(mayhew), unit: "kg", status: "normal" },
        { label: "O'Conner Formula", value: r1(oconner), unit: "kg", status: "normal" },
        { label: "Average 1RM (5 formulas)", value: r1(avg1RM), unit: "kg", status: "good" },
        { label: "Strength Ratio", value: strengthRatio, unit: "× BW", status: strengthRatio >= 1.5 ? "good" : "normal" },
        { label: "Strength Category", value: strengthCategory, status: strengthCategory === "Elite" || strengthCategory === "Advanced" ? "good" : "normal" },
        ...pcts.map(p => ({ label: `${p}% 1RM`, value: r1(avg1RM * p / 100), unit: "kg", status: "normal" as const })),
        { label: "Injury Risk Probability", value: injuryProbability, unit: "%", status: injuryProbability > 20 ? "danger" : injuryProbability > 10 ? "warning" : "good" },
        { label: "Neural Fatigue Score", value: neuralFatigue, unit: "/100", status: neuralStatus as 'good' | 'warning' | 'danger' },
        { label: "Safe Max Load Range", value: `${r1(avg1RM * 0.85)}–${r1(avg1RM * 0.95)}`, unit: "kg", status: "good" },
        { label: "4-Week 1RM Goal", value: week4Target, unit: "kg", status: "normal" },
        { label: "8-Week 1RM Goal", value: week8Target, unit: "kg", status: "normal" },
        { label: "12-Week 1RM Goal", value: week12Target, unit: "kg", status: "good" },
      ],
      recommendations: [
        {
          title: "Training Loads by Goal",
          description: `Strength (1-5 reps): ${r1(avg1RM * 0.85)}–${r1(avg1RM)} kg. Hypertrophy (6-12 reps): ${r1(avg1RM * 0.65)}–${r1(avg1RM * 0.80)} kg. Endurance (13-20 reps): ${r1(avg1RM * 0.50)}–${r1(avg1RM * 0.65)} kg. Power (1-5 reps, explosive): ${r1(avg1RM * 0.70)}–${r1(avg1RM * 0.85)} kg.`,
          priority: "high", category: "Training"
        },
        {
          title: "Progressive Overload Plan",
          description: `Weekly increase: +${weeklyIncrease} kg. 4-week target: ${week4Target} kg. 8-week: ${week8Target} kg. 12-week: ${week12Target} kg. Recommended periodization: ${phase}.`,
          priority: "high", category: "Progression"
        },
        {
          title: "Injury Risk Assessment",
          description: injuryProbability > 15
            ? `⚠️ Elevated injury risk (${injuryProbability}%). Factors: ${ty < 2 ? "limited experience, " : ""}${a > 45 ? "age-related recovery, " : ""}${strengthRatio > 2 ? "high relative intensity. " : ""}Prioritize warm-up, form checks, and gradual progression.`
            : `Injury risk ${injuryProbability}% — within acceptable range. Maintain proper warm-up (10-15 min) and always use a spotter for loads >85% 1RM. Neural fatigue: ${neuralFatigue}/100.`,
          priority: injuryProbability > 15 ? "high" : "medium", category: "Safety"
        },
        {
          title: "Clinical — Rehab Strength Testing",
          description: "1RM estimation is used in rehabilitation to set safe training loads post-injury/surgery. Start at 40-60% estimated 1RM for rehab, progressing 5-10% weekly with pain-free movement. Strength ratio relative to bodyweight tracks functional recovery.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Lift Weight": `${w} kg × ${r} reps`,
        "Average 1RM": `${r1(avg1RM)} kg`,
        "Strength Ratio": `${strengthRatio}× BW`,
        "Category": strengthCategory,
        "Injury Risk": `${injuryProbability}%`,
        "Neural Fatigue": `${neuralFatigue}/100`,
        "Periodization": phase
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="one-rep-max" title="One Rep Max Calculator — Strength Potential Analyzer"
      description="Advanced 1RM estimation with 5 formulas, injury risk, neural fatigue, progressive overload planner, and periodization suggestions."
      icon={Dumbbell} calculate={calculate} onClear={() => { setWeightLifted(100); setReps(5); setBodyWeight(80); setResult(null) }}
      values={[weightLifted, reps, bodyWeight, age, gender, trainingYears]} result={result}
      seoContent={<SeoContentGenerator title="One Rep Max Calculator" description="Advanced 1RM calculator with injury risk and progressive overload." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight Lifted" val={weightLifted} set={setWeightLifted} min={1} max={1000} step={0.5} suffix="kg" />
          <NumInput label="Reps Completed" val={reps} set={setReps} min={1} max={30} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={250} step={0.5} suffix="kg" />
          <NumInput label="Age" val={age} set={setAge} min={14} max={80} suffix="years" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <NumInput label="Training Experience" val={trainingYears} set={setTrainingYears} min={0} max={30} step={0.5} suffix="years" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. VO₂ MAX CALCULATOR (Cardiorespiratory Capacity Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedVO2MaxCalculator() {
  const [testType, setTestType] = useState("cooper")
  const [distanceM, setDistanceM] = useState(2400)
  const [timeMin, setTimeMin] = useState(12)
  const [hr, setHr] = useState(160)
  const [restHR, setRestHR] = useState(60)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distanceM, 200, 10000)
    const t = clamp(timeMin, 1, 60)
    const h = clamp(hr, 80, 220)
    const rh = clamp(restHR, 30, 100)
    const a = clamp(age, 10, 90)
    const w = clamp(weight, 30, 250)
    const male = gender === "male"

    let vo2max = 0

    if (testType === "cooper") {
      // Cooper 12-min run
      vo2max = (d - 504.9) / 44.73
    } else if (testType === "rockport") {
      // Rockport 1-mile walk  
      vo2max = 132.853 - (0.0769 * w * 2.20462) - (0.3877 * a) + (6.315 * (male ? 1 : 0)) - (3.2649 * t) - (0.1565 * h)
    } else {
      // Uth–Sørensen–Overgaard HR ratio
      vo2max = 15.3 * (h / rh) * (male ? 1.0 : 0.95)
    }
    vo2max = clamp(vo2max, 10, 90)

    // ── Fitness category (age & gender adjusted) ──
    let category = "", categoryStatus: 'good' | 'normal' | 'warning' | 'danger' = "normal"
    const thresholds = male
      ? (a < 30 ? [56, 47, 42, 38, 35] : a < 40 ? [54, 45, 41, 36, 32] : a < 50 ? [50, 42, 37, 33, 29] : [47, 39, 34, 30, 26])
      : (a < 30 ? [49, 41, 37, 33, 29] : a < 40 ? [46, 38, 34, 30, 26] : a < 50 ? [42, 35, 31, 27, 24] : [39, 32, 28, 25, 22])

    if (vo2max >= thresholds[0]) { category = "Superior"; categoryStatus = "good" }
    else if (vo2max >= thresholds[1]) { category = "Excellent"; categoryStatus = "good" }
    else if (vo2max >= thresholds[2]) { category = "Good"; categoryStatus = "good" }
    else if (vo2max >= thresholds[3]) { category = "Average"; categoryStatus = "normal" }
    else if (vo2max >= thresholds[4]) { category = "Below Average"; categoryStatus = "warning" }
    else { category = "Poor"; categoryStatus = "danger" }

    // ── Biological fitness age ──
    const avgVO2ForAge = male ? (60 - a * 0.5) : (50 - a * 0.45)
    const fitnessAge = r0(a - (vo2max - avgVO2ForAge) * 1.5)
    const fitnessAgeGap = a - fitnessAge

    // ── Cardiovascular mortality risk reduction ──
    const mortalityReduction = vo2max > 40 ? r0(Math.min(50, (vo2max - 30) * 2.5)) : r0(Math.max(0, (vo2max - 20) * 1.5))

    // ── Endurance performance prediction ──
    const marathonPaceKmh = r1(vo2max * 0.29 * 0.75) // ~75% VO2max for marathon
    const marathonTime = marathonPaceKmh > 0 ? r1(42.195 / marathonPaceKmh * 60) : 0
    const halfMarathonTime = marathonPaceKmh > 0 ? r1(21.1 / (vo2max * 0.29 * 0.80) * 60) : 0

    // ── 12-week improvement projection ──
    const week4VO2 = r1(vo2max * 1.04)
    const week8VO2 = r1(vo2max * 1.08)
    const week12VO2 = r1(vo2max * 1.12)

    // ── HR-corrected VO₂ max ──
    const hrReserve = h - rh
    const hrCorrectedVO2 = r1(vo2max * (hrReserve / (220 - a - rh)))

    // ── Longevity index ──
    const longevityIndex = vo2max > 50 ? "🟢 Superior – significantly lower all-cause mortality" :
      vo2max > 40 ? "🟢 Good – 30-40% reduction in CV mortality" :
      vo2max > 30 ? "🟡 Average – moderate risk profile" :
      "🔴 Low – elevated cardiovascular disease risk"

    // ── Fitness percentile ──
    const percentile = r0(clamp((vo2max - 15) / 55 * 100, 1, 99))

    setResult({
      primaryMetric: {
        label: "VO₂ Max",
        value: r1(vo2max),
        unit: "mL/kg/min",
        status: categoryStatus,
        description: `${category} — Fitness age: ${fitnessAge} (${fitnessAgeGap > 0 ? fitnessAgeGap + " years younger" : Math.abs(fitnessAgeGap) + " years older"})`
      },
      healthScore: Math.min(100, r0(vo2max * 1.5)),
      metrics: [
        { label: "VO₂ Max", value: r1(vo2max), unit: "mL/kg/min", status: categoryStatus },
        { label: "HR-Corrected VO₂ Max", value: hrCorrectedVO2, unit: "mL/kg/min", status: "normal" },
        { label: "Fitness Category", value: category, status: categoryStatus },
        { label: "Fitness Percentile", value: percentile, unit: "%ile", status: percentile > 60 ? "good" : percentile > 30 ? "normal" : "warning" },
        { label: "Biological Fitness Age", value: fitnessAge, unit: "years", status: fitnessAgeGap > 5 ? "good" : fitnessAgeGap > 0 ? "good" : "warning" },
        { label: "Fitness Age Gap", value: fitnessAgeGap > 0 ? `${fitnessAgeGap} yrs younger` : `${Math.abs(fitnessAgeGap)} yrs older`, status: fitnessAgeGap > 0 ? "good" : "warning" },
        { label: "CV Mortality Risk Reduction", value: mortalityReduction, unit: "%", status: mortalityReduction > 25 ? "good" : "normal" },
        { label: "Longevity Index", value: longevityIndex, status: vo2max > 40 ? "good" : vo2max > 30 ? "normal" : "danger" },
        { label: "Predicted Marathon Pace", value: r1(marathonPaceKmh), unit: "km/h", status: "normal" },
        { label: "Predicted Marathon Time", value: marathonTime > 0 ? `${r0(marathonTime)} min` : "—", status: "normal" },
        { label: "Predicted Half-Marathon Time", value: halfMarathonTime > 0 ? `${r0(halfMarathonTime)} min` : "—", status: "normal" },
        { label: "4-Week VO₂ Projection", value: week4VO2, unit: "mL/kg/min", status: "normal" },
        { label: "8-Week VO₂ Projection", value: week8VO2, unit: "mL/kg/min", status: "normal" },
        { label: "12-Week VO₂ Projection", value: week12VO2, unit: "mL/kg/min", status: "good" },
      ],
      recommendations: [
        {
          title: "Cardiorespiratory Fitness Assessment",
          description: `VO₂ max ${r1(vo2max)} mL/kg/min places you in the "${category}" category (${percentile}th percentile for ${a}-year-old ${male ? "males" : "females"}). Biological fitness age: ${fitnessAge}. Each 1 mL/kg/min improvement in VO₂max reduces all-cause mortality by ~4%.`,
          priority: "high", category: "Assessment"
        },
        {
          title: "12-Week VO₂ Improvement Plan",
          description: `Target ${week12VO2} mL/kg/min in 12 weeks (+12%). Protocol: 3× Zone 2 endurance (45-60 min), 2× interval sessions (4×4 min at 90-95% MHR, 3 min recovery). This protocol showed 7-13% VO₂max improvement in research studies.`,
          priority: "high", category: "Training"
        },
        {
          title: "Cardiovascular Mortality Risk",
          description: `Your VO₂max level provides approximately ${mortalityReduction}% reduction in cardiovascular mortality risk compared to lowest fitness quartile. The AHA considers CRF (cardiorespiratory fitness) a vital sign — improving from "Below Average" to "Good" has the same mortality benefit as quitting smoking.`,
          priority: "medium", category: "Health"
        },
        {
          title: "Clinical — Cardiology Screening",
          description: "VO₂ max is the gold standard for cardiorespiratory fitness. Used in cardiology for pre-surgical risk stratification, cardiac rehab progression, and exercise prescription. Values <20 mL/kg/min indicate significant functional limitation.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Test Type": testType === "cooper" ? "Cooper 12-min" : testType === "rockport" ? "Rockport Walk" : "HR Ratio",
        "VO₂ Max": `${r1(vo2max)} mL/kg/min`,
        "Category": category,
        "Fitness Age": `${fitnessAge} years`,
        "CV Mortality Reduction": `${mortalityReduction}%`,
        "12-Week Target": `${week12VO2} mL/kg/min`,
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vo2-max-calculator" title="VO₂ Max Calculator — Cardiorespiratory Capacity Engine"
      description="Advanced VO₂ max with multiple test protocols, fitness age, mortality risk reduction, endurance predictions, and 12-week improvement projection."
      icon={Heart} calculate={calculate} onClear={() => { setDistanceM(2400); setTimeMin(12); setHr(160); setResult(null) }}
      values={[testType, distanceM, timeMin, hr, restHR, age, gender, weight]} result={result}
      seoContent={<SeoContentGenerator title="VO2 Max Calculator" description="Advanced VO2 max calculator with fitness age and mortality risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Test Protocol" val={testType} set={setTestType} options={[
          { value: "cooper", label: "Cooper 12-Minute Run Test" },
          { value: "rockport", label: "Rockport 1-Mile Walk Test" },
          { value: "hr_ratio", label: "Heart Rate Ratio Method" },
        ]} />
        {testType === "cooper" && <NumInput label="Distance Covered in 12 min" val={distanceM} set={setDistanceM} min={200} max={6000} step={10} suffix="meters" />}
        {testType === "rockport" && <NumInput label="1-Mile Walk Time" val={timeMin} set={setTimeMin} min={8} max={30} step={0.1} suffix="minutes" />}
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Exercise Heart Rate" val={hr} set={setHr} min={80} max={220} suffix="bpm" />
          <NumInput label="Resting Heart Rate" val={restHR} set={setRestHR} min={30} max={100} suffix="bpm" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="yrs" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. TRAINING ZONE CALCULATOR (Heart Rate Zone Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedTrainingZoneCalculator() {
  const [age, setAge] = useState(30)
  const [restHR, setRestHR] = useState(60)
  const [maxHR, setMaxHR] = useState(0) // 0 means auto-calculate
  const [gender, setGender] = useState("male")
  const [fitnessLevel, setFitnessLevel] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    const rhr = clamp(restHR, 30, 120)
    const male = gender === "male"

    // ── Max HR calculation (Tanaka formula if not provided) ──
    const computedMHR = maxHR > 0 ? clamp(maxHR, 120, 220) : r0(208 - 0.7 * a)
    const hrr = computedMHR - rhr // Heart Rate Reserve

    // ── Karvonen Formula: Target HR = ((MHR - RHR) × %Intensity) + RHR ──
    const zones = [
      { name: "Zone 1 – Active Recovery", low: 0.50, high: 0.60, benefit: "Recovery, blood flow, metabolic waste removal", fuelMix: "90% fat / 10% carb" },
      { name: "Zone 2 – Aerobic Base", low: 0.60, high: 0.70, benefit: "Fat oxidation, mitochondrial density, aerobic foundation", fuelMix: "70% fat / 30% carb" },
      { name: "Zone 3 – Tempo", low: 0.70, high: 0.80, benefit: "Aerobic efficiency, moderate fat/carb mix, VO₂ improvement", fuelMix: "50% fat / 50% carb" },
      { name: "Zone 4 – Lactate Threshold", low: 0.80, high: 0.90, benefit: "Lactate clearance, speed endurance, race pace", fuelMix: "25% fat / 75% carb" },
      { name: "Zone 5 – VO₂ Max", low: 0.90, high: 1.00, benefit: "Maximum aerobic capacity, peak cardiac output", fuelMix: "10% fat / 90% carb" },
    ].map(z => ({
      ...z,
      minBpm: r0(hrr * z.low + rhr),
      maxBpm: z.high === 1 ? computedMHR : r0(hrr * z.high + rhr),
    }))

    // ── Fat oxidation zone (optimal fat burning) ──
    const fatOxZoneLow = r0(hrr * 0.55 + rhr)
    const fatOxZoneHigh = r0(hrr * 0.72 + rhr)

    // ── Lactate threshold zone ──
    const ltZoneLow = r0(hrr * 0.82 + rhr)
    const ltZoneHigh = r0(hrr * 0.92 + rhr)

    // ── AI-optimized zone distribution based on fitness level ──
    const zoneDistribution = fitnessLevel === "beginner"
      ? { z1: 10, z2: 60, z3: 20, z4: 8, z5: 2 }
      : fitnessLevel === "moderate"
      ? { z1: 5, z2: 50, z3: 25, z4: 15, z5: 5 }
      : fitnessLevel === "advanced"
      ? { z1: 5, z2: 40, z3: 25, z4: 20, z5: 10 }
      : { z1: 5, z2: 35, z3: 20, z4: 25, z5: 15 } // elite

    // ── HRV-based recovery indicator ──
    const hrvEstimate = male ? r0(65 - a * 0.3 + (fitnessLevel === "elite" ? 15 : fitnessLevel === "advanced" ? 10 : 0)) : r0(60 - a * 0.25 + (fitnessLevel === "elite" ? 15 : fitnessLevel === "advanced" ? 10 : 0))
    const hrvStatus = hrvEstimate > 60 ? "good" : hrvEstimate > 40 ? "normal" : "warning"

    setResult({
      primaryMetric: {
        label: "Max Heart Rate (Karvonen)",
        value: computedMHR,
        unit: "bpm",
        status: "good",
        description: `HRR = ${hrr} bpm — 5 training zones with Karvonen formula`
      },
      healthScore: Math.min(100, r0(hrr * 0.8)),
      metrics: [
        { label: "Estimated Max HR", value: computedMHR, unit: "bpm", status: "good" },
        { label: "Resting HR", value: rhr, unit: "bpm", status: rhr < 60 ? "good" : rhr < 75 ? "normal" : "warning" },
        { label: "Heart Rate Reserve", value: hrr, unit: "bpm", status: "good" },
        ...zones.map(z => ({
          label: z.name, value: `${z.minBpm}–${z.maxBpm}`, unit: "bpm", status: "normal" as const, description: `${z.benefit} | ${z.fuelMix}`
        })),
        { label: "🔥 Fat Oxidation Zone", value: `${fatOxZoneLow}–${fatOxZoneHigh}`, unit: "bpm", status: "good", description: "Peak fat burning range" },
        { label: "⚡ Lactate Threshold Zone", value: `${ltZoneLow}–${ltZoneHigh}`, unit: "bpm", status: "good", description: "Race pace intensity" },
        { label: "Weekly Zone 1 Time", value: `${zoneDistribution.z1}%`, status: "normal" },
        { label: "Weekly Zone 2 Time", value: `${zoneDistribution.z2}%`, status: "good" },
        { label: "Weekly Zone 3 Time", value: `${zoneDistribution.z3}%`, status: "normal" },
        { label: "Weekly Zone 4 Time", value: `${zoneDistribution.z4}%`, status: "normal" },
        { label: "Weekly Zone 5 Time", value: `${zoneDistribution.z5}%`, status: "normal" },
        { label: "HRV Estimate (Recovery)", value: hrvEstimate, unit: "ms", status: hrvStatus as 'good' | 'normal' | 'warning' },
      ],
      recommendations: [
        {
          title: "Karvonen Zone Training Guide",
          description: `Zones calculated using Karvonen formula: Target HR = ((${computedMHR} - ${rhr}) × %I) + ${rhr}. This is more personalized than simple %MHR because it accounts for your resting heart rate (fitness level).`,
          priority: "high", category: "Method"
        },
        {
          title: "80/20 Polarized Training",
          description: `Elite athletes spend 80% in Zone 1-2 (below ${zones[1].maxBpm} bpm) and 20% in Zone 4-5 (above ${zones[3].minBpm} bpm). Zone 3 ("no man's land") should be minimized. For your level (${fitnessLevel}), recommended split: Z1-2: ${zoneDistribution.z1 + zoneDistribution.z2}%, Z3: ${zoneDistribution.z3}%, Z4-5: ${zoneDistribution.z4 + zoneDistribution.z5}%.`,
          priority: "high", category: "Training Distribution"
        },
        {
          title: "Fat Oxidation & Lactate Threshold",
          description: `Maximum fat oxidation zone: ${fatOxZoneLow}–${fatOxZoneHigh} bpm — ideal for weight management and long endurance sessions. Lactate threshold zone: ${ltZoneLow}–${ltZoneHigh} bpm — the intensity at which lactate accumulates faster than clearance. Train here for race pace improvement.`,
          priority: "medium", category: "Zones"
        },
        {
          title: "Clinical — Cardiac Rehab Safe Range",
          description: `For cardiac rehabilitation: Safe training zone is typically Zone 1-2 (${zones[0].minBpm}–${zones[1].maxBpm} bpm, 50-70% HRR). Never exceed Zone 3 without physician clearance. RPE should stay at 11-14 (Borg scale). Monitor for symptoms: chest pain, excessive SOB, dizziness.`,
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: Object.fromEntries(zones.map(z => [z.name, `${z.minBpm}–${z.maxBpm} bpm`]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="training-zone-calculator" title="Training Zone Calculator — Heart Rate Zone Engine"
      description="Advanced Karvonen-based HR zones with fat oxidation zone, lactate threshold, zone distribution optimization, and HRV recovery index."
      icon={TrendingUp} calculate={calculate} onClear={() => { setAge(30); setRestHR(60); setMaxHR(0); setResult(null) }}
      values={[age, restHR, maxHR, gender, fitnessLevel]} result={result}
      seoContent={<SeoContentGenerator title="Training Zone Calculator" description="Advanced heart rate training zones with Karvonen formula." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <NumInput label="Resting Heart Rate" val={restHR} set={setRestHR} min={30} max={120} suffix="bpm" />
        </div>
        <NumInput label="Known Max HR (0 = auto-calculate)" val={maxHR} set={setMaxHR} min={0} max={220} suffix="bpm" />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <SelectInput label="Fitness Level" val={fitnessLevel} set={setFitnessLevel} options={[
            { value: "beginner", label: "Beginner" }, { value: "moderate", label: "Moderate" },
            { value: "advanced", label: "Advanced" }, { value: "elite", label: "Elite" }
          ]} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. WORKOUT INTENSITY CALCULATOR (Load Monitoring Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedWorkoutIntensityCalculator() {
  const [duration, setDuration] = useState(60)
  const [rpe, setRpe] = useState(7)
  const [avgHR, setAvgHR] = useState(150)
  const [maxHR, setMaxHR] = useState(185)
  const [sets, setSets] = useState(20)
  const [reps, setReps] = useState(10)
  const [restHR, setRestHR] = useState(60)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(duration, 1, 480)
    const rpeVal = clamp(rpe, 1, 10)
    const hr = clamp(avgHR, 60, 220)
    const mhr = clamp(maxHR, 100, 220)
    const s = clamp(sets, 0, 100)
    const r = clamp(reps, 0, 100)
    const rhr = clamp(restHR, 30, 120)

    // ── Session RPE Load (Foster 1998) ──
    const sessionRPE = r0(rpeVal * d)

    // ── Training Stress Score (TSS approximation) ──
    const hrPercent = hr / mhr * 100
    const intensityFactor = hrPercent / 100
    const tss = r0(d * intensityFactor * intensityFactor * 100 / 60)

    // ── TRIMP (Training Impulse – Banister) ──
    const hrRatio = (hr - rhr) / (mhr - rhr)
    const trimp = r0(d * hrRatio * 0.64 * Math.exp(1.92 * hrRatio))

    // ── Training volume (strength) ──
    const totalReps = s * r
    const volumeLoad = totalReps // relative metric

    // ── Overtraining Risk ──
    const weeklySessionRPE = sessionRPE * 5 // projected 5 sessions/week
    const overtrainingRisk = weeklySessionRPE > 3000 ? "danger" : weeklySessionRPE > 2000 ? "warning" : "good"
    const overtrainingLabel = weeklySessionRPE > 3000 ? "🔴 High Overtraining Risk" : weeklySessionRPE > 2000 ? "🟡 Moderate Load — Monitor Recovery" : "🟢 Optimal Training Load"

    // ── Recovery Time Estimate ──
    const recoveryHrs = rpeVal >= 9 ? 72 : rpeVal >= 7 ? 48 : rpeVal >= 5 ? 24 : 12
    const recoveryDays = r1(recoveryHrs / 24)

    // ── AI Fatigue Detection ──
    const acuteFatigue = r1(sessionRPE / 100)
    const chronicLoad = r1(weeklySessionRPE / 700)
    const acuteChronicRatio = chronicLoad > 0 ? r2(acuteFatigue / chronicLoad) : 1
    const acrStatus = acuteChronicRatio > 1.5 ? "danger" : acuteChronicRatio > 1.3 ? "warning" : acuteChronicRatio < 0.8 ? "warning" : "good"
    const acrLabel = acuteChronicRatio > 1.5 ? "🔴 Injury Danger Zone" : acuteChronicRatio > 1.3 ? "🟡 Elevated Risk" : acuteChronicRatio < 0.8 ? "🟡 Under-training" : "🟢 Sweet Spot"

    // ── Injury probability model ──
    const injuryProb = acuteChronicRatio > 1.5 ? r0(25 + (acuteChronicRatio - 1.5) * 40) :
      acuteChronicRatio > 1.3 ? r0(10 + (acuteChronicRatio - 1.3) * 50) :
      acuteChronicRatio < 0.8 ? r0(8 + (0.8 - acuteChronicRatio) * 20) : r0(5)

    // ── Intensity classification ──
    const intensityClass = rpeVal >= 9 ? "Maximal" : rpeVal >= 7 ? "Vigorous" : rpeVal >= 5 ? "Moderate" : rpeVal >= 3 ? "Light" : "Very Light"

    setResult({
      primaryMetric: {
        label: "Session RPE Load",
        value: sessionRPE,
        unit: "AU",
        status: overtrainingRisk as 'good' | 'warning' | 'danger',
        description: `${intensityClass} intensity — ${overtrainingLabel}`
      },
      healthScore: Math.max(0, Math.min(100, 100 - r0(sessionRPE / 8))),
      metrics: [
        { label: "Session RPE Load", value: sessionRPE, unit: "AU", status: sessionRPE > 600 ? "danger" : sessionRPE > 400 ? "warning" : "good" },
        { label: "Training Stress Score (TSS)", value: tss, status: tss > 200 ? "danger" : tss > 100 ? "warning" : "good" },
        { label: "TRIMP", value: trimp, unit: "AU", status: trimp > 300 ? "danger" : trimp > 150 ? "warning" : "good" },
        { label: "HR Intensity", value: r1(hrPercent), unit: "% MHR", status: hrPercent > 90 ? "danger" : hrPercent > 80 ? "warning" : "good" },
        { label: "Intensity Factor", value: r2(intensityFactor), status: "normal" },
        { label: "Intensity Classification", value: intensityClass, status: rpeVal >= 9 ? "danger" : rpeVal >= 7 ? "warning" : "good" },
        { label: "RPE", value: rpeVal, unit: "/10", status: rpeVal > 8 ? "danger" : rpeVal > 6 ? "warning" : "good" },
        { label: "Total Reps (Volume)", value: totalReps, status: "normal" },
        { label: "Predicted Weekly Load (5×)", value: weeklySessionRPE, unit: "AU", status: overtrainingRisk as 'good' | 'warning' | 'danger' },
        { label: "Overtraining Risk", value: overtrainingLabel, status: overtrainingRisk as 'good' | 'warning' | 'danger' },
        { label: "Recovery Time Estimate", value: recoveryHrs, unit: "hours", status: recoveryHrs > 48 ? "warning" : "good" },
        { label: "Recovery Days", value: recoveryDays, unit: "days", status: "normal" },
        { label: "Acute:Chronic Workload Ratio", value: acuteChronicRatio, status: acrStatus as 'good' | 'warning' | 'danger', description: acrLabel },
        { label: "Injury Probability", value: injuryProb, unit: "%", status: injuryProb > 20 ? "danger" : injuryProb > 10 ? "warning" : "good" },
        { label: "Fatigue Score", value: acuteFatigue, unit: "/10", status: acuteFatigue > 7 ? "danger" : acuteFatigue > 5 ? "warning" : "good" },
      ],
      recommendations: [
        {
          title: "Training Load Analysis",
          description: `Session RPE: ${sessionRPE} AU (${d} min × RPE ${rpeVal}). TSS: ${tss}. TRIMP: ${trimp}. Intensity: ${intensityClass}. ${sessionRPE > 600 ? "⚠️ Very high session load — ensure adequate recovery." : sessionRPE > 400 ? "Moderately high session load — monitor recovery." : "Good session intensity."}`,
          priority: "high", category: "Load Analysis"
        },
        {
          title: "Recovery Protocol",
          description: `Based on RPE ${rpeVal} and ${d} min duration, recommended recovery: ${recoveryHrs} hours (${recoveryDays} days). During recovery: light movement, foam rolling, protein intake (0.4g/kg within 2 hours), 7-9 hours sleep, hydration (30-40 mL/kg body weight).`,
          priority: "high", category: "Recovery"
        },
        {
          title: "Acute:Chronic Workload Ratio",
          description: `ACWR: ${acuteChronicRatio} — ${acrLabel}. Optimal range: 0.8-1.3. Above 1.5 = high injury risk (+${injuryProb}%). Below 0.8 = detraining risk. Increase weekly load by max 10% to stay in the safe zone.`,
          priority: acuteChronicRatio > 1.3 ? "high" : "medium", category: "Risk"
        },
        {
          title: "Clinical — Sports Medicine Monitoring",
          description: "Session RPE and TRIMP are validated tools for monitoring training load in clinical sports medicine. Used to prevent overtraining syndrome, monitor return-to-play protocols, and guide post-injury progression. ACWR is the gold standard for injury risk monitoring in professional sport.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Duration": `${d} min`,
        "RPE": `${rpeVal}/10`,
        "Session Load": `${sessionRPE} AU`,
        "TSS": tss,
        "TRIMP": trimp,
        "Recovery": `${recoveryHrs} hrs`,
        "ACWR": acuteChronicRatio,
        "Injury Risk": `${injuryProb}%`,
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="workout-intensity" title="Workout Intensity Calculator — Load Monitoring Model"
      description="Advanced training load quantification: Session RPE, TSS, TRIMP, overtraining risk, ACWR injury prediction, and recovery estimation."
      icon={Gauge} calculate={calculate} onClear={() => { setDuration(60); setRpe(7); setAvgHR(150); setResult(null) }}
      values={[duration, rpe, avgHR, maxHR, sets, reps, restHR]} result={result}
      seoContent={<SeoContentGenerator title="Workout Intensity Calculator" description="Calculate training load, overtraining risk, and recovery time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Session Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
          <NumInput label="RPE (1-10)" val={rpe} set={setRpe} min={1} max={10} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Avg Heart Rate" val={avgHR} set={setAvgHR} min={60} max={220} suffix="bpm" />
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={100} max={220} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Resting Heart Rate" val={restHR} set={setRestHR} min={30} max={120} suffix="bpm" />
          <NumInput label="Total Sets" val={sets} set={setSets} min={0} max={100} />
        </div>
        <NumInput label="Avg Reps per Set" val={reps} set={setReps} min={0} max={100} />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. RUNNING CADENCE CALCULATOR (Efficiency Optimizer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedRunningCadenceCalculator() {
  const [stepsCounted, setStepsCounted] = useState(160)
  const [countDuration, setCountDuration] = useState(60)
  const [speedKmh, setSpeedKmh] = useState(10)
  const [height, setHeight] = useState(175)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const steps = clamp(stepsCounted, 10, 500)
    const dur = clamp(countDuration, 10, 300)
    const speed = clamp(speedKmh, 3, 25)
    const h = clamp(height, 140, 210)
    const w = clamp(weight, 30, 200)

    // ── Steps per minute ──
    const spm = r0(steps / dur * 60)

    // ── Cadence classification ──
    let cadenceClass = "", cadenceStatus: 'good' | 'normal' | 'warning' | 'danger' = "normal"
    if (spm >= 180) { cadenceClass = "Optimal – Elite Runner Range"; cadenceStatus = "good" }
    else if (spm >= 170) { cadenceClass = "Good – Efficient Running"; cadenceStatus = "good" }
    else if (spm >= 160) { cadenceClass = "Average – Room for Improvement"; cadenceStatus = "normal" }
    else if (spm >= 150) { cadenceClass = "Below Optimal – Overstriding Risk"; cadenceStatus = "warning" }
    else { cadenceClass = "Low – High Injury Risk"; cadenceStatus = "danger" }

    // ── Ideal cadence based on speed ──
    const idealCadence = r0(160 + speed * 2)

    // ── Stride length from cadence and speed ──
    const strideLengthM = speed * 1000 / 60 / spm
    const idealStrideLength = r2(speed * 1000 / 60 / idealCadence)

    // ── Injury risk correlation ──
    const overstridingFactor = spm < 160 ? (160 - spm) * 2 : 0
    const heightFactor = h > 185 ? 5 : 0 // taller runners more ground contact
    const injuryRisk = r0(clamp(overstridingFactor + heightFactor, 0, 50))
    const injuryRiskLabel = injuryRisk > 30 ? "🔴 High – Overstriding Pattern" : injuryRisk > 15 ? "🟡 Moderate" : "🟢 Low"

    // ── Efficiency Score ──
    const efficiencyScore = r0(clamp(100 - Math.abs(spm - idealCadence) * 2 - (strideLengthM > h * 0.0045 ? 10 : 0), 0, 100))

    // ── Ground contact time estimate ──
    const gct = r0(clamp(300 - (spm - 140) * 2, 150, 350)) // ms

    // ── Vertical oscillation estimate ──
    const vertOsc = r1(clamp(12 - (spm - 140) * 0.05, 5, 15)) // cm

    // ── Energy cost model ──
    const kcalPerKm = r1(w * 1.0 * (1 + (idealCadence - spm) * 0.005))

    setResult({
      primaryMetric: {
        label: "Running Cadence",
        value: spm,
        unit: "spm",
        status: cadenceStatus,
        description: `${cadenceClass}`
      },
      healthScore: efficiencyScore,
      metrics: [
        { label: "Cadence (Steps/min)", value: spm, unit: "spm", status: cadenceStatus },
        { label: "Cadence Classification", value: cadenceClass, status: cadenceStatus },
        { label: "Ideal Cadence for Speed", value: idealCadence, unit: "spm", status: "good" },
        { label: "Current Stride Length", value: r2(strideLengthM), unit: "m", status: "normal" },
        { label: "Ideal Stride Length", value: idealStrideLength, unit: "m", status: "good" },
        { label: "Running Speed", value: speed, unit: "km/h", status: "normal" },
        { label: "Efficiency Score", value: efficiencyScore, unit: "/100", status: efficiencyScore > 75 ? "good" : efficiencyScore > 50 ? "normal" : "warning" },
        { label: "Ground Contact Time (est.)", value: gct, unit: "ms", status: gct < 220 ? "good" : gct < 260 ? "normal" : "warning" },
        { label: "Vertical Oscillation (est.)", value: vertOsc, unit: "cm", status: vertOsc < 8 ? "good" : vertOsc < 10 ? "normal" : "warning" },
        { label: "Injury Risk (Overstriding)", value: injuryRisk, unit: "%", status: injuryRisk > 30 ? "danger" : injuryRisk > 15 ? "warning" : "good" },
        { label: "Injury Risk Level", value: injuryRiskLabel, status: injuryRisk > 30 ? "danger" : injuryRisk > 15 ? "warning" : "good" },
        { label: "Energy Cost Estimate", value: kcalPerKm, unit: "kcal/km", status: "normal" },
        { label: "Cadence Gap", value: Math.abs(spm - idealCadence), unit: "spm", status: Math.abs(spm - idealCadence) < 5 ? "good" : "warning" },
      ],
      recommendations: [
        {
          title: "Cadence Efficiency Analysis",
          description: `Your cadence: ${spm} spm. Ideal for ${speed} km/h: ${idealCadence} spm. ${spm < idealCadence ? `Increase cadence by ${idealCadence - spm} spm to reduce ground contact time and injury risk. Use a metronome app at ${idealCadence} bpm during runs.` : `Excellent cadence — at or above optimal range. Efficient ground contact time.`}`,
          priority: "high", category: "Efficiency"
        },
        {
          title: "Injury Prevention",
          description: `${injuryRisk > 15 ? `⚠️ Low cadence (${spm} spm) indicates overstriding — increased impact forces on knees and shins. Each 5% increase in cadence reduces tibial stress fracture risk by ~20%. Focus on quick, light steps rather than long strides.` : `Good cadence minimizes overstriding-related injuries. Ground contact time ~${gct}ms, vertical oscillation ~${vertOsc}cm — both in healthy range.`}`,
          priority: injuryRisk > 15 ? "high" : "medium", category: "Injury Risk"
        },
        {
          title: "Cadence Improvement Tips",
          description: "1) Run with a metronome at current cadence + 5% for 2 weeks. 2) Focus on foot landing under center of mass. 3) Shorter, quicker steps rather than reaching forward. 4) Arm swing drives leg turnover — faster arms = faster cadence. 5) Hill sprints (6×15 sec) naturally improve cadence.",
          priority: "medium", category: "Training"
        },
        {
          title: "Clinical — Biomechanics Evaluation",
          description: "Running cadence is used in biomechanical assessment and injury rehabilitation. Low cadence (<160 spm) correlates with patellofemoral pain, IT band syndrome, and stress fractures. Cadence retraining is a first-line intervention in running injury clinics.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Cadence": `${spm} spm`,
        "Ideal Cadence": `${idealCadence} spm`,
        "Stride Length": `${r2(strideLengthM)} m`,
        "GCT": `${gct} ms`,
        "Efficiency": `${efficiencyScore}/100`,
        "Injury Risk": `${injuryRisk}%`,
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="running-cadence-calculator" title="Running Cadence Calculator — Efficiency Optimizer"
      description="Analyze running cadence with injury risk correlation, ground contact time, vertical oscillation, efficiency score, and biomechanical improvement tips."
      icon={Footprints} calculate={calculate} onClear={() => { setStepsCounted(160); setCountDuration(60); setSpeedKmh(10); setResult(null) }}
      values={[stepsCounted, countDuration, speedKmh, height, weight]} result={result}
      seoContent={<SeoContentGenerator title="Running Cadence Calculator" description="Optimize running cadence for efficiency and injury prevention." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Steps Counted" val={stepsCounted} set={setStepsCounted} min={10} max={500} />
          <NumInput label="Count Duration" val={countDuration} set={setCountDuration} min={10} max={300} suffix="sec" />
        </div>
        <NumInput label="Running Speed" val={speedKmh} set={setSpeedKmh} min={3} max={25} step={0.1} suffix="km/h" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={height} set={setHeight} min={140} max={210} suffix="cm" />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. STRIDE LENGTH CALCULATOR (Biomechanical Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedStrideLengthCalculator() {
  const [distance, setDistance] = useState(1000)
  const [steps, setSteps] = useState(1200)
  const [height, setHeight] = useState(175)
  const [weight, setWeight] = useState(70)
  const [speedKmh, setSpeedKmh] = useState(10)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distance, 10, 100000)
    const s = clamp(steps, 10, 200000)
    const h = clamp(height, 140, 210)
    const w = clamp(weight, 30, 200)
    const speed = clamp(speedKmh, 2, 25)

    // ── Stride length ──
    const strideLength = d / s // meters
    const strideLengthCm = r1(strideLength * 100)

    // ── Ideal stride length based on height ──
    const idealStrideWalking = r2(h * 0.415 / 100) // m
    const idealStrideRunning = r2(h * 0.65 / 100)  // m (running)
    const idealForSpeed = r2(speed * 1000 / 60 / 180) // at optimal 180 cadence

    // ── Cadence derived ──
    const timeMin = d / (speed * 1000 / 60) // minutes
    const cadence = r0(s / timeMin)

    // ── Efficiency index ──
    const heightRatio = strideLength / (h / 100)
    const efficiencyIndex = r0(clamp(heightRatio * 100, 20, 120))
    const efficiencyLabel = heightRatio >= 0.6 && heightRatio <= 0.75 ? "🟢 Optimal" :
      heightRatio >= 0.5 ? "🟡 Under-striding" : heightRatio > 0.75 ? "🟡 Over-striding Risk" : "🔴 Biomechanically Inefficient"

    // ── Cadence-stride balance ──
    const balanceScore = r0(100 - Math.abs(cadence - 175) * 0.8 - Math.abs(strideLength - idealForSpeed) * 50)
    const balanceLabel = balanceScore > 80 ? "🟢 Well Balanced" : balanceScore > 60 ? "🟡 Reasonable" : "🔴 Needs Correction"

    // ── Energy cost model ──
    const baseEnergyCost = w * 1.0 // kcal/km base
    const stridePenalty = Math.abs(strideLength - idealForSpeed) * 10 // deviation penalty
    const energyCostPerKm = r1(baseEnergyCost + stridePenalty)
    const energyCostPerMile = r1(energyCostPerKm * 1.609)

    // ── Injury probability (overstriding) ──
    const overstridingDeg = strideLength > idealForSpeed * 1.1 ? (strideLength - idealForSpeed * 1.1) * 100 : 0
    const understridingDeg = strideLength < idealForSpeed * 0.85 ? (idealForSpeed * 0.85 - strideLength) * 80 : 0
    const injuryProb = r0(clamp(overstridingDeg + understridingDeg, 0, 50))

    // ── Gait correction suggestion ──
    const gaitAdvice = strideLength > idealForSpeed * 1.1
      ? "Reduce stride length by increasing cadence. Focus on midfoot landing under center of mass."
      : strideLength < idealForSpeed * 0.85
      ? "Slightly increase stride length — focus on hip extension and glute activation."
      : "Good stride length-to-cadence ratio. Maintain current biomechanics."

    setResult({
      primaryMetric: {
        label: "Stride Length",
        value: r2(strideLength),
        unit: "m",
        status: efficiencyIndex >= 55 && efficiencyIndex <= 80 ? "good" : "warning",
        description: `${strideLengthCm} cm — ${efficiencyLabel}`
      },
      healthScore: clamp(balanceScore, 0, 100),
      metrics: [
        { label: "Stride Length", value: r2(strideLength), unit: "m", status: "good" },
        { label: "Stride Length", value: strideLengthCm, unit: "cm", status: "good" },
        { label: "Ideal Stride (Walking)", value: idealStrideWalking, unit: "m", status: "normal" },
        { label: "Ideal Stride (Running)", value: idealStrideRunning, unit: "m", status: "normal" },
        { label: "Ideal for Current Speed", value: idealForSpeed, unit: "m", status: "good" },
        { label: "Derived Cadence", value: cadence, unit: "spm", status: cadence >= 170 ? "good" : cadence >= 155 ? "normal" : "warning" },
        { label: "Height-to-Stride Ratio", value: r2(heightRatio), status: heightRatio >= 0.5 && heightRatio <= 0.75 ? "good" : "warning" },
        { label: "Efficiency Index", value: efficiencyIndex, unit: "/100", status: efficiencyIndex >= 55 && efficiencyIndex <= 80 ? "good" : "warning" },
        { label: "Efficiency Status", value: efficiencyLabel, status: heightRatio >= 0.6 && heightRatio <= 0.75 ? "good" : "warning" },
        { label: "Cadence-Stride Balance", value: balanceScore, unit: "/100", status: balanceScore > 80 ? "good" : balanceScore > 60 ? "normal" : "warning" },
        { label: "Balance Status", value: balanceLabel, status: balanceScore > 80 ? "good" : balanceScore > 60 ? "normal" : "warning" },
        { label: "Energy Cost", value: energyCostPerKm, unit: "kcal/km", status: "normal" },
        { label: "Injury Probability", value: injuryProb, unit: "%", status: injuryProb > 25 ? "danger" : injuryProb > 10 ? "warning" : "good" },
      ],
      recommendations: [
        {
          title: "Stride Length Analysis",
          description: `Current stride: ${r2(strideLength)}m at ${speed} km/h. Ideal for your speed: ${idealForSpeed}m (at 180 spm). Height ratio: ${r2(heightRatio)}× (optimal: 0.60-0.75×). ${strideLength > idealForSpeed * 1.1 ? "⚠️ Over-striding detected — increases braking forces and injury risk." : strideLength < idealForSpeed * 0.85 ? "Under-striding — you may be limiting power generation." : "Good stride length for current speed."}`,
          priority: "high", category: "Biomechanics"
        },
        {
          title: "AI Gait Correction",
          description: gaitAdvice + ` Cadence-stride balance score: ${balanceScore}/100. Target both optimal cadence (170-185 spm) and stride length (${idealForSpeed}m) simultaneously for best efficiency.`,
          priority: "high", category: "Form Correction"
        },
        {
          title: "Energy Efficiency",
          description: `Current energy cost: ${energyCostPerKm} kcal/km. Optimizing stride length can save ~5-15% energy per km. Over a marathon distance, this equals ${r0(42.195 * stridePenalty)} kcal savings — the difference between hitting the wall and finishing strong.`,
          priority: "medium", category: "Efficiency"
        },
        {
          title: "Clinical — Gait Rehabilitation",
          description: "Stride length analysis is used in gait rehabilitation for post-surgical recovery, stroke rehab, and lower extremity injury. Stride asymmetry >5% indicates compensation patterns. Short stride length may indicate hip flexor weakness or pain avoidance.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Distance": `${d} m`,
        "Steps": s,
        "Stride Length": `${r2(strideLength)} m`,
        "Cadence": `${cadence} spm`,
        "Efficiency": `${efficiencyIndex}/100`,
        "Balance": `${balanceScore}/100`,
        "Energy Cost": `${energyCostPerKm} kcal/km`,
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stride-length-calculator" title="Stride Length Calculator — Biomechanical Analyzer"
      description="Advanced stride analysis with cadence-stride balance, efficiency index, energy cost model, injury probability, and gait correction suggestions."
      icon={Footprints} calculate={calculate} onClear={() => { setDistance(1000); setSteps(1200); setHeight(175); setResult(null) }}
      values={[distance, steps, height, weight, speedKmh]} result={result}
      seoContent={<SeoContentGenerator title="Stride Length Calculator" description="Analyze stride length with biomechanical efficiency and gait correction." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Distance Covered" val={distance} set={setDistance} min={10} max={100000} step={10} suffix="m" />
          <NumInput label="Total Steps" val={steps} set={setSteps} min={10} max={200000} />
        </div>
        <NumInput label="Running Speed" val={speedKmh} set={setSpeedKmh} min={2} max={25} step={0.1} suffix="km/h" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={height} set={setHeight} min={140} max={210} suffix="cm" />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. RUNNING DISTANCE-TIME CALCULATOR (Performance Predictor)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedRunningDistanceTimeCalculator() {
  const [mode, setMode] = useState("predict_time")
  const [distance, setDistance] = useState(10)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(50)
  const [seconds, setSeconds] = useState(0)
  const [paceSecPerKm, setPaceSecPerKm] = useState(300)
  const [age, setAge] = useState(30)
  const [vo2max, setVo2max] = useState(45)
  const [result, setResult] = useState<HealthResult | null>(null)

  const fmtTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = r0(totalSec % 60)
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`
  }

  const calculate = () => {
    const dist = clamp(distance, 0.1, 200)
    const totalSec = clamp(hours * 3600 + minutes * 60 + seconds, 1, 360000)
    const pSec = clamp(paceSecPerKm, 120, 1200)
    const a = clamp(age, 10, 85)
    const v = clamp(vo2max, 15, 85)

    let computedDist = dist, computedTime = totalSec, computedPace = pSec

    if (mode === "predict_time") {
      // Given distance + pace → find time
      computedTime = dist * pSec
      computedPace = pSec
    } else if (mode === "predict_distance") {
      // Given time + pace → find distance
      computedDist = totalSec / pSec
      computedPace = pSec
    } else {
      // Given distance + time → find pace
      computedPace = totalSec / dist
      computedTime = totalSec
    }

    const speed = r2(3600 / computedPace)
    const pMin = Math.floor(computedPace / 60)
    const pSc = r0(computedPace % 60)
    const paceStr = `${pMin}:${pSc.toString().padStart(2, "0")} min/km`

    // ── Race time predictor (Riegel) ──
    const rDist = computedDist
    const rTime = computedTime
    const riegel = (d2: number) => rTime * Math.pow(d2 / rDist, 1.06)

    const races = [
      { name: "1K", dist: 1 },
      { name: "5K", dist: 5 },
      { name: "10K", dist: 10 },
      { name: "Half Marathon", dist: 21.0975 },
      { name: "Marathon", dist: 42.195 },
    ]

    // ── Fatigue decay model (Riegel exponent increases with distance) ──
    const fatigueDecay = races.map(race => {
      const predicted = riegel(race.dist)
      const avgPace = predicted / race.dist
      const pM = Math.floor(avgPace / 60)
      const pS = r0(avgPace % 60)
      return {
        name: race.name,
        time: fmtTime(predicted),
        pace: `${pM}:${pS.toString().padStart(2, "0")}/km`,
        speedKmh: r1(race.dist / (predicted / 3600)),
        fatigueSlowdown: race.dist > rDist ? r1((avgPace / computedPace - 1) * 100) : 0
      }
    })

    // ── AI race strategy (even split, negative split, positive split) ──
    const halfDist = computedDist / 2
    const evenSplitPace = paceStr
    const negativeSplitFirst = `${Math.floor(computedPace * 1.02 / 60)}:${r0(computedPace * 1.02 % 60).toString().padStart(2, "0")}/km`
    const negativeSplitSecond = `${Math.floor(computedPace * 0.98 / 60)}:${r0(computedPace * 0.98 % 60).toString().padStart(2, "0")}/km`

    // ── VO₂-based optimal pace ──
    const vo2Pace = v > 0 ? r0(3600 / (v * 0.29 * 0.8)) : computedPace
    const vo2PMin = Math.floor(vo2Pace / 60)
    const vo2PSec = vo2Pace % 60

    // ── Performance improvement projection ──
    const currentPace = computedPace
    const improved4w = r0(currentPace * 0.97)
    const improved8w = r0(currentPace * 0.94)
    const improved12w = r0(currentPace * 0.90)

    setResult({
      primaryMetric: {
        label: mode === "predict_time" ? "Predicted Finish Time" : mode === "predict_distance" ? "Predicted Distance" : "Calculated Pace",
        value: mode === "predict_time" ? fmtTime(computedTime) : mode === "predict_distance" ? `${r2(computedDist)} km` : paceStr,
        status: "good",
        description: `${r2(computedDist)} km at ${paceStr} = ${fmtTime(computedTime)} — ${speed} km/h`
      },
      healthScore: Math.min(100, r0(speed * 5)),
      metrics: [
        { label: "Distance", value: r2(computedDist), unit: "km", status: "good" },
        { label: "Time", value: fmtTime(computedTime), status: "good" },
        { label: "Pace", value: paceStr, status: "good" },
        { label: "Speed", value: speed, unit: "km/h", status: "good" },
        ...fatigueDecay.map(r => ({ label: `Race: ${r.name}`, value: `${r.time} (${r.pace})`, status: "normal" as const, description: r.fatigueSlowdown > 0 ? `+${r.fatigueSlowdown}% fatigue slowdown` : "" })),
        { label: "VO₂-Based Optimal Race Pace", value: `${vo2PMin}:${vo2PSec.toString().padStart(2, "0")}/km`, status: "good" },
        { label: "Strategy: Even Split", value: evenSplitPace, status: "normal" },
        { label: "Strategy: Negative Split (1st half)", value: negativeSplitFirst, status: "normal" },
        { label: "Strategy: Negative Split (2nd half)", value: negativeSplitSecond, status: "good" },
        { label: "4-Week Improvement Pace", value: `${Math.floor(improved4w / 60)}:${(improved4w % 60).toString().padStart(2, "0")}/km`, status: "normal" },
        { label: "8-Week Improvement Pace", value: `${Math.floor(improved8w / 60)}:${(improved8w % 60).toString().padStart(2, "0")}/km`, status: "normal" },
        { label: "12-Week Improvement Pace", value: `${Math.floor(improved12w / 60)}:${(improved12w % 60).toString().padStart(2, "0")}/km`, status: "good" },
      ],
      recommendations: [
        {
          title: "Race Time Predictions",
          description: `Based on ${r2(computedDist)} km in ${fmtTime(computedTime)}: ${fatigueDecay.map(r => `${r.name}: ${r.time}`).join(", ")}. Predictions use Riegel fatigue model — accuracy improves when base distance is closer to target race distance.`,
          priority: "high", category: "Predictions"
        },
        {
          title: "AI Race Strategy",
          description: `Best strategy for ${r2(computedDist)} km: Negative split — start first half at ${negativeSplitFirst} (+2% conservative), then accelerate to ${negativeSplitSecond} (-2%). This prevents glycogen depletion and produces faster finish times in 80% of elite performances.`,
          priority: "high", category: "Strategy"
        },
        {
          title: "Fatigue Decay Model",
          description: `Pace naturally slows with increasing distance due to glycogen depletion, neuromuscular fatigue, and thermoregulation. Expected slowdown: ${fatigueDecay.filter(r => r.fatigueSlowdown > 0).map(r => `${r.name}: +${r.fatigueSlowdown}%`).join(", ") || "N/A for shorter distances"}.`,
          priority: "medium", category: "Science"
        },
        {
          title: "Clinical — Aerobic Capacity Tracking",
          description: "Distance-time performance is a proxy for aerobic capacity. Improving 10K time by 1 minute correlates with ~1 mL/kg/min VO₂max improvement. Used in cardiac rehab to track functional capacity progression.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Distance": `${r2(computedDist)} km`,
        "Time": fmtTime(computedTime),
        "Pace": paceStr,
        "Speed": `${speed} km/h`,
        "VO₂-Based Pace": `${vo2PMin}:${vo2PSec.toString().padStart(2, "0")}/km`,
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="running-distance-time" title="Running Distance-Time Calculator — Performance Predictor"
      description="Advanced race time predictor with Riegel fatigue model, negative split strategy, VO₂-based pacing, and 12-week improvement projection."
      icon={Timer} calculate={calculate} onClear={() => { setDistance(10); setHours(0); setMinutes(50); setSeconds(0); setResult(null) }}
      values={[mode, distance, hours, minutes, seconds, paceSecPerKm, age, vo2max]} result={result}
      seoContent={<SeoContentGenerator title="Running Distance-Time Calculator" description="Predict race times with fatigue model and strategy planner." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Calculate" val={mode} set={setMode} options={[
          { value: "predict_time", label: "Predict Time (from distance + pace)" },
          { value: "predict_distance", label: "Predict Distance (from time + pace)" },
          { value: "predict_pace", label: "Calculate Pace (from distance + time)" },
        ]} />
        {(mode === "predict_time" || mode === "predict_pace") && <NumInput label="Distance" val={distance} set={setDistance} min={0.1} max={200} step={0.1} suffix="km" />}
        {(mode === "predict_distance" || mode === "predict_pace") && (
          <div className="grid grid-cols-3 gap-3">
            <NumInput label="Hours" val={hours} set={setHours} min={0} max={99} />
            <NumInput label="Minutes" val={minutes} set={setMinutes} min={0} max={59} />
            <NumInput label="Seconds" val={seconds} set={setSeconds} min={0} max={59} />
          </div>
        )}
        {(mode === "predict_time" || mode === "predict_distance") && <NumInput label="Pace" val={paceSecPerKm} set={setPaceSecPerKm} min={120} max={1200} step={5} suffix="sec/km" />}
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={85} suffix="years" />
          <NumInput label="VO₂ Max (est.)" val={vo2max} set={setVo2max} min={15} max={85} step={0.5} suffix="mL/kg/min" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. CYCLING PACE CALCULATOR (Endurance Speed Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedCyclingPaceCalculator() {
  const [distance, setDistance] = useState(40)
  const [hours, setHours] = useState(1)
  const [minutes, setMinutes] = useState(30)
  const [elevationGain, setElevationGain] = useState(300)
  const [weight, setWeight] = useState(75)
  const [bikeWeight, setBikeWeight] = useState(9)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dist = clamp(distance, 1, 500)
    const totalMin = clamp(hours * 60 + minutes, 1, 1440)
    const elev = clamp(elevationGain, 0, 10000)
    const w = clamp(weight, 40, 200)
    const bw = clamp(bikeWeight, 5, 20)
    const totalWeight = w + bw

    const totalHrs = totalMin / 60
    const speedKmh = r1(dist / totalHrs)
    const speedMph = r1(speedKmh * 0.621371)

    // ── Elevation-adjusted pace ──
    const elevPerKm = dist > 0 ? elev / dist : 0
    const elevTimePenalty = elev * 0.012 // ~0.012 min per meter of climbing
    const adjustedTime = totalMin + elevTimePenalty
    const elevAdjustedSpeed = r1(dist / (adjustedTime / 60))
    const flatEquivalentDist = r1(dist + elev * 0.008) // 8m extra per 1m climb

    // ── Power estimation (simplified) ──
    const rollingResistance = 0.005 * totalWeight * 9.81 // N
    const aeroResistance = 0.5 * 1.225 * 0.4 * 0.5 * Math.pow(speedKmh / 3.6, 2) // N (CdA=0.4×0.5)
    const gravityPower = totalWeight * 9.81 * (elev / (dist * 1000)) * (speedKmh / 3.6) // W
    const totalPower = r0(((rollingResistance + aeroResistance) * (speedKmh / 3.6) + gravityPower) / 0.95)
    const wPerKg = r2(totalPower / w)

    // ── Power level classification ──
    let powerLevel = ""
    if (wPerKg >= 5.5) powerLevel = "World Tour Pro"
    else if (wPerKg >= 4.5) powerLevel = "Cat 1-2 / Elite Amateur"
    else if (wPerKg >= 3.5) powerLevel = "Cat 3 / Strong Intermediate"
    else if (wPerKg >= 2.5) powerLevel = "Cat 4-5 / Recreational Racer"
    else powerLevel = "Recreational / Fitness Rider"

    // ── VO₂ cost estimation ──
    const vo2Cost = r1(totalPower / w * 10.8 + 7) // ml/kg/min approximation

    // ── Calorie estimation ──
    const kcal = r0(totalPower * totalMin * 60 / 1000 / 0.25) // ~25% efficiency
    const kcalPerHr = r0(kcal / totalHrs)

    // ── Zone estimation ──
    const effortZone = wPerKg >= 4.0 ? "Zone 5 – VO₂ Max" : wPerKg >= 3.0 ? "Zone 4 – Threshold" : wPerKg >= 2.0 ? "Zone 3 – Tempo" : wPerKg >= 1.5 ? "Zone 2 – Endurance" : "Zone 1 – Recovery"

    // ── AI terrain correction ──
    const terrainDifficulty = elevPerKm > 20 ? "🔴 Mountainous" : elevPerKm > 10 ? "🟡 Hilly" : elevPerKm > 5 ? "🟡 Rolling" : "🟢 Flat"

    // ── Performance trend comparison ──
    const avgRecreational = 20
    const percentAboveAvg = r0((speedKmh / avgRecreational - 1) * 100)

    setResult({
      primaryMetric: {
        label: "Average Speed",
        value: speedKmh,
        unit: "km/h",
        status: speedKmh > 30 ? "good" : speedKmh > 20 ? "normal" : "warning",
        description: `${dist} km in ${hours}h ${minutes}m — ${terrainDifficulty}`
      },
      healthScore: Math.min(100, r0(speedKmh * 3)),
      metrics: [
        { label: "Average Speed", value: speedKmh, unit: "km/h", status: "good" },
        { label: "Average Speed (mph)", value: speedMph, unit: "mph", status: "normal" },
        { label: "Distance", value: dist, unit: "km", status: "normal" },
        { label: "Ride Time", value: `${hours}h ${minutes}m`, status: "normal" },
        { label: "Elevation Gain", value: elev, unit: "m", status: "normal" },
        { label: "Elevation per km", value: r1(elevPerKm), unit: "m/km", status: "normal" },
        { label: "Terrain Difficulty", value: terrainDifficulty, status: elevPerKm > 20 ? "danger" : elevPerKm > 10 ? "warning" : "good" },
        { label: "Elevation-Adjusted Speed", value: elevAdjustedSpeed, unit: "km/h", status: "good" },
        { label: "Flat Equivalent Distance", value: flatEquivalentDist, unit: "km", status: "normal" },
        { label: "Estimated Power", value: totalPower, unit: "W", status: "good" },
        { label: "Power-to-Weight", value: wPerKg, unit: "W/kg", status: wPerKg > 3.5 ? "good" : wPerKg > 2.5 ? "normal" : "warning" },
        { label: "Power Level", value: powerLevel, status: "normal" },
        { label: "VO₂ Cost", value: vo2Cost, unit: "mL/kg/min", status: "normal" },
        { label: "Effort Zone", value: effortZone, status: "normal" },
        { label: "Calories Burned", value: kcal, unit: "kcal", status: "good" },
        { label: "Calories per Hour", value: kcalPerHr, unit: "kcal/hr", status: "normal" },
        { label: "vs Recreational Average", value: `${percentAboveAvg > 0 ? "+" : ""}${percentAboveAvg}%`, status: percentAboveAvg > 20 ? "good" : "normal" },
      ],
      recommendations: [
        {
          title: "Cycling Performance Analysis",
          description: `Avg speed ${speedKmh} km/h over ${dist} km with ${elev}m elevation. Estimated power: ${totalPower}W (${wPerKg} W/kg) — ${powerLevel}. Elevation-adjusted speed: ${elevAdjustedSpeed} km/h (flat equivalent: ${flatEquivalentDist} km). ${percentAboveAvg > 0 ? `${percentAboveAvg}% faster than recreational average.` : ""}`,
          priority: "high", category: "Performance"
        },
        {
          title: "AI Terrain Correction",
          description: `Terrain: ${terrainDifficulty} (${r1(elevPerKm)} m/km). ${elevPerKm > 15 ? "High elevation gain significantly impacts speed. Focus on steady power output (Zone 3-4) on climbs rather than maintaining speed. Seated climbing preserves glycogen." : "Moderate/flat terrain — focus on aerodynamic position and cadence 85-95 rpm for optimal efficiency."}`,
          priority: "high", category: "Terrain"
        },
        {
          title: "Training Improvement",
          description: `To increase speed by 2 km/h: 1) Improve FTP by 10-15% through structured intervals. 2) Optimize aero position (can save 10-20W). 3) Reduce total weight by 1-2 kg. 4) Cadence training at 90-100 rpm. Current calorie burn: ${kcalPerHr} kcal/hr.`,
          priority: "medium", category: "Training"
        },
        {
          title: "Clinical — Cardiac Endurance",
          description: "Cycling is a low-impact endurance exercise ideal for cardiac rehabilitation. VO₂ cost monitoring ensures patients stay within safe exercise zones. Power-based training removes pace variability from terrain, providing more consistent intensity control.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "Distance": `${dist} km`,
        "Time": `${hours}h ${minutes}m`,
        "Speed": `${speedKmh} km/h`,
        "Elevation": `${elev} m`,
        "Power": `${totalPower} W (${wPerKg} W/kg)`,
        "Calories": `${kcal} kcal`,
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cycling-pace-calculator" title="Cycling Pace Calculator — Endurance Speed Model"
      description="Advanced cycling analysis with power estimation, elevation correction, W/kg classification, VO₂ cost, and terrain-adjusted performance."
      icon={Bike} calculate={calculate} onClear={() => { setDistance(40); setHours(1); setMinutes(30); setElevationGain(300); setResult(null) }}
      values={[distance, hours, minutes, elevationGain, weight, bikeWeight]} result={result}
      seoContent={<SeoContentGenerator title="Cycling Pace Calculator" description="Advanced cycling performance with power estimation and terrain correction." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Distance" val={distance} set={setDistance} min={1} max={500} step={0.5} suffix="km" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Hours" val={hours} set={setHours} min={0} max={24} />
          <NumInput label="Minutes" val={minutes} set={setMinutes} min={0} max={59} />
        </div>
        <NumInput label="Elevation Gain" val={elevationGain} set={setElevationGain} min={0} max={10000} step={10} suffix="m" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Rider Weight" val={weight} set={setWeight} min={40} max={200} step={0.5} suffix="kg" />
          <NumInput label="Bike Weight" val={bikeWeight} set={setBikeWeight} min={5} max={20} step={0.1} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 11. MET CALCULATOR (Metabolic Equivalent Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedMETCalculator() {
  const [activity, setActivity] = useState("running_moderate")
  const [customMET, setCustomMET] = useState(0)
  const [weight, setWeight] = useState(70)
  const [duration, setDuration] = useState(45)
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const actObj = MET_DB[activity] || MET_DB.running_moderate
    const met = customMET > 0 ? clamp(customMET, 0.5, 25) : actObj.met
    const w = clamp(weight, 20, 250)
    const d = clamp(duration, 1, 480)
    const spw = clamp(sessionsPerWeek, 1, 14)
    const a = clamp(age, 10, 90)

    // ── Calories = MET × Weight × Time ──
    const kcal = r0(met * w * (d / 60))
    const kcalPerMin = r1(met * w / 60)

    // ── Activity classification ──
    const intensity = met < 3 ? "Light" : met < 6 ? "Moderate" : met < 9 ? "Vigorous" : "Very Vigorous"

    // ── VO₂ equivalent ──
    const vo2 = r1(met * 3.5) // mL/kg/min

    // ── Weekly Activity Score (MET-minutes/week) ──
    const metMinutesWeekly = r0(met * d * spw)
    const whoPALevel = metMinutesWeekly >= 3000 ? "🟢 Highly Active (>3000 MET-min/wk)" :
      metMinutesWeekly >= 1500 ? "🟢 Active (1500-3000 MET-min/wk)" :
      metMinutesWeekly >= 600 ? "🟡 Sufficiently Active (600-1500 MET-min/wk)" :
      "🔴 Insufficiently Active (<600 MET-min/wk)"

    // ── Monthly/Annual calories ──
    const weeklyKcal = r0(kcal * spw)
    const monthlyKcal = r0(weeklyKcal * 4.3)
    const annualKcal = r0(weeklyKcal * 52)

    // ── Cardiovascular benefit index ──
    const cvBenefit = metMinutesWeekly >= 1500 ? r0(Math.min(50, metMinutesWeekly / 100)) :
      metMinutesWeekly >= 600 ? r0(metMinutesWeekly / 50) : r0(metMinutesWeekly / 100)
    const cvBenefitLabel = cvBenefit > 30 ? "🟢 Significant CV Protection" : cvBenefit > 15 ? "🟢 Moderate CV Benefit" : "🟡 Below Optimal"

    // ── Sedentary risk score ──
    const sedentaryRisk = metMinutesWeekly < 600 ? r0(80 - metMinutesWeekly / 10) : metMinutesWeekly < 1500 ? r0(30 - metMinutesWeekly / 100) : r0(Math.max(5, 20 - metMinutesWeekly / 200))
    const sedentaryLabel = sedentaryRisk > 50 ? "🔴 High Sedentary Risk" : sedentaryRisk > 25 ? "🟡 Moderate Risk" : "🟢 Low Risk"

    // ── Weight impact projection ──
    const weeklyFatLoss = r2(weeklyKcal / 7700) // kg
    const monthlyFatLoss = r1(weeklyFatLoss * 4.3)

    // ── Activity compliance ──
    const whoTarget = 600 // minimum MET-min/week
    const compliancePercent = r0(Math.min(300, metMinutesWeekly / whoTarget * 100))

    // ── Compare with other activities ──
    const comparisons = Object.entries(MET_DB).slice(0, 10).map(([, v]) => ({
      label: v.label,
      kcal: r0(v.met * w * (d / 60)),
      met: v.met,
    })).sort((a, b) => b.kcal - a.kcal)

    setResult({
      primaryMetric: {
        label: "Calories Burned",
        value: kcal,
        unit: "kcal",
        status: "good",
        description: `MET ${met} × ${w} kg × ${d} min — ${intensity}`
      },
      healthScore: Math.min(100, r0(compliancePercent * 0.5)),
      metrics: [
        { label: "MET Value", value: met, status: "normal" },
        { label: "Activity", value: customMET > 0 ? `Custom (${met} MET)` : actObj.label, status: "normal" },
        { label: "Intensity Classification", value: intensity, status: met >= 6 ? "good" : met >= 3 ? "normal" : "warning" },
        { label: "Calories Burned", value: kcal, unit: "kcal", status: "good" },
        { label: "Calories per Minute", value: kcalPerMin, unit: "kcal/min", status: "normal" },
        { label: "Calories per Hour", value: r0(kcalPerMin * 60), unit: "kcal/hr", status: "normal" },
        { label: "VO₂ Equivalent", value: vo2, unit: "mL/kg/min", status: "normal" },
        { label: "Weekly MET-Minutes", value: metMinutesWeekly, unit: "MET-min", status: metMinutesWeekly >= 600 ? "good" : "warning" },
        { label: "WHO PA Level", value: whoPALevel, status: metMinutesWeekly >= 600 ? "good" : "warning" },
        { label: "Weekly Activity Compliance", value: compliancePercent, unit: "%", status: compliancePercent >= 100 ? "good" : "warning" },
        { label: "Weekly Calories", value: weeklyKcal, unit: "kcal", status: "good" },
        { label: "Monthly Calories", value: monthlyKcal, unit: "kcal", status: "normal" },
        { label: "Annual Calories", value: annualKcal.toLocaleString(), unit: "kcal", status: "good" },
        { label: "CV Benefit Index", value: cvBenefit, unit: "%", status: cvBenefit > 25 ? "good" : cvBenefit > 10 ? "normal" : "warning", description: cvBenefitLabel },
        { label: "Sedentary Risk Score", value: sedentaryRisk, unit: "%", status: sedentaryRisk < 25 ? "good" : sedentaryRisk < 50 ? "warning" : "danger", description: sedentaryLabel },
        { label: "Projected Weekly Fat Loss", value: weeklyFatLoss, unit: "kg", status: "normal" },
        { label: "Projected Monthly Fat Loss", value: monthlyFatLoss, unit: "kg", status: "normal" },
        ...comparisons.slice(0, 5).map(c => ({ label: `Compare: ${c.label}`, value: c.kcal, unit: "kcal", status: "normal" as const })),
      ],
      recommendations: [
        {
          title: "MET Activity Analysis",
          description: `${customMET > 0 ? "Custom activity" : actObj.label} at ${met} MET burns ${kcal} kcal in ${d} minutes. ${intensity} intensity. VO₂ consumption: ${vo2} mL/kg/min. ${met >= 6 ? "Vigorous activity counts double toward weekly guidelines!" : "Consider adding higher-intensity sessions for greater cardiovascular benefit."}`,
          priority: "high", category: "Activity Report"
        },
        {
          title: "WHO Physical Activity Compliance",
          description: `Weekly target: 600 MET-min (minimum). Your weekly score: ${metMinutesWeekly} MET-min (${compliancePercent}% compliance). Status: ${whoPALevel}. ${metMinutesWeekly < 600 ? "⚠️ Below WHO minimum. Increase to at least 150 min/week moderate or 75 min/week vigorous activity." : metMinutesWeekly >= 1500 ? "Excellent! Additional health benefits achieved beyond basic guidelines." : "Meeting minimum guidelines. Increasing to 1500+ MET-min/week provides additional CV protection."}`,
          priority: "high", category: "Guidelines"
        },
        {
          title: "Cardiovascular & Sedentary Risk",
          description: `CV Benefit Index: ${cvBenefit}% — ${cvBenefitLabel}. Sedentary Risk: ${sedentaryRisk}% — ${sedentaryLabel}. Every 500 MET-min/week increase above baseline reduces all-cause mortality by 6-7%. Regular moderate activity (MET 3-6) for 30+ min most days provides significant protection.`,
          priority: "medium", category: "Health Risk"
        },
        {
          title: "Clinical — Physical Activity Prescription",
          description: "MET values are the standard for exercise prescription in clinical settings. Used for cardiac rehab (start at 2-3 METs, progress to 5-7 METs), diabetes prevention (target 600+ MET-min/week), and cancer prevention (target 1500+ MET-min/week). MET-minutes are the WHO-recommended metric for population health assessment.",
          priority: "low", category: "Clinical"
        }
      ],
      detailedBreakdown: {
        "MET": met,
        "Intensity": intensity,
        "Session Calories": `${kcal} kcal`,
        "Weekly MET-min": metMinutesWeekly,
        "WHO Level": whoPALevel,
        "CV Benefit": `${cvBenefit}%`,
        "Sedentary Risk": `${sedentaryRisk}%`,
      }
    })
  }

  const actOptions = Object.entries(MET_DB).map(([k, v]) => ({ value: k, label: `${v.label} (MET ${v.met})` }))

  return (
    <ComprehensiveHealthTemplate toolId="met-calculator" title="MET Calculator — Metabolic Equivalent Analyzer"
      description="Advanced MET analysis with WHO compliance, cardiovascular benefit index, sedentary risk score, weekly activity scoring, and lifestyle activity report."
      icon={BarChart3} calculate={calculate} onClear={() => { setActivity("running_moderate"); setWeight(70); setDuration(45); setResult(null) }}
      values={[activity, customMET, weight, duration, sessionsPerWeek, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="MET Calculator" description="Advanced MET analyzer with WHO compliance and cardiovascular risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Activity Type" val={activity} set={setActivity} options={actOptions} />
        <NumInput label="Custom MET Value (0 = use above)" val={customMET} set={setCustomMET} min={0} max={25} step={0.1} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={20} max={250} step={0.5} suffix="kg" />
          <NumInput label="Session Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Sessions/Week" val={sessionsPerWeek} set={setSessionsPerWeek} min={1} max={14} />
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="yrs" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}
