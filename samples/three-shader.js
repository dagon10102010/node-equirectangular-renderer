var fs = require("fs");
var path = require("path");
var Canvas = require("canvas");
var glContext = require('gl')(1,1); //headless-gl
var THREE = require("three");
var CubemapToEquirectangular = require('../lib/three-CubemapToEquirectangular');

var camera, scene, renderer;
var teximage;
var equi;

var window = {innerWidth: 800, innerHeight: 600};

function init() {
  var canvasGL = new Canvas(window.innerWidth, window.innerHeight);
  canvasGL.addEventListener = function(event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()

  var canvasEqui = new Canvas(4096, 2048);
  // canvasEqui.addEventListener = function(event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()

  renderer = new THREE.WebGLRenderer( { context: glContext, antialias: true, canvas: canvasGL });
  equi = new CubemapToEquirectangular( renderer, true, { canvas: canvasEqui } );

  // load image from file system
  var imgData = fs.readFileSync(path.join(__dirname, 'UV_Grid_Sm.jpg'));
  teximage = new Canvas.Image();
  teximage.src = imgData;

  // camera
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 0,0,0 );
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // scene
  scene = new THREE.Scene();

  // shader
  var vertShader = 'varying vec2 vUv;\n\
      void main() {\n\
          vUv = uv;\n\
          gl_Position =   projectionMatrix *\n\
                          modelViewMatrix *\n\
                          vec4(position,1.0);\n\
      }';

  var fragShader = 'uniform sampler2D texture1;\n\
      varying vec2 vUv;\n\
      void main() {\n\
          gl_FragColor = texture2D(texture1, vUv); // Displays Nothing\n\
          // gl_FragColor = vec4(1.0, 1.0, 0.2, 1.0); // Works; Displays Flat Color\n\
      }';

  var uniforms = {
         texture1: { type: 't', value: texture }
     };

  // material
  material = new THREE.ShaderMaterial({
     uniforms: uniforms,
     vertexShader: vertShader,
     fragmentShader: fragShader
  });

  // texture
  var texture = new THREE.Texture(teximage);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set( 4, 4 );
  texture.matrixAutoUpdate = false; // set this to false to update texture.matrix manually

  // mesh
  var ball = new THREE.Mesh(new THREE.SphereGeometry(2, 30, 30), material);
  ball.position.z=-3;
  scene.add( ball );

  // light
  var light = new THREE.PointLight(0xFFFFFF);
  light.position.set(0, 0, );
  scene.add(light);
}

function render() {
  // renderer.render( scene, camera );
  // render scene to equirectangular canvas
  var canv = equi.updateAndGetCanvas(camera, scene);

  // DEBUG draw our texture image on top of the canvas for reference (verify image properly loaded)
  canv.getContext('2d').drawImage(teximage, 0, 0, 512, 512);
}

function renderAndExport(exportPath, delay) {
  var func = function(){
    console.log('rendering...');
    render();
    console.log('exporting...');
    exportImage(exportPath);
    console.log('done');
  };

  if (delay !== undefined) {
    console.log('waiting '+delay+' ms in case texture initialization takes time...');
    setTimeout(func, delay);
  } else {
    func();
  }
}

function exportImage(exportPath) {
  // write the equirectangular canvas to a png file
  var out = fs.createWriteStream(exportPath);
  var canvasStream = equi.canvas.pngStream();
  canvasStream.on("data", function (chunk) { out.write(chunk); });
  canvasStream.on("end", function () { console.log("done"); });
}

init();
renderAndExport('./three-shader.png');
