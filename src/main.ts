import * as THREE from "three";
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import Cow from "./cow";
import { random } from "./utils";

// Scene variables
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let clock: THREE.Clock;
let plane: THREE.Mesh;

let mouseX: undefined | number;
let mouseZ: undefined | number;

// Array for all animals
let animals: Cow[] = [];


let worldSize = 1000;

let gltfLoader = new GLTFLoader();  // Loader set to be a global variable because it is ued in onclick and onload callbacks.

let finishedLoading = false;    // Used to exit mousemove callback early when scene hasn't finished loading.

window.onload = function () {
    // create scene
    scene = new THREE.Scene();

    // Clock used to determine when movement should occur. Delta time is used so framerate won't affect performance.
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
    let planeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // Make the plane lie horizontal on the XZ ground plane
    plane.rotateX(Math.PI / 2);
    scene.add(plane);

    // Add cows
    for (let i = 0; i < 50; i++) {
        // World is centered at (0,0) so it extends in worldSIze/2 in all directions.
        let x = random(-worldSize/2, worldSize/2);
        let z = random(-worldSize/2, worldSize/2);

        let cow = new Cow(x, z, i, scene, gltfLoader);
        animals.push(cow);
    }

    // setup interaction
    controls = new OrbitControls(camera, renderer.domElement);

    // call animation/rendering loop
    animate();

    finishedLoading = true;
};

window.addEventListener("mousemove", (event) => {
    // If onload function hasn't finished, then exit early.
    if (!finishedLoading) return;

    const mouse = new THREE.Vector2();
    // Normalize values - this code is similar to assignment 3 torus world.
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // With vector 2 z will default to 0, placing it right on the camera.
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(plane);

    // When mouse position is undefined, animals will move naturally.
    if (intersects.length > 0) {
        mouseX = intersects[0].point.x;
        mouseZ = intersects[0].point.z;
    } else {
        mouseX = undefined;
        mouseZ = undefined;
    }
});

// Place cows!
window.addEventListener("mousedown", () => {
    console.log(animals);
    if (mouseX && mouseZ) {
        let cow = new Cow(mouseX, mouseZ, animals.length, scene, gltfLoader);
        animals.push(cow);
    }
})

function animate() {
    requestAnimationFrame(animate);

    // Change in delta time used to calculate movements.
    let deltaTime = clock.getDelta();

    animals.forEach((animal) => {
        animal.animate(deltaTime, mouseX, mouseZ);
    });

    controls.update();
    renderer.render(scene, camera);
}
