import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * Carga modelos 3D y los cachea por url (los llamadores clonan la plantilla —
 * geometría/material compartidos, intencional):
 *  - FBX (pack SimplePoly de la ciudad): aplica el atlas de textura y normaliza
 *    a una huella sobre el suelo.
 *  - GLB (cocina, Draco+WebP): conserva sus propios materiales; sin normalizar
 *    (la escena los coloca con las transformaciones reales del layout).
 */
export class ModelLoader {
  private readonly fbx = new FBXLoader();
  private readonly gltf = new GLTFLoader();
  private readonly textures = new THREE.TextureLoader();
  private readonly cache = new Map<string, Promise<THREE.Object3D>>();

  constructor() {
    const draco = new DRACOLoader();
    draco.setDecoderPath('assets/draco/');
    this.gltf.setDRACOLoader(draco);
  }

  /** FBX con atlas, normalizado a `footprint` (huella sobre el suelo). */
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

  /** GLB con sus materiales originales; el llamador lo posiciona (sin normalizar). */
  loadGlb(url: string): Promise<THREE.Object3D> {
    const cached = this.cache.get(url);
    if (cached) return cached;
    const promise = this.gltf.loadAsync(url).then(gltf => gltf.scene);
    this.cache.set(url, promise);
    return promise;
  }

  /** Escala a una huella objetivo (máx de x/z) y lo apoya en el suelo, centrado. */
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
