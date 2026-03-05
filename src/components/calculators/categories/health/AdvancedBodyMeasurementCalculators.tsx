"use client"

import { useState } from "react"
import { Ruler, Activity, BarChart3 } from "lucide-react"
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
  return <AdvancedBodyCompositionCalculator />
}

export function PonderalIndexCalculator() {
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(70)
  const [result, setResult] = useState<HealthResult | null>(null)

  const calculate = () => {
    const h = clamp(height, 120, 230) / 100
    const w = clamp(weight, 25, 350)
    const pi = w / Math.pow(h, 3)
    const status: 'normal' | 'warning' | 'danger' | 'good' = pi >= 11 && pi <= 15 ? 'good' : 'warning'

    setResult({
      primaryMetric: { label: "Ponderal Index", value: r2(pi), status, description: "Mass relative to height cubed", icon: BarChart3 },
      metrics: [
        { label: "Height", value: r1(h * 100), unit: "cm", status: 'normal', icon: Ruler },
        { label: "Weight", value: r1(w), unit: "kg", status: 'normal', icon: Activity },
      ],
      recommendations: [
        { title: "Interpretation", description: "Ponderal index is useful for proportionality screening and body build evaluation.", priority: 'medium', category: "Reference" },
      ],
      detailedBreakdown: { "Formula": "weight / height^3" },
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
      title="Ponderal Index Calculator"
      description="Calculate the Ponderal Index using body mass and height cubed."
      inputs={inputs}
      calculate={calculate}
      result={result}
      categoryName="Body Measurements"
      seoContent={
        <SeoContentGenerator
          title="Ponderal Index Calculator"
          description="Calculate the Ponderal Index using body mass and height cubed."
          categoryName="Body Measurements"
        />
      }
    />
  )
}

export function ABSICalculator() { return <AdvancedBodyCompositionCalculator /> }
export function BodyShapeIndexCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function FFMICalculator() { return <AdvancedBodyCompositionCalculator /> }
export function IdealBodyFatCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function ChestWaistRatioCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function ArmSpanHeightRatioCalculator() { return <AdvancedBodyCompositionCalculator /> }

export function MidUpperArmCircumferenceCalculator() {
  return (
    <GenericCircumferenceCalculator
      toolName="Mid Upper Arm Circumference"
      inputLabel="MUAC"
      healthyMin={22}
      healthyMax={33}
      description="MUAC helps track muscle and nutrition status in clinical and fitness contexts."
    />
  )
}

export function CalfCircumferenceCalculator() { return <GenericCircumferenceCalculator toolName="Calf Circumference Calculator" inputLabel="Calf Circumference" healthyMin={30} healthyMax={40} description="Track lower-leg muscle and edema changes over time." /> }
export function ThighCircumferenceCalculator() { return <GenericCircumferenceCalculator toolName="Thigh Circumference Calculator" inputLabel="Thigh Circumference" healthyMin={45} healthyMax={65} description="Track thigh size for training progression and symmetry." /> }
export function ForearmCircumferenceCalculator() { return <GenericCircumferenceCalculator toolName="Forearm Circumference Calculator" inputLabel="Forearm Circumference" healthyMin={22} healthyMax={33} description="Monitor forearm development and recovery trends." /> }
export function ShoulderWidthCalculator() { return <GenericCircumferenceCalculator toolName="Shoulder Width Calculator" inputLabel="Shoulder Width" healthyMin={36} healthyMax={52} description="Estimate shoulder breadth for posture and frame tracking." /> }
export function TorsoLengthCalculator() { return <GenericCircumferenceCalculator toolName="Torso Length Calculator" inputLabel="Torso Length" healthyMin={45} healthyMax={65} description="Track torso length metrics for fitting and posture analysis." /> }
export function LegLengthCalculator() { return <GenericCircumferenceCalculator toolName="Leg Length Calculator" inputLabel="Leg Length" healthyMin={70} healthyMax={110} description="Estimate lower-limb proportion relative to overall height." /> }
export function SittingHeightRatioCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function BMIPrimeCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function CorpulenceIndexCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function BodyRoundnessIndexCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function ConicityIndexCalculator() { return <AdvancedBodyCompositionCalculator /> }
export function SagittalAbdominalDiameterCalculator() { return <GenericCircumferenceCalculator toolName="Sagittal Abdominal Diameter" inputLabel="Abdominal Diameter" healthyMin={16} healthyMax={26} description="Track abdominal depth as a marker of visceral adiposity." /> }
export function WristCircumferenceCalculator() { return <GenericCircumferenceCalculator toolName="Wrist Circumference Calculator" inputLabel="Wrist Circumference" healthyMin={14} healthyMax={20} description="Wrist measurements are used in frame-size and proportion analysis." /> }
export function AnkleCircumferenceCalculator() { return <GenericCircumferenceCalculator toolName="Ankle Circumference Calculator" inputLabel="Ankle Circumference" healthyMin={18} healthyMax={28} description="Monitor ankle circumference for edema and recovery checks." /> }
export function BicepCircumferenceCalculator() { return <GenericCircumferenceCalculator toolName="Bicep Circumference Calculator" inputLabel="Bicep Circumference" healthyMin={25} healthyMax={45} description="Track bicep circumference for hypertrophy progression." /> }

export function TricepSkinfoldCalculator() { return <GenericCircumferenceCalculator toolName="Tricep Skinfold Calculator" inputLabel="Tricep Skinfold" healthyMin={8} healthyMax={25} unit="mm" description="Estimate peripheral subcutaneous fat from tricep skinfold." /> }
export function SubscapularSkinfoldCalculator() { return <GenericCircumferenceCalculator toolName="Subscapular Skinfold Calculator" inputLabel="Subscapular Skinfold" healthyMin={10} healthyMax={30} unit="mm" description="Track upper-back skinfold thickness for composition analysis." /> }
export function SuprailiacSkinfoldCalculator() { return <GenericCircumferenceCalculator toolName="Suprailiac Skinfold Calculator" inputLabel="Suprailiac Skinfold" healthyMin={8} healthyMax={28} unit="mm" description="Use suprailiac skinfold in multi-site body-fat estimation." /> }
export function AbdominalSkinfoldCalculator() { return <GenericCircumferenceCalculator toolName="Abdominal Skinfold Calculator" inputLabel="Abdominal Skinfold" healthyMin={10} healthyMax={35} unit="mm" description="Track abdominal skinfold as part of fat distribution monitoring." /> }
export function ThighSkinfoldCalculator() { return <GenericCircumferenceCalculator toolName="Thigh Skinfold Calculator" inputLabel="Thigh Skinfold" healthyMin={10} healthyMax={35} unit="mm" description="Measure thigh skinfold for lower-body composition trends." /> }
