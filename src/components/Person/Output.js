import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'stats.js';
import { GUI } from 'dat.gui';
import gsap from 'gsap';

// Import your shaders
import vertex from './shaders/vertex.js';
import fragmentColor from './shaders/fragmentColor.js';
import fragmentKuwahara from './shaders/fragmentKuwahara.js';
import fragmentBlur from './shaders/fragmentBlur.js';
import fragmentNoise from './shaders/fragmentNoise.js';
import fragmentMouse from './shaders/fragmentMouse.js';
import fragmentFeedback from './shaders/fragmentFeedback.js';

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
    this.renderTargetNoise = new THREE.WebGLRenderTarget(
      this.width,
      this.height
    );
    this.renderTargetMouse = new THREE.WebGLRenderTarget(
      this.width,
      this.height
    );
    this.renderTargetFeedbackA = new THREE.WebGLRenderTarget(
      this.width,
      this.height
    );
    this.renderTargetFeedbackB = new THREE.WebGLRenderTarget(
      this.width,
      this.height
    );

    this.setStats();
    this.setScene();
    this.setCamera();
    this.setRenderer();
    this.setupPipeline();

    this.setDatGUI();
    // this.setOrbitControls();

    /**
     * Events Listeners
     */
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('touchmove', this.onTouchMove.bind(this));
    window.addEventListener('touchstart', this.onTouchStart.bind(this));

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
    // Load first image and get colors array
    this.texture = new THREE.TextureLoader().load(this.images[0].src);
    const colors = this.images[0].colors.map((color) => new THREE.Color(color));

    this.aspectratio = this.width / this.height;

    /**
     * SHADERS
     */

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
        uKuwahara: { value: 3.0 },
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
        uBlurAmount: { value: 2.0 },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
      },
      vertexShader: vertex,
      fragmentShader: fragmentBlur,
      transparent: true,
    });

    // Noise Shader
    this.noiseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.renderTargetBlur.texture }, // Will be set to Blur render target's texture}
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uTime: { value: 0.0 },
        uNoise: { value: 4.6 },
        uOffset: { value: 0.0 },
      },
      vertexShader: vertex,
      fragmentShader: fragmentNoise,
      transparent: true,
    });

    // Mouse Shader
    this.mouseMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.renderTargetNoise.texture }, // Will be set to Noise render target's texture}
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uTime: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(this.width / 2, this.height / 2) },
        uPullRadius: { value: 0.2 },
        uPullStrengthCenter: { value: 0.05 },
        uPullStrengthEdge: { value: 0.1 },
        uImageScale: { value: 1.0 },
      },
      vertexShader: vertex,
      fragmentShader: fragmentMouse,
      transparent: true,
    });

    // Feedback Shader
    this.feedbackMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.renderTargetMouse.texture }, // Will be set to Mouse render target's texture}
        uPrevTexture: { value: this.renderTargetMouse.texture },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uOpacity: { value: 0.005 },
        uDisplacement: { value: 22 },
      },
      vertexShader: vertex,
      fragmentShader: fragmentFeedback,
      transparent: true,
    });

    /**
     * SCENES
     */

    // Color Pass Scene
    this.colorScene = new THREE.Scene();
    const colorQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1 * this.aspectratio),
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

    // Noise Pass Scene
    this.noiseScene = new THREE.Scene();
    const noiseQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.noiseMaterial
    );
    this.noiseScene.add(noiseQuad);

    // Mouse Pass Scene
    this.mouseScene = new THREE.Scene();
    const mouseQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.mouseMaterial
    );
    this.mouseScene.add(mouseQuad);

    // Feedback Pass Scene
    this.feedbackScene = new THREE.Scene();
    const feedbackQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.feedbackMaterial
    );
    this.feedbackScene.add(feedbackQuad);

    // Final Output Scene
    this.finalScene = new THREE.Scene();
    this.finalQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ transparent: true })
    );
    this.finalScene.add(this.finalQuad);
  }

  onResize() {
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

    // Update aspect ratio
    this.aspectratio = this.width / this.height;
    // Update PlaneGeometry dimensions
    const colorQuad = this.colorScene.children[0];
    colorQuad.geometry.dispose();
    colorQuad.geometry = new THREE.PlaneGeometry(1, 1 * this.aspectratio);

    const kuwaharaQuad = this.kuwaharaScene.children[0];
    kuwaharaQuad.geometry.dispose();
    kuwaharaQuad.geometry = new THREE.PlaneGeometry(2, 2);

    const blurQuad = this.blurScene.children[0];
    blurQuad.geometry.dispose();
    blurQuad.geometry = new THREE.PlaneGeometry(2, 2);

    const finalQuad = this.finalScene.children[0];
    finalQuad.geometry.dispose();
    finalQuad.geometry = new THREE.PlaneGeometry(2, 2);
  }

  onMouseMove(e) {
    this.mouseMaterial.uniforms.uMouse.value = new THREE.Vector2(
      e.clientX,
      e.clientY
    );
  }

  onTouchMove(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.mouseMaterial.uniforms.uMouse.value = new THREE.Vector2(
        touch.clientX,
        touch.clientY
      );
    }
  }

  onTouchStart(event) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.mouseMaterial.uniforms.uMouse.value = new THREE.Vector2(
        touch.clientX,
        touch.clientY
      );
    }
  }

  applyFilters() {
    /**
     * 1st Pass: Color Shader
     */
    this.renderer.setRenderTarget(this.renderTargetColor);
    this.renderer.render(this.colorScene, this.camera);

    // Set Color texture as input for the Kuwahara filter
    this.kuwaharaMaterial.uniforms.uTexture.value =
      this.renderTargetColor.texture;

    /**
     * 2nd Pass: Kuwahara Filter
     */
    this.renderer.setRenderTarget(this.renderTargetKuwahara);
    this.renderer.render(this.kuwaharaScene, this.camera);

    // Set Kuwahara texture as input for the Blur filter
    this.blurMaterial.uniforms.uTexture.value =
      this.renderTargetKuwahara.texture;

    /**
     * 3rd Pass: Blur Filter
     */
    this.renderer.setRenderTarget(this.renderTargetBlur);
    this.renderer.render(this.blurScene, this.camera);

    // Set Blur texture as input for the Noise filter
    this.noiseMaterial.uniforms.uTexture.value = this.renderTargetBlur.texture;

    /**
     * 4th Pass: Noise Filter
     */
    this.renderer.setRenderTarget(this.renderTargetNoise);
    this.renderer.render(this.noiseScene, this.camera);

    // Set Noise texture as input for the Mouse filter
    this.mouseMaterial.uniforms.uTexture.value = this.renderTargetNoise.texture;

    /**
     * 5th Pass: Mouse Filter
     */
    this.renderer.setRenderTarget(this.renderTargetMouse);
    this.renderer.render(this.mouseScene, this.camera);

    // Set Mouse texture as input for the Feedback filter
    this.feedbackMaterial.uniforms.uTexture.value =
      this.renderTargetMouse.texture;

    /**
     * 6th Pass: Feedback Filter
     */
    this.renderer.setRenderTarget(this.renderTargetFeedbackA);
    this.renderer.render(this.feedbackScene, this.camera);

    this.feedbackMaterial.uniforms.uPrevTexture.value =
      this.renderTargetFeedbackA.texture;

    /**
     * Final Pass: Render the feedback output to the screen
     */
    //this.finalQuad.material.map = this.renderTargetBlur.texture;
    this.finalQuad.material.map = this.renderTargetFeedbackA.texture;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.finalScene, this.camera);

    let temp = this.renderTargetFeedbackA;
    this.renderTargetFeedbackA = this.renderTargetFeedbackB;
    this.renderTargetFeedbackB = temp;
  }

  handleImageClick(src, index) {
    // Change Texture to display
    this.texture = new THREE.TextureLoader().load(src);

    this.tl = gsap.timeline();

    this.tl.to(this.noiseMaterial.uniforms.uOffset, {
      value: 1,
      duration: 0.8,
      ease: 'power4.in',

      onComplete: () => {
        this.colorMaterial.uniforms.uTexture.value = this.texture;

        // Change Colors to display
        const colors = this.images[index].colors.map(
          (color) => new THREE.Color(color)
        );
        this.colorMaterial.uniforms.uColorsArray.value = colors;
      },
    });
    this.tl.to(this.noiseMaterial.uniforms.uOffset, {
      value: 0,
      duration: 0.8,
      ease: 'power1.out',
      onComplete: () => {
        this.colorMaterial.uniforms.uTexture.value = this.texture;

        // Change Colors to display
        const colors = this.images[index].colors.map(
          (color) => new THREE.Color(color)
        );
        this.colorMaterial.uniforms.uColorsArray.value = colors;
      },
    });
    /* this.tl.to(this.noiseMaterial.uniforms.uNoise, {
      value: 0,
      duration: 0.8,
      ease: 'power1.out',
    }); */
  }

  setDatGUI() {
    this.gui = new GUI();

    // Filters
    this.filters = this.gui.addFolder('Filters');
    this.filters
      .add(this.kuwaharaMaterial.uniforms.uKuwahara, 'value', 0, 10)
      .name('Kuwahara')
      .listen();
    this.filters
      .add(this.blurMaterial.uniforms.uBlurAmount, 'value', 0, 10)
      .name('Blur')
      .listen();
    this.filters
      .add(this.feedbackMaterial.uniforms.uOpacity, 'value', 0.0001, 0.01)
      .step(0.0001)
      .name('Feedback Opacity')
      .listen();
    this.filters
      .add(this.feedbackMaterial.uniforms.uDisplacement, 'value', 0.1, 100)
      .step(0.0001)
      .name('Feedback Displacement')
      .listen();

    // Noise
    this.noise = this.gui.addFolder('Noise');
    this.noise
      .add(this.noiseMaterial.uniforms.uOffset, 'value', 0, 1)
      .name('Offset')
      .listen();
    this.noise
      .add(this.noiseMaterial.uniforms.uNoise, 'value', 0, 50)
      .name('Noise')
      .listen();

    // Mouse
    this.mouse = this.gui.addFolder('Mouse');
    this.mouse
      .add(this.mouseMaterial.uniforms.uPullRadius, 'value', 0, 1)
      .name('Pull Radius')
      .listen();
    this.mouse
      .add(this.mouseMaterial.uniforms.uPullStrengthCenter, 'value', 0, 1)
      .name('Pull Strength Center')
      .listen();
    this.mouse
      .add(this.mouseMaterial.uniforms.uPullStrengthEdge, 'value', 0, 1)
      .name('Pull Strength Edge')
      .listen();
    this.mouse
      .add(this.mouseMaterial.uniforms.uImageScale, 'value', 0, 1)
      .name('Image Scale')
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

      this.noiseMaterial.uniforms.uTime.value += 0.005;

      // Update OrbitControls
      if (this.orbitControls) {
        this.orbitControls.update(); // only required if controls.enableDamping = true or controls.autoRotate = true
      }

      this.stats.end();
    };
    animate();
  }
}
