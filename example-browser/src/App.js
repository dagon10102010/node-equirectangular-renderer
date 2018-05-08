import React, { Component } from 'react';
import { createTexturedPlaneRenderingContext } from 'equirectangular-renderer';
// import logo from './logo.svg';
import './App.css';
const THREE = require('three');


class ThreeScene {
  constructor() {
    this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / 300, 0.01, 10 );
    this.camera.position.set(0,0,0);
    this.camera.target = new THREE.Vector3( 0, 0, 0 );

    this.scene = new THREE.Scene();

    this.geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
    this.material = new THREE.MeshNormalMaterial();

    this.mesh = new THREE.Mesh( this.geometry, this.material );
    this.mesh.position.set(0,0,-1);
    this.scene.add( this.mesh );

    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.setSize( window.innerWidth, 300 );

    // document.body.appendChild( this.renderer.domElement );

    this.lon = 0;
    this.lat = 0;
    document.addEventListener( 'mousedown', (e) => this.onDocumentMouseDown(e), false );
    document.addEventListener( 'mousemove', (e) => this.onDocumentMouseMove(e), false );
    document.addEventListener( 'mouseup', (e) => this.onDocumentMouseUp(e), false );
    document.addEventListener( 'wheel', (e) => this.onDocumentMouseWheel(e), false );
  }

  animate() {
    requestAnimationFrame( () => this.animate() );

    // this.mesh.rotation.x += 0.01;
    // this.mesh.rotation.y += 0.02;

    this.renderer.render( this.scene, this.camera );
  }

  onDocumentMouseDown( event ) {

    event.preventDefault();

    this.isUserInteracting = true;

    this.onMouseDownMouseX = event.clientX;
    this.onMouseDownMouseY = event.clientY;

    this.onMouseDownLon = this.lon;
    this.onMouseDownLat = this.lat;
  }

  onDocumentMouseMove( event ) {

    if ( this.isUserInteracting === true ) {

      this.lon = ( this.onMouseDownMouseX - event.clientX ) * 0.1 + this.onMouseDownLon;
      this.lat = ( event.clientY - this.onMouseDownMouseY ) * 0.1 + this.onMouseDownLat;

      let lat = Math.max( - 85, Math.min( 85, this.lat ) );
      let phi = THREE.Math.degToRad( 90 - this.lat );
      let theta = THREE.Math.degToRad( this.lon );

      this.camera.target.set(
        500 * Math.sin( phi ) * Math.cos( theta ),
      	500 * Math.cos( phi ),
      	500 * Math.sin( phi ) * Math.sin( theta ));
      this.camera.lookAt( this.camera.target );
    }
  }

  onDocumentMouseUp( event ) {
    this.isUserInteracting = false;
  }

  onDocumentMouseWheel( event ) {
    var fov = this.camera.fov + event.deltaY * 0.05;
    this.camera.fov = THREE.Math.clamp( fov, 10, 75 );
    this.camera.updateProjectionMatrix();
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
    // this.threeScene = new ThreeScene();
    // this.threeScene.animate();
    // // document.body.appendChild(this.threeScene.renderer.domElement)
    // const el = document.getElementsByClassName('three-scene')[0];
    // el.appendChild(this.threeScene.renderer.domElement);

    createTexturedPlaneRenderingContext({image: 'UV_Grid_Sm.jpg', resolution: [1024,512], scale: [1,0.5,0.5]}).then(function(ctx) {
      this.ctx = ctx;
      this.ctx.renderer.setSize(window.innerWidth, 300);

      const el = document.getElementsByClassName('three-scene')[0];
      el.appendChild(this.ctx.renderer.domElement);
    });
  }

  animate() {
    requestAnimationFrame( () => this.animate() );
    if (this.ctx === undefined) return;

    // this.mesh.rotation.x += 0.01;
    // this.mesh.rotation.y += 0.02;

    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }

  handleSubmit(e) {
    e.preventDefault();

    if (this.ctx)

    var fltstrings = this.state.posString.split(',');
    this.threeScene.mesh.position.set(parseFloat(fltstrings[0]), parseFloat(fltstrings[1]), parseFloat(fltstrings[2]));

    fltstrings = this.state.rotString.split(',');
    this.threeScene.mesh.rotation.set(parseFloat(fltstrings[0]), parseFloat(fltstrings[1]), parseFloat(fltstrings[2]));

    fltstrings = this.state.scaleString.split(',');
    this.threeScene.mesh.scale.set(parseFloat(fltstrings[0]), parseFloat(fltstrings[1]), parseFloat(fltstrings[2]));
  }

  handleCamReset(e) {
    e.preventDefault();
    this.threeScene.camera.lookAt(0,0,-1);
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
         <input type="button" value="reset cam" onClick={(e) => this.handleCamReset(e)}/>
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
