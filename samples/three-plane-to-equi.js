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

var window = {devicePixelRatio: 2, innerWidth: 800, innerHeight: 600};
// window.addEventListener( 'load', function() {
//   init();
//   animate();
// });

function init() {
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 1,1,1 );

  scene = new THREE.Scene();

  var imgData = fs.readFileSync(path.join(__dirname, 'UV_Grid_Sm.jpg'));
  // see https://stackoverflow.com/questions/39577911/alternative-to-new-image-of-browser-implementation-into-node-webgl-javascrip
  teximage = new Canvas.Image;
  teximage.src = imgData;

  var texture = new THREE.Texture(teximage, 512, 512);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set( 4, 4 );
  texture.matrixAutoUpdate = false; // set this to false to update texture.matrix manually

  // add plane to scene
  var geometry = new THREE.PlaneGeometry( 5, 20, 32 );
  var material = new THREE.MeshBasicMaterial( {color: 0xff00f0, map_DISABLED: texture, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );

  plane.position.z = -3;
  plane.scale.set(2,2,2);
  plane.rotation.z = Math.PI / 4;

  scene.add( plane );


  var canvas = new Canvas(window.innerWidth, window.innerHeight);
  canvas.addEventListener = function(event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()
  renderer = new THREE.WebGLRenderer( { context: glContext, antialias: true, canvas: canvas });

  equi = new CubemapToEquirectangular( renderer, true, { canvas: canvas} );

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function render() {
  renderer.render( scene, camera );
}

function exportImage() {
  var canv = equi.updateAndGetCanvas( camera, scene );
  canv.getContext('2d').drawImage(teximage, 0, 0, 1024, 512);

  var out = fs.createWriteStream("./three-plane-equi.png");
  var canvasStream = canv.pngStream();
  canvasStream.on("data", function (chunk) { out.write(chunk); });
  canvasStream.on("end", function () { console.log("done"); });
}

init();
render();
exportImage();
