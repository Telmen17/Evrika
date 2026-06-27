/**
 * ArchimedesRoomScene — study room proof scroll inputs.
 *
 * Docs: docs/components/scenes/archimedes-room.md
 */

import type { CSSProperties, FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import papyrusImg from '../assets/papyrus.webp'
import scrollPng from '../assets/scroll.png'
import type { SceneId } from '../types/sceneId'
import { useLessonHub } from '../context/LessonHubContext'
import { ProofScrollWithLock } from './ProofScrollWithLock'

interface ArchimedesRoomSceneProps {
  onNavigate: (scene: SceneId) => void
}

const REQUIRED_MASS_G = 2000
const REQUIRED_CROWN_VOLUME_ML = 129.66
const REQUIRED_GOLD_VOLUME_ML = 103.52
const EXACT_MATCH_EPSILON = 0.005
/** Raster papyrus.webp — portrait source; displayed rotated 90° as a horizontal scroll. */
const PAPYRUS_SRC_W = 1200
const PAPYRUS_SRC_H = 1793

function parseDecimalValue(raw: string) {
  const value = parseFloat(raw.replace(',', '.').trim())
  return Number.isFinite(value) ? value : null
}

function matchesRequiredValue(raw: string, target: number) {
  const value = parseDecimalValue(raw)
  return value !== null && Math.abs(value - target) <= EXACT_MATCH_EPSILON
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

  const crownMass = useMemo(() => parseDecimalValue(a.crownMassG), [a.crownMassG])
  const crownVolume = useMemo(() => parseDecimalValue(a.crownVolumeMl), [a.crownVolumeMl])
  const lumpMass = useMemo(() => parseDecimalValue(a.lumpMassG), [a.lumpMassG])
  const lumpVolume = useMemo(() => parseDecimalValue(a.lumpVolumeMl), [a.lumpVolumeMl])

  const crownDensity = useMemo(() => {
    if (crownMass === null || crownVolume === null || crownVolume === 0) return null
    return crownMass / crownVolume
  }, [crownMass, crownVolume])

  const lumpDensity = useMemo(() => {
    if (lumpMass === null || lumpVolume === null || lumpVolume === 0) return null
    return lumpMass / lumpVolume
  }, [lumpMass, lumpVolume])

  const filled =
    a.crownMassG.trim() &&
    a.crownVolumeMl.trim() &&
    a.lumpMassG.trim() &&
    a.lumpVolumeMl.trim()

  const crownMassOk = matchesRequiredValue(a.crownMassG, REQUIRED_MASS_G)
  const crownVolumeOk = matchesRequiredValue(a.crownVolumeMl, REQUIRED_CROWN_VOLUME_ML)
  const lumpMassOk = matchesRequiredValue(a.lumpMassG, REQUIRED_MASS_G)
  const lumpVolumeOk = matchesRequiredValue(a.lumpVolumeMl, REQUIRED_GOLD_VOLUME_ML)
  const exactValuesEntered = crownMassOk && crownVolumeOk && lumpMassOk && lumpVolumeOk

  const [sealUnlockPhase, setSealUnlockPhase] = useState<
    'idle' | 'playing' | 'done'
  >(() => (a.proofUnlocked || exactValuesEntered ? 'done' : 'idle'))
  const [proofMotion, setProofMotion] = useState<'idle' | 'hover' | 'press'>('idle')
  const prevExactRef = useRef(exactValuesEntered)
  const proofActionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (a.proofUnlocked && !exactValuesEntered) {
      patchProgress({ archimedes: { proofUnlocked: false } })
    }
  }, [a.proofUnlocked, exactValuesEntered, patchProgress])

  useEffect(() => {
    if (a.proofUnlocked) {
      setSealUnlockPhase('done')
      prevExactRef.current = exactValuesEntered
      return
    }
    if (exactValuesEntered && !prevExactRef.current) {
      setSealUnlockPhase('playing')
    }
    if (!exactValuesEntered) {
      setSealUnlockPhase('idle')
    }
    prevExactRef.current = exactValuesEntered
  }, [exactValuesEntered, a.proofUnlocked])

  const onSealUnlockVideoEnded = useCallback(() => {
    setSealUnlockPhase('done')
  }, [])

  const tryUnlockProof = useCallback(() => {
    if (!exactValuesEntered || a.proofUnlocked) return
    patchProgress({
      archimedes: { proofUnlocked: true },
    })
  }, [a.proofUnlocked, exactValuesEntered, patchProgress])

  const handleProofHover = useCallback(() => {
    setProofMotion('hover')
  }, [])

  const handleProofLeave = useCallback(() => {
    setProofMotion('idle')
  }, [])

  const handleProofPress = useCallback(() => {
    setProofMotion('press')
  }, [])

  return (
    <div className="scene archimedes-room-scene">
      <header className="scene-header hub-scene-header archimedes-room-header">
        <h2>Archimedes&apos; Room</h2>
      </header>

      <section className="scene-body archimedes-room-body">
        <div className="archimedes-study-layout">
          <aside className="archimedes-study-side archimedes-study-side--left">
            <div className="archimedes-objective-card">
              <span className="archimedes-objective-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="7" r="1.1" fill="currentColor" />
                </svg>
              </span>
              <div className="archimedes-objective-copy">
                <p className="archimedes-objective-title">Objective</p>
                <p className="archimedes-objective-text">
                  Use <strong>ρ = m / V</strong> to prove that the crown is impure.
                </p>
              </div>
            </div>
          </aside>

          <div
            className="archimedes-papyrus-stage"
            style={
              {
                '--papyrus-src-w': PAPYRUS_SRC_W,
                '--papyrus-src-h': PAPYRUS_SRC_H,
              } as CSSProperties
            }
          >
            <div className="archimedes-papyrus-art" aria-hidden="true">
              <img
                src={papyrusImg}
                alt=""
                className="archimedes-papyrus-img"
                width={PAPYRUS_SRC_W}
                height={PAPYRUS_SRC_H}
                decoding="async"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="archimedes-papyrus-overlay">
              <div className="archimedes-formula-banner">
                <p className="archimedes-formula-main">
                  ρ<sub>density</sub> = m<sub>mass</sub> / V<sub>volume</sub>
                </p>
                <p className="archimedes-formula-note">density = mass / volume</p>
              </div>

              <div className="archimedes-density-grid">
                <article className="archimedes-density-card">
                  <h3>Crown</h3>
                  <label className="archimedes-field">
                    <span>m (g)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={a.crownMassG}
                      onChange={(e) => setField({ crownMassG: e.target.value })}
                      aria-label="Crown mass in grams"
                      data-valid={crownMassOk ? 'true' : 'false'}
                    />
                  </label>
                  <label className="archimedes-field">
                    <span>V (mL)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={a.crownVolumeMl}
                      onChange={(e) => setField({ crownVolumeMl: e.target.value })}
                      aria-label="Crown volume in milliliters"
                      data-valid={crownVolumeOk ? 'true' : 'false'}
                    />
                  </label>
                  <p className="archimedes-density-result">
                    {crownDensity !== null ? `ρ ≈ ${crownDensity.toFixed(4)} g/mL` : 'ρ ='}
                  </p>
                </article>

                <article className="archimedes-density-card">
                  <h3>Pure gold</h3>
                  <label className="archimedes-field">
                    <span>m (g)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={a.lumpMassG}
                      onChange={(e) => setField({ lumpMassG: e.target.value })}
                      aria-label="Gold lump mass in grams"
                      data-valid={lumpMassOk ? 'true' : 'false'}
                    />
                  </label>
                  <label className="archimedes-field">
                    <span>V (mL)</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={a.lumpVolumeMl}
                      onChange={(e) => setField({ lumpVolumeMl: e.target.value })}
                      aria-label="Gold lump volume in milliliters"
                      data-valid={lumpVolumeOk ? 'true' : 'false'}
                    />
                  </label>
                  <p className="archimedes-density-result">
                    {lumpDensity !== null ? `ρ ≈ ${lumpDensity.toFixed(4)} g/mL` : 'ρ ='}
                  </p>
                </article>
              </div>

              <div className="archimedes-verdict-panel" aria-live="polite">
                <p className="archimedes-verdict-text">
                  {exactValuesEntered
                    ? 'The crown is less dense than pure gold.'
                    : filled
                      ? 'The papyrus is not yet correct.'
                      : 'Complete the papyrus with the measured values to unlock the scroll.'}
                </p>
              </div>
            </div>
          </div>

          <aside className="archimedes-study-side archimedes-study-side--right">
            <div
              className={`archimedes-proof-actions archimedes-proof-actions--${proofMotion}`}
              ref={proofActionsRef}
              onMouseEnter={handleProofHover}
              onMouseLeave={handleProofLeave}
              onMouseDown={handleProofPress}
              onMouseUp={handleProofHover}
            >
              {a.proofUnlocked && exactValuesEntered ? (
                <div className="archimedes-proof-scroll-ready" aria-live="polite">
                  <img
                    src={scrollPng}
                    alt=""
                    className="archimedes-proof-scroll-img archimedes-proof-scroll-img--sealed"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                  <p className="archimedes-proof-scroll-status">Proof scroll ready</p>
                </div>
              ) : (
                <button
                  type="button"
                  className="archimedes-proof-scroll-hit"
                  disabled={!exactValuesEntered || sealUnlockPhase === 'playing'}
                  onClick={tryUnlockProof}
                  aria-busy={sealUnlockPhase === 'playing'}
                  aria-label={
                    exactValuesEntered
                      ? 'Seal the proof scroll for the throne room'
                      : 'Enter the exact measured values to seal the proof scroll'
                  }
                >
                  <ProofScrollWithLock
                    scrollSrc={scrollPng}
                    scrollImgClassName="archimedes-proof-scroll-img"
                    showPadlock={!exactValuesEntered || sealUnlockPhase === 'idle'}
                    playUnlockVideo={sealUnlockPhase === 'playing'}
                    onUnlockVideoEnded={onSealUnlockVideoEnded}
                  />
                  <span className="archimedes-proof-scroll-hintline">
                    {sealUnlockPhase === 'playing'
                      ? 'Unlocking…'
                      : exactValuesEntered
                        ? 'Seal the proof'
                        : 'Scroll locked'}
                  </span>
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default ArchimedesRoomScene
