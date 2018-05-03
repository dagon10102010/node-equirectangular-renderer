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

// http://stackoverflow.com/a/14855016/2207790
var loadTextureHTTP = function (url, callback) {
  require('request')({
    method: 'GET', url: url, encoding: null
  }, function(error, response, body) {
    if(error) throw error;

    console.log('body:', body.length);

    var image = new Canvas.Image;
    image.src = body;

    var texture = new THREE.Texture(image);
    texture.needsUpdate = true;

    teximage = image;
    if (callback) callback(texture);
  });
};

function init() {
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 1,1,1 );

  scene = new THREE.Scene();


  // untextured plane
  var geometry = new THREE.PlaneGeometry( 5, 20, 32 );
  var material = new THREE.MeshBasicMaterial( {color: 0xff00f0, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.position.z = -3;
  // plane.scale.set(2,2,2);
  // plane.rotation.z = Math.PI / 4;
  scene.add( plane );

  // textured plane
  material = new THREE.MeshBasicMaterial({ map: texture });
  // material = new THREE.MeshBasicMaterial();
  plane = new THREE.Mesh(geometry, material );
  plane.position.z = -2.8;
  plane.scale.set(0.5,0.5,0.5);
  // plane.rotation.y = Math.PI;
  scene.add( plane );

  // loadTextureHTTP('http://localhost:8000/UV_Grid_Sm.jpg', function(tex) {
  //   console.log('http done');
  //   material.map = tex;
  //   tex.matrix.identity().translate(-0.435, -0.235).scale(2.2,2.2);
  //   exportImage();
  // });

  var imgData = fs.readFileSync(path.join(__dirname, 'UV_Grid_Sm.jpg'));
  teximage = new Canvas.Image();
  teximage.src = imgData;

  var texture = new THREE.Texture(teximage);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set( 4, 4 );
  // texture.matrixAutoUpdate = false; // set this to false to update texture.matrix manually
  material.map = texture;




  // teximage.onload = () => {
  //   console.log('teximage.onload');
  //     plane.material.map = new THREE.Texture(teximage);
  //     plane.material.map.needsUpdate = true;
  // }
  // teximage.src = imgData;

  // var API = {
  //   offsetX: 0,
  //   offsetY: 0,
  //   repeatX: 0.25,
  //   repeatY: 0.25,
  //   rotation: Math.PI / 4, // positive is counter-clockwise
  //   centerX: 0.5,
  //   centerY: 0.5
  // };
  //
  // texture.matrix
  //   .identity()
  //   .translate( - API.centerX, - API.centerY )
  //   .rotate( API.rotation )					// I don't understand how rotation can preceed scale, but it seems to be required...
  //   .scale( API.repeatX, API.repeatY )
  //   .translate( API.centerX, API.centerY )
  //   .translate( API.offsetX, API.offsetY );

  scene.add( new THREE.HemisphereLight( 0x443333, 0x222233, 4 ) );


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
// exportImage();
