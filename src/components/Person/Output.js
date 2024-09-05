import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js';
import { GUI } from 'dat.gui';

// Import your shaders
import vertex from './shaders/vertex.js';
import fragmentColor from './shaders/fragmentColor.js';
import fragmentKuwahara from './shaders/fragmentKuwahara.js';
import fragmentBlur from './shaders/fragmentBlur.js';

export default class Output {
  constructor(_options = {}) {
    // Basic setup
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.targetElement = _options.targetElement;
    this.images = _options.images;

    // Initialize render targets
    this.renderTargetColor = new THREE.WebGLRenderTarget(
      this.width,
      this.height
    );
    this.renderTargetKuwahara = new THREE.WebGLRenderTarget(
      this.width,
      this.height
    );
    this.renderTargetBlur = new THREE.WebGLRenderTarget(
      this.width,
      this.height
    );

    this.setStats();
    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.setupPipeline();

    this.setDatGUI();
    this.setOrbitControls();

    window.addEventListener('resize', this.onResize.bind(this));
    this.update();
  }

  setStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);
  }

  setScene() {
    this.scene = new THREE.Scene();
  }

  setCamera() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0); // Set clear color to transparent
    this.renderer.setSize(this.width, this.height);
    this.targetElement.appendChild(this.renderer.domElement);
  }

  setupPipeline() {
    // Load texture
    const textureLoader = new THREE.TextureLoader();
    this.texture = textureLoader.load(this.images[0].src);

    const colors = this.images[0].colors.map((color) => new THREE.Color(color));

    // Color Shader
    this.colorMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.texture },
        uColorsArray: { value: colors },
        uColorsLength: { value: colors.length },
      },
      vertexShader: vertex,
      fragmentShader: fragmentColor,
      transparent: true,
    });

    // Kuwahara Shader
    this.kuwaharaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.texture },
        uKuwahara: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },

        uColorsArray: { value: colors },
        uColorsLength: { value: colors.length },
      },
      vertexShader: vertex,
      fragmentShader: fragmentKuwahara,
      transparent: true,
    });

    // Blur Shader
    this.blurMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.renderTargetKuwahara.texture }, // Will be set to Kuwahara render target's texture
        uBlurAmount: { value: 0.0 },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
      },
      vertexShader: vertex,
      fragmentShader: fragmentBlur,
      transparent: true,
    });

    // Color Pass
    this.colorScene = new THREE.Scene();
    const colorQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.colorMaterial
    );
    this.colorScene.add(colorQuad);

    // Kuwahara Pass Scene
    this.kuwaharaScene = new THREE.Scene();
    const kuwaharaQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.kuwaharaMaterial
    );
    this.kuwaharaScene.add(kuwaharaQuad);

    // Blur Pass Scene
    this.blurScene = new THREE.Scene();
    const blurQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.blurMaterial
    );
    this.blurScene.add(blurQuad);

    // Final Output Scene
    this.finalScene = new THREE.Scene();
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ transparent: true })
    );
    this.finalScene.add(this.finalQuad);
  }

  onResize() {
    console.log('resize');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height);

    // Resize render targets
    this.renderTargetKuwahara.setSize(this.width, this.height);
    this.renderTargetBlur.setSize(this.width, this.height);

    // Update shader resolution uniforms
    this.kuwaharaMaterial.uniforms.uResolution.value.set(
      this.width,
      this.height
    );
    this.blurMaterial.uniforms.uResolution.value.set(this.width, this.height);
  }

  applyFilters() {
    // First Pass: Color Shader
    this.renderer.setRenderTarget(this.renderTargetColor);
    this.renderer.render(this.colorScene, this.camera);

    // Set Color texture as input for the Kuwahara filter
    this.kuwaharaMaterial.uniforms.uTexture.value =
      this.renderTargetColor.texture;

    // Second Pass: Kuwahara Filter
    this.renderer.setRenderTarget(this.renderTargetKuwahara);
    this.renderer.render(this.kuwaharaScene, this.camera);

    // Set Kuwahara texture as input for the Blur filter
    this.blurMaterial.uniforms.uTexture.value =
      this.renderTargetKuwahara.texture;

    // Third Pass: Blur Filter
    this.renderer.setRenderTarget(this.renderTargetBlur);
    this.renderer.render(this.blurScene, this.camera);

    // Final Pass: Render the blurred output to the screen
    this.finalQuad.material.map = this.renderTargetBlur.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.finalScene, this.camera);
  }

  setDatGUI() {
    this.gui = new GUI();
    this.filters = this.gui.addFolder('Filters');
    this.filters
      .add(this.kuwaharaMaterial.uniforms.uKuwahara, 'value', 0, 10)
      .name('Kuwahara')
      .listen();
    this.filters
      .add(this.blurMaterial.uniforms.uBlurAmount, 'value', 0, 10)
      .name('Blur')
      .listen();
  }

  // Remove later
  setOrbitControls() {
    this.orbitControls = new OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.orbitControls.dampingFactor = 0.25;
    this.orbitControls.enableZoom = true;
    this.orbitControls.enablePan = false; // Optional: disable panning if not needed
  }

  update() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.stats.begin();

      // Apply filters and render to the screen
      this.applyFilters();

      // Update OrbitControls
      if (this.orbitControls) {
        this.orbitControls.update(); // only required if controls.enableDamping = true or controls.autoRotate = true
      }

      this.stats.end();
    };
    animate();
  }
}
