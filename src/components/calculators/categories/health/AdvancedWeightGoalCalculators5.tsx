"use client"

import { useState } from "react"
import { Activity, TrendingDown, Scale, Target, BarChart3, Flame, Clock, AlertCircle, Brain, Heart, Droplets, Zap } from "lucide-react"
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

// ─── 40. Hunger Scale Calculator ──────────────────────────────────────────────
export function HungerScaleCalculator() {
  const [timeSinceMeal, setTimeSinceMeal] = useState(3)
  const [hungerLevel, setHungerLevel] = useState(6)
  const [energyLevel, setEnergyLevel] = useState(5)
  const [stressLevel, setStressLevel] = useState(4)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const time = clamp(timeSinceMeal, 0, 24)
    const hunger = clamp(hungerLevel, 1, 10)
    const energy = clamp(energyLevel, 1, 10)
    const stress = clamp(stressLevel, 1, 10)

    const classification = hunger <= 2 ? "Overfull" : hunger <= 4 ? "Comfortable" : hunger <= 6 ? "Neutral Hunger" : hunger <= 8 ? "Hungry" : "Extreme Hunger"
    const idealEat = hunger >= 6 && hunger <= 8
    const bingeRisk = r0(clamp((hunger > 8 ? 40 : 0) + stress * 4 + (time > 6 ? 15 : 0) + (energy < 4 ? 10 : 0), 0, 100))

    let mealRec = ""
    if (hunger <= 3) mealRec = "Not hungry — wait until hunger returns (score 5-7) before eating."
    else if (hunger <= 5) mealRec = "Light hunger — small snack or wait 30-60 min for proper meal."
    else if (hunger <= 7) mealRec = "Ideal eating window — eat a balanced meal now."
    else if (hunger <= 8) mealRec = "Getting very hungry — eat soon to avoid overeating."
    else mealRec = "Extreme hunger — eat immediately but slowly. Start with protein + fiber to prevent binge."

    const status: 'good' | 'warning' | 'danger' = idealEat ? "good" : hunger > 8 || hunger < 3 ? "danger" : "warning"

    setResult({
      primaryMetric: { label: "Hunger Classification", value: classification, status, description: `Level ${hunger}/10 — ${time}h since last meal` },
      healthScore: r0(clamp(100 - Math.abs(hunger - 6.5) * 15, 10, 100)),
      metrics: [
        { label: "Hunger Level", value: `${hunger}/10`, status },
        { label: "Classification", value: classification, status },
        { label: "Time Since Meal", value: time, unit: "hours", status: time > 6 ? "warning" : "good" },
        { label: "Energy Level", value: `${energy}/10`, status: energy > 5 ? "good" : energy > 3 ? "warning" : "danger" },
        { label: "Stress Level", value: `${stress}/10`, status: stress < 4 ? "good" : stress < 7 ? "warning" : "danger" },
        { label: "Ideal Eating Window", value: idealEat ? "Yes" : "No", status: idealEat ? "good" : "warning" },
        { label: "Binge Risk", value: bingeRisk, unit: "%", status: bingeRisk < 25 ? "good" : bingeRisk < 50 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Meal Timing", description: mealRec, priority: "high", category: "Action" },
        { title: "Hunger Awareness", description: `Intuitive eating: aim to eat at hunger level 6-7 (moderate hunger). Eating below 5 = emotional/habitual eating. Eating above 8 = too hungry (triggers overeating). ${stress > 6 ? "High stress detected — distinguish physical hunger from stress-driven cravings." : ""} Stop eating at level 3-4 (comfortably satisfied, not stuffed).`, priority: "high", category: "Mindful Eating" },
        { title: "Binge Prevention", description: `Risk: ${bingeRisk}%. ${bingeRisk > 40 ? "Elevated — don't skip meals, keep protein snacks available, practice 20-min hunger delay test (wait 20 min, if still hungry it's real hunger)." : "Low risk — good hunger regulation."} Regular meal timing (every 3-5h) prevents extreme hunger episodes.`, priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Hunger": `${hunger}/10`, "Class": classification, "Time": `${time}h`, "Energy": energy, "Stress": stress, "Binge Risk": `${bingeRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="hunger-scale" title="Hunger Scale Calculator"
      description="Identify hunger levels on the intuitive eating scale. Provides meal timing recommendations and binge risk assessment."
      icon={Scale} calculate={calculate} onClear={() => { setTimeSinceMeal(3); setHungerLevel(6); setEnergyLevel(5); setStressLevel(4); setResult(null) }}
      values={[timeSinceMeal, hungerLevel, energyLevel, stressLevel]} result={result}
      seoContent={<SeoContentGenerator title="Hunger Scale Calculator" description="Intuitive eating hunger scale with meal timing recommendations." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Time Since Last Meal" val={timeSinceMeal} set={setTimeSinceMeal} min={0} max={24} step={0.5} suffix="hours" />
          <NumInput label="Hunger Level" val={hungerLevel} set={setHungerLevel} min={1} max={10} suffix="1-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Energy Level" val={energyLevel} set={setEnergyLevel} min={1} max={10} suffix="1-10" />
          <NumInput label="Stress Level" val={stressLevel} set={setStressLevel} min={1} max={10} suffix="1-10" />
        </div>
      </div>} />
  )
}

// ─── 41. Cravings Intensity Tracker ───────────────────────────────────────────
export function CravingsIntensityTracker() {
  const [cravingType, setCravingType] = useState("sweet")
  const [intensity, setIntensity] = useState(7)
  const [stressLevel, setStressLevel] = useState(5)
  const [sleepHours, setSleepHours] = useState(6)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const int = clamp(intensity, 1, 10)
    const stress = clamp(stressLevel, 1, 10)
    const sleep = clamp(sleepHours, 0, 14)

    const emotionalTrigger = r0(clamp(stress * 6 + (sleep < 6 ? 20 : sleep < 7 ? 10 : 0) + int * 2, 0, 100))
    const adherenceRisk = r0(clamp(int * 7 + stress * 3 + (sleep < 6 ? 15 : 0), 0, 100))

    const cravingCause = cravingType === "sweet" ? "Sugar cravings often indicate low serotonin, sleep deprivation, or caloric restriction"
      : cravingType === "salty" ? "Salt cravings may indicate dehydration, electrolyte imbalance, or stress (cortisol)"
      : cravingType === "fatty" ? "Fat cravings can indicate essential fatty acid deficiency or caloric restriction"
      : "Carb cravings suggest low glycogen, serotonin needs, or energy deficit"

    const status: 'good' | 'warning' | 'danger' = int < 4 ? "good" : int < 7 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Craving Intensity", value: `${int}/10`, status, description: `${cravingType} craving — Emotional trigger: ${emotionalTrigger}%` },
      healthScore: Math.max(10, r0(100 - int * 8)),
      metrics: [
        { label: "Intensity", value: `${int}/10`, status },
        { label: "Craving Type", value: cravingType.charAt(0).toUpperCase() + cravingType.slice(1), status: "normal" },
        { label: "Emotional Trigger", value: emotionalTrigger, unit: "%", status: emotionalTrigger < 30 ? "good" : emotionalTrigger < 60 ? "warning" : "danger" },
        { label: "Stress Level", value: `${stress}/10`, status: stress < 4 ? "good" : stress < 7 ? "warning" : "danger" },
        { label: "Sleep", value: sleep, unit: "hours", status: sleep >= 7 ? "good" : sleep >= 6 ? "warning" : "danger" },
        { label: "Diet Adherence Risk", value: adherenceRisk, unit: "%", status: adherenceRisk < 30 ? "good" : adherenceRisk < 60 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Craving Analysis", description: `${cravingCause}. Intensity: ${int}/10. ${sleep < 7 ? "Sleep deprivation increases ghrelin (hunger hormone) by 15% and cravings by 30%." : ""} ${stress > 6 ? "High stress → elevated cortisol → sugar/comfort food cravings." : ""}`, priority: "high", category: "Analysis" },
        { title: "Craving Management", description: `Strategies: 1) Wait 15-20 min — most cravings pass. 2) Drink water (thirst mimics hunger). 3) ${cravingType === "sweet" ? "Eat fruit or dark chocolate (80%+) instead." : cravingType === "salty" ? "Try electrolyte water or lightly salted nuts." : cravingType === "fatty" ? "Try avocado, nuts, or omega-3 rich foods." : "Complex carbs like oats or sweet potato."} 4) Distract — walk, call someone, do 10 pushups.`, priority: "high", category: "Strategy" },
        { title: "Root Cause", description: `Emotional trigger score: ${emotionalTrigger}%. ${emotionalTrigger > 50 ? "Cravings likely emotional, not physical. Address stress: meditation, exercise, journaling, or therapy." : "Cravings may be physiological — ensure adequate calories, protein (1.6g/kg), and sleep (7-9h)."} Adherence risk: ${adherenceRisk}% — ${adherenceRisk > 60 ? "high risk of diet break today." : "manageable."}`, priority: "medium", category: "Root Cause" }
      ],
      detailedBreakdown: { "Type": cravingType, "Intensity": `${int}/10`, "Emotional": `${emotionalTrigger}%`, "Stress": stress, "Sleep": `${sleep}h`, "Risk": `${adherenceRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cravings-intensity" title="Cravings Intensity Tracker"
      description="Track food craving intensity and identify emotional triggers. Calculates diet adherence risk from stress and sleep factors."
      icon={Brain} calculate={calculate} onClear={() => { setCravingType("sweet"); setIntensity(7); setStressLevel(5); setSleepHours(6); setResult(null) }}
      values={[cravingType, intensity, stressLevel, sleepHours]} result={result}
      seoContent={<SeoContentGenerator title="Cravings Intensity Tracker" description="Track food cravings and emotional eating triggers." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Craving Type" val={cravingType} set={setCravingType} options={[{ value: "sweet", label: "Sweet" }, { value: "salty", label: "Salty" }, { value: "fatty", label: "Fatty/Greasy" }, { value: "carb", label: "Carbs/Starchy" }]} />
          <NumInput label="Intensity" val={intensity} set={setIntensity} min={1} max={10} suffix="1-10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Stress Level" val={stressLevel} set={setStressLevel} min={1} max={10} suffix="1-10" />
          <NumInput label="Sleep Last Night" val={sleepHours} set={setSleepHours} min={0} max={14} step={0.5} suffix="hours" />
        </div>
      </div>} />
  )
}

// ─── 42. Maintenance Calories Calculator ──────────────────────────────────────
export function MaintenanceCaloriesCalculator() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [height, setHeight] = useState(175)
  const [weight, setWeight] = useState(75)
  const [activityLevel, setActivityLevel] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 15, 80)
    const h = clamp(height, 120, 230)
    const w = clamp(weight, 30, 250)

    // Mifflin-St Jeor
    const bmr = gender === "male"
      ? r0(10 * w + 6.25 * h - 5 * a + 5)
      : r0(10 * w + 6.25 * h - 5 * a - 161)

    const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 }
    const mult = multipliers[activityLevel] || 1.55
    const maintenance = r0(bmr * mult)

    const stabilityLow = r0(maintenance - 100)
    const stabilityHigh = r0(maintenance + 100)
    const cuttingCal = r0(maintenance - 500)
    const bulkingCal = r0(maintenance + 300)

    setResult({
      primaryMetric: { label: "Maintenance Calories", value: `${maintenance} kcal/day`, status: "good", description: `BMR: ${bmr} kcal × ${mult} activity multiplier` },
      healthScore: 80,
      metrics: [
        { label: "BMR (Mifflin-St Jeor)", value: bmr, unit: "kcal", status: "normal" },
        { label: "Activity Multiplier", value: mult, status: "normal" },
        { label: "Maintenance Calories", value: maintenance, unit: "kcal/day", status: "good" },
        { label: "Stability Range", value: `${stabilityLow}–${stabilityHigh}`, unit: "kcal", status: "good" },
        { label: "For Fat Loss", value: cuttingCal, unit: "kcal", status: "normal" },
        { label: "For Lean Bulk", value: bulkingCal, unit: "kcal", status: "normal" },
        { label: "Protein Target", value: `${r0(w * 1.8)}–${r0(w * 2.2)}`, unit: "g/day", status: "good" }
      ],
      recommendations: [
        { title: "Maintenance Calories", description: `${maintenance} kcal/day maintains current weight of ${w} kg. True maintenance is a range (${stabilityLow}–${stabilityHigh}), not a single number. Your BMR alone burns ${bmr} kcal — this is what you'd burn lying in bed all day.`, priority: "high", category: "Calories" },
        { title: "Goal-Based Targets", description: `Fat loss: ${cuttingCal} kcal (-500 deficit = ~0.5 kg/week). Lean bulk: ${bulkingCal} kcal (+300 surplus). Never go below BMR (${bmr}) for extended periods. Protein: ${r0(w * 2)}g/day for body composition goals.`, priority: "high", category: "Targets" },
        { title: "Finding True Maintenance", description: "This is an estimate. To find true maintenance: eat calculated amount for 2-3 weeks, track morning weight daily. Weight stable? That's maintenance. Gaining? Reduce by 100. Losing? Add 100. Recalculate every 5-10 kg change.", priority: "medium", category: "Calibration" }
      ],
      detailedBreakdown: { "BMR": bmr, "Multiplier": mult, "Maintenance": maintenance, "Cut": cuttingCal, "Bulk": bulkingCal }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="maintenance-calories" title="Maintenance Calories Calculator"
      description="Calculate daily calories to maintain your current weight using the Mifflin-St Jeor equation. Includes cutting and bulking targets."
      icon={Flame} calculate={calculate} onClear={() => { setAge(30); setGender("male"); setHeight(175); setWeight(75); setActivityLevel("moderate"); setResult(null) }}
      values={[age, gender, height, weight, activityLevel]} result={result}
      seoContent={<SeoContentGenerator title="Maintenance Calories Calculator" description="Calculate maintenance calories using Mifflin-St Jeor BMR." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={15} max={80} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={height} set={setHeight} min={120} max={230} suffix="cm" />
          <NumInput label="Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
        </div>
        <SelectInput label="Activity Level" val={activityLevel} set={setActivityLevel} options={[
          { value: "sedentary", label: "Sedentary (desk job, minimal exercise)" },
          { value: "light", label: "Lightly Active (1-3 days/week)" },
          { value: "moderate", label: "Moderately Active (3-5 days/week)" },
          { value: "active", label: "Very Active (6-7 days/week)" },
          { value: "very_active", label: "Extremely Active (athlete/physical job)" }
        ]} />
      </div>} />
  )
}

// ─── 43. Set Point Theory Estimator ───────────────────────────────────────────
export function SetPointTheoryEstimator() {
  const [currentWeight, setCurrentWeight] = useState(80)
  const [longTermAvg, setLongTermAvg] = useState(82)
  const [dietCycles, setDietCycles] = useState(3)
  const [yearsTracked, setYearsTracked] = useState(5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cw = clamp(currentWeight, 30, 250)
    const avg = clamp(longTermAvg, 30, 250)
    const cycles = clamp(dietCycles, 0, 20)
    const years = clamp(yearsTracked, 1, 40)

    const setPointLow = r1(avg - avg * 0.05)
    const setPointHigh = r1(avg + avg * 0.05)
    const deviation = r1(Math.abs(cw - avg))
    const resistanceScore = r0(clamp(cycles * 8 + deviation * 2 + (years > 5 ? 10 : 0), 0, 100))
    const regainProb = r0(clamp(30 + cycles * 7 + (cw < setPointLow ? 20 : 0), 0, 95))

    const inRange = cw >= setPointLow && cw <= setPointHigh
    const status: 'good' | 'warning' | 'danger' = inRange ? "good" : deviation < avg * 0.1 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Set-Point Range", value: `${setPointLow}–${setPointHigh} kg`, status, description: `Current: ${cw} kg — ${inRange ? "Within set-point range" : `${r1(cw - avg)} kg from center`}` },
      healthScore: Math.max(10, r0(100 - resistanceScore)),
      metrics: [
        { label: "Estimated Set-Point", value: `${setPointLow}–${setPointHigh}`, unit: "kg", status: "good" },
        { label: "Set-Point Center", value: avg, unit: "kg", status: "normal" },
        { label: "Current Weight", value: cw, unit: "kg", status: inRange ? "good" : "warning" },
        { label: "Deviation", value: deviation, unit: "kg", status: deviation < 3 ? "good" : deviation < 6 ? "warning" : "danger" },
        { label: "In Range", value: inRange ? "Yes" : "No", status: inRange ? "good" : "warning" },
        { label: "Diet Cycles", value: cycles, status: cycles < 3 ? "good" : cycles < 6 ? "warning" : "danger" },
        { label: "Biological Resistance", value: resistanceScore, unit: "/100", status: resistanceScore < 30 ? "good" : resistanceScore < 60 ? "warning" : "danger" },
        { label: "Weight Regain Probability", value: regainProb, unit: "%", status: regainProb < 40 ? "good" : regainProb < 65 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Set-Point Theory", description: `Estimated natural weight range: ${setPointLow}–${setPointHigh} kg (±5% of ${avg} kg). Your body defends this range through hormonal regulation (leptin, ghrelin, thyroid). ${!inRange ? `Currently ${deviation} kg outside range — your body is actively trying to return to set-point through increased hunger and reduced metabolism.` : "Within range — minimal biological resistance."}`, priority: "high", category: "Theory" },
        { title: "Resistance Score", description: `Biological resistance: ${resistanceScore}/100. ${cycles > 3 ? `${cycles} diet cycles (yo-yo dieting) increases resistance — each cycle can raise set-point slightly.` : ""} To lower set-point: maintain new weight for 6-12 months (allows body to accept new set-point), exercise regularly (shifts set-point down), prioritize sleep and stress management.`, priority: "high", category: "Resistance" },
        { title: "Regain Prevention", description: `Regain probability: ${regainProb}%. ${regainProb > 50 ? "HIGH — slow reverse diet after reaching goal. Maintain for 6+ months before further cutting. Avoid rapid weight regain patterns." : "Moderate risk — consistent habits are key."} Research: 80% of dieters regain within 2 years. Those who maintain: exercise 200+ min/week, self-monitor weight, eat breakfast, maintain consistent eating patterns.`, priority: "medium", category: "Maintenance" }
      ],
      detailedBreakdown: { "Range": `${setPointLow}–${setPointHigh} kg`, "Center": avg, "Current": cw, "Deviation": deviation, "Resistance": resistanceScore, "Regain": `${regainProb}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="set-point-theory" title="Set Point Theory Estimator"
      description="Estimate your body's natural weight regulation range. Calculates biological resistance and weight regain probability."
      icon={Target} calculate={calculate} onClear={() => { setCurrentWeight(80); setLongTermAvg(82); setDietCycles(3); setYearsTracked(5); setResult(null) }}
      values={[currentWeight, longTermAvg, dietCycles, yearsTracked]} result={result}
      seoContent={<SeoContentGenerator title="Set Point Theory Estimator" description="Estimate body weight set-point and biological resistance." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={250} step={0.5} suffix="kg" />
          <NumInput label="Long-Term Average Weight" val={longTermAvg} set={setLongTermAvg} min={30} max={250} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Diet Cycles (yo-yo)" val={dietCycles} set={setDietCycles} min={0} max={20} />
          <NumInput label="Years Tracked" val={yearsTracked} set={setYearsTracked} min={1} max={40} suffix="years" />
        </div>
      </div>} />
  )
}

// ─── 44. Metabolic Damage Estimator ───────────────────────────────────────────
export function MetabolicDamageEstimator() {
  const [lowestCal, setLowestCal] = useState(1200)
  const [lossRate, setLossRate] = useState(1.2)
  const [dietDuration, setDietDuration] = useState(16)
  const [currentWeight, setCurrentWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cal = clamp(lowestCal, 500, 4000)
    const rate = clamp(lossRate, 0, 3)
    const dur = clamp(dietDuration, 1, 52)
    const w = clamp(currentWeight, 30, 250)

    // Expected TDEE
    const expectedTDEE = r0(w * 30) // rough estimate
    const suppression = r0(clamp(
      (cal < 1200 ? 15 : cal < 1500 ? 8 : 3) +
      (rate > 1 ? 10 : rate > 0.7 ? 5 : 0) +
      (dur > 12 ? 10 : dur > 8 ? 5 : 0) +
      (dur > 16 && cal < 1400 ? 10 : 0), 5, 40
    ))

    const adjustedTDEE = r0(expectedTDEE * (1 - suppression / 100))
    const hormonalIndex = r0(clamp(suppression * 2 + (rate > 1.2 ? 15 : 0) + (dur > 12 ? 10 : 0), 0, 100))

    const recovery = suppression > 20 ? "Reverse diet required — increase calories by 50-100/week"
      : suppression > 10 ? "Moderate adaptation — diet break followed by slow reverse"
      : "Minimal damage — return to maintenance for 4 weeks"

    const status: 'good' | 'warning' | 'danger' = suppression < 10 ? "good" : suppression < 20 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Metabolic Suppression", value: `${suppression}%`, status, description: `TDEE reduced from ~${expectedTDEE} to ~${adjustedTDEE} kcal` },
      healthScore: Math.max(10, r0(100 - suppression * 3)),
      metrics: [
        { label: "Estimated Suppression", value: suppression, unit: "%", status },
        { label: "Expected TDEE", value: expectedTDEE, unit: "kcal", status: "normal" },
        { label: "Suppressed TDEE", value: adjustedTDEE, unit: "kcal", status: "normal" },
        { label: "TDEE Reduction", value: expectedTDEE - adjustedTDEE, unit: "kcal", status: status },
        { label: "Hormonal Adaptation", value: hormonalIndex, unit: "/100", status: hormonalIndex < 30 ? "good" : hormonalIndex < 60 ? "warning" : "danger" },
        { label: "Lowest Intake", value: cal, unit: "kcal", status: cal > 1400 ? "good" : cal > 1000 ? "warning" : "danger" },
        { label: "Loss Rate", value: rate, unit: "kg/wk", status: rate < 0.8 ? "good" : rate < 1.2 ? "warning" : "danger" },
        { label: "Diet Duration", value: dur, unit: "weeks", status: dur < 12 ? "good" : dur < 20 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Metabolic Assessment", description: `~${suppression}% metabolic suppression. ${suppression > 15 ? "Significant adaptation detected. Metabolism has slowed beyond what weight loss alone predicts." : "Moderate adaptation — within expected range."} Factors: ${cal < 1200 ? "Very low calorie intake. " : ""}${rate > 1 ? "Aggressive loss rate. " : ""}${dur > 12 ? "Extended diet duration. " : ""}`, priority: "high", category: "Assessment" },
        { title: "Recovery Strategy", description: recovery + `. Hormonal adaptation index: ${hormonalIndex}/100. ${hormonalIndex > 50 ? "Leptin, T3 thyroid, testosterone likely suppressed. Recovery takes 8-16 weeks at maintenance." : ""}`, priority: "high", category: "Recovery" },
        { title: "Prevention", description: "Avoid metabolic damage: 1) Never diet below BMR for extended periods. 2) Limit cuts to 12 weeks max, then 4-week maintenance break. 3) Keep loss rate <1% body weight/week. 4) Include refeed days. 5) Progressive resistance training preserves metabolic rate.", priority: "medium", category: "Prevention" }
      ],
      detailedBreakdown: { "Suppression": `${suppression}%`, "Expected": expectedTDEE, "Actual": adjustedTDEE, "Hormonal": hormonalIndex, "Intake": cal, "Rate": `${rate}/wk`, "Duration": `${dur} wk` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="metabolic-damage" title="Metabolic Damage Estimator"
      description="Estimate metabolic suppression from severe or prolonged dieting. Includes hormonal adaptation index and recovery strategies."
      icon={AlertCircle} calculate={calculate} onClear={() => { setLowestCal(1200); setLossRate(1.2); setDietDuration(16); setCurrentWeight(70); setResult(null) }}
      values={[lowestCal, lossRate, dietDuration, currentWeight]} result={result}
      seoContent={<SeoContentGenerator title="Metabolic Damage Estimator" description="Estimate metabolic suppression from extreme dieting." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Lowest Calorie Intake" val={lowestCal} set={setLowestCal} min={500} max={4000} suffix="kcal/day" />
          <NumInput label="Weight Loss Rate" val={lossRate} set={setLossRate} min={0} max={3} step={0.1} suffix="kg/week" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Diet Duration" val={dietDuration} set={setDietDuration} min={1} max={52} suffix="weeks" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={250} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 45. Reverse Dieting Duration Calculator ──────────────────────────────────
export function ReverseDietingDurationCalc() {
  const [currentCal, setCurrentCal] = useState(1500)
  const [prevMaintenance, setPrevMaintenance] = useState(2200)
  const [bodyFat, setBodyFat] = useState(18)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const curr = clamp(currentCal, 500, 4000)
    const prev = clamp(prevMaintenance, 1200, 5000)
    const bf = clamp(bodyFat, 5, 50)

    const gap = prev - curr
    const weeklyIncrease = bf < 15 ? 50 : bf < 22 ? 75 : 100
    const weeks = r0(Math.max(1, gap / weeklyIncrease))
    const newMaintenance = r0(prev * (bf < 15 ? 0.95 : bf < 25 ? 0.97 : 0.99))

    const increments: { week: number; calories: number }[] = []
    for (let w = 1; w <= Math.min(weeks, 12); w++) {
      increments.push({ week: w, calories: r0(curr + weeklyIncrease * w) })
    }

    setResult({
      primaryMetric: { label: "Reverse Diet Duration", value: `${weeks} weeks`, status: "good", description: `+${weeklyIncrease} kcal/week from ${curr} to ~${newMaintenance} kcal` },
      healthScore: 75,
      metrics: [
        { label: "Current Intake", value: curr, unit: "kcal", status: curr > 1200 ? "good" : "warning" },
        { label: "Previous Maintenance", value: prev, unit: "kcal", status: "normal" },
        { label: "Calorie Gap", value: gap, unit: "kcal", status: gap < 400 ? "good" : gap < 700 ? "warning" : "danger" },
        { label: "Weekly Increase", value: weeklyIncrease, unit: "kcal/wk", status: "good" },
        { label: "Estimated Duration", value: weeks, unit: "weeks", status: weeks < 8 ? "good" : weeks < 14 ? "warning" : "danger" },
        { label: "New Maintenance Est.", value: newMaintenance, unit: "kcal", status: "good" },
        { label: "Body Fat", value: bf, unit: "%", status: bf < 25 ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Reverse Diet Plan", description: `Increase by ${weeklyIncrease} kcal/week for ${weeks} weeks. Target: ~${newMaintenance} kcal (may be slightly lower than pre-diet maintenance due to weight loss). ${increments.slice(0, 4).map(i => `Week ${i.week}: ${i.calories} kcal`).join(". ")}. Focus extra calories on carbs first, then fats.`, priority: "high", category: "Plan" },
        { title: "Monitoring", description: "Track morning weight daily, use 7-day average. Expect 0.5-1 kg initial gain (glycogen + water, NOT fat). If gaining >0.5 kg/week consistently, slow the increase. If weight stable, continue as planned. Some weight gain is normal and necessary.", priority: "high", category: "Monitoring" },
        { title: "Benefits", description: "Reverse dieting restores: 1) Metabolic rate. 2) Hormone levels (leptin, T3, testosterone). 3) Training performance. 4) Mental health and diet fatigue. 5) Menstrual regularity (women). Don't jump straight to maintenance — gradual increase minimizes fat regain.", priority: "medium", category: "Benefits" }
      ],
      detailedBreakdown: { "Current": curr, "Target": newMaintenance, "Gap": gap, "Increase": `${weeklyIncrease}/wk`, "Weeks": weeks }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="reverse-dieting" title="Reverse Dieting Duration Calculator"
      description="Estimate how long to reverse diet back to maintenance calories. Calculates weekly calorie increments and timeline."
      icon={TrendingDown} calculate={calculate} onClear={() => { setCurrentCal(1500); setPrevMaintenance(2200); setBodyFat(18); setResult(null) }}
      values={[currentCal, prevMaintenance, bodyFat]} result={result}
      seoContent={<SeoContentGenerator title="Reverse Dieting Duration Calculator" description="Calculate reverse diet timeline to restore metabolism." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Calories" val={currentCal} set={setCurrentCal} min={500} max={4000} suffix="kcal/day" />
          <NumInput label="Previous Maintenance" val={prevMaintenance} set={setPrevMaintenance} min={1200} max={5000} suffix="kcal/day" />
        </div>
        <NumInput label="Body Fat %" val={bodyFat} set={setBodyFat} min={5} max={50} step={0.5} suffix="%" />
      </div>} />
  )
}

// ─── 46. Diet Break Frequency Calculator ──────────────────────────────────────
export function DietBreakFrequencyCalc() {
  const [bodyFat, setBodyFat] = useState(20)
  const [weeksDieting, setWeeksDieting] = useState(8)
  const [deficit, setDeficit] = useState(500)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bf = clamp(bodyFat, 5, 50)
    const weeks = clamp(weeksDieting, 1, 52)
    const def = clamp(deficit, 100, 1500)

    // Leaner = more frequent breaks
    let breakEvery = bf < 12 ? 4 : bf < 18 ? 6 : bf < 25 ? 8 : 12
    if (def > 750) breakEvery = Math.max(3, breakEvery - 2)
    const breakDuration = bf < 15 ? 14 : 7  // days

    const fatigueScore = r0(clamp(weeks * 5 + (1000 - def > 500 ? 0 : (def - 500) * 0.05) + (bf < 15 ? 15 : 0), 0, 100))
    const status: 'good' | 'warning' | 'danger' = fatigueScore < 30 ? "good" : fatigueScore < 60 ? "warning" : "danger"

    const needsBreakNow = weeks >= breakEvery
    const nextBreakIn = needsBreakNow ? 0 : breakEvery - weeks

    setResult({
      primaryMetric: { label: "Diet Break Schedule", value: `Every ${breakEvery} weeks`, status: needsBreakNow ? "danger" : "good", description: `${breakDuration} days at maintenance — ${needsBreakNow ? "BREAK NEEDED NOW" : `Next break in ${nextBreakIn} weeks`}` },
      healthScore: Math.max(10, r0(100 - fatigueScore)),
      metrics: [
        { label: "Break Frequency", value: `Every ${breakEvery} weeks`, status: "good" },
        { label: "Break Duration", value: breakDuration, unit: "days", status: "good" },
        { label: "Weeks Dieting", value: weeks, status: weeks < breakEvery ? "good" : "danger" },
        { label: "Break Needed Now", value: needsBreakNow ? "YES" : "No", status: needsBreakNow ? "danger" : "good" },
        { label: "Next Break In", value: nextBreakIn, unit: "weeks", status: nextBreakIn > 0 ? "good" : "danger" },
        { label: "Diet Fatigue", value: fatigueScore, unit: "/100", status },
        { label: "Current Deficit", value: def, unit: "kcal", status: def < 500 ? "good" : def < 750 ? "warning" : "danger" },
        { label: "Body Fat", value: bf, unit: "%", status: "normal" }
      ],
      recommendations: [
        { title: "Diet Break Protocol", description: `${needsBreakNow ? "DIET BREAK RECOMMENDED NOW — " + weeks + " weeks exceeds " + breakEvery + "-week limit." : `Continue dieting — next break at week ${breakEvery}.`} Break protocol: eat at maintenance (current + ${def} kcal) for ${breakDuration} days. Keep training the same. Don't fear the scale increase (1-2 kg water weight is normal and expected).`, priority: "high", category: "Schedule" },
        { title: "Diet Fatigue", description: `Fatigue score: ${fatigueScore}/100. ${fatigueScore > 50 ? "High fatigue — symptoms: constant hunger, low energy, poor sleep, training regression, irritability, loss of libido. These indicate hormonal suppression." : "Manageable fatigue — monitor for signs of diet fatigue."} The MATADOR study found intermittent dieting (2 weeks on, 2 weeks off) produced 47% more fat loss than continuous dieting.`, priority: "high", category: "Science" },
        { title: "Break Calendar", description: `At ${bf}% BF with ${def} deficit: Diet ${breakEvery} weeks → Break ${breakDuration} days → Repeat. ${bf < 15 ? "Leaner clients need longer, more frequent breaks (2 weeks every 4-6 weeks)." : "Higher body fat can tolerate longer diet phases."} After 3-4 cycles, consider extended maintenance (4-8 weeks) before resuming.`, priority: "medium", category: "Planning" }
      ],
      detailedBreakdown: { "Every": `${breakEvery} wk`, "Duration": `${breakDuration} days`, "Fatigue": fatigueScore, "Weeks In": weeks, "Next": nextBreakIn > 0 ? `${nextBreakIn} wk` : "NOW" }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="diet-break-freq" title="Diet Break Frequency Calculator"
      description="Calculate optimal diet break frequency based on body fat, deficit, and diet duration. Includes fatigue scoring."
      icon={Clock} calculate={calculate} onClear={() => { setBodyFat(20); setWeeksDieting(8); setDeficit(500); setResult(null) }}
      values={[bodyFat, weeksDieting, deficit]} result={result}
      seoContent={<SeoContentGenerator title="Diet Break Frequency Calculator" description="Calculate how often to take diet breaks for fat loss." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Fat" val={bodyFat} set={setBodyFat} min={5} max={50} step={0.5} suffix="%" />
          <NumInput label="Weeks on Diet" val={weeksDieting} set={setWeeksDieting} min={1} max={52} suffix="weeks" />
        </div>
        <NumInput label="Daily Calorie Deficit" val={deficit} set={setDeficit} min={100} max={1500} suffix="kcal" />
      </div>} />
  )
}

// ─── 47. Fat Loss Predictor ───────────────────────────────────────────────────
export function FatLossPredictor() {
  const [deficit, setDeficit] = useState(500)
  const [activityLevel, setActivityLevel] = useState("moderate")
  const [bodyFat, setBodyFat] = useState(25)
  const [weight, setWeight] = useState(85)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const def = clamp(deficit, 100, 1500)
    const bf = clamp(bodyFat, 5, 50)
    const w = clamp(weight, 30, 250)

    const actMult = activityLevel === "sedentary" ? 0.85 : activityLevel === "light" ? 0.92 : activityLevel === "moderate" ? 1.0 : 1.08
    const weeklyFatLoss = r2((def * 7 / 7700) * actMult)

    const targetBf = bf > 25 ? 20 : bf > 18 ? 15 : bf > 12 ? 10 : bf - 2
    const currentFatMass = r1(w * bf / 100)
    const targetFatMass = r1(w * targetBf / 100) // simplified (weight will change too)
    const fatToLose = r1(Math.max(0, currentFatMass - targetFatMass))
    const weeksToTarget = fatToLose > 0 ? r0(fatToLose / weeklyFatLoss) : 0

    // Plateau prediction
    const metabolicAdaptation = r0(clamp(5 + weeksToTarget * 0.5, 5, 25))
    const adjustedWeeks = r0(weeksToTarget * (1 + metabolicAdaptation / 100))
    const plateauLikely = adjustedWeeks > 12 ? `Week ${r0(weeksToTarget * 0.6)}-${r0(weeksToTarget * 0.7)}` : "Unlikely in this timeframe"

    const status: 'good' | 'warning' | 'danger' = weeklyFatLoss > 0.3 && weeklyFatLoss < 1 ? "good" : weeklyFatLoss >= 1 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Weekly Fat Loss", value: `${weeklyFatLoss} kg/week`, status, description: `${bf}% → ${targetBf}% BF in ~${adjustedWeeks} weeks` },
      healthScore: r0(clamp(weeklyFatLoss * 80, 10, 90)),
      metrics: [
        { label: "Weekly Fat Loss", value: weeklyFatLoss, unit: "kg", status },
        { label: "Monthly Fat Loss", value: r1(weeklyFatLoss * 4.3), unit: "kg", status: "good" },
        { label: "Current BF%", value: bf, unit: "%", status: "normal" },
        { label: "Target BF%", value: targetBf, unit: "%", status: "good" },
        { label: "Fat to Lose", value: fatToLose, unit: "kg", status: "normal" },
        { label: "Weeks to Target", value: adjustedWeeks, unit: "weeks", status: adjustedWeeks < 16 ? "good" : adjustedWeeks < 24 ? "warning" : "danger" },
        { label: "Metabolic Adaptation", value: `+${metabolicAdaptation}%`, status: metabolicAdaptation < 10 ? "good" : "warning" },
        { label: "Plateau Expected", value: plateauLikely, status: plateauLikely === "Unlikely in this timeframe" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Fat Loss Forecast", description: `At ${def} kcal deficit: ~${weeklyFatLoss} kg/week fat loss. To reach ${targetBf}% BF: ~${fatToLose} kg fat to lose over ~${adjustedWeeks} weeks (includes ${metabolicAdaptation}% metabolic adaptation buffer). Realistic timeline accounts for water fluctuations — true fat loss is often obscured for 2-4 weeks.`, priority: "high", category: "Forecast" },
        { title: "Plateau Prevention", description: `${plateauLikely !== "Unlikely in this timeframe" ? `Plateau likely around ${plateauLikely}. Plan a diet break at week ${r0(weeksToTarget * 0.5)}.` : "Short timeline — plateau unlikely."} As body fat drops, fat loss rate slows naturally. Deficit may need to increase slightly (or add cardio) after first 8-12 weeks.`, priority: "high", category: "Strategy" },
        { title: "Rate Assessment", description: `${weeklyFatLoss} kg/week is ${weeklyFatLoss > 1 ? "aggressive — risk of muscle loss. ≤1% of body weight/week recommended." : weeklyFatLoss > 0.5 ? "good — sustainable rate. Muscle preservation likely with adequate protein." : weeklyFatLoss > 0.25 ? "conservative — slower but very sustainable." : "very slow — consider increasing deficit or activity."}`, priority: "medium", category: "Assessment" }
      ],
      detailedBreakdown: { "Weekly": `${weeklyFatLoss} kg`, "Target BF": `${targetBf}%`, "Fat to Lose": `${fatToLose} kg`, "Weeks": adjustedWeeks, "Plateau": plateauLikely }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="fat-loss-predictor" title="Fat Loss Predictor"
      description="Predict fat loss timeline based on calorie deficit, activity, and body fat. Includes plateau prediction and metabolic adaptation buffer."
      icon={TrendingDown} calculate={calculate} onClear={() => { setDeficit(500); setActivityLevel("moderate"); setBodyFat(25); setWeight(85); setResult(null) }}
      values={[deficit, activityLevel, bodyFat, weight]} result={result}
      seoContent={<SeoContentGenerator title="Fat Loss Predictor" description="Predict fat loss timeline with plateau forecasting." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Daily Calorie Deficit" val={deficit} set={setDeficit} min={100} max={1500} suffix="kcal" />
          <NumInput label="Current Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Fat %" val={bodyFat} set={setBodyFat} min={5} max={50} step={0.5} suffix="%" />
          <SelectInput label="Activity Level" val={activityLevel} set={setActivityLevel} options={[
            { value: "sedentary", label: "Sedentary" }, { value: "light", label: "Light" },
            { value: "moderate", label: "Moderate" }, { value: "active", label: "Active" }
          ]} />
        </div>
      </div>} />
  )
}

// ─── 48. Skinny Fat Calculator ────────────────────────────────────────────────
export function SkinnyFatCalculator() {
  const [bmi, setBmi] = useState(23)
  const [bodyFat, setBodyFat] = useState(28)
  const [waist, setWaist] = useState(36)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const b = clamp(bmi, 14, 50)
    const bf = clamp(bodyFat, 5, 55)
    const w = clamp(waist, 20, 60)

    const normalBmi = b >= 18.5 && b <= 24.9
    const highBf = gender === "male" ? bf > 20 : bf > 30
    const isSkinnyFat = normalBmi && highBf
    const label = isSkinnyFat ? "Skinny Fat" : highBf ? "Overfat" : normalBmi ? "Normal Composition" : "Underweight/Overweight"

    // lean mass deficit  
    const idealBf = gender === "male" ? 15 : 25
    const leanDeficit = r1(Math.max(0, bf - idealBf))

    // metabolic syndrome risk from waist
    const waistRisk = gender === "male" ? (w > 40 ? "High" : w > 37 ? "Moderate" : "Low") : (w > 35 ? "High" : w > 31 ? "Moderate" : "Low")

    const riskScore = r0(clamp(
      (isSkinnyFat ? 40 : 0) + (waistRisk === "High" ? 25 : waistRisk === "Moderate" ? 12 : 0) + (leanDeficit > 10 ? 15 : leanDeficit > 5 ? 8 : 0),
      0, 100
    ))

    const status: 'good' | 'warning' | 'danger' = isSkinnyFat ? "danger" : highBf ? "warning" : "good"

    setResult({
      primaryMetric: { label: "Body Composition", value: label, status, description: `BMI ${b} (${normalBmi ? "normal" : "abnormal"}) + BF ${bf}% (${highBf ? "high" : "normal"})` },
      healthScore: Math.max(10, r0(100 - riskScore)),
      metrics: [
        { label: "Classification", value: label, status },
        { label: "BMI", value: b, status: normalBmi ? "good" : "warning" },
        { label: "Body Fat", value: bf, unit: "%", status: highBf ? "danger" : "good" },
        { label: "Waist", value: w, unit: "inches", status: waistRisk === "Low" ? "good" : waistRisk === "Moderate" ? "warning" : "danger" },
        { label: "Lean Mass Deficit", value: leanDeficit, unit: "%", status: leanDeficit < 5 ? "good" : leanDeficit < 10 ? "warning" : "danger" },
        { label: "Metabolic Syndrome Risk", value: waistRisk, status: waistRisk === "Low" ? "good" : waistRisk === "Moderate" ? "warning" : "danger" },
        { label: "Overall Risk Score", value: riskScore, unit: "/100", status: riskScore < 25 ? "good" : riskScore < 50 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Skinny Fat Assessment", description: `${isSkinnyFat ? "SKINNY FAT DETECTED: Normal BMI (" + b + ") but high body fat (" + bf + "%). This means low muscle mass relative to fat. BMI alone misses this — you're metabolically unhealthy despite 'normal' weight." : label + " detected."} Lean mass deficit: ${leanDeficit}% above ideal. Waist risk: ${waistRisk}.`, priority: "high", category: "Diagnosis" },
        { title: "Solution Protocol", description: `${isSkinnyFat ? "PRIORITY: Build muscle, not lose weight. 1) Start resistance training 3-4x/week (compound lifts: squats, deadlifts, bench, rows). 2) Eat at maintenance or slight surplus (+200 kcal). 3) Protein 2g/kg daily. 4) Don't cut calories — you need to recomp (gain muscle, lose fat simultaneously). Scale weight may increase — that's OK." : highBf ? "Focus on fat loss while resistance training to preserve muscle." : "Maintain current body composition through balanced nutrition and training."}`, priority: "high", category: "Action" },
        { title: "Health Risk", description: `Metabolic risk: ${waistRisk}. ${waistRisk !== "Low" ? "Central adiposity increases type 2 diabetes, heart disease, and metabolic syndrome risk regardless of BMI. Prioritize waist reduction." : "Low metabolic risk from waist measurement."} Skinny fat people have same health risks as overweight individuals because visceral fat (around organs) matters more than total weight.`, priority: "medium", category: "Health" }
      ],
      detailedBreakdown: { "Label": label, "BMI": b, "BF%": bf, "Waist": `${w}″`, "Lean Deficit": `${leanDeficit}%`, "Risk": riskScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="skinny-fat-calculator" title="Skinny Fat Calculator"
      description="Detect normal-weight obesity (skinny fat). Analyzes BMI vs body fat discrepancy, lean mass deficit, and metabolic syndrome risk."
      icon={Activity} calculate={calculate} onClear={() => { setBmi(23); setBodyFat(28); setWaist(36); setGender("male"); setResult(null) }}
      values={[bmi, bodyFat, waist, gender]} result={result}
      seoContent={<SeoContentGenerator title="Skinny Fat Calculator" description="Detect skinny fat condition and metabolic risk." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="BMI" val={bmi} set={setBmi} min={14} max={50} step={0.1} />
          <NumInput label="Body Fat" val={bodyFat} set={setBodyFat} min={5} max={55} step={0.5} suffix="%" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Waist Circumference" val={waist} set={setWaist} min={20} max={60} step={0.5} suffix="inches" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
      </div>} />
  )
}

// ─── 49. Genetic Potential Calculator ─────────────────────────────────────────
export function GeneticPotentialCalculator() {
  const [height, setHeight] = useState(175)
  const [wrist, setWrist] = useState(17.5)
  const [ankle, setAnkle] = useState(22)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 150, 210)
    const w = clamp(wrist, 13, 22)
    const a = clamp(ankle, 18, 30)

    // Martin Berkhan formula: Max LBM at ~5-6% BF
    const maxLBM_berkhan = r1(h - 100)
    // Casey Butt frame-adjusted
    const frameSize = r2((w + a) / 2)
    const maxLBM_adjusted = r1(maxLBM_berkhan * (frameSize / 19.5))  // 19.5 average frame

    const ffmi = r1(maxLBM_adjusted / ((h / 100) * (h / 100)))
    const naturalLimit = ffmi > 25 ? "At or near natural limit" : ffmi > 22 ? "Above average potential" : "Average potential"
    const yearsToMax = ffmi > 23 ? "5-7 years" : "7-10+ years"

    const frameCat = frameSize < 17.5 ? "Small Frame" : frameSize < 20.5 ? "Medium Frame" : "Large Frame"

    const status: 'good' | 'warning' | 'danger' = ffmi > 23 ? "good" : ffmi > 21 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Max Lean Mass Potential", value: `${maxLBM_adjusted} kg`, status: "good", description: `FFMI: ${ffmi} — ${naturalLimit} (${frameCat})` },
      healthScore: r0(clamp(ffmi * 4, 40, 95)),
      metrics: [
        { label: "Max Lean Body Mass", value: maxLBM_adjusted, unit: "kg", status: "good" },
        { label: "Predicted FFMI", value: ffmi, status: ffmi > 23 ? "good" : ffmi > 21 ? "warning" : "danger" },
        { label: "Frame Size", value: frameSize, unit: "cm", status: "normal" },
        { label: "Frame Category", value: frameCat, status: "normal" },
        { label: "Natural Limit", value: naturalLimit, status: "good" },
        { label: "Berkhan Estimate", value: maxLBM_berkhan, unit: "kg", status: "normal" },
        { label: "Frame-Adjusted", value: maxLBM_adjusted, unit: "kg", status: "good" },
        { label: "Years to Max", value: yearsToMax, status: "normal" }
      ],
      recommendations: [
        { title: "Genetic Potential", description: `Frame-adjusted max lean mass: ${maxLBM_adjusted} kg (FFMI: ${ffmi}). ${frameCat}: ${frameSize < 17.5 ? "smaller frame = slightly lower absolute muscle potential but can still look very muscular at lower body weight." : frameSize > 20.5 ? "larger frame = higher absolute muscle potential. Advantage in strength sports." : "average frame — standard muscle-building expectations apply."} Natural FFMI limit ≈ 25 (rarely exceeded without PEDs).`, priority: "high", category: "Potential" },
        { title: "Timeline", description: `Realistic muscle gain: Year 1: ~9-11 kg. Year 2: ~4-5 kg. Year 3: ~2-3 kg. Year 4+: ~1-1.5 kg/year. Total time to 90% potential: ${yearsToMax}. Most gains happen in first 2-3 years with proper training and nutrition.`, priority: "high", category: "Timeline" },
        { title: "Maximizing Potential", description: "Keys: 1) Progressive overload (increase weight/reps weekly). 2) Protein 1.6-2.2g/kg daily. 3) Caloric surplus during bulking (+300 kcal). 4) Sleep 7-9 hours. 5) Consistency > intensity. 6) Train each muscle 2x/week. Don't compare to enhanced athletes — natural limits are well-established.", priority: "medium", category: "Optimization" }
      ],
      detailedBreakdown: { "Height": `${h} cm`, "Wrist": `${w} cm`, "Ankle": `${a} cm`, "Frame": frameSize, "Max LBM": maxLBM_adjusted, "FFMI": ffmi }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="genetic-potential-calculator" title="Genetic Potential Calculator"
      description="Estimate maximum lean mass potential based on frame size. Uses height, wrist, and ankle measurements for natural bodybuilding limits."
      icon={Zap} calculate={calculate} onClear={() => { setHeight(175); setWrist(17.5); setAnkle(22); setResult(null) }}
      values={[height, wrist, ankle]} result={result}
      seoContent={<SeoContentGenerator title="Genetic Potential Calculator" description="Estimate natural muscle-building potential from frame size." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Height" val={height} set={setHeight} min={150} max={210} suffix="cm" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Wrist Circumference" val={wrist} set={setWrist} min={13} max={22} step={0.5} suffix="cm" />
          <NumInput label="Ankle Circumference" val={ankle} set={setAnkle} min={18} max={30} step={0.5} suffix="cm" />
        </div>
      </div>} />
  )
}

// ─── 51. Water Weight Calculator ──────────────────────────────────────────────
export function WaterWeightCalculator() {
  const [sodium, setSodium] = useState("moderate")
  const [carbIntake, setCarbIntake] = useState("moderate")
  const [hydration, setHydration] = useState("normal")
  const [weight, setWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 30, 250)

    const sodiumRetention = sodium === "high" ? 1.5 : sodium === "moderate" ? 0.5 : 0.2
    const carbRetention = carbIntake === "high" ? 2.0 : carbIntake === "moderate" ? 0.8 : 0.3
    const hydrationEffect = hydration === "dehydrated" ? -0.5 : hydration === "normal" ? 0 : 0.3

    const totalWaterWeight = r1(sodiumRetention + carbRetention + hydrationEffect)
    const glycogenWater = r1(carbRetention * 0.75) // each g carb stores 3-4g water
    const hormonalRisk = sodium === "high" || carbIntake === "high" ? "Elevated" : "Normal"

    const pctBodyWeight = r1((totalWaterWeight / w) * 100)

    setResult({
      primaryMetric: { label: "Estimated Water Weight", value: `${totalWaterWeight} kg`, status: totalWaterWeight < 1 ? "good" : totalWaterWeight < 2 ? "warning" : "danger", description: `${pctBodyWeight}% of body weight from water fluctuation` },
      healthScore: r0(clamp(100 - totalWaterWeight * 25, 20, 95)),
      metrics: [
        { label: "Total Water Weight", value: totalWaterWeight, unit: "kg", status: totalWaterWeight < 1 ? "good" : totalWaterWeight < 2 ? "warning" : "danger" },
        { label: "From Sodium", value: sodiumRetention, unit: "kg", status: sodiumRetention < 0.5 ? "good" : sodiumRetention < 1 ? "warning" : "danger" },
        { label: "From Carbs/Glycogen", value: carbRetention, unit: "kg", status: carbRetention < 0.8 ? "good" : carbRetention < 1.5 ? "warning" : "danger" },
        { label: "Glycogen-Bound Water", value: glycogenWater, unit: "kg", status: "normal" },
        { label: "Hydration Effect", value: hydrationEffect > 0 ? `+${hydrationEffect}` : `${hydrationEffect}`, unit: "kg", status: "normal" },
        { label: "% Body Weight", value: pctBodyWeight, unit: "%", status: pctBodyWeight < 1.5 ? "good" : pctBodyWeight < 3 ? "warning" : "danger" },
        { label: "Hormonal Retention Risk", value: hormonalRisk, status: hormonalRisk === "Normal" ? "good" : "warning" }
      ],
      recommendations: [
        { title: "Water Weight Analysis", description: `~${totalWaterWeight} kg is from temporary water retention. From sodium: +${sodiumRetention} kg (${sodium} intake). From carb/glycogen: +${carbRetention} kg (each 1g stored carb binds 3-4g water). This is NOT fat gain. It will normalize in 1-3 days with normal intake.`, priority: "high", category: "Analysis" },
        { title: "Reducing Water Retention", description: "1) Drink MORE water (2-3L/day — counterintuitive but reduces retention). 2) Reduce sodium gradually (don't eliminate). 3) Increase potassium (bananas, potatoes). 4) Walking/light cardio helps flush excess. 5) Don't panic-weigh after high-sodium/carb meal.", priority: "high", category: "Management" },
        { title: "Context", description: `${carbIntake === "high" ? "High carb day? Expect 1-3 kg scale increase from glycogen + water. This is fuel for muscles, not fat." : ""} ${sodium === "high" ? "High sodium meal can add 1-2 kg overnight. Returns to normal in 24-48h." : ""} Women: expect +1-3 kg premenstrually from hormonal water retention. Track 4-week weight trends, not daily fluctuations.`, priority: "medium", category: "Context" }
      ],
      detailedBreakdown: { "Total": `${totalWaterWeight} kg`, "Sodium": `${sodiumRetention} kg`, "Carbs": `${carbRetention} kg`, "Glycogen H₂O": `${glycogenWater} kg`, "Hydration": hydrationEffect, "% BW": `${pctBodyWeight}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="water-weight-calculator" title="Water Weight Calculator"
      description="Estimate temporary water retention from sodium, carbs, and hydration. Separates real fat gain from water fluctuation."
      icon={Droplets} calculate={calculate} onClear={() => { setSodium("moderate"); setCarbIntake("moderate"); setHydration("normal"); setWeight(75); setResult(null) }}
      values={[sodium, carbIntake, hydration, weight]} result={result}
      seoContent={<SeoContentGenerator title="Water Weight Calculator" description="Estimate water retention and weight fluctuation causes." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Body Weight" val={weight} set={setWeight} min={30} max={250} step={0.5} suffix="kg" />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Sodium Intake" val={sodium} set={setSodium} options={[{ value: "low", label: "Low (<1500mg)" }, { value: "moderate", label: "Moderate (1500-3000mg)" }, { value: "high", label: "High (>3000mg)" }]} />
          <SelectInput label="Carb Intake" val={carbIntake} set={setCarbIntake} options={[{ value: "low", label: "Low (<100g)" }, { value: "moderate", label: "Moderate (100-250g)" }, { value: "high", label: "High (>250g)" }]} />
        </div>
        <SelectInput label="Hydration Status" val={hydration} set={setHydration} options={[{ value: "dehydrated", label: "Dehydrated" }, { value: "normal", label: "Normal" }, { value: "overhydrated", label: "Over-hydrated" }]} />
      </div>} />
  )
}

// ─── 52. Glycogen Depletion Calculator ────────────────────────────────────────
export function GlycogenDepletionCalculator() {
  const [carbIntake, setCarbIntake] = useState(150)
  const [exerciseDuration, setExerciseDuration] = useState(60)
  const [exerciseType, setExerciseType] = useState("moderate")
  const [muscleMass, setMuscleMass] = useState(35)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const carbs = clamp(carbIntake, 0, 600)
    const dur = clamp(exerciseDuration, 0, 300)
    const mm = clamp(muscleMass, 15, 60)

    // Total glycogen storage: ~400-500g (muscle ~350-400g + liver ~100g)
    const maxGlycogen = r0(mm * 12 + 100)  // ~12g per kg muscle + 100g liver
    const carbsStored = Math.min(carbs, maxGlycogen)
    
    const burnRate = exerciseType === "heavy" ? 3.0 : exerciseType === "moderate" ? 2.0 : 1.2 // g/min
    const burnedDuringExercise = r0(Math.min(burnRate * dur, maxGlycogen))
    
    const currentGlycogen = r0(Math.max(0, carbsStored - burnedDuringExercise + maxGlycogen * 0.3)) // baseline ~30%
    const depletionPct = r0(clamp((1 - currentGlycogen / maxGlycogen) * 100, 0, 100))
    
    const refeedCarbs = r0(Math.max(0, maxGlycogen - currentGlycogen))
    const waterEffect = r1(refeedCarbs * 3 / 1000) // 3g water per g glycogen
    const perfImpact = depletionPct > 70 ? "Severe — strength/endurance significantly reduced" : depletionPct > 40 ? "Moderate — may feel sluggish" : "Minimal"

    const status: 'good' | 'warning' | 'danger' = depletionPct < 30 ? "good" : depletionPct < 60 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Glycogen Depletion", value: `${depletionPct}%`, status, description: `~${currentGlycogen}g stored of ${maxGlycogen}g capacity` },
      healthScore: Math.max(10, r0(100 - depletionPct)),
      metrics: [
        { label: "Depletion Level", value: depletionPct, unit: "%", status },
        { label: "Max Glycogen Capacity", value: maxGlycogen, unit: "g", status: "normal" },
        { label: "Current Glycogen", value: currentGlycogen, unit: "g", status: currentGlycogen > maxGlycogen * 0.5 ? "good" : "warning" },
        { label: "Burned During Exercise", value: burnedDuringExercise, unit: "g", status: "normal" },
        { label: "Refeed Carbs Needed", value: refeedCarbs, unit: "g", status: refeedCarbs > 200 ? "danger" : refeedCarbs > 100 ? "warning" : "good" },
        { label: "Water Weight from Refeed", value: waterEffect, unit: "kg", status: "normal" },
        { label: "Performance Impact", value: perfImpact, status: perfImpact.startsWith("Severe") ? "danger" : perfImpact.startsWith("Moderate") ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Glycogen Status", description: `${depletionPct}% depleted. Stores: ${currentGlycogen}g of ${maxGlycogen}g. ${depletionPct > 50 ? "Significantly depleted — prioritize carb refeed for recovery and next training session." : "Adequately fueled."} Burned ~${burnedDuringExercise}g during ${dur} min ${exerciseType} exercise.`, priority: "high", category: "Status" },
        { title: "Refeed Protocol", description: `Need ~${refeedCarbs}g carbs to fully replenish. Best sources: rice, oats, potatoes, fruit, pasta. Timing: within 2h post-exercise for fastest replenishment. Note: full replenishment takes 24-48h. Expect +${waterEffect} kg scale weight from glycogen-bound water (this is fuel, not fat).`, priority: "high", category: "Refeed" },
        { title: "Performance", description: `${perfImpact}. ${depletionPct > 60 ? "Low glycogen = poor workout performance, brain fog, fatigue. Endurance drops 30-50% below 50% glycogen. Strength training less affected but rep capacity is reduced." : "Adequate glycogen for normal training."} For fat loss: training in mild glycogen depletion (40-60%) can increase fat oxidation.`, priority: "medium", category: "Performance" }
      ],
      detailedBreakdown: { "Depletion": `${depletionPct}%`, "Current": `${currentGlycogen}g`, "Max": `${maxGlycogen}g`, "Burned": `${burnedDuringExercise}g`, "Refeed": `${refeedCarbs}g`, "Water": `+${waterEffect} kg` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="glycogen-depletion" title="Glycogen Depletion Calculator"
      description="Estimate muscle glycogen depletion from exercise and carb intake. Calculates refeed requirements and performance impact."
      icon={Zap} calculate={calculate} onClear={() => { setCarbIntake(150); setExerciseDuration(60); setExerciseType("moderate"); setMuscleMass(35); setResult(null) }}
      values={[carbIntake, exerciseDuration, exerciseType, muscleMass]} result={result}
      seoContent={<SeoContentGenerator title="Glycogen Depletion Calculator" description="Estimate glycogen depletion and carb refeed needs." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Daily Carb Intake" val={carbIntake} set={setCarbIntake} min={0} max={600} suffix="grams" />
          <NumInput label="Exercise Duration" val={exerciseDuration} set={setExerciseDuration} min={0} max={300} suffix="minutes" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Exercise Intensity" val={exerciseType} set={setExerciseType} options={[{ value: "light", label: "Light (walking, yoga)" }, { value: "moderate", label: "Moderate (weights, jogging)" }, { value: "heavy", label: "Heavy (HIIT, intense training)" }]} />
          <NumInput label="Lean Muscle Mass" val={muscleMass} set={setMuscleMass} min={15} max={60} suffix="kg" />
        </div>
      </div>} />
  )
}
