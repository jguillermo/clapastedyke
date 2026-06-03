import * as THREE from 'three';

/**
 * La chef repostera: personaje low-poly que acompaña cada reto.
 * Flota, saluda señalando con el brazo y celebra cuando aciertas.
 * Clase pura sin Angular; el componente la crea fuera de NgZone.
 */
export class MotorChef {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly escena = new THREE.Scene();
  private readonly camara: THREE.PerspectiveCamera;
  private readonly reloj = new THREE.Clock();

  private readonly cuerpo = new THREE.Group();
  private brazo!: THREE.Group;
  private cabeza!: THREE.Group;

  private idAnimacion = 0;
  /** Momento (segundos del reloj) en que empezó la celebración; -1 = sin celebrar. */
  private celebrando = -1;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly animar: boolean,
  ) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth || 150, canvas.clientHeight || 180, false);

    this.camara = new THREE.PerspectiveCamera(35, (canvas.clientWidth || 150) / (canvas.clientHeight || 180), 0.1, 20);
    this.camara.position.set(0, 1.15, 4.1);
    this.camara.lookAt(0, 0.95, 0);

    this.escena.add(new THREE.HemisphereLight(0xfff6ea, 0xd8c9b4, 1.35));
    const sol = new THREE.DirectionalLight(0xffe7cd, 1.4);
    sol.position.set(2, 4, 3);
    this.escena.add(sol);

    this.construirChef();
    this.escena.add(this.cuerpo);

    if (this.animar) this.bucle();
    else this.renderer.render(this.escena, this.camara);
  }

  private material(color: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85 });
  }

  private construirChef(): void {
    // Torso con delantal
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.5, 0.95, 8), this.material(0xfff8f0));
    torso.position.y = 0.45;
    this.cuerpo.add(torso);
    const delantal = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.49, 0.6, 8), this.material(0xbb5530));
    delantal.position.y = 0.3;
    this.cuerpo.add(delantal);

    // Cabeza + gorro de chef
    this.cabeza = new THREE.Group();
    const cara = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), this.material(0xf2c9a0));
    this.cabeza.add(cara);
    const ojoIzq = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), this.material(0x2a2420));
    ojoIzq.position.set(-0.14, 0.05, 0.36);
    const ojoDer = ojoIzq.clone();
    ojoDer.position.x = 0.14;
    this.cabeza.add(ojoIzq, ojoDer);
    const sonrisa = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.025, 6, 10, Math.PI),
      this.material(0x9a4324),
    );
    sonrisa.position.set(0, -0.1, 0.36);
    sonrisa.rotation.x = Math.PI;
    this.cabeza.add(sonrisa);
    const gorroBase = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.22, 8), this.material(0xffffff));
    gorroBase.position.y = 0.38;
    const gorroTop = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), this.material(0xffffff));
    gorroTop.position.y = 0.58;
    gorroTop.scale.set(1, 0.75, 1);
    this.cabeza.add(gorroBase, gorroTop);
    this.cabeza.position.y = 1.25;
    this.cuerpo.add(this.cabeza);

    // Brazo izquierdo pegado al cuerpo
    const brazoIzq = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.55, 6), this.material(0xfff8f0));
    brazoIzq.position.set(-0.45, 0.72, 0);
    brazoIzq.rotation.z = 0.5;
    this.cuerpo.add(brazoIzq);

    // Brazo derecho que SEÑALA (con cuchara de palo)
    this.brazo = new THREE.Group();
    const brazoDer = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.6, 6), this.material(0xfff8f0));
    brazoDer.position.y = 0.3;
    this.brazo.add(brazoDer);
    const cuchara = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), this.material(0xcf9a32));
    cuchara.position.y = 0.72;
    const cucharaPunta = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), this.material(0xcf9a32));
    cucharaPunta.position.y = 0.94;
    cucharaPunta.scale.set(1, 1.25, 0.6);
    this.brazo.add(cuchara, cucharaPunta);
    this.brazo.position.set(0.42, 0.55, 0.1);
    this.brazo.rotation.z = -2.1; // apuntando hacia la izquierda (al formulario)
    this.cuerpo.add(this.brazo);

    this.cuerpo.position.y = -0.15;
    this.cuerpo.rotation.y = -0.35;
  }

  /** Salta y gira una vez: el campo quedó correcto. */
  celebrar(): void {
    this.celebrando = this.reloj.getElapsedTime();
    if (!this.animar) this.renderer.render(this.escena, this.camara);
  }

  private bucle = (): void => {
    this.idAnimacion = requestAnimationFrame(this.bucle);
    const t = this.reloj.getElapsedTime();

    // Respiración y flote
    this.cuerpo.position.y = -0.15 + Math.sin(t * 1.8) * 0.05;
    this.cabeza.rotation.z = Math.sin(t * 1.1) * 0.06;

    // El brazo señala con un vaivén suave
    this.brazo.rotation.z = -2.1 + Math.sin(t * 2.4) * 0.18;

    // Celebración: salto + giro (1.1 s)
    if (this.celebrando >= 0) {
      const c = (t - this.celebrando) / 1.1;
      if (c >= 1) {
        this.celebrando = -1;
        this.cuerpo.rotation.y = -0.35;
      } else {
        this.cuerpo.position.y += Math.sin(c * Math.PI) * 0.45;
        this.cuerpo.rotation.y = -0.35 + c * Math.PI * 2;
      }
    }

    this.renderer.render(this.escena, this.camara);
  };

  dispose(): void {
    cancelAnimationFrame(this.idAnimacion);
    this.escena.traverse(obj => {
      const malla = obj as THREE.Mesh;
      if (malla.geometry) malla.geometry.dispose();
      const m = malla.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(m)) m.forEach(x => x.dispose());
      else m?.dispose();
    });
    this.renderer.dispose();
  }
}
