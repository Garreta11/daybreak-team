import React from 'react';

import './App.scss';
import Webgl from './components/Webgl/Webgl';

function App() {
  const images = [
    {
      src: 'man.png',
    },
    {
      src: 'man2.png',
    },
    {
      src: 'man3.png',
    },
  ];

  return (
    <div className='App' id='app'>
      <Webgl imgs={images} />
    </div>
  );
}

export default App;
