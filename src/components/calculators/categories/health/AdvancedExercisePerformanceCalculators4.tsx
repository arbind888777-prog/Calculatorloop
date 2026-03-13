"use client"
import { useState } from "react"
import { Shield, Target, Zap, Activity, Timer, TrendingUp, Bike, Waves } from "lucide-react"
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

// ═══════════════════════════════════════════════════════════════════════════════
// ACFT Scoring Tables (simplified linear interpolation model)
// ═══════════════════════════════════════════════════════════════════════════════

function acftDeadliftScore(weight: number, gender: string): number {
  const max = gender === "male" ? 340 : 210
  const min = gender === "male" ? 140 : 120
  if (weight >= max) return 100
  if (weight <= min) return 0
  return r0(((weight - min) / (max - min)) * 100)
}
function acftPowerThrowScore(dist: number, gender: string): number {
  const max = gender === "male" ? 12.5 : 8.4
  const min = gender === "male" ? 4.5 : 3.3
  if (dist >= max) return 100
  if (dist <= min) return 0
  return r0(((dist - min) / (max - min)) * 100)
}
function acftPushupScore(reps: number, gender: string): number {
  const max = gender === "male" ? 60 : 40
  const min = gender === "male" ? 10 : 10
  if (reps >= max) return 100
  if (reps <= min) return 0
  return r0(((reps - min) / (max - min)) * 100)
}
function acftSDCScore(timeSec: number, gender: string): number {
  const best = gender === "male" ? 93 : 114
  const worst = gender === "male" ? 180 : 210
  if (timeSec <= best) return 100
  if (timeSec >= worst) return 0
  return r0(((worst - timeSec) / (worst - best)) * 100)
}
function acftPlankScore(timeSec: number): number {
  if (timeSec >= 220) return 100
  if (timeSec <= 75) return 0
  return r0(((timeSec - 75) / (220 - 75)) * 100)
}
function acftRunScore(timeSec: number, gender: string): number {
  const best = gender === "male" ? 780 : 900
  const worst = gender === "male" ? 1260 : 1380
  if (timeSec <= best) return 100
  if (timeSec >= worst) return 0
  return r0(((worst - timeSec) / (worst - best)) * 100)
}

// ─── 33. Army ACFT Calculator ─────────────────────────────────────────────────
export function ArmyACFTCalculator() {
  const [deadlift, setDeadlift] = useState(200)
  const [powerThrow, setPowerThrow] = useState(8.0)
  const [pushups, setPushups] = useState(30)
  const [sdcMin, setSdcMin] = useState(2)
  const [sdcSec, setSdcSec] = useState(10)
  const [plankMin, setPlankMin] = useState(2)
  const [plankSec, setPlankSec] = useState(30)
  const [runMin, setRunMin] = useState(16)
  const [runSec, setRunSec] = useState(0)
  const [age, setAge] = useState(25)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dl = clamp(deadlift, 100, 400)
    const pt = clamp(powerThrow, 2, 15)
    const pu = clamp(pushups, 0, 80)
    const sdcTime = clamp(sdcMin * 60 + sdcSec, 60, 300)
    const plankTime = clamp(plankMin * 60 + plankSec, 30, 300)
    const runTime = clamp(runMin * 60 + runSec, 600, 1500)

    const dlScore = acftDeadliftScore(dl, gender)
    const ptScore = acftPowerThrowScore(pt, gender)
    const puScore = acftPushupScore(pu, gender)
    const sdcScore = acftSDCScore(sdcTime, gender)
    const pkScore = acftPlankScore(plankTime)
    const rnScore = acftRunScore(runTime, gender)

    const scores = [dlScore, ptScore, puScore, sdcScore, pkScore, rnScore]
    const labels = ["Deadlift", "Power Throw", "Push-ups", "Sprint-Drag-Carry", "Plank", "2-Mile Run"]
    const totalScore = r0(scores.reduce((a, b) => a + b, 0) / 6)
    const minScore = Math.min(...scores)
    const weakIdx = scores.indexOf(minScore)

    // Strength vs endurance imbalance
    const strengthAvg = r0((dlScore + ptScore + puScore) / 3)
    const enduranceAvg = r0((sdcScore + pkScore + rnScore) / 3)
    const imbalance = Math.abs(strengthAvg - enduranceAvg)

    // Combat readiness index
    const combatReadiness = r0(totalScore * 0.7 + Math.min(minScore, 60) * 0.3)

    // Injury risk
    const injuryRisk = imbalance > 30 ? "High" : imbalance > 15 ? "Moderate" : "Low"
    const injuryProb = imbalance > 30 ? r0(25 + imbalance * 0.5) : imbalance > 15 ? r0(10 + imbalance * 0.3) : r0(5 + imbalance * 0.1)

    // Selection percentile
    const percentile = r0(Math.min(99, totalScore * 0.95))

    let status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    let readiness = "Deployment Ready"
    if (totalScore < 40) { status = "danger"; readiness = "Below Standard" }
    else if (totalScore < 60) { status = "warning"; readiness = "Needs Improvement" }
    else if (minScore < 30) { status = "danger"; readiness = "High Injury Risk" }

    const riskColor = status === "good" ? "🟢 Green" : status === "warning" ? "🟡 Yellow" : injuryProb > 25 ? "🟣 Purple" : "🔴 Red"

    // 12-week projection
    const projectedScore = r0(Math.min(100, totalScore + (100 - totalScore) * 0.25))

    setResult({
      primaryMetric: { label: "ACFT Score", value: totalScore, unit: "/100", status, description: `${readiness} — ${riskColor}` },
      healthScore: totalScore,
      metrics: [
        { label: "Deadlift Score", value: dlScore, unit: "/100", status: dlScore >= 60 ? "good" : dlScore >= 40 ? "warning" : "danger" },
        { label: "Power Throw Score", value: ptScore, unit: "/100", status: ptScore >= 60 ? "good" : ptScore >= 40 ? "warning" : "danger" },
        { label: "Push-up Score", value: puScore, unit: "/100", status: puScore >= 60 ? "good" : puScore >= 40 ? "warning" : "danger" },
        { label: "Sprint-Drag-Carry Score", value: sdcScore, unit: "/100", status: sdcScore >= 60 ? "good" : sdcScore >= 40 ? "warning" : "danger" },
        { label: "Plank Score", value: pkScore, unit: "/100", status: pkScore >= 60 ? "good" : pkScore >= 40 ? "warning" : "danger" },
        { label: "2-Mile Run Score", value: rnScore, unit: "/100", status: rnScore >= 60 ? "good" : rnScore >= 40 ? "warning" : "danger" },
        { label: "Weakest Event", value: labels[weakIdx], status: "danger" },
        { label: "Strength Average", value: strengthAvg, unit: "/100", status: strengthAvg >= 60 ? "good" : "warning" },
        { label: "Endurance Average", value: enduranceAvg, unit: "/100", status: enduranceAvg >= 60 ? "good" : "warning" },
        { label: "Strength-Endurance Imbalance", value: imbalance, unit: "pts", status: imbalance < 15 ? "good" : imbalance < 30 ? "warning" : "danger" },
        { label: "Combat Readiness Index", value: combatReadiness, unit: "/100", status: combatReadiness >= 60 ? "good" : combatReadiness >= 40 ? "warning" : "danger" },
        { label: "Lower-Body Injury Risk", value: `${injuryProb}% (${injuryRisk})`, status: injuryRisk === "Low" ? "good" : injuryRisk === "Moderate" ? "warning" : "danger" },
        { label: "Selection Percentile", value: percentile, unit: "%ile", status: percentile >= 70 ? "good" : percentile >= 40 ? "warning" : "danger" },
        { label: "12-Week Projection", value: projectedScore, unit: "/100", status: "normal" }
      ],
      recommendations: [
        { title: "Combat Readiness Assessment", description: `Composite score ${totalScore}/100 — ${readiness}. ${riskColor}. Combat Readiness Index: ${combatReadiness}. ${minScore < 40 ? `Critical weakness in ${labels[weakIdx]} (${minScore}/100). Prioritize this event to pass minimum standards.` : `All events above minimum. Focus on weakest area (${labels[weakIdx]}: ${minScore}) for maximum total improvement.`}`, priority: "high", category: "Assessment" },
        { title: "AI Weakest-Domain Training Plan", description: `Weakest domain: ${labels[weakIdx]} (${minScore}/100). ${weakIdx === 0 ? "Deadlift: Progressive overload 3x/week. Start at 70% 1RM, add 5 lbs/week. Include Romanian deadlifts and hip thrusts." : weakIdx === 1 ? "Power Throw: Plyometric training — medicine ball throws, box jumps, explosive hip extensions 3x/week." : weakIdx === 2 ? "Push-ups: GTG (Grease the Groove) method — 5-6 sets throughout the day at 50% max reps. Add weighted push-ups 2x/week." : weakIdx === 3 ? "SDC: Sprint intervals 2x/week + sled drags. Farmer carries 3x/week with progressive load." : weakIdx === 4 ? "Plank: Daily plank progressions — side planks, weighted planks, RKC planks. Build to 3:40+ hold." : "2-Mile Run: 3 runs/week — 1 tempo, 1 interval (800m repeats), 1 long easy run (4-6 miles)."}`, priority: "high", category: "Training" },
        { title: "Deployment Readiness Projection", description: `12-week projected score: ${projectedScore}/100 (from ${totalScore}). ${projectedScore >= 70 ? "On track for strong deployment readiness." : projectedScore >= 50 ? "Marginal improvement projected — increase training frequency." : "Significant deficit — consider structured PT program with coach supervision."}. Overtraining warning: ${imbalance > 30 ? "⚠️ High imbalance detected. Avoid overloading strong areas while weak areas lag. Balanced programming reduces injury risk by 40%." : "Training balance acceptable."}`, priority: "medium", category: "Projection" },
        { title: "Tactical Injury Prevention", description: `Injury probability: ${injuryProb}%. ${injuryRisk} risk. ${imbalance > 20 ? "Strength-endurance imbalance is a primary risk factor for musculoskeletal injuries in military populations. Balance your training to reduce lower-extremity stress fracture and overuse injury risk." : "Balanced profile. Maintain mobility work and recovery protocols."} Include dynamic warm-ups, foam rolling, and 1-2 rest days/week minimum.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Deadlift": `${dl} lbs → ${dlScore}`, "Power Throw": `${pt}m → ${ptScore}`, "Push-ups": `${pu} reps → ${puScore}`, "SDC": `${sdcMin}:${String(sdcSec).padStart(2, '0')} → ${sdcScore}`, "Plank": `${plankMin}:${String(plankSec).padStart(2, '0')} → ${pkScore}`, "2-Mile Run": `${runMin}:${String(runSec).padStart(2, '0')} → ${rnScore}`, "Total": totalScore, "Combat Readiness": combatReadiness }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="army-acft" title="Army ACFT Calculator"
      description="Calculate Army Combat Fitness Test score with combat readiness index, injury risk probability, and deployment readiness projection."
      icon={Shield} calculate={calculate} onClear={() => { setDeadlift(200); setPowerThrow(8); setPushups(30); setSdcMin(2); setSdcSec(10); setPlankMin(2); setPlankSec(30); setRunMin(16); setRunSec(0); setAge(25); setGender("male"); setResult(null) }}
      values={[deadlift, powerThrow, pushups, sdcMin, sdcSec, plankMin, plankSec, runMin, runSec, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Army ACFT Calculator" description="Calculate your Army Combat Fitness Test score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={17} max={62} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="3RM Deadlift" val={deadlift} set={setDeadlift} min={100} max={400} suffix="lbs" />
        <NumInput label="Standing Power Throw" val={powerThrow} set={setPowerThrow} min={2} max={15} step={0.1} suffix="meters" />
        <NumInput label="Hand-Release Push-ups" val={pushups} set={setPushups} min={0} max={80} suffix="reps" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Sprint-Drag-Carry (min)" val={sdcMin} set={setSdcMin} min={1} max={4} />
          <NumInput label="SDC (sec)" val={sdcSec} set={setSdcSec} min={0} max={59} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Plank Hold (min)" val={plankMin} set={setPlankMin} min={0} max={4} />
          <NumInput label="Plank (sec)" val={plankSec} set={setPlankSec} min={0} max={59} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="2-Mile Run (min)" val={runMin} set={setRunMin} min={10} max={25} />
          <NumInput label="Run (sec)" val={runSec} set={setRunSec} min={0} max={59} />
        </div>
      </div>} />
  )
}

// ─── 34. Marine PFT Calculator ────────────────────────────────────────────────
export function MarinePFTCalculator() {
  const [pullups, setPullups] = useState(12)
  const [plankMin, setPlankMin] = useState(3)
  const [plankSec, setPlankSec] = useState(0)
  const [runMin, setRunMin] = useState(22)
  const [runSec, setRunSec] = useState(0)
  const [age, setAge] = useState(25)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pu = clamp(pullups, 0, 30)
    const plankTime = clamp(plankMin * 60 + plankSec, 30, 280)
    const runTime = clamp(runMin * 60 + runSec, 900, 2100)

    // Pull-up score (max 100, 23+ for male = 100)
    const puMax = gender === "male" ? 23 : 10
    const puScore = r0(Math.min(100, (pu / puMax) * 100))

    // Plank score (max 100, 3:45+ = 100)
    const plankMax = 225 // 3:45 in seconds
    const plankScore = r0(Math.min(100, (plankTime / plankMax) * 100))

    // 3-mile run score (lower = better)
    const bestRun = gender === "male" ? 1080 : 1260 // 18:00 / 21:00
    const worstRun = gender === "male" ? 1680 : 1860 // 28:00 / 31:00
    const runScore = runTime <= bestRun ? 100 : runTime >= worstRun ? 0 : r0(((worstRun - runTime) / (worstRun - bestRun)) * 100)

    const totalScore = r0((puScore + plankScore + runScore) / 3)

    // Aerobic dominance index
    const aerobicDominance = r0(runScore - ((puScore + plankScore) / 2))
    const upperStrengthRatio = r0(puScore / (totalScore || 1) * 100)

    // VO2 estimate from 3-mile run
    const runMinutes = runTime / 60
    const vo2Est = r1(Math.max(20, 95 - runMinutes * 2.2))

    // Tactical readiness
    const tacticalReadiness = r0(totalScore * 0.6 + Math.min(...[puScore, plankScore, runScore]) * 0.4)

    let status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    let classification = "1st Class"
    if (totalScore < 35) { status = "danger"; classification = "Below Standard" }
    else if (totalScore < 50) { status = "warning"; classification = "3rd Class" }
    else if (totalScore < 70) { status = "normal"; classification = "2nd Class" }

    const riskColor = status === "good" ? "🟢 Green" : status === "warning" ? "🟡 Yellow" : "🔴 Red"

    setResult({
      primaryMetric: { label: "PFT Score", value: totalScore, unit: "/100", status, description: `${classification} — ${riskColor}` },
      healthScore: totalScore,
      metrics: [
        { label: "Pull-up Score", value: puScore, unit: "/100", status: puScore >= 70 ? "good" : puScore >= 40 ? "warning" : "danger" },
        { label: "Plank Score", value: plankScore, unit: "/100", status: plankScore >= 70 ? "good" : plankScore >= 40 ? "warning" : "danger" },
        { label: "3-Mile Run Score", value: runScore, unit: "/100", status: runScore >= 70 ? "good" : runScore >= 40 ? "warning" : "danger" },
        { label: "PFT Class", value: classification, status },
        { label: "Aerobic Dominance Index", value: aerobicDominance, unit: "pts", status: Math.abs(aerobicDominance) < 15 ? "good" : "warning" },
        { label: "Upper Body Strength Ratio", value: upperStrengthRatio, unit: "%", status: upperStrengthRatio >= 30 ? "good" : "warning" },
        { label: "Estimated VO₂max", value: vo2Est, unit: "mL/kg/min", status: vo2Est >= 45 ? "good" : vo2Est >= 35 ? "warning" : "danger" },
        { label: "Tactical Readiness", value: tacticalReadiness, unit: "/100", status: tacticalReadiness >= 60 ? "good" : tacticalReadiness >= 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "PFT Assessment", description: `Total score ${totalScore}/100 — ${classification}. ${totalScore >= 70 ? "1st Class: Exceptional marine fitness. Maintain training volume and focus on weakest event." : totalScore >= 50 ? "2nd Class: Solid foundation. Increase intensity in below-average events." : "Needs focused preparation to meet standards."}`, priority: "high", category: "Assessment" },
        { title: "AI Endurance Bias Correction", description: `Aerobic dominance index: ${aerobicDominance}. ${aerobicDominance > 15 ? "Your endurance significantly outpaces upper body strength. Add pull-up progressions: weighted pull-ups, lat pulldowns, band-assisted negatives 4x/week." : aerobicDominance < -15 ? "Upper body dominates. Increase running volume: add 10% weekly mileage, include tempo runs and fartlek sessions." : "Well-balanced aerobic and strength profile."}`, priority: "high", category: "Training" },
        { title: "Overuse Injury Screening", description: `VO₂ estimate: ${vo2Est} mL/kg/min. ${vo2Est < 40 ? "Lower aerobic capacity increases compensatory injury risk. Build base aerobic fitness gradually before high-intensity work. Monitor for shin splints, stress fractures, and plantar fasciitis." : "Good aerobic base. Maintain recovery protocols — sleep 7-9hrs, hydration, nutrition timing within 30min post-exercise."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Pull-ups": `${pu} reps → ${puScore}`, "Plank": `${plankMin}:${String(plankSec).padStart(2, '0')} → ${plankScore}`, "3-Mile Run": `${runMin}:${String(runSec).padStart(2, '0')} → ${runScore}`, "Total": totalScore, "VO₂max Est.": `${vo2Est} mL/kg/min` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="marine-pft" title="Marine PFT Calculator"
      description="Calculate Marine Physical Fitness Test score with endurance dominance index, VO₂ estimate, and tactical readiness projection."
      icon={Shield} calculate={calculate} onClear={() => { setPullups(12); setPlankMin(3); setPlankSec(0); setRunMin(22); setRunSec(0); setAge(25); setGender("male"); setResult(null) }}
      values={[pullups, plankMin, plankSec, runMin, runSec, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Marine PFT Calculator" description="Calculate your Marine Physical Fitness Test score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={17} max={60} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <NumInput label="Pull-ups" val={pullups} set={setPullups} min={0} max={30} suffix="reps" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Plank Hold (min)" val={plankMin} set={setPlankMin} min={0} max={4} />
          <NumInput label="Plank (sec)" val={plankSec} set={setPlankSec} min={0} max={59} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="3-Mile Run (min)" val={runMin} set={setRunMin} min={15} max={35} />
          <NumInput label="Run (sec)" val={runSec} set={setRunSec} min={0} max={59} />
        </div>
      </div>} />
  )
}

// ─── 35. Air Force PFA Calculator ─────────────────────────────────────────────
export function AirForcePFACalculator() {
  const [pushups, setPushups] = useState(40)
  const [situps, setSitups] = useState(45)
  const [runMin, setRunMin] = useState(11)
  const [runSec, setRunSec] = useState(30)
  const [waist, setWaist] = useState(34)
  const [age, setAge] = useState(28)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pu = clamp(pushups, 0, 90)
    const su = clamp(situps, 0, 70)
    const runTime = clamp(runMin * 60 + runSec, 480, 1200)
    const w = clamp(waist, 24, 50)

    // Push-up score (max 20 pts)
    const puMax = gender === "male" ? 67 : 47
    const puPts = r1(Math.min(20, (pu / puMax) * 20))

    // Sit-up score (max 20 pts)
    const suMax = gender === "male" ? 58 : 50
    const suPts = r1(Math.min(20, (su / suMax) * 20))

    // Run score (max 60 pts — dominant component)
    const bestRun = gender === "male" ? 556 : 636 // 9:16 / 10:36
    const worstRun = gender === "male" ? 1020 : 1080
    const runPts = runTime <= bestRun ? 60 : runTime >= worstRun ? 0 : r1(((worstRun - runTime) / (worstRun - bestRun)) * 60)

    // Waist (abdominal circumference component — penalty if above threshold)
    const waistThreshold = gender === "male" ? 39 : 35.5
    const waistPenalty = w > waistThreshold ? r1((w - waistThreshold) * 3) : 0

    const rawScore = r1(puPts + suPts + runPts)
    const compositeScore = r1(Math.max(0, rawScore - waistPenalty))

    // Cardio health score estimation
    const runMinutes = runTime / 60
    const cardioHealth = r0(Math.min(100, (60 / runPts) < 1 ? runPts * 1.6 : runPts * 1.5))

    // Abdominal obesity risk
    const abdObesityRisk = w > waistThreshold + 3 ? "High" : w > waistThreshold ? "Moderate" : "Low"

    let status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    let classification = "Excellent"
    if (compositeScore < 50) { status = "danger"; classification = "Unsatisfactory" }
    else if (compositeScore < 65) { status = "warning"; classification = "Satisfactory" }
    else if (compositeScore < 80) { status = "normal"; classification = "Good" }

    const riskColor = status === "good" ? "🟢 Green" : status === "warning" ? "🟡 Yellow" : "🔴 Red"

    setResult({
      primaryMetric: { label: "PFA Score", value: compositeScore, unit: "/100", status, description: `${classification} — ${riskColor}` },
      healthScore: r0(compositeScore),
      metrics: [
        { label: "Push-up Points", value: puPts, unit: "/20", status: puPts >= 15 ? "good" : puPts >= 10 ? "warning" : "danger" },
        { label: "Sit-up Points", value: suPts, unit: "/20", status: suPts >= 15 ? "good" : suPts >= 10 ? "warning" : "danger" },
        { label: "1.5-Mile Run Points", value: runPts, unit: "/60", status: runPts >= 45 ? "good" : runPts >= 30 ? "warning" : "danger" },
        { label: "Waist Penalty", value: waistPenalty, unit: "pts", status: waistPenalty === 0 ? "good" : waistPenalty < 5 ? "warning" : "danger" },
        { label: "Composite Score", value: compositeScore, unit: "/100", status },
        { label: "Classification", value: classification, status },
        { label: "Cardio Health Score", value: cardioHealth, unit: "/100", status: cardioHealth >= 70 ? "good" : cardioHealth >= 50 ? "warning" : "danger" },
        { label: "Abdominal Obesity Risk", value: abdObesityRisk, status: abdObesityRisk === "Low" ? "good" : abdObesityRisk === "Moderate" ? "warning" : "danger" },
        { label: "Waist Circumference", value: w, unit: "in", status: w <= waistThreshold ? "good" : "danger" }
      ],
      recommendations: [
        { title: "PFA Readiness", description: `Composite score ${compositeScore}/100 — ${classification}. ${waistPenalty > 0 ? `Waist penalty of ${waistPenalty} points applied. Reducing waist circumference below ${waistThreshold}" eliminates this penalty.` : "No waist penalty — excellent body composition."} The 1.5-mile run carries 60% weight — it's the largest scoring opportunity.`, priority: "high", category: "Assessment" },
        { title: "AI Waist-Risk Intervention", description: `Waist: ${w}" (threshold: ${waistThreshold}"). ${abdObesityRisk} abdominal obesity risk. ${waistPenalty > 0 ? "Priority intervention: caloric deficit of 300-500 kcal/day combined with HIIT training 3x/week reduces waist circumference 1-2 inches in 8 weeks. Visceral fat responds well to high-intensity interval training." : "Healthy waist measurement. Maintain balanced nutrition and exercise."}`, priority: "high", category: "Intervention" },
        { title: "Cardiometabolic Screening", description: `Cardio health estimated at ${cardioHealth}/100. ${cardioHealth < 60 ? "Below average cardiovascular fitness increases cardiometabolic risk. Target: progress to 12-min or faster 1.5-mile run through interval training. Screen blood pressure, fasting glucose, and lipid panel annually." : "Good cardiovascular fitness correlates with lower cardiometabolic disease risk. Continue aerobic maintenance 150+ min/week."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Push-ups": `${pu} → ${puPts}/20`, "Sit-ups": `${su} → ${suPts}/20`, "1.5-Mile Run": `${runMin}:${String(runSec).padStart(2, '0')} → ${runPts}/60`, "Waist": `${w}" → -${waistPenalty} pts`, "Composite": compositeScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="air-force-pfa" title="Air Force PFA Calculator"
      description="Calculate Air Force Physical Fitness Assessment score with body composition analysis and cardiometabolic risk screening."
      icon={Target} calculate={calculate} onClear={() => { setPushups(40); setSitups(45); setRunMin(11); setRunSec(30); setWaist(34); setAge(28); setGender("male"); setResult(null) }}
      values={[pushups, situps, runMin, runSec, waist, age, gender]} result={result}
      seoContent={<SeoContentGenerator title="Air Force PFA Calculator" description="Calculate your Air Force fitness assessment score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={17} max={60} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Push-ups (1 min)" val={pushups} set={setPushups} min={0} max={90} suffix="reps" />
          <NumInput label="Sit-ups (1 min)" val={situps} set={setSitups} min={0} max={70} suffix="reps" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="1.5-Mile Run (min)" val={runMin} set={setRunMin} min={8} max={20} />
          <NumInput label="Run (sec)" val={runSec} set={setRunSec} min={0} max={59} />
        </div>
        <NumInput label="Waist Circumference" val={waist} set={setWaist} min={24} max={50} step={0.5} suffix="inches" />
      </div>} />
  )
}

// ─── 36. Firefighter CPAT Calculator ──────────────────────────────────────────
export function FirefighterCPATCalculator() {
  const [stairClimb, setStairClimb] = useState(190)
  const [hoseDrag, setHoseDrag] = useState(55)
  const [equipCarry, setEquipCarry] = useState(65)
  const [ladderRaise, setLadderRaise] = useState(30)
  const [forcibleEntry, setForcibleEntry] = useState(20)
  const [search, setSearch] = useState(50)
  const [rescue, setRescue] = useState(65)
  const [ceilingBreach, setCeilingBreach] = useState(25)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sc = clamp(stairClimb, 60, 400)
    const hd = clamp(hoseDrag, 15, 200)
    const ec = clamp(equipCarry, 20, 200)
    const lr = clamp(ladderRaise, 10, 120)
    const fe = clamp(forcibleEntry, 5, 120)
    const sr = clamp(search, 15, 200)
    const rc = clamp(rescue, 20, 200)
    const cb = clamp(ceilingBreach, 5, 120)

    const totalTime = sc + hd + ec + lr + fe + sr + rc + cb
    const passThreshold = 640 // 10:20 total time limit
    const passed = totalTime <= passThreshold

    const stationTimes = [
      { name: "Stair Climb", time: sc, par: 200 },
      { name: "Hose Drag", time: hd, par: 65 },
      { name: "Equipment Carry", time: ec, par: 75 },
      { name: "Ladder Raise", time: lr, par: 35 },
      { name: "Forcible Entry", time: fe, par: 25 },
      { name: "Search", time: sr, par: 60 },
      { name: "Rescue Drag", time: rc, par: 80 },
      { name: "Ceiling Breach", time: cb, par: 30 }
    ]

    // Find weakest station (most over par)
    let worstRatio = 0
    let worstStation = stationTimes[0]
    stationTimes.forEach(s => {
      const ratio = s.time / s.par
      if (ratio > worstRatio) { worstRatio = ratio; worstStation = s }
    })

    // Upper body strength index (from forcible entry + ceiling breach + ladder)
    const ubStrength = r0(Math.min(100, ((lr + fe + cb) < 90 ? 85 : (lr + fe + cb) < 75 ? 95 : 100 - ((lr + fe + cb) - 75) * 0.5)))

    // Grip endurance score
    const gripEndurance = r0(Math.min(100, ((hd + ec + rc) < 200 ? 80 : (hd + ec + rc) < 180 ? 90 : 100 - ((hd + ec + rc) - 150) * 0.2)))

    // Heat stress tolerance estimate
    const heatStress = totalTime > 550 ? "High Risk" : totalTime > 450 ? "Moderate" : "Well-Adapted"

    // Injury probability
    const injuryProb = totalTime > passThreshold ? r0(35 + (totalTime - passThreshold) * 0.1) : totalTime > 500 ? r0(15 + (totalTime - 500) * 0.1) : r0(5 + totalTime * 0.01)

    const overallScore = r0(Math.max(0, Math.min(100, (passThreshold / totalTime) * 100)))

    let status: 'good' | 'warning' | 'danger' | 'normal' = passed ? "good" : "danger"
    const riskColor = passed && injuryProb < 15 ? "🟢 Green" : passed ? "🟡 Yellow" : injuryProb > 30 ? "🟣 Purple" : "🔴 Red"

    setResult({
      primaryMetric: { label: "CPAT Result", value: passed ? "PASS" : "FAIL", status, description: `Total: ${r0(totalTime / 60)}:${String(totalTime % 60).padStart(2, '0')} / 10:20 limit — ${riskColor}` },
      healthScore: overallScore,
      metrics: [
        ...stationTimes.map(s => ({ label: s.name, value: `${s.time}s`, unit: `par: ${s.par}s`, status: (s.time <= s.par ? "good" : s.time <= s.par * 1.3 ? "warning" : "danger") as 'good' | 'warning' | 'danger' })),
        { label: "Total Time", value: `${r0(totalTime / 60)}:${String(totalTime % 60).padStart(2, '0')}`, unit: "/ 10:20", status: passed ? "good" : "danger" },
        { label: "Weakest Station", value: worstStation.name, status: "danger" },
        { label: "Upper Body Strength Index", value: ubStrength, unit: "/100", status: ubStrength >= 70 ? "good" : "warning" },
        { label: "Grip Endurance Score", value: gripEndurance, unit: "/100", status: gripEndurance >= 70 ? "good" : "warning" },
        { label: "Heat Stress Tolerance", value: heatStress, status: heatStress === "Well-Adapted" ? "good" : heatStress === "Moderate" ? "warning" : "danger" },
        { label: "Injury Probability", value: injuryProb, unit: "%", status: injuryProb < 15 ? "good" : injuryProb < 30 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "CPAT Assessment", description: `${passed ? "PASS" : "FAIL"} — Total time ${r0(totalTime / 60)}:${String(totalTime % 60).padStart(2, '0')} vs 10:20 limit. ${passed ? `Passed with ${r0((passThreshold - totalTime))}s margin.` : `Over by ${r0((totalTime - passThreshold))}s. Focus on weakest station: ${worstStation.name}.`} The stair climb is the most demanding event (200s par) — it sets the metabolic tone for remaining events.`, priority: "high", category: "Assessment" },
        { title: "AI Occupational Simulation", description: `Weakest station: ${worstStation.name} (${worstStation.time}s vs ${worstStation.par}s par). ${worstStation.name === "Stair Climb" ? "StairMaster at high resistance 3x/week + weighted vest stair sets. Target HR Zone 4 adaptation." : worstStation.name === "Rescue Drag" || worstStation.name === "Hose Drag" ? "Sled drags, farmer walks, and grip training 4x/week. Progressive overload with 10% load increase bi-weekly." : "Station-specific drills 3x/week with timed sets. Practice actual CPAT prop simulation if available."} Circuit training simulating all 8 stations consecutively builds occupational-specific endurance.`, priority: "high", category: "Training" },
        { title: "Occupational Health Screening", description: `Heat stress tolerance: ${heatStress}. Injury probability: ${injuryProb}%. ${totalTime > 550 ? "Higher completion times correlate with increased heat exhaustion risk during actual firefighting. Focus on cardiovascular conditioning and heat acclimatization protocols." : "Good performance profile. Maintain fitness and consider yearly occupational health screening for cardiac risk, pulmonary function, and musculoskeletal integrity."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: Object.fromEntries(stationTimes.map(s => [s.name, `${s.time}s (par: ${s.par}s)`]).concat([["Total", `${totalTime}s`], ["Result", passed ? "PASS" : "FAIL"]]))
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="firefighter-cpat" title="Firefighter CPAT Calculator"
      description="Calculate Candidate Physical Ability Test score with task-by-task breakdown, heat stress tolerance, and occupational readiness assessment."
      icon={Zap} calculate={calculate} onClear={() => { setStairClimb(190); setHoseDrag(55); setEquipCarry(65); setLadderRaise(30); setForcibleEntry(20); setSearch(50); setRescue(65); setCeilingBreach(25); setResult(null) }}
      values={[stairClimb, hoseDrag, equipCarry, ladderRaise, forcibleEntry, search, rescue, ceilingBreach]} result={result}
      seoContent={<SeoContentGenerator title="Firefighter CPAT Calculator" description="Assess your CPAT readiness." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Stair Climb" val={stairClimb} set={setStairClimb} min={60} max={400} suffix="seconds" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Hose Drag" val={hoseDrag} set={setHoseDrag} min={15} max={200} suffix="seconds" />
          <NumInput label="Equipment Carry" val={equipCarry} set={setEquipCarry} min={20} max={200} suffix="seconds" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Ladder Raise" val={ladderRaise} set={setLadderRaise} min={10} max={120} suffix="seconds" />
          <NumInput label="Forcible Entry" val={forcibleEntry} set={setForcibleEntry} min={5} max={120} suffix="seconds" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Search" val={search} set={setSearch} min={15} max={200} suffix="seconds" />
          <NumInput label="Rescue Drag" val={rescue} set={setRescue} min={20} max={200} suffix="seconds" />
        </div>
        <NumInput label="Ceiling Breach & Pull" val={ceilingBreach} set={setCeilingBreach} min={5} max={120} suffix="seconds" />
      </div>} />
  )
}

// ─── 37. Police Fitness Test Calculator ───────────────────────────────────────
export function PoliceFitnessCalculator() {
  const [pushups, setPushups] = useState(35)
  const [situps, setSitups] = useState(40)
  const [sprintSec, setSprintSec] = useState(15)
  const [runMin, setRunMin] = useState(12)
  const [runSec, setRunSec] = useState(30)
  const [agilityTime, setAgilityTime] = useState(18)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pu = clamp(pushups, 0, 80)
    const su = clamp(situps, 0, 70)
    const sprint = clamp(sprintSec, 8, 30)
    const runTime = clamp(runMin * 60 + runSec, 480, 1200)
    const agility = clamp(agilityTime, 10, 40)

    // Scoring (each out of 100)
    const puScore = r0(Math.min(100, (pu / 60) * 100))
    const suScore = r0(Math.min(100, (su / 55) * 100))
    const sprintScore = sprint <= 10 ? 100 : sprint >= 22 ? 0 : r0(((22 - sprint) / (22 - 10)) * 100)
    const runScore = runTime <= 600 ? 100 : runTime >= 1020 ? 0 : r0(((1020 - runTime) / (1020 - 600)) * 100)
    const agilityScore = agility <= 13 ? 100 : agility >= 28 ? 0 : r0(((28 - agility) / (28 - 13)) * 100)

    const compositeScore = r0((puScore + suScore + sprintScore + runScore + agilityScore) / 5)

    // Agility vs endurance balance
    const agilityEnduranceBalance = r0(agilityScore - runScore)

    // Pursuit readiness
    const pursuitReadiness = r0(sprintScore * 0.35 + agilityScore * 0.35 + runScore * 0.3)

    // Knee/ankle injury probability
    const injuryProb = agility > 22 ? r0(30 + (agility - 22) * 2) : agility > 16 ? r0(10 + (agility - 16) * 2) : r0(5)

    let status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (compositeScore < 40) status = "danger"
    else if (compositeScore < 60) status = "warning"

    const riskColor = status === "good" ? "🟢 Green" : status === "warning" ? "🟡 Yellow" : injuryProb > 25 ? "🟣 Purple" : "🔴 Red"

    setResult({
      primaryMetric: { label: "Fitness Score", value: compositeScore, unit: "/100", status, description: `${compositeScore >= 70 ? "Excellent" : compositeScore >= 50 ? "Good" : compositeScore >= 40 ? "Marginal" : "Below Standard"} — ${riskColor}` },
      healthScore: compositeScore,
      metrics: [
        { label: "Push-up Score", value: puScore, unit: "/100", status: puScore >= 60 ? "good" : puScore >= 40 ? "warning" : "danger" },
        { label: "Sit-up Score", value: suScore, unit: "/100", status: suScore >= 60 ? "good" : suScore >= 40 ? "warning" : "danger" },
        { label: "Sprint Score", value: sprintScore, unit: "/100", status: sprintScore >= 60 ? "good" : sprintScore >= 40 ? "warning" : "danger" },
        { label: "1.5-Mile Run Score", value: runScore, unit: "/100", status: runScore >= 60 ? "good" : runScore >= 40 ? "warning" : "danger" },
        { label: "Agility Score", value: agilityScore, unit: "/100", status: agilityScore >= 60 ? "good" : agilityScore >= 40 ? "warning" : "danger" },
        { label: "Agility-Endurance Balance", value: agilityEnduranceBalance, unit: "pts", status: Math.abs(agilityEnduranceBalance) < 20 ? "good" : "warning" },
        { label: "Pursuit Readiness", value: pursuitReadiness, unit: "/100", status: pursuitReadiness >= 65 ? "good" : pursuitReadiness >= 45 ? "warning" : "danger" },
        { label: "Knee/Ankle Injury Risk", value: `${injuryProb}%`, status: injuryProb < 15 ? "good" : injuryProb < 25 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Tactical Readiness", description: `Composite ${compositeScore}/100. Pursuit readiness: ${pursuitReadiness}/100. ${pursuitReadiness >= 65 ? "Field-ready for pursuit and intervention scenarios." : "Improve sprint and agility performance. Short-distance pursuit demands explosive speed and direction changes."} ${riskColor}`, priority: "high", category: "Assessment" },
        { title: "AI Sprint-Power Correction", description: `Sprint score: ${sprintScore}, Agility: ${agilityScore}. ${sprintScore < 50 ? "Sprint deficit: Add 40-yard dash drills 3x/week. Hill sprints, sled pushes, and plyometric box jumps transfer directly to pursuit ability." : agilityScore < 50 ? "Agility deficit: Cone drills, T-test, 5-10-5 shuttle runs 3x/week. Focus on deceleration mechanics to protect knees." : "Good sprint-agility balance. Maintain with 2x/week agility and sprint maintenance work."}`, priority: "high", category: "Training" },
        { title: "Joint Injury Prevention", description: `Knee/ankle injury probability: ${injuryProb}%. ${injuryProb > 20 ? "Higher agility times correlate with compensatory movement patterns that stress joints. Improve ankle mobility, strengthen VMO (vastus medialis), and incorporate lateral band walks and single-leg balance training." : "Low joint injury risk. Continue preventive mobility work and proper warm-up before agility drills."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Push-ups": `${pu} → ${puScore}`, "Sit-ups": `${su} → ${suScore}`, "Sprint": `${sprint}s → ${sprintScore}`, "1.5-Mile": `${runMin}:${String(runSec).padStart(2, '0')} → ${runScore}`, "Agility": `${agility}s → ${agilityScore}`, "Composite": compositeScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="police-fitness" title="Police Fitness Test Calculator"
      description="Calculate law enforcement fitness test score with pursuit readiness, agility-endurance balance, and joint injury risk assessment."
      icon={Shield} calculate={calculate} onClear={() => { setPushups(35); setSitups(40); setSprintSec(15); setRunMin(12); setRunSec(30); setAgilityTime(18); setResult(null) }}
      values={[pushups, situps, sprintSec, runMin, runSec, agilityTime]} result={result}
      seoContent={<SeoContentGenerator title="Police Fitness Test Calculator" description="Calculate your police fitness test score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Push-ups (1 min)" val={pushups} set={setPushups} min={0} max={80} suffix="reps" />
          <NumInput label="Sit-ups (1 min)" val={situps} set={setSitups} min={0} max={70} suffix="reps" />
        </div>
        <NumInput label="300-Meter Sprint" val={sprintSec} set={setSprintSec} min={8} max={30} step={0.1} suffix="seconds" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="1.5-Mile Run (min)" val={runMin} set={setRunMin} min={8} max={20} />
          <NumInput label="Run (sec)" val={runSec} set={setRunSec} min={0} max={59} />
        </div>
        <NumInput label="Agility Test" val={agilityTime} set={setAgilityTime} min={10} max={40} step={0.1} suffix="seconds" />
      </div>} />
  )
}

// ─── 38. Power-to-Weight Ratio Calculator ─────────────────────────────────────
export function AdvancedPowerToWeightCalculator() {
  const [power, setPower] = useState(250)
  const [weight, setWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const p = clamp(power, 50, 2500)
    const w = clamp(weight, 30, 200)

    const pwr = r2(p / w)

    // Cycling classification
    let cyclingClass = "", cyclingStatus: 'good' | 'warning' | 'danger' | 'normal' = "normal"
    if (pwr >= 6.0) { cyclingClass = "World-Class Pro"; cyclingStatus = "good" }
    else if (pwr >= 5.0) { cyclingClass = "Domestic Pro / Cat 1"; cyclingStatus = "good" }
    else if (pwr >= 4.0) { cyclingClass = "Cat 2-3 Racer"; cyclingStatus = "good" }
    else if (pwr >= 3.0) { cyclingClass = "Cat 4 / Strong Recreational"; cyclingStatus = "normal" }
    else if (pwr >= 2.0) { cyclingClass = "Fitness Cyclist"; cyclingStatus = "warning" }
    else { cyclingClass = "Beginner"; cyclingStatus = "warning" }

    // Sprint potential (W/kg for short bursts scaled)
    const sprintPotential = r1(pwr * 3.2) // peak power estimate ~3x FTP W/kg
    const sprintClass = sprintPotential >= 18 ? "Elite Sprinter" : sprintPotential >= 14 ? "Strong Sprinter" : sprintPotential >= 10 ? "Average" : "Below Average"

    // Weight change impact model
    const ifLose3kg = r2(p / (w - 3))
    const ifGain3kg = r2(p / (w + 3))
    const ifGain20w = r2((p + 20) / w)

    let status: 'good' | 'warning' | 'danger' | 'normal' = pwr >= 4 ? "good" : pwr >= 3 ? "normal" : pwr >= 2 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Power-to-Weight", value: pwr, unit: "W/kg", status, description: cyclingClass },
      healthScore: r0(Math.min(100, pwr * 18)),
      metrics: [
        { label: "Power Output", value: p, unit: "watts", status: "normal" },
        { label: "Body Weight", value: w, unit: "kg", status: "normal" },
        { label: "W/kg", value: pwr, unit: "W/kg", status },
        { label: "Cycling Classification", value: cyclingClass, status: cyclingStatus },
        { label: "Sprint Potential (peak W/kg)", value: sprintPotential, unit: "W/kg", status: sprintPotential >= 14 ? "good" : sprintPotential >= 10 ? "normal" : "warning" },
        { label: "Sprint Classification", value: sprintClass, status: sprintPotential >= 14 ? "good" : "normal" },
        { label: "If -3 kg Weight", value: ifLose3kg, unit: "W/kg", status: "good" },
        { label: "If +3 kg Weight", value: ifGain3kg, unit: "W/kg", status: "warning" },
        { label: "If +20W Power", value: ifGain20w, unit: "W/kg", status: "good" }
      ],
      recommendations: [
        { title: "W/kg Classification", description: `${pwr} W/kg — ${cyclingClass}. ${pwr >= 5 ? "Elite-level power. Focus on race strategy and peak-form timing." : pwr >= 4 ? "Competitive-level power. Marginal gains come from structured periodization and nutrition optimization." : pwr >= 3 ? "Good fitness base. Systematic training with structured intervals can push you to Cat 3+ level." : "Build aerobic base first with high-volume easy riding, then add structured intervals."}`, priority: "high", category: "Assessment" },
        { title: "AI Body Composition Optimization", description: `Weight change impact: Losing 3 kg → ${ifLose3kg} W/kg (+${r2(ifLose3kg - pwr)} W/kg). Gaining 20W → ${ifGain20w} W/kg (+${r2(ifGain20w - pwr)} W/kg). ${w > 80 ? "Weight loss offers significant W/kg improvement. Target 0.5 kg/week during base phase to preserve muscle." : w < 60 ? "Caution: further weight loss may compromise power. Focus on power gains instead." : "Both strategies viable — combine with periodized nutrition for optimal results."}`, priority: "high", category: "Optimization" },
        { title: "Athletic Conditioning", description: `Current power ${p}W at ${w}kg supports ${cyclingClass} classification. To improve: 3-4 interval sessions/week (sweet spot, VO₂max, threshold intervals), 1-2 endurance rides, adequate protein (1.6-2.2 g/kg/day) to maintain muscle while optimizing weight.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Power": `${p}W`, "Weight": `${w}kg`, "W/kg": pwr, "Class": cyclingClass, "-3kg Scenario": ifLose3kg, "+20W Scenario": ifGain20w }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="power-to-weight" title="Power-to-Weight Ratio Calculator"
      description="Calculate cycling power-to-weight ratio with classification, sprint potential, and weight change impact modeling."
      icon={Zap} calculate={calculate} onClear={() => { setPower(250); setWeight(75); setResult(null) }}
      values={[power, weight]} result={result}
      seoContent={<SeoContentGenerator title="Power-to-Weight Ratio Calculator" description="Calculate your cycling power-to-weight ratio." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Power Output" val={power} set={setPower} min={50} max={2500} suffix="watts" />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 39. FTP Calculator ───────────────────────────────────────────────────────
const POWER_ZONES = [
  { name: "Zone 1 — Active Recovery", min: 0, max: 0.55, description: "Easy spinning, very light effort" },
  { name: "Zone 2 — Endurance", min: 0.56, max: 0.75, description: "All-day pace, fat burning" },
  { name: "Zone 3 — Tempo", min: 0.76, max: 0.90, description: "Moderate effort, sustainable" },
  { name: "Zone 4 — Threshold", min: 0.91, max: 1.05, description: "Hard effort, ~1 hour max" },
  { name: "Zone 5 — VO₂max", min: 1.06, max: 1.20, description: "Very hard, 3-8 minutes" },
  { name: "Zone 6 — Anaerobic", min: 1.21, max: 1.50, description: "Extremely hard, 30s-3 min" },
  { name: "Zone 7 — Neuromuscular", min: 1.51, max: 3.0, description: "Max sprints, <30s" }
]

export function AdvancedFTPCalculator() {
  const [twentyMinPower, setTwentyMinPower] = useState(280)
  const [weight, setWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const p20 = clamp(twentyMinPower, 50, 600)
    const w = clamp(weight, 30, 200)

    const ftp = r0(p20 * 0.95)
    const wkg = r2(ftp / w)

    // Power zones
    const zones = POWER_ZONES.map(z => ({
      ...z,
      low: r0(ftp * z.min),
      high: r0(ftp * z.max)
    }))

    // Lactate threshold alignment
    const lactateThresholdHR = r0(ftp > 300 ? 172 : ftp > 250 ? 168 : ftp > 200 ? 164 : 160)

    // Race pacing model
    const racePace60min = ftp
    const racePace20min = r0(ftp * 1.05)
    const racePace5min = r0(ftp * 1.20)
    const racePace1min = r0(ftp * 1.50)

    let status: 'good' | 'warning' | 'danger' | 'normal' = wkg >= 4 ? "good" : wkg >= 3 ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "FTP", value: ftp, unit: "watts", status, description: `${wkg} W/kg — ${wkg >= 5 ? "Pro Level" : wkg >= 4 ? "Cat 1-2" : wkg >= 3 ? "Cat 3-4" : "Recreational"}` },
      healthScore: r0(Math.min(100, wkg * 20)),
      metrics: [
        { label: "FTP", value: ftp, unit: "watts", status },
        { label: "FTP W/kg", value: wkg, unit: "W/kg", status },
        { label: "20-min Power", value: p20, unit: "watts", status: "normal" },
        ...zones.map(z => ({ label: z.name, value: `${z.low}-${z.high}`, unit: "watts", status: "normal" as const })),
        { label: "Lactate Threshold HR (est.)", value: lactateThresholdHR, unit: "bpm", status: "normal" },
        { label: "60-min Race Pace", value: racePace60min, unit: "watts", status: "normal" },
        { label: "20-min Race Pace", value: racePace20min, unit: "watts", status: "normal" },
        { label: "5-min VO₂max Effort", value: racePace5min, unit: "watts", status: "normal" },
        { label: "1-min Anaerobic Effort", value: racePace1min, unit: "watts", status: "normal" }
      ],
      recommendations: [
        { title: "FTP Interpretation", description: `FTP ${ftp}W (${wkg} W/kg). ${wkg >= 4 ? "Competitive-level threshold power. Focus on race specificity — sustained threshold intervals, over-under sessions, and race simulation." : wkg >= 3 ? "Solid recreational/amateur base. 2-3 structured interval sessions/week can push FTP 5-10% in 8-12 weeks." : "Building phase. Prioritize aerobic base with Zone 2 (${zones[1].low}-${zones[1].high}W) rides 3-4x/week before adding intensity."}`, priority: "high", category: "Assessment" },
        { title: "AI Zone Calibration", description: `Your 7 power zones are calibrated from FTP ${ftp}W. Key sessions: Sweet Spot (88-93% FTP = ${r0(ftp * 0.88)}-${r0(ftp * 0.93)}W) for time-efficient gains. Threshold intervals at ${r0(ftp * 0.95)}-${r0(ftp * 1.05)}W for FTP improvement. VO₂max intervals at ${zones[4].low}-${zones[4].high}W for ceiling raising.`, priority: "high", category: "Training" },
        { title: "Cardiovascular Load", description: `FTP correlates with lactate threshold at approximately ${lactateThresholdHR} bpm. Training above FTP chronically increases cardiac stress. Maintain 80/20 rule: 80% of training volume below Zone 2, 20% at high intensity. Monitor resting HR for overtraining signals.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "20-min Power": `${p20}W`, "FTP (95%)": `${ftp}W`, "W/kg": wkg, "Zone 2": `${zones[1].low}-${zones[1].high}W`, "Zone 4 (Threshold)": `${zones[3].low}-${zones[3].high}W`, "Zone 5 (VO₂max)": `${zones[4].low}-${zones[4].high}W` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ftp-calculator" title="FTP Calculator"
      description="Calculate Functional Threshold Power with 7 power zones, race pacing model, and lactate threshold alignment."
      icon={Bike} calculate={calculate} onClear={() => { setTwentyMinPower(280); setWeight(75); setResult(null) }}
      values={[twentyMinPower, weight]} result={result}
      seoContent={<SeoContentGenerator title="FTP Calculator" description="Estimate your Functional Threshold Power." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="20-Minute Average Power" val={twentyMinPower} set={setTwentyMinPower} min={50} max={600} suffix="watts" />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 40. TSS Calculator ──────────────────────────────────────────────────────
export function TSSCalculator() {
  const [durationMin, setDurationMin] = useState(60)
  const [normalizedPower, setNormalizedPower] = useState(220)
  const [ftp, setFtp] = useState(250)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(durationMin, 5, 600)
    const np = clamp(normalizedPower, 50, 600)
    const ftpVal = clamp(ftp, 50, 600)

    const ifVal = r2(np / ftpVal)
    const tss = r0((dur * 60 * np * ifVal) / (ftpVal * 3600) * 100)

    // Weekly load estimate (if this workout repeated 5x)
    const weeklyTSS = tss * 5
    const acuteLoad = r0(tss * 7 / 7) // daily TSS
    const chronicLoad = r0(weeklyTSS / 7) // CTL approximation

    // Overtraining probability
    let overtrainingRisk = "Low"
    let overProb = 5
    if (tss > 300) { overtrainingRisk = "Very High"; overProb = 40 }
    else if (tss > 200) { overtrainingRisk = "High"; overProb = 25 }
    else if (tss > 150) { overtrainingRisk = "Moderate"; overProb = 15 }

    let sessionType = ""
    if (tss < 50) sessionType = "Easy Recovery Ride"
    else if (tss < 100) sessionType = "Moderate Endurance"
    else if (tss < 150) sessionType = "Hard Training Session"
    else if (tss < 250) sessionType = "Very Hard / Long Ride"
    else sessionType = "Epic — Extended Recovery Needed"

    let status: 'good' | 'warning' | 'danger' | 'normal' = tss < 100 ? "good" : tss < 200 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "TSS", value: tss, status, description: sessionType },
      healthScore: r0(Math.max(0, 100 - tss * 0.4)),
      metrics: [
        { label: "Training Stress Score", value: tss, status },
        { label: "Intensity Factor (IF)", value: ifVal, status: ifVal < 0.75 ? "good" : ifVal < 1.0 ? "warning" : "danger" },
        { label: "Session Type", value: sessionType, status },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Normalized Power", value: np, unit: "watts", status: "normal" },
        { label: "FTP", value: ftpVal, unit: "watts", status: "normal" },
        { label: "Daily Stress (from this)", value: tss, unit: "TSS/day", status: tss < 80 ? "good" : tss < 120 ? "warning" : "danger" },
        { label: "Weekly Load (5x/week)", value: weeklyTSS, unit: "TSS/week", status: weeklyTSS < 400 ? "good" : weeklyTSS < 600 ? "warning" : "danger" },
        { label: "Overtraining Risk", value: `${overProb}% (${overtrainingRisk})`, status: overtrainingRisk === "Low" ? "good" : overtrainingRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "TSS Interpretation", description: `TSS ${tss} — ${sessionType}. ${tss < 100 ? "Recovery within 24 hours expected." : tss < 200 ? "Recovery may take 24-48 hours. Plan easy days after." : tss < 300 ? "Significant fatigue expected. 48-72 hours recovery needed." : "Epic-level stress. Full recovery may take 3-5 days. Avoid consecutive hard sessions."}`, priority: "high", category: "Assessment" },
        { title: "AI Recovery Adjustment", description: `IF: ${ifVal} (${ifVal < 0.75 ? "endurance" : ifVal < 0.90 ? "tempo" : ifVal < 1.0 ? "threshold" : "supra-threshold"} intensity). Weekly TSS target: 300-500 (recreational), 500-700 (amateur racer), 700-1000 (competitive). ${weeklyTSS > 700 ? "⚠️ High weekly load — monitor heart rate variability and sleep quality for overtraining indicators." : "Weekly load manageable with proper recovery."}`, priority: "high", category: "Recovery" },
        { title: "Overtraining Syndrome Monitoring", description: `Overtraining probability: ${overProb}%. ${overtrainingRisk} risk. Warning signs: elevated resting HR (>5 bpm above baseline), persistent fatigue, mood disturbance, decreased performance despite rest, sleep disruption. If 3+ signs present, reduce training load by 40-50% for 1-2 weeks.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Duration": `${dur} min`, "NP": `${np}W`, "FTP": `${ftpVal}W`, "IF": ifVal, "TSS": tss, "Weekly (5x)": weeklyTSS }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="tss-calculator" title="TSS Calculator (Training Stress Score)"
      description="Calculate Training Stress Score with weekly load analysis, acute-chronic load ratio, and overtraining risk assessment."
      icon={Activity} calculate={calculate} onClear={() => { setDurationMin(60); setNormalizedPower(220); setFtp(250); setResult(null) }}
      values={[durationMin, normalizedPower, ftp]} result={result}
      seoContent={<SeoContentGenerator title="TSS Calculator" description="Calculate your Training Stress Score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Duration" val={durationMin} set={setDurationMin} min={5} max={600} suffix="minutes" />
        <NumInput label="Normalized Power" val={normalizedPower} set={setNormalizedPower} min={50} max={600} suffix="watts" />
        <NumInput label="FTP" val={ftp} set={setFtp} min={50} max={600} suffix="watts" />
      </div>} />
  )
}

// ─── 41. IF Calculator (Intensity Factor) ─────────────────────────────────────
export function IFCalculator() {
  const [normalizedPower, setNormalizedPower] = useState(230)
  const [ftp, setFtp] = useState(260)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const np = clamp(normalizedPower, 50, 600)
    const ftpVal = clamp(ftp, 50, 600)

    const ifVal = r2(np / ftpVal)

    let sessionClass = "", status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (ifVal < 0.55) { sessionClass = "Active Recovery"; status = "good" }
    else if (ifVal < 0.75) { sessionClass = "Endurance"; status = "good" }
    else if (ifVal < 0.90) { sessionClass = "Tempo"; status = "normal" }
    else if (ifVal < 1.0) { sessionClass = "Threshold"; status = "warning" }
    else if (ifVal < 1.05) { sessionClass = "Supra-Threshold"; status = "warning" }
    else { sessionClass = "VO₂max / Anaerobic"; status = "danger" }

    // Fatigue score (higher IF = more fatigue per minute)
    const fatiguePer30min = r0(Math.pow(ifVal, 3) * 30)
    const fatigueRating = fatiguePer30min > 35 ? "Very High" : fatiguePer30min > 20 ? "High" : fatiguePer30min > 10 ? "Moderate" : "Low"

    // Sustainable duration estimate
    const sustainableDuration = ifVal >= 1.2 ? "< 5 min" : ifVal >= 1.05 ? "5-20 min" : ifVal >= 0.95 ? "20-60 min" : ifVal >= 0.80 ? "1-3 hours" : ifVal >= 0.65 ? "3-6 hours" : "All day"

    setResult({
      primaryMetric: { label: "Intensity Factor", value: ifVal, status, description: sessionClass },
      healthScore: r0(Math.max(0, 100 - ifVal * 80)),
      metrics: [
        { label: "IF", value: ifVal, status },
        { label: "Session Classification", value: sessionClass, status },
        { label: "Normalized Power", value: np, unit: "watts", status: "normal" },
        { label: "FTP", value: ftpVal, unit: "watts", status: "normal" },
        { label: "% of FTP", value: r0(ifVal * 100), unit: "%", status },
        { label: "Fatigue Rate (per 30 min)", value: fatiguePer30min, unit: "TSS", status: fatiguePer30min > 25 ? "danger" : fatiguePer30min > 15 ? "warning" : "good" },
        { label: "Fatigue Rating", value: fatigueRating, status: fatigueRating === "Low" ? "good" : fatigueRating === "Moderate" ? "normal" : "warning" },
        { label: "Sustainable Duration", value: sustainableDuration, status: "normal" }
      ],
      recommendations: [
        { title: "IF Assessment", description: `IF = ${ifVal} (${sessionClass}). ${ifVal > 1.0 ? "Working above FTP — this effort is unsustainable beyond ~20 minutes. Use for interval-specific training only." : ifVal > 0.85 ? "High-intensity zone. Sustainable for 30-90 minutes depending on fitness. Effective for threshold development." : "Moderate-low intensity. Good for endurance building and active recovery."}`, priority: "high", category: "Assessment" },
        { title: "AI Intensity Balance Alert", description: `${ifVal > 0.95 ? "⚠️ High-intensity session. Limit to 2-3x/week maximum. Excessive high-IF sessions suppress immune function and increase overtraining risk." : ifVal > 0.70 ? "Productive training zone. Mix with lower-IF sessions for optimal adaptation." : "Recovery/base zone. Essential for physiological adaptation. Don't neglect easy riding — it builds mitochondrial density."} Aim for average weekly IF of 0.70-0.78 across all sessions.`, priority: "high", category: "Training" },
        { title: "Cardio Load Assessment", description: `Fatigue rate: ${fatiguePer30min} TSS per 30 min (${fatigueRating}). Sustainable for approximately ${sustainableDuration}. ${fatiguePer30min > 30 ? "Very high cardiac load — monitor for symptoms of cardiac fatigue. Ensure adequate recovery and hydration." : "Manageable cardiac load for trained individuals."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "NP": `${np}W`, "FTP": `${ftpVal}W`, "IF": ifVal, "Class": sessionClass, "Sustainable For": sustainableDuration }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="if-calculator" title="Intensity Factor Calculator"
      description="Calculate workout Intensity Factor relative to FTP with session classification, fatigue scoring, and sustainability analysis."
      icon={TrendingUp} calculate={calculate} onClear={() => { setNormalizedPower(230); setFtp(260); setResult(null) }}
      values={[normalizedPower, ftp]} result={result}
      seoContent={<SeoContentGenerator title="IF Calculator" description="Calculate your workout Intensity Factor." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Normalized Power" val={normalizedPower} set={setNormalizedPower} min={50} max={600} suffix="watts" />
        <NumInput label="FTP" val={ftp} set={setFtp} min={50} max={600} suffix="watts" />
      </div>} />
  )
}

// ─── 42. Swim Pace Calculator ─────────────────────────────────────────────────
export function SwimPaceCalculator() {
  const [distance, setDistance] = useState(1500)
  const [timeMin, setTimeMin] = useState(25)
  const [timeSec, setTimeSec] = useState(0)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const d = clamp(distance, 25, 10000)
    const totalSec = clamp(timeMin * 60 + timeSec, 10, 36000)

    // Pace per 100m
    const pacePer100 = r1((totalSec / d) * 100)
    const paceMin = Math.floor(pacePer100 / 60)
    const paceSec = r0(pacePer100 % 60)

    // Speed
    const speedMs = r2(d / totalSec)
    const speedKmh = r2(speedMs * 3.6)

    // Stroke efficiency (SWOLF approximation — strokes per 25m + time per 25m)
    const timePer25 = r1((totalSec / d) * 25)
    const estStrokes = r0(timePer25 * 0.7 + 8) // rough estimate
    const swolf = r0(timePer25 + estStrokes)

    let efficiency = "", effStatus: 'good' | 'warning' | 'danger' | 'normal' = "good"
    if (swolf < 35) { efficiency = "Elite"; effStatus = "good" }
    else if (swolf < 45) { efficiency = "Advanced"; effStatus = "good" }
    else if (swolf < 55) { efficiency = "Intermediate"; effStatus = "normal" }
    else if (swolf < 70) { efficiency = "Beginner"; effStatus = "warning" }
    else { efficiency = "Novice"; effStatus = "danger" }

    // VO₂ estimate from swim pace
    const vo2Est = r1(Math.max(20, Math.min(80, 100 - pacePer100 * 0.5)))

    // Race predictions
    const pace100s = totalSec / (d / 100)
    const predict400 = r0(pace100s * 4 * 1.02) // slight positive split
    const predict1500 = r0(pace100s * 15 * 1.05)
    const predict3000 = r0(pace100s * 30 * 1.10) // open water

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(r0(s % 60)).padStart(2, '0')}`

    setResult({
      primaryMetric: { label: "Pace per 100m", value: `${paceMin}:${String(paceSec).padStart(2, '0')}`, unit: "/100m", status: effStatus, description: `Speed: ${speedKmh} km/h — ${efficiency}` },
      healthScore: r0(Math.min(100, speedKmh * 20)),
      metrics: [
        { label: "Pace per 100m", value: `${paceMin}:${String(paceSec).padStart(2, '0')}`, unit: "min:sec", status: effStatus },
        { label: "Speed", value: speedKmh, unit: "km/h", status: "normal" },
        { label: "Distance", value: d, unit: "meters", status: "normal" },
        { label: "Total Time", value: `${timeMin}:${String(timeSec).padStart(2, '0')}`, unit: "min:sec", status: "normal" },
        { label: "SWOLF Score (est.)", value: swolf, status: effStatus },
        { label: "Stroke Efficiency", value: efficiency, status: effStatus },
        { label: "Estimated VO₂max", value: vo2Est, unit: "mL/kg/min", status: vo2Est >= 45 ? "good" : vo2Est >= 35 ? "warning" : "danger" },
        { label: "400m Prediction", value: formatTime(predict400), status: "normal" },
        { label: "1500m Prediction", value: formatTime(predict1500), status: "normal" },
        { label: "3000m Open Water", value: formatTime(predict3000), status: "normal" }
      ],
      recommendations: [
        { title: "Swim Pace Assessment", description: `Pace ${paceMin}:${String(paceSec).padStart(2, '0')}/100m — ${efficiency} level. ${efficiency === "Elite" || efficiency === "Advanced" ? "Focus on race-specific pace work, negative splits, and hypoxic training." : efficiency === "Intermediate" ? "Improve with drill work (catch-up, fingertip drag), threshold sets, and technique video analysis." : "Build technique first — focus on body position, bilateral breathing, and high-elbow catch. Distance will come with efficiency."}`, priority: "high", category: "Assessment" },
        { title: "AI Race Strategy", description: `Race predictions — 400m: ${formatTime(predict400)}, 1500m: ${formatTime(predict1500)}, 3km OW: ${formatTime(predict3000)}. Strategy: negative split (second half faster) is optimal. For 1500m+, aim to hold steady pace for first 400m, then build. Practice pacing with a tempo trainer or GPS watch.`, priority: "high", category: "Racing" },
        { title: "Cardiorespiratory Evaluation", description: `Estimated VO₂max: ${vo2Est} mL/kg/min based on swim pace. ${vo2Est < 35 ? "Below average aerobic capacity. Swimming builds cardio fitness effectively — increase weekly volume gradually (10% per week)." : "Good cardiorespiratory fitness. Swimming provides excellent low-impact cardiovascular conditioning with full-body engagement."} Monitor for swimmer's shoulder — maintain rotator cuff strength and balanced stroke mechanics.`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Distance": `${d}m`, "Time": `${timeMin}:${String(timeSec).padStart(2, '0')}`, "Pace": `${paceMin}:${String(paceSec).padStart(2, '0')}/100m`, "Speed": `${speedKmh} km/h`, "SWOLF": swolf }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="swim-pace" title="Swim Pace Calculator"
      description="Calculate swimming pace per 100m with stroke efficiency, race predictions, and VO₂ estimation."
      icon={Waves} calculate={calculate} onClear={() => { setDistance(1500); setTimeMin(25); setTimeSec(0); setResult(null) }}
      values={[distance, timeMin, timeSec]} result={result}
      seoContent={<SeoContentGenerator title="Swim Pace Calculator" description="Calculate your swimming pace." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Distance" val={distance} set={setDistance} min={25} max={10000} suffix="meters" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Time (min)" val={timeMin} set={setTimeMin} min={0} max={600} />
          <NumInput label="Time (sec)" val={timeSec} set={setTimeSec} min={0} max={59} />
        </div>
      </div>} />
  )
}

// ─── 43. Triathlon Time Predictor ─────────────────────────────────────────────
export function TriathlonTimePredictor() {
  const [swimPaceMin, setSwimPaceMin] = useState(2)
  const [swimPaceSec, setSwimPaceSec] = useState(0)
  const [swimDist, setSwimDist] = useState(1500)
  const [bikeSpeed, setBikeSpeed] = useState(32)
  const [bikeDist, setBikeDist] = useState(40)
  const [runPaceMin, setRunPaceMin] = useState(5)
  const [runPaceSec, setRunPaceSec] = useState(30)
  const [runDist, setRunDist] = useState(10)
  const [t1, setT1] = useState(3)
  const [t2, setT2] = useState(2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const swimPace = clamp(swimPaceMin * 60 + swimPaceSec, 40, 300) // sec per 100m
    const sd = clamp(swimDist, 400, 3800)
    const bs = clamp(bikeSpeed, 15, 50)
    const bd = clamp(bikeDist, 10, 180)
    const runPace = clamp(runPaceMin * 60 + runPaceSec, 180, 600) // sec per km
    const rd = clamp(runDist, 3, 42.2)
    const trans1 = clamp(t1, 0, 15)
    const trans2 = clamp(t2, 0, 15)

    // Calculate times
    const swimTimeSec = r0((swimPace / 100) * sd)
    const bikeTimeSec = r0((bd / bs) * 3600)
    const runTimeSec = r0(runPace * rd)
    const transTimeSec = (trans1 + trans2) * 60

    // Fatigue carryover model (each leg slightly slower due to accumulated fatigue)
    const bikeFatigue = r0(bikeTimeSec * 0.02) // 2% slower due to swim fatigue
    const runFatigue = r0(runTimeSec * 0.05) // 5% slower due to bike fatigue

    const totalRaw = swimTimeSec + bikeTimeSec + runTimeSec + transTimeSec
    const totalWithFatigue = totalRaw + bikeFatigue + runFatigue

    // Environmental correction (average conditions)
    const heatCorrection = r0(totalWithFatigue * 0.015) // 1.5% heat penalty assumed
    const totalFinal = totalWithFatigue + heatCorrection

    const formatTime = (s: number) => {
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = r0(s % 60)
      return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
    }

    // Discipline split %
    const swimPct = r0((swimTimeSec / totalRaw) * 100)
    const bikePct = r0((bikeTimeSec / totalRaw) * 100)
    const runPct = r0((runTimeSec / totalRaw) * 100)

    // Weakest leg (most time by %)
    const splitPcts = [swimPct, bikePct, runPct]
    const idealSplits = [15, 55, 30] // typical Olympic tri splits
    const deviations = splitPcts.map((p, i) => Math.abs(p - idealSplits[i]))
    const weakestIdx = deviations.indexOf(Math.max(...deviations))
    const legs = ["Swim", "Bike", "Run"]
    const weakestLeg = legs[weakestIdx]

    // Podium probability estimate (simplified)
    const totalHours = totalFinal / 3600
    const isOlympic = sd >= 1400 && sd <= 1600 && bd >= 38 && bd <= 42
    let podiumEst = "N/A"
    if (isOlympic) {
      podiumEst = totalHours < 2.0 ? "Top 5% (Elite)" : totalHours < 2.5 ? "Top 15% (Competitive)" : totalHours < 3.0 ? "Top 40% (Mid-Pack)" : "Back 50%"
    }

    let status: 'good' | 'warning' | 'danger' | 'normal' = totalHours < 2.5 ? "good" : totalHours < 3.5 ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "Predicted Race Time", value: formatTime(totalFinal), status, description: `Raw: ${formatTime(totalRaw)} + fatigue/heat adjustments` },
      healthScore: r0(Math.min(100, Math.max(0, 110 - totalHours * 20))),
      metrics: [
        { label: "Swim Time", value: formatTime(swimTimeSec), unit: `${swimPct}%`, status: "normal" },
        { label: "T1 Transition", value: `${trans1}:00`, unit: "min", status: trans1 <= 3 ? "good" : "warning" },
        { label: "Bike Time", value: formatTime(bikeTimeSec), unit: `${bikePct}%`, status: "normal" },
        { label: "Bike Fatigue Penalty", value: `+${formatTime(bikeFatigue)}`, status: "normal" },
        { label: "T2 Transition", value: `${trans2}:00`, unit: "min", status: trans2 <= 2 ? "good" : "warning" },
        { label: "Run Time", value: formatTime(runTimeSec), unit: `${runPct}%`, status: "normal" },
        { label: "Run Fatigue Penalty", value: `+${formatTime(runFatigue)}`, status: "warning" },
        { label: "Heat/Environment Correction", value: `+${formatTime(heatCorrection)}`, status: "normal" },
        { label: "Raw Total", value: formatTime(totalRaw), status: "normal" },
        { label: "Adjusted Total", value: formatTime(totalFinal), status },
        { label: "Weakest Discipline", value: weakestLeg, status: "warning" },
        { label: "Split % (Swim/Bike/Run)", value: `${swimPct}/${bikePct}/${runPct}`, unit: "%", status: "normal" },
        ...(podiumEst !== "N/A" ? [{ label: "Podium Estimate (Olympic)", value: podiumEst, status: "normal" as const }] : [])
      ],
      recommendations: [
        { title: "Race Time Breakdown", description: `Predicted finish: ${formatTime(totalFinal)}. Splits — Swim: ${formatTime(swimTimeSec)} (${swimPct}%), Bike: ${formatTime(bikeTimeSec)} (${bikePct}%), Run: ${formatTime(runTimeSec)} (${runPct}%). Ideal Olympic splits: ~15% swim, ~55% bike, ~30% run. Your weakest discipline: ${weakestLeg}. ${podiumEst !== "N/A" ? `Placing estimate: ${podiumEst}.` : ""}`, priority: "high", category: "Assessment" },
        { title: "AI Race Pacing Plan", description: `Strategy: Swim at steady-state pace (don't sprint start). Bike at 85-90% FTP to preserve run legs — the bike-to-run transition is where races are won or lost. Run negative split: first 2km at target pace, build from there. Nutrition: 60-90g carbs/hour on bike, 200-300ml fluid every 20 min. Caffeine gel 45 min before run start.`, priority: "high", category: "Strategy" },
        { title: "Extreme Endurance Monitoring", description: `Total effort: ${formatTime(totalFinal)}. Fatigue carryover adds ${formatTime(bikeFatigue + runFatigue)} to raw time. ${totalHours > 3 ? "Extended endurance events carry cardiac stress risk. Ensure adequate training volume (12+ hours/week for 12+ weeks), cardiac screening if over 40, and have a hydration/nutrition plan to prevent hyponatremia." : "Moderate duration. Standard hydration and nutrition protocols apply. Monitor for heat-related illness in warm conditions."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Swim": `${formatTime(swimTimeSec)} (${swimPct}%)`, "T1": `${trans1} min`, "Bike": `${formatTime(bikeTimeSec)} (${bikePct}%)`, "T2": `${trans2} min`, "Run": `${formatTime(runTimeSec)} (${runPct}%)`, "Fatigue Adj.": `+${formatTime(bikeFatigue + runFatigue)}`, "Heat Adj.": `+${formatTime(heatCorrection)}`, "Final": formatTime(totalFinal) }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="triathlon-time" title="Triathlon Time Predictor"
      description="Predict triathlon race time with fatigue carryover model, environmental correction, discipline split analysis, and AI pacing strategy."
      icon={Timer} calculate={calculate} onClear={() => { setSwimPaceMin(2); setSwimPaceSec(0); setSwimDist(1500); setBikeSpeed(32); setBikeDist(40); setRunPaceMin(5); setRunPaceSec(30); setRunDist(10); setT1(3); setT2(2); setResult(null) }}
      values={[swimPaceMin, swimPaceSec, swimDist, bikeSpeed, bikeDist, runPaceMin, runPaceSec, runDist, t1, t2]} result={result}
      seoContent={<SeoContentGenerator title="Triathlon Time Predictor" description="Predict your triathlon finish time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">🏊 Swim</h3>
        <NumInput label="Swim Distance" val={swimDist} set={setSwimDist} min={400} max={3800} suffix="meters" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Swim Pace (min)" val={swimPaceMin} set={setSwimPaceMin} min={0} max={5} />
          <NumInput label="Pace (sec) per 100m" val={swimPaceSec} set={setSwimPaceSec} min={0} max={59} />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">🚴 Bike</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Bike Distance" val={bikeDist} set={setBikeDist} min={10} max={180} suffix="km" />
          <NumInput label="Bike Speed" val={bikeSpeed} set={setBikeSpeed} min={15} max={50} step={0.1} suffix="km/h" />
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">🏃 Run</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Run Distance" val={runDist} set={setRunDist} min={3} max={42.2} step={0.1} suffix="km" />
          <div className="grid grid-cols-2 gap-2">
            <NumInput label="Run Pace (min)" val={runPaceMin} set={setRunPaceMin} min={3} max={10} />
            <NumInput label="(sec)/km" val={runPaceSec} set={setRunPaceSec} min={0} max={59} />
          </div>
        </div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">🔄 Transitions</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="T1 (Swim → Bike)" val={t1} set={setT1} min={0} max={15} suffix="min" />
          <NumInput label="T2 (Bike → Run)" val={t2} set={setT2} min={0} max={15} suffix="min" />
        </div>
      </div>} />
  )
}
