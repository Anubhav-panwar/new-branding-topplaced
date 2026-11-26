---
name: TopPlaced AI
description: Reference-Inspired Premium Light SaaS Design System for AI Interview Preparation Platform
colors:
  bg-base: "#FFFFFF"
  bg-app: "#F8FAFF"
  bg-subtle: "#F5F7FF"
  bg-card: "#FFFFFF"
  bg-accent-soft: "#EEF2FF"
  bg-purple-soft: "#F3E8FF"
  border-default: "#E5E7EB"
  border-subtle: "#EEF0F5"
  primary-indigo: "#4F46E5"
  primary-blue: "#6366F1"
  secondary-purple: "#8B5CF6"
  text-primary: "#111827"
  text-secondary: "#64748B"
  text-muted: "#94A3B8"
  status-success: "#10B981"
  status-warning: "#F59E0B"
  status-error: "#EF4444"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, Inter, -apple-system, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  h1:
    fontFamily: "Plus Jakarta Sans, Inter, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  h2:
    fontFamily: "Plus Jakarta Sans, Inter, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans, Inter, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  full: "9999px"
shadows:
  soft: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)"
  card: "0 4px 20px -2px rgba(79, 70, 229, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)"
  card-hover: "0 10px 25px -3px rgba(79, 70, 229, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)"
  button: "0 4px 14px 0 rgba(79, 70, 229, 0.3)"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #8B5CF6 100%)"
    textColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: "10px 22px"
    minHeight: "44px"
  button-secondary:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    rounded: "{rounded.xl}"
    padding: "10px 20px"
    minHeight: "44px"
  card-standard:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    rounded: "{rounded.2xl}"
    padding: "24px"
    shadow: "{shadows.card}"
---

# TopPlaced AI — Premium Light SaaS Design System

## Overview
TopPlaced AI features a clean, high-trust, modern Light SaaS aesthetic inspired by leading developer & AI platforms. Crisp white surfaces, subtle indigo/lavender gradients, soft elevated cards, and royal indigo primary action elements establish an approachable yet technically authoritative interview experience.

## Core Color Tokens

- **Canvas & Backgrounds:**
  - Pure White: `#FFFFFF` (`bg-white`)
  - Soft App Background: `#F8FAFF` (`bg-[#F8FAFF]`)
  - Subtly Tinted Stage Background: `#F5F7FF` (`bg-[#F5F7FF]`)
- **Brand Primary & Accents:**
  - Royal Indigo Primary: `#4F46E5` (`bg-[#4F46E5]`, `text-[#4F46E5]`)
  - Vibrant Blue Secondary: `#6366F1` (`bg-[#6366F1]`)
  - Accent Purple: `#8B5CF6` (`bg-[#8B5CF6]`)
  - Soft Indigo Tint: `#EEF2FF` (`bg-[#EEF2FF]`)
  - Soft Purple Tint: `#F3E8FF` (`bg-[#F3E8FF]`)
- **Text & Hierarchy:**
  - Primary Text: `#111827` (`text-[#111827]`, slate-900 equivalent)
  - Secondary Text: `#64748B` (`text-[#64748B]`, slate-500)
  - Muted / Caption: `#94A3B8` (`text-[#94A3B8]`, slate-400)
- **Borders & Dividers:**
  - Structural Border: `#E5E7EB` (`border-[#E5E7EB]`, gray-200)
  - Subtle Inset Border: `#EEF0F5` (`border-[#EEF0F5]`)
- **Feedback & Semantics:**
  - Success: `#10B981` (Badge: `bg-emerald-50 text-emerald-700 border-emerald-200`)
  - Warning: `#F59E0B` (Badge: `bg-amber-50 text-amber-700 border-amber-200`)
  - Error / Termination: `#EF4444` (Badge: `bg-rose-50 text-rose-700 border-rose-200`)

## Component Taxonomy

### 1. Primary Buttons
- Gradient: `bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] hover:from-[#4338CA] hover:to-[#4F46E5]` or solid `#4F46E5`.
- Typography: `text-white font-semibold text-sm`
- Dimensions: `min-h-[44px] px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20`
- Focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2`

### 2. Secondary / Outline Buttons
- Surface: `bg-white hover:bg-[#F8FAFF] text-[#111827] border border-[#E5E7EB]`
- Dimensions: `min-h-[44px] px-4 py-2.5 rounded-xl shadow-xs`
- Focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]`

### 3. Elevated Cards
- Surface: `bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:shadow-md transition-all`
- Soft shadows: `shadow-[0_4px_20px_-2px_rgba(79,70,229,0.06)]`

### 4. Form Fields & Inputs
- Surface: `bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-[#111827] placeholder:text-slate-400`
- Focus State: `focus:outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20`

### 5. Badges & Taxonomy Tags
- Primary Tag: `bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] text-xs font-semibold px-2.5 py-0.5 rounded-full`
- AI/Proctoring Tag: `bg-[#F3E8FF] text-[#8B5CF6] border border-[#DDD6FE] text-xs font-semibold px-2.5 py-0.5 rounded-full`
