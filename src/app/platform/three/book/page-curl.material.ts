import { DoubleSide, MeshStandardMaterial, Texture } from 'three';

/**
 * Material de la HOJA que voltea: un {@link MeshStandardMaterial} cuya geometría
 * se deforma en el vertex shader para simular el **doblez realista** del papel.
 *
 * - `uProgress` ∈ [0,1] gira la hoja sobre el lomo (eje Y en x=0) de la derecha
 *   (0) a la izquierda (1).
 * - `uCurl` controla la curvatura (arco de círculo tangente al lomo); su efecto
 *   se anula en los extremos (`sin(πt)`) para que la hoja quede plana al apoyarse.
 * - Doble cara: la cara frontal usa `map`; la trasera, `uMapBack` (espejada en U).
 *
 * Se conserva la iluminación/sombra de Three inyectando con `onBeforeCompile`,
 * en vez de un shader desde cero. Con `reducedMotion`, `uCurl = 0` (hoja plana).
 */
export interface PageCurlMaterial {
  readonly material: MeshStandardMaterial;
  setFront(texture: Texture): void;
  setBack(texture: Texture): void;
  setProgress(progress: number): void;
  setCurl(curl: number): void;
  dispose(): void;
}

export function createPageCurlMaterial(
  pageWidth: number,
  reducedMotion: boolean,
): PageCurlMaterial {
  const material = new MeshStandardMaterial({
    side: DoubleSide,
    roughness: 0.95,
    metalness: 0,
  });

  // Uniforms compartidos: se enlazan en onBeforeCompile y se mutan en runtime.
  const uniforms = {
    uProgress: { value: 0 },
    uCurl: { value: reducedMotion ? 0 : 1 },
    uPageWidth: { value: pageWidth },
    uMapBack: { value: null as Texture | null },
  };

  material.onBeforeCompile = (shader) => {
    shader.uniforms['uProgress'] = uniforms.uProgress;
    shader.uniforms['uCurl'] = uniforms.uCurl;
    shader.uniforms['uPageWidth'] = uniforms.uPageWidth;
    shader.uniforms['uMapBack'] = uniforms.uMapBack;

    // --- Vertex: declaraciones ---
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       uniform float uProgress;
       uniform float uCurl;
       uniform float uPageWidth;
       const float PI_ = 3.14159265359;`,
    );

    // --- Vertex: normal deformada (perpendicular al arco) ---
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `float _a0 = uProgress * PI_;
       float _bend = uCurl * sin(uProgress * PI_);
       float _u = clamp(position.x, 0.0, uPageWidth);
       float _ang = _a0;
       if (_bend > 0.001) { _ang = _a0 + (_u * _bend / uPageWidth); }
       vec3 objectNormal = vec3(-sin(_ang), 0.0, cos(_ang));`,
    );

    // --- Vertex: posición deformada (arco tangente al lomo) ---
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `vec3 transformed;
       transformed.y = position.y;
       if (_bend > 0.001) {
         float _R = uPageWidth / _bend;
         transformed.x = _R * (sin(_ang) - sin(_a0));
         transformed.z = _R * (cos(_a0) - cos(_ang));
       } else {
         transformed.x = _u * cos(_a0);
         transformed.z = _u * sin(_a0);
       }`,
    );

    // --- Fragment: declaración del mapa trasero ---
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform sampler2D uMapBack;`,
    );

    // --- Fragment: elegir cara frontal/trasera según gl_FrontFacing ---
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#ifdef USE_MAP
         vec4 _texel = gl_FrontFacing
           ? texture2D( map, vMapUv )
           : texture2D( uMapBack, vec2(1.0 - vMapUv.x, vMapUv.y) );
         diffuseColor *= _texel;
       #endif`,
    );
  };

  let hasMap = false;

  return {
    material,
    setFront(texture: Texture): void {
      material.map = texture;
      if (!hasMap) {
        // Pasar de sin-mapa a con-mapa define USE_MAP → recompilar una vez.
        material.needsUpdate = true;
        hasMap = true;
      }
    },
    setBack(texture: Texture): void {
      uniforms.uMapBack.value = texture;
    },
    setProgress(progress: number): void {
      uniforms.uProgress.value = progress;
    },
    setCurl(curl: number): void {
      uniforms.uCurl.value = curl;
    },
    dispose(): void {
      material.dispose();
    },
  };
}
