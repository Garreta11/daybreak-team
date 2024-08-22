import * as THREE from 'three';

import vertex from './shaders/vertex.js';
import vertexFBO from './shaders/vertexFBO.js';
import fragment from './shaders/fragment.js';
import fragmentFBO from './shaders/fragmentFBO.js';

export default class Sketch {
  constructor(_options = {}) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Options
    this.targetElement = _options.targetElement;
    this.images = _options.images;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.whiteTarget = new THREE.WebGLRenderTarget(this.width, this.height);
    this.whiteScene = new THREE.Scene();
    this.whiteBg = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
      })
    );
    this.whiteScene.add(this.whiteBg);
    this.whiteBg.position.z = -1;

    this.plane = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(this.images[0].src) },
        uTime: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });

    this.mesh = new THREE.Mesh(this.plane, this.material);
    this.whiteScene.add(this.mesh);

    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.mouseEvents();
    this.setupPipeline();

    this.update();
  }

  setScene() {
    this.scene = new THREE.Scene();
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.scene.add(this.camera);
    this.whiteScene.add(this.camera);
    this.camera.position.z = 4;
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.width, this.height);
    this.targetElement.appendChild(this.renderer.domElement);
  }

  mouseEvents() {
    this.raycasterPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
      })
    );

    this.dummy = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 20, 20),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
      })
    );
    this.scene.add(this.dummy);

    window.addEventListener('mousemove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects([this.raycasterPlane]);
      if (intersects.length > 0) {
        this.dummy.position.copy(intersects[0].point);
      }
    });
  }

  setupPipeline() {
    this.sourceTarget = new THREE.WebGLRenderTarget(this.width, this.height);

    this.targetA = new THREE.WebGLRenderTarget(this.width, this.height);
    this.targetB = new THREE.WebGLRenderTarget(this.width, this.height);

    this.renderer.setRenderTarget(this.whiteTarget);
    this.renderer.render(this.whiteScene, this.camera);

    this.fboScene = new THREE.Scene();
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tPrev: { value: this.whiteTarget.texture },
        resolution: { value: new THREE.Vector4(this.width, this.height, 1, 1) },
      },
      vertexShader: vertex,
      fragmentShader: fragmentFBO,
      transparent: true,
    });

    this.fboQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.fboMaterial
    );

    this.fboScene.add(this.fboQuad);

    this.finalScene = new THREE.Scene();
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({
        map: this.targetA.texture,
        transparent: true,
      })
    );

    this.finalScene.add(this.finalQuad);
  }

  update() {
    // Rendering the Sorce
    this.renderer.setRenderTarget(this.sourceTarget);
    this.renderer.render(this.scene, this.camera);

    // Running PingPong
    this.renderer.setRenderTarget(this.targetA);
    this.renderer.render(this.fboScene, this.fboCamera);

    this.fboMaterial.uniforms.tDiffuse.value = this.sourceTarget.texture;
    this.fboMaterial.uniforms.tPrev.value = this.targetA.texture;

    // Final Output
    this.finalQuad.material.map = this.targetA.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.finalScene, this.fboCamera);

    // Swap Render Targets
    let temp = this.targetA;
    this.targetA = this.targetB;
    this.targetB = temp;

    requestAnimationFrame(() => this.update());
  }
}
