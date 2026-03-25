import { useMemo } from 'react'
import * as THREE from 'three'
import { Tree } from '@dgreenheck/ez-tree'
import type { PlacedObject3D } from '@/types/design'
import { PlanterFill } from './helpers'

// Map our species to ez-tree presets and leaf tint overrides
export const SPECIES_TO_PRESET: Record<string, { preset: string; leafTint?: number; barkTint?: number }> = {
  generic:         { preset: 'Oak Medium' },
  oak:             { preset: 'Oak Medium' },
  birch:           { preset: 'Aspen Medium', barkTint: 0xd4cfc4 },
  red_maple:       { preset: 'Oak Medium', leafTint: 0xb22222 },
  dwarf_red_maple: { preset: 'Oak Small', leafTint: 0x8b1a1a },
  japanese_maple:  { preset: 'Oak Small', leafTint: 0x9b1b30 },
  crepe_myrtle:    { preset: 'Aspen Small', leafTint: 0xc75080 },
  holly:           { preset: 'Pine Small', leafTint: 0x1a4d1a },
  magnolia:        { preset: 'Oak Medium', leafTint: 0x2e6b2e },
  dogwood:         { preset: 'Aspen Small', leafTint: 0xe8a0b8 },
  weeping_willow:  { preset: 'Ash Large', leafTint: 0x6b8a3a },
  palm:            { preset: 'Ash Small', leafTint: 0x2d5a27 },
}

export function EzTreeMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, heightFt } = obj.size
  const species = (obj.customProps?.species as string) ?? 'generic'
  const treeSize = (obj.customProps?.treeSize as string) ?? 'small'
  const foliageHex = obj.customProps?.color as string | undefined
  const seed = obj.id.charCodeAt(0) + obj.id.charCodeAt(1) * 256

  const treeObj = useMemo(() => {
    const mapping = SPECIES_TO_PRESET[species] ?? SPECIES_TO_PRESET.generic

    // Adjust preset size based on treeSize prop
    let preset = mapping.preset
    if (treeSize === 'medium') {
      preset = preset.replace(/Small|Large/, 'Medium')
    } else if (treeSize === 'large') {
      preset = preset.replace(/Small|Medium/, 'Large')
    } else {
      preset = preset.replace(/Medium|Large/, 'Small')
    }

    const t = new Tree()
    t.loadPreset(preset)
    t.options.seed = seed

    // Apply foliage color override
    if (foliageHex) {
      t.options.leaves.tint = parseInt(foliageHex.replace('#', ''), 16)
    } else if (mapping.leafTint !== undefined) {
      t.options.leaves.tint = mapping.leafTint
    }

    if (mapping.barkTint !== undefined) {
      t.options.bark.tint = mapping.barkTint
    }

    t.generate()

    // Scale to fit our bounding box
    const box = new THREE.Box3().setFromObject(t)
    const naturalH = box.max.y - box.min.y
    const naturalW = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
    const scaleH = heightFt / (naturalH || 1)
    const scaleW = widthFt / (naturalW || 1)
    const s = Math.min(scaleH, scaleW)
    t.scale.set(s, s, s)

    return t
  }, [species, treeSize, foliageHex, seed, widthFt, heightFt])

  const cx = obj.position[0] + obj.size.widthFt / 2
  const cz = obj.position[2] + obj.size.depthFt / 2

  return (
    <primitive
      object={treeObj}
      position={[cx, 0, cz]}
      rotation={[0, obj.rotation[1], 0]}
    />
  )
}

export function PlanterLMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt } = obj.size
  const planterHIn = (obj.customProps?.planterHeight as number) ?? 24
  const heightFt = planterHIn / 12
  const legW = (obj.customProps?.legWidth as number) ?? 2
  const boxColor = (obj.customProps?.color as string) ?? '#6b4226'
  const t = ((obj.customProps?.wallThickness as number) ?? 4) / 12
  const capstone = (obj.customProps?.capstone as boolean) ?? true
  const capColor = (obj.customProps?.capColor as string) ?? '#a0a0a0'
  const fillType = (obj.customProps?.fillType as string) ?? 'soil'
  const rockSz = (obj.customProps?.rockSize as string) ?? 'medium'
  const rockClr = (obj.customProps?.rockColor as string) ?? 'gray'
  const capH = 0.12
  const bodyH = capstone ? heightFt - capH : heightFt
  const cap = 0.06 // capstone overhang

  // L-shape: horizontal arm along X (full width × legW depth)
  //          vertical arm along Z (legW width × full depth)
  // Origin at corner where the two arms meet (bottom-left of the L)

  return (
    <group
      position={[obj.position[0], 0, obj.position[2]]}
      rotation={[0, obj.rotation[1], 0]}
    >
      {/* === Horizontal arm walls (along X, depth = legW) === */}
      {/* Front wall (z=0) */}
      <mesh position={[widthFt / 2, bodyH / 2, t / 2]} castShadow>
        <boxGeometry args={[widthFt, bodyH, t]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      {/* Back wall (z=legW) — only the portion beyond the vertical arm */}
      <mesh position={[(legW + widthFt) / 2, bodyH / 2, legW - t / 2]} castShadow>
        <boxGeometry args={[widthFt - legW, bodyH, t]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      {/* Right wall of horizontal arm */}
      <mesh position={[widthFt - t / 2, bodyH / 2, legW / 2]} castShadow>
        <boxGeometry args={[t, bodyH, legW - t * 2]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>

      {/* === Vertical arm walls (along Z, width = legW) === */}
      {/* Left wall (x=0) */}
      <mesh position={[t / 2, bodyH / 2, depthFt / 2]} castShadow>
        <boxGeometry args={[t, bodyH, depthFt]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      {/* Right wall of vertical arm (x=legW) — only the portion beyond the horizontal arm */}
      <mesh position={[legW - t / 2, bodyH / 2, (legW + depthFt) / 2]} castShadow>
        <boxGeometry args={[t, bodyH, depthFt - legW]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      {/* Bottom wall of vertical arm (z=depthFt) */}
      <mesh position={[legW / 2, bodyH / 2, depthFt - t / 2]} castShadow>
        <boxGeometry args={[legW - t * 2, bodyH, t]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>

      {/* === Capstone === */}
      {capstone && (
        <>
          {/* Horizontal arm capstone — front */}
          <mesh position={[widthFt / 2, bodyH + capH / 2, t / 2]} castShadow>
            <boxGeometry args={[widthFt + cap, capH, t + cap]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
          {/* Horizontal arm capstone — back (beyond vertical arm) */}
          <mesh position={[(legW + widthFt) / 2, bodyH + capH / 2, legW - t / 2]} castShadow>
            <boxGeometry args={[widthFt - legW + cap, capH, t + cap]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
          {/* Horizontal arm capstone — right */}
          <mesh position={[widthFt - t / 2, bodyH + capH / 2, legW / 2]} castShadow>
            <boxGeometry args={[t + cap, capH, legW - t * 2 + cap]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
          {/* Vertical arm capstone — left */}
          <mesh position={[t / 2, bodyH + capH / 2, depthFt / 2]} castShadow>
            <boxGeometry args={[t + cap, capH, depthFt + cap]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
          {/* Vertical arm capstone — right (beyond horizontal arm) */}
          <mesh position={[legW - t / 2, bodyH + capH / 2, (legW + depthFt) / 2]} castShadow>
            <boxGeometry args={[t + cap, capH, depthFt - legW + cap]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
          {/* Vertical arm capstone — bottom */}
          <mesh position={[legW / 2, bodyH + capH / 2, depthFt - t / 2]} castShadow>
            <boxGeometry args={[legW - t * 2 + cap, capH, t + cap]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
        </>
      )}

      {/* === Fill — two arms of the L === */}
      {/* Horizontal arm fill */}
      <group position={[widthFt / 2, 0, legW / 2]}>
        <PlanterFill fillType={fillType} width={widthFt - t * 2} depth={legW - t * 2} height={bodyH} rockSize={rockSz} rockColor={rockClr} />
      </group>
      {/* Vertical arm fill (below the horizontal arm) */}
      <group position={[legW / 2, 0, (legW + depthFt) / 2]}>
        <PlanterFill fillType={fillType} width={legW - t * 2} depth={depthFt - legW} height={bodyH} rockSize={rockSz} rockColor={rockClr} />
      </group>
    </group>
  )
}

export function PlanterBoxMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const boxColor = (obj.customProps?.color as string) ?? '#6b4226'
  const sides = (obj.customProps?.sides as string) ?? '4'
  const t = ((obj.customProps?.wallThickness as number) ?? 4) / 12
  const capstone = (obj.customProps?.capstone as boolean) ?? true
  const capColor = (obj.customProps?.capColor as string) ?? '#a0a0a0'
  const fillType = (obj.customProps?.fillType as string) ?? 'soil'
  const rockSz = (obj.customProps?.rockSize as string) ?? 'medium'
  const rockClr = (obj.customProps?.rockColor as string) ?? 'gray'
  const capH = 0.12
  const hw = widthFt / 2
  const hd = depthFt / 2
  const bodyH = capstone ? heightFt - capH : heightFt

  return (
    <group
      position={[obj.position[0] + hw, 0, obj.position[2] + hd]}
      rotation={[0, obj.rotation[1], 0]}
    >
      {/* Front wall */}
      <mesh position={[0, bodyH / 2, -hd + t / 2]} castShadow>
        <boxGeometry args={[widthFt, bodyH, t]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      {/* Back wall (only if 4 sides) */}
      {sides === '4' && (
        <mesh position={[0, bodyH / 2, hd - t / 2]} castShadow>
          <boxGeometry args={[widthFt, bodyH, t]} />
          <meshStandardMaterial color={boxColor} />
        </mesh>
      )}
      {/* Left wall */}
      <mesh position={[-hw + t / 2, bodyH / 2, 0]} castShadow>
        <boxGeometry args={[t, bodyH, depthFt - t * 2]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      {/* Right wall */}
      <mesh position={[hw - t / 2, bodyH / 2, 0]} castShadow>
        <boxGeometry args={[t, bodyH, depthFt - t * 2]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      {/* Capstone */}
      {capstone && (
        <>
          <mesh position={[0, bodyH + capH / 2, -hd + t / 2]} castShadow>
            <boxGeometry args={[widthFt + 0.06, capH, t + 0.06]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
          {sides === '4' && (
            <mesh position={[0, bodyH + capH / 2, hd - t / 2]} castShadow>
              <boxGeometry args={[widthFt + 0.06, capH, t + 0.06]} />
              <meshStandardMaterial color={capColor} />
            </mesh>
          )}
          <mesh position={[-hw + t / 2, bodyH + capH / 2, 0]} castShadow>
            <boxGeometry args={[t + 0.06, capH, depthFt - t * 2 + 0.06]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
          <mesh position={[hw - t / 2, bodyH + capH / 2, 0]} castShadow>
            <boxGeometry args={[t + 0.06, capH, depthFt - t * 2 + 0.06]} />
            <meshStandardMaterial color={capColor} />
          </mesh>
        </>
      )}
      {/* Fill */}
      <PlanterFill
        fillType={fillType}
        width={widthFt - t * 2}
        depth={depthFt - t * 2}
        height={bodyH}
        rockSize={rockSz}
        rockColor={rockClr}
      />
    </group>
  )
}

export function RockBedMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const rockColor = (obj.customProps?.color as string) ?? '#8a8178'
  const bordered = (obj.customProps?.bordered as boolean) ?? false
  const borderColor = (obj.customProps?.borderColor as string) ?? '#5a5a5a'
  const borderH = heightFt + 0.05
  const borderT = 0.08

  return (
    <group
      position={[obj.position[0] + widthFt / 2, 0, obj.position[2] + depthFt / 2]}
      rotation={[0, obj.rotation[1], 0]}
    >
      {/* Rock bed surface */}
      <mesh position={[0, heightFt / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[widthFt, heightFt, depthFt]} />
        <meshStandardMaterial color={rockColor} roughness={0.9} />
      </mesh>
      {/* Subtle edge lip — always visible so the bed has a defined boundary */}
      {!bordered && (
        <>
          <mesh position={[0, heightFt + 0.01, -depthFt / 2 + 0.02]} castShadow>
            <boxGeometry args={[widthFt, 0.02, 0.04]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh position={[0, heightFt + 0.01, depthFt / 2 - 0.02]} castShadow>
            <boxGeometry args={[widthFt, 0.02, 0.04]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh position={[-widthFt / 2 + 0.02, heightFt + 0.01, 0]} castShadow>
            <boxGeometry args={[0.04, 0.02, depthFt - 0.04]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh position={[widthFt / 2 - 0.02, heightFt + 0.01, 0]} castShadow>
            <boxGeometry args={[0.04, 0.02, depthFt - 0.04]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </>
      )}
      {/* Border edges */}
      {bordered && (
        <>
          <mesh position={[0, borderH / 2, -depthFt / 2 + borderT / 2]} castShadow>
            <boxGeometry args={[widthFt + borderT * 2, borderH, borderT]} />
            <meshStandardMaterial color={borderColor} />
          </mesh>
          <mesh position={[0, borderH / 2, depthFt / 2 - borderT / 2]} castShadow>
            <boxGeometry args={[widthFt + borderT * 2, borderH, borderT]} />
            <meshStandardMaterial color={borderColor} />
          </mesh>
          <mesh position={[-widthFt / 2 + borderT / 2, borderH / 2, 0]} castShadow>
            <boxGeometry args={[borderT, borderH, depthFt - borderT * 2]} />
            <meshStandardMaterial color={borderColor} />
          </mesh>
          <mesh position={[widthFt / 2 - borderT / 2, borderH / 2, 0]} castShadow>
            <boxGeometry args={[borderT, borderH, depthFt - borderT * 2]} />
            <meshStandardMaterial color={borderColor} />
          </mesh>
        </>
      )}
    </group>
  )
}

export function TurfMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt } = obj.size
  const turfType = (obj.customProps?.turfType as string) ?? 'natural'
  const grassHeightIn = (obj.customProps?.grassHeight as number) ?? 2
  const grassHeight = grassHeightIn / 12 // convert to feet
  const cx = obj.position[0] + widthFt / 2
  const cz = obj.position[2] + depthFt / 2

  // Grass blade rows for texture effect
  const bladeData = useMemo(() => {
    const blades: { x: number; z: number; h: number; shade: number }[] = []
    const spacing = turfType === 'putting_green' ? 0.4 : 0.25
    const seed = (obj.id.charCodeAt(0) * 137 + obj.id.charCodeAt(1) * 73) | 0
    let s = seed
    const rng = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }

    for (let x = spacing / 2; x < widthFt; x += spacing) {
      for (let z = spacing / 2; z < depthFt; z += spacing) {
        const jx = (rng() - 0.5) * spacing * 0.6
        const jz = (rng() - 0.5) * spacing * 0.6
        const hVar = turfType === 'putting_green' ? 0.05 : 0.3
        blades.push({
          x: -widthFt / 2 + x + jx,
          z: -depthFt / 2 + z + jz,
          h: grassHeight * (0.7 + rng() * hVar),
          shade: 0.85 + rng() * 0.3,
        })
      }
    }
    return blades
  }, [obj.id, widthFt, depthFt, grassHeight, turfType])

  // Colors by type
  const baseColor = color.clone()
  if (turfType === 'artificial') {
    baseColor.multiplyScalar(1.15) // slightly brighter, more uniform
  } else if (turfType === 'putting_green') {
    baseColor.set('#2d7a1a') // darker, tighter
  }

  return (
    <group rotation={[0, obj.rotation[1], 0]} position={[cx, 0, cz]}>
      {/* Base soil/ground layer */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <boxGeometry args={[widthFt, 0.01, depthFt]} />
        <meshStandardMaterial color={baseColor} roughness={0.95} />
      </mesh>

      {/* Grass blades as thin boxes */}
      {bladeData.map((b, i) => {
        const bladeColor = baseColor.clone().multiplyScalar(b.shade)
        return (
          <mesh key={i} position={[b.x, b.h / 2 + 0.01, b.z]}>
            <boxGeometry args={[0.06, b.h, 0.02]} />
            <meshStandardMaterial color={bladeColor} roughness={0.9} />
          </mesh>
        )
      })}

      {turfType === 'artificial' && (
        // Subtle sheen layer on top for artificial look
        <mesh position={[0, grassHeight + 0.01, 0]} receiveShadow>
          <boxGeometry args={[widthFt, 0.005, depthFt]} />
          <meshStandardMaterial color={baseColor} roughness={0.4} metalness={0.05} />
        </mesh>
      )}
    </group>
  )
}
