import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

/**
 * Loads SimplePoly FBX models: applies the texture atlas, normalizes the model
 * to a target footprint sitting on the ground, and caches by url. Callers clone
 * the returned template (geometry/material are shared, which is intended).
 */
export class ModelLoader {
  private readonly fbx = new FBXLoader();
  private readonly textures = new THREE.TextureLoader();
  private readonly cache = new Map<string, Promise<THREE.Object3D>>();

  load(url: string, textureUrl: string, footprint: number): Promise<THREE.Object3D> {
    const cached = this.cache.get(url);
    if (cached) return cached;

    const promise = this.fbx.loadAsync(url).then(obj => {
      const texture = this.textures.load(textureUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
      obj.traverse(child => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) mesh.material = material;
      });
      ModelLoader.normalize(obj, footprint);
      return obj;
    });
    this.cache.set(url, promise);
    return promise;
  }

  /** Scales to a target footprint (max of x/z) and sits it on the ground, centered. */
  static normalize(obj: THREE.Object3D, footprint: number): void {
    const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    const maxXZ = Math.max(size.x, size.z) || 1;
    obj.scale.setScalar(footprint / maxXZ);

    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    obj.position.x -= center.x;
    obj.position.z -= center.z;
    obj.position.y -= box.min.y;
  }
}
