import type React from 'react'
import * as THREE from 'three'
import { PREFAB_CATALOG } from '@/constants/prefabs'
import type { PlacedObject3D } from '@/types/design'

import {
  PergolaMesh, PatioCoverMesh, WallMesh, WallLMesh, WallUMesh,
  RoofMesh, FenceMesh, FireplaceMesh,
} from './StructureMeshes'

import {
  KitchenMesh, LKitchenMesh, GrillMesh, GrillStandaloneMesh,
  SmokerMesh, BarMesh, SinkMesh, FridgeMesh,
} from './CookingMeshes'

import {
  DiningTableMesh, ChairMesh, CouchMesh, SectionalMesh, RetainingWallMesh,
} from './SeatingMeshes'

import {
  EzTreeMesh, PlanterBoxMesh, PlanterLMesh, RockBedMesh, TurfMesh,
} from './LandscapingMeshes'

/** Dispatch object type to the appropriate mesh component */
export function renderPrefab(
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
          const tvW = (tvSizeIn * 0.872) / 12
          const tvH = (tvSizeIn * 0.49) / 12
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
                const plankW = 0.5
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
                  <mesh castShadow>
                    <boxGeometry args={[tvW, tvH, tvD]} />
                    <meshStandardMaterial color="#111111" />
                  </mesh>
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

        if (obj.type === 'grill_standalone') {
          const grillColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const lidOpen = (obj.customProps?.lidOpen as boolean) ?? false
          return <GrillStandaloneMesh key={obj.id} obj={obj} color={grillColor} lidOpen={lidOpen} />
        }

        if (obj.type === 'sink') {
          const sinkColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const cabinetColor = new THREE.Color((obj.customProps?.cabinetColor as string) ?? '#8b7355')
          return <SinkMesh key={obj.id} obj={obj} color={sinkColor} cabinetColor={cabinetColor} />
        }

        if (obj.type === 'fridge') {
          const fridgeColor = obj.customProps?.color
            ? new THREE.Color(obj.customProps.color as string)
            : color
          const doorStyle = (obj.customProps?.style as string) ?? 'single_door'
          return <FridgeMesh key={obj.id} obj={obj} color={fridgeColor} doorStyle={doorStyle} />
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
