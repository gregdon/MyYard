import type React from 'react'
import * as THREE from 'three'
import type { PlacedObject3D } from '@/types/design'
import { WallSegment, TVMount, getWallFeatures } from './helpers'

export function PergolaMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const postDiameterIn = (obj.customProps?.postDiameter as number) ?? 4
  const postSize = postDiameterIn / 12 // convert inches to feet
  const postShape = (obj.customProps?.postShape as string) ?? 'square'
  const postCountPerSide = Math.max(2, (obj.customProps?.postCount as number) ?? 2)
  const pergolaColor = obj.customProps?.color
    ? new THREE.Color(obj.customProps.color as string)
    : color
  const beamHeight = 0.25
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  // Generate post positions: postCountPerSide posts along each of the two depth edges
  // Posts are evenly spaced along the width, with one at each corner
  const postPositions: [number, number][] = []
  for (let i = 0; i < postCountPerSide; i++) {
    const x = postCountPerSide === 1
      ? widthFt / 2
      : postSize / 2 + (widthFt - postSize) * (i / (postCountPerSide - 1))
    postPositions.push([x, postSize / 2])             // front edge
    postPositions.push([x, depthFt - postSize / 2])   // back edge
  }

  // Beam Z positions along the depth edges (where the rows of posts are)
  const beamZPositions = [postSize / 2, depthFt - postSize / 2]

  return (
    <group rotation={[0, obj.rotation[1], 0]} position={[cx, 0, cz]}>
      <group position={[-widthFt / 2, 0, -depthFt / 2]}>
        {/* Posts */}
        {postPositions.map(([px, pz], i) => (
          <mesh key={`post-${i}`} position={[px, heightFt / 2, pz]} castShadow>
            {postShape === 'round' ? (
              <cylinderGeometry args={[postSize / 2, postSize / 2, heightFt, 12]} />
            ) : (
              <boxGeometry args={[postSize, heightFt, postSize]} />
            )}
            <meshStandardMaterial color={pergolaColor} />
          </mesh>
        ))}

        {/* Top beams (along width, one per depth edge) */}
        {beamZPositions.map((z, i) => (
          <mesh key={`beam-w-${i}`} position={[widthFt / 2, heightFt - beamHeight / 2, z]} castShadow>
            <boxGeometry args={[widthFt, beamHeight, postSize]} />
            <meshStandardMaterial color={pergolaColor} />
          </mesh>
        ))}

        {/* Cross beams (along depth) */}
        {Array.from({ length: Math.max(2, Math.floor(widthFt / 2)) }, (_, i) => {
          const x = (widthFt / (Math.max(2, Math.floor(widthFt / 2)) - 1)) * i
          return (
            <mesh key={`beam-d-${i}`} position={[x, heightFt + beamHeight / 2, depthFt / 2]} castShadow>
              <boxGeometry args={[postSize * 0.5, beamHeight, depthFt + 1]} />
              <meshStandardMaterial color={pergolaColor} />
            </mesh>
          )
        })}
      </group>
    </group>
  )
}

export function PatioCoverMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const roofStyle = (obj.customProps?.roofStyle as string) ?? 'flat'
  const roofPitchPerFt = (obj.customProps?.roofPitch as number) ?? 1 // inches of drop per foot of run
  const roofPitch = (roofPitchPerFt / 12) * depthFt // total drop in feet
  const postDiameterIn = (obj.customProps?.postDiameter as number) ?? 4
  const postSize = postDiameterIn / 12
  const postShape = (obj.customProps?.postShape as string) ?? 'square'
  const postCountPerSide = Math.max(2, (obj.customProps?.postCount as number) ?? 2)
  const coverColor = obj.customProps?.color
    ? new THREE.Color(obj.customProps.color as string)
    : color
  const overhangIn = (obj.customProps?.overhang as number) ?? 6
  const overhang = overhangIn / 12
  const roofColor = obj.customProps?.roofColor
    ? new THREE.Color(obj.customProps.roofColor as string)
    : new THREE.Color('#8b7d6b')
  const ceiling = (obj.customProps?.ceiling as string) ?? 'open'
  const ceilingColor = (obj.customProps?.ceilingColor as string) ?? '#c4a882'
  const fanCount = parseInt((obj.customProps?.fans as string) ?? '0', 10)
  const fanDiameterIn = parseInt((obj.customProps?.fanDiameter as string) ?? '48', 10)
  const fanRadius = fanDiameterIn / 12 / 2 // convert to feet radius
  const lightCount = parseInt((obj.customProps?.lights as string) ?? '0', 10)
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  // Post positions along front and back edges
  const postXPositions: number[] = []
  for (let i = 0; i < postCountPerSide; i++) {
    postXPositions.push(
      postCountPerSide === 1
        ? widthFt / 2
        : postSize / 2 + (widthFt - postSize) * (i / (postCountPerSide - 1))
    )
  }

  const beamW = postSize * 1.5 // beams slightly wider than posts
  const beamH = postSize * 1.2
  const rafterW = postSize * 0.75
  const rafterH = postSize * 1.5
  const roofThickness = 0.3

  // Rafter spacing: ~2ft apart
  const rafterCount = Math.max(2, Math.round(widthFt / 2) + 1)
  const rafterXPositions: number[] = []
  for (let i = 0; i < rafterCount; i++) {
    rafterXPositions.push(rafterCount === 1 ? widthFt / 2 : (widthFt * i) / (rafterCount - 1))
  }

  // For tilt: front beam is at full height, back beam drops by roofPitch
  const frontBeamY = heightFt - beamH / 2
  const backBeamY = roofStyle === 'tilt' ? heightFt - roofPitch - beamH / 2 : heightFt - beamH / 2

  return (
    <group rotation={[0, obj.rotation[1], 0]} position={[cx, 0, cz]}>
      <group position={[-widthFt / 2, 0, -depthFt / 2]}>
        {/* Posts */}
        {postXPositions.map((px, i) => [
          <mesh key={`pf-${i}`} position={[px, (frontBeamY - beamH / 2) / 2, postSize / 2]} castShadow>
            {postShape === 'round' ? (
              <cylinderGeometry args={[postSize / 2, postSize / 2, frontBeamY - beamH / 2, 12]} />
            ) : (
              <boxGeometry args={[postSize, frontBeamY - beamH / 2, postSize]} />
            )}
            <meshStandardMaterial color={coverColor} />
          </mesh>,
          <mesh key={`pb-${i}`} position={[px, (backBeamY - beamH / 2) / 2, depthFt - postSize / 2]} castShadow>
            {postShape === 'round' ? (
              <cylinderGeometry args={[postSize / 2, postSize / 2, backBeamY - beamH / 2, 12]} />
            ) : (
              <boxGeometry args={[postSize, backBeamY - beamH / 2, postSize]} />
            )}
            <meshStandardMaterial color={coverColor} />
          </mesh>,
        ])}

        {/* Header beams along width (front and back) */}
        <mesh position={[widthFt / 2, frontBeamY, postSize / 2]} castShadow>
          <boxGeometry args={[widthFt, beamH, beamW]} />
          <meshStandardMaterial color={coverColor} />
        </mesh>
        <mesh position={[widthFt / 2, backBeamY, depthFt - postSize / 2]} castShadow>
          <boxGeometry args={[widthFt, beamH, beamW]} />
          <meshStandardMaterial color={coverColor} />
        </mesh>

        {/* Side beams connecting front to back posts (one on each end) */}
        {(() => {
          const sideMidY = (frontBeamY + backBeamY) / 2
          const sideRise = frontBeamY - backBeamY
          const sideAngle = Math.atan2(sideRise, depthFt - postSize)
          const sideLen = Math.sqrt((depthFt - postSize) ** 2 + sideRise ** 2)
          return [
            <mesh key="side-l" position={[postSize / 2, sideMidY, depthFt / 2]} rotation={[sideAngle, 0, 0]} castShadow>
              <boxGeometry args={[beamW, beamH, sideLen]} />
              <meshStandardMaterial color={coverColor} />
            </mesh>,
            <mesh key="side-r" position={[widthFt - postSize / 2, sideMidY, depthFt / 2]} rotation={[sideAngle, 0, 0]} castShadow>
              <boxGeometry args={[beamW, beamH, sideLen]} />
              <meshStandardMaterial color={coverColor} />
            </mesh>,
          ]
        })()}

        {/* Rafters running front-to-back (depth direction), sitting on top of beams */}
        {rafterXPositions.map((rx, i) => {
          if (roofStyle === 'tilt') {
            const rafterTopY = frontBeamY + beamH / 2 + rafterH / 2
            const rafterBackY = backBeamY + beamH / 2 + rafterH / 2
            const midY = (rafterTopY + rafterBackY) / 2
            const angle = Math.atan2(rafterTopY - rafterBackY, depthFt)
            const len = Math.sqrt(depthFt * depthFt + (rafterTopY - rafterBackY) ** 2)
            return (
              <mesh key={`raft-${i}`} position={[rx, midY, depthFt / 2]} rotation={[angle, 0, 0]} castShadow>
                <boxGeometry args={[rafterW, rafterH, len]} />
                <meshStandardMaterial color={coverColor} />
              </mesh>
            )
          }
          const rafterY = frontBeamY + beamH / 2 + rafterH / 2
          return (
            <mesh key={`raft-${i}`} position={[rx, rafterY, depthFt / 2]} castShadow>
              <boxGeometry args={[rafterW, rafterH, depthFt]} />
              <meshStandardMaterial color={coverColor} />
            </mesh>
          )
        })}

        {/* Roof panel on top of rafters */}
        {/* Roof panel on top of rafters */}
        {(() => {
          const rafterTopY = frontBeamY + beamH / 2 + rafterH
          const oh = overhang // overhang in feet
          if (roofStyle === 'flat') {
            return (
              <mesh position={[widthFt / 2, rafterTopY + roofThickness / 2, depthFt / 2]} castShadow receiveShadow>
                <boxGeometry args={[widthFt + oh * 2, roofThickness, depthFt + oh * 2]} />
                <meshStandardMaterial color={roofColor} />
              </mesh>
            )
          }
          if (roofStyle === 'tilt') {
            const rafterBackTopY = backBeamY + beamH / 2 + rafterH
            const midY = (rafterTopY + rafterBackTopY) / 2 + roofThickness / 2
            const rise = rafterTopY - rafterBackTopY
            const angle = Math.atan2(rise, depthFt)
            const slopeLen = Math.sqrt(depthFt * depthFt + rise * rise)
            return (
              <mesh position={[widthFt / 2, midY, depthFt / 2]} rotation={[angle, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[widthFt + oh * 2, roofThickness, slopeLen + oh * 2]} />
                <meshStandardMaterial color={roofColor} />
              </mesh>
            )
          }
          if (roofStyle === 'gabled') {
            const angle = Math.atan2(roofPitch, depthFt / 2)
            const slopeLen = Math.sqrt((depthFt / 2) ** 2 + roofPitch ** 2)
            return (
              <>
                <mesh position={[widthFt / 2, rafterTopY + roofPitch / 2, depthFt / 4]} rotation={[-angle, 0, 0]} castShadow receiveShadow>
                  <boxGeometry args={[widthFt + oh * 2, roofThickness, slopeLen + oh]} />
                  <meshStandardMaterial color={roofColor} />
                </mesh>
                <mesh position={[widthFt / 2, rafterTopY + roofPitch / 2, depthFt * 3 / 4]} rotation={[angle, 0, 0]} castShadow receiveShadow>
                  <boxGeometry args={[widthFt + oh * 2, roofThickness, slopeLen + oh]} />
                  <meshStandardMaterial color={roofColor} />
                </mesh>
                {/* Ridge beam */}
                <mesh position={[widthFt / 2, rafterTopY + roofPitch, depthFt / 2]} castShadow>
                  <boxGeometry args={[widthFt + oh * 2, beamH, beamW]} />
                  <meshStandardMaterial color={roofColor} />
                </mesh>
              </>
            )
          }
          return null
        })()}

        {/* Fascia boards along all edges */}
        {(() => {
          const frontTop = frontBeamY + beamH / 2 + rafterH
          const backTop = roofStyle === 'tilt'
            ? backBeamY + beamH / 2 + rafterH
            : frontTop
          const fasciaH = rafterH + roofThickness
          const fasciaThick = 0.1
          const oh = overhang
          const els: React.JSX.Element[] = []

          // Front fascia (at front rafter height)
          els.push(
            <mesh key="fascia-f" position={[widthFt / 2, frontTop - fasciaH / 2 + roofThickness, -oh]} castShadow>
              <boxGeometry args={[widthFt + oh * 2, fasciaH, fasciaThick]} />
              <meshStandardMaterial color={roofColor} />
            </mesh>
          )
          // Back fascia (at back rafter height — lower for tilt)
          els.push(
            <mesh key="fascia-b" position={[widthFt / 2, backTop - fasciaH / 2 + roofThickness, depthFt + oh]} castShadow>
              <boxGeometry args={[widthFt + oh * 2, fasciaH, fasciaThick]} />
              <meshStandardMaterial color={roofColor} />
            </mesh>
          )
          // Side fascia — tilted to follow the roof slope
          const sideMidY = (frontTop + backTop) / 2 - fasciaH / 2 + roofThickness
          const sideAngle = Math.atan2(frontTop - backTop, depthFt)
          const sideLen = Math.sqrt(depthFt * depthFt + (frontTop - backTop) ** 2) + oh * 2
          els.push(
            <mesh key="fascia-l" position={[-oh, sideMidY, depthFt / 2]} rotation={[sideAngle, 0, 0]} castShadow>
              <boxGeometry args={[fasciaThick, fasciaH, sideLen]} />
              <meshStandardMaterial color={roofColor} />
            </mesh>
          )
          els.push(
            <mesh key="fascia-r" position={[widthFt + oh, sideMidY, depthFt / 2]} rotation={[sideAngle, 0, 0]} castShadow>
              <boxGeometry args={[fasciaThick, fasciaH, sideLen]} />
              <meshStandardMaterial color={roofColor} />
            </mesh>
          )
          return els
        })()}

        {/* Tongue & groove ceiling — planks under the rafters, extending to overhang */}
        {ceiling === 'tongue_groove' && (() => {
          const oh = overhang
          // Ceiling sits below the rafters; plank bottom aligns with beam top
          const ceilingY = frontBeamY + beamH / 2 + 0.04
          const backCeilingY = roofStyle === 'tilt'
            ? backBeamY + beamH / 2 + 0.04
            : ceilingY
          const plankW = 0.5 // 6-inch planks
          const plankH = 0.04
          // Extend planks to cover overhang on both sides (width)
          const totalCeilingW = widthFt + oh * 2
          const plankCount = Math.ceil(totalCeilingW / plankW)
          // Extend planks to cover overhang on front and back (depth)
          const totalCeilingD = depthFt + oh * 2
          const planks: React.JSX.Element[] = []
          for (let i = 0; i < plankCount; i++) {
            const px = -oh + plankW / 2 + i * plankW
            if (px - plankW / 2 > widthFt + oh) break
            const pw = Math.min(plankW - 0.01, (widthFt + oh) - (px - plankW / 2))
            const rise = ceilingY - backCeilingY
            // For tilt: extrapolate ceiling Y at overhang edges
            const frontOhY = ceilingY + (rise / depthFt) * oh
            const backOhY = backCeilingY - (rise / depthFt) * oh
            const midY = (frontOhY + backOhY) / 2 - plankH / 2
            const totalRise = frontOhY - backOhY
            const angle = Math.atan2(totalRise, totalCeilingD)
            const slopeLen = Math.sqrt(totalCeilingD * totalCeilingD + totalRise * totalRise)
            // Alternate slightly darker/lighter for plank definition
            const shade = i % 2 === 0 ? ceilingColor : new THREE.Color(ceilingColor).multiplyScalar(0.9).getStyle()
            planks.push(
              <mesh key={`plank-${i}`} position={[px, midY, depthFt / 2]} rotation={[angle, 0, 0]}>
                <boxGeometry args={[pw, plankH, slopeLen]} />
                <meshStandardMaterial color={shade} roughness={0.85} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
              </mesh>
            )
          }
          return planks
        })()}

        {/* Ceiling fans */}
        {fanCount > 0 && (() => {
          const fanOffset = ceiling === 'tongue_groove' ? 0.15 : 0.1
          const fanY = frontBeamY + beamH / 2 - fanOffset
          // Fan positions from sliders (percentage of width), with even-spacing defaults
          const fanPosKeys = ['fan1Pos', 'fan2Pos', 'fan3Pos'] as const
          const defaultPositions = (count: number) => {
            const result: number[] = []
            for (let i = 0; i < count; i++) {
              result.push(count === 1 ? 50 : Math.round(((i + 1) / (count + 1)) * 100))
            }
            return result
          }
          const defaults = defaultPositions(fanCount)
          const fans: React.JSX.Element[] = []
          for (let i = 0; i < fanCount; i++) {
            const pct = (obj.customProps?.[fanPosKeys[i]] as number) ?? defaults[i]
            const fx = (pct / 100) * widthFt
            const fz = depthFt / 2
            // Interpolate Y for tilted roofs
            const t = fz / depthFt
            const fy = fanY * (1 - t) + (roofStyle === 'tilt' ? backBeamY + beamH / 2 - fanOffset : fanY) * t
            fans.push(
              <group key={`fan-${i}`} position={[fx, fy - 0.5, fz]}>
                {/* Downrod */}
                <mesh position={[0, 0.35, 0]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
                  <meshStandardMaterial color="#888" metalness={0.6} roughness={0.3} />
                </mesh>
                {/* Motor housing */}
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.2, 0.15, 0.2, 10]} />
                  <meshStandardMaterial color="#666" metalness={0.5} roughness={0.3} />
                </mesh>
                {/* Blades — 5 blades, sized by fan diameter */}
                {[0, 1, 2, 3, 4].map((b) => {
                  const angle = (b / 5) * Math.PI * 2
                  const bladeLen = fanRadius - 0.1
                  return (
                    <mesh
                      key={`blade-${b}`}
                      position={[Math.cos(angle) * (bladeLen / 2 + 0.15), -0.05, Math.sin(angle) * (bladeLen / 2 + 0.15)]}
                      rotation={[0, -angle, 0]}
                    >
                      <boxGeometry args={[bladeLen, 0.02, 0.2]} />
                      <meshStandardMaterial color="#8b7355" roughness={0.8} />
                    </mesh>
                  )
                })}
                {/* Light kit */}
                <mesh position={[0, -0.15, 0]}>
                  <sphereGeometry args={[0.15, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshStandardMaterial color="#f5f0e0" emissive="#f5e8c0" emissiveIntensity={0.3} transparent opacity={0.85} />
                </mesh>
              </group>
            )
          }
          return fans
        })()}

        {/* Recessed lights — spread evenly along front and back edges like posts */}
        {lightCount > 0 && (() => {
          // Position lights below the ceiling (or rafter bottom if open)
          const ceilOffset = ceiling === 'tongue_groove' ? 0.12 : 0.02
          const lightY = frontBeamY + beamH / 2 - ceilOffset
          const backLightY = roofStyle === 'tilt' ? backBeamY + beamH / 2 - ceilOffset : lightY
          const lights: React.JSX.Element[] = []
          // Split lights between front and back rows
          const perSide = Math.ceil(lightCount / 2)
          const frontCount = perSide
          const backCount = lightCount - frontCount
          const inset = depthFt * 0.25 // lights inset 25% from edges
          // Front row — inset 2ft from each end so lights clear the beams
          const xInset = 2
          for (let i = 0; i < frontCount; i++) {
            const lx = frontCount === 1 ? widthFt / 2 : xInset + (widthFt - xInset * 2) * (i / (frontCount - 1))
            const lz = inset
            const t = lz / depthFt
            const ly = lightY * (1 - t) + backLightY * t
            lights.push(
              <group key={`light-f-${i}`} position={[lx, ly - 0.02, lz]}>
                <mesh>
                  <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
                  <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.3} />
                </mesh>
                <mesh position={[0, -0.03, 0]}>
                  <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
                  <meshStandardMaterial color="#fffbe6" emissive="#fff5cc" emissiveIntensity={0.5} />
                </mesh>
              </group>
            )
          }
          // Back row
          for (let i = 0; i < backCount; i++) {
            const lx = backCount === 1 ? widthFt / 2 : xInset + (widthFt - xInset * 2) * (i / (backCount - 1))
            const lz = depthFt - inset
            const t = lz / depthFt
            const ly = lightY * (1 - t) + backLightY * t
            lights.push(
              <group key={`light-b-${i}`} position={[lx, ly - 0.02, lz]}>
                <mesh>
                  <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
                  <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.3} />
                </mesh>
                <mesh position={[0, -0.03, 0]}>
                  <cylinderGeometry args={[0.12, 0.12, 0.02, 12]} />
                  <meshStandardMaterial color="#fffbe6" emissive="#fff5cc" emissiveIntensity={0.5} />
                </mesh>
              </group>
            )
          }
          return lights
        })()}
      </group>
    </group>
  )
}

export function WallMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const f = getWallFeatures(obj)
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      <WallSegment
        wallW={widthFt} wallH={heightFt} wallD={depthFt}
        color={color} windowCount={f.windowCount} windowLayout={f.windowLayout}
        doorType={f.hasDoor ? f.doorType : undefined}
        doorPosition={f.hasDoor ? f.doorPosition : undefined}
        keyPrefix="w"
      />
      {f.hasTV && (
        <TVMount sizeIn={f.tvSize} wallH={heightFt} wallD={depthFt} keyPrefix="w" />
      )}
    </group>
  )
}

export function WallLMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const t = (obj.customProps?.thickness as number) ?? 1
  const side = (obj.customProps?.lSide as string) ?? 'left'
  const f = getWallFeatures(obj)
  const win1 = (obj.customProps?.windowWall1 as boolean) ?? true
  const win2 = (obj.customProps?.windowWall2 as boolean) ?? false

  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const legX = side === 'left' ? t / 2 : widthFt - t / 2
  const legLen = depthFt - t

  const doorOnWall1 = f.hasDoor && f.doorWall === '1'
  const doorOnWall2 = f.hasDoor && f.doorWall === '2'

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      <group position={[-widthFt / 2, 0, -depthFt / 2]}>
        {/* Wall 1 (top): along X, full width */}
        <group position={[widthFt / 2, 0, t / 2]}>
          <WallSegment
            wallW={widthFt} wallH={heightFt} wallD={t}
            color={color} windowCount={win1 ? f.windowCount : 0} windowLayout={f.windowLayout}
            doorType={doorOnWall1 ? f.doorType : undefined}
            doorPosition={doorOnWall1 ? f.doorPosition : undefined}
            keyPrefix="l1"
          />
          {f.hasTV && f.doorWall !== '2' && (
            <TVMount sizeIn={f.tvSize} wallH={heightFt} wallD={t} keyPrefix="l1" />
          )}
        </group>
        {/* Wall 2 (side leg): along Z, rotated 90° */}
        <group position={[legX, 0, t + legLen / 2]} rotation={[0, Math.PI / 2, 0]}>
          <WallSegment
            wallW={legLen} wallH={heightFt} wallD={t}
            color={color} windowCount={win2 ? f.windowCount : 0} windowLayout={f.windowLayout}
            doorType={doorOnWall2 ? f.doorType : undefined}
            doorPosition={doorOnWall2 ? f.doorPosition : undefined}
            keyPrefix="l2"
          />
          {f.hasTV && f.doorWall === '2' && (
            <TVMount sizeIn={f.tvSize} wallH={heightFt} wallD={t} keyPrefix="l2" />
          )}
        </group>
      </group>
    </group>
  )
}

export function WallUMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const t = (obj.customProps?.thickness as number) ?? 1
  const f = getWallFeatures(obj)
  const win1 = (obj.customProps?.windowWall1 as boolean) ?? true  // left
  const win2 = (obj.customProps?.windowWall2 as boolean) ?? false // back
  const win3 = (obj.customProps?.windowWall3 as boolean) ?? false // right

  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const backW = widthFt - t * 2

  const doorOnWall = (n: string) => f.hasDoor && f.doorWall === n

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      <group position={[-widthFt / 2, 0, -depthFt / 2]}>
        {/* Left wall: along Z (full depth), rotated 90° */}
        <group position={[t / 2, 0, depthFt / 2]} rotation={[0, Math.PI / 2, 0]}>
          <WallSegment
            wallW={depthFt} wallH={heightFt} wallD={t}
            color={color} windowCount={win1 ? f.windowCount : 0} windowLayout={f.windowLayout}
            doorType={doorOnWall('1') ? f.doorType : undefined}
            doorPosition={doorOnWall('1') ? f.doorPosition : undefined}
            keyPrefix="u1"
          />
          {f.hasTV && f.doorWall === '1' && (
            <TVMount sizeIn={f.tvSize} wallH={heightFt} wallD={t} keyPrefix="u1" />
          )}
        </group>
        {/* Back wall: along X (minus thickness on each side) */}
        <group position={[widthFt / 2, 0, depthFt - t / 2]}>
          <WallSegment
            wallW={backW} wallH={heightFt} wallD={t}
            color={color} windowCount={win2 ? f.windowCount : 0} windowLayout={f.windowLayout}
            doorType={doorOnWall('2') ? f.doorType : undefined}
            doorPosition={doorOnWall('2') ? f.doorPosition : undefined}
            keyPrefix="u2"
          />
          {f.hasTV && (f.doorWall === '2' || !f.hasDoor) && (
            <TVMount sizeIn={f.tvSize} wallH={heightFt} wallD={t} keyPrefix="u2" />
          )}
        </group>
        {/* Right wall: along Z (full depth), rotated 90° */}
        <group position={[widthFt - t / 2, 0, depthFt / 2]} rotation={[0, Math.PI / 2, 0]}>
          <WallSegment
            wallW={depthFt} wallH={heightFt} wallD={t}
            color={color} windowCount={win3 ? f.windowCount : 0} windowLayout={f.windowLayout}
            doorType={doorOnWall('3') ? f.doorType : undefined}
            doorPosition={doorOnWall('3') ? f.doorPosition : undefined}
            keyPrefix="u3"
          />
          {f.hasTV && f.doorWall === '3' && (
            <TVMount sizeIn={f.tvSize} wallH={heightFt} wallD={t} keyPrefix="u3" />
          )}
        </group>
      </group>
    </group>
  )
}

/** Standalone fireplace widget */
export function FireplaceMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const openingWidthIn = Number(obj.customProps?.openingWidth ?? 48)
  const openingHeightIn = (obj.customProps?.openingHeight as number) ?? 12
  const openingW = openingWidthIn / 12
  const openingH = openingHeightIn / 12
  const hasHearth = (obj.customProps?.hasHearth as boolean) ?? true
  const hearthHeightIn = (obj.customProps?.hearthHeight as number) ?? 0
  const hearthH = hearthHeightIn / 12
  const position = (obj.customProps?.openingPosition as string) ?? 'center'
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  // Horizontal offset for the opening
  const margin = openingW / 2 + 0.3
  let openingX = 0
  if (position === 'left') openingX = -widthFt / 2 + margin
  else if (position === 'right') openingX = widthFt / 2 - margin

  // Mantel sits just above the opening
  const mantelY = hearthH + openingH + 0.1

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Main surround body */}
      <mesh position={[0, heightFt / 2, 0]} castShadow>
        <boxGeometry args={[widthFt, heightFt, depthFt]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Dark opening */}
      <mesh position={[openingX, hearthH + openingH / 2, depthFt / 2 - 0.05]}>
        <boxGeometry args={[openingW, openingH, 0.5]} />
        <meshStandardMaterial color={new THREE.Color('#1a1a1a')} />
      </mesh>
      {/* Mantel shelf */}
      <mesh position={[0, mantelY, 0]} castShadow>
        <boxGeometry args={[widthFt + 0.3, 0.2, depthFt + 0.3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Hearth (raised slab in front) */}
      {hasHearth && (
        <mesh position={[0, hearthH / 2 + 0.05, depthFt / 2 + 0.4]} castShadow>
          <boxGeometry args={[widthFt + 0.5, Math.max(0.1, hearthH), 0.8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
    </group>
  )
}

export function RoofMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const style = (obj.customProps?.style as string) ?? 'flat'
  const pitchPerFt = (obj.customProps?.pitch as number) ?? 4  // inches rise per foot run
  const overhangIn = (obj.customProps?.overhang as number) ?? 12
  const thicknessIn = (obj.customProps?.thickness as number) ?? 6
  const overhang = overhangIn / 12
  const thickness = thicknessIn / 12
  const totalW = widthFt + overhang * 2
  const totalD = depthFt + overhang * 2
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  // Rise calculation: pitch is in/ft, run is half the depth (for gabled/hip) or full depth (shed)
  const shedRise = (pitchPerFt / 12) * depthFt
  const gabledRise = (pitchPerFt / 12) * (totalD / 2)

  if (style === 'flat') {
    return (
      <mesh
        position={[cx, heightFt, cz]}
        rotation={[0, obj.rotation[1], 0]}
        castShadow
      >
        <boxGeometry args={[totalW, thickness, totalD]} />
        <meshStandardMaterial color={color} />
      </mesh>
    )
  }

  if (style === 'shed') {
    // Single slope: higher on back (negative Z in local), lower on front
    const geo = new THREE.BufferGeometry()
    const hw = totalW / 2
    const hd = totalD / 2
    const lo = heightFt - thickness / 2
    const hi = heightFt - thickness / 2 + shedRise
    // 8 vertices: bottom face and top face of the sloped slab
    const verts = new Float32Array([
      // top face (sloped)
      -hw, lo, hd,        hw, lo, hd,        hw, hi, -hd,       -hw, hi, -hd,
      // bottom face (parallel, offset down by thickness)
      -hw, lo - thickness, hd,  hw, lo - thickness, hd,  hw, hi - thickness, -hd,  -hw, hi - thickness, -hd,
    ])
    const indices = [
      0,1,2, 0,2,3,   // top
      4,6,5, 4,7,6,   // bottom
      0,4,5, 0,5,1,   // front
      2,6,7, 2,7,3,   // back
      0,3,7, 0,7,4,   // left
      1,5,6, 1,6,2,   // right
    ]
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return (
      <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
        <mesh geometry={geo} castShadow>
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  if (style === 'gabled') {
    // A-frame: ridge along X axis (width), slopes down on both Z sides
    const geo = new THREE.BufferGeometry()
    const hw = totalW / 2
    const hd = totalD / 2
    const baseY = heightFt - thickness / 2
    const ridgeY = baseY + gabledRise
    // 6 vertices for outer shell (prism shape)
    const verts = new Float32Array([
      // Front bottom-left, bottom-right
      -hw, baseY, hd,           hw, baseY, hd,
      // Back bottom-left, bottom-right
      -hw, baseY, -hd,          hw, baseY, -hd,
      // Ridge left, right
      -hw, ridgeY, 0,           hw, ridgeY, 0,
      // Inner shell (offset down by thickness)
      -hw, baseY - thickness, hd,    hw, baseY - thickness, hd,
      -hw, baseY - thickness, -hd,   hw, baseY - thickness, -hd,
      -hw, ridgeY - thickness, 0,    hw, ridgeY - thickness, 0,
    ])
    const indices = [
      // Front slope (0,1,5,4)
      0,1,5, 0,5,4,
      // Back slope (2,4,5,3) — note winding
      3,5,4, 3,4,2,
      // Left gable triangle (0,4,2)
      0,4,2,
      // Right gable triangle (1,3,5)
      1,3,5,
      // Bottom face (outer eaves)
      0,7,1, 0,6,7,  // front bottom
      2,3,9, 2,9,8,  // back bottom
      // Inner slopes
      6,10,11, 6,11,7,   // inner front
      9,11,10, 9,10,8,   // inner back
      // Inner gable triangles
      6,8,10,
      7,11,9,
      // Eave edges (front)
      0,1,7, 0,7,6,
      // Eave edges (back)
      2,8,9, 2,9,3,
    ]
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()

    return (
      <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
        <mesh geometry={geo} castShadow>
          <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
    )
  }

  // Hip roof: slopes from all four sides to a ridge
  const geo = new THREE.BufferGeometry()
  const hw = totalW / 2
  const hd = totalD / 2
  const baseY = heightFt - thickness / 2
  const hipRise = gabledRise
  // Ridge runs along X, inset from the ends by hd (so ridge length = totalW - totalD)
  const ridgeHalfLen = Math.max(0, (totalW - totalD) / 2)
  const verts = new Float32Array([
    // Base corners: FL(0), FR(1), BR(2), BL(3)
    -hw, baseY, hd,       hw, baseY, hd,
    hw, baseY, -hd,       -hw, baseY, -hd,
    // Ridge ends: left(4), right(5)
    -ridgeHalfLen, baseY + hipRise, 0,
    ridgeHalfLen, baseY + hipRise, 0,
  ])
  const indices = [
    // Front slope
    0, 1, 5, 0, 5, 4,
    // Back slope
    2, 3, 4, 2, 4, 5,
    // Left hip triangle
    3, 0, 4,
    // Right hip triangle
    1, 2, 5,
  ]
  geo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  // Flat underside slab
  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Flat ceiling/soffit underneath */}
      <mesh position={[0, baseY - thickness / 2, 0]} castShadow>
        <boxGeometry args={[totalW, thickness, totalD]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

export function FenceMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const fenceColor = (obj.customProps?.color as string) ?? '#c8a882'
  const fenceType = (obj.customProps?.fenceType as string) ?? 'board_on_board'
  const hw = widthFt / 2
  const postW = 0.3
  const postCount = Math.max(2, Math.round(widthFt / 6) + 1)
  const railH = 0.08
  const railD = 0.15

  // Rod iron: vertical bars between posts with top/bottom rails
  if (fenceType === 'rod_iron') {
    const barSpacing = 0.35
    const barCount = Math.max(1, Math.floor(widthFt / barSpacing) - 1)
    const bottomRailY = 0.15 // bottom rail center
    const topRailY = heightFt - railH / 2
    const barBottom = bottomRailY + railH / 2
    const barTop = topRailY - railH / 2
    const barLen = barTop - barBottom
    const barMidY = (barTop + barBottom) / 2
    return (
      <group
        position={[obj.position[0] + hw, 0, obj.position[2] + depthFt / 2]}
        rotation={[0, obj.rotation[1], 0]}
      >
        {/* Posts */}
        {Array.from({ length: postCount }).map((_, i) => {
          const x = -hw + (i * widthFt) / (postCount - 1)
          return (
            <mesh key={`p${i}`} position={[x, heightFt / 2, 0]} castShadow>
              <boxGeometry args={[postW * 0.7, heightFt, postW * 0.7]} />
              <meshStandardMaterial color={fenceColor} metalness={0.4} roughness={0.4} />
            </mesh>
          )
        })}
        {/* Top rail */}
        <mesh position={[0, topRailY, 0]} castShadow>
          <boxGeometry args={[widthFt, railH, railD * 0.5]} />
          <meshStandardMaterial color={fenceColor} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Bottom rail */}
        <mesh position={[0, bottomRailY, 0]} castShadow>
          <boxGeometry args={[widthFt, railH, railD * 0.5]} />
          <meshStandardMaterial color={fenceColor} metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Vertical bars — span from bottom rail to top rail */}
        {Array.from({ length: barCount }).map((_, i) => {
          const x = -hw + postW + ((widthFt - postW * 2) * (i + 1)) / (barCount + 1)
          return (
            <mesh key={`b${i}`} position={[x, barMidY, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, barLen, 6]} />
              <meshStandardMaterial color={fenceColor} metalness={0.4} roughness={0.4} />
            </mesh>
          )
        })}
        {/* Finials on top of bars */}
        {Array.from({ length: barCount }).map((_, i) => {
          const x = -hw + postW + ((widthFt - postW * 2) * (i + 1)) / (barCount + 1)
          return (
            <mesh key={`f${i}`} position={[x, heightFt + 0.04, 0]} castShadow>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={fenceColor} metalness={0.4} roughness={0.4} />
            </mesh>
          )
        })}
      </group>
    )
  }

  // Chain link: posts + translucent panel
  if (fenceType === 'chain_link') {
    return (
      <group
        position={[obj.position[0] + hw, 0, obj.position[2] + depthFt / 2]}
        rotation={[0, obj.rotation[1], 0]}
      >
        {Array.from({ length: postCount }).map((_, i) => {
          const x = -hw + (i * widthFt) / (postCount - 1)
          return (
            <mesh key={`p${i}`} position={[x, heightFt / 2, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, heightFt, 8]} />
              <meshStandardMaterial color="#999" metalness={0.3} />
            </mesh>
          )
        })}
        {/* Top rail */}
        <mesh position={[0, heightFt, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, widthFt, 8]} />
          <meshStandardMaterial color="#999" metalness={0.3} />
        </mesh>
        {/* Chain link mesh — translucent panel */}
        <mesh position={[0, heightFt / 2, 0]}>
          <boxGeometry args={[widthFt, heightFt, 0.02]} />
          <meshStandardMaterial color="#c0c0c0" transparent opacity={0.25} metalness={0.3} side={2} />
        </mesh>
      </group>
    )
  }

  // Board-on-board, privacy, picket: solid/semi-solid wood panels
  const isPicket = fenceType === 'picket'
  const boardW = isPicket ? 0.3 : 0.5
  const boardGap = isPicket ? 0.15 : 0
  const boardH = isPicket ? heightFt - 0.5 : heightFt
  const boardCount = Math.max(1, Math.floor(widthFt / (boardW + boardGap)))

  return (
    <group
      position={[obj.position[0] + hw, 0, obj.position[2] + depthFt / 2]}
      rotation={[0, obj.rotation[1], 0]}
    >
      {/* Posts */}
      {Array.from({ length: postCount }).map((_, i) => {
        const x = -hw + (i * widthFt) / (postCount - 1)
        return (
          <mesh key={`p${i}`} position={[x, heightFt / 2, 0]} castShadow>
            <boxGeometry args={[postW, heightFt, postW]} />
            <meshStandardMaterial color={fenceColor} />
          </mesh>
        )
      })}
      {/* Rails */}
      <mesh position={[0, heightFt * 0.2, 0]} castShadow>
        <boxGeometry args={[widthFt, railH, railD]} />
        <meshStandardMaterial color={fenceColor} />
      </mesh>
      <mesh position={[0, heightFt * 0.8, 0]} castShadow>
        <boxGeometry args={[widthFt, railH, railD]} />
        <meshStandardMaterial color={fenceColor} />
      </mesh>
      {/* Boards */}
      {isPicket ? (
        // Individual pickets with gaps and pointed tops
        Array.from({ length: boardCount }).map((_, i) => {
          const x = -hw + postW + i * (boardW + boardGap) + boardW / 2
          if (x > hw - postW) return null
          return (
            <mesh key={`b${i}`} position={[x, boardH / 2, 0]} castShadow>
              <boxGeometry args={[boardW, boardH, 0.08]} />
              <meshStandardMaterial color={fenceColor} />
            </mesh>
          )
        })
      ) : (
        // Solid panel (board on board / privacy)
        <mesh position={[0, heightFt / 2, 0]} castShadow>
          <boxGeometry args={[widthFt - postW, heightFt - 0.1, 0.08]} />
          <meshStandardMaterial color={fenceColor} />
        </mesh>
      )}
    </group>
  )
}
