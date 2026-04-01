"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Gauge, Activity, Copy, Check, RefreshCw,
  Sparkles, Lightbulb, TrendingUp, Zap,
  ArrowDown, Target, Clock, Rocket, BarChart3, Link2,
  RotateCcw, BookOpen, Play, ChevronRight, Search,
  Trash2, Share2, Printer, Download, FileType
} from 'lucide-react'
import Link from 'next/link'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportCalculationResult } from '@/lib/exportToPDF'
import { exportToPNG } from '@/lib/chartExport'
import { CustomDownloadModal } from '@/components/CustomDownloadModal'

// =========================================================
// TYPES
// =========================================================

interface UnitOption {
  value: string
  label: string
  factor: number // 1 base-unit = factor of this unit
}

interface InputField {
  name: string
  label: string
  symbol?: string
  defaultValue: number
  unitOptions: UnitOption[]
  defaultUnit: string
  helpText?: string
  min?: number
  max?: number
  step?: number
}

interface StepDetail {
  label: string
  expression: string
}

interface CalcResult {
  mainValue: number
  mainUnit: string
  mainLabel: string
  conversions: { label: string; value: string }[]
  steps: StepDetail[]
  tips: string[]
  formula: string
}

interface Preset {
  name: string
  icon: string
  values: Record<string, number>
}

interface ToolConfig {
  id: string
  title: string
  description: string
  inputs: InputField[]
  calculate: (values: Record<string, number>, units: Record<string, string>) => CalcResult
  smartAliases: Record<string, string[]>
  didYouKnow: string[]
  relatedTools: { id: string; title: string }[]
  presets?: Preset[]
  graphGenerator?: (values: Record<string, number>, units: Record<string, string>) => { x: number; y: number }[]
}

// =========================================================
// UNIT DEFINITIONS
// =========================================================

const distanceUnits: UnitOption[] = [
  { value: 'm', label: 'Meters (m)', factor: 1 },
  { value: 'km', label: 'Kilometers (km)', factor: 0.001 },
  { value: 'cm', label: 'Centimeters (cm)', factor: 100 },
  { value: 'ft', label: 'Feet (ft)', factor: 3.28084 },
  { value: 'mi', label: 'Miles (mi)', factor: 0.000621371 },
]

const timeUnits: UnitOption[] = [
  { value: 's', label: 'Seconds (s)', factor: 1 },
  { value: 'min', label: 'Minutes (min)', factor: 1 / 60 },
  { value: 'hr', label: 'Hours (hr)', factor: 1 / 3600 },
]

const velocityUnits: UnitOption[] = [
  { value: 'm/s', label: 'm/s', factor: 1 },
  { value: 'km/h', label: 'km/h', factor: 3.6 },
  { value: 'mph', label: 'mph', factor: 2.23694 },
  { value: 'ft/s', label: 'ft/s', factor: 3.28084 },
]

const accelerationUnits: UnitOption[] = [
  { value: 'm/s²', label: 'm/s²', factor: 1 },
  { value: 'ft/s²', label: 'ft/s²', factor: 3.28084 },
  { value: 'g', label: 'g-force', factor: 1 / 9.80665 },
]

const angleUnits: UnitOption[] = [
  { value: '°', label: 'Degrees (°)', factor: 1 },
  { value: 'rad', label: 'Radians', factor: Math.PI / 180 },
]

// =========================================================
// HELPERS
// =========================================================

const fmt = (n: number, d = 4): string => {
  if (!isFinite(n)) return 'Error'
  const abs = Math.abs(n)
  if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) return n.toExponential(3)
  return parseFloat(n.toFixed(d)).toString()
}

/** Convert user value to base (SI) unit */
const toBase = (value: number, unitValue: string, units: UnitOption[]): number => {
  const u = units.find(u => u.value === unitValue) || units[0]
  return value / u.factor
}

/** Convert base (SI) value to display unit */
const fromBase = (value: number, unitValue: string, units: UnitOption[]): number => {
  const u = units.find(u => u.value === unitValue) || units[0]
  return value * u.factor
}

const degToRad = (deg: number) => (deg * Math.PI) / 180

/** Parse smart text input into field values */
const parseSmartInput = (text: string, aliases: Record<string, string[]>): Record<string, number> => {
  const result: Record<string, number> = {}
  const cleaned = text.toLowerCase().trim()
  for (const [field, fieldAliases] of Object.entries(aliases)) {
    for (const alias of fieldAliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`${escaped}\\s*[=:]?\\s*([\\d.]+)`, 'i')
      const match = cleaned.match(regex)
      if (match) {
        result[field] = parseFloat(match[1])
        break
      }
    }
  }
  return result
}

const velocityConversions = (v_ms: number) => [
  { label: 'km/h', value: fmt(v_ms * 3.6, 2) },
  { label: 'mph', value: fmt(v_ms * 2.23694, 2) },
  { label: 'ft/s', value: fmt(v_ms * 3.28084, 2) },
]

const ERR = (msg: string, formula: string): CalcResult => ({
  mainValue: 0, mainUnit: '', mainLabel: `Error: ${msg}`,
  conversions: [], steps: [], tips: [], formula
})

// =========================================================
// 12 KINEMATICS TOOL CONFIGURATIONS
// =========================================================

const getConfig = (id: string): ToolConfig | null => {

  // -------------------------------------------------------
  // 1. VELOCITY CALCULATOR  (v = d / t)
  // -------------------------------------------------------
  if (id === 'velocity-calculator') {
    return {
      id,
      title: 'Velocity Calculator',
      description: 'Calculate velocity (speed) from distance and time with step-by-step solution and unit conversion.',
      inputs: [
        { name: 'distance', label: 'Distance', symbol: 'd', defaultValue: 100, unitOptions: distanceUnits, defaultUnit: 'm', helpText: 'Total distance covered', min: 0 },
        { name: 'time', label: 'Time', symbol: 't', defaultValue: 10, unitOptions: timeUnits, defaultUnit: 's', helpText: 'Time taken to cover the distance', min: 0.001 },
      ],
      smartAliases: { distance: ['distance', 'd', 'dist', 'length'], time: ['time', 't', 'sec', 'duration'] },
      presets: [
        { name: 'Walking', icon: '🚶', values: { distance: 100, time: 72 } },
        { name: 'Running', icon: '🏃', values: { distance: 100, time: 12 } },
        { name: 'Car (City)', icon: '🚗', values: { distance: 1000, time: 36 } },
        { name: 'Bullet Train', icon: '🚄', values: { distance: 10000, time: 36 } },
      ],
      calculate: (vals, units) => {
        const d = toBase(vals.distance ?? 0, units.distance ?? 'm', distanceUnits)
        const t = toBase(vals.time ?? 0, units.time ?? 's', timeUnits)
        if (t === 0) return ERR('Time cannot be zero', 'v = d ÷ t')
        const v = d / t
        const tips: string[] = []
        if (v < 2) tips.push('🚶 Walking speed range (~1.4 m/s average)')
        else if (v < 5) tips.push('🏃 Jogging/running speed')
        else if (v < 12) tips.push('🚴 Cycling speed')
        else if (v < 30) tips.push('🚗 City driving speed')
        else if (v < 100) tips.push('🏎️ Highway speed')
        else tips.push('✈️ Faster than most road vehicles!')
        return {
          mainValue: v, mainUnit: 'm/s', mainLabel: 'Velocity',
          conversions: velocityConversions(v),
          steps: [
            { label: 'Formula', expression: 'v = d ÷ t' },
            { label: 'Substitute', expression: `v = ${fmt(d, 2)} m ÷ ${fmt(t, 2)} s` },
            { label: 'Result', expression: `v = ${fmt(v, 4)} m/s` },
            { label: 'Convert', expression: `= ${fmt(v * 3.6, 2)} km/h = ${fmt(v * 2.23694, 2)} mph` },
          ],
          tips, formula: 'v = d ÷ t',
        }
      },
      didYouKnow: [
        '💡 Light travels at 299,792,458 m/s — the fastest speed possible!',
        '🔊 Sound travels at ~343 m/s in air at 20°C.',
        '🐆 A cheetah can reach 30 m/s (108 km/h).',
        '🚀 ISS orbits Earth at 7,660 m/s (27,600 km/h).',
      ],
      relatedTools: [
        { id: 'acceleration-calculator', title: 'Acceleration Calculator' },
        { id: 'displacement-calculator', title: 'Displacement Calculator' },
        { id: 'average-velocity-calculator', title: 'Average Velocity Calculator' },
        { id: 'kinematic-time-calculator', title: 'Time Calculator' },
      ],
    }
  }

  // -------------------------------------------------------
  // 2. AVERAGE VELOCITY CALCULATOR  (v_avg = Δx / Δt)
  // -------------------------------------------------------
  if (id === 'average-velocity-calculator') {
    return {
      id,
      title: 'Average Velocity Calculator',
      description: 'Calculate average velocity from displacement and time interval with step-by-step solution.',
      inputs: [
        { name: 'x1', label: 'Initial Position', symbol: 'x₁', defaultValue: 0, unitOptions: distanceUnits, defaultUnit: 'm', helpText: 'Starting position' },
        { name: 'x2', label: 'Final Position', symbol: 'x₂', defaultValue: 150, unitOptions: distanceUnits, defaultUnit: 'm', helpText: 'Ending position' },
        { name: 't1', label: 'Initial Time', symbol: 't₁', defaultValue: 0, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
        { name: 't2', label: 'Final Time', symbol: 't₂', defaultValue: 10, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
      ],
      smartAliases: { x1: ['x1', 'initial position', 'start'], x2: ['x2', 'final position', 'end'], t1: ['t1', 'start time'], t2: ['t2', 'end time', 'total time'] },
      calculate: (vals, units) => {
        const x1 = toBase(vals.x1 ?? 0, units.x1 ?? 'm', distanceUnits)
        const x2 = toBase(vals.x2 ?? 0, units.x2 ?? 'm', distanceUnits)
        const t1 = toBase(vals.t1 ?? 0, units.t1 ?? 's', timeUnits)
        const t2 = toBase(vals.t2 ?? 0, units.t2 ?? 's', timeUnits)
        const dx = x2 - x1, dt = t2 - t1
        if (dt === 0) return ERR('Time interval cannot be zero', 'v_avg = Δx / Δt')
        const v = dx / dt
        return {
          mainValue: v, mainUnit: 'm/s', mainLabel: 'Average Velocity',
          conversions: velocityConversions(v),
          steps: [
            { label: 'Formula', expression: 'v_avg = Δx / Δt = (x₂ − x₁) / (t₂ − t₁)' },
            { label: 'Displacement', expression: `Δx = ${fmt(x2, 2)} − ${fmt(x1, 2)} = ${fmt(dx, 2)} m` },
            { label: 'Time Interval', expression: `Δt = ${fmt(t2, 2)} − ${fmt(t1, 2)} = ${fmt(dt, 2)} s` },
            { label: 'Result', expression: `v_avg = ${fmt(dx, 2)} ÷ ${fmt(dt, 2)} = ${fmt(v, 4)} m/s` },
          ],
          tips: [
            v < 0 ? '⬅️ Negative velocity — motion in the opposite direction' : '➡️ Positive velocity — motion in the forward direction',
            '📐 Average velocity depends on displacement, not total path length',
          ],
          formula: 'v_avg = Δx / Δt',
        }
      },
      didYouKnow: [
        '📐 Average velocity can be zero even if you moved! (e.g., a round trip)',
        '🔄 Average speed ≠ Average velocity. Speed uses distance; velocity uses displacement.',
        '🏃 Usain Bolt\'s avg velocity in the 100m dash ≈ 10.44 m/s.',
      ],
      relatedTools: [
        { id: 'velocity-calculator', title: 'Velocity Calculator' },
        { id: 'displacement-calculator', title: 'Displacement Calculator' },
        { id: 'acceleration-calculator', title: 'Acceleration Calculator' },
      ],
    }
  }

  // -------------------------------------------------------
  // 3. ACCELERATION CALCULATOR  (a = (v − u) / t)
  // -------------------------------------------------------
  if (id === 'acceleration-calculator') {
    return {
      id,
      title: 'Acceleration Calculator',
      description: 'Calculate acceleration from change in velocity over time with unit conversion and step-by-step solution.',
      inputs: [
        { name: 'u', label: 'Initial Velocity', symbol: 'u', defaultValue: 0, unitOptions: velocityUnits, defaultUnit: 'm/s', helpText: 'Velocity at start' },
        { name: 'v', label: 'Final Velocity', symbol: 'v', defaultValue: 20, unitOptions: velocityUnits, defaultUnit: 'm/s', helpText: 'Velocity at end' },
        { name: 't', label: 'Time', symbol: 't', defaultValue: 5, unitOptions: timeUnits, defaultUnit: 's', min: 0.001 },
      ],
      smartAliases: { u: ['u', 'initial velocity', 'initial speed', 'vi'], v: ['v', 'final velocity', 'final speed', 'vf'], t: ['t', 'time', 'sec'] },
      presets: [
        { name: '0-100 km/h Car', icon: '🚗', values: { u: 0, v: 27.78, t: 8 } },
        { name: 'Sprinter Start', icon: '🏃', values: { u: 0, v: 10, t: 2 } },
        { name: 'Braking', icon: '🛑', values: { u: 30, v: 0, t: 5 } },
      ],
      calculate: (vals, units) => {
        const u = toBase(vals.u ?? 0, units.u ?? 'm/s', velocityUnits)
        const v = toBase(vals.v ?? 0, units.v ?? 'm/s', velocityUnits)
        const t = toBase(vals.t ?? 0, units.t ?? 's', timeUnits)
        if (t === 0) return ERR('Time cannot be zero', 'a = (v − u) / t')
        const a = (v - u) / t
        const gForce = a / 9.80665
        const tips: string[] = []
        if (a > 0) tips.push('🚀 Positive acceleration — object is speeding up')
        else if (a < 0) tips.push('🛑 Negative acceleration (deceleration) — object is slowing down')
        else tips.push('➡️ Zero acceleration — constant velocity')
        if (Math.abs(gForce) > 1) tips.push(`⚠️ ${fmt(Math.abs(gForce), 2)}g — this is ${Math.abs(gForce) > 5 ? 'extreme' : 'significant'} force!`)
        return {
          mainValue: a, mainUnit: 'm/s²', mainLabel: 'Acceleration',
          conversions: [
            { label: 'ft/s²', value: fmt(a * 3.28084, 2) },
            { label: 'g-force', value: fmt(gForce, 4) },
            { label: 'km/h/s', value: fmt(a * 3.6, 2) },
          ],
          steps: [
            { label: 'Formula', expression: 'a = (v − u) / t' },
            { label: 'Substitute', expression: `a = (${fmt(v, 2)} − ${fmt(u, 2)}) / ${fmt(t, 2)}` },
            { label: 'Simplify', expression: `a = ${fmt(v - u, 2)} / ${fmt(t, 2)}` },
            { label: 'Result', expression: `a = ${fmt(a, 4)} m/s²  (${fmt(gForce, 3)} g)` },
          ],
          tips, formula: 'a = (v − u) / t',
        }
      },
      didYouKnow: [
        '🌍 Gravity acceleration on Earth ≈ 9.81 m/s² (1g).',
        '🌙 Moon gravity ≈ 1.62 m/s² (0.165g) — 6× weaker than Earth.',
        '🚀 Astronauts experience up to 3g during launch.',
        '🏎️ An F1 car can brake at ~5g deceleration.',
      ],
      relatedTools: [
        { id: 'velocity-calculator', title: 'Velocity Calculator' },
        { id: 'final-velocity-calculator', title: 'Final Velocity Calculator' },
        { id: 'displacement-calculator', title: 'Displacement Calculator' },
        { id: 'equation-of-motion-calculator', title: 'Equation of Motion' },
      ],
    }
  }

  // -------------------------------------------------------
  // 4. DISPLACEMENT CALCULATOR  (s = ut + ½at²)
  // -------------------------------------------------------
  if (id === 'displacement-calculator') {
    return {
      id,
      title: 'Displacement Calculator',
      description: 'Calculate displacement using s = ut + ½at² with step-by-step solution and unit conversion.',
      inputs: [
        { name: 'u', label: 'Initial Velocity', symbol: 'u', defaultValue: 5, unitOptions: velocityUnits, defaultUnit: 'm/s' },
        { name: 'a', label: 'Acceleration', symbol: 'a', defaultValue: 2, unitOptions: accelerationUnits, defaultUnit: 'm/s²' },
        { name: 't', label: 'Time', symbol: 't', defaultValue: 10, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
      ],
      smartAliases: { u: ['u', 'initial velocity', 'speed', 'vi'], a: ['a', 'acceleration', 'accel'], t: ['t', 'time', 'sec'] },
      presets: [
        { name: 'Free Fall 3s', icon: '🍎', values: { u: 0, a: 9.81, t: 3 } },
        { name: 'Car Accelerating', icon: '🚗', values: { u: 10, a: 3, t: 8 } },
        { name: 'Braking', icon: '🛑', values: { u: 25, a: -5, t: 4 } },
      ],
      calculate: (vals, units) => {
        const u = toBase(vals.u ?? 0, units.u ?? 'm/s', velocityUnits)
        const a = toBase(vals.a ?? 0, units.a ?? 'm/s²', accelerationUnits)
        const t = toBase(vals.t ?? 0, units.t ?? 's', timeUnits)
        const s = u * t + 0.5 * a * t * t
        const v_final = u + a * t
        return {
          mainValue: s, mainUnit: 'm', mainLabel: 'Displacement',
          conversions: [
            { label: 'km', value: fmt(s * 0.001, 4) },
            { label: 'ft', value: fmt(s * 3.28084, 2) },
            { label: 'mi', value: fmt(s * 0.000621371, 6) },
            { label: 'Final velocity', value: `${fmt(v_final, 2)} m/s` },
          ],
          steps: [
            { label: 'Formula', expression: 's = ut + ½at²' },
            { label: 'Substitute', expression: `s = (${fmt(u, 2)})(${fmt(t, 2)}) + ½(${fmt(a, 2)})(${fmt(t, 2)})²` },
            { label: 'Part 1 — ut', expression: `= ${fmt(u * t, 2)} m` },
            { label: 'Part 2 — ½at²', expression: `= ${fmt(0.5 * a * t * t, 2)} m` },
            { label: 'Result', expression: `s = ${fmt(u * t, 2)} + ${fmt(0.5 * a * t * t, 2)} = ${fmt(s, 4)} m` },
          ],
          tips: [
            s < 0 ? '⬅️ Negative displacement — object moved backward from start' : '➡️ Positive displacement — object moved forward',
            `🏁 Final velocity at t = ${fmt(t, 1)}s is ${fmt(v_final, 2)} m/s`,
          ],
          formula: 's = ut + ½at²',
        }
      },
      didYouKnow: [
        '📏 Displacement is a vector — it has direction. Distance is scalar.',
        '🍎 A falling apple covers ~44.1 m in 3 seconds from rest.',
        '🔄 Displacement can be negative (moving backward) or zero (returning to start).',
      ],
      relatedTools: [
        { id: 'velocity-calculator', title: 'Velocity Calculator' },
        { id: 'kinematic-distance-calculator', title: 'Distance Calculator' },
        { id: 'final-velocity-calculator', title: 'Final Velocity Calculator' },
        { id: 'equation-of-motion-calculator', title: 'Equation of Motion' },
      ],
    }
  }

  // -------------------------------------------------------
  // 5. DISTANCE CALCULATOR  (d = v × t)
  // -------------------------------------------------------
  if (id === 'kinematic-distance-calculator') {
    return {
      id,
      title: 'Distance Calculator (Kinematics)',
      description: 'Calculate total distance traveled from speed and time, or with acceleration.',
      inputs: [
        { name: 'speed', label: 'Speed', symbol: 'v', defaultValue: 15, unitOptions: velocityUnits, defaultUnit: 'm/s', min: 0 },
        { name: 'time', label: 'Time', symbol: 't', defaultValue: 20, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
        { name: 'acceleration', label: 'Acceleration (optional)', symbol: 'a', defaultValue: 0, unitOptions: accelerationUnits, defaultUnit: 'm/s²', helpText: 'Leave 0 for constant speed' },
      ],
      smartAliases: { speed: ['speed', 'v', 'velocity'], time: ['time', 't', 'sec'], acceleration: ['a', 'acceleration', 'accel'] },
      presets: [
        { name: 'Walking 10min', icon: '🚶', values: { speed: 1.4, time: 600, acceleration: 0 } },
        { name: 'Driving 1hr', icon: '🚗', values: { speed: 16.67, time: 3600, acceleration: 0 } },
        { name: 'Sprint with accel', icon: '🏃', values: { speed: 0, time: 10, acceleration: 2.5 } },
      ],
      calculate: (vals, units) => {
        const v = toBase(vals.speed ?? 0, units.speed ?? 'm/s', velocityUnits)
        const t = toBase(vals.time ?? 0, units.time ?? 's', timeUnits)
        const a = toBase(vals.acceleration ?? 0, units.acceleration ?? 'm/s²', accelerationUnits)
        const d = Math.abs(v * t + 0.5 * a * t * t)
        return {
          mainValue: d, mainUnit: 'm', mainLabel: 'Distance',
          conversions: [
            { label: 'km', value: fmt(d * 0.001, 4) },
            { label: 'ft', value: fmt(d * 3.28084, 2) },
            { label: 'mi', value: fmt(d * 0.000621371, 6) },
          ],
          steps: [
            { label: 'Formula', expression: a !== 0 ? 'd = |vt + ½at²|' : 'd = v × t' },
            { label: 'Substitute', expression: a !== 0 ? `d = |${fmt(v, 2)} × ${fmt(t, 2)} + 0.5 × ${fmt(a, 2)} × ${fmt(t, 2)}²|` : `d = ${fmt(v, 2)} × ${fmt(t, 2)}` },
            { label: 'Result', expression: `d = ${fmt(d, 4)} m` },
            { label: 'Convert', expression: `= ${fmt(d * 0.001, 4)} km = ${fmt(d * 3.28084, 2)} ft` },
          ],
          tips: [
            `📏 Total distance in ${fmt(t, 1)} seconds = ${fmt(d, 2)} m`,
            a !== 0 ? '📈 With acceleration, distance grows quadratically over time' : '📊 At constant speed, distance grows linearly with time',
          ],
          formula: a !== 0 ? 'd = |vt + ½at²|' : 'd = v × t',
        }
      },
      didYouKnow: [
        '🌍 Earth orbits the Sun covering ~940 million km per year.',
        '🚗 At 60 km/h, a car covers 16.67 m every second.',
        '💡 Distance is always positive (scalar), unlike displacement.',
      ],
      relatedTools: [
        { id: 'velocity-calculator', title: 'Velocity Calculator' },
        { id: 'displacement-calculator', title: 'Displacement Calculator' },
        { id: 'kinematic-time-calculator', title: 'Time Calculator' },
      ],
    }
  }

  // -------------------------------------------------------
  // 6. TIME CALCULATOR  (t = d / v  or  t = (v − u) / a)
  // -------------------------------------------------------
  if (id === 'kinematic-time-calculator') {
    return {
      id,
      title: 'Time Calculator (Kinematics)',
      description: 'Calculate time from distance and speed, or from velocity change and acceleration.',
      inputs: [
        { name: 'distance', label: 'Distance', symbol: 'd', defaultValue: 100, unitOptions: distanceUnits, defaultUnit: 'm', min: 0 },
        { name: 'speed', label: 'Speed', symbol: 'v', defaultValue: 10, unitOptions: velocityUnits, defaultUnit: 'm/s', min: 0.001, helpText: 'Average speed of travel' },
      ],
      smartAliases: { distance: ['distance', 'd', 'dist'], speed: ['speed', 'v', 'velocity'] },
      presets: [
        { name: 'Marathon Pace', icon: '🏃', values: { distance: 42195, speed: 3.5 } },
        { name: '100m Sprint', icon: '⚡', values: { distance: 100, speed: 10 } },
        { name: 'Drive to Work', icon: '🚗', values: { distance: 15000, speed: 13.89 } },
      ],
      calculate: (vals, units) => {
        const d = toBase(vals.distance ?? 0, units.distance ?? 'm', distanceUnits)
        const v = toBase(vals.speed ?? 0, units.speed ?? 'm/s', velocityUnits)
        if (v === 0) return ERR('Speed cannot be zero', 't = d / v')
        const t = d / v
        const mins = t / 60, hrs = t / 3600
        return {
          mainValue: t, mainUnit: 's', mainLabel: 'Time',
          conversions: [
            { label: 'minutes', value: fmt(mins, 2) },
            { label: 'hours', value: fmt(hrs, 4) },
          ],
          steps: [
            { label: 'Formula', expression: 't = d ÷ v' },
            { label: 'Substitute', expression: `t = ${fmt(d, 2)} m ÷ ${fmt(v, 2)} m/s` },
            { label: 'Result', expression: `t = ${fmt(t, 4)} seconds` },
            { label: 'Convert', expression: `= ${fmt(mins, 2)} minutes = ${fmt(hrs, 4)} hours` },
          ],
          tips: [
            t < 60 ? '⚡ Less than a minute!' : t < 3600 ? `⏱️ About ${Math.round(mins)} minutes` : `🕐 About ${fmt(hrs, 1)} hours`,
          ],
          formula: 't = d ÷ v',
        }
      },
      didYouKnow: [
        '⏱️ Light takes ~8 minutes 20 seconds to reach Earth from the Sun.',
        '🌍 It takes ~24 hours for Earth to complete one rotation.',
        '🚀 Apollo missions took ~3 days to reach the Moon.',
      ],
      relatedTools: [
        { id: 'velocity-calculator', title: 'Velocity Calculator' },
        { id: 'kinematic-distance-calculator', title: 'Distance Calculator' },
        { id: 'acceleration-calculator', title: 'Acceleration Calculator' },
      ],
    }
  }

  // -------------------------------------------------------
  // 7. FINAL VELOCITY CALCULATOR  (v = u + at)
  // -------------------------------------------------------
  if (id === 'final-velocity-calculator') {
    return {
      id,
      title: 'Final Velocity Calculator',
      description: 'Calculate final velocity using v = u + at or v² = u² + 2as with step-by-step solution.',
      inputs: [
        { name: 'u', label: 'Initial Velocity', symbol: 'u', defaultValue: 5, unitOptions: velocityUnits, defaultUnit: 'm/s' },
        { name: 'a', label: 'Acceleration', symbol: 'a', defaultValue: 3, unitOptions: accelerationUnits, defaultUnit: 'm/s²' },
        { name: 't', label: 'Time', symbol: 't', defaultValue: 8, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
      ],
      smartAliases: { u: ['u', 'initial velocity', 'initial speed', 'vi'], a: ['a', 'acceleration'], t: ['t', 'time'] },
      presets: [
        { name: 'Car 0-100', icon: '🚗', values: { u: 0, a: 3.47, t: 8 } },
        { name: 'Rocket', icon: '🚀', values: { u: 0, a: 29.4, t: 120 } },
        { name: 'Ball Drop 2s', icon: '🏀', values: { u: 0, a: 9.81, t: 2 } },
      ],
      calculate: (vals, units) => {
        const u = toBase(vals.u ?? 0, units.u ?? 'm/s', velocityUnits)
        const a = toBase(vals.a ?? 0, units.a ?? 'm/s²', accelerationUnits)
        const t = toBase(vals.t ?? 0, units.t ?? 's', timeUnits)
        const v = u + a * t
        const s = u * t + 0.5 * a * t * t
        return {
          mainValue: v, mainUnit: 'm/s', mainLabel: 'Final Velocity',
          conversions: [
            ...velocityConversions(v),
            { label: 'Displacement', value: `${fmt(s, 2)} m` },
          ],
          steps: [
            { label: 'Formula (1st Equation)', expression: 'v = u + at' },
            { label: 'Substitute', expression: `v = ${fmt(u, 2)} + (${fmt(a, 2)})(${fmt(t, 2)})` },
            { label: 'Calculate at', expression: `at = ${fmt(a * t, 2)} m/s` },
            { label: 'Result', expression: `v = ${fmt(u, 2)} + ${fmt(a * t, 2)} = ${fmt(v, 4)} m/s` },
            { label: 'Bonus: Displacement', expression: `s = ut + ½at² = ${fmt(s, 2)} m` },
          ],
          tips: [
            v > u ? '📈 Object is speeding up' : v < u ? '📉 Object is slowing down' : '➡️ Constant velocity (no acceleration)',
            v < 0 ? '↩️ Object has reversed direction!' : '',
          ].filter(Boolean),
          formula: 'v = u + at',
        }
      },
      didYouKnow: [
        '🏎️ An F1 car goes from 0 to 100 km/h in ~2.5 seconds (a ≈ 11.1 m/s²).',
        '🚀 Saturn V rocket reached ~2,700 m/s at first-stage cutoff.',
        '🌊 Terminal velocity of a skydiver is about 53 m/s (190 km/h).',
      ],
      relatedTools: [
        { id: 'initial-velocity-calculator', title: 'Initial Velocity Calculator' },
        { id: 'acceleration-calculator', title: 'Acceleration Calculator' },
        { id: 'displacement-calculator', title: 'Displacement Calculator' },
        { id: 'equation-of-motion-calculator', title: 'Equation of Motion' },
      ],
    }
  }

  // -------------------------------------------------------
  // 8. INITIAL VELOCITY CALCULATOR  (u = v − at)
  // -------------------------------------------------------
  if (id === 'initial-velocity-calculator') {
    return {
      id,
      title: 'Initial Velocity Calculator',
      description: 'Calculate initial velocity using u = v − at with step-by-step solution and unit conversion.',
      inputs: [
        { name: 'v', label: 'Final Velocity', symbol: 'v', defaultValue: 30, unitOptions: velocityUnits, defaultUnit: 'm/s' },
        { name: 'a', label: 'Acceleration', symbol: 'a', defaultValue: 5, unitOptions: accelerationUnits, defaultUnit: 'm/s²' },
        { name: 't', label: 'Time', symbol: 't', defaultValue: 4, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
      ],
      smartAliases: { v: ['v', 'final velocity', 'vf', 'final speed'], a: ['a', 'acceleration'], t: ['t', 'time'] },
      calculate: (vals, units) => {
        const v = toBase(vals.v ?? 0, units.v ?? 'm/s', velocityUnits)
        const a = toBase(vals.a ?? 0, units.a ?? 'm/s²', accelerationUnits)
        const t = toBase(vals.t ?? 0, units.t ?? 's', timeUnits)
        const u = v - a * t
        return {
          mainValue: u, mainUnit: 'm/s', mainLabel: 'Initial Velocity',
          conversions: velocityConversions(u),
          steps: [
            { label: 'Formula (from 1st Equation)', expression: 'u = v − at' },
            { label: 'Substitute', expression: `u = ${fmt(v, 2)} − (${fmt(a, 2)})(${fmt(t, 2)})` },
            { label: 'Calculate at', expression: `at = ${fmt(a * t, 2)} m/s` },
            { label: 'Result', expression: `u = ${fmt(v, 2)} − ${fmt(a * t, 2)} = ${fmt(u, 4)} m/s` },
          ],
          tips: [
            u > v ? '📉 Object was decelerating (started faster)' : '📈 Object was accelerating (started slower)',
            u < 0 ? '↩️ Object must have started moving in the opposite direction!' : '',
          ].filter(Boolean),
          formula: 'u = v − at',
        }
      },
      didYouKnow: [
        '🏀 A basketball needs ~7 m/s initial velocity for a free throw.',
        '⚽ A professional soccer kick has initial velocity of ~30 m/s.',
        '🎯 Knowing initial velocity is key to trajectory prediction.',
      ],
      relatedTools: [
        { id: 'final-velocity-calculator', title: 'Final Velocity Calculator' },
        { id: 'acceleration-calculator', title: 'Acceleration Calculator' },
        { id: 'equation-of-motion-calculator', title: 'Equation of Motion' },
      ],
    }
  }

  // -------------------------------------------------------
  // 9. EQUATION OF MOTION CALCULATOR (All 3 equations)
  // -------------------------------------------------------
  if (id === 'equation-of-motion-calculator') {
    return {
      id,
      title: 'Equation of Motion Calculator',
      description: 'Universal kinematics solver — all 3 equations of motion. Enter any 3 values, get the rest!',
      inputs: [
        { name: 'u', label: 'Initial Velocity', symbol: 'u', defaultValue: 0, unitOptions: velocityUnits, defaultUnit: 'm/s', helpText: 'Leave empty if unknown' },
        { name: 'v', label: 'Final Velocity', symbol: 'v', defaultValue: 20, unitOptions: velocityUnits, defaultUnit: 'm/s', helpText: 'Leave empty if unknown' },
        { name: 'a', label: 'Acceleration', symbol: 'a', defaultValue: 4, unitOptions: accelerationUnits, defaultUnit: 'm/s²' },
        { name: 't', label: 'Time', symbol: 't', defaultValue: 5, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
        { name: 's', label: 'Displacement', symbol: 's', defaultValue: 50, unitOptions: distanceUnits, defaultUnit: 'm' },
      ],
      smartAliases: { u: ['u', 'initial velocity'], v: ['v', 'final velocity'], a: ['a', 'acceleration'], t: ['t', 'time'], s: ['s', 'displacement', 'distance'] },
      calculate: (vals, units) => {
        const u = toBase(vals.u ?? 0, units.u ?? 'm/s', velocityUnits)
        const v = toBase(vals.v ?? 0, units.v ?? 'm/s', velocityUnits)
        const a = toBase(vals.a ?? 0, units.a ?? 'm/s²', accelerationUnits)
        const t = toBase(vals.t ?? 0, units.t ?? 's', timeUnits)
        const s = toBase(vals.s ?? 0, units.s ?? 'm', distanceUnits)

        // Calculate all 3 equations
        const v_eq1 = u + a * t                    // v = u + at
        const s_eq2 = u * t + 0.5 * a * t * t      // s = ut + ½at²
        const v2_eq3 = u * u + 2 * a * s            // v² = u² + 2as
        const v_eq3 = v2_eq3 >= 0 ? Math.sqrt(v2_eq3) : NaN

        return {
          mainValue: v_eq1, mainUnit: 'm/s', mainLabel: 'Solutions from All 3 Equations',
          conversions: [
            { label: 'Eq1: v = u+at', value: `${fmt(v_eq1, 4)} m/s` },
            { label: 'Eq2: s = ut+½at²', value: `${fmt(s_eq2, 4)} m` },
            { label: 'Eq3: v² = u²+2as', value: isNaN(v_eq3) ? 'No real solution' : `${fmt(v_eq3, 4)} m/s` },
          ],
          steps: [
            { label: '1st Equation: v = u + at', expression: `v = ${fmt(u, 2)} + (${fmt(a, 2)})(${fmt(t, 2)}) = ${fmt(v_eq1, 4)} m/s` },
            { label: '2nd Equation: s = ut + ½at²', expression: `s = (${fmt(u, 2)})(${fmt(t, 2)}) + ½(${fmt(a, 2)})(${fmt(t, 2)})² = ${fmt(s_eq2, 4)} m` },
            { label: '3rd Equation: v² = u² + 2as', expression: `v² = (${fmt(u, 2)})² + 2(${fmt(a, 2)})(${fmt(s, 2)}) = ${fmt(v2_eq3, 4)}` },
            { label: 'Therefore v from Eq3', expression: isNaN(v_eq3) ? 'v² is negative — no real solution' : `v = √${fmt(v2_eq3, 4)} = ${fmt(v_eq3, 4)} m/s` },
          ],
          tips: [
            '📝 The 3 equations of motion are the foundation of kinematics',
            '🔢 Eq1: no displacement needed  |  Eq2: no final velocity needed  |  Eq3: no time needed',
            Math.abs(v_eq1 - v) < 0.01 ? '✅ Your inputs are consistent with Eq1!' : `⚠️ Note: v you entered (${fmt(v, 2)}) ≠ v from Eq1 (${fmt(v_eq1, 2)})`,
          ],
          formula: 'v = u + at  |  s = ut + ½at²  |  v² = u² + 2as',
        }
      },
      didYouKnow: [
        '📜 These equations were formulated by Galileo Galilei in the 17th century.',
        '🔢 All 3 equations assume constant (uniform) acceleration.',
        '🌍 These equations work for any motion with constant acceleration — cars, rockets, falling objects.',
        '🎓 You only need 3 known values to solve for the other 2 unknowns.',
      ],
      relatedTools: [
        { id: 'final-velocity-calculator', title: 'Final Velocity Calculator' },
        { id: 'displacement-calculator', title: 'Displacement Calculator' },
        { id: 'acceleration-calculator', title: 'Acceleration Calculator' },
        { id: 'free-fall-calculator', title: 'Free Fall Calculator' },
      ],
    }
  }

  // -------------------------------------------------------
  // 10. FREE FALL CALCULATOR  (h = ½gt², v = gt)
  // -------------------------------------------------------
  if (id === 'free-fall-calculator') {
    return {
      id,
      title: 'Free Fall Calculator',
      description: 'Calculate distance, velocity, and time in free fall under gravity. Choose planet gravity!',
      inputs: [
        { name: 'time', label: 'Time of Fall', symbol: 't', defaultValue: 3, unitOptions: timeUnits, defaultUnit: 's', min: 0 },
        { name: 'u', label: 'Initial Velocity (downward)', symbol: 'u₀', defaultValue: 0, unitOptions: velocityUnits, defaultUnit: 'm/s', helpText: 'Usually 0 for dropped objects' },
        { name: 'gravity', label: 'Gravity', symbol: 'g', defaultValue: 9.80665, unitOptions: accelerationUnits, defaultUnit: 'm/s²', helpText: 'Earth: 9.81, Moon: 1.62, Mars: 3.72' },
      ],
      smartAliases: { time: ['t', 'time'], u: ['u', 'initial', 'speed'], gravity: ['g', 'gravity'] },
      presets: [
        { name: 'Earth 1s', icon: '🌍', values: { time: 1, u: 0, gravity: 9.80665 } },
        { name: 'Earth 5s', icon: '🌍', values: { time: 5, u: 0, gravity: 9.80665 } },
        { name: 'Moon 3s', icon: '🌙', values: { time: 3, u: 0, gravity: 1.625 } },
        { name: 'Mars 3s', icon: '🔴', values: { time: 3, u: 0, gravity: 3.721 } },
        { name: 'Jupiter 3s', icon: '🟤', values: { time: 3, u: 0, gravity: 24.79 } },
      ],
      calculate: (vals, units) => {
        const t = toBase(vals.time ?? 0, units.time ?? 's', timeUnits)
        const u = toBase(vals.u ?? 0, units.u ?? 'm/s', velocityUnits)
        const g = toBase(vals.gravity ?? 9.80665, units.gravity ?? 'm/s²', accelerationUnits)
        const h = u * t + 0.5 * g * t * t
        const v = u + g * t
        return {
          mainValue: h, mainUnit: 'm', mainLabel: 'Distance Fallen',
          conversions: [
            { label: 'Final velocity', value: `${fmt(v, 2)} m/s (${fmt(v * 3.6, 2)} km/h)` },
            { label: 'km', value: fmt(h * 0.001, 6) },
            { label: 'ft', value: fmt(h * 3.28084, 2) },
          ],
          steps: [
            { label: 'Formulas', expression: 'h = u₀t + ½gt²  and  v = u₀ + gt' },
            { label: 'Distance: ½gt²', expression: `h = (${fmt(u, 2)})(${fmt(t, 2)}) + ½(${fmt(g, 4)})(${fmt(t, 2)})² = ${fmt(h, 4)} m` },
            { label: 'Final velocity', expression: `v = ${fmt(u, 2)} + (${fmt(g, 4)})(${fmt(t, 2)}) = ${fmt(v, 4)} m/s` },
            { label: 'In km/h', expression: `v = ${fmt(v * 3.6, 2)} km/h` },
          ],
          tips: [
            `📏 After ${fmt(t, 1)}s, object has fallen ${fmt(h, 2)} m`,
            `🏎️ Impact velocity: ${fmt(v, 2)} m/s (${fmt(v * 3.6, 1)} km/h)`,
            g > 15 ? '🪐 That\'s high gravity! Objects fall much faster here.' : '',
          ].filter(Boolean),
          formula: 'h = u₀t + ½gt²  |  v = u₀ + gt',
        }
      },
      didYouKnow: [
        '🍎 This is how Newton discovered gravity — watching an apple fall!',
        '🌍 On Earth, a free-falling object reaches ~9.8 m/s after just 1 second.',
        '🪶 In a vacuum, a feather and a bowling ball fall at the same rate.',
        '🌙 On the Moon, a 3s fall covers only 7.3 m vs 44.1 m on Earth.',
      ],
      relatedTools: [
        { id: 'projectile-motion', title: 'Projectile Motion' },
        { id: 'final-velocity-calculator', title: 'Final Velocity Calculator' },
        { id: 'displacement-calculator', title: 'Displacement Calculator' },
        { id: 'time-of-flight-calculator', title: 'Time of Flight Calculator' },
      ],
    }
  }

  // -------------------------------------------------------
  // 11. PROJECTILE MOTION CALCULATOR (with trajectory graph)
  // -------------------------------------------------------
  if (id === 'projectile-motion') {
    return {
      id,
      title: 'Projectile Motion Calculator',
      description: 'Calculate range, max height, time of flight, and see the trajectory graph!',
      inputs: [
        { name: 'v0', label: 'Initial Velocity', symbol: 'v₀', defaultValue: 25, unitOptions: velocityUnits, defaultUnit: 'm/s', min: 0 },
        { name: 'angle', label: 'Launch Angle', symbol: 'θ', defaultValue: 45, unitOptions: angleUnits, defaultUnit: '°', min: 0, max: 90 },
        { name: 'h0', label: 'Initial Height', symbol: 'h₀', defaultValue: 0, unitOptions: distanceUnits, defaultUnit: 'm', min: 0, helpText: 'Height above ground at launch' },
        { name: 'gravity', label: 'Gravity', symbol: 'g', defaultValue: 9.81, unitOptions: accelerationUnits, defaultUnit: 'm/s²' },
      ],
      smartAliases: { v0: ['v0', 'velocity', 'speed', 'v'], angle: ['angle', 'theta', 'deg'], h0: ['height', 'h', 'h0'], gravity: ['g', 'gravity'] },
      presets: [
        { name: 'Basketball', icon: '🏀', values: { v0: 7, angle: 52, h0: 2, gravity: 9.81 } },
        { name: 'Baseball', icon: '⚾', values: { v0: 40, angle: 35, h0: 1, gravity: 9.81 } },
        { name: 'Cannonball', icon: '💣', values: { v0: 100, angle: 45, h0: 0, gravity: 9.81 } },
        { name: 'Golf Drive', icon: '⛳', values: { v0: 70, angle: 12, h0: 0, gravity: 9.81 } },
      ],
      calculate: (vals, units) => {
        const v0 = toBase(vals.v0 ?? 0, units.v0 ?? 'm/s', velocityUnits)
        const angleDeg = vals.angle ?? 45
        const h0 = toBase(vals.h0 ?? 0, units.h0 ?? 'm', distanceUnits)
        const g = toBase(vals.gravity ?? 9.81, units.gravity ?? 'm/s²', accelerationUnits)

        const rad = degToRad(angleDeg)
        const vx = v0 * Math.cos(rad)
        const vy = v0 * Math.sin(rad)

        // Time of flight (considering initial height)
        // h0 + vy*t - 0.5*g*t² = 0  =>  t = (vy + √(vy² + 2gh0)) / g
        const discriminant = vy * vy + 2 * g * h0
        const T = discriminant >= 0 ? (vy + Math.sqrt(discriminant)) / g : 0
        const range = vx * T
        const maxHeight = h0 + (vy * vy) / (2 * g)
        const tMaxH = vy / g
        const vLanding = Math.sqrt(vx * vx + (vy - g * T) * (vy - g * T))
        const impactAngle = Math.atan2(Math.abs(vy - g * T), vx) * (180 / Math.PI)

        return {
          mainValue: range, mainUnit: 'm', mainLabel: 'Range (Horizontal Distance)',
          conversions: [
            { label: 'Max Height', value: `${fmt(maxHeight, 2)} m` },
            { label: 'Time of Flight', value: `${fmt(T, 3)} s` },
            { label: 'Time to Max Height', value: `${fmt(tMaxH, 3)} s` },
            { label: 'Landing Speed', value: `${fmt(vLanding, 2)} m/s` },
            { label: 'Impact Angle', value: `${fmt(impactAngle, 1)}°` },
            { label: 'Range (km)', value: fmt(range * 0.001, 4) },
          ],
          steps: [
            { label: 'Components', expression: `vₓ = v₀ cos(θ) = ${fmt(v0, 2)} × cos(${fmt(angleDeg, 1)}°) = ${fmt(vx, 4)} m/s` },
            { label: 'Vertical component', expression: `vᵧ = v₀ sin(θ) = ${fmt(v0, 2)} × sin(${fmt(angleDeg, 1)}°) = ${fmt(vy, 4)} m/s` },
            { label: 'Time of Flight', expression: `T = (vᵧ + √(vᵧ² + 2gh₀)) / g = ${fmt(T, 4)} s` },
            { label: 'Range', expression: `R = vₓ × T = ${fmt(vx, 2)} × ${fmt(T, 4)} = ${fmt(range, 4)} m` },
            { label: 'Max Height', expression: `H = h₀ + vᵧ² / (2g) = ${fmt(h0, 2)} + ${fmt(vy * vy, 2)} / ${fmt(2 * g, 2)} = ${fmt(maxHeight, 4)} m` },
          ],
          tips: [
            angleDeg === 45 ? '🎯 45° gives maximum range for ground-level launches!' : angleDeg > 45 ? '📐 Angle > 45° = higher but shorter range' : '📐 Angle < 45° = lower trajectory, shorter range',
            `🏔️ Max height reached at t = ${fmt(tMaxH, 2)}s`,
            `💥 Landing speed: ${fmt(vLanding, 2)} m/s at ${fmt(impactAngle, 1)}° below horizontal`,
          ],
          formula: 'R = vₓT  |  H = h₀ + vᵧ²/(2g)  |  T = (vᵧ + √(vᵧ²+2gh₀))/g',
        }
      },
      graphGenerator: (vals, units) => {
        const v0 = toBase(vals.v0 ?? 25, units.v0 ?? 'm/s', velocityUnits)
        const angleDeg = vals.angle ?? 45
        const h0 = toBase(vals.h0 ?? 0, units.h0 ?? 'm', distanceUnits)
        const g = toBase(vals.gravity ?? 9.81, units.gravity ?? 'm/s²', accelerationUnits)
        const rad = degToRad(angleDeg)
        const vx = v0 * Math.cos(rad)
        const vy = v0 * Math.sin(rad)
        const disc = vy * vy + 2 * g * h0
        const T = disc >= 0 ? (vy + Math.sqrt(disc)) / g : 0
        const points: { x: number; y: number }[] = []
        const n = 80
        for (let i = 0; i <= n; i++) {
          const t = (i / n) * T
          const x = vx * t
          const y = h0 + vy * t - 0.5 * g * t * t
          if (y >= 0) points.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) })
        }
        return points
      },
      didYouKnow: [
        '🎯 For flat ground, 45° angle always gives maximum range.',
        '⚾ A baseball hit at 45° with 44 m/s travels ~200 m (ignoring air drag).',
        '🏹 Complementary angles (e.g., 30° and 60°) give the same range!',
        '🌙 On the Moon (g=1.62), the same throw goes ~6x farther!',
      ],
      relatedTools: [
        { id: 'time-of-flight-calculator', title: 'Time of Flight Calculator' },
        { id: 'free-fall-calculator', title: 'Free Fall Calculator' },
        { id: 'final-velocity-calculator', title: 'Final Velocity Calculator' },
        { id: 'velocity-calculator', title: 'Velocity Calculator' },
      ],
    }
  }

  // -------------------------------------------------------
  // 12. TIME OF FLIGHT CALCULATOR
  // -------------------------------------------------------
  if (id === 'time-of-flight-calculator') {
    return {
      id,
      title: 'Time of Flight Calculator',
      description: 'Calculate how long a projectile stays in the air. Shows ascent and descent time separately.',
      inputs: [
        { name: 'v0', label: 'Initial Velocity', symbol: 'v₀', defaultValue: 20, unitOptions: velocityUnits, defaultUnit: 'm/s', min: 0 },
        { name: 'angle', label: 'Launch Angle', symbol: 'θ', defaultValue: 60, unitOptions: angleUnits, defaultUnit: '°', min: 0, max: 90 },
        { name: 'h0', label: 'Launch Height', symbol: 'h₀', defaultValue: 0, unitOptions: distanceUnits, defaultUnit: 'm', min: 0, helpText: 'Height above ground' },
        { name: 'gravity', label: 'Gravity', symbol: 'g', defaultValue: 9.81, unitOptions: accelerationUnits, defaultUnit: 'm/s²' },
      ],
      smartAliases: { v0: ['v0', 'velocity', 'speed'], angle: ['angle', 'theta'], h0: ['height', 'h', 'h0'], gravity: ['g', 'gravity'] },
      presets: [
        { name: 'Straight Up', icon: '⬆️', values: { v0: 20, angle: 90, h0: 0, gravity: 9.81 } },
        { name: '45° Launch', icon: '↗️', values: { v0: 20, angle: 45, h0: 0, gravity: 9.81 } },
        { name: 'From Cliff', icon: '🏔️', values: { v0: 10, angle: 30, h0: 50, gravity: 9.81 } },
      ],
      calculate: (vals, units) => {
        const v0 = toBase(vals.v0 ?? 0, units.v0 ?? 'm/s', velocityUnits)
        const angleDeg = vals.angle ?? 45
        const h0 = toBase(vals.h0 ?? 0, units.h0 ?? 'm', distanceUnits)
        const g = toBase(vals.gravity ?? 9.81, units.gravity ?? 'm/s²', accelerationUnits)
        const rad = degToRad(angleDeg)
        const vy = v0 * Math.sin(rad)
        const vx = v0 * Math.cos(rad)
        const tUp = vy / g
        const disc = vy * vy + 2 * g * h0
        const T = disc >= 0 ? (vy + Math.sqrt(disc)) / g : 0
        const tDown = T - tUp
        const maxH = h0 + (vy * vy) / (2 * g)
        const range = vx * T
        return {
          mainValue: T, mainUnit: 's', mainLabel: 'Total Time of Flight',
          conversions: [
            { label: 'Ascent Time', value: `${fmt(tUp, 3)} s` },
            { label: 'Descent Time', value: `${fmt(tDown, 3)} s` },
            { label: 'Max Height', value: `${fmt(maxH, 2)} m` },
            { label: 'Range', value: `${fmt(range, 2)} m` },
          ],
          steps: [
            { label: 'Vertical component', expression: `vᵧ = v₀ sin(θ) = ${fmt(v0, 2)} × sin(${fmt(angleDeg, 1)}°) = ${fmt(vy, 4)} m/s` },
            { label: 'Ascent time (to peak)', expression: `t_up = vᵧ / g = ${fmt(vy, 4)} / ${fmt(g, 4)} = ${fmt(tUp, 4)} s` },
            { label: 'Total flight time', expression: `T = (vᵧ + √(vᵧ² + 2gh₀)) / g = ${fmt(T, 4)} s` },
            { label: 'Descent time', expression: `t_down = T − t_up = ${fmt(T, 4)} − ${fmt(tUp, 4)} = ${fmt(tDown, 4)} s` },
          ],
          tips: [
            h0 > 0 ? `🏔️ Starting from ${fmt(h0, 1)}m height makes descent longer than ascent` : tUp === tDown || Math.abs(tUp - tDown) < 0.01 ? '⚖️ Ascent time = Descent time (launched from ground level)' : '',
            angleDeg === 90 ? '⬆️ Straight up! All velocity is vertical.' : `↗️ At ${fmt(angleDeg, 0)}°, vertical component = ${fmt(vy, 2)} m/s`,
          ].filter(Boolean),
          formula: 'T = (vᵧ + √(vᵧ² + 2gh₀)) / g',
        }
      },
      didYouKnow: [
        '⬆️ A ball thrown straight up at 20 m/s stays airborne for ~4.08 seconds.',
        '⚖️ Without initial height, ascent time always equals descent time.',
        '🏔️ Throwing from a height makes the total flight longer (asymmetric path).',
      ],
      relatedTools: [
        { id: 'projectile-motion', title: 'Projectile Motion' },
        { id: 'free-fall-calculator', title: 'Free Fall Calculator' },
        { id: 'final-velocity-calculator', title: 'Final Velocity Calculator' },
      ],
    }
  }

  return null
}

// =========================================================
// MAIN CALCULATOR COMPONENT
// =========================================================

function KinematicsCalculatorInner({ id }: { id: string }) {
  const config = useMemo(() => getConfig(id), [id])
  const exportElementId = `kinematics-export-${id}`

  const [values, setValues] = useState<Record<string, number>>({})
  const [units, setUnits] = useState<Record<string, string>>({})
  const [result, setResult] = useState<CalcResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [smartInput, setSmartInput] = useState('')
  const [showSmartInput, setShowSmartInput] = useState(false)
  const [autoCalc, setAutoCalc] = useState(true)
  const [showGraph, setShowGraph] = useState(true)
  const [downloadMode, setDownloadMode] = useState<'choose' | 'auto' | 'custom'>('choose')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [customModalFormat, setCustomModalFormat] = useState('pdf')

  // Initialize defaults
  useEffect(() => {
    if (!config) return
    const defaultVals: Record<string, number> = {}
    const defaultUnits: Record<string, string> = {}
    config.inputs.forEach(inp => {
      defaultVals[inp.name] = inp.defaultValue
      defaultUnits[inp.name] = inp.defaultUnit
    })
    setValues(defaultVals)
    setUnits(defaultUnits)
    setResult(null)
    setSmartInput('')
  }, [config])

  // Auto-calculate
  useEffect(() => {
    if (!autoCalc || !config) return
    const timer = setTimeout(() => {
      setResult(config.calculate(values, units))
    }, 300)
    return () => clearTimeout(timer)
  }, [values, units, autoCalc, config])

  const handleCalculate = useCallback(() => {
    if (!config) return
    setResult(config.calculate(values, units))
  }, [config, values, units])

  const handleReset = useCallback(() => {
    if (!config) return
    const defaultVals: Record<string, number> = {}
    const defaultUnits: Record<string, string> = {}
    config.inputs.forEach(inp => {
      defaultVals[inp.name] = inp.defaultValue
      defaultUnits[inp.name] = inp.defaultUnit
    })
    setValues(defaultVals)
    setUnits(defaultUnits)
    setResult(null)
    setSmartInput('')
  }, [config])

  const handleCopy = async () => {
    if (!result) return
    const lines = [
      `${config?.title || 'Result'}`,
      `${result.mainLabel}: ${fmt(result.mainValue, 4)} ${result.mainUnit}`,
      ...result.conversions.map(c => `${c.label}: ${c.value}`),
      '',
      'Steps:',
      ...result.steps.map((s, i) => `${i + 1}. ${s.label}: ${s.expression}`),
    ]
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = useCallback(async () => {
    const shareData = {
      title: config?.title || 'Kinematics Calculator',
      text: config?.description || 'Advanced physics calculator',
      url: typeof window !== 'undefined' ? window.location.href : '',
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // Fall back to clipboard below.
      }
    }

    if (shareData.url) {
      await navigator.clipboard.writeText(shareData.url)
    }
  }, [config])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleDownload = useCallback(async (format: 'pdf' | 'png' | 'json' | 'csv') => {
    if (!config || !result) return

    const slug = config.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const inputRows = config.inputs.map((input) => ({
      label: input.label,
      value: `${fmt(values[input.name] ?? input.defaultValue, 4)} ${units[input.name] ?? input.defaultUnit}`,
    }))

    if (format === 'pdf') {
      await exportCalculationResult({
        calculatorName: config.title,
        inputs: inputRows,
        result: `${result.mainLabel}: ${fmt(result.mainValue, 4)} ${result.mainUnit}`,
        steps: result.steps.map((step, index) => `${index + 1}. ${step.label}: ${step.expression}`),
        additionalInfo: result.conversions.map((conversion) => ({
          label: conversion.label,
          value: conversion.value,
        })),
      })
      return
    }

    if (format === 'png') {
      await exportToPNG(exportElementId, `${slug}.png`, { includeBackground: true, quality: 2 })
      return
    }

    const payload = {
      calculator: config.title,
      description: config.description,
      inputs: inputRows,
      result: {
        label: result.mainLabel,
        value: `${fmt(result.mainValue, 4)} ${result.mainUnit}`,
        formula: result.formula,
        conversions: result.conversions,
        steps: result.steps,
        tips: result.tips,
      },
      generatedAt: new Date().toISOString(),
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${slug}.json`
      link.click()
      URL.revokeObjectURL(url)
      return
    }

    const csvLines = [
      'Type,Label,Value',
      ...inputRows.map((row) => `Input,"${row.label.replace(/"/g, '""')}","${row.value.replace(/"/g, '""')}"`),
      `Result,"${result.mainLabel.replace(/"/g, '""')}","${`${fmt(result.mainValue, 4)} ${result.mainUnit}`.replace(/"/g, '""')}"`,
      ...result.conversions.map((row) => `Conversion,"${row.label.replace(/"/g, '""')}","${row.value.replace(/"/g, '""')}"`),
    ]
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slug}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [config, exportElementId, result, units, values])

  const clickFormat = useCallback((format: 'pdf' | 'png' | 'json' | 'csv' | 'jpg' | 'excel') => {
    if (downloadMode === 'custom' || format === 'jpg' || format === 'excel') {
      setCustomModalFormat(format)
      setShowCustomModal(true)
      return
    }
    void handleDownload(format)
  }, [downloadMode, handleDownload])

  const exportData = useMemo(() => {
    if (!config || !result) return null

    const summary: Record<string, string> = {
      Calculator: config.title,
      Description: config.description,
      Result: `${result.mainLabel}: ${fmt(result.mainValue, 4)} ${result.mainUnit}`,
      Formula: result.formula,
      Generated: new Date().toLocaleString(),
    }

    config.inputs.forEach((input) => {
      summary[input.label] = `${fmt(values[input.name] ?? input.defaultValue, 4)} ${units[input.name] ?? input.defaultUnit}`
    })

    result.conversions.forEach((conversion) => {
      summary[conversion.label] = conversion.value
    })

    if (result.steps.length > 0) {
      summary['Step Summary'] = result.steps.map((step, index) => `${index + 1}. ${step.label}`).join(' | ')
    }

    const schedule = [
      ...config.inputs.map((input) => ({
        section: 'Input',
        label: input.label,
        value: fmt(values[input.name] ?? input.defaultValue, 4),
        unit: units[input.name] ?? input.defaultUnit,
        details: input.helpText || 'User input',
      })),
      {
        section: 'Result',
        label: result.mainLabel,
        value: fmt(result.mainValue, 4),
        unit: result.mainUnit,
        details: result.formula,
      },
      ...result.conversions.map((conversion) => ({
        section: 'Conversion',
        label: conversion.label,
        value: conversion.value,
        unit: '',
        details: 'Equivalent unit conversion',
      })),
      ...result.steps.map((step, index) => ({
        section: 'Step',
        label: `Step ${index + 1}: ${step.label}`,
        value: step.expression,
        unit: '',
        details: 'Calculation breakdown',
      })),
    ]

    return {
      ...summary,
      schedule,
    }
  }, [config, result, units, values])

  const handleSmartInputChange = (text: string) => {
    setSmartInput(text)
    if (!config || !text.trim()) return
    const parsed = parseSmartInput(text, config.smartAliases)
    if (Object.keys(parsed).length > 0) {
      setValues(prev => ({ ...prev, ...parsed }))
    }
  }

  const applyPreset = (preset: Preset) => {
    setValues(prev => ({ ...prev, ...preset.values }))
  }

  if (!config) {
    return (
      <div className="text-center py-20">
        <Gauge className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-muted-foreground text-lg">Calculator configuration not found for: {id}</p>
      </div>
    )
  }

  const graphData = config.graphGenerator && result ? config.graphGenerator(values, units) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-slate-50 to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 md:p-8">
      <div id={exportElementId} className="max-w-6xl mx-auto">

        {/* ===== HEADER ===== */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-cyan-600 rounded-xl shadow-lg">
              <Gauge className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                {config.title}
              </h1>
              <p className="text-muted-foreground mt-1">{config.description}</p>
            </div>
          </div>
        </div>

        {/* ===== SMART INPUT ===== */}
        <div className="mb-6 animate-in fade-in slide-in-from-top-3 duration-600 delay-100">
          <button
            onClick={() => setShowSmartInput(!showSmartInput)}
            className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 transition-colors"
          >
            <Search className="w-4 h-4" />
            Smart Input — Type naturally
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showSmartInput ? 'rotate-90' : ''}`} />
          </button>
          {showSmartInput && (
            <div className="mt-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-4 rounded-xl border border-violet-200 dark:border-violet-800">
              <input
                type="text"
                value={smartInput}
                onChange={e => handleSmartInputChange(e.target.value)}
                placeholder={`Try: "${Object.entries(config.smartAliases).map(([k, a]) => `${a[0]} ${config.inputs.find(i => i.name === k)?.defaultValue ?? 10}`).join(' ')}"`}
                className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 outline-none text-sm transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Type values naturally — e.g., &quot;{Object.entries(config.smartAliases).slice(0, 2).map(([, a]) => `${a[0]} 10`).join(' ')}&quot;
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-2 rounded-2xl bg-secondary/10 border border-border/50 print:hidden animate-in fade-in slide-in-from-top-3 duration-700 delay-150">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg transition-colors ${autoCalc ? 'bg-yellow-500/10 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                <Zap className={`h-4 w-4 ${autoCalc ? 'fill-current' : ''}`} />
              </div>
              <span className="text-sm font-medium cursor-pointer select-none">Auto Calculate</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoCalc}
              onClick={() => setAutoCalc((current) => !current)}
              className={`ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoCalc ? 'bg-yellow-500' : 'bg-slate-700/60'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${autoCalc ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              title="Clear inputs"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-10 w-10 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-600/10 rounded-xl transition-colors"
              title="Reset"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setResult(null)}
              className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
              title="Clear result"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

            <Button variant="ghost" size="icon" onClick={handleShare} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" title="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePrint} className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" title="Print">
              <Printer className="h-4 w-4" />
            </Button>

            {result && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => void handleDownload('pdf')}
                  className="hidden md:flex gap-2 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 rounded-xl px-4 h-10"
                >
                  <FileType className="h-4 w-4" />
                  <span>PDF</span>
                </Button>

                <DropdownMenu onOpenChange={(open) => { if (!open) setDownloadMode('choose') }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary shadow-sm rounded-xl px-4 h-10" onClick={() => setDownloadMode('choose')}>
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[min(420px,calc(100vw-1rem))] p-3 sm:p-4 max-h-[85vh] overflow-y-auto">
                    {downloadMode === 'choose' && (
                      <div className="space-y-3">
                        <DropdownMenuLabel className="px-1 py-1 text-base font-bold">How would you like to download?</DropdownMenuLabel>
                        <button onClick={() => setDownloadMode('auto')} className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-400/20">
                            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-yellow-900 dark:text-yellow-200">Auto Download</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">Pick a format and download instantly — no extra steps.</p>
                          </div>
                        </button>
                        <button onClick={() => setDownloadMode('custom')} className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-400/20">
                            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">Custom Download</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">Choose colours, font size, row range, watermark and more.</p>
                          </div>
                        </button>
                      </div>
                    )}

                    {(downloadMode === 'auto' || downloadMode === 'custom') && (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <button onClick={() => setDownloadMode('choose')} className="flex items-center justify-center h-7 w-7 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Back">←</button>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${downloadMode === 'auto' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'}`}>
                            {downloadMode === 'auto' ? <><Zap className="h-3 w-3" /> Auto</> : <><Download className="h-3 w-3" /> Custom</>}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                          <DropdownMenuItem onClick={() => clickFormat('pdf')} className="rounded-lg cursor-pointer"><FileType className="mr-2 h-4 w-4 text-red-500" /><span>PDF Document</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => clickFormat('png')} className="rounded-lg cursor-pointer"><Download className="mr-2 h-4 w-4 text-blue-500" /><span>PNG Image</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => clickFormat('json')} className="rounded-lg cursor-pointer"><Download className="mr-2 h-4 w-4 text-amber-500" /><span>JSON Data</span></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => clickFormat('csv')} className="rounded-lg cursor-pointer"><Download className="mr-2 h-4 w-4 text-emerald-500" /><span>CSV Export</span></DropdownMenuItem>
                          {downloadMode === 'custom' && (
                            <>
                              <DropdownMenuItem onClick={() => clickFormat('excel')} className="rounded-lg cursor-pointer"><Download className="mr-2 h-4 w-4 text-green-600" /><span>Excel Workbook</span></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => clickFormat('jpg')} className="rounded-lg cursor-pointer"><Download className="mr-2 h-4 w-4 text-sky-500" /><span>JPG Image</span></DropdownMenuItem>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ----- LEFT: INPUTS ----- */}
          <div className="space-y-6">

            {/* Presets */}
            {config.presets && config.presets.length > 0 && (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-violet-500" />
                  <h3 className="font-semibold text-sm">Quick Scenarios</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {config.presets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(preset)}
                      className="group p-3 bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-transparent hover:border-violet-400 hover:shadow-md transition-all duration-300 hover:scale-105"
                    >
                      <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{preset.icon}</div>
                      <div className="text-xs font-medium text-center">{preset.name}</div>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Input Fields */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
              <div className="space-y-5">
                {config.inputs.map((inp, idx) => (
                  <div key={inp.name} className="space-y-2 animate-in fade-in slide-in-from-left-3 duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        {inp.symbol && <span className="text-violet-600 dark:text-violet-400 font-mono font-bold">{inp.symbol}</span>}
                        {inp.label}
                        {inp.helpText && (
                          <div className="group relative">
                            <Lightbulb className="w-3.5 h-3.5 text-violet-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                              {inp.helpText}
                            </div>
                          </div>
                        )}
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={values[inp.name] ?? ''}
                        onChange={e => setValues(prev => ({ ...prev, [inp.name]: parseFloat(e.target.value) || 0 }))}
                        min={inp.min}
                        max={inp.max}
                        step={inp.step ?? 'any'}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 outline-none transition-all duration-300 text-sm font-mono hover:shadow-sm"
                      />
                      {inp.unitOptions.length > 1 && (
                        <select
                          value={units[inp.name] ?? inp.defaultUnit}
                          onChange={e => setUnits(prev => ({ ...prev, [inp.name]: e.target.value }))}
                          className="px-3 py-2.5 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 focus:border-violet-500 outline-none transition-all text-sm font-medium cursor-pointer hover:shadow-sm min-w-[80px]"
                        >
                          {inp.unitOptions.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!autoCalc && (
                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button
                    onClick={handleCalculate}
                    className="px-6 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Calculate
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ----- RIGHT: RESULTS ----- */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Main Result Card */}
                <div className="calculator-result bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-950/30 dark:to-cyan-950/30 backdrop-blur-sm p-7 rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl animate-in fade-in slide-in-from-right-4 duration-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      {result.mainLabel}
                    </div>
                    <button onClick={handleCopy} className="p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors" title="Copy result">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent mb-3">
                    {result.mainLabel.startsWith('Error') ? result.mainLabel : `${fmt(result.mainValue, 4)} ${result.mainUnit}`}
                  </div>

                  {/* Conversions */}
                  {result.conversions.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {result.conversions.map((c, i) => (
                        <div key={i} className="p-2.5 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                          <div className="text-xs text-muted-foreground">{c.label}</div>
                          <div className="text-sm font-semibold font-mono text-violet-700 dark:text-violet-300">{c.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formula */}
                  <div className="mt-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Formula</div>
                    <div className="text-sm font-mono text-violet-600 dark:text-violet-400 font-semibold">{result.formula}</div>
                  </div>
                </div>

                {/* Step-by-Step */}
                {result.steps.length > 0 && (
                  <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                      <Activity className="w-5 h-5 text-violet-500" />
                      Step-by-Step Solution
                    </h3>
                    <div className="space-y-3">
                      {result.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-right-3 duration-500" style={{ animationDelay: `${idx * 80}ms` }}>
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-cyan-600 text-white text-xs flex items-center justify-center font-bold shadow-md">
                            {idx + 1}
                          </div>
                          <div className="flex-1 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg">
                            <div className="text-xs font-medium text-muted-foreground mb-1">{step.label}</div>
                            <div className="text-sm font-mono text-gray-800 dark:text-gray-200">{step.expression}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {result.tips.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 backdrop-blur-sm p-5 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
                    <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Insights
                    </h3>
                    <ul className="space-y-2">
                      {result.tips.map((tip, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm p-12 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center animate-in fade-in duration-700">
                <Gauge className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">{autoCalc ? 'Adjust values to see results' : 'Click Calculate to see results'}</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== TRAJECTORY GRAPH (Projectile only) ===== */}
        {graphData && graphData.length > 0 && (
          <div className="mt-8 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-violet-500" />
                Trajectory Graph
              </h3>
              <button
                onClick={() => setShowGraph(!showGraph)}
                className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
              >
                {showGraph ? 'Hide' : 'Show'}
              </button>
            </div>
            {showGraph && (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={graphData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={['auto', 'auto']}
                    label={{ value: 'Horizontal Distance (m)', position: 'insideBottom', offset: -20, style: { fontSize: 12 } }}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="y"
                    type="number"
                    domain={[0, 'auto']}
                    label={{ value: 'Height (m)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 12 } }}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value ?? 0).toFixed(2)} m`]}
                    labelFormatter={(label) => `Distance: ${Number(label ?? 0).toFixed(2)} m`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #ddd', fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke="url(#trajectoryGradient)"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: '#7c3aed' }}
                  />
                  <defs>
                    <linearGradient id="trajectoryGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ===== DID YOU KNOW ===== */}
        <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 backdrop-blur-sm p-6 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-700">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Did You Know?
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {config.didYouKnow.map((fact, idx) => (
              <div key={idx} className="p-3 bg-white/60 dark:bg-gray-900/40 rounded-lg text-sm">
                {fact}
              </div>
            ))}
          </div>
        </div>

        {/* ===== RELATED CALCULATORS ===== */}
        <div className="mt-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-700">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-violet-500" />
            Related Calculators
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {config.relatedTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/calculator/${tool.id}`}
                className="group p-4 bg-gradient-to-br from-violet-50 to-cyan-50 dark:from-violet-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-transparent hover:border-violet-400 hover:shadow-md transition-all duration-300 hover:scale-105 text-center"
              >
                <Rocket className="w-6 h-6 mx-auto mb-2 text-violet-500 group-hover:text-violet-600 transition-colors" />
                <div className="text-xs font-medium">{tool.title}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== SEO CONTENT ===== */}
        <div className="mt-8 space-y-6">
          <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
            <h2 className="text-xl font-bold mb-3">How to Use the {config.title}</h2>
            <div className="text-sm text-muted-foreground space-y-3 leading-6">
              <p>This advanced {config.title.toLowerCase()} is designed for students, exam preparation, homework checks, engineering estimation, and fast concept revision. Enter your values, select the correct units, and the calculator instantly shows the answer, conversions, and a step-by-step derivation.</p>
              <p><strong>Included options:</strong> real-time calculation, manual calculation mode, smart text input, quick scenarios, conversion output, printable results, share support, PDF export, custom download settings, and detailed worked steps.</p>
              <p><strong>Supported units:</strong> {config.inputs.map(i => `${i.label}: ${i.unitOptions.map(u => u.value).join(', ')}`).join(' | ')}.</p>
              <p>This page is especially useful when you want a faster and clearer answer than a generic search result, because it combines the final value, the physics formula, unit handling, and explanation in one place instead of forcing you to piece the method together manually.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20 backdrop-blur-sm p-6 rounded-2xl border border-sky-200 dark:border-sky-800 shadow-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-600" />
                Best For
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" /><span>School and college kinematics problem solving.</span></li>
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" /><span>Competitive exam preparation where fast formula application matters.</span></li>
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" /><span>Engineering estimation and motion sanity checks.</span></li>
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-sky-500 flex-shrink-0" /><span>Understanding how changing one input affects the final motion result.</span></li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 backdrop-blur-sm p-6 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-rose-600" />
                Common Mistakes to Avoid
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" /><span>Mixing kilometers with meters or hours with seconds without checking units.</span></li>
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" /><span>Using total distance instead of displacement in average velocity problems.</span></li>
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" /><span>Ignoring sign convention for upward, downward, leftward, or backward motion.</span></li>
                <li className="flex gap-2"><ChevronRight className="w-4 h-4 mt-0.5 text-rose-500 flex-shrink-0" /><span>Applying constant-acceleration equations to situations where acceleration is not constant.</span></li>
              </ul>
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-violet-500" />
              Frequently Asked Questions
            </h3>
            <div className="space-y-4 text-sm text-muted-foreground leading-6">
              <div>
                <p className="font-semibold text-foreground">What makes this calculator more useful than a basic formula page?</p>
                <p>It does more than show a formula. It calculates the answer, converts units, explains the steps, and in projectile mode also visualizes the trajectory so the result is easier to verify.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Can I use it for homework and exam preparation?</p>
                <p>Yes. It is suitable for checking textbook questions, verifying intermediate steps, and building intuition for motion equations. It is best used as a learning and validation tool, not as a replacement for understanding the derivation.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Does it handle different measurement systems?</p>
                <p>Yes. Each input supports the relevant unit options, and the output includes common conversions so you can work in SI units or compare against alternate systems quickly.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">When should I trust the result less?</p>
                <p>If the physical scenario has air resistance, variable acceleration, friction losses, or more advanced constraints, the idealized kinematics equations may not match the real system exactly.</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/30 rounded-2xl p-4 border border-border leading-relaxed">
            <strong>Physics Note:</strong> These kinematics tools assume standard textbook motion models. They are excellent for learning, revision, and quick engineering estimates, but real-world systems may need more advanced modelling when drag, friction, changing acceleration, or external forces are important.
          </div>
        </div>
      </div>

      {exportData && (
        <CustomDownloadModal
          open={showCustomModal}
          onClose={() => { setShowCustomModal(false); setDownloadMode('choose') }}
          data={exportData}
          title={config.title}
          format={customModalFormat}
        />
      )}
    </div>
  )
}

// =========================================================
// EXPORTED COMPONENT
// =========================================================

export const AdvancedKinematicsCalculator = ({ id }: { id?: string; title?: string; description?: string }) => {
  return <KinematicsCalculatorInner id={id || 'velocity-calculator'} />
}
