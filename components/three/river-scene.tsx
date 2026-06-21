"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WaterPlane } from "./water-plane";
import { SceneEnvironment } from "./scene-environment";
import type { TransitionRef } from "./types";

function CameraRig({ transition }: { transition: TransitionRef }) {
  const { camera } = useThree();
  useFrame((state) => {
    const t = transition.current.value;
    const time = state.clock.elapsedTime;
    // gentle, contained drift — keeps the framed view full at all times
    camera.position.x = Math.sin(time * 0.05) * 0.6;
    camera.position.y = 4.9 + Math.sin(time * 0.2) * 0.05;
    camera.position.z = THREE.MathUtils.lerp(22, 20.5, t);
    // aim slightly down so the horizon sits ~38% from top → upper third for text, lower ~60% for the diorama
    camera.lookAt(0, 2.9, -1);
  });
  return null;
}

export function RiverScene({ transition }: { transition: TransitionRef }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 1.8]}
      camera={{ position: [0, 4.9, 22], fov: 40, near: 0.1, far: 140 }}
    >
      <CameraRig transition={transition} />
      <WaterPlane transition={transition} />
      <SceneEnvironment transition={transition} />
    </Canvas>
  );
}
