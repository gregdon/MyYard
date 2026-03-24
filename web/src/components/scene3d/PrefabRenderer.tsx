import type React from 'react'
import { useMemo } from 'react'
import * as THREE from 'three'
import { Tree } from '@dgreenheck/ez-tree'
import { useDesignStore } from '@/store/designStore'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import type { PlacedObject3D } from '@/types/design'

export function PrefabRenderer() {
  const placedObjects = useDesignStore((s) => s.placedObjects)
  useDesignStore((s) => s.gridVersion) // trigger re-render on changes

  // Pre-compute elevation: objects on top of slabs should be lifted
  const slabs = placedObjects.filter((o) => o.type === 'concrete_slab')

  function getBaseY(obj: PlacedObject3D): number {
    if (obj.type === 'concrete_slab') return 0 // slabs sit on ground
    const cx = obj.position[0] + obj.size.widthFt / 2
    const cz = obj.position[2] + obj.size.depthFt / 2
    let maxY = 0
    for (const slab of slabs) {
      const sl = slab.position[0]
      const sr = sl + slab.size.widthFt
      const st = slab.position[2]
      const sb = st + slab.size.depthFt
      if (cx > sl && cx < sr && cz > st && cz < sb) {
        maxY = Math.max(maxY, slab.size.heightFt)
      }
    }
    return maxY
  }

  return (
    <>
      {placedObjects.map((obj) => {
        const prefab = PREFAB_CATALOG.find((p) => p.type === obj.type)
        if (!prefab) return null

        const { widthFt, depthFt, heightFt } = obj.size
        const color = new THREE.Color(prefab.color)
        const baseY = getBaseY(obj)

        const el = renderPrefab(obj, prefab, widthFt, depthFt, heightFt, color)
        if (!el) return null

        // Lift objects that sit on top of a slab
        if (baseY > 0) {
          return <group key={`elev-${obj.id}`} position={[0, baseY, 0]}>{el}</group>
        }
        return el
      })}
    </>
  )
}

/** Dispatch object type to the appropriate mesh component */
function renderPrefab(
  obj: PlacedObject3D,
  _prefab: (typeof PREFAB_CATALOG)[number],
  widthFt: number, depthFt: number, heightFt: number,
  color: THREE.Color,
): React.JSX.Element | null {

        if (obj.type === 'pergola') {
          return <PergolaMesh key={obj.id} obj={obj} color={color} />
        }

        if (obj.type === 'patio_cover') {
          return <PatioCoverMesh key={obj.id} obj={obj} color={color} />
        }

        if (obj.type === 'fire_pit') {
          const fpColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const shape = (obj.customProps?.shape as string) ?? 'round'
          const wallThick = 0.4 // rim wall thickness in feet
          const cx = obj.position[0] + widthFt / 2
          const cz = obj.position[2] + depthFt / 2
          const innerColor = new THREE.Color('#2a2a2a') // dark interior
          return (
            <group key={obj.id} position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
              {/* Outer wall/rim above ground */}
              {shape === 'round' ? (
                <>
                  <mesh position={[0, heightFt / 2, 0]} castShadow>
                    <cylinderGeometry args={[widthFt / 2, widthFt / 2, heightFt, 24]} />
                    <meshStandardMaterial color={fpColor} />
                  </mesh>
                  {/* Inner cutout (dark) */}
                  <mesh position={[0, heightFt / 2 + 0.01, 0]}>
                    <cylinderGeometry args={[widthFt / 2 - wallThick, widthFt / 2 - wallThick, heightFt, 24]} />
                    <meshStandardMaterial color={innerColor} />
                  </mesh>
                </>
              ) : (
                <>
                  <mesh position={[0, heightFt / 2, 0]} castShadow>
                    <boxGeometry args={[widthFt, heightFt, depthFt]} />
                    <meshStandardMaterial color={fpColor} />
                  </mesh>
                  {/* Inner cutout (dark) */}
                  <mesh position={[0, heightFt / 2 + 0.01, 0]}>
                    <boxGeometry args={[widthFt - wallThick * 2, heightFt, depthFt - wallThick * 2]} />
                    <meshStandardMaterial color={innerColor} />
                  </mesh>
                </>
              )}
              {/* Cap/lip on top */}
              {shape === 'round' ? (
                <mesh position={[0, heightFt + 0.05, 0]} castShadow>
                  <torusGeometry args={[widthFt / 2 - wallThick / 2, wallThick / 2 + 0.05, 8, 24]} />
                  <meshStandardMaterial color={fpColor} />
                </mesh>
              ) : (
                <mesh position={[0, heightFt + 0.05, 0]} castShadow>
                  <boxGeometry args={[widthFt + 0.1, 0.15, depthFt + 0.1]} />
                  <meshStandardMaterial color={fpColor} />
                </mesh>
              )}
            </group>
          )
        }

        if (obj.type === 'tree_small') {
          return <EzTreeMesh key={obj.id} obj={obj} />
        }

        if (obj.type === 'shrub') {
          const shrubColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const style = (obj.customProps?.style as string) ?? 'round'
          const cx = obj.position[0] + widthFt / 2
          const cz = obj.position[2] + depthFt / 2

          if (style === 'boxwood') {
            return (
              <mesh key={obj.id} position={[cx, heightFt / 2, cz]} castShadow>
                <boxGeometry args={[widthFt, heightFt, depthFt]} />
                <meshStandardMaterial color={shrubColor} />
              </mesh>
            )
          }
          if (style === 'natural') {
            return (
              <mesh key={obj.id} position={[cx, heightFt / 2, cz]} scale={[1, 0.7, 1]} castShadow>
                <sphereGeometry args={[widthFt / 2, 10, 10]} />
                <meshStandardMaterial color={shrubColor} />
              </mesh>
            )
          }
          // round
          return (
            <mesh key={obj.id} position={[cx, heightFt / 2, cz]} castShadow>
              <sphereGeometry args={[widthFt / 2, 12, 12]} />
              <meshStandardMaterial color={shrubColor} />
            </mesh>
          )
        }

        if (obj.type === 'flower_bed') {
          const flowerColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : new THREE.Color('#d94080')
          const bedColor = obj.customProps?.bedColor
            ? new THREE.Color(obj.customProps.bedColor as string)
            : new THREE.Color('#5a3a1a')
          const style = (obj.customProps?.style as string) ?? 'mixed'
          const cx = obj.position[0] + widthFt / 2
          const cz = obj.position[2] + depthFt / 2
          const baseH = heightFt * 0.3

          // Deterministic pseudo-random scatter based on object dimensions
          const plants: React.JSX.Element[] = []
          const countW = Math.max(2, Math.floor(widthFt / 0.8))
          const countD = Math.max(2, Math.floor(depthFt / 0.8))
          let idx = 0
          for (let i = 0; i < countW; i++) {
            for (let j = 0; j < countD; j++) {
              const px = -widthFt / 2 + widthFt * (i + 0.5) / countW + (((i * 7 + j * 13) % 5) - 2) * 0.1
              const pz = -depthFt / 2 + depthFt * (j + 0.5) / countD + (((i * 11 + j * 3) % 5) - 2) * 0.1
              const plantH = heightFt * (0.5 + ((i * 3 + j * 7) % 10) * 0.04)
              const plantR = 0.2 + ((i * 5 + j * 2) % 5) * 0.04

              if (style === 'grasses') {
                plants.push(
                  <mesh key={`p-${idx}`} position={[px, baseH + plantH / 2, pz]} castShadow>
                    <boxGeometry args={[0.08, plantH, 0.08]} />
                    <meshStandardMaterial color={new THREE.Color('#4a8a3a')} />
                  </mesh>
                )
              } else if (style === 'tropical') {
                plants.push(
                  <mesh key={`p-${idx}`} position={[px, baseH + plantH * 0.4, pz]} castShadow>
                    <coneGeometry args={[plantR, plantH, 6]} />
                    <meshStandardMaterial color={new THREE.Color('#2a8a3a')} />
                  </mesh>
                )
              } else {
                // mixed / roses — sphere flowers
                plants.push(
                  <mesh key={`p-${idx}`} position={[px, baseH + plantH * 0.5, pz]} castShadow>
                    <sphereGeometry args={[plantR, 6, 6]} />
                    <meshStandardMaterial color={flowerColor} />
                  </mesh>
                )
                // Stem
                plants.push(
                  <mesh key={`s-${idx}`} position={[px, baseH + plantH * 0.2, pz]} castShadow>
                    <cylinderGeometry args={[0.02, 0.02, plantH * 0.4, 4]} />
                    <meshStandardMaterial color={new THREE.Color('#3a6a2a')} />
                  </mesh>
                )
              }
              idx++
            }
          }

          return (
            <group key={obj.id} position={[cx, 0, cz]} rotation={[0, obj.rotation[1], 0]}>
              {/* Mulch/soil base */}
              <mesh position={[0, baseH / 2, 0]} castShadow>
                <boxGeometry args={[widthFt, baseH, depthFt]} />
                <meshStandardMaterial color={bedColor} />
              </mesh>
              {plants}
            </group>
          )
        }

        if (obj.type === 'roof') {
          const roofColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <RoofMesh key={obj.id} obj={obj} color={roofColor} />
        }

        if (obj.type === 'concrete_slab') {
          const slabColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return (
            <mesh
              key={obj.id}
              position={[obj.position[0] + widthFt / 2, heightFt / 2, obj.position[2] + depthFt / 2]}
              rotation={[0, obj.rotation[1], 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[widthFt, heightFt, depthFt]} />
              <meshStandardMaterial color={slabColor} roughness={0.8} />
            </mesh>
          )
        }

        if (obj.type === 'post') {
          const postColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const shape = (obj.customProps?.shape as string) ?? 'square'
          return (
            <mesh
              key={obj.id}
              position={[obj.position[0] + widthFt / 2, heightFt / 2, obj.position[2] + depthFt / 2]}
              castShadow
            >
              {shape === 'round' ? (
                <cylinderGeometry args={[widthFt / 2, widthFt / 2, heightFt, 12]} />
              ) : (
                <boxGeometry args={[widthFt, heightFt, depthFt]} />
              )}
              <meshStandardMaterial color={postColor} />
            </mesh>
          )
        }

        if (obj.type === 'pony_wall') {
          const ponyColor = (obj.customProps?.color as string) ?? '#8b7355'
          const capstone = (obj.customProps?.capstone as boolean) ?? true
          const capColor = (obj.customProps?.capColor as string) ?? '#a0a0a0'
          const capH = 0.15
          const bodyH = capstone ? heightFt - capH : heightFt
          return (
            <group
              key={`${obj.id}-${ponyColor}-${capColor}`}
              position={[obj.position[0] + widthFt / 2, 0, obj.position[2] + depthFt / 2]}
              rotation={[0, obj.rotation[1], 0]}
            >
              <mesh position={[0, bodyH / 2, 0]} castShadow>
                <boxGeometry args={[widthFt, bodyH, depthFt]} />
                <meshStandardMaterial color={ponyColor} />
              </mesh>
              {capstone && (
                <mesh position={[0, bodyH + capH / 2, 0]} castShadow>
                  <boxGeometry args={[widthFt + 0.08, capH, depthFt + 0.08]} />
                  <meshStandardMaterial color={capColor} />
                </mesh>
              )}
            </group>
          )
        }

        if (obj.type === 'tv_wall') {
          const wallMaterial = (obj.customProps?.material as string) ?? 'stone'
          const wallColor = (obj.customProps?.color as string) ?? '#6b6b6b'
          const hasTV = (obj.customProps?.hasTV as boolean) ?? true
          const tvSizeIn = (obj.customProps?.tvSize as number) ?? 55
          const tvVertIn = (obj.customProps?.tvVertical as number) ?? 0
          const tvHorizIn = (obj.customProps?.tvHorizontal as number) ?? 0
          // TV aspect ratio ~16:9, diagonal to width/height
          const tvW = (tvSizeIn * 0.872) / 12 // width in ft
          const tvH = (tvSizeIn * 0.49) / 12  // height in ft
          const tvD = 0.08
          const tvY = heightFt * 0.55 + tvVertIn / 12
          const tvX = tvHorizIn / 12
          const isTG = wallMaterial === 'wood_tg'
          return (
            <group
              key={`${obj.id}-${wallColor}-${wallMaterial}`}
              position={[obj.position[0] + widthFt / 2, 0, obj.position[2] + depthFt / 2]}
              rotation={[0, obj.rotation[1], 0]}
            >
              {/* Wall body */}
              {!isTG && (
                <mesh position={[0, heightFt / 2, 0]} castShadow>
                  <boxGeometry args={[widthFt, heightFt, depthFt]} />
                  <meshStandardMaterial color={wallColor} />
                </mesh>
              )}
              {/* Tongue & groove planks */}
              {isTG && (() => {
                const plankW = 0.5 // 6-inch planks
                const plankGap = 0.01
                const plankCount = Math.ceil(widthFt / plankW)
                const planks: React.JSX.Element[] = []
                for (let i = 0; i < plankCount; i++) {
                  const px = -widthFt / 2 + plankW / 2 + i * plankW
                  const pw = Math.min(plankW - plankGap, widthFt / 2 - (px - plankW / 2))
                  if (pw <= 0) break
                  const shade = i % 2 === 0
                    ? wallColor
                    : new THREE.Color(wallColor).multiplyScalar(0.9).getStyle()
                  planks.push(
                    <mesh key={`tg-${i}`} position={[px, heightFt / 2, 0]} castShadow>
                      <boxGeometry args={[pw, heightFt, depthFt]} />
                      <meshStandardMaterial color={shade} roughness={0.85} />
                    </mesh>
                  )
                }
                return planks
              })()}
              {/* TV */}
              {hasTV && (
                <group position={[tvX, tvY, -depthFt / 2 - tvD / 2]}>
                  {/* Screen */}
                  <mesh castShadow>
                    <boxGeometry args={[tvW, tvH, tvD]} />
                    <meshStandardMaterial color="#111111" />
                  </mesh>
                  {/* Bezel frame */}
                  <mesh position={[0, 0, -0.005]}>
                    <boxGeometry args={[tvW + 0.06, tvH + 0.06, 0.02]} />
                    <meshStandardMaterial color="#222222" />
                  </mesh>
                </group>
              )}
            </group>
          )
        }

        if (obj.type === 'planter_box') {
          return <PlanterBoxMesh key={obj.id} obj={obj} />
        }

        if (obj.type === 'planter_l_shaped') {
          return <PlanterLMesh key={obj.id} obj={obj} />
        }

        if (obj.type === 'rock_bed') {
          return <RockBedMesh key={obj.id} obj={obj} />
        }

        if (obj.type === 'fence_section') {
          return <FenceMesh key={obj.id} obj={obj} />
        }

        if (obj.type === 'wall') {
          const wallColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const shape = (obj.customProps?.shape as string) ?? 'straight'
          if (shape === 'l_shape') return <WallLMesh key={obj.id} obj={obj} color={wallColor} />
          if (shape === 'u_shape') return <WallUMesh key={obj.id} obj={obj} color={wallColor} />
          return <WallMesh key={obj.id} obj={obj} color={wallColor} />
        }

        if (obj.type === 'kitchen_l_shaped') {
          return <LKitchenMesh key={obj.id} obj={obj} />
        }

        if (obj.type.startsWith('grill_')) {
          return <GrillMesh key={obj.id} obj={obj} color={color} />
        }

        if (obj.type === 'kitchen_straight') {
          return <KitchenMesh key={obj.id} obj={obj} />
        }

        if (obj.type === 'bar') {
          return <BarMesh key={obj.id} obj={obj} />
        }

        if (obj.type === 'smoker') {
          const smokerColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const style = (obj.customProps?.style as string) ?? 'egg'
          return <SmokerMesh key={obj.id} obj={obj} color={smokerColor} style={style} />
        }

        if (obj.type === 'fireplace') {
          const fpColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <FireplaceMesh key={obj.id} obj={obj} color={fpColor} />
        }

        if (obj.type === 'dining_table' || obj.type === 'end_table' || obj.type === 'coffee_table') {
          const tColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <DiningTableMesh key={obj.id} obj={obj} color={tColor} />
        }

        if (obj.type === 'couch' || obj.type === 'club_chair') {
          const cColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <CouchMesh key={obj.id} obj={obj} color={cColor} />
        }

        if (obj.type === 'sectional') {
          const sColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <SectionalMesh key={obj.id} obj={obj} color={sColor} />
        }

        if (obj.type === 'chair') {
          const chColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <ChairMesh key={obj.id} obj={obj} color={chColor} />
        }

        if (obj.type === 'retaining_wall') {
          const rwColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <RetainingWallMesh key={obj.id} obj={obj} color={rwColor} />
        }

        if (obj.type === 'turf') {
          const turfColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          return <TurfMesh key={obj.id} obj={obj} color={turfColor} />
        }

        // Default box for other prefabs
        return (
          <mesh
            key={obj.id}
            position={[obj.position[0] + widthFt / 2, heightFt / 2, obj.position[2] + depthFt / 2]}
            rotation={[0, obj.rotation[1], 0]}
            castShadow
          >
            <boxGeometry args={[widthFt, heightFt, depthFt]} />
            <meshStandardMaterial color={color} transparent opacity={0.8} />
          </mesh>
        )
}

function PergolaMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function PatioCoverMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

/**
 * Renders a single wall segment as a group of meshes.
 * Supports window cutouts, door openings, fireplace surrounds, and TV mounts.
 * The segment is centered at the origin and extends along X (width) and Z (thickness).
 */
function WallSegment({
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
    // Window fills middle portion of wall, leaving equal margin top and bottom
    const margin = Math.max(0.5, wallH * 0.2)
    const sillY = margin
    const headerY = wallH - margin

    // Build list of available spans (wall regions not blocked by doors)
    const doorClearance = 0.5 // min gap between door edge and window edge
    type Span = { left: number; right: number }
    let spans: Span[] = [{ left: -wallW / 2, right: wallW / 2 }]
    for (const f of features) {
      const blockLeft = f.cx - f.w / 2 - doorClearance
      const blockRight = f.cx + f.w / 2 + doorClearance
      const newSpans: Span[] = []
      for (const s of spans) {
        if (blockRight <= s.left || blockLeft >= s.right) {
          newSpans.push(s) // no overlap
        } else {
          if (s.left < blockLeft) newSpans.push({ left: s.left, right: blockLeft })
          if (s.right > blockRight) newSpans.push({ left: blockRight, right: s.right })
        }
      }
      spans = newSpans
    }

    // Distribute windows across available spans proportionally
    const totalAvail = spans.reduce((sum, s) => sum + (s.right - s.left), 0)
    const winCenters: number[] = []

    if (windowLayout === 'centered' && spans.length === 1) {
      // Center windows within the single available span
      const s = spans[0]
      const sMid = (s.left + s.right) / 2
      const gap = 0.5
      const totalSpan = windowCount * winW + (windowCount - 1) * gap
      const startX = sMid - totalSpan / 2 + winW / 2
      for (let i = 0; i < windowCount; i++) winCenters.push(startX + i * (winW + gap))
    } else {
      // Spread windows across available spans proportionally
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
      // If rounding left some windows unplaced, add them to the largest span
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
      // Final safety check — don't place outside wall bounds
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

    // Solid pillar between previous edge and this feature
    const pillarW = fLeft - prevRight
    if (pillarW > 0.01) {
      els.push(
        <mesh key={`${keyPrefix}-p${i}`} position={[(prevRight + fLeft) / 2, wallH / 2, 0]} castShadow>
          <boxGeometry args={[pillarW, wallH, wallD]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
    }

    // Below feature (sill for windows, nothing for doors since they go to floor)
    if (f.bottomY > 0.01) {
      els.push(
        <mesh key={`${keyPrefix}-s${i}`} position={[f.cx, f.bottomY / 2, 0]} castShadow>
          <boxGeometry args={[f.w, f.bottomY, wallD]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
    }

    // Above feature (header)
    const headerH = wallH - f.topY
    if (headerH > 0.01) {
      els.push(
        <mesh key={`${keyPrefix}-h${i}`} position={[f.cx, f.topY + headerH / 2, 0]} castShadow>
          <boxGeometry args={[f.w, headerH, wallD]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
    }

    // Feature fill
    const openingH = f.topY - f.bottomY
    if (f.type === 'window') {
      els.push(
        <mesh key={`${keyPrefix}-g${i}`} position={[f.cx, f.bottomY + openingH / 2, 0]}>
          <boxGeometry args={[f.w, openingH, wallD * 0.1]} />
          <meshStandardMaterial color={glassColor} transparent opacity={0.3} />
        </mesh>
      )
    } else if (f.type === 'regular') {
      // Regular door panel
      const doorColor = new THREE.Color('#6b4226')
      els.push(
        <mesh key={`${keyPrefix}-d${i}`} position={[f.cx, openingH / 2, 0]}>
          <boxGeometry args={[f.w - 0.2, openingH - 0.1, wallD * 0.3]} />
          <meshStandardMaterial color={doorColor} />
        </mesh>
      )
      // Door handle
      els.push(
        <mesh key={`${keyPrefix}-dh${i}`} position={[f.cx + f.w / 2 - 0.5, openingH * 0.45, wallD * 0.2]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={new THREE.Color('#c0c0c0')} metalness={0.8} />
        </mesh>
      )
    } else if (f.type === 'sliding_glass') {
      // Sliding glass door - two panels offset in Z
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
      // Center frame divider
      els.push(
        <mesh key={`${keyPrefix}-sg-f${i}`} position={[f.cx, openingH / 2, 0]}>
          <boxGeometry args={[0.1, openingH, wallD * 0.3]} />
          <meshStandardMaterial color={new THREE.Color('#555')} />
        </mesh>
      )
      // Top rail
      els.push(
        <mesh key={`${keyPrefix}-sg-t${i}`} position={[f.cx, openingH - 0.05, 0]}>
          <boxGeometry args={[f.w, 0.1, wallD * 0.3]} />
          <meshStandardMaterial color={new THREE.Color('#555')} />
        </mesh>
      )
      // Bottom rail
      els.push(
        <mesh key={`${keyPrefix}-sg-b${i}`} position={[f.cx, 0.05, 0]}>
          <boxGeometry args={[f.w, 0.1, wallD * 0.3]} />
          <meshStandardMaterial color={new THREE.Color('#555')} />
        </mesh>
      )
    }

    prevRight = fRight
  }

  // Final solid section on the right
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

/** TV dimensions (width x height in feet) by screen size in inches */
function tvDimensions(sizeIn: number): [number, number] {
  switch (sizeIn) {
    case 40: return [2.9, 1.7]
    case 55: return [4.0, 2.25]
    case 65: return [4.75, 2.7]
    case 75: return [5.4, 3.1]
    default: return [4.0, 2.25]
  }
}

/** Standalone fireplace widget */
function FireplaceMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

/** TV panel that mounts on a wall segment face */
function TVMount({
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
function getWallFeatures(obj: PlacedObject3D) {
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

function WallMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

/** Green Egg stand extension — a lower counter section with the egg inset or on top */
function EggStandExtension({
  standW, standDepth, standH, topColor, baseColor, side, kitchenW, mounting,
}: {
  standW: number; standDepth: number; standH: number;
  topColor: THREE.Color; baseColor: THREE.Color;
  side: string; kitchenW: number; mounting: string;
}) {
  // The stand extends outward from the kitchen along X
  const xOffset = side === 'right'
    ? kitchenW / 2 + standW / 2
    : -kitchenW / 2 - standW / 2

  // Egg dimensions
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
        /* On Top: cylindrical body with domed top, flat bottom */
        <group position={[xOffset, standH, 0]}>
          {/* Cylindrical body */}
          <mesh position={[0, eggR * 0.7, 0]} castShadow>
            <cylinderGeometry args={[eggR, eggR, eggR * 1.4, 20]} />
            <meshStandardMaterial color="#2a5e2a" />
          </mesh>
          {/* Domed lid (upper hemisphere) */}
          <mesh position={[0, eggR * 1.4, 0]} castShadow>
            <sphereGeometry args={[eggR, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#2a5e2a" metalness={0.1} />
          </mesh>
          {/* Lid seam ring */}
          <mesh position={[0, eggR * 1.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[eggR * 0.99, 0.025, 8, 24]} />
            <meshStandardMaterial color="#1a4a1a" />
          </mesh>
          {/* Lid handle */}
          <mesh position={[0, eggR * 1.9 + 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      ) : (
        /* Inset: egg partially sunk into the countertop */
        <group position={[xOffset, 0, 0]}>
          {/* Green Egg body — lower half (base bowl) */}
          <mesh position={[0, standH + eggR * 0.35, 0]} castShadow>
            <sphereGeometry args={[eggR, 16, 16, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7]} />
            <meshStandardMaterial color="#2a5e2a" />
          </mesh>
          {/* Green Egg lid — upper dome */}
          <mesh position={[0, standH + eggR * 0.35, 0]} castShadow>
            <sphereGeometry args={[eggR * 0.95, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
            <meshStandardMaterial color="#2a5e2a" metalness={0.1} />
          </mesh>
          {/* Lid handle */}
          <mesh position={[0, standH + eggR * 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.15, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      )}
    </group>
  )
}

function RoofMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function GrillMesh({ obj }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function FenceMesh({ obj }: { obj: PlacedObject3D }) {
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

function RockBedMesh({ obj }: { obj: PlacedObject3D }) {
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

// Planter fill — generates scattered pieces for mulch or river rock
function PlanterFill({
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
    // Seeded pseudo-random for consistent look
    const rand = (i: number, offset: number) => {
      const x = Math.sin(i * 127.1 + offset * 311.7) * 43758.5453
      return x - Math.floor(x)
    }

    const area = width * depth
    const count = Math.min(Math.floor(area * 12), 200) // density based on area

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
      // Size presets: base rock radius and density multiplier
      const sizeConfig = rockSize === 'small'
        ? { base: 0.03, variance: 0.04, density: 100 }
        : rockSize === 'large'
        ? { base: 0.1, variance: 0.12, density: 30 }
        : { base: 0.05, variance: 0.07, density: 55 } // medium
      const rockCount = Math.min(Math.floor(area * sizeConfig.density), 500)
      for (let i = 0; i < rockCount; i++) {
        const px = (rand(i, 0) - 0.5) * (width * 0.95)
        const pz = (rand(i, 1) - 0.5) * (depth * 0.95)
        const sz = sizeConfig.base + rand(i, 3) * sizeConfig.variance
        // Stack rocks in layers for a tightly packed look
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

  // Base layer under mulch/rocks
  const baseColor = fillType === 'mulch' ? '#2a1a0a' : '#3d2b1f'

  return (
    <>
      {/* Base soil/dirt layer */}
      <mesh position={[0, height * 0.3, 0]}>
        <boxGeometry args={[width, height * 0.6, depth]} />
        <meshStandardMaterial color={baseColor} roughness={1} />
      </mesh>
      {/* Individual pieces */}
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

// Map our species to ez-tree presets and leaf tint overrides
const SPECIES_TO_PRESET: Record<string, { preset: string; leafTint?: number; barkTint?: number }> = {
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

function EzTreeMesh({ obj }: { obj: PlacedObject3D }) {
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

function PlanterLMesh({ obj }: { obj: PlacedObject3D }) {
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

function PlanterBoxMesh({ obj }: { obj: PlacedObject3D }) {
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

function KitchenMesh({ obj }: { obj: PlacedObject3D }) {
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

function BarMesh({ obj }: { obj: PlacedObject3D }) {
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

function LKitchenMesh({ obj }: { obj: PlacedObject3D }) {
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

function WallLMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function WallUMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function DiningTableMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function RetainingWallMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function CouchMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function SectionalMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function ChairMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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

function SmokerMesh({ obj, color, style }: { obj: PlacedObject3D; color: THREE.Color; style: string }) {
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

function TurfMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
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
