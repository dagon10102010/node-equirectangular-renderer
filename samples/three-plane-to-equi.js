var fs = require("fs");
var path = require("path");
var Canvas = require("canvas");
var glContext = require('gl')(1,1); //headless-gl
var THREE = require("three");
var CubemapToEquirectangular = require('../lib/three-CubemapToEquirectangular');

var equi, camera, scene, renderer, teximage;

var window = {innerWidth: 800, innerHeight: 600};
var LOAD_TEXTURE_USING_HTTP = false;

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
  // GL scene renderer
  var canvasGL = new Canvas(window.innerWidth, window.innerHeight);
  canvasGL.addEventListener = function(event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()
  renderer = new THREE.WebGLRenderer( { context: glContext, antialias: true, canvas: canvasGL });

  // Equirectangular renderer
  var canvasEqui = new Canvas(4096, 2048);
  equi = new CubemapToEquirectangular( renderer, true, { canvas: canvasEqui} );

  // camera
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 1,1,1 );
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // load image from filesystem
  var imgData = fs.readFileSync(path.join(__dirname, 'UV_Grid_Sm.jpg'));
  teximage = new Canvas.Image();
  teximage.src = imgData;

  // scene
  scene = new THREE.Scene();

  // untextured purple plane
  var geometry = new THREE.PlaneGeometry( 10, 20, 32 );
  var material = new THREE.MeshBasicMaterial( {color: 0xff00f0, side: THREE.DoubleSide} );
  var plane = new THREE.Mesh( geometry, material );
  plane.position.z = -3;
  scene.add( plane );

  // texture
  var texture = new THREE.Texture(teximage);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set( 4, 4 );
  // texture.matrixAutoUpdate = false; // set this to false to update texture.matrix manually
  texture.needsUpdate = true;

  // textured plane (shows up transparent)
  material = new THREE.MeshBasicMaterial({ map: texture });
  // material = new THREE.MeshBasicMaterial();
  plane = new THREE.Mesh(geometry, material );
  plane.position.z = -2.8;
  plane.scale.set(0.5,0.5,0.5);
  scene.add( plane );

  // // load texture using HTTP request, also doesn't work but makes the textured plane white
  if (LOAD_TEXTURE_USING_HTTP) {
    loadTextureHTTP('http://localhost:8000/UV_Grid_Sm.jpg', function(tex) {
      console.log('http done');
      material.map = tex;
      tex.matrix.identity();

      renderAndExport("./three-plane-equi.png", 3000);
    });
  }

  // light
  scene.add( new THREE.HemisphereLight( 0x443333, 0x222233, 4 ) );
}

function render() {
  // renderer.render( scene, camera );
  var canv = equi.updateAndGetCanvas( camera, scene );

  // overlay texture's source image on the canvas to verify image was loaded properly
  canv.getContext('2d').drawImage(teximage, 0, 0, 1024, 512);
}

function exportImage(exportPath) {
  var out = fs.createWriteStream(exportPath);
  var canvasStream = equi.canvas.pngStream();
  canvasStream.on("data", function (chunk) { out.write(chunk); });
  canvasStream.on("end", function () { console.log("done"); });
}

function renderAndExport(exportPath, delay) {
  var func = function() {
    console.log('rendering...');
    render();
    console.log('exporting...');
    exportImage(exportPath);
    console.log('done');
  };

  if (delay !== undefined) {
    console.log('waiting '+delay+' ms in case texture initialization takes time...');
    setTimeout(function(){ func(); }, delay);
  } else {
    func();
  }
}

init();
if (!LOAD_TEXTURE_USING_HTTP) {
  renderAndExport("./three-plane-equi.png", 3000);
}
