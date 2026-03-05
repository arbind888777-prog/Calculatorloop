"use client"

import { useState } from "react"
import { Activity, Scale, Utensils, Heart, Droplets, Moon, Dumbbell, Ruler, User } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

// ─── Shared helpers ───────────────────────────────────────────────────────────
function r0(n: number) { return Math.round(n) }
function r1(n: number) { return Math.round(n * 10) / 10 }

function mifflin(w: number, h: number, a: number, g: string) {
  return g === "male" ? 10 * w + 6.25 * h - 5 * a + 5 : 10 * w + 6.25 * h - 5 * a - 161
}

const ACT_MULT: Record<string, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9,
}
const ACT_LABEL: Record<string, string> = {
  sedentary: "Sedentary (desk job)",
  light: "Light (1-3×/week)",
  moderate: "Moderate (3-5×/week)",
  active: "Active (6-7×/week)",
  veryActive: "Very Active (athlete)",
}

function GenderToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {["male", "female"].map(g => (
        <button key={g} onClick={() => onChange(g)}
          className={`py-2 rounded-xl border text-sm font-medium transition-colors ${value === g ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:border-primary/50"}`}>
          {g === "male" ? "Male" : "Female"}
        </button>
      ))}
    </div>
  )
}

function NumInput({ label, val, set, min, max, step }: { label: string; val: number; set: (n: number) => void; min: number; max: number; step?: number }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input type="number" value={val} onChange={e => set(Number(e.target.value))} min={min} max={max} step={step ?? 1}
        className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
    </div>
  )
}

// BMR Calculator
export function BMRCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bmr = r0(mifflin(weight, height, age, gender))
    const hb = r0(gender === "male"
      ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      : 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age)
    const bmi = r1(weight / Math.pow(height / 100, 2))
    setResult({
      primaryMetric: {
        label: "BMR (Mifflin-St Jeor)", value: bmr, unit: "kcal/day", status: "normal",
        description: "Calories your body burns at rest to sustain life.",
      },
      healthScore: Math.min(100, Math.max(40, r0(100 - Math.abs(bmr - 1700) / 20))),
      metrics: [
        { label: "BMR — Harris-Benedict", value: hb, unit: "kcal/day", status: "normal" },
        { label: "Average (both formulas)", value: r0((bmr + hb) / 2), unit: "kcal/day", status: "good" },
        { label: "BMI (reference)", value: bmi, status: bmi < 18.5 ? "warning" : bmi < 25 ? "good" : "warning" },
        ...Object.entries(ACT_MULT).map(([k, m]) => ({
          label: `TDEE — ${ACT_LABEL[k]}`, value: r0(bmr * m), unit: "kcal", status: "normal" as const,
        })),
      ],
      recommendations: [
        { title: "Never eat below your BMR", description: `Your BMR is ${bmr} kcal. Eating below this causes muscle loss and hormonal disruption.`, priority: "high", category: "Nutrition" },
        { title: "Formula accuracy is ±5-10%", description: "Mifflin-St Jeor is the most validated formula. DEXA or indirect calorimetry gives exact numbers.", priority: "medium", category: "Science" },
        { title: "Recalculate every 3-6 months", description: "BMR changes with age and body composition. Recalculate as you progress.", priority: "low", category: "Tracking" },
      ],
      riskFactors: bmr < 1200 ? ["Very low BMR — consider a medical evaluation"] : [],
      detailedBreakdown: { "Weight": `${weight} kg`, "Height": `${height} cm`, "Age": `${age} yr`, "Gender": gender, "BMI": bmi },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="bmr-calculator"
      title="BMR Calculator"
      description="Calculate Basal Metabolic Rate with Mifflin-St Jeor & Harris-Benedict formulas. Full TDEE breakdown for every activity level."
      icon={Activity}
      calculate={calculate}
      onClear={() => { setWeight(70); setHeight(170); setAge(30); setGender("male"); setResult(null) }}
      values={[weight, height, age, gender]}
      result={result}
      seoContent={<SeoContentGenerator title="BMR Calculator" description="Calculate your Basal Metabolic Rate." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={30} max={250} />
          <NumInput label="Height (cm)" val={height} set={setHeight} min={100} max={250} />
          <NumInput label="Age (years)" val={age} set={setAge} min={5} max={100} />
        </div>
      }
    />
  )
}

// Body Fat Calculator
export function BodyFatCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [neck, setNeck] = useState(37)
  const [waist, setWaist] = useState(85)
  const [hip, setHip] = useState(95)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const bfCat = (bf: number, g: string) => {
    if (g === "male") {
      if (bf < 6) return { label: "Essential Fat", status: "warning" as const }
      if (bf < 14) return { label: "Athletic", status: "good" as const }
      if (bf < 18) return { label: "Fit", status: "good" as const }
      if (bf < 25) return { label: "Average", status: "normal" as const }
      return { label: "Obese", status: "danger" as const }
    } else {
      if (bf < 14) return { label: "Essential Fat", status: "warning" as const }
      if (bf < 21) return { label: "Athletic", status: "good" as const }
      if (bf < 25) return { label: "Fit", status: "good" as const }
      if (bf < 32) return { label: "Average", status: "normal" as const }
      return { label: "Obese", status: "danger" as const }
    }
  }

  const calculate = () => {
    let bfNavy = gender === "male"
      ? 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450
      : 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450
    bfNavy = r1(bfNavy)
    const bmi = r1(weight / Math.pow(height / 100, 2))
    const bfDeurenberg = r1(1.2 * bmi + 0.23 * 30 - 10.8 * (gender === "male" ? 1 : 0) - 5.4)
    const fatMass = r1((bfNavy / 100) * weight)
    const leanMass = r1(weight - fatMass)
    const cat = bfCat(bfNavy, gender)
    setResult({
      primaryMetric: { label: "Body Fat % (US Navy)", value: bfNavy, unit: "%", status: cat.status, description: `Category: ${cat.label}` },
      healthScore: Math.max(0, r0(100 - Math.abs(bfNavy - (gender === "male" ? 15 : 22)) * 3)),
      metrics: [
        { label: "Category", value: cat.label, status: cat.status },
        { label: "Est. BF (Deurenberg)", value: bfDeurenberg, unit: "%", status: "normal" },
        { label: "Fat Mass", value: fatMass, unit: "kg", status: "normal" },
        { label: "Lean Mass", value: leanMass, unit: "kg", status: "good" },
        { label: "BMI", value: bmi, status: bmi < 25 ? "good" : "warning" },
        { label: "Weight", value: weight, unit: "kg", status: "normal" },
      ],
      recommendations: [
        { title: "Healthy BF targets", description: `Male ideal 10-20% | Female 18-28%. Your level: ${cat.label}.`, priority: cat.status === "danger" ? "high" : "medium", category: "Goals" },
        { title: "Focus on lean mass preservation", description: `You have ${leanMass} kg lean mass. Preserve it with protein ≥${r0(leanMass * 2.2)}g/day + resistance training.`, priority: "high", category: "Training" },
        { title: "Measurement accuracy", description: "US Navy formula is ±3-4%. DEXA scan is the gold standard for precise measurement.", priority: "low", category: "Science" },
      ],
      riskFactors: bfNavy > (gender === "male" ? 25 : 32) ? ["Elevated BF — increased risk of metabolic syndrome, diabetes and CVD"] : bfNavy < (gender === "male" ? 6 : 14) ? ["Very low BF — may affect hormonal function and bone density"] : [],
      detailedBreakdown: { "Gender": gender, "Weight": `${weight} kg`, "Height": `${height} cm`, "Neck": `${neck} cm`, "Waist": `${waist} cm`, ...(gender === "female" ? { "Hip": `${hip} cm` } : {}), "Formula": "US Navy + Deurenberg" },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="body-fat-calculator"
      title="Body Fat Calculator"
      description="US Navy + Deurenberg dual-formula body fat estimate. Get fat mass, lean mass, FFMI and personalised recommendations."
      icon={Scale}
      calculate={calculate}
      onClear={() => { setWeight(70); setHeight(170); setNeck(37); setWaist(85); setHip(95); setGender("male"); setResult(null) }}
      values={[weight, height, neck, waist, hip, gender]}
      result={result}
      seoContent={<SeoContentGenerator title="Body Fat Calculator" description="Estimate body fat percentage." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={30} max={250} />
          <NumInput label="Height (cm)" val={height} set={setHeight} min={100} max={250} />
          <NumInput label="Neck (cm)" val={neck} set={setNeck} min={20} max={70} />
          <NumInput label="Waist (cm)" val={waist} set={setWaist} min={40} max={180} />
          {gender === "female" && <NumInput label="Hip (cm)" val={hip} set={setHip} min={50} max={180} />}
        </div>
      }
    />
  )
}

// Calorie Calculator
export function CalorieCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [activity, setActivity] = useState("moderate")
  const [goal, setGoal] = useState("maintain")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bmr = r0(mifflin(weight, height, age, gender))
    let calories = r0(bmr * ACT_MULT[activity])
    if (goal === "lose") calories -= 500
    if (goal === "gain") calories += 500
    if (goal === "aggressiveLose") calories -= 1000
    const proteinG = r0(weight * (goal === "gain" ? 2.2 : goal === "lose" ? 2.5 : 1.8))
    const fatG = r0((calories * 0.25) / 9)
    const carbG = r0(Math.max(0, (calories - proteinG * 4 - fatG * 9) / 4))
    const weeklyChange = r1(((calories - r0(bmr * ACT_MULT[activity])) * 7) / 7700)
    setResult({
      primaryMetric: { label: "Target Calories", value: calories, unit: "kcal/day", status: "normal", description: `Goal: ${goal} | BMR: ${bmr} kcal` },
      healthScore: 75,
      metrics: [
        { label: "BMR", value: bmr, unit: "kcal", status: "normal" },
        { label: "TDEE (maintenance)", value: r0(bmr * ACT_MULT[activity]), unit: "kcal", status: "normal" },
        { label: "Target calories", value: calories, unit: "kcal", status: "good" },
        { label: "Protein", value: proteinG, unit: "g/day", status: "good" },
        { label: "Carbohydrates", value: carbG, unit: "g/day", status: "normal" },
        { label: "Fat", value: fatG, unit: "g/day", status: "normal" },
        { label: "Weekly weight change", value: weeklyChange, unit: "kg/week", status: "normal" },
        { label: "Aggressive cut (-1000 kcal)", value: r0(bmr * ACT_MULT[activity]) - 1000, unit: "kcal", status: "warning" },
        { label: "Lean bulk (+250 kcal)", value: r0(bmr * ACT_MULT[activity]) + 250, unit: "kcal", status: "normal" },
      ],
      recommendations: [
        { title: "Stay in a moderate deficit/surplus", description: `±500 kcal from TDEE is optimal for 0.5 kg/week change. More aggressive changes risk muscle loss or excess fat gain.`, priority: "high", category: "Nutrition" },
        { title: "Track for at least 2 weeks", description: "Your actual TDEE may differ from calculated. Adjust by ±100-200 kcal based on real weight trends.", priority: "medium", category: "Tracking" },
      ],
      riskFactors: calories < 1200 ? ["Calorie target below 1200 kcal — risk of nutrient deficiency"] : [],
      detailedBreakdown: { "Weight": `${weight} kg`, "Height": `${height} cm`, "Age": `${age} yr`, "Gender": gender, "Activity": ACT_LABEL[activity], "Goal": goal },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="calorie-calculator"
      title="Daily Calorie Calculator"
      description="BMR + TDEE + macro split with Mifflin-St Jeor formula. Get target calories, macros and weekly weight-change projection."
      icon={Utensils}
      calculate={calculate}
      onClear={() => { setWeight(70); setHeight(170); setAge(30); setGender("male"); setActivity("moderate"); setGoal("maintain"); setResult(null) }}
      values={[weight, height, age, gender, activity, goal]}
      result={result}
      seoContent={<SeoContentGenerator title="Daily Calorie Calculator" description="Calculate daily calorie needs." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={30} max={250} />
          <NumInput label="Height (cm)" val={height} set={setHeight} min={100} max={250} />
          <NumInput label="Age (years)" val={age} set={setAge} min={5} max={100} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Level</label>
            <select value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              {Object.entries(ACT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              <option value="aggressiveLose">Aggressive Loss (-1000 kcal)</option>
              <option value="lose">Lose Weight (-500 kcal)</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Gain Muscle (+500 kcal)</option>
            </select>
          </div>
        </div>
      }
    />
  )
}

// Ideal Weight Calculator
export function IdealWeightCalculator() {
  const [height, setHeight] = useState(170)
  const [gender, setGender] = useState("male")
  const [currentWeight, setCurrentWeight] = useState(75)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const hIn = height / 2.54
    const ex = hIn - 60
    let hamwi: number, devine: number, robinson: number, miller: number
    if (gender === "male") { hamwi = 48 + 2.7 * ex; devine = 50 + 2.3 * ex; robinson = 52 + 1.9 * ex; miller = 56.2 + 1.41 * ex }
    else { hamwi = 45.5 + 2.2 * ex; devine = 45.5 + 2.3 * ex; robinson = 49 + 1.7 * ex; miller = 53.1 + 1.36 * ex }
    const avg = r1((hamwi + devine + robinson + miller) / 4)
    const low = r1(avg * 0.9); const high = r1(avg * 1.1)
    const bmi22 = r1((22 * height * height) / 10000)
    const bmi25 = r1((25 * height * height) / 10000)
    const diff = r1(currentWeight - avg)
    const cBmi = r1(currentWeight / Math.pow(height / 100, 2))
    setResult({
      primaryMetric: { label: "Ideal Weight (Average)", value: avg, unit: "kg", status: currentWeight >= low && currentWeight <= high ? "good" : "warning", description: `Healthy range: ${low}–${high} kg` },
      healthScore: Math.max(0, r0(100 - Math.abs(diff) * 2)),
      metrics: [
        { label: "Hamwi Formula", value: r0(hamwi), unit: "kg", status: "normal" },
        { label: "Devine Formula", value: r0(devine), unit: "kg", status: "normal" },
        { label: "Robinson Formula", value: r0(robinson), unit: "kg", status: "normal" },
        { label: "Miller Formula", value: r0(miller), unit: "kg", status: "normal" },
        { label: "BMI 22 target", value: bmi22, unit: "kg", status: "good" },
        { label: "BMI 25 target", value: bmi25, unit: "kg", status: "normal" },
        { label: "Healthy range", value: `${low}–${high}`, unit: "kg", status: "good" },
        { label: "Your Weight", value: currentWeight, unit: "kg", status: "normal" },
        { label: "Current BMI", value: cBmi, status: cBmi < 25 ? "good" : "warning" },
        { label: "Diff from ideal", value: `${diff > 0 ? "+" : ""}${diff}`, unit: "kg", status: Math.abs(diff) > 5 ? "warning" : "good" },
      ],
      recommendations: [
        { title: "Target a range, not a single number", description: `Healthy weight for ${height} cm is ${low}–${high} kg. All 4 formulas agree on this band.`, priority: "high", category: "Goals" },
        { title: diff > 10 ? "Gradual weight loss recommended" : diff < -5 ? "Consider nutrition support" : "Maintenance mode — great", description: diff > 10 ? `You are ${diff} kg above ideal. A 500 kcal daily deficit removes ~0.5 kg/week safely.` : diff < -5 ? `${Math.abs(diff)} kg below ideal. Focus on nutrient-dense foods and strength training.` : "Your weight is near ideal. Focus on body composition (muscle vs fat).", priority: Math.abs(diff) > 10 ? "high" : "low", category: "Nutrition" },
      ],
      riskFactors: cBmi >= 30 ? ["BMI ≥ 30 — clinical obesity. Consult a healthcare provider."] : cBmi < 18.5 ? ["BMI < 18.5 — underweight. Nutritional assessment recommended."] : [],
      detailedBreakdown: { "Height": `${height} cm`, "Gender": gender, "Current Weight": `${currentWeight} kg`, "Current BMI": cBmi, "Ideal Range": `${low}–${high} kg` },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="ideal-weight-calculator"
      title="Ideal Weight Calculator"
      description="4-formula comparison (Hamwi, Devine, Robinson, Miller) + BMI-based targets. See your gap from ideal."
      icon={Scale}
      calculate={calculate}
      onClear={() => { setHeight(170); setGender("male"); setCurrentWeight(75); setResult(null) }}
      values={[height, gender, currentWeight]}
      result={result}
      seoContent={<SeoContentGenerator title="Ideal Weight Calculator" description="Find your ideal body weight." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Height (cm)" val={height} set={setHeight} min={100} max={250} />
          <NumInput label="Current Weight (kg)" val={currentWeight} set={setCurrentWeight} min={20} max={300} />
        </div>
      }
    />
  )
}

// Macro Calculator
export function MacroCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [activity, setActivity] = useState("moderate")
  const [goal, setGoal] = useState("maintain")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bmr = mifflin(weight, height, age, gender)
    let calories = r0(bmr * ACT_MULT[activity])
    if (goal === "lose") calories -= 500
    if (goal === "gain") calories += 500
    if (goal === "aggressiveLose") calories -= 1000
    const proteinG = r0(weight * (goal === "gain" ? 2.2 : goal === "lose" ? 2.5 : 1.8))
    const fatG = r0((calories * 0.25) / 9)
    const carbG = r0(Math.max(0, (calories - proteinG * 4 - fatG * 9) / 4))
    const fiberG = r0(calories / 1000 * 14)
    const pCal = proteinG * 4; const cCal = carbG * 4; const fCal = fatG * 9
    setResult({
      primaryMetric: { label: "Daily Calories", value: calories, unit: "kcal", status: "normal", description: `Goal: ${goal}` },
      healthScore: 75,
      metrics: [
        { label: "Protein", value: proteinG, unit: "g/day", status: "good" },
        { label: "Carbohydrates", value: carbG, unit: "g/day", status: "normal" },
        { label: "Fat", value: fatG, unit: "g/day", status: "normal" },
        { label: "Dietary Fiber", value: fiberG, unit: "g/day", status: "normal" },
        { label: "Protein %", value: r0((pCal / calories) * 100), unit: "%", status: "normal" },
        { label: "Carb %", value: r0((cCal / calories) * 100), unit: "%", status: "normal" },
        { label: "Fat %", value: r0((fCal / calories) * 100), unit: "%", status: "normal" },
        { label: "Protein/meal (4 meals)", value: r0(proteinG / 4), unit: "g", status: "normal" },
        { label: "Protein/meal (5 meals)", value: r0(proteinG / 5), unit: "g", status: "normal" },
      ],
      recommendations: [
        { title: "Spread protein over 4-5 meals", description: `${proteinG}g protein/day → ${r0(proteinG / 4)}g per meal triggers muscle protein synthesis optimally (25-35g per sitting).`, priority: "high", category: "Nutrition" },
        { title: "Carb timing around training", description: "Eat more carbs on training days, fewer on rest days. This optimises glycogen without promoting fat gain.", priority: "medium", category: "Strategy" },
      ],
      riskFactors: calories < 1200 ? ["Calories below 1200 kcal — nutrient deficiency risk. Consult a dietitian."] : [],
      detailedBreakdown: { "Calories": calories, "Protein (g)": proteinG, "Carbs (g)": carbG, "Fat (g)": fatG, "Fiber (g)": fiberG, "Activity": ACT_LABEL[activity], "Goal": goal },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="macro-calculator"
      title="Macro Calculator"
      description="Precise protein, carbs, fat & fibre targets with calorie breakdown by percentage, meal timing and training tips."
      icon={Utensils}
      calculate={calculate}
      onClear={() => { setWeight(70); setHeight(170); setAge(30); setGender("male"); setActivity("moderate"); setGoal("maintain"); setResult(null) }}
      values={[weight, height, age, gender, activity, goal]}
      result={result}
      seoContent={<SeoContentGenerator title="Macro Calculator" description="Calculate daily macronutrients." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={30} max={250} />
          <NumInput label="Height (cm)" val={height} set={setHeight} min={100} max={250} />
          <NumInput label="Age (years)" val={age} set={setAge} min={5} max={100} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Level</label>
            <select value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              {Object.entries(ACT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              <option value="aggressiveLose">Aggressive Loss (-1000 kcal)</option>
              <option value="lose">Lose Weight (-500 kcal)</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Build Muscle (+500 kcal)</option>
            </select>
          </div>
        </div>
      }
    />
  )
}

// TDEE Calculator
export function TDEECalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [activity, setActivity] = useState("moderate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bmr = r0(mifflin(weight, height, age, gender))
    const tdee = r0(bmr * ACT_MULT[activity])
    setResult({
      primaryMetric: { label: "TDEE", value: tdee, unit: "kcal/day", status: "normal", description: `Activity: ${ACT_LABEL[activity]}` },
      healthScore: 75,
      metrics: [
        { label: "BMR", value: bmr, unit: "kcal", status: "normal" },
        { label: "Cut (-500 kcal)", value: tdee - 500, unit: "kcal", status: "warning" },
        { label: "Aggressive Cut (-1000)", value: tdee - 1000, unit: "kcal", status: "warning" },
        { label: "Maintenance", value: tdee, unit: "kcal", status: "good" },
        { label: "Lean Bulk (+250)", value: tdee + 250, unit: "kcal", status: "normal" },
        { label: "Bulk (+500)", value: tdee + 500, unit: "kcal", status: "normal" },
        ...Object.entries(ACT_MULT).map(([k, m]) => ({ label: ACT_LABEL[k], value: r0(bmr * m), unit: "kcal", status: "normal" as const })),
      ],
      recommendations: [
        { title: "Track calories for 2+ weeks", description: `Your TDEE is estimated at ${tdee} kcal. Your actual TDEE may differ by 10%. Adjust based on real weight trends.`, priority: "high", category: "Tracking" },
        { title: "NEAT adds 200-600 kcal/day", description: "Non-exercise activity (fidgeting, standing, walking) is often underestimated. Active jobs can add 600+ kcal to TDEE.", priority: "medium", category: "Science" },
      ],
      riskFactors: tdee - 1000 < 1200 ? ["Aggressive cut target < 1200 kcal — not recommended without medical supervision"] : [],
      detailedBreakdown: { "BMR": `${bmr} kcal`, "Activity multiplier": ACT_MULT[activity], "TDEE": `${tdee} kcal`, "Weight": `${weight} kg`, "Height": `${height} cm`, "Age": `${age} yr` },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="tdee-calculator"
      title="TDEE Calculator"
      description="Total Daily Energy Expenditure across all 5 activity levels with cut/bulk/maintenance targets and NEAT science."
      icon={Activity}
      calculate={calculate}
      onClear={() => { setWeight(70); setHeight(170); setAge(30); setGender("male"); setActivity("moderate"); setResult(null) }}
      values={[weight, height, age, gender, activity]}
      result={result}
      seoContent={<SeoContentGenerator title="TDEE Calculator" description="Calculate Total Daily Energy Expenditure." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={30} max={250} />
          <NumInput label="Height (cm)" val={height} set={setHeight} min={100} max={250} />
          <NumInput label="Age (years)" val={age} set={setAge} min={5} max={100} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Level</label>
            <select value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              {Object.entries(ACT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
      }
    />
  )
}

// Water Intake Calculator
export function WaterIntakeCalculator() {
  const [weight, setWeight] = useState(70)
  const [activity, setActivity] = useState("moderate")
  const [climate, setClimate] = useState("temperate")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    let base = weight * 35
    if (activity === "light") base += 400
    if (activity === "moderate") base += 800
    if (activity === "high") base += 1200
    if (activity === "extreme") base += 1600
    if (climate === "hot") base += 500
    if (climate === "cold") base -= 200
    base = Math.max(1500, r0(base))
    const liters = r1(base / 1000)
    setResult({
      primaryMetric: { label: "Daily Water Intake", value: base, unit: "ml/day", status: "good", description: `${liters} L • ${r0(base / 250)} glasses (250 ml)` },
      healthScore: 80,
      metrics: [
        { label: "In Litres", value: liters, unit: "L", status: "good" },
        { label: "Glasses (250 ml)", value: r0(base / 250), unit: "glasses", status: "normal" },
        { label: "Glasses (300 ml)", value: r0(base / 300), unit: "glasses", status: "normal" },
        { label: "Morning intake (25%)", value: r0(base * 0.25), unit: "ml", status: "normal" },
        { label: "Afternoon intake (35%)", value: r0(base * 0.35), unit: "ml", status: "normal" },
        { label: "Evening intake (25%)", value: r0(base * 0.25), unit: "ml", status: "normal" },
        { label: "Exercise extra (15%)", value: r0(base * 0.15), unit: "ml", status: "normal" },
        { label: "Minimum (at rest)", value: r0(weight * 30), unit: "ml", status: "normal" },
        { label: "Maximum (athlete)", value: r0(weight * 50), unit: "ml", status: "normal" },
      ],
      recommendations: [
        { title: "Drink before you feel thirsty", description: "Thirst is a late sign of dehydration — by that point you may already be 1-2% dehydrated, affecting performance.", priority: "high", category: "Hydration" },
        { title: "500 ml on waking", description: "Drinking 500 ml within 30 min of waking rehydrates after sleep and boosts metabolism.", priority: "medium", category: "Routine" },
        { title: "Pale yellow urine = ideal", description: "Dark yellow means drink more. Completely clear may mean overhydrating — pale straw is optimal.", priority: "low", category: "Monitoring" },
      ],
      riskFactors: [],
      detailedBreakdown: { "Weight": `${weight} kg`, "Activity": activity, "Climate": climate, "Daily target": `${base} ml`, "In litres": `${liters} L` },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="water-intake-calculator"
      title="Water Intake Calculator"
      description="Personalised hydration target adjusted for weight, activity and climate. Includes hourly schedule and timing guidance."
      icon={Droplets}
      calculate={calculate}
      onClear={() => { setWeight(70); setActivity("moderate"); setClimate("temperate"); setResult(null) }}
      values={[weight, activity, climate]}
      result={result}
      seoContent={<SeoContentGenerator title="Water Intake Calculator" description="Calculate daily water intake." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={20} max={300} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Level</label>
            <select value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="light">Light (walk 30 min/day)</option>
              <option value="moderate">Moderate (gym 3-4×/week)</option>
              <option value="high">High (daily exercise)</option>
              <option value="extreme">Extreme (endurance athlete)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Climate</label>
            <select value={climate} onChange={e => setClimate(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              <option value="cold">Cold</option>
              <option value="temperate">Temperate</option>
              <option value="hot">Hot / Humid</option>
            </select>
          </div>
        </div>
      }
    />
  )
}

// Lean Body Mass Calculator
export function LeanBodyMassCalculator() {
  const [weight, setWeight] = useState(70)
  const [height, setHeight] = useState(170)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const lbmBoer = r1(gender === "male" ? 0.407 * weight + 0.267 * height - 19.2 : 0.252 * weight + 0.473 * height - 48.3)
    const lbmJames = r1(gender === "male" ? 1.1 * weight - 128 * Math.pow(weight / height, 2) : 1.07 * weight - 148 * Math.pow(weight / height, 2))
    const lbmHume = r1(gender === "male" ? 0.3281 * weight + 0.3393 * height - 29.5336 : 0.2296 * weight + 0.4826 * height - 41.2089)
    const avgLbm = r1((lbmBoer + lbmJames + lbmHume) / 3)
    const fatMass = r1(weight - avgLbm)
    const bfPct = r1((fatMass / weight) * 100)
    const bmi = r1(weight / Math.pow(height / 100, 2))
    const ffmi = r1(avgLbm / Math.pow(height / 100, 2))
    setResult({
      primaryMetric: { label: "Lean Body Mass (avg)", value: avgLbm, unit: "kg", status: "good", description: `Fat mass: ${fatMass} kg | Body fat: ${bfPct}%` },
      healthScore: r0(Math.min(100, (avgLbm / weight) * 100 * 1.2)),
      metrics: [
        { label: "LBM — Boer", value: lbmBoer, unit: "kg", status: "normal" },
        { label: "LBM — James", value: lbmJames, unit: "kg", status: "normal" },
        { label: "LBM — Hume", value: lbmHume, unit: "kg", status: "normal" },
        { label: "Fat Mass", value: fatMass, unit: "kg", status: fatMass / weight > 0.3 ? "warning" : "good" },
        { label: "Body Fat %", value: bfPct, unit: "%", status: bfPct > 25 ? "warning" : "good" },
        { label: "FFMI", value: ffmi, status: ffmi > 25 ? "warning" : "normal" },
        { label: "BMI", value: bmi, status: bmi < 25 ? "good" : "warning" },
      ],
      recommendations: [
        { title: "Protect lean mass during a cut", description: `Your LBM is ${avgLbm} kg. Eat ≥${r0(avgLbm * 2.2)}g protein/day + resistance train to prevent muscle loss during deficit.`, priority: "high", category: "Nutrition" },
        { title: "FFMI as a natural potential guide", description: `Your FFMI is ${ffmi}. Drug-free lifters rarely exceed 25. Values 17-22 are typical for trained individuals.`, priority: "medium", category: "Performance" },
      ],
      riskFactors: bfPct > 30 ? ["Body fat > 30% — increased metabolic risk"] : [],
      detailedBreakdown: { "Weight": `${weight} kg`, "Height": `${height} cm`, "Gender": gender, "LBM (avg)": `${avgLbm} kg`, "Fat Mass": `${fatMass} kg`, "BF%": `${bfPct}%`, "FFMI": ffmi },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="lean-body-mass"
      title="Lean Body Mass Calculator"
      description="Triple-formula LBM (Boer, James, Hume) with FFMI, fat mass, body fat % and muscle preservation guidance."
      icon={Dumbbell}
      calculate={calculate}
      onClear={() => { setWeight(70); setHeight(170); setGender("male"); setResult(null) }}
      values={[weight, height, gender]}
      result={result}
      seoContent={<SeoContentGenerator title="Lean Body Mass Calculator" description="Calculate lean body mass." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={30} max={250} />
          <NumInput label="Height (cm)" val={height} set={setHeight} min={100} max={250} />
        </div>
      }
    />
  )
}

// Waist-Hip Ratio Calculator
export function WaistHipRatioCalculator() {
  const [waist, setWaist] = useState(80)
  const [hip, setHip] = useState(95)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const whr = waist / hip
    const ratio = r1(whr)
    let riskLabel: string; let status: "good" | "normal" | "warning" | "danger"
    if (gender === "male") {
      if (whr < 0.9) { riskLabel = "Low Risk"; status = "good" }
      else if (whr < 1.0) { riskLabel = "Moderate Risk"; status = "warning" }
      else { riskLabel = "High Risk"; status = "danger" }
    } else {
      if (whr < 0.8) { riskLabel = "Low Risk"; status = "good" }
      else if (whr < 0.85) { riskLabel = "Moderate Risk"; status = "warning" }
      else { riskLabel = "High Risk"; status = "danger" }
    }
    const idealWaist = r0(hip * (gender === "male" ? 0.85 : 0.75))
    setResult({
      primaryMetric: { label: "Waist-Hip Ratio", value: ratio, status, description: `Risk level: ${riskLabel}` },
      healthScore: status === "good" ? 85 : status === "warning" ? 55 : 30,
      metrics: [
        { label: "Risk Level", value: riskLabel, status },
        { label: "Waist", value: waist, unit: "cm", status: "normal" },
        { label: "Hip", value: hip, unit: "cm", status: "normal" },
        { label: "WHO threshold (male < 0.90)", value: "0.90", status: "normal" },
        { label: "WHO threshold (female < 0.85)", value: "0.85", status: "normal" },
        { label: "Ideal waist for your hip", value: idealWaist, unit: "cm", status: whr <= (gender === "male" ? 0.9 : 0.85) ? "good" : "warning" },
        { label: "Waist reduction needed", value: Math.max(0, r0(waist - idealWaist)), unit: "cm", status: waist > idealWaist ? "warning" : "good" },
      ],
      recommendations: [
        { title: riskLabel === "Low Risk" ? "Keep maintaining — great shape" : "Reduce central adiposity", description: riskLabel === "Low Risk" ? "Your WHR is in the healthy range. Regular exercise and balanced diet will keep it there." : `Target reducing waist by ${Math.max(0, r0(waist - idealWaist))} cm. 150 min/week moderate cardio + caloric deficit helps.`, priority: riskLabel === "High Risk" ? "high" : "medium", category: "Health" },
        { title: "Compound exercises reduce visceral fat", description: "Deadlifts, squats and planks reduce deep abdominal fat more effectively than isolated ab exercises.", priority: "medium", category: "Fitness" },
      ],
      riskFactors: riskLabel !== "Low Risk" ? ["Elevated WHR — increased cardiovascular disease and metabolic syndrome risk"] : [],
      detailedBreakdown: { "Waist": `${waist} cm`, "Hip": `${hip} cm`, "Gender": gender, "WHR": ratio, "Risk": riskLabel, "WHO limit": gender === "male" ? "0.90" : "0.85" },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="waist-hip-ratio"
      title="Waist-Hip Ratio Calculator"
      description="WHO-standard cardiovascular risk assessment with ideal waist target, gender-specific thresholds and reduction plan."
      icon={Ruler}
      calculate={calculate}
      onClear={() => { setWaist(80); setHip(95); setGender("male"); setResult(null) }}
      values={[waist, hip, gender]}
      result={result}
      seoContent={<SeoContentGenerator title="Waist-Hip Ratio Calculator" description="Calculate waist-hip ratio." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2"><label className="text-sm font-medium">Gender</label><GenderToggle value={gender} onChange={setGender} /></div>
          <NumInput label="Waist (cm)" val={waist} set={setWaist} min={40} max={200} />
          <NumInput label="Hip (cm)" val={hip} set={setHip} min={50} max={200} />
        </div>
      }
    />
  )
}

// Protein Calculator
export function ProteinCalculator() {
  const [weight, setWeight] = useState(70)
  const [age, setAge] = useState(30)
  const [activity, setActivity] = useState("moderate")
  const [goal, setGoal] = useState("maintain")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const basePerKg: Record<string, number> = { sedentary: 0.8, light: 1.2, moderate: 1.6, high: 2.0, extreme: 2.4 }
    let perKg = basePerKg[activity] ?? 1.6
    if (goal === "lose") perKg += 0.3
    if (goal === "gain") perKg += 0.2
    if (age >= 60) perKg += 0.1
    const totalG = r0(weight * perKg)
    const postworkout = r0(totalG * 0.25)
    setResult({
      primaryMetric: { label: "Daily Protein Target", value: totalG, unit: "g/day", status: "good", description: `${perKg} g per kg body weight` },
      healthScore: 80,
      metrics: [
        { label: "Rate (g/kg)", value: perKg, unit: "g/kg", status: "normal" },
        { label: "Protein calories", value: totalG * 4, unit: "kcal", status: "normal" },
        { label: "Per meal (4 meals)", value: r0(totalG / 4), unit: "g", status: "normal" },
        { label: "Per meal (5 meals)", value: r0(totalG / 5), unit: "g", status: "normal" },
        { label: "Pre-workout (15%)", value: r0(totalG * 0.15), unit: "g", status: "normal" },
        { label: "Post-workout (25%)", value: postworkout, unit: "g", status: "good" },
        { label: "RDA minimum", value: r0(weight * 0.8), unit: "g/day", status: "normal" },
      ],
      recommendations: [
        { title: "Leucine threshold per meal", description: `Each meal needs ~2.5-3g leucine to trigger muscle synthesis. Aim for ${r0(totalG / 4)}g complete protein per meal.`, priority: "high", category: "Nutrition" },
        { title: "Post-workout window", description: `Consume ${postworkout}g protein within 30-45 min after training. Casein before sleep aids overnight recovery.`, priority: "medium", category: "Timing" },
      ],
      riskFactors: totalG > weight * 3 ? ["Very high protein intake — ensure adequate hydration"] : [],
      detailedBreakdown: { "Weight": `${weight} kg`, "Age": `${age} yr`, "Activity": activity, "Goal": goal, "Rate": `${perKg} g/kg`, "Total": `${totalG} g` },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="protein-calculator"
      title="Protein Calculator"
      description="Science-based protein target with meal distribution, leucine threshold, pre/post-workout timing and age adjustments."
      icon={Dumbbell}
      calculate={calculate}
      onClear={() => { setWeight(70); setAge(30); setActivity("moderate"); setGoal("maintain"); setResult(null) }}
      values={[weight, age, activity, goal]}
      result={result}
      seoContent={<SeoContentGenerator title="Protein Calculator" description="Calculate daily protein intake." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <NumInput label="Weight (kg)" val={weight} set={setWeight} min={20} max={300} />
          <NumInput label="Age (years)" val={age} set={setAge} min={10} max={100} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity Level</label>
            <select value={activity} onChange={e => setActivity(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              <option value="sedentary">Sedentary</option>
              <option value="light">Light (1-3×/week)</option>
              <option value="moderate">Moderate (3-5×/week)</option>
              <option value="high">High (6-7×/week)</option>
              <option value="extreme">Extreme (athlete)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              <option value="lose">Lose Fat</option>
              <option value="maintain">Maintain</option>
              <option value="gain">Build Muscle</option>
            </select>
          </div>
        </div>
      }
    />
  )
}

// Calories Burned Calculator
export function CaloriesBurnedCalculator() {
  const [weight, setWeight] = useState(70)
  const [duration, setDuration] = useState(30)
  const [activityKey, setActivityKey] = useState("jogging")
  const [result, setResult] = useState<HealthResult | null>(null)

  const ACTS: Record<string, { met: number; label: string }> = {
    walking_slow: { met: 2.5, label: "Walking — slow (3 km/h)" },
    walking_brisk: { met: 3.8, label: "Walking — brisk (5 km/h)" },
    jogging: { met: 7.0, label: "Jogging (8 km/h)" },
    running: { met: 9.8, label: "Running (10 km/h)" },
    running_fast: { met: 12.5, label: "Running fast (12+ km/h)" },
    cycling_easy: { met: 5.0, label: "Cycling — easy (< 16 km/h)" },
    cycling_moderate: { met: 7.5, label: "Cycling — moderate (20 km/h)" },
    cycling_hard: { met: 10.0, label: "Cycling — hard (> 25 km/h)" },
    swimming: { met: 7.0, label: "Swimming (moderate)" },
    hiit: { met: 10.3, label: "HIIT / Circuit Training" },
    strength: { met: 5.0, label: "Weight Training" },
    yoga: { met: 2.5, label: "Yoga / Stretching" },
    basketball: { met: 6.5, label: "Basketball" },
    football: { met: 7.0, label: "Football / Soccer" },
    tennis: { met: 7.3, label: "Tennis" },
    jump_rope: { met: 11.0, label: "Jump Rope / Skipping" },
    rowing: { met: 7.0, label: "Rowing Machine" },
    elliptical: { met: 5.0, label: "Elliptical Trainer" },
    dancing: { met: 5.5, label: "Dancing" },
    climbing: { met: 8.0, label: "Rock Climbing" },
  }

  const calculate = () => {
    const { met, label } = ACTS[activityKey]
    const calories = r0(met * weight * (duration / 60))
    const fatG = r1(calories / 9)
    const epoc = r0(calories * 0.12)
    setResult({
      primaryMetric: { label: "Calories Burned", value: calories, unit: "kcal", status: "good", description: `${label} · ${duration} min` },
      healthScore: Math.min(100, r0(calories / 5)),
      metrics: [
        { label: "Activity", value: label, status: "normal" },
        { label: "MET value", value: met, status: "normal" },
        { label: "Cal/min rate", value: r1(met * weight / 60), unit: "kcal/min", status: "normal" },
        { label: "Fat burned", value: fatG, unit: "g", status: "good" },
        { label: "EPOC afterburn (~12%)", value: epoc, unit: "kcal", status: "normal" },
        { label: "Total with EPOC", value: calories + epoc, unit: "kcal", status: "good" },
        { label: "60-min rate", value: r0(met * weight), unit: "kcal/h", status: "normal" },
        { label: "% of 2000 kcal daily", value: r0((calories / 2000) * 100), unit: "%", status: "normal" },
      ],
      recommendations: [
        { title: "WHO guidelines: 150-300 min/week", description: `${duration} min burns ${calories} kcal. Aim for 150 min/week moderate or 75 min/week vigorous activity minimum.`, priority: "high", category: "Exercise" },
        { title: "Combine cardio + strength training", description: "Cardio burns calories now; muscle burns calories 24/7. Both together maximise fat loss and long-term metabolism.", priority: "medium", category: "Strategy" },
      ],
      riskFactors: [],
      detailedBreakdown: { "Activity": label, "MET": met, "Duration": `${duration} min`, "Weight": `${weight} kg`, "Calories": `${calories} kcal`, "Fat burned": `${fatG} g`, "EPOC": `${epoc} kcal` },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="calories-burned"
      title="Calories Burned Calculator"
      description="MET-based calorie burn for 20+ activities including EPOC afterburn, fat oxidation rate and weekly exercise targets."
      icon={Activity}
      calculate={calculate}
      onClear={() => { setWeight(70); setDuration(30); setActivityKey("jogging"); setResult(null) }}
      values={[weight, duration, activityKey]}
      result={result}
      seoContent={<SeoContentGenerator title="Calories Burned Calculator" description="Calculate calories burned during exercise." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <NumInput label="Body Weight (kg)" val={weight} set={setWeight} min={20} max={300} />
          <NumInput label="Duration (minutes)" val={duration} set={setDuration} min={1} max={360} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activity</label>
            <select value={activityKey} onChange={e => setActivityKey(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors">
              {Object.entries(ACTS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
        </div>
      }
    />
  )
}

// Target Heart Rate Zones
export function TargetHeartRateCalculator() {
  const [age, setAge] = useState(30)
  const [resting, setResting] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const maxHR = 220 - age
    const hrr = maxHR - resting
    const z = (lo: number, hi: number) => `${r0(resting + hrr * lo)}–${r0(resting + hrr * hi)} bpm`
    const vo2max = r1(15 * (maxHR / resting))
    const fitnessLabel = vo2max < 30 ? "Below average" : vo2max < 40 ? "Fair" : vo2max < 50 ? "Good" : "Excellent"
    setResult({
      primaryMetric: { label: "Max Heart Rate", value: maxHR, unit: "bpm", status: "normal", description: `HRR: ${hrr} bpm · VO₂max est: ${vo2max} mL/kg/min (${fitnessLabel})` },
      healthScore: Math.min(100, r0(vo2max * 1.4)),
      metrics: [
        { label: "Zone 1 — Recovery (50-60%)", value: z(0.5, 0.6), status: "good" },
        { label: "Zone 2 — Fat Burn (60-70%)", value: z(0.6, 0.7), status: "good" },
        { label: "Zone 3 — Cardio (70-80%)", value: z(0.7, 0.8), status: "normal" },
        { label: "Zone 4 — Threshold (80-90%)", value: z(0.8, 0.9), status: "warning" },
        { label: "Zone 5 — Max / VO₂max (90-100%)", value: z(0.9, 1.0), status: "danger" },
        { label: "Estimated VO₂max", value: vo2max, unit: "mL/kg/min", status: vo2max >= 40 ? "good" : "normal" },
        { label: "Fitness Level", value: fitnessLabel, status: vo2max >= 40 ? "good" : "normal" },
      ],
      recommendations: [
        { title: "Zone 2 builds aerobic base", description: `Spend 70-80% of training in Zone 2 (${z(0.6, 0.7)}). This burns fat efficiently and builds mitochondrial density.`, priority: "high", category: "Cardio" },
        { title: "Zone 4-5 for performance gains", description: `2× per week, train at Zone 4-5 (${z(0.8, 1.0)}) for VO₂max and lactate threshold improvement.`, priority: "medium", category: "Performance" },
      ],
      riskFactors: resting > 90 ? ["High resting HR (>90) — may indicate poor cardiovascular fitness or overtraining"] : [],
      detailedBreakdown: { "Age": `${age} yr`, "Resting HR": `${resting} bpm`, "Max HR": `${maxHR} bpm`, "HRR": `${hrr} bpm`, "VO₂max est": `${vo2max} mL/kg/min`, "Fitness": fitnessLabel },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="target-heart-rate"
      title="Target Heart Rate Calculator"
      description="5-zone Karvonen heart rate zones with VO₂max estimate, fitness classification and training distribution guide."
      icon={Heart}
      calculate={calculate}
      onClear={() => { setAge(30); setResting(70); setResult(null) }}
      values={[age, resting]}
      result={result}
      seoContent={<SeoContentGenerator title="Target Heart Rate Calculator" description="Calculate target heart rate zones." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <NumInput label="Age (years)" val={age} set={setAge} min={10} max={90} />
          <NumInput label="Resting Heart Rate (bpm)" val={resting} set={setResting} min={30} max={120} />
        </div>
      }
    />
  )
}

// Sleep Calculator
export function SleepCalculator() {
  const [wakeTime, setWakeTime] = useState("07:00")
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const formatTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })

  const calculate = () => {
    const [h, m] = wakeTime.split(":").map(Number)
    const wake = new Date(); wake.setHours(h, m, 0, 0)
    const recHours = age < 6 ? 14 : age < 14 ? 10 : age < 18 ? 9 : age < 65 ? 8 : 7.5
    const minHours = age < 6 ? 10 : age < 14 ? 9 : age < 18 ? 8 : age < 65 ? 7 : 7

    // Generate 4-6 cycle options (6h=4 cycles, 7.5h=5, 9h=6)
    const cycleSuggestions = [4, 5, 6].map(n => {
      const totalMins = n * 90 + 15 // +15 min fall asleep buffer
      const bedtime = new Date(wake.getTime() - totalMins * 60000)
      return { cycles: n, hours: r1(n * 1.5), time: formatTime(bedtime) }
    })

    const deepTarget = r1(recHours * 0.20)
    const remTarget = r1(recHours * 0.25)
    setResult({
      primaryMetric: { label: "Recommended Sleep", value: recHours, unit: "hours", status: "good", description: `Age ${age}: ${minHours}h min · ${recHours}h ideal` },
      healthScore: 80,
      metrics: [
        { label: "Optimal bedtime (5 cycles)", value: cycleSuggestions[1].time, status: "good" },
        { label: "Bedtime — 4 cycles (6h)", value: cycleSuggestions[0].time, status: "normal" },
        { label: "Bedtime — 6 cycles (9h)", value: cycleSuggestions[2].time, status: "normal" },
        { label: "Deep sleep target (20%)", value: deepTarget, unit: "h", status: "normal" },
        { label: "REM sleep target (25%)", value: remTarget, unit: "h", status: "normal" },
        { label: "Minimum for age", value: minHours, unit: "h", status: "normal" },
        { label: "Fall-asleep buffer", value: 15, unit: "min", status: "normal" },
      ],
      recommendations: [
        { title: "Maintain consistent sleep/wake times", description: "Going to bed and waking up at the same time 7 days/week sets your circadian rhythm and improves sleep quality.", priority: "high", category: "Sleep Hygiene" },
        { title: "Optimize your sleep environment", description: "Dark room (< 1 lux), cool temperature (18-20 °C), and silence or white noise increase deep sleep % significantly.", priority: "medium", category: "Environment" },
      ],
      riskFactors: [],
      detailedBreakdown: { "Wake time": wakeTime, "Age": `${age}`, "Recommended sleep": `${recHours} h`, "Deep sleep": `${deepTarget} h`, "REM": `${remTarget} h`, "Optimal bedtime": cycleSuggestions[1].time },
    })
  }

  return (
    <ComprehensiveHealthTemplate
      toolId="sleep-calculator"
      title="Sleep Calculator"
      description="Age-aware optimal sleep duration with 90-min cycle bedtime suggestions, REM/deep sleep targets and sleep hygiene tips."
      icon={Moon}
      calculate={calculate}
      onClear={() => { setWakeTime("07:00"); setAge(30); setResult(null) }}
      values={[wakeTime, age]}
      result={result}
      seoContent={<SeoContentGenerator title="Sleep Calculator" description="Calculate optimal bedtime and sleep duration." categoryName="Health" />}
      inputs={
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Wake-up Time</label>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="w-full p-3 rounded-xl bg-background border border-input hover:border-primary/50 transition-colors" />
          </div>
          <NumInput label="Age (years)" val={age} set={setAge} min={1} max={100} />
        </div>
      }
    />
  )
}
