"use client"

import { useState } from "react"
import { Scale, TrendingDown, Target, Flame, Calendar } from "lucide-react"
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

// ─── 1. Weight Loss Calculator ────────────────────────────────────────────────
export function WeightLossCalculator() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(85)
  const [height, setHeight] = useState(170)
  const [goalWeight, setGoalWeight] = useState(75)
  const [activity, setActivity] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    const w = clamp(weight, 20, 400)
    const h = clamp(height, 100, 250)
    const g = clamp(goalWeight, 20, 350)

    const bmrBase = gender === "male"
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a

    const actMultipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9
    }
    const tdee = r0(bmrBase * (actMultipliers[activity] ?? 1.55))

    const totalKg = w - g
    const totalKcal = r0(totalKg * 7700)
    const daily500 = r0(tdee - 500)
    const daily750 = r0(tdee - 750)
    const weeks500 = r1(totalKcal / (500 * 7))
    const weeks750 = r1(totalKcal / (750 * 7))
    const bmiNow = r1(w / Math.pow(h / 100, 2))
    const bmiGoal = r1(g / Math.pow(h / 100, 2))

    let feasibility = ""
    let status: 'normal' | 'warning' | 'danger' | 'good' = "good"
    if (g >= w) { feasibility = "Goal weight ≥ current weight — no fat loss needed."; status = "normal" }
    else if (totalKg > 50) { feasibility = "Very large goal — requires long-term commitment (1–2+ years)."; status = "warning" }
    else { feasibility = `Achievable in ~${r0(weeks500)} weeks with 500 kcal/day deficit.`; status = "good" }

    setResult({
      primaryMetric: { label: "TDEE", value: tdee, unit: "kcal/day", status, description: `${feasibility}` },
      healthScore: Math.min(100, r0(100 - totalKg * 1.5)),
      metrics: [
        { label: "Current BMI", value: bmiNow, status: bmiNow < 18.5 ? "warning" : bmiNow < 25 ? "good" : bmiNow < 30 ? "warning" : "danger" },
        { label: "Goal BMI", value: bmiGoal, status: bmiGoal < 18.5 ? "warning" : bmiGoal < 25 ? "good" : "warning" },
        { label: "Weight to Lose", value: r1(totalKg), unit: "kg", status: "normal" },
        { label: "Calories to Lose Total", value: r0(totalKcal).toLocaleString(), unit: "kcal", status: "normal" },
        { label: "Diet at 500 kcal deficit", value: daily500, unit: "kcal/day", status: "good" },
        { label: "Diet at 750 kcal deficit", value: daily750, unit: "kcal/day", status: "good" },
        { label: "Time at 500 kcal deficit", value: r0(weeks500), unit: "weeks", status: "good" },
        { label: "Time at 750 kcal deficit", value: r0(weeks750), unit: "weeks", status: "good" }
      ],
      recommendations: [
        { title: "Realistic Rate", description: "Safe, sustainable fat loss is 0.5-1 kg/week. 500 kcal deficit = ~0.5 kg/week loss. Do not exceed 1,000 kcal deficit without medical supervision — this risks muscle loss, nutrient deficiencies, and metabolic adaptation.", priority: "high", category: "Safety" },
        { title: "Protein Priority", description: `Eat ${r0(g * 2.0)}–${r0(g * 2.4)} g of protein per day while losing weight to preserve muscle mass. Pair with resistance training to minimize lean body mass loss.`, priority: "high", category: "Nutrition" },
        { title: "Weekly Targets", description: `TDEE: ${tdee} kcal/day. Target calories: ${daily500} kcal/day (0.5 kg/week), ${daily750} kcal/day (0.75 kg/week). Review every 4 weeks as TDEE changes with weight loss.`, priority: "medium", category: "Plan" }
      ],
      detailedBreakdown: { "BMR": `${r0(bmrBase)} kcal`, "TDEE": `${tdee} kcal`, "-500 kcal/day": `${daily500} kcal → ${r0(weeks500)} weeks`, "-750 kcal/day": `${daily750} kcal → ${r0(weeks750)} weeks` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-loss-calculator" title="Weight Loss Calculator"
      description="Calculate your personalized weight loss timeline based on TDEE. Includes BMI, calorie targets, and realistic schedule."
      icon={TrendingDown} calculate={calculate} onClear={() => { setAge(30); setWeight(85); setGoalWeight(75); setHeight(170); setGender("male"); setActivity("moderate"); setResult(null) }}
      values={[age, gender, weight, height, goalWeight, activity]} result={result}
      seoContent={<SeoContentGenerator title="Weight Loss Calculator" description="Calculate your weight loss timeline and calorie targets." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Weight" val={weight} set={setWeight} min={20} max={400} step={0.5} suffix="kg" />
          <NumInput label="Goal Weight" val={goalWeight} set={setGoalWeight} min={20} max={350} step={0.5} suffix="kg" />
        </div>
        <NumInput label="Height" val={height} set={setHeight} min={100} max={250} suffix="cm" />
        <SelectInput label="Activity Level" val={activity} set={setActivity} options={[
          { value: "sedentary", label: "Sedentary (desk job, no exercise)" },
          { value: "light", label: "Light (1-3 days/week)" },
          { value: "moderate", label: "Moderate (3-5 days/week)" },
          { value: "active", label: "Active (6-7 days/week)" },
          { value: "veryActive", label: "Very Active (athlete / hard labor)" }
        ]} />
      </div>} />
  )
}

// ─── 2. Calorie Deficit Calculator ───────────────────────────────────────────
export function CalorieDeficitCalculator() {
  const [tdee, setTdee] = useState(2200)
  const [intake, setIntake] = useState(1700)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const t = clamp(tdee, 1000, 8000)
    const i = clamp(intake, 500, 8000)
    const deficit = t - i
    const weeklyLoss = r2(deficit * 7 / 7700)
    const monthlyLoss = r1(weeklyLoss * 4.33)

    let status: 'normal' | 'warning' | 'danger' | 'good' = deficit > 0 ? "good" : "warning"
    let category = deficit <= 0 ? "Calorie Surplus" : deficit < 250 ? "Minimal Deficit" : deficit < 500 ? "Moderate Deficit" : deficit < 1000 ? "Aggressive Deficit" : "Very Aggressive Deficit"
    if (deficit > 1000) status = "warning"

    setResult({
      primaryMetric: { label: "Daily Deficit", value: r0(deficit), unit: "kcal/day", status, description: `${category}` },
      metrics: [
        { label: "Daily Deficit", value: r0(deficit), unit: "kcal/day", status },
        { label: "Weekly Fat Loss", value: weeklyLoss > 0 ? weeklyLoss : 0, unit: "kg/week", status: weeklyLoss > 0 && weeklyLoss <= 1 ? "good" : weeklyLoss > 1 ? "warning" : "normal" },
        { label: "Monthly Fat Loss", value: monthlyLoss > 0 ? r1(monthlyLoss) : 0, unit: "kg/month", status: "normal" },
        { label: "TDEE", value: t, unit: "kcal/day", status: "normal" },
        { label: "Current Intake", value: i, unit: "kcal/day", status: i < 1200 ? "danger" : "normal" },
        { label: "Weeks to Lose 5 kg", value: deficit > 0 ? r0(5 * 7700 / (deficit * 7)) : "—", status: "normal" }
      ],
      recommendations: [
        { title: "Safe Deficit Ranges", description: "250-500 kcal/day: Sustainable loss, minimal muscle loss. 500-750 kcal/day: Moderate rate, manageable. 750-1000 kcal/day: Aggressive; high protein needed. >1000 kcal/day: Medical supervision required. Minimum calories: 1,200 women / 1,500 men.", priority: "high", category: "Safety" },
        { title: "Refeed Days", description: "An extended calorie deficit causes metabolic adaptation. Consider a weekly 'diet break' at maintenance calories or monthly full refeed week for long-term diet success.", priority: "medium", category: "Strategy" }
      ],
      detailedBreakdown: { "TDEE": `${t} kcal`, "Intake": `${i} kcal`, "Deficit": `${r0(deficit)} kcal/day`, "Weekly Loss": `${weeklyLoss > 0 ? weeklyLoss : 0} kg` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="calorie-deficit-calculator" title="Calorie Deficit Calculator"
      description="Calculate your daily calorie deficit and expected weight loss rate from TDEE and current food intake."
      icon={Flame} calculate={calculate} onClear={() => { setTdee(2200); setIntake(1700); setResult(null) }}
      values={[tdee, intake]} result={result}
      seoContent={<SeoContentGenerator title="Calorie Deficit Calculator" description="Calculate your calorie deficit for fat loss." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="TDEE (Total Daily Energy Expenditure)" val={tdee} set={setTdee} min={1000} max={8000} suffix="kcal/day" />
        <NumInput label="Current Daily Intake" val={intake} set={setIntake} min={500} max={8000} suffix="kcal/day" />
      </div>} />
  )
}

// ─── 3. Goal Weight Date Calculator ──────────────────────────────────────────
export function GoalWeightDateCalculator() {
  const [currentWeight, setCurrentWeight] = useState(85)
  const [goalWeight, setGoalWeight] = useState(75)
  const [weeklyRate, setWeeklyRate] = useState(0.5)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cw = clamp(currentWeight, 20, 400)
    const gw = clamp(goalWeight, 20, 400)
    const rate = clamp(weeklyRate, 0.1, 2.0)
    const diff = cw - gw

    if (diff <= 0) {
      setResult({
        primaryMetric: { label: "Already at goal!", value: "No loss needed", status: "good", description: "Your current weight is at or below your goal." },
        metrics: [{ label: "Current Weight", value: cw, unit: "kg", status: "good" }, { label: "Goal Weight", value: gw, unit: "kg", status: "good" }],
        recommendations: [{ title: "Maintain Your Weight", description: "You're at your goal. Focus on maintenance by eating at TDEE and staying active.", priority: "medium", category: "Maintenance" }],
        detailedBreakdown: {}
      })
      return
    }

    const weeksToGoal = diff / rate
    const daysToGoal = r0(weeksToGoal * 7)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + daysToGoal)
    const dateStr = targetDate.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })

    const checkpoints = [0.25, 0.5, 0.75].map(frac => {
      const kg = r1(cw - diff * frac)
      const days = r0((diff * frac) / rate * 7)
      const date = new Date()
      date.setDate(date.getDate() + days)
      return { kg, date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) }
    })

    setResult({
      primaryMetric: { label: "Goal Reached By", value: dateStr, status: "good", description: `${r0(weeksToGoal)} weeks to lose ${r1(diff)} kg` },
      metrics: [
        { label: "Weight to Lose", value: r1(diff), unit: "kg", status: "normal" },
        { label: "Weekly Rate", value: rate, unit: "kg/week", status: "normal" },
        { label: "Days to Goal", value: daysToGoal, status: "good" },
        { label: "Weeks to Goal", value: r0(weeksToGoal), status: "good" },
        { label: "25% Milestone", value: `${checkpoints[0].kg} kg by ${checkpoints[0].date}`, status: "normal" },
        { label: "50% Milestone", value: `${checkpoints[1].kg} kg by ${checkpoints[1].date}`, status: "normal" },
        { label: "75% Milestone", value: `${checkpoints[2].kg} by ${checkpoints[2].date}`, status: "normal" }
      ],
      recommendations: [
        { title: "Weekly Rate Guidance", description: "0.25 kg/week: Minimal deficit, easy to maintain. 0.5 kg/week: Standard recommendation. 1.0 kg/week: Requires ~1,000 kcal deficit/day — high protein essential. >1.0 kg/week: Risk of muscle loss, nutrient deficiency.", priority: "high", category: "Planning" },
        { title: "Track Progress", description: "Weigh yourself weekly under identical conditions (morning, fasted, after bathroom). Use a 4-week moving average to identify true trend as daily fluctuations from water/sodium can mask fat loss.", priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "Start": `${cw} kg`, "Goal": `${gw} kg`, "Difference": `${r1(diff)} kg`, "Rate": `${rate} kg/week`, "Timeline": `${r0(weeksToGoal)} weeks`, "Estimated Date": dateStr }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="goal-weight-date-calculator" title="Goal Weight Date Calculator"
      description="Find your estimated goal weight achievement date based on start weight, goal weight, and weekly loss rate."
      icon={Calendar} calculate={calculate} onClear={() => { setCurrentWeight(85); setGoalWeight(75); setWeeklyRate(0.5); setResult(null) }}
      values={[currentWeight, goalWeight, weeklyRate]} result={result}
      seoContent={<SeoContentGenerator title="Goal Weight Date Calculator" description="Estimate when you'll reach your goal weight." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={20} max={400} step={0.5} suffix="kg" />
          <NumInput label="Goal Weight" val={goalWeight} set={setGoalWeight} min={20} max={400} step={0.5} suffix="kg" />
        </div>
        <NumInput label="Weekly Loss Rate" val={weeklyRate} set={setWeeklyRate} min={0.1} max={2.0} step={0.05} suffix="kg/week" />
      </div>} />
  )
}

// ─── 4. Bulk Cut Calculator ───────────────────────────────────────────────────
export function BulkCutCalculator() {
  const [tdee, setTdee] = useState(2500)
  const [goal, setGoal] = useState("bulk")
  const [rate, setRate] = useState("standard")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const t = clamp(tdee, 1000, 8000)
    const adjustments: Record<string, Record<string, number>> = {
      bulk: { slow: 200, standard: 350, aggressive: 500 },
      cut: { slow: -300, standard: -500, aggressive: -750 },
      maintain: { slow: 0, standard: 0, aggressive: 0 }
    }
    const adj = adjustments[goal]?.[rate] ?? 0
    const targetCals = r0(t + adj)
    const weeklyChange = r2(adj * 7 / 7700)
    const protein = r0(t / (16 * 4))     // rough estimate from TDEE
    const carbs = r0(t * 0.45 / 4)
    const fats = r0(t * 0.25 / 9)

    setResult({
      primaryMetric: {
        label: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Calories`, value: targetCals, unit: "kcal/day",
        status: goal === "bulk" ? "good" : goal === "cut" ? "warning" : "normal",
        description: `${adj > 0 ? "+" : ""}${adj} kcal from TDEE (${rate})`
      },
      metrics: [
        { label: "TDEE", value: t, unit: "kcal/day", status: "normal" },
        { label: "Target Calories", value: targetCals, unit: "kcal/day", status: "good" },
        { label: "Calorie Adjustment", value: `${adj >= 0 ? "+" : ""}${adj}`, unit: "kcal/day", status: "normal" },
        { label: "Estimated Weekly Change", value: weeklyChange > 0 ? `+${weeklyChange}` : weeklyChange, unit: "kg/week", status: "normal" },
        { label: "Estimated Protein", value: `${protein}+`, unit: "g/day", status: "good" },
        { label: "Estimated Carbs", value: carbs, unit: "g/day", status: "normal" },
        { label: "Estimated Fats", value: fats, unit: "g/day", status: "normal" }
      ],
      recommendations: [
        { title: `${goal.charAt(0).toUpperCase() + goal.slice(1)} Phase Guide`, description: goal === "bulk"
          ? `Clean bulk: ${r0(t + 200)}-${r0(t + 300)} kcal. Minimize fat gain by staying in slight surplus. High protein (2g/kg) + progressive overload training. Expect ~0.1-0.3 kg lean mass gain/week.`
          : goal === "cut"
          ? `Fat loss phase: ${r0(t - 500)}-${r0(t - 300)} kcal. Maintain protein at 2-2.4 g/kg to preserve muscle. Include 2-3x resistance training sessions/week.`
          : "Maintenance phase: Eat at TDEE. Focus on body recomposition with training.", priority: "high", category: "Strategy" },
        { title: "Phase Duration", description: "Bulking phases typically last 4-6 months. Cutting phases 8-16 weeks. Mini-cuts (4-6 weeks) can interrupt a long bulk to keep body fat in check (<15% for men, <25% for women before bulking).", priority: "medium", category: "Periodization" }
      ],
      detailedBreakdown: { "Goal": goal, "Rate": rate, "TDEE": `${t} kcal`, "Target": `${targetCals} kcal`, "Adjustment": `${adj >= 0 ? "+" : ""}${adj} kcal` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="bulk-cut-calculator" title="Bulk/Cut Calculator"
      description="Calculate calories for bulking, cutting, or maintenance phases. Includes macro estimates and phase duration guidance."
      icon={Target} calculate={calculate} onClear={() => { setTdee(2500); setGoal("bulk"); setRate("standard"); setResult(null) }}
      values={[tdee, goal, rate]} result={result}
      seoContent={<SeoContentGenerator title="Bulk Cut Calculator" description="Calculate calories for bulking and cutting phases." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="TDEE (Maintenance Calories)" val={tdee} set={setTdee} min={1000} max={8000} suffix="kcal/day" />
        <SelectInput label="Goal" val={goal} set={setGoal} options={[{ value: "bulk", label: "Bulk (Muscle Gain)" }, { value: "cut", label: "Cut (Fat Loss)" }, { value: "maintain", label: "Maintain" }]} />
        <SelectInput label="Rate" val={rate} set={setRate} options={[{ value: "slow", label: "Slow (less fat gain/muscle loss)" }, { value: "standard", label: "Standard" }, { value: "aggressive", label: "Aggressive" }]} />
      </div>} />
  )
}

// ─── 5. NEAT Calculator (Non-Exercise Activity Thermogenesis) ─────────────────
export function NEATCalculator() {
  const [job, setJob] = useState("desk")
  const [standing, setStanding] = useState(4)
  const [steps, setSteps] = useState(8000)
  const [fidget, setFidget] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const jobCalories: Record<string, number> = { desk: 100, light: 250, standing: 400, active: 600, heavy: 900 }
    const fidgetCalories: Record<string, number> = { low: 50, moderate: 150, high: 300 }

    const jobCals = jobCalories[job] ?? 100
    const standingCals = r0(standing * 50)
    const stepCals = r0(steps * 0.04)
    const fidgetCals = fidgetCalories[fidget] ?? 150
    const totalNEAT = jobCals + standingCals + stepCals + fidgetCals

    const multiplier = totalNEAT < 300 ? 1.2 : totalNEAT < 500 ? 1.375 : totalNEAT < 700 ? 1.55 : 1.725

    setResult({
      primaryMetric: { label: "Estimated NEAT", value: totalNEAT, unit: "kcal/day", status: totalNEAT > 400 ? "good" : "normal", description: `Contributes ${r0(totalNEAT / 2000 * 100)}% of ~2000 kcal average TDEE` },
      metrics: [
        { label: "Total NEAT", value: totalNEAT, unit: "kcal/day", status: "good" },
        { label: "Job Activity", value: jobCals, unit: "kcal", status: "normal" },
        { label: "Standing Time", value: standingCals, unit: "kcal", status: "normal" },
        { label: "Steps", value: stepCals, unit: "kcal", status: "normal" },
        { label: "Fidgeting", value: fidgetCals, unit: "kcal", status: "normal" },
        { label: "Activity Multiplier", value: multiplier, status: "normal" }
      ],
      recommendations: [
        { title: "NEAT is a Big Lever", description: `NEAT (non-exercise activity thermogenesis) can range from 200 kcal/day (sedentary) to 1,400 kcal/day (very active person). Your estimated NEAT of ${totalNEAT} kcal/day. Obese individuals often have ~350 kcal/day lower NEAT than lean people.`, priority: "high", category: "Physiology" },
        { title: "Boost Your NEAT", description: "Aim for 10,000+ steps/day (+100-200 kcal). Stand instead of sit (50 kcal/hour). Take stairs. Light chores and gardening are effective NEAT boosters. Standing desks can add 200-400 kcal/day.", priority: "high", category: "Improvement" }
      ],
      detailedBreakdown: { "Job Cals": `${jobCals} kcal`, "Standing Cals": `${standingCals} kcal`, "Step Cals": `${stepCals} kcal`, "Fidget Cals": `${fidgetCals} kcal`, "Total NEAT": `${totalNEAT} kcal` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="neat-calculator" title="NEAT Calculator (Non-Exercise Activity)"
      description="Estimate your Non-Exercise Activity Thermogenesis (NEAT). Understand how daily movement beyond workouts affects your metabolism."
      icon={Flame} calculate={calculate} onClear={() => { setJob("desk"); setStanding(4); setSteps(8000); setFidget("moderate"); setResult(null) }}
      values={[job, standing, steps, fidget]} result={result}
      seoContent={<SeoContentGenerator title="NEAT Calculator" description="Estimate your non-exercise activity energy expenditure." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <SelectInput label="Occupation Type" val={job} set={setJob} options={[
          { value: "desk", label: "Desk / Office (sedentary)" },
          { value: "light", label: "Light Activity (retail, teacher)" },
          { value: "standing", label: "Mostly Standing (nurse, shop floor)" },
          { value: "active", label: "Active (postal worker, server)" },
          { value: "heavy", label: "Heavy Labor (construction, agriculture)" }
        ]} />
        <NumInput label="Hours Standing / Walking per day" val={standing} set={setStanding} min={0} max={16} step={0.5} suffix="hours" />
        <NumInput label="Daily Steps" val={steps} set={setSteps} min={0} max={50000} step={500} />
        <SelectInput label="Fidgeting Level" val={fidget} set={setFidget} options={[{ value: "low", label: "Low (very still)" }, { value: "moderate", label: "Moderate (typical)" }, { value: "high", label: "High (always moving)" }]} />
      </div>} />
  )
}

// ─── 6. Thermic Effect of Food Calculator ──────────────────────────────────────
export function ThermicEffectFoodCalculator() {
  const [protein, setProtein] = useState(150)
  const [carbs, setCarbs] = useState(250)
  const [fat, setFat] = useState(60)
  const [fiber, setFiber] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const p = clamp(protein, 0, 600)
    const c = clamp(carbs, 0, 1000)
    const f = clamp(fat, 0, 500)
    const fb = clamp(fiber, 0, 100)

    const calFromProtein = p * 4
    const calFromCarbs = c * 4
    const calFromFat = f * 9
    const totalCalories = calFromProtein + calFromCarbs + calFromFat
    const tef = r0(calFromProtein * 0.25 + calFromCarbs * 0.07 + calFromFat * 0.03 + fb * 2)
    const tefPct = r1(tef / totalCalories * 100)

    setResult({
      primaryMetric: { label: "Thermic Effect of Food", value: tef, unit: "kcal/day", status: "good", description: `${tefPct}% of ${totalCalories} kcal total intake burned through digestion` },
      metrics: [
        { label: "TEF Total", value: tef, unit: "kcal", status: "good" },
        { label: "TEF as % of Intake", value: tefPct, unit: "%", status: tefPct > 10 ? "good" : "normal" },
        { label: "Protein TEF (25–30%)", value: r0(calFromProtein * 0.25), unit: "kcal", status: "good" },
        { label: "Carbohydrate TEF (5–10%)", value: r0(calFromCarbs * 0.07), unit: "kcal", status: "normal" },
        { label: "Fat TEF (2–3%)", value: r0(calFromFat * 0.03), unit: "kcal", status: "normal" },
        { label: "Total Food Calories", value: totalCalories, unit: "kcal", status: "normal" },
        { label: "Net Calories (after TEF)", value: r0(totalCalories - tef), unit: "kcal", status: "normal" }
      ],
      recommendations: [
        { title: "Why High Protein Helps Weight Loss", description: `Protein has 4× higher TEF (25-30%) vs carbs (5-10%) and fat (2-3%). Your ${p}g protein burns ~${r0(calFromProtein * 0.25)} kcal just digesting it. This metabolic advantage is part of why high-protein diets are effective for weight management.`, priority: "high", category: "Nutrition Science" },
        { title: "Maximizing TEF", description: "Increase whole foods (vs processed), higher protein intake, and high-fiber vegetables and legumes to maximize TEF. TEF explains ~10% of daily calorie expenditure at typical macros.", priority: "medium", category: "Optimization" }
      ],
      detailedBreakdown: { "Total Calories": `${totalCalories} kcal`, "Protein TEF": `${r0(calFromProtein * 0.25)} kcal`, "Carb TEF": `${r0(calFromCarbs * 0.07)} kcal`, "Fat TEF": `${r0(calFromFat * 0.03)} kcal`, "Total TEF": `${tef} kcal (${tefPct}%)` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="thermic-effect-food-calculator" title="Thermic Effect of Food (TEF) Calculator"
      description="Calculate calories burned through digestion and metabolism of protein, carbs, and fats. Explains metabolic advantage of high-protein diets."
      icon={Flame} calculate={calculate} onClear={() => { setProtein(150); setCarbs(250); setFat(60); setFiber(30); setResult(null) }}
      values={[protein, carbs, fat, fiber]} result={result}
      seoContent={<SeoContentGenerator title="Thermic Effect of Food Calculator" description="Calculate calories burned through digestion." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Protein" val={protein} set={setProtein} min={0} max={600} suffix="g/day" />
          <NumInput label="Carbohydrates" val={carbs} set={setCarbs} min={0} max={1000} suffix="g/day" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Fat" val={fat} set={setFat} min={0} max={500} suffix="g/day" />
          <NumInput label="Fiber" val={fiber} set={setFiber} min={0} max={100} suffix="g/day" />
        </div>
      </div>} />
  )
}

// ─── 7. FFMI Calculator (Fat-Free Mass Index) ──────────────────────────────────
export function FFMICalculator() {
  const [weight, setWeight] = useState(80)
  const [height, setHeight] = useState(178)
  const [bodyFat, setBodyFat] = useState(15)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(weight, 20, 300)
    const h = clamp(height, 100, 250)
    const bf = clamp(bodyFat, 1, 70)

    const lbm = w * (1 - bf / 100)
    const ffmi = r2(lbm / Math.pow(h / 100, 2))
    const normalizedFFMI = r2(ffmi + 6.1 * (1.8 - h / 100))

    let category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (ffmi < 17) { category = "Below Average"; status = "warning" }
    else if (ffmi < 18) { category = "Average"; status = "normal" }
    else if (ffmi < 20) { category = "Above Average"; status = "good" }
    else if (ffmi < 22) { category = "Excellent"; status = "good" }
    else if (ffmi < 23) { category = "Superior"; status = "good" }
    else if (ffmi < 25) { category = "Suspected Enhanced"; status = "warning" }
    else { category = "Likely Enhanced (Rare Natty)"; status = "warning" }

    setResult({
      primaryMetric: { label: "FFMI", value: ffmi, status, description: `${category} — Natural limit ~25 for men, ~22 for women` },
      metrics: [
        { label: "FFMI", value: ffmi, status },
        { label: "Normalized FFMI", value: normalizedFFMI, status },
        { label: "Lean Body Mass", value: r1(lbm), unit: "kg", status: "normal" },
        { label: "Body Fat", value: bf, unit: "%", status: bf < 5 || bf > 30 ? "warning" : "good" },
        { label: "Category", value: category, status }
      ],
      recommendations: [
        { title: "FFMI Thresholds", description: "FFMI is kg of lean mass per m² of height. Natural limits: ~25 for men, ~22 for women. Historical data shows most drug-free athletes plateau below these values. Above 25-26 significant PED use is likely.", priority: "high", category: "Assessment" },
        { title: "Gaining FFMI Points", description: `At your height of ${h}cm, gaining 1 FFMI point requires adding ${r1(Math.pow(h / 100, 2))} kg of lean mass. This typically takes 6-18 months of progressive resistance training for intermediate lifters.`, priority: "medium", category: "Planning" }
      ],
      detailedBreakdown: { "Weight": `${w} kg`, "Body Fat": `${bf}%`, "LBM": `${r1(lbm)} kg`, "FFMI": ffmi, "Normalized FFMI": normalizedFFMI, "Category": category }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ffmi-calculator" title="FFMI Calculator (Fat-Free Mass Index)"
      description="Calculate Fat-Free Mass Index to assess your muscular development. Includes natural bodybuilding classification and normalized FFMI."
      icon={Scale} calculate={calculate} onClear={() => { setWeight(80); setHeight(178); setBodyFat(15); setResult(null) }}
      values={[weight, height, bodyFat]} result={result}
      seoContent={<SeoContentGenerator title="FFMI Calculator" description="Calculate fat-free mass index for muscle assessment." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={100} max={250} suffix="cm" />
        </div>
        <NumInput label="Body Fat Percentage" val={bodyFat} set={setBodyFat} min={1} max={70} step={0.5} suffix="%" />
      </div>} />
  )
}

// ─── 8. Ideal Body Fat Calculator ────────────────────────────────────────────
export function IdealBodyFatCalculator() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(80)
  const [bodyFat, setBodyFat] = useState(20)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    const w = clamp(weight, 20, 300)
    const bf = clamp(bodyFat, 1, 70)
    const male = gender === "male"

    const lbm = w * (1 - bf / 100)
    const fatMass = w * bf / 100

    // ACSM ideal body fat ranges
    let idealLow = 0, idealHigh = 0, category = "", status: 'normal' | 'warning' | 'danger' | 'good' = "normal"
    if (male) {
      if (a < 30) { idealLow = 10; idealHigh = 19 }
      else if (a < 40) { idealLow = 11; idealHigh = 20 }
      else if (a < 50) { idealLow = 13; idealHigh = 21 }
      else if (a < 60) { idealLow = 15; idealHigh = 22 }
      else { idealLow = 16; idealHigh = 23 }
    } else {
      if (a < 30) { idealLow = 16; idealHigh = 25 }
      else if (a < 40) { idealLow = 17; idealHigh = 26 }
      else if (a < 50) { idealLow = 19; idealHigh = 28 }
      else if (a < 60) { idealLow = 20; idealHigh = 29 }
      else { idealLow = 20; idealHigh = 30 }
    }

    if (male) {
      if (bf < 6) { category = "Essential Fat (Athletes)"; status = "warning" }
      else if (bf < idealLow) { category = "Below Average — Lean"; status = "warning" }
      else if (bf <= idealHigh) { category = "Healthy Range"; status = "good" }
      else if (bf < 25) { category = "Borderline High"; status = "warning" }
      else { category = "Obese"; status = "danger" }
    } else {
      if (bf < 14) { category = "Essential Fat (Athletes)"; status = "warning" }
      else if (bf < idealLow) { category = "Below Average — Lean"; status = "warning" }
      else if (bf <= idealHigh) { category = "Healthy Range"; status = "good" }
      else if (bf < 32) { category = "Borderline High"; status = "warning" }
      else { category = "Obese"; status = "danger" }
    }

    const weightAtIdealMid = r1(lbm / (1 - (idealLow + idealHigh) / 2 / 100))
    const lbsToLose = bf > idealHigh ? r1(fatMass - w * idealHigh / 100) : 0

    setResult({
      primaryMetric: { label: `Body Fat: ${bf}%`, value: category, status, description: `Ideal range for ${male ? "men" : "women"} age ${a}: ${idealLow}–${idealHigh}%` },
      metrics: [
        { label: "Current Body Fat", value: bf, unit: "%", status },
        { label: "Category", value: category, status },
        { label: "Ideal Range", value: `${idealLow}–${idealHigh}%`, status: "good" },
        { label: "Fat Mass", value: r1(fatMass), unit: "kg", status: "normal" },
        { label: "Lean Body Mass", value: r1(lbm), unit: "kg", status: "good" },
        { label: "Weight at Ideal BF (mid)", value: weightAtIdealMid, unit: "kg", status: "good" },
        { label: "Fat to Lose (to ideal high)", value: lbsToLose > 0 ? lbsToLose : "Already in range", unit: lbsToLose > 0 ? "kg" : "", status: lbsToLose > 0 ? "warning" : "good" }
      ],
      recommendations: [
        { title: "ACSM Body Fat Standards", description: `For ${male ? "men" : "women"} aged ${a}: Ideal ${idealLow}–${idealHigh}%. Athletes: ${male ? "6-13%" : "14-20%"}. Essential fat: ${male ? "<6%" : "<14%"}. Overweight: ${male ? ">25%" : ">32%"}. Obese: ${male ? ">30%" : ">38%"}.`, priority: "high", category: "Standards" },
        { title: "How to Reduce Body Fat", description: "Calorie deficit 300-500 kcal/day, high protein intake (2-2.4 g/kg LBM), resistance training 3x/week, adequate sleep (7-9 hours). Avoid crash diets — they cause disproportionate muscle loss.", priority: "high", category: "Strategy" }
      ],
      detailedBreakdown: { "Body Fat": `${bf}%`, "Category": category, "LBM": `${r1(lbm)} kg`, "Fat Mass": `${r1(fatMass)} kg`, "Ideal Range": `${idealLow}–${idealHigh}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="ideal-body-fat-calculator" title="Ideal Body Fat Calculator"
      description="Compare your body fat to ACSM standards for your age and gender. Calculates ideal body weight at healthy body fat levels."
      icon={Scale} calculate={calculate} onClear={() => { setAge(30); setWeight(80); setBodyFat(20); setGender("male"); setResult(null) }}
      values={[age, gender, weight, bodyFat]} result={result}
      seoContent={<SeoContentGenerator title="Ideal Body Fat Calculator" description="Find your ideal body fat percentage by age and gender." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={20} max={300} step={0.5} suffix="kg" />
          <NumInput label="Body Fat %" val={bodyFat} set={setBodyFat} min={1} max={70} step={0.5} suffix="%" />
        </div>
      </div>} />
  )
}

// ─── 9. Maintenance Calorie Calculator ────────────────────────────────────────
export function MaintenanceCalorieCalculator() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(75)
  const [height, setHeight] = useState(175)
  const [activity, setActivity] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 10, 90)
    const w = clamp(weight, 20, 400)
    const h = clamp(height, 100, 250)

    // Mifflin-St Jeor
    const mifflin = gender === "male"
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161

    // Harris-Benedict
    const harris = gender === "male"
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a

    const multipliers: Record<string, { factor: number; label: string }> = {
      sedentary: { factor: 1.2, label: "Sedentary" },
      light: { factor: 1.375, label: "Light Activity" },
      moderate: { factor: 1.55, label: "Moderate Activity" },
      active: { factor: 1.725, label: "Active" },
      veryActive: { factor: 1.9, label: "Very Active" }
    }

    const mult = multipliers[activity] ?? multipliers.moderate
    const tdeeMifflin = r0(mifflin * mult.factor)
    const tdeeHarris = r0(harris * mult.factor)
    const tdeeAvg = r0((tdeeMifflin + tdeeHarris) / 2)

    setResult({
      primaryMetric: { label: "Maintenance Calories (avg)", value: tdeeAvg, unit: "kcal/day", status: "good", description: `${mult.label} — Stay within ±100 kcal to maintain weight` },
      metrics: [
        { label: "Mifflin-St Jeor TDEE", value: tdeeMifflin, unit: "kcal/day", status: "good" },
        { label: "Harris-Benedict TDEE", value: tdeeHarris, unit: "kcal/day", status: "good" },
        { label: "Average TDEE", value: tdeeAvg, unit: "kcal/day", status: "good" },
        { label: "BMR (Mifflin)", value: r0(mifflin), unit: "kcal/day", status: "normal" },
        { label: "Protein (2g/kg)", value: r0(w * 2), unit: "g/day", status: "good" },
        { label: "-500 kcal/day (cut)", value: r0(tdeeAvg - 500), unit: "kcal/day", status: "normal" },
        { label: "+250 kcal/day (lean bulk)", value: r0(tdeeAvg + 250), unit: "kcal/day", status: "normal" }
      ],
      recommendations: [
        { title: "Use TDEE for 2-3 Weeks", description: "Track your weight daily for 2-3 weeks at the calculated TDEE. If weight is stable, the formula is accurate. If losing/gaining, adjust calories by 50-100 kcal increments. Small adjustments are more reliable than large ones.", priority: "high", category: "Implementation" },
        { title: "Factors Affecting TDEE", description: "TDEE decreases by ~10-15 kcal per kg lost (metabolic adaptation). Muscle mass increases TDEE by ~13 kcal per kg. Age reduces BMR by ~2% per decade after 30.", priority: "medium", category: "Understanding" }
      ],
      detailedBreakdown: { "BMR (Mifflin)": `${r0(mifflin)} kcal`, "BMR (Harris)": `${r0(harris)} kcal`, "Activity Mult": mult.factor, "TDEE (Mifflin)": `${tdeeMifflin} kcal`, "TDEE (Harris)": `${tdeeHarris} kcal`, "Average": `${tdeeAvg} kcal` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="maintenance-calorie-calculator" title="Maintenance Calorie Calculator"
      description="Calculate your maintenance calories (TDEE) using both Mifflin-St Jeor and Harris-Benedict formulas for accuracy."
      icon={Flame} calculate={calculate} onClear={() => { setAge(30); setGender("male"); setWeight(75); setHeight(175); setActivity("moderate"); setResult(null) }}
      values={[age, gender, weight, height, activity]} result={result}
      seoContent={<SeoContentGenerator title="Maintenance Calorie Calculator" description="Calculate your daily maintenance calorie needs (TDEE)." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Age" val={age} set={setAge} min={10} max={90} suffix="years" />
          <SelectInput label="Gender" val={gender} set={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight" val={weight} set={setWeight} min={20} max={400} step={0.5} suffix="kg" />
          <NumInput label="Height" val={height} set={setHeight} min={100} max={250} suffix="cm" />
        </div>
        <SelectInput label="Activity Level" val={activity} set={setActivity} options={[
          { value: "sedentary", label: "Sedentary (desk job, no exercise)" },
          { value: "light", label: "Light (1-3 workouts/week)" },
          { value: "moderate", label: "Moderate (3-5 workouts/week)" },
          { value: "active", label: "Active (6-7 workouts/week)" },
          { value: "veryActive", label: "Very Active (daily hard training)" }
        ]} />
      </div>} />
  )
}
