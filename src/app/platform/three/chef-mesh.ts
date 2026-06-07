import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type ColorRepresentation,
} from 'three';

/**
 * Chef low-poly construido con primitivas (placeholder, sin assets).
 * Colores tomados de los tokens Migo: delantal terracota, gorro nata.
 */

const SKIN: ColorRepresentation = 0xe6a48e; // terra-200
const APRON: ColorRepresentation = 0xc75d43; // terra-400
const HAT: ColorRepresentation = 0xfffbf4; // nata-tibia

function mat(color: ColorRepresentation): MeshStandardMaterial {
  return new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 });
}

/** Devuelve un grupo con el chef, apoyado por sus pies en `y = 0`. */
export function buildChefMesh(): Group {
  const chef = new Group();

  // Cuerpo (tronco de cono)
  const body = new Mesh(new CylinderGeometry(0.32, 0.42, 0.95, 12), mat(APRON));
  body.position.y = 0.48;
  body.castShadow = true;
  chef.add(body);

  // Cabeza
  const head = new Mesh(new SphereGeometry(0.28, 16, 12), mat(SKIN));
  head.position.y = 1.12;
  head.castShadow = true;
  chef.add(head);

  // Gorro: base cilíndrica + pompón
  const hatBase = new Mesh(new CylinderGeometry(0.26, 0.26, 0.22, 12), mat(HAT));
  hatBase.position.y = 1.38;
  hatBase.castShadow = true;
  chef.add(hatBase);

  const pompom = new Mesh(new SphereGeometry(0.22, 12, 10), mat(HAT));
  pompom.position.y = 1.56;
  pompom.castShadow = true;
  chef.add(pompom);

  return chef;
}
