import React, { Component } from 'react';
import './App.css';
// import createTexturedPlaneRenderer from './texturedPlaneRenderer';
import { createTexturedPlaneRenderer } from 'equirectangular-renderer';

class App extends Component {

  constructor(opts) {
    super(opts);

    this.state = {
      equiBlobUrl: undefined,
      posString: '0,0,-20',
      scaleString: '1,1,1',
      rotString: '0,0,0'
    };
  }

  componentDidMount() {
    createTexturedPlaneRenderer({image: 'UV_Grid_Sm.jpg', resolution: [1024,512], translate: [0,0,-20], scale: [1,0.5,0.5]})
    .then((ctx) => {
      // console.log('createTexturedPlaneRenderer done: ', ctx);

      this.ctx = ctx;
      this.ctx.renderer.setSize(window.innerWidth, 300);

      const el = document.getElementsByClassName('three-scene')[0];
      el.appendChild(this.ctx.renderer.domElement);

      // this.animate();
      this.render3d();
      this.renderEqui();
    })
    .catch((err) => {
      console.log('createTexturedPlaneRenderer err:', err);
    });
  }

  // animate() {
  //   if (this.ctx === undefined) return;
  //   requestAnimationFrame( () => this.animate() );
  //   this.render3d();
  // }

  render3d() {
    if (this.ctx !== undefined) this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
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

      this.render3d();
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
