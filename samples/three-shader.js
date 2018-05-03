var fs = require("fs");
var path = require("path");
// Assign this to global so that the subsequent modules can extend it:
global.THREE = require("three");
require("../lib/three-Projector.js");
var Canvas = require("canvas");
// var CubemapToEquirectangular = require('three.cubemap-to-equirectangular');
var CubemapToEquirectangular = require('../lib/three-CubemapToEquirectangular');
var glContext = require('gl')(1,1); //headless-gl
var jpeg = require('jpeg-js');

var equi;
var camera, scene, renderer;
var cubeCamera;
var radius = 100, theta = 0;
var teximage;

var vertShader = 'varying vec2 vUv;\n\
\n\
    void main() {\n\
        vUv = uv;\n\
\n\
        gl_Position =   projectionMatrix *\n\
                        modelViewMatrix *\n\
                        vec4(position,1.0);\n\
    }';

var fragShader = '    uniform sampler2D texture1;\n\
\n\
    varying vec2 vUv;\n\
\n\
    void main() {\n\
        gl_FragColor = texture2D(texture1, vUv); // Displays Nothing\n\
        //gl_FragColor = vec4(0.5, 0.2, 1.0, 1.0); // Works; Displays Flat Color\n\
    }';

var window = {devicePixelRatio: 2, innerWidth: 800, innerHeight: 600};
// window.addEventListener( 'load', function() {
//   init();
//   animate();
// });

function init() {
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 0,0,0 );
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();


  scene = new THREE.Scene();

  var imgData = fs.readFileSync(path.join(__dirname, 'UV_Grid_Sm.jpg'));
  teximage = new Canvas.Image();
  teximage.src = imgData;

  var texture = new THREE.Texture(teximage);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set( 4, 4 );
  // texture.matrixAutoUpdate = false; // set this to false to update texture.matrix manually

  // untextured plane
  // var geometry = new THREE.PlaneGeometry( 20, 20, 32 );
  // var material = new THREE.MeshBasicMaterial( {color: 0xff00f0, side: THREE.DoubleSide} );
  // var plane = new THREE.Mesh( geometry, material );
  // plane.position.z = -3;
  // // plane.scale.set(2,2,2);
  // // plane.rotation.z = Math.PI / 4;
  // scene.add( plane );
  //
  // // textured plane
  // material = new THREE.MeshBasicMaterial({ map: texture });
  // // material = new THREE.MeshBasicMaterial();
  // plane = new THREE.Mesh(geometry, material );
  // plane.position.z = -2.8;
  // plane.scale.set(0.5,0.5,0.5);
  // // plane.rotation.y = Math.PI;
  // scene.add( plane );

  // Create Light
   var light = new THREE.PointLight(0xFFFFFF);
   light.position.set(0, 0, 500);
   scene.add(light);

   var uniforms = {
          texture1: { type: 't', value: 0, texture: texture }
      };

  material = new THREE.ShaderMaterial({
     uniforms: uniforms,
     vertexShader: vertShader,
     fragmentShader: fragShader
  });

  // material = new THREE.MeshBasicMaterial( {color: 0xff00ff, side: THREE.DoubleSide} );
  var ball = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 30), material);
  ball.position.z=-3;
  scene.add( ball );

  var canvas = new Canvas(window.innerWidth, window.innerHeight);
  canvas.addEventListener = function(event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()

  renderer = new THREE.WebGLRenderer( { context: glContext, antialias: true, canvas: canvas });

  equi = new CubemapToEquirectangular( renderer, true, { canvas: canvas } );
}

function render() {
  renderer.render( scene, camera );
}

function exportImage(exportPath) {
  var canv = equi.updateAndGetCanvas( camera, scene );
  canv.getContext('2d').drawImage(teximage, 0, 0, 512, 512);

  var out = fs.createWriteStream(exportPath);
  var canvasStream = canv.pngStream();
  canvasStream.on("data", function (chunk) { out.write(chunk); });
  canvasStream.on("end", function () { console.log("done"); });
}

init();
render();
exportImage('./three-shader.png');
