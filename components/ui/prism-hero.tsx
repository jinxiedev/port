"use client"

import * as React from "react"
import * as THREE from "three"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { MeshTransmissionMaterial, Environment, Lightformer } from "@react-three/drei"
import { motion, useAnimationControls, useReducedMotion } from "motion/react"

/* -------------------------------------------------------------------------- */
/*  Error Boundary for WebGL                                                  */
/* -------------------------------------------------------------------------- */

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn("WebGL / Three.js render warning:", error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

/* -------------------------------------------------------------------------- */
/*  Headline texture                                                          */
/* -------------------------------------------------------------------------- */

function resolveFontStack(stack: string): string {
  if (typeof window === "undefined") return stack
  const root = getComputedStyle(document.documentElement)
  return stack.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_m, name: string) => {
    const v = root.getPropertyValue(name).trim()
    return v || "serif"
  })
}

function drawHeadline(
  text: string,
  color: string,
  fontFamily: string,
  italic: boolean
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null

  const W = 2048
  const H = 640
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.clearRect(0, 0, W, H)

  const stack = resolveFontStack(fontFamily)
  const style = italic ? "italic " : ""

  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  if ("letterSpacing" in ctx) {
    ;(ctx as any).letterSpacing = "0.20em"
  }

  // Target width: 88% of canvas so 'j' and 'i' are slightly smaller and refined
  const targetWidth = W * 0.88
  let size = 340
  ctx.font = `${style}500 ${size}px ${stack}`

  let measured = ctx.measureText(text).width
  if (measured > 0) {
    size = Math.round(size * (targetWidth / measured))
    size = Math.min(size, Math.floor(H * 0.76))
    ctx.font = `${style}500 ${size}px ${stack}`
    measured = ctx.measureText(text).width

    // Fine-tune if needed
    if (measured > 0 && Math.abs(measured - targetWidth) > 12) {
      size = Math.round(size * (targetWidth / measured))
      size = Math.min(size, Math.floor(H * 0.76))
      ctx.font = `${style}500 ${size}px ${stack}`
    }
  }

  ctx.fillStyle = color
  ctx.fillText(text, W / 2, H / 2)

  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  t.wrapS = THREE.ClampToEdgeWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.needsUpdate = true
  return t
}

function useHeadlineTexture(
  text: string,
  color: string,
  fontFamily: string,
  italic: boolean
) {
  const [texture, setTexture] = React.useState<THREE.CanvasTexture | null>(() =>
    drawHeadline(text, color, fontFamily, italic)
  )

  React.useEffect(() => {
    let cancelled = false
    const rebake = () => {
      if (!cancelled) setTexture(drawHeadline(text, color, fontFamily, italic))
    }
    rebake()
    if (document.fonts?.ready) {
      document.fonts.ready.then(rebake).catch(rebake)
    }
    return () => {
      cancelled = true
    }
  }, [text, color, fontFamily, italic])

  React.useEffect(() => () => texture?.dispose(), [texture])

  return texture
}

function Headline({
  texture,
  z = -2.2,
}: {
  texture: THREE.CanvasTexture | null
  z?: number
}) {
  const { viewport, camera } = useThree()
  const portrait = viewport.width < viewport.height

  // World Z of Headline inside FocalGroup (which has position [0, 0, portrait ? -0.4 : 0])
  const groupZ = portrait ? -0.4 : 0
  const worldZ = groupZ + z
  const pCamera = camera as THREE.PerspectiveCamera
  const distance = pCamera.position.z - worldZ
  const vFovRad = (pCamera.fov * Math.PI) / 180
  const visibleHeight = 2 * Math.tan(vFovRad / 2) * distance
  const screenAspect = viewport.width / viewport.height
  const screenWidthAtZ = visibleHeight * screenAspect

  // Slightly smaller width and gentle nudge to the right
  const width = portrait ? screenWidthAtZ * 1.02 : screenWidthAtZ * 0.98
  const height = width * (640 / 2048)
  const xOffset = portrait ? 0.08 : 0.14

  if (!texture) return null

  return (
    <mesh position={[xOffset, 0.18, z]} renderOrder={-1}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

/* -------------------------------------------------------------------------- */
/*  Crystal                                                                   */
/* -------------------------------------------------------------------------- */

function createCurvedSpikeGeometry() {
  // High-subdivision sphere base for smooth curvature and clean normals
  const geom = new THREE.SphereGeometry(1.2, 80, 80)
  const pos = geom.attributes.position
  const v = new THREE.Vector3()
  const normal = new THREE.Vector3()

  // 10 organic curved lobes/spikes distributed in 3D space
  // Each lobe has:
  // - dir: center direction on the sphere
  // - height: protrusion distance (curved spike length)
  // - power: dome curvature exponent (>= 2.8 ensures a smooth rounded dome, NEVER sharp/pointy)
  // - curl: lateral deflection direction to give the spike a smooth curved/bent profile
  const lobes = [
    // Top sweeping curved lobes
    {
      dir: new THREE.Vector3(0.52, 0.78, 0.34).normalize(),
      height: 0.54,
      power: 3.2,
      curl: new THREE.Vector3(-0.28, 0.12, 0.32),
    },
    {
      dir: new THREE.Vector3(-0.58, 0.72, 0.38).normalize(),
      height: 0.50,
      power: 3.0,
      curl: new THREE.Vector3(0.24, 0.16, -0.28),
    },
    {
      dir: new THREE.Vector3(0.12, 0.85, -0.52).normalize(),
      height: 0.58,
      power: 3.4,
      curl: new THREE.Vector3(0.30, 0.10, 0.22),
    },
    {
      dir: new THREE.Vector3(-0.50, 0.55, -0.67).normalize(),
      height: 0.46,
      power: 3.0,
      curl: new THREE.Vector3(-0.20, 0.20, 0.24),
    },

    // Mid-waist dynamic curved lobes
    {
      dir: new THREE.Vector3(0.88, 0.08, -0.46).normalize(),
      height: 0.55,
      power: 3.1,
      curl: new THREE.Vector3(-0.15, 0.30, 0.26),
    },
    {
      dir: new THREE.Vector3(-0.85, 0.15, -0.50).normalize(),
      height: 0.48,
      power: 2.9,
      curl: new THREE.Vector3(0.20, -0.24, 0.20),
    },
    {
      dir: new THREE.Vector3(0.42, -0.22, 0.88).normalize(),
      height: 0.52,
      power: 3.2,
      curl: new THREE.Vector3(-0.24, -0.15, 0.22),
    },
    {
      dir: new THREE.Vector3(-0.70, -0.28, 0.65).normalize(),
      height: 0.48,
      power: 3.0,
      curl: new THREE.Vector3(0.22, 0.20, -0.16),
    },

    // Bottom anchoring curved lobes
    {
      dir: new THREE.Vector3(0.22, -0.84, -0.50).normalize(),
      height: 0.50,
      power: 3.2,
      curl: new THREE.Vector3(0.20, 0.12, 0.26),
    },
    {
      dir: new THREE.Vector3(-0.32, -0.86, 0.38).normalize(),
      height: 0.54,
      power: 3.3,
      curl: new THREE.Vector3(-0.22, -0.10, 0.30),
    },
  ]

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    normal.copy(v).normalize()

    let totalDisplacement = 0
    const lateralCurl = new THREE.Vector3(0, 0, 0)

    for (const lobe of lobes) {
      const dot = normal.dot(lobe.dir)
      if (dot > 0) {
        // Smooth curved lobe profile:
        // Exponent >= 2.9 guarantees zero slope at base and a rounded dome at the tip (never sharp/runcing)
        const w = Math.pow(dot, lobe.power)
        totalDisplacement += w * lobe.height

        // Lateral deflection that increases towards the tip, curving the spike gracefully
        lateralCurl.addScaledVector(lobe.curl, Math.pow(dot, lobe.power * 0.85) * lobe.height)
      }
    }

    // Subtle micro-undulation across surface for organic liquid realism
    const ripple =
      Math.sin(normal.x * 4.0) *
      Math.cos(normal.y * 4.0) *
      Math.sin(normal.z * 4.0) *
      0.03

    // Apply radial expansion + lateral curl deflection
    const newRadius = v.length() + totalDisplacement + ripple
    v.copy(normal).multiplyScalar(newRadius).add(lateralCurl)

    pos.setXYZ(i, v.x, v.y, v.z)
  }

  geom.computeVertexNormals()
  return geom
}

function Crystal({
  progress,
  reducedMotion,
  dispersion,
  tint,
  spec,
}: {
  progress: React.RefObject<number>
  reducedMotion: boolean
  dispersion: number
  tint: string
  spec: QualitySpec
}) {
  const ref = React.useRef<THREE.Mesh>(null)
  const pointer = React.useRef({ x: 0, y: 0 })
  const { viewport } = useThree()

  // Physics state for magnetic liquid split & snap-back
  const isHoldingRef = React.useRef(false)
  const holdTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const sep = React.useRef(0) // 0 (unified) to 1 (fully separated)
  const sepVel = React.useRef(0)
  const impactWobble = React.useRef(0)

  const startHold = React.useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    // Only activate if held for > 200ms (tap doang = gada animasi apa-apa)
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true
    }, 200)
  }, [])

  const endHold = React.useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    isHoldingRef.current = false
  }, [])

  // Satellite mesh references
  const sat1Ref = React.useRef<THREE.Mesh>(null)
  const sat2Ref = React.useRef<THREE.Mesh>(null)
  const sat3Ref = React.useRef<THREE.Mesh>(null)
  const sat4Ref = React.useRef<THREE.Mesh>(null)

  // Generate smooth curved spike geometry once (shared by main drop and satellite drops)
  const spikedGeometry = React.useMemo(() => createCurvedSpikeGeometry(), [])

  React.useEffect(() => {
    return () => {
      spikedGeometry.dispose()
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [spikedGeometry])

  const portrait = viewport.width < viewport.height
  const fit = Math.min(viewport.width, viewport.height)
  const baseScale = THREE.MathUtils.clamp(
    fit / 6.2,
    portrait ? 0.26 : 0.34,
    0.78
  )

  React.useEffect(() => {
    if (reducedMotion) return
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onUp = () => {
      endHold()
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [reducedMotion, endHold])

  useFrame((state, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.04)

    // Magnetic spring simulation:
    // Only activates when HELD (tap doang = no animation)
    const targetSep = isHoldingRef.current ? 1.0 : 0.0
    const springK = isHoldingRef.current ? 36 : 60
    const damping = isHoldingRef.current ? 7.5 : 8.8

    const force = (targetSep - sep.current) * springK - sepVel.current * damping
    sepVel.current += force * dt
    const prevSep = sep.current
    sep.current += sepVel.current * dt

    // Trigger elastic impact shockwave when magnetic droplets slam back into the core
    if (prevSep > 0.03 && sep.current <= 0.03 && !isHoldingRef.current) {
      impactWobble.current = 1.0
    }
    if (impactWobble.current > 0.001) {
      impactWobble.current = Math.max(0, impactWobble.current - dt * 2.8)
    }

    const s = Math.max(0, sep.current)

    // Viscous fluid movement & organic multi-axis tumbling
    const rotY = reducedMotion ? 0 : Math.sin(t * 0.12) * 0.4 + Math.cos(t * 0.05) * 0.3
    const rotX = reducedMotion ? 0 : Math.cos(t * 0.10) * 0.35 + Math.sin(t * 0.06) * 0.2
    const rotZ = reducedMotion ? 0 : Math.sin(t * 0.08) * 0.25

    // Fluid drag from pointer
    const tx = pointer.current.x * 0.4
    const ty = -pointer.current.y * 0.35

    mesh.rotation.y = THREE.MathUtils.damp(mesh.rotation.y, rotY + tx, 2.5, delta)
    mesh.rotation.x = THREE.MathUtils.damp(mesh.rotation.x, rotX + ty, 2.5, delta)
    mesh.rotation.z = THREE.MathUtils.damp(mesh.rotation.z, rotZ + tx * ty * 0.2, 2.5, delta)

    // Gentle organic floating drift (centered optically)
    const floatY = Math.sin(t * 0.65) * 0.045
    const floatX = Math.cos(t * 0.5) * 0.035
    mesh.position.x = THREE.MathUtils.damp(mesh.position.x, floatX + tx * 0.25, 2.2, delta)
    mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 0.18 + floatY + ty * 0.2, 2.2, delta)

    // Dynamic surface tension breathing + heartbeat denyut when held
    const holdDenyut = isHoldingRef.current ? Math.sin(t * 8.5) * 0.06 : 0
    const pulseX = 1 + Math.sin(t * 1.1) * 0.03 + holdDenyut
    const pulseY = 1 + Math.cos(t * 1.3) * 0.03 - holdDenyut * 0.5
    const pulseZ = 1 - Math.sin(t * 1.1) * 0.02 + holdDenyut

    // Central core: shrinks slightly when split to conserve liquid mass, and wobbles on magnetic recombine
    const wobble = Math.sin(t * 22) * impactWobble.current * 0.15
    const coreFactor = (1 - s * 0.28) + wobble
    mesh.scale.set(
      baseScale * pulseX * coreFactor,
      baseScale * pulseY * coreFactor,
      baseScale * pulseZ * coreFactor
    )

    // Satellite magnetic droplets
    const spreadDistance = portrait ? 1.1 : 1.45
    const satScaleProgress = THREE.MathUtils.smoothstep(s, 0.02, 0.45)

    const satellites = [
      { ref: sat1Ref, dir: new THREE.Vector3( 1.15,  0.80,  0.35), size: 0.52, spin: [ 1.2,  0.9, -0.7] },
      { ref: sat2Ref, dir: new THREE.Vector3(-1.10, -0.72,  0.42), size: 0.46, spin: [-0.8,  1.1,  0.6] },
      { ref: sat3Ref, dir: new THREE.Vector3(-0.78,  0.95, -0.38), size: 0.40, spin: [ 0.9, -1.0,  0.8] },
      { ref: sat4Ref, dir: new THREE.Vector3( 0.86, -0.82, -0.32), size: 0.36, spin: [-1.1,  0.7, -0.9] },
    ]

    satellites.forEach(({ ref: sRef, dir, size, spin }) => {
      const sat = sRef.current
      if (!sat) return
      sat.visible = s > 0.008

      if (sat.visible) {
        const dist = s * spreadDistance
        sat.position.set(
          mesh.position.x + dir.x * dist + tx * 0.12,
          mesh.position.y + dir.y * dist + ty * 0.12,
          dir.z * dist
        )
        sat.rotation.x = rotX + t * spin[0] * 0.6
        sat.rotation.y = rotY + t * spin[1] * 0.6
        sat.rotation.z = rotZ + t * spin[2] * 0.6

        const curSize = baseScale * size * satScaleProgress * (1 + Math.sin(t * 2.8 + dir.x * 3) * 0.04)
        sat.scale.set(curSize, curSize, curSize)
      }
    })
  })

  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation()
        startHold()
      }}
    >
      {/* Invisible backdrop raycast plane to catch holds anywhere in hero */}
      <mesh
        position={[0, 0, -1]}
        visible={false}
        onPointerDown={() => {
          startHold()
        }}
      >
        <planeGeometry args={[100, 100]} />
      </mesh>

      {/* Primary Central Core */}
      <mesh ref={ref} position={[0, 0.18, 0]} geometry={spikedGeometry}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.35}
          roughness={0.035}
          ior={1.48}
          chromaticAberration={dispersion}
          anisotropy={0.25}
          anisotropicBlur={0.15}
          distortion={0.48}
          distortionScale={0.35}
          temporalDistortion={0.3}
          backside={spec.backside ?? true}
          backsideThickness={0.5}
          samples={spec.samples ?? 6}
          resolution={spec.resolution ?? 384}
          color={tint}
          attenuationColor={tint}
          attenuationDistance={8}
        />
      </mesh>

      {/* Satellite Magnetic Droplets - Identical curved-spike dynamic geometry & RGB chromatic refraction shader */}
      <mesh ref={sat1Ref} geometry={spikedGeometry} visible={false}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.1}
          roughness={0.035}
          ior={1.48}
          chromaticAberration={dispersion}
          anisotropy={0.25}
          anisotropicBlur={0.15}
          distortion={0.4}
          distortionScale={0.3}
          temporalDistortion={0.25}
          samples={Math.min(spec.samples ?? 4, 4)}
          resolution={Math.min(spec.resolution ?? 256, 256)}
          color={tint}
          attenuationColor={tint}
          attenuationDistance={8}
        />
      </mesh>
      <mesh ref={sat2Ref} geometry={spikedGeometry} visible={false}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.1}
          roughness={0.035}
          ior={1.48}
          chromaticAberration={dispersion}
          anisotropy={0.25}
          anisotropicBlur={0.15}
          distortion={0.4}
          distortionScale={0.3}
          temporalDistortion={0.25}
          samples={Math.min(spec.samples ?? 4, 4)}
          resolution={Math.min(spec.resolution ?? 256, 256)}
          color={tint}
          attenuationColor={tint}
          attenuationDistance={8}
        />
      </mesh>
      <mesh ref={sat3Ref} geometry={spikedGeometry} visible={false}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.1}
          roughness={0.035}
          ior={1.48}
          chromaticAberration={dispersion}
          anisotropy={0.25}
          anisotropicBlur={0.15}
          distortion={0.4}
          distortionScale={0.3}
          temporalDistortion={0.25}
          samples={Math.min(spec.samples ?? 4, 4)}
          resolution={Math.min(spec.resolution ?? 256, 256)}
          color={tint}
          attenuationColor={tint}
          attenuationDistance={8}
        />
      </mesh>
      <mesh ref={sat4Ref} geometry={spikedGeometry} visible={false}>
        <MeshTransmissionMaterial
          transmission={1}
          thickness={1.1}
          roughness={0.035}
          ior={1.48}
          chromaticAberration={dispersion}
          anisotropy={0.25}
          anisotropicBlur={0.15}
          distortion={0.4}
          distortionScale={0.3}
          temporalDistortion={0.25}
          samples={Math.min(spec.samples ?? 4, 4)}
          resolution={Math.min(spec.resolution ?? 256, 256)}
          color={tint}
          attenuationColor={tint}
          attenuationDistance={8}
        />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*  Atmosphere                                                                */
/* -------------------------------------------------------------------------- */

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function Motes({ count = 90, color }: { count?: number; color: string }) {
  const ref = React.useRef<THREE.Points>(null)

  const { positions, speeds } = React.useMemo(() => {
    const rand = mulberry32(1337)
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 18
      pos[i * 3 + 1] = (rand() - 0.5) * 11
      pos[i * 3 + 2] = (rand() - 0.5) * 6 - 1
      spd[i] = 0.02 + rand() * 0.05
    }
    return { positions: pos, speeds: spd }
  }, [count])

  useFrame((_, delta) => {
    const pts = ref.current
    if (!pts) return
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -5.5
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color={color}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function FocalGroup({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree()
  const portrait = viewport.width < viewport.height
  return (
    <group position={[0, 0, portrait ? -0.4 : 0]}>
      {children}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*  Scene                                                                     */
/* -------------------------------------------------------------------------- */

function Scene({
  headline,
  headlineColor,
  displayFont,
  italic,
  progress,
  reducedMotion,
  dispersion,
  tint,
  moteColor,
  spec,
}: {
  headline: string
  headlineColor: string
  displayFont: string
  italic: boolean
  progress: React.RefObject<number>
  reducedMotion: boolean
  dispersion: number
  tint: string
  moteColor: string
  spec: QualitySpec
}) {
  const texture = useHeadlineTexture(headline, headlineColor, displayFont, italic)

  return (
    <React.Suspense fallback={null}>
      <Environment resolution={256}>
        <Lightformer
          form="ring"
          intensity={3.5}
          position={[0, 7, -1]}
          scale={12}
          color="#fff6e2"
        />
        <Lightformer
          form="circle"
          intensity={2.2}
          position={[-8, 2, -2]}
          scale={10}
          color="#bcd6ff"
        />
        <Lightformer
          form="circle"
          intensity={2.0}
          position={[8, -2, -2]}
          scale={9}
          color="#ffcf96"
        />
        <Lightformer
          form="ring"
          intensity={1.8}
          position={[0, -5, -4]}
          scale={11}
          color="#ffffff"
        />
      </Environment>

      <FocalGroup>
        <Headline texture={texture} />
        <Crystal
          progress={progress}
          reducedMotion={reducedMotion}
          dispersion={dispersion}
          tint={tint}
          spec={spec}
        />
      </FocalGroup>
      <Motes color={moteColor} count={spec.motes} />
    </React.Suspense>
  )
}

/* -------------------------------------------------------------------------- */
/*  Adaptive quality                                                          */
/* -------------------------------------------------------------------------- */

type Quality = "low" | "medium" | "high"

interface QualitySpec {
  samples: number
  resolution: number
  motes: number
  backside: boolean
  maxDpr: number
}

const QUALITY: Record<Quality, QualitySpec> = {
  low: { samples: 4, resolution: 256, motes: 55, backside: true, maxDpr: 1.5 },
  medium: { samples: 6, resolution: 384, motes: 85, backside: true, maxDpr: 1.75 },
  high: { samples: 8, resolution: 512, motes: 120, backside: true, maxDpr: 2.0 },
}

function subscribeToViewport(cb: () => void) {
  window.addEventListener("resize", cb)
  return () => window.removeEventListener("resize", cb)
}

function detectQuality(): Quality {
  if (typeof window === "undefined") return "medium"
  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  if (isMobile) return "low"
  const w = window.innerWidth
  if (w < 1440) return "medium"
  return "high"
}

/* -------------------------------------------------------------------------- */
/*  Entrance motion                                                           */
/* -------------------------------------------------------------------------- */

const ENTER = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 96, damping: 17, mass: 0.9 },
  },
}

const GROUP = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
}

/* -------------------------------------------------------------------------- */
/*  Revert B&W Invert Text Lens                                               */
/* -------------------------------------------------------------------------- */

function RevertBnWText({
  text,
  foreground = "#EDE8DF",
}: {
  text: string
  foreground?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = React.useState(false)

  const updatePos = (clientX: number, clientY: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setPos({
      x: clientX - rect.left,
      y: clientY - rect.top,
    })
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={(e) => {
        updatePos(e.clientX, e.clientY)
        setIsHovered(true)
      }}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => updatePos(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length > 0) updatePos(e.touches[0].clientX, e.touches[0].clientY)
        setIsHovered(true)
      }}
      onTouchMove={(e) => {
        if (e.touches.length > 0) updatePos(e.touches[0].clientX, e.touches[0].clientY)
      }}
      onTouchEnd={() => setIsHovered(false)}
      className="group relative cursor-crosshair select-none rounded-xl p-3 -m-3 border border-transparent hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300"
    >
      {/* Base Layer: Dark background, light editorial text */}
      <p
        className="text-base md:text-lg leading-relaxed font-light transition-opacity duration-300"
        style={{ color: foreground }}
      >
        {text}
      </p>

      {/* Inverted B&W Layer: Pitch-black text on crisp paper white mask */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl bg-[#EDE8DF] p-3 text-[#08080B]"
        style={{
          opacity: isHovered ? 1 : 0,
          clipPath: isHovered
            ? `circle(115px at ${pos.x}px ${pos.y}px)`
            : `circle(0px at ${pos.x}px ${pos.y}px)`,
          transition: "clip-path 0.1s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease",
        }}
      >
        <p className="text-base md:text-lg leading-relaxed font-medium text-[#08080B]">
          {text}
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Public component                                                          */
/* -------------------------------------------------------------------------- */

export interface PrismHeroProps {
  eyebrow?: string
  headline?: string
  description?: string
  action?: React.ReactNode
  secondaryAction?: React.ReactNode
  meta?: string[]
  dispersion?: number
  tint?: string
  background?: string
  foreground?: string
  accent?: string
  displayFont?: string
  italicHeadline?: boolean
  staticProgress?: number
  sceneChildren?: React.ReactNode
  topInset?: boolean
  className?: string
}

export function PrismHero({
  eyebrow = "Bevel UI",
  headline = "Refraction",
  description = "",
  action,
  secondaryAction,
  meta = ["Procedural geometry", "Real transmission", "Zero assets"],
  dispersion = 0.42,
  tint = "#ffffff",
  background = "#08080B",
  foreground = "#EDE8DF",
  accent = "#C9A961",
  displayFont = "var(--font-display), 'Bodoni Moda', Georgia, serif",
  italicHeadline = false,
  staticProgress,
  sceneChildren,
  topInset = false,
  className,
}: PrismHeroProps) {
  const sectionRef = React.useRef<HTMLDivElement>(null)
  const progress = React.useRef(0)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const prefersReduced = useReducedMotion()
  const controls = useAnimationControls()

  const quality = React.useSyncExternalStore(
    subscribeToViewport,
    detectQuality,
    () => "medium" as Quality
  )
  const spec = QUALITY[quality] ?? QUALITY.medium

  const stageRef = React.useRef<HTMLDivElement>(null)
  const [onScreen, setOnScreen] = React.useState(true)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    const el = stageRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: "0px", threshold: 0.01 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  React.useEffect(() => {
    if (prefersReduced || document.hidden) {
      controls.set("show")
      return
    }
    controls.start("show")
  }, [controls, prefersReduced])

  const railRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => setReducedMotion(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  React.useEffect(() => {
    const paint = (p: number) => {
      progress.current = p
      if (railRef.current) railRef.current.style.transform = `scaleX(${p})`
    }

    if (staticProgress !== undefined) {
      paint(Math.min(1, Math.max(0, staticProgress)))
      return
    }
    if (reducedMotion) {
      paint(0)
      return
    }

    let raf = 0
    const update = () => {
      raf = 0
      const el = sectionRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      paint(total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [reducedMotion, staticProgress])

  const isStatic = staticProgress !== undefined

  return (
    <div
      ref={sectionRef}
      className={[
        "relative w-full h-screen min-h-screen overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ background }}
    >
      <div
        ref={stageRef}
        className="relative h-full w-full overflow-hidden"
      >
        {/* Scene ---------------------------------------------------------- */}
        {mounted && (
          <div className="absolute inset-0">
            <WebGLErrorBoundary>
              <Canvas
                dpr={[1, spec.maxDpr]}
                camera={{ position: [0, 0, 4.5], fov: 45 }}
                frameloop={onScreen ? "always" : "never"}
                gl={{ antialias: true, powerPreference: "high-performance" }}
              >
                <Scene
                  headline={headline}
                  headlineColor={foreground}
                  displayFont={displayFont}
                  italic={italicHeadline}
                  progress={progress}
                  reducedMotion={reducedMotion}
                  dispersion={dispersion}
                  tint={tint}
                  moteColor={accent}
                  spec={spec}
                />
                {sceneChildren}
              </Canvas>
            </WebGLErrorBoundary>
          </div>
        )}

        {/* Copy overlay --------------------------------------------------- */}
        <div
          className={[
            "relative z-10 flex h-full flex-col justify-between p-6 md:p-12 pointer-events-none",
            topInset ? "pt-24 md:pt-32" : "",
          ].join(" ")}
        >
          {/* Top / Eyebrow */}
          <motion.div
            variants={GROUP}
            initial="hidden"
            animate={controls}
            className="flex items-center gap-3 text-xs tracking-widest uppercase font-mono pointer-events-auto"
            style={{ color: accent }}
          >
            {eyebrow && <motion.span variants={ENTER}>{eyebrow}</motion.span>}
          </motion.div>

          {/* Lower third: Description & Actions */}
          <motion.div
            variants={GROUP}
            initial="hidden"
            animate={controls}
            className="flex flex-col gap-6 max-w-xl pointer-events-auto"
          >
            {description && (
              <motion.div variants={ENTER}>
                <RevertBnWText text={description} foreground={foreground} />
              </motion.div>
            )}

            {(action || secondaryAction) && (
              <motion.div
                variants={ENTER}
                className="flex items-center gap-4 flex-wrap"
              >
                {action}
                {secondaryAction}
              </motion.div>
            )}
          </motion.div>

          {/* Bottom metadata strip & progress rail */}
          <div className="relative pt-6 pointer-events-auto">
            {meta && meta.length > 0 && (
              <motion.div
                variants={GROUP}
                initial="hidden"
                animate={controls}
                className="flex items-center gap-6 text-xs font-mono opacity-60 flex-wrap pb-4"
                style={{ color: foreground }}
              >
                {meta.map((item, i) => (
                  <motion.span key={i} variants={ENTER}>
                    {item}
                  </motion.span>
                ))}
              </motion.div>
            )}

            {/* Scroll Progress rail */}
            {!isStatic && (
              <div
                className="h-[1px] w-full bg-current opacity-20 overflow-hidden"
                style={{ color: foreground }}
              >
                <div
                  ref={railRef}
                  className="h-full w-full origin-left bg-current"
                  style={{ color: accent, transform: "scaleX(0)" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrismHero
