import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY not set. API calls will fail until configured.')
}

const PORT = process.env.PORT || 5174

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
    if (!apiKey) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      // try to salvage code blocks
      const match = text.match(/```json[\s\S]*?```/)
      if (match) {
        parsed = JSON.parse(match[0].replace(/```json|```/g, ''))
      }
    }
    if (!parsed || !Array.isArray(parsed.versions)) {
      return res.status(502).json({ error: 'Unexpected model response', raw: text })
    }
    res.json({ versions: parsed.versions })
  } catch (err) {
    console.error(err)
    const message = err && err.message ? err.message : 'Failed to generate lyrics'
    res.status(500).json({ error: message })
  }
})

app.post('/api/refine', async (req, res) => {
  try {
    const { prompt } = req.body || {}
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' })
    if (!apiKey) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' })

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let parsed
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      const match = text.match(/```json[\s\S]*?```/)
      if (match) {
        parsed = JSON.parse(match[0].replace(/```json|```/g, ''))
      }
    }
    if (!parsed || typeof parsed.lyrics !== 'string') {
      return res.status(502).json({ error: 'Unexpected model response', raw: text })
    }
    res.json({ lyrics: parsed.lyrics })
  } catch (err) {
    console.error(err)
    const message = err && err.message ? err.message : 'Failed to refine lyrics'
    res.status(500).json({ error: message })
  }
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})


