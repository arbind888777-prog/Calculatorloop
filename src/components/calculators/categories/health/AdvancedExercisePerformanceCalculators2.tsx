"use client"

import { useState } from "react"
import { Activity, Dumbbell, Heart, TrendingUp, Timer, Zap, Droplets, Footprints } from "lucide-react"
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 12. STRENGTH TRAINING VOLUME CALCULATOR (Hypertrophy Load Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedStrengthVolumeCalculator() {
  const [exercise, setExercise] = useState("squat")
  const [sets, setSets] = useState(4)
  const [reps, setReps] = useState(10)
  const [weight, setWeight] = useState(80)
  const [bodyWeight, setBodyWeight] = useState(75)
  const [frequency, setFrequency] = useState(3)
  const [restTime, setRestTime] = useState(90)
  const [rpe, setRpe] = useState(7)
  const [experience, setExperience] = useState("intermediate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(Math.round(sets), 1, 50)
    const r = clamp(Math.round(reps), 1, 100)
    const w = clamp(weight, 1, 1000)
    const bw = clamp(bodyWeight, 20, 300)
    const freq = clamp(frequency, 1, 7)
    const rest = clamp(restTime, 10, 600)
    const rpeVal = clamp(rpe, 1, 10)

    // Basic volume
    const sessionVolume = s * r * w
    const weeklyVolume = sessionVolume * freq
    const volumePerKg = r1(weeklyVolume / bw)

    // Estimated 1RM (Epley formula)
    const orm = r0(w * (1 + r / 30))
    const intensityPct = r1((w / orm) * 100)

    // MRV estimates by experience (sets per muscle group per week)
    const mrvMap: Record<string, number> = { beginner: 12, intermediate: 18, advanced: 24 }
    const mrv = mrvMap[experience] || 18
    const weeklySetsMuscle = s * freq
    const mrvPct = r0((weeklySetsMuscle / mrv) * 100)

    // CNS fatigue probability based on intensity + volume + RPE
    const cnsLoad = (intensityPct / 100) * (rpeVal / 10) * (s / 5)
    const cnsFatigue = r0(Math.min(100, cnsLoad * 50))

    // Hypertrophy check (optimal: 6-12 reps, 60-80% 1RM, 10-20 sets/wk)
    const repOptimal = r >= 6 && r <= 12
    const intensityOptimal = intensityPct >= 60 && intensityPct <= 80
    const volumeOptimal = weeklySetsMuscle >= 10 && weeklySetsMuscle <= 20

    // Risk classification
    let riskColor = "Green", riskLabel = "Optimal Training Zone"
    let riskStatus: 'good' | 'normal' | 'warning' | 'danger' = "good"
    if (mrvPct > 130 || cnsFatigue > 80) {
      riskColor = "Red"; riskLabel = "Overreaching — Injury Risk High"; riskStatus = "danger"
    } else if (mrvPct > 110 || cnsFatigue > 60) {
      riskColor = "Yellow"; riskLabel = "High but Manageable"; riskStatus = "warning"
    } else if (mrvPct > 100) {
      riskColor = "Yellow"; riskLabel = "Approaching MRV Limit"; riskStatus = "warning"
    }

    // Weekly volume spike check (simplified: if >20% above typical)
    const typicalWeekly = mrv * orm * 0.6 * 8 // rough typical
    const spikeRatio = weeklyVolume / Math.max(1, typicalWeekly)
    const spikeAlert = spikeRatio > 1.2

    // Progressive overload recommendation
    const overloadSuggestion = rpeVal < 8
      ? `Increase weight by ${r1(w * 0.025)} kg next session (2.5% progression)`
      : rpeVal < 9
        ? "Maintain current load — volume is near ceiling for this RPE"
        : "Consider a deload week — RPE is very high. Reduce volume by 40% for 1 week."

    // Injury risk
    const injuryRisk = mrvPct > 120 ? r0(Math.min(85, mrvPct - 40)) : mrvPct > 100 ? r0(mrvPct - 70) : r0(Math.max(5, mrvPct / 5))

    setResult({
      primaryMetric: { label: "Session Volume", value: sessionVolume.toLocaleString(), unit: "kg", status: riskStatus, description: `${s}×${r}×${w}kg | Weekly: ${weeklyVolume.toLocaleString()} kg` },
      healthScore: Math.max(0, Math.min(100, 100 - cnsFatigue)),
      metrics: [
        { label: "Session Volume", value: sessionVolume.toLocaleString(), unit: "kg", status: "good" },
        { label: "Weekly Total Volume", value: weeklyVolume.toLocaleString(), unit: "kg", status: riskStatus },
        { label: "Volume per kg BW", value: volumePerKg, unit: "kg/kg", status: "normal" },
        { label: "Intensity (% of 1RM)", value: `${intensityPct}%`, status: intensityOptimal ? "good" : "warning" },
        { label: "Estimated 1RM", value: orm, unit: "kg", status: "normal" },
        { label: "Weekly Sets/Muscle", value: weeklySetsMuscle, status: volumeOptimal ? "good" : weeklySetsMuscle > 20 ? "danger" : "warning" },
        { label: `MRV Utilization (${experience})`, value: `${mrvPct}%`, status: mrvPct <= 100 ? "good" : mrvPct <= 120 ? "warning" : "danger" },
        { label: "CNS Fatigue Probability", value: `${cnsFatigue}%`, status: cnsFatigue < 40 ? "good" : cnsFatigue < 65 ? "warning" : "danger" },
        { label: "Hypertrophy Rep Range", value: repOptimal ? "✔ Optimal (6-12)" : "⚠ Sub-optimal", status: repOptimal ? "good" : "warning" },
        { label: "Risk Classification", value: `${riskColor}: ${riskLabel}`, status: riskStatus },
        { label: "Injury Risk Score", value: `${injuryRisk}%`, status: injuryRisk < 20 ? "good" : injuryRisk < 50 ? "warning" : "danger" },
        { label: "Weekly Spike Alert", value: spikeAlert ? "⚠ Volume spike detected" : "✔ Normal progression", status: spikeAlert ? "danger" : "good" }
      ],
      recommendations: [
        { title: "AI Progressive Overload", description: overloadSuggestion, priority: "high", category: "Progression" },
        { title: "Volume Distribution", description: `Your ${weeklySetsMuscle} weekly sets for this muscle group is ${mrvPct}% of MRV (${mrv} sets). ${mrvPct > 100 ? "⚠ Exceeding MRV — risk of overtraining. Consider reducing sets or adding a deload week." : mrvPct > 80 ? "Approaching productive volume ceiling. Monitor fatigue closely." : "Good volume range for continued progress."}`, priority: "high", category: "Volume" },
        { title: "Hypertrophy Optimization", description: `${repOptimal && intensityOptimal ? "✔ Rep range and intensity are optimal for hypertrophy (6-12 reps at 60-80% 1RM)." : !repOptimal ? `Adjust reps to 6-12 range for maximum hypertrophy stimulus. Current: ${r} reps.` : `Adjust intensity to 60-80% 1RM range. Current: ${intensityPct}%.`} Rest periods of ${rest}s are ${rest >= 60 && rest <= 120 ? "optimal" : rest < 60 ? "too short" : "long (better for strength than hypertrophy)"} for muscle growth.`, priority: "high", category: "Hypertrophy" },
        { title: "CNS Recovery", description: `CNS fatigue probability: ${cnsFatigue}%. ${cnsFatigue > 60 ? "High CNS load — ensure 48-72 hours between sessions targeting the same muscle." : "CNS load is manageable."} Heavy compounds (squat, deadlift) tax the CNS more than isolation exercises.`, priority: "medium", category: "Recovery" },
        { title: "Clinical: Rehab Load Monitoring", description: `For rehabilitation contexts, maintain volume below 60% MRV (${r0(mrv * 0.6)} sets/week). Current utilization is ${mrvPct}%. RPE should be kept at 5-6 during rehab phases. Monitor pain levels and adjust accordingly.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Exercise": exercise, "Sets × Reps × Weight": `${s} × ${r} × ${w} kg`,
        "Session Volume": `${sessionVolume.toLocaleString()} kg`, "Weekly Volume": `${weeklyVolume.toLocaleString()} kg`,
        "Volume/kg BW": `${volumePerKg} kg/kg`, "Estimated 1RM": `${orm} kg`,
        "Intensity": `${intensityPct}% of 1RM`, "Weekly Sets": `${weeklySetsMuscle}/${mrv} MRV`,
        "CNS Fatigue": `${cnsFatigue}%`, "Risk": `${riskColor}: ${riskLabel}`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="strength-volume-calculator" title="Strength Training Volume Calculator"
      description="Quantify total training volume for hypertrophy, strength progression, and overtraining prevention. Includes MRV estimation, CNS fatigue probability, injury risk flags, and AI progressive overload recommendations."
      icon={Dumbbell} calculate={calculate} onClear={() => { setExercise("squat"); setSets(4); setReps(10); setWeight(80); setBodyWeight(75); setFrequency(3); setRestTime(90); setRpe(7); setExperience("intermediate"); setResult(null) }}
      values={[exercise, sets, reps, weight, bodyWeight, frequency, restTime, rpe, experience]} result={result}
      seoContent={<SeoContentGenerator title="Strength Training Volume Calculator" description="Calculate total training volume with MRV, CNS fatigue, and hypertrophy optimization." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Exercise" val={exercise} set={setExercise} options={[
          { value: "squat", label: "Squat" }, { value: "bench_press", label: "Bench Press" },
          { value: "deadlift", label: "Deadlift" }, { value: "overhead_press", label: "Overhead Press" },
          { value: "row", label: "Barbell Row" }, { value: "pull_up", label: "Pull-up/Lat Pulldown" },
          { value: "leg_press", label: "Leg Press" }, { value: "curl", label: "Bicep Curl" },
          { value: "tricep_ext", label: "Tricep Extension" }, { value: "lateral_raise", label: "Lateral Raise" }
        ]} />
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Sets" val={sets} set={setSets} min={1} max={50} />
          <NumInput label="Reps/Set" val={reps} set={setReps} min={1} max={100} />
          <NumInput label="Weight" val={weight} set={setWeight} min={1} max={1000} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Training Frequency" val={frequency} set={setFrequency} min={1} max={7} suffix="days/wk" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Rest Time" val={restTime} set={setRestTime} min={10} max={600} suffix="sec" />
          <NumInput label="RPE (1-10)" val={rpe} set={setRpe} min={1} max={10} />
          <SelectInput label="Experience" val={experience} set={setExperience} options={[
            { value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }
          ]} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 13. WORKOUT RECOVERY TIME CALCULATOR (Physiological Recovery Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function WorkoutRecoveryTimeCalculator() {
  const [duration, setDuration] = useState(60)
  const [rpe, setRpe] = useState(7)
  const [trainingType, setTrainingType] = useState("resistance")
  const [sleepHours, setSleepHours] = useState(7)
  const [hrv, setHrv] = useState(50)
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 10, 300)
    const rpeVal = clamp(rpe, 1, 10)
    const sleep = clamp(sleepHours, 3, 12)
    const hrvVal = clamp(hrv, 10, 150)
    const a = clamp(age, 15, 80)

    // Session load
    const sessionLoad = r0(rpeVal * dur)

    // Type multiplier
    const typeMultipliers: Record<string, number> = {
      resistance: 1.0, hiit: 1.3, endurance: 0.8, plyometric: 1.4,
      crossfit: 1.3, yoga: 0.4, sports: 1.1, swimming: 0.9
    }
    const typeMult = typeMultipliers[trainingType] || 1.0

    // Base recovery hours
    let baseRecovery = (sessionLoad / 100) * typeMult * 8 // scaled to 8h baseline
    // Age factor
    const ageFactor = a > 40 ? 1 + (a - 40) * 0.01 : 1.0
    baseRecovery *= ageFactor

    // Sleep debt correction
    const sleepDebt = Math.max(0, 8 - sleep)
    const sleepPenalty = sleepDebt * 2 // hours added per hour of debt
    baseRecovery += sleepPenalty

    // HRV correction (lower HRV = slower recovery)
    const hrvBasis = 50 // average
    const hrvRatio = hrvVal / hrvBasis
    if (hrvRatio < 0.8) baseRecovery *= 1.3
    else if (hrvRatio > 1.2) baseRecovery *= 0.85

    const recoveryHours = r1(Math.min(120, Math.max(6, baseRecovery)))

    // Muscle recovery index (0-100)
    const muscleRecovery = r0(Math.max(0, Math.min(100, 100 - (sessionLoad / 10) * typeMult)))

    // Glycogen restoration time (hours)
    const glycogenTime = r1(Math.min(48, dur * rpeVal * 0.02 * typeMult + 4))

    // Nervous system recovery
    const nsRecovery = r0(Math.max(0, Math.min(100, 100 - (rpeVal * 8 + dur * 0.1) * typeMult)))

    // Overtraining risk
    const weeklyLoad = sessionLoad * 4 // assume 4 sessions/wk
    const overtrainingRisk = r0(Math.min(95, (weeklyLoad / 3000) * 100))

    // Recovery readiness score
    const readinessScore = r0(Math.min(100, (hrvVal / 60) * 30 + (sleep / 8) * 30 + (muscleRecovery / 100) * 40))

    // Risk classification
    let status: 'good' | 'warning' | 'danger' = "good"
    let riskLabel = "Ready for Training"
    if (recoveryHours > 72 || overtrainingRisk > 70) { status = "danger"; riskLabel = "High Fatigue — Extended Recovery Needed" }
    else if (recoveryHours > 48 || overtrainingRisk > 50) { status = "warning"; riskLabel = "Moderate Fatigue — Monitor Closely" }

    // AI schedule suggestion
    const nextSessionHours = r0(recoveryHours)
    const schedule = recoveryHours <= 24 ? "Can train same muscle group tomorrow"
      : recoveryHours <= 48 ? "Train different muscle group tomorrow; same group in 48h"
      : "Full rest recommended for 2-3 days. Consider active recovery (walk/yoga)."

    setResult({
      primaryMetric: { label: "Recovery Time", value: `${recoveryHours} hrs`, status, description: `Session Load: ${sessionLoad} | ${riskLabel}` },
      healthScore: readinessScore,
      metrics: [
        { label: "Recovery Hours Required", value: recoveryHours, unit: "hours", status },
        { label: "Session Load (RPE × Duration)", value: sessionLoad, unit: "AU", status: sessionLoad < 400 ? "good" : sessionLoad < 700 ? "warning" : "danger" },
        { label: "Muscle Recovery Index", value: muscleRecovery, unit: "/100", status: muscleRecovery > 60 ? "good" : muscleRecovery > 30 ? "warning" : "danger" },
        { label: "Glycogen Restoration", value: glycogenTime, unit: "hours", status: glycogenTime < 12 ? "good" : glycogenTime < 24 ? "warning" : "danger" },
        { label: "Nervous System Recovery", value: nsRecovery, unit: "/100", status: nsRecovery > 60 ? "good" : nsRecovery > 30 ? "warning" : "danger" },
        { label: "Overtraining Risk (weekly)", value: `${overtrainingRisk}%`, status: overtrainingRisk < 30 ? "good" : overtrainingRisk < 60 ? "warning" : "danger" },
        { label: "Sleep Debt Penalty", value: `+${r1(sleepPenalty)} hrs`, status: sleepDebt === 0 ? "good" : sleepDebt < 2 ? "warning" : "danger" },
        { label: "HRV Status", value: hrvVal > 60 ? "Good" : hrvVal > 40 ? "Average" : "Low", status: hrvVal > 60 ? "good" : hrvVal > 40 ? "warning" : "danger" },
        { label: "Recovery Readiness", value: readinessScore, unit: "/100", status: readinessScore > 70 ? "good" : readinessScore > 40 ? "warning" : "danger" },
        { label: "Next Session In", value: `${nextSessionHours} hours`, status }
      ],
      recommendations: [
        { title: "AI Training Schedule", description: schedule, priority: "high", category: "Scheduling" },
        { title: "Recovery Optimization", description: `Recovery time: ${recoveryHours} hours. ${sleepDebt > 0 ? `Sleep debt of ${sleepDebt}h adds ~${r1(sleepPenalty)}h to recovery. Prioritize 8+ hours of sleep.` : "Sleep is adequate."} ${hrvVal < 40 ? "Low HRV detected — your autonomic nervous system is stressed. Consider meditation, cold exposure, or complete rest." : ""}`, priority: "high", category: "Recovery" },
        { title: "Glycogen Replenishment", description: `Estimated ${glycogenTime}h for full glycogen restoration. Consume 1.0-1.2g/kg carbohydrates within 30 min post-workout, then 0.5g/kg every 2 hours for 6 hours. Protein: 0.3-0.5g/kg immediately post-workout.`, priority: "medium", category: "Nutrition" },
        { title: "Clinical: Sports Medicine Monitoring", description: `Session load of ${sessionLoad} AU. Weekly estimated load: ~${weeklyLoad} AU. Athlete monitoring guidelines recommend ACWR (acute:chronic workload ratio) of 0.8-1.3 as safe zone. Overtraining risk: ${overtrainingRisk}%.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Session Load": `${sessionLoad} AU`, "Training Type": trainingType,
        "Recovery Hours": `${recoveryHours}h`, "Glycogen Time": `${glycogenTime}h`,
        "Muscle Recovery": `${muscleRecovery}/100`, "NS Recovery": `${nsRecovery}/100`,
        "Sleep Debt": `${sleepDebt}h`, "HRV": `${hrvVal} ms`,
        "Readiness": `${readinessScore}/100`, "Overtraining Risk": `${overtrainingRisk}%`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="workout-recovery-time" title="Workout Recovery Time Calculator"
      description="Predict recovery time after workouts using RPE, HRV, sleep quality, and training type. Includes glycogen restoration, CNS recovery, overtraining risk, and AI scheduling."
      icon={Timer} calculate={calculate} onClear={() => { setDuration(60); setRpe(7); setTrainingType("resistance"); setSleepHours(7); setHrv(50); setAge(30); setResult(null) }}
      values={[duration, rpe, trainingType, sleepHours, hrv, age]} result={result}
      seoContent={<SeoContentGenerator title="Workout Recovery Time Calculator" description="Estimate recovery time after workouts with HRV and sleep analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Workout Duration" val={duration} set={setDuration} min={10} max={300} suffix="min" />
          <NumInput label="RPE (1-10)" val={rpe} set={setRpe} min={1} max={10} />
        </div>
        <SelectInput label="Training Type" val={trainingType} set={setTrainingType} options={[
          { value: "resistance", label: "Resistance Training" }, { value: "hiit", label: "HIIT" },
          { value: "endurance", label: "Endurance (Run/Cycle)" }, { value: "plyometric", label: "Plyometric" },
          { value: "crossfit", label: "CrossFit" }, { value: "yoga", label: "Yoga/Mobility" },
          { value: "sports", label: "Sports (Basketball/Soccer)" }, { value: "swimming", label: "Swimming" }
        ]} />
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Sleep" val={sleepHours} set={setSleepHours} min={3} max={12} step={0.5} suffix="hrs" />
          <NumInput label="HRV" val={hrv} set={setHrv} min={10} max={150} suffix="ms" />
          <NumInput label="Age" val={age} set={setAge} min={15} max={80} suffix="yrs" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 14. HEART RATE RESERVE (HRR) CALCULATOR (Cardio Intensity Precision Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function HeartRateReserveCalculator() {
  const [restingHR, setRestingHR] = useState(65)
  const [maxHR, setMaxHR] = useState(190)
  const [age, setAge] = useState(30)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rhr = clamp(restingHR, 30, 120)
    const mhr = clamp(maxHR, 120, 220)
    const a = clamp(age, 15, 80)
    const w = clamp(weight, 30, 200)

    const hrr = mhr - rhr

    // Karvonen zones
    const zones = [
      { name: "Zone 1 — Very Light", pctLow: 50, pctHigh: 60, desc: "Recovery/warm-up", benefit: "Active recovery, blood flow" },
      { name: "Zone 2 — Light (Fat Burn)", pctLow: 60, pctHigh: 70, desc: "Fat oxidation peak", benefit: "Fat burning, aerobic base" },
      { name: "Zone 3 — Moderate (Aerobic)", pctLow: 70, pctHigh: 80, desc: "Cardiovascular fitness", benefit: "VO₂ improvement, endurance" },
      { name: "Zone 4 — Hard (Threshold)", pctLow: 80, pctHigh: 90, desc: "Lactate threshold", benefit: "Speed, anaerobic capacity" },
      { name: "Zone 5 — Maximum", pctLow: 90, pctHigh: 100, desc: "All-out effort", benefit: "Peak power, neuromuscular" }
    ].map(z => ({
      ...z,
      bpmLow: r0(hrr * (z.pctLow / 100) + rhr),
      bpmHigh: r0(hrr * (z.pctHigh / 100) + rhr)
    }))

    // Fat oxidation zone (typically 60-70% HRR)
    const fatOxLow = r0(hrr * 0.60 + rhr)
    const fatOxHigh = r0(hrr * 0.70 + rhr)

    // Anaerobic threshold estimate (~80-85% HRR)
    const atLow = r0(hrr * 0.80 + rhr)
    const atHigh = r0(hrr * 0.85 + rhr)

    // Fitness indicator from resting HR
    let fitnessLevel = "Average"
    let fitnessStatus: 'good' | 'normal' | 'warning' | 'danger' = "normal"
    if (rhr < 50) { fitnessLevel = "Excellent (Athlete)"; fitnessStatus = "good" }
    else if (rhr < 60) { fitnessLevel = "Good"; fitnessStatus = "good" }
    else if (rhr < 75) { fitnessLevel = "Average"; fitnessStatus = "normal" }
    else if (rhr < 90) { fitnessLevel = "Below Average"; fitnessStatus = "warning" }
    else { fitnessLevel = "Poor — Consult Physician"; fitnessStatus = "danger" }

    // Estimated VO₂ max from HR reserve (Uth formula approximation)
    const vo2Est = r1(15.3 * (mhr / rhr))

    // Calorie burn estimate per zone (per min)
    const calPerMinZ2 = r1(((zones[1].bpmLow + zones[1].bpmHigh) / 2 - 20) * w / 7000 * 5)
    const calPerMinZ4 = r1(((zones[3].bpmLow + zones[3].bpmHigh) / 2 - 20) * w / 7000 * 5)

    setResult({
      primaryMetric: { label: "Heart Rate Reserve", value: hrr, unit: "bpm", status: "good", description: `Max HR (${mhr}) − Resting HR (${rhr}) | Fitness: ${fitnessLevel}` },
      healthScore: r0(Math.min(100, (hrr / 140) * 80 + (rhr < 60 ? 20 : rhr < 75 ? 10 : 0))),
      metrics: [
        { label: "Heart Rate Reserve", value: hrr, unit: "bpm", status: "good" },
        { label: "Resting HR", value: rhr, unit: "bpm", status: fitnessStatus },
        { label: "Max HR", value: mhr, unit: "bpm", status: "normal" },
        { label: "Fitness Level", value: fitnessLevel, status: fitnessStatus },
        { label: "Est. VO₂ Max", value: vo2Est, unit: "mL/kg/min", status: vo2Est > 45 ? "good" : vo2Est > 35 ? "normal" : "warning" },
        { label: "Fat Oxidation Zone", value: `${fatOxLow}-${fatOxHigh}`, unit: "bpm", status: "good" },
        { label: "Anaerobic Threshold", value: `${atLow}-${atHigh}`, unit: "bpm", status: "normal" },
        ...zones.map(z => ({ label: z.name, value: `${z.bpmLow}-${z.bpmHigh}`, unit: "bpm", status: "normal" as const })),
        { label: "Cal/min (Zone 2)", value: calPerMinZ2, unit: "kcal", status: "normal" },
        { label: "Cal/min (Zone 4)", value: calPerMinZ4, unit: "kcal", status: "normal" }
      ],
      recommendations: [
        { title: "Personalized HR Zones", description: `Your HRR of ${hrr} bpm provides precise training zones via Karvonen method. Fat oxidation peaks at ${fatOxLow}-${fatOxHigh} bpm (Zone 2). Spend 80% of training in Zones 1-2 and 20% in Zones 4-5 for optimal adaptation (80/20 rule).`, priority: "high", category: "Training" },
        { title: "Fat Burn vs Cardio", description: `Zone 2 (${zones[1].bpmLow}-${zones[1].bpmHigh} bpm): Maximum fat oxidation — best for weight loss. Zone 4 (${zones[3].bpmLow}-${zones[3].bpmHigh} bpm): Higher total calories but more glycogen use. For weight loss, Zone 2 is more sustainable and uses a higher percentage of fat.`, priority: "high", category: "Weight Management" },
        { title: "Improve Your HRR", description: `Higher HRR = better cardiovascular fitness. Improve through: consistent Zone 2 training (3-5x/week), interval training (1-2x/week), adequate sleep, stress management. Resting HR can improve by 5-10 bpm with 8-12 weeks of consistent training.`, priority: "medium", category: "Fitness" },
        { title: "Clinical: Cardiac Rehab", description: `For cardiac rehabilitation, initial exercise should be at 40-60% HRR (${r0(hrr * 0.4 + rhr)}-${r0(hrr * 0.6 + rhr)} bpm). Progress gradually over 12 weeks. Monitor for abnormal rhythm, excessive breathlessness, or chest discomfort.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Max HR": `${mhr} bpm`, "Resting HR": `${rhr} bpm`, "HRR": `${hrr} bpm`,
        "Fat Zone": `${fatOxLow}-${fatOxHigh} bpm`, "AT Zone": `${atLow}-${atHigh} bpm`,
        "VO₂ Max (est)": `${vo2Est} mL/kg/min`, "Fitness": fitnessLevel,
        ...Object.fromEntries(zones.map(z => [z.name, `${z.bpmLow}-${z.bpmHigh} bpm`]))
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="heart-rate-reserve" title="Heart Rate Reserve (HRR) Calculator"
      description="Calculate HRR and personalized Karvonen training zones. Includes fat oxidation zone, anaerobic threshold, VO₂ estimation, and cardiac rehab guidelines."
      icon={Heart} calculate={calculate} onClear={() => { setRestingHR(65); setMaxHR(190); setAge(30); setWeight(70); setResult(null) }}
      values={[restingHR, maxHR, age, weight]} result={result}
      seoContent={<SeoContentGenerator title="Heart Rate Reserve Calculator" description="Calculate HRR and Karvonen training zones." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Resting Heart Rate" val={restingHR} set={setRestingHR} min={30} max={120} suffix="bpm" />
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={120} max={220} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={15} max={80} suffix="years" />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 15. MAX HEART RATE CALCULATOR (Cardiac Capacity Estimator)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedMaxHeartRateCalculator() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [fitnessLevel, setFitnessLevel] = useState("moderate")
  const [restingHR, setRestingHR] = useState(65)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    const rhr = clamp(restingHR, 30, 120)
    const male = gender === "male"

    // Multiple formulas
    const f220 = 220 - a
    const tanaka = r0(208 - 0.7 * a)
    const gulati = r0(206 - 0.88 * a) // women-specific
    const inbar = r0(205.8 - 0.685 * a)
    const gelish = r0(207 - 0.7 * a) // gender-neutral
    const fairbarn = male ? r0(208.7 - 0.73 * a) : r0(209.2 - 0.76 * a)

    // Best formula selection
    const bestMHR = male ? tanaka : gulati
    const selectedFormula = male ? "Tanaka (2001)" : "Gulati (Women, 2010)"

    // Fitness adjustment (+5 for athletes, -5 for sedentary)
    const fitnessAdj = fitnessLevel === "athlete" ? 5 : fitnessLevel === "active" ? 2 : fitnessLevel === "sedentary" ? -5 : 0
    const adjustedMHR = bestMHR + fitnessAdj

    // Safe HR ceiling (95% of estimated MHR)
    const safeHRCeiling = r0(adjustedMHR * 0.95)

    // Risk threshold
    const riskThreshold = r0(adjustedMHR * 0.85)

    // Cardiac strain probability (simplified)
    const cardiacStrain = a > 50 ? r0(Math.min(40, (a - 50) * 1.5 + (rhr > 80 ? 10 : 0))) :
      rhr > 85 ? r0(15 + (rhr - 85) * 0.5) : r0(Math.max(3, a * 0.15))

    // Training zones based on adjusted MHR
    const zones = [
      { name: "Z1 Recovery", pct: "50-60%", low: r0(adjustedMHR * 0.5), high: r0(adjustedMHR * 0.6) },
      { name: "Z2 Fat Burn", pct: "60-70%", low: r0(adjustedMHR * 0.6), high: r0(adjustedMHR * 0.7) },
      { name: "Z3 Aerobic", pct: "70-80%", low: r0(adjustedMHR * 0.7), high: r0(adjustedMHR * 0.8) },
      { name: "Z4 Threshold", pct: "80-90%", low: r0(adjustedMHR * 0.8), high: r0(adjustedMHR * 0.9) },
      { name: "Z5 Max", pct: "90-100%", low: r0(adjustedMHR * 0.9), high: adjustedMHR }
    ]

    // AI arrhythmia flag
    const arrhythmiaAlert = rhr > 100 ? "⚠ Resting HR >100 bpm — tachycardia. Consult a cardiologist before intense exercise."
      : rhr < 40 && fitnessLevel !== "athlete" ? "⚠ Resting HR <40 bpm — bradycardia. If not a trained athlete, seek medical evaluation."
      : null

    setResult({
      primaryMetric: { label: "Max Heart Rate", value: adjustedMHR, unit: "bpm", status: "good", description: `${selectedFormula} | Safe ceiling: ${safeHRCeiling} bpm` },
      healthScore: r0(Math.min(100, 100 - cardiacStrain)),
      metrics: [
        { label: "Adjusted Max HR", value: adjustedMHR, unit: "bpm", status: "good" },
        { label: "Formula: 220−Age", value: f220, unit: "bpm", status: "normal" },
        { label: "Formula: Tanaka", value: tanaka, unit: "bpm", status: "normal" },
        { label: "Formula: Gulati (Women)", value: gulati, unit: "bpm", status: "normal" },
        { label: "Formula: Inbar", value: inbar, unit: "bpm", status: "normal" },
        { label: "Formula: Gelish", value: gelish, unit: "bpm", status: "normal" },
        { label: "Formula: Fairbarn", value: fairbarn, unit: "bpm", status: "normal" },
        { label: "Safe HR Ceiling (95%)", value: safeHRCeiling, unit: "bpm", status: "good" },
        { label: "Risk Threshold (85%)", value: riskThreshold, unit: "bpm", status: "warning" },
        { label: "Cardiac Strain Probability", value: `${cardiacStrain}%`, status: cardiacStrain < 15 ? "good" : cardiacStrain < 30 ? "warning" : "danger" },
        { label: "Fitness Adjustment", value: fitnessAdj > 0 ? `+${fitnessAdj}` : `${fitnessAdj}`, unit: "bpm", status: "normal" },
        ...zones.map(z => ({ label: z.name, value: `${z.low}-${z.high}`, unit: "bpm", status: "normal" as const })),
        ...(arrhythmiaAlert ? [{ label: "AI Alert", value: arrhythmiaAlert, status: "danger" as const }] : [])
      ],
      recommendations: [
        { title: "Best Formula Selection", description: `For ${male ? "males" : "females"}, age ${a}: ${selectedFormula} is most accurate. The classic 220−age formula overestimates MHR in older adults. Tanaka (2001) is validated across 18,712 subjects. For women, Gulati (2010) is specific to female cardiac physiology.`, priority: "high", category: "Accuracy" },
        { title: "Safe Training Ceiling", description: `Stay below ${safeHRCeiling} bpm (95% MHR) for safe training. Exceeding ${adjustedMHR} bpm significantly increases cardiac risk. ${cardiacStrain > 20 ? "Your cardiac strain risk is elevated — focus on Zone 2-3 training." : "Your cardiac strain risk is low."}`, priority: "high", category: "Safety" },
        { title: "Clinical: Cardiology Screening", description: `For individuals ${a >= 40 ? "aged 40+, exercise stress testing is recommended before starting vigorous exercise programs" : "under 40, screening is recommended if you have family history of heart disease, chest pain, or syncope"}. Max HR calculator provides estimates only — true MHR requires supervised exercise testing.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Age": a, "Gender": gender, "Resting HR": `${rhr} bpm`,
        "220−Age": `${f220}`, "Tanaka": `${tanaka}`, "Gulati": `${gulati}`,
        "Adjusted MHR": `${adjustedMHR} bpm`, "Safe Ceiling": `${safeHRCeiling} bpm`,
        "Cardiac Strain": `${cardiacStrain}%`,
        ...Object.fromEntries(zones.map(z => [z.name, `${z.low}-${z.high} bpm`]))
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="max-heart-rate-calculator" title="Max Heart Rate Calculator"
      description="Estimate maximum heart rate using 6 validated formulas (Tanaka, Gulati, Inbar, Gelish, Fairbarn). Includes safe HR ceiling, cardiac strain risk, and AI arrhythmia alerts."
      icon={Heart} calculate={calculate} onClear={() => { setAge(30); setGender("male"); setFitnessLevel("moderate"); setRestingHR(65); setResult(null) }}
      values={[age, gender, fitnessLevel, restingHR]} result={result}
      seoContent={<SeoContentGenerator title="Max Heart Rate Calculator" description="Estimate MHR with multiple formulas and cardiac safety analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Fitness Level" val={fitnessLevel} set={setFitnessLevel} options={[
            { value: "sedentary", label: "Sedentary" }, { value: "moderate", label: "Moderately Active" },
            { value: "active", label: "Active" }, { value: "athlete", label: "Trained Athlete" }
          ]} />
          <NumInput label="Resting Heart Rate" val={restingHR} set={setRestingHR} min={30} max={120} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 16. LACTATE THRESHOLD ESTIMATOR (Endurance Efficiency Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function LactateThresholdCalculator() {
  const [maxHR, setMaxHR] = useState(190)
  const [restingHR, setRestingHR] = useState(60)
  const [vo2max, setVo2max] = useState(45)
  const [trialDistKm, setTrialDistKm] = useState(5)
  const [trialTimeMin, setTrialTimeMin] = useState(25)
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const mhr = clamp(maxHR, 120, 220)
    const rhr = clamp(restingHR, 30, 120)
    const vo2 = clamp(vo2max, 20, 90)
    const dist = clamp(trialDistKm, 1, 42.2)
    const time = clamp(trialTimeMin, 5, 360)
    const a = clamp(age, 15, 80)

    const hrr = mhr - rhr

    // LT Heart Rate estimate (~80-87% of MHR, or 75-85% HRR)
    const ltHrPctMHR = vo2 > 55 ? 0.87 : vo2 > 45 ? 0.84 : vo2 > 35 ? 0.81 : 0.78
    const ltHR = r0(mhr * ltHrPctMHR)
    const ltHRR = r0(hrr * (ltHrPctMHR - 0.02) + rhr)

    // LT Pace from time trial (LT pace ≈ 5K pace + 15-30 sec/km, or ~85-88% of 5K pace)
    const trialPaceSec = (time * 60) / dist  // sec/km
    const ltPaceSec = r0(trialPaceSec * (dist <= 5 ? 1.08 : dist <= 10 ? 1.03 : 1.0))
    const ltPaceMin = Math.floor(ltPaceSec / 60)
    const ltPaceRemSec = r0(ltPaceSec % 60)

    // Zone 3-4 boundary
    const z3Top = r0(mhr * (ltHrPctMHR - 0.03))
    const z4Bottom = ltHR
    const z4Top = r0(mhr * (ltHrPctMHR + 0.05))

    // Endurance capacity estimate
    const enduranceCapacity = r0(Math.min(100, (vo2 / 60) * 70 + ((220 - a - rhr) / 150) * 30))

    // Fatigue accumulation model (simplified: how long can sustain LT pace)
    const ltSustainMin = r0(Math.min(90, vo2 * 0.8 + (mhr - ltHR) * 0.5))

    // Race predictions from LT
    const races = [
      { name: "5K", mult: 0.94 }, { name: "10K", mult: 0.97 },
      { name: "Half Marathon", mult: 1.06 }, { name: "Marathon", mult: 1.12 }
    ].map(r => {
      const racePace = ltPaceSec * r.mult
      const d = r.name === "5K" ? 5 : r.name === "10K" ? 10 : r.name === "Half Marathon" ? 21.1 : 42.2
      const totalSec = racePace * d
      const h = Math.floor(totalSec / 3600)
      const m = Math.floor((totalSec % 3600) / 60)
      const s = r0(totalSec % 60)
      return { name: r.name, time: h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`, pace: `${Math.floor(racePace / 60)}:${r0(racePace % 60).toString().padStart(2, "0")} /km` }
    })

    // Improvement plan
    const ltImprovement = vo2 < 40 ? "Focus on building aerobic base (Zone 2) for 8-12 weeks before LT-specific training."
      : vo2 < 50 ? "Add 1-2 tempo runs per week at LT pace (20-30 min). Include long runs at easy pace."
      : "Advanced threshold training: cruise intervals (4×8 min at LT), progressive tempo runs, and tempo + long run combos."

    setResult({
      primaryMetric: { label: "Lactate Threshold HR", value: ltHR, unit: "bpm", status: "good", description: `LT Pace: ${ltPaceMin}:${ltPaceRemSec.toString().padStart(2, "0")} /km | ~${r0(ltHrPctMHR * 100)}% MHR` },
      healthScore: enduranceCapacity,
      metrics: [
        { label: "LT Heart Rate", value: ltHR, unit: "bpm", status: "good" },
        { label: "LT % of Max HR", value: `${r0(ltHrPctMHR * 100)}%`, status: "normal" },
        { label: "LT Pace", value: `${ltPaceMin}:${ltPaceRemSec.toString().padStart(2, "0")}`, unit: "/km", status: "good" },
        { label: "Zone 3-4 Boundary", value: `${z3Top}-${z4Bottom}`, unit: "bpm", status: "normal" },
        { label: "Zone 4 Range", value: `${z4Bottom}-${z4Top}`, unit: "bpm", status: "normal" },
        { label: "Endurance Capacity", value: enduranceCapacity, unit: "/100", status: enduranceCapacity > 70 ? "good" : enduranceCapacity > 45 ? "normal" : "warning" },
        { label: "LT Sustainability", value: `~${ltSustainMin}`, unit: "min", status: ltSustainMin > 50 ? "good" : ltSustainMin > 30 ? "normal" : "warning" },
        { label: "VO₂ Max", value: vo2, unit: "mL/kg/min", status: vo2 > 50 ? "good" : vo2 > 35 ? "normal" : "warning" },
        ...races.map(r => ({ label: `${r.name} Prediction`, value: `${r.time} (${r.pace})`, status: "normal" as const }))
      ],
      recommendations: [
        { title: "AI Threshold Improvement Plan", description: ltImprovement, priority: "high", category: "Training" },
        { title: "LT Training Zones", description: `Train at ${ltHR}±3 bpm (${ltPaceMin}:${ltPaceRemSec.toString().padStart(2, "0")} /km) for 20-40 min tempo runs. Zone 3-4 boundary: ${z3Top}-${z4Bottom} bpm. Training at LT improves it by 5-10% in 6-8 weeks.`, priority: "high", category: "Threshold" },
        { title: "Race Pacing Strategy", description: `Half marathon: Start at LT pace minus 5 sec/km. Marathon: Start 10-15 sec/km slower than LT pace. Negative splits (faster second half) are optimal for endurance races.`, priority: "medium", category: "Racing" },
        { title: "Clinical: Cardiopulmonary Evaluation", description: `LT testing is a key metric in cardiopulmonary exercise testing (CPET). LT at ${r0(ltHrPctMHR * 100)}% MHR with VO₂ max of ${vo2} mL/kg/min. Used for cardiac rehab exercise prescription and pulmonary disease assessment.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "LT HR": `${ltHR} bpm (${r0(ltHrPctMHR * 100)}% MHR)`,
        "LT Pace": `${ltPaceMin}:${ltPaceRemSec.toString().padStart(2, "0")} /km`,
        "VO₂ Max": `${vo2} mL/kg/min`, "Endurance": `${enduranceCapacity}/100`,
        "Sustainability": `~${ltSustainMin} min`,
        ...Object.fromEntries(races.map(r => [r.name, r.time]))
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="lactate-threshold" title="Lactate Threshold Estimator"
      description="Estimate your lactate threshold HR and pace from VO₂ max and time trial data. Includes race predictions, training zones, and AI improvement plans."
      icon={TrendingUp} calculate={calculate} onClear={() => { setMaxHR(190); setRestingHR(60); setVo2max(45); setTrialDistKm(5); setTrialTimeMin(25); setAge(30); setResult(null) }}
      values={[maxHR, restingHR, vo2max, trialDistKm, trialTimeMin, age]} result={result}
      seoContent={<SeoContentGenerator title="Lactate Threshold Estimator" description="Estimate lactate threshold from HR, pace, and VO₂ max data." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={120} max={220} suffix="bpm" />
          <NumInput label="Resting Heart Rate" val={restingHR} set={setRestingHR} min={30} max={120} suffix="bpm" />
        </div>
        <NumInput label="VO₂ Max" val={vo2max} set={setVo2max} min={20} max={90} step={0.5} suffix="mL/kg/min" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Time Trial Distance" val={trialDistKm} set={setTrialDistKm} min={1} max={42.2} step={0.1} suffix="km" />
          <NumInput label="Time Trial Time" val={trialTimeMin} set={setTrialTimeMin} min={5} max={360} step={0.5} suffix="min" />
        </div>
        <NumInput label="Age" val={age} set={setAge} min={15} max={80} suffix="years" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17. RPE CALCULATOR (Subjective Load Quantifier)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function RPECalculator() {
  const [rpe, setRpe] = useState(7)
  const [duration, setDuration] = useState(60)
  const [weekSessions, setWeekSessions] = useState(4)
  const [prevWeekLoad, setPrevWeekLoad] = useState(2000)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rpeVal = clamp(rpe, 1, 10)
    const dur = clamp(duration, 5, 300)
    const sessions = clamp(weekSessions, 1, 14)
    const prevLoad = clamp(prevWeekLoad, 100, 20000)

    // Session load (Foster's sRPE method)
    const sessionLoad = r0(rpeVal * dur)

    // Weekly load
    const weeklyLoad = r0(sessionLoad * sessions)

    // Acute:Chronic Workload Ratio (ACWR)
    // Acute = current week, Chronic = 4-week average (use prev as proxy)
    const acwr = r2(weeklyLoad / Math.max(1, prevLoad))

    // Injury risk from ACWR
    let acwrStatus: 'good' | 'warning' | 'danger' = "good"
    let acwrLabel = "Safe Zone"
    if (acwr < 0.8) { acwrStatus = "warning"; acwrLabel = "Under-training (detraining risk)" }
    else if (acwr <= 1.3) { acwrStatus = "good"; acwrLabel = "Optimal Zone (0.8 - 1.3)" }
    else if (acwr <= 1.5) { acwrStatus = "warning"; acwrLabel = "Danger Zone — Injury risk rising" }
    else { acwrStatus = "danger"; acwrLabel = "High Injury Risk (>1.5)" }

    // Injury risk probability
    const injuryRisk = acwr > 1.5 ? r0(Math.min(85, (acwr - 1) * 80))
      : acwr > 1.3 ? r0((acwr - 1.0) * 60)
      : acwr < 0.8 ? r0(20 + (0.8 - acwr) * 30)
      : r0(Math.max(5, acwr * 8))

    // Fatigue prediction
    const fatigueScore = r0(Math.min(100, sessionLoad / 8))

    // Monotony (same load every day = high monotony)
    const monotony = r1(sessionLoad / Math.max(1, (sessionLoad * 0.15)))
    const strain = r0(weeklyLoad * Math.min(10, monotony))

    // Burnout alert
    const burnoutRisk = weeklyLoad > 4000 ? "High" : weeklyLoad > 2500 ? "Moderate" : "Low"
    const burnoutStatus: 'good' | 'warning' | 'danger' = weeklyLoad > 4000 ? "danger" : weeklyLoad > 2500 ? "warning" : "good"

    // RPE description
    const rpeDescriptions: Record<number, string> = {
      1: "Very Light", 2: "Light", 3: "Light-Moderate", 4: "Moderate",
      5: "Moderate-Hard", 6: "Hard", 7: "Very Hard", 8: "Very Hard+",
      9: "Near Maximum", 10: "Maximum Effort"
    }

    setResult({
      primaryMetric: { label: "Session Load", value: sessionLoad, unit: "AU", status: fatigueScore > 70 ? "danger" : fatigueScore > 40 ? "warning" : "good", description: `RPE ${rpeVal} (${rpeDescriptions[rpeVal] || ""}) × ${dur} min | ACWR: ${acwr}` },
      healthScore: r0(Math.max(0, 100 - fatigueScore)),
      metrics: [
        { label: "Session Load (sRPE)", value: sessionLoad, unit: "AU", status: sessionLoad < 400 ? "good" : sessionLoad < 700 ? "warning" : "danger" },
        { label: "RPE Level", value: `${rpeVal}/10 — ${rpeDescriptions[rpeVal] || ""}`, status: rpeVal <= 6 ? "good" : rpeVal <= 8 ? "warning" : "danger" },
        { label: "Weekly Load", value: weeklyLoad, unit: "AU", status: weeklyLoad < 2000 ? "good" : weeklyLoad < 3500 ? "warning" : "danger" },
        { label: "ACWR", value: acwr, status: acwrStatus },
        { label: "ACWR Zone", value: acwrLabel, status: acwrStatus },
        { label: "Injury Risk", value: `${injuryRisk}%`, status: injuryRisk < 20 ? "good" : injuryRisk < 45 ? "warning" : "danger" },
        { label: "Fatigue Score", value: `${fatigueScore}/100`, status: fatigueScore < 40 ? "good" : fatigueScore < 70 ? "warning" : "danger" },
        { label: "Weekly Training Strain", value: strain.toLocaleString(), unit: "AU", status: strain < 3000 ? "good" : strain < 6000 ? "warning" : "danger" },
        { label: "Burnout Risk", value: burnoutRisk, status: burnoutStatus },
        { label: "Load Change vs Prev Week", value: `${weeklyLoad > prevLoad ? "+" : ""}${r0(weeklyLoad - prevLoad)}`, unit: "AU", status: Math.abs(weeklyLoad - prevLoad) / Math.max(1, prevLoad) < 0.1 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "ACWR Analysis", description: `ACWR of ${acwr}: ${acwrLabel}. ${acwr > 1.3 ? "⚠ Reduce training load by " + r0((acwr - 1.2) / acwr * 100) + "% to return to safe zone. Rapid load spikes are the #1 predictor of soft-tissue injuries." : acwr < 0.8 ? "Under-training risk. Gradually increase weekly load by 5-10% per week." : "✔ You are in the optimal ACWR zone (0.8-1.3). Continue progression."}`, priority: "high", category: "Load Management" },
        { title: "AI Burnout Alert", description: `Weekly load: ${weeklyLoad} AU. ${burnoutRisk === "High" ? "⚠ High burnout risk detected. Implement a deload week (reduce load by 40-50%). Non-functional overreaching can take 2-4 weeks to recover from." : burnoutRisk === "Moderate" ? "Monitor fatigue markers (sleep quality, motivation, HRV). Consider a light week soon." : "Load is sustainable. Progress cautiously."}`, priority: "high", category: "Recovery" },
        { title: "Progressive Load Planning", description: `Next week target load: ${r0(weeklyLoad * 1.05)}-${r0(weeklyLoad * 1.10)} AU (5-10% increase). Distribute across ${sessions} sessions at RPE ${Math.min(10, rpeVal + 0.5)}-${rpeVal}. The 10% rule: never increase weekly load by more than 10%.`, priority: "medium", category: "Progression" },
        { title: "Clinical: Athlete Monitoring", description: `Foster's sRPE method (RPE × duration) is validated for monitoring training load in team and individual sports. ACWR of ${acwr} ${acwr > 1.5 ? "indicates significantly elevated injury risk — require clinical assessment" : "is within acceptable parameters"}. Used in professional sports science for return-to-play protocols.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "RPE": `${rpeVal}/10`, "Duration": `${dur} min`, "Session Load": `${sessionLoad} AU`,
        "Weekly Load": `${weeklyLoad} AU`, "Previous Week": `${prevLoad} AU`,
        "ACWR": acwr, "ACWR Zone": acwrLabel, "Injury Risk": `${injuryRisk}%`,
        "Fatigue": `${fatigueScore}/100`, "Burnout": burnoutRisk
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="rpe-calculator" title="RPE Calculator (Session Load)"
      description="Quantify training load from RPE and session duration. Track ACWR (Acute:Chronic Workload Ratio), injury risk, fatigue, and burnout probability with AI alerts."
      icon={Activity} calculate={calculate} onClear={() => { setRpe(7); setDuration(60); setWeekSessions(4); setPrevWeekLoad(2000); setResult(null) }}
      values={[rpe, duration, weekSessions, prevWeekLoad]} result={result}
      seoContent={<SeoContentGenerator title="RPE Calculator" description="Convert RPE to session load and track weekly ACWR for injury prevention." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="RPE (1-10)" val={rpe} set={setRpe} min={1} max={10} />
          <NumInput label="Workout Duration" val={duration} set={setDuration} min={5} max={300} suffix="min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sessions This Week" val={weekSessions} set={setWeekSessions} min={1} max={14} suffix="sessions" />
          <NumInput label="Previous Week Total Load" val={prevWeekLoad} set={setPrevWeekLoad} min={100} max={20000} suffix="AU" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 18. CALORIES BURNED WALKING (Low-Impact Energy Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedCaloriesBurnedWalkingCalculator() {
  const [weight, setWeight] = useState(70)
  const [distance, setDistance] = useState(3)
  const [speed, setSpeed] = useState(5)
  const [terrain, setTerrain] = useState("flat")
  const [duration, setDuration] = useState(36)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 200)
    const d = clamp(distance, 0.1, 50)
    const spd = clamp(speed, 2, 10)
    const dur = clamp(duration, 5, 480)

    // MET by speed
    const metBySpeed: Record<string, number> = { "2": 2.0, "3": 2.5, "4": 3.0, "5": 3.8, "6": 5.0, "7": 6.3, "8": 8.0 }
    const closestSpeed = Object.keys(metBySpeed).reduce((a, b) => Math.abs(Number(b) - spd) < Math.abs(Number(a) - spd) ? b : a)
    let met = metBySpeed[closestSpeed] || 3.8

    // Terrain correction
    const terrainMults: Record<string, number> = { flat: 1.0, uphill_mild: 1.3, uphill_steep: 1.7, downhill: 0.85, sand: 1.5, treadmill: 0.95, trail: 1.2 }
    const terrainMult = terrainMults[terrain] || 1.0
    met *= terrainMult

    // MET-based calories
    const calories = r0(met * w * (dur / 60))

    // Fat oxidation (walking is primarily fat-burning: ~50-65% of calories from fat)
    const fatPct = met < 4 ? 65 : met < 6 ? 55 : 45
    const fatCalories = r0(calories * fatPct / 100)
    const fatGrams = r1(fatCalories / 9)

    // Weight loss projection (weekly, assuming 5x/week)
    const weeklyCalories = calories * 5
    const monthlyFatLossKg = r2(weeklyCalories * 4 / 7700) // 7700 kcal per kg fat

    // Incline correction
    const inclineExtra = terrain.includes("uphill") ? r0(calories * (terrainMult - 1)) : 0

    // Gait efficiency (estimated cal/km)
    const calPerKm = r1(calories / d)
    const gaitEfficiency = calPerKm < 50 ? "Efficient" : calPerKm < 70 ? "Average" : "Needs improvement"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status: "good", description: `${d} km at ${spd} km/h on ${terrain} | MET: ${r1(met)}` },
      healthScore: r0(Math.min(100, calories / 3)),
      metrics: [
        { label: "Total Calories", value: calories, unit: "kcal", status: "good" },
        { label: "MET Value", value: r1(met), status: "normal" },
        { label: "Fat Calories", value: fatCalories, unit: "kcal", status: "good" },
        { label: "Fat Burned", value: fatGrams, unit: "g", status: "good" },
        { label: "Fat Oxidation %", value: `${fatPct}%`, status: "good" },
        { label: "Calories per km", value: calPerKm, unit: "kcal/km", status: "normal" },
        { label: "Gait Efficiency", value: gaitEfficiency, status: gaitEfficiency === "Efficient" ? "good" : "normal" },
        { label: "Speed", value: spd, unit: "km/h", status: "normal" },
        { label: "Terrain Multiplier", value: `×${terrainMult}`, status: "normal" },
        { label: "Incline Bonus", value: inclineExtra, unit: "kcal", status: "normal" },
        { label: "Monthly Fat Loss (5x/wk)", value: monthlyFatLossKg, unit: "kg", status: "good" },
        { label: "Weekly Walking Calories", value: weeklyCalories, unit: "kcal", status: "good" }
      ],
      recommendations: [
        { title: "AI Gait Efficiency Score", description: `Calorie efficiency: ${calPerKm} kcal/km (${gaitEfficiency}). ${gaitEfficiency === "Efficient" ? "Your walking is energy-efficient. Consider increasing speed or incline for greater calorie burn." : "Try shorter, faster strides and engage your arms more for better efficiency."}`, priority: "high", category: "Efficiency" },
        { title: "Fat Burn Optimization", description: `Walking at ${spd} km/h burns ~${fatPct}% fat. This is ${fatPct > 55 ? "excellent for fat loss — walking is one of the best fat-oxidation exercises" : "moderate fat oxidation — slow down slightly for a higher fat percentage, or speed up for more total calories"}. ${fatGrams}g fat burned in this session.`, priority: "high", category: "Fat Loss" },
        { title: "Weight Loss Projection", description: `At 5 walks/week: ~${weeklyCalories} kcal/week → ~${monthlyFatLossKg} kg fat loss/month (assuming no dietary changes). Combined with a 250 kcal daily deficit: ~${r2(monthlyFatLossKg + 1.0)} kg/month total weight loss.`, priority: "medium", category: "Weight Management" },
        { title: "Clinical: Obesity Intervention", description: `Walking is first-line exercise therapy for obesity. MET of ${r1(met)} is classified as ${met < 3 ? "light" : met < 6 ? "moderate" : "vigorous"} activity. WHO recommends 150 min/week moderate activity. Your current session covers ${r0(dur / 150 * 100)}% of weekly target.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Distance": `${d} km`, "Speed": `${spd} km/h`, "Duration": `${dur} min`,
        "Terrain": terrain, "MET": r1(met), "Total Calories": `${calories} kcal`,
        "Fat Calories": `${fatCalories} kcal (${fatPct}%)`, "Fat Grams": `${fatGrams} g`,
        "Cal/km": calPerKm, "Monthly Projection": `${monthlyFatLossKg} kg`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="calories-burned-walking" title="Calories Burned Walking Calculator"
      description="Calculate walking calorie burn with MET-based model, terrain correction, fat oxidation analysis, gait efficiency score, and weight loss projections."
      icon={Footprints} calculate={calculate} onClear={() => { setWeight(70); setDistance(3); setSpeed(5); setTerrain("flat"); setDuration(36); setResult(null) }}
      values={[weight, distance, speed, terrain, duration]} result={result}
      seoContent={<SeoContentGenerator title="Calories Burned Walking" description="Calculate walking calories with terrain, speed, and fat burn analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
          <NumInput label="Distance" val={distance} set={setDistance} min={0.1} max={50} step={0.1} suffix="km" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Speed" val={speed} set={setSpeed} min={2} max={10} step={0.5} suffix="km/h" />
          <NumInput label="Duration" val={duration} set={setDuration} min={5} max={480} suffix="min" />
        </div>
        <SelectInput label="Terrain" val={terrain} set={setTerrain} options={[
          { value: "flat", label: "Flat Ground" }, { value: "uphill_mild", label: "Mild Uphill (3-5%)" },
          { value: "uphill_steep", label: "Steep Uphill (8%+)" }, { value: "downhill", label: "Downhill" },
          { value: "sand", label: "Sand/Beach" }, { value: "treadmill", label: "Treadmill" }, { value: "trail", label: "Trail/Uneven" }
        ]} />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 19. CALORIES BURNED RUNNING (High-Intensity Energy Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedCaloriesBurnedRunningCalculator() {
  const [weight, setWeight] = useState(70)
  const [distance, setDistance] = useState(5)
  const [paceMinPerKm, setPaceMinPerKm] = useState(6)
  const [elevation, setElevation] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 200)
    const d = clamp(distance, 0.5, 100)
    const pace = clamp(paceMinPerKm, 3, 15)
    const elev = clamp(elevation, 0, 2000)

    const dur = d * pace // total minutes
    const speedKph = 60 / pace

    // MET from speed
    const met = speedKph < 8 ? 7.0 : speedKph < 10 ? 9.8 : speedKph < 12 ? 11.0 : speedKph < 14 ? 12.5 : 14.5

    // Base calories (distance-based: ~1 kcal/kg/km is approx)
    const baseCal = r0(met * w * (dur / 60))

    // Elevation correction (~5 extra kcal per 10m elevation gain per 70kg)
    const elevCal = r0(elev * 0.5 * (w / 70))
    const totalCal = baseCal + elevCal

    // EPOC (excess post-exercise oxygen consumption: 6-15% for moderate, 15-25% for intense running)
    const epocPct = speedKph > 12 ? 20 : speedKph > 10 ? 14 : 8
    const epocCal = r0(totalCal * epocPct / 100)

    // Glycogen depletion estimate
    const glycogenUsedG = r0(totalCal * 0.7 / 4) // ~70% from carbs, 4 kcal/g
    const glycogenPct = r0(Math.min(100, glycogenUsedG / 4.5)) // ~450g total stores

    // Overuse injury risk
    const weeklyDist = d * 4 // assume 4 runs
    const injuryRisk = weeklyDist > 60 ? "High" : weeklyDist > 40 ? "Moderate" : "Low"
    const injuryStatus: 'good' | 'warning' | 'danger' = weeklyDist > 60 ? "danger" : weeklyDist > 40 ? "warning" : "good"

    // Performance stress meter
    const stressScore = r0(Math.min(100, (met / 15) * 50 + (dur / 120) * 30 + (elev / 500) * 20))

    // Race calorie strategy
    const marathonCal = r0(met * w * (42.2 * pace / 60))
    const halfCal = r0(met * w * (21.1 * pace / 60))

    setResult({
      primaryMetric: { label: "Calories Burned", value: totalCal, unit: "kcal", status: "good", description: `${d}km at ${pace} min/km | EPOC: +${epocCal} kcal after` },
      healthScore: r0(Math.min(100, totalCal / 5)),
      metrics: [
        { label: "Total Calories (run)", value: baseCal, unit: "kcal", status: "good" },
        { label: "Elevation Bonus", value: elevCal, unit: "kcal", status: "normal" },
        { label: "Grand Total", value: totalCal, unit: "kcal", status: "good" },
        { label: "EPOC (afterburn)", value: epocCal, unit: "kcal", status: "good" },
        { label: "EPOC %", value: `${epocPct}%`, status: "normal" },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Speed", value: r1(speedKph), unit: "km/h", status: "normal" },
        { label: "Duration", value: r0(dur), unit: "min", status: "normal" },
        { label: "Glycogen Used", value: glycogenUsedG, unit: "g", status: glycogenPct < 50 ? "good" : glycogenPct < 75 ? "warning" : "danger" },
        { label: "Glycogen Depletion", value: `${glycogenPct}%`, status: glycogenPct < 50 ? "good" : glycogenPct < 75 ? "warning" : "danger" },
        { label: "Performance Stress", value: `${stressScore}/100`, status: stressScore < 40 ? "good" : stressScore < 70 ? "warning" : "danger" },
        { label: "Overuse Injury Risk", value: `${injuryRisk} (${r0(weeklyDist)}km/wk est.)`, status: injuryStatus },
        { label: "Half Marathon Calories", value: halfCal, unit: "kcal", status: "normal" },
        { label: "Marathon Calories", value: marathonCal, unit: "kcal", status: "normal" }
      ],
      recommendations: [
        { title: "AI Endurance Mode", description: `Performance stress: ${stressScore}/100. ${stressScore > 70 ? "⚠ High stress run — ensure 48h recovery before next high-intensity session." : "Manageable stress level."} EPOC adds ${epocCal} kcal of afterburn over 24-48 hours — your total energy expenditure is ${totalCal + epocCal} kcal.`, priority: "high", category: "Performance" },
        { title: "Race Calorie Strategy", description: `Half marathon at this pace: ~${halfCal} kcal. Marathon: ~${marathonCal} kcal. Rule of thumb: consume 30-60g carbs/hour during races >90 min. For marathon: start fueling at km 5 with gels/drinks. ${glycogenPct > 60 ? "⚠ This run significantly depletes glycogen — replenish within 30 min post-run." : ""}`, priority: "high", category: "Fueling" },
        { title: "Overuse Prevention", description: `Estimated weekly distance: ${r0(weeklyDist)} km (4 runs). ${injuryRisk === "High" ? "⚠ Over 60 km/week increases stress fracture risk. Consider reducing volume or adding cross-training." : injuryRisk === "Moderate" ? "Monitor for shin splints, knee pain, or Achilles issues. 10% rule: increase weekly km by max 10%." : "Good volume range. Ensure 1-2 easy days between hard runs."}`, priority: "medium", category: "Injury Prevention" },
        { title: "Clinical: Cardio Fitness", description: `Running at MET ${met} = ${met > 10 ? "vigorous" : "moderate"} intensity. ${dur} min provides ${r0(dur / 30)} × minimum weekly moderate exercise recommendation. Ideal for cardiovascular disease prevention (RR reduction: 30-45% with regular running).`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Distance": `${d} km`, "Pace": `${pace} min/km`, "Speed": `${r1(speedKph)} km/h`,
        "Duration": `${r0(dur)} min`, "Elevation": `${elev} m`,
        "Base Calories": `${baseCal} kcal`, "Elevation Bonus": `${elevCal} kcal`,
        "Total": `${totalCal} kcal`, "EPOC": `+${epocCal} kcal`,
        "Glycogen": `${glycogenUsedG}g (${glycogenPct}%)`, "Stress": `${stressScore}/100`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="calories-burned-running" title="Calories Burned Running Calculator"
      description="Precise running calorie analysis with EPOC afterburn, glycogen depletion, elevation correction, overuse injury risk, and race calorie strategy."
      icon={Activity} calculate={calculate} onClear={() => { setWeight(70); setDistance(5); setPaceMinPerKm(6); setElevation(0); setResult(null) }}
      values={[weight, distance, paceMinPerKm, elevation]} result={result}
      seoContent={<SeoContentGenerator title="Calories Burned Running" description="Calculate running calories with EPOC, glycogen depletion, and injury analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
          <NumInput label="Distance" val={distance} set={setDistance} min={0.5} max={100} step={0.5} suffix="km" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Pace" val={paceMinPerKm} set={setPaceMinPerKm} min={3} max={15} step={0.1} suffix="min/km" />
          <NumInput label="Elevation Gain" val={elevation} set={setElevation} min={0} max={2000} suffix="meters" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 20. STEPS TO CALORIES CALCULATOR (NEAT Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedStepsToCaloriesCalculator() {
  const [steps, setSteps] = useState(10000)
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(steps, 100, 100000)
    const w = clamp(weight, 30, 200)
    const h = clamp(height, 130, 220)
    const a = clamp(age, 15, 80)

    // Stride length (~41.5% of height)
    const strideM = h * 0.415 / 100
    const distKm = r2(s * strideM / 1000)

    // Walking MET (~3.5 for moderate pace)
    const met = 3.5
    const paceKph = 5 // assume average
    const timeMin = r0((distKm / paceKph) * 60)

    // MET-based calories
    const calories = r0(met * w * (timeMin / 60))

    // NEAT score (Non-Exercise Activity Thermogenesis)
    // Sedentary: <5000, Low active: 5000-7499, Somewhat active: 7500-9999, Active: 10000-12499, Highly active: >12500
    let neatCategory = "", neatStatus: 'good' | 'normal' | 'warning' | 'danger' = "normal"
    if (s < 5000) { neatCategory = "Sedentary"; neatStatus = "danger" }
    else if (s < 7500) { neatCategory = "Low Active"; neatStatus = "warning" }
    else if (s < 10000) { neatCategory = "Somewhat Active"; neatStatus = "normal" }
    else if (s < 12500) { neatCategory = "Active"; neatStatus = "good" }
    else { neatCategory = "Highly Active"; neatStatus = "good" }

    const neatScore = r0(Math.min(100, (s / 12500) * 100))

    // Sedentary risk
    const sedentaryRisk = s < 5000 ? "High" : s < 7500 ? "Moderate" : "Low"
    const sedentaryStatus: 'good' | 'warning' | 'danger' = s < 5000 ? "danger" : s < 7500 ? "warning" : "good"

    // Long-term weight impact (monthly, assuming daily)
    const dailySurplus = calories // calories above BMR from walking
    const monthlyFatKg = r2(dailySurplus * 30 / 7700) // 7700 kcal per kg fat

    // Steps needed for targets
    const stepsFor500kcal = r0(500 / Math.max(1, calories) * s)
    const stepsFor1kgMonth = r0(7700 / 30 / Math.max(0.01, calories / s))

    // AI movement score
    const movementScore = r0(Math.min(100, (s / 10000) * 60 + (distKm / 8) * 20 + (calories / 400) * 20))

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status: "good", description: `${s.toLocaleString()} steps = ${distKm} km | NEAT: ${neatCategory}` },
      healthScore: neatScore,
      metrics: [
        { label: "Total Calories", value: calories, unit: "kcal", status: "good" },
        { label: "Steps", value: s.toLocaleString(), status: neatStatus },
        { label: "Distance", value: distKm, unit: "km", status: "normal" },
        { label: "Est. Duration", value: timeMin, unit: "min", status: "normal" },
        { label: "Stride Length", value: r1(strideM * 100), unit: "cm", status: "normal" },
        { label: "NEAT Category", value: neatCategory, status: neatStatus },
        { label: "NEAT Score", value: `${neatScore}/100`, status: neatStatus },
        { label: "Sedentary Risk", value: sedentaryRisk, status: sedentaryStatus },
        { label: "AI Movement Score", value: `${movementScore}/100`, status: movementScore > 70 ? "good" : movementScore > 40 ? "warning" : "danger" },
        { label: "Monthly Fat Impact", value: monthlyFatKg, unit: "kg", status: "good" },
        { label: "Steps for 500 kcal", value: stepsFor500kcal.toLocaleString(), status: "normal" },
        { label: "Steps for 1 kg/month", value: stepsFor1kgMonth.toLocaleString(), unit: "daily", status: "normal" }
      ],
      recommendations: [
        { title: "AI Daily Movement Score", description: `Movement score: ${movementScore}/100. ${movementScore > 70 ? "Excellent daily activity level! You're well above sedentary thresholds." : movementScore > 40 ? "Moderate activity. Aim for 2,000-3,000 more steps daily for significant health benefits." : "Low activity detected. Even increasing by 2,000 steps reduces all-cause mortality by 8-11%."}`, priority: "high", category: "Activity" },
        { title: "NEAT Optimization", description: `${neatCategory} (${s.toLocaleString()} steps). NEAT accounts for 15-50% of daily caloric expenditure. ${s < 7500 ? "Every 1,000 extra steps burns ~30-40 extra kcal. Park further, take stairs, walk during calls." : "Good step count. Maintain consistency — daily variation of ±2,000 steps is normal."}`, priority: "high", category: "NEAT" },
        { title: "Weight Impact", description: `${s.toLocaleString()} daily steps burns ~${calories} kcal. Over a month: ~${monthlyFatKg} kg potential fat loss (without dietary changes). Combined with moderate calorie restriction: realistic target of ${r2(monthlyFatKg + 0.5)}-${r2(monthlyFatKg + 1.0)} kg/month.`, priority: "medium", category: "Weight" },
        { title: "Clinical: Sedentary Behavior Research", description: `Steps/day is a validated biomarker for sedentary behavior. <5,000 steps = sedentary lifestyle (associated with 40% higher all-cause mortality). 7,000-8,000 steps optimal for longevity. Current evidence: each 1,000-step increase above 4,000 reduces mortality risk by 15%.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Steps": s.toLocaleString(), "Distance": `${distKm} km`, "Duration": `${timeMin} min`,
        "Stride": `${r1(strideM * 100)} cm`, "Calories": `${calories} kcal`,
        "NEAT": `${neatCategory} (${neatScore}/100)`, "Monthly Impact": `${monthlyFatKg} kg`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="steps-to-calories" title="Steps to Calories Calculator"
      description="Convert daily steps to calorie expenditure with NEAT analysis, sedentary risk classification, movement scoring, and long-term weight impact projections."
      icon={Footprints} calculate={calculate} onClear={() => { setSteps(10000); setWeight(70); setHeight(170); setAge(30); setResult(null) }}
      values={[steps, weight, height, age]} result={result}
      seoContent={<SeoContentGenerator title="Steps to Calories Calculator" description="Convert steps to calories with NEAT analysis and sedentary risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Daily Steps" val={steps} set={setSteps} min={100} max={100000} step={100} />
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={130} max={220} suffix="cm" />
          <NumInput label="Age" val={age} set={setAge} min={15} max={80} suffix="yrs" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 21. SWIMMING CALORIES CALCULATOR (Aquatic Performance Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedSwimmingCaloriesCalculator() {
  const [strokeType, setStrokeType] = useState("freestyle_moderate")
  const [duration, setDuration] = useState(30)
  const [weight, setWeight] = useState(70)
  const [laps, setLaps] = useState(20)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 5, 240)
    const w = clamp(weight, 30, 200)
    const l = clamp(laps, 1, 200)

    // MET by stroke
    const strokeMets: Record<string, { met: number; label: string; upper: number }> = {
      "freestyle_slow": { met: 5.8, label: "Freestyle (Slow)", upper: 40 },
      "freestyle_moderate": { met: 7.0, label: "Freestyle (Moderate)", upper: 50 },
      "freestyle_fast": { met: 9.8, label: "Freestyle (Fast/Competitive)", upper: 60 },
      "backstroke": { met: 7.0, label: "Backstroke", upper: 45 },
      "breaststroke": { met: 10.3, label: "Breaststroke", upper: 55 },
      "butterfly": { met: 13.8, label: "Butterfly", upper: 70 },
      "sidestroke": { met: 7.0, label: "Sidestroke", upper: 40 },
      "treading_water": { met: 3.5, label: "Treading Water", upper: 30 }
    }

    const stroke = strokeMets[strokeType] || strokeMets["freestyle_moderate"]
    const met = stroke.met

    // Calories
    const calories = r0(met * w * (dur / 60))

    // Distance estimate (25m pool, each lap = 50m)
    const distM = l * 50
    const distKm = r2(distM / 1000)

    // Aerobic efficiency (kcal per 100m)
    const calPer100m = distM > 0 ? r1(calories / (distM / 100)) : 0

    // Upper body dominance index (% of work from upper body)
    const upperPct = stroke.upper

    // Endurance projection (how long can sustain at this intensity)
    const enduranceMin = r0(Math.min(180, 60 * (12 / met)))

    // AI swim efficiency
    const efficiencyScore = r0(Math.min(100, (l / (dur / 2)) * 30 + (100 - met * 3)))

    // Weekly projection
    const weekCal = calories * 3 // assume 3x/week

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status: "good", description: `${stroke.label} | ${dur} min, ${l} laps (${distM}m)` },
      healthScore: r0(Math.min(100, calories / 3)),
      metrics: [
        { label: "Total Calories", value: calories, unit: "kcal", status: "good" },
        { label: "Stroke Type", value: stroke.label, status: "normal" },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Laps (50m each)", value: l, status: "normal" },
        { label: "Total Distance", value: distM, unit: "m", status: "normal" },
        { label: "kcal per 100m", value: calPer100m, status: "normal" },
        { label: "Upper Body Work %", value: `${upperPct}%`, status: "normal" },
        { label: "Aerobic Efficiency", value: `${efficiencyScore}/100`, status: efficiencyScore > 60 ? "good" : efficiencyScore > 40 ? "normal" : "warning" },
        { label: "Endurance Capacity", value: `~${enduranceMin}`, unit: "min", status: "normal" },
        { label: "Weekly Calories (3x)", value: weekCal, unit: "kcal", status: "good" },
        { label: "Intensity Level", value: met > 10 ? "Vigorous" : met > 6 ? "Moderate" : "Light", status: met > 10 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "AI Swim Efficiency Score", description: `Efficiency: ${efficiencyScore}/100. ${efficiencyScore > 60 ? "Good stroke efficiency — focus on distance per stroke (DPS) to improve further." : "Improve technique: longer glide phase, bilateral breathing, and streamlined body position can reduce energy cost by 10-20%."} Calories per 100m: ${calPer100m} kcal.`, priority: "high", category: "Technique" },
        { title: "Stroke Analysis", description: `${stroke.label}: MET ${met}, ${upperPct}% upper body. ${strokeType === "butterfly" ? "Butterfly is the highest calorie burner but requires excellent technique. Alternate with freestyle for endurance." : strokeType.includes("freestyle") ? "Freestyle is the most efficient stroke for distance swimming." : "Mix strokes for full-body conditioning and injury prevention."}`, priority: "high", category: "Training" },
        { title: "Endurance Building", description: `Current endurance capacity: ~${enduranceMin} min at this intensity. To build: use 80/20 rule — 80% easy freestyle, 20% high intensity. Interval training: 4×100m at race pace with 30s rest between. Gradually increase total weekly distance by 5-10%.`, priority: "medium", category: "Endurance" },
        { title: "Clinical: Rehab Exercise", description: `Swimming provides full-body, non-impact exercise ideal for rehabilitation. MET of ${met} with ${upperPct}% upper body engagement. Suitable for: joint rehabilitation, post-surgical recovery, chronic pain management, and cardiovascular conditioning with reduced joint stress.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Stroke": stroke.label, "MET": met, "Duration": `${dur} min`,
        "Laps": l, "Distance": `${distM} m`, "Calories": `${calories} kcal`,
        "Cal/100m": calPer100m, "Upper Body %": `${upperPct}%`,
        "Efficiency": `${efficiencyScore}/100`, "Weekly (3x)": `${weekCal} kcal`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="swimming-calories-burned" title="Swimming Calories Calculator"
      description="Calculate swimming calorie burn by stroke type with aquatic performance analysis, swim efficiency scoring, upper-body dominance index, and endurance projections."
      icon={Droplets} calculate={calculate} onClear={() => { setStrokeType("freestyle_moderate"); setDuration(30); setWeight(70); setLaps(20); setResult(null) }}
      values={[strokeType, duration, weight, laps]} result={result}
      seoContent={<SeoContentGenerator title="Swimming Calories Calculator" description="Calculate swimming calories by stroke type with efficiency analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Stroke Type" val={strokeType} set={setStrokeType} options={[
          { value: "freestyle_slow", label: "Freestyle (Slow/Easy)" }, { value: "freestyle_moderate", label: "Freestyle (Moderate)" },
          { value: "freestyle_fast", label: "Freestyle (Fast/Competitive)" }, { value: "backstroke", label: "Backstroke" },
          { value: "breaststroke", label: "Breaststroke" }, { value: "butterfly", label: "Butterfly" },
          { value: "sidestroke", label: "Sidestroke" }, { value: "treading_water", label: "Treading Water" }
        ]} />
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Duration" val={duration} set={setDuration} min={5} max={240} suffix="min" />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
          <NumInput label="Laps (50m)" val={laps} set={setLaps} min={1} max={200} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 22. HIIT WORKOUT CALCULATOR (Anaerobic Stress Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AdvancedHIITCaloriesCalculator() {
  const [intervalSec, setIntervalSec] = useState(30)
  const [restSec, setRestSec] = useState(30)
  const [rounds, setRounds] = useState(10)
  const [avgHR, setAvgHR] = useState(155)
  const [maxHR, setMaxHR] = useState(190)
  const [weight, setWeight] = useState(70)
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const intSec = clamp(intervalSec, 10, 120)
    const rstSec = clamp(restSec, 5, 180)
    const rds = clamp(rounds, 2, 50)
    const hr = clamp(avgHR, 100, 210)
    const mhr = clamp(maxHR, 140, 220)
    const w = clamp(weight, 30, 200)
    const a = clamp(age, 15, 80)

    // Total times
    const totalWorkSec = intSec * rds
    const totalRestSec = rstSec * rds
    const totalTimeSec = totalWorkSec + totalRestSec
    const totalTimeMin = r1(totalTimeSec / 60)

    // Work:Rest ratio
    const wrRatio = `${intSec}:${rstSec}`

    // Intensity load (HR-based)
    const hrPctMax = r0((hr / mhr) * 100)
    const intensityZone = hrPctMax > 90 ? "Zone 5 (Max)" : hrPctMax > 80 ? "Zone 4 (Threshold)" : hrPctMax > 70 ? "Zone 3 (Aerobic)" : "Zone 2"

    // MET estimation from HR
    const metEstimate = r1(6 * (hr / 100)) // simplified
    const workMet = r1(metEstimate * 1.4) // work intervals are higher
    const restMet = r1(metEstimate * 0.5) // rest intervals are lower

    // Calories
    const workCal = r0(workMet * w * (totalWorkSec / 3600))
    const restCal = r0(restMet * w * (totalRestSec / 3600))
    const totalCal = workCal + restCal

    // EPOC (HIIT: 15-25% afterburn)
    const epocPct = hrPctMax > 85 ? 22 : hrPctMax > 75 ? 16 : 10
    const epocCal = r0(totalCal * epocPct / 100)

    // Anaerobic stress score
    const anaerobicStress = r0(Math.min(100, (hrPctMax / 100) * 50 + (totalWorkSec / 600) * 30 + (rds / 20) * 20))

    // CNS fatigue risk
    const cnsFatigue = r0(Math.min(100, anaerobicStress * 0.7 + (totalTimeMin / 60) * 30))

    // Recovery time prediction
    const recoveryHours = r0(Math.min(72, 12 + anaerobicStress * 0.4 + (a > 40 ? (a - 40) * 0.2 : 0)))

    // Fat-loss efficiency index (calories per minute of total workout)
    const fatLossEfficiency = r1((totalCal + epocCal) / totalTimeMin)

    // Overtraining alert
    const weeklyHIIT = 3 // assume
    const weeklyAnaerobicLoad = anaerobicStress * weeklyHIIT
    const overtrainingRisk = weeklyAnaerobicLoad > 240 ? "High" : weeklyAnaerobicLoad > 160 ? "Moderate" : "Low"
    const overtrainingStatus: 'good' | 'warning' | 'danger' = weeklyAnaerobicLoad > 240 ? "danger" : weeklyAnaerobicLoad > 160 ? "warning" : "good"

    // HIIT adaptation curve phase
    const adaptPhase = totalTimeMin < 15 ? "Beginner (build to 20 min)" : totalTimeMin < 30 ? "Intermediate (optimize intervals)" : "Advanced (vary protocols)"

    setResult({
      primaryMetric: { label: "Calories Burned", value: totalCal, unit: "kcal", status: "good", description: `${rds} rounds × ${intSec}s work / ${rstSec}s rest | +${epocCal} kcal EPOC` },
      healthScore: r0(Math.max(0, 100 - cnsFatigue)),
      metrics: [
        { label: "Total Calories (workout)", value: totalCal, unit: "kcal", status: "good" },
        { label: "Work Calories", value: workCal, unit: "kcal", status: "normal" },
        { label: "Rest Calories", value: restCal, unit: "kcal", status: "normal" },
        { label: "EPOC (afterburn)", value: epocCal, unit: "kcal", status: "good" },
        { label: "Total + EPOC", value: totalCal + epocCal, unit: "kcal", status: "good" },
        { label: "Total Workout Time", value: `${r1(totalTimeMin)}`, unit: "min", status: "normal" },
        { label: "Total Work Time", value: `${r1(totalWorkSec / 60)}`, unit: "min", status: "normal" },
        { label: "Work:Rest Ratio", value: wrRatio, status: "normal" },
        { label: "Avg HR % Max", value: `${hrPctMax}%`, status: hrPctMax < 80 ? "good" : hrPctMax < 90 ? "warning" : "danger" },
        { label: "Intensity Zone", value: intensityZone, status: "normal" },
        { label: "Anaerobic Stress", value: `${anaerobicStress}/100`, status: anaerobicStress < 50 ? "good" : anaerobicStress < 75 ? "warning" : "danger" },
        { label: "CNS Fatigue Risk", value: `${cnsFatigue}%`, status: cnsFatigue < 40 ? "good" : cnsFatigue < 65 ? "warning" : "danger" },
        { label: "Recovery Time", value: `${recoveryHours}`, unit: "hours", status: recoveryHours < 24 ? "good" : recoveryHours < 48 ? "warning" : "danger" },
        { label: "Fat-Loss Efficiency", value: fatLossEfficiency, unit: "kcal/min", status: fatLossEfficiency > 10 ? "good" : "normal" },
        { label: "Overtraining Risk (3x/wk)", value: overtrainingRisk, status: overtrainingStatus },
        { label: "Adaptation Phase", value: adaptPhase, status: "normal" }
      ],
      recommendations: [
        { title: "AI Overtraining Alert", description: `${overtrainingRisk === "High" ? "⚠ HIIT overtraining likely at 3x/week with this intensity. Reduce to 2x/week or lower interval intensity. Non-functional overreaching symptoms: persistent fatigue, elevated resting HR, mood changes." : overtrainingRisk === "Moderate" ? "Monitor recovery markers. Ensure 48+ hours between HIIT sessions. Add 1 easy week every 3 weeks." : "✔ HIIT load is sustainable at current frequency."}`, priority: "high", category: "Recovery" },
        { title: "Fat-Loss Efficiency", description: `${fatLossEfficiency} kcal/min including EPOC. ${fatLossEfficiency > 12 ? "Excellent efficiency — HIIT is the most time-efficient fat loss method." : "Good calorie burn rate."} HIIT elevates metabolism for 24-48 hours post-workout. Total impact: ${totalCal + epocCal} kcal per session.`, priority: "high", category: "Fat Loss" },
        { title: "HIIT Protocol Optimization", description: `Work:Rest ${wrRatio}. ${intSec >= rstSec ? "Equal or positive ratio — very demanding. Consider 1:2 ratio for beginners." : "Good recovery ratio."} Tabata (20:10 × 8): highest EPOC. EMOM: good for strength-HIIT hybrid. ${adaptPhase}.`, priority: "medium", category: "Programming" },
        { title: "Clinical: Cardiometabolic Conditioning", description: `HIIT at ${hrPctMax}% MHR with anaerobic stress score ${anaerobicStress}/100. Evidence: HIIT improves VO₂ max 2x faster than moderate continuous training. Reduces HbA1c by 0.2-0.5% in T2DM. Contraindicated: uncontrolled hypertension, unstable angina, recent MI (<6 weeks).`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: {
        "Rounds": rds, "Work": `${intSec}s`, "Rest": `${rstSec}s`,
        "Total Time": `${r1(totalTimeMin)} min`, "Work Time": `${r1(totalWorkSec / 60)} min`,
        "Avg HR": `${hr} bpm (${hrPctMax}% MHR)`, "Calories": `${totalCal} kcal`,
        "EPOC": `+${epocCal} kcal`, "Stress": `${anaerobicStress}/100`,
        "CNS": `${cnsFatigue}%`, "Recovery": `${recoveryHours}h`
      }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hiit-workout-calculator" title="HIIT Workout Calculator"
      description="Quantify HIIT training load with anaerobic stress analysis, EPOC afterburn, CNS fatigue risk, recovery prediction, and fat-loss efficiency index."
      icon={Zap} calculate={calculate} onClear={() => { setIntervalSec(30); setRestSec(30); setRounds(10); setAvgHR(155); setMaxHR(190); setWeight(70); setAge(30); setResult(null) }}
      values={[intervalSec, restSec, rounds, avgHR, maxHR, weight, age]} result={result}
      seoContent={<SeoContentGenerator title="HIIT Workout Calculator" description="Calculate HIIT calories, EPOC, anaerobic stress, and recovery time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Work Interval" val={intervalSec} set={setIntervalSec} min={10} max={120} suffix="sec" />
          <NumInput label="Rest Interval" val={restSec} set={setRestSec} min={5} max={180} suffix="sec" />
          <NumInput label="Rounds" val={rounds} set={setRounds} min={2} max={50} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average Heart Rate" val={avgHR} set={setAvgHR} min={100} max={210} suffix="bpm" />
          <NumInput label="Max Heart Rate" val={maxHR} set={setMaxHR} min={140} max={220} suffix="bpm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
          <NumInput label="Age" val={age} set={setAge} min={15} max={80} suffix="yrs" />
        </div>
      </div>} />
  )
}
