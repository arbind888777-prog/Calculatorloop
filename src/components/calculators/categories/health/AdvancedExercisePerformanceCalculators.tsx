"use client"

import { useState } from "react"
import { Activity, Dumbbell, Heart, TrendingUp, Timer, Zap, Bike, Footprints } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

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

// MET database for common exercises
const MET_DB: Record<string, number> = {
  "walking_slow": 2.0, "walking_moderate": 3.5, "walking_brisk": 4.3, "jogging": 7.0,
  "running_8kph": 8.3, "running_10kph": 9.8, "running_12kph": 11.0, "running_14kph": 12.5,
  "running_16kph": 14.5, "cycling_light": 4.0, "cycling_moderate": 6.8, "cycling_vigorous": 10.0,
  "swimming_moderate": 7.0, "swimming_vigorous": 9.8, "hiit": 12.3, "weight_training": 6.0,
  "yoga": 3.0, "rowing": 7.0, "elliptical": 5.0, "stair_climbing": 9.0,
  "jump_rope": 12.3, "boxing": 12.8, "dancing": 5.5, "tennis": 7.3,
  "basketball": 8.0, "soccer": 10.0, "rock_climbing": 8.0, "crossfit": 12.0,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. CALORIES BURNED CALCULATOR (Energy Expenditure Performance Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function CaloriesBurnedAdvancedCalculator() {
  const [weight, setWeight] = useState(70)
  const [exercise, setExercise] = useState("running_10kph")
  const [duration, setDuration] = useState(45)
  const [avgHR, setAvgHR] = useState(145)
  const [maxHR, setMaxHR] = useState(185)
  const [vo2max, setVo2max] = useState(40)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [fitness, setFitness] = useState("moderate")
  const [wearableCal, setWearableCal] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 250)
    const d = clamp(duration, 1, 480)
    const hr = clamp(avgHR, 60, 220)
    const mxHR = clamp(maxHR, 100, 230)
    const vo2 = clamp(vo2max, 15, 90)
    const a = clamp(age, 10, 90)
    const met = MET_DB[exercise] || 8.0
    const male = gender === "male"

    // ─── Basic MET-based calories ───
    const basicCal = r0(met * w * (d / 60))

    // ─── HR-adjusted calorie burn (Keytel et al.) ───
    const hrCal = male
      ? r0(d * ((-55.0969 + 0.6309 * hr + 0.1988 * w + 0.2017 * a) / 4.184))
      : r0(d * ((-20.4022 + 0.4472 * hr - 0.1263 * w + 0.074 * a) / 4.184))

    // ─── VO2-based correction ───
    const vo2Fraction = hr / mxHR
    const estimatedVO2 = vo2 * vo2Fraction
    const vo2Cal = r0(estimatedVO2 * w / 1000 * 5.05 * d) // 5.05 kcal per L O2

    // ─── Best estimate (weighted average) ───
    const bestEstimate = r0(basicCal * 0.3 + hrCal * 0.4 + vo2Cal * 0.3)

    // ─── Fat vs Carb Oxidation Ratio ───
    const intensity = hr / mxHR
    const fatPct = intensity < 0.6 ? 70 : intensity < 0.7 ? 55 : intensity < 0.8 ? 35 : intensity < 0.9 ? 15 : 5
    const carbPct = 100 - fatPct
    const fatCalBurned = r0(bestEstimate * fatPct / 100)
    const carbCalBurned = r0(bestEstimate * carbPct / 100)
    const fatGrams = r1(fatCalBurned / 9)
    const carbGrams = r1(carbCalBurned / 4)

    // ─── EPOC (Excess Post-exercise Oxygen Consumption) ───
    const epocMultiplier = intensity >= 0.85 ? 0.15 : intensity >= 0.7 ? 0.08 : 0.03
    const epocCal = r0(bestEstimate * epocMultiplier)
    const totalWithEPOC = bestEstimate + epocCal

    // ─── Adaptive Metabolism Correction ───
    const fitnessMultiplier = fitness === "beginner" ? 1.1 : fitness === "moderate" ? 1.0 : fitness === "advanced" ? 0.92 : 0.88
    const adaptedCal = r0(bestEstimate * fitnessMultiplier)

    // ─── Weekly Calorie Deficit Projection ───
    const weeklyBurn = r0(adaptedCal * 5) // assume 5 sessions/week
    const weeklyDeficitKg = r2(weeklyBurn / 7700)

    // ─── Overtraining Energy Stress Score (0-100) ───
    const loadFactor = (intensity * d) / 60
    const stressScore = r0(clamp(loadFactor * 25, 0, 100))

    // ─── AI Wearable Correction ───
    const wearableCorr = wearableCal > 0 ? r0((wearableCal + bestEstimate) / 2) : bestEstimate

    // ─── Fat Loss Projection (12 weeks) ───
    const fatLoss12Wk = r1(weeklyDeficitKg * 12)

    // ─── Training Load Risk Classification ───
    let riskColor = "🟢 Optimal Burn", riskStatus: 'good' | 'warning' | 'danger' = "good"
    if (stressScore >= 75) { riskColor = "🔴 Excessive Strain"; riskStatus = "danger" }
    else if (stressScore >= 50) { riskColor = "🟡 Moderate Load"; riskStatus = "warning" }
    else if (stressScore < 25) { riskColor = "🟡 Low Stimulus"; riskStatus = "warning" }

    setResult({
      primaryMetric: { label: "Total Calories Burned", value: totalWithEPOC, unit: "kcal", status: "good", description: `${bestEstimate} active + ${epocCal} EPOC afterburn` },
      healthScore: Math.min(100, r0(bestEstimate / 5)),
      metrics: [
        { label: "MET-based Calories", value: basicCal, unit: "kcal", status: "normal" },
        { label: "HR-adjusted Calories", value: hrCal, unit: "kcal", status: "good" },
        { label: "VO₂-based Calories", value: vo2Cal, unit: "kcal", status: "normal" },
        { label: "Best Estimate (Blended)", value: bestEstimate, unit: "kcal", status: "good" },
        { label: "EPOC Afterburn", value: epocCal, unit: "kcal", status: "good" },
        { label: "Total with EPOC", value: totalWithEPOC, unit: "kcal", status: "good" },
        { label: "Fat Calories", value: fatCalBurned, unit: `kcal (${fatPct}%)`, status: "normal" },
        { label: "Carb Calories", value: carbCalBurned, unit: `kcal (${carbPct}%)`, status: "normal" },
        { label: "Fat Burned", value: fatGrams, unit: "g", status: "good" },
        { label: "Carbs Burned", value: carbGrams, unit: "g", status: "normal" },
        { label: "Adapted Burn (Fitness Adj.)", value: adaptedCal, unit: "kcal", status: "normal" },
        { label: "Wearable-Corrected", value: wearableCorr, unit: "kcal", status: wearableCal > 0 ? "good" : "normal" },
        { label: "Burn Intensity", value: `${r0(intensity * 100)}%`, unit: "of HRmax", status: intensity > 0.85 ? "danger" : intensity > 0.7 ? "warning" : "good" },
        { label: "Weekly Burn (5 sessions)", value: weeklyBurn, unit: "kcal", status: "good" },
        { label: "Weekly Fat Loss Potential", value: weeklyDeficitKg, unit: "kg", status: "good" },
        { label: "12-Week Fat Loss Projection", value: fatLoss12Wk, unit: "kg", status: "good" },
        { label: "Energy Stress Score", value: stressScore, unit: "/100", status: riskStatus },
        { label: "Training Load Risk", value: riskColor, status: riskStatus },
      ],
      recommendations: [
        { title: "Burn Accuracy", description: `Three independent models (MET: ${basicCal}, HR: ${hrCal}, VO₂: ${vo2Cal} kcal) are blended for the best estimate of ${bestEstimate} kcal. The EPOC afterburn adds ${epocCal} kcal post-workout.`, priority: "high", category: "Accuracy" },
        { title: "Fuel Utilization", description: `At ${r0(intensity * 100)}% HRmax, your body burns ~${fatPct}% fat and ~${carbPct}% carbs. Fat oxidation peaks at 60-70% HRmax (Zone 2). Higher intensities shift to carbohydrate dominance but yield higher EPOC.`, priority: "high", category: "Fuel" },
        { title: "Fat Loss Strategy", description: `Projected fat loss: ${fatLoss12Wk} kg over 12 weeks at 5 sessions/week. For optimal fat loss, combine Zone 2 training (3-4 sessions) with HIIT (1-2 sessions). Maintain a 300-500 kcal daily deficit.`, priority: "medium", category: "Weight Loss" },
        { title: "Training Load Assessment", description: `Stress score: ${stressScore}/100 — ${riskColor}. ${stressScore >= 75 ? "⚠️ Risk of overtraining! Reduce session duration or intensity. Consider 48h recovery." : stressScore >= 50 ? "Solid training stimulus. Ensure adequate sleep and nutrition." : stressScore < 25 ? "Consider increasing intensity for better adaptation." : "Optimal training load for sustainable progress."}`, priority: stressScore >= 75 ? "high" : "medium", category: "Recovery" },
        { title: "Clinical: Obesity & Cardiac Rehab", description: `Calorie expenditure tracking is essential in obesity intervention programs and cardiac rehabilitation. Target 1,000-2,000 kcal/week exercise expenditure for cardiovascular benefit. Current weekly estimate: ${weeklyBurn} kcal.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Exercise": exercise.replace(/_/g, " "), "MET": met, "Duration": `${d} min`, "Weight": `${w} kg`,
        "MET Calories": basicCal, "HR Calories": hrCal, "VO₂ Calories": vo2Cal, "Best Estimate": bestEstimate,
        "EPOC": epocCal, "Total": totalWithEPOC, "Fat%": fatPct, "Carb%": carbPct,
        "Fat (g)": fatGrams, "Carbs (g)": carbGrams, "Stress Score": stressScore, "Risk": riskColor
      }
    })
  }

  const exerciseOptions = [
    { value: "walking_slow", label: "Walking – Slow (2 km/h)" }, { value: "walking_moderate", label: "Walking – Moderate (3.5 km/h)" },
    { value: "walking_brisk", label: "Walking – Brisk (5 km/h)" }, { value: "jogging", label: "Jogging (7 km/h)" },
    { value: "running_8kph", label: "Running (8 km/h)" }, { value: "running_10kph", label: "Running (10 km/h)" },
    { value: "running_12kph", label: "Running (12 km/h)" }, { value: "running_14kph", label: "Running (14 km/h)" },
    { value: "running_16kph", label: "Sprint Running (16+ km/h)" },
    { value: "cycling_light", label: "Cycling – Light" }, { value: "cycling_moderate", label: "Cycling – Moderate" }, { value: "cycling_vigorous", label: "Cycling – Vigorous" },
    { value: "swimming_moderate", label: "Swimming – Moderate" }, { value: "swimming_vigorous", label: "Swimming – Vigorous" },
    { value: "hiit", label: "HIIT / Tabata" }, { value: "weight_training", label: "Weight Training" },
    { value: "yoga", label: "Yoga" }, { value: "rowing", label: "Rowing" }, { value: "elliptical", label: "Elliptical" },
    { value: "stair_climbing", label: "Stair Climbing" }, { value: "jump_rope", label: "Jump Rope" },
    { value: "boxing", label: "Boxing" }, { value: "dancing", label: "Dancing" }, { value: "crossfit", label: "CrossFit" },
  ]

  return (
    <ComprehensiveHealthTemplate toolId="calories-burned" title="Calories Burned Calculator"
      description="Advanced energy expenditure engine with HR-based, MET-based & VO₂-based calorie estimation. Includes EPOC afterburn, fat/carb oxidation split, and training load risk."
      icon={Zap} calculate={calculate} onClear={() => { setWeight(70); setExercise("running_10kph"); setDuration(45); setAvgHR(145); setMaxHR(185); setVo2max(40); setAge(30); setGender("male"); setFitness("moderate"); setWearableCal(0); setResult(null) }}
      values={[weight, exercise, duration, avgHR, maxHR, vo2max, age, gender, fitness, wearableCal]} result={result}
      seoContent={<SeoContentGenerator title="Calories Burned Calculator" description="Advanced calorie burn estimator with HR, MET & VO₂ correction, EPOC afterburn, fat oxidation ratio." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Exercise Type" val={exercise} set={setExercise} options={exerciseOptions} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
          <NumInput label="Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average Heart Rate" val={avgHR} set={setAvgHR} min={60} max={220} suffix="bpm" />
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={100} max={230} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="VO₂ Max (if known)" val={vo2max} set={setVo2max} min={15} max={90} step={0.5} suffix="mL/kg/min" />
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <SelectInput label="Fitness Level" val={fitness} set={setFitness} options={[{ value: "beginner", label: "Beginner" }, { value: "moderate", label: "Moderate" }, { value: "advanced", label: "Advanced" }, { value: "elite", label: "Elite" }]} />
        </div>
        <NumInput label="Wearable Calorie Data (optional)" val={wearableCal} set={setWearableCal} min={0} max={5000} suffix="kcal (0 = skip)" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. PACE CALCULATOR (Speed Optimization Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedPaceCalculator() {
  const [distance, setDistance] = useState(10)
  const [timeMin, setTimeMin] = useState(55)
  const [vo2max, setVo2max] = useState(42)
  const [targetRace, setTargetRace] = useState("10k")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dist = clamp(distance, 0.1, 200)
    const t = clamp(timeMin, 1, 1200)
    const vo2 = clamp(vo2max, 15, 90)

    const paceSecPerKm = (t * 60) / dist
    const paceMin = Math.floor(paceSecPerKm / 60)
    const paceSec = r0(paceSecPerKm % 60)
    const paceStr = `${paceMin}:${paceSec.toString().padStart(2, "0")}`
    const speedKph = r2(dist / (t / 60))
    const speedMph = r2(speedKph * 0.621371)
    const paceMinPerMile = r2(paceSecPerKm * 1.60934 / 60)

    // ─── Race predictions (Riegel formula) ───
    const fatigueFactor = 1.06
    const raceDists = [
      { name: "5K", dist: 5 }, { name: "10K", dist: 10 },
      { name: "Half Marathon", dist: 21.0975 }, { name: "Marathon", dist: 42.195 },
    ]
    const races = raceDists.map(r => {
      const predTime = t * Math.pow(r.dist / dist, fatigueFactor)
      const h = Math.floor(predTime / 60)
      const m = Math.floor(predTime % 60)
      const s = r0((predTime * 60) % 60)
      return { name: r.name, dist: r.dist, time: h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`, totalMin: predTime }
    })

    // ─── Negative Split Strategy ───
    const firstHalfPace = r2(paceSecPerKm * 1.03)
    const secondHalfPace = r2(paceSecPerKm * 0.97)
    const fhMin = Math.floor(firstHalfPace / 60)
    const fhSec = r0(firstHalfPace % 60)
    const shMin = Math.floor(secondHalfPace / 60)
    const shSec = r0(secondHalfPace % 60)

    // ─── VO₂-based Optimal Pace ───
    const vo2Pace = r2(210 / (vo2 * 0.8)) // min/km at ~80% VO2max (tempo)
    const vo2PaceMin = Math.floor(vo2Pace)
    const vo2PaceSec = r0((vo2Pace - vo2PaceMin) * 60)

    // ─── Lactate Threshold Estimate ───
    const ltPace = r2(paceSecPerKm * 0.88) // ~88% of current pace
    const ltMin = Math.floor(ltPace / 60)
    const ltSec = r0(ltPace % 60)
    const ltHR = r0(0.88 * 220 * 0.82) // rough estimate

    // ─── Performance Improvement Forecast ───
    const improve5pct = r2(paceSecPerKm * 0.95)
    const imp5Min = Math.floor(improve5pct / 60)
    const imp5Sec = r0(improve5pct % 60)

    setResult({
      primaryMetric: { label: "Pace", value: `${paceStr} min/km`, status: "good", description: `Speed: ${speedKph} km/h | ${speedMph} mph` },
      healthScore: Math.min(100, r0(speedKph * 5)),
      metrics: [
        { label: "Pace (min/km)", value: paceStr, status: "good" },
        { label: "Pace (min/mile)", value: r1(paceMinPerMile), unit: "min/mi", status: "normal" },
        { label: "Speed", value: speedKph, unit: "km/h", status: "good" },
        { label: "Speed (mph)", value: speedMph, unit: "mph", status: "normal" },
        { label: "Distance", value: dist, unit: "km", status: "normal" },
        { label: "Total Time", value: `${Math.floor(t / 60) > 0 ? Math.floor(t / 60) + "h " : ""}${r0(t % 60)}min`, status: "normal" },
        ...races.map(r => ({ label: `${r.name} Prediction`, value: r.time, status: "normal" as const })),
        { label: "Negative Split – 1st Half Pace", value: `${fhMin}:${fhSec.toString().padStart(2, "0")}`, unit: "min/km", status: "normal" },
        { label: "Negative Split – 2nd Half Pace", value: `${shMin}:${shSec.toString().padStart(2, "0")}`, unit: "min/km", status: "good" },
        { label: "VO₂-Optimal Tempo Pace", value: `${vo2PaceMin}:${vo2PaceSec.toString().padStart(2, "0")}`, unit: "min/km", status: "good" },
        { label: "Lactate Threshold Pace", value: `${ltMin}:${ltSec.toString().padStart(2, "0")}`, unit: "min/km", status: "normal" },
        { label: "5% Improvement Target", value: `${imp5Min}:${imp5Sec.toString().padStart(2, "0")}`, unit: "min/km", status: "good" },
      ],
      recommendations: [
        { title: "Race Strategy – Negative Split", description: `Start the first half at ${fhMin}:${fhSec.toString().padStart(2, "0")} min/km, then accelerate to ${shMin}:${shSec.toString().padStart(2, "0")} min/km. This 3% negative split strategy reduces early glycogen depletion and improves finish times by 1-3%.`, priority: "high", category: "Strategy" },
        { title: "VO₂-Based Optimal Pace", description: `With VO₂max of ${vo2} mL/kg/min, your sustainable tempo pace is ~${vo2PaceMin}:${vo2PaceSec.toString().padStart(2, "0")} min/km (80% VO₂max). Train at this pace for threshold sessions. Improvement of VO₂max by 5% could lower your pace by ~15 sec/km.`, priority: "high", category: "Performance" },
        { title: "Performance Forecast", description: `A 5% pace improvement to ${imp5Min}:${imp5Sec.toString().padStart(2, "0")} min/km is achievable in 8-12 weeks with structured interval training (2×/week) + zone 2 base building (3×/week).`, priority: "medium", category: "Improvement" },
        { title: "Clinical: Cardiorespiratory Assessment", description: `Running pace is a practical field measure of cardiorespiratory fitness. Your speed of ${speedKph} km/h correlates with VO₂ utilization. Clinical exercise tests use similar metrics for cardiac evaluation.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Distance": `${dist} km`, "Time": `${t} min`, "Pace": `${paceStr} min/km`, "Speed": `${speedKph} km/h`,
        "VO₂ Tempo Pace": `${vo2PaceMin}:${vo2PaceSec.toString().padStart(2, "0")}`, "LT Pace": `${ltMin}:${ltSec.toString().padStart(2, "0")}`,
        ...Object.fromEntries(races.map(r => [r.name, r.time]))
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pace-calculator" title="Pace Calculator"
      description="Advanced speed optimization model with pace/speed calculation, race predictions (Riegel formula), negative split strategy, VO₂-optimal pace & lactate threshold estimation."
      icon={Timer} calculate={calculate} onClear={() => { setDistance(10); setTimeMin(55); setVo2max(42); setResult(null) }}
      values={[distance, timeMin, vo2max, targetRace]} result={result}
      seoContent={<SeoContentGenerator title="Pace Calculator" description="Running pace calculator with race predictions and VO₂-based optimal pace. Negative split strategy & lactate threshold." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Distance" val={distance} set={setDistance} min={0.1} max={200} step={0.1} suffix="km" />
          <NumInput label="Total Time" val={timeMin} set={setTimeMin} min={1} max={1200} step={0.5} suffix="min" />
        </div>
        <NumInput label="VO₂ Max (for optimal pace)" val={vo2max} set={setVo2max} min={15} max={90} step={0.5} suffix="mL/kg/min" />
        <SelectInput label="Target Race" val={targetRace} set={setTargetRace} options={[{ value: "5k", label: "5K" }, { value: "10k", label: "10K" }, { value: "half", label: "Half Marathon" }, { value: "marathon", label: "Marathon" }]} />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. ONE REP MAX CALCULATOR (Strength Potential Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedOneRepMaxCalculator() {
  const [liftWeight, setLiftWeight] = useState(100)
  const [reps, setReps] = useState(5)
  const [bodyWeight, setBodyWeight] = useState(80)
  const [gender, setGender] = useState("male")
  const [trainingAge, setTrainingAge] = useState(2)
  const [rpe, setRpe] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(liftWeight, 1, 1000)
    const r = clamp(Math.round(reps), 1, 30)
    const bw = clamp(bodyWeight, 30, 300)
    const ta = clamp(trainingAge, 0, 30)
    const rpeVal = clamp(rpe, 5, 10)

    // ─── Multiple formulas ───
    const epley = w * (1 + r / 30)
    const brzycki = r > 1 ? w * (36 / (37 - r)) : w
    const lombardi = w * Math.pow(r, 0.1)
    const mayhew = (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))
    const lander = (100 * w) / (101.3 - 2.67123 * r)
    const avg1RM = (epley + brzycki + mayhew + lander) / 4

    // ─── Strength Ratio ───
    const strengthRatio = r2(avg1RM / bw)
    const male = gender === "male"
    let strengthLevel = ""
    if (male) {
      if (strengthRatio >= 2.0) strengthLevel = "Elite"
      else if (strengthRatio >= 1.5) strengthLevel = "Advanced"
      else if (strengthRatio >= 1.25) strengthLevel = "Intermediate"
      else if (strengthRatio >= 0.75) strengthLevel = "Novice"
      else strengthLevel = "Beginner"
    } else {
      if (strengthRatio >= 1.5) strengthLevel = "Elite"
      else if (strengthRatio >= 1.25) strengthLevel = "Advanced"
      else if (strengthRatio >= 1.0) strengthLevel = "Intermediate"
      else if (strengthRatio >= 0.5) strengthLevel = "Novice"
      else strengthLevel = "Beginner"
    }

    // ─── Training Intensity Percentages ───
    const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50]

    // ─── Injury Risk Probability ───
    const injuryBase = rpeVal >= 10 ? 35 : rpeVal >= 9 ? 20 : rpeVal >= 8 ? 10 : 5
    const injuryAdjusted = r0(clamp(injuryBase + (r > 3 ? 0 : 10) + (ta < 1 ? 15 : ta < 2 ? 5 : 0), 0, 80))

    // ─── Neural Fatigue Score (0-100) ───
    const neuralFatigue = r0(clamp((rpeVal / 10) * 50 + (r <= 3 ? 30 : r <= 6 ? 15 : 0) + (w / avg1RM * 20), 0, 100))

    // ─── Progressive Overload Planner ───
    const nextWeek = r1(avg1RM * 1.025) // 2.5% increase
    const nextMonth = r1(avg1RM * 1.05)
    const next3mo = r1(avg1RM * (ta < 1 ? 1.15 : ta < 3 ? 1.10 : 1.05))

    // ─── Safe Load Range ───
    const safeMin = r1(avg1RM * 0.5)
    const safeMax = r1(avg1RM * 0.9)

    let riskStatus: 'good' | 'warning' | 'danger' = injuryAdjusted >= 30 ? "danger" : injuryAdjusted >= 15 ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Estimated 1RM", value: r1(avg1RM), unit: "kg", status: "good", description: `${strengthRatio}× bodyweight — ${strengthLevel} level` },
      healthScore: Math.min(100, r0(strengthRatio * 40)),
      metrics: [
        { label: "Epley Formula", value: r1(epley), unit: "kg", status: "good" },
        { label: "Brzycki Formula", value: r1(brzycki), unit: "kg", status: "good" },
        { label: "Mayhew Formula", value: r1(mayhew), unit: "kg", status: "normal" },
        { label: "Lander Formula", value: r1(lander), unit: "kg", status: "normal" },
        { label: "Average 1RM", value: r1(avg1RM), unit: "kg", status: "good" },
        { label: "Strength Ratio", value: strengthRatio, unit: "× BW", status: strengthRatio >= 1.5 ? "good" : strengthRatio >= 1.0 ? "normal" : "warning" },
        { label: "Strength Category", value: strengthLevel, status: strengthLevel === "Elite" || strengthLevel === "Advanced" ? "good" : "normal" },
        ...pcts.map(p => ({ label: `${p}% of 1RM`, value: r1(avg1RM * p / 100), unit: "kg", status: "normal" as const })),
        { label: "Injury Risk Probability", value: injuryAdjusted, unit: "%", status: riskStatus },
        { label: "Neural Fatigue Score", value: neuralFatigue, unit: "/100", status: neuralFatigue >= 70 ? "danger" : neuralFatigue >= 40 ? "warning" : "good" },
        { label: "Safe Training Range", value: `${safeMin}–${safeMax}`, unit: "kg", status: "good" },
        { label: "Next Week Target", value: nextWeek, unit: "kg", status: "good" },
        { label: "Next Month Target", value: nextMonth, unit: "kg", status: "good" },
        { label: "3-Month Projection", value: next3mo, unit: "kg", status: "good" },
      ],
      recommendations: [
        { title: "Training Load Zones", description: `Strength (1-5 reps): ${r1(avg1RM * 0.85)}–${r1(avg1RM)} kg. Hypertrophy (6-12 reps): ${r1(avg1RM * 0.67)}–${r1(avg1RM * 0.85)} kg. Endurance (13+ reps): below ${r1(avg1RM * 0.67)} kg. Auto-regulate with RPE 7-9.`, priority: "high", category: "Training" },
        { title: "Progressive Overload Plan", description: `Week target: ${nextWeek} kg (+2.5%). Monthly: ${nextMonth} kg (+5%). 3-month: ${next3mo} kg. ${ta < 1 ? "As a beginner, you can expect rapid gains (10-15% in 3 months)." : ta < 3 ? "Intermediate lifters typically gain 5-10% in 3 months." : "Advanced lifters see 2-5% gains over 3 months — focus on periodization."}`, priority: "high", category: "Progression" },
        { title: "Injury Prevention", description: `Injury risk: ${injuryAdjusted}%. Neural fatigue: ${neuralFatigue}/100. ${injuryAdjusted >= 30 ? "⚠️ HIGH RISK: Reduce intensity or increase rep range. Deload for 1 week." : injuryAdjusted >= 15 ? "Moderate risk — ensure warm-up sets and maintain strict form." : "Low risk — safe to continue current loading."} Safe working range: ${safeMin}–${safeMax} kg.`, priority: injuryAdjusted >= 20 ? "high" : "medium", category: "Safety" },
        { title: "Clinical: Rehab Strength Testing", description: `1RM estimation is used clinically in rehabilitation to set safe exercise prescriptions. Strength ratio of ${strengthRatio}× BW is used in return-to-sport criteria. Minimum 1.0× BW squat is common for lower extremity clearance.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Lift Weight": `${w} kg`, "Reps": r, "Body Weight": `${bw} kg`, "RPE": rpeVal,
        "Epley": r1(epley), "Brzycki": r1(brzycki), "Mayhew": r1(mayhew), "Lander": r1(lander),
        "Average 1RM": r1(avg1RM), "Strength Ratio": `${strengthRatio}× BW`, "Level": strengthLevel,
        "Injury Risk": `${injuryAdjusted}%`, "Neural Fatigue": `${neuralFatigue}/100`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="one-rep-max" title="One Rep Max Calculator"
      description="Advanced strength potential analyzer with Epley/Brzycki/Mayhew/Lander formulas, injury risk probability, neural fatigue scoring, and progressive overload planning."
      icon={Dumbbell} calculate={calculate} onClear={() => { setLiftWeight(100); setReps(5); setBodyWeight(80); setGender("male"); setTrainingAge(2); setRpe(8); setResult(null) }}
      values={[liftWeight, reps, bodyWeight, gender, trainingAge, rpe]} result={result}
      seoContent={<SeoContentGenerator title="One Rep Max Calculator" description="Estimate 1RM with multiple formulas. Includes injury risk, neural fatigue, and progressive overload planning." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight Lifted" val={liftWeight} set={setLiftWeight} min={1} max={1000} step={0.5} suffix="kg" />
          <NumInput label="Reps Completed" val={reps} set={setReps} min={1} max={30} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={300} step={0.5} suffix="kg" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Training Age" val={trainingAge} set={setTrainingAge} min={0} max={30} step={0.5} suffix="years" />
          <NumInput label="RPE (Rate of Perceived Exertion)" val={rpe} set={setRpe} min={5} max={10} step={0.5} suffix="/10" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. VO₂ MAX CALCULATOR (Cardiorespiratory Capacity Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedVO2MaxCalculator() {
  const [testType, setTestType] = useState("cooper")
  const [distance, setDistance] = useState(2400)
  const [time, setTime] = useState(12)
  const [hr, setHr] = useState(170)
  const [rhr, setRhr] = useState(60)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distance, 200, 6000)
    const t = clamp(time, 1, 60)
    const heartRate = clamp(hr, 80, 220)
    const restHR = clamp(rhr, 30, 120)
    const a = clamp(age, 10, 90)
    const w = clamp(weight, 30, 250)
    const male = gender === "male"

    let vo2max = 0
    let method = ""

    if (testType === "cooper") {
      vo2max = (d - 504.9) / 44.73
      method = "Cooper 12-min Run: VO₂max = (distance − 504.9) / 44.73"
    } else if (testType === "rockport") {
      vo2max = 132.853 - (0.0769 * w * 2.20462) - (0.3877 * a) + (6.315 * (male ? 1 : 0)) - (3.2649 * t) - (0.1565 * heartRate)
      method = "Rockport Walk Test (1 mile)"
    } else {
      // Uth-Sørensen-Overgaard-Pedersen estimation (HR based)
      vo2max = 15.3 * (220 - a) / restHR
      method = "HR-based (Uth formula): VO₂max = 15.3 × MHR / RHR"
    }
    vo2max = Math.max(10, r1(vo2max))

    // ─── Fitness Category ───
    let category = "", status: 'good' | 'warning' | 'danger' | 'normal' = "normal"
    const thresholds = male
      ? (a < 30 ? [55, 46, 42, 38, 35] : a < 40 ? [54, 45, 41, 36, 32] : a < 50 ? [50, 42, 36, 32, 28] : [47, 38, 33, 29, 25])
      : (a < 30 ? [49, 40, 36, 32, 28] : a < 40 ? [45, 36, 32, 28, 24] : a < 50 ? [42, 33, 29, 25, 21] : [39, 30, 26, 22, 19])
    if (vo2max >= thresholds[0]) { category = "Superior"; status = "good" }
    else if (vo2max >= thresholds[1]) { category = "Excellent"; status = "good" }
    else if (vo2max >= thresholds[2]) { category = "Good"; status = "good" }
    else if (vo2max >= thresholds[3]) { category = "Fair"; status = "normal" }
    else if (vo2max >= thresholds[4]) { category = "Below Average"; status = "warning" }
    else { category = "Poor"; status = "danger" }

    // ─── Biological Fitness Age ───
    const refVO2 = male ? 51.0 : 43.0
    const declineRate = 0.5 // ~0.5 mL/kg/min per year after 25
    const fitnessAge = r0(25 + (refVO2 - vo2max) / declineRate)

    // ─── METs ───
    const mets = r1(vo2max / 3.5)

    // ─── Cardiovascular Mortality Risk Reduction ───
    const cvRiskReduction = vo2max >= 40 ? "40-50% lower risk" : vo2max >= 30 ? "20-30% lower risk" : vo2max >= 20 ? "10% lower risk" : "High cardiovascular risk"

    // ─── Endurance Performance Prediction ───
    const pred5kPace = r1(210 / (vo2max * 0.85))
    const predHMPace = r1(210 / (vo2max * 0.78))
    const predMarPace = r1(210 / (vo2max * 0.73))

    // ─── 12-Week Improvement Projection ───
    const improvementPct = category === "Poor" || category === "Below Average" ? 15 : category === "Fair" ? 10 : 5
    const projected12wk = r1(vo2max * (1 + improvementPct / 100))

    // ─── Longevity Index (relative to population) ───
    const longevityPctl = vo2max >= 50 ? 95 : vo2max >= 40 ? 75 : vo2max >= 30 ? 50 : vo2max >= 20 ? 25 : 10

    setResult({
      primaryMetric: { label: "VO₂ Max", value: vo2max, unit: "mL/kg/min", status: status as any, description: `${category} — Fitness Age: ${fitnessAge} yrs` },
      healthScore: Math.min(100, r0(vo2max * 1.8)),
      metrics: [
        { label: "VO₂ Max", value: vo2max, unit: "mL/kg/min", status: status as any },
        { label: "Fitness Category", value: category, status: status as any },
        { label: "METs Capacity", value: mets, status: "normal" },
        { label: "Biological Fitness Age", value: fitnessAge, unit: "years", status: fitnessAge <= a ? "good" : "warning" },
        { label: "Chronological Age", value: a, unit: "years", status: "normal" },
        { label: "CV Mortality Risk", value: cvRiskReduction, status: vo2max >= 30 ? "good" : "warning" },
        { label: "Fitness Percentile", value: longevityPctl, unit: "%ile", status: longevityPctl >= 50 ? "good" : "warning" },
        { label: "Longevity Index", value: longevityPctl >= 75 ? "High" : longevityPctl >= 50 ? "Moderate" : "Low", status: longevityPctl >= 50 ? "good" : "warning" },
        { label: "Predicted 5K Pace", value: `${Math.floor(pred5kPace)}:${r0((pred5kPace % 1) * 60).toString().padStart(2, "0")}`, unit: "min/km", status: "normal" },
        { label: "Predicted Half Marathon Pace", value: `${Math.floor(predHMPace)}:${r0((predHMPace % 1) * 60).toString().padStart(2, "0")}`, unit: "min/km", status: "normal" },
        { label: "Predicted Marathon Pace", value: `${Math.floor(predMarPace)}:${r0((predMarPace % 1) * 60).toString().padStart(2, "0")}`, unit: "min/km", status: "normal" },
        { label: "12-Week Projection", value: projected12wk, unit: "mL/kg/min", status: "good" },
        { label: "Max O₂ Volume", value: r0(vo2max * w / 1000 * 60), unit: "L/hr", status: "normal" },
      ],
      recommendations: [
        { title: "VO₂ Max Interpretation", description: `Your VO₂ max of ${vo2max} mL/kg/min (${category}) gives you a fitness age of ${fitnessAge} vs chronological age ${a}. Each 1 unit increase in VO₂ max is associated with 3-5% reduction in all-cause mortality. Method: ${method}`, priority: "high", category: "Interpretation" },
        { title: "Improvement Strategy", description: `12-week VO₂ projection: ${projected12wk} mL/kg/min (+${improvementPct}%). Protocol: 2-3 HIIT sessions/week (4×4 intervals at 90-95% HRmax) + 2-3 Zone 2 sessions. HIIT improves VO₂ max 5-20% in sedentary individuals.`, priority: "high", category: "Training" },
        { title: "Clinical: Cardiology Screening", description: `VO₂ max is the strongest predictor of cardiovascular mortality. ${cvRiskReduction}. Clinical exercise testing uses VO₂ max for cardiac risk stratification, transplant eligibility, and exercise prescription.`, priority: "medium", category: "Clinical" },
        { title: "Endurance Predictions", description: `Race pace predictions based on VO₂ utilization fractions: 5K at 85% (~${Math.floor(pred5kPace)}:${r0((pred5kPace % 1) * 60).toString().padStart(2, "0")} /km), Half Marathon at 78% (~${Math.floor(predHMPace)}:${r0((predHMPace % 1) * 60).toString().padStart(2, "0")} /km), Marathon at 73% (~${Math.floor(predMarPace)}:${r0((predMarPace % 1) * 60).toString().padStart(2, "0")} /km).`, priority: "medium", category: "Performance" },
      ],
      detailedBreakdown: {
        "Method": method, "VO₂ Max": `${vo2max} mL/kg/min`, "Category": category,
        "Fitness Age": fitnessAge, "METs": mets, "CV Risk": cvRiskReduction,
        "12-wk Projection": `${projected12wk} mL/kg/min`, "Percentile": `${longevityPctl}th`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vo2-max-calculator" title="VO₂ Max Calculator"
      description="Cardiorespiratory capacity engine with Cooper/Rockport/HR-based testing, biological fitness age, cardiovascular mortality risk assessment, and 12-week improvement projections."
      icon={Activity} calculate={calculate} onClear={() => { setTestType("cooper"); setDistance(2400); setTime(12); setHr(170); setRhr(60); setAge(30); setGender("male"); setWeight(70); setResult(null) }}
      values={[testType, distance, time, hr, rhr, age, gender, weight]} result={result}
      seoContent={<SeoContentGenerator title="VO₂ Max Calculator" description="Advanced aerobic fitness calculator with fitness age, mortality risk, race predictions & improvement projections." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Test Method" val={testType} set={setTestType} options={[{ value: "cooper", label: "Cooper 12-Minute Run Test" }, { value: "rockport", label: "Rockport Walk Test (1 mile)" }, { value: "hr_based", label: "Heart Rate Based (no test needed)" }]} />
        {testType === "cooper" && <NumInput label="Distance in 12 Minutes" val={distance} set={setDistance} min={200} max={6000} step={10} suffix="meters" />}
        {testType === "rockport" && <>
          <NumInput label="1-Mile Walk Time" val={time} set={setTime} min={5} max={30} step={0.5} suffix="min" />
          <NumInput label="Heart Rate at End" val={hr} set={setHr} min={80} max={220} suffix="bpm" />
        </>}
        {testType === "hr_based" && <NumInput label="Resting Heart Rate" val={rhr} set={setRhr} min={30} max={120} suffix="bpm" />}
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. TRAINING ZONE CALCULATOR (Heart Rate Zone Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedTrainingZoneCalculator() {
  const [rhr, setRhr] = useState(60)
  const [maxHR, setMaxHR] = useState(190)
  const [age, setAge] = useState(30)
  const [useKnownMHR, setUseKnownMHR] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const restHR = clamp(rhr, 30, 120)
    const a = clamp(age, 10, 90)
    const knownMHR = useKnownMHR === "yes"
    const mhr = knownMHR ? clamp(maxHR, 100, 230) : r0(208 - 0.7 * a)
    const hrr = mhr - restHR

    // ─── Karvonen zones ───
    const zones = [
      { name: "Zone 1 – Active Recovery", low: 0.50, high: 0.60, color: "🔵", benefit: "Recovery, blood flow, fat oxidation", timeRec: "Used between hard sessions" },
      { name: "Zone 2 – Aerobic Endurance", low: 0.60, high: 0.70, color: "🟢", benefit: "Aerobic base, mitochondrial density, fat metabolism", timeRec: "60-80% of weekly volume" },
      { name: "Zone 3 – Tempo", low: 0.70, high: 0.80, color: "🟡", benefit: "Aerobic capacity, moderate intensity", timeRec: "10-15% of weekly volume" },
      { name: "Zone 4 – Lactate Threshold", low: 0.80, high: 0.90, color: "🟠", benefit: "Lactate clearance, speed endurance", timeRec: "5-10% of weekly volume" },
      { name: "Zone 5 – VO₂ Max", low: 0.90, high: 1.00, color: "🔴", benefit: "Maximum aerobic power, anaerobic capacity", timeRec: "< 5% of weekly volume" },
    ].map(z => ({
      ...z,
      minBpm: r0(hrr * z.low + restHR),
      maxBpm: z.high === 1 ? mhr : r0(hrr * z.high + restHR),
    }))

    // ─── Fat Oxidation Zone (Fatmax) ───
    const fatmaxLow = r0(hrr * 0.55 + restHR)
    const fatmaxHigh = r0(hrr * 0.65 + restHR)

    // ─── Lactate Threshold Zone ───
    const ltLow = r0(hrr * 0.82 + restHR)
    const ltHigh = r0(hrr * 0.88 + restHR)

    // ─── HRV-related recommendation ───
    const hrrScore = r0((hrr / mhr) * 100)
    const fitnessIndicator = hrrScore >= 55 ? "Excellent HR reserve" : hrrScore >= 45 ? "Good HR reserve" : "Consider improving resting HR"

    setResult({
      primaryMetric: { label: "Heart Rate Zones", value: `${mhr} bpm max`, status: "good", description: `HRR = ${hrr} bpm | Karvonen 5-Zone Model` },
      healthScore: Math.min(100, r0(hrr * 1.2)),
      metrics: [
        { label: "Max Heart Rate", value: mhr, unit: "bpm", status: "good" },
        { label: "Resting Heart Rate", value: restHR, unit: "bpm", status: restHR < 60 ? "good" : restHR < 80 ? "normal" : "warning" },
        { label: "Heart Rate Reserve", value: hrr, unit: "bpm", status: "good" },
        { label: "HRR Fitness Score", value: `${hrrScore}%`, status: hrrScore >= 50 ? "good" : "normal" },
        ...zones.map(z => ({
          label: `${z.color} ${z.name}`, value: `${z.minBpm}–${z.maxBpm}`, unit: "bpm", status: "normal" as const
        })),
        { label: "🔥 Fat Oxidation Zone (FATmax)", value: `${fatmaxLow}–${fatmaxHigh}`, unit: "bpm", status: "good" },
        { label: "⚡ Lactate Threshold Zone", value: `${ltLow}–${ltHigh}`, unit: "bpm", status: "warning" },
        { label: "HR Reserve Assessment", value: fitnessIndicator, status: hrrScore >= 50 ? "good" : "normal" },
      ],
      recommendations: [
        { title: "Karvonen Zone Distribution", description: `Target HR = ((${mhr} − ${restHR}) × Intensity%) + ${restHR}. The 80/20 rule: spend 80% training in Zones 1-2 (${zones[0].minBpm}–${zones[1].maxBpm} bpm) and 20% in Zones 4-5 (${zones[3].minBpm}+ bpm). This polarized approach maximizes adaptation.`, priority: "high", category: "Training" },
        { title: "Fat Oxidation Zone", description: `Your FATmax zone: ${fatmaxLow}–${fatmaxHigh} bpm. This is where fat oxidation is highest (0.5-1.0 g/min). Ideal for long slow distance (LSD) runs and fat loss training. Train here for 45-90 min sessions.`, priority: "high", category: "Fat Burn" },
        { title: "Lactate Threshold Training", description: `LT zone: ${ltLow}–${ltHigh} bpm. Tempo runs at this intensity improve lactate clearance capacity. Protocol: 20-40 min continuous or 3×10 min intervals at LT pace. Improves race performance at all distances.`, priority: "medium", category: "Performance" },
        { title: "Clinical: Cardiac Rehab Safe Range", description: `For cardiac rehabilitation, Zones 1-2 (${zones[0].minBpm}–${zones[1].maxBpm} bpm) are typically prescribed. Never exceed Zone 3 without medical clearance in cardiac patients. HRR of ${hrr} bpm indicates cardiac autonomic function.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "MHR": `${mhr} bpm`, "RHR": `${restHR} bpm`, "HRR": `${hrr} bpm`,
        ...Object.fromEntries(zones.map(z => [z.name, `${z.minBpm}–${z.maxBpm} bpm`])),
        "FATmax": `${fatmaxLow}–${fatmaxHigh} bpm`, "Lactate Threshold": `${ltLow}–${ltHigh} bpm`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="training-zone-calculator" title="Training Zone Calculator"
      description="Heart rate zone engine using Karvonen formula with fat oxidation zone, lactate threshold zone, HRV integration, and 80/20 training distribution guidelines."
      icon={Heart} calculate={calculate} onClear={() => { setRhr(60); setMaxHR(190); setAge(30); setUseKnownMHR("no"); setResult(null) }}
      values={[rhr, maxHR, age, useKnownMHR]} result={result}
      seoContent={<SeoContentGenerator title="Training Zone Calculator" description="Calculate 5 heart rate training zones with Karvonen formula. Fat oxidation zone, lactate threshold, and cardiac rehab ranges." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Resting Heart Rate" val={rhr} set={setRhr} min={30} max={120} suffix="bpm" />
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
        </div>
        <SelectInput label="Do you know your Max Heart Rate?" val={useKnownMHR} set={setUseKnownMHR} options={[{ value: "no", label: "No — estimate with Tanaka formula" }, { value: "yes", label: "Yes — I know my max HR" }]} />
        {useKnownMHR === "yes" && <NumInput label="Known Max Heart Rate" val={maxHR} set={setMaxHR} min={100} max={230} suffix="bpm" />}
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. WORKOUT INTENSITY CALCULATOR (Load Monitoring Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function WorkoutIntensityCalculator() {
  const [duration, setDuration] = useState(60)
  const [rpe, setRpe] = useState(7)
  const [avgHR, setAvgHR] = useState(150)
  const [maxHR, setMaxHR] = useState(190)
  const [sets, setSets] = useState(20)
  const [reps, setReps] = useState(10)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(duration, 1, 480)
    const rpeVal = clamp(rpe, 1, 10)
    const hr = clamp(avgHR, 60, 220)
    const mxHR = clamp(maxHR, 100, 230)
    const s = clamp(Math.round(sets), 0, 100)
    const r = clamp(Math.round(reps), 0, 100)

    // ─── Session RPE Load (Foster's sRPE) ───
    const sRPE = r0(rpeVal * d)

    // ─── Training Stress Score (TSS approximation) ───
    const hrIntensity = hr / mxHR
    const tssApprox = r0(d * hrIntensity * hrIntensity * 100 / 60)

    // ─── External Load (total reps) ───
    const totalReps = s * r
    const externalLoad = r0(totalReps * rpeVal)

    // ─── Overtraining Risk (Banister's TRIMP-inspired) ───
    const trimpLike = r0(d * hrIntensity * 0.64 * Math.exp(1.92 * hrIntensity))
    let overtrainRisk = "", otStatus: 'good' | 'warning' | 'danger' = "good"
    if (sRPE >= 600) { overtrainRisk = "🔴 High — Overreaching likely"; otStatus = "danger" }
    else if (sRPE >= 400) { overtrainRisk = "🟡 Moderate — Monitor fatigue"; otStatus = "warning" }
    else if (sRPE >= 200) { overtrainRisk = "🟢 Optimal — Good stimulus"; otStatus = "good" }
    else { overtrainRisk = "🟡 Low — May need higher intensity"; otStatus = "warning" }

    // ─── Recovery Time Estimate ───
    const recoveryHrs = sRPE >= 600 ? 72 : sRPE >= 400 ? 48 : sRPE >= 200 ? 24 : 12

    // ─── Injury Probability Model ───
    const injuryProb = r0(clamp(sRPE / 10 + (hrIntensity > 0.9 ? 15 : 0) + (d > 90 ? 10 : 0), 0, 80))

    // ─── Monotony & Strain (simplified weekly) ───
    const weeklyLoad = r0(sRPE * 4) // assume 4 similar sessions
    const strainIndex = r0(weeklyLoad * (rpeVal / 5))

    // ─── Intensity Gauge ───
    const intensityPct = r0(hrIntensity * 100)
    let intensityLabel = ""
    if (intensityPct >= 90) intensityLabel = "Maximum Effort"
    else if (intensityPct >= 80) intensityLabel = "High Intensity"
    else if (intensityPct >= 70) intensityLabel = "Moderate-High"
    else if (intensityPct >= 60) intensityLabel = "Moderate"
    else intensityLabel = "Low Intensity"

    setResult({
      primaryMetric: { label: "Session Load (sRPE)", value: sRPE, unit: "AU", status: otStatus, description: `${intensityLabel} — Recovery: ${recoveryHrs}h` },
      healthScore: Math.min(100, r0(100 - injuryProb)),
      metrics: [
        { label: "Session RPE Load", value: sRPE, unit: "AU", status: otStatus },
        { label: "TSS (approx.)", value: tssApprox, status: tssApprox > 200 ? "danger" : tssApprox > 100 ? "warning" : "good" },
        { label: "TRIMP-like Score", value: trimpLike, status: "normal" },
        { label: "HR Intensity", value: `${intensityPct}%`, unit: "of HRmax", status: intensityPct > 90 ? "danger" : intensityPct > 80 ? "warning" : "good" },
        { label: "Intensity Level", value: intensityLabel, status: "normal" },
        { label: "External Load (reps × RPE)", value: externalLoad, unit: "AU", status: "normal" },
        { label: "Total Volume (sets × reps)", value: totalReps, status: "normal" },
        { label: "Overtraining Risk", value: overtrainRisk, status: otStatus },
        { label: "Recovery Time", value: recoveryHrs, unit: "hours", status: recoveryHrs >= 72 ? "danger" : recoveryHrs >= 48 ? "warning" : "good" },
        { label: "Injury Probability", value: injuryProb, unit: "%", status: injuryProb >= 30 ? "danger" : injuryProb >= 15 ? "warning" : "good" },
        { label: "Weekly Load Estimate", value: weeklyLoad, unit: "AU", status: weeklyLoad > 2500 ? "danger" : weeklyLoad > 1500 ? "warning" : "good" },
        { label: "Strain Index", value: strainIndex, unit: "AU", status: "normal" },
      ],
      recommendations: [
        { title: "Session Load Interpretation", description: `sRPE of ${sRPE} AU (RPE ${rpeVal} × ${d} min). Guidelines: <200 AU = easy session, 200-400 = moderate, 400-600 = hard, >600 = very hard/overreaching. Your session: ${sRPE < 200 ? "Easy — consider increasing" : sRPE < 400 ? "Moderate — good for regular training" : sRPE < 600 ? "Hard — ensure recovery" : "Very hard — risk of overreaching"}.`, priority: "high", category: "Load" },
        { title: "Recovery & Fatigue Management", description: `Estimated recovery time: ${recoveryHrs} hours. ${recoveryHrs >= 48 ? "Schedule a rest day or easy session tomorrow. Sleep 8+ hours, protein 1.6-2.2 g/kg." : "Ready for the next session after adequate sleep and nutrition."} Acute:Chronic workload ratio should stay between 0.8-1.3 to minimize injury risk.`, priority: "high", category: "Recovery" },
        { title: "Overtraining Prevention", description: `Risk level: ${overtrainRisk}. Weekly load: ${weeklyLoad} AU. Increase training load by no more than 10% per week. Watch for: persistent fatigue, elevated resting HR, decreased performance, mood changes. If 2+ signs present, reduce load by 40-60%.`, priority: sRPE >= 500 ? "high" : "medium", category: "Prevention" },
        { title: "Clinical: Sports Medicine", description: `Training load monitoring via sRPE is standard in sports medicine. Injury probability model estimates ${injuryProb}% risk. TRIMP score of ${trimpLike} quantifies cardiovascular training stress. Used in cardiac rehab and return-to-sport protocols.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Duration": `${d} min`, "RPE": rpeVal, "sRPE": `${sRPE} AU`, "HR%": `${intensityPct}%`,
        "TSS": tssApprox, "TRIMP": trimpLike, "Recovery": `${recoveryHrs}h`,
        "Injury Risk": `${injuryProb}%`, "Weekly Load": `${weeklyLoad} AU`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="workout-intensity" title="Workout Intensity Calculator"
      description="Load monitoring model with session RPE, TSS, TRIMP scoring. Includes overtraining risk assessment, recovery time estimation, and injury probability model."
      icon={TrendingUp} calculate={calculate} onClear={() => { setDuration(60); setRpe(7); setAvgHR(150); setMaxHR(190); setSets(20); setReps(10); setResult(null) }}
      values={[duration, rpe, avgHR, maxHR, sets, reps]} result={result}
      seoContent={<SeoContentGenerator title="Workout Intensity Calculator" description="Calculate workout load with sRPE, TSS, TRIMP. Overtraining risk, recovery time & injury probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Session Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
          <NumInput label="RPE (Rate of Perceived Exertion)" val={rpe} set={setRpe} min={1} max={10} step={0.5} suffix="/10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average Heart Rate" val={avgHR} set={setAvgHR} min={60} max={220} suffix="bpm" />
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={100} max={230} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Total Sets (strength)" val={sets} set={setSets} min={0} max={100} suffix="sets" />
          <NumInput label="Avg Reps per Set" val={reps} set={setReps} min={0} max={100} suffix="reps" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. RUNNING CADENCE CALCULATOR (Efficiency Optimizer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function RunningCadenceCalculator() {
  const [steps, setSteps] = useState(2700)
  const [timeMin, setTimeMin] = useState(15)
  const [speed, setSpeed] = useState(10)
  const [height, setHeight] = useState(175)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(steps, 10, 50000)
    const t = clamp(timeMin, 0.5, 480)
    const spd = clamp(speed, 3, 30)
    const h = clamp(height, 140, 220)

    // ─── Steps per minute ───
    const spm = r0(s / t)

    // ─── Cadence Classification ───
    let classification = "", status: 'good' | 'warning' | 'danger' | 'normal' = "normal"
    if (spm >= 180) { classification = "Elite / Optimal"; status = "good" }
    else if (spm >= 170) { classification = "Good / Efficient"; status = "good" }
    else if (spm >= 160) { classification = "Average"; status = "normal" }
    else if (spm >= 150) { classification = "Below Average"; status = "warning" }
    else { classification = "Low — Overstriding likely"; status = "danger" }

    // ─── Stride Length ───
    const strideLengthM = r2((spd * 1000 / 60) / spm)
    const idealStridePct = r0((h * 0.0077) * 100) // ~77% of height as ideal stride/step ratio
    const actualStrideCm = r0(strideLengthM * 100)

    // ─── Injury Risk Correlation ───
    const injuryRisk = spm >= 175 ? "Low (10-15%)" : spm >= 165 ? "Moderate (20-30%)" : spm >= 155 ? "Elevated (35-45%)" : "High (50%+)"
    const injuryStatus: 'good' | 'warning' | 'danger' = spm >= 175 ? "good" : spm >= 160 ? "warning" : "danger"

    // ─── Efficiency Score (0-100) ───
    const optimalCadence = spd >= 14 ? 185 : spd >= 10 ? 178 : spd >= 7 ? 170 : 160
    const efficiencyScore = r0(clamp(100 - Math.abs(spm - optimalCadence) * 3, 0, 100))

    // ─── Impact Force Estimate ───
    const impactBW = spm >= 180 ? "2.0-2.5× BW" : spm >= 170 ? "2.5-3.0× BW" : "3.0-3.5× BW"

    // ─── Cadence Target ───
    const targetCadence = Math.max(spm, r0(spm * 1.05))

    setResult({
      primaryMetric: { label: "Running Cadence", value: spm, unit: "steps/min", status, description: `${classification} — Efficiency: ${efficiencyScore}%` },
      healthScore: efficiencyScore,
      metrics: [
        { label: "Cadence", value: spm, unit: "spm", status },
        { label: "Classification", value: classification, status },
        { label: "Efficiency Score", value: efficiencyScore, unit: "/100", status: efficiencyScore >= 80 ? "good" : efficiencyScore >= 60 ? "normal" : "warning" },
        { label: "Stride Length", value: strideLengthM, unit: "m", status: "normal" },
        { label: "Stride Length", value: actualStrideCm, unit: "cm", status: "normal" },
        { label: "Running Speed", value: spd, unit: "km/h", status: "normal" },
        { label: "Optimal Cadence (for speed)", value: optimalCadence, unit: "spm", status: "good" },
        { label: "Ground Contact Impact", value: impactBW, status: spm >= 175 ? "good" : "warning" },
        { label: "Injury Risk", value: injuryRisk, status: injuryStatus },
        { label: "5% Improvement Target", value: targetCadence, unit: "spm", status: "good" },
        { label: "Steps Counted", value: s, status: "normal" },
        { label: "Time", value: t, unit: "min", status: "normal" },
      ],
      recommendations: [
        { title: "Cadence & Injury Prevention", description: `Cadence of ${spm} spm: ${classification}. Research shows that increasing cadence by 5-10% reduces knee joint loading by 14-20%, tibial shock by 20%, and hip adduction by 2-3°. This significantly lowers risk of runner's knee, shin splints, and IT band syndrome.`, priority: "high", category: "Injury Prevention" },
        { title: "Cadence Improvement Protocol", description: `Target: ${targetCadence} spm (+5%). Use a metronome app during runs. Start with 2-3 min intervals at target cadence, gradually extending. Most runners achieve 180 spm naturally at speeds above 14 km/h. Focus on quick, light ground contact.`, priority: "high", category: "Improvement" },
        { title: "Efficiency Analysis", description: `Efficiency score: ${efficiencyScore}/100. Optimal cadence for your speed (${spd} km/h) is ~${optimalCadence} spm. Stride length of ${strideLengthM}m is ${strideLengthM > h * 0.01 ? "possibly overstriding — shorten steps" : "within efficient range"}.`, priority: "medium", category: "Efficiency" },
        { title: "Clinical: Biomechanics", description: `Cadence is a key biomechanical metric in gait analysis. Lower cadence (<160 spm) correlates with overstriding, increased ground reaction force (${impactBW}), and higher injury rates. Used in physical therapy for running gait retraining.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Steps": s, "Time": `${t} min`, "Cadence": `${spm} spm`, "Speed": `${spd} km/h`,
        "Stride Length": `${strideLengthM} m`, "Efficiency": `${efficiencyScore}%`,
        "Injury Risk": injuryRisk, "Target": `${targetCadence} spm`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="running-cadence-calculator" title="Running Cadence Calculator"
      description="Efficiency optimizer with steps/min calculation, injury risk correlation, ground impact analysis, efficiency scoring, and cadence improvement protocol."
      icon={Footprints} calculate={calculate} onClear={() => { setSteps(2700); setTimeMin(15); setSpeed(10); setHeight(175); setResult(null) }}
      values={[steps, timeMin, speed, height]} result={result}
      seoContent={<SeoContentGenerator title="Running Cadence Calculator" description="Calculate running cadence (steps/min) with injury risk, efficiency score, and biomechanics analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Steps Counted" val={steps} set={setSteps} min={10} max={50000} step={10} />
          <NumInput label="Time Duration" val={timeMin} set={setTimeMin} min={0.5} max={480} step={0.5} suffix="min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Running Speed" val={speed} set={setSpeed} min={3} max={30} step={0.5} suffix="km/h" />
          <NumInput label="Height" val={height} set={setHeight} min={140} max={220} suffix="cm" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. STRIDE LENGTH CALCULATOR (Biomechanical Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function StrideLengthCalculator() {
  const [distanceM, setDistanceM] = useState(1000)
  const [totalSteps, setTotalSteps] = useState(700)
  const [height, setHeight] = useState(175)
  const [speed, setSpeed] = useState(10)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distanceM, 10, 100000)
    const s = clamp(totalSteps, 10, 200000)
    const h = clamp(height, 140, 220)
    const spd = clamp(speed, 2, 35)
    const w = clamp(weight, 30, 250)

    // ─── Stride Length ───
    const strideLength = r2(d / s)
    const strideCm = r0(strideLength * 100)

    // ─── Expected stride for height ───
    const expectedStride = r2(h * 0.415 / 100) // walking
    const expectedRunStride = r2(h * 0.65 / 100) // running
    const isRunning = spd >= 7

    // ─── Efficiency Index ───
    const idealStride = isRunning ? expectedRunStride : expectedStride
    const efficiencyIndex = r0(clamp(100 - Math.abs(strideLength - idealStride) / idealStride * 100, 0, 100))

    // ─── Cadence from stride + speed ───
    const cadence = r0((spd * 1000 / 60) / strideLength)

    // ─── Cadence-Stride Balance ───
    const csBalance = strideLength > idealStride * 1.15 ? "Overstriding" : strideLength < idealStride * 0.85 ? "Understriding" : "Balanced"
    const csStatus: 'good' | 'warning' | 'danger' = csBalance === "Balanced" ? "good" : csBalance === "Overstriding" ? "danger" : "warning"

    // ─── Energy Cost Model (simplified) ───
    const energyCostPerStep = r2(0.002 * w * strideLength) // ~J per step simplified
    const totalEnergyCost = r0(energyCostPerStep * s)
    const kcalCost = r0(totalEnergyCost / 4.184)

    // ─── Injury Probability ───
    const injuryRisk = csBalance === "Overstriding" ? 40 : csBalance === "Understriding" ? 15 : 8
    const injuryStatus: 'good' | 'warning' | 'danger' = injuryRisk >= 30 ? "danger" : injuryRisk >= 15 ? "warning" : "good"

    // ─── Optimal stride suggestion ───
    const optimalStride = r2(idealStride)
    const optimalSteps = r0(d / optimalStride)

    setResult({
      primaryMetric: { label: "Stride Length", value: strideLength, unit: "m", status: csStatus, description: `${strideCm} cm — ${csBalance} — Efficiency: ${efficiencyIndex}%` },
      healthScore: efficiencyIndex,
      metrics: [
        { label: "Stride Length", value: strideLength, unit: "m", status: csStatus },
        { label: "Stride Length", value: strideCm, unit: "cm", status: csStatus },
        { label: "Expected Stride (height-based)", value: isRunning ? expectedRunStride : expectedStride, unit: "m", status: "normal" },
        { label: "Efficiency Index", value: efficiencyIndex, unit: "/100", status: efficiencyIndex >= 80 ? "good" : efficiencyIndex >= 60 ? "normal" : "warning" },
        { label: "Cadence-Stride Balance", value: csBalance, status: csStatus },
        { label: "Estimated Cadence", value: cadence, unit: "spm", status: cadence >= 170 ? "good" : cadence >= 160 ? "normal" : "warning" },
        { label: "Total Steps", value: s, status: "normal" },
        { label: "Distance", value: d, unit: "m", status: "normal" },
        { label: "Energy Cost per Step", value: energyCostPerStep, unit: "cal", status: "normal" },
        { label: "Total Energy Cost", value: kcalCost, unit: "kcal", status: "normal" },
        { label: "Injury Risk", value: injuryRisk, unit: "%", status: injuryStatus },
        { label: "Optimal Stride", value: optimalStride, unit: "m", status: "good" },
        { label: "Optimal Steps for Distance", value: optimalSteps, status: "normal" },
      ],
      recommendations: [
        { title: "Stride Analysis", description: `Your stride length: ${strideLength}m (${strideCm}cm). Expected for ${h}cm height at ${spd}km/h: ${idealStride}m. ${csBalance === "Overstriding" ? "⚠️ Overstriding increases braking forces and impact loading. Shorten stride by 5-10% and increase cadence." : csBalance === "Understriding" ? "Understriding wastes energy with excessive vertical oscillation. Lengthen stride slightly or increase speed." : "✅ Your stride is well-balanced for your height and speed."}`, priority: "high", category: "Biomechanics" },
        { title: "Gait Correction", description: `${csBalance === "Overstriding" ? "Focus cues: land with foot under hips, lean slightly forward, increase cadence to 175-180 spm. Every 5% reduction in stride length reduces tibial stress by ~20%." : csBalance === "Understriding" ? "Your cadence of " + cadence + " spm may be too high relative to speed. Allow natural stride extension through hip mobility work." : "Maintain current stride mechanics. Work on hip mobility and glute activation to sustain efficiency at higher speeds."}`, priority: "high", category: "Correction" },
        { title: "Energy Efficiency", description: `Energy cost: ~${kcalCost} kcal for ${d}m. Optimal stride length minimizes metabolic cost — both overstriding and understriding increase O₂ consumption by 3-5%. Your efficiency index: ${efficiencyIndex}%.`, priority: "medium", category: "Efficiency" },
        { title: "Clinical: Gait Rehabilitation", description: `Stride length analysis is fundamental in gait rehabilitation for post-surgical recovery, neurological conditions, and running injury prevention. Asymmetry in stride length often indicates compensation patterns.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Distance": `${d} m`, "Steps": s, "Stride": `${strideLength} m`, "Height": `${h} cm`,
        "Expected": `${idealStride} m`, "Efficiency": `${efficiencyIndex}%`, "Balance": csBalance,
        "Cadence": `${cadence} spm`, "Energy": `${kcalCost} kcal`, "Injury Risk": `${injuryRisk}%`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stride-length-calculator" title="Stride Length Calculator"
      description="Biomechanical analyzer with stride efficiency index, cadence-stride balance, energy cost model, overstriding detection, and gait correction protocols."
      icon={Footprints} calculate={calculate} onClear={() => { setDistanceM(1000); setTotalSteps(700); setHeight(175); setSpeed(10); setWeight(70); setResult(null) }}
      values={[distanceM, totalSteps, height, speed, weight]} result={result}
      seoContent={<SeoContentGenerator title="Stride Length Calculator" description="Calculate stride length with efficiency index, cadence-stride balance, energy cost, and gait biomechanics analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Distance Covered" val={distanceM} set={setDistanceM} min={10} max={100000} step={10} suffix="meters" />
          <NumInput label="Total Steps" val={totalSteps} set={setTotalSteps} min={10} max={200000} step={10} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={height} set={setHeight} min={140} max={220} suffix="cm" />
          <NumInput label="Speed" val={speed} set={setSpeed} min={2} max={35} step={0.5} suffix="km/h" />
        </div>
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. RUNNING DISTANCE-TIME CALCULATOR (Performance Predictor)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function RunningDistanceTimeCalculator() {
  const [mode, setMode] = useState("find_time")
  const [distKm, setDistKm] = useState(5)
  const [timeMin, setTimeMin] = useState(25)
  const [paceSec, setPaceSec] = useState(300) // 5:00 min/km
  const [vo2max, setVo2max] = useState(42)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let dist = clamp(distKm, 0.1, 200)
    let t = clamp(timeMin, 0.5, 1200)
    let pace = clamp(paceSec, 120, 1200)

    if (mode === "find_time") {
      t = (pace * dist) / 60
    } else if (mode === "find_dist") {
      dist = (t * 60) / pace
    } else {
      pace = (t * 60) / dist
    }

    const speedKph = r2(3600 / pace)
    const paceMin = Math.floor(pace / 60)
    const paceSecs = r0(pace % 60)
    const paceStr = `${paceMin}:${paceSecs.toString().padStart(2, "0")}`

    const vo2 = clamp(vo2max, 15, 90)

    // ─── Race Time Predictions (Riegel formula) ───
    const baseTime = t
    const baseDist = dist
    const raceDists = [
      { name: "1K", dist: 1 }, { name: "5K", dist: 5 }, { name: "10K", dist: 10 },
      { name: "Half Marathon", dist: 21.0975 }, { name: "Marathon", dist: 42.195 },
    ]
    const races = raceDists.map(r => {
      const predMin = baseTime * Math.pow(r.dist / baseDist, 1.06)
      const h = Math.floor(predMin / 60)
      const m = Math.floor(predMin % 60)
      const s = r0((predMin * 60) % 60)
      return { name: r.name, time: h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`, totalMin: predMin }
    })

    // ─── Fatigue Decay Model ───
    const fatigueDecay = r2(1 + (dist > 21 ? 0.08 : dist > 10 ? 0.04 : 0.01))
    const adjustedTime = r1(t * fatigueDecay)

    // ─── VO₂-based Performance Check ───
    const vo2PredPace = r2(210 / (vo2 * 0.85))
    const vo2PredMin = Math.floor(vo2PredPace)
    const vo2PredSec = r0((vo2PredPace - vo2PredMin) * 60)
    const isAchievable = pace / 60 >= vo2PredPace * 0.9

    // ─── Performance Improvement Metrics ───
    const improvedPace = r2(pace * 0.95)
    const impMin = Math.floor(improvedPace / 60)
    const impSec = r0(improvedPace % 60)
    const improvedTime = r1(t * 0.95)

    const totalH = Math.floor(t / 60)
    const totalM = Math.floor(t % 60)
    const totalS = r0((t * 60) % 60)
    const timeStr = totalH > 0 ? `${totalH}:${totalM.toString().padStart(2, "0")}:${totalS.toString().padStart(2, "0")}` : `${totalM}:${totalS.toString().padStart(2, "0")}`

    setResult({
      primaryMetric: { label: mode === "find_time" ? "Predicted Time" : mode === "find_dist" ? "Predicted Distance" : "Pace", value: mode === "find_dist" ? `${r2(dist)} km` : mode === "find_time" ? timeStr : paceStr, status: "good", description: mode === "find_time" ? `${r2(dist)} km at ${paceStr}/km` : mode === "find_dist" ? `${timeStr} at ${paceStr}/km` : `${r2(dist)} km in ${timeStr}` },
      healthScore: Math.min(100, r0(speedKph * 5)),
      metrics: [
        { label: "Distance", value: r2(dist), unit: "km", status: "normal" },
        { label: "Time", value: timeStr, status: "normal" },
        { label: "Pace", value: `${paceStr}`, unit: "min/km", status: "good" },
        { label: "Speed", value: speedKph, unit: "km/h", status: "good" },
        ...races.map(r => ({ label: `${r.name} Prediction`, value: r.time, status: "normal" as const })),
        { label: "Fatigue-Adjusted Time", value: `${r1(adjustedTime)} min`, status: adjustedTime > t * 1.05 ? "warning" : "normal" },
        { label: "Fatigue Factor", value: fatigueDecay, unit: "×", status: "normal" },
        { label: "VO₂-Based Best Pace", value: `${vo2PredMin}:${vo2PredSec.toString().padStart(2, "0")}`, unit: "min/km", status: "good" },
        { label: "Pace Achievable?", value: isAchievable ? "✅ Yes" : "⚠️ Exceeds VO₂ capacity", status: isAchievable ? "good" : "danger" },
        { label: "5% Improvement Target", value: `${impMin}:${impSec.toString().padStart(2, "0")} min/km`, status: "good" },
        { label: "Improved Time", value: `${r1(improvedTime)} min`, status: "good" },
      ],
      recommendations: [
        { title: "Race Strategy", description: `For ${r2(dist)} km at ${paceStr}/km: ${dist > 21 ? "Use negative splits — start 3-5% slower than target pace for first 10km, then gradually accelerate." : dist > 10 ? "Even pacing is optimal. Aim for consistent splits with slight acceleration in the final 2km." : "Slightly aggressive start is acceptable for shorter distances. Run the first km at target pace, settle in, and push the last 500m."}`, priority: "high", category: "Strategy" },
        { title: "Fatigue Model", description: `Fatigue decay factor: ${fatigueDecay}×. For ${r2(dist)}km, fatigue adds ~${r0((fatigueDecay - 1) * 100)}% to perceived effort. ${dist > 21 ? "Marathon fatigue is exponential after 30km — train long runs to 32-35km." : "At this distance, fatigue is manageable with proper pacing."}`, priority: "medium", category: "Fatigue" },
        { title: "Performance Improvement", description: `To achieve ${impMin}:${impSec.toString().padStart(2, "0")}/km (5% faster): Add 2 interval sessions/week (6×800m at target pace), 1 tempo run, and increase weekly mileage by 10%. Expected timeline: 8-12 weeks.`, priority: "medium", category: "Improvement" },
        { title: "Clinical: Aerobic Assessment", description: `Running distance-time tests are used clinically for aerobic capacity assessment. Time trials correlate with VO₂ max and are used in cardiac rehabilitation and fitness-for-duty evaluations.`, priority: "low", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Mode": mode, "Distance": `${r2(dist)} km`, "Time": timeStr, "Pace": `${paceStr} /km`,
        "Speed": `${speedKph} km/h`, "Fatigue Factor": fatigueDecay,
        ...Object.fromEntries(races.map(r => [r.name, r.time]))
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="running-distance-time" title="Running Distance-Time Calculator"
      description="Performance predictor with race time projection (Riegel), fatigue decay model, VO₂-based pace validation, and AI race strategy planning."
      icon={Timer} calculate={calculate} onClear={() => { setMode("find_time"); setDistKm(5); setTimeMin(25); setPaceSec(300); setVo2max(42); setResult(null) }}
      values={[mode, distKm, timeMin, paceSec, vo2max]} result={result}
      seoContent={<SeoContentGenerator title="Running Distance-Time Calculator" description="Predict running time, distance, or pace. Race predictions, fatigue model & VO₂-based performance." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Calculate" val={mode} set={setMode} options={[{ value: "find_time", label: "Predict Time (from distance + pace)" }, { value: "find_dist", label: "Predict Distance (from time + pace)" }, { value: "find_pace", label: "Find Pace (from distance + time)" }]} />
        {(mode === "find_time" || mode === "find_pace") && <NumInput label="Distance" val={distKm} set={setDistKm} min={0.1} max={200} step={0.1} suffix="km" />}
        {(mode === "find_dist" || mode === "find_pace") && <NumInput label="Time" val={timeMin} set={setTimeMin} min={0.5} max={1200} step={0.5} suffix="min" />}
        {(mode === "find_time" || mode === "find_dist") && <NumInput label="Pace" val={paceSec} set={setPaceSec} min={120} max={1200} step={5} suffix="sec/km" />}
        <NumInput label="VO₂ Max (for validation)" val={vo2max} set={setVo2max} min={15} max={90} step={0.5} suffix="mL/kg/min" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. CYCLING PACE CALCULATOR (Endurance Speed Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function CyclingPaceCalculator() {
  const [distance, setDistance] = useState(40)
  const [timeMin, setTimeMin] = useState(90)
  const [elevation, setElevation] = useState(300)
  const [weight, setWeight] = useState(75)
  const [bikeWeight, setBikeWeight] = useState(9)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distance, 1, 500)
    const t = clamp(timeMin, 5, 3000)
    const elev = clamp(elevation, 0, 10000)
    const w = clamp(weight, 30, 250)
    const bw = clamp(bikeWeight, 5, 25)
    const totalW = w + bw

    // ─── Speed ───
    const speedKph = r2(d / (t / 60))
    const speedMph = r2(speedKph * 0.621371)

    // ─── Elevation-adjusted pace ───
    const gradientPct = d > 0 ? r2((elev / (d * 1000)) * 100) : 0
    const elevCostFactor = 1 + (gradientPct * 0.08) // ~8% slower per 1% gradient
    const flatEquivSpeed = r2(speedKph * elevCostFactor)
    const flatEquivTime = r1(t / elevCostFactor)

    // ─── Power Estimation (simplified) ───
    const rollingResist = 0.005 * totalW * 9.81 * (speedKph / 3.6)
    const aeroResist = 0.5 * 1.225 * 0.32 * 0.5 * Math.pow(speedKph / 3.6, 3)
    const gravityPower = totalW * 9.81 * (elev / (t * 60))
    const totalPower = r0(rollingResist + aeroResist + gravityPower)
    const wPerKg = r2(totalPower / w)

    // ─── Cycling Level Classification ───
    let level = "", lvlStatus: 'good' | 'warning' | 'danger' | 'normal' = "normal"
    if (wPerKg >= 5.5) { level = "World Tour Pro"; lvlStatus = "good" }
    else if (wPerKg >= 4.5) { level = "Elite Amateur / Cat 1"; lvlStatus = "good" }
    else if (wPerKg >= 3.5) { level = "Competitive / Cat 2-3"; lvlStatus = "good" }
    else if (wPerKg >= 2.5) { level = "Recreational / Cat 4-5"; lvlStatus = "normal" }
    else { level = "Beginner"; lvlStatus = "warning" }

    // ─── VO₂ Cost Estimate ───
    const vo2Cost = r1(totalPower / w * 10.8 + 7) // approximate mL/kg/min
    const metsCycling = r1(vo2Cost / 3.5)

    // ─── Effort Zone ───
    let effortZone = "", ezStatus: 'good' | 'warning' | 'danger' = "good"
    if (wPerKg >= 4.0) { effortZone = "🔴 Zone 5 — VO₂ Max / Anaerobic"; ezStatus = "danger" }
    else if (wPerKg >= 3.0) { effortZone = "🟠 Zone 4 — Threshold"; ezStatus = "warning" }
    else if (wPerKg >= 2.0) { effortZone = "🟢 Zone 2-3 — Endurance/Tempo"; ezStatus = "good" }
    else { effortZone = "🔵 Zone 1 — Recovery"; ezStatus = "good" }

    // ─── Calories ───
    const kcal = r0(totalPower * t * 60 / 1000 / 0.25) // ~25% efficiency

    // ─── Performance Metrics ───
    const kmPerKcal = r2(d / kcal * 100) // km per 100 kcal

    setResult({
      primaryMetric: { label: "Average Speed", value: speedKph, unit: "km/h", status: "good", description: `${speedMph} mph | Power: ${totalPower}W (${wPerKg} W/kg)` },
      healthScore: Math.min(100, r0(wPerKg * 20)),
      metrics: [
        { label: "Average Speed", value: speedKph, unit: "km/h", status: "good" },
        { label: "Speed (mph)", value: speedMph, unit: "mph", status: "normal" },
        { label: "Distance", value: d, unit: "km", status: "normal" },
        { label: "Time", value: `${Math.floor(t / 60)}h ${r0(t % 60)}m`, status: "normal" },
        { label: "Elevation Gain", value: elev, unit: "m", status: "normal" },
        { label: "Average Gradient", value: gradientPct, unit: "%", status: gradientPct > 5 ? "warning" : "normal" },
        { label: "Elevation-Adjusted Speed", value: flatEquivSpeed, unit: "km/h (flat equiv.)", status: "good" },
        { label: "Estimated Power", value: totalPower, unit: "W", status: "good" },
        { label: "Power/Weight", value: wPerKg, unit: "W/kg", status: lvlStatus },
        { label: "Cyclist Level", value: level, status: lvlStatus },
        { label: "VO₂ Cost", value: vo2Cost, unit: "mL/kg/min", status: "normal" },
        { label: "METs", value: metsCycling, status: "normal" },
        { label: "Effort Zone", value: effortZone, status: ezStatus },
        { label: "Calories Burned", value: kcal, unit: "kcal", status: "good" },
        { label: "Efficiency", value: kmPerKcal, unit: "km/100kcal", status: "normal" },
      ],
      recommendations: [
        { title: "Power Analysis", description: `Estimated power: ${totalPower}W (${wPerKg} W/kg) — ${level}. Rolling resistance: ~${r0(rollingResist)}W, Aerodynamic: ~${r0(aeroResist)}W, Climbing: ~${r0(gravityPower)}W. ${aeroResist > rollingResist * 2 ? "Aerodynamic drag dominates — optimize body position and equipment." : "Climbing force dominates — weight reduction and power building are key."}`, priority: "high", category: "Power" },
        { title: "Terrain Correction", description: `Gradient: ${gradientPct}%. Your ${speedKph} km/h with ${elev}m climbing is equivalent to ${flatEquivSpeed} km/h on flat terrain. Each 1% gradient adds ~8% to effort. For hilly courses, pace by power (target ${r0(totalPower * 0.9)}-${totalPower}W) not speed.`, priority: "high", category: "Terrain" },
        { title: "Training Recommendation", description: `Effort zone: ${effortZone}. ${wPerKg < 3.0 ? "Build aerobic base with 3-4 Zone 2 rides per week (180+ min). Add 1 interval session." : wPerKg < 4.0 ? "Solid fitness base. Add structured intervals: 2×20min at threshold power, sweet spot training." : "Elite-level output. Focus on race-specific intervals and recovery optimization."}`, priority: "medium", category: "Training" },
        { title: "Clinical: Cardiac Endurance", description: `Sustained cycling at ${metsCycling} METs and VO₂ of ${vo2Cost} mL/kg/min is ${metsCycling > 8 ? "vigorous" : metsCycling > 5 ? "moderate-vigorous" : "moderate"} intensity. Cycling is low-impact and ideal for cardiac rehabilitation. Target 150-300 min/week of moderate-vigorous cycling.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Distance": `${d} km`, "Time": `${t} min`, "Speed": `${speedKph} km/h`, "Elevation": `${elev} m`,
        "Gradient": `${gradientPct}%`, "Power": `${totalPower} W`, "W/kg": wPerKg, "Level": level,
        "Calories": `${kcal} kcal`, "VO₂ Cost": `${vo2Cost} mL/kg/min`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cycling-pace-calculator" title="Cycling Pace Calculator"
      description="Endurance speed model with elevation-adjusted pace, power estimation (W/kg), VO₂ cost, effort zone classification, and terrain correction analysis."
      icon={Bike} calculate={calculate} onClear={() => { setDistance(40); setTimeMin(90); setElevation(300); setWeight(75); setBikeWeight(9); setResult(null) }}
      values={[distance, timeMin, elevation, weight, bikeWeight]} result={result}
      seoContent={<SeoContentGenerator title="Cycling Pace Calculator" description="Calculate cycling speed with elevation correction, power estimation (W/kg), VO₂ cost & effort zones." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Distance" val={distance} set={setDistance} min={1} max={500} step={0.5} suffix="km" />
          <NumInput label="Time" val={timeMin} set={setTimeMin} min={5} max={3000} step={1} suffix="min" />
        </div>
        <NumInput label="Elevation Gain" val={elevation} set={setElevation} min={0} max={10000} step={10} suffix="meters" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Rider Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
          <NumInput label="Bike Weight" val={bikeWeight} set={setBikeWeight} min={5} max={25} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 11. MET CALCULATOR (Metabolic Equivalent Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedMETCalculator() {
  const [activity, setActivity] = useState("running_10kph")
  const [duration, setDuration] = useState(45)
  const [weight, setWeight] = useState(70)
  const [weeklyFreq, setWeeklyFreq] = useState(4)
  const [sedentaryHrs, setSedentaryHrs] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const met = MET_DB[activity] || 8.0
    const d = clamp(duration, 1, 480)
    const w = clamp(weight, 20, 300)
    const freq = clamp(Math.round(weeklyFreq), 1, 14)
    const sedHrs = clamp(sedentaryHrs, 0, 16)

    // ─── Basic: Calories = MET × Weight × Time ───
    const kcal = r0(met * w * (d / 60))
    const kcalPerMin = r1(met * w / 60)

    // ─── Activity Classification ───
    let actClass = "", acStatus: 'good' | 'warning' | 'danger' | 'normal' = "normal"
    if (met < 1.5) { actClass = "Sedentary"; acStatus = "danger" }
    else if (met < 3) { actClass = "Light"; acStatus = "normal" }
    else if (met < 6) { actClass = "Moderate"; acStatus = "good" }
    else if (met < 9) { actClass = "Vigorous"; acStatus = "good" }
    else { actClass = "Very Vigorous"; acStatus = "good" }

    // ─── Weekly Activity Score (MET-minutes) ───
    const weeklyMETmin = r0(met * d * freq)
    const whoTarget = 600 // WHO recommends 600 MET-min/week minimum
    const whoMet = weeklyMETmin >= whoTarget
    const whoPct = r0(Math.min(200, (weeklyMETmin / whoTarget) * 100))

    // ─── Cardiovascular Benefit Index ───
    const cvBenefit = weeklyMETmin >= 1500 ? "Substantial CV protection" : weeklyMETmin >= 600 ? "Moderate CV benefit" : "Insufficient for CV protection"
    const cvStatus: 'good' | 'warning' | 'danger' = weeklyMETmin >= 1500 ? "good" : weeklyMETmin >= 600 ? "normal" as any : "danger"

    // ─── Sedentary Risk Score (0-100) ───
    const sedRisk = r0(clamp(sedHrs * 8 - (weeklyMETmin / 100), 0, 100))
    const sedCategory = sedRisk >= 60 ? "High Sedentary Risk" : sedRisk >= 30 ? "Moderate Sedentary Risk" : "Low Sedentary Risk"

    // ─── VO₂ equivalent ───
    const vo2Equiv = r1(met * 3.5)

    // ─── Weekly calorie burn ───
    const weeklyKcal = r0(kcal * freq)

    // ─── All-cause mortality risk reduction ───
    const mortalityReduction = weeklyMETmin >= 3000 ? "35-40%" : weeklyMETmin >= 1500 ? "25-30%" : weeklyMETmin >= 600 ? "15-20%" : "<10%"

    // ─── Activity Compliance ───
    const complianceStatus = whoPct >= 100 ? "✅ Meeting WHO guidelines" : `⚠️ ${100 - whoPct}% below WHO minimum`

    setResult({
      primaryMetric: { label: "Calories Burned", value: kcal, unit: "kcal", status: "good", description: `MET ${met} × ${w}kg × ${d}min — ${actClass} intensity` },
      healthScore: Math.min(100, whoPct),
      metrics: [
        { label: "MET Value", value: met, status: "normal" },
        { label: "Activity Classification", value: actClass, status: acStatus },
        { label: "Session Calories", value: kcal, unit: "kcal", status: "good" },
        { label: "Calories per Minute", value: kcalPerMin, unit: "kcal/min", status: "normal" },
        { label: "VO₂ Equivalent", value: vo2Equiv, unit: "mL/kg/min", status: "normal" },
        { label: "Weekly MET-minutes", value: weeklyMETmin, unit: "MET·min", status: whoMet ? "good" : "warning" },
        { label: "WHO Guideline %", value: whoPct, unit: "%", status: whoMet ? "good" : "warning" },
        { label: "Weekly Activity Status", value: complianceStatus, status: whoMet ? "good" : "warning" },
        { label: "Weekly Calories", value: weeklyKcal, unit: "kcal", status: "good" },
        { label: "Cardiovascular Benefit", value: cvBenefit, status: cvStatus },
        { label: "Sedentary Risk Score", value: sedRisk, unit: "/100", status: sedRisk >= 60 ? "danger" : sedRisk >= 30 ? "warning" : "good" },
        { label: "Sedentary Category", value: sedCategory, status: sedRisk >= 60 ? "danger" : sedRisk >= 30 ? "warning" : "good" },
        { label: "All-Cause Mortality Reduction", value: mortalityReduction, status: weeklyMETmin >= 600 ? "good" : "warning" },
        { label: "Weekly Frequency", value: freq, unit: "sessions/week", status: "normal" },
      ],
      recommendations: [
        { title: "MET Interpretation", description: `${activity.replace(/_/g, " ")} has a MET value of ${met} (${actClass}). 1 MET = resting metabolic rate (3.5 mL O₂/kg/min). Your activity burns ${r1(met)}× more energy than resting. At ${w}kg, this is ${kcalPerMin} kcal/min.`, priority: "high", category: "Interpretation" },
        { title: "Weekly Activity Analysis", description: `Weekly score: ${weeklyMETmin} MET·min (${whoPct}% of WHO target). WHO recommends ≥600 MET·min/week (150 min moderate or 75 min vigorous). ${whoMet ? `✅ You exceed the minimum by ${whoPct - 100}%. For maximum benefit, aim for 1,500+ MET·min/week.` : `⚠️ You're ${100 - whoPct}% below the WHO minimum. Add ${r0((whoTarget - weeklyMETmin) / met)} more minutes of this activity weekly.`}`, priority: "high", category: "Guidelines" },
        { title: "Sedentary Risk & Cardiovascular Protection", description: `Sedentary risk score: ${sedRisk}/100 (${sedCategory}). ${sedHrs} hours/day sitting. ${sedRisk >= 60 ? "⚠️ High sedentary time increases all-cause mortality risk by 40%. Break up sitting every 30 minutes with 2-3 min walking." : sedRisk >= 30 ? "Stand or walk for 5 minutes every hour to mitigate sitting effects." : "Good balance of activity and sedentary time."} Mortality reduction: ${mortalityReduction}.`, priority: "medium", category: "Sedentary Risk" },
        { title: "Clinical: Physical Activity Prescription", description: `MET-based activity prescription is the clinical standard. Your ${weeklyMETmin} MET·min/week ${weeklyMETmin >= 600 ? "meets" : "does not meet"} the minimum for chronic disease prevention. Physical inactivity is the 4th leading cause of death globally. Target: 600-3000 MET·min/week for optimal health.`, priority: "medium", category: "Clinical" },
      ],
      detailedBreakdown: {
        "Activity": activity.replace(/_/g, " "), "MET": met, "Duration": `${d} min`,
        "Weight": `${w} kg`, "Calories": `${kcal} kcal`, "Classification": actClass,
        "Weekly MET·min": weeklyMETmin, "WHO %": `${whoPct}%`,
        "CV Benefit": cvBenefit, "Sedentary Risk": `${sedRisk}/100`, "Mortality Reduction": mortalityReduction
      }
    })
  }

  const activityOptions = [
    { value: "walking_slow", label: "Walking – Slow (MET 2.0)" }, { value: "walking_moderate", label: "Walking – Moderate (MET 3.5)" },
    { value: "walking_brisk", label: "Walking – Brisk (MET 4.3)" }, { value: "jogging", label: "Jogging (MET 7.0)" },
    { value: "running_8kph", label: "Running 8 km/h (MET 8.3)" }, { value: "running_10kph", label: "Running 10 km/h (MET 9.8)" },
    { value: "running_12kph", label: "Running 12 km/h (MET 11.0)" }, { value: "running_14kph", label: "Running 14 km/h (MET 12.5)" },
    { value: "cycling_light", label: "Cycling – Light (MET 4.0)" }, { value: "cycling_moderate", label: "Cycling – Moderate (MET 6.8)" },
    { value: "cycling_vigorous", label: "Cycling – Vigorous (MET 10.0)" },
    { value: "swimming_moderate", label: "Swimming – Moderate (MET 7.0)" }, { value: "swimming_vigorous", label: "Swimming – Vigorous (MET 9.8)" },
    { value: "hiit", label: "HIIT (MET 12.3)" }, { value: "weight_training", label: "Weight Training (MET 6.0)" },
    { value: "yoga", label: "Yoga (MET 3.0)" }, { value: "rowing", label: "Rowing (MET 7.0)" },
    { value: "elliptical", label: "Elliptical (MET 5.0)" }, { value: "stair_climbing", label: "Stair Climbing (MET 9.0)" },
    { value: "jump_rope", label: "Jump Rope (MET 12.3)" }, { value: "boxing", label: "Boxing (MET 12.8)" },
    { value: "dancing", label: "Dancing (MET 5.5)" }, { value: "tennis", label: "Tennis (MET 7.3)" },
    { value: "basketball", label: "Basketball (MET 8.0)" }, { value: "soccer", label: "Soccer (MET 10.0)" },
    { value: "crossfit", label: "CrossFit (MET 12.0)" },
  ]

  return (
    <ComprehensiveHealthTemplate toolId="met-calculator" title="MET Calculator"
      description="Metabolic equivalent analyzer with WHO activity compliance tracking, cardiovascular benefit index, sedentary risk scoring, and all-cause mortality risk assessment."
      icon={Zap} calculate={calculate} onClear={() => { setActivity("running_10kph"); setDuration(45); setWeight(70); setWeeklyFreq(4); setSedentaryHrs(8); setResult(null) }}
      values={[activity, duration, weight, weeklyFreq, sedentaryHrs]} result={result}
      seoContent={<SeoContentGenerator title="MET Calculator" description="Calculate MET value, calories burned, WHO activity compliance, sedentary risk, and cardiovascular benefit index." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Activity Type" val={activity} set={setActivity} options={activityOptions} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Session Duration" val={duration} set={setDuration} min={1} max={480} suffix="min" />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sessions per Week" val={weeklyFreq} set={setWeeklyFreq} min={1} max={14} />
          <NumInput label="Daily Sedentary Hours" val={sedentaryHrs} set={setSedentaryHrs} min={0} max={16} step={0.5} suffix="hours" />
        </div>
      </div>} />
  )
}
