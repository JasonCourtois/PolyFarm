import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Cow from './cow.js'

// Scene variables
let renderer, controls, scene, camera;
// Array for all animals
let animals = [];

let worldSize = 200;

window.onload = function () {
  // create scene
  scene = new THREE.Scene();
  
  // setup the camera
  let fov = 75;
  let ratio = window.innerWidth / window.innerHeight;
  let zNear = 1;
  let zFar = 10000;
  camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
  camera.position.set(0, 150, 50);

  // create renderer and add canvas
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // setup lights
  let ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  let light = new THREE.DirectionalLight(0xffffff, 5.0);
  light.position.set(10, 100, 10);
  scene.add(light);

  let planeGeometry = new THREE.PlaneGeometry(worldSize, worldSize);
  let planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
  let plane = new THREE.Mesh(planeGeometry, planeMaterial);
  // Make the plane lie horizontal on the XZ ground plane
  plane.rotateX(Math.PI / 2);
  plane.position.y -= 10.1;
  scene.add(plane);

  // Add cow ()
  let cow = new Cow(scene, animals);

  // setup interaction
  controls = new OrbitControls(camera, renderer.domElement);

  // call animation/rendering loop
  animate();
};

function animate() {
  requestAnimationFrame(animate);
  animals.forEach(animal => {
    animal.animate();
    console.log(animal.cube.position);
   });
  controls.update();
  renderer.render(scene, camera);
}