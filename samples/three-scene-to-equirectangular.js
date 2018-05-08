var fs = require("fs");
// Assign this to global so that the subsequent modules can extend it:
// global.THREE = require("../lib/three.js");
global.THREE = require("three");
require("../lib/three-Projector.js");

var Canvas = require("canvas");
// var CubemapToEquirectangular = require('three.cubemap-to-equirectangular');
var CubemapToEquirectangular = require('../lib/three-CubemapToEquirectangular');
var glContext = require('gl')(1,1); //headless-gl

var equi;
var camera, scene, renderer;
var cubeCamera;
var radius = 100, theta = 0;

var window = {innerWidth: 800, innerHeight: 600};
// window.addEventListener( 'load', function() {
//   init();
//   animate();
// });

function init() {
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 1,1,1 );

  scene = new THREE.Scene();

  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );

  var geometry = new THREE.BoxBufferGeometry( 20, 20, 20 );

  for ( var i = 0; i < 2000; i ++ ) {

    var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

    object.position.x = Math.random() * 800 - 400;
    object.position.y = Math.random() * 800 - 400;
    object.position.z = Math.random() * 800 - 400;

    object.rotation.x = Math.random() * 2 * Math.PI;
    object.rotation.y = Math.random() * 2 * Math.PI;
    object.rotation.z = Math.random() * 2 * Math.PI;

    object.scale.x = Math.random() + 0.5;
    object.scale.y = Math.random() + 0.5;
    object.scale.z = Math.random() + 0.5;

    object.material.color.setRGB( object.position.x / 800 + .5, object.position.y / 800 + .5, object.position.z / 800 + .5 );

    scene.add( object );
  }

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
  var canvas = equi.updateAndGetCanvas( camera, scene );
  var out = fs.createWriteStream("./three-scene-equi.png");
  var canvasStream = canvas.pngStream();
  canvasStream.on("data", function (chunk) { out.write(chunk); });
  canvasStream.on("end", function () { console.log("done"); });
}

init();
render();
exportImage();
