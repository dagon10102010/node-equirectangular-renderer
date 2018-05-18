const { createTexturedPlaneRenderer } = require('../index');

createTexturedPlaneRenderer({image: __dirname+'/UV_Grid_Sm.jpg', verbose: true, resolution: [1024,512], scale: [1,0.5,0.5]}).then(function(ctx) {
  // for(var i=0; i<3; i+=1) {
  //   ctx.update({translate: [0,0,-5*i], rotation: [0,0,i]});
  //   ctx.render();
  //   ctx.exportImage("./three-plane-equi-"+i+".png");
  // }
  var func = function(i) {
    ctx.update({translate: [0,0,-3*(i+1)], rotation: [0,0.5*i,i*0.3]});
    ctx.render();
    var p = "./texturedPlaneRenderer-"+i+".png";
    console.log('Exporting to: ', p);
    ctx.exportImage(p);
  }

  console.log('scheduling frame renders...');
  setTimeout(function(){ func(0); }, 0000);
  setTimeout(function(){ func(1); }, 1000);
  setTimeout(function(){ func(2); }, 2000);
  // setTimeout(function(){ func(3); }, 3010);
  // setTimeout(function(){ func(4); }, 4010);

  // ctx.render();
  // ctx.exportImage("./three-plane-equi.png");, ctx.equi.canvas);
  // ctx.exportImage("./three-plane-equi.png");
});
