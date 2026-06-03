import * as THREE from 'three';

/** Snapshot del estado del juego que el mundo 3D sabe dibujar. */
export interface IslaEstado {
  id: string;
  misiones: MisionEstado[];
}

export interface MisionEstado {
  id: string;
  estado: 'bloqueada' | 'desbloqueada' | 'completa';
  /** La misión del paso actual: lleva el anillo que pulsa. */
  actual: boolean;
}

interface OpcionesMotor {
  /** false con prefers-reduced-motion: se dibuja un solo fotograma. */
  animar: boolean;
  alClicMision?: (misionId: string) => void;
}

const COLOR_ISLA: Record<string, number> = {
  basico: 0xeac9a8,
  intermedio: 0xc9dcc0,
  avanzado: 0xc4d1e3,
};

const COLOR_NODO = {
  bloqueada: 0xbdb3a6,
  desbloqueada: 0xbb5530,
  completa: 0x4f8a5b,
};

/**
 * Mundo del juego en Three.js: tres islas (una por nivel) unidas por un
 * camino, con un nodo por misión que se enciende al desbloquearse.
 * Clase pura, sin Angular: el componente la crea fuera de NgZone.
 */
export class MotorMundo {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly escena = new THREE.Scene();
  private readonly camara: THREE.PerspectiveCamera;
  private readonly reloj = new THREE.Clock();
  private readonly rayos = new THREE.Raycaster();
  private readonly puntero = new THREE.Vector2(-9, -9);

  private nodos: THREE.Mesh[] = [];
  private islas: THREE.Group[] = [];
  private anillo!: THREE.Mesh;
  private particulas!: THREE.Points;
  private idAnimacion = 0;
  private nodoBajoPuntero: THREE.Mesh | null = null;
  private readonly quitarEscuchas: () => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly opciones: OpcionesMotor,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.camara = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    this.camara.position.set(0, 5.4, 11.5);
    this.camara.lookAt(0, 0.2, 0);

    this.montarLuces();
    this.montarMundo();
    this.resize();

    const alMover = (e: PointerEvent) => this.actualizarPuntero(e);
    const alClicar = (e: PointerEvent) => this.gestionarClic(e);
    canvas.addEventListener('pointermove', alMover);
    canvas.addEventListener('pointerdown', alClicar);
    this.quitarEscuchas = () => {
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerdown', alClicar);
    };

    if (this.opciones.animar) {
      this.bucle();
    } else {
      this.renderer.render(this.escena, this.camara);
    }
  }

  /* ---------- Construcción ---------- */

  private montarLuces(): void {
    this.escena.add(new THREE.HemisphereLight(0xfff6ea, 0xd8c9b4, 1.25));
    const sol = new THREE.DirectionalLight(0xffe7cd, 1.6);
    sol.position.set(4, 8, 6);
    this.escena.add(sol);
  }

  private montarMundo(): void {
    // Camino que une las islas
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.6, -0.1, 0.6),
      new THREE.Vector3(0, -0.1, -0.7),
      new THREE.Vector3(4.6, -0.1, 0.6),
    ]);
    const camino = new THREE.Mesh(
      new THREE.TubeGeometry(curva, 40, 0.06, 6),
      new THREE.MeshStandardMaterial({ color: 0xd9c8ae, roughness: 1 }),
    );
    this.escena.add(camino);

    // Anillo que pulsa sobre la misión actual
    this.anillo = new THREE.Mesh(
      new THREE.RingGeometry(0.26, 0.34, 32),
      new THREE.MeshBasicMaterial({ color: 0xe08a52, transparent: true, side: THREE.DoubleSide }),
    );
    this.anillo.rotation.x = -Math.PI / 2;
    this.anillo.visible = false;
    this.escena.add(this.anillo);

    // Partículas ambientales que flotan despacio
    const N = 130;
    const posiciones = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      posiciones[i * 3] = (Math.random() - 0.5) * 18;
      posiciones[i * 3 + 1] = Math.random() * 6 - 0.5;
      posiciones[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    this.particulas = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0xe08a52, size: 0.06, transparent: true, opacity: 0.55 }),
    );
    this.escena.add(this.particulas);
  }

  /**
   * (Re)dibuja las islas y nodos a partir del estado del juego.
   * Es idempotente: se llama al inicio y cada vez que cambia el progreso.
   */
  actualizar(islas: IslaEstado[]): void {
    this.islas.forEach(isla => {
      this.escena.remove(isla);
      this.liberarObjeto(isla);
    });
    this.islas = [];
    this.nodos = [];
    this.anillo.visible = false;

    const separacion = 4.6;
    islas.forEach((datos, indice) => {
      const grupo = new THREE.Group();
      grupo.position.x = (indice - (islas.length - 1) / 2) * separacion;
      grupo.position.z = indice === 1 ? -0.7 : 0.6;
      grupo.userData['fase'] = indice * 1.7;

      // Isla: disco facetado con el color del nivel
      const disco = new THREE.Mesh(
        new THREE.CylinderGeometry(1.9, 2.2, 0.55, 9),
        new THREE.MeshStandardMaterial({
          color: COLOR_ISLA[datos.id] ?? 0xeac9a8,
          flatShading: true,
          roughness: 0.9,
        }),
      );
      disco.position.y = -0.28;
      grupo.add(disco);

      // Nodos de misión en arco sobre la isla
      const n = datos.misiones.length;
      datos.misiones.forEach((mision, j) => {
        const angulo = (j / Math.max(1, n - 1)) * Math.PI * 0.9 + Math.PI * 0.05;
        const nodo = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.18, 1),
          new THREE.MeshStandardMaterial({
            color: COLOR_NODO[mision.estado],
            flatShading: true,
            emissive: mision.estado === 'bloqueada' ? 0x000000 : COLOR_NODO[mision.estado],
            emissiveIntensity: mision.estado === 'bloqueada' ? 0 : 0.35,
          }),
        );
        nodo.position.set(Math.cos(angulo) * 1.25, 0.32, -Math.sin(angulo) * 1.05 + 0.45);
        nodo.userData['misionId'] = mision.id;
        nodo.userData['clicable'] = mision.estado !== 'bloqueada';
        nodo.userData['fase'] = j * 0.9;
        grupo.add(nodo);
        this.nodos.push(nodo);

        if (mision.actual) {
          this.anillo.visible = true;
          nodo.getWorldPosition(this.anillo.position);
          grupo.updateMatrixWorld(true);
          const mundo = new THREE.Vector3();
          nodo.getWorldPosition(mundo);
          this.anillo.position.set(mundo.x, 0.05 + grupo.position.y, mundo.z);
        }
      });

      this.escena.add(grupo);
      this.islas.push(grupo);
    });

    if (!this.opciones.animar) this.renderer.render(this.escena, this.camara);
  }

  /* ---------- Interacción ---------- */

  private actualizarPuntero(e: PointerEvent): void {
    const r = this.canvas.getBoundingClientRect();
    this.puntero.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.puntero.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private nodoBajo(e: PointerEvent): THREE.Mesh | null {
    this.actualizarPuntero(e);
    this.rayos.setFromCamera(this.puntero, this.camara);
    const golpe = this.rayos
      .intersectObjects(this.nodos, false)
      .find(g => g.object.userData['clicable']);
    return (golpe?.object as THREE.Mesh) ?? null;
  }

  private gestionarClic(e: PointerEvent): void {
    const nodo = this.nodoBajo(e);
    if (nodo) this.opciones.alClicMision?.(nodo.userData['misionId'] as string);
  }

  /* ---------- Bucle ---------- */

  private bucle = (): void => {
    this.idAnimacion = requestAnimationFrame(this.bucle);
    const t = this.reloj.getElapsedTime();

    // Islas y nodos respiran; las partículas flotan
    this.islas.forEach(isla => {
      isla.position.y = Math.sin(t * 0.7 + (isla.userData['fase'] as number)) * 0.12;
    });
    this.nodos.forEach(nodo => {
      const fase = nodo.userData['fase'] as number;
      nodo.position.y = 0.32 + Math.sin(t * 1.6 + fase) * 0.05;
      nodo.rotation.y = t * 0.4 + fase;
    });
    this.particulas.rotation.y = t * 0.02;

    // Anillo de la misión actual: pulso continuo
    if (this.anillo.visible) {
      const pulso = (t % 1.6) / 1.6;
      this.anillo.scale.setScalar(1 + pulso * 0.9);
      (this.anillo.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - pulso);
    }

    // Parallax suave de cámara hacia el puntero
    this.camara.position.x += (this.puntero.x * 1.1 - this.camara.position.x) * 0.03;
    this.camara.position.y += (5.4 + this.puntero.y * 0.5 - this.camara.position.y) * 0.03;
    this.camara.lookAt(0, 0.2, 0);

    // Cursor de mano sobre nodos clicables
    this.rayos.setFromCamera(this.puntero, this.camara);
    const golpe = this.rayos
      .intersectObjects(this.nodos, false)
      .find(g => g.object.userData['clicable']);
    const nodo = (golpe?.object as THREE.Mesh) ?? null;
    if (nodo !== this.nodoBajoPuntero) {
      this.nodoBajoPuntero?.scale.setScalar(1);
      this.nodoBajoPuntero = nodo;
      this.canvas.style.cursor = nodo ? 'pointer' : 'default';
    }
    this.nodoBajoPuntero?.scale.setScalar(1.3);

    this.renderer.render(this.escena, this.camara);
  };

  /* ---------- Ciclo de vida ---------- */

  resize(): void {
    const padre = this.canvas.parentElement;
    if (!padre) return;
    const ancho = padre.clientWidth;
    const alto = padre.clientHeight;
    if (!ancho || !alto) return;
    this.renderer.setSize(ancho, alto, false);
    this.camara.aspect = ancho / alto;
    this.camara.updateProjectionMatrix();
    if (!this.opciones.animar) this.renderer.render(this.escena, this.camara);
  }

  dispose(): void {
    cancelAnimationFrame(this.idAnimacion);
    this.quitarEscuchas();
    this.escena.traverse(obj => this.liberarMallas(obj));
    this.renderer.dispose();
  }

  private liberarObjeto(raiz: THREE.Object3D): void {
    raiz.traverse(obj => this.liberarMallas(obj));
  }

  private liberarMallas(obj: THREE.Object3D): void {
    const malla = obj as THREE.Mesh;
    if (malla.geometry) malla.geometry.dispose();
    const material = malla.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) material.forEach(m => m.dispose());
    else material?.dispose();
  }
}
