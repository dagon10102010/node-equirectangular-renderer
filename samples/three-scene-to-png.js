// Assign this to global so that the subsequent modules can extend it:
// global.THREE = require("../lib/three.js");
global.THREE = require("three")
require("../lib/three-CanvasRenderer.js");
require("../lib/three-Projector.js");

var fs = require("fs");
var Canvas = require("canvas");

var w = 200;
var h = 200;

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(70, 1, 1, 10000);
camera.position.y = 150;
camera.position.z = 400;

var geometry = new THREE.BoxGeometry(200, 200, 200);
for ( var i = 0; i < geometry.faces.length; i += 2 ) {
    var hex = Math.random() * 0xffffff;
    geometry.faces[ i ].color.setHex( hex );
    geometry.faces[ i + 1 ].color.setHex( hex );
}

var material = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );

cube = new THREE.Mesh(geometry, material);
cube.position.y = 150;
cube.rotation.y = 45;
scene.add(cube);

var geometry = new THREE.PlaneBufferGeometry( 200, 200 );
geometry.rotateX( - Math.PI / 2 );

var material = new THREE.MeshBasicMaterial( { color: 0xe0e0e0, overdraw: 0.5 } );

plane = new THREE.Mesh( geometry, material );
scene.add( plane );

var canvas = new Canvas(w, h);
canvas.style = {}; // dummy shim to prevent errors during render.setSize
var renderer = new THREE.CanvasRenderer({
    canvas: canvas
});

renderer.setClearColor(0xffffff, 0);
renderer.setSize(200, 200);

renderer.render(scene, camera);

var out = fs.createWriteStream("./three-scene-to.png");
var canvasStream = canvas.pngStream();
canvasStream.on("data", function (chunk) { out.write(chunk); });
canvasStream.on("end", function () { console.log("done"); });
