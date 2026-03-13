"use client"

import { useState } from "react"
import { Activity, Zap, Heart, TrendingUp, Timer, Dumbbell, Target, Shield } from "lucide-react"
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
// 22. HIIT WORKOUT CALCULATOR (Anaerobic Power & Fat-Loss Engine)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HIIT_EXERCISES: Record<string, number> = {
  burpees: 12.5, "battle-ropes": 10.3, "box-jumps": 9.8, sprints: 11.0,
  "kettlebell-swings": 9.5, "mountain-climbers": 8.0, "jump-squats": 9.2,
  "bicycle-crunches": 6.5, "rowing-intervals": 10.0, "cycling-intervals": 9.0
}

export function AdvancedHIITCalculator() {
  const [intervalDur, setIntervalDur] = useState(30)
  const [restDur, setRestDur] = useState(15)
  const [rounds, setRounds] = useState(10)
  const [exercise, setExercise] = useState("burpees")
  const [weight, setWeight] = useState(70)
  const [avgHR, setAvgHR] = useState(155)
  const [maxHR, setMaxHR] = useState(185)
  const [rpe, setRpe] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const iDur = clamp(intervalDur, 5, 300)
    const rDur = clamp(restDur, 5, 300)
    const rnd = clamp(rounds, 1, 50)
    const w = clamp(weight, 30, 250)
    const aHR = clamp(avgHR, 60, 220)
    const mHR = clamp(maxHR, 80, 230)
    const rpeVal = clamp(rpe, 1, 10)

    const met = HIIT_EXERCISES[exercise] || 10
    const totalWorkSec = iDur * rnd
    const totalRestSec = rDur * (rnd - 1)
    const totalSessionSec = totalWorkSec + totalRestSec
    const totalWorkMin = totalWorkSec / 60
    const totalSessionMin = totalSessionSec / 60

    const workRestRatio = r2(iDur / rDur)
    const calories = r0(met * 3.5 * w / 200 * totalWorkMin)
    const restCalories = r0(2.5 * 3.5 * w / 200 * (totalRestSec / 60))
    const totalCalories = calories + restCalories

    // EPOC estimate (6-15% of total kcal for HIIT)
    const epocPercent = Math.min(15, 6 + rpeVal * 0.9)
    const epocKcal = r0(totalCalories * epocPercent / 100)

    // Anaerobic load score (0-100)
    const anaerobicLoad = r0(Math.min(100, (rpeVal * 8 + workRestRatio * 12 + (aHR / mHR) * 30)))

    // CNS fatigue index (0-100)
    const cnsFatigue = r0(Math.min(100, rpeVal * 7 + rnd * 1.5 + (totalWorkMin > 15 ? 15 : 0)))

    // Overreaching probability
    const overreachProb = r0(Math.min(95, cnsFatigue * 0.6 + (rpeVal >= 9 ? 20 : 0) + (rnd > 20 ? 15 : 0)))

    // Fat-loss efficiency (higher = better for fat loss)
    const fatLossEff = r0(Math.min(100, (epocPercent * 4 + workRestRatio * 10 + (met > 9 ? 15 : 0))))

    // HR zone distribution
    const hrPercent = r0(aHR / mHR * 100)
    let hrZone = ""
    if (hrPercent < 60) hrZone = "Zone 1 (Recovery)"
    else if (hrPercent < 70) hrZone = "Zone 2 (Aerobic)"
    else if (hrPercent < 80) hrZone = "Zone 3 (Tempo)"
    else if (hrPercent < 90) hrZone = "Zone 4 (Threshold)"
    else hrZone = "Zone 5 (VO₂ Max)"

    // Recovery time prediction (hours)
    const recoveryHrs = r0(Math.min(72, 12 + cnsFatigue * 0.4 + (rpeVal >= 9 ? 8 : 0)))

    // Risk classification
    let risk = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (overreachProb < 25) { risk = "🟢 Optimal Stimulus"; status = "good" }
    else if (overreachProb < 50) { risk = "🟡 High Stress"; status = "warning" }
    else if (overreachProb < 75) { risk = "🔴 Overtraining Risk"; status = "danger" }
    else { risk = "🟣 Cardiac Caution"; status = "danger" }

    setResult({
      primaryMetric: { label: "Total Calories Burned", value: totalCalories + epocKcal, unit: "kcal", status, description: `${risk} — Work:Rest ${workRestRatio}:1 | ${r1(totalSessionMin)} min session` },
      healthScore: Math.max(0, Math.min(100, 100 - overreachProb)),
      metrics: [
        { label: "Work Calories", value: calories, unit: "kcal", status: "good" },
        { label: "Rest Calories", value: restCalories, unit: "kcal", status: "normal" },
        { label: "EPOC (Afterburn)", value: epocKcal, unit: "kcal", status: "good" },
        { label: "Total + EPOC", value: totalCalories + epocKcal, unit: "kcal", status },
        { label: "Total Work Time", value: r1(totalWorkMin), unit: "min", status: "normal" },
        { label: "Total Session", value: r1(totalSessionMin), unit: "min", status: "normal" },
        { label: "Work:Rest Ratio", value: `${workRestRatio}:1`, status: workRestRatio > 3 ? "danger" : workRestRatio > 2 ? "warning" : "good" },
        { label: "Anaerobic Load", value: anaerobicLoad, unit: "/100", status: anaerobicLoad > 80 ? "danger" : anaerobicLoad > 60 ? "warning" : "good" },
        { label: "CNS Fatigue Index", value: cnsFatigue, unit: "/100", status: cnsFatigue > 70 ? "danger" : cnsFatigue > 50 ? "warning" : "good" },
        { label: "Overreaching Probability", value: overreachProb, unit: "%", status: overreachProb > 50 ? "danger" : overreachProb > 25 ? "warning" : "good" },
        { label: "Fat-Loss Efficiency", value: fatLossEff, unit: "/100", status: fatLossEff > 70 ? "good" : fatLossEff > 40 ? "normal" : "warning" },
        { label: "HR Zone", value: hrZone, status: hrPercent > 90 ? "danger" : hrPercent > 80 ? "warning" : "good" },
        { label: "Recovery Time", value: recoveryHrs, unit: "hours", status: recoveryHrs > 48 ? "danger" : recoveryHrs > 24 ? "warning" : "good" },
        { label: "Risk Classification", value: risk, status }
      ],
      recommendations: [
        { title: "HIIT Stress Analysis", description: `Anaerobic load: ${anaerobicLoad}/100, CNS fatigue: ${cnsFatigue}/100. ${overreachProb > 50 ? "⚠️ High overreaching risk — reduce rounds or increase rest. HIIT sessions >3x/week at RPE ≥8 significantly increase injury + overtraining risk." : "Training stimulus is within recoverable range. Maintain 48-72h between high-intensity HIIT sessions for optimal adaptation."}`, priority: "high", category: "Training Load" },
        { title: "Interval Optimization", description: `Work:Rest ${workRestRatio}:1. ${workRestRatio > 2.5 ? "Very aggressive ratio — suitable only for advanced athletes. Consider 1:1 or 2:1 for sustainable fat loss." : workRestRatio >= 1 ? "Good stimulus ratio. For maximum EPOC, 2:1 work:rest with RPE 8-9 is optimal." : "Conservative ratio — good for beginners. Progress to 1:1 then 2:1 over 4-6 weeks."}`, priority: "high", category: "Protocol Design" },
        { title: "Fat-Loss & EPOC Strategy", description: `EPOC estimate: ${epocKcal} kcal (${epocPercent}% of session). Fat-loss efficiency: ${fatLossEff}/100. HIIT produces 25-30% more EPOC than steady-state cardio. Combine with caloric deficit for optimal results. Recovery nutrition within 30 min enhances adaptation.`, priority: "medium", category: "Fat Loss" },
        { title: "Recovery Protocol", description: `Estimated recovery: ${recoveryHrs} hours. ${recoveryHrs > 36 ? "Extended recovery needed — include active recovery (walking, yoga), sleep 7-9h, hydrate well, and consume 1.6-2.2g protein/kg/day." : "Standard recovery window. Light activity on rest days enhances recovery."}`, priority: "medium", category: "Recovery" }
      ],
      detailedBreakdown: { "Exercise": exercise.replace(/-/g, " "), "MET": met, "Rounds": rnd, "Work Time": `${r1(totalWorkMin)} min`, "Session Time": `${r1(totalSessionMin)} min`, "Work:Rest": `${workRestRatio}:1`, "Anaerobic Load": `${anaerobicLoad}/100`, "CNS Fatigue": `${cnsFatigue}/100`, "EPOC": `${epocKcal} kcal`, "Fat-Loss Score": `${fatLossEff}/100`, "Recovery": `${recoveryHrs}h` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hiit-workout-calculator" title="HIIT Workout Calculator"
      description="Advanced HIIT analysis: anaerobic stress, EPOC afterburn, CNS fatigue, fat-loss efficiency, and recovery prediction with risk classification."
      icon={Zap} calculate={calculate} onClear={() => { setIntervalDur(30); setRestDur(15); setRounds(10); setExercise("burpees"); setWeight(70); setAvgHR(155); setMaxHR(185); setRpe(8); setResult(null) }}
      values={[intervalDur, restDur, rounds, exercise, weight, avgHR, maxHR, rpe]} result={result}
      seoContent={<SeoContentGenerator title="HIIT Workout Calculator" description="Calculate HIIT calories, EPOC, anaerobic stress, and recovery time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Exercise Type" val={exercise} set={setExercise} options={Object.keys(HIIT_EXERCISES).map(k => ({ value: k, label: k.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) }))} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Interval Duration" val={intervalDur} set={setIntervalDur} min={5} max={300} suffix="sec" />
          <NumInput label="Rest Duration" val={restDur} set={setRestDur} min={5} max={300} suffix="sec" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Number of Rounds" val={rounds} set={setRounds} min={1} max={50} />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Average HR" val={avgHR} set={setAvgHR} min={60} max={220} suffix="bpm" />
          <NumInput label="Max HR" val={maxHR} set={setMaxHR} min={80} max={230} suffix="bpm" />
        </div>
        <NumInput label="RPE (1-10)" val={rpe} set={setRpe} min={1} max={10} />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 23. YOGA CALORIES CALCULATOR (Low-Impact Recovery Energy Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const YOGA_STYLES: Record<string, { met: number; mobility: number; parasym: number }> = {
  hatha: { met: 2.5, mobility: 60, parasym: 70 },
  vinyasa: { met: 4.0, mobility: 70, parasym: 55 },
  "power-yoga": { met: 5.5, mobility: 65, parasym: 40 },
  "ashtanga": { met: 5.0, mobility: 75, parasym: 45 },
  "bikram-hot": { met: 4.5, mobility: 70, parasym: 35 },
  yin: { met: 2.0, mobility: 80, parasym: 85 },
  restorative: { met: 1.5, mobility: 50, parasym: 90 },
  kundalini: { met: 3.0, mobility: 55, parasym: 75 },
  iyengar: { met: 3.0, mobility: 80, parasym: 60 }
}

export function YogaCaloriesCalculator() {
  const [style, setStyle] = useState("vinyasa")
  const [duration, setDuration] = useState(60)
  const [weight, setWeight] = useState(65)
  const [hr, setHr] = useState(100)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 10, 180)
    const w = clamp(weight, 30, 250)
    const h = clamp(hr, 40, 200)
    const yoga = YOGA_STYLES[style] || YOGA_STYLES.vinyasa

    const calories = r0(yoga.met * 3.5 * w / 200 * dur)
    const mobilityScore = r0(Math.min(100, yoga.mobility + dur * 0.15))
    const parasymIndex = r0(Math.min(100, yoga.parasym + (dur > 45 ? 10 : 0)))
    const stressReduction = r0(Math.min(100, parasymIndex * 0.8 + mobilityScore * 0.2))
    const recoveryContrib = r0(Math.min(100, parasymIndex * 0.6 + mobilityScore * 0.3 + (dur > 30 ? 10 : 0)))

    // HRV improvement correlation (estimated % improvement per session)
    const hrvImprovement = r1(parasymIndex * 0.05 + (dur > 45 ? 1 : 0))

    const status: 'normal' | 'warning' | 'danger' | 'good' = recoveryContrib > 60 ? "good" : "normal"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status: "good", description: `${style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())} — ${dur} min | Recovery contribution: ${recoveryContrib}/100` },
      healthScore: r0(Math.min(100, (recoveryContrib + stressReduction) / 2)),
      metrics: [
        { label: "Calories Burned", value: calories, unit: "kcal", status: "good" },
        { label: "MET Value", value: yoga.met, status: "normal" },
        { label: "Mobility Score", value: mobilityScore, unit: "/100", status: mobilityScore > 70 ? "good" : "normal" },
        { label: "Parasympathetic Activation", value: parasymIndex, unit: "/100", status: parasymIndex > 65 ? "good" : "normal" },
        { label: "Stress Reduction Score", value: stressReduction, unit: "/100", status: stressReduction > 60 ? "good" : "normal" },
        { label: "Recovery Contribution", value: recoveryContrib, unit: "/100", status: recoveryContrib > 60 ? "good" : "normal" },
        { label: "Est. HRV Improvement", value: hrvImprovement, unit: "%/session", status: "good" }
      ],
      recommendations: [
        { title: "Yoga Style Analysis", description: `${style.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}: MET ${yoga.met}. ${yoga.met > 4 ? "Higher-intensity yoga provides both calorie burn and flexibility. Caution: power/hot yoga can mask dehydration — hydrate well." : "Lower-intensity style maximizes parasympathetic activation and recovery. Ideal on rest days or after strength training."}`, priority: "high", category: "Style Selection" },
        { title: "Recovery & Stress Management", description: `Parasympathetic index: ${parasymIndex}/100, Stress reduction: ${stressReduction}/100. Regular yoga practice (3-5x/week) reduces cortisol by 11-25%, improves HRV by 5-15%, and reduces inflammatory markers. 20+ min sessions needed for significant parasympathetic benefit.`, priority: "high", category: "Recovery" },
        { title: "Flexibility Progression", description: `Mobility score: ${mobilityScore}/100. Consistent yoga practice improves ROM by 15-35% over 8-12 weeks. Yin/Iyengar styles target connective tissue remodeling. Hold poses 60-90 sec for fascial adaptation. Progressive overload applies to flexibility too.`, priority: "medium", category: "Mobility" }
      ],
      detailedBreakdown: { "Style": style.replace(/-/g, " "), "MET": yoga.met, "Duration": `${dur} min`, "Calories": `${calories} kcal`, "Mobility": `${mobilityScore}/100`, "Parasympathetic": `${parasymIndex}/100`, "Stress Reduction": `${stressReduction}/100`, "Recovery": `${recoveryContrib}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="yoga-calories-calculator" title="Yoga Calories Calculator"
      description="Calculate yoga calorie burn with mobility score, parasympathetic activation, stress reduction, and recovery contribution analysis."
      icon={Activity} calculate={calculate} onClear={() => { setStyle("vinyasa"); setDuration(60); setWeight(65); setHr(100); setResult(null) }}
      values={[style, duration, weight, hr]} result={result}
      seoContent={<SeoContentGenerator title="Yoga Calories Calculator" description="Calculate calories burned during yoga with recovery and stress analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Yoga Style" val={style} set={setStyle} options={Object.keys(YOGA_STYLES).map(k => ({ value: k, label: k.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) }))} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Duration" val={duration} set={setDuration} min={10} max={180} suffix="min" />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} suffix="kg" />
        </div>
        <NumInput label="Average Heart Rate (optional)" val={hr} set={setHr} min={40} max={200} suffix="bpm" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 24. PILATES CALORIE BURN (Core Stability Energy Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function PilatesCalorieBurnCalculator() {
  const [duration, setDuration] = useState(50)
  const [intensity, setIntensity] = useState("moderate")
  const [weight, setWeight] = useState(65)
  const [type, setType] = useState("mat")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 10, 180)
    const w = clamp(weight, 30, 250)

    const metMap: Record<string, number> = { light: 2.5, moderate: 3.5, vigorous: 5.0, advanced: 6.0 }
    const typeBonus: Record<string, number> = { mat: 0, reformer: 0.5, cadillac: 0.7, chair: 0.3 }
    const met = (metMap[intensity] || 3.5) + (typeBonus[type] || 0)

    const calories = r0(met * 3.5 * w / 200 * dur)
    const coreActivation = r0(Math.min(100, 40 + (met - 2) * 15 + dur * 0.15))
    const postureIndex = r0(Math.min(100, 30 + coreActivation * 0.5 + (dur > 30 ? 10 : 0)))
    const injuryPrevention = r0(Math.min(100, coreActivation * 0.6 + postureIndex * 0.3 + 10))

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status: "good", description: `${intensity.replace(/\b\w/g, c => c.toUpperCase())} ${type} Pilates — Core activation: ${coreActivation}/100` },
      healthScore: r0(Math.min(100, (coreActivation + postureIndex) / 2)),
      metrics: [
        { label: "Calories Burned", value: calories, unit: "kcal", status: "good" },
        { label: "MET Value", value: r1(met), status: "normal" },
        { label: "Core Activation Score", value: coreActivation, unit: "/100", status: coreActivation > 70 ? "good" : "normal" },
        { label: "Posture Correction Index", value: postureIndex, unit: "/100", status: postureIndex > 60 ? "good" : "normal" },
        { label: "Injury Prevention Benefit", value: injuryPrevention, unit: "/100", status: injuryPrevention > 60 ? "good" : "normal" }
      ],
      recommendations: [
        { title: "Pilates Benefits Analysis", description: `Core activation: ${coreActivation}/100. Pilates improves core strength by 20-40% over 12 weeks. ${type === "reformer" ? "Reformer Pilates provides spring resistance for progressive overload — 20-30% more muscle activation than mat." : "Mat Pilates is excellent for body-weight core training. Consider reformer for progressive resistance."}`, priority: "high", category: "Core Training" },
        { title: "Posture & Injury Prevention", description: `Posture index: ${postureIndex}/100. Regular Pilates reduces low back pain by 39-65% (meta-analysis). Targets transversus abdominis, multifidus, and pelvic floor — critical for spinal stability. 2-3 sessions/week for optimal results.`, priority: "high", category: "Posture" },
        { title: "Progression Strategy", description: `${intensity === "light" ? "Start with fundamentals — breathing, neutral spine, pelvic floor activation. Progress to moderate in 4-6 weeks." : intensity === "moderate" ? "Good training zone. Add reformer/props for variety. Progress intensity every 3-4 weeks." : "Advanced level — ensure form quality. Periodize with lighter weeks to prevent overuse."}`, priority: "medium", category: "Progression" }
      ],
      detailedBreakdown: { "Type": type, "Intensity": intensity, "MET": r1(met), "Duration": `${dur} min`, "Calories": `${calories} kcal`, "Core Activation": `${coreActivation}/100`, "Posture Index": `${postureIndex}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="pilates-calorie-burn" title="Pilates Calorie Burn Calculator"
      description="Calculate Pilates calorie burn with core activation score, posture correction index, and injury prevention benefit analysis."
      icon={Activity} calculate={calculate} onClear={() => { setDuration(50); setIntensity("moderate"); setWeight(65); setType("mat"); setResult(null) }}
      values={[duration, intensity, weight, type]} result={result}
      seoContent={<SeoContentGenerator title="Pilates Calorie Burn Calculator" description="Calculate calories burned in Pilates with core stability analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Pilates Type" val={type} set={setType} options={[{ value: "mat", label: "Mat Pilates" }, { value: "reformer", label: "Reformer" }, { value: "cadillac", label: "Cadillac/Trapeze" }, { value: "chair", label: "Wunda Chair" }]} />
          <SelectInput label="Intensity" val={intensity} set={setIntensity} options={[{ value: "light", label: "Light (Beginner)" }, { value: "moderate", label: "Moderate" }, { value: "vigorous", label: "Vigorous" }, { value: "advanced", label: "Advanced" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Duration" val={duration} set={setDuration} min={10} max={180} suffix="min" />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 25. JUMP ROPE CALORIE CALCULATOR (Explosive Cardio Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function JumpRopeCalculator() {
  const [skipsPerMin, setSkipsPerMin] = useState(100)
  const [duration, setDuration] = useState(15)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const spm = clamp(skipsPerMin, 30, 250)
    const dur = clamp(duration, 1, 60)
    const w = clamp(weight, 30, 250)

    // MET based on cadence
    const met = spm < 80 ? 8.8 : spm < 120 ? 11.8 : spm < 160 ? 12.3 : 14.0
    const calories = r0(met * 3.5 * w / 200 * dur)
    const totalJumps = spm * dur

    // Plyometric load (impacts per session)
    const plyoLoad = r0(totalJumps * w * 0.001)   // kg-impacts simplified

    // Ankle stress index (0-100)
    const ankleStress = r0(Math.min(100, spm * 0.3 + dur * 1.5 + (w > 90 ? 15 : 0)))

    // Bone density stimulation (impact-based)
    const boneDensity = r0(Math.min(100, 20 + totalJumps * 0.01 + (spm > 100 ? 15 : 0)))

    // Overuse injury risk
    const overuseRisk = r0(Math.min(100, ankleStress * 0.5 + (dur > 25 ? 20 : 0) + (spm > 160 ? 15 : 0)))

    let riskLabel = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (overuseRisk < 30) { riskLabel = "🟢 Low Risk"; status = "good" }
    else if (overuseRisk < 55) { riskLabel = "🟡 Moderate"; status = "warning" }
    else { riskLabel = "🔴 High Impact Risk"; status = "danger" }

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status: "good", description: `${spm} skips/min × ${dur} min = ${totalJumps} total jumps | ${riskLabel}` },
      healthScore: Math.max(0, 100 - overuseRisk),
      metrics: [
        { label: "Calories Burned", value: calories, unit: "kcal", status: "good" },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Total Jumps", value: totalJumps, status: "normal" },
        { label: "Plyometric Load", value: plyoLoad, unit: "kg-impacts", status: plyoLoad > 2000 ? "warning" : "normal" },
        { label: "Ankle Stress Index", value: ankleStress, unit: "/100", status: ankleStress > 60 ? "danger" : ankleStress > 40 ? "warning" : "good" },
        { label: "Bone Density Stimulation", value: boneDensity, unit: "/100", status: boneDensity > 50 ? "good" : "normal" },
        { label: "Overuse Injury Risk", value: overuseRisk, unit: "%", status },
        { label: "AI Cadence Rating", value: spm < 80 ? "Slow — build up" : spm < 140 ? "Optimal zone" : "High — monitor joints", status: spm < 80 ? "warning" : spm < 140 ? "good" : "danger" }
      ],
      recommendations: [
        { title: "Jump Rope Performance", description: `${spm} skips/min at MET ${met}. Jump rope burns ${r0(calories / dur)} kcal/min — among the highest calorie-burning exercises. ${spm > 140 ? "Elite cadence — ensure proper form (toe-ball landing, wrists relaxed)." : spm > 100 ? "Good cadence. Focus on rhythm and minimal jump height for efficiency." : "Building phase — practice double-unders as progression."}`, priority: "high", category: "Performance" },
        { title: "Impact & Joint Health", description: `Ankle stress: ${ankleStress}/100. ${ankleStress > 50 ? "⚠️ High impact load — use cushioned surface, proper shoes, limit to 15-20 min initially. Stretch calves/Achilles post-session." : "Acceptable impact range. Jump rope has 20% less impact than running when proper form is used (forefoot landing)."}`, priority: "high", category: "Joint Health" },
        { title: "Bone Health Benefit", description: `Bone density stimulation: ${boneDensity}/100. Impact loading stimulates osteoblast activity. Jump rope provides excellent mechanical loading for femur, tibia, and spine. 10+ min of jumping 3x/week can increase bone density by 2-5% over 6 months in at-risk populations.`, priority: "medium", category: "Bone Health" }
      ],
      detailedBreakdown: { "Cadence": `${spm} spm`, "Duration": `${dur} min`, "Total Jumps": totalJumps, "MET": met, "Calories": `${calories} kcal`, "Ankle Stress": `${ankleStress}/100`, "Bone Stim": `${boneDensity}/100`, "Injury Risk": `${overuseRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="jump-rope-calculator" title="Jump Rope Calorie Calculator"
      description="Calculate jump rope calories with plyometric load analysis, ankle stress index, bone density stimulation, and overuse injury risk."
      icon={Zap} calculate={calculate} onClear={() => { setSkipsPerMin(100); setDuration(15); setWeight(70); setResult(null) }}
      values={[skipsPerMin, duration, weight]} result={result}
      seoContent={<SeoContentGenerator title="Jump Rope Calorie Calculator" description="Calculate calories burned jumping rope with impact and bone health analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Skips Per Minute" val={skipsPerMin} set={setSkipsPerMin} min={30} max={250} suffix="spm" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Duration" val={duration} set={setDuration} min={1} max={60} suffix="min" />
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} suffix="kg" />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 26. GRIP STRENGTH CALCULATOR (Neuromuscular Integrity Index)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Normative data (simplified by age/gender) — kg
const GRIP_NORMS_MALE: Record<string, [number, number, number]> = {
  "20-29": [47, 55, 63], "30-39": [47, 54, 62], "40-49": [45, 52, 59],
  "50-59": [40, 47, 55], "60-69": [35, 42, 49], "70+": [28, 35, 42]
}
const GRIP_NORMS_FEMALE: Record<string, [number, number, number]> = {
  "20-29": [27, 32, 38], "30-39": [27, 32, 37], "40-49": [25, 30, 35],
  "50-59": [22, 27, 32], "60-69": [19, 24, 29], "70+": [15, 20, 25]
}

export function GripStrengthCalculator() {
  const [gripKg, setGripKg] = useState(45)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [bodyWeight, setBodyWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const g = clamp(gripKg, 5, 120)
    const a = clamp(age, 18, 100)
    const w = clamp(bodyWeight, 30, 250)
    const male = gender === "male"

    const ageGroup = a < 30 ? "20-29" : a < 40 ? "30-39" : a < 50 ? "40-49" : a < 60 ? "50-59" : a < 70 ? "60-69" : "70+"
    const norms = male ? GRIP_NORMS_MALE[ageGroup] : GRIP_NORMS_FEMALE[ageGroup]
    const [p25, p50, p75] = norms

    const relativeGrip = r2(g / w)
    let percentile = 0
    if (g >= p75) percentile = 75 + Math.min(24, r0((g - p75) / p75 * 100))
    else if (g >= p50) percentile = 50 + r0((g - p50) / (p75 - p50) * 25)
    else if (g >= p25) percentile = 25 + r0((g - p25) / (p50 - p25) * 25)
    else percentile = Math.max(1, r0(g / p25 * 25))

    // Sarcopenia risk (grip < 28 kg male, < 18 kg female — EWGSOP2 criteria)
    const sarcopeniaThreshold = male ? 27 : 16
    const sarcopeniaRisk = g < sarcopeniaThreshold
    const sarcopeniaScore = r0(Math.max(0, Math.min(100, (sarcopeniaThreshold - g) / sarcopeniaThreshold * 150)))

    // Mortality correlation (low grip = higher all-cause mortality)
    const mortalityIndex = g < p25 ? "Elevated Risk" : g < p50 ? "Average" : "Lower Risk"

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (percentile >= 75) { category = "Above Average"; status = "good" }
    else if (percentile >= 50) { category = "Average"; status = "good" }
    else if (percentile >= 25) { category = "Below Average"; status = "warning" }
    else { category = "Low — Clinical Concern"; status = "danger" }

    setResult({
      primaryMetric: { label: "Grip Strength", value: g, unit: "kg", status, description: `${category} — ${percentile}th percentile for ${ageGroup} ${gender}` },
      healthScore: Math.min(100, percentile + 10),
      metrics: [
        { label: "Grip Strength", value: g, unit: "kg", status },
        { label: "Relative Grip (per kg BW)", value: relativeGrip, status: relativeGrip > 0.6 ? "good" : relativeGrip > 0.45 ? "normal" : "warning" },
        { label: "Percentile Rank", value: percentile, unit: "th", status },
        { label: "Category", value: category, status },
        { label: "Sarcopenia Risk", value: sarcopeniaRisk ? "YES — Below threshold" : "No", status: sarcopeniaRisk ? "danger" : "good" },
        { label: "Sarcopenia Score", value: sarcopeniaScore, unit: "/100", status: sarcopeniaScore > 30 ? "danger" : sarcopeniaScore > 0 ? "warning" : "good" },
        { label: "Mortality Correlation", value: mortalityIndex, status: g < p25 ? "danger" : g < p50 ? "warning" : "good" },
        { label: "Age Group Norms", value: `P25: ${p25} | P50: ${p50} | P75: ${p75} kg`, status: "normal" }
      ],
      recommendations: [
        { title: "Grip Strength as Health Biomarker", description: `${g} kg (${percentile}th percentile). Grip strength is one of the strongest predictors of all-cause mortality, cardiovascular events, and disability. Each 5 kg decrease in grip is associated with 17% increased mortality risk (Lancet 2015). ${sarcopeniaRisk ? "⚠️ Your grip is below sarcopenia threshold — immediate intervention recommended." : ""}`, priority: "high", category: "Health Biomarker" },
        { title: "Sarcopenia Assessment", description: `${sarcopeniaRisk ? `Grip ${g} kg is below EWGSOP2 cutoff (${sarcopeniaThreshold} kg). Sarcopenia screening recommended: DEXA for muscle mass, gait speed test, chair stand test. Early intervention with resistance training + protein (1.2-1.6g/kg/day) can reverse muscle loss.` : `Grip above sarcopenia threshold. Maintain with regular resistance training and adequate protein intake. Monitor annually after age 50.`}`, priority: "high", category: "Sarcopenia" },
        { title: "Improvement Protocol", description: `${percentile < 50 ? "Priority: 3x/week grip training — dead hangs (30-60s), farmer walks, plate pinches, wrist curls. Expect 10-25% improvement in 8-12 weeks. Also check vitamin D, thyroid, and testosterone if unexpectedly low." : "Good baseline. Maintain with compound lifts (deadlifts, rows, pull-ups). Advanced: towel pull-ups, thick-grip training."}`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Grip": `${g} kg`, "Body Weight": `${w} kg`, "Relative Grip": relativeGrip, "Age Group": ageGroup, "Percentile": `${percentile}th`, "Sarcopenia Threshold": `${sarcopeniaThreshold} kg`, "Sarcopenia Risk": sarcopeniaRisk ? "Yes" : "No" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="grip-strength" title="Grip Strength Calculator"
      description="Assess grip strength percentile ranking with sarcopenia risk detection, mortality correlation, and neuromuscular integrity analysis."
      icon={Dumbbell} calculate={calculate} onClear={() => { setGripKg(45); setAge(35); setGender("male"); setBodyWeight(75); setResult(null) }}
      values={[gripKg, age, gender, bodyWeight]} result={result}
      seoContent={<SeoContentGenerator title="Grip Strength Calculator" description="Calculate grip strength percentile with sarcopenia and mortality risk analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Grip Strength (Dynamometer)" val={gripKg} set={setGripKg} min={5} max={120} suffix="kg" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={100} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={250} suffix="kg" />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 27. VERTICAL JUMP CALCULATOR (Explosive Power Index)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function VerticalJumpCalculator() {
  const [jumpHeight, setJumpHeight] = useState(55)
  const [bodyWeight, setBodyWeight] = useState(75)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(jumpHeight, 10, 120)   // cm
    const w = clamp(bodyWeight, 30, 200)
    const male = gender === "male"

    // Sayers Power Equation: Peak Power (W) = 60.7 × jump height (cm) + 45.3 × body mass (kg) − 2055
    const peakPower = r0(60.7 * h + 45.3 * w - 2055)
    const relativePower = r1(peakPower / w)

    // Fast-twitch fiber estimate (based on jump height)
    const ftEstimate = r0(Math.min(85, 30 + h * 0.5))

    // Percentile (simplified norms)
    let percentile = 0
    if (male) {
      if (h >= 70) percentile = 95
      else if (h >= 60) percentile = 75 + r0((h - 60) / 10 * 20)
      else if (h >= 50) percentile = 50 + r0((h - 50) / 10 * 25)
      else if (h >= 40) percentile = 25 + r0((h - 40) / 10 * 25)
      else percentile = Math.max(1, r0(h / 40 * 25))
    } else {
      if (h >= 55) percentile = 95
      else if (h >= 45) percentile = 75 + r0((h - 45) / 10 * 20)
      else if (h >= 35) percentile = 50 + r0((h - 35) / 10 * 25)
      else if (h >= 25) percentile = 25 + r0((h - 25) / 10 * 25)
      else percentile = Math.max(1, r0(h / 25 * 25))
    }

    // Athletic classification
    let classification = ""
    if (percentile >= 90) classification = "Elite"
    else if (percentile >= 75) classification = "Above Average"
    else if (percentile >= 50) classification = "Average"
    else if (percentile >= 25) classification = "Below Average"
    else classification = "Needs Improvement"

    // Athletic potential index
    const athleticIdx = r0(Math.min(100, percentile * 0.7 + ftEstimate * 0.3))

    const status: 'normal' | 'warning' | 'danger' | 'good' = percentile >= 50 ? "good" : percentile >= 25 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Peak Power", value: peakPower, unit: "W", status, description: `${h} cm jump — ${classification} (${percentile}th percentile)` },
      healthScore: Math.min(100, percentile + 5),
      metrics: [
        { label: "Jump Height", value: h, unit: "cm", status },
        { label: "Peak Power (Sayers)", value: peakPower, unit: "W", status: "normal" },
        { label: "Relative Power", value: relativePower, unit: "W/kg", status: relativePower > 50 ? "good" : relativePower > 35 ? "normal" : "warning" },
        { label: "Percentile", value: percentile, unit: "th", status },
        { label: "Classification", value: classification, status },
        { label: "Fast-Twitch Estimate", value: ftEstimate, unit: "%", status: ftEstimate > 60 ? "good" : "normal" },
        { label: "Athletic Potential", value: athleticIdx, unit: "/100", status: athleticIdx > 70 ? "good" : athleticIdx > 40 ? "normal" : "warning" }
      ],
      recommendations: [
        { title: "Power Analysis", description: `Peak power: ${peakPower} W (${relativePower} W/kg). ${classification} for ${gender}. Vertical jump is the gold standard for lower-body explosive power. Correlates strongly with sprint speed (r=0.73) and change-of-direction ability.`, priority: "high", category: "Power" },
        { title: "Training Protocol", description: `${percentile < 50 ? "Priority: plyometric training (depth jumps, box jumps, squat jumps). Also strengthen squats and deadlifts — strength is the foundation of power. Expect 5-10% improvement in 8-12 weeks with structured plyometrics." : "Strong baseline. Advanced: contrast training (heavy squat + jump), weighted jumps, reactive plyometrics. Elite athletes train power 2-3x/week with full recovery between sessions."}`, priority: "high", category: "Training" },
        { title: "Fast-Twitch Fiber Profile", description: `Estimated fast-twitch %: ${ftEstimate}%. Higher proportions of Type II fibers correlate with greater jump height. Genetics determine fiber ratio, but training can improve Type IIa performance by 20-30%. Heavy resistance training + plyometrics optimizes Type II recruitment.`, priority: "medium", category: "Physiology" }
      ],
      detailedBreakdown: { "Jump Height": `${h} cm`, "Body Weight": `${w} kg`, "Peak Power": `${peakPower} W`, "Relative Power": `${relativePower} W/kg`, "Fast-Twitch": `${ftEstimate}%`, "Percentile": `${percentile}th`, "Classification": classification }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="vertical-jump" title="Vertical Jump Calculator"
      description="Calculate vertical jump power output (Sayers equation), explosive power percentile, fast-twitch fiber estimate, and athletic potential index."
      icon={TrendingUp} calculate={calculate} onClear={() => { setJumpHeight(55); setBodyWeight(75); setGender("male"); setResult(null) }}
      values={[jumpHeight, bodyWeight, gender]} result={result}
      seoContent={<SeoContentGenerator title="Vertical Jump Calculator" description="Calculate vertical jump power, percentile, and athletic potential." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Jump Height" val={jumpHeight} set={setJumpHeight} min={10} max={120} suffix="cm" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={200} suffix="kg" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 28. BROAD JUMP CALCULATOR (Horizontal Power Model)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function BroadJumpCalculator() {
  const [jumpDistance, setJumpDistance] = useState(220)
  const [bodyWeight, setBodyWeight] = useState(75)
  const [gender, setGender] = useState("male")
  const [height, setHeight] = useState(175)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(jumpDistance, 50, 400)   // cm
    const w = clamp(bodyWeight, 30, 200)
    const h = clamp(height, 140, 220)
    const male = gender === "male"

    // Relative power index (distance / height ratio)
    const relPowerIdx = r2(d / h)

    // Horizontal power estimate (simplified)
    const horizontalPower = r0(w * 9.81 * (d / 100) / 0.5)   // approximate take-off force

    // Sprint correlation estimate (broad jump predicts 10m & 40yd dash)
    const sprintCorrelation = r0(Math.min(100, d * 0.3 + (male ? 10 : 0)))

    // Percentile (simplified)
    let percentile = 0
    if (male) {
      if (d >= 280) percentile = 95
      else if (d >= 240) percentile = 70 + r0((d - 240) / 40 * 25)
      else if (d >= 200) percentile = 40 + r0((d - 200) / 40 * 30)
      else percentile = Math.max(1, r0(d / 200 * 40))
    } else {
      if (d >= 230) percentile = 95
      else if (d >= 190) percentile = 70 + r0((d - 190) / 40 * 25)
      else if (d >= 150) percentile = 40 + r0((d - 150) / 40 * 30)
      else percentile = Math.max(1, r0(d / 150 * 40))
    }

    const status: 'normal' | 'warning' | 'danger' | 'good' = percentile >= 50 ? "good" : percentile >= 25 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Broad Jump Distance", value: d, unit: "cm", status, description: `${percentile}th percentile — Relative Power Index: ${relPowerIdx}` },
      healthScore: Math.min(100, percentile + 5),
      metrics: [
        { label: "Jump Distance", value: d, unit: "cm", status },
        { label: "Relative Power Index", value: relPowerIdx, unit: "d/h", status: relPowerIdx > 1.3 ? "good" : relPowerIdx > 1.1 ? "normal" : "warning" },
        { label: "Horizontal Power", value: horizontalPower, unit: "N", status: "normal" },
        { label: "Percentile", value: percentile, unit: "th", status },
        { label: "Sprint Correlation Score", value: sprintCorrelation, unit: "/100", status: sprintCorrelation > 70 ? "good" : "normal" }
      ],
      recommendations: [
        { title: "Horizontal Power Analysis", description: `${d} cm (${percentile}th percentile). Broad jump measures hip extension power — critical for sprinting, cutting, and acceleration. ${relPowerIdx > 1.3 ? "Excellent power-to-height ratio." : relPowerIdx > 1.1 ? "Average ratio — target >1.3x height." : "Below average — focus on hip and glute development."}`, priority: "high", category: "Power" },
        { title: "Sprint Performance Link", description: `Sprint correlation: ${sprintCorrelation}/100. Broad jump correlates r=0.6-0.7 with 10m sprint and 40-yard dash. Athletes broad jumping >240 cm (male) typically sprint 40 yards in <4.8 sec. Improving jump by 20 cm can reduce 10m sprint by 0.05-0.1 sec.`, priority: "high", category: "Sprint" },
        { title: "Training Approach", description: `${percentile < 50 ? "Priority: hip thrust, box squat, sled push, single-leg bounds. Horizontal plyometrics (bounding, broad jump progressions) transfer directly. Also strengthen hip flexors for knee drive." : "Advanced: resisted broad jumps, weighted step-ups, depth jump to broad jump. Maintain with 2x/week horizontal power sessions."}`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Distance": `${d} cm`, "Height": `${h} cm`, "Relative Power": relPowerIdx, "Horizontal Force": `${horizontalPower} N`, "Percentile": `${percentile}th`, "Sprint Score": `${sprintCorrelation}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="broad-jump" title="Broad Jump Calculator"
      description="Calculate broad jump power with horizontal force estimate, sprint correlation, and relative power index for athletic benchmarking."
      icon={TrendingUp} calculate={calculate} onClear={() => { setJumpDistance(220); setBodyWeight(75); setGender("male"); setHeight(175); setResult(null) }}
      values={[jumpDistance, bodyWeight, gender, height]} result={result}
      seoContent={<SeoContentGenerator title="Broad Jump Calculator" description="Calculate broad jump power and sprint performance correlation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Jump Distance" val={jumpDistance} set={setJumpDistance} min={50} max={400} suffix="cm" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={200} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={140} max={220} suffix="cm" />
        </div>
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 29. SHUTTLE RUN SCORE (Agility & Anaerobic Index)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function ShuttleRunCalculator() {
  const [distance, setDistance] = useState(20)
  const [time, setTime] = useState(9.5)
  const [age, setAge] = useState(25)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distance, 5, 100)   // meters
    const t = clamp(time, 2, 60)   // seconds
    const a = clamp(age, 10, 70)
    const male = gender === "male"

    const speed = r2(d / t)   // m/s
    const agilityScore = r0(Math.min(100, speed * 8 + (d >= 20 ? 15 : 0)))

    // Anaerobic capacity estimate based on short burst performance
    const anaerobicCap = r0(Math.min(100, speed * 10 + (t < 10 ? 10 : 0)))

    // Injury risk (knee/ankle load from rapid direction changes)
    const decelForce = r0(speed * speed * 0.5)   // simplified
    const injuryRisk = r0(Math.min(100, decelForce * 3 + (a > 40 ? 15 : 0)))

    // Percentile (5-10-5 shuttle / pro agility norms, simplified)
    let percentile = 0
    if (d === 20) {
      if (male) percentile = t < 8.5 ? 95 : t < 9.5 ? 70 : t < 10.5 ? 45 : t < 12 ? 20 : 5
      else percentile = t < 9.5 ? 95 : t < 10.5 ? 70 : t < 11.5 ? 45 : t < 13 ? 20 : 5
    } else {
      percentile = r0(Math.min(95, Math.max(5, speed * 12)))
    }

    const status: 'normal' | 'warning' | 'danger' | 'good' = percentile >= 50 ? "good" : percentile >= 25 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Agility Score", value: agilityScore, unit: "/100", status, description: `${d}m in ${t}s (${speed} m/s) — ${percentile}th percentile` },
      healthScore: Math.min(100, percentile + 5),
      metrics: [
        { label: "Speed", value: speed, unit: "m/s", status: "normal" },
        { label: "Agility Score", value: agilityScore, unit: "/100", status },
        { label: "Anaerobic Capacity", value: anaerobicCap, unit: "/100", status: anaerobicCap > 70 ? "good" : "normal" },
        { label: "Percentile", value: percentile, unit: "th", status },
        { label: "Deceleration Force", value: decelForce, unit: "N/kg", status: "normal" },
        { label: "Knee/Ankle Injury Risk", value: injuryRisk, unit: "/100", status: injuryRisk > 60 ? "danger" : injuryRisk > 35 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Agility Assessment", description: `Agility score: ${agilityScore}/100 (${percentile}th percentile). Speed: ${speed} m/s. ${percentile >= 70 ? "Excellent agility — competitive level for most field sports." : percentile >= 40 ? "Average agility. Focus on change-of-direction drills and lateral movement." : "Below average — prioritize agility training 2-3x/week."}`, priority: "high", category: "Agility" },
        { title: "Injury Prevention", description: `Knee/ankle risk: ${injuryRisk}/100. Rapid deceleration + direction change creates peak ACL loading. ${injuryRisk > 50 ? "⚠️ Elevated risk — strengthen VMO (quad), hamstrings, and hip stabilizers. Nordic hamstring curls reduce ACL injuries by 51%. Ensure proper cutting mechanics." : "Acceptable risk level. Maintain with regular proprioception and neuromuscular training."}`, priority: "high", category: "Injury Prevention" },
        { title: "Improvement Plan", description: `Target: reduce time by 0.3-0.5s over 6-8 weeks. Drills: 5-10-5 shuttle, T-test, cone drills (3-cone, L-drill), ladder drills. Combine with reactive agility (unpredictable stimulus). Strength base: squat, lunge, lateral bounds.`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Distance": `${d}m`, "Time": `${t}s`, "Speed": `${speed} m/s`, "Agility": `${agilityScore}/100`, "Anaerobic": `${anaerobicCap}/100`, "Injury Risk": `${injuryRisk}/100`, "Percentile": `${percentile}th` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="shuttle-run" title="Shuttle Run Score Calculator"
      description="Calculate shuttle run agility score with anaerobic capacity, change-of-direction speed analysis, and knee/ankle injury risk assessment."
      icon={Timer} calculate={calculate} onClear={() => { setDistance(20); setTime(9.5); setAge(25); setGender("male"); setResult(null) }}
      values={[distance, time, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Shuttle Run Score Calculator" description="Calculate shuttle run agility and anaerobic capacity." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Distance" val={distance} set={setDistance} min={5} max={100} suffix="meters" />
          <NumInput label="Time" val={time} set={setTime} min={2} max={60} step={0.1} suffix="seconds" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={70} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 30. BEEP TEST CALCULATOR (VO₂ & Endurance Field Estimator)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Beep test VO₂ max estimation table (Ramsbottom et al.)
const BEEP_VO2: Record<number, number[]> = {
  1: [18.0, 18.4, 18.8, 19.2, 19.6, 20.0, 20.4],
  2: [20.8, 21.2, 21.6, 22.0, 22.4, 22.8, 23.2, 23.6],
  3: [24.0, 24.4, 24.8, 25.2, 25.6, 26.0, 26.4, 26.8],
  4: [27.2, 27.6, 28.0, 28.4, 28.8, 29.2, 29.6, 30.0, 30.4],
  5: [30.8, 31.2, 31.6, 32.0, 32.4, 32.8, 33.2, 33.6, 34.0],
  6: [34.3, 34.7, 35.1, 35.5, 35.9, 36.3, 36.7, 37.1, 37.5, 37.9],
  7: [38.2, 38.6, 39.0, 39.4, 39.8, 40.2, 40.6, 41.0, 41.5, 41.9],
  8: [42.3, 42.7, 43.1, 43.5, 43.9, 44.3, 44.7, 45.1, 45.5, 45.9, 46.3],
  9: [46.8, 47.2, 47.6, 48.0, 48.4, 48.8, 49.2, 49.6, 50.1, 50.5, 50.9],
  10: [51.4, 51.8, 52.2, 52.6, 53.0, 53.5, 53.9, 54.3, 54.7, 55.2, 55.6],
  11: [56.0, 56.5, 56.9, 57.3, 57.8, 58.2, 58.6, 59.1, 59.5, 59.9, 60.4],
  12: [60.8, 61.2, 61.7, 62.1, 62.5, 63.0, 63.4, 63.8, 64.3, 64.7, 65.1, 65.6],
  13: [66.0, 66.4, 66.9, 67.3, 67.7, 68.2, 68.6, 69.0, 69.5, 69.9, 70.3, 70.8, 71.2],
  14: [71.6, 72.1, 72.5, 72.9, 73.4, 73.8, 74.2, 74.7, 75.1, 75.5, 76.0, 76.4, 76.8],
  15: [77.3, 77.7, 78.1, 78.6, 79.0, 79.4, 79.9, 80.3, 80.7, 81.2, 81.6, 82.0, 82.5]
}

export function BeepTestCalculator() {
  const [level, setLevel] = useState(8)
  const [shuttle, setShuttle] = useState(5)
  const [age, setAge] = useState(25)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lv = clamp(level, 1, 15)
    const sh = clamp(shuttle, 1, 13)
    const a = clamp(age, 10, 70)
    const male = gender === "male"

    const levelData = BEEP_VO2[lv] || BEEP_VO2[1]
    const idx = Math.min(sh - 1, levelData.length - 1)
    const vo2max = r1(levelData[idx])

    // Total distance
    let totalShuttles = 0
    for (let i = 1; i < lv; i++) totalShuttles += (BEEP_VO2[i]?.length || 7)
    totalShuttles += sh
    const totalDistance = totalShuttles * 20   // 20m per shuttle

    // Fitness category
    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    const threshold = male ? [35, 42, 50, 57] : [28, 35, 42, 50]
    if (vo2max >= threshold[3]) { category = "Excellent"; status = "good" }
    else if (vo2max >= threshold[2]) { category = "Good"; status = "good" }
    else if (vo2max >= threshold[1]) { category = "Average"; status = "normal" }
    else if (vo2max >= threshold[0]) { category = "Below Average"; status = "warning" }
    else { category = "Poor"; status = "danger" }

    // Cardio risk reduction
    const riskReduction = r0(Math.min(50, vo2max * 0.6))

    // Endurance prediction (estimated 5K time in min)
    const est5k = r1(Math.max(15, 50 - vo2max * 0.5))

    setResult({
      primaryMetric: { label: "Estimated VO₂ Max", value: vo2max, unit: "mL/kg/min", status, description: `Level ${lv}.${sh} — ${category} | ${totalDistance}m covered` },
      healthScore: Math.min(100, r0(vo2max * 1.5)),
      metrics: [
        { label: "VO₂ Max", value: vo2max, unit: "mL/kg/min", status },
        { label: "Level Reached", value: `${lv}.${sh}`, status: "normal" },
        { label: "Total Distance", value: totalDistance, unit: "m", status: "normal" },
        { label: "Total Shuttles", value: totalShuttles, status: "normal" },
        { label: "Fitness Category", value: category, status },
        { label: "Cardio Risk Reduction", value: riskReduction, unit: "%", status: riskReduction > 25 ? "good" : "normal" },
        { label: "Estimated 5K Time", value: est5k, unit: "min", status: est5k < 22 ? "good" : est5k < 28 ? "normal" : "warning" }
      ],
      recommendations: [
        { title: "VO₂ Max Interpretation", description: `VO₂ max: ${vo2max} mL/kg/min (${category}). VO₂ max is the strongest predictor of cardiovascular mortality. Each 1 mL/kg/min increase reduces all-cause mortality by ~3%. ${vo2max < 35 ? "Below 35 is associated with significantly elevated cardiac risk — prioritize aerobic training." : vo2max > 50 ? "Excellent aerobic fitness — maintain with 3-5 sessions/week of varied cardio." : "Moderate fitness — systematic training can improve VO₂ by 15-20% in 8-12 weeks."}`, priority: "high", category: "Cardio Fitness" },
        { title: "Training Prescription", description: `To improve from level ${lv} to ${lv + 2}: 1) 3-4x/week interval training (3-5 min at 90-95% max HR). 2) 1-2x/week long steady runs (60-80% max HR). 3) Progressive overload — add 5% volume/week. Expected improvement: 5-10% VO₂ max in 8-12 weeks.`, priority: "high", category: "Training" },
        { title: "Race Prediction", description: `Estimated 5K: ~${est5k} min based on VO₂ max. Approximate other distances: 10K ~${r1(est5k * 2.1)} min, Half Marathon ~${r1(est5k * 4.7)} min. These predictions assume adequate race-specific training and pacing strategy.`, priority: "medium", category: "Performance" }
      ],
      detailedBreakdown: { "Level": `${lv}.${sh}`, "VO₂ Max": `${vo2max} mL/kg/min`, "Category": category, "Distance": `${totalDistance}m`, "Shuttles": totalShuttles, "5K Estimate": `${est5k} min`, "Risk Reduction": `${riskReduction}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="beep-test" title="Beep Test Calculator"
      description="Calculate VO₂ max from beep test (multistage shuttle run) with fitness classification, race predictions, and cardio risk reduction analysis."
      icon={Heart} calculate={calculate} onClear={() => { setLevel(8); setShuttle(5); setAge(25); setGender("male"); setResult(null) }}
      values={[level, shuttle, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Beep Test Calculator" description="Calculate VO₂ max and fitness level from beep test results." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Level Reached" val={level} set={setLevel} min={1} max={15} />
          <NumInput label="Shuttle Number" val={shuttle} set={setShuttle} min={1} max={13} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={70} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 31. YO-YO TEST CALCULATOR (Intermittent Endurance Analyzer)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function YoYoTestCalculator() {
  const [distanceCompleted, setDistanceCompleted] = useState(1200)
  const [level, setLevel] = useState(16)
  const [gender, setGender] = useState("male")
  const [sport, setSport] = useState("soccer")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dist = clamp(distanceCompleted, 120, 4000)
    const lv = clamp(level, 5, 23)
    const male = gender === "male"

    // Yo-Yo IR1 VO₂ max estimation (Bangsbo 2008)
    const vo2max = r1(dist * 0.0084 + 36.4)

    // Intermittent endurance score (0-100)
    const enduranceScore = r0(Math.min(100, dist * 0.04))

    // Recovery capacity index
    const recoveryIdx = r0(Math.min(100, lv * 4 + (dist > 1500 ? 15 : 0)))

    // Sport-specific benchmarks
    const sportNorms: Record<string, { good: number; elite: number }> = {
      soccer: { good: 1200, elite: 2400 }, rugby: { good: 1000, elite: 2000 },
      basketball: { good: 800, elite: 1600 }, hockey: { good: 1100, elite: 2200 },
      tennis: { good: 900, elite: 1800 }, "general-athlete": { good: 800, elite: 1600 }
    }
    const norms = sportNorms[sport] || sportNorms["general-athlete"]
    const sportPercentile = r0(Math.min(99, Math.max(1, dist / norms.elite * 75)))

    // Game performance prediction
    let gameReady = ""
    if (dist >= norms.elite) gameReady = "Elite — full match capacity"
    else if (dist >= norms.good) gameReady = "Good — adequate match fitness"
    else gameReady = "Below standard — limited match endurance"

    // Fatigue resistance (ability to maintain repeated high-intensity efforts)
    const fatigueResistance = r0(Math.min(100, recoveryIdx * 0.6 + enduranceScore * 0.4))

    const status: 'normal' | 'warning' | 'danger' | 'good' = dist >= norms.good ? "good" : dist >= norms.good * 0.7 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "VO₂ Max Estimate", value: vo2max, unit: "mL/kg/min", status, description: `Level ${lv} — ${dist}m completed | ${gameReady}` },
      healthScore: Math.min(100, r0(enduranceScore * 0.7 + recoveryIdx * 0.3)),
      metrics: [
        { label: "Distance Completed", value: dist, unit: "m", status },
        { label: "Level Reached", value: lv, status: "normal" },
        { label: "VO₂ Max Estimate", value: vo2max, unit: "mL/kg/min", status },
        { label: "Endurance Score", value: enduranceScore, unit: "/100", status: enduranceScore > 60 ? "good" : "normal" },
        { label: "Recovery Capacity", value: recoveryIdx, unit: "/100", status: recoveryIdx > 60 ? "good" : "normal" },
        { label: "Fatigue Resistance", value: fatigueResistance, unit: "/100", status: fatigueResistance > 60 ? "good" : "normal" },
        { label: `${sport.replace(/-/g, " ")} Percentile`, value: sportPercentile, unit: "th", status: sportPercentile > 50 ? "good" : "warning" },
        { label: "Match Readiness", value: gameReady, status }
      ],
      recommendations: [
        { title: "Yo-Yo Test Analysis", description: `${dist}m (Level ${lv}) = VO₂ ${vo2max} mL/kg/min. The Yo-Yo IR1 specifically tests intermittent endurance — more sport-relevant than continuous VO₂ tests for team sports. ${dist >= norms.elite ? "Elite level — you can sustain full competitive demands." : `Target: ${norms.elite}m for elite ${sport} standard.`}`, priority: "high", category: "Intermittent Fitness" },
        { title: "Recovery & Fatigue Resistance", description: `Recovery index: ${recoveryIdx}/100, Fatigue resistance: ${fatigueResistance}/100. ${fatigueResistance > 70 ? "Strong repeated-sprint recovery — can maintain intensity across full match." : "Improvement needed — focus on interval training (4-6 × 4 min at 90-95% HRmax) and small-sided games for sport-specific conditioning."}`, priority: "high", category: "Recovery" },
        { title: "Seasonal Fitness Planning", description: `Pre-season target: reach ${norms.elite}m. In-season maintenance: Yo-Yo test monthly. Off-season base: aerobic foundation. Protocol: 2x/week high-intensity intervals + 1x/week long aerobic session. Expect ${r0(dist * 0.1)}-${r0(dist * 0.2)}m improvement in 6-8 weeks.`, priority: "medium", category: "Planning" }
      ],
      detailedBreakdown: { "Distance": `${dist}m`, "Level": lv, "VO₂ Max": `${vo2max} mL/kg/min`, "Endurance": `${enduranceScore}/100`, "Recovery": `${recoveryIdx}/100`, "Fatigue Resistance": `${fatigueResistance}/100`, "Sport": sport, "Match Ready": gameReady }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="yo-yo-test" title="Yo-Yo Test Calculator"
      description="Calculate Yo-Yo intermittent recovery test results with sport-specific benchmarks, fatigue resistance, and match readiness analysis."
      icon={Activity} calculate={calculate} onClear={() => { setDistanceCompleted(1200); setLevel(16); setGender("male"); setSport("soccer"); setResult(null) }}
      values={[distanceCompleted, level, gender, sport]} result={result}
      seoContent={<SeoContentGenerator title="Yo-Yo Test Calculator" description="Calculate Yo-Yo test fitness score with sport-specific analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Distance Completed" val={distanceCompleted} set={setDistanceCompleted} min={120} max={4000} suffix="m" />
          <NumInput label="Level Reached" val={level} set={setLevel} min={5} max={23} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <SelectInput label="Sport" val={sport} set={setSport} options={[{ value: "soccer", label: "Soccer/Football" }, { value: "rugby", label: "Rugby" }, { value: "basketball", label: "Basketball" }, { value: "hockey", label: "Hockey" }, { value: "tennis", label: "Tennis" }, { value: "general-athlete", label: "General Athlete" }]} />
        </div>
      </div>} />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 32. NAVY SEAL PST CALCULATOR (Tactical Fitness Composite Index)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function NavySealPSTCalculator() {
  const [pushups, setPushups] = useState(60)
  const [situps, setSitups] = useState(65)
  const [pullups, setPullups] = useState(12)
  const [runMin, setRunMin] = useState(10)
  const [runSec, setRunSec] = useState(30)
  const [swimMin, setSwimMin] = useState(9)
  const [swimSec, setSwimSec] = useState(0)
  const [age, setAge] = useState(25)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pu = clamp(pushups, 0, 200)
    const su = clamp(situps, 0, 200)
    const pl = clamp(pullups, 0, 50)
    const runTime = clamp(runMin, 0, 20) * 60 + clamp(runSec, 0, 59)   // total seconds
    const swimTime = clamp(swimMin, 0, 20) * 60 + clamp(swimSec, 0, 59)

    // PST minimum standards (BUD/S entry)
    const puMin = 50, suMin = 50, plMin = 10, runMax = 10 * 60 + 30, swimMax = 12 * 60 + 30
    // Competitive standards
    const puComp = 80, suComp = 80, plComp = 18, runComp = 9 * 60, swimComp = 8 * 60

    // Individual scores (0-100 scale)
    const puScore = r0(Math.min(100, pu / puComp * 80 + (pu >= puMin ? 20 : 0)))
    const suScore = r0(Math.min(100, su / suComp * 80 + (su >= suMin ? 20 : 0)))
    const plScore = r0(Math.min(100, pl / plComp * 80 + (pl >= plMin ? 20 : 0)))
    const runScore = r0(Math.min(100, runTime > 0 ? (runComp / runTime) * 80 + (runTime <= runMax ? 20 : 0) : 0))
    const swimScore = r0(Math.min(100, swimTime > 0 ? (swimComp / swimTime) * 80 + (swimTime <= swimMax ? 20 : 0) : 0))

    const compositeScore = r0((puScore + suScore + plScore + runScore + swimScore) / 5)

    // Pass/fail each event
    const puPass = pu >= puMin
    const suPass = su >= suMin
    const plPass = pl >= plMin
    const runPass = runTime <= runMax && runTime > 0
    const swimPass = swimTime <= swimMax && swimTime > 0
    const allPass = puPass && suPass && plPass && runPass && swimPass

    // Tactical readiness level
    let readiness = "", status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (compositeScore >= 85 && allPass) { readiness = "🟢 Competitive — High Selection Probability"; status = "good" }
    else if (compositeScore >= 65 && allPass) { readiness = "🟢 Qualified — Meets Standards"; status = "good" }
    else if (allPass) { readiness = "🟡 Borderline — Minimum Standards"; status = "warning" }
    else { readiness = "🔴 Below Standard — Not Qualified"; status = "danger" }

    // Strength vs endurance imbalance
    const strengthAvg = (puScore + suScore + plScore) / 3
    const enduranceAvg = (runScore + swimScore) / 2
    const imbalance = r0(Math.abs(strengthAvg - enduranceAvg))
    const weakArea = strengthAvg < enduranceAvg ? "Strength" : "Endurance"

    // Selection probability estimate
    const selectionProb = r0(Math.min(95, allPass ? compositeScore * 0.8 + (compositeScore >= 80 ? 15 : 0) : 5))

    // Weakest component
    const scores = { "Push-ups": puScore, "Sit-ups": suScore, "Pull-ups": plScore, "Run": runScore, "Swim": swimScore }
    const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]

    // Overload flag
    const overloadRisk = r0(Math.min(100, (pu > 100 ? 15 : 0) + (su > 100 ? 15 : 0) + (pl > 20 ? 10 : 0) + (runTime < 8 * 60 ? 10 : 0)))

    const runTimeStr = `${Math.floor(runTime / 60)}:${String(runTime % 60).padStart(2, "0")}`
    const swimTimeStr = `${Math.floor(swimTime / 60)}:${String(swimTime % 60).padStart(2, "0")}`

    setResult({
      primaryMetric: { label: "Composite PST Score", value: compositeScore, unit: "/100", status, description: `${readiness}` },
      healthScore: compositeScore,
      metrics: [
        { label: "Push-ups (2 min)", value: pu, unit: `score: ${puScore}`, status: puPass ? "good" : "danger" },
        { label: "Sit-ups (2 min)", value: su, unit: `score: ${suScore}`, status: suPass ? "good" : "danger" },
        { label: "Pull-ups", value: pl, unit: `score: ${plScore}`, status: plPass ? "good" : "danger" },
        { label: "1.5 Mile Run", value: runTimeStr, unit: `score: ${runScore}`, status: runPass ? "good" : "danger" },
        { label: "500 Yard Swim", value: swimTimeStr, unit: `score: ${swimScore}`, status: swimPass ? "good" : "danger" },
        { label: "Composite Score", value: compositeScore, unit: "/100", status },
        { label: "Tactical Readiness", value: readiness, status },
        { label: "All Events Passed", value: allPass ? "YES ✓" : "NO ✗", status: allPass ? "good" : "danger" },
        { label: "Selection Probability", value: selectionProb, unit: "%", status: selectionProb > 60 ? "good" : selectionProb > 30 ? "warning" : "danger" },
        { label: "Weakest Component", value: `${weakest[0]} (${weakest[1]}/100)`, status: weakest[1] < 50 ? "danger" : "warning" },
        { label: "Imbalance", value: `${weakArea} deficit: ${imbalance} pts`, status: imbalance > 20 ? "warning" : "good" },
        { label: "Overload Pattern Risk", value: overloadRisk, unit: "/100", status: overloadRisk > 30 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "PST Assessment", description: `Composite: ${compositeScore}/100. ${allPass ? `All events passed. ${compositeScore >= 80 ? "Competitive profile — top 30% of applicants. Focus on maintaining while building mental toughness." : `Meets minimum but competitive candidates average 80+. Weakest area: ${weakest[0]} (${weakest[1]}/100) — prioritize this.`}` : `⚠️ Failed events: ${!puPass ? "Push-ups, " : ""}${!suPass ? "Sit-ups, " : ""}${!plPass ? "Pull-ups, " : ""}${!runPass ? "Run, " : ""}${!swimPass ? "Swim" : ""}. Must pass all events before applying.`}`, priority: "high", category: "Assessment" },
        { title: "Targeted Training Plan", description: `Weakest: ${weakest[0]} (${weakest[1]}/100). ${weakest[0] === "Push-ups" ? "Grease the groove: 5-10 sets throughout day, 50% of max. Supplement with bench press, dips. Target: 80+ in 8 weeks." : weakest[0] === "Pull-ups" ? "Daily pull-up program: 5 sets, progressive volume. Add lat pulldowns, rows, negatives. Target: 18+ in 8 weeks." : weakest[0] === "Run" ? "Interval training: 6×800m at goal pace, 2-3x/week. Long run 1x/week. Target sub-9:30 in 8 weeks." : weakest[0] === "Swim" ? "CSS training: 10×100yd at threshold pace. Technique focus: bilateral breathing, streamlined turns. Target sub-9:00 in 8 weeks." : "Ab-wheel, hanging leg raises, Flutter kicks. 4x/week core work. Target: 80+ in 6 weeks."}`, priority: "high", category: "Training" },
        { title: "Selection Readiness", description: `Selection probability: ${selectionProb}%. BUD/S completion rate is ~25%. Competitive minimums: 80 push-ups, 80 sit-ups, 18 pull-ups, 9:00 run, 8:00 swim. Mental endurance is the #1 predictor of completion — train in cold water, sleep-deprived conditions, and discomfort tolerance progressively.`, priority: "medium", category: "Selection" }
      ],
      detailedBreakdown: { "Push-ups": `${pu} (${puPass ? "PASS" : "FAIL"}, ${puScore}/100)`, "Sit-ups": `${su} (${suPass ? "PASS" : "FAIL"}, ${suScore}/100)`, "Pull-ups": `${pl} (${plPass ? "PASS" : "FAIL"}, ${plScore}/100)`, "Run": `${runTimeStr} (${runPass ? "PASS" : "FAIL"}, ${runScore}/100)`, "Swim": `${swimTimeStr} (${swimPass ? "PASS" : "FAIL"}, ${swimScore}/100)`, "Composite": `${compositeScore}/100`, "Selection %": `${selectionProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="navy-seal-pst" title="Navy SEAL PST Calculator"
      description="Calculate Navy SEAL Physical Screening Test composite score with selection probability, component analysis, strength-endurance balance, and targeted training plan."
      icon={Shield} calculate={calculate} onClear={() => { setPushups(60); setSitups(65); setPullups(12); setRunMin(10); setRunSec(30); setSwimMin(9); setSwimSec(0); setAge(25); setResult(null) }}
      values={[pushups, situps, pullups, runMin, runSec, swimMin, swimSec, age]} result={result}
      seoContent={<SeoContentGenerator title="Navy SEAL PST Calculator" description="Calculate Navy SEAL PST score with selection probability and training analysis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Push-ups (2 min)" val={pushups} set={setPushups} min={0} max={200} />
          <NumInput label="Sit-ups (2 min)" val={situps} set={setSitups} min={0} max={200} />
          <NumInput label="Pull-ups" val={pullups} set={setPullups} min={0} max={50} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="1.5 Mile Run (min)" val={runMin} set={setRunMin} min={0} max={20} />
          <NumInput label="Run (sec)" val={runSec} set={setRunSec} min={0} max={59} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="500 Yard Swim (min)" val={swimMin} set={setSwimMin} min={0} max={20} />
          <NumInput label="Swim (sec)" val={swimSec} set={setSwimSec} min={0} max={59} />
        </div>
        <NumInput label="Age" val={age} set={setAge} min={17} max={45} suffix="years" />
      </div>} />
  )
}
