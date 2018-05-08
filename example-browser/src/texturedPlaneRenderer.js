var fs = require("fs");
var Promise = require('promise');
var THREE = require("three");
var CubemapToEquirectangular = require('./three-CubemapToEquirectangular');
var getPixels = require("get-pixels");

function createTexturedPlaneRenderer(opts) {
  return new Promise(function (resolve, reject) {
    var winW = opts.winWidth || 1280; // not sure if these matter?
    var winH = opts.winHeight || 720;
    var resolution = opts.resolution || [opts.width || 4096, opts.height || 2048];
    var imageurl = opts.image;

    var renderer;
    var canvasEqui;

    if (process.browser) {
      renderer = new THREE.WebGLRenderer( { antialias: true });
    } else {
      var Canvas = require("canvas");
      var glContext = require('gl')(1,1); //headless-gl

      // GL scene renderer
      var canvasGL = new Canvas(winW, winH);
      canvasGL.addEventListener = function(event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()
      renderer = new THREE.WebGLRenderer( { context: glContext, antialias: true, canvas: canvasGL });

      canvasEqui = new Canvas(resolution[0], resolution[1]);
    }

    // Equirectangular renderer
    var equi = new CubemapToEquirectangular( renderer, true, {canvas: canvasEqui, width: resolution[0], height: resolution[1]} );

    // camera
    var camera = new THREE.PerspectiveCamera( 70, winW / winH, 1, 10000 );
    camera.position.set( 0,0,0 );
    camera.updateProjectionMatrix();

    // scene; one plane
    var scene = new THREE.Scene();
    var geometry = new THREE.PlaneGeometry( 10, 20, 1, 1 );
    var material = new THREE.MeshBasicMaterial();
    var plane = new THREE.Mesh(geometry, material );

    // texture
    var texture = new THREE.Texture();
    texture.wrapS = THREE.RepeatWrapping; // THREE.ClampToEdgeWrapping // THREE.MirroredRepeatWrapping
    texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set( 4, 4 );
    // texture.matrixAutoUpdate = false; // set this to false to update texture.matrix manually
    // texture.needsUpdate = true;
    scene.add( plane );

    // transformations
    var updateFunc = function(options) {
      var translate = options.translate || [0,0,0];
      var scale = options.scale || [1,1,1];
      var rotation = options.rotation || [0,0,0];
      plane.position.set(translate[0], translate[1], translate[2]);
      plane.scale.set(scale[0], scale[1], scale[2]);
      plane.rotation.set(rotation[0], rotation[1], rotation[2]);
    }

    updateFunc(opts);

    // plane.position.z = -5.8;
    plane.scale.set(1,1,1);

    // load texture data (image) async and resolve/reject promise
    getPixels(imageurl, function(err, pixels) {
      if(err) {
        reject(err);
        return;
      }

      var texture = new THREE.DataTexture( new Uint8Array(pixels.data), pixels.shape[0], pixels.shape[1], THREE.RGBAFormat );
      texture.needsUpdate = true;
      material.map = texture;

      resolve({
        equi: equi,
        camera: camera,
        scene: scene,
        renderer: renderer,

        render: function() { equi.updateAndGetCanvas( camera, scene ); },

        exportImage: function(exportPath) {
          var out = fs.createWriteStream(exportPath);
          var canvasStream = equi.canvas.pngStream();
          canvasStream.on("data", function (chunk) { out.write(chunk); });
          // canvasStream.on("end", function () { console.log("done"); });
        },
        update: updateFunc
      });
    });
  });
}

module.exports = createTexturedPlaneRenderer;
