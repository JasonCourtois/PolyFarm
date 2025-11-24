import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

var renderer, controls, scene, camera;

window.onload = function () {
  // create scene
  scene = new THREE.Scene();
  
  // setup the camera
  var fov = 75;
  var ratio = window.innerWidth / window.innerHeight;
  var zNear = 1;
  var zFar = 10000;
  camera = new THREE.PerspectiveCamera(fov, ratio, zNear, zFar);
  camera.position.set(0, 0, 100);

  // create renderer and add canvas
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  //.. setup lights
  var ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  var light = new THREE.DirectionalLight(0xffffff, 5.0);
  light.position.set(10, 100, 10);
  scene.add(light);

  // configure cube
  var geometry = new THREE.BoxGeometry(20, 20, 20);
  var material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  var cube = new THREE.Mesh(geometry, material);

  // add it to the scene
  scene.add(cube);

  // setup interaction
  controls = new OrbitControls(camera, renderer.domElement);

  // call animation/rendering loop
  animate();
};

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}