import React, { useEffect, useRef, useState } from 'react';
import styles from './Person.module.scss';
import Sketch from './Sketch'; // Adjust the import path as necessary

const Person = ({ imgs }) => {
  const containerRef = useRef(null);

  const [activeButtons, setActiveButtons] = useState(true);

  useEffect(() => {
    // Initialize Experience
    const experience = new Sketch({
      targetElement: containerRef.current,
      images: imgs,
    });
  }, []);

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div
        className={`${styles.images} ${
          activeButtons ? null : styles.images__disable
        }`}
      >
        {imgs.map((img, index) => {
          return (
            <div key={index} className={styles.images__item}>
              <img
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
