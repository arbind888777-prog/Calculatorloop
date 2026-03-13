"use client"

import { useState } from "react"
import { Activity, TrendingDown, Scale, Target, BarChart3, Flame, Clock, AlertCircle } from "lucide-react"
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

// ─── 14. Inch Loss Calculator ─────────────────────────────────────────────────
export function InchLossCalculator() {
  const [waistInit, setWaistInit] = useState(38)
  const [waistCurr, setWaistCurr] = useState(35)
  const [hipInit, setHipInit] = useState(42)
  const [hipCurr, setHipCurr] = useState(40)
  const [chestInit, setChestInit] = useState(40)
  const [chestCurr, setChestCurr] = useState(39)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wLoss = r1(clamp(waistInit, 20, 70) - clamp(waistCurr, 20, 70))
    const hLoss = r1(clamp(hipInit, 25, 75) - clamp(hipCurr, 25, 75))
    const cLoss = r1(clamp(chestInit, 25, 65) - clamp(chestCurr, 25, 65))
    const totalLoss = r1(wLoss + hLoss + cLoss)

    const fatDistScore = r0(clamp(wLoss * 12 + hLoss * 8 + cLoss * 6, 0, 100))
    const status: 'good' | 'warning' | 'danger' = totalLoss > 3 ? "good" : totalLoss > 1 ? "warning" : "danger"
    const label = totalLoss > 5 ? "Excellent Progress" : totalLoss > 2 ? "Good Progress" : totalLoss > 0 ? "Slow Progress" : "No Change"

    setResult({
      primaryMetric: { label: "Total Inch Loss", value: `${totalLoss} inches`, status, description: `${label} — Waist ${wLoss > 0 ? "-" : ""}${wLoss}″, Hip ${hLoss > 0 ? "-" : ""}${hLoss}″, Chest ${cLoss > 0 ? "-" : ""}${cLoss}″` },
      healthScore: fatDistScore,
      metrics: [
        { label: "Total Loss", value: totalLoss, unit: "inches", status },
        { label: "Waist Loss", value: wLoss, unit: "inches", status: wLoss > 1 ? "good" : wLoss > 0 ? "warning" : "danger" },
        { label: "Hip Loss", value: hLoss, unit: "inches", status: hLoss > 1 ? "good" : hLoss > 0 ? "warning" : "danger" },
        { label: "Chest Loss", value: cLoss, unit: "inches", status: cLoss > 0.5 ? "good" : cLoss > 0 ? "warning" : "danger" },
        { label: "Fat Distribution Score", value: fatDistScore, unit: "/100", status: fatDistScore > 60 ? "good" : fatDistScore > 30 ? "warning" : "danger" },
        { label: "Progress Category", value: label, status }
      ],
      recommendations: [
        { title: "Inch Loss Assessment", description: `${totalLoss} total inches lost — ${label}. Waist loss is most health-significant: each inch of waist reduction correlates with ~1 kg fat loss and improved metabolic markers. Waist loss > hip loss indicates visceral fat reduction (best outcome).`, priority: "high", category: "Assessment" },
        { title: "Measurement Tips", description: `Measure at same time (morning, fasted), same landmarks. Waist: at navel level. Hips: widest point. Chest: at nipple line. Body measurements often change before scale weight — muscle gain + fat loss = same weight but smaller measurements.`, priority: "medium", category: "Tracking" },
        { title: "Fat Distribution", description: `Score: ${fatDistScore}/100. ${wLoss > hLoss ? "Good pattern — losing waist fat (visceral fat) preferentially reduces diabetes and heart disease risk." : "Hip/thigh fat is less metabolically dangerous but slower to lose."}`, priority: "medium", category: "Health" }
      ],
      detailedBreakdown: { "Waist": `${wLoss}″`, "Hip": `${hLoss}″`, "Chest": `${cLoss}″`, "Total": `${totalLoss}″`, "Score": fatDistScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="inch-loss-calculator" title="Inch Loss Calculator"
      description="Track body measurement reductions across waist, hip, and chest. Calculates fat distribution improvement score."
      icon={TrendingDown} calculate={calculate} onClear={() => { setWaistInit(38); setWaistCurr(35); setHipInit(42); setHipCurr(40); setChestInit(40); setChestCurr(39); setResult(null) }}
      values={[waistInit, waistCurr, hipInit, hipCurr, chestInit, chestCurr]} result={result}
      seoContent={<SeoContentGenerator title="Inch Loss Calculator" description="Track body measurement inch loss progress." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">Waist (inches)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Initial Waist" val={waistInit} set={setWaistInit} min={20} max={70} step={0.5} suffix="inches" />
          <NumInput label="Current Waist" val={waistCurr} set={setWaistCurr} min={20} max={70} step={0.5} suffix="inches" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Hip (inches)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Initial Hip" val={hipInit} set={setHipInit} min={25} max={75} step={0.5} suffix="inches" />
          <NumInput label="Current Hip" val={hipCurr} set={setHipCurr} min={25} max={75} step={0.5} suffix="inches" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Chest (inches)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Initial Chest" val={chestInit} set={setChestInit} min={25} max={65} step={0.5} suffix="inches" />
          <NumInput label="Current Chest" val={chestCurr} set={setChestCurr} min={25} max={65} step={0.5} suffix="inches" />
        </div>
      </div>} />
  )
}

// ─── 15. Weight Loss Percentage Calculator ────────────────────────────────────
export function WeightLossPercentageCalculator() {
  const [startWeight, setStartWeight] = useState(90)
  const [currentWeight, setCurrentWeight] = useState(82)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sw = clamp(startWeight, 30, 300)
    const cw = clamp(currentWeight, 30, 300)
    const lost = r1(sw - cw)
    const pct = r1((lost / sw) * 100)

    const label = pct >= 10 ? "Significant Loss" : pct >= 5 ? "Clinically Meaningful" : pct >= 2 ? "Moderate Loss" : pct > 0 ? "Mild Loss" : "No Loss"
    const status: 'good' | 'warning' | 'danger' = pct >= 5 ? "good" : pct >= 2 ? "warning" : "danger"

    const metabolicWarning = pct > 15 ? "High — metabolic adaptation likely" : pct > 10 ? "Moderate — monitor metabolic rate" : "Low"

    setResult({
      primaryMetric: { label: "Weight Loss", value: `${pct}%`, status, description: `${label} — ${lost} kg lost from ${sw} kg` },
      healthScore: r0(clamp(pct * 8, 0, 100)),
      metrics: [
        { label: "Weight Lost", value: lost, unit: "kg", status: lost > 0 ? "good" : "danger" },
        { label: "Loss Percentage", value: pct, unit: "%", status },
        { label: "Category", value: label, status },
        { label: "Starting Weight", value: sw, unit: "kg", status: "normal" },
        { label: "Current Weight", value: cw, unit: "kg", status: "normal" },
        { label: "Metabolic Adaptation", value: metabolicWarning, status: metabolicWarning.startsWith("High") ? "danger" : metabolicWarning.startsWith("Moderate") ? "warning" : "good" }
      ],
      recommendations: [
        { title: "Weight Loss Classification", description: `${pct}% loss (${label}). Research: 5-10% weight loss = significant health improvement (lower BP, better insulin sensitivity, reduced joint pain). >15% loss = major metabolic adaptation risk (metabolism slows 10-15% beyond predicted).`, priority: "high", category: "Assessment" },
        { title: "Metabolic Adaptation", description: `${metabolicWarning}. ${pct > 10 ? "After significant loss, resting metabolic rate drops. Consider diet breaks (2 weeks at maintenance every 8-12 weeks), refeed days, and progressive resistance training to minimize adaptation." : "Continue current approach."}`, priority: "medium", category: "Metabolism" }
      ],
      detailedBreakdown: { "Start": `${sw} kg`, "Current": `${cw} kg`, "Lost": `${lost} kg`, "Percentage": `${pct}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-loss-percentage" title="Weight Loss Percentage Calculator"
      description="Calculate body weight reduction percentage. Includes health improvement classification and metabolic adaptation warning."
      icon={TrendingDown} calculate={calculate} onClear={() => { setStartWeight(90); setCurrentWeight(82); setResult(null) }}
      values={[startWeight, currentWeight]} result={result}
      seoContent={<SeoContentGenerator title="Weight Loss Percentage Calculator" description="Calculate weight loss as a percentage of starting weight." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Starting Weight" val={startWeight} set={setStartWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Current Weight" val={currentWeight} set={setCurrentWeight} min={30} max={300} step={0.5} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 16. Calorie Cycling Planner ──────────────────────────────────────────────
export function CalorieCyclingPlanner() {
  const [maintenance, setMaintenance] = useState(2200)
  const [goal, setGoal] = useState("cut")
  const [trainingDays, setTrainingDays] = useState(4)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const maint = clamp(maintenance, 1000, 5000)
    const td = clamp(trainingDays, 1, 7)
    const restDays = 7 - td

    let high = 0, medium = 0, low = 0
    if (goal === "cut") {
      high = maint
      medium = maint - 250
      low = maint - 500
    } else if (goal === "recomp") {
      high = maint + 200
      medium = maint
      low = maint - 300
    } else {
      high = maint + 400
      medium = maint + 200
      low = maint
    }

    const weeklyTotal = r0(high * Math.min(td, 2) + medium * Math.max(0, td - 2) + low * restDays)
    const dailyAvg = r0(weeklyTotal / 7)
    const weeklyDeficit = r0(maint * 7 - weeklyTotal)

    const fatLossWeek = r2(weeklyDeficit / 7700)
    const adaptPrevention = goal === "cut" ? "High days prevent metabolic slowdown" : "Cycling optimizes nutrient partitioning"

    const status: 'good' | 'warning' | 'danger' = "good"

    setResult({
      primaryMetric: { label: "Weekly Average", value: `${dailyAvg} kcal/day`, status, description: `${goal === "cut" ? "Cutting" : goal === "recomp" ? "Recomposition" : "Lean bulk"} — ${td} training days` },
      healthScore: 80,
      metrics: [
        { label: "High Days", value: `${r0(high)} kcal`, unit: `× ${Math.min(td, 2)} days`, status: "good" },
        { label: "Medium Days", value: `${r0(medium)} kcal`, unit: `× ${Math.max(0, td - 2)} days`, status: "normal" },
        { label: "Low Days", value: `${r0(low)} kcal`, unit: `× ${restDays} days`, status: "normal" },
        { label: "Weekly Total", value: weeklyTotal, unit: "kcal", status: "normal" },
        { label: "Daily Average", value: dailyAvg, unit: "kcal", status: "good" },
        { label: "Weekly Deficit", value: weeklyDeficit > 0 ? weeklyDeficit : 0, unit: "kcal", status: weeklyDeficit > 0 ? "good" : "normal" },
        { label: "Est. Fat Loss/Week", value: fatLossWeek > 0 ? fatLossWeek : 0, unit: "kg", status: fatLossWeek > 0 ? "good" : "normal" },
        { label: "Adaptation Prevention", value: adaptPrevention, status: "good" }
      ],
      recommendations: [
        { title: "Calorie Cycling Plan", description: `High: ${r0(high)} kcal (training days), Medium: ${r0(medium)} kcal, Low: ${r0(low)} kcal (rest days). Cycling prevents metabolic adaptation by periodically raising leptin and thyroid hormones. Studies show 20-30% better fat loss retention vs straight dieting.`, priority: "high", category: "Plan" },
        { title: "Implementation", description: `Place high days on hardest training days (legs/back). Medium on moderate training. Low on rest days. High days = more carbs (fuel performance). Low days = higher fat + protein (satiety). Keep protein constant at 1.6-2.2g/kg daily.`, priority: "high", category: "Strategy" },
        { title: "Tracking", description: `Weekly average: ${dailyAvg} kcal. ${weeklyDeficit > 0 ? `Weekly deficit: ${weeklyDeficit} kcal ≈ ${fatLossWeek} kg/week fat loss.` : goal === "recomp" ? "Near maintenance — focus on body composition changes, not scale weight." : `Surplus for lean gains. Monitor weight gain — target 0.25-0.5 kg/week.`}`, priority: "medium", category: "Tracking" }
      ],
      detailedBreakdown: { "High": `${r0(high)} kcal`, "Medium": `${r0(medium)} kcal`, "Low": `${r0(low)} kcal`, "Weekly": weeklyTotal, "Avg": dailyAvg, "Deficit": weeklyDeficit }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="calorie-cycling" title="Calorie Cycling Planner"
      description="Plan high/medium/low calorie days to prevent metabolic adaptation. Optimizes nutrition around training schedule."
      icon={BarChart3} calculate={calculate} onClear={() => { setMaintenance(2200); setGoal("cut"); setTrainingDays(4); setResult(null) }}
      values={[maintenance, goal, trainingDays]} result={result}
      seoContent={<SeoContentGenerator title="Calorie Cycling Planner" description="Plan calorie cycling for better fat loss and metabolism." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Maintenance Calories" val={maintenance} set={setMaintenance} min={1000} max={5000} suffix="kcal/day" />
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Goal" val={goal} set={setGoal} options={[{ value: "cut", label: "Fat Loss (Cut)" }, { value: "recomp", label: "Recomposition" }, { value: "bulk", label: "Lean Bulk" }]} />
          <NumInput label="Training Days" val={trainingDays} set={setTrainingDays} min={1} max={7} suffix="per week" />
        </div>
      </div>} />
  )
}

// ─── 17. Cheat Meal Impact Calculator ─────────────────────────────────────────
export function CheatMealImpactCalculator() {
  const [cheatCal, setCheatCal] = useState(2500)
  const [dailyDeficit, setDailyDeficit] = useState(500)
  const [weeklyBudget, setWeeklyBudget] = useState(14000)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cheat = clamp(cheatCal, 500, 8000)
    const deficit = clamp(dailyDeficit, 100, 1500)
    const budget = clamp(weeklyBudget, 7000, 35000)

    const normalMealCal = r0((budget - deficit * 7) / 21)
    const excessFromCheat = r0(Math.max(0, cheat - normalMealCal))
    const weeklyDeficitPlan = deficit * 7
    const remainingDeficit = r0(weeklyDeficitPlan - excessFromCheat)

    const fatLossDelay = excessFromCheat > 0 ? r1(excessFromCheat / 7700 * 7) : 0
    const adherenceScore = r0(clamp(100 - (excessFromCheat / weeklyDeficitPlan) * 100, 0, 100))

    const status: 'good' | 'warning' | 'danger' = remainingDeficit > weeklyDeficitPlan * 0.7 ? "good" : remainingDeficit > weeklyDeficitPlan * 0.3 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Remaining Weekly Deficit", value: `${remainingDeficit} kcal`, status, description: `Cheat meal added ${excessFromCheat} kcal excess — ${remainingDeficit > 0 ? "Still in deficit" : "Deficit eliminated this week"}` },
      healthScore: adherenceScore,
      metrics: [
        { label: "Cheat Meal Calories", value: cheat, unit: "kcal", status: cheat < 1500 ? "good" : cheat < 3000 ? "warning" : "danger" },
        { label: "Excess Above Normal", value: excessFromCheat, unit: "kcal", status: excessFromCheat < 500 ? "good" : excessFromCheat < 1500 ? "warning" : "danger" },
        { label: "Planned Weekly Deficit", value: weeklyDeficitPlan, unit: "kcal", status: "normal" },
        { label: "Remaining Deficit", value: remainingDeficit, unit: "kcal", status },
        { label: "Fat Loss Delay", value: fatLossDelay, unit: "days", status: fatLossDelay < 1 ? "good" : fatLossDelay < 3 ? "warning" : "danger" },
        { label: "Adherence Score", value: adherenceScore, unit: "/100", status: adherenceScore > 70 ? "good" : adherenceScore > 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Cheat Meal Impact", description: `${excessFromCheat} kcal excess. ${remainingDeficit > 0 ? `Still in deficit (${remainingDeficit} kcal remaining). Fat loss delayed by ~${fatLossDelay} days.` : "Deficit eliminated this week — no net fat loss."} One cheat meal won't ruin progress, but frequency matters. Weekly cheats can reduce monthly fat loss by 30-50%.`, priority: "high", category: "Impact" },
        { title: "Damage Control", description: `${excessFromCheat > 1000 ? "Significant excess. Don't overcompensate — don't skip meals next day (triggers binge cycle). Instead: add 20 min extra cardio for 2-3 days, reduce carbs slightly, increase protein." : "Manageable excess. Resume normal plan immediately."} Psychology: planned flexibility (80/20 rule) improves long-term adherence.`, priority: "high", category: "Strategy" },
        { title: "Smart Cheating", description: "Strategies: 1) Bank calories — eat 100 less on other days. 2) Time cheats on training days (extra carbs fuel performance). 3) High protein cheats do less damage. 4) Eat slowly, enjoy it — guilt increases cortisol which promotes fat storage.", priority: "medium", category: "Tips" }
      ],
      detailedBreakdown: { "Cheat": `${cheat} kcal`, "Excess": `${excessFromCheat}`, "Plan Deficit": weeklyDeficitPlan, "Remaining": remainingDeficit, "Delay": `${fatLossDelay} days`, "Adherence": `${adherenceScore}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="cheat-meal-impact" title="Cheat Meal Impact Calculator"
      description="Calculate how a cheat meal affects your weekly calorie deficit. Includes fat loss delay estimate and adherence scoring."
      icon={Flame} calculate={calculate} onClear={() => { setCheatCal(2500); setDailyDeficit(500); setWeeklyBudget(14000); setResult(null) }}
      values={[cheatCal, dailyDeficit, weeklyBudget]} result={result}
      seoContent={<SeoContentGenerator title="Cheat Meal Impact Calculator" description="Calculate cheat meal impact on weekly fat loss." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <NumInput label="Cheat Meal Calories" val={cheatCal} set={setCheatCal} min={500} max={8000} suffix="kcal" />
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Daily Calorie Deficit" val={dailyDeficit} set={setDailyDeficit} min={100} max={1500} suffix="kcal" />
          <NumInput label="Weekly Calorie Budget" val={weeklyBudget} set={setWeeklyBudget} min={7000} max={35000} suffix="kcal" />
        </div>
      </div>} />
  )
}

// ─── 18. Weight Plateau Helper ────────────────────────────────────────────────
export function WeightPlateauCalculator() {
  const [currentCal, setCurrentCal] = useState(1800)
  const [weeksStalled, setWeeksStalled] = useState(3)
  const [exerciseFreq, setExerciseFreq] = useState(3)
  const [weightChange, setWeightChange] = useState(0.2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const cal = clamp(currentCal, 800, 5000)
    const weeks = clamp(weeksStalled, 1, 20)
    const exFreq = clamp(exerciseFreq, 0, 7)
    const wc = clamp(weightChange, -2, 2)

    const isPlateau = Math.abs(wc) < 0.25 && weeks >= 3
    const metabolicSlowdown = r0(clamp(weeks * 5 + (cal < 1500 ? 15 : 0) + (exFreq < 2 ? 10 : 0), 0, 80))

    const causes: string[] = []
    if (cal < 1400) causes.push("Very low calories — metabolism may have adapted")
    if (exFreq < 2) causes.push("Low exercise frequency — reduced TDEE")
    if (weeks > 6) causes.push("Extended dieting — hormonal adaptation likely")
    if (cal > 2200 && exFreq < 3) causes.push("Calorie intake may be too high for activity level")
    if (causes.length === 0) causes.push("Normal stall — body recomposition may be occurring")

    const status: 'good' | 'warning' | 'danger' = !isPlateau ? "good" : weeks < 4 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Plateau Status", value: isPlateau ? `Yes (${weeks} weeks)` : "Not a plateau yet", status, description: isPlateau ? `Stalled: <0.25 kg change over ${weeks} weeks` : "Weight is still changing — not a true plateau" },
      healthScore: Math.max(10, r0(100 - metabolicSlowdown)),
      metrics: [
        { label: "Plateau Detected", value: isPlateau ? "Yes" : "No", status: isPlateau ? "danger" : "good" },
        { label: "Weeks Stalled", value: weeks, status: weeks < 3 ? "good" : weeks < 6 ? "warning" : "danger" },
        { label: "Weight Change", value: wc, unit: "kg/week", status: Math.abs(wc) > 0.25 ? "good" : "danger" },
        { label: "Current Intake", value: cal, unit: "kcal", status: cal > 1200 ? "good" : "danger" },
        { label: "Exercise Frequency", value: exFreq, unit: "days/week", status: exFreq >= 3 ? "good" : exFreq >= 2 ? "warning" : "danger" },
        { label: "Metabolic Slowdown", value: metabolicSlowdown, unit: "%", status: metabolicSlowdown < 20 ? "good" : metabolicSlowdown < 45 ? "warning" : "danger" },
        { label: "Top Cause", value: causes[0], status: "warning" }
      ],
      recommendations: [
        { title: "Plateau Diagnosis", description: `${isPlateau ? `True plateau: <0.25 kg change over ${weeks} weeks.` : "Not yet a plateau — wait 3+ weeks of truly flat weight."} Possible causes: ${causes.join(". ")}. Note: water retention can mask fat loss for 2-4 weeks (especially in women during menstrual cycle or when starting new exercise).`, priority: "high", category: "Diagnosis" },
        { title: "Breaking the Plateau", description: `Metabolic slowdown: ~${metabolicSlowdown}%. Strategies: 1) Diet break — eat at maintenance for 1-2 weeks (resets leptin). 2) Reverse diet — slowly increase calories by 100/week. 3) Change exercise type (new stimulus). 4) ${cal < 1500 ? "Increase calories slightly — you may be under-eating." : "Reduce intake by 100-200 kcal or add 1 extra cardio session."}`, priority: "high", category: "Strategy" },
        { title: "Non-Scale Progress", description: "Scale weight isn't everything. Check: body measurements (waist/hip), progress photos, strength gains, clothing fit, energy levels. Body recomposition (gaining muscle while losing fat) can maintain scale weight while dramatically improving body composition.", priority: "medium", category: "Perspective" }
      ],
      detailedBreakdown: { "Plateau": isPlateau ? "Yes" : "No", "Weeks": weeks, "Change": `${wc} kg/wk`, "Calories": cal, "Exercise": `${exFreq}/week`, "Slowdown": `${metabolicSlowdown}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-plateau-calculator" title="Weight Plateau Helper"
      description="Diagnose weight loss plateaus. Identifies possible causes, metabolic slowdown, and provides breakthrough strategies."
      icon={AlertCircle} calculate={calculate} onClear={() => { setCurrentCal(1800); setWeeksStalled(3); setExerciseFreq(3); setWeightChange(0.2); setResult(null) }}
      values={[currentCal, weeksStalled, exerciseFreq, weightChange]} result={result}
      seoContent={<SeoContentGenerator title="Weight Plateau Calculator" description="Break through weight loss plateaus with diagnosis and strategies." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Calorie Intake" val={currentCal} set={setCurrentCal} min={800} max={5000} suffix="kcal/day" />
          <NumInput label="Weeks Stalled" val={weeksStalled} set={setWeeksStalled} min={1} max={20} suffix="weeks" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Exercise Frequency" val={exerciseFreq} set={setExerciseFreq} min={0} max={7} suffix="days/week" />
          <NumInput label="Avg Weight Change" val={weightChange} set={setWeightChange} min={-2} max={2} step={0.1} suffix="kg/week" />
        </div>
      </div>} />
  )
}

// ─── 19. Progress Check-In Calculator ─────────────────────────────────────────
export function ProgressCheckinCalculator() {
  const [weightChange, setWeightChange] = useState(-0.5)
  const [inchesLost, setInchesLost] = useState(1)
  const [calAvg, setCalAvg] = useState(1800)
  const [calTarget, setCalTarget] = useState(1900)
  const [exerciseMin, setExerciseMin] = useState(150)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wc = clamp(weightChange, -5, 5)
    const inches = clamp(inchesLost, 0, 10)
    const cAvg = clamp(calAvg, 500, 5000)
    const cTarget = clamp(calTarget, 500, 5000)
    const exMin = clamp(exerciseMin, 0, 600)

    // Progress score
    let score = 0
    score += wc < 0 ? Math.min(30, Math.abs(wc) * 20) : 0  // weight loss
    score += inches > 0 ? Math.min(25, inches * 12) : 0      // inch loss
    score += cAvg <= cTarget ? 25 : Math.max(0, 25 - (cAvg - cTarget) / 10)  // calorie adherence
    score += Math.min(20, exMin / 7.5)  // exercise (150 min/week = 20)

    score = r0(clamp(score, 0, 100))

    const consistency = cAvg <= cTarget * 1.05 && exMin >= 120 ? "High" : cAvg <= cTarget * 1.15 ? "Moderate" : "Low"
    const goalAdherence = r0(clamp(score * 0.85 + (consistency === "High" ? 15 : 0), 0, 100))

    const status: 'good' | 'warning' | 'danger' = score > 70 ? "good" : score > 40 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Weekly Progress Score", value: `${score}/100`, status, description: `${score > 75 ? "Excellent week!" : score > 50 ? "Good progress — keep going" : score > 25 ? "Room for improvement" : "Needs attention"}` },
      healthScore: score,
      metrics: [
        { label: "Progress Score", value: score, unit: "/100", status },
        { label: "Weight Change", value: wc, unit: "kg", status: wc < 0 ? "good" : wc === 0 ? "warning" : "danger" },
        { label: "Inches Lost", value: inches, unit: "inches", status: inches > 0.5 ? "good" : inches > 0 ? "warning" : "danger" },
        { label: "Calorie Adherence", value: `${cAvg}/${cTarget}`, unit: "kcal", status: cAvg <= cTarget ? "good" : cAvg <= cTarget * 1.1 ? "warning" : "danger" },
        { label: "Exercise", value: exMin, unit: "min/week", status: exMin >= 150 ? "good" : exMin >= 90 ? "warning" : "danger" },
        { label: "Consistency", value: consistency, status: consistency === "High" ? "good" : consistency === "Moderate" ? "warning" : "danger" },
        { label: "Goal Adherence", value: goalAdherence, unit: "%", status: goalAdherence > 70 ? "good" : goalAdherence > 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Weekly Summary", description: `Score: ${score}/100. Weight: ${wc > 0 ? "+" : ""}${wc} kg. Inches: -${inches}. Calories: ${cAvg}/${cTarget} kcal. Exercise: ${exMin} min. ${score > 70 ? "Outstanding consistency!" : score > 40 ? "Good foundation — small improvements will compound." : "Identify your biggest gap and focus on one improvement."}`, priority: "high", category: "Summary" },
        { title: "Next Week Focus", description: `${cAvg > cTarget * 1.1 ? "Priority: tighten calorie tracking — measure portions, log everything. " : ""}${exMin < 150 ? "Add more movement — even walking counts. Target 150+ min/week. " : ""}${wc > 0 ? "Weight up — may be water retention, or review calorie accuracy. " : ""} Consistency > perfection. One great week means nothing without the next one.`, priority: "high", category: "Action" }
      ],
      detailedBreakdown: { "Score": score, "Weight": `${wc} kg`, "Inches": inches, "Cal Avg": cAvg, "Cal Target": cTarget, "Exercise": `${exMin} min` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="progress-checkin" title="Weekly Progress Check-In"
      description="Generate a weekly transformation progress report. Scores your progress across weight, measurements, nutrition, and exercise."
      icon={Target} calculate={calculate} onClear={() => { setWeightChange(-0.5); setInchesLost(1); setCalAvg(1800); setCalTarget(1900); setExerciseMin(150); setResult(null) }}
      values={[weightChange, inchesLost, calAvg, calTarget, exerciseMin]} result={result}
      seoContent={<SeoContentGenerator title="Weekly Progress Check-In" description="Generate weekly weight loss progress report and score." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Weight Change This Week" val={weightChange} set={setWeightChange} min={-5} max={5} step={0.1} suffix="kg" />
          <NumInput label="Total Inches Lost" val={inchesLost} set={setInchesLost} min={0} max={10} step={0.5} suffix="inches" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Avg Daily Calories" val={calAvg} set={setCalAvg} min={500} max={5000} suffix="kcal" />
          <NumInput label="Calorie Target" val={calTarget} set={setCalTarget} min={500} max={5000} suffix="kcal" />
        </div>
        <NumInput label="Exercise Minutes" val={exerciseMin} set={setExerciseMin} min={0} max={600} suffix="min/week" />
      </div>} />
  )
}

// ─── 20. Metabolism Tracker ───────────────────────────────────────────────────
export function MetabolismTracker() {
  const [initialMaint, setInitialMaint] = useState(2400)
  const [currentCal, setCurrentCal] = useState(1800)
  const [lossRate, setLossRate] = useState(0.5)
  const [dietWeeks, setDietWeeks] = useState(8)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const init = clamp(initialMaint, 1200, 5000)
    const curr = clamp(currentCal, 800, 5000)
    const rate = clamp(lossRate, 0, 2)
    const weeks = clamp(dietWeeks, 1, 52)

    const totalLost = r1(rate * weeks)
    const expectedMaintDrop = r0(totalLost * 15)  // ~15 kcal per kg lost
    const expectedMaint = init - expectedMaintDrop
    const adaptiveDrop = r0(weeks * 4 + (curr < 1500 ? weeks * 2 : 0))  // additional metabolic adaptation
    const adjustedMaint = r0(expectedMaint - adaptiveDrop)

    const adaptPct = r1(((init - adjustedMaint) / init) * 100)
    const plannedDeficit = init - curr
    const actualDeficit = adjustedMaint - curr
    const plateauRisk = r0(clamp(adaptPct * 2 + (actualDeficit < 100 ? 30 : 0), 0, 90))

    const status: 'good' | 'warning' | 'danger' = adaptPct < 10 ? "good" : adaptPct < 20 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Metabolic Adaptation", value: `${adaptPct}%`, status, description: `Maintenance dropped from ${init} to ~${adjustedMaint} kcal — ${r0(init - adjustedMaint)} kcal reduction` },
      healthScore: Math.max(10, r0(100 - adaptPct * 3)),
      metrics: [
        { label: "Initial Maintenance", value: init, unit: "kcal", status: "normal" },
        { label: "Adjusted Maintenance", value: adjustedMaint, unit: "kcal", status: "normal" },
        { label: "Total Adaptation", value: `${adaptPct}%`, status },
        { label: "From Weight Loss", value: `-${expectedMaintDrop} kcal`, status: "normal" },
        { label: "Adaptive Reduction", value: `-${adaptiveDrop} kcal`, status: adaptiveDrop > 60 ? "danger" : adaptiveDrop > 30 ? "warning" : "good" },
        { label: "Actual Deficit", value: actualDeficit > 0 ? actualDeficit : 0, unit: "kcal", status: actualDeficit > 200 ? "good" : actualDeficit > 0 ? "warning" : "danger" },
        { label: "Total Lost", value: totalLost, unit: "kg", status: "good" },
        { label: "Plateau Risk", value: plateauRisk, unit: "%", status: plateauRisk < 25 ? "good" : plateauRisk < 55 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Metabolic Tracking", description: `${adaptPct}% total metabolic adaptation over ${weeks} weeks. Expected (from weight loss): -${expectedMaintDrop} kcal. Additional adaptive: -${adaptiveDrop} kcal. Your actual deficit is now ${actualDeficit} kcal (was ${plannedDeficit}). ${actualDeficit < 100 ? "CRITICAL: Deficit nearly eliminated — plateau imminent." : ""}`, priority: "high", category: "Tracking" },
        { title: "Adaptive Reduction", description: `Adaptive thermogenesis: -${adaptiveDrop} kcal beyond predicted. This is your body reducing NEAT, thyroid output, and muscle efficiency. Countermeasures: refeed days, diet breaks (2 weeks at maintenance), increase NEAT (10,000+ steps), resistance training (preserve muscle mass).`, priority: "high", category: "Science" },
        { title: "Reverse Dieting", description: `${adaptPct > 15 ? "Consider reverse dieting: increase calories by 50-100/week until reaching new maintenance. This restores metabolic rate over 4-8 weeks. Then resume cutting from higher baseline." : "Adaptation is manageable. Continue current approach but monitor weekly."}`, priority: "medium", category: "Strategy" }
      ],
      detailedBreakdown: { "Initial": `${init} kcal`, "Adjusted": `${adjustedMaint} kcal`, "Adaptation": `${adaptPct}%`, "Weight Lost": `${totalLost} kg`, "Plateau Risk": `${plateauRisk}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="metabolism-tracker" title="Metabolism Tracker"
      description="Track metabolic rate adaptation during dieting. Monitors maintenance calorie changes, adaptive thermogenesis, and plateau risk."
      icon={Activity} calculate={calculate} onClear={() => { setInitialMaint(2400); setCurrentCal(1800); setLossRate(0.5); setDietWeeks(8); setResult(null) }}
      values={[initialMaint, currentCal, lossRate, dietWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Metabolism Tracker" description="Track metabolic adaptation and adjusted maintenance calories." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Initial Maintenance" val={initialMaint} set={setInitialMaint} min={1200} max={5000} suffix="kcal" />
          <NumInput label="Current Intake" val={currentCal} set={setCurrentCal} min={800} max={5000} suffix="kcal" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Avg Loss Rate" val={lossRate} set={setLossRate} min={0} max={2} step={0.1} suffix="kg/week" />
          <NumInput label="Dieting Duration" val={dietWeeks} set={setDietWeeks} min={1} max={52} suffix="weeks" />
        </div>
      </div>} />
  )
}

// ─── 21. Weight Fluctuation Tracker ───────────────────────────────────────────
export function WeightFluctuationTracker() {
  const [morningWeight, setMorningWeight] = useState(80)
  const [eveningWeight, setEveningWeight] = useState(81.5)
  const [sodiumHigh, setSodiumHigh] = useState("moderate")
  const [carbHigh, setCarbHigh] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const am = clamp(morningWeight, 30, 300)
    const pm = clamp(eveningWeight, 30, 300)
    const dailyFluc = r1(pm - am)

    const waterRetention = (sodiumHigh === "high" ? 25 : sodiumHigh === "moderate" ? 12 : 3) + (carbHigh === "high" ? 20 : carbHigh === "moderate" ? 10 : 3)
    const waterRetentionPct = r0(clamp(waterRetention, 0, 80))

    const normalRange = dailyFluc <= 2 && dailyFluc >= 0
    const status: 'good' | 'warning' | 'danger' = normalRange ? "good" : dailyFluc < 3 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Daily Fluctuation", value: `${dailyFluc} kg`, status, description: `${normalRange ? "Normal range (0-2 kg typical)" : dailyFluc > 2 ? "Above normal — likely water retention" : "Unusual pattern"} — Water retention risk: ${waterRetentionPct}%` },
      healthScore: normalRange ? 80 : 50,
      metrics: [
        { label: "Morning Weight", value: am, unit: "kg", status: "normal" },
        { label: "Evening Weight", value: pm, unit: "kg", status: "normal" },
        { label: "Daily Fluctuation", value: dailyFluc, unit: "kg", status },
        { label: "Normal Range", value: normalRange ? "Yes" : "No", status: normalRange ? "good" : "warning" },
        { label: "Sodium Effect", value: sodiumHigh === "high" ? "High (+1-2 kg)" : sodiumHigh === "moderate" ? "Moderate" : "Low", status: sodiumHigh === "high" ? "danger" : sodiumHigh === "moderate" ? "warning" : "good" },
        { label: "Carb Effect", value: carbHigh === "high" ? "High (+1-3 kg)" : carbHigh === "moderate" ? "Moderate" : "Low", status: carbHigh === "high" ? "warning" : "good" },
        { label: "Water Retention Risk", value: waterRetentionPct, unit: "%", status: waterRetentionPct < 20 ? "good" : waterRetentionPct < 40 ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Weight Fluctuation", description: `${dailyFluc} kg daily swing (${normalRange ? "normal" : "elevated"}). 1-2 kg fluctuation is completely normal from food weight, water, and glycogen. Each gram of carbs stores 3-4g water. High sodium meal can add 1-2 kg overnight. Don't panic about daily scale changes.`, priority: "high", category: "Understanding" },
        { title: "True Weight Tracking", description: `Always weigh: morning, fasted, after bathroom, same clothing. Use 7-day moving average for true trend. Single daily weight is meaningless — only trends over weeks matter. ${waterRetentionPct > 30 ? "High retention risk today — weight is likely inflated." : ""}`, priority: "high", category: "Tips" },
        { title: "Reducing Fluctuations", description: "Strategies: 1) Consistent sodium intake. 2) Adequate water (2-3L/day — counterintuitive but reduces retention). 3) Manage stress (cortisol → water retention). 4) Women: track cycle — weight spikes 1-3 kg premenstrually.", priority: "medium", category: "Control" }
      ],
      detailedBreakdown: { "AM": `${am} kg`, "PM": `${pm} kg`, "Fluctuation": `${dailyFluc} kg`, "Sodium": sodiumHigh, "Carbs": carbHigh, "Water %": waterRetentionPct }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-fluctuation-tracker" title="Weight Fluctuation Tracker"
      description="Analyze daily weight changes from water, sodium, and carb factors. Separates true fat loss from water weight variation."
      icon={Scale} calculate={calculate} onClear={() => { setMorningWeight(80); setEveningWeight(81.5); setSodiumHigh("moderate"); setCarbHigh("moderate"); setResult(null) }}
      values={[morningWeight, eveningWeight, sodiumHigh, carbHigh]} result={result}
      seoContent={<SeoContentGenerator title="Weight Fluctuation Tracker" description="Track daily weight fluctuations and water retention." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Morning Weight" val={morningWeight} set={setMorningWeight} min={30} max={300} step={0.1} suffix="kg" />
          <NumInput label="Evening Weight" val={eveningWeight} set={setEveningWeight} min={30} max={300} step={0.1} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Sodium Intake" val={sodiumHigh} set={setSodiumHigh} options={[{ value: "low", label: "Low (<1500mg)" }, { value: "moderate", label: "Moderate (1500-3000mg)" }, { value: "high", label: "High (>3000mg)" }]} />
          <SelectInput label="Carb Intake" val={carbHigh} set={setCarbHigh} options={[{ value: "low", label: "Low (<100g)" }, { value: "moderate", label: "Moderate (100-250g)" }, { value: "high", label: "High (>250g)" }]} />
        </div>
      </div>} />
  )
}

// ─── 22. Body Measurement Tracker ─────────────────────────────────────────────
export function BodyMeasurementTracker() {
  const [waist, setWaist] = useState(34)
  const [hips, setHips] = useState(40)
  const [chest, setChest] = useState(38)
  const [thighs, setThighs] = useState(23)
  const [arms, setArms] = useState(13)
  const [prevTotal, setPrevTotal] = useState(152)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(waist, 20, 60)
    const h = clamp(hips, 25, 65)
    const c = clamp(chest, 25, 55)
    const t = clamp(thighs, 14, 35)
    const a = clamp(arms, 8, 22)
    const prev = clamp(prevTotal, 80, 250)

    const currentTotal = r1(w + h + c + t * 2 + a * 2)  // both sides
    const change = r1(currentTotal - prev)

    const whr = r2(w / h)
    const bodyShape = whr < 0.75 ? "Pear" : whr < 0.85 ? "Hourglass/Balanced" : "Apple"
    const whrRisk = whr > 0.9 ? "Elevated" : whr > 0.85 ? "Moderate" : "Low"

    const status: 'good' | 'warning' | 'danger' = change < -1 ? "good" : change < 1 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Total Change", value: `${change > 0 ? "+" : ""}${change} inches`, status, description: `Current total: ${currentTotal}″ — ${change < 0 ? "Progress!" : change === 0 ? "No change" : "Slight increase"}` },
      healthScore: Math.max(10, r0(80 + change * -10)),
      metrics: [
        { label: "Current Total", value: currentTotal, unit: "inches", status: "normal" },
        { label: "Previous Total", value: prev, unit: "inches", status: "normal" },
        { label: "Total Change", value: change, unit: "inches", status },
        { label: "Waist", value: w, unit: "inches", status: "normal" },
        { label: "Hips", value: h, unit: "inches", status: "normal" },
        { label: "Chest", value: c, unit: "inches", status: "normal" },
        { label: "Thighs", value: `${t}×2`, unit: "inches", status: "normal" },
        { label: "Arms", value: `${a}×2`, unit: "inches", status: "normal" },
        { label: "Waist-Hip Ratio", value: whr, status: whr < 0.85 ? "good" : whr < 0.95 ? "warning" : "danger" },
        { label: "Body Shape", value: bodyShape, status: "normal" },
        { label: "WHR Health Risk", value: whrRisk, status: whrRisk === "Low" ? "good" : whrRisk === "Moderate" ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Measurement Summary", description: `Total circumference change: ${change > 0 ? "+" : ""}${change}″. Waist: ${w}″, Hips: ${h}″, WHR: ${whr}. ${change < 0 ? "Great progress! Body measurements are more reliable than scale weight for tracking fat loss." : "Measurements stable — may be recompositing (muscle gain + fat loss)."}`, priority: "high", category: "Summary" },
        { title: "Body Shape Analysis", description: `Shape: ${bodyShape} (WHR: ${whr}). ${bodyShape === "Apple" ? "Apple shape (central obesity) = higher health risk. Focus on waist reduction through cardio + caloric deficit." : bodyShape === "Pear" ? "Pear shape = lower metabolic risk. Lower body fat is stubborn but less dangerous." : "Balanced proportions — maintain through consistent training."}`, priority: "high", category: "Shape" },
        { title: "Tracking Protocol", description: "Measure weekly, same day and time. Use flexible tape measure, not rigid. Stand relaxed, don't flex or suck in. Take 2 measurements at each site and average. Monthly comparison is more meaningful than weekly.", priority: "medium", category: "Method" }
      ],
      detailedBreakdown: { "Waist": w, "Hips": h, "Chest": c, "Thighs": `${t}×2`, "Arms": `${a}×2`, "Total": currentTotal, "Change": change, "WHR": whr }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="body-measurement-tracker" title="Body Measurement Tracker"
      description="Track multiple body circumferences. Includes waist-hip ratio analysis, body shape index, and progress scoring."
      icon={Activity} calculate={calculate} onClear={() => { setWaist(34); setHips(40); setChest(38); setThighs(23); setArms(13); setPrevTotal(152); setResult(null) }}
      values={[waist, hips, chest, thighs, arms, prevTotal]} result={result}
      seoContent={<SeoContentGenerator title="Body Measurement Tracker" description="Track body measurements and circumference changes." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">Current Measurements (inches)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Waist" val={waist} set={setWaist} min={20} max={60} step={0.5} suffix="inches" />
          <NumInput label="Hips" val={hips} set={setHips} min={25} max={65} step={0.5} suffix="inches" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Chest" val={chest} set={setChest} min={25} max={55} step={0.5} suffix="inches" />
          <NumInput label="Thigh (each)" val={thighs} set={setThighs} min={14} max={35} step={0.5} suffix="inches" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Arm (each)" val={arms} set={setArms} min={8} max={22} step={0.5} suffix="inches" />
          <NumInput label="Previous Total" val={prevTotal} set={setPrevTotal} min={80} max={250} step={0.5} suffix="inches" />
        </div>
      </div>} />
  )
}

// ─── 23. Before–After Comparison ──────────────────────────────────────────────
export function BeforeAfterComparison() {
  const [beforeWeight, setBeforeWeight] = useState(95)
  const [afterWeight, setAfterWeight] = useState(78)
  const [beforeWaist, setBeforeWaist] = useState(40)
  const [afterWaist, setAfterWaist] = useState(33)
  const [beforeBf, setBeforeBf] = useState(30)
  const [afterBf, setAfterBf] = useState(20)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bw = clamp(beforeWeight, 30, 300)
    const aw = clamp(afterWeight, 30, 300)
    const bWa = clamp(beforeWaist, 20, 60)
    const aWa = clamp(afterWaist, 20, 60)
    const bBf = clamp(beforeBf, 5, 60)
    const aBf = clamp(afterBf, 5, 60)

    const weightLoss = r1(bw - aw)
    const weightPct = r1((weightLoss / bw) * 100)
    const waistLoss = r1(bWa - aWa)
    const bfDrop = r1(bBf - aBf)

    const beforeFM = r1(bw * bBf / 100)
    const afterFM = r1(aw * aBf / 100)
    const beforeLM = r1(bw - beforeFM)
    const afterLM = r1(aw - afterFM)
    const fatLost = r1(beforeFM - afterFM)
    const muscleDelta = r1(afterLM - beforeLM)

    const transformScore = r0(clamp(weightPct * 3 + waistLoss * 5 + bfDrop * 3 + (muscleDelta > 0 ? 15 : 0), 0, 100))
    const status: 'good' | 'warning' | 'danger' = transformScore > 60 ? "good" : transformScore > 30 ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "Transformation Score", value: `${transformScore}/100`, status, description: `${weightLoss} kg lost, ${waistLoss}″ waist reduction, ${bfDrop}% BF drop` },
      healthScore: transformScore,
      metrics: [
        { label: "Weight Lost", value: weightLoss, unit: "kg", status: weightLoss > 0 ? "good" : "danger" },
        { label: "Weight Loss %", value: weightPct, unit: "%", status: weightPct > 5 ? "good" : weightPct > 0 ? "warning" : "danger" },
        { label: "Waist Reduction", value: waistLoss, unit: "inches", status: waistLoss > 2 ? "good" : waistLoss > 0 ? "warning" : "danger" },
        { label: "Body Fat Drop", value: bfDrop, unit: "%", status: bfDrop > 5 ? "good" : bfDrop > 0 ? "warning" : "danger" },
        { label: "Fat Mass Lost", value: fatLost, unit: "kg", status: fatLost > 0 ? "good" : "danger" },
        { label: "Lean Mass Change", value: `${muscleDelta > 0 ? "+" : ""}${muscleDelta}`, unit: "kg", status: muscleDelta >= 0 ? "good" : "warning" },
        { label: "Before Fat Mass", value: beforeFM, unit: "kg", status: "normal" },
        { label: "After Fat Mass", value: afterFM, unit: "kg", status: "normal" },
        { label: "Transformation Score", value: transformScore, unit: "/100", status }
      ],
      recommendations: [
        { title: "Transformation Summary", description: `${weightLoss} kg lost (${weightPct}%), waist down ${waistLoss}″, body fat ${bBf}% → ${aBf}%. Fat mass: ${beforeFM} → ${afterFM} kg (lost ${fatLost} kg fat). Lean mass: ${beforeLM} → ${afterLM} kg (${muscleDelta > 0 ? "gained " + muscleDelta + " kg muscle — excellent recomposition!" : muscleDelta === 0 ? "maintained muscle — good!" : "lost " + Math.abs(muscleDelta) + " kg lean mass — increase protein."})`, priority: "high", category: "Summary" },
        { title: "Body Composition", description: `${muscleDelta > 0 ? "Gained muscle while losing fat — this is body recomposition and the gold standard of transformation." : muscleDelta >= -1 ? "Minimal lean mass loss — good muscle retention during cut." : "Significant lean mass loss — increase protein to 2g/kg and add resistance training."} Focus on body fat % and measurements, not just scale weight.`, priority: "high", category: "Composition" },
        { title: "Next Phase", description: `Score: ${transformScore}/100. ${aBf > 25 ? "Continue cutting — still room for improvement." : aBf > 15 ? "Consider maintenance phase for 4-8 weeks to consolidate gains, then reassess." : "Lean! Consider lean bulk to add muscle, or maintain."}`, priority: "medium", category: "Next Steps" }
      ],
      detailedBreakdown: { "Weight": `${bw} → ${aw} kg`, "Waist": `${bWa} → ${aWa}″`, "BF%": `${bBf} → ${aBf}%`, "Fat Lost": `${fatLost} kg`, "Muscle": `${muscleDelta > 0 ? "+" : ""}${muscleDelta} kg`, "Score": transformScore }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="before-after-comparison" title="Before–After Comparison"
      description="Compare transformation metrics including weight, waist, body fat. Calculates fat lost, lean mass changes, and transformation score."
      icon={Target} calculate={calculate} onClear={() => { setBeforeWeight(95); setAfterWeight(78); setBeforeWaist(40); setAfterWaist(33); setBeforeBf(30); setAfterBf(20); setResult(null) }}
      values={[beforeWeight, afterWeight, beforeWaist, afterWaist, beforeBf, afterBf]} result={result}
      seoContent={<SeoContentGenerator title="Before After Comparison" description="Compare your before and after transformation metrics." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">Before</p>
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Weight" val={beforeWeight} set={setBeforeWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Waist" val={beforeWaist} set={setBeforeWaist} min={20} max={60} step={0.5} suffix="inches" />
          <NumInput label="Body Fat" val={beforeBf} set={setBeforeBf} min={5} max={60} step={0.5} suffix="%" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">After</p>
        <div className="grid grid-cols-3 gap-3">
          <NumInput label="Weight" val={afterWeight} set={setAfterWeight} min={30} max={300} step={0.5} suffix="kg" />
          <NumInput label="Waist" val={afterWaist} set={setAfterWaist} min={20} max={60} step={0.5} suffix="inches" />
          <NumInput label="Body Fat" val={afterBf} set={setAfterBf} min={5} max={60} step={0.5} suffix="%" />
        </div>
      </div>} />
  )
}

// ─── 24. Progress Photo Planner ───────────────────────────────────────────────
export function ProgressPhotoPlanner() {
  const [goalWeeks, setGoalWeeks] = useState(16)
  const [photoFreq, setPhotoFreq] = useState("weekly")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const weeks = clamp(goalWeeks, 4, 104)
    const freqDays = photoFreq === "daily" ? 1 : photoFreq === "weekly" ? 7 : photoFreq === "biweekly" ? 14 : 30
    const totalPhotos = r0(weeks * 7 / freqDays)
    const milestones = [r0(weeks * 0.25), r0(weeks * 0.5), r0(weeks * 0.75), weeks]

    setResult({
      primaryMetric: { label: "Photo Schedule", value: `${totalPhotos} sessions`, status: "good", description: `Every ${freqDays === 1 ? "day" : freqDays === 7 ? "week" : freqDays === 14 ? "2 weeks" : "month"} for ${weeks} weeks` },
      healthScore: 85,
      metrics: [
        { label: "Total Sessions", value: totalPhotos, status: "good" },
        { label: "Frequency", value: photoFreq === "daily" ? "Daily" : photoFreq === "weekly" ? "Weekly" : photoFreq === "biweekly" ? "Bi-weekly" : "Monthly", status: "good" },
        { label: "Duration", value: weeks, unit: "weeks", status: "normal" },
        { label: "Milestone 1", value: `Week ${milestones[0]}`, status: "good" },
        { label: "Milestone 2", value: `Week ${milestones[1]}`, status: "good" },
        { label: "Milestone 3", value: `Week ${milestones[2]}`, status: "good" },
        { label: "Final", value: `Week ${milestones[3]}`, status: "good" }
      ],
      recommendations: [
        { title: "Photo Protocol", description: `${totalPhotos} photo sessions over ${weeks} weeks. Best practice: 3 angles (front, side, back). Same time (morning, fasted), same lighting, same location, same clothing (tight-fitting or minimal). Natural light is best — avoid flash.`, priority: "high", category: "Protocol" },
        { title: "Milestones", description: `Key comparison points: Week ${milestones[0]} (25% mark), Week ${milestones[1]} (halfway), Week ${milestones[2]} (75%), Week ${milestones[3]} (final). Visual changes often lag behind scale/measurement changes. Most noticeable differences appear at 30-day intervals.`, priority: "high", category: "Milestones" },
        { title: "Motivation", description: "Progress photos are the BEST motivation tool. Scale lies (water, muscle gain), but photos don't. Review first vs current photo when motivation dips. Don't compare daily — compare monthly for visible changes.", priority: "medium", category: "Motivation" }
      ],
      detailedBreakdown: { "Sessions": totalPhotos, "Frequency": photoFreq, "Weeks": weeks, "M1": `Wk ${milestones[0]}`, "M2": `Wk ${milestones[1]}`, "M3": `Wk ${milestones[2]}`, "Final": `Wk ${milestones[3]}` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="progress-photo-planner" title="Progress Photo Planner"
      description="Plan a visual tracking schedule for your transformation. Sets milestones and provides photo best-practice protocol."
      icon={Clock} calculate={calculate} onClear={() => { setGoalWeeks(16); setPhotoFreq("weekly"); setResult(null) }}
      values={[goalWeeks, photoFreq]} result={result}
      seoContent={<SeoContentGenerator title="Progress Photo Planner" description="Plan progress photo schedule for body transformation." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Goal Duration" val={goalWeeks} set={setGoalWeeks} min={4} max={104} suffix="weeks" />
          <SelectInput label="Photo Frequency" val={photoFreq} set={setPhotoFreq} options={[{ value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "biweekly", label: "Bi-weekly" }, { value: "monthly", label: "Monthly" }]} />
        </div>
      </div>} />
  )
}

// ─── 25. Weight Trend Analyzer ────────────────────────────────────────────────
export function WeightTrendAnalyzer() {
  const [week1, setWeek1] = useState(85)
  const [week2, setWeek2] = useState(84.5)
  const [week3, setWeek3] = useState(84.8)
  const [week4, setWeek4] = useState(84.2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w1 = clamp(week1, 30, 300)
    const w2 = clamp(week2, 30, 300)
    const w3 = clamp(week3, 30, 300)
    const w4 = clamp(week4, 30, 300)

    const totalChange = r1(w4 - w1)
    const weeklyRate = r2(totalChange / 3)
    const trend = totalChange < -0.3 ? "Downward" : totalChange > 0.3 ? "Upward" : "Flat"

    // Fluctuation analysis
    const avg = r1((w1 + w2 + w3 + w4) / 4)
    const maxFluc = r1(Math.max(w1, w2, w3, w4) - Math.min(w1, w2, w3, w4))
    const waterEffect = maxFluc > 1.5 ? "High — significant water fluctuation" : maxFluc > 0.8 ? "Moderate" : "Low"

    const trueFatLoss = totalChange < 0 ? r1(Math.abs(totalChange) * 0.7) : 0
    const plateauPrediction = Math.abs(totalChange) < 0.5 ? "Possible plateau in 2-4 weeks" : totalChange < -0.5 ? "On track — no plateau expected" : "Weight trending up — reassess plan"

    const status: 'good' | 'warning' | 'danger' = trend === "Downward" ? "good" : trend === "Flat" ? "warning" : "danger"

    setResult({
      primaryMetric: { label: "4-Week Trend", value: `${totalChange > 0 ? "+" : ""}${totalChange} kg`, status, description: `${trend} trend — Rate: ${weeklyRate} kg/week` },
      healthScore: trend === "Downward" ? 80 : trend === "Flat" ? 50 : 25,
      metrics: [
        { label: "Total Change", value: totalChange, unit: "kg", status },
        { label: "Weekly Rate", value: weeklyRate, unit: "kg/wk", status: weeklyRate < -0.2 ? "good" : Math.abs(weeklyRate) < 0.1 ? "warning" : weeklyRate > 0 ? "danger" : "good" },
        { label: "Trend Direction", value: trend, status },
        { label: "4-Week Average", value: avg, unit: "kg", status: "normal" },
        { label: "Max Fluctuation", value: maxFluc, unit: "kg", status: maxFluc < 1 ? "good" : maxFluc < 2 ? "warning" : "danger" },
        { label: "Water Effect", value: waterEffect, status: waterEffect.startsWith("High") ? "danger" : waterEffect === "Moderate" ? "warning" : "good" },
        { label: "Est. True Fat Loss", value: trueFatLoss, unit: "kg", status: trueFatLoss > 0 ? "good" : "warning" },
        { label: "Plateau Prediction", value: plateauPrediction, status: plateauPrediction.includes("no plateau") ? "good" : plateauPrediction.includes("Possible") ? "warning" : "danger" }
      ],
      recommendations: [
        { title: "Trend Analysis", description: `4-week change: ${totalChange > 0 ? "+" : ""}${totalChange} kg (${trend}). Weekly rate: ${weeklyRate} kg/wk. Healthy loss: 0.5-1 kg/week. ${Math.abs(weeklyRate) > 1 ? "Losing too fast — may lose muscle. Slow down." : Math.abs(weeklyRate) < 0.3 && totalChange < 0 ? "Slow but steady — sustainable approach." : ""}`, priority: "high", category: "Trend" },
        { title: "Fluctuation vs Fat Loss", description: `Max fluctuation: ${maxFluc} kg. Water effect: ${waterEffect}. True fat loss estimated: ~${trueFatLoss} kg. Week-to-week weight can spike from: high sodium day, new exercise routine, carb refeed, menstrual cycle, stress, poor sleep. Always compare 4-week averages.`, priority: "high", category: "Analysis" },
        { title: "Prediction", description: `${plateauPrediction}. ${trend === "Flat" ? "Strategies if plateau hits: refeed day, diet break, change exercise type, reassess calorie tracking accuracy (hidden calories in sauces, oils, snacks)." : trend === "Downward" ? "Great progress — continue current approach." : "Weight gaining — review adherence, track all food for 1 week to find hidden excess."}`, priority: "medium", category: "Forecast" }
      ],
      detailedBreakdown: { "Wk1": w1, "Wk2": w2, "Wk3": w3, "Wk4": w4, "Change": totalChange, "Rate": `${weeklyRate}/wk`, "Avg": avg, "Trend": trend }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="weight-trend-analyzer" title="Weight Trend Analyzer"
      description="Analyze 4-week weight patterns to identify true fat loss versus water fluctuations. Includes plateau prediction."
      icon={TrendingDown} calculate={calculate} onClear={() => { setWeek1(85); setWeek2(84.5); setWeek3(84.8); setWeek4(84.2); setResult(null) }}
      values={[week1, week2, week3, week4]} result={result}
      seoContent={<SeoContentGenerator title="Weight Trend Analyzer" description="Analyze long-term weight trends and separate fat loss from water." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">Weekly Average Weights (kg)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Week 1 Average" val={week1} set={setWeek1} min={30} max={300} step={0.1} suffix="kg" />
          <NumInput label="Week 2 Average" val={week2} set={setWeek2} min={30} max={300} step={0.1} suffix="kg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Week 3 Average" val={week3} set={setWeek3} min={30} max={300} step={0.1} suffix="kg" />
          <NumInput label="Week 4 Average" val={week4} set={setWeek4} min={30} max={300} step={0.1} suffix="kg" />
        </div>
      </div>} />
  )
}

// ─── 26. Refeed Day Calculator ────────────────────────────────────────────────
export function RefeedDayCalculator() {
  const [currentDeficit, setCurrentDeficit] = useState(500)
  const [bodyFat, setBodyFat] = useState(18)
  const [trainingIntensity, setTrainingIntensity] = useState("moderate")
  const [dietWeeks, setDietWeeks] = useState(6)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const deficit = clamp(currentDeficit, 100, 1500)
    const bf = clamp(bodyFat, 5, 50)
    const weeks = clamp(dietWeeks, 1, 52)

    // Refeed frequency based on body fat
    let refeedFreq = ""
    if (bf < 12) refeedFreq = "Every 5-7 days"
    else if (bf < 18) refeedFreq = "Every 7-10 days"
    else if (bf < 25) refeedFreq = "Every 10-14 days"
    else refeedFreq = "Every 14-21 days"

    // Refeed calories (maintenance + slight surplus from carbs)
    const maintenanceEst = 2200  // rough average
    const refeedCals = r0(maintenanceEst + (trainingIntensity === "heavy" ? 300 : trainingIntensity === "moderate" ? 150 : 0))
    const refeedCarbs = r0((refeedCals * 0.55) / 4)  // 55% from carbs, 4 cal/g

    const hormonalReset = bf < 15 ? "High benefit" : bf < 22 ? "Moderate benefit" : "Low benefit"
    const leptinBoost = r0(clamp(25 + weeks * 3 - bf * 0.5, 10, 60))

    const status: 'good' | 'warning' | 'danger' = "good"

    setResult({
      primaryMetric: { label: "Refeed Schedule", value: refeedFreq, status, description: `At ${bf}% BF after ${weeks} weeks dieting — Refeed: ${refeedCals} kcal` },
      healthScore: 75,
      metrics: [
        { label: "Refeed Frequency", value: refeedFreq, status: "good" },
        { label: "Refeed Calories", value: refeedCals, unit: "kcal", status: "good" },
        { label: "Refeed Carbs", value: refeedCarbs, unit: "grams", status: "good" },
        { label: "Current Deficit", value: deficit, unit: "kcal/day", status: "normal" },
        { label: "Body Fat", value: bf, unit: "%", status: bf < 25 ? "good" : "warning" },
        { label: "Diet Duration", value: weeks, unit: "weeks", status: weeks > 12 ? "warning" : "good" },
        { label: "Hormonal Reset", value: hormonalReset, status: "good" },
        { label: "Leptin Boost Est.", value: leptinBoost, unit: "%", status: leptinBoost > 30 ? "good" : "normal" }
      ],
      recommendations: [
        { title: "Refeed Strategy", description: `Schedule: ${refeedFreq}. Eat ${refeedCals} kcal with ${refeedCarbs}g carbs on refeed days. Refeeds are NOT cheat meals — they're strategic high-carb days at maintenance. Focus on complex carbs: rice, oats, potatoes, fruit. Keep fat low (<50g), protein normal.`, priority: "high", category: "Strategy" },
        { title: "Hormonal Benefits", description: `${hormonalReset}. Refeeds boost leptin (satiety hormone) by ${leptinBoost}%, restore thyroid function (T3), reduce cortisol, and improve training performance. Leaner individuals (${bf < 15 ? "like you at " + bf + "%" : ""}) benefit more because leptin drops faster during cutting.`, priority: "high", category: "Hormones" },
        { title: "Implementation", description: `${weeks > 8 ? "After " + weeks + " weeks of dieting, consider a full diet break (2 weeks at maintenance) instead of single refeed days." : "Single refeed days sufficient at this point."} Place refeeds on your hardest training day. Psychological benefit: something to look forward to. ${trainingIntensity === "heavy" ? "Heavy training demands more frequent refeeds for recovery." : ""}`, priority: "medium", category: "Execution" }
      ],
      detailedBreakdown: { "Frequency": refeedFreq, "Calories": refeedCals, "Carbs": `${refeedCarbs}g`, "BF%": bf, "Deficit": deficit, "Weeks": weeks, "Leptin": `+${leptinBoost}%` }
    })
  }

  return (
    <ComprehensiveHealthTemplate toolId="refeed-day-calculator" title="Refeed Day Calculator"
      description="Plan strategic refeed days to prevent metabolic slowdown. Calculates frequency, calories, and carb targets based on body fat and diet duration."
      icon={Flame} calculate={calculate} onClear={() => { setCurrentDeficit(500); setBodyFat(18); setTrainingIntensity("moderate"); setDietWeeks(6); setResult(null) }}
      values={[currentDeficit, bodyFat, trainingIntensity, dietWeeks]} result={result}
      seoContent={<SeoContentGenerator title="Refeed Day Calculator" description="Calculate optimal refeed day schedule for metabolism." categoryName="Health" />}
      inputs={<div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <NumInput label="Current Daily Deficit" val={currentDeficit} set={setCurrentDeficit} min={100} max={1500} suffix="kcal" />
          <NumInput label="Body Fat" val={bodyFat} set={setBodyFat} min={5} max={50} step={0.5} suffix="%" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SelectInput label="Training Intensity" val={trainingIntensity} set={setTrainingIntensity} options={[{ value: "light", label: "Light" }, { value: "moderate", label: "Moderate" }, { value: "heavy", label: "Heavy" }]} />
          <NumInput label="Weeks on Diet" val={dietWeeks} set={setDietWeeks} min={1} max={52} suffix="weeks" />
        </div>
      </div>} />
  )
}
