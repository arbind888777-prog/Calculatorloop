"use client"

import { useState, useEffect } from "react"
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS, RadialLinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend
} from 'chart.js'
import { SeoContentGenerator } from "@/components/seo/SeoContentGenerator"

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// ─── Tool configuration ────────────────────────────────────────────────────────
const TOOLS = [
  { id: 'bmi-calculator',        label: 'BMI',         icon: '⚖️',  desc: 'Body Mass Index',        color: '#3b82f6' },
  { id: 'bmr-calculator',        label: 'Metabolism',  icon: '🔥',  desc: 'Basal Metabolic Rate',   color: '#f59e0b' },
  { id: 'body-fat-calculator',   label: 'Body Fat',    icon: '💪',  desc: 'Fat Percentage',         color: '#ef4444' },
  { id: 'lean-body-mass',        label: 'Muscle',      icon: '🏋️',  desc: 'Lean Body Mass',         color: '#22c55e' },
  { id: 'body-surface-area',     label: 'BSA',         icon: '📏',  desc: 'Body Surface Area',      color: '#8b5cf6' },
  { id: 'waist-hip-ratio',       label: 'WHR',         icon: '🩺',  desc: 'Waist-Hip Ratio',        color: '#ec4899' },
  { id: 'waist-to-height-ratio', label: 'WHtR',        icon: '📐',  desc: 'Waist-Height Ratio',     color: '#06b6d4' },
  { id: 'waist-circumference',   label: 'Waist',       icon: '🔵',  desc: 'Waist Girth',            color: '#f97316' },
  { id: 'neck-circumference',    label: 'Neck/OSA',    icon: '😴',  desc: 'Neck / Sleep Apnea',     color: '#84cc16' },
  { id: 'hip-circumference',     label: 'Hip',         icon: '🍐',  desc: 'Hip Circumference',      color: '#a855f7' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLatestScore(toolId: string): number | null {
  try {
    const raw = localStorage.getItem(`calculatorHistory:${toolId}`)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || data.length === 0) return null
    return typeof data[0]?.score === 'number' ? data[0].score : null
  } catch { return null }
}

function getLatestPrimary(toolId: string): string | null {
  try {
    const raw = localStorage.getItem(`calculatorHistory:${toolId}`)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data) || data.length === 0) return null
    return data[0]?.primary ?? null
  } catch { return null }
}

function getGrowthHistory(growthKey: string): {d: string; v: number}[] {
  try {
    const raw = localStorage.getItem(growthKey)
    if (!raw) return []
    return JSON.parse(raw) ?? []
  } catch { return [] }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function scoreColor(s: number | null) {
  if (s === null) return 'text-muted-foreground'
  if (s >= 80) return 'text-green-600 dark:text-green-400'
  if (s >= 60) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}
function scoreBg(s: number | null) {
  if (s === null) return 'bg-muted/30 border-border'
  if (s >= 80) return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
  if (s >= 60) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
  return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
}
function scoreLabel(s: number | null) {
  if (s === null) return '⬜ Not Measured'
  if (s >= 85) return '🟢 Excellent'
  if (s >= 70) return '🟡 Good'
  if (s >= 55) return '🟠 Fair'
  return '🔴 Attention Needed'
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function IntegratedBodyHealthEngine() {
  const [scores, setScores]       = useState<Record<string, number | null>>({})
  const [primaries, setPrimaries] = useState<Record<string, string | null>>({})
  const [overallScore, setOverallScore] = useState<number | null>(null)
  const [radarData, setRadarData] = useState<any>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [trendSummary, setTrendSummary] = useState<{bmi: number[]; fat: number[]; tdee: number[]}>({ bmi: [], fat: [], tdee: [] })

  const refresh = () => {
    const newScores: Record<string, number | null> = {}
    const newPrimaries: Record<string, string | null> = {}
    for (const tool of TOOLS) {
      newScores[tool.id]   = getLatestScore(tool.id)
      newPrimaries[tool.id] = getLatestPrimary(tool.id)
    }
    setScores(newScores)
    setPrimaries(newPrimaries)

    // Trend data from growth tracking
    setTrendSummary({
      bmi:  getGrowthHistory('growth:bmi-calculator').map(e => e.v),
      fat:  getGrowthHistory('growth:body-fat-calculator').map(e => e.v),
      tdee: getGrowthHistory('growth:bmr-calculator').map(e => e.v),
    })

    const valid = TOOLS.map(t => newScores[t.id]).filter((s): s is number => s !== null)
    if (valid.length > 0) {
      setOverallScore(Math.round(valid.reduce((a, b) => a + b, 0) / valid.length))
    } else {
      setOverallScore(null)
    }
    setLastUpdated(new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))

    // 6-dimension health radar
    const bmiScore    = newScores['bmi-calculator']        ?? 0
    const metabScore  = newScores['bmr-calculator']        ?? 0
    const fatScore    = newScores['body-fat-calculator']   ?? 0
    const muscleScore = newScores['lean-body-mass']        ?? 0
    const cvdScore    = Math.round(((newScores['waist-hip-ratio'] ?? 0) + (newScores['waist-to-height-ratio'] ?? 0)) / (
      (newScores['waist-hip-ratio'] !== null ? 1 : 0) + (newScores['waist-to-height-ratio'] !== null ? 1 : 0) || 1
    ))
    const anthropoScore = Math.round((
      (newScores['waist-circumference'] ?? 0) +
      (newScores['neck-circumference'] ?? 0) +
      (newScores['hip-circumference'] ?? 0)
    ) / (
      (newScores['waist-circumference'] !== null ? 1 : 0) +
      (newScores['neck-circumference'] !== null ? 1 : 0) +
      (newScores['hip-circumference'] !== null ? 1 : 0) || 1
    ))

    if (valid.length > 0) {
      setRadarData({
        labels: ['BMI / Weight', 'Metabolism', 'Body Fat', 'Muscle Mass', 'CVD Risk', 'Anthropometry'],
        datasets: [{
          label: 'Your Health Profile',
          data: [bmiScore, metabScore, fatScore, muscleScore, cvdScore, anthropoScore],
          backgroundColor: 'rgba(59,130,246,0.18)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointRadius: 5,
        }]
      })
    } else {
      setRadarData(null)
    }
  }

  useEffect(() => { refresh() }, [])

  const filledCount = TOOLS.filter(t => scores[t.id] !== null).length

  // Trend analysis helpers
  const trendDir = (arr: number[]) => {
    if (arr.length < 2) return '—'
    const diff = arr[arr.length - 1] - arr[0]
    return diff < -0.5 ? '📉 Improving' : diff > 0.5 ? '📈 Increasing' : '➡️ Stable'
  }

  const overall = overallScore
  const riskTools = TOOLS.filter(t => scores[t.id] !== null && scores[t.id]! < 60)
  const goodTools = TOOLS.filter(t => scores[t.id] !== null && scores[t.id]! >= 80)
  const partialTools = TOOLS.filter(t => scores[t.id] !== null && scores[t.id]! >= 60 && scores[t.id]! < 80)

  return (
    <div className="space-y-5 p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1 pt-2">
        <div className="text-3xl">🏥</div>
        <h1 className="text-xl font-bold">Integrated Body Health Engine</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Combines all 10 Body Measurement calculator results into a unified health score and risk profile.
          Use the individual calculators first to populate your data.
        </p>
      </div>

      {/* Overall Score */}
      <div className={`rounded-2xl border-2 p-5 text-center space-y-2 ${scoreBg(overall)}`}>
        <div className={`text-6xl font-black tabular-nums ${scoreColor(overall)}`}>
          {overall !== null ? overall : '–'}
        </div>
        <div className="text-sm font-bold">{scoreLabel(overall)}</div>
        <div className="text-xs text-muted-foreground">
          Overall Health Score (0–100) &nbsp;·&nbsp; {filledCount}/{TOOLS.length} calculators measured
        </div>
        {lastUpdated && <div className="text-xs text-muted-foreground">Updated: {lastUpdated}</div>}

        {filledCount === 0 && (
          <div className="mt-3 rounded-xl bg-background/60 border border-border p-3 text-xs text-muted-foreground text-left">
            <strong>How to use:</strong><br />
            1. Open any Body Measurement calculator (BMI, BMR, Body Fat, etc.)<br />
            2. Enter your data and press Calculate<br />
            3. Come back here and click <strong>Refresh</strong> to see your health score
          </div>
        )}
      </div>

      {/* 6-Dimension Radar */}
      {radarData ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">📊 6-Dimension Health Radar</h3>
          <div style={{ height: '250px' }}>
            <Radar data={radarData} options={{
              responsive: true, maintainAspectRatio: false,
              scales: {
                r: {
                  min: 0, max: 100,
                  ticks: { stepSize: 20, font: { size: 9 }, backdropColor: 'transparent' },
                  grid: { color: 'rgba(100,100,100,0.15)' },
                  angleLines: { color: 'rgba(100,100,100,0.15)' },
                  pointLabels: { font: { size: 10 } }
                }
              },
              plugins: { legend: { display: false } }
            }} />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Higher score = better health in that dimension</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          📊 Radar chart will appear once you have data from at least 2 calculators
        </div>
      )}

      {/* Trend Summary */}
      {(trendSummary.bmi.length > 1 || trendSummary.fat.length > 1 || trendSummary.tdee.length > 1) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">📈 Growth Trends</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'BMI', arr: trendSummary.bmi, color: '#3b82f6' },
              { label: 'Body Fat %', arr: trendSummary.fat, color: '#ef4444' },
              { label: 'TDEE kcal', arr: trendSummary.tdee, color: '#f59e0b' },
            ].map(({ label, arr, color }) => (
              <div key={label} className="rounded-lg bg-muted/30 border border-border p-2 text-center space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                <div className="text-xs font-bold" style={{ color }}>{trendDir(arr)}</div>
                {arr.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {arr[0]} → {arr[arr.length - 1]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-calculator metric cards */}
      <div>
        <h3 className="text-sm font-semibold mb-3">📋 Individual Metric Scores</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {TOOLS.map(tool => (
            <div key={tool.id} className={`rounded-xl border p-3 space-y-1.5 ${scoreBg(scores[tool.id])}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{tool.icon} {tool.label}</span>
                <span className={`text-lg font-black tabular-nums ${scoreColor(scores[tool.id])}`}>
                  {scores[tool.id] !== null ? scores[tool.id] : '–'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground truncate leading-tight">
                {primaries[tool.id] || tool.desc}
              </div>
              {scores[tool.id] !== null && (
                <div className="h-1.5 bg-background/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${scores[tool.id]}%`,
                      backgroundColor: scores[tool.id]! >= 80 ? '#22c55e' : scores[tool.id]! >= 60 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Refresh */}
      <button
        onClick={refresh}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all"
      >
        🔄 Refresh All Data
      </button>

      {/* Risk summary */}
      {filledCount > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">🏥 Health Report Summary</h3>

          {riskTools.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">⚠️ Needs Attention ({riskTools.length})</p>
              {riskTools.map(tool => (
                <div key={tool.id} className="flex items-start gap-2 text-xs bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <div>
                    <span className="font-semibold">{tool.icon} {tool.label}</span>
                    <span className="text-muted-foreground"> — Score {scores[tool.id]}/100. {primaries[tool.id] || 'Consider using this calculator for full analysis.'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {partialTools.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">🟡 Moderate ({partialTools.length})</p>
              {partialTools.map(tool => (
                <div key={tool.id} className="flex items-start gap-2 text-xs bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                  <span className="mt-0.5 shrink-0">📊</span>
                  <div>
                    <span className="font-semibold">{tool.icon} {tool.label}</span>
                    <span className="text-muted-foreground"> — Score {scores[tool.id]}/100. Room for improvement.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {goodTools.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">✅ Healthy ({goodTools.length})</p>
              {goodTools.map(tool => (
                <div key={tool.id} className="flex items-start gap-2 text-xs bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                  <span className="mt-0.5 shrink-0">✅</span>
                  <div>
                    <span className="font-semibold">{tool.icon} {tool.label}</span>
                    <span className="text-muted-foreground"> — Healthy range. Score {scores[tool.id]}/100.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {TOOLS.filter(t => scores[t.id] === null).length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2 border border-border">
              ℹ️ {TOOLS.filter(t => scores[t.id] === null).length} calculators not yet used:&nbsp;
              {TOOLS.filter(t => scores[t.id] === null).map(t => t.label).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Metabolic Risk Intelligence */}
      {filledCount >= 3 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold">🧬 Metabolic Risk Intelligence</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Cardiovascular Risk',
                icon: '❤️',
                score: scores['waist-hip-ratio'] !== null || scores['waist-to-height-ratio'] !== null
                  ? Math.round(((scores['waist-hip-ratio'] ?? 75) + (scores['waist-to-height-ratio'] ?? 75)) / 2)
                  : null,
                hint: 'Based on WHR + WHtR measurements'
              },
              {
                label: 'Metabolic Health',
                icon: '🔥',
                score: scores['bmr-calculator'] !== null || scores['body-fat-calculator'] !== null
                  ? Math.round(((scores['bmr-calculator'] ?? 80) + (scores['body-fat-calculator'] ?? 80)) / 2)
                  : null,
                hint: 'Based on BMR + Body Fat analysis'
              },
              {
                label: 'Muscle & Bone Health',
                icon: '💪',
                score: scores['lean-body-mass'],
                hint: 'Based on Lean Body Mass & FFMI'
              },
              {
                label: 'Adiposity Index',
                icon: '⚖️',
                score: scores['bmi-calculator'] !== null || scores['body-fat-calculator'] !== null
                  ? Math.round(((scores['bmi-calculator'] ?? 75) + (scores['body-fat-calculator'] ?? 75)) / 2)
                  : null,
                hint: 'Based on BMI + Body Fat composition'
              },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{item.label}</span>
                    <span className={`text-sm font-bold ${scoreColor(item.score)}`}>
                      {item.score !== null ? `${item.score}/100` : '—'}
                    </span>
                  </div>
                  {item.score !== null && (
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.score}%`,
                          backgroundColor: item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-0.5">{item.hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3 border border-border leading-relaxed">
        ⚕️ <strong>Medical Disclaimer:</strong> This engine provides estimates for educational and wellness screening purposes only.
        It is not a substitute for professional medical advice, diagnosis, or treatment.
        All scores are approximations based on self-reported data. Consult a qualified healthcare provider for personalized health assessment.
      </div>

      <SeoContentGenerator
        title="Integrated Body Health Engine"
        description="Unified health dashboard combining all 10 body measurement calculator results — BMI, BMR, body fat, lean mass, BSA, WHR, WHtR, and more — into one comprehensive health score."
        categoryName="Body Measurements"
      />
    </div>
  )
}
