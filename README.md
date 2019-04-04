# node-equirectangular-renderer

Tool for rendering [equirectangular](https://en.wikipedia.org/wiki/Equirectangular_projection) images (360˚ images, suitable for VR applications)
by blending together various layers of static images, like backgrounds and masks, as well as THREE.js scenes with 3D objects.

### Prepare system
* make sure `node`, `npm` and `yarn` are installed
* On Ubuntu you might need to install libgif headers: `sudo apt-get install libgif-dev`

### Install
```bash
yarn
```

### Example application

See the ```example-browser``` folder for an in-browser example. The application was created using [Create React App](https://github.com/facebookincubator/create-react-app), see its [README.md](example-browser/README.md) for instructions.

***TL;DR***

```cd``` into the ```example-browser``` folder and run;
* ```yarn``` to install dependencies
* ```npm start``` to run the dev server (also opens a browser window)


### Run test script
```
npm run testframes
```

This should generate a couple of .png frames in this folder
