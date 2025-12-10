import * as THREE from "three";
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import Cow from "./cow";
import ClickAnimation from "./ClickAnimation";
import { random } from "./utils";

// Scene variables
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let clock: THREE.Clock;
let grassPlane: THREE.Mesh;

let mouseX: undefined | number;
let mouseZ: undefined | number;

// Array for all animals
let animals: Cow[] = [];

let clickAnimations: ClickAnimation[] = [];

let worldSize = Number(import.meta.env.VITE_WORLDSIZE) || 1;

if (worldSize == 1) console.log("Unable to find world size in .env file");

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
    camera.position.set(100, 600, 0);

    // Set skybox color
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

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

    // Setup plane for ground with texture.
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load("/PolyFarm/textures/Grass Texture.png");
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.magFilter = THREE.NearestFilter;
    grassTexture.minFilter = THREE.NearestFilter;
    grassTexture.colorSpace = THREE.SRGBColorSpace;

    grassTexture.repeat.set(worldSize/20, worldSize/20);


    let planeGeometry = new THREE.PlaneGeometry(worldSize, worldSize);
    let grassPlaneMaterial = new THREE.MeshBasicMaterial({ map: grassTexture, side: THREE.DoubleSide });
    grassPlane = new THREE.Mesh(planeGeometry, grassPlaneMaterial);

    // Make the plane lie horizontal on the XZ ground plane
    grassPlane.rotateX(Math.PI / 2);
    scene.add(grassPlane);

    // Setup dirt walls around 
    const dirtTexture = textureLoader.load("/PolyFarm/textures/Dirt Texture.png");
    dirtTexture.wrapS = THREE.RepeatWrapping;
    dirtTexture.wrapT = THREE.RepeatWrapping;
    dirtTexture.magFilter = THREE.NearestFilter;
    dirtTexture.minFilter = THREE.NearestFilter;
    dirtTexture.colorSpace = THREE.SRGBColorSpace;

    dirtTexture.repeat.set(worldSize/20, worldSize/20);


    let dirtPlaneMaterial = new THREE.MeshBasicMaterial({ map: dirtTexture, side: THREE.DoubleSide});

    for (let i = 0; i < 5; i++) {
        const dirtPlane = new THREE.Mesh(planeGeometry, dirtPlaneMaterial);
        dirtPlane.translateY(- (worldSize / 2));
        
        switch (i) {
            case 0:
                dirtPlane.translateZ(worldSize / 2);
                break;
            case 1:
                dirtPlane.translateZ(- (worldSize / 2));
                break;
            case 2:
                dirtPlane.translateX(worldSize / 2);
                dirtPlane.rotateY(Math.PI / 2);
                break;
            case 3:
                dirtPlane.translateX(- (worldSize / 2));
                dirtPlane.rotateY(Math.PI / 2);
                break;
            case 4:
                dirtPlane.translateY(- (worldSize / 2));
                dirtPlane.rotateX(Math.PI / 2);
                break;  
        }

        scene.add(dirtPlane);
    }

    // Add cows
    for (let i = 0; i < 25; i++) {
        // World is centered at (0,0) so it extends in worldSIze/2 in all directions.
        // modifier of 200 to prevent animals spawning right at edge of world.
        let x = random((-worldSize/2) + 200, (worldSize/2) - 200);
        let z = random((-worldSize/2) + 200, (worldSize/2) - 200);

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

    const intersects = raycaster.intersectObject(grassPlane);

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
    if (mouseX && mouseZ) {
        let hue = random(0, 360);

        let cow = new Cow(mouseX, mouseZ, animals.length, scene, gltfLoader, hue);
        animals.push(cow);

        let click  = new ClickAnimation(mouseX, mouseZ, scene, hue);
        clickAnimations.push(click);
    }
})

function animate() {
    requestAnimationFrame(animate);

    // Change in delta time used to calculate movements.
    let deltaTime = clock.getDelta();

    // Animate each animal.
    animals.forEach((animal) => {
        animal.animate(deltaTime, mouseX, mouseZ);
    });

    // Animate each click animation.
    clickAnimations.forEach((clickAnimation) => {
        clickAnimation.animate(deltaTime);
    });

    // Filter out any items that are ready to be deleted
    clickAnimations = clickAnimations.filter(animation => !animation.deleteItem)

    controls.update();
    renderer.render(scene, camera);
}
