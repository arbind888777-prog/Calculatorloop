"use client"

import { useState } from "react"
import { Activity, TrendingUp, TrendingDown, Scale, Target, BarChart3, Flame, Clock, AlertCircle, Brain, Heart, Zap } from "lucide-react"
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

// ─── 27. Diet Break Planner ───────────────────────────────────────────────────
export function DietBreakPlanner() {
  const [deficit, setDeficit] = useState(500)
  const [dietWeeks, setDietWeeks] = useState(10)
  const [bodyFat, setBodyFat] = useState(20)
  const [trainingIntensity, setTrainingIntensity] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const def = clamp(deficit, 100, 1500)
    const weeks = clamp(dietWeeks, 1, 52)
    const bf = clamp(bodyFat, 5, 50)

    // Break duration: leaner + longer diet = longer break
    const breakWeeks = bf < 12 ? 2 : bf < 18 && weeks > 8 ? 2 : weeks > 12 ? 2 : 1
    const maintenanceCal = r0(def + 1800) // rough estimate current + deficit back

    // Hormonal recovery score
    const hormonalRecovery = r0(clamp(
      40 + breakWeeks * 20 - (weeks > 12 ? 10 : 0) + (bf < 15 ? -10 : 0) + (trainingIntensity === "heavy" ? 5 : 0),
      10, 95
    ))

    // Leptin restoration
    const leptinRestore = r0(clamp(
      30 + breakWeeks * 25 - bf * 0.5 + (weeks > 8 ? 10 : 0),
      15, 90
    ))

    // Fat loss continuation forecast
    const fatLossForecast = weeks < 8 ? "High — diet still fresh" : weeks < 16 ? "Moderate — break will help" : "Low without break — high with break"

    // Risk classification
    const fatigue = weeks * 3 + (def > 750 ? 15 : 0) + (bf < 15 ? 10 : 0) + (trainingIntensity === "heavy" ? 8 : 0)
    const riskColor = fatigue > 50 ? "Red" : fatigue > 30 ? "Yellow" : "Green"
    const riskLabel = riskColor === "Red" ? "Diet break recommended NOW" : riskColor === "Yellow" ? "Diet fatigue building — plan break soon" : "Diet sustainable — continue"
    const status: 'good' | 'warning' | 'danger' = riskColor === "Green" ? "good" : riskColor === "Yellow" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Diet Break Recommendation", value: `${breakWeeks}-week break`, status, description: `${riskLabel} — Eat at ~${maintenanceCal} kcal/day during break` },
      healthScore: hormonalRecovery,
      metrics: [
        { label: "Break Duration", value: breakWeeks, unit: "weeks", status: "good" },
        { label: "Maintenance Calories", value: maintenanceCal, unit: "kcal/day", status: "good" },
        { label: "Diet Duration", value: weeks, unit: "weeks", status: weeks > 12 ? "danger" : weeks > 8 ? "warning" : "good" },
        { label: "Current Deficit", value: def, unit: "kcal/day", status: def > 750 ? "danger" : def > 500 ? "warning" : "good" },
        { label: "Hormonal Recovery", value: hormonalRecovery, unit: "%", status: hormonalRecovery > 60 ? "good" : hormonalRecovery > 35 ? "warning" : "danger" },
        { label: "Leptin Restoration", value: leptinRestore, unit: "%", status: leptinRestore > 60 ? "good" : leptinRestore > 35 ? "warning" : "danger" },
        { label: "Fat Loss Forecast", value: fatLossForecast, status: fatLossForecast.startsWith("High") ? "good" : fatLossForecast.startsWith("Moderate") ? "warning" : "danger" },
        { label: "Diet Fatigue Risk", value: riskColor, status }
      ],
      recommendations: [
        { title: "Diet Break Schedule", description: `Take a ${breakWeeks}-week break at ~${maintenanceCal} kcal/day. During break: maintain protein at 1.6-2g/kg, increase carbs (primary fuel), keep fat moderate. Continue training normally — don't reduce intensity. Expect 1-2 kg weight gain from glycogen/water (not fat).`, priority: "high", category: "Schedule" },
        { title: "Hormonal Recovery", description: `Recovery estimate: ${hormonalRecovery}%. Leptin restoration: ${leptinRestore}%. Diet breaks restore leptin (satiety), thyroid (T3), testosterone, and reduce cortisol. Research (MATADOR study): intermittent dieting (2 weeks on / 2 weeks off) produced 50% more fat loss than continuous dieting.`, priority: "high", category: "Hormones" },
        { title: "Post-Break Strategy", description: `${riskColor === "Red" ? "Take break immediately. Resume deficit at -400 kcal (not previous deficit) to prevent rapid re-adaptation." : riskColor === "Yellow" ? "Schedule break within 2-3 weeks. Your metabolism is slowing." : "Diet still sustainable. Plan a break after 12 total weeks for best results."} After break, fat loss typically accelerates for 4-6 weeks.`, priority: "high", category: "Strategy" }
      ],
      detailedBreakdown: { "Break": `${breakWeeks} weeks`, "Maintenance": `${maintenanceCal} kcal`, "Hormonal": `${hormonalRecovery}%`, "Leptin": `${leptinRestore}%`, "Risk": riskColor, "Diet Weeks": weeks }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="diet-break-planner" title="Diet Break Planner"
      description="Plan metabolic recovery breaks during extended dieting. Schedules maintenance calorie periods to restore hormones and prevent plateau."
      icon={Clock} calculate={calculate} onClear={() => { setDeficit(500); setDietWeeks(10); setBodyFat(20); setTrainingIntensity("moderate"); setResult(null) }}
      values={[deficit, dietWeeks, bodyFat, trainingIntensity]} result={result}
      seoContent={<SeoContentGenerator title="Diet Break Planner" description="Plan strategic diet breaks for metabolic recovery." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Calorie Deficit" val={deficit} set={setDeficit} min={100} max={1500} suffix="kcal/day" />
          <NumInput label="Weeks on Diet" val={dietWeeks} set={setDietWeeks} min={1} max={52} suffix="weeks" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Fat" val={bodyFat} set={setBodyFat} min={5} max={50} step={0.5} suffix="%" />
          <SelectInput label="Training Intensity" val={trainingIntensity} set={setTrainingIntensity} options={[{ value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "heavy", label: "Heavy" }]} />
        </div>
      </div>} />
  )
}

// ─── 28. Reverse Diet Calculator ──────────────────────────────────────────────
export function ReverseDietCalculator() {
  const [currentCal, setCurrentCal] = useState(1500)
  const [prevMaint, setPrevMaint] = useState(2300)
  const [bodyWeight, setBodyWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const curr = clamp(currentCal, 800, 4000)
    const prev = clamp(prevMaint, 1200, 5000)
    const bw = clamp(bodyWeight, 30, 200)

    const gap = prev - curr
    const weeklyIncrease = gap > 600 ? 100 : gap > 300 ? 75 : 50
    const weeksToMaint = r0(gap / weeklyIncrease)
    const newMaint = r0(prev - gap * 0.1) // new maintenance slightly lower due to adaptation

    // Fat regain probability
    const fatRegainProb = r0(clamp(
      15 + (weeklyIncrease > 100 ? 20 : 0) + (curr < 1200 ? 15 : 0) - (weeksToMaint > 8 ? 10 : 0),
      5, 60
    ))

    // Weekly progression
    const progression = Array.from({ length: Math.min(weeksToMaint, 12) }, (_, i) => ({
      week: i + 1,
      calories: r0(curr + weeklyIncrease * (i + 1))
    }))

    const status: 'good' | 'warning' | 'danger' = "good"

    setResult({
      primaryMetric: { label: "Reverse Diet Plan", value: `+${weeklyIncrease} kcal/week`, status, description: `${curr} → ~${newMaint} kcal over ${weeksToMaint} weeks` },
      healthScore: r0(clamp(85 - fatRegainProb, 20, 95)),
      metrics: [
        { label: "Current Intake", value: curr, unit: "kcal", status: curr > 1200 ? "good" : "danger" },
        { label: "Previous Maintenance", value: prev, unit: "kcal", status: "normal" },
        { label: "Calorie Gap", value: gap, unit: "kcal", status: gap > 600 ? "warning" : "good" },
        { label: "Weekly Increase", value: weeklyIncrease, unit: "kcal/week", status: "good" },
        { label: "Weeks to Maintenance", value: weeksToMaint, unit: "weeks", status: "normal" },
        { label: "New Est. Maintenance", value: newMaint, unit: "kcal", status: "good" },
        { label: "Fat Regain Risk", value: fatRegainProb, unit: "%", status: fatRegainProb < 20 ? "good" : fatRegainProb < 40 ? "warning" : "danger" },
        { label: "Body Weight", value: bw, unit: "kg", status: "normal" }
      ],
      recommendations: [
        { title: "Reverse Diet Protocol", description: `Increase by ${weeklyIncrease} kcal/week: ${curr} → ${r0(curr + weeklyIncrease)} → ${r0(curr + weeklyIncrease * 2)} → ... → ~${newMaint} kcal. Add mostly carbs (fuel training, fill glycogen). Keep protein at ${r0(bw * 2)}g/day. Expect 1-3 kg weight gain (glycogen + water, not fat).`, priority: "high", category: "Protocol" },
        { title: "Fat Regain Prevention", description: `Risk: ${fatRegainProb}%. Prevent regain: 1) Slow increases (${weeklyIncrease} kcal max). 2) Monitor weight — accept 0.2-0.3 kg/week gain (water). 3) Maintain or increase training volume. 4) If gain exceeds 0.5 kg/week, hold calories for 1 week before continuing. 5) Don't jump straight to previous maintenance.`, priority: "high", category: "Prevention" },
        { title: "Metabolic Benefit", description: `Reverse dieting restores metabolic rate over ${weeksToMaint} weeks. Your new maintenance (~${newMaint} kcal) may be slightly lower than pre-diet (${prev}). This builds a higher caloric baseline for future cuts — meaning more food at maintenance and bigger deficit possible next time.`, priority: "medium", category: "Science" }
      ],
      detailedBreakdown: { "Current": `${curr} kcal`, "Target": `${newMaint} kcal`, "Increase": `+${weeklyIncrease}/wk`, "Duration": `${weeksToMaint} wks`, "Regain Risk": `${fatRegainProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="reverse-diet-calculator" title="Reverse Diet Calculator"
      description="Plan gradual calorie increases after dieting to restore metabolism without excessive fat regain."
      icon={TrendingUp} calculate={calculate} onClear={() => { setCurrentCal(1500); setPrevMaint(2300); setBodyWeight(70); setResult(null) }}
      values={[currentCal, prevMaint, bodyWeight]} result={result}
      seoContent={<SeoContentGenerator title="Reverse Diet Calculator" description="Plan post-diet reverse dieting for metabolic recovery." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Current Daily Calories" val={currentCal} set={setCurrentCal} min={800} max={4000} suffix="kcal" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Previous Maintenance" val={prevMaint} set={setPrevMaint} min={1200} max={5000} suffix="kcal" />
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={30} max={200} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 29. Adaptive Thermogenesis Estimator ─────────────────────────────────────
export function AdaptiveThermogenesisEstimator() {
  const [startWeight, setStartWeight] = useState(90)
  const [currentWeight, setCurrentWeight] = useState(78)
  const [deficitWeeks, setDeficitWeeks] = useState(12)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sw = clamp(startWeight, 40, 250)
    const cw = clamp(currentWeight, 40, 250)
    const weeks = clamp(deficitWeeks, 1, 52)
    const lost = r1(sw - cw)
    const lostPct = r1((lost / sw) * 100)

    // Predicted TDEE drop from weight loss alone (~15 kcal per kg)
    const predictedDrop = r0(lost * 15)
    // Adaptive component: 5-15% extra beyond predicted
    const adaptivePct = r1(clamp(5 + weeks * 0.4 + lostPct * 0.3, 5, 15))
    const baseTDEE = r0(cw * 30) // rough current TDEE estimate
    const adaptiveDrop = r0(baseTDEE * adaptivePct / 100)
    const adjustedTDEE = r0(baseTDEE - adaptiveDrop)
    const totalReduction = r0(predictedDrop + adaptiveDrop)

    const plateauProb = r0(clamp(adaptivePct * 5 + (weeks > 12 ? 15 : 0) + (lostPct > 10 ? 10 : 0), 10, 85))

    const status: 'good' | 'warning' | 'danger' = adaptivePct < 8 ? "good" : adaptivePct < 12 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Metabolic Slowdown", value: `${adaptivePct}%`, status, description: `TDEE reduced ~${totalReduction} kcal total (${predictedDrop} from weight loss + ${adaptiveDrop} adaptive)` },
      healthScore: Math.max(15, r0(100 - adaptivePct * 6)),
      metrics: [
        { label: "Weight Lost", value: lost, unit: "kg", status: "good" },
        { label: "Loss %", value: lostPct, unit: "%", status: lostPct > 15 ? "danger" : "good" },
        { label: "Predicted TDEE Drop", value: predictedDrop, unit: "kcal", status: "normal" },
        { label: "Adaptive Reduction", value: `${adaptivePct}%`, status },
        { label: "Adaptive Drop", value: adaptiveDrop, unit: "kcal", status: adaptiveDrop > 200 ? "danger" : adaptiveDrop > 100 ? "warning" : "good" },
        { label: "Adjusted TDEE", value: adjustedTDEE, unit: "kcal", status: "normal" },
        { label: "Total Reduction", value: totalReduction, unit: "kcal", status: totalReduction > 400 ? "danger" : totalReduction > 200 ? "warning" : "good" },
        { label: "Plateau Probability", value: plateauProb, unit: "%", status: plateauProb < 30 ? "good" : plateauProb < 55 ? "warning" : "danger" },
        { label: "Diet Duration", value: weeks, unit: "weeks", status: weeks > 16 ? "danger" : weeks > 10 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Adaptive Thermogenesis", description: `Your metabolism has slowed ~${adaptivePct}% beyond what weight loss predicts. This is your body becoming more efficient — reducing NEAT, thyroid output, fidgeting, and muscle efficiency. Total TDEE reduction: ~${totalReduction} kcal (${predictedDrop} from less mass + ${adaptiveDrop} adaptive).`, priority: "high", category: "Science" },
        { title: "Adjusted TDEE", description: `Your estimated TDEE is now ~${adjustedTDEE} kcal (not ${baseTDEE} as standard formulas suggest). Eating at ${baseTDEE} would be a surplus. ${plateauProb > 50 ? "HIGH plateau risk — consider diet break or reverse diet." : "Account for this when setting deficit targets."}`, priority: "high", category: "Application" },
        { title: "Countermeasures", description: `Plateau probability: ${plateauProb}%. Strategies: 1) Diet breaks (2 weeks at maintenance every 8-12 weeks). 2) Increase NEAT (10,000+ steps). 3) High protein (preserves muscle, higher TEF). 4) Resistance training (maintains metabolic tissue). 5) Refeed days (boost leptin). ${weeks > 16 ? "URGENT: Extended dieting — reverse diet recommended." : ""}`, priority: "medium", category: "Solutions" }
      ],
      detailedBreakdown: { "Lost": `${lost} kg`, "Adaptive": `${adaptivePct}%`, "Predicted Drop": predictedDrop, "Adaptive Drop": adaptiveDrop, "Adjusted TDEE": adjustedTDEE, "Plateau": `${plateauProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="adaptive-thermogenesis" title="Adaptive Thermogenesis Estimator"
      description="Estimate metabolic slowdown during dieting. Calculates adaptive TDEE reduction, adjusted maintenance, and plateau probability."
      icon={Flame} calculate={calculate} onClear={() => { setStartWeight(90); setCurrentWeight(78); setDeficitWeeks(12); setResult(null) }}
      values={[startWeight, currentWeight, deficitWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Adaptive Thermogenesis Estimator" description="Estimate metabolic adaptation and adjusted TDEE during dieting." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Weight" val={startWeight} set={setStartWeight} min={40} max={250} step={0.5} suffix="kg" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={40} max={250} step={0.5} suffix="kg" />
        </div>
        <NumInput label="Deficit Duration" val={deficitWeeks} set={setDeficitWeeks} min={1} max={52} suffix="weeks" />
      </div>} />
  )
}

// ─── 32. Adaptive TDEE Calculator ─────────────────────────────────────────────
export function AdaptiveTDEECalculator() {
  const [weight, setWeight] = useState(75)
  const [activityLevel, setActivityLevel] = useState("moderate")
  const [dietWeeks, setDietWeeks] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 200)
    const weeks = clamp(dietWeeks, 0, 52)

    const multiplier = activityLevel === "sedentary" ? 1.2 : activityLevel === "light" ? 1.375 : activityLevel === "moderate" ? 1.55 : activityLevel === "active" ? 1.725 : 1.9
    const baseTDEE = r0(w * 22 * multiplier) // simplified BMR × activity
    const adaptReduction = r1(clamp(weeks * 0.5, 0, 15))
    const adaptedTDEE = r0(baseTDEE * (1 - adaptReduction / 100))

    const cutCal = r0(adaptedTDEE - 500)
    const mildCut = r0(adaptedTDEE - 250)
    const plateauDetect = weeks > 10 && adaptReduction > 5 ? "Likely plateau zone" : weeks > 6 ? "Approaching plateau zone" : "No plateau risk"

    const status: 'good' | 'warning' | 'danger' = adaptReduction < 5 ? "good" : adaptReduction < 10 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Adapted TDEE", value: `${adaptedTDEE} kcal`, status, description: `Base: ${baseTDEE} kcal — ${adaptReduction}% metabolic adaptation after ${weeks} weeks` },
      healthScore: Math.max(20, r0(95 - adaptReduction * 5)),
      metrics: [
        { label: "Base TDEE", value: baseTDEE, unit: "kcal", status: "normal" },
        { label: "Adapted TDEE", value: adaptedTDEE, unit: "kcal", status },
        { label: "Adaptation", value: adaptReduction, unit: "%", status },
        { label: "Moderate Deficit", value: mildCut, unit: "kcal", status: mildCut > 1200 ? "good" : "warning" },
        { label: "Aggressive Deficit", value: cutCal, unit: "kcal", status: cutCal > 1200 ? "good" : "danger" },
        { label: "Diet Duration", value: weeks, unit: "weeks", status: weeks > 12 ? "danger" : weeks > 8 ? "warning" : "good" },
        { label: "Plateau Detection", value: plateauDetect, status: plateauDetect.includes("Likely") ? "danger" : plateauDetect.includes("Approaching") ? "warning" : "good" },
        { label: "Activity Level", value: activityLevel, status: "normal" }
      ],
      recommendations: [
        { title: "Adaptive TDEE", description: `Your dynamically adjusted TDEE: ${adaptedTDEE} kcal/day (base ${baseTDEE} minus ${adaptReduction}% adaptation from ${weeks} weeks of dieting). Standard TDEE calculators don't account for this adaptation — they'd overestimate by ~${baseTDEE - adaptedTDEE} kcal.`, priority: "high", category: "Calculation" },
        { title: "Calorie Targets", description: `Moderate cut: ${mildCut} kcal (−250). Aggressive cut: ${cutCal} kcal (−500). ${cutCal < 1200 ? "WARNING: Aggressive deficit puts you below 1200 kcal — use moderate deficit instead." : "Both targets are safe."} For fat loss: −250 to −500 from adapted TDEE, not base TDEE.`, priority: "high", category: "Targets" },
        { title: "Plateau Management", description: `${plateauDetect}. ${weeks > 10 ? "Consider: 1) Diet break (2 wks at maintenance). 2) Reverse diet  (+50-100 kcal/week). 3) Increase NEAT/training. 4) Refeed days." : "Continue current approach — adaptation is minimal."}`, priority: "medium", category: "Strategy" }
      ],
      detailedBreakdown: { "Base": baseTDEE, "Adapted": adaptedTDEE, "Adapt%": adaptReduction, "Mod Cut": mildCut, "Agg Cut": cutCal, "Weeks": weeks }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="adaptive-tdee-calculator" title="Adaptive TDEE Calculator"
      description="Calculate dynamically adjusted TDEE accounting for metabolic adaptation during dieting. Includes plateau detection."
      icon={Activity} calculate={calculate} onClear={() => { setWeight(75); setActivityLevel("moderate"); setDietWeeks(8); setResult(null) }}
      values={[weight, activityLevel, dietWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Adaptive TDEE Calculator" description="Calculate metabolic-adaptation-adjusted TDEE." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
          <NumInput label="Weeks on Diet" val={dietWeeks} set={setDietWeeks} min={0} max={52} suffix="weeks" />
        </div>
        <SelectInput label="Activity Level" val={activityLevel} set={setActivityLevel} options={[{ value: "sedentary", label: "Sedentary (desk job)" }, { value: "light", label: "Light (1-3 days/wk)" }, { value: "moderate", label: "Moderate (3-5 days/wk)" }, { value: "active", label: "Active (6-7 days/wk)" }, { value: "very-active", label: "Very Active (athlete)" }]} />
      </div>} />
  )
}

// ─── 33. Muscle Gain Predictor ────────────────────────────────────────────────
export function MuscleGainPredictor() {
  const [experience, setExperience] = useState("beginner")
  const [protein, setProtein] = useState(120)
  const [trainingFreq, setTrainingFreq] = useState(4)
  const [bodyFat, setBodyFat] = useState(18)
  const [bodyWeight, setBodyWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pro = clamp(protein, 40, 300)
    const freq = clamp(trainingFreq, 1, 7)
    const bf = clamp(bodyFat, 5, 40)
    const bw = clamp(bodyWeight, 40, 150)

    // Monthly gain: % of BW
    const baseRate = experience === "beginner" ? 1.25 : experience === "intermediate" ? 0.75 : experience === "advanced" ? 0.375 : 0.15
    const proteinPerKg = r1(pro / bw)
    const proteinMod = proteinPerKg >= 1.6 ? 1.0 : proteinPerKg >= 1.2 ? 0.85 : 0.7
    const freqMod = freq >= 4 ? 1.0 : freq >= 3 ? 0.9 : 0.75
    const bfMod = bf < 15 ? 1.0 : bf < 22 ? 0.95 : bf < 30 ? 0.85 : 0.7

    const monthlyGainPct = r2(baseRate * proteinMod * freqMod * bfMod)
    const monthlyGainKg = r2(bw * monthlyGainPct / 100)
    const yearlyGainKg = r1(monthlyGainKg * 12)
    const leanMass = r1(bw * (1 - bf / 100))
    const projectedLeanMass = r1(leanMass + yearlyGainKg)

    const status: 'good' | 'warning' | 'danger' = "good"

    setResult({
      primaryMetric: { label: "Monthly Muscle Gain", value: `${monthlyGainKg} kg`, status, description: `${experience} — ~${monthlyGainPct}% of body weight per month` },
      healthScore: r0(clamp(monthlyGainPct * 60, 20, 95)),
      metrics: [
        { label: "Monthly Gain", value: monthlyGainKg, unit: "kg", status: "good" },
        { label: "Monthly Rate", value: monthlyGainPct, unit: "% BW", status: "good" },
        { label: "Yearly Projection", value: yearlyGainKg, unit: "kg", status: "good" },
        { label: "Experience Level", value: experience, status: "normal" },
        { label: "Protein/kg", value: proteinPerKg, unit: "g/kg", status: proteinPerKg >= 1.6 ? "good" : proteinPerKg >= 1.2 ? "warning" : "danger" },
        { label: "Training Freq", value: freq, unit: "days/wk", status: freq >= 4 ? "good" : freq >= 3 ? "warning" : "danger" },
        { label: "Current Lean Mass", value: leanMass, unit: "kg", status: "normal" },
        { label: "Projected Lean Mass", value: projectedLeanMass, unit: "kg (1yr)", status: "good" },
        { label: "Body Fat", value: bf, unit: "%", status: bf < 22 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Muscle Gain Potential", description: `${experience}: ~${monthlyGainKg} kg/month (${monthlyGainPct}% BW). Yearly: ~${yearlyGainKg} kg. Natural limits (McDonald model): Beginner ~9 kg/yr, Intermediate ~4.5 kg/yr, Advanced ~2.3 kg/yr, Elite ~1 kg/yr. Your training ×${freq}/week, protein ${proteinPerKg}g/kg.`, priority: "high", category: "Potential" },
        { title: "Optimization", description: `${proteinPerKg < 1.6 ? "INCREASE PROTEIN to 1.6-2.2 g/kg (currently " + proteinPerKg + " g/kg). This alone could boost gains 15-30%." : "Protein intake optimal."} ${freq < 4 ? "Add training days — hitting each muscle 2×/week is optimal." : "Training frequency good."} ${bf > 25 ? "Consider cutting to <20% BF first — nutrient partitioning improves at lower body fat." : ""}`, priority: "high", category: "Optimize" },
        { title: "Lean Mass Forecast", description: `Current lean mass: ${leanMass} kg. In 12 months: ~${projectedLeanMass} kg (+${yearlyGainKg} kg). For fastest gains: caloric surplus of 200-350 kcal, progressive overload, 7-9 hours sleep, manage stress. Muscle gain slows dramatically with training age — maximize your newbie gains.`, priority: "medium", category: "Forecast" }
      ],
      detailedBreakdown: { "Monthly": `${monthlyGainKg} kg`, "Rate": `${monthlyGainPct}%`, "Yearly": `${yearlyGainKg} kg`, "Protein/kg": proteinPerKg, "Lean Mass": leanMass, "Projected": projectedLeanMass }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="muscle-gain-predictor" title="Muscle Gain Predictor"
      description="Predict monthly muscle gain potential based on training experience, nutrition, and body composition."
      icon={TrendingUp} calculate={calculate} onClear={() => { setExperience("beginner"); setProtein(120); setTrainingFreq(4); setBodyFat(18); setBodyWeight(75); setResult(null) }}
      values={[experience, protein, trainingFreq, bodyFat, bodyWeight]} result={result}
      seoContent={<SeoContentGenerator title="Muscle Gain Predictor" description="Predict monthly muscle gain potential based on training and nutrition." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Training Experience" val={experience} set={setExperience} options={[{ value: "beginner", label: "Beginner (<1 yr)" }, { value: "intermediate", label: "Intermediate (1-3 yrs)" }, { value: "advanced", label: "Advanced (3-7 yrs)" }, { value: "elite", label: "Elite (7+ yrs)" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Daily Protein" val={protein} set={setProtein} min={40} max={300} suffix="grams" />
          <NumInput label="Training Frequency" val={trainingFreq} set={setTrainingFreq} min={1} max={7} suffix="days/week" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Fat" val={bodyFat} set={setBodyFat} min={5} max={40} step={0.5} suffix="%" />
          <NumInput label="Body Weight" val={bodyWeight} set={setBodyWeight} min={40} max={150} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 34. Weight Loss Rate Calculator ──────────────────────────────────────────
export function WeightLossRateCalculator() {
  const [weeklyChange, setWeeklyChange] = useState(-0.6)
  const [currentWeight, setCurrentWeight] = useState(80)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wc = clamp(weeklyChange, -5, 5)
    const cw = clamp(currentWeight, 30, 250)

    const ratePct = r2((Math.abs(wc) / cw) * 100)
    const isLosing = wc < 0

    const category = !isLosing ? "Not losing" : ratePct < 0.5 ? "Conservative" : ratePct <= 1.0 ? "Healthy" : ratePct <= 1.5 ? "Aggressive" : "Too fast"
    const muscleRisk = ratePct > 1.5 ? "High — likely losing muscle" : ratePct > 1.0 ? "Moderate — monitor strength" : "Low"

    const weeklyDeficit = r0(Math.abs(wc) * 7700)
    const dailyDeficit = r0(weeklyDeficit / 7)

    const status: 'good' | 'warning' | 'danger' = !isLosing ? "danger" : category === "Healthy" || category === "Conservative" ? "good" : category === "Aggressive" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Loss Rate", value: `${ratePct}% BW/week`, status, description: `${category}${isLosing ? ` — ${Math.abs(wc)} kg/week` : " — gaining or maintaining"}` },
      healthScore: !isLosing ? 30 : category === "Healthy" ? 90 : category === "Conservative" ? 80 : category === "Aggressive" ? 55 : 25,
      metrics: [
        { label: "Weekly Change", value: wc, unit: "kg", status: isLosing ? "good" : "danger" },
        { label: "Rate", value: ratePct, unit: "% BW/wk", status },
        { label: "Category", value: category, status },
        { label: "Current Weight", value: cw, unit: "kg", status: "normal" },
        { label: "Weekly Deficit", value: isLosing ? weeklyDeficit : 0, unit: "kcal", status: "normal" },
        { label: "Daily Deficit", value: isLosing ? dailyDeficit : 0, unit: "kcal", status: dailyDeficit > 1000 ? "danger" : "good" },
        { label: "Muscle Loss Risk", value: muscleRisk, status: muscleRisk.startsWith("High") ? "danger" : muscleRisk.startsWith("Moderate") ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Loss Rate Assessment", description: `${ratePct}% BW/week (${category}). Healthy range: 0.5-1% of body weight per week. At ${cw} kg, that's ${r1(cw * 0.005)}-${r1(cw * 0.01)} kg/week. Your rate: ${Math.abs(wc)} kg/week. ${ratePct > 1.5 ? "TOO FAST — high risk of muscle loss, metabolic crash, nutrient deficiency, and hormonal disruption." : ratePct > 1.0 ? "Slightly aggressive — acceptable short-term but not sustainable." : "Good pace."}`, priority: "high", category: "Assessment" },
        { title: "Muscle Preservation", description: `Risk: ${muscleRisk}. ${ratePct > 1.0 ? "Slow down: reduce deficit by 250 kcal. Prioritize: protein 2g/kg, resistance training 3-4×/week, 7-8 hrs sleep. Faster loss = more muscle loss. Studies show >1% BW/week doubles muscle loss compared to 0.5-0.7%." : "Current rate preserves muscle well. Keep protein high and train hard."}`, priority: "high", category: "Muscle" },
        { title: "Implied Deficit", description: `Losing ${Math.abs(wc)} kg/week ≈ ${weeklyDeficit} kcal weekly deficit (${dailyDeficit} kcal/day). ${dailyDeficit > 1000 ? "Deficit >1000 kcal/day is aggressive. Risk: fatigue, poor performance, hormonal disruption, binge eating. Reduce to 500-750 kcal/day." : "Deficit is manageable. Monitor energy and performance."}`, priority: "medium", category: "Deficit" }
      ],
      detailedBreakdown: { "Change": `${wc} kg/wk`, "Rate": `${ratePct}%`, "Category": category, "Deficit/day": dailyDeficit, "Muscle Risk": muscleRisk }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-loss-rate" title="Weight Loss Rate Calculator"
      description="Evaluate if your weight loss speed is healthy. Checks muscle loss risk and implied calorie deficit."
      icon={TrendingDown} calculate={calculate} onClear={() => { setWeeklyChange(-0.6); setCurrentWeight(80); setResult(null) }}
      values={[weeklyChange, currentWeight]} result={result}
      seoContent={<SeoContentGenerator title="Weight Loss Rate Calculator" description="Evaluate your weight loss rate and muscle preservation risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weekly Weight Change" val={weeklyChange} set={setWeeklyChange} min={-5} max={5} step={0.1} suffix="kg/week" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={250} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 35. Calorie Banking Calculator ───────────────────────────────────────────
export function CalorieBankingCalculator() {
  const [dailyTarget, setDailyTarget] = useState(1800)
  const [bankDays, setBankDays] = useState(5)
  const [reductionPerDay, setReductionPerDay] = useState(150)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const target = clamp(dailyTarget, 1000, 4000)
    const days = clamp(bankDays, 1, 6)
    const reduction = clamp(reductionPerDay, 50, 500)

    const bankedCal = r0(reduction * days)
    const bankDayCal = r0(target - reduction)
    const weekendAllowance = r0(target + bankedCal / (7 - days))
    const weekendDays = 7 - days
    const weeklyTotal = r0(bankDayCal * days + weekendAllowance * weekendDays)
    const weeklyAvg = r0(weeklyTotal / 7)

    const sustainable = bankDayCal >= 1200
    const status: 'good' | 'warning' | 'danger' = sustainable && reduction <= 250 ? "good" : sustainable ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Weekend Allowance", value: `${weekendAllowance} kcal/day`, status, description: `Bank ${bankedCal} kcal over ${days} days → extra ${r0(bankedCal / weekendDays)} kcal per weekend day` },
      healthScore: sustainable ? 80 : 40,
      metrics: [
        { label: "Bank Days", value: `${bankDayCal} kcal × ${days}`, status: bankDayCal >= 1200 ? "good" : "danger" },
        { label: "Banked Total", value: bankedCal, unit: "kcal", status: "good" },
        { label: "Weekend Days", value: `${weekendAllowance} kcal × ${weekendDays}`, status: "good" },
        { label: "Weekly Total", value: weeklyTotal, unit: "kcal", status: "normal" },
        { label: "Weekly Average", value: weeklyAvg, unit: "kcal/day", status: "normal" },
        { label: "Reduction/Day", value: reduction, unit: "kcal", status: reduction <= 200 ? "good" : reduction <= 350 ? "warning" : "danger" },
        { label: "Sustainable", value: sustainable ? "Yes" : "No — too low on bank days", status: sustainable ? "good" : "danger" }
      ],
      recommendations: [
        { title: "Calorie Banking Plan", description: `Eat ${bankDayCal} kcal on ${days} weekdays (−${reduction}/day). Save ${bankedCal} kcal total. Spend ${r0(bankedCal / weekendDays)} extra per weekend day = ${weekendAllowance} kcal/day. Weekly average stays at ${weeklyAvg} kcal — same weekly deficit, more flexibility.`, priority: "high", category: "Plan" },
        { title: "Implementation", description: `${!sustainable ? "WARNING: Bank day calories (" + bankDayCal + ") are below 1200. Reduce the daily reduction or bank fewer days." : "Plan is sustainable."} Tips: cut carbs/fat slightly on bank days, not protein. Skip one snack or reduce portion sizes. Don't skip meals — leads to overeating.`, priority: "high", category: "How-To" },
        { title: "Weekend Strategy", description: `Budget: ${weekendAllowance} kcal per weekend day. Tip: allocate this to one special meal rather than spreading thin. Example: save 400 kcal for a restaurant dinner or social event. This approach dramatically improves diet adherence — sustainability > perfection.`, priority: "medium", category: "Application" }
      ],
      detailedBreakdown: { "Bank Day": `${bankDayCal} kcal`, "Saved": `${bankedCal} kcal`, "Weekend": `${weekendAllowance} kcal`, "Avg": `${weeklyAvg} kcal`, "Total": weeklyTotal }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="calorie-banking" title="Calorie Banking Calculator"
      description="Save calories during weekdays to spend on weekends or events. Maintains weekly calorie budget with flexible daily targets."
      icon={BarChart3} calculate={calculate} onClear={() => { setDailyTarget(1800); setBankDays(5); setReductionPerDay(150); setResult(null) }}
      values={[dailyTarget, bankDays, reductionPerDay]} result={result}
      seoContent={<SeoContentGenerator title="Calorie Banking Calculator" description="Bank calories for weekends and events while maintaining deficit." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Daily Calorie Target" val={dailyTarget} set={setDailyTarget} min={1000} max={4000} suffix="kcal" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Days to Bank" val={bankDays} set={setBankDays} min={1} max={6} suffix="days" />
          <NumInput label="Reduction per Day" val={reductionPerDay} set={setReductionPerDay} min={50} max={500} suffix="kcal" />
        </div>
      </div>} />
  )
}

// ─── 36. Diet Adherence Score ─────────────────────────────────────────────────
export function DietAdherenceCalculator() {
  const [plannedCal, setPlannedCal] = useState(1800)
  const [actualCal, setActualCal] = useState(1950)
  const [daysOnPlan, setDaysOnPlan] = useState(5)
  const [totalDays, setTotalDays] = useState(7)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const planned = clamp(plannedCal, 800, 5000)
    const actual = clamp(actualCal, 800, 8000)
    const onPlan = clamp(daysOnPlan, 0, 7)
    const total = clamp(totalDays, 1, 7)

    const calDev = r0(actual - planned)
    const calDevPct = r1(Math.abs(calDev) / planned * 100)
    const dayAdherence = r0((onPlan / total) * 100)

    // Combined score
    const calScore = clamp(100 - calDevPct * 3, 0, 100)
    const dayScore = dayAdherence
    const adherenceScore = r0((calScore * 0.6 + dayScore * 0.4))

    const successProb = r0(clamp(adherenceScore * 0.9 + (onPlan >= 6 ? 10 : 0), 10, 95))
    const label = adherenceScore > 85 ? "Excellent" : adherenceScore > 70 ? "Good" : adherenceScore > 50 ? "Needs Work" : "Poor"
    const status: 'good' | 'warning' | 'danger' = adherenceScore > 75 ? "good" : adherenceScore > 50 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Diet Adherence Score", value: `${adherenceScore}/100`, status, description: `${label} — ${onPlan}/${total} days on plan, ${calDev > 0 ? "+" : ""}${calDev} kcal avg deviation` },
      healthScore: adherenceScore,
      metrics: [
        { label: "Adherence Score", value: adherenceScore, unit: "/100", status },
        { label: "Calorie Deviation", value: `${calDev > 0 ? "+" : ""}${calDev}`, unit: "kcal", status: Math.abs(calDev) < 100 ? "good" : Math.abs(calDev) < 250 ? "warning" : "danger" },
        { label: "Deviation %", value: calDevPct, unit: "%", status: calDevPct < 5 ? "good" : calDevPct < 10 ? "warning" : "danger" },
        { label: "Days On Plan", value: `${onPlan}/${total}`, status: onPlan >= 6 ? "good" : onPlan >= 4 ? "warning" : "danger" },
        { label: "Day Adherence", value: dayAdherence, unit: "%", status: dayAdherence > 80 ? "good" : dayAdherence > 60 ? "warning" : "danger" },
        { label: "Success Probability", value: successProb, unit: "%", status: successProb > 70 ? "good" : successProb > 45 ? "warning" : "danger" },
        { label: "Rating", value: label, status }
      ],
      recommendations: [
        { title: "Adherence Assessment", description: `Score: ${adherenceScore}/100 (${label}). Calorie adherence: ${r0(calScore)}% (avg deviation ${calDev > 0 ? "+" : ""}${calDev} kcal). Day adherence: ${dayAdherence}% (${onPlan}/${total} days). Research: >80% adherence = successful long-term results. <60% adherence = minimal progress.`, priority: "high", category: "Assessment" },
        { title: "Improvement Strategy", description: `${calDevPct > 10 ? "Calorie tracking accuracy: weigh food, measure oils/sauces, log EVERYTHING including nibbles/drinks/condiments. Hidden calories are the #1 reason for calorie deviation." : ""} ${dayAdherence < 80 ? "Day adherence low: identify what triggers off-plan days (social events? stress? weekends?). Plan ahead for those situations." : "Day adherence strong!"} Success probability: ${successProb}%.`, priority: "high", category: "Improve" },
        { title: "Adherence Psychology", description: "80/20 rule: aim for 80% adherence, not 100%. Perfect adherence leads to burnout. Allow planned flexibility (1-2 meals/week off-plan). Consistency over weeks matters more than daily perfection. Track weekly average, not daily numbers obsessively.", priority: "medium", category: "Mindset" }
      ],
      detailedBreakdown: { "Score": adherenceScore, "Cal Dev": `${calDev} kcal`, "Days": `${onPlan}/${total}`, "Success": `${successProb}%`, "Rating": label }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="diet-adherence" title="Diet Adherence Score"
      description="Measure diet plan consistency. Scores calorie accuracy and daily adherence to predict long-term success."
      icon={Target} calculate={calculate} onClear={() => { setPlannedCal(1800); setActualCal(1950); setDaysOnPlan(5); setTotalDays(7); setResult(null) }}
      values={[plannedCal, actualCal, daysOnPlan, totalDays]} result={result}
      seoContent={<SeoContentGenerator title="Diet Adherence Score" description="Measure diet plan consistency and predict success probability." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Planned Calories" val={plannedCal} set={setPlannedCal} min={800} max={5000} suffix="kcal/day" />
          <NumInput label="Actual Avg Calories" val={actualCal} set={setActualCal} min={800} max={8000} suffix="kcal/day" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Days On Plan" val={daysOnPlan} set={setDaysOnPlan} min={0} max={7} suffix="days" />
          <NumInput label="Total Days" val={totalDays} set={setTotalDays} min={1} max={7} suffix="days" />
        </div>
      </div>} />
  )
}

// ─── 37. Binge Eating Risk Calculator ─────────────────────────────────────────
export function BingeEatingRiskCalculator() {
  const [stressLevel, setStressLevel] = useState("moderate")
  const [restrictionLevel, setRestrictionLevel] = useState("moderate")
  const [emotionalTriggers, setEmotionalTriggers] = useState("some")
  const [skipMeals, setSkipMeals] = useState("rarely")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let score = 0
    // Stress
    score += stressLevel === "high" ? 25 : stressLevel === "moderate" ? 12 : 4
    // Restriction
    score += restrictionLevel === "severe" ? 30 : restrictionLevel === "moderate" ? 15 : 5
    // Emotional triggers
    score += emotionalTriggers === "frequent" ? 25 : emotionalTriggers === "some" ? 12 : 3
    // Meal skipping
    score += skipMeals === "often" ? 20 : skipMeals === "sometimes" ? 10 : 3

    score = r0(clamp(score, 5, 95))

    const emotionalLikelihood = r0(clamp(
      (stressLevel === "high" ? 30 : 10) + (emotionalTriggers === "frequent" ? 35 : emotionalTriggers === "some" ? 15 : 5),
      8, 85
    ))

    const stressCorrelation = stressLevel === "high" && emotionalTriggers === "frequent" ? "Strong" : stressLevel === "high" || emotionalTriggers === "frequent" ? "Moderate" : "Weak"

    const riskLevel = score > 60 ? "High" : score > 35 ? "Moderate" : "Low"
    const status: 'good' | 'warning' | 'danger' = riskLevel === "Low" ? "good" : riskLevel === "Moderate" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Binge Eating Risk", value: `${score}/100`, status, description: `${riskLevel} risk — ${score > 60 ? "Professional support recommended" : score > 35 ? "Implement preventive strategies" : "Low current risk"}` },
      healthScore: Math.max(10, 100 - score),
      metrics: [
        { label: "Risk Score", value: score, unit: "/100", status },
        { label: "Risk Level", value: riskLevel, status },
        { label: "Emotional Eating", value: emotionalLikelihood, unit: "%", status: emotionalLikelihood < 25 ? "good" : emotionalLikelihood < 50 ? "warning" : "danger" },
        { label: "Stress-Eating Link", value: stressCorrelation, status: stressCorrelation === "Weak" ? "good" : stressCorrelation === "Moderate" ? "warning" : "danger" },
        { label: "Stress Level", value: stressLevel, status: stressLevel === "low" ? "good" : stressLevel === "moderate" ? "warning" : "danger" },
        { label: "Diet Restriction", value: restrictionLevel, status: restrictionLevel === "mild" ? "good" : restrictionLevel === "moderate" ? "warning" : "danger" },
        { label: "Emotional Triggers", value: emotionalTriggers, status: emotionalTriggers === "rare" ? "good" : emotionalTriggers === "some" ? "warning" : "danger" },
        { label: "Meal Skipping", value: skipMeals, status: skipMeals === "rarely" ? "good" : skipMeals === "sometimes" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Risk Assessment", description: `Binge risk: ${score}/100 (${riskLevel}). Emotional eating likelihood: ${emotionalLikelihood}%. Stress-eating correlation: ${stressCorrelation}. ${score > 60 ? "CLINICAL NOTE: Score suggests possible binge eating disorder — professional evaluation recommended. This is treatable with CBT and nutritional counseling." : ""}`, priority: "high", category: "Assessment" },
        { title: "Prevention Strategies", description: `${restrictionLevel === "severe" ? "REDUCE restriction — severe diets are the #1 binge trigger. Allow all foods in moderation. " : ""}${skipMeals !== "rarely" ? "Stop skipping meals — hunger + blood sugar drops trigger overeating. Eat every 3-4 hours. " : ""}${stressLevel === "high" ? "Address stress: exercise, meditation, sleep, therapy. Stress eating is a coping mechanism — replace it with healthier coping. " : ""}Practice mindful eating: eat slowly, no screens, notice fullness.`, priority: "high", category: "Prevention" },
        { title: "Disclaimer", description: "This calculator estimates behavioral risk — it is not a clinical diagnosis. If you experience frequent uncontrolled eating episodes, purging, or extreme guilt around food, please consult a healthcare professional. Eating disorders are serious medical conditions that respond well to treatment.", priority: "high", category: "Clinical" }
      ],
      detailedBreakdown: { "Risk": score, "Level": riskLevel, "Emotional": `${emotionalLikelihood}%`, "Stress Link": stressCorrelation, "Stress": stressLevel, "Restriction": restrictionLevel }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="binge-eating-risk" title="Binge Eating Risk Calculator"
      description="Estimate overeating risk based on stress, diet restriction, and emotional triggers. Includes clinical screening guidance."
      icon={AlertCircle} calculate={calculate} onClear={() => { setStressLevel("moderate"); setRestrictionLevel("moderate"); setEmotionalTriggers("some"); setSkipMeals("rarely"); setResult(null) }}
      values={[stressLevel, restrictionLevel, emotionalTriggers, skipMeals]} result={result}
      seoContent={<SeoContentGenerator title="Binge Eating Risk Calculator" description="Assess psychological overeating risk and get prevention strategies." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Stress Level" val={stressLevel} set={setStressLevel} options={[{ value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }]} />
          <SelectInput label="Diet Restriction" val={restrictionLevel} set={setRestrictionLevel} options={[{ value: "mild", label: "Mild (flexible diet)" }, { value: "moderate", label: "Moderate" }, { value: "severe", label: "Severe (very strict)" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Emotional Triggers" val={emotionalTriggers} set={setEmotionalTriggers} options={[{ value: "rare", label: "Rare" }, { value: "some", label: "Sometimes" }, { value: "frequent", label: "Frequent" }]} />
          <SelectInput label="Meal Skipping" val={skipMeals} set={setSkipMeals} options={[{ value: "rarely", label: "Rarely" }, { value: "sometimes", label: "Sometimes" }, { value: "often", label: "Often" }]} />
        </div>
      </div>} />
  )
}

// ─── 38. Emotional Eating Score ───────────────────────────────────────────────
export function EmotionalEatingCalculator() {
  const [stressLevel, setStressLevel] = useState(5)
  const [moodChanges, setMoodChanges] = useState("moderate")
  const [hungerCues, setHungerCues] = useState("sometimes")
  const [eatingWhenBored, setEatingWhenBored] = useState("sometimes")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const stress = clamp(stressLevel, 1, 10)

    let score = 0
    score += stress * 4 // 4-40
    score += moodChanges === "frequent" ? 25 : moodChanges === "moderate" ? 12 : 4
    score += hungerCues === "rarely" ? 20 : hungerCues === "sometimes" ? 10 : 3
    score += eatingWhenBored === "often" ? 20 : eatingWhenBored === "sometimes" ? 10 : 3

    score = r0(clamp(score, 5, 95))

    const triggerScore = r0(clamp(stress * 5 + (moodChanges === "frequent" ? 25 : 10), 10, 85))
    const label = score > 65 ? "High Emotional Eating" : score > 40 ? "Moderate" : "Low"
    const status: 'good' | 'warning' | 'danger' = score < 35 ? "good" : score < 60 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Emotional Eating Index", value: `${score}/100`, status, description: `${label} — Stress: ${stress}/10, Trigger score: ${triggerScore}` },
      healthScore: Math.max(10, 100 - score),
      metrics: [
        { label: "Emotional Eating Index", value: score, unit: "/100", status },
        { label: "Category", value: label, status },
        { label: "Stress Level", value: `${stress}/10`, status: stress <= 3 ? "good" : stress <= 6 ? "warning" : "danger" },
        { label: "Trigger Score", value: triggerScore, unit: "/100", status: triggerScore < 30 ? "good" : triggerScore < 55 ? "warning" : "danger" },
        { label: "Mood Eating", value: moodChanges === "frequent" ? "High" : moodChanges === "moderate" ? "Moderate" : "Low", status: moodChanges === "rare" ? "good" : moodChanges === "moderate" ? "warning" : "danger" },
        { label: "Physical Hunger Cues", value: hungerCues === "always" ? "Strong" : hungerCues === "sometimes" ? "Mixed" : "Weak", status: hungerCues === "always" ? "good" : hungerCues === "sometimes" ? "warning" : "danger" },
        { label: "Boredom Eating", value: eatingWhenBored, status: eatingWhenBored === "rarely" ? "good" : eatingWhenBored === "sometimes" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Emotional Eating Profile", description: `Score: ${score}/100 (${label}). ${score > 60 ? "Significant emotional eating pattern detected. Emotions are driving food choices more than physical hunger." : score > 35 ? "Some emotional eating present — common and manageable with awareness." : "Good hunger-driven eating pattern."} Triggers: stress (${stress}/10), mood changes (${moodChanges}), boredom eating (${eatingWhenBored}).`, priority: "high", category: "Profile" },
        { title: "Awareness Strategies", description: `Before eating, ask: "Am I physically hungry or emotionally hungry?" Physical hunger: stomach growling, gradual onset, any food satisfies. Emotional hunger: sudden onset, specific cravings (usually comfort food), eating doesn't satisfy. ${hungerCues === "rarely" ? "Practice hunger scale: rate 1-10 before eating. Only eat at 3-4." : ""}`, priority: "high", category: "Awareness" },
        { title: "Coping Alternatives", description: `Replace emotional eating with: stressed → 10 min walk or breathing. Bored → call friend, hobby, or drink water first. Sad → journal, music, gentle exercise. Angry → vigorous exercise. The urge to eat emotionally passes in 15-20 minutes — delay and distract.`, priority: "medium", category: "Coping" }
      ],
      detailedBreakdown: { "Score": score, "Stress": `${stress}/10`, "Triggers": triggerScore, "Mood": moodChanges, "Hunger Cues": hungerCues, "Boredom": eatingWhenBored }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="emotional-eating" title="Emotional Eating Score"
      description="Analyze eating behavior patterns driven by emotions. Identifies triggers and provides coping strategies."
      icon={Heart} calculate={calculate} onClear={() => { setStressLevel(5); setMoodChanges("moderate"); setHungerCues("sometimes"); setEatingWhenBored("sometimes"); setResult(null) }}
      values={[stressLevel, moodChanges, hungerCues, eatingWhenBored]} result={result}
      seoContent={<SeoContentGenerator title="Emotional Eating Score" description="Assess emotional eating patterns and get coping strategies." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Stress Level" val={stressLevel} set={setStressLevel} min={1} max={10} suffix="out of 10" />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Mood-Driven Eating" val={moodChanges} set={setMoodChanges} options={[{ value: "rare", label: "Rare" }, { value: "moderate", label: "Moderate" }, { value: "frequent", label: "Frequent" }]} />
          <SelectInput label="Physical Hunger Cues" val={hungerCues} set={setHungerCues} options={[{ value: "always", label: "Clear hunger" }, { value: "sometimes", label: "Sometimes unclear" }, { value: "rarely", label: "Rarely feel hunger" }]} />
        </div>
        <SelectInput label="Eating When Bored" val={eatingWhenBored} set={setEatingWhenBored} options={[{ value: "rarely", label: "Rarely" }, { value: "sometimes", label: "Sometimes" }, { value: "often", label: "Often" }]} />
      </div>} />
  )
}

// ─── 39. Satiety Index Calculator ─────────────────────────────────────────────
export function SatietyIndexCalculator() {
  const [foodType, setFoodType] = useState("mixed")
  const [calories, setCalories] = useState(400)
  const [proteinG, setProteinG] = useState(25)
  const [fiberG, setFiberG] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cal = clamp(calories, 50, 2000)
    const pro = clamp(proteinG, 0, 100)
    const fib = clamp(fiberG, 0, 50)

    // Satiety factors: protein + fiber are most satiating per calorie
    const proteinScore = r0(clamp((pro / (cal / 100)) * 15, 0, 40)) // protein per 100 cal
    const fiberScore = r0(clamp((fib / (cal / 100)) * 12, 0, 30)) // fiber per 100 cal
    const foodTypeScore = foodType === "whole-foods" ? 20 : foodType === "mixed" ? 10 : 0
    const volumeBonus = cal < 200 ? 10 : cal < 400 ? 5 : 0

    const satietyScore = r0(clamp(proteinScore + fiberScore + foodTypeScore + volumeBonus, 5, 100))
    const hungerSuppression = r0(clamp(satietyScore * 0.85 + (pro > 20 ? 10 : 0), 10, 95))
    const mealSatisfaction = satietyScore > 65 ? "High" : satietyScore > 40 ? "Moderate" : "Low"

    const status: 'good' | 'warning' | 'danger' = satietyScore > 60 ? "good" : satietyScore > 35 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Satiety Score", value: `${satietyScore}/100`, status, description: `${mealSatisfaction} fullness potential — ${cal} kcal with ${pro}g protein, ${fib}g fiber` },
      healthScore: satietyScore,
      metrics: [
        { label: "Satiety Score", value: satietyScore, unit: "/100", status },
        { label: "Protein Satiety", value: proteinScore, unit: "/40", status: proteinScore > 20 ? "good" : proteinScore > 10 ? "warning" : "danger" },
        { label: "Fiber Satiety", value: fiberScore, unit: "/30", status: fiberScore > 15 ? "good" : fiberScore > 7 ? "warning" : "danger" },
        { label: "Food Quality", value: foodTypeScore, unit: "/20", status: foodTypeScore >= 15 ? "good" : foodTypeScore >= 10 ? "warning" : "danger" },
        { label: "Calories", value: cal, unit: "kcal", status: "normal" },
        { label: "Hunger Suppression", value: hungerSuppression, unit: "%", status: hungerSuppression > 60 ? "good" : hungerSuppression > 35 ? "warning" : "danger" },
        { label: "Meal Satisfaction", value: mealSatisfaction, status }
      ],
      recommendations: [
        { title: "Satiety Analysis", description: `Score: ${satietyScore}/100. Protein contribution: ${proteinScore}/40. Fiber contribution: ${fiberScore}/30. ${satietyScore > 60 ? "High-satiety meal — will keep you full for 3-5 hours." : satietyScore > 35 ? "Moderate satiety — you may feel hungry within 2-3 hours." : "Low satiety — add protein or fiber to increase fullness."} Highest satiety foods: boiled potatoes, oatmeal, eggs, fish, lean meat, beans.`, priority: "high", category: "Analysis" },
        { title: "Improve Fullness", description: `${pro < 20 ? "Add protein: each 10g extra protein boosts satiety 15-20%. " : ""}${fib < 5 ? "Add fiber: vegetables, beans, or whole grains. Fiber absorbs water and expands in stomach. " : ""}${foodType === "processed" ? "Switch to whole foods: they require more chewing and digestion, increasing satiety per calorie by 30-50%. " : ""}Volume matters: soup, salads, and water-rich foods fill stomach with fewer calories.`, priority: "high", category: "Tips" },
        { title: "Satiety Science", description: "Satiety hierarchy: Protein > Fiber > Complex Carbs > Fat > Simple Sugars. 100 kcal of boiled potato = 323% more filling than 100 kcal of croissant (Holt Satiety Index). During dieting, prioritize high-satiety foods to manage hunger naturally without relying on willpower.", priority: "medium", category: "Science" }
      ],
      detailedBreakdown: { "Score": satietyScore, "Protein": `${proteinScore}/40`, "Fiber": `${fiberScore}/30`, "Food": `${foodTypeScore}/20`, "Hunger": `${hungerSuppression}%`, "Satisfaction": mealSatisfaction }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="satiety-index" title="Satiety Index Calculator"
      description="Measure a meal's fullness potential based on protein, fiber, and food composition. Predicts hunger suppression."
      icon={Scale} calculate={calculate} onClear={() => { setFoodType("mixed"); setCalories(400); setProteinG(25); setFiberG(8); setResult(null) }}
      values={[foodType, calories, proteinG, fiberG]} result={result}
      seoContent={<SeoContentGenerator title="Satiety Index Calculator" description="Measure food fullness potential and hunger suppression." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Food Type" val={foodType} set={setFoodType} options={[{ value: "whole-foods", label: "Whole Foods (minimally processed)" }, { value: "mixed", label: "Mixed (typical meal)" }, { value: "processed", label: "Processed / Fast Food" }]} />
        <NumInput label="Meal Calories" val={calories} set={setCalories} min={50} max={2000} suffix="kcal" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Protein" val={proteinG} set={setProteinG} min={0} max={100} suffix="grams" />
          <NumInput label="Fiber" val={fiberG} set={setFiberG} min={0} max={50} suffix="grams" />
        </div>
      </div>} />
  )
}
