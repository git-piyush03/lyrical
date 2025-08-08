import { GoogleGenerativeAI } from '@google/generative-ai'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    const { GEMINI_API_KEY } = process.env
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Missing GEMINI_API_KEY' })
    }
    const { prompt } = req.body || {}
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' })
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      const match = text.match(/```json[\s\S]*?```/)
      if (match) parsed = JSON.parse(match[0].replace(/```json|```/g, ''))
    }
    if (!parsed || !Array.isArray(parsed.versions)) {
      return res.status(502).json({ error: 'Unexpected model response', raw: text })
    }
    return res.status(200).json({ versions: parsed.versions })
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to generate lyrics' })
  }
}


