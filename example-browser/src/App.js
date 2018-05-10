import React, { Component } from 'react';
import * as THREE from 'three';
import OrbitControlsPatcher from 'three-orbit-controls';
import DatGui, { DatNumber, DatBoolean /*, DatFolder, DatButton, DatString */ } from 'react-dat-gui';
import '../node_modules/react-dat-gui/build/react-dat-gui.css';
import { createTexturedPlaneRenderer } from 'equirectangular-renderer';
import localEqui from '../node_modules/equirectangular-renderer/lib/three-CubemapToEquirectangular';
import './App.css';
import './ContextBlender'; // adds blendTo method to Canvas' 2d contexts

// apply OrbitControls 'patch' to our THREE intance, so it's available from there
const OrbitControls = OrbitControlsPatcher(THREE);

class App extends Component {

  constructor(opts) {
    super(opts);
    window.appp = this;

    this.state = {
      params: {
        translateX: -90, translateY: -99, translateZ: -5.6,
        scaleX: 10, scaleY: 10, scaleZ: 1,
        rotateX: -88, rotateY: 7, rotateZ: -7,
        bg3d: false,
        bg2d: false,
      },
      equiBlobUrl: undefined,
      liveEquiDelay: 100
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
      this.bg = this.createBackground();
      this.plane = this.scene.children[0]; // for now

      document.addEventListener('keydown', (e) => this.onKeyDown(e));

      if (OrbitControls) {

        this.controls = new OrbitControls(this.ctx.camera, this.renderer.domElement);
        this.controls.update();
        this.controls.target.z = -0.1;  // for some reason the OrbitControls don't work without this
        this.controls.target.x = -0.2;

      } else {
        console.log('OrbitControls not available!');
      }

      this.animate();

      this.onParamsChange(this.state.params);
      // this.render3d();
      // this.renderEqui();
    })
    .catch((err) => {
      console.log('createTexturedPlaneRenderer err:', err);
    });

    this.layerBlender2d = document.getElementById('layerBlender2d');
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
    if (e.key === '9' && this.ctx) {
      const { params } = this.state;
      params.bg3d = !params.bg3d;
      this.onParamsChange(params);
    }

    if (e.key === '/') {
      const { params } = this.state;
      params.bg2d = !params.bg2d;
      this.onParamsChange(params);
    }
  }

  animate() {
    if (this.ctx === undefined) return;
    requestAnimationFrame( () => this.animate() );

    if (this.controls) this.controls.update();
    this.render3d();
  }

  render3d() {
    if (this.ctx !== undefined) this.renderer.render(this.scene, this.ctx.camera);

    // if (this.ctx !== undefined) this.renderer.render(this.ctx.scene, this.ctx.camera);
    // if (this.ctx !== undefined) this.renderer.render(this.scene, this.ctx.camera);
  }

  createBackground(clr) {
    let geometry = new THREE.SphereBufferGeometry( 5000, 60, 40 );
    geometry.scale( -1, 1, 1 );

    let material = new THREE.MeshBasicMaterial( {
      map: this.bgTex //new THREE.TextureLoader().load( '2294472375_24a3b8ef46_o.jpg' )
    });
    // let material = new THREE.MeshBasicMaterial({ color: clr || 0x00ffff });
    // material.depthTest = false;
    material.side = THREE.DoubleSide;
    let mesh = new THREE.Mesh( geometry, material );
    return mesh;
  }

  renderEqui(e) {
    if (e) e.preventDefault();

    if (this.ctx === undefined) {
      console.log('rendering context not initialized yet');
      return;
    }

    if (this.equi === undefined)
      this.equi = new localEqui( this.renderer, true, {width: 2048, height: 1024} );

    var canvas = this.equi.updateAndGetCanvas(this.ctx.camera, this.scene);
    // this.ctx.render();
    // this.ctx.equi.canvas.toBlob((blob) => {
    canvas.toBlob((blob) => {
      this.setState({ equiBlobUrl: URL.createObjectURL(blob) });
    });

    this.lastCanvas = canvas;
    if (this.layerBlender2d && canvas.width) {
      var target2d = this.layerBlender2d.getContext('2d');
      target2d.clearRect(0,0,this.layerBlender2d.width, this.layerBlender2d.height);

      // console.log('Blending t')
      try {
        canvas.getContext('2d').blendOnto(target2d, 'normal');
      } catch (err) {
        console.log('caught error: ', err);
      }
    }
  }

  onParamsChange(params) {
    if (this.ctx) {
      // console.log('Updating plane pos: ', [params.translateX, params.translateY, params.translateZ]);
      // this.ctx.update({
        // translate: [params.translateX, params.translateY, params.translateZ]
      // });
      this.plane.position.set(params.translateX, params.translateY, params.translateZ);
      this.plane.scale.set(params.scaleX, params.scaleY, params.scaleZ);
      this.plane.rotation.set(params.rotateX/180*Math.PI, params.rotateY/180*Math.PI, params.rotateZ/180*Math.PI);

    }

    this.addToScene(this.bg, undefined, params.bg3d);

    this.setState({ params });

    if (this.liveEquiTimeout !== undefined) clearTimeout(this.liveEquiTimeout);
    this.liveEquiTimeout = setTimeout(() => this.renderEqui(), this.state.liveEquiDelay);
  }

  render() {
    const { equiBlobUrl, params } = this.state;

    return (
      <div className="App">
        <DatGui data={params} onUpdate={(params) => this.onParamsChange(params)}>
          {/* <DatFolder title="plane transform"> */}
            <DatNumber path='translateX' label='translate-x' min={-1000} max={1000} step={0.1} />
            <DatNumber path='translateY' label='translate-y' min={-1000} max={1000} step={0.1} />
            <DatNumber path='translateZ' label='translate-z' min={-1000} max={1000} step={0.1} />

            <DatNumber path='scaleX' label='scale-x' min={-100} max={100} step={0.01} />
            <DatNumber path='scaleY' label='scale-y' min={-100} max={100} step={0.01} />
            {/* <DatNumber path='scaleZ' label='scale-z' min={-10} max={10} step={0.01} /> */}

            <DatNumber path='rotateX' label='rotate-x' min={-360} max={360} step={1} />
            <DatNumber path='rotateY' label='rotate-y' min={-360} max={360} step={1} />
            <DatNumber path='rotateZ' label='rotate-z' min={-360} max={360} step={1} />
          {/* </DatFolder> */}

          <DatBoolean path='bg3d' label='3d background' />
          <DatBoolean path='bg2d' label='2d background' />
        </DatGui>
        <h1>Three.js 3d Scene</h1>
        <div className="three-scene"></div>

        <h1>Layered Images</h1>
        <div className="equi-preview" style={params.bg2d && this.bgTex ? {backgroundImage: 'url('+this.bgTex.image.src+')'} : {}}>
          {equiBlobUrl === undefined ? '' :
            <img src={equiBlobUrl} className="equi-render" alt="equirectangular" />}
        </div>

        <h1>Blended Canvas layers</h1>
        <div id="layerBlender2dWrapper">
          <canvas id="layerBlender2d" width="2048" height="1024" />
        </div>
      </div>
    );
  }
}

export default App;
