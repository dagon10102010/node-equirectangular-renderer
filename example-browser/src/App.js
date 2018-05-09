import React, { Component } from 'react';
import * as THREE from 'three';
import OrbitControlsPatcher from 'three-orbit-controls';
import './App.css';
import { createTexturedPlaneRenderer } from 'equirectangular-renderer';

// apply OrbitControls 'patch' to our THREE intance, so it's available from there
const OrbitControls = OrbitControlsPatcher(THREE);

class App extends Component {

  constructor(opts) {
    super(opts);
    window.appp = this;

    this.state = {
      equiBlobUrl: undefined,
      posString: '0,0,-20',
      scaleString: '1,1,1',
      rotString: '0,0,0'
    };
  }

  componentDidMount() {

    // create our own 3d scene preview renderer
    this.renderer = new THREE.WebGLRenderer( { antialias: true });
    this.renderer.setSize(800,600);
    const el = document.getElementsByClassName('three-scene')[0];
    el.appendChild(this.renderer.domElement);

    // preload bg texture
    this.bgTex = new THREE.TextureLoader().load( '2294472375_24a3b8ef46_o.jpg' );

    createTexturedPlaneRenderer({image: 'UV_Grid_Sm.jpg', winWidth: 800, winHeight: 600, resolution: [1024,512], translate: [0,0,-20], scale: [1,0.5,0.5]})
    .then((ctx) => {
      this.ctx = ctx;
      this.ctx.plane.material.side = THREE.DoubleSide;

      // clone scene
      this.scene = this.ctx.scene.clone();

      { // scene elements that can be toggle dynamically
        this.bg = this.createBackground()
        // this.scene.add(this.bg);
        this.cubegeometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
        this.cubematerial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.cubematerial.depthTest = false;
        this.cubematerial.side = THREE.DoubleSide;
        this.cubemesh = new THREE.Mesh( this.cubegeometry, this.cubematerial );
        this.cubemesh.position.set(5,0,-15);
        this.cubemesh.rotation.set(0.5,-0.2,0);

        this.cubematerial2 = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        this.cubematerial2.depthTest = false;
        this.cubematerial2.side = THREE.DoubleSide;
        this.cubemesh2 = new THREE.Mesh( this.cubegeometry, this.cubematerial2 );
        this.cubemesh2.position.set(-5,0,-15);
        this.cubemesh2.rotation.set(0.5,0.2,0);
      }

      document.addEventListener('keydown', (e) => this.onKeyDown(e));

      if (OrbitControls) {
        this.controls = new OrbitControls(this.ctx.camera);
        // this.controls.update();
        this.controls.target.z = -0.00001;  // for some reason the OrbitControls don't work without this
      } else {
        console.log('OrbitControls not available!');
      }

      this.animate();
      // this.render3d();
      // this.renderEqui();
    })
    .catch((err) => {
      console.log('createTexturedPlaneRenderer err:', err);
    });
  }

  addToScene(obj, scene, add) {
    if (scene === undefined) scene = this.scene;
    if (add === undefined) add = scene.children.indexOf(obj) === -1;
    if (add) { scene.add(obj); }
    else { scene.remove(obj); }
  }

  onKeyDown(e) {
    // console.log('keydown', e);

    // if (e.key === '0' && this.ctx) this.addToScene(this.ctx.plane);
    if (e.key === '1' && this.ctx) this.addToScene(this.cubemesh);
    if (e.key === '2' && this.ctx) this.addToScene(this.cubemesh2);
    if (e.key === '9' && this.ctx) this.addToScene(this.bg);
  }

  animate() {
    if (this.ctx === undefined) return;
    requestAnimationFrame( () => this.animate() );

    if (this.controls) this.controls.update();
    this.render3d();
  }

  render3d() {
    if (this.ctx !== undefined) this.renderer.render(this.scene, this.ctx.camera);
  }

  createBackground(clr) {
    let geometry = new THREE.SphereBufferGeometry( 5000, 60, 40 );
    // geometry.scale( -1, 1, 1 );

    let material = new THREE.MeshBasicMaterial( {
      map: this.bgTex //new THREE.TextureLoader().load( '2294472375_24a3b8ef46_o.jpg' )
    });
    // let material = new THREE.MeshBasicMaterial({ color: clr || 0x00ffff });
    // material.depthTest = false;
    material.side = THREE.DoubleSide;
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
  }

  handleSubmit(e) {
    if (e) e.preventDefault();

    if (this.ctx) {
      // the generated context has an update convenience method which takes
      // transformation options and applies them to the plane
      this.ctx.update({
        translate: this.state.posString.split(',').map(s => parseFloat(s)),
        scale: this.state.scaleString.split(',').map(s => parseFloat(s)),
        rotation: this.state.rotString.split(',').map(s => parseFloat(s) / 180 * Math.PI)
      });

      // this.render3d();
      this.renderEqui();
    }
  }

  renderEqui(e) {
    if (e) e.preventDefault();

    if (this.ctx === undefined) {
      console.log('rendering context not initialized yet');
      return;
    }

    this.ctx.render();

    this.ctx.equi.canvas.toBlob((blob) => {
      this.setState({ equiBlobUrl: URL.createObjectURL(blob) });
    });
  }

  render() {
    const { equiBlobUrl } = this.state;
    return (
      <div className="App">
        <div className="three-scene"></div>

        {/* transform parameters form */}
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
            Rotation (deg):
            <input type="text" value={this.state.rotString} onChange={(e) => this.setState({ rotString: e.target.value }) } />
          </label>

          <input type="submit" value="Submit" />
          <input type="button" value="render equirectangular" onClick={(e) => this.renderEqui(e)}/>
      </form>

        {equiBlobUrl === undefined ? '' :
          <img src={equiBlobUrl} className="Equi-preview" alt="equirectangular" />}
      </div>
    );
  }
}

export default App;
