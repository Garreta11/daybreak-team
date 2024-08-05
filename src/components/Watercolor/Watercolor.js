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
  const speed = useRef(null);
  const [planeImage, setPlaneImage] = useState(null);
  useEffect(() => {
    // Scene
    const scene = new THREE.Scene();

    // Camera
    // const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    scene.add(camera);
    camera.position.z = 6;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Colors Array
    const colorsArray = [
      new THREE.Color(0xff0000), // Red
      new THREE.Color(0x00ff00), // Green
      new THREE.Color(0x0000ff), // Blue
      new THREE.Color(0xffff00), // Yellow
      new THREE.Color(0xff00ff), // Magenta
    ];

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
        uTexture1: { value: new THREE.TextureLoader().load(imgs[0].src) },
        uTexture2: { value: new THREE.TextureLoader().load(imgs[1].src) },
        resolution: { value: new THREE.Vector4() },
        colorsArray: { value: colorsArray },
        colorsLength: { value: colorsArray.length },
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

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);

      if (mesh) {
        mesh.material.uniforms.time.value += 0.005;
      }
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Clean up on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      canvasRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const handleImage = (src, index) => {
    const t = new THREE.TextureLoader().load(src);
    if (dir) {
      planeImage.material.uniforms.uTexture1.value = t;
    } else {
      planeImage.material.uniforms.uTexture2.value = t;
    }

    // Set initial state explicitly
    planeImage.material.uniforms.uOffset.value = 0;
    planeImage.material.uniforms.uOffsetImages.value = dir ? 1 : 0;

    const tl = gsap.timeline();
    tl.to(planeImage.material.uniforms.uOffset, {
      value: 1,
      ease: 'sine.in',
      duration: 1,
    });
    tl.to(planeImage.material.uniforms.uOffsetImages, {
      value: dir ? 0 : 1,
      ease: 'sine.inOut',
      duration: 1.5,
    });
    tl.to(planeImage.material.uniforms.uOffset, {
      value: 0,
      ease: 'sine.in',
      duration: 1,
      onComplete() {
        setDir(!dir);
      },
    });

    setDir(!dir);
  };
  return (
    <>
      <div ref={canvasRef} />
      <div className={styles.images}>
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
