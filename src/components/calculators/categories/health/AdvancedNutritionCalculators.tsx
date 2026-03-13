"use client"

import { useState } from "react"
import { Flame, Activity, BarChart3, Heart, AlertTriangle, TrendingUp, Shield, User, Scale, Droplets, Apple, Zap } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }
function r2(n: number) { return Math.round(n * 100) / 100 }

function NumInput({ label, value, onChange, min, max, step, suffix }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}{suffix && <span className="ml-1 text-muted-foreground">({suffix})</span>}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} step={step ?? 0.1} className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50" />
    </div>
  )
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ==================== #1 — CALORIE CALCULATOR (Metabolic Intelligence Engine) ====================
export function AdvancedCalorieCalculatorV2() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [bodyFat, setBodyFat] = useState(20)
  const [activity, setActivity] = useState("moderate")
  const [goal, setGoal] = useState("maintenance")
  const [restingHR, setRestingHR] = useState(68)
  const [sleepHours, setSleepHours] = useState(7)
  const [thyroid, setThyroid] = useState("no")
  const [pcos, setPcos] = useState("no")
  const [stepsPerDay, setStepsPerDay] = useState(8000)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 15, 90)
    const h = clamp(height, 120, 230)
    const w = clamp(weight, 30, 300)
    const bf = clamp(bodyFat, 3, 60)
    const rhr = clamp(restingHR, 40, 120)
    const sl = clamp(sleepHours, 3, 12)
    const steps = clamp(stepsPerDay, 0, 30000)

    // 1. BMR — Mifflin-St Jeor
    const mifflinBMR = gender === "male"
      ? r0(10 * w + 6.25 * h - 5 * a + 5)
      : r0(10 * w + 6.25 * h - 5 * a - 161)

    // 2. Katch-McArdle (if body fat known)
    const leanMass = r1(w * (1 - bf / 100))
    const katchBMR = r0(370 + 21.6 * leanMass)

    // Use Katch-McArdle as primary (more accurate with BF data)
    const bmr = katchBMR

    // 3. Activity Multiplier
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9
    }
    const actMult = activityMultipliers[activity] || 1.55

    // 4. TDEE
    let tdee = r0(bmr * actMult)

    // Steps-based NEAT adjustment
    const stepsCalories = r0(steps * 0.04)
    const standardNEAT = r0(tdee * 0.15)
    const neatAdjustment = r0(stepsCalories - standardNEAT)
    if (Math.abs(neatAdjustment) > 50) tdee += r0(neatAdjustment * 0.5)

    // 5. Adaptive Thermogenesis (thyroid, PCOS, sleep, RHR)
    let adaptiveAdj = 0
    if (thyroid === "yes") adaptiveAdj -= r0(tdee * 0.08)
    if (pcos === "yes") adaptiveAdj -= r0(tdee * 0.05)
    if (sl < 6) adaptiveAdj -= r0(tdee * 0.03)
    if (rhr > 85) adaptiveAdj -= r0(tdee * 0.02)
    const adjustedTDEE = r0(tdee + adaptiveAdj)

    // 6. Goal-based calorie target
    let calorieTarget: number; let deficitSurplus: number
    if (goal === "fatLoss") { calorieTarget = r0(adjustedTDEE * 0.80); deficitSurplus = calorieTarget - adjustedTDEE }
    else if (goal === "aggressiveLoss") { calorieTarget = r0(adjustedTDEE * 0.70); deficitSurplus = calorieTarget - adjustedTDEE }
    else if (goal === "muscleGain") { calorieTarget = r0(adjustedTDEE * 1.10); deficitSurplus = calorieTarget - adjustedTDEE }
    else if (goal === "leanBulk") { calorieTarget = r0(adjustedTDEE * 1.15); deficitSurplus = calorieTarget - adjustedTDEE }
    else { calorieTarget = adjustedTDEE; deficitSurplus = 0 }

    // 7. Metabolic Age Estimate
    const metabolicAge = r0(a + (rhr > 75 ? 3 : rhr > 65 ? 0 : -3) + (bf > 25 ? 4 : bf > 18 ? 0 : -2) + (sl < 6 ? 3 : 0))

    // 8. Energy Availability
    const exerciseCal = r0(tdee - bmr)
    const energyAvailability = r1((calorieTarget - exerciseCal) / leanMass)

    // EA risk classification
    let eaRisk: string; let eaStatus: 'good' | 'warning' | 'danger'
    if (energyAvailability < 30) { eaRisk = "Low — RED-S risk (Relative Energy Deficiency)"; eaStatus = 'danger' }
    else if (energyAvailability < 45) { eaRisk = "Moderate — monitor closely"; eaStatus = 'warning' }
    else { eaRisk = "Adequate energy availability"; eaStatus = 'good' }

    // 9. Lean Mass Preservation check
    const proteinMin = r0(leanMass * 1.6)
    const proteinCal = proteinMin * 4
    const remainingCal = calorieTarget - proteinCal
    let lmpStatus: 'good' | 'warning' | 'danger'
    if (remainingCal < 600) { lmpStatus = 'danger' }
    else if (remainingCal < 900) { lmpStatus = 'warning' }
    else { lmpStatus = 'good' }

    // 10. Predicted weekly weight change
    const weeklyChange = r2(deficitSurplus * 7 / 7700)

    // 11. Over-restriction risk
    const minSafe = gender === "male" ? 1500 : 1200
    let restrictionRisk: string; let restrictionStatus: 'good' | 'warning' | 'danger'
    if (calorieTarget < minSafe) { restrictionRisk = "Dangerous — below minimum safe intake"; restrictionStatus = 'danger' }
    else if (calorieTarget < minSafe + 300) { restrictionRisk = "Aggressive — close to minimum"; restrictionStatus = 'warning' }
    else { restrictionRisk = "Safe caloric range"; restrictionStatus = 'good' }

    // 12. 3-month projection
    const month1 = r1(w + weeklyChange * 4)
    const month2 = r1(w + weeklyChange * 8 * 0.9) // metabolic adaptation
    const month3 = r1(w + weeklyChange * 12 * 0.82)

    // 13. Plateau detection
    const plateauWeek = weeklyChange < 0 ? r0(Math.abs(1 / weeklyChange) * 6) : 0
    const plateauNote = plateauWeek > 0 && plateauWeek < 16 ? `Potential plateau around week ${plateauWeek}` : "No near-term plateau predicted"

    // Zone classification
    let zone: string; let zoneStatus: 'good' | 'warning' | 'danger'
    if (restrictionStatus === 'danger' || eaStatus === 'danger') { zone = "Red — Unsustainable"; zoneStatus = 'danger' }
    else if (restrictionStatus === 'warning' || eaStatus === 'warning' || Math.abs(deficitSurplus) > 700) { zone = "Yellow — Aggressive"; zoneStatus = 'warning' }
    else { zone = "Green — Safe Zone"; zoneStatus = 'good' }

    const score = zoneStatus === 'good' ? 88 : zoneStatus === 'warning' ? 55 : 20

    setResult({
      primaryMetric: { label: "Daily Calories", value: calorieTarget, unit: "kcal", status: zoneStatus, description: zone, icon: Flame },
      healthScore: score,
      metrics: [
        { label: "Calorie Target", value: `${calorieTarget} kcal`, status: zoneStatus, icon: Flame },
        { label: "TDEE", value: `${adjustedTDEE} kcal`, status: 'good', icon: Zap },
        { label: "BMR (Katch)", value: `${katchBMR} kcal`, status: 'good', icon: Activity },
        { label: "BMR (Mifflin)", value: `${mifflinBMR} kcal`, status: 'good', icon: BarChart3 },
        { label: "Deficit/Surplus", value: `${deficitSurplus > 0 ? '+' : ''}${deficitSurplus} kcal`, status: zoneStatus, icon: TrendingUp },
        { label: "Weekly Δ Weight", value: `${weeklyChange > 0 ? '+' : ''}${weeklyChange} kg`, status: zoneStatus, icon: Scale },
        { label: "Metabolic Age", value: `${metabolicAge} yrs`, status: metabolicAge <= a ? 'good' : metabolicAge <= a + 5 ? 'warning' : 'danger', icon: User },
        { label: "Energy Avail.", value: `${energyAvailability} kcal/kg`, status: eaStatus, icon: Shield },
        { label: "Lean Mass", value: `${leanMass} kg`, status: 'good', icon: Activity },
        { label: "Restriction Risk", value: restrictionRisk.split("—")[0].trim(), status: restrictionStatus, icon: AlertTriangle },
        { label: "3-Mo Projection", value: `${month3} kg`, status: zoneStatus, icon: TrendingUp },
        { label: "Plateau Alert", value: plateauWeek > 0 && plateauWeek < 16 ? `~Wk ${plateauWeek}` : "None", status: plateauWeek > 0 && plateauWeek < 16 ? 'warning' : 'good', icon: Heart },
      ],
      recommendations: [
        { title: "Daily Calorie Target", description: `${calorieTarget} kcal/day for ${goal.replace(/([A-Z])/g, ' $1').toLowerCase()}. TDEE: ${adjustedTDEE} kcal. Deficit/surplus: ${deficitSurplus} kcal. BMR (Katch-McArdle): ${katchBMR}, (Mifflin-St Jeor): ${mifflinBMR}.${adaptiveAdj !== 0 ? ` Adaptive adjustment: ${adaptiveAdj} kcal (thyroid/PCOS/sleep/RHR factors).` : ''}`, priority: 'high', category: "Calories" },
        { title: "Metabolic Intelligence", description: `Metabolic age: ${metabolicAge} vs chronological ${a}. ${metabolicAge < a ? "Excellent — younger metabolism." : metabolicAge === a ? "Normal metabolic age." : `Elevated by ${metabolicAge - a} years. Improve with: sleep optimization, stress reduction, metabolic conditioning.`}`, priority: metabolicAge > a + 3 ? 'high' : 'medium', category: "Metabolic" },
        { title: "Energy Availability (RED-S)", description: `EA: ${energyAvailability} kcal/kg lean mass. ${eaRisk}. ${eaStatus === 'danger' ? "Below 30 kcal/kg = Relative Energy Deficiency risk. Increase intake immediately or reduce training volume." : eaStatus === 'warning' ? "Monitor hormonal markers — missed periods, fatigue, low libido." : "Safe training-nutrition balance."}`, priority: eaStatus === 'danger' ? 'high' : 'medium', category: "Safety" },
        { title: "Weight Projection", description: `Week 4: ${month1} kg → Week 8: ${month2} kg → Week 12: ${month3} kg. ${plateauNote}. Projection includes ~10-18% metabolic adaptation over time. Recalibrate every 4 weeks.`, priority: 'medium', category: "Projection" },
        { title: "Lean Mass Preservation", description: `Min protein for muscle retention: ${proteinMin}g/day (${proteinCal} kcal). Remaining for fats+carbs: ${remainingCal} kcal. ${lmpStatus === 'danger' ? "CRITICAL: Too few calories for fats/carbs after protein needs. Increase target or reduce deficit." : lmpStatus === 'warning' ? "Tight budget — prioritize nutrient-dense foods." : "Adequate macro distribution space."}`, priority: lmpStatus === 'danger' ? 'high' : 'medium', category: "Preservation" },
        { title: "Restriction Safety", description: `${restrictionRisk}. Minimum safe: ${minSafe} kcal (${gender}). ${restrictionStatus === 'danger' ? "Below minimum — risk of muscle loss, hormonal disruption, metabolic damage." : restrictionStatus === 'warning' ? "Close to floor — monitor energy, mood, performance weekly." : "Within sustainable range."}`, priority: restrictionStatus === 'danger' ? 'high' : 'low', category: "Safety" },
      ],
      detailedBreakdown: {
        "Calorie Target": `${calorieTarget} kcal`, "TDEE (adjusted)": `${adjustedTDEE} kcal`, "Raw TDEE": `${tdee} kcal`,
        "BMR (Katch-McArdle)": `${katchBMR} kcal`, "BMR (Mifflin-St Jeor)": `${mifflinBMR} kcal`,
        "Lean Mass": `${leanMass} kg`, "Body Fat": `${bf}%`, "Activity": activity,
        "Adaptive Adjustment": `${adaptiveAdj} kcal`, "Steps NEAT": `${stepsCalories} kcal`,
        "Goal": goal, "Deficit/Surplus": `${deficitSurplus} kcal`,
        "Weekly Weight Δ": `${weeklyChange} kg`, "Energy Availability": `${energyAvailability} kcal/kg`,
        "Metabolic Age": `${metabolicAge}`, "Restriction Risk": restrictionRisk,
        "Projection M1": `${month1} kg`, "Projection M2": `${month2} kg`, "Projection M3": `${month3} kg`,
        "Plateau": plateauNote, "Zone": zone,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Body Fat %" value={bodyFat} onChange={setBodyFat} min={3} max={60} suffix="%" />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary (desk job)" }, { value: "light", label: "Light (1-3 days/wk)" }, { value: "moderate", label: "Moderate (3-5 days/wk)" }, { value: "active", label: "Active (6-7 days/wk)" }, { value: "veryActive", label: "Very Active (athlete)" }]} />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "aggressiveLoss", label: "Aggressive Fat Loss (-30%)" }, { value: "fatLoss", label: "Fat Loss (-20%)" }, { value: "maintenance", label: "Maintenance" }, { value: "muscleGain", label: "Muscle Gain (+10%)" }, { value: "leanBulk", label: "Lean Bulk (+15%)" }]} />
      <NumInput label="Resting Heart Rate" value={restingHR} onChange={setRestingHR} min={40} max={120} suffix="bpm" />
      <NumInput label="Sleep Duration" value={sleepHours} onChange={setSleepHours} min={3} max={12} suffix="hrs" />
      <SelectInput label="Thyroid Condition" value={thyroid} onChange={setThyroid} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes (Hypothyroid)" }]} />
      <SelectInput label="PCOS / Metabolic Syndrome" value={pcos} onChange={setPcos} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} />
      <NumInput label="Steps Per Day" value={stepsPerDay} onChange={setStepsPerDay} min={0} max={30000} step={500} suffix="steps" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Calorie Calculator — Metabolic Intelligence Engine"
      description="Advanced daily calorie target with dual BMR formulas, adaptive thermogenesis, energy availability screening, metabolic age, 3-month projection, and RED-S risk detection."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Calorie Calculator" description="Metabolic intelligence engine with adaptive thermogenesis and energy availability screening." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #2 — MACRO CALCULATOR (Precision Nutrition Engine) ====================
export function AdvancedMacroCalculatorV2() {
  const [weight, setWeight] = useState(72)
  const [bodyFat, setBodyFat] = useState(20)
  const [calories, setCalories] = useState(2200)
  const [goal, setGoal] = useState("maintenance")
  const [activity, setActivity] = useState("moderate")
  const [carbSensitivity, setCarbSensitivity] = useState("normal")
  const [trainingDays, setTrainingDays] = useState(4)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 300)
    const bf = clamp(bodyFat, 3, 60)
    const cal = clamp(calories, 800, 6000)
    const td = clamp(trainingDays, 0, 7)
    const leanMass = r1(w * (1 - bf / 100))

    // Protein calculation (g/kg lean mass)
    let proteinPerKg: number
    if (goal === "fatLoss" || goal === "aggressiveLoss") proteinPerKg = 2.2
    else if (goal === "muscleGain" || goal === "leanBulk") proteinPerKg = 2.0
    else proteinPerKg = 1.6
    const proteinG = r0(leanMass * proteinPerKg)
    const proteinCal = proteinG * 4

    // Fat calculation (% of calories)
    let fatPercent: number
    if (carbSensitivity === "high") fatPercent = 35
    else if (carbSensitivity === "low") fatPercent = 20
    else fatPercent = 25
    const fatCal = r0(cal * fatPercent / 100)
    const fatG = r0(fatCal / 9)

    // Carbs = remaining
    const carbCal = r0(cal - proteinCal - fatCal)
    const carbG = r0(Math.max(carbCal, 0) / 4)
    const netCarbs = r0(carbG * 0.85) // ~15% fiber

    // Training day vs rest day split
    const trainingCarbs = r0(carbG * 1.2)
    const restCarbs = r0(carbG * 0.75)
    const trainingFat = r0(fatG * 0.85)
    const restFat = r0(fatG * 1.2)

    // Macro percentages
    const proteinPct = r0(proteinCal / cal * 100)
    const fatPct = r0(fatCal / cal * 100)
    const carbPct = r0(carbCal / cal * 100)

    // Nitrogen balance model
    const nitrogenIntake = r1(proteinG / 6.25)
    const nitrogenLoss = r1(leanMass * 0.08 + (goal === "fatLoss" ? 1.5 : 0))
    const nitrogenBalance = r1(nitrogenIntake - nitrogenLoss)
    let nStatus: 'good' | 'warning' | 'danger'
    if (nitrogenBalance > 2) nStatus = 'good'
    else if (nitrogenBalance > 0) nStatus = 'warning'
    else nStatus = 'danger'

    // Insulin load estimate
    const insulinLoad = r0(carbG * 1.0 + proteinG * 0.56 + fatG * 0.1)
    let insulinClass: string; let insulinStatus: 'good' | 'warning' | 'danger'
    if (insulinLoad < 150) { insulinClass = "Low insulin load"; insulinStatus = 'good' }
    else if (insulinLoad < 250) { insulinClass = "Moderate insulin load"; insulinStatus = 'good' }
    else if (insulinLoad < 350) { insulinClass = "Elevated insulin load"; insulinStatus = 'warning' }
    else { insulinClass = "High insulin load"; insulinStatus = 'danger' }

    // MPS (Muscle Protein Synthesis) threshold
    const perMealProtein = r0(proteinG / 4)
    const mpsThreshold = gender === "male" ? 30 : 25
    const mpsHit = perMealProtein >= mpsThreshold
    const mpsStatus: 'good' | 'warning' | 'danger' = mpsHit ? 'good' : 'warning'

    // Anabolic score
    const anabolicScore = r0(
      Math.min(100,
        (proteinPerKg >= 1.8 ? 30 : 15) +
        (nitrogenBalance > 0 ? 25 : 5) +
        (mpsHit ? 25 : 10) +
        (cal >= leanMass * 30 ? 20 : 10)
      )
    )

    // Risk classification
    let riskFlag: string; let riskStatus: 'good' | 'warning' | 'danger'
    if (proteinPct < 15) { riskFlag = "Low protein — muscle loss risk"; riskStatus = 'danger' }
    else if (carbPct > 65) { riskFlag = "Excess carbs — insulin spikes likely"; riskStatus = 'warning' }
    else if (fatPct > 45) { riskFlag = "High fat — keto imbalance possible"; riskStatus = 'warning' }
    else { riskFlag = "Balanced macro profile"; riskStatus = 'good' }

    // Refeed day calculation (for fat loss)
    const refeedCals = r0(cal + 500)
    const refeedCarbs = r0(carbG + 125) // +500 cal from carbs
    const refeedFreq = goal === "fatLoss" || goal === "aggressiveLoss" ? `Every ${td >= 5 ? 5 : 7} days` : "Not needed"

    const score = riskStatus === 'good' ? 85 : riskStatus === 'warning' ? 55 : 25

    setResult({
      primaryMetric: { label: "Macro Split", value: `${proteinPct}/${carbPct}/${fatPct}`, status: riskStatus, description: `P${proteinG}g / C${carbG}g / F${fatG}g`, icon: BarChart3 },
      healthScore: score,
      metrics: [
        { label: "Protein", value: `${proteinG}g (${proteinPct}%)`, status: proteinPct >= 20 ? 'good' : 'warning', icon: Shield },
        { label: "Carbs", value: `${carbG}g (${carbPct}%)`, status: carbPct <= 60 ? 'good' : 'warning', icon: Zap },
        { label: "Fat", value: `${fatG}g (${fatPct}%)`, status: fatPct <= 40 ? 'good' : 'warning', icon: Flame },
        { label: "Net Carbs", value: `${netCarbs}g`, status: 'good', icon: Apple },
        { label: "Per Meal Protein", value: `${perMealProtein}g`, status: mpsStatus, icon: Activity },
        { label: "Nitrogen Balance", value: `${nitrogenBalance > 0 ? '+' : ''}${nitrogenBalance}g`, status: nStatus, icon: TrendingUp },
        { label: "Insulin Load", value: `${insulinLoad}`, status: insulinStatus, icon: Heart },
        { label: "Anabolic Score", value: `${anabolicScore}/100`, status: anabolicScore >= 70 ? 'good' : 'warning', icon: Scale },
        { label: "Training Carbs", value: `${trainingCarbs}g`, status: 'good', icon: Zap },
        { label: "Rest Day Carbs", value: `${restCarbs}g`, status: 'good', icon: BarChart3 },
        { label: "MPS Threshold", value: mpsHit ? "Met" : "Below", status: mpsStatus, icon: Shield },
        { label: "Risk", value: riskFlag.split("—")[0].trim(), status: riskStatus, icon: AlertTriangle },
      ],
      recommendations: [
        { title: "Macro Distribution", description: `Protein ${proteinG}g (${proteinPct}%) • Carbs ${carbG}g (${carbPct}%) • Fat ${fatG}g (${fatPct}%). Based on ${cal} kcal, ${proteinPerKg} g/kg lean mass protein target. ${riskFlag}.`, priority: 'high', category: "Macros" },
        { title: "Carb Cycling", description: `Training days: P${proteinG}g/C${trainingCarbs}g/F${trainingFat}g. Rest days: P${proteinG}g/C${restCarbs}g/F${restFat}g. Higher carbs on training days fuel performance and glycogen replenishment.`, priority: 'medium', category: "Cycling" },
        { title: "Nitrogen Balance (Muscle Retention)", description: `Nitrogen in: ${nitrogenIntake}g, out: ${nitrogenLoss}g. Balance: ${nitrogenBalance > 0 ? '+' : ''}${nitrogenBalance}g. ${nStatus === 'danger' ? "NEGATIVE balance — actively losing muscle. Increase protein immediately." : nStatus === 'warning' ? "Barely positive — increase protein or reduce deficit." : "Positive — muscle preservation supported."}`, priority: nStatus === 'danger' ? 'high' : 'medium', category: "Muscle" },
        { title: "Insulin Load Management", description: `Estimated insulin load: ${insulinLoad}. ${insulinClass}. ${insulinStatus === 'danger' ? "Very high — risk of insulin resistance over time. Reduce refined carbs, increase fiber." : "Within manageable range."}`, priority: insulinStatus === 'danger' ? 'high' : 'low', category: "Insulin" },
        { title: "MPS Optimization", description: `Per-meal protein: ${perMealProtein}g (threshold: ${mpsThreshold}g). ${mpsHit ? "Meets leucine/MPS threshold each meal — optimal for muscle protein synthesis." : `Below MPS threshold. Aim for ${mpsThreshold}g+ per meal or add leucine-rich foods (whey, eggs, chicken).`}`, priority: mpsStatus === 'warning' ? 'high' : 'low', category: "MPS" },
        { title: "Refeed Strategy", description: `${refeedFreq}. Refeed: ${refeedCals} kcal with ${refeedCarbs}g carbs. ${goal.includes("Loss") ? "Strategic refeeds restore leptin, break plateaus, improve adherence." : "Not currently in deficit — refeeds unnecessary."}`, priority: goal.includes("Loss") ? 'medium' : 'low', category: "Refeed" },
      ],
      detailedBreakdown: {
        "Calories": `${cal} kcal`, "Protein": `${proteinG}g (${proteinPct}%)`, "Carbs": `${carbG}g (${carbPct}%)`, "Fat": `${fatG}g (${fatPct}%)`,
        "Net Carbs": `${netCarbs}g`, "Protein/kg LM": `${proteinPerKg} g/kg`,
        "Lean Mass": `${leanMass} kg`, "Nitrogen Balance": `${nitrogenBalance}g`,
        "Insulin Load": `${insulinLoad}`, "Per Meal Protein": `${perMealProtein}g`,
        "MPS Threshold": mpsHit ? "Met" : "Below",
        "Training Carbs": `${trainingCarbs}g`, "Rest Carbs": `${restCarbs}g`,
        "Anabolic Score": `${anabolicScore}/100`, "Risk": riskFlag,
        "Refeed": `${refeedFreq} — ${refeedCals} kcal`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Body Fat %" value={bodyFat} onChange={setBodyFat} min={3} max={60} suffix="%" />
      <NumInput label="Daily Calories" value={calories} onChange={setCalories} min={800} max={6000} step={50} suffix="kcal" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "aggressiveLoss", label: "Aggressive Fat Loss" }, { value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscleGain", label: "Muscle Gain" }, { value: "leanBulk", label: "Lean Bulk" }]} />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }, { value: "veryActive", label: "Very Active" }]} />
      <SelectInput label="Carb Sensitivity" value={carbSensitivity} onChange={setCarbSensitivity} options={[{ value: "low", label: "Low (carb tolerant)" }, { value: "normal", label: "Normal" }, { value: "high", label: "High (carb sensitive)" }]} />
      <NumInput label="Training Days/Week" value={trainingDays} onChange={setTrainingDays} min={0} max={7} step={1} suffix="days" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Macro Calculator — Precision Nutrition Engine"
      description="Optimized macro distribution with nitrogen balance, insulin load, MPS threshold, carb cycling, anabolic score, and refeed strategy."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Macro Calculator" description="Precision nutrition with nitrogen balance, insulin load, and carb cycling." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #3 — TDEE CALCULATOR (Energy Expenditure Analyzer) ====================
export function AdvancedTDEECalculatorV2() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [bodyFat, setBodyFat] = useState(20)
  const [activity, setActivity] = useState("moderate")
  const [exerciseMin, setExerciseMin] = useState(45)
  const [exerciseDays, setExerciseDays] = useState(4)
  const [neatLevel, setNeatLevel] = useState("average")
  const [stepsPerDay, setStepsPerDay] = useState(8000)
  const [mealFrequency, setMealFrequency] = useState(4)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 15, 90)
    const h = clamp(height, 120, 230)
    const w = clamp(weight, 30, 300)
    const bf = clamp(bodyFat, 3, 60)
    const exMin = clamp(exerciseMin, 0, 180)
    const exDays = clamp(exerciseDays, 0, 7)
    const steps = clamp(stepsPerDay, 0, 30000)
    const meals = clamp(mealFrequency, 1, 8)
    const lm = r1(w * (1 - bf / 100))

    // BMR (Katch-McArdle)
    const bmr = r0(370 + 21.6 * lm)

    // TEF (Thermic Effect of Food) — ~10% of TDEE, varies by meal frequency and protein
    const tef = r0(bmr * 0.10 * (1 + meals * 0.01))

    // EAT (Exercise Activity Thermogenesis)
    const metValue = activity === "veryActive" ? 8 : activity === "active" ? 6.5 : activity === "moderate" ? 5 : activity === "light" ? 3.5 : 2
    const eatPerSession = r0(metValue * 3.5 * w / 200 * exMin)
    const eatWeekly = r0(eatPerSession * exDays)
    const eatDaily = r0(eatWeekly / 7)

    // NEAT (Non-Exercise Activity Thermogenesis)
    const neatMultipliers: Record<string, number> = { low: 0.12, average: 0.20, high: 0.30, veryHigh: 0.40 }
    const neatBase = r0(bmr * (neatMultipliers[neatLevel] || 0.20))
    const stepsNEAT = r0(steps * 0.04)
    const neat = r0((neatBase + stepsNEAT) / 2)

    // Total TDEE
    const tdee = r0(bmr + tef + eatDaily + neat)

    // Doubly Labeled Water approximation
    const dlwEstimate = r0(tdee * (a > 60 ? 0.92 : a > 40 ? 0.96 : 1.02))

    // Component percentages
    const bmrPct = r0(bmr / tdee * 100)
    const tefPct = r0(tef / tdee * 100)
    const eatPct = r0(eatDaily / tdee * 100)
    const neatPct = r0(neat / tdee * 100)

    // Adaptive metabolism shift (how metabolized changes with dieting)
    const adaptiveShift = a > 50 ? -r0(tdee * 0.05) : a > 40 ? -r0(tdee * 0.03) : 0

    // Sedentary risk
    let sedentaryRisk: string; let sedStatus: 'good' | 'warning' | 'danger'
    if (steps < 4000 && neatLevel === "low") { sedentaryRisk = "High sedentary risk — metabolic decline"; sedStatus = 'danger' }
    else if (steps < 6000) { sedentaryRisk = "Below average activity"; sedStatus = 'warning' }
    else { sedentaryRisk = "Active lifestyle"; sedStatus = 'good' }

    // Seasonal estimate (winter -3%, summer +2%)
    const winterTDEE = r0(tdee * 0.97)
    const summerTDEE = r0(tdee * 1.02)

    const score = sedStatus === 'good' ? 82 : sedStatus === 'warning' ? 55 : 30

    setResult({
      primaryMetric: { label: "Total TDEE", value: tdee, unit: "kcal/day", status: 'good', description: `BMR ${bmrPct}% + NEAT ${neatPct}% + EAT ${eatPct}% + TEF ${tefPct}%`, icon: Zap },
      healthScore: score,
      metrics: [
        { label: "TDEE", value: `${tdee} kcal`, status: 'good', icon: Zap },
        { label: "BMR", value: `${bmr} kcal (${bmrPct}%)`, status: 'good', icon: Activity },
        { label: "NEAT", value: `${neat} kcal (${neatPct}%)`, status: sedStatus, icon: TrendingUp },
        { label: "EAT (Exercise)", value: `${eatDaily} kcal (${eatPct}%)`, status: eatDaily > 200 ? 'good' : 'warning', icon: Flame },
        { label: "TEF (Food)", value: `${tef} kcal (${tefPct}%)`, status: 'good', icon: Apple },
        { label: "DLW Estimate", value: `${dlwEstimate} kcal`, status: 'good', icon: BarChart3 },
        { label: "Steps/Day", value: `${steps}`, status: steps >= 8000 ? 'good' : 'warning', icon: User },
        { label: "Lean Mass", value: `${lm} kg`, status: 'good', icon: Shield },
        { label: "Sedentary Risk", value: sedentaryRisk.split("—")[0].trim(), status: sedStatus, icon: AlertTriangle },
        { label: "Adaptive Shift", value: `${adaptiveShift} kcal`, status: adaptiveShift < -100 ? 'warning' : 'good', icon: Heart },
        { label: "Winter TDEE", value: `${winterTDEE} kcal`, status: 'good', icon: Scale },
        { label: "Summer TDEE", value: `${summerTDEE} kcal`, status: 'good', icon: Scale },
      ],
      recommendations: [
        { title: "TDEE Breakdown", description: `Total: ${tdee} kcal/day. BMR: ${bmr} (${bmrPct}%), NEAT: ${neat} (${neatPct}%), Exercise: ${eatDaily} (${eatPct}%), TEF: ${tef} (${tefPct}%). Your BMR makes up ~${bmrPct}% — this is the largest and least controllable component.`, priority: 'high', category: "Energy" },
        { title: "NEAT Optimization", description: `NEAT: ${neat} kcal. Steps: ${steps}/day. ${steps < 8000 ? `Increase to 10,000 steps for ~${r0((10000 - steps) * 0.04)} extra kcal burn.` : "Good step count."} NEAT is the most variable and improvable TDEE component.`, priority: sedStatus !== 'good' ? 'high' : 'medium', category: "NEAT" },
        { title: "Exercise Contribution", description: `${exMin} min × ${exDays} days = ${eatWeekly} kcal/week (${eatDaily}/day). MET value: ${metValue}. ${eatPct < 10 ? "Low exercise contribution — consider adding structured training." : "Good exercise volume."}`, priority: eatPct < 10 ? 'high' : 'low', category: "Exercise" },
        { title: "DLW Comparison", description: `Doubly labeled water estimate: ${dlwEstimate} kcal. Difference from calculated: ${Math.abs(tdee - dlwEstimate)} kcal. DLW is the gold standard — our estimate accounts for age-related metabolic changes.`, priority: 'medium', category: "Validation" },
        { title: "Seasonal Adjustment", description: `Winter TDEE: ~${winterTDEE} kcal (−3%). Summer: ~${summerTDEE} kcal (+2%). Cold weather increases shivering thermogenesis but reduces activity. Adjust calories seasonally.`, priority: 'low', category: "Seasonal" },
        { title: "Sedentary Risk", description: `${sedentaryRisk}. ${sedStatus === 'danger' ? "Prolonged sedentary behavior increases CVD, diabetes, and all-cause mortality risk. Stand every 30 min, take walking breaks." : "Current activity level is adequate."}`, priority: sedStatus === 'danger' ? 'high' : 'low', category: "Risk" },
      ],
      detailedBreakdown: {
        "TDEE": `${tdee} kcal`, "BMR": `${bmr} kcal`, "NEAT": `${neat} kcal`,
        "EAT (daily)": `${eatDaily} kcal`, "EAT (weekly)": `${eatWeekly} kcal`,
        "TEF": `${tef} kcal`, "DLW Estimate": `${dlwEstimate} kcal`,
        "BMR %": `${bmrPct}%`, "NEAT %": `${neatPct}%`, "EAT %": `${eatPct}%`, "TEF %": `${tefPct}%`,
        "Steps": `${steps}`, "NEAT Level": neatLevel,
        "Exercise": `${exMin} min × ${exDays} days`, "Lean Mass": `${lm} kg`,
        "Adaptive Shift": `${adaptiveShift} kcal`, "Sedentary Risk": sedentaryRisk,
        "Winter": `${winterTDEE} kcal`, "Summer": `${summerTDEE} kcal`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Body Fat %" value={bodyFat} onChange={setBodyFat} min={3} max={60} suffix="%" />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }, { value: "veryActive", label: "Very Active" }]} />
      <NumInput label="Exercise Duration" value={exerciseMin} onChange={setExerciseMin} min={0} max={180} step={5} suffix="min" />
      <NumInput label="Exercise Days/Week" value={exerciseDays} onChange={setExerciseDays} min={0} max={7} step={1} suffix="days" />
      <SelectInput label="NEAT Level" value={neatLevel} onChange={setNeatLevel} options={[{ value: "low", label: "Low (desk bound)" }, { value: "average", label: "Average" }, { value: "high", label: "High (active job)" }, { value: "veryHigh", label: "Very High (manual labor)" }]} />
      <NumInput label="Steps Per Day" value={stepsPerDay} onChange={setStepsPerDay} min={0} max={30000} step={500} suffix="steps" />
      <NumInput label="Meals Per Day" value={mealFrequency} onChange={setMealFrequency} min={1} max={8} step={1} suffix="meals" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="TDEE Calculator — Energy Expenditure Analyzer"
      description="Dynamic TDEE with full BMR/NEAT/EAT/TEF breakdown, DLW approximation, sedentary risk, seasonal adjustment, and adaptive metabolism modeling."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced TDEE Calculator" description="Complete energy expenditure analysis with NEAT, TEF, EAT breakdown and DLW validation." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #4 — PROTEIN CALCULATOR (Lean Mass Optimizer) ====================
export function AdvancedProteinCalculatorV2() {
  const [weight, setWeight] = useState(72)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [goal, setGoal] = useState("maintenance")
  const [trainingIntensity, setTrainingIntensity] = useState("moderate")
  const [kidneyCondition, setKidneyCondition] = useState("healthy")
  const [bodyFat, setBodyFat] = useState(20)
  const [mealsPerDay, setMealsPerDay] = useState(4)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 300)
    const a = clamp(age, 15, 90)
    const bf = clamp(bodyFat, 3, 60)
    const meals = clamp(mealsPerDay, 1, 8)
    const lm = r1(w * (1 - bf / 100))

    // Protein per kg bodyweight range
    let proteinPerKg: number
    if (kidneyCondition === "ckd") proteinPerKg = 0.6
    else if (kidneyCondition === "mild") proteinPerKg = 0.8
    else if (goal === "aggressiveLoss") proteinPerKg = 2.4
    else if (goal === "fatLoss") proteinPerKg = 2.0
    else if (goal === "muscleGain" || goal === "leanBulk") proteinPerKg = 2.0
    else proteinPerKg = 1.2

    // Intensity adjustment
    if (kidneyCondition === "healthy") {
      if (trainingIntensity === "high") proteinPerKg += 0.3
      else if (trainingIntensity === "veryHigh") proteinPerKg += 0.5
    }

    // Elderly adjustment (>55 years need more)
    if (a > 55 && kidneyCondition === "healthy") proteinPerKg = Math.max(proteinPerKg, 1.5)
    if (a > 70 && kidneyCondition === "healthy") proteinPerKg = Math.max(proteinPerKg, 1.8)

    const totalProtein = r0(w * proteinPerKg)
    const proteinPerLM = r1(totalProtein / lm)
    const perMealProtein = r0(totalProtein / meals)

    // Leucine threshold (2.5-3g per meal for MPS)
    const leucinePerMeal = r1(perMealProtein * 0.09) // ~9% of protein is leucine
    const leucineThreshold = 2.5
    const leucineMet = leucinePerMeal >= leucineThreshold
    const leucineStatus: 'good' | 'warning' | 'danger' = leucineMet ? 'good' : 'warning'

    // Sarcopenia risk score
    let sarcopeniaScore = 0
    if (a > 60) sarcopeniaScore += 3
    if (a > 70) sarcopeniaScore += 3
    if (proteinPerKg < 1.2) sarcopeniaScore += 4
    if (trainingIntensity === "none" || trainingIntensity === "low") sarcopeniaScore += 3
    if (bf > 30) sarcopeniaScore += 2
    const sarcopeniaRisk = sarcopeniaScore > 8 ? "High" : sarcopeniaScore > 4 ? "Moderate" : "Low"
    const sarcopeniaStatus: 'good' | 'warning' | 'danger' = sarcopeniaScore > 8 ? 'danger' : sarcopeniaScore > 4 ? 'warning' : 'good'

    // Recovery score
    const recoveryScore = r0(Math.min(100, proteinPerKg * 30 + (leucineMet ? 20 : 0) + (meals >= 4 ? 10 : 0)))

    // Kidney caution
    let kidneyNote: string; let kidneyStatus: 'good' | 'warning' | 'danger'
    if (kidneyCondition === "ckd") { kidneyNote = "CKD — restricted to 0.6 g/kg. Consult nephrologist."; kidneyStatus = 'danger' }
    else if (kidneyCondition === "mild") { kidneyNote = "Mild impairment — capped at 0.8 g/kg."; kidneyStatus = 'warning' }
    else if (proteinPerKg > 2.5) { kidneyNote = "Very high intake — ensure adequate hydration (3L+/day)."; kidneyStatus = 'warning' }
    else { kidneyNote = "Healthy kidneys — no restriction needed."; kidneyStatus = 'good' }

    // Optimal timing distribution
    const preworkout = r0(perMealProtein * 0.8)
    const postworkout = r0(perMealProtein * 1.3)
    const beforeBed = r0(perMealProtein * 1.0)

    const score = sarcopeniaStatus === 'good' && kidneyStatus !== 'danger' ? 85 : sarcopeniaStatus === 'warning' ? 55 : 30

    setResult({
      primaryMetric: { label: "Daily Protein", value: totalProtein, unit: "g/day", status: kidneyStatus !== 'danger' ? 'good' : 'warning', description: `${proteinPerKg} g/kg bodyweight`, icon: Shield },
      healthScore: score,
      metrics: [
        { label: "Daily Total", value: `${totalProtein}g`, status: 'good', icon: Shield },
        { label: "Per kg BW", value: `${proteinPerKg} g/kg`, status: 'good', icon: Scale },
        { label: "Per kg LM", value: `${proteinPerLM} g/kg`, status: 'good', icon: Activity },
        { label: "Per Meal", value: `${perMealProtein}g`, status: perMealProtein >= 25 ? 'good' : 'warning', icon: Apple },
        { label: "Leucine/Meal", value: `${leucinePerMeal}g`, status: leucineStatus, icon: Zap },
        { label: "Sarcopenia Risk", value: sarcopeniaRisk, status: sarcopeniaStatus, icon: AlertTriangle },
        { label: "Recovery Score", value: `${recoveryScore}/100`, status: recoveryScore >= 70 ? 'good' : 'warning', icon: Heart },
        { label: "Kidney Status", value: kidneyCondition === "healthy" ? "Healthy" : kidneyCondition === "mild" ? "Mild" : "CKD", status: kidneyStatus, icon: User },
        { label: "Pre-Workout", value: `${preworkout}g`, status: 'good', icon: Flame },
        { label: "Post-Workout", value: `${postworkout}g`, status: 'good', icon: TrendingUp },
        { label: "Before Bed", value: `${beforeBed}g (casein)`, status: 'good', icon: BarChart3 },
        { label: "Lean Mass", value: `${lm} kg`, status: 'good', icon: Scale },
      ],
      recommendations: [
        { title: "Daily Protein Target", description: `${totalProtein}g/day (${proteinPerKg} g/kg). Split across ${meals} meals = ${perMealProtein}g each. ${a > 55 ? "Elderly adjustment applied — higher protein needed to counter anabolic resistance." : ""} ${goal.includes("Loss") ? "High protein during deficit preserves lean mass." : ""}`, priority: 'high', category: "Target" },
        { title: "Leucine & MPS", description: `Leucine per meal: ${leucinePerMeal}g (threshold: ${leucineThreshold}g). ${leucineMet ? "Meets MPS activation threshold — each meal triggers muscle protein synthesis." : `Below threshold — add leucine-rich sources: whey (10% leucine), eggs, chicken breast. Need ${r1(leucineThreshold - leucinePerMeal)}g more per meal.`}`, priority: leucineStatus === 'warning' ? 'high' : 'medium', category: "MPS" },
        { title: "Meal Timing", description: `Pre-workout: ${preworkout}g (1-2h before). Post-workout: ${postworkout}g (within 2h, highest priority meal). Before bed: ${beforeBed}g casein protein (slow-release, prevents overnight catabolism).`, priority: 'medium', category: "Timing" },
        { title: "Sarcopenia Prevention", description: `Risk score: ${sarcopeniaScore}/15 — ${sarcopeniaRisk}. ${sarcopeniaStatus === 'danger' ? "HIGH RISK: increase protein + start resistance training immediately. Muscle loss accelerates exponentially after 70." : sarcopeniaStatus === 'warning' ? "Moderate risk — ensure resistance training 2-3×/week + adequate protein." : "Low risk — maintain current habits."}`, priority: sarcopeniaStatus !== 'good' ? 'high' : 'low', category: "Aging" },
        { title: "Kidney Considerations", description: `${kidneyNote} ${kidneyCondition === "healthy" ? "Research shows high protein (up to 3.3 g/kg) is safe for healthy kidneys. Stay hydrated." : "Protein restricted due to kidney condition. Prioritize high-quality sources (eggs, fish, whey)."}`, priority: kidneyStatus === 'danger' ? 'high' : 'low', category: "Safety" },
      ],
      detailedBreakdown: {
        "Total Protein": `${totalProtein}g`, "Per kg BW": `${proteinPerKg} g/kg`, "Per kg LM": `${proteinPerLM} g/kg`,
        "Per Meal": `${perMealProtein}g`, "Meals/Day": `${meals}`,
        "Leucine/Meal": `${leucinePerMeal}g`, "Leucine Met": leucineMet ? "Yes" : "No",
        "Lean Mass": `${lm} kg`, "Body Fat": `${bf}%`,
        "Sarcopenia Score": `${sarcopeniaScore}/15`, "Sarcopenia Risk": sarcopeniaRisk,
        "Recovery Score": `${recoveryScore}/100`, "Kidney": kidneyCondition,
        "Pre-Workout": `${preworkout}g`, "Post-Workout": `${postworkout}g`, "Before Bed": `${beforeBed}g`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <NumInput label="Body Fat %" value={bodyFat} onChange={setBodyFat} min={3} max={60} suffix="%" />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "aggressiveLoss", label: "Aggressive Fat Loss" }, { value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscleGain", label: "Muscle Gain" }, { value: "leanBulk", label: "Lean Bulk" }]} />
      <SelectInput label="Training Intensity" value={trainingIntensity} onChange={setTrainingIntensity} options={[{ value: "none", label: "None" }, { value: "low", label: "Low" }, { value: "moderate", label: "Moderate" }, { value: "high", label: "High" }, { value: "veryHigh", label: "Very High (athlete)" }]} />
      <SelectInput label="Kidney Condition" value={kidneyCondition} onChange={setKidneyCondition} options={[{ value: "healthy", label: "Healthy" }, { value: "mild", label: "Mild Impairment" }, { value: "ckd", label: "CKD (Stage 3+)" }]} />
      <NumInput label="Meals Per Day" value={mealsPerDay} onChange={setMealsPerDay} min={1} max={8} step={1} suffix="meals" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Protein Calculator — Lean Mass Optimizer"
      description="Personalized protein with leucine threshold, sarcopenia risk scoring, MPS optimization, kidney-safe limits, and meal timing strategy."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Protein Calculator" description="Lean mass optimizer with leucine MPS threshold, sarcopenia risk, and kidney safety." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #5 — WATER INTAKE CALCULATOR (Hydration Intelligence) ====================
export function AdvancedWaterIntakeCalculatorV2() {
  const [weight, setWeight] = useState(72)
  const [activity, setActivity] = useState("moderate")
  const [climate, setClimate] = useState("temperate")
  const [caffeineIntake, setCaffeineIntake] = useState(200)
  const [exerciseMin, setExerciseMin] = useState(45)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 300)
    const a = clamp(age, 15, 90)
    const caf = clamp(caffeineIntake, 0, 800)
    const exMin = clamp(exerciseMin, 0, 180)

    // Base water: 35 ml/kg
    let baseWater = r0(w * 35)

    // Activity adjustment
    const activityMult: Record<string, number> = { sedentary: 0.9, light: 1.0, moderate: 1.1, active: 1.25, veryActive: 1.4 }
    baseWater = r0(baseWater * (activityMult[activity] || 1.1))

    // Climate adjustment
    const climateMult: Record<string, number> = { cold: 0.9, temperate: 1.0, warm: 1.15, hot: 1.3, tropical: 1.4 }
    baseWater = r0(baseWater * (climateMult[climate] || 1.0))

    // Exercise sweat loss compensation (~500-1000ml/hr)
    const sweatLoss = r0(exMin * 12) // ~12ml per minute
    const totalWater = r0(baseWater + sweatLoss)

    // Caffeine diuretic offset (~50% of caffeine volume)
    const caffeineOffset = r0(caf * 0.5) // mg ~ ml approximation
    const adjustedTotal = r0(totalWater + caffeineOffset)

    const liters = r1(adjustedTotal / 1000)
    const glasses = r0(adjustedTotal / 250) // 250ml per glass

    // Electrolyte need
    const sodiumNeed = r0(sweatLoss > 500 ? 1000 + sweatLoss * 0.4 : 1500)
    const potassiumNeed = r0(sweatLoss > 500 ? 3500 + sweatLoss * 0.2 : 3500)

    // Dehydration risk score
    let dehydrationScore = 0
    if (climate === "hot" || climate === "tropical") dehydrationScore += 3
    if (exMin > 60) dehydrationScore += 3
    if (caf > 400) dehydrationScore += 2
    if (a > 65) dehydrationScore += 2
    if (activity === "veryActive") dehydrationScore += 2
    const dehydRisk = dehydrationScore > 6 ? "High" : dehydrationScore > 3 ? "Moderate" : "Low"
    const dehydStatus: 'good' | 'warning' | 'danger' = dehydrationScore > 6 ? 'danger' : dehydrationScore > 3 ? 'warning' : 'good'

    // Urine color prediction
    const hydrationLevel = adjustedTotal / (w * 40)
    let urineColor: string; let urineStatus: 'good' | 'warning' | 'danger'
    if (hydrationLevel > 1.0) { urineColor = "Pale yellow (well hydrated)"; urineStatus = 'good' }
    else if (hydrationLevel > 0.8) { urineColor = "Light yellow (adequate)"; urineStatus = 'good' }
    else if (hydrationLevel > 0.6) { urineColor = "Yellow (mild dehydration)"; urineStatus = 'warning' }
    else { urineColor = "Dark yellow (dehydrated)"; urineStatus = 'danger' }

    // Kidney stone prevention threshold
    const kidneyStoneThresh = 2500
    const ksStatus: 'good' | 'warning' | 'danger' = adjustedTotal >= kidneyStoneThresh ? 'good' : 'warning'

    // Hourly intake for waking hours (16h)
    const hourlyIntake = r0(adjustedTotal / 16)

    const score = dehydStatus === 'good' ? 85 : dehydStatus === 'warning' ? 55 : 25

    setResult({
      primaryMetric: { label: "Daily Water", value: liters, unit: "liters", status: dehydStatus === 'danger' ? 'warning' : 'good', description: `${glasses} glasses (250ml each)`, icon: Droplets },
      healthScore: score,
      metrics: [
        { label: "Total Water", value: `${liters} L`, status: 'good', icon: Droplets },
        { label: "Glasses", value: `${glasses}`, status: 'good', icon: Scale },
        { label: "Per Hour", value: `${hourlyIntake} ml`, status: 'good', icon: Activity },
        { label: "Sweat Loss", value: `${sweatLoss} ml`, status: sweatLoss > 500 ? 'warning' : 'good', icon: Flame },
        { label: "Caffeine Offset", value: `+${caffeineOffset} ml`, status: caf > 400 ? 'warning' : 'good', icon: Zap },
        { label: "Sodium Need", value: `${sodiumNeed} mg`, status: 'good', icon: Shield },
        { label: "Potassium Need", value: `${potassiumNeed} mg`, status: 'good', icon: Heart },
        { label: "Dehydration Risk", value: dehydRisk, status: dehydStatus, icon: AlertTriangle },
        { label: "Urine Color", value: urineColor.split("(")[0].trim(), status: urineStatus, icon: BarChart3 },
        { label: "Kidney Stone", value: ksStatus === 'good' ? "Protected" : "Below threshold", status: ksStatus, icon: Shield },
      ],
      recommendations: [
        { title: "Daily Water Target", description: `${liters} liters (${adjustedTotal} ml). Base: ${r1(w * 35 / 1000)}L + activity adjustment + climate factor + exercise sweat + caffeine offset. Drink ${hourlyIntake} ml/hour across 16 waking hours.`, priority: 'high', category: "Hydration" },
        { title: "Sweat Replacement", description: `Exercise sweat loss: ~${sweatLoss} ml (${exMin} min). ${sweatLoss > 500 ? `Drink ${r0(sweatLoss * 1.5)} ml within 2 hours post-exercise (150% replacement rule). Add electrolytes for sessions >60 min.` : "Moderate — water alone sufficient."}`, priority: sweatLoss > 500 ? 'high' : 'low', category: "Exercise" },
        { title: "Electrolytes", description: `Sodium: ${sodiumNeed} mg, Potassium: ${potassiumNeed} mg. ${sweatLoss > 500 ? "High sweat loss — add electrolyte tablets or coconut water + pinch of salt." : "Normal food sources sufficient."}`, priority: sweatLoss > 500 ? 'high' : 'low', category: "Electrolytes" },
        { title: "Dehydration Risk", description: `Risk score: ${dehydrationScore}/12 — ${dehydRisk}. ${dehydStatus === 'danger' ? "HIGH RISK: hot climate + intense exercise + caffeine. Set hourly water reminders. Watch for headache, dizziness, dark urine." : "Manageable risk level."}`, priority: dehydStatus === 'danger' ? 'high' : 'low', category: "Risk" },
        { title: "Kidney Stone Prevention", description: `${ksStatus === 'good' ? "Above 2.5L threshold — good kidney stone protection." : `Below 2.5L threshold. Increase by ${r1((kidneyStoneThresh - adjustedTotal) / 1000)}L to reduce kidney stone risk by ~40%.`}`, priority: ksStatus === 'warning' ? 'high' : 'low', category: "Prevention" },
      ],
      detailedBreakdown: {
        "Total": `${adjustedTotal} ml (${liters} L)`, "Glasses": `${glasses}`,
        "Base": `${r0(w * 35)} ml`, "Activity Adj": `×${activityMult[activity] || 1.1}`,
        "Climate Adj": `×${climateMult[climate] || 1.0}`, "Sweat Loss": `${sweatLoss} ml`,
        "Caffeine Offset": `${caffeineOffset} ml`, "Per Hour": `${hourlyIntake} ml`,
        "Sodium": `${sodiumNeed} mg`, "Potassium": `${potassiumNeed} mg`,
        "Dehydration Score": `${dehydrationScore}/12`, "Urine": urineColor,
        "Kidney Stone": ksStatus === 'good' ? "Protected" : "At risk",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <SelectInput label="Activity Level" value={activity} onChange={setActivity} options={[{ value: "sedentary", label: "Sedentary" }, { value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }, { value: "veryActive", label: "Very Active" }]} />
      <SelectInput label="Climate" value={climate} onChange={setClimate} options={[{ value: "cold", label: "Cold" }, { value: "temperate", label: "Temperate" }, { value: "warm", label: "Warm" }, { value: "hot", label: "Hot" }, { value: "tropical", label: "Tropical" }]} />
      <NumInput label="Daily Caffeine" value={caffeineIntake} onChange={setCaffeineIntake} min={0} max={800} step={50} suffix="mg" />
      <NumInput label="Exercise Duration" value={exerciseMin} onChange={setExerciseMin} min={0} max={180} step={5} suffix="min" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Water Intake Calculator — Hydration Intelligence"
      description="Optimal hydration with sweat compensation, electrolyte needs, dehydration risk scoring, urine color prediction, and kidney stone prevention."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Water Intake Calculator" description="Hydration intelligence with sweat loss, electrolyte needs, and dehydration risk detection." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #6 — MEAL PLANNER CALCULATOR (AI Diet Architect) ====================
export function AdvancedMealPlannerCalculator() {
  const [calories, setCalories] = useState(2200)
  const [proteinPct, setProteinPct] = useState(30)
  const [meals, setMeals] = useState(4)
  const [cuisine, setCuisine] = useState("balanced")
  const [allergies, setAllergies] = useState("none")
  const [budget, setBudget] = useState("medium")
  const [goal, setGoal] = useState("maintenance")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cal = clamp(calories, 800, 6000)
    const pp = clamp(proteinPct, 15, 50)
    const m = clamp(meals, 2, 7)

    // Macro grams
    const proteinG = r0(cal * pp / 100 / 4)
    const fatPct = 25
    const fatG = r0(cal * fatPct / 100 / 9)
    const carbPct = 100 - pp - fatPct
    const carbG = r0(cal * carbPct / 100 / 4)

    // Per meal distribution (40/30/20/10 or equal split)
    const mealDistribution = m === 4
      ? [35, 25, 25, 15]
      : m === 3
        ? [35, 35, 30]
        : Array(m).fill(r0(100 / m))

    const mealCalories = mealDistribution.map(p => r0(cal * p / 100))
    const mealProtein = mealDistribution.map(p => r0(proteinG * p / 100))

    // Glycemic impact estimation
    let giImpact: string; let giStatus: 'good' | 'warning' | 'danger'
    if (carbPct > 55) { giImpact = "High carb — monitor GI of sources"; giStatus = 'warning' }
    else if (carbPct > 40) { giImpact = "Moderate — use complex carbs"; giStatus = 'good' }
    else { giImpact = "Low carb — minimal glycemic impact"; giStatus = 'good' }

    // Fiber adequacy (14g per 1000 kcal)
    const fiberTarget = r0(cal / 1000 * 14)
    const estimatedFiber = r0(carbG * 0.12) // ~12% of carbs as fiber
    const fiberAdequacy = estimatedFiber >= fiberTarget
    const fiberStatus: 'good' | 'warning' | 'danger' = fiberAdequacy ? 'good' : 'warning'

    // Insulin load per meal
    const avgInsulinLoad = r0((carbG / m * 1.0 + proteinG / m * 0.56) / m)

    // Nutrient density score
    let nutrientScore: number
    if (cuisine === "mediterranean") nutrientScore = 90
    else if (cuisine === "balanced") nutrientScore = 75
    else if (cuisine === "indian") nutrientScore = 72
    else if (cuisine === "asian") nutrientScore = 78
    else nutrientScore = 65
    if (allergies !== "none") nutrientScore -= 5
    if (budget === "low") nutrientScore -= 5

    // Budget multiplier for food cost
    const budgetMultiplier: Record<string, string> = { low: "₹150-250/day", medium: "₹250-450/day", high: "₹450-800/day" }
    const dailyCost = budgetMultiplier[budget] || "₹250-450/day"

    // Meal schedule
    const scheduleStart = 7 // 7 AM
    const interval = r0(14 / m) // across 14 waking hours
    const schedule = Array(m).fill(0).map((_, i) => {
      const hour = scheduleStart + i * interval
      return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    })

    // Completeness score
    const completeness = r0(
      (fiberAdequacy ? 25 : 10) +
      (proteinG > 70 ? 25 : 15) +
      (fatG > 40 ? 25 : 15) +
      (nutrientScore > 70 ? 25 : 15)
    )

    const score = completeness

    setResult({
      primaryMetric: { label: "Meal Plan", value: `${m} meals`, status: completeness >= 80 ? 'good' : 'warning', description: `${cal} kcal • P${proteinG}/C${carbG}/F${fatG}`, icon: Apple },
      healthScore: score,
      metrics: [
        { label: "Calories", value: `${cal} kcal`, status: 'good', icon: Flame },
        { label: "Meals", value: `${m}`, status: 'good', icon: Apple },
        { label: "Protein", value: `${proteinG}g (${pp}%)`, status: 'good', icon: Shield },
        { label: "Carbs", value: `${carbG}g (${carbPct}%)`, status: giStatus, icon: Zap },
        { label: "Fat", value: `${fatG}g (${fatPct}%)`, status: 'good', icon: Scale },
        { label: "Fiber Target", value: `${fiberTarget}g`, status: fiberStatus, icon: Apple },
        { label: "Est. Fiber", value: `${estimatedFiber}g`, status: fiberStatus, icon: BarChart3 },
        { label: "GI Impact", value: giImpact.split("—")[0].trim(), status: giStatus, icon: TrendingUp },
        { label: "Nutrient Score", value: `${nutrientScore}/100`, status: nutrientScore >= 70 ? 'good' : 'warning', icon: Heart },
        { label: "Daily Cost", value: dailyCost, status: 'good', icon: User },
        { label: "Completeness", value: `${completeness}/100`, status: completeness >= 80 ? 'good' : 'warning', icon: Activity },
        { label: "Cuisine", value: cuisine, status: 'good', icon: AlertTriangle },
      ],
      recommendations: [
        { title: "Meal Distribution", description: `${m} meals: ${mealDistribution.join('/')}% split. Calories: ${mealCalories.join(' / ')} kcal. Protein: ${mealProtein.join(' / ')}g. ${m >= 4 ? "Front-loaded pattern — more energy when active." : "Standard distribution."}`, priority: 'high', category: "Schedule" },
        { title: "Meal Timing", description: `Schedule: ${schedule.join(' → ')}. Spacing: ~${interval} hours. ${m >= 4 ? "Frequent meals keep blood sugar stable and reduce hunger." : "3-meal pattern — ensure adequate protein per meal."}`, priority: 'medium', category: "Timing" },
        { title: "Glycemic Control", description: `${giImpact}. ${giStatus === 'warning' ? "High carb proportion — prioritize whole grains, legumes, vegetables over refined carbs. Add protein + fat to each meal to blunt glucose spike." : "Carb level manageable."}`, priority: giStatus === 'warning' ? 'high' : 'low', category: "Glycemic" },
        { title: "Fiber Adequacy", description: `Target: ${fiberTarget}g (14g/1000 kcal). Estimated: ${estimatedFiber}g. ${!fiberAdequacy ? `Add ${fiberTarget - estimatedFiber}g more fiber — oats, beans, berries, vegetables.` : "Adequate fiber intake."}`, priority: !fiberAdequacy ? 'high' : 'low', category: "Fiber" },
        { title: "Budget & Cuisine", description: `${cuisine} cuisine at ${dailyCost}. Nutrient density: ${nutrientScore}/100. ${budget === "low" ? "Budget tips: bulk buy staples (rice, lentils, oats), seasonal produce, eggs as protein source." : "Budget allows for diverse nutrient-dense foods."}`, priority: 'low', category: "Practical" },
      ],
      detailedBreakdown: {
        "Calories": `${cal} kcal`, "Protein": `${proteinG}g (${pp}%)`, "Carbs": `${carbG}g (${carbPct}%)`, "Fat": `${fatG}g (${fatPct}%)`,
        "Meals": `${m}`, "Distribution": mealDistribution.join('/')+'%',
        "Meal Calories": mealCalories.join(' / '), "Meal Protein": mealProtein.join(' / ') + 'g',
        "Schedule": schedule.join(' → '),
        "Fiber Target": `${fiberTarget}g`, "Est. Fiber": `${estimatedFiber}g`,
        "GI Impact": giImpact, "Nutrient Score": `${nutrientScore}/100`,
        "Cuisine": cuisine, "Budget": dailyCost, "Allergies": allergies,
        "Completeness": `${completeness}/100`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Daily Calories" value={calories} onChange={setCalories} min={800} max={6000} step={50} suffix="kcal" />
      <NumInput label="Protein %" value={proteinPct} onChange={setProteinPct} min={15} max={50} step={5} suffix="%" />
      <NumInput label="Meals Per Day" value={meals} onChange={setMeals} min={2} max={7} step={1} suffix="meals" />
      <SelectInput label="Cuisine Preference" value={cuisine} onChange={setCuisine} options={[{ value: "balanced", label: "Balanced/Western" }, { value: "mediterranean", label: "Mediterranean" }, { value: "indian", label: "Indian" }, { value: "asian", label: "Asian" }, { value: "keto", label: "Keto" }]} />
      <SelectInput label="Allergies" value={allergies} onChange={setAllergies} options={[{ value: "none", label: "None" }, { value: "dairy", label: "Dairy-Free" }, { value: "gluten", label: "Gluten-Free" }, { value: "nuts", label: "Nut-Free" }, { value: "vegan", label: "Vegan" }]} />
      <SelectInput label="Budget" value={budget} onChange={setBudget} options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }]} />
      <SelectInput label="Goal" value={goal} onChange={setGoal} options={[{ value: "fatLoss", label: "Fat Loss" }, { value: "maintenance", label: "Maintenance" }, { value: "muscleGain", label: "Muscle Gain" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Meal Planner Calculator — AI Diet Architect"
      description="Convert macro targets into structured meal plans with timing, glycemic control, fiber adequacy, nutrient density scoring, and budget optimization."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Meal Planner Calculator" description="AI diet architect with meal distribution, glycemic impact, and nutrient density scoring." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #7 — GLYCEMIC INDEX (GI) CALCULATOR ====================
export function AdvancedGlycemicIndexCalculator() {
  const [giValue, setGiValue] = useState(55)
  const [carbGrams, setCarbGrams] = useState(40)
  const [fiberGrams, setFiberGrams] = useState(5)
  const [cookingMethod, setCookingMethod] = useState("boiled")
  const [mealProtein, setMealProtein] = useState(20)
  const [mealFat, setMealFat] = useState(10)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const gi = clamp(giValue, 0, 120)
    const carbs = clamp(carbGrams, 0, 300)
    const fiber = clamp(fiberGrams, 0, 40)
    const protein = clamp(mealProtein, 0, 100)
    const fat = clamp(mealFat, 0, 80)

    // GI Category
    let giCategory: string; let giStatus: 'good' | 'warning' | 'danger'
    if (gi <= 55) { giCategory = "Low GI"; giStatus = 'good' }
    else if (gi <= 69) { giCategory = "Medium GI"; giStatus = 'warning' }
    else { giCategory = "High GI"; giStatus = 'danger' }

    // Cooking method adjustment
    const cookingAdj: Record<string, number> = { raw: -5, boiled: 0, steamed: -2, baked: 5, fried: 8, microwaved: 3, pressure: 10 }
    const adjustedGI = clamp(r0(gi + (cookingAdj[cookingMethod] || 0)), 0, 120)

    let adjCategory: string; let adjStatus: 'good' | 'warning' | 'danger'
    if (adjustedGI <= 55) { adjCategory = "Low GI"; adjStatus = 'good' }
    else if (adjustedGI <= 69) { adjCategory = "Medium GI"; adjStatus = 'warning' }
    else { adjCategory = "High GI"; adjStatus = 'danger' }

    // Glycemic Load
    const gl = r1(adjustedGI * carbs / 100)
    let glCategory: string; let glStatus: 'good' | 'warning' | 'danger'
    if (gl <= 10) { glCategory = "Low GL"; glStatus = 'good' }
    else if (gl <= 19) { glCategory = "Medium GL"; glStatus = 'warning' }
    else { glCategory = "High GL"; glStatus = 'danger' }

    // Fiber adjustment (each gram of fiber reduces effective GI by ~1-2 points)
    const fiberAdjGI = r0(Math.max(0, adjustedGI - fiber * 1.5))

    // Meal context impact (protein and fat slow digestion)
    const mealContextReduction = r0(protein * 0.3 + fat * 0.5)
    const effectiveGI = r0(Math.max(0, fiberAdjGI - mealContextReduction))

    // Insulin response prediction
    const insulinIndex = r0(effectiveGI * 0.8 + protein * 0.56)
    let insulinResp: string; let insulinStatus: 'good' | 'warning' | 'danger'
    if (insulinIndex < 40) { insulinResp = "Low insulin response"; insulinStatus = 'good' }
    else if (insulinIndex < 70) { insulinResp = "Moderate insulin response"; insulinStatus = 'warning' }
    else { insulinResp = "High insulin response"; insulinStatus = 'danger' }

    // Blood sugar peak prediction (minutes)
    const peakTime = r0(30 + (fiber * 2) + (fat * 1) + (protein * 0.5))

    // Net carbs
    const netCarbs = r0(Math.max(0, carbs - fiber))

    // Diabetes-friendly score
    const diabetesScore = r0(100 - (effectiveGI * 0.5 + gl * 1.5))
    const diabetesStatus: 'good' | 'warning' | 'danger' = diabetesScore >= 60 ? 'good' : diabetesScore >= 40 ? 'warning' : 'danger'

    const score = adjStatus === 'good' ? 85 : adjStatus === 'warning' ? 60 : 30

    setResult({
      primaryMetric: { label: "Effective GI", value: effectiveGI, status: effectiveGI <= 55 ? 'good' : effectiveGI <= 69 ? 'warning' : 'danger', description: `${adjCategory} (cooking-adjusted: ${adjustedGI})`, icon: BarChart3 },
      healthScore: score,
      metrics: [
        { label: "Raw GI", value: `${gi}`, status: giStatus, icon: BarChart3 },
        { label: "Cooking Adj GI", value: `${adjustedGI}`, status: adjStatus, icon: Flame },
        { label: "Effective GI", value: `${effectiveGI}`, status: effectiveGI <= 55 ? 'good' : effectiveGI <= 69 ? 'warning' : 'danger', icon: TrendingUp },
        { label: "GI Category", value: adjCategory, status: adjStatus, icon: Activity },
        { label: "Glycemic Load", value: `${gl}`, status: glStatus, icon: Zap },
        { label: "GL Category", value: glCategory, status: glStatus, icon: Scale },
        { label: "Net Carbs", value: `${netCarbs}g`, status: 'good', icon: Apple },
        { label: "Insulin Response", value: insulinResp.split(" ")[0], status: insulinStatus, icon: Heart },
        { label: "Insulin Index", value: `${insulinIndex}`, status: insulinStatus, icon: Shield },
        { label: "Peak BG Time", value: `~${peakTime} min`, status: 'good', icon: AlertTriangle },
        { label: "Diabetes Score", value: `${diabetesScore}/100`, status: diabetesStatus, icon: User },
        { label: "Fiber Reduction", value: `−${r0(fiber * 1.5)} GI pts`, status: 'good', icon: Apple },
      ],
      recommendations: [
        { title: "Glycemic Index Analysis", description: `Raw GI: ${gi} (${giCategory}). After cooking (${cookingMethod}): ${adjustedGI} (${adjCategory}). Effective GI in meal context: ${effectiveGI}. ${cookingAdj[cookingMethod] > 0 ? `${cookingMethod} increases GI by +${cookingAdj[cookingMethod]} points. Consider boiling or steaming.` : "Good cooking method choice for GI control."}`, priority: adjStatus === 'danger' ? 'high' : 'medium', category: "GI" },
        { title: "Glycemic Load", description: `GL: ${gl} (${glCategory}). GL = GI × carbs / 100. More useful than GI alone as it accounts for portion size. ${glStatus === 'danger' ? "High GL — reduce portion or choose lower GI alternative." : "GL within acceptable range."}`, priority: glStatus === 'danger' ? 'high' : 'medium', category: "GL" },
        { title: "Meal Context Effect", description: `Adding ${protein}g protein + ${fat}g fat reduces effective GI by ~${mealContextReduction} points. ${fiber}g fiber reduces by ~${r0(fiber * 1.5)} points. Always pair high-GI foods with protein/fat/fiber to flatten glucose curve.`, priority: 'medium', category: "Strategy" },
        { title: "Insulin Response", description: `Predicted insulin index: ${insulinIndex}. ${insulinResp}. Peak blood glucose at ~${peakTime} minutes post-meal. ${insulinStatus === 'danger' ? "High insulin — risk of energy crash ~2 hours later. Add fiber, reduce portion." : "Manageable insulin response."}`, priority: insulinStatus === 'danger' ? 'high' : 'low', category: "Insulin" },
        { title: "Diabetes-Friendly Score", description: `Score: ${diabetesScore}/100. ${diabetesStatus === 'danger' ? "Not recommended for diabetics without modification. Reduce carbs or choose lower GI source." : diabetesStatus === 'warning' ? "Acceptable with caution. Monitor blood glucose." : "Diabetes-friendly meal composition."}`, priority: diabetesStatus === 'danger' ? 'high' : 'low', category: "Diabetes" },
      ],
      detailedBreakdown: {
        "Raw GI": `${gi}`, "Cooking Method": cookingMethod, "Cooking Adj": `${cookingAdj[cookingMethod] || 0}`,
        "Adjusted GI": `${adjustedGI}`, "Fiber Adj": `−${r0(fiber * 1.5)}`,
        "Meal Context Adj": `−${mealContextReduction}`, "Effective GI": `${effectiveGI}`,
        "Carbs": `${carbs}g`, "Fiber": `${fiber}g`, "Net Carbs": `${netCarbs}g`,
        "GL": `${gl}`, "GL Category": glCategory,
        "Insulin Index": `${insulinIndex}`, "Insulin Response": insulinResp,
        "Peak Time": `${peakTime} min`, "Diabetes Score": `${diabetesScore}/100`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Glycemic Index (GI)" value={giValue} onChange={setGiValue} min={0} max={120} step={1} suffix="GI" />
      <NumInput label="Carbohydrates" value={carbGrams} onChange={setCarbGrams} min={0} max={300} step={5} suffix="g" />
      <NumInput label="Fiber" value={fiberGrams} onChange={setFiberGrams} min={0} max={40} step={1} suffix="g" />
      <SelectInput label="Cooking Method" value={cookingMethod} onChange={setCookingMethod} options={[{ value: "raw", label: "Raw" }, { value: "boiled", label: "Boiled" }, { value: "steamed", label: "Steamed" }, { value: "baked", label: "Baked" }, { value: "fried", label: "Fried" }, { value: "microwaved", label: "Microwaved" }, { value: "pressure", label: "Pressure Cooked" }]} />
      <NumInput label="Meal Protein" value={mealProtein} onChange={setMealProtein} min={0} max={100} suffix="g" />
      <NumInput label="Meal Fat" value={mealFat} onChange={setMealFat} min={0} max={80} suffix="g" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Glycemic Index (GI) Calculator"
      description="Analyze food GI with cooking method adjustment, fiber impact, meal context modifiers, insulin response prediction, and diabetes-friendly scoring."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Glycemic Index Calculator" description="GI analysis with cooking adjustments, insulin prediction, and diabetes-friendly scoring." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #8 — GLYCEMIC LOAD (GL) CALCULATOR ====================
export function AdvancedGlycemicLoadCalculator() {
  const [giValue, setGiValue] = useState(55)
  const [carbsPerServing, setCarbsPerServing] = useState(30)
  const [servings, setServings] = useState(1)
  const [mealsToday, setMealsToday] = useState(4)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const gi = clamp(giValue, 0, 120)
    const carbs = clamp(carbsPerServing, 0, 200)
    const serv = clamp(servings, 0.5, 5)
    const meals = clamp(mealsToday, 1, 7)

    const totalCarbs = r0(carbs * serv)

    // GL = (GI × carbs per serving) / 100
    const glPerServing = r1(gi * carbs / 100)
    const glTotal = r1(gi * totalCarbs / 100)

    // GL Category
    let glCategory: string; let glStatus: 'good' | 'warning' | 'danger'
    if (glTotal <= 10) { glCategory = "Low GL"; glStatus = 'good' }
    else if (glTotal <= 19) { glCategory = "Medium GL"; glStatus = 'warning' }
    else { glCategory = "High GL"; glStatus = 'danger' }

    // Insulin load estimate
    const insulinLoad = r0(glTotal * 1.2 + totalCarbs * 0.3)

    // Daily GL budget (recommended: <80)
    const dailyGLBudget = 80
    const glAsPercentOfBudget = r0(glTotal / dailyGLBudget * 100)
    const remainingGL = r1(Math.max(0, dailyGLBudget - glTotal))

    // Meal cumulative GL estimate
    const avgGLPerMeal = r1(dailyGLBudget / meals)
    const overBudget = glTotal > avgGLPerMeal

    // Blood sugar impact timing
    const peakRise = gi > 70 ? "15-30 min" : gi > 55 ? "30-45 min" : "45-60 min"
    const duration = gi > 70 ? "~2 hours" : gi > 55 ? "~3 hours" : "~4 hours"

    // Prediabetes risk modeling
    let prediabetesRisk: string; let pdStatus: 'good' | 'warning' | 'danger'
    if (glTotal > 25 && gi > 70) { prediabetesRisk = "High daily GL pattern — prediabetes risk"; pdStatus = 'danger' }
    else if (glTotal > 19 || gi > 70) { prediabetesRisk = "Moderate — watch cumulative daily GL"; pdStatus = 'warning' }
    else { prediabetesRisk = "Low risk — good glycemic control"; pdStatus = 'good' }

    // Portion optimization
    const optimalCarbs = gi > 0 ? r0(10 / gi * 100) : 0 // carbs needed for GL ≤ 10
    const portionAdvice = totalCarbs > optimalCarbs && gi > 55
      ? `Reduce to ${optimalCarbs}g carbs for low GL.`
      : "Current portion is GL-friendly."

    const score = glStatus === 'good' ? 90 : glStatus === 'warning' ? 60 : 25

    setResult({
      primaryMetric: { label: "Glycemic Load", value: glTotal, status: glStatus, description: glCategory, icon: Zap },
      healthScore: score,
      metrics: [
        { label: "GL (Total)", value: `${glTotal}`, status: glStatus, icon: Zap },
        { label: "GL (Per Serving)", value: `${glPerServing}`, status: glPerServing <= 10 ? 'good' : 'warning', icon: BarChart3 },
        { label: "GL Category", value: glCategory, status: glStatus, icon: Activity },
        { label: "GI", value: `${gi}`, status: gi <= 55 ? 'good' : gi <= 69 ? 'warning' : 'danger', icon: TrendingUp },
        { label: "Total Carbs", value: `${totalCarbs}g`, status: 'good', icon: Apple },
        { label: "Insulin Load", value: `${insulinLoad}`, status: insulinLoad < 50 ? 'good' : 'warning', icon: Heart },
        { label: "GL Budget Used", value: `${glAsPercentOfBudget}%`, status: glAsPercentOfBudget <= 25 ? 'good' : glAsPercentOfBudget <= 40 ? 'warning' : 'danger', icon: Scale },
        { label: "Remaining GL", value: `${remainingGL}`, status: remainingGL > 40 ? 'good' : 'warning', icon: Shield },
        { label: "Peak Rise", value: peakRise, status: gi > 70 ? 'danger' : 'good', icon: AlertTriangle },
        { label: "BG Duration", value: duration, status: 'good', icon: Flame },
        { label: "Prediabetes", value: prediabetesRisk.split("—")[0].trim(), status: pdStatus, icon: User },
      ],
      recommendations: [
        { title: "Glycemic Load Result", description: `GL = ${glTotal} (${glCategory}). Formula: (GI ${gi} × carbs ${totalCarbs}g) / 100. Per serving: ${glPerServing}. ${serv > 1 ? `${serv} servings multiplied the impact.` : ""} Low ≤10, Medium 11-19, High ≥20.`, priority: glStatus === 'danger' ? 'high' : 'medium', category: "GL" },
        { title: "Daily GL Budget", description: `This food uses ${glAsPercentOfBudget}% of daily GL budget (80). Remaining: ${remainingGL} GL. Average per meal (${meals} meals): ${avgGLPerMeal} GL. ${overBudget ? "OVER per-meal average — compensate with low-GL other meals." : "Within per-meal budget."}`, priority: overBudget ? 'high' : 'low', category: "Budget" },
        { title: "Blood Sugar Impact", description: `Peak blood glucose rise: ${peakRise}. Elevated BG duration: ${duration}. ${gi > 70 ? "Rapid spike — pair with protein/fat to slow absorption." : "Gradual rise — well-controlled glycemic response."}`, priority: gi > 70 ? 'high' : 'low', category: "Timing" },
        { title: "Portion Optimization", description: `${portionAdvice} ${totalCarbs > optimalCarbs && gi > 55 ? `Current: ${totalCarbs}g → Target: ${optimalCarbs}g carbs for optimal GL ≤10.` : ""}`, priority: totalCarbs > optimalCarbs && gi > 55 ? 'high' : 'low', category: "Portion" },
        { title: "Prediabetes Risk", description: `${prediabetesRisk}. ${pdStatus === 'danger' ? "Chronic high GL meals increase fasting glucose and HbA1c over time. Reduce refined carbs, increase fiber, choose low-GI alternatives." : "Glycemic control within safe bounds."}`, priority: pdStatus === 'danger' ? 'high' : 'low', category: "Risk" },
      ],
      detailedBreakdown: {
        "GI": `${gi}`, "Carbs/Serving": `${carbs}g`, "Servings": `${serv}`,
        "Total Carbs": `${totalCarbs}g`, "GL/Serving": `${glPerServing}`, "GL Total": `${glTotal}`,
        "GL Category": glCategory, "Insulin Load": `${insulinLoad}`,
        "Daily GL Budget": `${dailyGLBudget}`, "Used": `${glAsPercentOfBudget}%`, "Remaining": `${remainingGL}`,
        "Peak Rise": peakRise, "Duration": duration,
        "Avg GL/Meal": `${avgGLPerMeal}`, "Over Budget": overBudget ? "Yes" : "No",
        "Optimal Carbs for Low GL": `${optimalCarbs}g`, "Prediabetes": prediabetesRisk,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Glycemic Index (GI)" value={giValue} onChange={setGiValue} min={0} max={120} step={1} suffix="GI" />
      <NumInput label="Carbs Per Serving" value={carbsPerServing} onChange={setCarbsPerServing} min={0} max={200} step={5} suffix="g" />
      <NumInput label="Number of Servings" value={servings} onChange={setServings} min={0.5} max={5} step={0.5} suffix="servings" />
      <NumInput label="Meals Today" value={mealsToday} onChange={setMealsToday} min={1} max={7} step={1} suffix="meals" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Glycemic Load (GL) Calculator"
      description="Calculate real glycemic impact with daily GL budgeting, insulin load estimation, blood sugar timing, portion optimization, and prediabetes risk modeling."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Glycemic Load Calculator" description="Glycemic load with daily budgeting, insulin estimation, and prediabetes risk modeling." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #9 — FIBER INTAKE CALCULATOR ====================
export function AdvancedFiberIntakeCalculator() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [calories, setCalories] = useState(2200)
  const [currentFiber, setCurrentFiber] = useState(18)
  const [digestiveIssues, setDigestiveIssues] = useState("none")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 15, 90)
    const cal = clamp(calories, 800, 6000)
    const cf = clamp(currentFiber, 0, 80)

    // Target: 14g per 1000 kcal (Institute of Medicine)
    const iomTarget = r0(cal / 1000 * 14)
    // WHO target: 25-30g absolute
    const whoTarget = gender === "male" ? 30 : 25
    // Use higher of the two
    const target = Math.max(iomTarget, whoTarget)

    // Adequacy percentage
    const adequacy = r0(cf / target * 100)
    let adequacyClass: string; let adequacyStatus: 'good' | 'warning' | 'danger'
    if (adequacy >= 100) { adequacyClass = "Meets target"; adequacyStatus = 'good' }
    else if (adequacy >= 70) { adequacyClass = "Close to target"; adequacyStatus = 'warning' }
    else { adequacyClass = "Deficient"; adequacyStatus = 'danger' }

    // Soluble vs Insoluble ratio (ideal: 25/75 to 30/70)
    const solubleTarget = r0(target * 0.3)
    const insolubleTarget = r0(target * 0.7)

    // SCFA production estimate (Short Chain Fatty Acids)
    const scfaProduction = r1(cf * 0.6) // ~60% fermented
    let scfaClass: string; let scfaStatus: 'good' | 'warning' | 'danger'
    if (scfaProduction > 15) { scfaClass = "Excellent gut health support"; scfaStatus = 'good' }
    else if (scfaProduction > 8) { scfaClass = "Good SCFA production"; scfaStatus = 'good' }
    else { scfaClass = "Low — microbiome may suffer"; scfaStatus = 'warning' }

    // Gut microbiome diversity score estimate
    const microbiomeScore = r0(Math.min(100, cf * 3 + (cf > 25 ? 20 : 0)))

    // Constipation risk
    let constipationRisk: string; let constStatus: 'good' | 'warning' | 'danger'
    if (cf < 15 && digestiveIssues !== "none") { constipationRisk = "High — increase fiber gradually"; constStatus = 'danger' }
    else if (cf < 20) { constipationRisk = "Moderate"; constStatus = 'warning' }
    else { constipationRisk = "Low"; constStatus = 'good' }

    // Cholesterol lowering estimate (soluble fiber: ~2% per 3g increase)
    const solubleEstimate = r0(cf * 0.3)
    const cholesterolReduction = r1(solubleEstimate / 3 * 2)

    // IBS management
    let ibsNote: string
    if (digestiveIssues === "ibs") ibsNote = "IBS detected — focus on soluble fiber (oats, psyllium). Limit insoluble (bran, raw veg) initially."
    else if (digestiveIssues === "bloating") ibsNote = "Bloating — increase fiber slowly (2-3g/week). Ensure adequate water."
    else ibsNote = "No digestive issues — standard fiber recommendations apply."

    // Gap analysis
    const gap = r0(Math.max(0, target - cf))

    const score = adequacyStatus === 'good' ? 90 : adequacyStatus === 'warning' ? 60 : 30

    setResult({
      primaryMetric: { label: "Fiber Adequacy", value: adequacy, unit: "%", status: adequacyStatus, description: `${cf}g / ${target}g target`, icon: Apple },
      healthScore: score,
      metrics: [
        { label: "Current Fiber", value: `${cf}g`, status: adequacyStatus, icon: Apple },
        { label: "Target", value: `${target}g`, status: 'good', icon: BarChart3 },
        { label: "Adequacy", value: `${adequacy}%`, status: adequacyStatus, icon: Activity },
        { label: "Gap", value: `${gap}g`, status: gap === 0 ? 'good' : 'warning', icon: AlertTriangle },
        { label: "Soluble Target", value: `${solubleTarget}g`, status: 'good', icon: Droplets },
        { label: "Insoluble Target", value: `${insolubleTarget}g`, status: 'good', icon: Shield },
        { label: "SCFA Production", value: `${scfaProduction}g`, status: scfaStatus, icon: Heart },
        { label: "Microbiome", value: `${microbiomeScore}/100`, status: microbiomeScore >= 60 ? 'good' : 'warning', icon: Zap },
        { label: "Constipation", value: constipationRisk, status: constStatus, icon: User },
        { label: "Cholesterol ↓", value: `~${cholesterolReduction}%`, status: 'good', icon: TrendingUp },
      ],
      recommendations: [
        { title: "Fiber Intake Assessment", description: `Current: ${cf}g vs target ${target}g (${adequacy}%). ${gap > 0 ? `Need ${gap}g more daily. Top sources: lentils (8g/cup), oats (4g/cup), chia seeds (10g/oz), avocado (10g).` : "Meeting target — excellent!"} IoM: ${iomTarget}g, WHO: ${whoTarget}g.`, priority: adequacyStatus === 'danger' ? 'high' : 'medium', category: "Intake" },
        { title: "Soluble vs Insoluble", description: `Aim for ~30% soluble (${solubleTarget}g) and ~70% insoluble (${insolubleTarget}g). Soluble (oats, beans, psyllium) — lowers cholesterol, feeds gut bacteria. Insoluble (bran, raw veg) — promotes regularity.`, priority: 'medium', category: "Types" },
        { title: "Gut Microbiome Health", description: `SCFA production: ~${scfaProduction}g/day. ${scfaClass}. Microbiome diversity score: ${microbiomeScore}/100. SCFAs (butyrate, propionate, acetate) nourish colon cells and reduce inflammation.`, priority: scfaStatus === 'warning' ? 'high' : 'low', category: "Microbiome" },
        { title: "Cholesterol Impact", description: `Estimated soluble fiber: ${solubleEstimate}g → ~${cholesterolReduction}% LDL cholesterol reduction. Each 3g soluble fiber reduces LDL by ~2%. Psyllium husk is the most effective source.`, priority: 'medium', category: "Cardiovascular" },
        { title: "Digestive Considerations", description: `${ibsNote} ${gap > 10 ? "IMPORTANT: increase fiber gradually — max 3-5g per week to avoid bloating. Drink extra water with increased fiber." : ""}`, priority: digestiveIssues !== "none" ? 'high' : 'low', category: "Digestion" },
      ],
      detailedBreakdown: {
        "Current Fiber": `${cf}g`, "Target": `${target}g`, "Adequacy": `${adequacy}%`,
        "Gap": `${gap}g`, "IoM Target": `${iomTarget}g`, "WHO Target": `${whoTarget}g`,
        "Soluble Target": `${solubleTarget}g`, "Insoluble Target": `${insolubleTarget}g`,
        "SCFA Estimate": `${scfaProduction}g`, "Microbiome Score": `${microbiomeScore}/100`,
        "Constipation Risk": constipationRisk, "Cholesterol Reduction": `~${cholesterolReduction}%`,
        "Digestive Issue": digestiveIssues, "Note": ibsNote,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <NumInput label="Daily Calories" value={calories} onChange={setCalories} min={800} max={6000} step={100} suffix="kcal" />
      <NumInput label="Current Fiber Intake" value={currentFiber} onChange={setCurrentFiber} min={0} max={80} step={1} suffix="g/day" />
      <SelectInput label="Digestive Issues" value={digestiveIssues} onChange={setDigestiveIssues} options={[{ value: "none", label: "None" }, { value: "ibs", label: "IBS" }, { value: "bloating", label: "Bloating/Gas" }, { value: "constipation", label: "Constipation" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Fiber Intake Calculator"
      description="Optimize gut health with fiber adequacy scoring, soluble/insoluble ratios, SCFA production, microbiome diversity, and cholesterol reduction estimates."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Fiber Intake Calculator" description="Fiber analysis with SCFA production, microbiome scoring, and IBS-safe recommendations." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #10 — SUGAR INTAKE CALCULATOR ====================
export function AdvancedSugarIntakeCalculator() {
  const [addedSugar, setAddedSugar] = useState(40)
  const [beverageSugar, setBeverageSugar] = useState(20)
  const [calories, setCalories] = useState(2200)
  const [age, setAge] = useState(30)
  const [weight, setWeight] = useState(72)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const as = clamp(addedSugar, 0, 200)
    const bs = clamp(beverageSugar, 0, 150)
    const cal = clamp(calories, 800, 6000)
    const a = clamp(age, 15, 90)
    const w = clamp(weight, 30, 300)

    const totalSugar = as + bs
    const sugarCalories = totalSugar * 4
    const sugarPctCalories = r1(sugarCalories / cal * 100)

    // WHO recommendation: <10% ideally <5%
    const whoLimit = r0(cal * 0.10 / 4) // grams for 10%
    const whoIdeal = r0(cal * 0.05 / 4) // grams for 5%
    const ahaLimit = gender === "male" ? 36 : 25 // AHA grams

    // Classification
    let sugarClass: string; let sugarStatus: 'good' | 'warning' | 'danger'
    if (totalSugar <= whoIdeal) { sugarClass = "Optimal — below 5% of calories"; sugarStatus = 'good' }
    else if (totalSugar <= whoLimit) { sugarClass = "Acceptable — within WHO 10%"; sugarStatus = 'warning' }
    else { sugarClass = "Excessive — above WHO limit"; sugarStatus = 'danger' }

    // NAFLD risk (Non-Alcoholic Fatty Liver)
    let nafldRisk: string; let nafldStatus: 'good' | 'warning' | 'danger'
    if (totalSugar > 60 && bs > 30) { nafldRisk = "High NAFLD risk — fructose overload"; nafldStatus = 'danger' }
    else if (totalSugar > 40) { nafldRisk = "Moderate NAFLD risk"; nafldStatus = 'warning' }
    else { nafldRisk = "Low hepatic fat risk"; nafldStatus = 'good' }

    // Insulin resistance prediction
    const irScore = r0(totalSugar * 0.8 + bs * 0.5 + (a > 40 ? 10 : 0))
    let irClass: string; let irStatus: 'good' | 'warning' | 'danger'
    if (irScore > 80) { irClass = "High insulin resistance risk"; irStatus = 'danger' }
    else if (irScore > 50) { irClass = "Moderate IR risk"; irStatus = 'warning' }
    else { irClass = "Low IR risk"; irStatus = 'good' }

    // Beverage vs food sugar analysis
    const bevPct = totalSugar > 0 ? r0(bs / totalSugar * 100) : 0

    // Hidden sugar estimate (processed foods add ~15-20g)
    const hiddenEstimate = r0(totalSugar * 0.3)

    // Weight impact per month (excess sugar → fat)
    const excessSugar = Math.max(0, totalSugar - whoIdeal)
    const monthlyFatGain = r2(excessSugar * 4 * 30 / 7700) // kg fat from excess per month

    // Teaspoon equivalent
    const teaspoons = r1(totalSugar / 4)

    const score = sugarStatus === 'good' ? 90 : sugarStatus === 'warning' ? 55 : 20

    setResult({
      primaryMetric: { label: "Added Sugar", value: totalSugar, unit: "g/day", status: sugarStatus, description: sugarClass, icon: AlertTriangle },
      healthScore: score,
      metrics: [
        { label: "Total Sugar", value: `${totalSugar}g`, status: sugarStatus, icon: AlertTriangle },
        { label: "Teaspoons", value: `${teaspoons} tsp`, status: sugarStatus, icon: Scale },
        { label: "% of Calories", value: `${sugarPctCalories}%`, status: sugarPctCalories <= 5 ? 'good' : sugarPctCalories <= 10 ? 'warning' : 'danger', icon: BarChart3 },
        { label: "WHO Limit", value: `${whoLimit}g (10%)`, status: totalSugar <= whoLimit ? 'good' : 'danger', icon: Shield },
        { label: "AHA Limit", value: `${ahaLimit}g`, status: totalSugar <= ahaLimit ? 'good' : 'danger', icon: Heart },
        { label: "Beverage Sugar", value: `${bs}g (${bevPct}%)`, status: bs > 25 ? 'danger' : 'good', icon: Droplets },
        { label: "NAFLD Risk", value: nafldRisk.split("—")[0].trim(), status: nafldStatus, icon: User },
        { label: "IR Risk", value: irClass.split(" ")[0], status: irStatus, icon: Zap },
        { label: "Hidden Sugar", value: `~${hiddenEstimate}g`, status: 'warning', icon: Apple },
        { label: "Monthly Fat", value: `+${monthlyFatGain} kg`, status: monthlyFatGain > 0.5 ? 'danger' : monthlyFatGain > 0 ? 'warning' : 'good', icon: TrendingUp },
      ],
      recommendations: [
        { title: "Sugar Assessment", description: `Total added sugar: ${totalSugar}g (${teaspoons} teaspoons, ${sugarPctCalories}% of calories). ${sugarClass}. WHO recommends <${whoLimit}g (10%), ideally <${whoIdeal}g (5%). AHA: <${ahaLimit}g.`, priority: sugarStatus === 'danger' ? 'high' : 'medium', category: "Intake" },
        { title: "Beverage Sugar Analysis", description: `Beverage sugar: ${bs}g (${bevPct}% of total). ${bs > 25 ? "Liquid sugar is the most dangerous — no fiber, rapid absorption, bypasses satiety. Switch to water, unsweetened tea, or zero-cal alternatives." : "Beverage sugar within acceptable range."}`, priority: bs > 25 ? 'high' : 'low', category: "Beverages" },
        { title: "NAFLD Prevention", description: `${nafldRisk}. ${nafldStatus === 'danger' ? "High fructose (especially from beverages) directly converted to liver fat. Reduce sugary drinks to zero. Limit fruit juice." : "Liver fat risk manageable at current intake."}`, priority: nafldStatus === 'danger' ? 'high' : 'low', category: "Liver" },
        { title: "Insulin Resistance", description: `IR score: ${irScore}. ${irClass}. ${irStatus === 'danger' ? "Chronic high sugar → pancreatic β-cell exhaustion → Type 2 Diabetes. Check HbA1c and fasting insulin." : "Current sugar load manageable for insulin system."}`, priority: irStatus === 'danger' ? 'high' : 'medium', category: "Metabolic" },
        { title: "Weight Impact", description: `Excess sugar: ${excessSugar}g/day → ~${monthlyFatGain} kg fat gain/month (${r1(monthlyFatGain * 12)} kg/year). ${monthlyFatGain > 0.3 ? "Significant body composition impact. Eliminating sugary drinks alone could prevent this." : "Minimal weight impact from sugar."}`, priority: monthlyFatGain > 0.3 ? 'high' : 'low', category: "Weight" },
      ],
      detailedBreakdown: {
        "Food Sugar": `${as}g`, "Beverage Sugar": `${bs}g`, "Total": `${totalSugar}g`,
        "Teaspoons": `${teaspoons}`, "Sugar Calories": `${sugarCalories} kcal`,
        "% of Calories": `${sugarPctCalories}%`, "WHO 10%": `${whoLimit}g`, "WHO 5%": `${whoIdeal}g`,
        "AHA Limit": `${ahaLimit}g`, "Beverage %": `${bevPct}%`,
        "Hidden Estimate": `~${hiddenEstimate}g`, "NAFLD Risk": nafldRisk,
        "IR Score": `${irScore}`, "IR Class": irClass,
        "Monthly Fat": `+${monthlyFatGain} kg`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Added Sugar (food)" value={addedSugar} onChange={setAddedSugar} min={0} max={200} step={5} suffix="g" />
      <NumInput label="Beverage Sugar" value={beverageSugar} onChange={setBeverageSugar} min={0} max={150} step={5} suffix="g" />
      <NumInput label="Daily Calories" value={calories} onChange={setCalories} min={800} max={6000} step={100} suffix="kcal" />
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="yrs" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Sugar Intake Calculator"
      description="Assess added sugar impact with NAFLD risk, insulin resistance prediction, beverage analysis, hidden sugar detection, and weight gain projection."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Sugar Intake Calculator" description="Sugar analysis with NAFLD risk, insulin resistance prediction, and fatty liver prevention." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}

// ==================== #11 — SODIUM INTAKE CALCULATOR ====================
export function AdvancedSodiumIntakeCalculator() {
  const [processedFood, setProcessedFood] = useState(3)
  const [addedSalt, setAddedSalt] = useState(3)
  const [bpSystolic, setBpSystolic] = useState(120)
  const [bpDiastolic, setBpDiastolic] = useState(80)
  const [age, setAge] = useState(30)
  const [weight, setWeight] = useState(72)
  const [exerciseMin, setExerciseMin] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const pf = clamp(processedFood, 0, 10) // servings
    const as = clamp(addedSalt, 0, 15) // grams
    const sys = clamp(bpSystolic, 80, 200)
    const dia = clamp(bpDiastolic, 50, 130)
    const a = clamp(age, 15, 90)
    const w = clamp(weight, 30, 300)
    const exMin = clamp(exerciseMin, 0, 180)

    // Sodium estimation
    const processedSodium = r0(pf * 500) // ~500mg per processed food serving
    const addedSaltSodium = r0(as * 400) // 1g salt = ~400mg sodium
    const totalSodium = processedSodium + addedSaltSodium

    // WHO limit: 2000mg, AHA ideal: 1500mg
    const whoLimit = 2000
    const ahaIdeal = 1500

    let sodiumClass: string; let sodiumStatus: 'good' | 'warning' | 'danger'
    if (totalSodium <= ahaIdeal) { sodiumClass = "Optimal — below AHA ideal"; sodiumStatus = 'good' }
    else if (totalSodium <= whoLimit) { sodiumClass = "Acceptable — within WHO limit"; sodiumStatus = 'warning' }
    else { sodiumClass = "Excessive — above WHO limit"; sodiumStatus = 'danger' }

    // Blood pressure classification
    let bpClass: string; let bpStatus: 'good' | 'warning' | 'danger'
    if (sys < 120 && dia < 80) { bpClass = "Normal"; bpStatus = 'good' }
    else if (sys < 130 && dia < 85) { bpClass = "Elevated"; bpStatus = 'warning' }
    else if (sys < 140 || dia < 90) { bpClass = "Stage 1 Hypertension"; bpStatus = 'warning' }
    else { bpClass = "Stage 2 Hypertension"; bpStatus = 'danger' }

    // BP impact prediction (reducing 1000mg sodium → ~5mmHg systolic drop)
    const excessSodium = Math.max(0, totalSodium - ahaIdeal)
    const bpImpact = r1(excessSodium / 1000 * 5)
    const projectedSys = r0(sys - bpImpact)

    // Fluid retention estimate
    const fluidRetention = r0(excessSodium / 1000 * 350) // ~350ml per 1000mg excess
    let fluidClass: string; let fluidStatus: 'good' | 'warning' | 'danger'
    if (fluidRetention > 700) { fluidClass = "Significant fluid retention"; fluidStatus = 'danger' }
    else if (fluidRetention > 300) { fluidClass = "Mild fluid retention"; fluidStatus = 'warning' }
    else { fluidClass = "Minimal"; fluidStatus = 'good' }

    // Hypertension risk score
    let htRisk = 0
    if (totalSodium > 3000) htRisk += 4
    else if (totalSodium > 2000) htRisk += 2
    if (sys > 130) htRisk += 3
    if (a > 50) htRisk += 2
    if (w > 90) htRisk += 2
    if (exMin < 30) htRisk += 1
    const htRiskLabel = htRisk > 8 ? "High" : htRisk > 4 ? "Moderate" : "Low"
    const htStatus: 'good' | 'warning' | 'danger' = htRisk > 8 ? 'danger' : htRisk > 4 ? 'warning' : 'good'

    // DASH diet compatibility
    const dashCompatible = totalSodium <= 1500
    const dashStatus: 'good' | 'warning' | 'danger' = dashCompatible ? 'good' : totalSodium <= 2300 ? 'warning' : 'danger'

    // Sodium:Potassium ratio (ideal: 1:1 or lower)
    const estPotassium = 2500 // estimated average
    const nkRatio = r2(totalSodium / estPotassium)
    const nkStatus: 'good' | 'warning' | 'danger' = nkRatio <= 1 ? 'good' : nkRatio <= 1.5 ? 'warning' : 'danger'

    // Exercise sweat sodium loss
    const sweatSodiumLoss = r0(exMin * 15) // ~15mg/min

    // Salt in teaspoons
    const saltTeaspoons = r1(as)

    const score = sodiumStatus === 'good' ? 90 : sodiumStatus === 'warning' ? 55 : 20

    setResult({
      primaryMetric: { label: "Daily Sodium", value: totalSodium, unit: "mg", status: sodiumStatus, description: sodiumClass, icon: AlertTriangle },
      healthScore: score,
      metrics: [
        { label: "Total Sodium", value: `${totalSodium} mg`, status: sodiumStatus, icon: AlertTriangle },
        { label: "Processed", value: `${processedSodium} mg`, status: processedSodium > 1000 ? 'danger' : 'good', icon: Apple },
        { label: "Added Salt", value: `${addedSaltSodium} mg`, status: addedSaltSodium > 800 ? 'warning' : 'good', icon: Scale },
        { label: "WHO Limit", value: `${whoLimit} mg`, status: totalSodium <= whoLimit ? 'good' : 'danger', icon: Shield },
        { label: "Blood Pressure", value: `${sys}/${dia}`, status: bpStatus, icon: Heart },
        { label: "BP Class", value: bpClass, status: bpStatus, icon: Activity },
        { label: "BP if Reduced", value: `~${projectedSys}/${dia}`, status: 'good', icon: TrendingUp },
        { label: "Fluid Retention", value: `~${fluidRetention} ml`, status: fluidStatus, icon: Droplets },
        { label: "HT Risk", value: htRiskLabel, status: htStatus, icon: Flame },
        { label: "DASH Compatible", value: dashCompatible ? "Yes" : "No", status: dashStatus, icon: Zap },
        { label: "Na:K Ratio", value: `${nkRatio}:1`, status: nkStatus, icon: BarChart3 },
        { label: "Sweat Loss", value: `${sweatSodiumLoss} mg`, status: 'good', icon: User },
      ],
      recommendations: [
        { title: "Sodium Assessment", description: `Total: ${totalSodium} mg/day (processed: ${processedSodium} mg + salt: ${addedSaltSodium} mg). ${sodiumClass}. WHO: <${whoLimit} mg. AHA ideal: <${ahaIdeal} mg. ${totalSodium > whoLimit ? `Reduce by ${totalSodium - whoLimit} mg daily.` : "Within limits."}`, priority: sodiumStatus === 'danger' ? 'high' : 'medium', category: "Intake" },
        { title: "Blood Pressure Impact", description: `Current: ${sys}/${dia} (${bpClass}). Excess sodium adds ~${bpImpact} mmHg to systolic. If sodium reduced to optimal: projected BP ~${projectedSys}/${dia}. ${bpStatus === 'danger' ? "URGENT: consult physician. Medication may be needed alongside dietary changes." : "Monitor regularly."}`, priority: bpStatus === 'danger' ? 'high' : 'medium', category: "Blood Pressure" },
        { title: "Fluid Retention", description: `Estimated: ~${fluidRetention} ml excess fluid from sodium. ${fluidStatus === 'danger' ? "Significant — may cause ankle swelling, puffiness, weight fluctuation. Reducing sodium most effective for fluid loss." : "Normal fluid balance."}`, priority: fluidStatus === 'danger' ? 'high' : 'low', category: "Fluid" },
        { title: "DASH Diet", description: `${dashCompatible ? "DASH compatible — optimal for blood pressure management." : `Not DASH compatible. DASH requires <1500 mg sodium. Reduce by ${totalSodium - 1500} mg. Focus: eliminate processed foods, use herbs/spices instead of salt.`}`, priority: !dashCompatible ? 'high' : 'low', category: "DASH" },
        { title: "Sodium:Potassium Balance", description: `Na:K ratio: ${nkRatio}:1 (ideal: ≤1:1). ${nkStatus === 'danger' ? "Poor ratio — increase potassium (bananas, sweet potatoes, spinach, beans) and reduce sodium." : "Acceptable ratio."}`, priority: nkStatus === 'danger' ? 'high' : 'low', category: "Balance" },
        { title: "Stroke Risk Reduction", description: `Reducing sodium by 1000 mg/day decreases stroke risk by ~25%. Current excess: ${excessSodium} mg. Potential sweat loss: ${sweatSodiumLoss} mg (${exMin} min exercise).`, priority: excessSodium > 1000 ? 'high' : 'low', category: "Prevention" },
      ],
      detailedBreakdown: {
        "Total Sodium": `${totalSodium} mg`, "Processed Food": `${processedSodium} mg (${pf} servings)`,
        "Added Salt": `${addedSaltSodium} mg (${as}g = ${saltTeaspoons} tsp)`,
        "WHO Limit": `${whoLimit} mg`, "AHA Ideal": `${ahaIdeal} mg`,
        "BP": `${sys}/${dia}`, "BP Class": bpClass,
        "Excess Sodium": `${excessSodium} mg`, "BP Impact": `+${bpImpact} mmHg`,
        "Projected BP": `${projectedSys}/${dia}`,
        "Fluid Retention": `${fluidRetention} ml`, "HT Risk": `${htRisk}/12 (${htRiskLabel})`,
        "DASH Compatible": dashCompatible ? "Yes" : "No",
        "Na:K Ratio": `${nkRatio}:1`, "Sweat Loss": `${sweatSodiumLoss} mg`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <NumInput label="Processed Food Servings" value={processedFood} onChange={setProcessedFood} min={0} max={10} step={1} suffix="servings" />
      <NumInput label="Added Salt" value={addedSalt} onChange={setAddedSalt} min={0} max={15} step={0.5} suffix="g" />
      <NumInput label="Systolic BP" value={bpSystolic} onChange={setBpSystolic} min={80} max={200} suffix="mmHg" />
      <NumInput label="Diastolic BP" value={bpDiastolic} onChange={setBpDiastolic} min={50} max={130} suffix="mmHg" />
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="yrs" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Exercise Duration" value={exerciseMin} onChange={setExerciseMin} min={0} max={180} step={5} suffix="min" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Sodium Intake Calculator"
      description="Assess sodium impact on blood pressure, fluid retention, hypertension risk scoring, DASH compatibility, Na:K ratio, and stroke risk reduction."
      inputs={inputs} calculate={calculate} result={result} categoryName="Nutrition & Calorie Tracking"
      seoContent={<SeoContentGenerator title="Advanced Sodium Intake Calculator" description="Sodium analysis with BP impact, fluid retention, DASH compatibility, and stroke prevention." categoryName="Nutrition & Calorie Tracking" />}
    />
  )
}
