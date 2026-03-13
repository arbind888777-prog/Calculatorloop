"use client"

import { useState } from "react"
import { Scale, Target, Activity, TrendingDown, Calculator, BarChart3 } from "lucide-react"
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

// ─── 1. Ideal Weight Calculator (Anthropometric Weight Model) ─────────────────
export function AdvancedIdealWeightCalculator() {
  const [heightCm, setHeightCm] = useState(170)
  const [gender, setGender] = useState("male")
  const [age, setAge] = useState(30)
  const [frame, setFrame] = useState("medium")
  const [currentWeight, setCurrentWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(heightCm, 120, 230)
    const a = clamp(age, 18, 100)
    const w = clamp(currentWeight, 30, 300)
    const inchesOver5ft = Math.max(0, (h / 2.54) - 60)

    // Devine formula
    const devineBase = gender === "male" ? 50 : 45.5
    const devine = r1(devineBase + 2.3 * inchesOver5ft)

    // Robinson formula
    const robinsonBase = gender === "male" ? 52 : 49
    const robinsonFactor = gender === "male" ? 1.9 : 1.7
    const robinson = r1(robinsonBase + robinsonFactor * inchesOver5ft)

    // Miller formula
    const millerBase = gender === "male" ? 56.2 : 53.1
    const millerFactor = gender === "male" ? 1.41 : 1.36
    const miller = r1(millerBase + millerFactor * inchesOver5ft)

    // Hamwi formula
    const hamwiBase = gender === "male" ? 48 : 45.5
    const hamwiFactor = gender === "male" ? 2.7 : 2.2
    const hamwi = r1(hamwiBase + hamwiFactor * inchesOver5ft)

    // Frame adjustment
    const frameFactor = frame === "small" ? 0.9 : frame === "large" ? 1.1 : 1.0
    const avgIdeal = r1(((devine + robinson + miller + hamwi) / 4) * frameFactor)
    const rangeLow = r1(avgIdeal * 0.9)
    const rangeHigh = r1(avgIdeal * 1.1)

    // Age adjustment (slight increase after 40)
    const ageAdj = a > 50 ? 2 : a > 40 ? 1 : 0
    const adjustedIdeal = r1(avgIdeal + ageAdj)

    const deviation = r1(((w - adjustedIdeal) / adjustedIdeal) * 100)
    const absDeviation = Math.abs(deviation)

    const bmi = r1(w / ((h / 100) * (h / 100)))
    const idealBmi = r1(adjustedIdeal / ((h / 100) * (h / 100)))

    let status: 'good' | 'warning' | 'danger' = absDeviation < 10 ? "good" : absDeviation < 20 ? "warning" : "danger"
    const label = absDeviation < 5 ? "Healthy Range" : absDeviation < 10 ? "Slight Deviation" : absDeviation < 20 ? "Moderate Deviation" : "Significant Deviation"

    const riskClass = deviation > 25 ? "Obesity Risk" : deviation > 15 ? "Overweight" : deviation < -15 ? "Underweight Risk" : "Healthy"

    setResult({
      primaryMetric: { label: "Ideal Weight", value: `${adjustedIdeal} kg`, status, description: `${label} — Range: ${rangeLow}–${rangeHigh} kg (${frame} frame)` },
      healthScore: Math.max(0, r0(100 - absDeviation * 2.5)),
      metrics: [
        { label: "Ideal Weight (Avg)", value: adjustedIdeal, unit: "kg", status: "good" },
        { label: "Healthy Range", value: `${rangeLow}–${rangeHigh}`, unit: "kg", status: "good" },
        { label: "Current Weight", value: w, unit: "kg", status },
        { label: "Deviation", value: `${deviation > 0 ? "+" : ""}${deviation}%`, status },
        { label: "Devine Formula", value: r1(devine * frameFactor), unit: "kg", status: "normal" },
        { label: "Robinson Formula", value: r1(robinson * frameFactor), unit: "kg", status: "normal" },
        { label: "Miller Formula", value: r1(miller * frameFactor), unit: "kg", status: "normal" },
        { label: "Hamwi Formula", value: r1(hamwi * frameFactor), unit: "kg", status: "normal" },
        { label: "Current BMI", value: bmi, status: bmi >= 18.5 && bmi < 25 ? "good" : bmi < 30 ? "warning" : "danger" },
        { label: "Ideal BMI", value: idealBmi, status: "good" },
        { label: "Frame Adjustment", value: `×${frameFactor}`, status: "normal" },
        { label: "Risk Classification", value: riskClass, status: riskClass === "Healthy" ? "good" : riskClass === "Overweight" || riskClass === "Underweight Risk" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Ideal Weight Assessment", description: `Your ideal weight: ${adjustedIdeal} kg (range ${rangeLow}–${rangeHigh} kg). Current: ${w} kg (${deviation > 0 ? "+" : ""}${deviation}% deviation). Based on 4 clinical formulas averaged for ${frame} frame. ${absDeviation < 10 ? "You're within healthy range." : `${deviation > 0 ? "Consider gradual weight loss" : "Consider healthy weight gain"} at 0.5-1 kg/week.`}`, priority: "high", category: "Assessment" },
        { title: "Formulas Compared", description: `Devine: ${r1(devine * frameFactor)} kg, Robinson: ${r1(robinson * frameFactor)} kg, Miller: ${r1(miller * frameFactor)} kg, Hamwi: ${r1(hamwi * frameFactor)} kg. Frame adjustment: ${frame} (×${frameFactor}). No single formula is perfect — the average provides best estimate. Body composition (muscle vs fat) matters more than weight alone.`, priority: "high", category: "Formulas" },
        { title: "Risk & Action", description: `Classification: ${riskClass}. ${riskClass === "Obesity Risk" ? "Significant health risk: diabetes, cardiovascular disease, joint problems. Consult healthcare provider for comprehensive plan." : riskClass === "Underweight Risk" ? "Underweight increases infection risk, osteoporosis, fertility issues. Focus on calorie-dense nutritious foods." : "Maintain current healthy range with balanced diet and regular exercise."}`, priority: "medium", category: "Health" }
      ],
      detailedBreakdown: { "Height": `${h} cm`, "Gender": gender, "Age": a, "Frame": frame, "Current": `${w} kg`, "Ideal": `${adjustedIdeal} kg`, "Range": `${rangeLow}–${rangeHigh} kg`, "Deviation": `${deviation}%`, "BMI": bmi }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ideal-weight-calculator" title="Ideal Weight Calculator"
      description="Calculate ideal weight using Devine, Robinson, Miller, and Hamwi formulas with body frame correction. Multi-formula anthropometric model."
      icon={Scale} calculate={calculate} onClear={() => { setHeightCm(170); setGender("male"); setAge(30); setFrame("medium"); setCurrentWeight(75); setResult(null) }}
      values={[heightCm, gender, age, frame, currentWeight]} result={result}
      seoContent={<SeoContentGenerator title="Ideal Weight Calculator" description="Calculate your ideal body weight using multiple clinical formulas." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={heightCm} set={setHeightCm} min={120} max={230} suffix="cm" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={300} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
          <NumInput label="Age" val={age} set={setAge} min={18} max={100} suffix="years" />
        </div>
        <SelectInput label="Body Frame Size" val={frame} set={setFrame} options={[{ value: "small", label: "Small Frame" }, { value: "medium", label: "Medium Frame" }, { value: "large", label: "Large Frame" }]} />
      </div>} />
  )
}

// ─── 4. Body Frame Calculator (Skeletal Size Classification) ──────────────────
export function BodyFrameCalculator() {
  const [heightCm, setHeightCm] = useState(170)
  const [wristCm, setWristCm] = useState(17)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(heightCm, 120, 230)
    const wrist = clamp(wristCm, 10, 25)

    const ratio = r2(h / wrist)

    let frameSize = "", frameDesc = ""
    if (gender === "male") {
      if (ratio > 10.4) { frameSize = "Small"; frameDesc = "Narrow shoulders, small joints, lighter bones" }
      else if (ratio >= 9.6) { frameSize = "Medium"; frameDesc = "Average build, moderate joint size" }
      else { frameSize = "Large"; frameDesc = "Broad shoulders, thick joints, heavier bones" }
    } else {
      if (ratio > 11.0) { frameSize = "Small"; frameDesc = "Petite build, narrow wrists, light bone structure" }
      else if (ratio >= 10.1) { frameSize = "Medium"; frameDesc = "Average female build, moderate bone structure" }
      else { frameSize = "Large"; frameDesc = "Broader build, wider wrists, heavier bones" }
    }

    const weightAdjust = frameSize === "Small" ? "-10%" : frameSize === "Large" ? "+10%" : "±0%"

    setResult({
      primaryMetric: { label: "Body Frame", value: frameSize, status: "good", description: `${frameDesc} — Ratio: ${ratio}` },
      healthScore: 80,
      metrics: [
        { label: "Frame Size", value: frameSize, status: "good" },
        { label: "Height/Wrist Ratio", value: ratio, status: "normal" },
        { label: "Height", value: h, unit: "cm", status: "normal" },
        { label: "Wrist Circumference", value: wrist, unit: "cm", status: "normal" },
        { label: "Weight Adjustment", value: weightAdjust, status: "normal" },
        { label: "Frame Category", value: frameDesc, status: "good" },
        { label: "Male Ranges", value: "Small >10.4 | Med 9.6-10.4 | Large <9.6", status: "normal" },
        { label: "Female Ranges", value: "Small >11.0 | Med 10.1-11.0 | Large <10.1", status: "normal" }
      ],
      recommendations: [
        { title: "Frame Classification", description: `${frameSize} frame (ratio: ${ratio}). Body frame determines your bone structure and affects ideal weight targets. ${frameSize} framed individuals should adjust standard ideal weight calculators by ${weightAdjust}. Frame size is genetic and does not change with diet or exercise.`, priority: "high", category: "Classification" },
        { title: "Weight Implications", description: `${frameSize === "Large" ? "Larger frames naturally weigh more — don't compare to small-framed people. Standard BMI charts may overestimate your risk. You carry more bone and muscle mass." : frameSize === "Small" ? "Smaller frames weigh less naturally. Standard weight ranges may overestimate your ideal. Focus on body fat % rather than total weight." : "Medium frame — standard weight charts apply well to you."} Always consider body composition alongside frame.`, priority: "high", category: "Weight" },
        { title: "Measurement Tips", description: `Wrist measurement: wrap tape around narrowest point of dominant wrist (just below the wrist bone). Should be snug but not tight. Alternative: wrap thumb and middle finger around wrist. Overlap = small frame, touch = medium, gap = large.`, priority: "medium", category: "Method" }
      ],
      detailedBreakdown: { "Height": `${h} cm`, "Wrist": `${wrist} cm`, "Ratio": ratio, "Frame": frameSize, "Gender": gender, "Weight Adj": weightAdjust }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="body-frame-calculator" title="Body Frame Calculator"
      description="Determine skeletal frame size from height-to-wrist ratio. Classifies frame as Small, Medium, or Large for accurate weight targets."
      icon={Scale} calculate={calculate} onClear={() => { setHeightCm(170); setWristCm(17); setGender("male"); setResult(null) }}
      values={[heightCm, wristCm, gender]} result={result}
      seoContent={<SeoContentGenerator title="Body Frame Calculator" description="Calculate your body frame size for accurate ideal weight." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Height" val={heightCm} set={setHeightCm} min={120} max={230} suffix="cm" />
          <NumInput label="Wrist Circumference" val={wristCm} set={setWristCm} min={10} max={25} step={0.1} suffix="cm" />
        </div>
        <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      </div>} />
  )
}

// ─── 5. Weight Goal Tracker (Progress Monitoring System) ──────────────────────
export function WeightGoalTracker() {
  const [startWeight, setStartWeight] = useState(90)
  const [currentWeight, setCurrentWeight] = useState(82)
  const [goalWeight, setGoalWeight] = useState(75)
  const [weeksIn, setWeeksIn] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sw = clamp(startWeight, 30, 300)
    const cw = clamp(currentWeight, 30, 300)
    const gw = clamp(goalWeight, 30, 300)
    const weeks = clamp(weeksIn, 1, 200)

    const totalToLose = r1(sw - gw)
    const lostSoFar = r1(sw - cw)
    const remaining = r1(cw - gw)
    const progressPct = totalToLose > 0 ? r0(clamp((lostSoFar / totalToLose) * 100, 0, 100)) : 0
    const weeklyRate = weeks > 0 ? r2(lostSoFar / weeks) : 0
    const weeksRemaining = weeklyRate > 0 ? r0(remaining / weeklyRate) : 0

    const onTrack = weeklyRate >= 0.3 && weeklyRate <= 1.2
    const adherenceProb = r0(clamp(progressPct * 0.8 + (onTrack ? 20 : 0), 10, 95))

    const status: 'good' | 'warning' | 'danger' = progressPct >= 75 ? "good" : progressPct >= 40 ? "warning" : "danger"
    const milestones = [
      { pct: 25, weight: r1(sw - totalToLose * 0.25) },
      { pct: 50, weight: r1(sw - totalToLose * 0.50) },
      { pct: 75, weight: r1(sw - totalToLose * 0.75) },
      { pct: 100, weight: gw }
    ]
    const nextMilestone = milestones.find(m => cw > m.weight)

    setResult({
      primaryMetric: { label: "Progress", value: `${progressPct}%`, status, description: `Lost ${lostSoFar} kg of ${totalToLose} kg goal — ${remaining > 0 ? remaining + " kg remaining" : "Goal Reached!"}` },
      healthScore: progressPct,
      metrics: [
        { label: "Progress", value: progressPct, unit: "%", status },
        { label: "Starting Weight", value: sw, unit: "kg", status: "normal" },
        { label: "Current Weight", value: cw, unit: "kg", status },
        { label: "Goal Weight", value: gw, unit: "kg", status: "good" },
        { label: "Lost So Far", value: lostSoFar, unit: "kg", status: lostSoFar > 0 ? "good" : "danger" },
        { label: "Remaining", value: remaining > 0 ? remaining : 0, unit: "kg", status: remaining <= 0 ? "good" : "normal" },
        { label: "Weekly Rate", value: weeklyRate, unit: "kg/week", status: weeklyRate >= 0.3 && weeklyRate <= 1 ? "good" : weeklyRate > 1 ? "warning" : "danger" },
        { label: "Weeks Active", value: weeks, status: "normal" },
        { label: "Est. Weeks Left", value: weeksRemaining > 0 ? weeksRemaining : 0, status: "normal" },
        { label: "Next Milestone", value: nextMilestone ? `${nextMilestone.pct}% — ${nextMilestone.weight} kg` : "All milestones reached!", status: nextMilestone ? "normal" : "good" },
        { label: "Goal Adherence", value: adherenceProb, unit: "%", status: adherenceProb > 60 ? "good" : adherenceProb > 35 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Progress Analysis", description: `${progressPct}% complete: ${lostSoFar} kg lost in ${weeks} weeks (${weeklyRate} kg/week). ${onTrack ? "On track — sustainable rate of 0.5-1 kg/week preserves muscle." : weeklyRate > 1.2 ? "Too fast! >1.2 kg/week risks muscle loss, gallstones, metabolic slowdown. Reduce deficit slightly." : "Slow progress. Review calorie intake and activity levels."}`, priority: "high", category: "Progress" },
        { title: "Goal Timeline", description: `${remaining > 0 ? `~${weeksRemaining} weeks to goal at current rate (${weeklyRate} kg/week). ` : "Goal reached! Focus on maintenance. "}Milestones: 25% (${milestones[0].weight} kg), 50% (${milestones[1].weight} kg), 75% (${milestones[2].weight} kg), Goal (${gw} kg). ${nextMilestone ? `Next: ${nextMilestone.pct}% at ${nextMilestone.weight} kg.` : "All milestones complete!"}`, priority: "high", category: "Timeline" },
        { title: "Adherence Tips", description: `Adherence probability: ${adherenceProb}%. 95% of diets fail long-term. Success factors: 1) Track daily (weighing + food logging). 2) Allow 2-3 lb daily fluctuations (water, sodium). 3) Celebrate milestones. 4) Diet breaks every 8-12 weeks (eat at maintenance for 1-2 weeks). 5) Weight loss plateaus are normal — last 2-4 weeks.`, priority: "medium", category: "Adherence" }
      ],
      detailedBreakdown: { "Start": `${sw} kg`, "Current": `${cw} kg`, "Goal": `${gw} kg`, "Lost": `${lostSoFar} kg`, "Left": `${remaining} kg`, "Progress": `${progressPct}%`, "Rate": `${weeklyRate} kg/wk`, "Weeks In": weeks }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-goal-tracker" title="Weight Goal Tracker"
      description="Track weight loss or gain progress with milestone markers, weekly rate analysis, and goal adherence prediction."
      icon={Target} calculate={calculate} onClear={() => { setStartWeight(90); setCurrentWeight(82); setGoalWeight(75); setWeeksIn(8); setResult(null) }}
      values={[startWeight, currentWeight, goalWeight, weeksIn]} result={result}
      seoContent={<SeoContentGenerator title="Weight Goal Tracker" description="Track weight loss progress and milestones." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Weight" val={startWeight} set={setStartWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={300} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Goal Weight" val={goalWeight} set={setGoalWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Weeks So Far" val={weeksIn} set={setWeeksIn} min={1} max={200} suffix="weeks" />
        </div>
      </div>} />
  )
}

// ─── 7. Weight Maintenance Planner (Long-Term Stability Model) ────────────────
export function WeightMaintenancePlanner() {
  const [goalWeight, setGoalWeight] = useState(70)
  const [heightCm, setHeightCm] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [activityLevel, setActivityLevel] = useState("moderate")
  const [dietAdherence, setDietAdherence] = useState("good")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const gw = clamp(goalWeight, 30, 200)
    const h = clamp(heightCm, 120, 230)
    const a = clamp(age, 18, 100)

    // Mifflin-St Jeor BMR
    const bmr = gender === "male"
      ? 10 * gw + 6.25 * h - 5 * a + 5
      : 10 * gw + 6.25 * h - 5 * a - 161

    const actMultiplier = activityLevel === "sedentary" ? 1.2 : activityLevel === "light" ? 1.375 : activityLevel === "moderate" ? 1.55 : activityLevel === "active" ? 1.725 : 1.9
    const maintenance = r0(bmr * actMultiplier)
    const rangeLow = r0(maintenance - 150)
    const rangeHigh = r0(maintenance + 150)

    // Metabolic adaptation: after dieting, maintenance is ~5-15% lower
    const adaptedMaint = r0(maintenance * 0.92)

    // Regain probability based on adherence
    let regainProb = 0
    if (dietAdherence === "excellent") regainProb = 15
    else if (dietAdherence === "good") regainProb = 30
    else if (dietAdherence === "fair") regainProb = 55
    else regainProb = 75

    const stabilityScore = r0(clamp(100 - regainProb, 10, 95))
    const status: 'good' | 'warning' | 'danger' = regainProb < 30 ? "good" : regainProb < 55 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Maintenance Calories", value: `${maintenance} kcal/day`, status: "good", description: `Range: ${rangeLow}–${rangeHigh} kcal — Stability score: ${stabilityScore}/100` },
      healthScore: stabilityScore,
      metrics: [
        { label: "Maintenance Calories", value: maintenance, unit: "kcal/day", status: "good" },
        { label: "Calorie Range", value: `${rangeLow}–${rangeHigh}`, unit: "kcal", status: "good" },
        { label: "Adapted Maintenance", value: adaptedMaint, unit: "kcal", status: "warning" },
        { label: "BMR", value: r0(bmr), unit: "kcal", status: "normal" },
        { label: "Activity Multiplier", value: `×${actMultiplier}`, status: "normal" },
        { label: "Diet Adherence", value: dietAdherence.charAt(0).toUpperCase() + dietAdherence.slice(1), status: dietAdherence === "excellent" || dietAdherence === "good" ? "good" : "warning" },
        { label: "Regain Probability", value: regainProb, unit: "% (5-year)", status },
        { label: "Stability Score", value: stabilityScore, unit: "/100", status: stabilityScore > 60 ? "good" : stabilityScore > 35 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Maintenance Strategy", description: `Target: ${maintenance} kcal/day (${rangeLow}–${rangeHigh} range). After weight loss, metabolic adaptation reduces TDEE by ~8-15%. Your adapted maintenance may be closer to ${adaptedMaint} kcal initially. Gradually increase calories by 100 kcal/week over 4-8 weeks (reverse dieting) to restore metabolic rate.`, priority: "high", category: "Strategy" },
        { title: "Preventing Regain", description: `Regain probability: ${regainProb}% over 5 years. 80% of people regain within 2 years. Prevention: 1) Continue tracking food. 2) Weigh weekly (catch 2-3 kg regain early). 3) Maintain exercise. 4) Keep protein high (1.6-2g/kg). 5) Have an "action plan" if weight rises 2+ kg.`, priority: "high", category: "Prevention" },
        { title: "Long-Term Success", description: `Stability: ${stabilityScore}/100. National Weight Control Registry (10,000+ successful maintainers): 78% eat breakfast daily, 75% weigh weekly, 62% watch <10 hrs TV/week, 90% exercise ~1 hr/day. The transition from "dieting" to "this is how I eat" is the key psychological shift.`, priority: "medium", category: "Success" }
      ],
      detailedBreakdown: { "Goal": `${gw} kg`, "BMR": r0(bmr), "Multiplier": actMultiplier, "Maintenance": maintenance, "Adapted": adaptedMaint, "Regain %": regainProb, "Stability": stabilityScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-maintenance-planner" title="Weight Maintenance Planner"
      description="Plan long-term weight stability after achieving goal weight. Includes metabolic adaptation, regain prevention, and stability scoring."
      icon={Target} calculate={calculate} onClear={() => { setGoalWeight(70); setHeightCm(170); setAge(30); setGender("male"); setActivityLevel("moderate"); setDietAdherence("good"); setResult(null) }}
      values={[goalWeight, heightCm, age, gender, activityLevel, dietAdherence]} result={result}
      seoContent={<SeoContentGenerator title="Weight Maintenance Planner" description="Plan long-term weight maintenance and prevent regain." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Goal Weight" val={goalWeight} set={setGoalWeight} min={30} max={200} step={0.5} suffix="kg" />
          <NumInput label="Height" val={heightCm} set={setHeightCm} min={120} max={230} suffix="cm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={18} max={100} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Activity Level" val={activityLevel} set={setActivityLevel} options={[{ value: "sedentary", label: "Sedentary" }, { value: "light", label: "Lightly Active" }, { value: "moderate", label: "Moderately Active" }, { value: "active", label: "Very Active" }, { value: "extreme", label: "Extremely Active" }]} />
          <SelectInput label="Diet Adherence" val={dietAdherence} set={setDietAdherence} options={[{ value: "excellent", label: "Excellent" }, { value: "good", label: "Good" }, { value: "fair", label: "Fair" }, { value: "poor", label: "Poor" }]} />
        </div>
      </div>} />
  )
}

// ─── 9. Body Recomposition Planner ────────────────────────────────────────────
export function BodyRecompositionPlanner() {
  const [bodyFat, setBodyFat] = useState(20)
  const [weight, setWeight] = useState(80)
  const [proteinGkg, setProteinGkg] = useState(1.8)
  const [trainingFreq, setTrainingFreq] = useState(4)
  const [experience, setExperience] = useState("intermediate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bf = clamp(bodyFat, 5, 50)
    const w = clamp(weight, 30, 200)
    const prot = clamp(proteinGkg, 0.5, 3.5)
    const freq = clamp(trainingFreq, 0, 7)

    const fatMass = r1(w * bf / 100)
    const leanMass = r1(w - fatMass)
    const proteinTotal = r0(prot * w)

    // Recomposition potential: higher for beginners, higher body fat, adequate protein
    let potential = 30  // base

    // Training experience
    if (experience === "beginner") potential += 30
    else if (experience === "intermediate") potential += 15
    else potential += 5

    // Body fat level (higher = more room)
    if (bf > 25) potential += 15
    else if (bf > 18) potential += 10
    else if (bf > 12) potential += 5

    // Protein adequacy
    if (prot >= 2.0) potential += 10
    else if (prot >= 1.6) potential += 7
    else if (prot >= 1.2) potential += 3

    // Training frequency
    if (freq >= 4) potential += 10
    else if (freq >= 3) potential += 6
    else potential += 2

    potential = r0(clamp(potential, 10, 95))

    // Monthly projections
    const monthlyFatLoss = experience === "beginner" ? r1(2) : experience === "intermediate" ? r1(1.5) : r1(1)
    const monthlyMusclGain = experience === "beginner" ? r1(0.8) : experience === "intermediate" ? r1(0.4) : r1(0.2)

    const optimalProtein = r1(Math.max(1.6, Math.min(2.4, bf > 20 ? 1.8 : 2.2)) * w)

    const status: 'good' | 'warning' | 'danger' = potential > 60 ? "good" : potential > 35 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Recomp Potential", value: `${potential}/100`, status, description: `${potential > 60 ? "High" : potential > 35 ? "Moderate" : "Low"} — ${experience} lifter, ${bf}% body fat` },
      healthScore: potential,
      metrics: [
        { label: "Recomp Score", value: potential, unit: "/100", status },
        { label: "Current Body Fat", value: bf, unit: "%", status: bf > 25 ? "warning" : bf > 12 ? "good" : "normal" },
        { label: "Fat Mass", value: fatMass, unit: "kg", status: "normal" },
        { label: "Lean Mass", value: leanMass, unit: "kg", status: "good" },
        { label: "Protein Intake", value: proteinTotal, unit: "g/day", status: prot >= 1.6 ? "good" : prot >= 1.2 ? "warning" : "danger" },
        { label: "Optimal Protein", value: r0(optimalProtein), unit: "g/day", status: "good" },
        { label: "Training Frequency", value: freq, unit: "days/week", status: freq >= 3 ? "good" : "warning" },
        { label: "Experience Level", value: experience.charAt(0).toUpperCase() + experience.slice(1), status: "normal" },
        { label: "Est. Monthly Fat Loss", value: monthlyFatLoss, unit: "kg/month", status: "good" },
        { label: "Est. Monthly Muscle Gain", value: monthlyMusclGain, unit: "kg/month", status: "good" }
      ],
      recommendations: [
        { title: "Recomposition Feasibility", description: `Score: ${potential}/100. Body recomposition (simultaneous fat loss + muscle gain) works best for: beginners (you: ${experience}), higher body fat (yours: ${bf}%), adequate protein, and consistent training. ${potential > 60 ? "Excellent candidate!" : potential > 35 ? "Possible but slower." : "Consider dedicated bulk/cut cycles instead."}`, priority: "high", category: "Assessment" },
        { title: "Protocol", description: `Eat at slight deficit (-300 to -500 kcal) or maintenance. Protein: ${proteinTotal}g/day (${prot}g/kg) — ${prot >= 1.6 ? "adequate" : `increase to ${r0(optimalProtein)}g/day (2.0g/kg)`}. Train ${freq}x/week with progressive overload. Prioritize compound lifts. Sleep 7-9 hrs (growth hormone release). Expected results: -${monthlyFatLoss} kg fat, +${monthlyMusclGain} kg muscle per month.`, priority: "high", category: "Protocol" },
        { title: "Tracking Recomp", description: `Scale weight may not change during recomposition! Track: 1) Body measurements (waist, chest, arms). 2) Progress photos monthly. 3) Strength gains in gym. 4) Body fat % (calipers/DEXA). Recomp takes patience — visible results in 8-16 weeks. If progress stalls, switch to dedicated cut phase.`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Weight": `${w} kg`, "BF%": bf, "Fat": `${fatMass} kg`, "Lean": `${leanMass} kg`, "Protein": `${proteinTotal}g`, "Training": `${freq}x/wk`, "Level": experience, "Potential": potential }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="body-recomposition-calculator" title="Body Recomposition Planner"
      description="Optimize simultaneous fat loss and muscle gain. Calculates recomposition potential, protein requirements, and monthly projections."
      icon={Activity} calculate={calculate} onClear={() => { setBodyFat(20); setWeight(80); setProteinGkg(1.8); setTrainingFreq(4); setExperience("intermediate"); setResult(null) }}
      values={[bodyFat, weight, proteinGkg, trainingFreq, experience]} result={result}
      seoContent={<SeoContentGenerator title="Body Recomposition Planner" description="Plan simultaneous fat loss and muscle gain." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Body Fat" val={bodyFat} set={setBodyFat} min={5} max={50} step={0.5} suffix="%" />
          <NumInput label="Current Weight" val={weight} set={setWeight} min={30} max={200} step={0.5} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Protein Intake" val={proteinGkg} set={setProteinGkg} min={0.5} max={3.5} step={0.1} suffix="g/kg" />
          <NumInput label="Training Frequency" val={trainingFreq} set={setTrainingFreq} min={0} max={7} suffix="days/week" />
        </div>
        <SelectInput label="Training Experience" val={experience} set={setExperience} options={[{ value: "beginner", label: "Beginner (<1 year)" }, { value: "intermediate", label: "Intermediate (1-3 years)" }, { value: "advanced", label: "Advanced (3+ years)" }]} />
      </div>} />
  )
}

// ─── 10. Weekly Calorie Budget ────────────────────────────────────────────────
export function WeeklyCalorieBudget() {
  const [dailyTarget, setDailyTarget] = useState(2000)
  const [cheatMeals, setCheatMeals] = useState(1)
  const [cheatExtra, setCheatExtra] = useState(500)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const daily = clamp(dailyTarget, 800, 5000)
    const cheats = clamp(cheatMeals, 0, 7)
    const extra = clamp(cheatExtra, 0, 3000)

    const weeklyBase = daily * 7
    const weeklyWithCheats = weeklyBase + cheats * extra
    const effectiveDaily = r0(weeklyWithCheats / 7)

    // Flexible budget: reduce non-cheat days to compensate
    const nonCheatDays = 7 - cheats
    const adjustedDailyNonCheat = nonCheatDays > 0 ? r0((weeklyBase - cheats * extra) / nonCheatDays) : daily
    const cheatDayCals = daily + extra

    const surplusPct = weeklyBase > 0 ? r0(((weeklyWithCheats - weeklyBase) / weeklyBase) * 100) : 0
    const flexible = adjustedDailyNonCheat > 1200

    const status: 'good' | 'warning' | 'danger' = surplusPct < 5 ? "good" : surplusPct < 15 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Weekly Budget", value: `${weeklyBase} kcal`, status: "good", description: `Effective daily: ${effectiveDaily} kcal (${cheats > 0 ? `includes ${cheats} cheat meal(s)` : "no cheat meals"})` },
      healthScore: flexible ? (surplusPct < 10 ? 85 : 60) : 40,
      metrics: [
        { label: "Weekly Budget", value: weeklyBase, unit: "kcal", status: "good" },
        { label: "Weekly w/ Cheats", value: weeklyWithCheats, unit: "kcal", status },
        { label: "Daily Target", value: daily, unit: "kcal", status: "good" },
        { label: "Effective Daily", value: effectiveDaily, unit: "kcal", status },
        { label: "Cheat Meals", value: cheats, unit: "/week", status: cheats <= 2 ? "good" : "warning" },
        { label: "Cheat Day Calories", value: cheatDayCals, unit: "kcal", status: "normal" },
        { label: "Adjusted Non-Cheat", value: adjustedDailyNonCheat, unit: "kcal", status: adjustedDailyNonCheat >= 1200 ? "good" : "danger" },
        { label: "Weekly Surplus", value: `+${surplusPct}%`, status },
        { label: "Flexible Diet", value: flexible ? "Viable" : "Too restrictive", status: flexible ? "good" : "danger" }
      ],
      recommendations: [
        { title: "Budget Approach", description: `Weekly budget: ${weeklyBase} kcal (${daily}/day × 7). With ${cheats} cheat meal(s) at +${extra} kcal each: ${weeklyWithCheats} kcal total (${effectiveDaily} kcal effective daily). ${surplusPct > 10 ? "Cheat meals adding significant surplus — may slow progress." : "Within manageable range."}`, priority: "high", category: "Budget" },
        { title: "Flexible Dieting", description: `${flexible ? `To accommodate cheat meals, eat ${adjustedDailyNonCheat} kcal on non-cheat days (vs ${daily} standard). This balances weekly total. ` : `Warning: compensating makes non-cheat days too low (${adjustedDailyNonCheat} kcal). Reduce cheat frequency or extra calories. `}Flexible dieting (IIFYM) improves adherence by 40-60% vs rigid dieting. 80/20 rule: 80% whole foods, 20% enjoyment foods.`, priority: "high", category: "Flexibility" },
        { title: "Cheat Meal Strategy", description: `Optimize cheat meals: 1) Plan them (don't improvise). 2) Eat slowly and enjoy. 3) High protein cheat foods reduce total surplus. 4) Post-cheat: extra 30 min walk (burns ~150 kcal). 5) Don't skip next day meals (creates binge-restrict cycle). 1-2 planned cheat meals/week is sustainable long-term.`, priority: "medium", category: "Strategy" }
      ],
      detailedBreakdown: { "Daily": `${daily} kcal`, "Weekly": `${weeklyBase} kcal`, "Cheats": cheats, "Extra/Cheat": `${extra} kcal`, "Total w/ Cheats": weeklyWithCheats, "Effective": `${effectiveDaily}/day`, "Adjusted": `${adjustedDailyNonCheat}/day` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weekly-calorie-budget" title="Weekly Calorie Budget"
      description="Manage daily calories as a weekly budget with flexible cheat meal planning. Balance strict days with enjoyment days."
      icon={Calculator} calculate={calculate} onClear={() => { setDailyTarget(2000); setCheatMeals(1); setCheatExtra(500); setResult(null) }}
      values={[dailyTarget, cheatMeals, cheatExtra]} result={result}
      seoContent={<SeoContentGenerator title="Weekly Calorie Budget" description="Plan weekly calorie budget with flexible cheat meals." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Daily Calorie Target" val={dailyTarget} set={setDailyTarget} min={800} max={5000} step={50} suffix="kcal" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Cheat Meals Per Week" val={cheatMeals} set={setCheatMeals} min={0} max={7} suffix="meals" />
          <NumInput label="Extra Calories Per Cheat" val={cheatExtra} set={setCheatExtra} min={0} max={3000} step={50} suffix="kcal" />
        </div>
      </div>} />
  )
}

// ─── 12. BMI Goal Tracker ─────────────────────────────────────────────────────
export function BMIGoalTracker() {
  const [currentBmi, setCurrentBmi] = useState(28)
  const [targetBmi, setTargetBmi] = useState(24)
  const [heightCm, setHeightCm] = useState(170)
  const [currentWeight, setCurrentWeight] = useState(81)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cBmi = clamp(currentBmi, 12, 60)
    const tBmi = clamp(targetBmi, 15, 40)
    const h = clamp(heightCm, 120, 230)
    const w = clamp(currentWeight, 30, 300)

    const hm = h / 100
    const actualBmi = r1(w / (hm * hm))
    const bmiDiff = r1(actualBmi - tBmi)
    const weightAtTarget = r1(tBmi * hm * hm)
    const weightChange = r1(w - weightAtTarget)

    const progress = bmiDiff > 0 ? r0(clamp(((cBmi - actualBmi) / (cBmi - tBmi)) * 100, 0, 100)) : 100
    const weeksEst = weightChange > 0 ? r0(weightChange / 0.5) : 0

    const bmiCat = actualBmi < 18.5 ? "Underweight" : actualBmi < 25 ? "Normal" : actualBmi < 30 ? "Overweight" : "Obese"
    const targetCat = tBmi < 18.5 ? "Underweight" : tBmi < 25 ? "Normal" : tBmi < 30 ? "Overweight" : "Obese"

    const status: 'good' | 'warning' | 'danger' = actualBmi >= 18.5 && actualBmi < 25 ? "good" : actualBmi < 30 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Current BMI", value: `${actualBmi}`, status, description: `${bmiCat} — Target: ${tBmi} (${targetCat}). Need ${weightChange > 0 ? "lose" : "gain"} ${Math.abs(weightChange)} kg` },
      healthScore: progress,
      metrics: [
        { label: "Current BMI", value: actualBmi, status },
        { label: "BMI Category", value: bmiCat, status },
        { label: "Target BMI", value: tBmi, status: "good" },
        { label: "Target Category", value: targetCat, status: "good" },
        { label: "BMI Difference", value: r1(Math.abs(bmiDiff)), unit: "points", status: Math.abs(bmiDiff) < 2 ? "good" : Math.abs(bmiDiff) < 5 ? "warning" : "danger" },
        { label: "Current Weight", value: w, unit: "kg", status: "normal" },
        { label: "Weight at Target BMI", value: weightAtTarget, unit: "kg", status: "good" },
        { label: "Weight Change Needed", value: `${weightChange > 0 ? "-" : "+"}${r1(Math.abs(weightChange))}`, unit: "kg", status: "normal" },
        { label: "Est. Weeks", value: weeksEst, unit: "weeks", status: "normal" },
        { label: "Progress", value: progress, unit: "%", status: progress > 60 ? "good" : progress > 30 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "BMI Assessment", description: `BMI: ${actualBmi} (${bmiCat}). Target: ${tBmi} (${targetCat}). Need to ${weightChange > 0 ? "lose" : "gain"} ${r1(Math.abs(weightChange))} kg to reach goal. At 0.5 kg/week: ~${weeksEst} weeks. BMI limitations: doesn't account for muscle mass, bone density, or body composition.`, priority: "high", category: "Assessment" },
        { title: "BMI Ranges", description: `Underweight: <18.5 | Normal: 18.5-24.9 | Overweight: 25-29.9 | Obese: 30+. Optimal health outcomes: BMI 20-25. ${actualBmi > 25 ? "Each 5-point BMI increase above 25: +30% all-cause mortality, +40% cardiovascular risk." : actualBmi < 18.5 ? "Underweight increases infection risk, osteoporosis, fertility issues." : "Normal BMI — maintain with balanced diet and exercise."}`, priority: "high", category: "Health" },
        { title: "Beyond BMI", description: `BMI is a screening tool, not diagnostic. Better measures: body fat %, waist circumference (>102cm men / >88cm women = high risk), waist-to-hip ratio. Athletes may have "overweight" BMI with healthy body composition. Track multiple metrics for complete picture.`, priority: "medium", category: "Limitations" }
      ],
      detailedBreakdown: { "BMI": actualBmi, "Category": bmiCat, "Target": tBmi, "Weight": `${w} kg`, "Target Weight": `${weightAtTarget} kg`, "Change": `${weightChange} kg`, "Weeks": weeksEst, "Progress": `${progress}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="bmi-goal-tracker" title="BMI Goal Tracker"
      description="Track BMI progress toward target. Calculates weight needed, timeline, and provides BMI category context."
      icon={BarChart3} calculate={calculate} onClear={() => { setCurrentBmi(28); setTargetBmi(24); setHeightCm(170); setCurrentWeight(81); setResult(null) }}
      values={[currentBmi, targetBmi, heightCm, currentWeight]} result={result}
      seoContent={<SeoContentGenerator title="BMI Goal Tracker" description="Track BMI improvement progress toward your target." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Height" val={heightCm} set={setHeightCm} min={120} max={230} suffix="cm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting BMI" val={currentBmi} set={setCurrentBmi} min={12} max={60} step={0.1} suffix="kg/m²" />
          <NumInput label="Target BMI" val={targetBmi} set={setTargetBmi} min={15} max={40} step={0.1} suffix="kg/m²" />
        </div>
      </div>} />
  )
}
