/**
 * Dynamically derive UI colors from a background image.
 * Lightweight, no dependencies. Computes an average color and derives accents.
 */
export async function initDynamicTheme(imageUrl: string = '/bg.jpg'): Promise<void> {
  try {
    const avg = await computeAverageColor(imageUrl)
    if (!avg) return
    const { r, g, b } = avg
    const { h, s, l } = rgbToHsl(r, g, b)

    // Derive a primary and two accent colors from the base hue
    const primary = hslToRgbCss(h, clamp01(s * 1.1), clamp01(Math.max(0.35, l)))
    const accent1 = hslToRgbCss((h + 20) % 360, clamp01(s * 1.05), clamp01(l * 1.1))
    const accent2 = hslToRgbCss((h - 20 + 360) % 360, clamp01(s * 1.05), clamp01(l * 0.9))

    const root = document.documentElement
    root.style.setProperty('--primary', primary)
    root.style.setProperty('--primary-600', primary)
    root.style.setProperty('--accent1', accent1)
    root.style.setProperty('--accent2', primary)
    root.style.setProperty('--accent3', accent2)

    // Panel tint stays dark; adjust text contrast if image is very light
    const perceivedL = l
    const textColor = perceivedL > 0.6 ? '#0a0a0a' : '#eaeaea'
    const mutedColor = perceivedL > 0.6 ? '#4a4a4a' : '#a3a3a3'
    root.style.setProperty('--text', textColor)
    root.style.setProperty('--muted', mutedColor)
  } catch {
    // Silently ignore if sampling fails
  }
}

async function computeAverageColor(src: string): Promise<{ r: number; g: number; b: number } | null> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.decoding = 'async'
  img.referrerPolicy = 'no-referrer'
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('img load error'))
  })
  img.src = src
  try {
    await loaded
  } catch {
    return null
  }
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  const w = 64
  const h = Math.max(1, Math.round((img.height / img.width) * w))
  canvas.width = w
  canvas.height = h
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += 4) {
    const rr = data[i]
    const gg = data[i + 1]
    const bb = data[i + 2]
    const aa = data[i + 3]
    if (aa < 16) continue
    // Skip very dark/bright extremes to avoid bias
    const lum = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb
    if (lum < 20 || lum > 235) continue
    r += rr
    g += gg
    b += bb
    n += 1
  }
  if (!n) return null
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h *= 60
  }
  return { h, s, l }
}

function hslToRgbCss(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (0 <= h && h < 60) { r = c; g = x; b = 0 }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0 }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const rr = Math.round((r + m) * 255)
  const gg = Math.round((g + m) * 255)
  const bb = Math.round((b + m) * 255)
  return `rgb(${rr}, ${gg}, ${bb})`
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)) }


