'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

type CubeData = {
  position: [number, number, number];
  scale: number;
  speed: number;
  offset: number;
  wireframe: boolean;
};

function makeCubes(count: number): CubeData[] {
  const cubes: CubeData[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    // Ring radius varies a little so it isn't a perfect circle; center stays clear.
    const radius = 3.1 + (i % 3) * 0.55;
    const y = (Math.sin(i * 1.7) * 1.4);
    cubes.push({
      position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius - 1],
      scale: 0.55 + ((i * 37) % 40) / 100,
      speed: 0.2 + ((i * 13) % 30) / 100,
      offset: (i % 10) * 0.7,
      wireframe: i % 3 === 0,
    });
  }
  return cubes;
}

function Cube({ data }: { data: CubeData }) {
  const ref = useRef<THREE.Mesh>(null);
  const baseY = data.position[1];

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    m.rotation.x = t * data.speed;
    m.rotation.y = t * data.speed * 0.8;
    m.position.y = baseY + Math.sin(t * 0.8 + data.offset) * 0.4;
  });

  return (
    <mesh ref={ref} position={data.position} scale={data.scale}>
      <boxGeometry args={[1, 1, 1]} />
      {data.wireframe ? (
        <meshBasicMaterial color="#7dd3fc" wireframe transparent opacity={0.4} />
      ) : (
        <meshPhysicalMaterial
          color="#2159c9"
          transmission={0.9}
          thickness={1.2}
          roughness={0.15}
          metalness={0.1}
          ior={1.4}
          clearcoat={0.6}
          transparent
          opacity={0.92}
          emissive="#123166"
          emissiveIntensity={0.15}
        />
      )}
    </mesh>
  );
}

function CubeField({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const cubes = useMemo(() => makeCubes(count), [count]);
  const { pointer, camera } = useThree();

  useFrame(() => {
    if (group.current) {
      // Parallax-rotate the whole ring toward the cursor.
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.5, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -pointer.y * 0.3, 0.05);
    }
    // Camera drifts gently with the pointer.
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.2, 0.03);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.8, 0.03);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      {cubes.map((c, i) => (
        <Cube key={i} data={c} />
      ))}
    </group>
  );
}

export default function HeroCanvas({
  count = 18,
  active = true,
}: {
  count?: number;
  active?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={active ? 'always' : 'never'}
      className="!absolute inset-0"
    >
      <color attach="background" args={['#050914']} />
      <fog attach="fog" args={['#050914', 8, 16]} />
      {/* Blue point-light rig */}
      <ambientLight intensity={0.25} />
      <pointLight position={[4, 5, 4]} intensity={80} color="#7dd3fc" />
      <pointLight position={[-6, -3, -2]} intensity={60} color="#2159c9" />
      <pointLight position={[0, 0, 6]} intensity={20} color="#a8e2fd" />
      {/* Locally baked environment (no remote HDR fetch) for glass reflections */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} color="#7dd3fc" position={[0, 3, 3]} scale={[8, 8, 1]} />
        <Lightformer intensity={1.4} color="#2159c9" position={[-4, -2, -3]} scale={[8, 8, 1]} />
        <Lightformer intensity={1} color="#a8e2fd" position={[3, -1, 2]} scale={[5, 5, 1]} />
      </Environment>
      <CubeField count={count} />
    </Canvas>
  );
}
