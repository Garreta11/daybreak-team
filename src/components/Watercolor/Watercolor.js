import { useEffect, useRef, useState } from 'react';
import styles from './Watercolor.module.scss';

import Stats from 'stats.js';

import * as THREE from 'three';
import gsap from 'gsap';
import { GUI } from 'dat.gui';
import vertex from './shaders/vertex.js';
import fragment from './shaders/fragmentMouse.js';

const Watercolor = ({ imgs }) => {
  const [dir, setDir] = useState(false);
  const canvasRef = useRef(null);
  const circleRef = useRef(null);
  const [activeButtons, setActiveButtons] = useState(true);
  const [planeImage, setPlaneImage] = useState(null);

  useEffect(() => {
    // Stats
    const stats = new Stats();
    document.body.appendChild(stats.dom);

    // Mouse
    let mouse = { x: 0, y: 0, prevX: 0, prevY: 0, vX: 0, vY: 0 };

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    scene.add(camera);
    camera.position.z = 4;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // COLORS ARRAY
    const cols = imgs[0].colors;
    const colorsArray = [];
    cols.map((c, i) => {
      colorsArray[i] = new THREE.Color(c);
    });

    // Convert to vec4 array
    const colorsArrayVec4 = new Float32Array(colorsArray.length * 4);
    colorsArray.forEach((color, i) => {
      colorsArrayVec4[i * 4] = color.r;
      colorsArrayVec4[i * 4 + 1] = color.g;
      colorsArrayVec4[i * 4 + 2] = color.b;
      colorsArrayVec4[i * 4 + 3] = color.a || 1.0; // Assuming alpha is 1.0 if not defined
    });

    const cols2 = imgs[1].colors;
    const colorsArray2 = [];
    cols2.map((c, i) => {
      colorsArray2[i] = new THREE.Color(c);
    });
    // Convert to vec4 array
    const colorsArrayVec42 = new Float32Array(colorsArray2.length * 4);
    colorsArray2.forEach((color, i) => {
      colorsArrayVec42[i * 4] = color.r;
      colorsArrayVec42[i * 4 + 1] = color.g;
      colorsArrayVec42[i * 4 + 2] = color.b;
      colorsArrayVec42[i * 4 + 3] = color.a || 1.0; // Assuming alpha is 1.0 if not defined
    });

    // DataTexture
    const settings = {
      strength: 0.1,
      relaxation: 0.9,
      mouse: 0.15,
      grid: 20,
    };
    const grid = settings.grid;
    const sizeDataTexture = grid * grid;
    const width = sizeDataTexture;
    const height = sizeDataTexture;
    const size = width * height;
    const data = new Float32Array(3 * size);

    for (let i = 0; i < size; i++) {
      let r = 0.0;
      const stride = i * 3;
      data[stride] = r;
      data[stride + 1] = r;
      data[stride + 2] = 0;
    }

    const dataTexture = new THREE.DataTexture(
      data,
      width,
      height,
      THREE.RGBFormat,
      THREE.FloatType
    );
    dataTexture.internalFormat = 'RGB32F';
    dataTexture.generateMipmaps = false;
    dataTexture.magFilter = dataTexture.minFilter = THREE.NearestFilter;
    dataTexture.needsUpdate = true;

    // Plane Geometry
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        time: { value: 0.0 },
        uOffset: { value: 0.0 },
        uOffsetImages: { value: 0.0 },
        uKuwahara: { value: 6 },
        uNoise: { value: 12 },
        uZoom: { value: 0.5 },
        uBlurAmount: { value: 3.0 },
        uNoiseAmplitude: { value: 0.05 },
        uNoiseFrequency: { value: 3.15 },
        uNoiseSpeed: { value: 0.88 },
        uMouseSize: { value: 0.3 },
        uDirection: { value: new THREE.Vector2() },
        uTexture1: { value: new THREE.TextureLoader().load(imgs[0].src) },
        uTexture2: { value: new THREE.TextureLoader().load(imgs[1].src) },
        uDataTexture: { value: dataTexture },
        resolution: {
          value: new THREE.Vector4(window.innerWidth, window.innerHeight, 1, 1),
        },
        uMouse: { value: new THREE.Vector2() },
        colorsArray: { value: colorsArrayVec4 },
        colorsLength: { value: colorsArray.length },
        colorsArray2: { value: colorsArrayVec42 },
        colorsLength2: { value: colorsArray.length },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });
    const mesh = new THREE.Mesh(planeGeometry, material);
    setPlaneImage(mesh);
    scene.add(mesh);

    // Horizontal blur
    material.uniforms.uDirection.value = new THREE.Vector2(1.0, 0.0);
    renderer.render(scene, camera);

    // Vertical blur
    material.uniforms.uDirection.value = new THREE.Vector2(0.0, 1.0);
    renderer.render(scene, camera);

    // Dat GUI
    const setDatGUI = () => {
      const gui = new GUI();
      var transition = gui.addFolder('Transition');
      transition
        .add(mesh.material.uniforms.uOffset, 'value', 0, 1)
        .name('Offset')
        .listen();
      transition
        .add(mesh.material.uniforms.uOffsetImages, 'value', 0, 1)
        .name('OffsetImages')
        .listen();
      transition
        .add(mesh.material.uniforms.uNoise, 'value', 1, 100)
        .name('Noise')
        .listen();

      var imageFilters = gui.addFolder('Image Filters');

      imageFilters
        .add(mesh.material.uniforms.uKuwahara, 'value', 1, 6)
        .step(1)
        .name('Kuwahara Filter')
        .listen();
      imageFilters
        .add(mesh.material.uniforms.uBlurAmount, 'value', 0, 5)
        .step(0.01)
        .name('Blur')
        .listen();

      /* var mouseDistortion = gui.addFolder('Mouse Distortion');
      mouseDistortion.add(settings, 'strength', 0, 1).step(0.01);
      mouseDistortion.add(settings, 'relaxation', 0, 0.99).step(0.01);
      mouseDistortion.add(settings, 'mouse', 0, 1).step(0.01); */
      var mouseDistortion2 = gui.addFolder('Mouse Distortion 2');
      mouseDistortion2
        .add(mesh.material.uniforms.uNoiseAmplitude, 'value', 0, 1)
        .step(0.01)
        .name('Noise Amplitude');
      mouseDistortion2
        .add(mesh.material.uniforms.uNoiseFrequency, 'value', 0, 10)
        .step(0.01)
        .name('Noise Frequency');
      mouseDistortion2
        .add(mesh.material.uniforms.uNoiseSpeed, 'value', 0, 1)
        .step(0.01)
        .name('Noise Speed');
      mouseDistortion2
        .add(mesh.material.uniforms.uMouseSize, 'value', 0.1, 0.9)
        .step(0.01)
        .name('Mouse Size');
    };
    setDatGUI();

    const clamp = (number, min, max) => {
      return Math.max(min, Math.min(number, max));
    };

    // Animation
    const animate = () => {
      stats.begin();

      renderer.render(scene, camera);

      if (mesh) {
        // update time
        mesh.material.uniforms.time.value += 0.005;
      }

      // update data texture
      /* if (dataTexture) {
        let data = dataTexture.image.data;
        for (let i = 0; i < data.length; i += 3) {
          data[i] *= settings.relaxation;
          data[i + 1] *= settings.relaxation;
        }

        let gridMouseX = sizeDataTexture * mouse.x;
        let gridMouseY = sizeDataTexture * (1 - mouse.y);
        let maxDist = sizeDataTexture * settings.mouse;
        let aspect = window.innerHeight / window.innerWidth;

        for (let i = 0; i < sizeDataTexture; i++) {
          for (let j = 0; j < sizeDataTexture; j++) {
            // let distance = (gridMouseX - i) ** 2 + (gridMouseY - j) ** 2;
            let distance =
              (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2;
            let maxDistSq = maxDist ** 2;
            if (distance < maxDistSq) {
              let index = 3 * (i + sizeDataTexture * j);

              let power = maxDist / Math.sqrt(distance);
              power = clamp(power, 0, 10);

              data[index] += settings.strength * 100 * mouse.vX * power;
              data[index + 1] -= settings.strength * 100 * mouse.vY * power;
            }
          }
        }

        mouse.vX *= 0.9;
        mouse.vY *= 0.9;

        dataTexture.needsUpdate = true;
      } */

      stats.end();
      requestAnimationFrame(animate);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);

      if (mesh) {
        mesh.material.uniforms.resolution.value = new THREE.Vector4(
          window.innerWidth,
          window.innerHeight,
          1,
          1
        );
      }
    };
    window.addEventListener('resize', handleResize);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const handleMouseMove = (e) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = e.clientY / window.innerHeight;
      mouse.vX = mouse.x - mouse.prevX;
      mouse.vY = mouse.y - mouse.prevY;

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;

      material.uniforms.uMouse.value.set(e.pageX, e.pageY);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      canvasRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const handleImage = (src, index) => {
    if (!activeButtons) return;

    const t = new THREE.TextureLoader().load(src);
    if (dir) {
      planeImage.material.uniforms.uTexture1.value = t;
    } else {
      planeImage.material.uniforms.uTexture2.value = t;
    }

    // set colors
    const colors = imgs[index].colors;
    const colorsArray = [];
    colors.map((c, i) => {
      colorsArray[i] = new THREE.Color(c);
    });
    const colorsArrayVec4 = new Float32Array(colorsArray.length * 4);
    colorsArray.forEach((color, i) => {
      colorsArrayVec4[i * 4] = color.r;
      colorsArrayVec4[i * 4 + 1] = color.g;
      colorsArrayVec4[i * 4 + 2] = color.b;
      colorsArrayVec4[i * 4 + 3] = color.a || 1.0; // Assuming alpha is 1.0 if not defined
    });
    if (dir) {
      planeImage.material.uniforms.colorsArray.value = colorsArrayVec4;
    } else {
      planeImage.material.uniforms.colorsArray2.value = colorsArrayVec4;
    }

    // Set initial state explicitly
    planeImage.material.uniforms.uOffset.value = 0;
    planeImage.material.uniforms.uOffsetImages.value = dir ? 1 : 0;

    setActiveButtons(false);

    const tl = gsap.timeline();
    tl.to(planeImage.material.uniforms.uOffset, {
      value: 1,
      ease: 'power1.inOut',
      duration: 1,
    });
    tl.to(planeImage.material.uniforms.uOffsetImages, {
      value: dir ? 0 : 1,
      ease: 'none',
      // duration: 2,
    });
    tl.to(planeImage.material.uniforms.uOffset, {
      value: 0,
      ease: 'power1.inOut',
      duration: 1,
      onComplete() {
        setDir(!dir);
        setActiveButtons(true);
      },
    });

    setDir(!dir);
  };
  return (
    <>
      <div ref={circleRef} className={styles.circle} />
      <div ref={canvasRef} />
      <div
        className={`${styles.images} ${
          activeButtons ? null : styles.images__disable
        }`}
      >
        {imgs.map((img, index) => {
          return (
            <div key={index} className={styles.images__item}>
              <img
                onClick={() => handleImage(img.src, index)}
                className={styles.images__item__img}
                src={img.src}
                alt={index}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Watercolor;
