import * as THREE from 'three';

function mat(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85 });
}

/**
 * Low-poly pastry chef as a reusable group. Origin at the feet, facing +z.
 * The pointing right arm is named `arm` and the head `head` so consumers can
 * animate them (`getObjectByName`). Used by the challenge `ChefEngine` and by
 * the town (the chef waving outside the bakery).
 */
export function buildChef(): THREE.Group {
  const body = new THREE.Group();

  // Torso with apron
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 0.95, 8), mat(0xfff8f0));
  torso.position.y = 0.45;
  body.add(torso);
  const apron = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.49, 0.6, 8), mat(0xbb5530));
  apron.position.y = 0.3;
  body.add(apron);

  // Head + chef hat
  const head = new THREE.Group();
  head.name = 'head';
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), mat(0xf2c9a0));
  head.add(face);
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(0x2a2420));
  leftEye.position.set(-0.14, 0.05, 0.36);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.14;
  head.add(leftEye, rightEye);
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 6, 10, Math.PI), mat(0x9a4324));
  smile.position.set(0, -0.1, 0.36);
  smile.rotation.x = Math.PI;
  head.add(smile);
  const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.22, 8), mat(0xffffff));
  hatBase.position.y = 0.38;
  const hatTop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mat(0xffffff));
  hatTop.position.y = 0.58;
  hatTop.scale.set(1, 0.75, 1);
  head.add(hatBase, hatTop);
  head.position.y = 1.25;
  body.add(head);

  // Left arm pinned to the body
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.55, 6), mat(0xfff8f0));
  leftArm.position.set(-0.45, 0.72, 0);
  leftArm.rotation.z = 0.5;
  body.add(leftArm);

  // Right arm that POINTS (with a wooden spoon)
  const arm = new THREE.Group();
  arm.name = 'arm';
  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.6, 6), mat(0xfff8f0));
  rightArm.position.y = 0.3;
  arm.add(rightArm);
  const spoon = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), mat(0xcf9a32));
  spoon.position.y = 0.72;
  const spoonTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), mat(0xcf9a32));
  spoonTip.position.y = 0.94;
  spoonTip.scale.set(1, 1.25, 0.6);
  arm.add(spoon, spoonTip);
  arm.position.set(0.42, 0.55, 0.1);
  arm.rotation.z = -2.1; // resting pose: pointing
  body.add(arm);

  return body;
}
