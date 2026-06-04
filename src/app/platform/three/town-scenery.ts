import * as THREE from 'three';
import { ModelLoader } from './model-loader';
import {
  CAR_FOOTPRINT,
  ROAD_W,
  ROADS_X,
  ROADS_Z,
  SIDEWALK_COLOR,
  SIDEWALK_W,
  WALK_LANES,
  X_SPAN,
  Z_MAX,
  Z_MIN,
  solid,
} from './town-layout';

/**
 * The static world: lights, grass, the street grid with sidewalks, the bakery's
 * park and parking lot, and corner trees / street lights. Owns the ambient
 * animation (drifting particles, swaying trees).
 */
export class TownScenery {
  private particles!: THREE.Points;
  private readonly swayables: THREE.Object3D[] = [];

  constructor(
    private readonly scene: THREE.Scene,
    private readonly loader: ModelLoader,
    private readonly invalidate: () => void,
  ) {
    this.buildLights();
    this.buildGround();
    this.buildRoads();
    this.buildSidewalks();
    this.buildPark();
    this.buildParking();
    this.buildDecor();
  }

  animate(t: number): void {
    this.particles.rotation.y = t * 0.02;
    for (const tree of this.swayables) {
      const sway = tree.userData['sway'] as number;
      tree.rotation.z = Math.sin(t * 0.8 + (tree.userData['phase'] as number)) * sway;
    }
  }

  /* ---------- build ---------- */

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff6ea, 0xcebfa6, 1.15));
    const sun = new THREE.DirectionalLight(0xffe7cd, 1.7);
    sun.position.set(5, 10, 6);
    this.scene.add(sun);
  }

  private buildGround(): void {
    const ground = new THREE.Mesh(new THREE.CylinderGeometry(14, 14.4, 0.6, 16), solid(0xcde0c2));
    ground.position.y = -0.3;
    this.scene.add(ground);

    const N = 60;
    const positions = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xe08a52, size: 0.05, transparent: true, opacity: 0.35 }),
    );
    this.scene.add(this.particles);
  }

  /**
   * Asphalt strips raised above the grass (no FBX tiles → no z-fighting), each
   * flanked by a wider, lower light sidewalk. Layering by height keeps the
   * crossings clean: grass(0) < sidewalk < vertical road < horizontal road.
   */
  private buildRoads(): void {
    const asphalt = solid(0x6f675c);
    const curb = solid(0xd8cdb8);
    const SW = ROAD_W + 0.7; // sidewalk width

    for (const z of ROADS_X) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(X_SPAN * 2 + 2, 0.05, SW), curb);
      walk.position.set(0, 0.02, z);
      this.scene.add(walk);
      const road = new THREE.Mesh(new THREE.BoxGeometry(X_SPAN * 2 + 2, 0.06, ROAD_W), asphalt);
      road.position.set(0, 0.03, z);
      this.scene.add(road);
    }
    for (const x of ROADS_Z) {
      const len = Z_MAX - Z_MIN;
      const walk = new THREE.Mesh(new THREE.BoxGeometry(SW, 0.045, len), curb);
      walk.position.set(x, 0.018, (Z_MIN + Z_MAX) / 2);
      this.scene.add(walk);
      const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_W, 0.06, len), asphalt);
      road.position.set(x, 0.026, (Z_MIN + Z_MAX) / 2);
      this.scene.add(road);
    }
  }

  /** Walkable sidewalks in front of each block row, where pedestrians walk. */
  private buildSidewalks(): void {
    const walk = solid(SIDEWALK_COLOR);
    for (const z of WALK_LANES) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(X_SPAN * 2 + 2, 0.05, SIDEWALK_W), walk);
      strip.position.set(0, 0.05, z);
      this.scene.add(strip);
    }
  }

  /** A small green park beside the bakery: pad, bench and trees. */
  private buildPark(): void {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.8, 0.08, 18), solid(0xbcd6a6));
    pad.position.set(-3, 0.05, 1.2);
    this.scene.add(pad);

    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.22), solid(0x9a4324));
    seat.position.y = 0.2;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.04), solid(0x9a4324));
    back.position.set(0, 0.31, -0.09);
    bench.add(seat, back);
    bench.position.set(-3, 0, 2);
    this.scene.add(bench);

    for (const [dx, dz] of [
      [-0.7, 0.5],
      [0.8, -0.5],
      [0.3, 0.9],
    ]) {
      this.loader.load('assets/city/tree-fir.fbx', 'assets/city/natures.png', 1.1).then(t => {
        const tree = t.clone(true);
        tree.position.set(-3 + dx, 0, 1.2 + dz);
        tree.userData['phase'] = dx - dz;
        tree.userData['sway'] = 0.02 + Math.random() * 0.02;
        this.scene.add(tree);
        this.swayables.push(tree);
        this.invalidate();
      });
    }
  }

  /** A parking lot beside the bakery with marked bays and a parked car. */
  private buildParking(): void {
    const lot = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 2.3), solid(0x6f675c));
    lot.position.set(3, 0.035, 1.2);
    this.scene.add(lot);
    for (const dx of [-0.75, 0, 0.75]) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 1.9), solid(0xe8e2d4));
      line.position.set(3 + dx, 0.07, 1.2);
      this.scene.add(line);
    }
    this.loader.load('assets/city/suv.fbx', 'assets/city/suv.png', CAR_FOOTPRINT).then(t => {
      const car = t.clone(true);
      car.rotation.y = Math.PI / 2;
      car.position.set(3.35, 0.06, 1.2);
      this.scene.add(car);
      this.invalidate();
    });
  }

  /** Corner trees and a couple of street lights near the front road. */
  private buildDecor(): void {
    const trees: [string, number, number][] = [
      ['assets/city/tree-fir.fbx', -9, -5.5],
      ['assets/city/tree-cube.fbx', 9, -5.5],
      ['assets/city/tree-cube.fbx', -9, 3.5],
      ['assets/city/tree-fir.fbx', 9, 3.5],
    ];
    for (const [url, x, z] of trees) {
      this.loader.load(url, 'assets/city/natures.png', 1.6).then(t => {
        const tree = t.clone(true);
        tree.position.set(x, 0, z);
        tree.rotation.y = Math.random() * Math.PI;
        tree.userData['phase'] = x - z;
        tree.userData['sway'] = 0.02 + Math.random() * 0.025;
        this.scene.add(tree);
        this.swayables.push(tree);
        this.invalidate();
      });
    }
    for (const x of [-4.2, 4.2]) {
      this.loader.load('assets/city/street-light.fbx', 'assets/city/props.png', 1.7).then(t => {
        const lamp = t.clone(true);
        lamp.position.set(x, 0, 2.3);
        this.scene.add(lamp);
        this.invalidate();
      });
    }
  }
}
