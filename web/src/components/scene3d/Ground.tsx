export function Ground({ widthFt, heightFt }: { widthFt: number; heightFt: number }) {
  const t = 0.05 // border line thickness
  const y = 0.02 // just above ground

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#5a8c3a" polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
      </mesh>
      {/* Grid boundary — 4 edge lines */}
      <mesh position={[widthFt / 2, y, 0]}>
        <boxGeometry args={[widthFt + t, 0.02, t]} />
        <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
      <mesh position={[widthFt / 2, y, heightFt]}>
        <boxGeometry args={[widthFt + t, 0.02, t]} />
        <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
      <mesh position={[0, y, heightFt / 2]}>
        <boxGeometry args={[t, 0.02, heightFt + t]} />
        <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
      <mesh position={[widthFt, y, heightFt / 2]}>
        <boxGeometry args={[t, 0.02, heightFt + t]} />
        <meshStandardMaterial color="#ffffff" opacity={0.5} transparent />
      </mesh>
    </>
  )
}
