import type React from 'react'
import * as THREE from 'three'
import type { PlacedObject3D } from '@/types/design'
import { useMemo } from 'react'

/** TV dimensions (width x height in feet) by screen size in inches */
export function tvDimensions(sizeIn: number): [number, number] {
  switch (sizeIn) {
    case 40: return [2.9, 1.7]
    case 55: return [4.0, 2.25]
    case 65: return [4.75, 2.7]
    case 75: return [5.4, 3.1]
    default: return [4.0, 2.25]
  }
}

/** TV panel that mounts on a wall segment face */
export function TVMount({
  sizeIn, wallH, wallD, keyPrefix,
}: {
  sizeIn: number; wallH: number; wallD: number; keyPrefix: string;
}) {
  const [tvW, tvH] = tvDimensions(sizeIn)
  const centerY = Math.min(wallH * 0.6, wallH - tvH / 2 - 0.3)

  return (
    <>
      {/* TV screen */}
      <mesh key={`${keyPrefix}-tv`} position={[0, centerY, wallD / 2 + 0.05]} castShadow>
        <boxGeometry args={[tvW, tvH, 0.1]} />
        <meshStandardMaterial color={new THREE.Color('#111')} />
      </mesh>
      {/* Bezel border */}
      <mesh key={`${keyPrefix}-tv-bezel`} position={[0, centerY, wallD / 2 + 0.04]}>
        <boxGeometry args={[tvW + 0.15, tvH + 0.15, 0.08]} />
        <meshStandardMaterial color={new THREE.Color('#222')} />
      </mesh>
    </>
  )
}

/** Extract common wall feature props from a placed object */
export function getWallFeatures(obj: PlacedObject3D) {
  return {
    windowCount: (obj.customProps?.windowCount as number) ?? 0,
    windowLayout: (obj.customProps?.windowLayout as string) ?? 'spread',
    hasDoor: (obj.customProps?.hasDoor as boolean) ?? false,
    doorType: (obj.customProps?.doorType as string) ?? 'regular',
    doorPosition: (obj.customProps?.doorPosition as string) ?? 'center',
    doorWall: (obj.customProps?.doorWall as string) ?? '1',
    hasTV: (obj.customProps?.hasTV as boolean) ?? false,
    tvSize: Number(obj.customProps?.tvSize ?? 55),
  }
}

/**
 * Renders a single wall segment as a group of meshes.
 * Supports window cutouts, door openings, fireplace surrounds, and TV mounts.
 * The segment is centered at the origin and extends along X (width) and Z (thickness).
 */
export function WallSegment({
  wallW, wallH, wallD, color, windowCount = 0, windowLayout = 'spread',
  doorType, doorPosition,
  keyPrefix,
}: {
  wallW: number; wallH: number; wallD: number;
  color: THREE.Color; windowCount?: number; windowLayout?: string;
  doorType?: string; doorPosition?: string;
  keyPrefix: string;
}) {
  const glassColor = new THREE.Color('#87ceeb')

  // Build list of openings (features) along the wall
  type Feature = { cx: number; w: number; bottomY: number; topY: number; type: string }
  const features: Feature[] = []

  // Door opening
  if (doorType && wallW >= 3.5) {
    const doorW = doorType === 'sliding_glass' ? 6 : 3
    const doorH = Math.min(7, wallH - 0.3)
    const margin = doorW / 2 + 0.5
    let doorCX = 0
    if (doorPosition === 'left') doorCX = -wallW / 2 + margin
    else if (doorPosition === 'right') doorCX = wallW / 2 - margin
    if (doorW < wallW - 0.5) {
      features.push({ cx: doorCX, w: doorW, bottomY: 0, topY: doorH, type: doorType })
    }
  }

  // Window openings
  if (windowCount > 0 && wallH >= 3 && wallW >= 2) {
    const winW = Math.min(2.5, (wallW * 0.6) / windowCount)
    const margin = Math.max(0.5, wallH * 0.2)
    const sillY = margin
    const headerY = wallH - margin

    const doorClearance = 0.5
    type Span = { left: number; right: number }
    let spans: Span[] = [{ left: -wallW / 2, right: wallW / 2 }]
    for (const f of features) {
      const blockLeft = f.cx - f.w / 2 - doorClearance
      const blockRight = f.cx + f.w / 2 + doorClearance
      const newSpans: Span[] = []
      for (const s of spans) {
        if (blockRight <= s.left || blockLeft >= s.right) {
          newSpans.push(s)
        } else {
          if (s.left < blockLeft) newSpans.push({ left: s.left, right: blockLeft })
          if (s.right > blockRight) newSpans.push({ left: blockRight, right: s.right })
        }
      }
      spans = newSpans
    }

    const totalAvail = spans.reduce((sum, s) => sum + (s.right - s.left), 0)
    const winCenters: number[] = []

    if (windowLayout === 'centered' && spans.length === 1) {
      const s = spans[0]
      const sMid = (s.left + s.right) / 2
      const gap = 0.5
      const totalSpan = windowCount * winW + (windowCount - 1) * gap
      const startX = sMid - totalSpan / 2 + winW / 2
      for (let i = 0; i < windowCount; i++) winCenters.push(startX + i * (winW + gap))
    } else {
      let remaining = windowCount
      for (const s of spans) {
        const spanW = s.right - s.left
        const count = Math.max(0, Math.round(remaining * (spanW / totalAvail)))
        if (count > 0 && spanW >= winW) {
          const edgeMargin = winW / 2 + 0.3
          const usable = spanW - edgeMargin * 2
          if (count === 1) {
            winCenters.push((s.left + s.right) / 2)
          } else {
            const step = usable / (count - 1)
            for (let i = 0; i < count; i++) {
              winCenters.push(s.left + edgeMargin + i * step)
            }
          }
          remaining -= count
        }
      }
      if (remaining > 0 && spans.length > 0) {
        const largest = spans.reduce((a, b) => (b.right - b.left) > (a.right - a.left) ? b : a)
        const spanW = largest.right - largest.left
        const edgeMargin = winW / 2 + 0.3
        if (spanW >= winW) {
          const usable = spanW - edgeMargin * 2
          const step = remaining > 1 ? usable / (remaining - 1) : 0
          for (let i = 0; i < remaining; i++) {
            winCenters.push(largest.left + edgeMargin + i * step)
          }
        }
      }
    }

    for (const wx of winCenters) {
      if (wx - winW / 2 >= -wallW / 2 && wx + winW / 2 <= wallW / 2) {
        features.push({ cx: wx, w: winW, bottomY: sillY, topY: headerY, type: 'window' })
      }
    }
  }

  // Sort features left to right
  features.sort((a, b) => a.cx - b.cx)

  // No features — solid wall
  if (features.length === 0) {
    return (
      <mesh position={[0, wallH / 2, 0]} castShadow>
        <boxGeometry args={[wallW, wallH, wallD]} />
        <meshStandardMaterial color={color} />
      </mesh>
    )
  }

  // Build wall pieces column by column around openings
  const els: React.JSX.Element[] = []
  let prevRight = -wallW / 2

  for (let i = 0; i < features.length; i++) {
    const f = features[i]
    const fLeft = f.cx - f.w / 2
    const fRight = f.cx + f.w / 2

    const pillarW = fLeft - prevRight
    if (pillarW > 0.01) {
      els.push(
        <mesh key={`${keyPrefix}-p${i}`} position={[(prevRight + fLeft) / 2, wallH / 2, 0]} castShadow>
          <boxGeometry args={[pillarW, wallH, wallD]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
    }

    if (f.bottomY > 0.01) {
      els.push(
        <mesh key={`${keyPrefix}-s${i}`} position={[f.cx, f.bottomY / 2, 0]} castShadow>
          <boxGeometry args={[f.w, f.bottomY, wallD]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
    }

    const headerH = wallH - f.topY
    if (headerH > 0.01) {
      els.push(
        <mesh key={`${keyPrefix}-h${i}`} position={[f.cx, f.topY + headerH / 2, 0]} castShadow>
          <boxGeometry args={[f.w, headerH, wallD]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
    }

    const openingH = f.topY - f.bottomY
    if (f.type === 'window') {
      els.push(
        <mesh key={`${keyPrefix}-g${i}`} position={[f.cx, f.bottomY + openingH / 2, 0]}>
          <boxGeometry args={[f.w, openingH, wallD * 0.1]} />
          <meshStandardMaterial color={glassColor} transparent opacity={0.3} />
        </mesh>
      )
    } else if (f.type === 'regular') {
      const doorColor = new THREE.Color('#6b4226')
      els.push(
        <mesh key={`${keyPrefix}-d${i}`} position={[f.cx, openingH / 2, 0]}>
          <boxGeometry args={[f.w - 0.2, openingH - 0.1, wallD * 0.3]} />
          <meshStandardMaterial color={doorColor} />
        </mesh>
      )
      els.push(
        <mesh key={`${keyPrefix}-dh${i}`} position={[f.cx + f.w / 2 - 0.5, openingH * 0.45, wallD * 0.2]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={new THREE.Color('#c0c0c0')} metalness={0.8} />
        </mesh>
      )
    } else if (f.type === 'sliding_glass') {
      const panelW = f.w / 2 - 0.1
      els.push(
        <mesh key={`${keyPrefix}-sg-l${i}`} position={[f.cx - f.w / 4, openingH / 2, -wallD * 0.1]}>
          <boxGeometry args={[panelW, openingH - 0.1, wallD * 0.05]} />
          <meshStandardMaterial color={glassColor} transparent opacity={0.2} />
        </mesh>
      )
      els.push(
        <mesh key={`${keyPrefix}-sg-r${i}`} position={[f.cx + f.w / 4, openingH / 2, wallD * 0.1]}>
          <boxGeometry args={[panelW, openingH - 0.1, wallD * 0.05]} />
          <meshStandardMaterial color={glassColor} transparent opacity={0.2} />
        </mesh>
      )
      els.push(
        <mesh key={`${keyPrefix}-sg-f${i}`} position={[f.cx, openingH / 2, 0]}>
          <boxGeometry args={[0.1, openingH, wallD * 0.3]} />
          <meshStandardMaterial color={new THREE.Color('#555')} />
        </mesh>
      )
      els.push(
        <mesh key={`${keyPrefix}-sg-t${i}`} position={[f.cx, openingH - 0.05, 0]}>
          <boxGeometry args={[f.w, 0.1, wallD * 0.3]} />
          <meshStandardMaterial color={new THREE.Color('#555')} />
        </mesh>
      )
      els.push(
        <mesh key={`${keyPrefix}-sg-b${i}`} position={[f.cx, 0.05, 0]}>
          <boxGeometry args={[f.w, 0.1, wallD * 0.3]} />
          <meshStandardMaterial color={new THREE.Color('#555')} />
        </mesh>
      )
    }

    prevRight = fRight
  }

  const finalW = wallW / 2 - prevRight
  if (finalW > 0.01) {
    els.push(
      <mesh key={`${keyPrefix}-pfinal`} position={[(prevRight + wallW / 2) / 2, wallH / 2, 0]} castShadow>
        <boxGeometry args={[finalW, wallH, wallD]} />
        <meshStandardMaterial color={color} />
      </mesh>
    )
  }

  return <>{els}</>
}

/** Green Egg stand extension — a lower counter section with the egg inset or on top */
export function EggStandExtension({
  standW, standDepth, standH, topColor, baseColor, side, kitchenW, mounting,
}: {
  standW: number; standDepth: number; standH: number;
  topColor: THREE.Color; baseColor: THREE.Color;
  side: string; kitchenW: number; mounting: string;
}) {
  const xOffset = side === 'right'
    ? kitchenW / 2 + standW / 2
    : -kitchenW / 2 - standW / 2

  const eggR = Math.min(standW, standDepth) * 0.35
  const onTop = mounting === 'on_top'

  return (
    <group>
      {/* Stand base */}
      <mesh position={[xOffset, (standH - 0.15) / 2, 0]} castShadow>
        <boxGeometry args={[standW, standH - 0.15, standDepth]} />
        <meshStandardMaterial color={baseColor} />
      </mesh>
      {/* Stand countertop */}
      <mesh position={[xOffset, standH - 0.075, 0]} castShadow>
        <boxGeometry args={[standW + 0.1, 0.15, standDepth + 0.1]} />
        <meshStandardMaterial color={topColor} />
      </mesh>

      {onTop ? (
        <group position={[xOffset, standH, 0]}>
          <mesh position={[0, eggR * 0.7, 0]} castShadow>
            <cylinderGeometry args={[eggR, eggR, eggR * 1.4, 20]} />
            <meshStandardMaterial color="#2a5e2a" />
          </mesh>
          <mesh position={[0, eggR * 1.4, 0]} castShadow>
            <sphereGeometry args={[eggR, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#2a5e2a" metalness={0.1} />
          </mesh>
          <mesh position={[0, eggR * 1.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[eggR * 0.99, 0.025, 8, 24]} />
            <meshStandardMaterial color="#1a4a1a" />
          </mesh>
          <mesh position={[0, eggR * 1.9 + 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      ) : (
        <group position={[xOffset, 0, 0]}>
          <mesh position={[0, standH + eggR * 0.35, 0]} castShadow>
            <sphereGeometry args={[eggR, 16, 16, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7]} />
            <meshStandardMaterial color="#2a5e2a" />
          </mesh>
          <mesh position={[0, standH + eggR * 0.35, 0]} castShadow>
            <sphereGeometry args={[eggR * 0.95, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
            <meshStandardMaterial color="#2a5e2a" metalness={0.1} />
          </mesh>
          <mesh position={[0, standH + eggR * 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      )}
    </group>
  )
}

// Planter fill — generates scattered pieces for mulch or river rock
export function PlanterFill({
  fillType,
  width,
  depth,
  height,
  rockSize = 'medium',
  rockColor = 'gray',
}: {
  fillType: string
  width: number
  depth: number
  height: number
  rockSize?: string
  rockColor?: string
}) {
  const pieces = useMemo(() => {
    if (fillType === 'soil') return null

    const items: { pos: [number, number, number]; scale: [number, number, number]; rot: [number, number, number]; color: string }[] = []
    const rand = (i: number, offset: number) => {
      const x = Math.sin(i * 127.1 + offset * 311.7) * 43758.5453
      return x - Math.floor(x)
    }

    const area = width * depth
    const count = Math.min(Math.floor(area * 12), 200)

    if (fillType === 'mulch') {
      const colors = ['#5c3a1e', '#7a4a2a', '#4a2e14', '#6b3f20', '#8a5530', '#3d2510']
      for (let i = 0; i < count; i++) {
        const px = (rand(i, 0) - 0.5) * (width * 0.9)
        const pz = (rand(i, 1) - 0.5) * (depth * 0.9)
        const py = height * 0.65 + rand(i, 2) * height * 0.15
        const chipLen = 0.06 + rand(i, 3) * 0.1
        const chipW = 0.02 + rand(i, 4) * 0.03
        const chipH = 0.01 + rand(i, 5) * 0.015
        const rotY = rand(i, 6) * Math.PI * 2
        const rotX = (rand(i, 7) - 0.5) * 0.6
        items.push({
          pos: [px, py, pz],
          scale: [chipLen, chipH, chipW],
          rot: [rotX, rotY, 0],
          color: colors[Math.floor(rand(i, 8) * colors.length)],
        })
      }
    } else if (fillType === 'river_rock') {
      const grayPalette = ['#8a8a8a', '#a0a0a0', '#707070', '#b8b8b8', '#989898', '#787878', '#c0c0c0', '#686868', '#a8a8a8', '#909090']
      const naturalPalette = ['#8a7560', '#a08870', '#6b5a48', '#b09880', '#907a65', '#c0a888', '#786550', '#9a8570', '#b5a08a', '#7a6b58']
      const mixedPalette = ['#8a8a8a', '#a08870', '#707070', '#b09880', '#989088', '#786550', '#b8b0a8', '#6b5a48', '#9a9490', '#907a65']
      const colors = rockColor === 'natural' ? naturalPalette
        : rockColor === 'mixed' ? mixedPalette
        : grayPalette
      const sizeConfig = rockSize === 'small'
        ? { base: 0.03, variance: 0.04, density: 100 }
        : rockSize === 'large'
        ? { base: 0.1, variance: 0.12, density: 30 }
        : { base: 0.05, variance: 0.07, density: 55 }
      const rockCount = Math.min(Math.floor(area * sizeConfig.density), 500)
      for (let i = 0; i < rockCount; i++) {
        const px = (rand(i, 0) - 0.5) * (width * 0.95)
        const pz = (rand(i, 1) - 0.5) * (depth * 0.95)
        const sz = sizeConfig.base + rand(i, 3) * sizeConfig.variance
        const layer = Math.floor(rand(i, 9) * 4)
        const py = height * 0.5 + layer * sz * 0.35 + rand(i, 2) * height * 0.06
        const sx = sz * (0.7 + rand(i, 4) * 0.6)
        const sy = sz * (0.3 + rand(i, 5) * 0.3)
        const sz2 = sz * (0.7 + rand(i, 6) * 0.6)
        const rotY = rand(i, 7) * Math.PI * 2
        const rotX = (rand(i, 10) - 0.5) * 0.4
        items.push({
          pos: [px, py, pz],
          scale: [sx, sy, sz2],
          rot: [rotX, rotY, 0],
          color: colors[Math.floor(rand(i, 8) * colors.length)],
        })
      }
    }
    return items
  }, [fillType, width, depth, height, rockSize, rockColor])

  if (fillType === 'soil') {
    return (
      <mesh position={[0, height * 0.35, 0]}>
        <boxGeometry args={[width, height * 0.7, depth]} />
        <meshStandardMaterial color="#3d2b1f" roughness={1} />
      </mesh>
    )
  }

  const baseColor = fillType === 'mulch' ? '#2a1a0a' : '#3d2b1f'

  return (
    <>
      <mesh position={[0, height * 0.3, 0]}>
        <boxGeometry args={[width, height * 0.6, depth]} />
        <meshStandardMaterial color={baseColor} roughness={1} />
      </mesh>
      {pieces?.map((p, i) =>
        fillType === 'river_rock' ? (
          <mesh key={i} position={p.pos} rotation={p.rot} scale={p.scale} castShadow>
            <sphereGeometry args={[1, 7, 5]} />
            <meshStandardMaterial color={p.color} roughness={0.4} metalness={0.05} />
          </mesh>
        ) : (
          <mesh key={i} position={p.pos} rotation={p.rot} castShadow>
            <boxGeometry args={[p.scale[0], p.scale[1], p.scale[2]]} />
            <meshStandardMaterial color={p.color} roughness={0.95} />
          </mesh>
        )
      )}
    </>
  )
}
