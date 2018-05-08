var fs = require("fs");
var Promise = require('promise');
var Canvas = require("canvas");
var glContext = require('gl')(1,1); //headless-gl
var THREE = require("three");
var CubemapToEquirectangular = require('../lib/three-CubemapToEquirectangular');
var getPixels = require("get-pixels");

function createTexturedPlaneRenderingContext(opts) {
  return new Promise(function (resolve, reject) {
    var winW = opts.winWidth || 1280; // not sure if these matter?
    var winH = opts.winHeight || 720;
    var resolution = opts.resolution || [opts.width || 4096, opts.height || 2048];

    // GL scene renderer
    var canvasGL = new Canvas(winW, winH);
    canvasGL.addEventListener = function(event, func, bind_) {}; // mock function to avoid errors inside THREE.WebGlRenderer()
    var renderer = new THREE.WebGLRenderer( { context: glContext, antialias: true, canvas: canvasGL });

    // Equirectangular renderer
    var canvasEqui = new Canvas(resolution[0], resolution[1]);
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
    plane.scale.set(0.6,0.6,1);

    // load texture data (image) async and resolve/reject promise
    getPixels(__dirname+"/UV_Grid_Sm.jpg", function(err, pixels) {
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

createTexturedPlaneRenderingContext({resolution: [1024,512], scale: [1,0.5,0.5]}).then(function(ctx) {
  // for(var i=0; i<3; i+=1) {
  //   ctx.update({translate: [0,0,-5*i], rotation: [0,0,i]});
  //   ctx.render();
  //   ctx.exportImage("./three-plane-equi-"+i+".png");
  // }
  var func = function(i) {
    ctx.update({translate: [0,0,-3*(i+1)], rotation: [0,0.5*i,i*0.3]});
    ctx.render();
    var p = "./three-plane-equi-"+i+".png";
    console.log('Exporting to: ', p);
    ctx.exportImage(p);
  }

  setTimeout(function(){ func(0); }, 10);
  setTimeout(function(){ func(1); }, 1010);
  setTimeout(function(){ func(2); }, 2010);
  setTimeout(function(){ func(3); }, 3010);
  setTimeout(function(){ func(4); }, 4010);

  // ctx.render();
  // ctx.exportImage("./three-plane-equi.png");, ctx.equi.canvas);
  // ctx.exportImage("./three-plane-equi.png");
});
