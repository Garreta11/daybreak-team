import { useEffect, useRef, useState } from 'react';
import styles from './Person.module.scss';

import Stats from 'stats.js';

import * as THREE from 'three';
import gsap from 'gsap';
import vertex from './shaders/vertex.js';
import fragment from './shaders/fragment.js';

const Person = ({ imgs }) => {
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

    // Load a texture
    const textureLoader = new THREE.TextureLoader();
    const initialTexture = textureLoader.load(imgs[0].src);

    // Create a render target for feedback
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight
    );

    // Plane Geometry
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives : enable',
      },
      uniforms: {
        uTexture: { value: initialTexture }, // Use the loaded texture
        uTime: { value: 0.0 },
        uResolution: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });
    const mesh = new THREE.Mesh(planeGeometry, material);
    setPlaneImage(mesh);
    // scene.add(mesh);

    // Animation
    const animate = (time) => {
      stats.begin();

      // Render the scene to the render target (feedback loop)
      renderer.render(scene, camera);

      if (mesh) {
        mesh.material.uniforms.uTime.value = time * 0.001; // Convert to seconds
        // Use the previous render as the input texture for the next frame
        mesh.material.uniforms.uTexture.value = renderTarget.texture;
      }

      stats.end();
      requestAnimationFrame(animate);
    };
    animate(0);

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

    const mouseEvents = () => {
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const pointerPos = new THREE.Vector3();
      const raycasterPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide })
      );

      const dummy = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
      );

      scene.add(dummy);

      const handleMouseMove = (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        /* mouse.vX = mouse.x - mouse.prevX;
        mouse.vY = mouse.y - mouse.prevY;
        mouse.prevX = mouse.x;
        mouse.prevY = mouse.y; */

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects([raycasterPlane]);
        if (intersects.length > 0) {
          dummy.position.copy(intersects[0].point);
        }
      };
      window.addEventListener('mousemove', handleMouseMove);
    };
    mouseEvents();

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

export default Person;
