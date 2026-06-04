import * as THREE from 'three';
import { ModelLoader } from './model-loader';
import { buildChef } from './chef-mesh';
import {
  CAR_FOOTPRINT,
  CHEF_SCALE,
  FLEET,
  PEOPLE_TONES,
  PERSON_SCALE,
  WALK_LANES,
  WALK_LANES_Z,
  X_SPAN,
  Z_MAX,
  Z_MIN,
  solid,
} from './town-layout';

/** A vehicle or pedestrian that moves along one grid axis and wraps. */
interface Mover {
  obj: THREE.Object3D;
  axisZ: boolean;
  dir: number;
  speed: number;
  min: number;
  max: number;
}

/**
 * The living layer: cars driving the grid (both axes), pedestrians on the
 * blocks, and the chef waving outside the bakery. All animation is time-based.
 */
export class TownTraffic {
  private readonly cars: Mover[] = [];
  private readonly people: Mover[] = [];
  private chef: THREE.Group | null = null;
  private chefArm: THREE.Object3D | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly loader: ModelLoader,
    private readonly invalidate: () => void,
  ) {
    this.buildCars();
    this.buildPeople();
    this.buildChefMascot();
  }

  animate(t: number, dt: number): void {
    for (const c of this.cars) this.advance(c, dt);
    for (const p of this.people) {
      this.advance(p, dt);
      p.obj.position.y = Math.abs(Math.sin(t * p.speed * 5)) * 0.04;
    }
    if (this.chefArm) this.chefArm.rotation.z = 0.7 + Math.sin(t * 5) * 0.3;
    if (this.chef) this.chef.position.y = Math.sin(t * 2) * 0.03;
  }

  /* ---------- build ---------- */

  private buildCars(): void {
    for (const c of FLEET) {
      this.loader.load(`assets/city/${c.url}.fbx`, `assets/city/${c.url}.png`, CAR_FOOTPRINT).then(t => {
        const car = t.clone(true);
        // Model length runs along +x; orient the nose toward travel.
        if (c.axisZ) {
          car.rotation.y = c.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          car.position.set(c.lane, 0.06, c.start);
        } else {
          car.rotation.y = c.dir > 0 ? Math.PI : 0;
          car.position.set(c.start, 0.06, c.lane);
        }
        this.scene.add(car);
        this.cars.push({
          obj: car,
          axisZ: c.axisZ,
          dir: c.dir,
          speed: c.speed,
          min: c.axisZ ? Z_MIN : -X_SPAN,
          max: c.axisZ ? Z_MAX : X_SPAN,
        });
        this.invalidate();
      });
    }
  }

  private buildPeople(): void {
    PEOPLE_TONES.forEach((c, i) => {
      const dir = i % 2 ? -1 : 1;
      const z = WALK_LANES[i % WALK_LANES.length];
      const person = buildPerson(c[0], c[1]);
      person.position.set(-X_SPAN + i * 3, 0, z);
      this.scene.add(person);
      this.people.push({
        obj: person,
        axisZ: false,
        dir,
        speed: 0.5 + (i % 3) * 0.2,
        min: -X_SPAN - 1,
        max: X_SPAN + 1,
      });
    });

    // Pedestrians walking the sidewalks along the vertical roads.
    WALK_LANES_Z.forEach((x, i) => {
      const c = PEOPLE_TONES[(i + 2) % PEOPLE_TONES.length];
      const dir = i % 2 ? -1 : 1;
      const person = buildPerson(c[0], c[1]);
      person.position.set(x, 0, Z_MIN + i * 3);
      this.scene.add(person);
      this.people.push({ obj: person, axisZ: true, dir, speed: 0.5 + i * 0.15, min: Z_MIN, max: Z_MAX });
    });
  }

  private buildChefMascot(): void {
    const chef = buildChef();
    chef.scale.setScalar(CHEF_SCALE);
    chef.position.set(0, 0, 2.6);
    this.chef = chef;
    this.chefArm = chef.getObjectByName('arm') ?? null;
    this.scene.add(chef);
  }

  private advance(m: Mover, dt: number): void {
    const cur = m.axisZ ? m.obj.position.z : m.obj.position.x;
    let next = cur + m.dir * m.speed * dt;
    if (next > m.max) next = m.min;
    else if (next < m.min) next = m.max;
    if (m.axisZ) m.obj.position.z = next;
    else m.obj.position.x = next;
  }
}

/** Low-poly pedestrian (the SimplePoly pack has no character models). */
function buildPerson(shirt: number, pants: number): THREE.Group {
  const g = new THREE.Group();
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.55, 6), solid(pants));
  legs.position.y = 0.28;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.6, 6), solid(shirt));
  torso.position.y = 0.82;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), solid(0xf2c9a0));
  head.position.y = 1.25;
  g.add(legs, torso, head);
  g.scale.setScalar(PERSON_SCALE);
  return g;
}
