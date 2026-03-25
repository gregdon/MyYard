import * as THREE from 'three'
import type { PlacedObject3D } from '@/types/design'
import { EggStandExtension } from './helpers'

export function KitchenMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const baseHex = (obj.customProps?.color as string) ?? '#6b6b6b'
  const topHex = (obj.customProps?.countertopColor as string) ?? '#404040'
  const hasEggStand = (obj.customProps?.hasEggStand as boolean) ?? false
  const eggSide = (obj.customProps?.eggStandSide as string) ?? 'right'
  const eggStandW = ((obj.customProps?.eggStandWidth as number) ?? 30) / 12
  const eggStandH = ((obj.customProps?.eggStandHeight as number) ?? 12) / 12
  const eggMounting = (obj.customProps?.eggMounting as string) ?? 'inset'

  return (
    <group
      position={[obj.position[0] + widthFt / 2, 0, obj.position[2] + depthFt / 2]}
      rotation={[0, obj.rotation[1], 0]}
    >
      {/* Base cabinet */}
      <mesh position={[0, (heightFt - 0.15) / 2, 0]} castShadow>
        <boxGeometry args={[widthFt - 0.02, heightFt - 0.15, depthFt - 0.02]} />
        <meshStandardMaterial color={baseHex} />
      </mesh>
      {/* Countertop */}
      <mesh position={[0, heightFt - 0.075, 0]} castShadow>
        <boxGeometry args={[widthFt + 0.08, 0.15, depthFt + 0.04]} />
        <meshStandardMaterial color={topHex} />
      </mesh>
      {/* Egg stand extension */}
      {hasEggStand && (
        <EggStandExtension
          standW={eggStandW}
          standDepth={depthFt}
          standH={eggStandH}
          topColor={new THREE.Color(topHex)}
          baseColor={new THREE.Color(baseHex)}
          side={eggSide}
          kitchenW={widthFt}
          mounting={eggMounting}
        />
      )}
    </group>
  )
}

export function BarMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const baseHex = (obj.customProps?.color as string) ?? '#6b6b6b'
  const topHex = (obj.customProps?.countertopColor as string) ?? '#404040'
  const wallThickIn = (obj.customProps?.wallThickness as number) ?? 12
  const overhangIn = (obj.customProps?.countertopOverhang as number) ?? 8
  const topThickIn = (obj.customProps?.countertopThickness as number) ?? 2
  const wallThickFt = wallThickIn / 12
  const overhangFt = overhangIn / 12
  const topThickFt = topThickIn / 12
  const counterDepthFt = wallThickFt + overhangFt

  // Wall is centered within the total bounding box depth,
  // shifted back so the countertop overhang extends toward the front (guest side)
  const wallOffsetZ = overhangFt / 2

  return (
    <group
      position={[obj.position[0] + widthFt / 2, 0, obj.position[2] + depthFt / 2]}
      rotation={[0, obj.rotation[1], 0]}
    >
      {/* Knee wall */}
      <mesh position={[0, (heightFt - topThickFt) / 2, wallOffsetZ]} castShadow>
        <boxGeometry args={[widthFt, heightFt - topThickFt, wallThickFt]} />
        <meshStandardMaterial color={baseHex} />
      </mesh>
      {/* Countertop — overhangs toward front (negative Z) */}
      <mesh position={[0, heightFt - topThickFt / 2, 0]} castShadow>
        <boxGeometry args={[widthFt + 0.08, topThickFt, counterDepthFt]} />
        <meshStandardMaterial color={topHex} />
      </mesh>
    </group>
  )
}

export function LKitchenMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const legW = (obj.customProps?.legWidth as number) ?? 3
  const topHex = (obj.customProps?.countertopColor as string) ?? '#404040'
  const baseHex = (obj.customProps?.color as string) ?? '#6b6b6b'
  const hasEggStand = (obj.customProps?.hasEggStand as boolean) ?? false
  const eggSide = (obj.customProps?.eggStandSide as string) ?? 'right'
  const eggStandW = ((obj.customProps?.eggStandWidth as number) ?? 30) / 12
  const eggStandH = ((obj.customProps?.eggStandHeight as number) ?? 12) / 12
  const eggMounting = (obj.customProps?.eggMounting as string) ?? 'inset'

  // L-shape: arm along X (full width, legW deep) + arm along Z (legW wide, depth minus legW to avoid overlap)
  const zArmLen = depthFt - legW // shortened to avoid corner overlap
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  return (
    <group
      position={[cx, 0, cz]}
      rotation={[0, obj.rotation[1], 0]}
    >
      <group position={[-widthFt / 2, 0, -depthFt / 2]}>
        {/* Arm along X (top of L) — full width, legW deep */}
        <mesh position={[widthFt / 2, (heightFt - 0.15) / 2, legW / 2]} castShadow>
          <boxGeometry args={[widthFt - 0.02, heightFt - 0.15, legW - 0.02]} />
          <meshStandardMaterial color={baseHex} />
        </mesh>
        <mesh position={[widthFt / 2, heightFt - 0.075, legW / 2]} castShadow>
          <boxGeometry args={[widthFt + 0.08, 0.15, legW + 0.04]} />
          <meshStandardMaterial color={topHex} />
        </mesh>

        {/* Arm along Z (left side of L) — legW wide, starts below X-arm */}
        <mesh position={[legW / 2, (heightFt - 0.15) / 2, legW + zArmLen / 2]} castShadow>
          <boxGeometry args={[legW - 0.02, heightFt - 0.15, zArmLen - 0.02]} />
          <meshStandardMaterial color={baseHex} />
        </mesh>
        <mesh position={[legW / 2, heightFt - 0.075, legW + zArmLen / 2]} castShadow>
          <boxGeometry args={[legW + 0.04, 0.15, zArmLen + 0.04]} />
          <meshStandardMaterial color={topHex} />
        </mesh>

        {/* Egg stand extension — horizontal arm or vertical arm */}
        {hasEggStand && eggSide === 'horizontal' && (
          <group position={[widthFt / 2, 0, legW / 2]}>
            <EggStandExtension
              standW={eggStandW}
              standDepth={legW}
              standH={eggStandH}
              topColor={new THREE.Color(topHex)}
              baseColor={new THREE.Color(baseHex)}
              side="right"
              kitchenW={widthFt}
              mounting={eggMounting}
            />
          </group>
        )}
        {hasEggStand && eggSide === 'vertical' && (
          <group position={[legW / 2, 0, legW + zArmLen]} rotation={[0, -Math.PI / 2, 0]}>
            <EggStandExtension
              standW={eggStandW}
              standDepth={legW}
              standH={eggStandH}
              topColor={new THREE.Color(topHex)}
              baseColor={new THREE.Color(baseHex)}
              side="right"
              kitchenW={0}
              mounting={eggMounting}
            />
          </group>
        )}
      </group>
    </group>
  )
}

export function GrillMesh({ obj }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const cabinetH = heightFt * 0.75
  const grillH = heightFt - cabinetH
  // Inset base slightly to avoid z-fighting with adjacent objects
  const inset = 0.03

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Base cabinet (stainless) */}
      <mesh position={[0, cabinetH / 2, 0]} castShadow>
        <boxGeometry args={[widthFt - inset * 2, cabinetH, depthFt - inset * 2]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.15} roughness={0.5} />
      </mesh>
      {/* Countertop / surround */}
      <mesh position={[0, cabinetH + 0.05, 0]} castShadow>
        <boxGeometry args={[widthFt + 0.1, 0.1, depthFt + 0.05]} />
        <meshStandardMaterial color="#bbb" metalness={0.15} roughness={0.4} />
      </mesh>
      {/* Grill box */}
      <mesh position={[0, cabinetH + grillH / 2 + 0.1, 0]} castShadow>
        <boxGeometry args={[widthFt * 0.85, grillH, depthFt * 0.8]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.2} roughness={0.35} />
      </mesh>
      {/* Lid (domed — half cylinder rotated to lie flat) */}
      <mesh position={[0, cabinetH + grillH + 0.1, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[depthFt * 0.35, depthFt * 0.35, widthFt * 0.85, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#ccc" metalness={0.15} roughness={0.4} />
      </mesh>
      {/* Grill grate lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const grateZ = -depthFt * 0.3 + (depthFt * 0.6) * (i / 4)
        return (
          <mesh key={i} position={[0, cabinetH + grillH + 0.08, grateZ]}>
            <boxGeometry args={[widthFt * 0.8, 0.02, 0.03]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        )
      })}
      {/* Handle (front) */}
      <mesh position={[0, cabinetH + grillH * 0.5 + 0.1, depthFt * 0.42]} castShadow>
        <boxGeometry args={[widthFt * 0.3, 0.06, 0.06]} />
        <meshStandardMaterial color="#eee" metalness={0.2} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function GrillStandaloneMesh({ obj, color, lidOpen }: { obj: PlacedObject3D; color: THREE.Color; lidOpen: boolean }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  const legH = heightFt * 0.45
  const fireboxH = heightFt * 0.3
  const fireboxY = legH + fireboxH / 2
  const lidH = heightFt * 0.2
  const wheelR = 0.15
  const lidColor = color.clone().multiplyScalar(0.75)

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* 4 legs */}
      {[
        [-widthFt * 0.35, -depthFt * 0.3],
        [-widthFt * 0.35, depthFt * 0.3],
        [widthFt * 0.35, -depthFt * 0.3],
        [widthFt * 0.35, depthFt * 0.3],
      ].map(([lx, lz], i) => (
        <mesh key={`leg-${i}`} position={[lx, legH / 2, lz]} castShadow>
          <boxGeometry args={[0.1, legH, 0.1]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}
      {/* Front 2 wheels */}
      {[-depthFt * 0.3, depthFt * 0.3].map((lz, i) => (
        <mesh key={`wheel-${i}`} position={[widthFt * 0.35, wheelR, lz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[wheelR, wheelR, 0.06, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      {/* Main firebox */}
      <mesh position={[0, fireboxY, 0]} castShadow>
        <boxGeometry args={[widthFt * 0.75, fireboxH, depthFt * 0.8]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} />
      </mesh>
      {/* Lid */}
      {lidOpen ? (
        // Lid angled open behind the firebox
        <mesh
          position={[0, fireboxY + fireboxH / 2 + lidH * 0.3, -depthFt * 0.35]}
          rotation={[-Math.PI * 0.35, 0, 0]}
          castShadow
        >
          <boxGeometry args={[widthFt * 0.75, 0.08, depthFt * 0.6]} />
          <meshStandardMaterial color={lidColor} metalness={0.1} roughness={0.5} />
        </mesh>
      ) : (
        // Lid closed — curved top (half cylinder)
        <mesh
          position={[0, fireboxY + fireboxH / 2 + lidH / 2, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[depthFt * 0.35, depthFt * 0.35, widthFt * 0.75, 16, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={lidColor} metalness={0.1} roughness={0.5} />
        </mesh>
      )}
      {/* Side shelf */}
      <mesh position={[-widthFt * 0.5, fireboxY, 0]} castShadow>
        <boxGeometry args={[widthFt * 0.2, 0.06, depthFt * 0.6]} />
        <meshStandardMaterial color="#888" metalness={0.15} roughness={0.4} />
      </mesh>
      {/* Shelf support */}
      <mesh position={[-widthFt * 0.55, fireboxY - fireboxH * 0.25, 0]} castShadow>
        <boxGeometry args={[0.06, fireboxH * 0.5, 0.06]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  )
}

export function SmokerMesh({ obj, color, style }: { obj: PlacedObject3D; color: THREE.Color; style: string }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2
  const radius = Math.min(widthFt, depthFt) / 2

  if (style === 'barrel') {
    const legH = heightFt * 0.4
    const barrelR = radius * 0.8
    const barrelLen = widthFt * 0.9
    return (
      <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
        {[[-barrelLen / 3, -depthFt / 4], [-barrelLen / 3, depthFt / 4],
          [barrelLen / 3, -depthFt / 4], [barrelLen / 3, depthFt / 4]].map(([lx, lz], i) => (
          <mesh key={`leg-${i}`} position={[lx, legH / 2, lz]} castShadow>
            <boxGeometry args={[0.15, legH, 0.15]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
        <mesh position={[0, legH + barrelR, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[barrelR, barrelR, barrelLen, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    )
  }

  // Kamado / egg style
  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.6, radius * 0.7, 0.6, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, heightFt * 0.45, 0]} castShadow>
        <sphereGeometry args={[radius, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, heightFt * 0.45, 0]} castShadow>
        <sphereGeometry args={[radius * 0.95, 16, 16, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4]} />
        <meshStandardMaterial color={color} metalness={0.2} />
      </mesh>
      <mesh position={[0, heightFt * 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.3, 8]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  )
}

export function SinkMesh({ obj, color, cabinetColor }: { obj: PlacedObject3D; color: THREE.Color; cabinetColor: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  const cabinetH = heightFt * 0.85
  const counterH = 0.12
  const counterY = cabinetH + counterH / 2
  const basinDepth = 0.35
  const basinW = widthFt * 0.55
  const basinD = depthFt * 0.5
  const basinColor = new THREE.Color('#2a2a2a')

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Cabinet base */}
      <mesh position={[0, cabinetH / 2, 0]} castShadow>
        <boxGeometry args={[widthFt * 0.95, cabinetH, depthFt * 0.95]} />
        <meshStandardMaterial color={cabinetColor} roughness={0.7} />
      </mesh>
      {/* Countertop slab — slightly wider than cabinet */}
      <mesh position={[0, counterY, 0]} castShadow>
        <boxGeometry args={[widthFt + 0.08, counterH, depthFt + 0.08]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.4} />
      </mesh>
      {/* Basin cutout (recessed dark box) */}
      <mesh position={[0, counterY + counterH / 2 - basinDepth / 2, depthFt * 0.05]}>
        <boxGeometry args={[basinW, basinDepth, basinD]} />
        <meshStandardMaterial color={basinColor} />
      </mesh>
      {/* Faucet base */}
      <mesh position={[0, counterY + counterH / 2 + 0.25, -depthFt * 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.2} />
      </mesh>
      {/* Faucet spout — horizontal */}
      <mesh position={[0, counterY + counterH / 2 + 0.5, -depthFt * 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        <meshStandardMaterial color="#d0d0d0" metalness={0.4} roughness={0.2} />
      </mesh>
    </group>
  )
}

export function FridgeMesh({ obj, color, doorStyle }: { obj: PlacedObject3D; color: THREE.Color; doorStyle: string }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  const inset = 0.05
  const bodyW = widthFt - inset * 2
  const bodyD = depthFt - inset * 2
  const bodyH = heightFt - inset
  const handleR = 0.025
  const handleH = heightFt * 0.3
  const doorGap = 0.02
  const isDouble = doorStyle === 'double_door'

  return (
    <group position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
      {/* Main body */}
      <mesh position={[0, bodyH / 2, 0]} castShadow>
        <boxGeometry args={[bodyW, bodyH, bodyD]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
      </mesh>

      {isDouble ? (
        <>
          {/* Gap line between doors */}
          <mesh position={[0, bodyH / 2, bodyD / 2 + 0.001]}>
            <boxGeometry args={[doorGap, bodyH * 0.9, 0.005]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          {/* Left door handle */}
          <mesh position={[-bodyW * 0.08, bodyH / 2, bodyD / 2 + 0.04]} castShadow>
            <cylinderGeometry args={[handleR, handleR, handleH, 8]} />
            <meshStandardMaterial color="#e0e0e0" metalness={0.4} roughness={0.2} />
          </mesh>
          {/* Right door handle */}
          <mesh position={[bodyW * 0.08, bodyH / 2, bodyD / 2 + 0.04]} castShadow>
            <cylinderGeometry args={[handleR, handleR, handleH, 8]} />
            <meshStandardMaterial color="#e0e0e0" metalness={0.4} roughness={0.2} />
          </mesh>
        </>
      ) : (
        <>
          {/* Single door handle */}
          <mesh position={[bodyW * 0.35, bodyH / 2, bodyD / 2 + 0.04]} castShadow>
            <cylinderGeometry args={[handleR, handleR, handleH, 8]} />
            <meshStandardMaterial color="#e0e0e0" metalness={0.4} roughness={0.2} />
          </mesh>
        </>
      )}
    </group>
  )
}
