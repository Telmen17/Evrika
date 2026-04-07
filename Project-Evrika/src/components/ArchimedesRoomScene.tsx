import type { FC } from 'react'
import { useCallback, useMemo } from 'react'
import type { SceneId } from './LandingPage'
import { useLessonHub } from '../context/LessonHubContext'

interface ArchimedesRoomSceneProps {
  onNavigate: (scene: SceneId) => void
}

const ArchimedesRoomScene: FC<ArchimedesRoomSceneProps> = (_props) => {
  void _props
  const { progress, patchProgress } = useLessonHub()
  const a = progress.archimedes

  const setField = useCallback(
    (patch: Partial<typeof a>) => {
      patchProgress({ archimedes: patch })
    },
    [patchProgress],
  )

  const crownDensity = useMemo(() => {
    const m = parseFloat(a.crownMassG.replace(',', '.'))
    const v = parseFloat(a.crownVolumeMl.replace(',', '.'))
    if (!Number.isFinite(m) || !Number.isFinite(v) || v === 0) return null
    return m / v
  }, [a.crownMassG, a.crownVolumeMl])

  const lumpDensity = useMemo(() => {
    const m = parseFloat(a.lumpMassG.replace(',', '.'))
    const v = parseFloat(a.lumpVolumeMl.replace(',', '.'))
    if (!Number.isFinite(m) || !Number.isFinite(v) || v === 0) return null
    return m / v
  }, [a.lumpMassG, a.lumpVolumeMl])

  const filled =
    a.crownMassG.trim() &&
    a.crownVolumeMl.trim() &&
    a.lumpMassG.trim() &&
    a.lumpVolumeMl.trim()

  const tryUnlockProof = useCallback(() => {
    if (!filled || a.proofUnlocked) return
    patchProgress({
      archimedes: { proofUnlocked: true },
    })
  }, [a.proofUnlocked, filled, patchProgress])

  return (
    <div className="scene archimedes-room-scene">
      <header className="scene-header hub-scene-header archimedes-room-header">
        <h2>Archimedes&apos; study — density proof</h2>
      </header>

      <section className="scene-body archimedes-room-body">
        <p className="scene-text archimedes-room-lede">
          Record masses and volumes you measured elsewhere. Density is{' '}
          <strong>ρ = m / V</strong> (mass divided by volume). When both rows are filled, you can
          draft the proof scroll for the throne room.
        </p>

        <div className="archimedes-density-grid">
          <article className="archimedes-density-card">
            <h3>Crown</h3>
            <p className="helper-text">ρ<sub>crown</sub> = m<sub>crown</sub> / V<sub>crown</sub></p>
            <label className="archimedes-field">
              <span>m (g)</span>
              <input
                type="text"
                inputMode="decimal"
                value={a.crownMassG}
                onChange={(e) => setField({ crownMassG: e.target.value })}
                aria-label="Crown mass in grams"
              />
            </label>
            <label className="archimedes-field">
              <span>V (mL)</span>
              <input
                type="text"
                inputMode="decimal"
                value={a.crownVolumeMl}
                onChange={(e) => setField({ crownVolumeMl: e.target.value })}
                aria-label="Crown volume in milliliters"
              />
            </label>
            <p className="archimedes-density-result">
              {crownDensity !== null
                ? `ρ ≈ ${crownDensity.toFixed(4)} g/mL`
                : 'Enter mass and volume to see density.'}
            </p>
          </article>

          <article className="archimedes-density-card">
            <h3>Lump of royal gold</h3>
            <p className="helper-text">ρ<sub>gold</sub> = m<sub>gold</sub> / V<sub>gold</sub></p>
            <label className="archimedes-field">
              <span>m (g)</span>
              <input
                type="text"
                inputMode="decimal"
                value={a.lumpMassG}
                onChange={(e) => setField({ lumpMassG: e.target.value })}
                aria-label="Gold lump mass in grams"
              />
            </label>
            <label className="archimedes-field">
              <span>V (mL)</span>
              <input
                type="text"
                inputMode="decimal"
                value={a.lumpVolumeMl}
                onChange={(e) => setField({ lumpVolumeMl: e.target.value })}
                aria-label="Gold lump volume in milliliters"
              />
            </label>
            <p className="archimedes-density-result">
              {lumpDensity !== null
                ? `ρ ≈ ${lumpDensity.toFixed(4)} g/mL`
                : 'Enter mass and volume to see density.'}
            </p>
          </article>
        </div>

        <div className="archimedes-proof-actions">
          <button
            type="button"
            className="primary-button"
            disabled={!filled || a.proofUnlocked}
            onClick={tryUnlockProof}
          >
            {a.proofUnlocked ? 'Proof scroll ready' : 'Seal the proof scroll'}
          </button>
          {a.proofUnlocked ? (
            <p className="helper-text archimedes-proof-hint">
              Take the scroll to the Throne Room and present it to the king when you are ready for
              the ending.
            </p>
          ) : (
            <p className="helper-text archimedes-proof-hint">
              Framework: you will tune validation and copy later. For now, any non-empty fields
              unlock the scroll.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default ArchimedesRoomScene
