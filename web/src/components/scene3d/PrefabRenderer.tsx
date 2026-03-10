import type React from 'react'
import * as THREE from 'three'
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
          const treeColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const treeType = (obj.customProps?.treeType as string) ?? 'deciduous'
          const trunkColor = new THREE.Color('#5a3a1a')
          const cx = obj.position[0] + widthFt / 2
          const cz = obj.position[2] + depthFt / 2
          const r = widthFt / 2

          if (treeType === 'evergreen') {
            // Stacked cones (3 tiers)
            const trunkH = heightFt * 0.25
            const foliageH = heightFt - trunkH
            return (
              <group key={obj.id} position={[cx, 0, cz]}>
                <mesh position={[0, trunkH / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.15, 0.25, trunkH, 8]} />
                  <meshStandardMaterial color={trunkColor} />
                </mesh>
                {[0, 1, 2].map((i) => {
                  const tierH = foliageH * 0.45
                  const tierR = r * (1 - i * 0.25)
                  const tierY = trunkH + foliageH * (i * 0.28)
                  return (
                    <mesh key={`tier-${i}`} position={[0, tierY + tierH / 3, 0]} castShadow>
                      <coneGeometry args={[tierR, tierH, 12]} />
                      <meshStandardMaterial color={treeColor} />
                    </mesh>
                  )
                })}
              </group>
            )
          }

          if (treeType === 'palm') {
            const trunkH = heightFt * 0.8
            const frondLen = widthFt * 0.8
            const frondColor = treeColor
            return (
              <group key={obj.id} position={[cx, 0, cz]}>
                {/* Trunk — slight curve via taper */}
                <mesh position={[0, trunkH / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.15, 0.3, trunkH, 8]} />
                  <meshStandardMaterial color={new THREE.Color('#8a7355')} />
                </mesh>
                {/* Fronds — elongated shapes fanning out */}
                {Array.from({ length: 8 }, (_, i) => {
                  const angle = (i / 8) * Math.PI * 2
                  const droop = 0.5
                  return (
                    <mesh
                      key={`frond-${i}`}
                      position={[
                        Math.cos(angle) * frondLen * 0.4,
                        trunkH - droop * 0.3,
                        Math.sin(angle) * frondLen * 0.4,
                      ]}
                      rotation={[droop * Math.sin(angle), angle, -droop * Math.cos(angle)]}
                      castShadow
                    >
                      <boxGeometry args={[0.15, 0.05, frondLen]} />
                      <meshStandardMaterial color={frondColor} />
                    </mesh>
                  )
                })}
                {/* Crown cluster */}
                <mesh position={[0, trunkH, 0]} castShadow>
                  <sphereGeometry args={[0.5, 8, 8]} />
                  <meshStandardMaterial color={frondColor} />
                </mesh>
              </group>
            )
          }

          if (treeType === 'ornamental') {
            const trunkH = heightFt * 0.45
            return (
              <group key={obj.id} position={[cx, 0, cz]}>
                <mesh position={[0, trunkH / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.12, 0.2, trunkH, 8]} />
                  <meshStandardMaterial color={trunkColor} />
                </mesh>
                {/* Main foliage — slightly flattened sphere */}
                <mesh position={[0, trunkH + r * 0.6, 0]} castShadow scale={[1, 0.75, 1]}>
                  <sphereGeometry args={[r * 0.8, 12, 12]} />
                  <meshStandardMaterial color={treeColor} />
                </mesh>
                {/* Flower accent on top */}
                <mesh position={[0, trunkH + r * 1.1, 0]} castShadow>
                  <sphereGeometry args={[r * 0.35, 8, 8]} />
                  <meshStandardMaterial color={new THREE.Color('#e890b0')} />
                </mesh>
              </group>
            )
          }

          // Default: deciduous (sphere foliage)
          return (
            <group key={obj.id} position={[cx, 0, cz]}>
              <mesh position={[0, heightFt * 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.3, heightFt * 0.6, 8]} />
                <meshStandardMaterial color={trunkColor} />
              </mesh>
              <mesh position={[0, heightFt * 0.65, 0]} castShadow>
                <sphereGeometry args={[r, 12, 12]} />
                <meshStandardMaterial color={treeColor} />
              </mesh>
            </group>
          )
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
              <meshStandardMaterial color={slabColor} roughness={0.8} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
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
          return <KitchenMesh key={obj.id} obj={obj} color={color} />
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

function KitchenMesh({ obj, color }: { obj: PlacedObject3D; color: THREE.Color }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const topColor = new THREE.Color(
    (obj.customProps?.countertopColor as string) ?? '#404040'
  )
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
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Countertop */}
      <mesh position={[0, heightFt - 0.075, 0]} castShadow>
        <boxGeometry args={[widthFt + 0.08, 0.15, depthFt + 0.04]} />
        <meshStandardMaterial color={topColor} />
      </mesh>
      {/* Egg stand extension */}
      {hasEggStand && (
        <EggStandExtension
          standW={eggStandW}
          standDepth={depthFt}
          standH={eggStandH}
          topColor={topColor}
          baseColor={color}
          side={eggSide}
          kitchenW={widthFt}
          mounting={eggMounting}
        />
      )}
    </group>
  )
}

function LKitchenMesh({ obj }: { obj: PlacedObject3D }) {
  const { widthFt, depthFt, heightFt } = obj.size
  const legW = (obj.customProps?.legWidth as number) ?? 3
  const topColor = new THREE.Color(
    (obj.customProps?.countertopColor as string) ?? '#404040'
  )
  const baseColor = new THREE.Color(
    (obj.customProps?.color as string) ?? '#6b6b6b'
  )
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
          <meshStandardMaterial color={baseColor} />
        </mesh>
        <mesh position={[widthFt / 2, heightFt - 0.075, legW / 2]} castShadow>
          <boxGeometry args={[widthFt + 0.08, 0.15, legW + 0.04]} />
          <meshStandardMaterial color={topColor} />
        </mesh>

        {/* Arm along Z (left side of L) — legW wide, starts below X-arm */}
        <mesh position={[legW / 2, (heightFt - 0.15) / 2, legW + zArmLen / 2]} castShadow>
          <boxGeometry args={[legW - 0.02, heightFt - 0.15, zArmLen - 0.02]} />
          <meshStandardMaterial color={baseColor} />
        </mesh>
        <mesh position={[legW / 2, heightFt - 0.075, legW + zArmLen / 2]} castShadow>
          <boxGeometry args={[legW + 0.04, 0.15, zArmLen + 0.04]} />
          <meshStandardMaterial color={topColor} />
        </mesh>

        {/* Egg stand extension off the X-arm — positioned relative to inner group origin */}
        {hasEggStand && (
          <group position={[widthFt / 2, 0, legW / 2]}>
            <EggStandExtension
              standW={eggStandW}
              standDepth={legW}
              standH={eggStandH}
              topColor={topColor}
              baseColor={baseColor}
              side={eggSide}
              kitchenW={widthFt}
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
