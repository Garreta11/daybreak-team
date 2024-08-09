import { useEffect, useRef, useState } from 'react';
import styles from './Watercolor.module.scss';

import * as THREE from 'three';
import gsap from 'gsap';
import { GUI } from 'dat.gui';
import vertex from './shaders/vertex.js';
import fragment from './shaders/fragment.js';

const Watercolor = ({ imgs }) => {
  const [dir, setDir] = useState(false);
  const canvasRef = useRef(null);
  const [activeButtons, setActiveButtons] = useState(true);
  const [planeImage, setPlaneImage] = useState(null);
  useEffect(() => {
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

    // Colors Array
    const cols = imgs[0].colors;
    const colorsArray = [];
    cols.map((c, i) => {
      colorsArray[i] = new THREE.Color(c);
    });
    const cols2 = imgs[1].colors;
    const colorsArray2 = [];
    cols2.map((c, i) => {
      colorsArray2[i] = new THREE.Color(c);
    });

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
        uKuwahara: { value: 20 },
        uNoise: { value: 10 },
        uZoom: { value: 0.5 },
        uBlurAmount: { value: 3.0 },
        uTexture1: { value: new THREE.TextureLoader().load(imgs[0].src) },
        uTexture2: { value: new THREE.TextureLoader().load(imgs[1].src) },
        resolution: {
          value: new THREE.Vector4(window.innerWidth, window.innerHeight, 1, 1),
        },
        colorsArray: { value: colorsArray },
        colorsLength: { value: colorsArray.length },
        colorsArray2: { value: colorsArray },
        colorsLength2: { value: colorsArray.length },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });
    const mesh = new THREE.Mesh(planeGeometry, material);
    setPlaneImage(mesh);
    scene.add(mesh);

    // Dat GUI
    const gui = new GUI();
    gui
      .add(mesh.material.uniforms.uOffset, 'value', 0, 1)
      .name('Offset')
      .listen();
    gui
      .add(mesh.material.uniforms.uOffsetImages, 'value', 0, 1)
      .name('OffsetImages')
      .listen();

    gui
      .add(mesh.material.uniforms.uKuwahara, 'value', 1, 20)
      .step(1)
      .name('Kuwahara Filter')
      .listen();

    gui
      .add(mesh.material.uniforms.uNoise, 'value', 1, 100)
      .name('Noise')
      .listen();

    gui
      .add(mesh.material.uniforms.uBlurAmount, 'value', 0, 5)
      .step(0.01)
      .name('Blur')
      .listen();

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);

      if (mesh) {
        mesh.material.uniforms.time.value += 0.05;
      }
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
    if (dir) {
      planeImage.material.uniforms.colorsArray.value = colorsArray;
    } else {
      planeImage.material.uniforms.colorsArray2.value = colorsArray;
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
