import React from 'react';

import './App.scss';
import Webgl from './components/Webgl/Webgl';

function App() {
  const images = [
    {
      src: 'teammember1.png',
    },
    {
      src: 'teammember2.png',
    },
    {
      src: 'teammember3.png',
    },
    {
      src: 'teammember4.png',
    },
    {
      src: 'teammember5.png',
    },
    {
      src: 'teammember6.png',
    },
  ];

  return (
    <div className='App' id='app'>
      <Webgl imgs={images} />
    </div>
  );
}

export default App;
