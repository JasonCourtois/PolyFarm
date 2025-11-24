import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Cow from "./cow";

// Scene variables
let renderer:THREE.WebGLRenderer
let controls:OrbitControls
let scene:THREE.Scene
let camera:THREE.PerspectiveCamera;
let clock:THREE.Clock;

// Array for all animals
let animals: Cow[] = [];

let worldSize = 200;

window.onload = function () {
  // create scene
  scene = new THREE.Scene();
  
  clock = new THREE.Clock();

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
  let cow = new Cow(0, scene, animals);
  let cow2 = new Cow(1, scene, animals);
  // setup interaction
  controls = new OrbitControls(camera, renderer.domElement);

  // call animation/rendering loop
  animate();
};

function animate() {
  requestAnimationFrame(animate);
  
  // Change in delta time used to calculate movements.
  let deltaTime = clock.getDelta();

  animals.forEach(animal => {
    animal.animate(deltaTime);
  });
  
  controls.update();
  renderer.render(scene, camera);
}