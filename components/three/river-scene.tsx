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
    camera.position.y = 5.4 + Math.sin(time * 0.2) * 0.05;
    camera.position.z = THREE.MathUtils.lerp(22, 20.5, t);
    // aim down so the horizon sits ~33% from top: upper third for text, factory/pipeline mid, river across the foreground
    camera.lookAt(0, 2.4, -2);
  });
  return null;
}

export function RiverScene({ transition }: { transition: TransitionRef }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 1.8]}
      camera={{ position: [0, 5.4, 22], fov: 40, near: 0.1, far: 140 }}
    >
      <CameraRig transition={transition} />
      <WaterPlane transition={transition} />
      <SceneEnvironment transition={transition} />
    </Canvas>
  );
}
