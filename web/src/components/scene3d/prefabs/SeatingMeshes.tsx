import type React from 'react'
import * as THREE from 'three'
import type { PlacedObject3D } from '@/types/design'

export function DiningTableMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const shape = (obj.customProps?.shape as string) ?? 'rectangle'
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const topH = 0.2
  const legH = heightFt - topH
  const legSize = 0.25

  // Leg positions based on shape
  const legs: [number, number][] = shape === 'round'
    ? [[-widthFt * 0.3, -depthFt * 0.3], [-widthFt * 0.3, depthFt * 0.3],
       [widthFt * 0.3, -depthFt * 0.3], [widthFt * 0.3, depthFt * 0.3]]
    : [[-widthFt / 2 + legSize, -depthFt / 2 + legSize], [-widthFt / 2 + legSize, depthFt / 2 - legSize],
       [widthFt / 2 - legSize, -depthFt / 2 + legSize], [widthFt / 2 - legSize, depthFt / 2 - legSize]]

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Tabletop */}
      <mesh position={[0, heightFt - topH / 2, 0]} castShadow>
        {shape === 'round' ? (
          <cylinderGeometry args={[widthFt / 2, widthFt / 2, topH, 24]} />
        ) : (
          <boxGeometry args={[widthFt, topH, depthFt]} />
        )}
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Legs */}
      {legs.map(([lx, lz], i) => (
        <mesh key={`leg-${i}`} position={[lx, legH / 2, lz]} castShadow>
          {shape === 'round' ? (
            <cylinderGeometry args={[legSize / 2, legSize / 2, legH, 8]} />
          ) : (
            <boxGeometry args={[legSize, legH, legSize]} />
          )}
          <meshStandardMaterial color={color.clone().multiplyScalar(0.7)} />
        </mesh>
      ))}
    </group>
  )
}

export function RetainingWallMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const material = (obj.customProps?.material as string) ?? 'block'
  const capStyle = (obj.customProps?.capStyle as string) ?? 'flat'
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  // Slightly darker color for texture variation on stone/block
  const bodyColor = material === 'timber'
    ? new THREE.Color('#6b4226')
    : color
  const capColor = color.clone().multiplyScalar(1.1)

  const capH = capStyle !== 'none' ? 0.15 : 0
  const bodyH = heightFt - capH

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Main wall body */}
      <mesh position={[0, bodyH / 2, 0]} castShadow>
        <boxGeometry args={[widthFt, bodyH, depthFt]} />
        <meshStandardMaterial color={bodyColor} roughness={material === 'concrete' ? 0.6 : 0.8} />
      </mesh>
      {/* Cap stone */}
      {capStyle !== 'none' && (
        <mesh position={[0, bodyH + capH / 2, 0]} castShadow>
          <boxGeometry args={[widthFt + 0.15, capH, depthFt + 0.15]} />
          <meshStandardMaterial color={capColor} roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

export function CouchMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const baseY = obj.position[1] ?? 0
  const seatH = heightFt * 0.4
  const backH = heightFt - seatH
  const backThick = depthFt * 0.25
  const armW = 0.4
  const cushionColor = color
  const frameColor = new THREE.Color(color).multiplyScalar(0.7)

  return (
    <group position={[cx, baseY, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Seat cushion */}
      <mesh position={[0, seatH / 2, 0]} castShadow>
        <boxGeometry args={[widthFt - armW * 2, seatH, depthFt - backThick]} />
        <meshStandardMaterial color={cushionColor} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, seatH + backH / 2, -depthFt / 2 + backThick / 2]} castShadow>
        <boxGeometry args={[widthFt, backH, backThick]} />
        <meshStandardMaterial color={cushionColor} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-widthFt / 2 + armW / 2, seatH / 2 + backH / 4, 0]} castShadow>
        <boxGeometry args={[armW, seatH + backH / 2, depthFt]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      {/* Right arm */}
      <mesh position={[widthFt / 2 - armW / 2, seatH / 2 + backH / 4, 0]} castShadow>
        <boxGeometry args={[armW, seatH + backH / 2, depthFt]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>
      {/* Legs */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={`leg-${i}`} position={[sx * (widthFt / 2 - 0.15), 0.1, sz * (depthFt / 2 - 0.15)]} castShadow>
          <boxGeometry args={[0.15, 0.2, 0.15]} />
          <meshStandardMaterial color={frameColor} />
        </mesh>
      ))}
    </group>
  )
}

export function SectionalMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const side = (obj.customProps?.lSide as string) ?? 'left'
  const seatH = heightFt * 0.4
  const backH = heightFt - seatH
  const backThick = 0.8
  const armW = 0.4
  const cushionColor = color
  const frameColor = new THREE.Color(color).multiplyScalar(0.7)

  // L-shaped sectional: main sofa along width + chaise along depth on one side
  const chaiseDepth = depthFt
  const chaiseW = Math.min(depthFt * 0.5, 3.5)
  const sofaW = widthFt - chaiseW
  const sofaD = Math.min(3, depthFt * 0.4)
  const sx = side === 'left' ? -1 : 1

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Main sofa section — along width at the back */}
      <group position={[-sx * chaiseW / 2, 0, -depthFt / 2 + sofaD / 2]}>
        {/* Seat */}
        <mesh position={[0, seatH / 2, 0]} castShadow>
          <boxGeometry args={[sofaW, seatH, sofaD]} />
          <meshStandardMaterial color={cushionColor} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, seatH + backH / 2, -sofaD / 2 + backThick / 2]} castShadow>
          <boxGeometry args={[sofaW, backH, backThick]} />
          <meshStandardMaterial color={cushionColor} />
        </mesh>
        {/* Outer arm */}
        <mesh position={[-sx * (sofaW / 2 - armW / 2), seatH / 2 + backH / 4, 0]} castShadow>
          <boxGeometry args={[armW, seatH + backH / 2, sofaD]} />
          <meshStandardMaterial color={frameColor} />
        </mesh>
      </group>

      {/* Chaise section — along depth on the specified side */}
      <group position={[sx * (widthFt / 2 - chaiseW / 2), 0, 0]}>
        {/* Seat */}
        <mesh position={[0, seatH / 2, 0]} castShadow>
          <boxGeometry args={[chaiseW, seatH, chaiseDepth]} />
          <meshStandardMaterial color={cushionColor} />
        </mesh>
        {/* Backrest along the outside edge */}
        <mesh position={[sx * (chaiseW / 2 - backThick / 2), seatH + backH / 2, 0]} castShadow>
          <boxGeometry args={[backThick, backH, chaiseDepth]} />
          <meshStandardMaterial color={cushionColor} />
        </mesh>
        {/* Back wall connecting to sofa backrest */}
        <mesh position={[0, seatH + backH / 2, -chaiseDepth / 2 + backThick / 2]} castShadow>
          <boxGeometry args={[chaiseW, backH, backThick]} />
          <meshStandardMaterial color={cushionColor} />
        </mesh>
      </group>
    </group>
  )
}

export function ChairMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const style = (obj.customProps?.style as string) ?? 'standard'
  const hasArmrests = (obj.customProps?.hasArmrests as boolean) ?? false

  const legSize = 0.15
  const seatThick = 0.15
  const backThick = 0.12
  const legColor = color.clone().multiplyScalar(0.7)

  const isAdirondack = style === 'adirondack'
  const isRocking = style === 'rocking'

  // Adirondack: lower seat, more reclined back, wider slats
  const seatRatio = isAdirondack ? 0.3 : 0.45
  const backTilt = isAdirondack ? -0.45 : -0.1
  const seatTilt = isAdirondack ? -0.12 : 0

  const seatH = heightFt * seatRatio
  const legH = seatH - seatThick / 2
  const backH = heightFt - seatH - seatThick / 2

  const inset = legSize * 0.8
  const legPositions: [number, number][] = [
    [-widthFt / 2 + inset, -depthFt / 2 + inset],
    [-widthFt / 2 + inset, depthFt / 2 - inset],
    [widthFt / 2 - inset, -depthFt / 2 + inset],
    [widthFt / 2 - inset, depthFt / 2 - inset],
  ]

  // Rocking: curved rails under legs built from box segments approximating an arc
  const railThick = 0.15
  const railH = isRocking ? 0.5 : 0
  const legYOffset = isRocking ? railH * 0.7 : 0

  // Armrest dimensions
  const armW = legSize + 0.02
  const armH = 0.1
  const armLen = depthFt * 0.8
  const armY = seatH + seatThick / 2 + backH * 0.35
  const showArms = hasArmrests || isAdirondack

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Rocking rails — curved arc from box segments */}
      {isRocking && (
        <>
          {[-widthFt / 2 + inset, widthFt / 2 - inset].map((rx, ri) => {
            // Build curved rail from 8 small box segments along a circular arc
            const segments = 12
            const arcRadius = depthFt * 1.8
            const arcSpan = 0.7 // radians total
            const els: React.JSX.Element[] = []
            for (let i = 0; i < segments; i++) {
              const t = (i + 0.5) / segments
              const angle = -arcSpan / 2 + arcSpan * t
              const sz = Math.sin(angle) * arcRadius
              const sy = (1 - Math.cos(angle)) * arcRadius
              const segLen = (arcRadius * arcSpan) / segments
              els.push(
                <mesh
                  key={`rail-${ri}-${i}`}
                  position={[rx, sy + railThick / 2, sz]}
                  rotation={[angle, 0, 0]}
                  castShadow
                >
                  <boxGeometry args={[railThick, railThick, segLen + 0.02]} />
                  <meshStandardMaterial color={legColor} />
                </mesh>
              )
            }
            return <group key={`rail-g-${ri}`}>{els}</group>
          })}
        </>
      )}

      {/* 4 Legs */}
      {legPositions.map(([lx, lz], i) => (
        <mesh key={`leg-${i}`} position={[lx, legYOffset + legH / 2, lz]} castShadow>
          <boxGeometry args={[legSize, legH, legSize]} />
          <meshStandardMaterial color={legColor} />
        </mesh>
      ))}

      {/* Seat */}
      <mesh position={[0, legYOffset + seatH, 0]} rotation={[seatTilt, 0, 0]} castShadow>
        <boxGeometry args={[widthFt, seatThick, depthFt]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Backrest */}
      {isAdirondack ? (
        // Adirondack: wider back with slat appearance (3 vertical slats)
        <>
          {[-widthFt * 0.3, 0, widthFt * 0.3].map((sx, i) => {
            const slatW = widthFt * 0.28
            return (
              <mesh
                key={`slat-${i}`}
                position={[sx, legYOffset + seatH + seatThick / 2 + backH / 2, -depthFt / 2 + backThick / 2]}
                rotation={[backTilt, 0, 0]}
                castShadow
              >
                <boxGeometry args={[slatW, backH, backThick]} />
                <meshStandardMaterial color={color} />
              </mesh>
            )
          })}
          {/* Top rail connecting slats */}
          <mesh
            position={[0, legYOffset + seatH + seatThick / 2 + backH * 0.92, -depthFt / 2 + backThick / 2]}
            rotation={[backTilt, 0, 0]}
            castShadow
          >
            <boxGeometry args={[widthFt * 0.95, backH * 0.15, backThick * 0.8]} />
            <meshStandardMaterial color={legColor} />
          </mesh>
        </>
      ) : (
        <mesh
          position={[0, legYOffset + seatH + seatThick / 2 + backH / 2, -depthFt / 2 + backThick / 2]}
          rotation={[backTilt, 0, 0]}
          castShadow
        >
          <boxGeometry args={[widthFt, backH, backThick]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}

      {/* Armrests */}
      {showArms && (
        <>
          {[-widthFt / 2 + armW / 2, widthFt / 2 - armW / 2].map((ax, i) => (
            <group key={`arm-${i}`}>
              {/* Arm rest surface */}
              <mesh position={[ax, legYOffset + armY, depthFt * 0.05]} castShadow>
                <boxGeometry args={[armW, armH, armLen]} />
                <meshStandardMaterial color={color} />
              </mesh>
              {/* Front arm support post */}
              <mesh
                position={[ax, legYOffset + (seatH + armY) / 2, depthFt / 2 - inset]}
                castShadow
              >
                <boxGeometry args={[legSize, armY - seatH, legSize]} />
                <meshStandardMaterial color={legColor} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  )
}
