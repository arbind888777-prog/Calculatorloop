"use client"

import { useState } from "react"
import { Ruler, Activity, BarChart3, Heart, AlertTriangle, TrendingUp, Shield, User, Scale } from "lucide-react"
import { ComprehensiveHealthTemplate, HealthResult } from "@/components/calculators/templates/ComprehensiveHealthTemplate"
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }
function r1(n: number) { return Math.round(n * 10) / 10 }
function r2(n: number) { return Math.round(n * 100) / 100 }

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  step?: number
  suffix?: string
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">
        {label}
        {suffix && <span className="ml-1 text-muted-foreground">({suffix})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step ?? 0.1}
        className="w-full rounded-xl border border-input bg-background p-3 transition-colors hover:border-primary/50"
      />
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

function GenericCircumferenceCalculator({
  toolName,
  inputLabel,
  healthyMin,
  healthyMax,
  unit = "cm",
  description,
}: {
  toolName: string
  inputLabel: string
  healthyMin: number
  healthyMax: number
  unit?: string
  description: string
}) {
  const [measure, setMeasure] = useState(healthyMin + (healthyMax - healthyMin) / 2)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const m = clamp(measure, 1, 400)
    const inRange = m >= healthyMin && m <= healthyMax
    const deviation = m < healthyMin ? healthyMin - m : m > healthyMax ? m - healthyMax : 0

    let status: 'normal' | 'warning' | 'danger' | 'good' = 'good'
    let band = "Healthy Range"
    if (!inRange) {
      status = deviation > (healthyMax - healthyMin) * 0.35 ? 'danger' : 'warning'
      band = m < healthyMin ? "Below Expected" : "Above Expected"
    }

    const score = Math.max(0, Math.min(100, Math.round(100 - (deviation / Math.max(1, healthyMax - healthyMin)) * 120)))

    setResult({
      primaryMetric: {
        label: inputLabel,
        value: r1(m),
        unit,
        status,
        description: `${band}. Reference range: ${healthyMin}-${healthyMax} ${unit}`,
        icon: Ruler,
      },
      healthScore: score,
      metrics: [
        { label: "Entered Value", value: r1(m), unit, status, icon: Ruler },
        { label: "Range Min", value: healthyMin, unit, status: 'normal', icon: Activity },
        { label: "Range Max", value: healthyMax, unit, status: 'normal', icon: Activity },
        { label: "Deviation", value: r1(deviation), unit, status: deviation === 0 ? 'good' : status, icon: BarChart3 },
      ],
      recommendations: [
        {
          title: "How to Use This Measurement",
          description,
          priority: 'medium',
          category: "Measurement",
        },
        {
          title: "Consistency Tips",
          description: "Measure at the same time of day, same posture, and same tape tension to reduce tracking noise.",
          priority: 'low',
          category: "Tracking",
        },
      ],
      detailedBreakdown: {
        "Tool": toolName,
        "Current Value": `${r1(m)} ${unit}`,
        "Reference Range": `${healthyMin}-${healthyMax} ${unit}`,
        "Status": band,
      },
    })
  }

  const inputs = (
    <div className="space-y-4">
      <NumInput label={inputLabel} value={measure} onChange={setMeasure} min={1} max={400} step={0.1} suffix={unit} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title={toolName}
      description={description}
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title={toolName} description={description} categoryName="Body Measurements" />}
    />
  )
}

function AdvancedBodyCompositionCalculator() {
  const [waist, setWaist] = useState(82)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(70)
  const [hip, setHip] = useState(95)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(waist, 30, 250)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 25, 350)
    const hp = clamp(hip, 30, 250)

    const bmi = wt / Math.pow(h / 100, 2)
    const whtr = w / h
    const whr = w / hp
    const bai = (hp / Math.pow(h / 100, 1.5)) - 18
    const bri = 364.2 - 365.5 * Math.sqrt(1 - Math.pow((w / (2 * Math.PI)) / (0.5 * h), 2))

    const centralRisk = whtr > 0.6 || whr > 0.95 || bmi > 30
    const status: 'normal' | 'warning' | 'danger' | 'good' = centralRisk ? 'warning' : 'good'

    setResult({
      primaryMetric: {
        label: "Central Risk Flag",
        value: centralRisk ? "Elevated" : "Low",
        status,
        description: `WHtR ${r2(whtr)}, WHR ${r2(whr)}, BMI ${r1(bmi)}`,
        icon: Activity,
      },
      healthScore: Math.max(0, Math.min(100, Math.round(100 - ((Math.max(0, bmi - 22) * 2) + (Math.max(0, whtr - 0.5) * 120))))),
      metrics: [
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: bmi >= 18.5 && bmi <= 24.9 ? 'good' : 'warning', icon: BarChart3 },
        { label: "Waist/Height", value: r2(whtr), status: whtr <= 0.5 ? 'good' : whtr <= 0.6 ? 'warning' : 'danger', icon: Ruler },
        { label: "Waist/Hip", value: r2(whr), status: whr < 0.9 ? 'good' : whr < 1.0 ? 'warning' : 'danger', icon: Ruler },
        { label: "BAI", value: r1(bai), unit: "%", status: bai >= 10 && bai <= 30 ? 'good' : 'warning', icon: Activity },
        { label: "BRI", value: r1(bri), status: bri < 6 ? 'good' : bri < 8 ? 'warning' : 'danger', icon: Activity },
      ],
      recommendations: [
        {
          title: "Improve Central Metrics",
          description: "If WHtR > 0.5, target waist reduction with calorie control, strength training, and daily walking.",
          priority: centralRisk ? 'high' : 'low',
          category: "Risk Reduction",
        },
        {
          title: "Track Monthly",
          description: "Use waist and hip trends every 2-4 weeks for meaningful body composition change insights.",
          priority: 'medium',
          category: "Tracking",
        },
      ],
      detailedBreakdown: {
        "Waist": `${r1(w)} cm`,
        "Hip": `${r1(hp)} cm`,
        "Height": `${r1(h)} cm`,
        "Weight": `${r1(wt)} kg`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Waist Circumference" value={waist} onChange={setWaist} min={30} max={250} suffix="cm" />
      <NumInput label="Hip Circumference" value={hip} onChange={setHip} min={30} max={250} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Advanced Body Composition Calculator"
      description="Compute multiple composition and central obesity indicators in one place."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Body Measurements"
      seoContent={
        <SeoContentGenerator
          title="Advanced Body Composition Calculator"
          description="Compute multiple composition and central obesity indicators in one place."
          categoryName="Body Measurements"
        />
      }
    />
  )
}

export function WaistCircumferenceCalculator() {
  return (
    <GenericCircumferenceCalculator
      toolName="Waist Circumference Calculator"
      inputLabel="Waist Circumference"
      healthyMin={70}
      healthyMax={102}
      description="Track waist size as a key marker of abdominal fat and cardiometabolic risk."
    />
  )
}

export function NeckCircumferenceCalculator() {
  return (
    <GenericCircumferenceCalculator
      toolName="Neck Circumference Calculator"
      inputLabel="Neck Circumference"
      healthyMin={30}
      healthyMax={43}
      description="Measure neck circumference as an additional anthropometric obesity screening marker."
    />
  )
}

export function HipCircumferenceCalculator() {
  return (
    <GenericCircumferenceCalculator
      toolName="Hip Circumference Calculator"
      inputLabel="Hip Circumference"
      healthyMin={85}
      healthyMax={115}
      description="Use hip circumference for body-fat distribution and waist-to-hip analysis."
    />
  )
}

export function BodyAdiposityIndexCalculator() {
  const [hip, setHip] = useState(98)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [gender, setGender] = useState("male")
  const [age, setAge] = useState(30)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const hp = clamp(hip, 50, 200)
    const h = clamp(height, 120, 230) / 100
    const wt = clamp(weight, 25, 350)
    const a = clamp(age, 10, 100)

    const bai = (hp / Math.pow(h, 1.5)) - 18
    const bmi = wt / (h * h)

    const isMale = gender === "male"
    let baiCat: string
    let baiStatus: 'good' | 'warning' | 'danger'
    if (isMale) {
      if (bai < 8) { baiCat = "Underfat"; baiStatus = 'warning' }
      else if (bai < 21) { baiCat = "Normal"; baiStatus = 'good' }
      else if (bai < 26) { baiCat = "Overweight"; baiStatus = 'warning' }
      else { baiCat = "Obese"; baiStatus = 'danger' }
    } else {
      if (bai < 21) { baiCat = "Underfat"; baiStatus = 'warning' }
      else if (bai < 33) { baiCat = "Normal"; baiStatus = 'good' }
      else if (bai < 39) { baiCat = "Overweight"; baiStatus = 'warning' }
      else { baiCat = "Obese"; baiStatus = 'danger' }
    }

    const bmiCat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"
    const diff = Math.abs(bai - bmi)
    const mismatch = diff > 8
    const ageFactor = a > 50 ? " (Age >50: BAI may slightly overestimate)" : ""

    const score = baiStatus === 'good' ? 85 : baiStatus === 'warning' ? 55 : 25

    setResult({
      primaryMetric: { label: "Body Adiposity Index", value: r1(bai), unit: "%", status: baiStatus, description: `${baiCat} adiposity${ageFactor}`, icon: Activity },
      healthScore: score,
      metrics: [
        { label: "BAI %", value: r1(bai), unit: "%", status: baiStatus, icon: Activity },
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: bmi >= 18.5 && bmi < 25 ? 'good' : 'warning', icon: BarChart3 },
        { label: "BAI vs BMI Difference", value: r1(diff), status: mismatch ? 'danger' : 'good', icon: AlertTriangle },
        { label: "Category", value: baiCat, status: baiStatus, icon: User },
        { label: "Cardiometabolic Risk", value: baiStatus === 'danger' ? "Elevated" : baiStatus === 'warning' ? "Moderate" : "Low", status: baiStatus, icon: Heart },
      ],
      recommendations: [
        ...(mismatch ? [{ title: "⚠️ BAI-BMI Mismatch Detected", description: `Your BAI (${r1(bai)}%) and BMI (${r1(bmi)}) differ by ${r1(diff)} units. This can happen with unusual hip-height proportions. Consult a professional for accurate body fat testing.`, priority: 'high' as const, category: "Alert" }] : []),
        { title: "BAI Interpretation", description: `BAI estimates body fat without weight, using hip circumference and height. Your result: ${baiCat}. BAI is useful in low-resource settings where scales aren't available.`, priority: 'medium', category: "Understanding" },
        { title: "BMI vs BAI Comparison", description: `BMI: ${r1(bmi)} (${bmiCat}) | BAI: ${r1(bai)}% (${baiCat}). Differences arise from body shape — people with wider hips relative to height may show higher BAI.`, priority: 'medium', category: "Analysis" },
        { title: "Ethnicity Note", description: "BAI accuracy varies by ethnicity. Originally validated in Mexican-American and African-American populations. Adjust with DEXA scan for precision.", priority: 'low', category: "Context" },
        { title: "Fat Distribution", description: `Higher hip circumference suggests peripheral fat storage (pear shape). BAI captures hip-dominant fat pattern better than BMI.`, priority: 'low', category: "Body Shape" },
      ],
      detailedBreakdown: {
        "Hip Circumference": `${r1(hp)} cm`,
        "Height": `${r1(h * 100)} cm`,
        "Weight": `${r1(wt)} kg`,
        "BAI Formula": "hip / height^1.5 - 18",
        "BAI %": `${r1(bai)}%`,
        "BMI": `${r1(bmi)} kg/m²`,
        "Adiposity Category": baiCat,
        "Gender": isMale ? "Male" : "Female",
        "Mismatch": mismatch ? "Yes — consult professional" : "No — BAI and BMI are concordant",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Hip Circumference" value={hip} onChange={setHip} min={50} max={200} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight (for BMI comparison)" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
      <NumInput label="Age" value={age} onChange={setAge} min={10} max={100} suffix="years" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Body Adiposity Index (BAI) Calculator"
      description="Estimate body fat percentage without a scale using hip circumference and height. Includes BMI cross-check and cardiometabolic risk."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Body Adiposity Index (BAI) Calculator" description="Estimate body fat percentage without a scale using hip circumference and height." categoryName="Body Measurements" />}
    />
  )
}

export function PonderalIndexCalculator() {
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(70)
  const [age, setAge] = useState(25)
  const [isChild, setIsChild] = useState("no")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 40, 230) / 100
    const w = clamp(weight, 2, 350)
    const a = clamp(age, 0, 100)

    const pi = w / Math.pow(h, 3)
    const bmi = w / (h * h)
    const childMode = isChild === "yes" || a < 3

    let piCat: string; let piStatus: 'good' | 'warning' | 'danger'
    if (childMode) {
      if (pi < 20) { piCat = "Low — SGA risk"; piStatus = 'warning' }
      else if (pi <= 28) { piCat = "Normal (Neonatal)"; piStatus = 'good' }
      else { piCat = "High — LGA risk"; piStatus = 'warning' }
    } else {
      if (pi < 11) { piCat = "Low proportionality"; piStatus = 'warning' }
      else if (pi <= 15) { piCat = "Normal proportionality"; piStatus = 'good' }
      else { piCat = "Heavy proportionality"; piStatus = 'warning' }
    }

    const tallCorrection = h > 1.9 ? " (Tall-person: PI more reliable than BMI for you)" : ""
    const bmiCat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"
    const abnormality = (!childMode && (pi < 9 || pi > 18)) || (childMode && (pi < 18 || pi > 32))

    setResult({
      primaryMetric: { label: "Ponderal Index", value: r2(pi), unit: "kg/m³", status: piStatus, description: `${piCat}${tallCorrection}`, icon: Scale },
      healthScore: piStatus === 'good' ? 82 : piStatus === 'warning' ? 50 : 25,
      metrics: [
        { label: "PI", value: r2(pi), unit: "kg/m³", status: piStatus, icon: Scale },
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: bmi >= 18.5 && bmi < 25 ? 'good' : 'warning', icon: BarChart3 },
        { label: "Category", value: piCat, status: piStatus, icon: User },
        { label: "Height-Dominant", value: h > 1.85 ? "Yes" : "No", status: 'normal', icon: Ruler },
        ...(abnormality ? [{ label: "⚠️ Growth Alert", value: "Abnormal range detected", status: 'danger' as const, icon: AlertTriangle }] : []),
      ],
      recommendations: [
        { title: "PI vs BMI", description: `PI (${r2(pi)}) corrects BMI (${r1(bmi)}, ${bmiCat}) distortion for extreme heights. For people >190cm, PI is more proportionally accurate.`, priority: 'medium', category: "Comparison" },
        ...(childMode ? [{ title: "Neonatal Percentile", description: `PI ${r2(pi)} kg/m³. Normal neonatal range: 20–28 kg/m³. Low PI suggests small-for-gestational-age (SGA); high PI suggests large-for-gestational-age (LGA).`, priority: 'high' as const, category: "Pediatric" }] : []),
        ...(abnormality ? [{ title: "Growth Abnormality Alert", description: "PI is outside normal reference ranges. Consider pediatric or endocrine evaluation for disproportionate body mass.", priority: 'high' as const, category: "Clinical" }] : []),
        { title: "Interpretation", description: `Ponderal Index = weight/height³. Unlike BMI (weight/height²), PI penalizes height less, making it ideal for tall individuals and neonates.`, priority: 'low', category: "Reference" },
      ],
      detailedBreakdown: {
        "Height": `${r1(h * 100)} cm`,
        "Weight": `${r1(w)} kg`,
        "Ponderal Index": `${r2(pi)} kg/m³`,
        "BMI": `${r1(bmi)} kg/m²`,
        "Mode": childMode ? "Neonatal/Child" : "Adult",
        "Category": piCat,
        "Formula": "weight / height³",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Height" value={height} onChange={setHeight} min={40} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={2} max={350} suffix="kg" />
      <NumInput label="Age" value={age} onChange={setAge} min={0} max={100} suffix="years" />
      <SelectInput label="Child/Neonatal Mode" value={isChild} onChange={setIsChild} options={[{ value: "no", label: "Adult" }, { value: "yes", label: "Child/Neonatal" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Ponderal Index Calculator"
      description="Evaluate height-dominant body proportionality. Corrects BMI distortion for extreme heights. Includes neonatal percentile mapping."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Ponderal Index Calculator" description="Evaluate height-dominant body proportionality with BMI correction." categoryName="Body Measurements" />}
    />
  )
}

// ─── #13 ABSI (A Body Shape Index) ──────────────────────────────────────
export function ABSICalculator() {
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [waist, setWaist] = useState(84)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 120, 230) / 100
    const wt = clamp(weight, 25, 350)
    const w = clamp(waist, 30, 200) / 100
    const a = clamp(age, 18, 100)

    const bmi = wt / (h * h)
    const absi = w / (Math.pow(bmi, 2 / 3) * Math.pow(h, 0.5))

    const meanAbsi = gender === "male" ? 0.0815 : 0.0787
    const sdAbsi = 0.005
    const z = (absi - meanAbsi) / sdAbsi

    let riskBand: string; let riskStatus: 'good' | 'warning' | 'danger'
    if (z < -0.5) { riskBand = "Very Low"; riskStatus = 'good' }
    else if (z < 0.5) { riskBand = "Below Average"; riskStatus = 'good' }
    else if (z < 1.0) { riskBand = "Average"; riskStatus = 'warning' }
    else if (z < 1.5) { riskBand = "Above Average"; riskStatus = 'warning' }
    else { riskBand = "High"; riskStatus = 'danger' }

    const relativeRisk = Math.max(0.5, Math.min(3.5, 1 + z * 0.35))
    const ageAdjustedNote = a > 60 ? " (Age >60: elevated baseline risk)" : ""

    setResult({
      primaryMetric: { label: "ABSI Score", value: r2(absi * 1000), unit: "×10⁻³", status: riskStatus, description: `${riskBand} mortality risk${ageAdjustedNote}`, icon: Heart },
      healthScore: riskStatus === 'good' ? 85 : riskStatus === 'warning' ? 50 : 20,
      metrics: [
        { label: "ABSI", value: r2(absi * 1000), unit: "×10⁻³", status: riskStatus, icon: Activity },
        { label: "Z-Score", value: r2(z), status: z < 1 ? 'good' : z < 1.5 ? 'warning' : 'danger', icon: BarChart3 },
        { label: "Relative Risk", value: `${r2(relativeRisk)}×`, status: relativeRisk < 1.3 ? 'good' : relativeRisk < 1.7 ? 'warning' : 'danger', icon: AlertTriangle },
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: bmi < 25 ? 'good' : 'warning', icon: Scale },
        { label: "Mortality Band", value: riskBand, status: riskStatus, icon: Shield },
      ],
      recommendations: [
        { title: "ABSI Interpretation", description: `ABSI measures waist-adjusted mortality risk independent of BMI. Your Z-score ${r2(z)} places you in the "${riskBand}" band. Higher ABSI → higher premature death risk.`, priority: riskStatus === 'danger' ? 'high' : 'medium', category: "Risk" },
        { title: "Hazard Ratio", description: `Estimated relative risk: ${r2(relativeRisk)}× vs average population. A 1.0 = average, >1.5 = significantly elevated.`, priority: 'medium', category: "Analysis" },
        { title: "BMI + ABSI Combined", description: `BMI ${r1(bmi)} with ABSI Z ${r2(z)}. Even normal-BMI individuals can have high ABSI (thin-outside, fat-inside pattern).`, priority: 'medium', category: "Combined Risk" },
        { title: "Cardiovascular Overlay", description: "High ABSI correlates with central adiposity → increased cardiovascular, Type 2 diabetes, and stroke risk. Target waist reduction.", priority: riskStatus === 'danger' ? 'high' : 'low', category: "Heart Health" },
        { title: "Waist Reduction Impact", description: "Every 2.5cm waist reduction can lower ABSI by ~0.002, improving your mortality risk band. Focus on core training + caloric deficit.", priority: 'medium', category: "Action" },
      ],
      detailedBreakdown: {
        "Height": `${r1(h * 100)} cm`, "Weight": `${r1(wt)} kg`, "Waist": `${clamp(waist, 30, 200)} cm`,
        "BMI": `${r1(bmi)} kg/m²`, "ABSI": `${r2(absi * 1000)} ×10⁻³`,
        "Z-Score": `${r2(z)}`, "Relative Risk": `${r2(relativeRisk)}×`,
        "Risk Band": riskBand, "Formula": "WC / (BMI^(2/3) × Height^0.5)",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
      <NumInput label="Waist Circumference" value={waist} onChange={setWaist} min={30} max={200} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={100} suffix="years" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="A Body Shape Index (ABSI) Calculator"
      description="Evaluate waist-adjusted mortality risk independent of BMI. Includes Z-score, hazard ratio, and cardiovascular risk overlay."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="A Body Shape Index (ABSI) Calculator" description="Evaluate waist-adjusted mortality risk independent of BMI." categoryName="Body Measurements" />}
    />
  )
}

// ─── #14 Body Shape Index (Generalized Geometry Model) ──────────────────
export function BodyShapeIndexCalculator() {
  const [waist, setWaist] = useState(84)
  const [hip, setHip] = useState(98)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(waist, 30, 200)
    const hp = clamp(hip, 50, 200)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 25, 350)

    const whr = w / hp
    const whtr = w / h
    const proportionalIdx = r2((w + hp) / h)

    let shape: string; let shapeIcon: string
    if (whr > 0.9) { shape = "Apple (Android)"; shapeIcon = "🍎" }
    else if (whr < 0.75) { shape = "Pear (Gynoid)"; shapeIcon = "🍐" }
    else { shape = "Rectangle (Balanced)"; shapeIcon = "▬" }

    const fatPattern = shape.includes("Apple") ? "Central/Visceral" : shape.includes("Pear") ? "Peripheral/Subcutaneous" : "Evenly Distributed"
    const hormonalHint = shape.includes("Apple") ? "Cortisol-dominant pattern — stress and insulin resistance risk" : shape.includes("Pear") ? "Estrogen-dominant pattern — lower metabolic risk" : "Balanced hormonal distribution"

    const symmetry = 100 - Math.abs(whr - 0.8) * 200
    const metabolicRisk = shape.includes("Apple") ? "Elevated" : shape.includes("Pear") ? "Lower" : "Average"
    const metaStatus: 'good' | 'warning' | 'danger' = shape.includes("Apple") ? 'danger' : shape.includes("Pear") ? 'good' : 'warning'

    setResult({
      primaryMetric: { label: "Body Shape", value: `${shapeIcon} ${shape}`, status: metaStatus, description: `WHR: ${r2(whr)} | Fat pattern: ${fatPattern}`, icon: User },
      healthScore: Math.max(20, Math.round(symmetry)),
      metrics: [
        { label: "Shape", value: shape, status: metaStatus, icon: User },
        { label: "Waist/Hip Ratio", value: r2(whr), status: whr < 0.85 ? 'good' : whr < 0.95 ? 'warning' : 'danger', icon: Ruler },
        { label: "Waist/Height", value: r2(whtr), status: whtr < 0.5 ? 'good' : 'warning', icon: Ruler },
        { label: "Proportional Index", value: proportionalIdx, status: 'normal', icon: BarChart3 },
        { label: "Symmetry Score", value: `${Math.max(0, Math.round(symmetry))}%`, status: symmetry > 70 ? 'good' : 'warning', icon: TrendingUp },
        { label: "Metabolic Risk", value: metabolicRisk, status: metaStatus, icon: Heart },
      ],
      recommendations: [
        { title: `${shapeIcon} Shape: ${shape}`, description: `Your body stores fat in a ${fatPattern.toLowerCase()} pattern. ${hormonalHint}.`, priority: metaStatus === 'danger' ? 'high' : 'medium', category: "Shape Analysis" },
        { title: "Fat Distribution", description: `Central fat (apple) elevates heart disease, diabetes risk. Peripheral fat (pear) is metabolically less harmful. Your pattern: ${fatPattern}.`, priority: 'medium', category: "Fat Pattern" },
        { title: "Hormonal Indicator", description: hormonalHint, priority: 'low', category: "Hormonal" },
        { title: "Body Geometry", description: `Proportional index ${proportionalIdx} combines waist+hip relative to height. Symmetry score ${Math.round(symmetry)}% reflects how close you are to balanced proportions.`, priority: 'low', category: "Geometry" },
      ],
      detailedBreakdown: {
        "Waist": `${w} cm`, "Hip": `${hp} cm`, "Height": `${h} cm`, "Weight": `${wt} kg`,
        "WHR": `${r2(whr)}`, "WHtR": `${r2(whtr)}`,
        "Shape": shape, "Fat Pattern": fatPattern, "Symmetry": `${Math.round(symmetry)}%`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Waist" value={waist} onChange={setWaist} min={30} max={200} suffix="cm" />
      <NumInput label="Hip" value={hip} onChange={setHip} min={50} max={200} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Body Shape Index Calculator"
      description="Classify body geometry (Apple / Pear / Rectangle), fat distribution, hormonal hints, and metabolic risk."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Body Shape Index Calculator" description="Classify body geometry and fat distribution pattern." categoryName="Body Measurements" />}
    />
  )
}

// ─── #15 FFMI (Fat-Free Mass Index) ─────────────────────────────────────
export function FFMICalculator() {
  const [height, setHeight] = useState(175)
  const [weight, setWeight] = useState(80)
  const [bodyFat, setBodyFat] = useState(18)
  const [age, setAge] = useState(28)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 140, 230) / 100
    const wt = clamp(weight, 30, 200)
    const bf = clamp(bodyFat, 3, 60)
    const a = clamp(age, 15, 90)

    const leanMass = wt * (1 - bf / 100)
    const ffmi = leanMass / (h * h)
    const normalizedFFMI = ffmi + 6.1 * (1.8 - h)

    let cat: string; let catStatus: 'good' | 'warning' | 'danger'
    if (normalizedFFMI < 17) { cat = "Below Average"; catStatus = 'warning' }
    else if (normalizedFFMI < 20) { cat = "Average"; catStatus = 'good' }
    else if (normalizedFFMI < 22) { cat = "Above Average"; catStatus = 'good' }
    else if (normalizedFFMI < 25) { cat = "Excellent / Athletic"; catStatus = 'good' }
    else { cat = "Superior (>25 — near natural limit)"; catStatus = 'warning' }

    const steroidFlag = normalizedFFMI > 25
    const ageFactor = a > 40 ? r1((a - 40) * 0.1) : 0
    const adjustedFFMI = normalizedFFMI + ageFactor
    const naturalLimit = 25
    const percentOfLimit = Math.min(100, Math.round((normalizedFFMI / naturalLimit) * 100))

    setResult({
      primaryMetric: { label: "FFMI (Normalized)", value: r1(normalizedFFMI), unit: "kg/m²", status: catStatus, description: cat, icon: TrendingUp },
      healthScore: Math.min(95, Math.max(20, Math.round(normalizedFFMI * 4))),
      metrics: [
        { label: "Lean Mass", value: r1(leanMass), unit: "kg", status: 'normal', icon: Scale },
        { label: "Raw FFMI", value: r1(ffmi), unit: "kg/m²", status: 'normal', icon: BarChart3 },
        { label: "Normalized FFMI", value: r1(normalizedFFMI), unit: "kg/m²", status: catStatus, icon: TrendingUp },
        { label: "% of Natural Limit", value: `${percentOfLimit}%`, status: percentOfLimit < 85 ? 'good' : percentOfLimit < 100 ? 'warning' : 'danger', icon: AlertTriangle },
        { label: "Muscularity", value: cat, status: catStatus, icon: User },
        ...(steroidFlag ? [{ label: "⚠️ Natural Limit Flag", value: "FFMI > 25", status: 'danger' as const, icon: AlertTriangle }] : []),
      ],
      recommendations: [
        { title: "FFMI Interpretation", description: `Your normalized FFMI is ${r1(normalizedFFMI)}. This represents "${cat}" muscular development. Average untrained male: ~18-20, well-trained: 22-24.`, priority: 'medium', category: "Muscularity" },
        ...(steroidFlag ? [{ title: "⚠️ Natural Limit Exceeded", description: `FFMI > 25 exceeds the estimated natural muscular potential (~25 kg/m² for males). Values above this may indicate pharmacological assistance or exceptional genetics.`, priority: 'high' as const, category: "Alert" }] : []),
        { title: "Age Muscle Factor", description: `After age 40, muscle loss ~0.5-1% per year (sarcopenia). Age adjustment adds +${r1(ageFactor)} to your FFMI context. Age-adjusted: ${r1(adjustedFFMI)}.`, priority: 'low', category: "Aging" },
        { title: "Athletic Comparison", description: `You're at ${percentOfLimit}% of estimated natural muscular limit. Elite natural bodybuilders typically reach 24-25 FFMI.`, priority: 'medium', category: "Comparison" },
      ],
      detailedBreakdown: {
        "Height": `${r1(h * 100)} cm`, "Weight": `${r1(wt)} kg`, "Body Fat": `${r1(bf)}%`,
        "Lean Mass": `${r1(leanMass)} kg`, "Raw FFMI": `${r1(ffmi)}`, "Normalized FFMI": `${r1(normalizedFFMI)}`,
        "Category": cat, "Natural Limit": "~25 kg/m²", "% of Limit": `${percentOfLimit}%`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Height" value={height} onChange={setHeight} min={140} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={200} suffix="kg" />
      <NumInput label="Body Fat %" value={bodyFat} onChange={setBodyFat} min={3} max={60} suffix="%" />
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={90} suffix="years" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="FFMI Calculator (Fat-Free Mass Index)"
      description="Evaluate true muscular development adjusted for height. Includes natural limit estimation and athlete comparison."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="FFMI Calculator (Fat-Free Mass Index)" description="Evaluate true muscular development adjusted for height." categoryName="Body Measurements" />}
    />
  )
}

// ─── #16 Ideal Body Fat Percentage ──────────────────────────────────────
export function IdealBodyFatCalculator() {
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [currentFat, setCurrentFat] = useState(22)
  const [mode, setMode] = useState("health")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const a = clamp(age, 15, 80)
    const cf = clamp(currentFat, 2, 60)
    const isMale = gender === "male"
    const isAthlete = mode === "athlete"

    let idealMin: number, idealMax: number, perfMin: number, perfMax: number, longMin: number, longMax: number
    if (isMale) {
      idealMin = isAthlete ? 6 : 10; idealMax = isAthlete ? 13 : 20
      perfMin = 6; perfMax = 13
      longMin = 12; longMax = 20
    } else {
      idealMin = isAthlete ? 14 : 20; idealMax = isAthlete ? 20 : 28
      perfMin = 14; perfMax = 20
      longMin = 20; longMax = 28
    }

    const ageDelta = Math.max(0, (a - 30) * 0.15)
    idealMin += ageDelta; idealMax += ageDelta

    const inIdeal = cf >= idealMin && cf <= idealMax
    const tooLow = cf < (isMale ? 5 : 12)
    const fatStatus: 'good' | 'warning' | 'danger' = inIdeal ? 'good' : tooLow ? 'danger' : 'warning'

    const hormonalZoneMin = isMale ? 8 : 18
    const hormonalZoneMax = isMale ? 22 : 30
    const hormonalSafe = cf >= hormonalZoneMin && cf <= hormonalZoneMax

    const fertilityMin = isMale ? 6 : 17
    const fertilitySafe = cf >= fertilityMin

    setResult({
      primaryMetric: { label: "Ideal Body Fat Range", value: `${r1(idealMin)}-${r1(idealMax)}%`, status: fatStatus, description: inIdeal ? "You're in ideal range!" : tooLow ? "Dangerously low fat" : `Target: ${r1(idealMin)}-${r1(idealMax)}%`, icon: Shield },
      healthScore: inIdeal ? 90 : tooLow ? 20 : 50,
      metrics: [
        { label: "Current Fat %", value: `${r1(cf)}%`, status: fatStatus, icon: Activity },
        { label: "Ideal Range", value: `${r1(idealMin)}-${r1(idealMax)}%`, status: 'good', icon: Shield },
        { label: "Performance Range", value: `${perfMin}-${perfMax}%`, status: 'normal', icon: TrendingUp },
        { label: "Longevity Range", value: `${longMin}-${longMax}%`, status: 'normal', icon: Heart },
        { label: "Hormonal Health", value: hormonalSafe ? "Safe Zone" : "⚠️ Risk", status: hormonalSafe ? 'good' : 'danger', icon: AlertTriangle },
        { label: "Fertility Safety", value: fertilitySafe ? "Safe" : "⚠️ At Risk", status: fertilitySafe ? 'good' : 'danger', icon: User },
      ],
      recommendations: [
        { title: "Your Ideal Range", description: `For ${isMale ? "males" : "females"} age ${a}, ${isAthlete ? "athlete" : "general health"} ideal: ${r1(idealMin)}-${r1(idealMax)}%. Current: ${r1(cf)}%.`, priority: 'high', category: "Target" },
        { title: "Performance vs Longevity", description: `Performance fat (${perfMin}-${perfMax}%) optimizes athletic output. Longevity fat (${longMin}-${longMax}%) is best for long-term health and hormonal balance.`, priority: 'medium', category: "Ranges" },
        { title: "Hormonal Health Zone", description: `Safe hormonal zone: ${hormonalZoneMin}-${hormonalZoneMax}%. ${hormonalSafe ? "You're in a safe zone." : "Low body fat can disrupt hormone production — testosterone, estrogen, thyroid."}`, priority: hormonalSafe ? 'low' : 'high', category: "Hormones" },
        ...(tooLow ? [{ title: "⚠️ Too Low Body Fat", description: "Extremely low body fat can cause: hormonal disruption, amenorrhea, bone density loss, weakened immunity, and chronic fatigue. Increase intake immediately.", priority: 'high' as const, category: "Warning" }] : []),
      ],
      detailedBreakdown: {
        "Age": `${a} years`, "Gender": isMale ? "Male" : "Female", "Mode": isAthlete ? "Athlete" : "Health",
        "Current Fat": `${r1(cf)}%`, "Ideal Range": `${r1(idealMin)}-${r1(idealMax)}%`,
        "Performance Range": `${perfMin}-${perfMax}%`, "Longevity Range": `${longMin}-${longMax}%`,
        "Hormonal Safe": hormonalSafe ? "Yes" : "No", "Fertility Safe": fertilitySafe ? "Yes" : "No",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Age" value={age} onChange={setAge} min={15} max={80} suffix="years" />
      <NumInput label="Current Body Fat %" value={currentFat} onChange={setCurrentFat} min={2} max={60} suffix="%" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <SelectInput label="Mode" value={mode} onChange={setMode} options={[{ value: "health", label: "General Health" }, { value: "athlete", label: "Athlete / Performance" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Ideal Body Fat Percentage Calculator"
      description="Find your optimal body fat range based on age, gender, and goals. Includes hormonal health zone, fertility safety, and performance ranges."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Ideal Body Fat Percentage Calculator" description="Find your optimal body fat range for health, performance, and longevity." categoryName="Body Measurements" />}
    />
  )
}

// ─── #17 Chest-to-Waist Ratio ───────────────────────────────────────────
export function ChestWaistRatioCalculator() {
  const [chest, setChest] = useState(102)
  const [waist, setWaist] = useState(82)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const c = clamp(chest, 50, 200)
    const w = clamp(waist, 30, 200)
    const ratio = c / w
    const vTaper = r2((c - w) / w * 100)

    let cat: string; let catStatus: 'good' | 'warning' | 'danger'
    if (ratio >= 1.35) { cat = "Elite V-Taper"; catStatus = 'good' }
    else if (ratio >= 1.2) { cat = "Athletic"; catStatus = 'good' }
    else if (ratio >= 1.1) { cat = "Average"; catStatus = 'warning' }
    else { cat = "Below Average"; catStatus = 'warning' }

    const bbStandard = 1.4
    const bbPercent = Math.min(100, Math.round((ratio / bbStandard) * 100))
    const postureNote = ratio < 1.1 ? "Consider chest expansion exercises and posture correction." : "Good upper body development."

    setResult({
      primaryMetric: { label: "Chest-Waist Ratio", value: r2(ratio), status: catStatus, description: cat, icon: TrendingUp },
      healthScore: Math.min(95, Math.max(20, Math.round(ratio * 60))),
      metrics: [
        { label: "Ratio", value: r2(ratio), status: catStatus, icon: BarChart3 },
        { label: "V-Taper Score", value: `${vTaper}%`, status: vTaper > 20 ? 'good' : 'warning', icon: TrendingUp },
        { label: "Proportion", value: cat, status: catStatus, icon: User },
        { label: "vs BB Standard", value: `${bbPercent}%`, status: bbPercent > 85 ? 'good' : 'warning', icon: Shield },
        { label: "Aesthetic Rating", value: ratio >= 1.3 ? "Excellent" : ratio >= 1.15 ? "Good" : "Needs Work", status: catStatus, icon: Activity },
      ],
      recommendations: [
        { title: "Ratio Analysis", description: `Chest ${c}cm / Waist ${w}cm = ${r2(ratio)}. "${cat}" category. V-taper ${vTaper}%.`, priority: 'medium', category: "Proportion" },
        { title: "Athletic Comparison", description: `Ideal athletic ratio: 1.2-1.35. Bodybuilding standard: ~${bbStandard}. You're at ${bbPercent}% of BB standard.`, priority: 'medium', category: "Comparison" },
        { title: "Posture Impact", description: postureNote, priority: 'low', category: "Posture" },
        { title: "Improvement Tips", description: ratio < 1.2 ? "Focus on chest press, flyes, and lat pulldowns to increase chest. Core work and calorie control to reduce waist." : "Maintain current training — excellent chest-waist proportion.", priority: ratio < 1.2 ? 'high' : 'low', category: "Training" },
      ],
      detailedBreakdown: { "Chest": `${c} cm`, "Waist": `${w} cm`, "Ratio": `${r2(ratio)}`, "V-Taper %": `${vTaper}%`, "Category": cat, "BB Standard %": `${bbPercent}%` },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Chest Circumference" value={chest} onChange={setChest} min={50} max={200} suffix="cm" />
      <NumInput label="Waist Circumference" value={waist} onChange={setWaist} min={30} max={200} suffix="cm" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Chest-to-Waist Ratio Calculator"
      description="Evaluate upper body proportion, V-taper score, and athletic symmetry. Compare against bodybuilding standards."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Chest-to-Waist Ratio Calculator" description="Evaluate upper body proportion and V-taper score." categoryName="Body Measurements" />}
    />
  )
}

// ─── #18 Arm Span to Height Ratio ───────────────────────────────────────
export function ArmSpanHeightRatioCalculator() {
  const [armSpan, setArmSpan] = useState(172)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(25)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const as_ = clamp(armSpan, 80, 250)
    const h = clamp(height, 80, 230)
    const a = clamp(age, 5, 90)

    const ratio = as_ / h
    const diff = as_ - h

    let rangeCat: string; let rangeStatus: 'good' | 'warning' | 'danger'
    if (ratio >= 0.97 && ratio <= 1.03) { rangeCat = "Normal (1:1)"; rangeStatus = 'good' }
    else if (ratio > 1.03 && ratio <= 1.08) { rangeCat = "Slightly Long Arms"; rangeStatus = 'good' }
    else if (ratio > 1.08) { rangeCat = "Significantly Long — Medical Review"; rangeStatus = 'warning' }
    else if (ratio < 0.97 && ratio >= 0.92) { rangeCat = "Slightly Short Arms"; rangeStatus = 'good' }
    else { rangeCat = "Significantly Short — Medical Review"; rangeStatus = 'warning' }

    const marfanHint = ratio > 1.05 ? "Elevated ratio may suggest Marfan syndrome screening" : "Ratio within normal limits — low Marfan concern"
    const sportAdvantage = ratio > 1.04 ? "Advantage in: swimming, basketball, boxing, rock climbing" : ratio < 0.96 ? "Advantage in: gymnastics, weightlifting" : "Balanced — versatile across sports"
    const growthNote = a < 18 ? " (Adolescent: ratio may change during growth)" : ""

    setResult({
      primaryMetric: { label: "Arm Span / Height", value: r2(ratio), status: rangeStatus, description: `${rangeCat}${growthNote}`, icon: Ruler },
      healthScore: rangeStatus === 'good' ? 85 : 50,
      metrics: [
        { label: "Ratio", value: r2(ratio), status: rangeStatus, icon: Ruler },
        { label: "Arm Span", value: `${r1(as_)} cm`, status: 'normal', icon: Ruler },
        { label: "Height", value: `${r1(h)} cm`, status: 'normal', icon: Ruler },
        { label: "Difference", value: `${r1(diff)} cm`, status: Math.abs(diff) < 5 ? 'good' : 'warning', icon: BarChart3 },
        { label: "Category", value: rangeCat, status: rangeStatus, icon: User },
      ],
      recommendations: [
        { title: "Ratio Interpretation", description: `Arm span ${r1(as_)}cm vs height ${r1(h)}cm = ratio ${r2(ratio)}. Normal: 0.97-1.03. ${rangeCat}.`, priority: 'medium', category: "Analysis" },
        { title: "Marfan Screening", description: marfanHint, priority: ratio > 1.05 ? 'high' : 'low', category: "Medical" },
        { title: "Sport Advantage", description: sportAdvantage, priority: 'medium', category: "Athletic" },
        ...(a < 18 ? [{ title: "Growth Tracking", description: `At age ${a}, arm span and height grow at different rates. Re-measure annually to track proportional development.`, priority: 'medium' as const, category: "Growth" }] : []),
        ...(ratio > 1.08 || ratio < 0.9 ? [{ title: "⚠️ Growth Abnormality Flag", description: "Ratio significantly outside normal range. Consider evaluation for skeletal dysplasia or connective tissue disorders.", priority: 'high' as const, category: "Clinical" }] : []),
      ],
      detailedBreakdown: { "Arm Span": `${r1(as_)} cm`, "Height": `${r1(h)} cm`, "Ratio": `${r2(ratio)}`, "Difference": `${r1(diff)} cm`, "Category": rangeCat, "Age": `${a} years` },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Arm Span" value={armSpan} onChange={setArmSpan} min={80} max={250} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={80} max={230} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={5} max={90} suffix="years" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Arm Span to Height Ratio Calculator"
      description="Evaluate skeletal proportionality. Includes Marfan screening hint, sport advantage score, and growth tracking."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Arm Span to Height Ratio Calculator" description="Evaluate skeletal proportionality and developmental insight." categoryName="Body Measurements" />}
    />
  )
}

// ─── #19 Mid Upper Arm Circumference (MUAC) ─────────────────────────────
export function MidUpperArmCircumferenceCalculator() {
  const [muac, setMuac] = useState(27)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const m = clamp(muac, 5, 50)
    const a = clamp(age, 1, 100)
    const isMale = gender === "male"

    const isChild = a < 5
    let malnutritionRisk: string; let malStatus: 'good' | 'warning' | 'danger'
    if (isChild) {
      if (m < 11.5) { malnutritionRisk = "Severe Acute Malnutrition (SAM)"; malStatus = 'danger' }
      else if (m < 12.5) { malnutritionRisk = "Moderate Acute Malnutrition (MAM)"; malStatus = 'warning' }
      else if (m < 13.5) { malnutritionRisk = "At Risk"; malStatus = 'warning' }
      else { malnutritionRisk = "Normal"; malStatus = 'good' }
    } else {
      const cutLow = isMale ? 23 : 22
      const cutMid = isMale ? 26 : 25
      const cutHigh = isMale ? 32 : 30
      if (m < cutLow) { malnutritionRisk = "Malnourished / Low Muscle"; malStatus = 'danger' }
      else if (m < cutMid) { malnutritionRisk = "Below Average Muscle"; malStatus = 'warning' }
      else if (m <= cutHigh) { malnutritionRisk = "Normal Muscle Mass"; malStatus = 'good' }
      else { malnutritionRisk = "Above Average / High Muscle"; malStatus = 'good' }
    }

    const sarcopeniaRisk = !isChild && a > 60 && m < (isMale ? 26 : 24) ? "Elevated" : "Low"
    const frailtyAlert = a > 65 && m < (isMale ? 24 : 22)
    const muscleReserve = Math.max(0, Math.min(100, Math.round(((m - 15) / 20) * 100)))

    setResult({
      primaryMetric: { label: "MUAC", value: r1(m), unit: "cm", status: malStatus, description: malnutritionRisk, icon: Ruler },
      healthScore: malStatus === 'good' ? 85 : malStatus === 'warning' ? 50 : 20,
      metrics: [
        { label: "MUAC", value: r1(m), unit: "cm", status: malStatus, icon: Ruler },
        { label: "Malnutrition Risk", value: malnutritionRisk, status: malStatus, icon: AlertTriangle },
        { label: "Muscle Reserve", value: `${muscleReserve}%`, status: muscleReserve > 50 ? 'good' : 'warning', icon: TrendingUp },
        { label: "Sarcopenia Risk", value: sarcopeniaRisk, status: sarcopeniaRisk === "Low" ? 'good' : 'danger', icon: Heart },
        ...(frailtyAlert ? [{ label: "⚠️ Frailty Alert", value: "High risk", status: 'danger' as const, icon: AlertTriangle }] : []),
      ],
      recommendations: [
        { title: "MUAC Screening", description: `MUAC ${r1(m)}cm. ${malnutritionRisk}. ${isChild ? "WHO cutoffs: <11.5cm SAM, <12.5cm MAM for children under 5." : "Low MUAC indicates depleted muscle and nutritional reserves."}`, priority: malStatus === 'danger' ? 'high' : 'medium', category: "Nutrition" },
        ...(isChild ? [{ title: "Pediatric Grade", description: m < 11.5 ? "Severe: Immediate therapeutic feeding required (RUTF)." : m < 12.5 ? "Moderate: Supplementary feeding and monitoring needed." : "Adequate nutritional status for age.", priority: m < 12.5 ? 'high' as const : 'low' as const, category: "Pediatric" }] : []),
        { title: "Sarcopenia Check", description: `${sarcopeniaRisk} sarcopenia probability. ${a > 60 ? "Age >60: regular MUAC monitoring recommended every 3-6 months." : "Young age: sarcopenia risk minimal."}`, priority: sarcopeniaRisk === "Elevated" ? 'high' : 'low', category: "Aging" },
        ...(frailtyAlert ? [{ title: "⚠️ Frailty Warning", description: "Low MUAC + age >65 = frailty indicator. Prioritize protein-rich diet (1.2-1.5g/kg/day) and resistance training.", priority: 'high' as const, category: "Frailty" }] : []),
        { title: "Improving MUAC", description: "Resistance training (curls, presses), adequate protein intake, and caloric surplus help increase MUAC. Track monthly.", priority: 'medium', category: "Improvement" },
      ],
      detailedBreakdown: {
        "MUAC": `${r1(m)} cm`, "Age": `${a} years`, "Gender": isMale ? "Male" : "Female",
        "Mode": isChild ? "Pediatric" : "Adult", "Risk": malnutritionRisk,
        "Muscle Reserve": `${muscleReserve}%`, "Sarcopenia Risk": sarcopeniaRisk,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Mid Upper Arm Circumference" value={muac} onChange={setMuac} min={5} max={50} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={1} max={100} suffix="years" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Mid Upper Arm Circumference (MUAC) Calculator"
      description="Screen nutritional status, muscle reserve, sarcopenia probability, and frailty risk. Includes pediatric malnutrition grading."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Mid Upper Arm Circumference (MUAC) Calculator" description="Screen nutritional and muscle status with MUAC." categoryName="Body Measurements" />}
    />
  )
}

// ─── #20 Calf Circumference Calculator ──────────────────────────────────
export function CalfCircumferenceCalculator() {
  const [calf, setCalf] = useState(35)
  const [age, setAge] = useState(40)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const c = clamp(calf, 15, 60)
    const a = clamp(age, 10, 100)
    const isMale = gender === "male"

    const cutoff = isMale ? 34 : 33
    const lowMuscle = c < cutoff

    let muscleCat: string; let muscleStatus: 'good' | 'warning' | 'danger'
    if (c < cutoff - 4) { muscleCat = "Very Low Muscle Mass"; muscleStatus = 'danger' }
    else if (c < cutoff) { muscleCat = "Below Normal"; muscleStatus = 'warning' }
    else if (c <= cutoff + 6) { muscleCat = "Normal"; muscleStatus = 'good' }
    else { muscleCat = "Above Average / Athletic"; muscleStatus = 'good' }

    const frailtyRisk = a > 60 && lowMuscle ? "High" : a > 60 && !lowMuscle ? "Low" : "N/A (age <60)"
    const fallRisk = a > 65 && c < cutoff ? "Elevated" : "Low"
    const sarcopenia = a > 50 && c < cutoff ? "Probable" : a > 50 ? "Unlikely" : "N/A"
    const mobilityDecline = a > 60 && c < (cutoff - 2) ? "Predicted within 2-5 years" : "Not indicated"

    const healthScore = muscleStatus === 'good' ? 85 : muscleStatus === 'warning' ? 50 : 20

    setResult({
      primaryMetric: { label: "Calf Circumference", value: r1(c), unit: "cm", status: muscleStatus, description: muscleCat, icon: Ruler },
      healthScore,
      metrics: [
        { label: "Calf", value: r1(c), unit: "cm", status: muscleStatus, icon: Ruler },
        { label: "Muscle Category", value: muscleCat, status: muscleStatus, icon: TrendingUp },
        { label: "Frailty Risk", value: frailtyRisk, status: frailtyRisk === "High" ? 'danger' : 'good', icon: AlertTriangle },
        { label: "Fall Risk", value: fallRisk, status: fallRisk === "Elevated" ? 'danger' : 'good', icon: Shield },
        { label: "Sarcopenia", value: sarcopenia, status: sarcopenia === "Probable" ? 'danger' : 'good', icon: Heart },
        { label: "Mobility Prediction", value: mobilityDecline, status: mobilityDecline.includes("Predicted") ? 'warning' : 'good', icon: Activity },
      ],
      recommendations: [
        { title: "Muscle Assessment", description: `Calf ${r1(c)}cm. ${isMale ? "Male" : "Female"} cutoff: ${cutoff}cm. Status: ${muscleCat}. ${lowMuscle ? "Below threshold — muscle preservation critical." : "Adequate lower limb muscle mass."}`, priority: lowMuscle ? 'high' : 'medium', category: "Assessment" },
        ...(frailtyRisk === "High" ? [{ title: "⚠️ Frailty Risk", description: "Low calf circumference + age >60 is a strong frailty predictor. Prioritize: resistance training (calf raises, squats), protein 1.2-1.5g/kg/day, vitamin D.", priority: 'high' as const, category: "Frailty" }] : []),
        ...(fallRisk === "Elevated" ? [{ title: "⚠️ Fall Risk", description: "Reduced calf muscle increases fall probability. Balance exercises, ankle strengthening, and supervised activity recommended.", priority: 'high' as const, category: "Safety" }] : []),
        { title: "Sarcopenia Integration", description: `${sarcopenia === "Probable" ? "Calf < cutoff at age >50 suggests sarcopenia (age-related muscle loss). Combine with MUAC and grip strength for full screening." : "Current measurements don't suggest sarcopenia."}`, priority: sarcopenia === "Probable" ? 'high' : 'low', category: "Screening" },
        { title: "Improvement Plan", description: "Calf raises (3×15 daily), walking 30min/day, adequate protein, and creatine supplementation (3-5g/day) can improve calf muscle mass over 3-6 months.", priority: lowMuscle ? 'high' : 'low', category: "Action" },
      ],
      detailedBreakdown: {
        "Calf Circumference": `${r1(c)} cm`, "Age": `${a} years`, "Gender": isMale ? "Male" : "Female",
        "Cutoff": `${cutoff} cm`, "Muscle Category": muscleCat,
        "Frailty Risk": frailtyRisk, "Fall Risk": fallRisk, "Sarcopenia": sarcopenia,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Calf Circumference" value={calf} onChange={setCalf} min={15} max={60} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={10} max={100} suffix="years" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Calf Circumference Calculator"
      description="Assess lower limb muscle mass, frailty risk, fall probability, sarcopenia screening, and mobility decline prediction."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Calf Circumference Calculator" description="Assess lower limb muscle, frailty, and fall risk." categoryName="Body Measurements" />}
    />
  )
}
// ─── #21 Thigh Circumference Measure ────────────────────────────────────
export function ThighCircumferenceCalculator() {
  const [thigh, setThigh] = useState(55)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const t = clamp(thigh, 20, 90)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 25, 350)
    const a = clamp(age, 10, 100)
    const isMale = gender === "male"

    const thighHeightRatio = r2(t / h)
    const bmi = wt / Math.pow(h / 100, 2)
    const lowerLimbIndex = r2((t * 2) / h * 100)

    // Muscle vs fat probability heuristic
    const muscleProbability = bmi < 25 && t > (isMale ? 50 : 48) ? "High muscle" : bmi > 30 && t > 60 ? "Mixed muscle + fat" : t < (isMale ? 45 : 42) ? "Low muscle" : "Average"
    const muscleStatus: 'good' | 'warning' | 'danger' = muscleProbability.includes("High") ? 'good' : muscleProbability.includes("Low") ? 'danger' : 'warning'

    const sarcoFlag = a > 55 && t < (isMale ? 48 : 45)
    const athleticProfile = t > (isMale ? 58 : 55) && bmi < 28 ? "Sprinter / Power profile" : t > (isMale ? 52 : 50) ? "Functional athlete" : "General"
    const fatAccumRisk = bmi > 28 && t > 60 ? "Elevated" : "Low"
    const symmetryNote = "Add left & right thigh measurements for asymmetry detection."

    const healthScore = muscleStatus === 'good' ? 85 : muscleStatus === 'warning' ? 55 : 25

    setResult({
      primaryMetric: { label: "Thigh-to-Height Ratio", value: thighHeightRatio, status: muscleStatus, description: `${muscleProbability} | Proportionality: ${lowerLimbIndex}%`, icon: Ruler },
      healthScore,
      metrics: [
        { label: "Thigh", value: r1(t), unit: "cm", status: muscleStatus, icon: Ruler },
        { label: "Thigh/Height Ratio", value: thighHeightRatio, status: thighHeightRatio >= 0.29 && thighHeightRatio <= 0.38 ? 'good' : 'warning', icon: BarChart3 },
        { label: "Limb Proportionality", value: `${lowerLimbIndex}%`, status: 'normal', icon: TrendingUp },
        { label: "Muscle Quality", value: muscleProbability, status: muscleStatus, icon: Activity },
        { label: "Athletic Profile", value: athleticProfile, status: athleticProfile.includes("Sprinter") ? 'good' : 'normal', icon: TrendingUp },
        ...(sarcoFlag ? [{ label: "⚠️ Sarcopenia Flag", value: "Lower-limb risk", status: 'danger' as const, icon: AlertTriangle }] : []),
      ],
      recommendations: [
        { title: "Thigh Analysis", description: `Thigh ${r1(t)}cm at height ${h}cm = ratio ${thighHeightRatio}. Muscle probability: ${muscleProbability}. BMI context: ${r1(bmi)}.`, priority: 'medium', category: "Assessment" },
        { title: "Athletic Performance", description: `Profile: ${athleticProfile}. Larger thighs with low BMI indicate power-dominant lower body — beneficial for sprinting, cycling, and explosive sports.`, priority: 'medium', category: "Performance" },
        ...(sarcoFlag ? [{ title: "⚠️ Sarcopenia Alert", description: `Age ${a} with thigh ${r1(t)}cm below threshold. Lower-limb muscle wasting risk. Recommend: squats, leg press, protein 1.2-1.5g/kg/day.`, priority: 'high' as const, category: "Clinical" }] : []),
        { title: "Fat Accumulation Risk", description: `${fatAccumRisk}. ${fatAccumRisk === "Elevated" ? "High BMI + large thigh suggests fat accumulation alongside muscle. Calorie control recommended." : "No excessive fat accumulation signals."}`, priority: fatAccumRisk === "Elevated" ? 'high' : 'low', category: "Risk" },
        { title: "Symmetry Tip", description: symmetryNote, priority: 'low', category: "Tracking" },
      ],
      detailedBreakdown: {
        "Thigh": `${r1(t)} cm`, "Height": `${h} cm`, "Weight": `${wt} kg`, "BMI": `${r1(bmi)}`,
        "Thigh/Height": thighHeightRatio.toString(), "Limb Index": `${lowerLimbIndex}%`,
        "Muscle Quality": muscleProbability, "Athletic Profile": athleticProfile,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Thigh Circumference" value={thigh} onChange={setThigh} min={20} max={90} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
      <NumInput label="Age" value={age} onChange={setAge} min={10} max={100} suffix="years" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Thigh Circumference Measure"
      description="Evaluate lower body muscle mass, fat distribution, athletic profile, and sarcopenia risk from thigh measurements."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Thigh Circumference Measure" description="Lower body muscle mass and fat distribution analysis." categoryName="Body Measurements" />}
    />
  )
}

// ─── #22 Forearm Circumference Tracker ──────────────────────────────────
export function ForearmCircumferenceCalculator() {
  const [forearm, setForearm] = useState(27)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const f = clamp(forearm, 15, 45)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 25, 350)
    const isMale = gender === "male"

    const forearmHeightRatio = r2(f / h)
    const bmi = wt / Math.pow(h / 100, 2)

    // Frame thickness
    let frameType: string; let frameStatus: 'good' | 'warning' | 'danger'
    const frameRef = isMale ? 28 : 24
    if (f < frameRef - 4) { frameType = "Small Frame"; frameStatus = 'warning' }
    else if (f <= frameRef + 2) { frameType = "Medium Frame"; frameStatus = 'good' }
    else { frameType = "Large Frame"; frameStatus = 'good' }

    // Muscle density estimate (heuristic)
    const muscleDensity = f > (isMale ? 30 : 26) && bmi < 28 ? "High" : f > (isMale ? 26 : 23) ? "Average" : "Below Average"
    const muscleStatus: 'good' | 'warning' | 'danger' = muscleDensity === "High" ? 'good' : muscleDensity === "Average" ? 'warning' : 'danger'

    // Grip strength correlation
    const estimatedGrip = isMale ? r1(f * 1.8 - 15) : r1(f * 1.4 - 10)
    const gripRating = estimatedGrip > (isMale ? 40 : 25) ? "Strong" : estimatedGrip > (isMale ? 30 : 18) ? "Average" : "Weak"

    const athleticIndex = r2(f / Math.pow(wt, 0.33))
    const sarcoEarly = f < (isMale ? 24 : 20) ? "Possible early indicator" : "Not indicated"

    setResult({
      primaryMetric: { label: "Forearm/Height Ratio", value: forearmHeightRatio, status: muscleStatus, description: `${frameType} | Density: ${muscleDensity}`, icon: Ruler },
      healthScore: muscleStatus === 'good' ? 85 : muscleStatus === 'warning' ? 55 : 30,
      metrics: [
        { label: "Forearm", value: r1(f), unit: "cm", status: muscleStatus, icon: Ruler },
        { label: "Forearm/Height", value: forearmHeightRatio, status: 'normal', icon: BarChart3 },
        { label: "Frame Type", value: frameType, status: frameStatus, icon: User },
        { label: "Muscle Density", value: muscleDensity, status: muscleStatus, icon: TrendingUp },
        { label: "Est. Grip Strength", value: `${estimatedGrip} kg`, status: gripRating === "Strong" ? 'good' : gripRating === "Average" ? 'warning' : 'danger', icon: Activity },
        { label: "Athletic Muscularity", value: r2(athleticIndex), status: 'normal', icon: Shield },
        { label: "Sarcopenia Early", value: sarcoEarly, status: sarcoEarly.includes("Possible") ? 'warning' : 'good', icon: AlertTriangle },
      ],
      recommendations: [
        { title: "Forearm Analysis", description: `Forearm ${r1(f)}cm. Frame: ${frameType}. Muscle density: ${muscleDensity}. Forearm size correlates with skeletal frame and grip strength.`, priority: 'medium', category: "Assessment" },
        { title: "Grip Strength", description: `Estimated grip: ${estimatedGrip}kg (${gripRating}). ${gripRating === "Weak" ? "Low grip → fall risk, reduced independence. Train with grip squeezers, dead hangs." : "Adequate grip strength."}`, priority: gripRating === "Weak" ? 'high' : 'low', category: "Grip" },
        { title: "Athlete Comparison", description: `Athletic muscularity index: ${r2(athleticIndex)}. Strength athletes (powerlifters, wrestlers) typically have higher forearm-to-bodyweight ratios.`, priority: 'medium', category: "Athletic" },
        { title: "Symmetry Mode", description: "Measure both forearms separately. Difference >1.5cm may indicate muscular imbalance from dominant-hand overuse.", priority: 'low', category: "Symmetry" },
        ...(sarcoEarly.includes("Possible") ? [{ title: "⚠️ Sarcopenia Signal", description: "Small forearm circumference can be an early indicator of systemic muscle loss. Recommend full body composition assessment.", priority: 'high' as const, category: "Clinical" }] : []),
      ],
      detailedBreakdown: {
        "Forearm": `${r1(f)} cm`, "Height": `${h} cm`, "Weight": `${wt} kg`,
        "Forearm/Height": forearmHeightRatio.toString(), "Frame": frameType,
        "Muscle Density": muscleDensity, "Est. Grip": `${estimatedGrip} kg (${gripRating})`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Forearm Circumference" value={forearm} onChange={setForearm} min={15} max={45} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Forearm Circumference Tracker"
      description="Evaluate upper limb muscle density, skeletal frame, grip strength correlation, and athlete muscularity index."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Forearm Circumference Tracker" description="Upper limb muscle density and grip strength analysis." categoryName="Body Measurements" />}
    />
  )
}

// ─── #23 Shoulder Width Calculator ──────────────────────────────────────
export function ShoulderWidthCalculator() {
  const [shoulder, setShoulder] = useState(44)
  const [height, setHeight] = useState(170)
  const [chest, setChest] = useState(100)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(shoulder, 25, 65)
    const h = clamp(height, 120, 230)
    const c = clamp(chest, 50, 180)

    const shoulderHeightRatio = r2(s / h)
    const upperFrameScore = r1((s + c / 2) / h * 100)

    // V-taper potential: shoulder vs estimated waist (heuristic from chest)
    const estWaist = c * 0.78  // rough estimate
    const vTaper = r2(s / (estWaist / 2))

    let frameType: string; let frameStatus: 'good' | 'warning' | 'danger'
    if (shoulderHeightRatio < 0.24) { frameType = "Narrow"; frameStatus = 'warning' }
    else if (shoulderHeightRatio <= 0.27) { frameType = "Medium"; frameStatus = 'good' }
    else { frameType = "Broad"; frameStatus = 'good' }

    const aestheticScore = Math.min(100, Math.round(shoulderHeightRatio * 350))
    const bbSymmetry = r1(s / (c * 0.44) * 100)

    // Posture imbalance hint
    const postureNote = shoulderHeightRatio < 0.24 ? "Narrow shoulders may indicate forward posture or underdeveloped deltoids." : shoulderHeightRatio > 0.29 ? "Broad frame — great genetic base for athletic upper body." : "Balanced shoulder structure."

    // Thoracic classification
    const thoracic = c > 110 ? "Barrel chest" : c > 95 ? "Athletic" : "Lean"

    setResult({
      primaryMetric: { label: "Shoulder/Height Ratio", value: shoulderHeightRatio, status: frameStatus, description: `${frameType} frame | Aesthetic: ${aestheticScore}%`, icon: Ruler },
      healthScore: aestheticScore,
      metrics: [
        { label: "Shoulder Width", value: r1(s), unit: "cm", status: frameStatus, icon: Ruler },
        { label: "Shoulder/Height", value: shoulderHeightRatio, status: frameStatus, icon: BarChart3 },
        { label: "Frame Type", value: frameType, status: frameStatus, icon: User },
        { label: "Upper Frame Score", value: `${upperFrameScore}%`, status: 'normal', icon: TrendingUp },
        { label: "V-Taper Potential", value: r2(vTaper), status: vTaper > 1.3 ? 'good' : 'warning', icon: Shield },
        { label: "BB Symmetry", value: `${bbSymmetry}%`, status: bbSymmetry > 90 ? 'good' : 'warning', icon: Activity },
        { label: "Thoracic Type", value: thoracic, status: 'normal', icon: User },
      ],
      recommendations: [
        { title: "Frame Classification", description: `Shoulder ${r1(s)}cm / Height ${h}cm = ${shoulderHeightRatio}. Frame: ${frameType}. ${postureNote}`, priority: 'medium', category: "Structure" },
        { title: "V-Taper Analysis", description: `V-taper score: ${r2(vTaper)}. Higher values indicate wider shoulders relative to waist — desirable for aesthetic and athletic physique. Improve with lateral raises, overhead press.`, priority: 'medium', category: "Aesthetics" },
        { title: "Bodybuilding Symmetry", description: `Symmetry score: ${bbSymmetry}% of ideal shoulder-chest proportion. Classic ratio: shoulders ~1.618× waist (golden ratio). Target: lateral delt, upper chest development.`, priority: 'medium', category: "Comparison" },
        { title: "Posture Impact", description: postureNote, priority: shoulderHeightRatio < 0.24 ? 'high' : 'low', category: "Posture" },
      ],
      detailedBreakdown: {
        "Shoulder": `${r1(s)} cm`, "Height": `${h} cm`, "Chest": `${c} cm`,
        "Shoulder/Height": shoulderHeightRatio.toString(), "Frame": frameType,
        "V-Taper": r2(vTaper).toString(), "Aesthetic Score": `${aestheticScore}%`,
        "Thoracic": thoracic,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Shoulder Width (biacromial)" value={shoulder} onChange={setShoulder} min={25} max={65} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Chest Circumference" value={chest} onChange={setChest} min={50} max={180} suffix="cm" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Shoulder Width Calculator"
      description="Evaluate skeletal width, upper body frame, V-taper potential, posture analysis, and bodybuilding symmetry score."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Shoulder Width Calculator" description="Upper body skeletal width and symmetry analysis." categoryName="Body Measurements" />}
    />
  )
}

// ─── #24 Torso Length Measurement ───────────────────────────────────────
export function TorsoLengthCalculator() {
  const [torso, setTorso] = useState(55)
  const [height, setHeight] = useState(170)
  const [legLength, setLegLength] = useState(82)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const t = clamp(torso, 30, 80)
    const h = clamp(height, 120, 230)
    const ll = clamp(legLength, 40, 130)

    const torsoRatio = r2(t / h)
    const legRatio = r2(ll / h)
    const upperLowerRatio = r2(t / ll)
    const proportionDiff = Math.abs(t - (h - ll))

    let propCat: string; let propStatus: 'good' | 'warning' | 'danger'
    if (torsoRatio >= 0.30 && torsoRatio <= 0.34) { propCat = "Balanced"; propStatus = 'good' }
    else if (torsoRatio > 0.34) { propCat = "Long Torso / Short Legs"; propStatus = 'warning' }
    else { propCat = "Short Torso / Long Legs"; propStatus = 'warning' }

    // Biomechanical leverage
    const leverageNote = torsoRatio > 0.34 ? "Better for: swimming, rowing, bench press. Natural advantage in pulling movements." : torsoRatio < 0.30 ? "Better for: running, cycling, squats. Longer legs = longer stride." : "Balanced leverage — versatile across sports."

    // Sport suitability
    const sportSuit = torsoRatio > 0.34 ? "Swimming, Rowing, Wrestling" : torsoRatio < 0.30 ? "Running, Basketball, Cycling" : "Versatile — suits most sports"

    // Spinal alert
    const spinalAlert = proportionDiff > 10

    setResult({
      primaryMetric: { label: "Torso/Height Ratio", value: torsoRatio, status: propStatus, description: propCat, icon: Ruler },
      healthScore: propStatus === 'good' ? 85 : 55,
      metrics: [
        { label: "Torso", value: r1(t), unit: "cm", status: 'normal', icon: Ruler },
        { label: "Torso/Height", value: torsoRatio, status: propStatus, icon: BarChart3 },
        { label: "Leg/Height", value: legRatio, status: 'normal', icon: Ruler },
        { label: "Upper/Lower Ratio", value: upperLowerRatio, status: upperLowerRatio >= 0.6 && upperLowerRatio <= 0.75 ? 'good' : 'warning', icon: Scale },
        { label: "Proportion Type", value: propCat, status: propStatus, icon: User },
        ...(spinalAlert ? [{ label: "⚠️ Spinal Check", value: "Torso+Leg ≠ Height", status: 'warning' as const, icon: AlertTriangle }] : []),
      ],
      recommendations: [
        { title: "Proportion Analysis", description: `Torso ${r1(t)}cm (${r2(torsoRatio * 100)}% of height) | Legs ${r1(ll)}cm (${r2(legRatio * 100)}%). Classification: ${propCat}.`, priority: 'medium', category: "Proportionality" },
        { title: "Biomechanical Leverage", description: leverageNote, priority: 'medium', category: "Biomechanics" },
        { title: "Sport Suitability", description: `Based on torso-leg proportions: ${sportSuit}. Longer torsos excel in upper-body pulling; longer legs excel in stride-based activities.`, priority: 'medium', category: "Athletic" },
        ...(spinalAlert ? [{ title: "⚠️ Spinal Imbalance Alert", description: `Torso (${r1(t)}cm) + Leg (${r1(ll)}cm) = ${r1(t + ll)}cm, but height is ${h}cm. Difference of ${r1(proportionDiff)}cm may indicate measurement error or postural issue.`, priority: 'high' as const, category: "Clinical" }] : []),
        { title: "Postural Alignment", description: `Upper-to-lower ratio: ${upperLowerRatio}. Ideal: 0.60-0.75. ${upperLowerRatio > 0.75 ? "Long torso may cause lower back strain — strengthen core." : upperLowerRatio < 0.6 ? "Short torso — focus on thoracic mobility." : "Balanced proportions."}`, priority: 'low', category: "Posture" },
      ],
      detailedBreakdown: {
        "Torso": `${r1(t)} cm`, "Leg Length": `${r1(ll)} cm`, "Height": `${h} cm`,
        "Torso/Height": torsoRatio.toString(), "Leg/Height": legRatio.toString(),
        "Upper/Lower": upperLowerRatio.toString(), "Proportion": propCat,
        "Sport Fit": sportSuit,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Torso Length" value={torso} onChange={setTorso} min={30} max={80} suffix="cm" />
      <NumInput label="Total Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Leg Length" value={legLength} onChange={setLegLength} min={40} max={130} suffix="cm" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Torso Length Measurement"
      description="Analyze body proportionality, biomechanical leverage, sport suitability, and spinal alignment from torso measurements."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Torso Length Measurement" description="Body proportionality and biomechanical analysis." categoryName="Body Measurements" />}
    />
  )
}

// ─── #25 Leg Length Calculator ───────────────────────────────────────────
export function LegLengthCalculator() {
  const [legLength, setLegLength] = useState(85)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(25)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ll = clamp(legLength, 40, 130)
    const h = clamp(height, 120, 230)
    const a = clamp(age, 5, 90)

    const legRatio = r2(ll / h)

    let cat: string; let catStatus: 'good' | 'warning' | 'danger'
    if (legRatio >= 0.45 && legRatio <= 0.52) { cat = "Normal Proportionality"; catStatus = 'good' }
    else if (legRatio > 0.52) { cat = "Long Legs (Dolichoskeletal)"; catStatus = 'good' }
    else { cat = "Short Legs (Brachyskeletal)"; catStatus = 'warning' }

    const sprintPotential = legRatio > 0.50 ? "High" : legRatio > 0.47 ? "Moderate" : "Lower"
    const asymmetryNote = "Measure both legs. Difference >1.5cm may require orthopedic assessment."
    const growthNote = a < 18 ? "Adolescent: leg-to-height ratio changes during growth spurts." : ""
    const orthoAlert = legRatio < 0.42 || legRatio > 0.56

    setResult({
      primaryMetric: { label: "Leg/Height Ratio", value: legRatio, status: catStatus, description: `${cat}${growthNote ? ` (${growthNote})` : ""}`, icon: Ruler },
      healthScore: catStatus === 'good' ? 82 : 50,
      metrics: [
        { label: "Leg Length", value: r1(ll), unit: "cm", status: 'normal', icon: Ruler },
        { label: "Leg/Height Ratio", value: legRatio, status: catStatus, icon: BarChart3 },
        { label: "Proportion", value: cat, status: catStatus, icon: User },
        { label: "Sprint Potential", value: sprintPotential, status: sprintPotential === "High" ? 'good' : 'normal', icon: TrendingUp },
        ...(orthoAlert ? [{ label: "⚠️ Orthopedic Flag", value: "Extreme ratio", status: 'danger' as const, icon: AlertTriangle }] : []),
      ],
      recommendations: [
        { title: "Proportion Analysis", description: `Leg ${r1(ll)}cm / Height ${h}cm = ${legRatio}. ${cat}. Normal range: 0.45-0.52.`, priority: 'medium', category: "Proportionality" },
        { title: "Sprint Indicator", description: `Sprint potential: ${sprintPotential}. Longer legs correlate with longer stride length — advantageous for running and jumping.`, priority: 'medium', category: "Performance" },
        { title: "Limb Asymmetry", description: asymmetryNote, priority: 'low', category: "Symmetry" },
        ...(orthoAlert ? [{ title: "⚠️ Discrepancy Alert", description: "Leg-to-height ratio is significantly outside normal range. May indicate growth disorder, limb length discrepancy, or measurement error. Consult orthopedic specialist.", priority: 'high' as const, category: "Clinical" }] : []),
        ...(a < 18 ? [{ title: "Growth Phase", description: `At age ${a}, leg growth may not yet be complete. Leg/height ratio typically stabilizes by age 16-18. Monitor annually.`, priority: 'medium' as const, category: "Growth" }] : []),
      ],
      detailedBreakdown: {
        "Leg Length": `${r1(ll)} cm`, "Height": `${h} cm`, "Age": `${a} years`,
        "Leg/Height": legRatio.toString(), "Category": cat,
        "Sprint Potential": sprintPotential,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Leg Length" value={legLength} onChange={setLegLength} min={40} max={130} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={5} max={90} suffix="years" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Leg Length Calculator"
      description="Evaluate lower body proportionality, sprint potential, limb asymmetry, and orthopedic screening."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Leg Length Calculator" description="Lower body proportionality and gait analysis." categoryName="Body Measurements" />}
    />
  )
}

// ─── #26 Sitting Height Ratio ───────────────────────────────────────────
export function SittingHeightRatioCalculator() {
  const [sittingHeight, setSittingHeight] = useState(88)
  const [height, setHeight] = useState(170)
  const [age, setAge] = useState(14)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const sh = clamp(sittingHeight, 40, 110)
    const h = clamp(height, 80, 230)
    const a = clamp(age, 3, 90)

    const shr = r2(sh / h)
    const legLength = h - sh
    const legRatio = r2(legLength / h)

    let growthPattern: string; let growthStatus: 'good' | 'warning' | 'danger'
    if (shr >= 0.50 && shr <= 0.54) { growthPattern = "Normal"; growthStatus = 'good' }
    else if (shr > 0.54) { growthPattern = "Trunk-dominant (short legs relative)"; growthStatus = 'warning' }
    else { growthPattern = "Limb-dominant (long legs relative)"; growthStatus = 'good' }

    const isChild = a < 18
    const devAlert = (isChild && (shr > 0.58 || shr < 0.46))
    const maturationHint = isChild ? (shr > 0.54 ? "May indicate delayed limb growth or early maturation" : "Normal developmental pattern") : "Adult ratio stabilized"

    // Percentile (simplified)
    let percentile: string
    if (shr < 0.49) percentile = ">75th (long legs)"
    else if (shr <= 0.52) percentile = "25th-75th (average)"
    else if (shr <= 0.55) percentile = "10th-25th (short legs)"
    else percentile = "<10th (very short legs)"

    setResult({
      primaryMetric: { label: "Sitting Height Ratio", value: shr, status: growthStatus, description: growthPattern, icon: Ruler },
      healthScore: growthStatus === 'good' ? 82 : 50,
      metrics: [
        { label: "Sitting Height", value: r1(sh), unit: "cm", status: 'normal', icon: Ruler },
        { label: "SH Ratio", value: shr, status: growthStatus, icon: BarChart3 },
        { label: "Leg Length (calc)", value: r1(legLength), unit: "cm", status: 'normal', icon: Ruler },
        { label: "Growth Pattern", value: growthPattern, status: growthStatus, icon: User },
        { label: "Percentile Est.", value: percentile, status: 'normal', icon: TrendingUp },
        ...(devAlert ? [{ label: "⚠️ Dev. Alert", value: "Abnormal ratio", status: 'danger' as const, icon: AlertTriangle }] : []),
      ],
      recommendations: [
        { title: "Ratio Interpretation", description: `Sitting height ${r1(sh)}cm / Total ${h}cm = ${shr}. Growth pattern: ${growthPattern}. Normal adult range: 0.50-0.54.`, priority: 'medium', category: "Analysis" },
        { title: "Maturation Hint", description: maturationHint, priority: isChild ? 'high' : 'low', category: "Development" },
        { title: "Growth Percentile", description: `Estimated percentile: ${percentile}. Lower SHR = relatively longer legs. Higher SHR = relatively longer torso.`, priority: 'medium', category: "Percentile" },
        ...(devAlert ? [{ title: "⚠️ Developmental Abnormality", description: "Sitting height ratio is significantly outside normal range for this age. May indicate skeletal dysplasia, rickets, or growth hormone issues. Consult pediatric endocrinologist.", priority: 'high' as const, category: "Clinical" }] : []),
        ...(isChild ? [{ title: "Growth Tracking", description: `At age ${a}, SHR typically decreases as legs grow faster than trunk during puberty. Monitor every 6-12 months.`, priority: 'medium' as const, category: "Tracking" }] : []),
      ],
      detailedBreakdown: {
        "Sitting Height": `${r1(sh)} cm`, "Total Height": `${h} cm`, "Calc. Leg Length": `${r1(legLength)} cm`,
        "SH Ratio": shr.toString(), "Leg/Height": legRatio.toString(),
        "Pattern": growthPattern, "Percentile": percentile, "Age": `${a} years`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Sitting Height" value={sittingHeight} onChange={setSittingHeight} min={40} max={110} suffix="cm" />
      <NumInput label="Total Height" value={height} onChange={setHeight} min={80} max={230} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={3} max={90} suffix="years" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Sitting Height Ratio Calculator"
      description="Evaluate spinal vs limb growth pattern, developmental staging, percentile mapping, and skeletal maturation."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Sitting Height Ratio Calculator" description="Spinal vs limb growth pattern analysis." categoryName="Body Measurements" />}
    />
  )
}

// ─── #27 BMI Prime Calculator ───────────────────────────────────────────
export function BMIPrimeCalculator() {
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [ethnicity, setEthnicity] = useState("general")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 120, 230) / 100
    const wt = clamp(weight, 25, 350)

    const bmi = wt / (h * h)
    const cutoff = ethnicity === "asian" ? 23 : 25
    const bmiPrime = r2(bmi / cutoff)

    let cat: string; let catStatus: 'good' | 'warning' | 'danger'
    if (bmiPrime < 0.74) { cat = "Underweight"; catStatus = 'warning' }
    else if (bmiPrime <= 1.0) { cat = "Normal"; catStatus = 'good' }
    else if (bmiPrime <= 1.2) { cat = "Overweight"; catStatus = 'warning' }
    else { cat = "Obese"; catStatus = 'danger' }

    const riskMultiplier = r2(Math.pow(bmiPrime, 2.5))
    const distFromOptimal = r1((bmiPrime - 1.0) * cutoff)
    const weightToLose = bmiPrime > 1.0 ? r1((bmi - cutoff) * h * h) : 0
    const obesitySeverity = bmiPrime > 1.4 ? "Severe (Class II+)" : bmiPrime > 1.2 ? "Moderate (Class I)" : bmiPrime > 1.0 ? "Mild" : "N/A"

    const metabolicAdj = ethnicity === "asian" ? "Asian cutoff applied (23 vs 25) — higher metabolic risk at lower BMI" : "Standard WHO cutoff (25)"

    setResult({
      primaryMetric: { label: "BMI Prime", value: bmiPrime, status: catStatus, description: `${cat} | ${distFromOptimal >= 0 ? "+" : ""}${distFromOptimal} BMI from optimal`, icon: Scale },
      healthScore: catStatus === 'good' ? 85 : catStatus === 'warning' ? 50 : 20,
      metrics: [
        { label: "BMI Prime", value: bmiPrime, status: catStatus, icon: Scale },
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: catStatus, icon: BarChart3 },
        { label: "Risk Multiplier", value: `${riskMultiplier}×`, status: riskMultiplier < 1.2 ? 'good' : riskMultiplier < 1.6 ? 'warning' : 'danger', icon: AlertTriangle },
        { label: "From Optimal", value: `${distFromOptimal >= 0 ? "+" : ""}${distFromOptimal}`, status: Math.abs(distFromOptimal) < 2 ? 'good' : 'warning', icon: TrendingUp },
        { label: "Category", value: cat, status: catStatus, icon: User },
        ...(weightToLose > 0 ? [{ label: "Weight Target", value: `-${r1(weightToLose)} kg`, status: 'warning' as const, icon: Heart }] : []),
        ...(bmiPrime > 1.2 ? [{ label: "Obesity Severity", value: obesitySeverity, status: 'danger' as const, icon: Shield }] : []),
      ],
      recommendations: [
        { title: "BMI Prime Explained", description: `BMI Prime = BMI / cutoff (${cutoff}). Value of 1.0 = exactly at cutoff. Your ${bmiPrime}: ${cat}. ${metabolicAdj}.`, priority: 'medium', category: "Understanding" },
        { title: "Distance from Optimal", description: `${distFromOptimal >= 0 ? "+" : ""}${distFromOptimal} BMI units from optimal cutoff. ${weightToLose > 0 ? `Need to lose ~${r1(weightToLose)}kg to reach BMI ${cutoff}.` : "At or below optimal BMI."}`, priority: weightToLose > 0 ? 'high' : 'low', category: "Target" },
        { title: "Risk Multiplier", description: `Metabolic risk multiplier: ${riskMultiplier}×. This exponential scale amplifies at higher BMI Prime — small reductions yield disproportionate health benefits.`, priority: 'medium', category: "Risk" },
        ...(bmiPrime > 1.2 ? [{ title: "Obesity Management", description: `Severity: ${obesitySeverity}. Target: BMI Prime ≤ 1.0. Reduce 0.5-1kg/week through caloric deficit + resistance training.`, priority: 'high' as const, category: "Action" }] : []),
        { title: "Weight Simulation", description: weightToLose > 0 ? `Losing ${r1(weightToLose)}kg → BMI Prime 1.0. At 0.5kg/week = ~${Math.round(weightToLose / 0.5)} weeks. At 1kg/week = ~${Math.round(weightToLose)} weeks.` : "Already at or below target.", priority: 'medium', category: "Simulation" },
      ],
      detailedBreakdown: {
        "Height": `${r1(h * 100)} cm`, "Weight": `${r1(wt)} kg`, "BMI": `${r1(bmi)}`,
        "Cutoff": `${cutoff}`, "BMI Prime": bmiPrime.toString(),
        "Risk Multiplier": `${riskMultiplier}×`, "Category": cat,
        "Weight to Target": weightToLose > 0 ? `${r1(weightToLose)} kg` : "At target",
        "Ethnicity Adj.": metabolicAdj,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
      <SelectInput label="Ethnicity Cutoff" value={ethnicity} onChange={setEthnicity} options={[{ value: "general", label: "General (WHO: 25)" }, { value: "asian", label: "Asian (WHO: 23)" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="BMI Prime Calculator"
      description="Compare BMI against standardized reference cutoff. Includes risk multiplier, obesity severity, weight reduction simulation, and ethnic adjustment."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="BMI Prime Calculator" description="BMI standardized reference comparison with ethnic adjustment." categoryName="Body Measurements" />}
    />
  )
}

// ─── #28 Corpulence Index (CI) ──────────────────────────────────────────
export function CorpulenceIndexCalculator() {
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 120, 230) / 100
    const wt = clamp(weight, 25, 350)

    const ci = wt / Math.pow(h, 3)
    const bmi = wt / (h * h)
    const pi = wt / Math.pow(h, 3) // same as CI for Rohrer's index

    let cat: string; let catStatus: 'good' | 'warning' | 'danger'
    if (ci < 11) { cat = "Lean / Ectomorphic"; catStatus = 'warning' }
    else if (ci <= 15) { cat = "Normal / Mesomorphic"; catStatus = 'good' }
    else if (ci <= 18) { cat = "Stocky / Endomorphic"; catStatus = 'warning' }
    else { cat = "Very Heavy build"; catStatus = 'danger' }

    const bmiCat = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese"
    const ciVsBmi = Math.abs(ci - bmi) > 5 ? "Significant divergence — height is distorting BMI" : "CI & BMI are concordant"

    const mortalityHint = ci > 18 ? "Elevated all-cause mortality correlation" : ci < 10 ? "Low CI may indicate undernutrition risk" : "Normal mortality risk range"

    setResult({
      primaryMetric: { label: "Corpulence Index", value: r2(ci), unit: "kg/m³", status: catStatus, description: cat, icon: Scale },
      healthScore: catStatus === 'good' ? 82 : catStatus === 'warning' ? 50 : 25,
      metrics: [
        { label: "CI (Rohrer)", value: r2(ci), unit: "kg/m³", status: catStatus, icon: Scale },
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: bmi >= 18.5 && bmi < 25 ? 'good' : 'warning', icon: BarChart3 },
        { label: "Body Type", value: cat, status: catStatus, icon: User },
        { label: "CI vs BMI", value: ciVsBmi.includes("Significant") ? "Divergent" : "Concordant", status: ciVsBmi.includes("Significant") ? 'warning' : 'good', icon: AlertTriangle },
        { label: "Mortality Hint", value: mortalityHint.includes("Elevated") ? "Elevated" : mortalityHint.includes("undernutrition") ? "Low-end risk" : "Normal", status: mortalityHint.includes("Normal") ? 'good' : 'warning', icon: Heart },
      ],
      recommendations: [
        { title: "CI Interpretation", description: `Corpulence Index ${r2(ci)} kg/m³ = weight/height³. Classification: ${cat}. CI penalizes height less than BMI, making it more accurate for very tall or short individuals.`, priority: 'medium', category: "Analysis" },
        { title: "BMI & PI Comparison", description: `BMI: ${r1(bmi)} (${bmiCat}) | CI/PI: ${r2(ci)}. ${ciVsBmi}. For extreme heights (>190cm or <155cm), CI is more proportionally accurate.`, priority: 'medium', category: "Comparison" },
        { title: "Extreme Body Type", description: `${h * 100 > 190 ? "Tall correction: CI reduces the height penalty that BMI amplifies. More reliable for your height." : h * 100 < 155 ? "Short correction: CI avoids BMI inflation common in shorter individuals." : "Standard height range — BMI and CI should be similar."}`, priority: 'low', category: "Correction" },
        { title: "Mortality Correlation", description: mortalityHint, priority: mortalityHint.includes("Elevated") ? 'high' : 'low', category: "Risk" },
      ],
      detailedBreakdown: {
        "Height": `${r1(h * 100)} cm`, "Weight": `${r1(wt)} kg`,
        "CI": `${r2(ci)} kg/m³`, "BMI": `${r1(bmi)} kg/m²`,
        "Body Type": cat, "CI vs BMI": ciVsBmi,
        "Formula": "weight / height³",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Corpulence Index Calculator"
      description="Height-adjusted body mass proportionality using Rohrer's formula. Includes BMI/PI comparison, extreme body type correction, and mortality hint."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Corpulence Index Calculator" description="Alternative body mass evaluation with height³ correction." categoryName="Body Measurements" />}
    />
  )
}

// ─── #29 Body Roundness Index (BRI) ─────────────────────────────────────
export function BodyRoundnessIndexCalculator() {
  const [height, setHeight] = useState(170)
  const [waist, setWaist] = useState(84)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 120, 230)
    const w = clamp(waist, 30, 200)

    const eccentricity = Math.sqrt(1 - Math.pow((w / (2 * Math.PI)) / (0.5 * h), 2))
    const bri = r2(364.2 - 365.5 * eccentricity)
    const roundnessPercent = Math.min(100, Math.max(0, Math.round(bri * 8)))

    let riskBand: string; let riskStatus: 'good' | 'warning' | 'danger'
    if (bri < 3.4) { riskBand = "Low Risk"; riskStatus = 'good' }
    else if (bri < 6.9) { riskBand = "Moderate Risk"; riskStatus = 'warning' }
    else { riskBand = "High Risk"; riskStatus = 'danger' }

    const visceralFatProb = bri > 6.9 ? "High" : bri > 4.5 ? "Moderate" : "Low"
    const diabetesProb = bri > 6.0 ? "Elevated (~2-3× baseline)" : bri > 4.0 ? "Slightly elevated" : "Near baseline"
    const cvdRisk = bri > 6.5 ? "Significantly elevated" : bri > 4.0 ? "Mildly elevated" : "Low"

    setResult({
      primaryMetric: { label: "Body Roundness Index", value: bri, status: riskStatus, description: `${riskBand} | Roundness: ${roundnessPercent}%`, icon: Activity },
      healthScore: riskStatus === 'good' ? 85 : riskStatus === 'warning' ? 50 : 20,
      metrics: [
        { label: "BRI", value: bri, status: riskStatus, icon: Activity },
        { label: "Roundness %", value: `${roundnessPercent}%`, status: riskStatus, icon: BarChart3 },
        { label: "Risk Band", value: riskBand, status: riskStatus, icon: Shield },
        { label: "Visceral Fat", value: visceralFatProb, status: visceralFatProb === "Low" ? 'good' : visceralFatProb === "Moderate" ? 'warning' : 'danger', icon: AlertTriangle },
        { label: "Diabetes Risk", value: diabetesProb.includes("Elevated") ? "Elevated" : diabetesProb.includes("Slightly") ? "Mild" : "Low", status: diabetesProb.includes("Elevated") ? 'danger' : diabetesProb.includes("Slightly") ? 'warning' : 'good', icon: Heart },
        { label: "CVD Risk", value: cvdRisk.includes("Significantly") ? "High" : cvdRisk.includes("Mildly") ? "Mild" : "Low", status: cvdRisk.includes("Significantly") ? 'danger' : cvdRisk.includes("Mildly") ? 'warning' : 'good', icon: Heart },
      ],
      recommendations: [
        { title: "BRI Interpretation", description: `BRI ${bri} based on height ${h}cm and waist ${w}cm. BRI uses body eccentricity to model how "round" the body is. Higher BRI = more central fat.`, priority: 'medium', category: "Understanding" },
        { title: "Visceral Fat", description: `Visceral fat probability: ${visceralFatProb}. BRI strongly correlates with DEXA-measured visceral adipose tissue. ${visceralFatProb === "High" ? "Waist reduction is critical." : "Maintain current waist circumference."}`, priority: visceralFatProb === "High" ? 'high' : 'low', category: "Fat" },
        { title: "Diabetes Probability", description: `${diabetesProb}. BRI > 6.0 is associated with 2-3× higher Type 2 diabetes incidence. Target BRI < 4.0 for optimal metabolic health.`, priority: diabetesProb.includes("Elevated") ? 'high' : 'medium', category: "Diabetes" },
        { title: "Cardiovascular Risk", description: `${cvdRisk}. Central obesity (high BRI) is an independent cardiovascular risk factor. Every 2cm waist reduction lowers BRI by ~0.3-0.5 points.`, priority: cvdRisk.includes("Significantly") ? 'high' : 'low', category: "Heart" },
        { title: "Waist Reduction Impact", description: `Current waist: ${w}cm. Target waist for BRI <3.4: ~${Math.max(60, w - Math.round((bri - 3.4) * 3))}cm. Achievable with caloric deficit + 150min/week moderate exercise.`, priority: bri > 3.4 ? 'high' : 'low', category: "Action" },
      ],
      detailedBreakdown: {
        "Height": `${h} cm`, "Waist": `${w} cm`, "BRI": bri.toString(),
        "Roundness %": `${roundnessPercent}%`, "Eccentricity": r2(eccentricity).toString(),
        "Risk Band": riskBand, "Visceral Fat": visceralFatProb,
        "Diabetes Risk": diabetesProb, "CVD Risk": cvdRisk,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Waist Circumference" value={waist} onChange={setWaist} min={30} max={200} suffix="cm" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Body Roundness Index (BRI) Calculator"
      description="Estimate visceral fat and body roundness. Includes diabetes probability, cardiovascular risk, and waist reduction impact simulation."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Body Roundness Index (BRI) Calculator" description="Visceral fat and body roundness estimation." categoryName="Body Measurements" />}
    />
  )
}

// ─── #30 Conicity Index Calculator ──────────────────────────────────────
export function ConicityIndexCalculator() {
  const [waist, setWaist] = useState(84)
  const [weight, setWeight] = useState(72)
  const [height, setHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const w = clamp(waist, 30, 200) / 100 // meters
    const wt = clamp(weight, 25, 350)
    const h = clamp(height, 120, 230) / 100 // meters

    const conicity = r2(w / (0.109 * Math.sqrt(wt / h)))
    const bmi = wt / (h * h)

    let fatClass: string; let fatStatus: 'good' | 'warning' | 'danger'
    if (conicity < 1.15) { fatClass = "Low central fat"; fatStatus = 'good' }
    else if (conicity < 1.25) { fatClass = "Moderate central fat"; fatStatus = 'warning' }
    else { fatClass = "High central fat"; fatStatus = 'danger' }

    const metSyndromeProb = conicity > 1.25 ? "High (>60%)" : conicity > 1.18 ? "Moderate (30-60%)" : "Low (<30%)"
    const heartCorrelation = conicity > 1.25 ? "Strong positive correlation with CHD" : conicity > 1.15 ? "Mild association" : "Low association"

    // Combined BMI + Conicity risk
    let combinedRisk: string; let combinedStatus: 'good' | 'warning' | 'danger'
    if (bmi > 30 && conicity > 1.25) { combinedRisk = "Very High (obese + high central fat)"; combinedStatus = 'danger' }
    else if (bmi > 25 || conicity > 1.25) { combinedRisk = "Elevated"; combinedStatus = 'warning' }
    else { combinedRisk = "Low"; combinedStatus = 'good' }

    setResult({
      primaryMetric: { label: "Conicity Index", value: conicity, status: fatStatus, description: fatClass, icon: Activity },
      healthScore: fatStatus === 'good' ? 85 : fatStatus === 'warning' ? 50 : 20,
      metrics: [
        { label: "Conicity Index", value: conicity, status: fatStatus, icon: Activity },
        { label: "Abdominal Fat", value: fatClass, status: fatStatus, icon: BarChart3 },
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: bmi < 25 ? 'good' : 'warning', icon: Scale },
        { label: "Met. Syndrome", value: metSyndromeProb.includes("High") ? "High" : metSyndromeProb.includes("Moderate") ? "Moderate" : "Low", status: metSyndromeProb.includes("High") ? 'danger' : metSyndromeProb.includes("Moderate") ? 'warning' : 'good', icon: AlertTriangle },
        { label: "Heart Disease", value: heartCorrelation.includes("Strong") ? "High" : heartCorrelation.includes("Mild") ? "Mild" : "Low", status: heartCorrelation.includes("Strong") ? 'danger' : heartCorrelation.includes("Mild") ? 'warning' : 'good', icon: Heart },
        { label: "Combined Risk", value: combinedRisk.includes("Very") ? "Very High" : combinedRisk.includes("Elevated") ? "Elevated" : "Low", status: combinedStatus, icon: Shield },
      ],
      recommendations: [
        { title: "Conicity Index", description: `CI ${conicity}. Formula models the body as a cone — higher values mean more abdominal fat concentration. ${fatClass}.`, priority: 'medium', category: "Understanding" },
        { title: "Metabolic Syndrome Risk", description: `Probability: ${metSyndromeProb}. Conicity > 1.25 is strongly associated with metabolic syndrome (hypertension + dyslipidemia + insulin resistance).`, priority: metSyndromeProb.includes("High") ? 'high' : 'medium', category: "MetS" },
        { title: "Heart Disease Correlation", description: `${heartCorrelation}. Conicity index predicts coronary heart disease independently of BMI. Waist reduction directly improves this metric.`, priority: heartCorrelation.includes("Strong") ? 'high' : 'low', category: "Cardiac" },
        { title: "BMI + Conicity Combined", description: `BMI ${r1(bmi)} + Conicity ${conicity} = ${combinedRisk} combined risk. ${combinedRisk.includes("Very") ? "Urgent: simultaneous weight loss + waist reduction needed." : combinedRisk.includes("Elevated") ? "Monitor and improve one or both metrics." : "Both metrics in healthy range."}`, priority: combinedStatus === 'danger' ? 'high' : 'medium', category: "Combined" },
        { title: "Reduction Progress", description: `Target: Conicity < 1.15. Current: ${conicity}. ${conicity > 1.15 ? `Need ~${Math.round((conicity - 1.15) * 80)}cm waist reduction. Focus: core exercises, caloric deficit, fiber-rich diet.` : "Already in optimal range — maintain."}`, priority: conicity > 1.15 ? 'high' : 'low', category: "Action" },
      ],
      detailedBreakdown: {
        "Waist": `${clamp(waist, 30, 200)} cm`, "Weight": `${wt} kg`, "Height": `${clamp(height, 120, 230)} cm`,
        "Conicity": conicity.toString(), "BMI": `${r1(bmi)}`, "Fat Class": fatClass,
        "Met. Syndrome Prob": metSyndromeProb, "Heart Correlation": heartCorrelation,
        "Combined Risk": combinedRisk,
        "Formula": "WC / (0.109 × √(weight/height))",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Waist Circumference" value={waist} onChange={setWaist} min={30} max={200} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={25} max={350} suffix="kg" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Conicity Index Calculator"
      description="Evaluate abdominal fat concentration, metabolic syndrome probability, heart disease correlation, and BMI combined risk."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Conicity Index Calculator" description="Abdominal fat concentration and metabolic risk evaluation." categoryName="Body Measurements" />}
    />
  )
}
// ==================== #31 — SAGITTAL ABDOMINAL DIAMETER (SAD) ====================
export function SagittalAbdominalDiameterCalculator() {
  const [sad, setSad] = useState(22)
  const [waist, setWaist] = useState(85)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const s = clamp(sad, 10, 50)
    const w = clamp(waist, 50, 200)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 30, 300)
    const a = clamp(age, 18, 99)
    const hm = h / 100
    const bmi = wt / (hm * hm)

    // SAD classification
    let sadClass: string; let sadStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (s < 22) { sadClass = "Normal"; sadStatus = 'good' }
      else if (s < 25) { sadClass = "Elevated"; sadStatus = 'warning' }
      else { sadClass = "High — visceral obesity"; sadStatus = 'danger' }
    } else {
      if (s < 20) { sadClass = "Normal"; sadStatus = 'good' }
      else if (s < 23) { sadClass = "Elevated"; sadStatus = 'warning' }
      else { sadClass = "High — visceral obesity"; sadStatus = 'danger' }
    }

    // Visceral fat risk
    const visceralRisk = s > 25 ? "High visceral adiposity" : s > 22 ? "Moderate visceral fat" : "Low visceral fat"
    const visceralStatus: 'good' | 'warning' | 'danger' = s > 25 ? 'danger' : s > 22 ? 'warning' : 'good'

    // Central obesity grade
    const sadWaistRatio = r2(s / (w / Math.PI))
    let centralGrade: string; let centralStatus: 'good' | 'warning' | 'danger'
    if (sadWaistRatio < 0.7) { centralGrade = "Grade 0 — No central obesity"; centralStatus = 'good' }
    else if (sadWaistRatio < 0.8) { centralGrade = "Grade I — Mild"; centralStatus = 'warning' }
    else { centralGrade = "Grade II — Severe"; centralStatus = 'danger' }

    // SAD vs Waist comparison
    const expectedSAD = r1(w / Math.PI)
    const sadDeviation = r1(s - expectedSAD)

    // Diabetes probability estimate (based on SAD research)
    let diabetesProb: string; let diabetesStatus: 'good' | 'warning' | 'danger'
    if (s > 25 && a > 45) { diabetesProb = "High (>40%)"; diabetesStatus = 'danger' }
    else if (s > 22 || (s > 20 && a > 50)) { diabetesProb = "Moderate (15-40%)"; diabetesStatus = 'warning' }
    else { diabetesProb = "Low (<15%)"; diabetesStatus = 'good' }

    // CVD risk multiplier
    const cvdMultiplier = s > 25 ? r1(1.8 + (s - 25) * 0.15) : s > 22 ? r1(1.2 + (s - 22) * 0.2) : 1.0
    const cvdStatus: 'good' | 'warning' | 'danger' = cvdMultiplier > 1.8 ? 'danger' : cvdMultiplier > 1.2 ? 'warning' : 'good'

    // BMI + SAD integrated risk
    let integratedRisk: string; let integratedStatus: 'good' | 'warning' | 'danger'
    if (bmi > 30 && s > 25) { integratedRisk = "Critical — obese + high SAD"; integratedStatus = 'danger' }
    else if (bmi > 25 && s > 22) { integratedRisk = "Elevated — overweight + elevated SAD"; integratedStatus = 'warning' }
    else if (bmi > 30 || s > 25) { integratedRisk = "Moderate — one metric high"; integratedStatus = 'warning' }
    else { integratedRisk = "Low"; integratedStatus = 'good' }

    const score = sadStatus === 'good' ? 88 : sadStatus === 'warning' ? 52 : 18

    setResult({
      primaryMetric: { label: "SAD", value: s, unit: "cm", status: sadStatus, description: sadClass, icon: Ruler },
      healthScore: score,
      metrics: [
        { label: "SAD", value: `${s} cm`, status: sadStatus, icon: Ruler },
        { label: "Visceral Risk", value: visceralRisk.split(" ")[0], status: visceralStatus, icon: AlertTriangle },
        { label: "Central Obesity", value: centralGrade.split("—")[0].trim(), status: centralStatus, icon: Activity },
        { label: "SAD/Waist Ratio", value: sadWaistRatio, status: centralStatus, icon: BarChart3 },
        { label: "CVD Multiplier", value: `${cvdMultiplier}×`, status: cvdStatus, icon: Heart },
        { label: "Diabetes Risk", value: diabetesProb.split("(")[0].trim(), status: diabetesStatus, icon: Shield },
        { label: "BMI", value: r1(bmi), unit: "kg/m²", status: bmi < 25 ? 'good' : bmi < 30 ? 'warning' : 'danger', icon: Scale },
        { label: "Integrated Risk", value: integratedRisk.split("—")[0].trim(), status: integratedStatus, icon: TrendingUp },
      ],
      recommendations: [
        { title: "SAD Assessment", description: `SAD ${s} cm → ${sadClass}. ${gender === 'male' ? 'Males: <22 normal, 22-25 elevated, >25 high.' : 'Females: <20 normal, 20-23 elevated, >23 high.'} SAD measures anterior-posterior abdominal depth at L4-L5 vertebrae.`, priority: sadStatus === 'danger' ? 'high' : 'medium', category: "Assessment" },
        { title: "Visceral Fat Analysis", description: `${visceralRisk}. SAD is the strongest anthropometric predictor of visceral adipose tissue (VAT), outperforming waist circumference and BMI in DEXA validation studies.`, priority: visceralStatus === 'danger' ? 'high' : 'medium', category: "Visceral" },
        { title: "SAD vs Waist Comparison", description: `Expected SAD for your waist (${w} cm): ~${expectedSAD} cm. Your SAD is ${sadDeviation > 0 ? '+' : ''}${sadDeviation} cm from expected. ${sadDeviation > 2 ? "Higher SAD suggests deeper visceral fat deposits." : sadDeviation < -2 ? "Lower SAD suggests more subcutaneous distribution." : "SAD consistent with waist circumference."}`, priority: 'medium', category: "Comparison" },
        { title: "Diabetes Probability", description: `Type 2 diabetes risk: ${diabetesProb}. Research shows SAD > 25 cm increases T2DM risk 3-4× in adults over 45. ${s > 25 ? "Urgent: SAD reduction through visceral fat loss recommended." : "Maintain current levels."}`, priority: diabetesStatus === 'danger' ? 'high' : 'medium', category: "Metabolic" },
        { title: "Cardiovascular Risk", description: `CVD risk multiplier: ${cvdMultiplier}×. SAD independently predicts cardiovascular events. ${cvdMultiplier > 1.5 ? "High priority: combine aerobic exercise (150+ min/week) with Mediterranean diet pattern." : "Continue preventive lifestyle habits."}`, priority: cvdStatus === 'danger' ? 'high' : 'low', category: "Cardiac" },
        { title: "BMI + SAD Integration", description: `BMI ${r1(bmi)} + SAD ${s} cm = ${integratedRisk}. ${integratedStatus === 'danger' ? "Both metrics indicate high risk. Combined intervention needed." : integratedStatus === 'warning' ? "One or both slightly elevated. Monitor quarterly." : "Both in healthy range."}`, priority: integratedStatus === 'danger' ? 'high' : 'medium', category: "Combined" },
      ],
      detailedBreakdown: {
        "SAD": `${s} cm`, "Waist": `${w} cm`, "Height": `${h} cm`, "Weight": `${wt} kg`,
        "Age": `${a}`, "Gender": gender, "BMI": `${r1(bmi)}`,
        "SAD Classification": sadClass, "Visceral Risk": visceralRisk,
        "Central Obesity Grade": centralGrade, "SAD/Waist Ratio": `${sadWaistRatio}`,
        "Expected SAD": `${expectedSAD} cm`, "SAD Deviation": `${sadDeviation} cm`,
        "Diabetes Probability": diabetesProb, "CVD Multiplier": `${cvdMultiplier}×`,
        "Integrated Risk": integratedRisk,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="SAD (Sagittal Diameter)" value={sad} onChange={setSad} min={10} max={50} suffix="cm" />
      <NumInput label="Waist Circumference" value={waist} onChange={setWaist} min={50} max={200} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={99} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Sagittal Abdominal Diameter Calculator"
      description="Evaluate visceral fat risk, central obesity grade, diabetes probability, CVD multiplier, and BMI-integrated risk assessment."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Sagittal Abdominal Diameter Calculator" description="Advanced visceral adiposity assessment via SAD measurement." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #32 — WRIST CIRCUMFERENCE ====================
export function WristCircumferenceCalculator() {
  const [wrist, setWrist] = useState(17)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const wr = clamp(wrist, 10, 30)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 30, 300)
    const hm = h / 100
    const bmi = wt / (hm * hm)

    // Frame size classification (Elbow breadth alternative via wrist)
    const ratio = r2(h / wr)
    let frameSize: string; let frameStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (ratio > 10.4) { frameSize = "Small frame"; frameStatus = 'good' }
      else if (ratio >= 9.6) { frameSize = "Medium frame"; frameStatus = 'good' }
      else { frameSize = "Large frame"; frameStatus = 'warning' }
    } else {
      if (ratio > 11.0) { frameSize = "Small frame"; frameStatus = 'good' }
      else if (ratio >= 10.1) { frameSize = "Medium frame"; frameStatus = 'good' }
      else { frameSize = "Large frame"; frameStatus = 'warning' }
    }

    // Ideal weight adjustment based on frame
    const baseIdeal = gender === "male" ? 50 + 0.91 * (h - 152.4) : 45.5 + 0.91 * (h - 152.4)
    let idealAdj: number
    if (frameSize.includes("Small")) idealAdj = r1(baseIdeal * 0.9)
    else if (frameSize.includes("Large")) idealAdj = r1(baseIdeal * 1.1)
    else idealAdj = r1(baseIdeal)
    const weightDiff = r1(wt - idealAdj)

    // Skeletal Robustness Score
    const robustness = r2(wr * wr / (h / 100))
    let robustnessClass: string; let robustnessStatus: 'good' | 'warning' | 'danger'
    if (robustness < 2.5) { robustnessClass = "Light skeleton"; robustnessStatus = 'warning' }
    else if (robustness < 3.5) { robustnessClass = "Average skeleton"; robustnessStatus = 'good' }
    else { robustnessClass = "Dense skeleton"; robustnessStatus = 'good' }

    // Wrist-to-height ratio percentile
    const whrPercentile = gender === "male"
      ? wr < 16 ? 15 : wr < 17 ? 35 : wr < 18 ? 55 : wr < 19 ? 75 : 90
      : wr < 14 ? 15 : wr < 15 ? 35 : wr < 16 ? 55 : wr < 17 ? 75 : 90

    // Bone density risk hint
    let boneRisk: string; let boneStatus: 'good' | 'warning' | 'danger'
    if (wr < (gender === "male" ? 15 : 13)) { boneRisk = "Below average — osteopenia screening suggested"; boneStatus = 'warning' }
    else if (wr < (gender === "male" ? 16 : 14.5)) { boneRisk = "Slightly below average"; boneStatus = 'warning' }
    else { boneRisk = "Average or above — favorable bone structure"; boneStatus = 'good' }

    const score = frameStatus === 'good' ? 82 : 60

    setResult({
      primaryMetric: { label: "Frame Size", value: ratio, status: frameStatus, description: frameSize, icon: Ruler },
      healthScore: score,
      metrics: [
        { label: "Wrist", value: `${wr} cm`, status: 'good', icon: Ruler },
        { label: "Frame Size", value: frameSize.split(" ")[0], status: frameStatus, icon: User },
        { label: "H/Wrist Ratio", value: ratio, status: frameStatus, icon: BarChart3 },
        { label: "Ideal Weight", value: `${idealAdj} kg`, status: Math.abs(weightDiff) < 5 ? 'good' : 'warning', icon: Scale },
        { label: "Weight Diff", value: `${weightDiff > 0 ? '+' : ''}${weightDiff} kg`, status: Math.abs(weightDiff) < 5 ? 'good' : Math.abs(weightDiff) < 10 ? 'warning' : 'danger', icon: TrendingUp },
        { label: "Robustness", value: robustness, status: robustnessStatus, icon: Shield },
        { label: "Percentile", value: `${whrPercentile}th`, status: 'good', icon: Activity },
        { label: "Bone Density", value: boneRisk.split("—")[0].trim(), status: boneStatus, icon: Heart },
      ],
      recommendations: [
        { title: "Frame Size Classification", description: `Height/Wrist ratio ${ratio} → ${frameSize}. ${gender === 'male' ? 'Male: >10.4 small, 9.6-10.4 medium, <9.6 large.' : 'Female: >11.0 small, 10.1-11.0 medium, <10.1 large.'} Frame size affects ideal weight targets.`, priority: 'medium', category: "Frame" },
        { title: "Ideal Weight Adjustment", description: `Frame-adjusted ideal weight: ${idealAdj} kg. Current: ${wt} kg (${weightDiff > 0 ? '+' : ''}${weightDiff} kg). ${Math.abs(weightDiff) < 5 ? "Excellent — within ideal range." : Math.abs(weightDiff) < 10 ? "Slightly outside range — minor adjustments." : "Significant deviation — consult nutritionist."}`, priority: Math.abs(weightDiff) > 10 ? 'high' : 'medium', category: "Weight" },
        { title: "Skeletal Robustness", description: `Score: ${robustness} → ${robustnessClass}. Calculated as wrist²/height. Higher values indicate denser bone structure, which affects body composition interpretation and fall risk assessment.`, priority: 'low', category: "Skeleton" },
        { title: "Bone Density Indicator", description: `${boneRisk}. Wrist circumference correlates with bone mineral density. ${boneStatus === 'warning' ? "Consider DEXA scan and ensure adequate calcium (1000mg/day) + vitamin D (800IU/day)." : "Good structural foundation."}`, priority: boneStatus === 'warning' ? 'high' : 'low', category: "Bone Health" },
        { title: "Population Percentile", description: `Your wrist circumference is at the ${whrPercentile}th percentile for ${gender}s. ${whrPercentile < 25 ? "Smaller frame — set realistic strength goals." : whrPercentile > 75 ? "Larger frame — natural advantage for strength sports." : "Average frame — versatile athlete potential."}`, priority: 'low', category: "Context" },
      ],
      detailedBreakdown: {
        "Wrist": `${wr} cm`, "Height": `${h} cm`, "Weight": `${wt} kg`, "Gender": gender,
        "H/Wrist Ratio": `${ratio}`, "Frame Size": frameSize, "BMI": `${r1(bmi)}`,
        "Ideal Weight": `${idealAdj} kg`, "Weight Diff": `${weightDiff} kg`,
        "Robustness Score": `${robustness}`, "Robustness Class": robustnessClass,
        "Percentile": `${whrPercentile}th`, "Bone Risk": boneRisk,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Wrist Circumference" value={wrist} onChange={setWrist} min={10} max={30} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Wrist Circumference Calculator"
      description="Determine frame size, ideal weight adjustment, skeletal robustness, bone density hints, and population percentile."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Wrist Circumference Calculator" description="Frame size classification and skeletal analysis via wrist measurement." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #33 — ANKLE CIRCUMFERENCE ====================
export function AnkleCircumferenceCalculator() {
  const [ankle, setAnkle] = useState(22)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const an = clamp(ankle, 12, 40)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 30, 300)
    const a = clamp(age, 18, 99)
    const hm = h / 100

    // Lower frame classification
    const ankleHeightRatio = r2(an / h * 100)
    let lowerFrame: string; let frameStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (ankleHeightRatio < 12.5) { lowerFrame = "Small lower frame"; frameStatus = 'good' }
      else if (ankleHeightRatio < 14.5) { lowerFrame = "Medium lower frame"; frameStatus = 'good' }
      else { lowerFrame = "Large lower frame"; frameStatus = 'warning' }
    } else {
      if (ankleHeightRatio < 12.0) { lowerFrame = "Small lower frame"; frameStatus = 'good' }
      else if (ankleHeightRatio < 14.0) { lowerFrame = "Medium lower frame"; frameStatus = 'good' }
      else { lowerFrame = "Large lower frame"; frameStatus = 'warning' }
    }

    // Bone density risk hint
    let boneDensity: string; let boneStatus: 'good' | 'warning' | 'danger'
    if (an < (gender === "male" ? 19 : 17)) { boneDensity = "Below average — screen for osteopenia"; boneStatus = 'warning' }
    else if (an < (gender === "male" ? 21 : 19)) { boneDensity = "Average bone structure"; boneStatus = 'good' }
    else { boneDensity = "Above average — robust lower skeleton"; boneStatus = 'good' }

    // Edema detection
    const expectedAnkle = gender === "male" ? h * 0.125 + 2 : h * 0.12 + 1.5
    const eDiff = r1(an - expectedAnkle)
    let edemaRisk: string; let edemaStatus: 'good' | 'warning' | 'danger'
    if (eDiff > 4) { edemaRisk = "High — possible lymphedema/fluid retention"; edemaStatus = 'danger' }
    else if (eDiff > 2) { edemaRisk = "Mild swelling detected"; edemaStatus = 'warning' }
    else { edemaRisk = "No edema indicators"; edemaStatus = 'good' }

    // Athletic structural rating
    const bmi = wt / (hm * hm)
    const structuralScore = r1(an / (wt * 0.01) * (h / 170))
    let athleticRating: string; let athleticStatus: 'good' | 'warning' | 'danger'
    if (structuralScore > 3.5) { athleticRating = "Elite structure — excellent support capacity"; athleticStatus = 'good' }
    else if (structuralScore > 2.5) { athleticRating = "Good athletic foundation"; athleticStatus = 'good' }
    else { athleticRating = "Below average — focus on joint stability"; athleticStatus = 'warning' }

    // Ankle-calf proportion estimate
    const estimatedCalf = r1(an * 1.65)

    const score = edemaStatus === 'danger' ? 25 : edemaStatus === 'warning' ? 50 : frameStatus === 'good' ? 82 : 65

    setResult({
      primaryMetric: { label: "Ankle Circumference", value: an, unit: "cm", status: frameStatus, description: lowerFrame, icon: Ruler },
      healthScore: score,
      metrics: [
        { label: "Ankle", value: `${an} cm`, status: frameStatus, icon: Ruler },
        { label: "Lower Frame", value: lowerFrame.split(" ")[0], status: frameStatus, icon: User },
        { label: "Ankle/Height %", value: `${ankleHeightRatio}%`, status: frameStatus, icon: BarChart3 },
        { label: "Bone Density", value: boneDensity.split("—")[0].trim(), status: boneStatus, icon: Shield },
        { label: "Edema Risk", value: edemaRisk.split("—")[0].trim(), status: edemaStatus, icon: AlertTriangle },
        { label: "Deviation", value: `${eDiff > 0 ? '+' : ''}${eDiff} cm`, status: edemaStatus, icon: TrendingUp },
        { label: "Athletic Rating", value: athleticRating.split("—")[0].trim(), status: athleticStatus, icon: Activity },
        { label: "Est. Calf", value: `${estimatedCalf} cm`, status: 'good', icon: Scale },
      ],
      recommendations: [
        { title: "Lower Frame Analysis", description: `Ankle/height ratio ${ankleHeightRatio}% → ${lowerFrame}. Frame size helps determine appropriate footwear support, exercise impact tolerance, and lower body training loads.`, priority: 'medium', category: "Frame" },
        { title: "Bone Density Indicator", description: `${boneDensity}. Ankle circumference reflects tibial and fibular bone mass. ${boneStatus === 'warning' ? "Consider DEXA scan, weight-bearing exercise, and calcium/vitamin D supplementation." : "Healthy bone structure foundation."}`, priority: boneStatus === 'warning' ? 'high' : 'low', category: "Bone" },
        { title: "Edema Detection", description: `Expected ankle: ~${r1(expectedAnkle)} cm. Actual: ${an} cm (${eDiff > 0 ? '+' : ''}${eDiff} cm). ${edemaStatus === 'danger' ? "Significant swelling. Consult physician — rule out DVT, heart failure, or kidney issues." : edemaStatus === 'warning' ? "Mild swelling. Monitor daily, elevate legs, check sodium intake." : "No swelling detected."}`, priority: edemaStatus === 'danger' ? 'high' : edemaStatus === 'warning' ? 'high' : 'low', category: "Edema" },
        { title: "Athletic Structure", description: `Score: ${structuralScore} → ${athleticRating}. ${athleticStatus === 'good' ? "Strong foundation for impact sports (running, jumping, basketball)." : "Prioritize ankle stability work — single-leg balance, band exercises, proprioceptive training."}`, priority: athleticStatus === 'warning' ? 'high' : 'low', category: "Athletic" },
        { title: "Calf Proportion", description: `Estimated calf from ankle: ~${estimatedCalf} cm (typical ratio 1.65×). This helps assess lower body proportionality and guide calf development targets.`, priority: 'low', category: "Proportion" },
      ],
      detailedBreakdown: {
        "Ankle": `${an} cm`, "Height": `${h} cm`, "Weight": `${wt} kg`,
        "Age": `${a}`, "Gender": gender, "BMI": `${r1(bmi)}`,
        "Ankle/Height %": `${ankleHeightRatio}%`, "Lower Frame": lowerFrame,
        "Bone Density": boneDensity, "Expected Ankle": `${r1(expectedAnkle)} cm`,
        "Edema Deviation": `${eDiff} cm`, "Edema Risk": edemaRisk,
        "Structural Score": `${structuralScore}`, "Athletic Rating": athleticRating,
        "Estimated Calf": `${estimatedCalf} cm`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Ankle Circumference" value={ankle} onChange={setAnkle} min={12} max={40} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={99} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Ankle Circumference Calculator"
      description="Assess lower frame classification, bone density hints, edema detection, athletic structure rating, and calf proportion."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Ankle Circumference Calculator" description="Lower body frame analysis with edema detection and bone health screening." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #34 — BICEP CIRCUMFERENCE ====================
export function BicepCircumferenceCalculator() {
  const [bicep, setBicep] = useState(33)
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(72)
  const [wrist, setWrist] = useState(17)
  const [gender, setGender] = useState("male")
  const [contracted, setContracted] = useState("relaxed")
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const bi = clamp(bicep, 15, 60)
    const h = clamp(height, 120, 230)
    const wt = clamp(weight, 30, 300)
    const wr = clamp(wrist, 10, 30)
    const hm = h / 100
    const bmi = wt / (hm * hm)
    const isContracted = contracted === "contracted"

    // Normalize — if contracted, estimate relaxed for comparison
    const relaxedBicep = isContracted ? r1(bi * 0.88) : bi
    const contractedEst = isContracted ? bi : r1(bi * 1.14)

    // Muscle density estimate
    const bicepArmRatio = r2(relaxedBicep / (h * 0.188))
    let muscleClass: string; let muscleStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (relaxedBicep > 38) { muscleClass = "Advanced musculature"; muscleStatus = 'good' }
      else if (relaxedBicep > 32) { muscleClass = "Above average"; muscleStatus = 'good' }
      else if (relaxedBicep > 27) { muscleClass = "Average"; muscleStatus = 'good' }
      else { muscleClass = "Below average"; muscleStatus = 'warning' }
    } else {
      if (relaxedBicep > 32) { muscleClass = "Advanced musculature"; muscleStatus = 'good' }
      else if (relaxedBicep > 27) { muscleClass = "Above average"; muscleStatus = 'good' }
      else if (relaxedBicep > 23) { muscleClass = "Average"; muscleStatus = 'good' }
      else { muscleClass = "Below average"; muscleStatus = 'warning' }
    }

    // Arm proportionality (bicep vs wrist indicates lean mass vs frame)
    const bwRatio = r2(relaxedBicep / wr)
    let proportionality: string; let propStatus: 'good' | 'warning' | 'danger'
    if (bwRatio > 2.3) { proportionality = "Highly muscular arms"; propStatus = 'good' }
    else if (bwRatio > 1.9) { proportionality = "Well-proportioned"; propStatus = 'good' }
    else if (bwRatio > 1.6) { proportionality = "Average proportions"; propStatus = 'good' }
    else { proportionality = "Under-muscled for frame"; propStatus = 'warning' }

    // FFMI contribution estimate
    const armLBM = r1(relaxedBicep * relaxedBicep * 0.009 * (gender === "male" ? 1.0 : 0.85))
    const ffmiContrib = r2(armLBM / (hm * hm))

    // Athlete percentile
    const percentile = gender === "male"
      ? relaxedBicep > 40 ? 95 : relaxedBicep > 37 ? 85 : relaxedBicep > 34 ? 70 : relaxedBicep > 31 ? 50 : relaxedBicep > 28 ? 30 : 15
      : relaxedBicep > 34 ? 95 : relaxedBicep > 31 ? 85 : relaxedBicep > 28 ? 70 : relaxedBicep > 25 ? 50 : relaxedBicep > 22 ? 30 : 15

    // Contraction ratio (indicator of muscle quality)
    const contractionRatio = r2(contractedEst / relaxedBicep)

    const score = muscleStatus === 'good' ? (percentile > 70 ? 90 : 75) : 45

    setResult({
      primaryMetric: { label: "Bicep Circumference", value: bi, unit: "cm", status: muscleStatus, description: `${muscleClass} (${isContracted ? 'contracted' : 'relaxed'})`, icon: Activity },
      healthScore: score,
      metrics: [
        { label: "Bicep", value: `${bi} cm`, status: muscleStatus, icon: Ruler },
        { label: "Muscle Class", value: muscleClass.split(" ")[0], status: muscleStatus, icon: Activity },
        { label: "Relaxed Est.", value: `${relaxedBicep} cm`, status: muscleStatus, icon: BarChart3 },
        { label: "Contracted Est.", value: `${contractedEst} cm`, status: muscleStatus, icon: TrendingUp },
        { label: "Bicep/Wrist", value: bwRatio, status: propStatus, icon: User },
        { label: "Proportionality", value: proportionality.split(" ")[0], status: propStatus, icon: Scale },
        { label: "Arm FFMI", value: ffmiContrib, status: ffmiContrib > 1.5 ? 'good' : 'warning', icon: Shield },
        { label: "Percentile", value: `${percentile}th`, status: percentile > 50 ? 'good' : 'warning', icon: Heart },
      ],
      recommendations: [
        { title: "Muscle Assessment", description: `Relaxed bicep ~${relaxedBicep} cm → ${muscleClass}. ${gender === 'male' ? 'Male benchmarks: <27 below avg, 27-32 avg, 32-38 above avg, >38 advanced.' : 'Female: <23 below avg, 23-27 avg, 27-32 above avg, >32 advanced.'}`, priority: muscleStatus === 'warning' ? 'high' : 'medium', category: "Muscle" },
        { title: "Arm Proportionality", description: `Bicep/Wrist ratio ${bwRatio} → ${proportionality}. This ratio isolates muscle mass from bone structure. ${propStatus === 'warning' ? "Focus on progressive overload — 3-4 bicep sessions/week." : "Good muscle-to-frame ratio."}`, priority: propStatus === 'warning' ? 'high' : 'low', category: "Proportion" },
        { title: "Contraction Quality", description: `Estimated contraction ratio: ${contractionRatio}. Ideal: 1.10-1.18. ${contractionRatio > 1.18 ? "Excellent peak — strong contractile tissue." : contractionRatio > 1.10 ? "Good muscle quality." : "Below average — consider neuromuscular training and isometric holds."}`, priority: 'medium', category: "Quality" },
        { title: "FFMI Contribution", description: `Arm lean body mass contributes ~${ffmiContrib} to overall FFMI. ${ffmiContrib > 2 ? "Advanced arm musculature." : ffmiContrib > 1.2 ? "Solid contribution." : "Room for growth."}`, priority: 'low', category: "Composition" },
        { title: "Population Percentile", description: `${percentile}th percentile among ${gender} adults. ${percentile > 80 ? "Top tier — competition-level arms." : percentile > 50 ? "Above average — consistent training evident." : "Below average — structured hypertrophy program recommended."}`, priority: percentile < 30 ? 'high' : 'low', category: "Ranking" },
      ],
      detailedBreakdown: {
        "Bicep (input)": `${bi} cm (${isContracted ? 'contracted' : 'relaxed'})`,
        "Relaxed Est.": `${relaxedBicep} cm`, "Contracted Est.": `${contractedEst} cm`,
        "Height": `${h} cm`, "Weight": `${wt} kg`, "Wrist": `${wr} cm`, "Gender": gender,
        "BMI": `${r1(bmi)}`, "Muscle Class": muscleClass,
        "Bicep/Wrist Ratio": `${bwRatio}`, "Proportionality": proportionality,
        "Contraction Ratio": `${contractionRatio}`, "Arm FFMI Contrib": `${ffmiContrib}`,
        "Percentile": `${percentile}th`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Bicep Circumference" value={bicep} onChange={setBicep} min={15} max={60} suffix="cm" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Wrist Circumference" value={wrist} onChange={setWrist} min={10} max={30} suffix="cm" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <SelectInput label="Measurement Type" value={contracted} onChange={setContracted} options={[{ value: "relaxed", label: "Relaxed" }, { value: "contracted", label: "Contracted (Flexed)" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Bicep Circumference Calculator"
      description="Assess muscle density, arm proportionality, FFMI contribution, contraction quality, and athlete percentile ranking."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Bicep Circumference Calculator" description="Advanced bicep analysis with muscle quality, proportionality, and athlete percentile." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #35 — TRICEP SKINFOLD ====================
export function TricepSkinfoldCalculator() {
  const [tricep, setTricep] = useState(15)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(72)
  const [height, setHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const t = clamp(tricep, 2, 60)
    const a = clamp(age, 18, 80)
    const wt = clamp(weight, 30, 300)
    const h = clamp(height, 120, 230)
    const hm = h / 100

    // Body fat % estimate from tricep skinfold (Slaughter equation simplified)
    let bodyFat: number
    if (gender === "male") {
      bodyFat = r1(0.735 * t + 1.0)
      if (a > 40) bodyFat += 2
    } else {
      bodyFat = r1(0.610 * t + 5.1)
      if (a > 40) bodyFat += 1.5
    }
    bodyFat = r1(clamp(bodyFat, 3, 55))

    let fatClass: string; let fatStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (bodyFat < 14) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 20) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 25) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    } else {
      if (bodyFat < 21) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 27) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 32) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    }

    // Peripheral fat classification
    let periClass: string; let periStatus: 'good' | 'warning' | 'danger'
    if (t < 10) { periClass = "Low peripheral fat"; periStatus = 'good' }
    else if (t < 20) { periClass = "Moderate peripheral fat"; periStatus = 'good' }
    else if (t < 30) { periClass = "Elevated peripheral fat"; periStatus = 'warning' }
    else { periClass = "High peripheral fat"; periStatus = 'danger' }

    // DEXA comparison (tricep alone typically overestimates by 2-4%)
    const dexaEstimate = r1(bodyFat * 0.85)

    // Age-adjusted percentile
    const ageAdj = a > 50 ? t - 3 : a > 40 ? t - 1 : t
    const percentile = gender === "male"
      ? ageAdj < 8 ? 10 : ageAdj < 12 ? 25 : ageAdj < 16 ? 50 : ageAdj < 22 ? 75 : 90
      : ageAdj < 12 ? 10 : ageAdj < 18 ? 25 : ageAdj < 24 ? 50 : ageAdj < 30 ? 75 : 90

    // Fat mass and lean mass estimates
    const fatMass = r1(wt * bodyFat / 100)
    const leanMass = r1(wt - fatMass)

    const score = fatStatus === 'good' ? 85 : fatStatus === 'warning' ? 55 : 25

    setResult({
      primaryMetric: { label: "Body Fat %", value: bodyFat, unit: "%", status: fatStatus, description: fatClass, icon: BarChart3 },
      healthScore: score,
      metrics: [
        { label: "Tricep Skinfold", value: `${t} mm`, status: periStatus, icon: Ruler },
        { label: "Body Fat %", value: `${bodyFat}%`, status: fatStatus, icon: BarChart3 },
        { label: "Fat Category", value: fatClass, status: fatStatus, icon: Activity },
        { label: "Peripheral Fat", value: periClass.split(" ")[0], status: periStatus, icon: AlertTriangle },
        { label: "DEXA Estimate", value: `${dexaEstimate}%`, status: fatStatus, icon: Shield },
        { label: "Fat Mass", value: `${fatMass} kg`, status: fatStatus, icon: Scale },
        { label: "Lean Mass", value: `${leanMass} kg`, status: 'good', icon: TrendingUp },
        { label: "Percentile", value: `${percentile}th`, status: percentile < 75 ? 'good' : 'warning', icon: User },
      ],
      recommendations: [
        { title: "Body Fat Estimate", description: `Tricep ${t} mm → ~${bodyFat}% body fat (${fatClass}). ${gender === 'male' ? 'Male: <14% athletic, 14-20% fitness, 20-25% avg, >25% above avg.' : 'Female: <21% athletic, 21-27% fitness, 27-32% avg, >32% above avg.'}`, priority: fatStatus === 'danger' ? 'high' : 'medium', category: "Body Fat" },
        { title: "DEXA Calibration", description: `Single-site (tricep) typically overestimates by ~15%. DEXA-calibrated estimate: ${dexaEstimate}%. For accuracy, combine with subscapular + suprailiac sites (3-site Jackson-Pollock).`, priority: 'medium', category: "Accuracy" },
        { title: "Peripheral Fat Pattern", description: `${periClass}. Tricep skinfold specifically measures upper-arm subcutaneous fat. ${periStatus === 'danger' ? "High peripheral fat may indicate overall excess. Focus on caloric deficit." : "Peripheral fat distribution within norms."}`, priority: periStatus === 'danger' ? 'high' : 'low', category: "Distribution" },
        { title: "Body Composition", description: `Fat mass: ${fatMass} kg, Lean mass: ${leanMass} kg. ${leanMass / wt > 0.8 ? "Excellent lean-to-total ratio." : leanMass / wt > 0.7 ? "Good composition." : "Focus on body recomposition — preserve muscle while reducing fat."}`, priority: 'medium', category: "Composition" },
        { title: "Reduction Target", description: `${fatStatus !== 'good' ? `To reach fitness range: need ~${r1(fatMass - wt * (gender === 'male' ? 0.17 : 0.24))} kg fat loss. Timeline at 0.5 kg/week: ~${Math.ceil((fatMass - wt * (gender === 'male' ? 0.17 : 0.24)) / 0.5)} weeks.` : "Already in optimal zone. Maintain current habits."}`, priority: fatStatus !== 'good' ? 'high' : 'low', category: "Goal" },
      ],
      detailedBreakdown: {
        "Tricep Skinfold": `${t} mm`, "Age": `${a}`, "Gender": gender,
        "Weight": `${wt} kg`, "Height": `${h} cm`,
        "Body Fat %": `${bodyFat}%`, "Fat Class": fatClass,
        "Peripheral": periClass, "DEXA Est.": `${dexaEstimate}%`,
        "Fat Mass": `${fatMass} kg`, "Lean Mass": `${leanMass} kg`,
        "Percentile": `${percentile}th`,
        "Formula": "Male: 0.735×TSF+1.0, Female: 0.610×TSF+5.1 (+age adj.)",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Tricep Skinfold" value={tricep} onChange={setTricep} min={2} max={60} suffix="mm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={80} suffix="yrs" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Tricep Skinfold Calculator"
      description="Estimate body fat %, peripheral fat classification, DEXA-calibrated values, and body composition breakdown."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Tricep Skinfold Calculator" description="Body fat estimation from tricep skinfold with DEXA calibration." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #36 — SUBSCAPULAR SKINFOLD ====================
export function SubscapularSkinfoldCalculator() {
  const [subscapular, setSubscapular] = useState(18)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(72)
  const [height, setHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ss = clamp(subscapular, 3, 60)
    const a = clamp(age, 18, 80)
    const wt = clamp(weight, 30, 300)
    const h = clamp(height, 120, 230)
    const hm = h / 100

    // Body fat from subscapular (Durnin-Womersley derived)
    const logSS = Math.log10(ss)
    let bodyDensity: number
    if (gender === "male") {
      bodyDensity = 1.1631 - 0.0632 * logSS
      if (a > 40) bodyDensity -= 0.005
    } else {
      bodyDensity = 1.1369 - 0.0598 * logSS
      if (a > 40) bodyDensity -= 0.004
    }
    const bodyFat = r1(clamp((4.95 / bodyDensity - 4.50) * 100, 3, 55))

    let fatClass: string; let fatStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (bodyFat < 14) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 20) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 25) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    } else {
      if (bodyFat < 21) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 27) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 32) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    }

    // Trunk fat concentration
    let trunkFat: string; let trunkStatus: 'good' | 'warning' | 'danger'
    if (ss < 12) { trunkFat = "Low trunk fat"; trunkStatus = 'good' }
    else if (ss < 22) { trunkFat = "Moderate trunk fat"; trunkStatus = 'good' }
    else if (ss < 32) { trunkFat = "Elevated trunk fat"; trunkStatus = 'warning' }
    else { trunkFat = "High trunk fat"; trunkStatus = 'danger' }

    // Hormonal pattern detection
    let hormonalPattern: string; let hormonalStatus: 'good' | 'warning' | 'danger'
    if (gender === "male" && ss > 25) { hormonalPattern = "Elevated cortisol pattern suspected"; hormonalStatus = 'warning' }
    else if (gender === "female" && ss > 28) { hormonalPattern = "Insulin resistance pattern possible"; hormonalStatus = 'warning' }
    else { hormonalPattern = "Normal hormonal pattern"; hormonalStatus = 'good' }

    // Fat mass
    const fatMass = r1(wt * bodyFat / 100)
    const leanMass = r1(wt - fatMass)

    // Body density
    const bdDisplay = r2(bodyDensity * 1000) / 1000

    const score = fatStatus === 'good' ? 85 : fatStatus === 'warning' ? 55 : 22

    setResult({
      primaryMetric: { label: "Body Fat %", value: bodyFat, unit: "%", status: fatStatus, description: fatClass, icon: BarChart3 },
      healthScore: score,
      metrics: [
        { label: "Subscapular", value: `${ss} mm`, status: trunkStatus, icon: Ruler },
        { label: "Body Fat %", value: `${bodyFat}%`, status: fatStatus, icon: BarChart3 },
        { label: "Fat Category", value: fatClass, status: fatStatus, icon: Activity },
        { label: "Trunk Fat", value: trunkFat.split(" ")[0], status: trunkStatus, icon: AlertTriangle },
        { label: "Body Density", value: `${bdDisplay}`, status: fatStatus, icon: Scale },
        { label: "Hormonal", value: hormonalPattern.split(" ")[0], status: hormonalStatus, icon: Shield },
        { label: "Fat Mass", value: `${fatMass} kg`, status: fatStatus, icon: TrendingUp },
        { label: "Lean Mass", value: `${leanMass} kg`, status: 'good', icon: User },
      ],
      recommendations: [
        { title: "Body Fat via Subscapular", description: `Subscapular ${ss} mm → body density ${bdDisplay} → ${bodyFat}% body fat (${fatClass}). Durnin-Womersley equation converts skinfold to density, then Siri equation to body fat %.`, priority: fatStatus === 'danger' ? 'high' : 'medium', category: "Body Fat" },
        { title: "Trunk Fat Assessment", description: `${trunkFat}. Subscapular site specifically measures upper-back/trunk fat. Higher values correlate with visceral adiposity and metabolic risk more strongly than limb sites.`, priority: trunkStatus === 'danger' ? 'high' : 'medium', category: "Trunk" },
        { title: "Hormonal Pattern", description: `${hormonalPattern}. ${hormonalStatus === 'warning' ? "Upper-back fat accumulation can indicate elevated cortisol or insulin resistance. Consider fasting glucose + cortisol panel." : "Distribution pattern within normal hormonal range."}`, priority: hormonalStatus === 'warning' ? 'high' : 'low', category: "Hormonal" },
        { title: "Multi-Site Integration", description: `For best accuracy, combine subscapular with tricep and suprailiac (3-site protocol). Single-site error margin: ±4%. Three-site: ±2.5%. Seven-site: ±1.5%.`, priority: 'medium', category: "Accuracy" },
        { title: "Body Composition", description: `Fat mass: ${fatMass} kg, Lean mass: ${leanMass} kg. ${fatStatus !== 'good' ? `Target fat loss: ${r1(fatMass - wt * (gender === 'male' ? 0.17 : 0.24))} kg at 0.5 kg/week.` : "Excellent composition — maintain."}`, priority: fatStatus !== 'good' ? 'high' : 'low', category: "Goals" },
      ],
      detailedBreakdown: {
        "Subscapular Skinfold": `${ss} mm`, "Age": `${a}`, "Gender": gender,
        "Weight": `${wt} kg`, "Height": `${h} cm`,
        "Body Density": `${bdDisplay} g/cm³`, "Body Fat %": `${bodyFat}%`,
        "Fat Class": fatClass, "Trunk Fat": trunkFat,
        "Hormonal Pattern": hormonalPattern,
        "Fat Mass": `${fatMass} kg`, "Lean Mass": `${leanMass} kg`,
        "Formula": "Durnin-Womersley (density) → Siri (BF%)",
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Subscapular Skinfold" value={subscapular} onChange={setSubscapular} min={3} max={60} suffix="mm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={80} suffix="yrs" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Subscapular Skinfold Calculator"
      description="Estimate body fat via Durnin-Womersley density, trunk fat concentration, hormonal pattern detection, and multi-site integration."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Subscapular Skinfold Calculator" description="Trunk fat analysis with body density estimation and hormonal pattern detection." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #37 — SUPRAILIAC SKINFOLD ====================
export function SuprailiacSkinfoldCalculator() {
  const [suprailiac, setSuprailiac] = useState(16)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(72)
  const [height, setHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const si = clamp(suprailiac, 3, 60)
    const a = clamp(age, 18, 80)
    const wt = clamp(weight, 30, 300)
    const h = clamp(height, 120, 230)
    const hm = h / 100

    // Body fat from suprailiac (adapted Jackson-Pollock single-site)
    let bodyFat: number
    if (gender === "male") {
      bodyFat = r1(0.55 * si + 3.5 + (a > 40 ? 2.5 : 0))
    } else {
      bodyFat = r1(0.50 * si + 7.0 + (a > 40 ? 2.0 : 0))
    }
    bodyFat = r1(clamp(bodyFat, 3, 55))

    let fatClass: string; let fatStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (bodyFat < 14) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 20) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 25) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    } else {
      if (bodyFat < 21) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 27) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 32) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    }

    // Abdominal fat deposition pattern
    let abdominalPattern: string; let abdStatus: 'good' | 'warning' | 'danger'
    if (si < 10) { abdominalPattern = "Low iliac fat — lean midsection"; abdStatus = 'good' }
    else if (si < 20) { abdominalPattern = "Moderate — normal distribution"; abdStatus = 'good' }
    else if (si < 30) { abdominalPattern = "Elevated — love handle formation"; abdStatus = 'warning' }
    else { abdominalPattern = "High — significant flank fat"; abdStatus = 'danger' }

    // Insulin sensitivity indicator
    let insulinSens: string; let insulinStatus: 'good' | 'warning' | 'danger'
    if (si > 28) { insulinSens = "Poor — risk of insulin resistance"; insulinStatus = 'danger' }
    else if (si > 20) { insulinSens = "Moderate — monitor glucose"; insulinStatus = 'warning' }
    else { insulinSens = "Good insulin sensitivity likely"; insulinStatus = 'good' }

    // Fat distribution typing (android vs gynoid)
    const androidHint = si > (gender === "male" ? 22 : 26) ? "Android (central) pattern" : "Balanced distribution"
    const androidStatus: 'good' | 'warning' | 'danger' = androidHint.includes("Android") ? 'warning' : 'good'

    const fatMass = r1(wt * bodyFat / 100)
    const leanMass = r1(wt - fatMass)

    const score = fatStatus === 'good' ? 85 : fatStatus === 'warning' ? 52 : 20

    setResult({
      primaryMetric: { label: "Body Fat %", value: bodyFat, unit: "%", status: fatStatus, description: fatClass, icon: BarChart3 },
      healthScore: score,
      metrics: [
        { label: "Suprailiac", value: `${si} mm`, status: abdStatus, icon: Ruler },
        { label: "Body Fat %", value: `${bodyFat}%`, status: fatStatus, icon: BarChart3 },
        { label: "Fat Category", value: fatClass, status: fatStatus, icon: Activity },
        { label: "Flank Fat", value: abdominalPattern.split("—")[0].trim(), status: abdStatus, icon: AlertTriangle },
        { label: "Insulin Sens.", value: insulinSens.split("—")[0].trim(), status: insulinStatus, icon: Heart },
        { label: "Fat Pattern", value: androidHint.includes("Android") ? "Android" : "Balanced", status: androidStatus, icon: Shield },
        { label: "Fat Mass", value: `${fatMass} kg`, status: fatStatus, icon: Scale },
        { label: "Lean Mass", value: `${leanMass} kg`, status: 'good', icon: TrendingUp },
      ],
      recommendations: [
        { title: "Body Fat Estimate", description: `Suprailiac ${si} mm → ~${bodyFat}% body fat (${fatClass}). Suprailiac site captures iliac crest fat depot — a key indicator of abdominal adiposity.`, priority: fatStatus === 'danger' ? 'high' : 'medium', category: "Body Fat" },
        { title: "Flank Fat Analysis", description: `${abdominalPattern}. ${abdStatus === 'danger' ? "Significant flank/love handle fat. This area responds well to sustained caloric deficit + oblique-sparing exercises." : abdStatus === 'warning' ? "Starting to accumulate. Prevention easier than reduction." : "Lean midsection maintained."}`, priority: abdStatus === 'danger' ? 'high' : 'medium', category: "Abdominal" },
        { title: "Insulin Sensitivity", description: `${insulinSens}. Suprailiac thickness > 28mm strongly correlates with impaired fasting glucose in research. ${insulinStatus === 'danger' ? "Test HbA1c and fasting insulin." : "Continue healthy eating patterns."}`, priority: insulinStatus === 'danger' ? 'high' : 'low', category: "Metabolic" },
        { title: "Fat Distribution Type", description: `${androidHint}. ${androidStatus === 'warning' ? "Android pattern increases CVD + metabolic risk. Focus on visceral fat reduction strategies." : "Balanced distribution — lower metabolic risk."}`, priority: androidStatus === 'warning' ? 'high' : 'low', category: "Pattern" },
        { title: "Multi-Site Protocol", description: `Suprailiac is one component of the 3-site (Jackson-Pollock) and 7-site protocols. Combine with tricep + subscapular for 3-site, or add chest, abdominal, thigh, midaxillary for 7-site.`, priority: 'medium', category: "Protocol" },
      ],
      detailedBreakdown: {
        "Suprailiac Skinfold": `${si} mm`, "Age": `${a}`, "Gender": gender,
        "Weight": `${wt} kg`, "Height": `${h} cm`,
        "Body Fat %": `${bodyFat}%`, "Fat Class": fatClass,
        "Flank Pattern": abdominalPattern, "Insulin Sensitivity": insulinSens,
        "Fat Distribution": androidHint,
        "Fat Mass": `${fatMass} kg`, "Lean Mass": `${leanMass} kg`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Suprailiac Skinfold" value={suprailiac} onChange={setSuprailiac} min={3} max={60} suffix="mm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={80} suffix="yrs" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Suprailiac Skinfold Calculator"
      description="Assess body fat from iliac crest site, flank fat pattern, insulin sensitivity indicator, and fat distribution typing."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Suprailiac Skinfold Calculator" description="Iliac crest fat analysis with insulin sensitivity and distribution typing." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #38 — ABDOMINAL SKINFOLD ====================
export function AbdominalSkinfoldCalculator() {
  const [abdominal, setAbdominal] = useState(20)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(72)
  const [height, setHeight] = useState(170)
  const [waist, setWaist] = useState(85)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ab = clamp(abdominal, 3, 70)
    const a = clamp(age, 18, 80)
    const wt = clamp(weight, 30, 300)
    const h = clamp(height, 120, 230)
    const w = clamp(waist, 50, 200)
    const hm = h / 100

    // Body fat from abdominal skinfold
    let bodyFat: number
    if (gender === "male") {
      bodyFat = r1(0.50 * ab + 2.0 + (a > 40 ? 3.0 : 0))
    } else {
      bodyFat = r1(0.45 * ab + 6.0 + (a > 40 ? 2.5 : 0))
    }
    bodyFat = r1(clamp(bodyFat, 3, 55))

    let fatClass: string; let fatStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (bodyFat < 14) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 20) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 25) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    } else {
      if (bodyFat < 21) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 27) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 32) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    }

    // Visceral vs subcutaneous estimation
    // High abdominal skinfold with large waist → more visceral
    const skinfoldToWaist = r2(ab / w * 100)
    let visceralHint: string; let visceralStatus: 'good' | 'warning' | 'danger'
    if (w > 94 && ab < 20) { visceralHint = "High visceral-to-subcutaneous ratio — deep fat"; visceralStatus = 'danger' }
    else if (w > 94 && ab > 25) { visceralHint = "Both visceral and subcutaneous elevated"; visceralStatus = 'danger' }
    else if (ab > 30) { visceralHint = "High subcutaneous abdominal fat"; visceralStatus = 'warning' }
    else { visceralHint = "Normal fat distribution"; visceralStatus = 'good' }

    // Metabolic syndrome correlation
    let metRisk: string; let metStatus: 'good' | 'warning' | 'danger'
    if (ab > 30 && w > 94) { metRisk = "High MetS risk (>50%)"; metStatus = 'danger' }
    else if (ab > 22 || w > 88) { metRisk = "Moderate MetS risk (20-50%)"; metStatus = 'warning' }
    else { metRisk = "Low MetS risk (<20%)"; metStatus = 'good' }

    // DEXA-calibrated
    const dexaEst = r1(bodyFat * 0.90)
    const fatMass = r1(wt * bodyFat / 100)
    const leanMass = r1(wt - fatMass)

    const score = fatStatus === 'good' ? 85 : fatStatus === 'warning' ? 50 : 20

    setResult({
      primaryMetric: { label: "Body Fat %", value: bodyFat, unit: "%", status: fatStatus, description: fatClass, icon: BarChart3 },
      healthScore: score,
      metrics: [
        { label: "Abdominal SF", value: `${ab} mm`, status: fatStatus, icon: Ruler },
        { label: "Body Fat %", value: `${bodyFat}%`, status: fatStatus, icon: BarChart3 },
        { label: "Fat Category", value: fatClass, status: fatStatus, icon: Activity },
        { label: "Visceral Hint", value: visceralHint.split("—")[0].trim(), status: visceralStatus, icon: AlertTriangle },
        { label: "SF/Waist %", value: `${skinfoldToWaist}%`, status: visceralStatus, icon: Shield },
        { label: "MetS Risk", value: metRisk.split("(")[0].trim(), status: metStatus, icon: Heart },
        { label: "DEXA Est.", value: `${dexaEst}%`, status: fatStatus, icon: Scale },
        { label: "Lean Mass", value: `${leanMass} kg`, status: 'good', icon: TrendingUp },
      ],
      recommendations: [
        { title: "Abdominal Body Fat", description: `Abdominal skinfold ${ab} mm → ~${bodyFat}% body fat (${fatClass}). Abdominal site is the single strongest predictor of total body fat in most populations.`, priority: fatStatus === 'danger' ? 'high' : 'medium', category: "Body Fat" },
        { title: "Visceral vs Subcutaneous", description: `${visceralHint}. Skinfold/waist ratio: ${skinfoldToWaist}%. ${visceralStatus === 'danger' ? "Low ratio with large waist indicates deep visceral fat — more metabolically dangerous. Priority: aerobic exercise + dietary changes." : "Distribution appears balanced."}`, priority: visceralStatus === 'danger' ? 'high' : 'medium', category: "Distribution" },
        { title: "Metabolic Syndrome", description: `${metRisk}. Combined abdominal skinfold + waist circumference is a strong predictor of metabolic syndrome. ${metStatus === 'danger' ? "Screen for: fasting glucose >100, triglycerides >150, HDL <40/50, BP >130/85." : "Continue preventive measures."}`, priority: metStatus === 'danger' ? 'high' : 'low', category: "Metabolic" },
        { title: "DEXA Calibration", description: `Single-site abdominal overestimates by ~10%. DEXA-calibrated: ~${dexaEst}%. For clinical accuracy, use 7-site protocol or get a DEXA scan.`, priority: 'medium', category: "Accuracy" },
        { title: "Fat Loss Target", description: `Fat mass: ${fatMass} kg. ${fatStatus !== 'good' ? `Reduce by ${r1(fatMass - wt * (gender === 'male' ? 0.17 : 0.24))} kg. Abdominal fat responds best to HIIT + caloric deficit of 300-500 kcal/day.` : "Optimal range — maintain."}`, priority: fatStatus !== 'good' ? 'high' : 'low', category: "Goal" },
      ],
      detailedBreakdown: {
        "Abdominal Skinfold": `${ab} mm`, "Waist": `${w} cm`,
        "Age": `${a}`, "Gender": gender, "Weight": `${wt} kg`, "Height": `${h} cm`,
        "Body Fat %": `${bodyFat}%`, "Fat Class": fatClass,
        "Visceral Hint": visceralHint, "SF/Waist Ratio": `${skinfoldToWaist}%`,
        "MetS Risk": metRisk, "DEXA Est.": `${dexaEst}%`,
        "Fat Mass": `${fatMass} kg`, "Lean Mass": `${leanMass} kg`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Abdominal Skinfold" value={abdominal} onChange={setAbdominal} min={3} max={70} suffix="mm" />
      <NumInput label="Waist Circumference" value={waist} onChange={setWaist} min={50} max={200} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={80} suffix="yrs" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Abdominal Skinfold Calculator"
      description="Estimate body fat %, visceral vs subcutaneous fat ratio, metabolic syndrome risk, and DEXA-calibrated composition."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Abdominal Skinfold Calculator" description="Abdominal fat analysis with visceral distribution and metabolic risk assessment." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #39 — THIGH SKINFOLD ====================
export function ThighSkinfoldCalculator() {
  const [thigh, setThigh] = useState(18)
  const [age, setAge] = useState(30)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(72)
  const [height, setHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const th = clamp(thigh, 3, 60)
    const a = clamp(age, 18, 80)
    const wt = clamp(weight, 30, 300)
    const h = clamp(height, 120, 230)
    const hm = h / 100

    // Body fat from thigh skinfold (simplified)
    let bodyFat: number
    if (gender === "male") {
      bodyFat = r1(0.60 * th + 1.5 + (a > 40 ? 2.0 : 0))
    } else {
      bodyFat = r1(0.55 * th + 5.5 + (a > 40 ? 1.5 : 0))
    }
    bodyFat = r1(clamp(bodyFat, 3, 55))

    let fatClass: string; let fatStatus: 'good' | 'warning' | 'danger'
    if (gender === "male") {
      if (bodyFat < 14) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 20) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 25) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    } else {
      if (bodyFat < 21) { fatClass = "Athletic"; fatStatus = 'good' }
      else if (bodyFat < 27) { fatClass = "Fitness"; fatStatus = 'good' }
      else if (bodyFat < 32) { fatClass = "Average"; fatStatus = 'warning' }
      else { fatClass = "Above average"; fatStatus = 'danger' }
    }

    // Lower body fat pattern (gynoid assessment)
    let lowerPattern: string; let lowerStatus: 'good' | 'warning' | 'danger'
    if (gender === "female" && th > 25) { lowerPattern = "Gynoid (pear) distribution"; lowerStatus = 'good' }
    else if (th > 30) { lowerPattern = "Excessive lower body fat"; lowerStatus = 'warning' }
    else if (th < 10) { lowerPattern = "Very lean lower body"; lowerStatus = 'good' }
    else { lowerPattern = "Normal lower body fat"; lowerStatus = 'good' }

    // Thigh muscle estimation
    // Approximate: thigh circumference from height, subtract fat layer
    const estThighCirc = h * 0.32
    const fatLayer = th * 0.314 // mm to approximate cm on circumference
    const muscleCirc = r1(estThighCirc - fatLayer)
    const musclePercent = r1(muscleCirc / estThighCirc * 100)

    // Jackson-Pollock 3-site contribution
    const jp3Contribution = gender === "male"
      ? `Thigh is 1 of 3 sites (chest, abdominal, thigh) for male JP3`
      : `Thigh is 1 of 3 sites (tricep, suprailiac, thigh) for female JP3`

    // Hormonal pattern
    let hormonalHint: string; let hormonalStatus: 'good' | 'warning' | 'danger'
    if (gender === "female" && th > 30) { hormonalHint = "Estrogen-dominant fat pattern"; hormonalStatus = 'good' }
    else if (gender === "male" && th > 28) { hormonalHint = "Low testosterone possible"; hormonalStatus = 'warning' }
    else { hormonalHint = "Normal hormonal distribution"; hormonalStatus = 'good' }

    const fatMass = r1(wt * bodyFat / 100)
    const leanMass = r1(wt - fatMass)

    const score = fatStatus === 'good' ? 85 : fatStatus === 'warning' ? 52 : 22

    setResult({
      primaryMetric: { label: "Body Fat %", value: bodyFat, unit: "%", status: fatStatus, description: fatClass, icon: BarChart3 },
      healthScore: score,
      metrics: [
        { label: "Thigh Skinfold", value: `${th} mm`, status: fatStatus, icon: Ruler },
        { label: "Body Fat %", value: `${bodyFat}%`, status: fatStatus, icon: BarChart3 },
        { label: "Fat Category", value: fatClass, status: fatStatus, icon: Activity },
        { label: "Lower Pattern", value: lowerPattern.split(" ")[0], status: lowerStatus, icon: User },
        { label: "Muscle %", value: `${musclePercent}%`, status: musclePercent > 85 ? 'good' : 'warning', icon: TrendingUp },
        { label: "Hormonal", value: hormonalHint.split(" ")[0], status: hormonalStatus, icon: Shield },
        { label: "Fat Mass", value: `${fatMass} kg`, status: fatStatus, icon: Scale },
        { label: "Lean Mass", value: `${leanMass} kg`, status: 'good', icon: Heart },
      ],
      recommendations: [
        { title: "Thigh Body Fat", description: `Thigh skinfold ${th} mm → ~${bodyFat}% body fat (${fatClass}). The anterior thigh site measures quadriceps subcutaneous fat — a key component in 3-site and 7-site protocols.`, priority: fatStatus === 'danger' ? 'high' : 'medium', category: "Body Fat" },
        { title: "Lower Body Pattern", description: `${lowerPattern}. ${lowerStatus === 'warning' ? "Excessive lower body fat. Focus on compound leg exercises (squats, lunges) + overall caloric deficit." : "Distribution within expected range."}`, priority: lowerStatus === 'warning' ? 'high' : 'low', category: "Distribution" },
        { title: "Thigh Muscle Quality", description: `Estimated muscle: ${musclePercent}% of thigh circumference. ${musclePercent > 90 ? "Excellent — lean and muscular thighs." : musclePercent > 80 ? "Good muscle-to-fat ratio." : "Consider lower body strength training to improve ratio."}`, priority: musclePercent < 80 ? 'high' : 'low', category: "Muscle" },
        { title: "JP3 Protocol", description: `${jp3Contribution}. To calculate full JP3 body fat: combine this with the other 2 sites. ${gender === 'male' ? "Need chest + abdominal skinfolds." : "Need tricep + suprailiac skinfolds."}`, priority: 'medium', category: "Protocol" },
        { title: "Hormonal Assessment", description: `${hormonalHint}. ${hormonalStatus === 'warning' ? "Elevated male thigh fat may indicate low testosterone. Consider hormonal panel testing." : "Hormonal distribution pattern is normal for your profile."}`, priority: hormonalStatus === 'warning' ? 'high' : 'low', category: "Hormonal" },
      ],
      detailedBreakdown: {
        "Thigh Skinfold": `${th} mm`, "Age": `${a}`, "Gender": gender,
        "Weight": `${wt} kg`, "Height": `${h} cm`,
        "Body Fat %": `${bodyFat}%`, "Fat Class": fatClass,
        "Lower Pattern": lowerPattern, "Est. Muscle %": `${musclePercent}%`,
        "Hormonal Hint": hormonalHint,
        "Fat Mass": `${fatMass} kg`, "Lean Mass": `${leanMass} kg`,
        "JP3 Role": jp3Contribution,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Thigh Skinfold" value={thigh} onChange={setThigh} min={3} max={60} suffix="mm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={80} suffix="yrs" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Thigh Skinfold Calculator"
      description="Estimate body fat from thigh site, lower body fat pattern, muscle quality analysis, and JP3 protocol integration."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Thigh Skinfold Calculator" description="Thigh fat analysis with lower body distribution and muscle quality assessment." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #40 — FRAME SIZE CALCULATOR ====================
export function FrameSizeCalculator() {
  const [height, setHeight] = useState(170)
  const [wrist, setWrist] = useState(17)
  const [elbow, setElbow] = useState(7)
  const [gender, setGender] = useState("male")
  const [weight, setWeight] = useState(72)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 120, 230)
    const wr = clamp(wrist, 10, 30)
    const el = clamp(elbow, 4, 12)
    const wt = clamp(weight, 30, 300)
    const hm = h / 100

    // Method 1: Wrist-based frame (height/wrist ratio)
    const wristRatio = r2(h / wr)
    let wristFrame: string
    if (gender === "male") {
      if (wristRatio > 10.4) wristFrame = "Small"
      else if (wristRatio >= 9.6) wristFrame = "Medium"
      else wristFrame = "Large"
    } else {
      if (wristRatio > 11.0) wristFrame = "Small"
      else if (wristRatio >= 10.1) wristFrame = "Medium"
      else wristFrame = "Large"
    }

    // Method 2: Elbow breadth frame
    let elbowFrame: string
    if (gender === "male") {
      if (el < 6.5) elbowFrame = "Small"
      else if (el <= 7.5) elbowFrame = "Medium"
      else elbowFrame = "Large"
    } else {
      if (el < 5.5) elbowFrame = "Small"
      else if (el <= 6.5) elbowFrame = "Medium"
      else elbowFrame = "Large"
    }

    // Consensus frame (both agree = high confidence)
    const consensus = wristFrame === elbowFrame
    const finalFrame = consensus ? wristFrame : "Medium (mixed signals)"
    const frameStatus: 'good' | 'warning' | 'danger' = consensus ? 'good' : 'warning'

    // Ideal weight range based on frame
    const baseIdeal = gender === "male" ? 50 + 0.91 * (h - 152.4) : 45.5 + 0.91 * (h - 152.4)
    let idealMin: number; let idealMax: number
    if (finalFrame.includes("Small")) { idealMin = r1(baseIdeal * 0.85); idealMax = r1(baseIdeal * 0.95) }
    else if (finalFrame.includes("Large")) { idealMin = r1(baseIdeal * 1.05); idealMax = r1(baseIdeal * 1.15) }
    else { idealMin = r1(baseIdeal * 0.95); idealMax = r1(baseIdeal * 1.05) }

    const inIdealRange = wt >= idealMin && wt <= idealMax
    const weightStatus: 'good' | 'warning' | 'danger' = inIdealRange ? 'good' : Math.abs(wt - (idealMin + idealMax) / 2) < 10 ? 'warning' : 'danger'

    // BMI adjustment for frame
    const bmi = wt / (hm * hm)
    let adjBmiRange: string
    if (finalFrame.includes("Small")) adjBmiRange = "18.0 - 22.5"
    else if (finalFrame.includes("Large")) adjBmiRange = "21.0 - 27.0"
    else adjBmiRange = "19.5 - 25.0"

    // Skeletal mass estimate
    const skeletalMass = r1(finalFrame.includes("Large") ? wt * 0.18 : finalFrame.includes("Small") ? wt * 0.12 : wt * 0.15)

    const score = frameStatus === 'good' && weightStatus === 'good' ? 88 : frameStatus === 'good' ? 70 : 55

    setResult({
      primaryMetric: { label: "Frame Size", value: finalFrame, status: frameStatus, description: consensus ? "Both methods agree" : "Methods disagree — medium assigned", icon: User },
      healthScore: score,
      metrics: [
        { label: "Final Frame", value: finalFrame, status: frameStatus, icon: User },
        { label: "Wrist Method", value: `${wristFrame} (${wristRatio})`, status: 'good', icon: Ruler },
        { label: "Elbow Method", value: `${elbowFrame} (${el} cm)`, status: 'good', icon: Ruler },
        { label: "Consensus", value: consensus ? "Yes" : "No", status: frameStatus, icon: Shield },
        { label: "Ideal Weight", value: `${idealMin}-${idealMax} kg`, status: weightStatus, icon: Scale },
        { label: "Current", value: `${wt} kg`, status: weightStatus, icon: TrendingUp },
        { label: "BMI Range", value: adjBmiRange, status: 'good', icon: BarChart3 },
        { label: "Skeletal Mass", value: `${skeletalMass} kg`, status: 'good', icon: Activity },
      ],
      recommendations: [
        { title: "Frame Size Result", description: `${finalFrame} frame (${consensus ? "high confidence — both wrist and elbow methods agree" : "mixed — wrist says " + wristFrame + ", elbow says " + elbowFrame}). Frame size is genetically determined and doesn't change with training.`, priority: 'medium', category: "Frame" },
        { title: "Wrist Method", description: `Height/Wrist ratio: ${wristRatio}. ${gender === 'male' ? '>10.4=small, 9.6-10.4=medium, <9.6=large.' : '>11.0=small, 10.1-11.0=medium, <10.1=large.'} Result: ${wristFrame}.`, priority: 'low', category: "Method" },
        { title: "Elbow Method", description: `Elbow breadth: ${el} cm. ${gender === 'male' ? '<6.5=small, 6.5-7.5=medium, >7.5=large.' : '<5.5=small, 5.5-6.5=medium, >6.5=large.'} Result: ${elbowFrame}.`, priority: 'low', category: "Method" },
        { title: "Ideal Weight Range", description: `Frame-adjusted ideal: ${idealMin}-${idealMax} kg. Current: ${wt} kg. ${inIdealRange ? "You're within your frame-appropriate ideal range." : `${wt < idealMin ? "Below" : "Above"} ideal by ${r1(Math.abs(wt - (idealMin + idealMax) / 2))} kg.`}`, priority: weightStatus !== 'good' ? 'high' : 'low', category: "Weight" },
        { title: "BMI Interpretation", description: `Frame-adjusted healthy BMI range: ${adjBmiRange}. Your BMI: ${r1(bmi)}. Standard BMI ranges don't account for frame size — large-framed individuals naturally have higher BMI at healthy weight.`, priority: 'medium', category: "BMI" },
      ],
      detailedBreakdown: {
        "Height": `${h} cm`, "Wrist": `${wr} cm`, "Elbow Breadth": `${el} cm`,
        "Weight": `${wt} kg`, "Gender": gender, "BMI": `${r1(bmi)}`,
        "Wrist Ratio": `${wristRatio}`, "Wrist Frame": wristFrame,
        "Elbow Frame": elbowFrame, "Consensus": consensus ? "Yes" : "No",
        "Final Frame": finalFrame, "Ideal Range": `${idealMin}-${idealMax} kg`,
        "Adjusted BMI Range": adjBmiRange, "Skeletal Mass": `${skeletalMass} kg`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Height" value={height} onChange={setHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Wrist Circumference" value={wrist} onChange={setWrist} min={10} max={30} suffix="cm" />
      <NumInput label="Elbow Breadth" value={elbow} onChange={setElbow} min={4} max={12} suffix="cm" />
      <NumInput label="Weight" value={weight} onChange={setWeight} min={30} max={300} suffix="kg" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Frame Size Calculator"
      description="Determine body frame using dual-method analysis (wrist + elbow), frame-adjusted ideal weight, and BMI interpretation."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Frame Size Calculator" description="Dual-method frame size analysis with adjusted weight targets and BMI ranges." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #41 — TIBIA LENGTH HEIGHT ESTIMATOR ====================
export function TibiaLengthHeightCalculator() {
  const [tibia, setTibia] = useState(38)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [ethnicity, setEthnicity] = useState("caucasian")
  const [knownHeight, setKnownHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const tb = clamp(tibia, 20, 55)
    const a = clamp(age, 18, 99)
    const kh = clamp(knownHeight, 120, 230)

    // Tibia-based height estimation (Trotter & Gleser equations adapted)
    let estHeight: number
    if (gender === "male") {
      if (ethnicity === "caucasian") estHeight = r1(2.42 * tb + 81.93)
      else if (ethnicity === "african") estHeight = r1(2.19 * tb + 86.02)
      else estHeight = r1(2.39 * tb + 81.45)
    } else {
      if (ethnicity === "caucasian") estHeight = r1(2.90 * tb + 61.53)
      else if (ethnicity === "african") estHeight = r1(2.45 * tb + 72.65)
      else estHeight = r1(2.80 * tb + 63.10)
    }

    // Age correction (height decreases ~1cm per decade after 30)
    const ageCorrection = a > 30 ? r1((a - 30) * 0.1) : 0
    const ageAdjusted = r1(estHeight - ageCorrection)

    // Accuracy comparison with known height
    const deviation = r1(ageAdjusted - kh)
    const accuracy = r1(100 - Math.abs(deviation / kh * 100))

    let accuracyClass: string; let accStatus: 'good' | 'warning' | 'danger'
    if (Math.abs(deviation) < 2) { accuracyClass = "Excellent match"; accStatus = 'good' }
    else if (Math.abs(deviation) < 5) { accuracyClass = "Good match"; accStatus = 'good' }
    else if (Math.abs(deviation) < 8) { accuracyClass = "Fair match"; accStatus = 'warning' }
    else { accuracyClass = "Poor match — verify measurement"; accStatus = 'danger' }

    // Leg proportionality
    const tibiaHeightRatio = r2(tb / kh * 100)
    let proportionality: string; let propStatus: 'good' | 'warning' | 'danger'
    if (tibiaHeightRatio < 20) { proportionality = "Short tibiae relative to height"; propStatus = 'warning' }
    else if (tibiaHeightRatio <= 24) { proportionality = "Proportional"; propStatus = 'good' }
    else { proportionality = "Long tibiae relative to height"; propStatus = 'good' }

    // Forensic/clinical application
    const forensicUse = `Estimated stature from tibia: ${ageAdjusted} cm (±3.5 cm). Equation: ${gender === 'male' ? 'Trotter-Gleser Male' : 'Trotter-Gleser Female'} (${ethnicity}).`

    // Sitting height estimate
    const estSittingHeight = r1(kh - tb * 2.15)
    const sittingRatio = r1(estSittingHeight / kh * 100)

    const score = accStatus === 'good' ? 85 : accStatus === 'warning' ? 60 : 35

    setResult({
      primaryMetric: { label: "Estimated Height", value: ageAdjusted, unit: "cm", status: accStatus, description: accuracyClass, icon: Ruler },
      healthScore: score,
      metrics: [
        { label: "Tibia Length", value: `${tb} cm`, status: 'good', icon: Ruler },
        { label: "Est. Height", value: `${ageAdjusted} cm`, status: accStatus, icon: TrendingUp },
        { label: "Known Height", value: `${kh} cm`, status: 'good', icon: User },
        { label: "Deviation", value: `${deviation > 0 ? '+' : ''}${deviation} cm`, status: accStatus, icon: BarChart3 },
        { label: "Accuracy", value: `${accuracy}%`, status: accStatus, icon: Shield },
        { label: "Tibia/Height %", value: `${tibiaHeightRatio}%`, status: propStatus, icon: Activity },
        { label: "Proportionality", value: proportionality.split(" ")[0], status: propStatus, icon: Scale },
        { label: "Age Correction", value: `−${ageCorrection} cm`, status: 'good', icon: Heart },
      ],
      recommendations: [
        { title: "Height Estimation", description: `Tibia ${tb} cm → estimated height ${estHeight} cm (raw), ${ageAdjusted} cm (age-adjusted). Using Trotter-Gleser ${gender} ${ethnicity} equation. Standard error: ±3.5 cm.`, priority: 'medium', category: "Estimation" },
        { title: "Accuracy Assessment", description: `${accuracyClass}. Deviation from known height: ${deviation > 0 ? '+' : ''}${deviation} cm (${accuracy}% accuracy). ${accStatus === 'danger' ? "Large deviation may indicate measurement error or atypical proportions." : "Within expected error margins."}`, priority: accStatus === 'danger' ? 'high' : 'low', category: "Accuracy" },
        { title: "Leg Proportionality", description: `Tibia/height ratio: ${tibiaHeightRatio}% → ${proportionality}. Normal range: 20-24%. ${propStatus === 'warning' ? "Shorter tibiae may indicate sitting-height-dominant body type." : "Standard proportions."}`, priority: 'low', category: "Proportion" },
        { title: "Age Correction", description: `Height decreases ~1 cm per decade after 30. Applied correction: −${ageCorrection} cm (age ${a}). Original estimate: ${estHeight} cm → Adjusted: ${ageAdjusted} cm.`, priority: 'low', category: "Aging" },
        { title: "Clinical Application", description: `${forensicUse} Tibia-based estimation is used in forensic anthropology, bedridden patient assessment, and scoliosis/kyphosis compensation. Most accurate long bone for height prediction in many populations.`, priority: 'medium', category: "Clinical" },
      ],
      detailedBreakdown: {
        "Tibia Length": `${tb} cm`, "Known Height": `${kh} cm`,
        "Age": `${a}`, "Gender": gender, "Ethnicity": ethnicity,
        "Raw Estimate": `${estHeight} cm`, "Age Correction": `−${ageCorrection} cm`,
        "Age-Adjusted": `${ageAdjusted} cm`, "Deviation": `${deviation} cm`,
        "Accuracy": `${accuracy}%`, "Match Quality": accuracyClass,
        "Tibia/Height %": `${tibiaHeightRatio}%`, "Proportionality": proportionality,
        "Est. Sitting Height": `${estSittingHeight} cm`, "Sitting Ratio": `${sittingRatio}%`,
        "Equation": `Trotter-Gleser (${gender}, ${ethnicity})`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Tibia Length" value={tibia} onChange={setTibia} min={20} max={55} suffix="cm" />
      <NumInput label="Known Height (for comparison)" value={knownHeight} onChange={setKnownHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={99} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
      <SelectInput label="Ethnicity" value={ethnicity} onChange={setEthnicity} options={[{ value: "caucasian", label: "Caucasian" }, { value: "african", label: "African" }, { value: "asian", label: "Asian" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Tibia Length Height Estimator"
      description="Estimate stature from tibia length using Trotter-Gleser equations, age correction, and proportionality analysis."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Tibia Length Height Estimator" description="Stature estimation from tibia with forensic anthropometry equations." categoryName="Body Measurements" />}
    />
  )
}

// ==================== #42 — ULNA LENGTH HEIGHT ESTIMATOR ====================
export function UlnaLengthHeightCalculator() {
  const [ulna, setUlna] = useState(26)
  const [age, setAge] = useState(35)
  const [gender, setGender] = useState("male")
  const [knownHeight, setKnownHeight] = useState(170)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const ul = clamp(ulna, 15, 40)
    const a = clamp(age, 18, 99)
    const kh = clamp(knownHeight, 120, 230)

    // Ulna-based height estimation (MUST equations - commonly used in elderly/bedridden)
    let estHeight: number
    if (gender === "male") {
      if (a < 65) estHeight = r1(4.32 * ul + 57.97)
      else estHeight = r1(3.70 * ul + 73.08)
    } else {
      if (a < 65) estHeight = r1(4.27 * ul + 57.76)
      else estHeight = r1(3.02 * ul + 88.95)
    }

    // Age shrinkage correction
    const ageCorrection = a > 30 ? r1((a - 30) * 0.1) : 0
    const ageAdjusted = r1(estHeight - ageCorrection)

    // Comparison with known height
    const deviation = r1(ageAdjusted - kh)
    const accuracy = r1(100 - Math.abs(deviation / kh * 100))

    let accuracyClass: string; let accStatus: 'good' | 'warning' | 'danger'
    if (Math.abs(deviation) < 2) { accuracyClass = "Excellent match"; accStatus = 'good' }
    else if (Math.abs(deviation) < 5) { accuracyClass = "Good match"; accStatus = 'good' }
    else if (Math.abs(deviation) < 8) { accuracyClass = "Fair match"; accStatus = 'warning' }
    else { accuracyClass = "Poor match"; accStatus = 'danger' }

    // Arm proportionality
    const ulnaHeightRatio = r2(ul / kh * 100)
    let armProp: string; let armStatus: 'good' | 'warning' | 'danger'
    if (ulnaHeightRatio < 14) { armProp = "Short forearms"; armStatus = 'warning' }
    else if (ulnaHeightRatio <= 17) { armProp = "Proportional forearms"; armStatus = 'good' }
    else { armProp = "Long forearms"; armStatus = 'good' }

    // Clinical application — bedridden/wheelchair patients
    const clinicalNote = a > 65
      ? "Ulna measurement is the preferred method for non-ambulatory elderly patients who cannot stand for height measurement."
      : "Ulna-based estimation useful for patients with spinal deformity, contractures, or mobility limitations."

    // Estimated arm span from ulna
    const estArmSpan = r1(ul * 6.5)
    const armSpanRatio = r1(estArmSpan / kh * 100)

    // Nutritional screening (MUST tool uses ulna for height → BMI)
    const estBMI = r1(70 / ((ageAdjusted / 100) * (ageAdjusted / 100)))
    const mustCategory = estBMI < 18.5 ? "High risk (underweight)" : estBMI < 20 ? "Medium risk" : "Low risk"
    const mustStatus: 'good' | 'warning' | 'danger' = estBMI < 18.5 ? 'danger' : estBMI < 20 ? 'warning' : 'good'

    const score = accStatus === 'good' ? 85 : accStatus === 'warning' ? 58 : 30

    setResult({
      primaryMetric: { label: "Estimated Height", value: ageAdjusted, unit: "cm", status: accStatus, description: accuracyClass, icon: Ruler },
      healthScore: score,
      metrics: [
        { label: "Ulna Length", value: `${ul} cm`, status: 'good', icon: Ruler },
        { label: "Est. Height", value: `${ageAdjusted} cm`, status: accStatus, icon: TrendingUp },
        { label: "Known Height", value: `${kh} cm`, status: 'good', icon: User },
        { label: "Deviation", value: `${deviation > 0 ? '+' : ''}${deviation} cm`, status: accStatus, icon: BarChart3 },
        { label: "Accuracy", value: `${accuracy}%`, status: accStatus, icon: Shield },
        { label: "Ulna/Height %", value: `${ulnaHeightRatio}%`, status: armStatus, icon: Activity },
        { label: "Arm Prop.", value: armProp.split(" ")[0], status: armStatus, icon: Scale },
        { label: "MUST Risk", value: mustCategory.split("(")[0].trim(), status: mustStatus, icon: Heart },
      ],
      recommendations: [
        { title: "Height from Ulna", description: `Ulna ${ul} cm → estimated height ${estHeight} cm (raw), ${ageAdjusted} cm (age-adjusted). Using ${a < 65 ? 'standard adult' : 'elderly-specific'} MUST equations. Standard error: ±3.0 cm.`, priority: 'medium', category: "Estimation" },
        { title: "Accuracy Check", description: `${accuracyClass}. Deviation: ${deviation > 0 ? '+' : ''}${deviation} cm (${accuracy}%). ${accStatus === 'danger' ? "Large deviation — verify ulna measurement technique (olecranon to styloid process)." : "Within expected range."}`, priority: accStatus === 'danger' ? 'high' : 'low', category: "Accuracy" },
        { title: "Arm Proportionality", description: `Ulna/height ratio: ${ulnaHeightRatio}% → ${armProp}. Normal: 14-17%. ${armStatus === 'warning' ? "Short forearms may indicate growth restriction or Marfan-type screening is not needed." : "Standard forearm proportions."}`, priority: 'low', category: "Proportion" },
        { title: "Clinical Application", description: `${clinicalNote} Ulna is easily accessible, unaffected by edema, and provides reliable height estimates for BMI calculation in clinical nutrition screening.`, priority: 'medium', category: "Clinical" },
        { title: "MUST Screening", description: `Using estimated height for MUST: est. BMI ~${estBMI} → ${mustCategory}. ${mustStatus === 'danger' ? "High malnutrition risk. Initiate nutritional support protocol." : mustStatus === 'warning' ? "Monitor dietary intake closely." : "Adequate nutritional status likely."}`, priority: mustStatus === 'danger' ? 'high' : 'low', category: "Nutrition" },
      ],
      detailedBreakdown: {
        "Ulna Length": `${ul} cm`, "Known Height": `${kh} cm`,
        "Age": `${a}`, "Gender": gender,
        "Raw Estimate": `${estHeight} cm`, "Age Correction": `−${ageCorrection} cm`,
        "Age-Adjusted": `${ageAdjusted} cm`, "Deviation": `${deviation} cm`,
        "Accuracy": `${accuracy}%`, "Match Quality": accuracyClass,
        "Ulna/Height %": `${ulnaHeightRatio}%`, "Arm Proportionality": armProp,
        "Est. Arm Span": `${estArmSpan} cm`, "Arm Span Ratio": `${armSpanRatio}%`,
        "Est. BMI (MUST)": `${estBMI}`, "MUST Risk": mustCategory,
        "Equation": `MUST (${a < 65 ? 'adult' : 'elderly'}, ${gender})`,
      },
    })
  }

  const inputs = (
    <div className="grid gap-4 md:grid-cols-2">
      <NumInput label="Ulna Length" value={ulna} onChange={setUlna} min={15} max={40} suffix="cm" />
      <NumInput label="Known Height (for comparison)" value={knownHeight} onChange={setKnownHeight} min={120} max={230} suffix="cm" />
      <NumInput label="Age" value={age} onChange={setAge} min={18} max={99} suffix="yrs" />
      <SelectInput label="Gender" value={gender} onChange={setGender} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} />
    </div>
  )

  return (
    <ComprehensiveHealthTemplate
      title="Ulna Length Height Estimator"
      description="Estimate stature from ulna using MUST equations, nutritional screening risk, and forearm proportionality analysis."
      inputs={inputs} calculate={calculate} result={result} categoryName="Body Measurements"
      seoContent={<SeoContentGenerator title="Ulna Length Height Estimator" description="Height estimation from ulna length with MUST nutritional screening integration." categoryName="Body Measurements" />}
    />
  )
}
