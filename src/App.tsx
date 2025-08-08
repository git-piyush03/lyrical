import { useMemo, useState } from 'react'
import './index.css'
// Background removed

type LyricsVersions = [string, string, string]

const DEFAULT_PLACEHOLDER = 'Generated lyrics will appear here.'

function App() {
  const [language, setLanguage] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [mood, setMood] = useState('')
  const [keywords, setKeywords] = useState('')
  const [avoidWords, setAvoidWords] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [versions, setVersions] = useState<LyricsVersions | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')

  const activeLyrics = useMemo(() => {
    if (!versions) return DEFAULT_PLACEHOLDER
    return versions[activeIndex] || DEFAULT_PLACEHOLDER
  }, [versions, activeIndex])

  async function handleGenerate() {
    setErrorMessage(null)
    if (!description.trim()) {
      setErrorMessage('Please provide a song description before generating lyrics.')
      return
    }
    setIsLoading(true)
    try {
      const prompt = buildPrompt({ language, genre, description, mood, keywords, avoidWords })
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!response.ok) throw new Error('Failed to generate lyrics')
      const data = (await response.json()) as { versions: string[] }
      const normalized = normalizeVersions(data.versions)
      setVersions(normalized)
      setActiveIndex(0)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRefine() {
    setErrorMessage(null)
    if (!versions) return
    const current = versions[activeIndex]
    if (!current || current === DEFAULT_PLACEHOLDER) return
    setIsLoading(true)
    try {
      const prompt = buildRefinePrompt(current, { language, genre, mood, keywords, avoidWords })
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!response.ok) throw new Error('Failed to refine lyrics')
      const data = (await response.json()) as { lyrics: string }
      const updated: LyricsVersions = versions.map((v, i) => (i === activeIndex ? data.lyrics : v)) as LyricsVersions
      setVersions(updated)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Lyrical</h1>
      </header>
      <div className="container">
        <section className="panel">
          <h2 className="sectionTitle">Generate Lyrics</h2>
          <div className="form">
            <div className="inline">
              <div className="row">
                <div className="labelHeader">
                  <div className="labelTitle">Language</div>
                  <div className="hint">Specify the language for your lyrics</div>
                </div>
                <input
                  placeholder="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
              </div>
              <div className="row">
                <div className="labelHeader">
                  <div className="labelTitle">Genre</div>
                  <div className="hint">Choose the musical style</div>
                </div>
                <input
                  placeholder="Genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>
            </div>
            <div className="row">
              <div className="labelHeader">
                <div className="labelTitle">Song Description</div>
                <div className="hint">Briefly describe the theme or story of your song</div>
              </div>
              <textarea
                placeholder="Song Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="row">
              <div className="toggleRow">
                <div>
                  <div className="labelTitle">Advanced Options</div>
                  <div className="hint">Fine‑tune mood, keywords, and exclusions</div>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showAdvanced}
                    onChange={(e) => setShowAdvanced(e.target.checked)}
                    aria-label="Toggle advanced options"
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
            {showAdvanced && (
              <>
                <div className="inline">
                  <div className="row">
                    <div className="labelHeader">
                      <div className="labelTitle">Mood</div>
                      <div className="hint">e.g., joyful, melancholic</div>
                    </div>
                    <input placeholder="e.g., joyful, melancholic" value={mood} onChange={(e) => setMood(e.target.value)} />
                  </div>
                  <div className="row">
                    <div className="labelHeader">
                      <div className="labelTitle">Keywords</div>
                      <div className="hint">Comma-separated words to include</div>
                    </div>
                    <input placeholder="Comma-separated words to include" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                  </div>
                </div>
                <div className="row">
                  <div className="labelHeader">
                    <div className="labelTitle">Words to Avoid</div>
                    <div className="hint">Comma-separated words to exclude</div>
                  </div>
                  <input placeholder="Comma-separated words to exclude" value={avoidWords} onChange={(e) => setAvoidWords(e.target.value)} />
                </div>
              </>
            )}

            {errorMessage && <div className="error">{errorMessage}</div>}

            <button className="button cta" onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Lyrics'}
            </button>
          </div>
        </section>

        <div className="divider" aria-hidden="true" />

        <section className="panel">
          <div className="outputHeader">
            <h2 className="sectionTitle" style={{ margin: 0 }}>Generated Lyrics</h2>
            <div className="tabs tabsUnderlined">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`tab ${activeIndex === i ? 'active' : ''}`}
                  onClick={() => { setSlideDir(i > activeIndex ? 'right' : 'left'); setActiveIndex(i) }}
                >
                  Version {i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="lyricsBox">
            <div className={`lyricsContent ${slideDir === 'right' ? 'slideFromRight' : 'slideFromLeft'}`} key={activeIndex}>
              {activeLyrics}
            </div>
          </div>
          <div className="footerActions">
            <button className="button secondary cta" onClick={handleRefine} disabled={isLoading || !versions}>
              {isLoading ? 'Refining...' : 'Refine Lyrics'}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function buildPrompt(input: {
  language: string
  genre: string
  description: string
  mood: string
  keywords: string
  avoidWords: string
}) {
  const { language, genre, description, mood, keywords, avoidWords } = input
  return (
    `You are an expert songwriter AI. Write three distinct sets of high-quality song lyrics.
Language: ${language}
Genre: ${genre}
Mood: ${mood || 'writer\'s choice'}
Include keywords: ${keywords || 'none'}
Avoid words: ${avoidWords || 'none'}
Description: ${description}

Return ONLY valid JSON with the shape: {"versions": ["v1", "v2", "v3"]}.`
  )
}

function buildRefinePrompt(currentLyrics: string, meta: {
  language: string
  genre: string
  mood: string
  keywords: string
  avoidWords: string
}) {
  return (
    `Refine and improve the following song lyrics while preserving the intent. Keep the same language (${meta.language}) and style leaning toward ${meta.genre}. Prefer mood: ${meta.mood || 'writer\'s choice'}. Include: ${meta.keywords || 'n/a'}. Avoid: ${meta.avoidWords || 'n/a'}.

Return ONLY valid JSON with the shape: {"lyrics": "refined"}.

Lyrics to refine:\n${currentLyrics}`
  )
}

function normalizeVersions(arr: unknown): LyricsVersions {
  if (Array.isArray(arr)) {
    const v1 = String(arr[0] ?? DEFAULT_PLACEHOLDER)
    const v2 = String(arr[1] ?? DEFAULT_PLACEHOLDER)
    const v3 = String(arr[2] ?? DEFAULT_PLACEHOLDER)
    return [v1, v2, v3]
  }
  return [DEFAULT_PLACEHOLDER, DEFAULT_PLACEHOLDER, DEFAULT_PLACEHOLDER]
}

export default App
