import React, { Component } from 'react';
// import logo from './logo.svg';
import './App.css';
const THREE = require('three');

class ThreeScene {
  constructor() {
    this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / 300, 0.01, 10 );
    this.camera.position.set(0,0,0);

    this.scene = new THREE.Scene();

    this.geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    this.material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh( this.geometry, this.material );
    this.mesh.position.set(0,0,-1);
    this.scene.add( this.mesh );

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize( window.innerWidth, 300 );

    // document.body.appendChild( this.renderer.domElement );
  }

  animate() {
    requestAnimationFrame( () => this.animate() );

    // this.mesh.rotation.x += 0.01;
    // this.mesh.rotation.y += 0.02;

    this.renderer.render( this.scene, this.camera );
  }
}

class App extends Component {

  // state: {
  //   translate: ''
  // }

  constructor(opts) {
    super(opts);

    this.state = {
      posString: '0,0,-1',
      scaleString: '1,1,1',
      rotString: '0,0,0'
    };
  }

  componentDidMount() {
    this.threeScene = new ThreeScene();
    this.threeScene.animate();
    // document.body.appendChild(this.threeScene.renderer.domElement)
    const el = document.getElementsByClassName('three-scene')[0];
    el.appendChild(this.threeScene.renderer.domElement);
  }

  handleSubmit(e) {
    e.preventDefault();
    console.log('this: ', this);
    var fltstrings = this.state.posString.split(',');
    this.threeScene.mesh.position.set(parseFloat(fltstrings[0]), parseFloat(fltstrings[1]), parseFloat(fltstrings[2]));

    fltstrings = this.state.rotString.split(',');
    this.threeScene.mesh.rotation.set(parseFloat(fltstrings[0]), parseFloat(fltstrings[1]), parseFloat(fltstrings[2]));

    fltstrings = this.state.scaleString.split(',');
    this.threeScene.mesh.scale.set(parseFloat(fltstrings[0]), parseFloat(fltstrings[1]), parseFloat(fltstrings[2]));
  }

  render() {
    return (
      <div className="App">
        <div className="three-scene"></div>

        {/* transform parametes */}
        <form onSubmit={(e) => this.handleSubmit(e)}>
         <label>
           Position:
           <input type="text" value={this.state.posString} onChange={(e) => this.setState({ posString: e.target.value }) } />
         </label>

         <label>
           Scale:
           <input type="text" value={this.state.scaleString} onChange={(e) => this.setState({ scaleString: e.target.value }) } />
         </label>

         <label>
           Rotation:
           <input type="text" value={this.state.rotString} onChange={(e) => this.setState({ rotString: e.target.value }) } />
         </label>


         <input type="submit" value="Submit" />
       </form>

        {/* <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <hr/>
        <p>
          The texture (a jpg file loaded as a simple img HTML tag):
          <img src="UV_Grid_Sm.jpg" alt="texture" />
        </p> */}
      </div>
    );
  }
}

export default App;
