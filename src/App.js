import React from 'react';

import './App.scss';
import Webgl from './components/Webgl/Webgl';
import Watercolor from './components/Watercolor/Watercolor';

function App() {
  const images = [
    {
      src: 'teammember1.png',
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'],
    },
    {
      src: 'teammember2.png',
      colors: ['#ff0000', '#00ff00', '#0000ff'],
    },
    {
      src: 'teammember3.png',
      colors: ['#ffff00', '#00ff00', '#ff0000', '#ff00ff'],
    },
    {
      src: 'teammember4.png',
      colors: ['#00ff00', '#ff00ff'],
    },
    {
      src: 'teammember5.png',
      colors: ['#00ff03', '#ffff00', '#3c00ff', '#ff00b8', '#ff00ff'],
    },
    {
      src: 'teammember6.png',
      colors: ['#00ff00', '#f13000', '#ff00ff', '#9100ff', '#ffff00'],
    },
  ];

  return (
    <div className='App' id='app'>
      {/* <Webgl imgs={images} /> */}
      <Watercolor imgs={images} />
    </div>
  );
}

export default App;
