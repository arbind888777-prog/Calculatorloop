"use client"
import { useState } from "react"
import { Activity, Timer, TrendingUp, Zap, Target, Flame, Mountain } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
function r2(n: number) { return Math.round(n * 100) / 100 }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function fmtTime(s: number) { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = r0(s % 60); return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}` }
function fmtPace(secPerKm: number) { return `${Math.floor(secPerKm / 60)}:${String(r0(secPerKm % 60)).padStart(2, '0')}` }

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

// ─── 44. Marathon Time Predictor ──────────────────────────────────────────────
export function MarathonTimePredictor() {
  const [raceType, setRaceType] = useState("10k")
  const [raceMin, setRaceMin] = useState(45)
  const [raceSec, setRaceSec] = useState(0)
  const [vo2max, setVo2max] = useState(50)
  const [weeklyMileage, setWeeklyMileage] = useState(50)
  const [elevation, setElevation] = useState(100)
  const [temperature, setTemperature] = useState(18)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const raceTimeSec = clamp(raceMin * 60 + raceSec, 600, 18000)
    const raceDist = raceType === "5k" ? 5 : raceType === "10k" ? 10 : 21.0975
    const marathonDist = 42.195
    const vo2 = clamp(vo2max, 25, 85)
    const mileage = clamp(weeklyMileage, 10, 200)
    const elev = clamp(elevation, 0, 3000)
    const temp = clamp(temperature, -5, 40)

    // Riegel formula
    const riegelTime = raceTimeSec * Math.pow(marathonDist / raceDist, 1.06)

    // Fatigue resistance coefficient based on weekly mileage
    const fatigueCoeff = mileage >= 80 ? 0.97 : mileage >= 60 ? 1.0 : mileage >= 40 ? 1.03 : 1.08
    const adjustedTime = riegelTime * fatigueCoeff

    // Elevation adjustment (~12s per 100m gain per marathon)
    const elevAdj = (elev / 100) * 12
    const elevAdjustedTime = adjustedTime + elevAdj

    // Heat adjustment (>15°C adds ~1.5% per 5°C above)
    const heatPenalty = temp > 15 ? ((temp - 15) / 5) * 0.015 * elevAdjustedTime : temp < 2 ? 0.01 * elevAdjustedTime : 0
    const finalTime = r0(elevAdjustedTime + heatPenalty)

    const pacePerKm = finalTime / marathonDist
    const glycogenDepletion = r1(Math.min(42, 28 + (80 - mileage) * 0.15))
    const wallProb = mileage < 40 ? r0(65) : mileage < 55 ? r0(40) : mileage < 70 ? r0(20) : r0(8)

    // Split strategy
    const firstHalfPace = r0(pacePerKm * 1.01)
    const secondHalfPace = r0(pacePerKm * 0.99)

    let status: 'good' | 'warning' | 'danger' | 'normal' = "good"
    let readiness = "Well-Prepared"
    if (mileage < 35) { status = "danger"; readiness = "High Crash Probability" }
    else if (mileage < 50) { status = "warning"; readiness = "Mileage Low" }

    const riskColor = status === "good" ? "🟢 Green" : status === "warning" ? "🟡 Yellow" : "🔴 Red"

    setResult({
      primaryMetric: { label: "Marathon Prediction", value: fmtTime(finalTime), status, description: `${readiness} — ${riskColor}` },
      healthScore: r0(Math.min(100, Math.max(0, 100 - (finalTime / 3600 - 2.5) * 15))),
      metrics: [
        { label: "Riegel Base Time", value: fmtTime(r0(riegelTime)), status: "normal" },
        { label: "Fatigue-Adjusted", value: fmtTime(r0(adjustedTime)), status: "normal" },
        { label: "Final Predicted Time", value: fmtTime(finalTime), status },
        { label: "Pace per km", value: fmtPace(pacePerKm), unit: "/km", status: "normal" },
        { label: "Fatigue Resistance Coeff.", value: fatigueCoeff, status: fatigueCoeff <= 1.0 ? "good" : fatigueCoeff <= 1.03 ? "warning" : "danger" },
        { label: "Glycogen Depletion Point", value: `~${glycogenDepletion} km`, status: glycogenDepletion > 35 ? "good" : glycogenDepletion > 30 ? "warning" : "danger" },
        { label: "Wall Probability (30-35km)", value: wallProb, unit: "%", status: wallProb < 20 ? "good" : wallProb < 40 ? "warning" : "danger" },
        { label: "Elevation Adjustment", value: `+${r0(elevAdj)}s`, status: elevAdj < 30 ? "good" : "warning" },
        { label: "Heat Adjustment", value: `+${fmtTime(r0(heatPenalty))}`, status: heatPenalty < 60 ? "good" : "warning" },
        { label: "1st Half Pace", value: fmtPace(firstHalfPace), unit: "/km", status: "normal" },
        { label: "2nd Half Pace", value: fmtPace(secondHalfPace), unit: "/km", status: "good" },
        { label: "Weekly Mileage", value: mileage, unit: "km", status: mileage >= 60 ? "good" : mileage >= 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Race Prediction Analysis", description: `Predicted ${fmtTime(finalTime)} (${fmtPace(pacePerKm)}/km). Based on ${raceType.toUpperCase()} time of ${fmtTime(raceTimeSec)} using Riegel formula with fatigue coefficient ${fatigueCoeff}. ${wallProb > 30 ? "⚠️ HIGH wall probability. Increase weekly long runs to 32+ km and weekly mileage to 60+ km." : "Good preparation level for target time."}`, priority: "high", category: "Prediction" },
        { title: "AI Negative Split Strategy", description: `Run first half at ${fmtPace(firstHalfPace)}/km, second half at ${fmtPace(secondHalfPace)}/km. Start conservatively — banking time early leads to exponential fadeout. Key: km 30-35 is the critical zone. If glycogen depletes at ~${glycogenDepletion}km, fuel with 60-90g carbs/hour starting from 30min into the race.`, priority: "high", category: "Strategy" },
        { title: "Extreme Endurance Monitoring", description: `Marathon stress equivalent to 3-4 hours at threshold. ${temp > 25 ? "Heat risk is significant — pre-cool with ice vests, drink to thirst (not over-hydrate), pour water on neck/wrists." : "Temperature favorable for performance."} Post-race: expect 2-4 weeks recovery. CK levels peak 24-48hrs post-race. Avoid NSAIDS during the race (kidney stress).`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Input Race": `${raceType.toUpperCase()} in ${fmtTime(raceTimeSec)}`, "Riegel": fmtTime(r0(riegelTime)), "Fatigue Adj": `×${fatigueCoeff}`, "Elev Adj": `+${r0(elevAdj)}s`, "Heat Adj": `+${r0(heatPenalty)}s`, "Final": fmtTime(finalTime), "Pace": `${fmtPace(pacePerKm)}/km` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="marathon-time" title="Marathon Time Predictor"
      description="Predict your marathon finish time using the Riegel formula with fatigue resistance, heat adjustment, and glycogen depletion modeling."
      icon={Timer} calculate={calculate} onClear={() => { setRaceType("10k"); setRaceMin(45); setRaceSec(0); setVo2max(50); setWeeklyMileage(50); setElevation(100); setTemperature(18); setResult(null) }}
      values={[raceType, raceMin, raceSec, vo2max, weeklyMileage, elevation, temperature]} result={result}
      seoContent={<SeoContentGenerator title="Marathon Time Predictor" description="Predict your marathon finish time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Recent Race Distance" val={raceType} set={setRaceType} options={[{ value: "5k", label: "5K" }, { value: "10k", label: "10K" }, { value: "half", label: "Half Marathon" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Race Time (min)" val={raceMin} set={setRaceMin} min={10} max={300} />
          <NumInput label="Race Time (sec)" val={raceSec} set={setRaceSec} min={0} max={59} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="VO₂ max" val={vo2max} set={setVo2max} min={25} max={85} suffix="mL/kg/min" />
          <NumInput label="Weekly Mileage" val={weeklyMileage} set={setWeeklyMileage} min={10} max={200} suffix="km" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Elevation Gain" val={elevation} set={setElevation} min={0} max={3000} suffix="meters" />
          <NumInput label="Race Day Temperature" val={temperature} set={setTemperature} min={-5} max={40} suffix="°C" />
        </div>
      </div>} />
  )
}

// ─── 45. Half-Marathon Predictor ──────────────────────────────────────────────
export function HalfMarathonPredictor() {
  const [raceType, setRaceType] = useState("10k")
  const [raceMin, setRaceMin] = useState(45)
  const [raceSec, setRaceSec] = useState(0)
  const [weeklyMileage, setWeeklyMileage] = useState(40)
  const [vo2max, setVo2max] = useState(48)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const raceTimeSec = clamp(raceMin * 60 + raceSec, 600, 12000)
    const raceDist = raceType === "5k" ? 5 : 10
    const halfDist = 21.0975
    const vo2 = clamp(vo2max, 25, 85)
    const mileage = clamp(weeklyMileage, 10, 150)

    const riegelTime = raceTimeSec * Math.pow(halfDist / raceDist, 1.06)
    const fatigueCoeff = mileage >= 50 ? 0.98 : mileage >= 35 ? 1.0 : 1.04
    const finalTime = r0(riegelTime * fatigueCoeff)
    const pacePerKm = finalTime / halfDist

    // Lactate threshold alignment
    const ltPace = r0(pacePerKm * 0.95)
    const sustainablePace = r0(pacePerKm * 1.02)

    // 8-week improvement
    const improvedTime = r0(finalTime * 0.96)

    let status: 'good' | 'warning' | 'danger' | 'normal' = mileage >= 40 ? "good" : mileage >= 25 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Half-Marathon Prediction", value: fmtTime(finalTime), status, description: `Pace: ${fmtPace(pacePerKm)}/km` },
      healthScore: r0(Math.min(100, Math.max(0, 100 - (finalTime / 3600 - 1.2) * 25))),
      metrics: [
        { label: "Predicted Time", value: fmtTime(finalTime), status },
        { label: "Pace per km", value: fmtPace(pacePerKm), unit: "/km", status: "normal" },
        { label: "Sustainable Race Pace", value: fmtPace(sustainablePace), unit: "/km", status: "good" },
        { label: "Lactate Threshold Pace", value: fmtPace(ltPace), unit: "/km", status: "normal" },
        { label: "Fatigue Coefficient", value: fatigueCoeff, status: fatigueCoeff <= 1.0 ? "good" : "warning" },
        { label: "VO₂ max", value: vo2, unit: "mL/kg/min", status: vo2 >= 50 ? "good" : vo2 >= 40 ? "normal" : "warning" },
        { label: "Weekly Mileage", value: mileage, unit: "km", status: mileage >= 40 ? "good" : "warning" },
        { label: "8-Week Projection", value: fmtTime(improvedTime), status: "good" }
      ],
      recommendations: [
        { title: "Race Analysis", description: `Predicted ${fmtTime(finalTime)} based on ${raceType.toUpperCase()} performance. Optimal race pace: ${fmtPace(sustainablePace)}/km. Aim to run at or slightly below lactate threshold pace (${fmtPace(ltPace)}/km) for the first 10km, then assess energy for a negative split.`, priority: "high", category: "Prediction" },
        { title: "Performance Improvement", description: `8-week improvement projection: ${fmtTime(improvedTime)} (4% improvement with structured training). Key sessions: weekly tempo run at LT pace, one long run (16-18km), one interval session (5×1km at 5K pace). Increase weekly mileage by 10%/week max.`, priority: "high", category: "Training" },
        { title: "Race Fueling", description: `At ${fmtPace(pacePerKm)}/km, you'll finish in ~${r0(finalTime / 60)} minutes. ${finalTime > 5400 ? "Take 30-45g carbs at 45 and 75 minutes. Drink to thirst at aid stations." : "For sub-90 min efforts, fueling is less critical but a gel at 45-50 min can help the final push."}`, priority: "medium", category: "Nutrition" }
      ],
      detailedBreakdown: { "Input": `${raceType.toUpperCase()} in ${fmtTime(raceTimeSec)}`, "Riegel": fmtTime(r0(riegelTime)), "Adjusted": fmtTime(finalTime), "Pace": `${fmtPace(pacePerKm)}/km`, "8-Week Target": fmtTime(improvedTime) }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="half-marathon-time" title="Half-Marathon Time Predictor"
      description="Predict your half-marathon time with lactate threshold alignment and 8-week improvement projection."
      icon={Timer} calculate={calculate} onClear={() => { setRaceType("10k"); setRaceMin(45); setRaceSec(0); setWeeklyMileage(40); setVo2max(48); setResult(null) }}
      values={[raceType, raceMin, raceSec, weeklyMileage, vo2max]} result={result}
      seoContent={<SeoContentGenerator title="Half-Marathon Time Predictor" description="Predict your half-marathon time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Recent Race" val={raceType} set={setRaceType} options={[{ value: "5k", label: "5K" }, { value: "10k", label: "10K" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Race Time (min)" val={raceMin} set={setRaceMin} min={10} max={180} />
          <NumInput label="Race Time (sec)" val={raceSec} set={setRaceSec} min={0} max={59} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="VO₂ max" val={vo2max} set={setVo2max} min={25} max={85} suffix="mL/kg/min" />
          <NumInput label="Weekly Mileage" val={weeklyMileage} set={setWeeklyMileage} min={10} max={150} suffix="km" />
        </div>
      </div>} />
  )
}

// ─── 46. 5K Time Predictor ────────────────────────────────────────────────────
export function FiveKTimePredictor() {
  const [vo2max, setVo2max] = useState(48)
  const [mileMin, setMileMin] = useState(7)
  const [mileSec, setMileSec] = useState(0)
  const [weeklyLoad, setWeeklyLoad] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const vo2 = clamp(vo2max, 25, 85)
    const mileTime = clamp(mileMin * 60 + mileSec, 240, 900)
    const load = clamp(weeklyLoad, 5, 150)

    // Riegel from 1-mile
    const riegelTime = mileTime * Math.pow(5 / 1.60934, 1.06)
    // VO2-based estimate: 5K time ≈ 1560 - vo2 * 15 (simplified)
    const vo2Time = Math.max(720, 1560 - vo2 * 15)
    // Average both methods
    const avgTime = r0((riegelTime + vo2Time) / 2)

    const pacePerKm = avgTime / 5
    const speedEndurance = r0(Math.min(100, (mileTime / (avgTime / 5 * 1.60934)) * 100))

    // Sprint-to-distance conversion
    const predicted10k = r0(avgTime * Math.pow(10 / 5, 1.06))

    let status: 'good' | 'warning' | 'danger' | 'normal' = avgTime < 1200 ? "good" : avgTime < 1500 ? "normal" : avgTime < 1800 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "5K Prediction", value: fmtTime(avgTime), status, description: `Pace: ${fmtPace(pacePerKm)}/km` },
      healthScore: r0(Math.min(100, Math.max(0, 120 - avgTime / 18))),
      metrics: [
        { label: "Predicted 5K Time", value: fmtTime(avgTime), status },
        { label: "Pace per km", value: fmtPace(pacePerKm), unit: "/km", status: "normal" },
        { label: "Riegel Estimate", value: fmtTime(r0(riegelTime)), status: "normal" },
        { label: "VO₂-Based Estimate", value: fmtTime(r0(vo2Time)), status: "normal" },
        { label: "Speed Endurance Index", value: speedEndurance, unit: "%", status: speedEndurance >= 90 ? "good" : speedEndurance >= 80 ? "normal" : "warning" },
        { label: "10K Projection", value: fmtTime(predicted10k), status: "normal" },
        { label: "VO₂ max", value: vo2, unit: "mL/kg/min", status: vo2 >= 50 ? "good" : vo2 >= 40 ? "normal" : "warning" }
      ],
      recommendations: [
        { title: "5K Race Strategy", description: `Predicted ${fmtTime(avgTime)}. Target pace: ${fmtPace(pacePerKm)}/km. Start at target pace, don't sprint the first km. Build slightly in km 3-4, then push final km. Speed endurance index: ${speedEndurance}% — ${speedEndurance >= 90 ? "excellent speed retention" : "work on tempo runs to improve pace sustainability"}.`, priority: "high", category: "Strategy" },
        { title: "Sprint-to-Distance Model", description: `Mile time ${fmtTime(mileTime)} converts to ${fmtTime(avgTime)} 5K and ~${fmtTime(predicted10k)} 10K. To improve 5K: add 1-2 interval sessions/week (8×400m at mile pace or 5×800m at 5K pace). Long runs (8-12km easy) build aerobic base.`, priority: "high", category: "Training" },
        { title: "Aerobic Capacity", description: `VO₂max ${vo2}: ${vo2 >= 55 ? "Excellent aerobic capacity." : vo2 >= 45 ? "Good fitness — interval training can push VO₂max 5-10%." : "Moderate — focus on building aerobic base with consistent easy running 4-5 days/week."}`, priority: "medium", category: "Fitness" }
      ],
      detailedBreakdown: { "Mile Time": fmtTime(mileTime), "VO₂max": vo2, "Riegel": fmtTime(r0(riegelTime)), "VO₂ Est": fmtTime(r0(vo2Time)), "Average": fmtTime(avgTime), "Pace": `${fmtPace(pacePerKm)}/km` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="5k-time" title="5K Time Predictor"
      description="Predict your 5K race time using VO₂max and mile time with speed endurance index and sprint-to-distance conversion."
      icon={Timer} calculate={calculate} onClear={() => { setVo2max(48); setMileMin(7); setMileSec(0); setWeeklyLoad(30); setResult(null) }}
      values={[vo2max, mileMin, mileSec, weeklyLoad]} result={result}
      seoContent={<SeoContentGenerator title="5K Time Predictor" description="Predict your 5K race time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="1-Mile Time (min)" val={mileMin} set={setMileMin} min={4} max={15} />
          <NumInput label="Mile (sec)" val={mileSec} set={setMileSec} min={0} max={59} />
        </div>
        <NumInput label="VO₂ max" val={vo2max} set={setVo2max} min={25} max={85} suffix="mL/kg/min" />
        <NumInput label="Weekly Training Load" val={weeklyLoad} set={setWeeklyLoad} min={5} max={150} suffix="km" />
      </div>} />
  )
}

// ─── 47. 10K Time Predictor ───────────────────────────────────────────────────
export function TenKTimePredictor() {
  const [fiveKMin, setFiveKMin] = useState(24)
  const [fiveKSec, setFiveKSec] = useState(0)
  const [vo2max, setVo2max] = useState(48)
  const [longRunDist, setLongRunDist] = useState(15)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const fiveKTime = clamp(fiveKMin * 60 + fiveKSec, 720, 3600)
    const vo2 = clamp(vo2max, 25, 85)
    const lrd = clamp(longRunDist, 5, 35)

    const riegelTime = fiveKTime * Math.pow(10 / 5, 1.06)
    const enduranceAdj = lrd >= 16 ? 0.98 : lrd >= 12 ? 1.0 : 1.03
    const finalTime = r0(riegelTime * enduranceAdj)
    const pacePerKm = finalTime / 10

    // Fatigue curve: pace fade per km
    const paceFadePerKm = r2((pacePerKm * 0.03) / 10)
    const paceFadeRisk = lrd < 10 ? "High" : lrd < 14 ? "Moderate" : "Low"

    const halfPrediction = r0(finalTime * Math.pow(21.0975 / 10, 1.06))

    let status: 'good' | 'warning' | 'danger' | 'normal' = finalTime < 2700 ? "good" : finalTime < 3600 ? "normal" : "warning"

    setResult({
      primaryMetric: { label: "10K Prediction", value: fmtTime(finalTime), status, description: `Pace: ${fmtPace(pacePerKm)}/km` },
      healthScore: r0(Math.min(100, Math.max(0, 110 - finalTime / 36))),
      metrics: [
        { label: "Predicted 10K", value: fmtTime(finalTime), status },
        { label: "Pace per km", value: fmtPace(pacePerKm), unit: "/km", status: "normal" },
        { label: "Riegel Base", value: fmtTime(r0(riegelTime)), status: "normal" },
        { label: "Endurance Adjust", value: enduranceAdj, status: enduranceAdj <= 1.0 ? "good" : "warning" },
        { label: "Pace Fade per km", value: `+${paceFadePerKm}s`, status: paceFadeRisk === "Low" ? "good" : paceFadeRisk === "Moderate" ? "warning" : "danger" },
        { label: "Pace Fade Risk", value: paceFadeRisk, status: paceFadeRisk === "Low" ? "good" : paceFadeRisk === "Moderate" ? "warning" : "danger" },
        { label: "Half-Marathon Projection", value: fmtTime(halfPrediction), status: "normal" },
        { label: "Long Run Distance", value: lrd, unit: "km", status: lrd >= 14 ? "good" : lrd >= 10 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "10K Strategy", description: `Predicted ${fmtTime(finalTime)} at ${fmtPace(pacePerKm)}/km. First 3km at target pace, km 4-7 maintain rhythm, km 8-10 push to finish. Pace fade risk: ${paceFadeRisk}. ${paceFadeRisk !== "Low" ? "Increase long runs to 16+ km to build fatigue resistance." : "Good endurance base."}`, priority: "high", category: "Strategy" },
        { title: "Training Focus", description: `From 5K (${fmtTime(fiveKTime)}) to 10K requires sustained aerobic power. Key workouts: 4×2km at 10K pace, tempo runs at half-marathon pace (20-30 min), and weekly long run of ${Math.max(14, lrd)}+ km. VO₂max intervals (5×1km) once/week improve ceiling.`, priority: "high", category: "Training" },
        { title: "Pace Fade Prevention", description: `Fade risk ${paceFadeRisk}: ${paceFadePerKm}s slower per km in later stages. Reduce fade by: 1) Higher aerobic base (more easy miles), 2) Race-pace tempo runs, 3) Practice even-split pacing in training, 4) Caffeine 45 min pre-race (3-6mg/kg).`, priority: "medium", category: "Performance" }
      ],
      detailedBreakdown: { "5K Time": fmtTime(fiveKTime), "Riegel": fmtTime(r0(riegelTime)), "Adj Factor": enduranceAdj, "Final 10K": fmtTime(finalTime), "Pace": `${fmtPace(pacePerKm)}/km` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="10k-time" title="10K Time Predictor"
      description="Predict your 10K race time from 5K performance with fatigue curve analysis and pace fade risk assessment."
      icon={Timer} calculate={calculate} onClear={() => { setFiveKMin(24); setFiveKSec(0); setVo2max(48); setLongRunDist(15); setResult(null) }}
      values={[fiveKMin, fiveKSec, vo2max, longRunDist]} result={result}
      seoContent={<SeoContentGenerator title="10K Time Predictor" description="Predict your 10K race time." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="5K Time (min)" val={fiveKMin} set={setFiveKMin} min={12} max={60} />
          <NumInput label="5K (sec)" val={fiveKSec} set={setFiveKSec} min={0} max={59} />
        </div>
        <NumInput label="VO₂ max" val={vo2max} set={setVo2max} min={25} max={85} suffix="mL/kg/min" />
        <NumInput label="Longest Recent Run" val={longRunDist} set={setLongRunDist} min={5} max={35} suffix="km" />
      </div>} />
  )
}

// ─── 48. Rowing Calories Calculator ───────────────────────────────────────────
export function RowingCaloriesCalculator() {
  const [duration, setDuration] = useState(30)
  const [strokeRate, setStrokeRate] = useState(24)
  const [weight, setWeight] = useState(75)
  const [avgWatts, setAvgWatts] = useState(150)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 5, 180)
    const sr = clamp(strokeRate, 16, 40)
    const w = clamp(weight, 30, 200)
    const watts = clamp(avgWatts, 50, 500)

    // MET-based: rowing ergometer ~7 MET moderate, ~12 MET vigorous
    const met = watts < 100 ? 5.8 : watts < 150 ? 7.0 : watts < 200 ? 8.5 : watts < 300 ? 10.5 : 12.5
    const calories = r0(met * 3.5 * w / 200 * dur)

    const pwr = r2(watts / w)
    const ltCorrelation = pwr >= 2.5 ? "Above LT" : pwr >= 1.8 ? "Near LT" : "Below LT"

    // Back strain risk
    const backRisk = sr > 30 && watts > 200 ? "Elevated" : sr > 26 ? "Moderate" : "Low"
    const backRiskProb = backRisk === "Elevated" ? r0(25) : backRisk === "Moderate" ? r0(12) : r0(5)

    const status: 'good' | 'warning' | 'danger' | 'normal' = calories > 200 ? "good" : "normal"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${dur} min at ${watts}W` },
      healthScore: r0(Math.min(100, calories / 5)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Power-to-Weight", value: pwr, unit: "W/kg", status: pwr >= 2 ? "good" : "normal" },
        { label: "Stroke Rate", value: sr, unit: "spm", status: sr <= 28 ? "good" : "warning" },
        { label: "Avg Power", value: watts, unit: "watts", status: "normal" },
        { label: "Lactate Threshold Correlation", value: ltCorrelation, status: ltCorrelation === "Above LT" ? "warning" : "good" },
        { label: "Back Strain Risk", value: `${backRiskProb}% (${backRisk})`, status: backRisk === "Low" ? "good" : backRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Rowing Analysis", description: `${calories} kcal in ${dur} min at ${watts}W (${met} METs). Power-to-weight: ${pwr} W/kg. ${pwr >= 2.5 ? "Strong rowing power — competitive level." : pwr >= 1.5 ? "Good recreational level." : "Building phase — focus on technique before increasing power."}`, priority: "high", category: "Assessment" },
        { title: "Back Strain Prevention", description: `Risk: ${backRisk} (${backRiskProb}%). ${backRisk !== "Low" ? "High stroke rate with high power increases lumbar disc pressure. Keep stroke rate 22-26 spm for sustained work. Engage core before each drive phase. Avoid excessive layback beyond 11 o'clock position." : "Good stroke rate and power balance. Maintain proper form."}`, priority: "high", category: "Clinical" },
        { title: "Training Zones", description: `${ltCorrelation}: ${ltCorrelation === "Above LT" ? "Working above lactate threshold — limit to intervals. Alternate 2-3 min hard with 1-2 min easy." : "Sustainable aerobic zone. Good for endurance building. Can maintain for 30-60+ minutes."}`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Duration": `${dur} min`, "Power": `${watts}W`, "MET": met, "Calories": calories, "W/kg": pwr, "Back Risk": `${backRiskProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="rowing-calories-burned" title="Rowing Calories Calculator"
      description="Calculate calories burned rowing with power-to-weight, lactate threshold correlation, and back strain risk assessment."
      icon={Activity} calculate={calculate} onClear={() => { setDuration(30); setStrokeRate(24); setWeight(75); setAvgWatts(150); setResult(null) }}
      values={[duration, strokeRate, weight, avgWatts]} result={result}
      seoContent={<SeoContentGenerator title="Rowing Calories Calculator" description="Calculate calories burned while rowing." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Duration" val={duration} set={setDuration} min={5} max={180} suffix="minutes" />
          <NumInput label="Stroke Rate" val={strokeRate} set={setStrokeRate} min={16} max={40} suffix="spm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
          <NumInput label="Average Power" val={avgWatts} set={setAvgWatts} min={50} max={500} suffix="watts" />
        </div>
      </div>} />
  )
}

// ─── 49. Stair Climbing Calories ──────────────────────────────────────────────
export function StairClimbingCaloriesCalculator() {
  const [floors, setFloors] = useState(20)
  const [weight, setWeight] = useState(75)
  const [speed, setSpeed] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const fl = clamp(floors, 1, 200)
    const w = clamp(weight, 30, 200)
    const floorHeight = 3.0 // meters per floor

    const totalVertical = fl * floorHeight
    const met = speed === "slow" ? 4.0 : speed === "moderate" ? 8.8 : 14.0
    const estMinutes = fl * (speed === "slow" ? 0.6 : speed === "moderate" ? 0.4 : 0.25)
    const calories = r0(met * 3.5 * w / 200 * estMinutes)

    // Mechanical work (J = mgh, 1kcal = 4184J)
    const mechWorkJ = w * 9.81 * totalVertical
    const mechWorkKcal = r1(mechWorkJ / 4184)
    const efficiency = r0((mechWorkKcal / calories) * 100)

    // Knee stress index
    const kneeStress = fl > 50 ? "High" : fl > 20 ? "Moderate" : "Low"
    const kneeStressScore = fl > 50 ? r0(30 + fl * 0.2) : fl > 20 ? r0(10 + fl * 0.3) : r0(5)

    const status: 'good' | 'warning' | 'danger' | 'normal' = calories > 100 ? "good" : "normal"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${fl} floors (${totalVertical}m vertical)` },
      healthScore: r0(Math.min(100, calories / 3)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "Floors Climbed", value: fl, status: "normal" },
        { label: "Vertical Gain", value: totalVertical, unit: "m", status: "normal" },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Est. Duration", value: r1(estMinutes), unit: "min", status: "normal" },
        { label: "Mechanical Work", value: mechWorkKcal, unit: "kcal", status: "normal" },
        { label: "Mechanical Efficiency", value: efficiency, unit: "%", status: "normal" },
        { label: "Knee Stress Index", value: `${kneeStressScore}% (${kneeStress})`, status: kneeStress === "Low" ? "good" : kneeStress === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Stair Climbing Analysis", description: `${calories} kcal from ${fl} floors (${totalVertical}m). Stair climbing burns 2-3x more calories than walking and is excellent for cardiovascular fitness and leg strength. Mechanical efficiency ~${efficiency}%.`, priority: "high", category: "Assessment" },
        { title: "Knee Protection", description: `Knee stress: ${kneeStress}. ${kneeStressScore > 20 ? "High floor counts increase patellofemoral joint loading. Use handrails for balance (not pulling), maintain upright posture, and consider descending via elevator to reduce 2-3x higher descending knee forces." : "Manageable load. Progress gradually — add 2-3 floors per session."}`, priority: "high", category: "Clinical" },
        { title: "Progressive Training", description: `${speed === "slow" ? "Start with 10-15 floors and increase weekly. Focus on steady breathing." : speed === "moderate" ? "Good intensity. Try stair intervals: 5 floors fast, 2 slow recovery, repeat." : "High intensity — limit to 2-3 sessions/week with recovery days between."}`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Floors": fl, "Vertical": `${totalVertical}m`, "MET": met, "Duration": `${r1(estMinutes)} min`, "Calories": calories, "Knee Stress": `${kneeStressScore}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="stair-climbing-calories" title="Stair Climbing Calories Calculator"
      description="Calculate calories burned climbing stairs with vertical mechanical work, efficiency analysis, and knee stress index."
      icon={TrendingUp} calculate={calculate} onClear={() => { setFloors(20); setWeight(75); setSpeed("moderate"); setResult(null) }}
      values={[floors, weight, speed]} result={result}
      seoContent={<SeoContentGenerator title="Stair Climbing Calories" description="Estimate calories burned climbing stairs." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Floors Climbed" val={floors} set={setFloors} min={1} max={200} />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
        <SelectInput label="Speed" val={speed} set={setSpeed} options={[{ value: "slow", label: "Slow (casual)" }, { value: "moderate", label: "Moderate (brisk)" }, { value: "fast", label: "Fast (vigorous)" }]} />
      </div>} />
  )
}

// ─── 50. Elliptical Calories Calculator ───────────────────────────────────────
export function EllipticalCaloriesCalculator() {
  const [duration, setDuration] = useState(30)
  const [resistance, setResistance] = useState(5)
  const [weight, setWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 5, 120)
    const res = clamp(resistance, 1, 20)
    const w = clamp(weight, 30, 200)

    const met = 4.0 + res * 0.5
    const calories = r0(met * 3.5 * w / 200 * dur)
    const fatOxPct = met < 7 ? r0(55 - met * 2) : r0(35 - met)

    // Joint load reduction vs running
    const jointReduction = r0(40 + res * 0.5) // 40-50% less than running

    const status: 'good' | 'warning' | 'danger' | 'normal' = calories > 150 ? "good" : "normal"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${dur} min, resistance ${res}` },
      healthScore: r0(Math.min(100, calories / 4)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: r1(met), status: "normal" },
        { label: "Fat Oxidation %", value: fatOxPct, unit: "%", status: fatOxPct > 40 ? "good" : "normal" },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Resistance Level", value: res, unit: "/20", status: "normal" },
        { label: "Joint Load Reduction", value: jointReduction, unit: "% vs running", status: "good" }
      ],
      recommendations: [
        { title: "Elliptical Analysis", description: `${calories} kcal in ${dur} min at resistance ${res} (${r1(met)} METs). Fat oxidation ~${fatOxPct}% of calories from fat at this intensity. ${met < 7 ? "Lower intensity — excellent for fat burning zone." : "Higher intensity — more total calories but lower fat %."} `, priority: "high", category: "Assessment" },
        { title: "Joint Load Benefit", description: `Elliptical reduces joint impact by ~${jointReduction}% compared to running. Excellent for: recovering from injury, osteoarthritis, overweight individuals starting exercise, or high-volume training without joint wear.`, priority: "high", category: "Clinical" },
        { title: "Optimizing Workout", description: `For max calorie burn: interval training (2 min resistance ${Math.min(20, res + 4)}, 1 min resistance ${Math.max(1, res - 2)}). For fat loss: steady-state at current level for 40-60 min. Use arm handles actively to increase calorie burn by 15-20%.`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Duration": `${dur} min`, "Resistance": `${res}/20`, "MET": r1(met), "Calories": calories, "Fat Ox": `${fatOxPct}%`, "Joint Reduction": `${jointReduction}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="elliptical-calories" title="Elliptical Calories Calculator"
      description="Calculate calories burned on the elliptical with fat oxidation percentage and joint load reduction index."
      icon={Activity} calculate={calculate} onClear={() => { setDuration(30); setResistance(5); setWeight(75); setResult(null) }}
      values={[duration, resistance, weight]} result={result}
      seoContent={<SeoContentGenerator title="Elliptical Calories Calculator" description="Calculate calories burned on elliptical machine." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Duration" val={duration} set={setDuration} min={5} max={120} suffix="minutes" />
        <NumInput label="Resistance Level" val={resistance} set={setResistance} min={1} max={20} />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 51. Boxing Calories Calculator ───────────────────────────────────────────
export function BoxingCaloriesCalculator() {
  const [rounds, setRounds] = useState(8)
  const [roundDuration, setRoundDuration] = useState(3)
  const [weight, setWeight] = useState(75)
  const [hr, setHr] = useState(155)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const rnd = clamp(rounds, 1, 20)
    const rd = clamp(roundDuration, 1, 5)
    const w = clamp(weight, 30, 200)
    const heartRate = clamp(hr, 100, 200)

    const totalMin = rnd * rd
    const met = heartRate > 170 ? 12.8 : heartRate > 150 ? 10.3 : heartRate > 130 ? 7.8 : 5.5
    const calories = r0(met * 3.5 * w / 200 * totalMin)

    // Anaerobic load (higher HR = more anaerobic)
    const anaerobicLoad = r0(Math.min(100, (heartRate - 120) * 1.2))

    // Shoulder overuse risk
    const shoulderRisk = rnd > 10 ? "Elevated" : rnd > 6 ? "Moderate" : "Low"
    const shoulderProb = rnd > 10 ? r0(20 + rnd) : rnd > 6 ? r0(8 + rnd) : r0(5)

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${rnd} rounds × ${rd} min` },
      healthScore: r0(Math.min(100, calories / 4)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "Rounds", value: rnd, status: "normal" },
        { label: "Total Time", value: totalMin, unit: "min", status: "normal" },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Avg Heart Rate", value: heartRate, unit: "bpm", status: heartRate < 160 ? "good" : heartRate < 180 ? "warning" : "danger" },
        { label: "Anaerobic Load", value: anaerobicLoad, unit: "%", status: anaerobicLoad < 50 ? "good" : anaerobicLoad < 75 ? "warning" : "danger" },
        { label: "Shoulder Overuse Risk", value: `${shoulderProb}% (${shoulderRisk})`, status: shoulderRisk === "Low" ? "good" : shoulderRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Boxing Analysis", description: `${calories} kcal from ${rnd} rounds (${totalMin} min). ${met} METs — ${met > 10 ? "very high intensity combat training" : met > 7 ? "moderate-high intensity" : "light training"}. Boxing burns 500-800 kcal/hour depending on intensity.`, priority: "high", category: "Assessment" },
        { title: "Shoulder Protection", description: `Risk: ${shoulderRisk} (${shoulderProb}%). ${shoulderRisk !== "Low" ? "High round count increases rotator cuff and labral stress. Include band external rotations, face pulls, and shoulder prehab work. Limit heavy bag work to 6-8 rounds max." : "Good volume. Maintain shoulder mobility and strengthening exercises."}`, priority: "high", category: "Clinical" },
        { title: "Training Balance", description: `Anaerobic load ${anaerobicLoad}%. ${anaerobicLoad > 60 ? "High anaerobic demand — limit to 2-3 sessions/week with 48hr recovery. Include steady-state cardio for aerobic base." : "Mix of aerobic/anaerobic — good training balance."}`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Rounds": `${rnd} × ${rd} min`, "Total": `${totalMin} min`, "HR": `${heartRate} bpm`, "MET": met, "Calories": calories }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="boxing-calories-burned" title="Boxing Calories Calculator"
      description="Calculate calories burned boxing with anaerobic load analysis and shoulder overuse risk assessment."
      icon={Zap} calculate={calculate} onClear={() => { setRounds(8); setRoundDuration(3); setWeight(75); setHr(155); setResult(null) }}
      values={[rounds, roundDuration, weight, hr]} result={result}
      seoContent={<SeoContentGenerator title="Boxing Calories Calculator" description="Estimate calories burned during boxing." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Rounds" val={rounds} set={setRounds} min={1} max={20} />
          <NumInput label="Round Duration" val={roundDuration} set={setRoundDuration} min={1} max={5} suffix="min" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
          <NumInput label="Avg Heart Rate" val={hr} set={setHr} min={100} max={200} suffix="bpm" />
        </div>
      </div>} />
  )
}

// ─── 52. Dance Calories Calculator ────────────────────────────────────────────
const DANCE_STYLES: Record<string, { met: number; coord: number }> = {
  "ballet": { met: 6.8, coord: 95 }, "hip-hop": { met: 7.5, coord: 80 }, "salsa": { met: 5.5, coord: 85 },
  "contemporary": { met: 5.0, coord: 90 }, "zumba": { met: 8.0, coord: 60 }, "ballroom": { met: 4.8, coord: 88 },
  "breakdance": { met: 9.5, coord: 95 }, "jazz": { met: 6.0, coord: 82 }, "aerobic-dance": { met: 7.3, coord: 50 }
}

export function DanceCaloriesCalculator() {
  const [style, setStyle] = useState("zumba")
  const [duration, setDuration] = useState(45)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 10, 180)
    const w = clamp(weight, 30, 200)
    const ds = DANCE_STYLES[style] || DANCE_STYLES["zumba"]

    const calories = r0(ds.met * 3.5 * w / 200 * dur)
    const cvBenefit = r0(Math.min(100, ds.met * 10))
    const coordIndex = ds.coord

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${style.replace("-", " ")} — ${dur} min` },
      healthScore: r0(Math.min(100, calories / 4)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: ds.met, status: "normal" },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Cardiovascular Benefit", value: cvBenefit, unit: "/100", status: cvBenefit >= 70 ? "good" : "normal" },
        { label: "Coordination Index", value: coordIndex, unit: "/100", status: coordIndex >= 80 ? "good" : "normal" },
        { label: "Calories/Hour", value: r0(calories / dur * 60), unit: "kcal/hr", status: "normal" }
      ],
      recommendations: [
        { title: "Dance Analysis", description: `${calories} kcal from ${style.replace("-", " ")} (${ds.met} METs, ${dur} min). Dance provides cardiovascular fitness (benefit score: ${cvBenefit}/100), coordination training (${coordIndex}/100), and social connection. ${ds.met >= 7 ? "High-intensity dance — equivalent to jogging." : "Moderate intensity — sustainable and enjoyable."}`, priority: "high", category: "Assessment" },
        { title: "Coordination Benefits", description: `${style.replace("-", " ")} coordination index: ${coordIndex}/100. ${coordIndex >= 85 ? "High coordination demand improves proprioception, balance, and neural plasticity. Reduces fall risk in older adults by 30-40%." : "Moderate coordination challenge — builds basic rhythm and motor skills."}`, priority: "medium", category: "Benefits" },
        { title: "Injury Prevention", description: `Dance-specific risks: ankle sprains (turns/pivots), shin splints (jumping), and hip flexor strain. Proper footwear, warm-up, and gradual progression reduce injury risk. ${ds.met >= 8 ? "High-intensity — 3-4 sessions/week max." : "Can perform 4-5 sessions/week safely."}`, priority: "medium", category: "Clinical" }
      ],
      detailedBreakdown: { "Style": style.replace("-", " "), "Duration": `${dur} min`, "MET": ds.met, "Calories": calories, "CV Benefit": `${cvBenefit}/100`, "Coordination": `${coordIndex}/100` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="dance-calories-calculator" title="Dance Calories Calculator"
      description="Calculate calories burned dancing with cardiovascular benefit score and coordination index by dance style."
      icon={Activity} calculate={calculate} onClear={() => { setStyle("zumba"); setDuration(45); setWeight(70); setResult(null) }}
      values={[style, duration, weight]} result={result}
      seoContent={<SeoContentGenerator title="Dance Calories Calculator" description="Calculate calories burned while dancing." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Dance Style" val={style} set={setStyle} options={Object.keys(DANCE_STYLES).map(k => ({ value: k, label: k.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()) }))} />
        <NumInput label="Duration" val={duration} set={setDuration} min={10} max={180} suffix="minutes" />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 53. Rock Climbing Calories ───────────────────────────────────────────────
export function RockClimbingCaloriesCalculator() {
  const [duration, setDuration] = useState(60)
  const [grade, setGrade] = useState("moderate")
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 10, 300)
    const w = clamp(weight, 30, 150)

    const metMap: Record<string, number> = { "easy": 5.8, "moderate": 8.0, "hard": 10.0, "extreme": 12.5 }
    const met = metMap[grade] || 8.0
    const calories = r0(met * 3.5 * w / 200 * dur)

    // Forearm fatigue score
    const forearmFatigue = r0(Math.min(100, dur * (met / 8) * 1.2))
    // Tendon injury risk
    const tendonRisk = grade === "extreme" && dur > 90 ? "High" : grade === "hard" && dur > 60 || grade === "extreme" ? "Moderate" : "Low"
    const tendonProb = tendonRisk === "High" ? r0(25) : tendonRisk === "Moderate" ? r0(12) : r0(4)

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${grade} grade — ${dur} min` },
      healthScore: r0(Math.min(100, calories / 5)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Difficulty", value: grade, status: "normal" },
        { label: "Forearm Fatigue Score", value: forearmFatigue, unit: "/100", status: forearmFatigue < 60 ? "good" : forearmFatigue < 80 ? "warning" : "danger" },
        { label: "Tendon Injury Risk", value: `${tendonProb}% (${tendonRisk})`, status: tendonRisk === "Low" ? "good" : tendonRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Climbing Analysis", description: `${calories} kcal at ${grade} difficulty (${met} METs). Rock climbing is excellent for grip strength, core stability, problem-solving, and full-body fitness. ${met >= 10 ? "High-grade climbing demands elite forearm endurance and technique." : "Good moderate workout — builds strength and confidence."}`, priority: "high", category: "Assessment" },
        { title: "Tendon Protection", description: `Risk: ${tendonRisk} (${tendonProb}%). ${tendonRisk !== "Low" ? "Finger pulley injuries (A2) are the most common climbing injury. Never crimp aggressively when fatigued. Warm up gradually, limit sessions to 2-3 hours, and rest 48 hours between climbing days. Antagonist exercises (finger extensions, wrist curls) reduce injury risk." : "Low risk at current intensity. Maintain progressive loading."}`, priority: "high", category: "Clinical" },
        { title: "Forearm Management", description: `Fatigue score: ${forearmFatigue}/100. ${forearmFatigue > 70 ? "High forearm fatigue — stop when grip fails to prevent tendon overload. Rice bucket exercises and forearm rollers aid recovery." : "Manageable fatigue level. Continue with proper rest between routes."}`, priority: "medium", category: "Recovery" }
      ],
      detailedBreakdown: { "Duration": `${dur} min`, "Grade": grade, "MET": met, "Calories": calories, "Forearm Fatigue": `${forearmFatigue}/100`, "Tendon Risk": `${tendonProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="rock-climbing-calories" title="Rock Climbing Calories Calculator"
      description="Calculate calories burned rock climbing with forearm fatigue scoring and tendon injury risk assessment."
      icon={Mountain} calculate={calculate} onClear={() => { setDuration(60); setGrade("moderate"); setWeight(70); setResult(null) }}
      values={[duration, grade, weight]} result={result}
      seoContent={<SeoContentGenerator title="Rock Climbing Calories" description="Estimate calories burned rock climbing." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Duration" val={duration} set={setDuration} min={10} max={300} suffix="minutes" />
        <SelectInput label="Difficulty Grade" val={grade} set={setGrade} options={[{ value: "easy", label: "Easy (5.4-5.7)" }, { value: "moderate", label: "Moderate (5.8-5.10)" }, { value: "hard", label: "Hard (5.11-5.12)" }, { value: "extreme", label: "Extreme (5.13+)" }]} />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={150} step={0.1} suffix="kg" />
      </div>} />
  )
}

// ─── 54. Tennis Calories Calculator ───────────────────────────────────────────
export function TennisCaloriesCalculator() {
  const [duration, setDuration] = useState(60)
  const [matchType, setMatchType] = useState("singles")
  const [weight, setWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const dur = clamp(duration, 15, 300)
    const w = clamp(weight, 30, 200)

    const met = matchType === "singles" ? 8.0 : 6.0
    const calories = r0(met * 3.5 * w / 200 * dur)
    const sprintLoad = r0(matchType === "singles" ? dur * 0.35 : dur * 0.2) // active sprint minutes

    // Lateral knee stress
    const kneeStress = dur > 120 ? "High" : dur > 60 ? "Moderate" : "Low"
    const kneeProb = dur > 120 ? r0(20 + dur * 0.05) : dur > 60 ? r0(10 + dur * 0.05) : r0(5)

    const status: 'good' | 'warning' | 'danger' | 'normal' = "good"

    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status, description: `${matchType} — ${dur} min` },
      healthScore: r0(Math.min(100, calories / 5)),
      metrics: [
        { label: "Calories", value: calories, unit: "kcal", status },
        { label: "MET Value", value: met, status: "normal" },
        { label: "Match Type", value: matchType === "singles" ? "Singles" : "Doubles", status: "normal" },
        { label: "Active Sprint Load", value: sprintLoad, unit: "min", status: "normal" },
        { label: "Duration", value: dur, unit: "min", status: "normal" },
        { label: "Lateral Knee Stress", value: `${kneeProb}% (${kneeStress})`, status: kneeStress === "Low" ? "good" : kneeStress === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Tennis Analysis", description: `${calories} kcal in ${dur} min ${matchType} (${met} METs). ${matchType === "singles" ? "Singles demands 35% sprint effort — excellent for HIIT-style conditioning." : "Doubles is lower intensity but great for sustained aerobic fitness."} Tennis provides both cardiovascular and agility benefits.`, priority: "high", category: "Assessment" },
        { title: "Lateral Knee Protection", description: `Stress: ${kneeStress} (${kneeProb}%). ${kneeStress !== "Low" ? "Lateral movements stress the MCL and meniscus. Strengthen VMO and lateral hip muscles. Use proper tennis shoes with lateral support. Ice after long matches." : "Low knee stress at current duration. Maintain lateral strength exercises."} Tennis elbow risk increases with poor backhand technique.`, priority: "high", category: "Clinical" },
        { title: "Training Balance", description: `Sprint load: ${sprintLoad} active sprint minutes. ${sprintLoad > 30 ? "High sprint demand — supplement with hip flexor stretching and gluteal strengthening." : "Moderate movement demand."} Cross-train with yoga or swimming for flexibility and recovery.`, priority: "medium", category: "Training" }
      ],
      detailedBreakdown: { "Duration": `${dur} min`, "Type": matchType, "MET": met, "Calories": calories, "Sprint Load": `${sprintLoad} min`, "Knee Risk": `${kneeProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="tennis-calories-burned" title="Tennis Calories Calculator"
      description="Calculate calories burned playing tennis with sprint load analysis and lateral knee stress index."
      icon={Target} calculate={calculate} onClear={() => { setDuration(60); setMatchType("singles"); setWeight(75); setResult(null) }}
      values={[duration, matchType, weight]} result={result}
      seoContent={<SeoContentGenerator title="Tennis Calories Calculator" description="Calculate calories burned playing tennis." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Match Duration" val={duration} set={setDuration} min={15} max={300} suffix="minutes" />
        <SelectInput label="Match Type" val={matchType} set={setMatchType} options={[{ value: "singles", label: "Singles" }, { value: "doubles", label: "Doubles" }]} />
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={200} step={0.1} suffix="kg" />
      </div>} />
  )
}
