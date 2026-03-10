export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#87ceeb', '#4a7c59', 0.5]} />
      <directionalLight
        position={[50, 80, 50]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
    </>
  )
}
