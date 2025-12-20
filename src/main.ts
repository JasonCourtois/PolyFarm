import * as THREE from "three";
import { GLTFLoader, OrbitControls } from "three/examples/jsm/Addons.js";
import Cow from "./Cow";
import Pig from "./Pig";
import Animal from "./Animal";
import { initializeGrass, loadGrass } from "./Grass";
import ClickAnimation from "./ClickAnimation";
import { random, type SceneInfo } from "./utils";
import { Tweakpane } from "./Tweakpane";
import LoadScreen from "./LoadScreen";
import HoverAnimation from "./HoverAnimation";

// Scene variables
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let clock: THREE.Clock;
let grassPlane: THREE.Mesh;
let worldSize = Number(import.meta.env.VITE_WORLDSIZE) || 1;
if (worldSize == 1) console.log("Unable to find world size in .env file");

// Mouse position
let mouseX: undefined | number;
let mouseZ: undefined | number;

// User input settings
let pane = new Tweakpane();

// Object array for animals and animations
let animals: Animal[] = [];
let clickAnimations: ClickAnimation[] = [];
let gltfLoader = new GLTFLoader();
let hoverAnimation: HoverAnimation;

// Tracks how many animals should be in the scene, as well as how many have been fully loaded.
// These variables are put in an object so they can be passed by reference.
let sceneInfo: SceneInfo = {
    animalCount: 50,
    grassCount: 380,
    loadedCount: 0,
};

let loader = new LoadScreen(sceneInfo, pane);

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

    // Set skybox color - shouldn't actually be seen in final product.
    scene.background = new THREE.Color(0x87ceeb); // Sky blue

    // create renderer and add canvas
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;

    // setup lights
    let ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    let light = new THREE.DirectionalLight(0xffffff, 5.0);
    light.position.set(0, 100, 0);
    light.castShadow = true;

    // Configure shadow camera to cover the entire world
    light.shadow.camera.left = -worldSize / 2;
    light.shadow.camera.right = worldSize / 2;
    light.shadow.camera.top = worldSize / 2;
    light.shadow.camera.bottom = -worldSize / 2;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 100 + worldSize / 2 + 50;

    // Increase shadow map resolution for better quality
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;

    scene.add(light);

    // Setup plane for ground with texture.
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load("/PolyFarm/plane textures/Grass Texture.png");
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.magFilter = THREE.NearestFilter;
    grassTexture.minFilter = THREE.NearestFilter;
    grassTexture.colorSpace = THREE.SRGBColorSpace;

    grassTexture.repeat.set(worldSize / 20, worldSize / 20);

    let planeGeometry = new THREE.PlaneGeometry(worldSize, worldSize);
    let grassPlaneMaterial = new THREE.MeshStandardMaterial({
        map: grassTexture,
        side: THREE.DoubleSide,
        color: 0x8db558,
    }); // Green color added to darken the grass texture from the directional light.
    grassPlane = new THREE.Mesh(planeGeometry, grassPlaneMaterial);

    // Make the plane lie horizontal on the XZ ground plane
    grassPlane.rotateX(Math.PI / 2);

    grassPlane.receiveShadow = true;
    scene.add(grassPlane);

    // Create 8 extra planes the user cannot interact with to cover background.
    for (let i = 0; i < 8; i++) {
        const visualGrassPlane = new THREE.Mesh(planeGeometry, grassPlaneMaterial);
        switch (i) {
            case 0:
                visualGrassPlane.translateZ(worldSize);
                break;
            case 1:
                visualGrassPlane.translateZ(-worldSize);
                break;
            case 2:
                visualGrassPlane.translateX(worldSize);
                break;
            case 3:
                visualGrassPlane.translateX(-worldSize);
                break;
            case 4:
                visualGrassPlane.translateX(worldSize);
                visualGrassPlane.translateZ(worldSize);
                break;
            case 5:
                visualGrassPlane.translateX(-worldSize);
                visualGrassPlane.translateZ(worldSize);
                break;
            case 6:
                visualGrassPlane.translateX(worldSize);
                visualGrassPlane.translateZ(-worldSize);
                break;
            case 7:
                visualGrassPlane.translateX(-worldSize);
                visualGrassPlane.translateZ(-worldSize);
                break;
        }

        visualGrassPlane.rotateX(Math.PI / 2);
        scene.add(visualGrassPlane);
    }

    // Load grass first because it loads much faster than the animals.
    // This makes the loading animation look better because the bar doesn't jump from 50% to disappearing.
    initializeGrass(sceneInfo.grassCount, worldSize, scene, gltfLoader, sceneInfo);

    // Add animals
    for (let i = 0; i < sceneInfo.animalCount; i++) {
        // World is centered at (0,0) so it extends in worldSize/2 in all directions.
        // modifier of 200 to prevent animals spawning right at edge of world.
        let x = random(-worldSize / 2 + 300, worldSize / 2 - 300);
        let z = random(-worldSize / 2 + 300, worldSize / 2 - 300);

        // 50/50 chance weather a cow or pig will spawn to start.
        if (random(0, 100) > 50) {
            let cow = new Cow(x, z, scene, gltfLoader, sceneInfo, random(0, 360));
            animals.push(cow);
        } else {
            let pig = new Pig(x, z, scene, gltfLoader, sceneInfo, random(0, 360));
            animals.push(pig);
        }
    }

    hoverAnimation = new HoverAnimation(scene);

    // setup interaction
    controls = new OrbitControls(camera, renderer.domElement);

    // Limit users camera movement that way they can't clip camera out of bounds or into animals.
    controls.enablePan = false;
    controls.minDistance = 200;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 5;

    // call animation/rendering loop
    animate();
};

window.addEventListener("mousemove", (event) => {
    if (!loader.finishedLoading) return;

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
    if (mouseX && mouseZ && loader.finishedLoading && pane.settings.clickToPlace) {
        let hue: number | undefined =
            pane.settings.colorMode === "custom" ? pane.settings.hue : random(0, 360);

        if (pane.settings.colorMode === "original") {
            hue = undefined;
        }

        if (pane.settings.objectSelect === "cow") {
            let cow = new Cow(mouseX, mouseZ, scene, gltfLoader, sceneInfo, hue);
            animals.push(cow);
        } else if (pane.settings.objectSelect === "pig") {
            let pig = new Pig(mouseX, mouseZ, scene, gltfLoader, sceneInfo, hue);
            animals.push(pig);
        } else if (pane.settings.objectSelect === "grass") {
            loadGrass(mouseX, mouseZ, scene, gltfLoader, sceneInfo);
        }

        // If hue wasn't defined for animal creation, generate a random one for the click animation.
        if (hue === undefined) {
            hue = random(0, 360);
        }

        let click = new ClickAnimation(mouseX, mouseZ, scene, hue);
        clickAnimations.push(click);
    }
});

function animate() {
    if (!loader.finishedLoading) {
        loader.recalculateLoad();
    }

    requestAnimationFrame(animate);

    // Change in delta time used to calculate movements.
    let deltaTime = clock.getDelta();

    // Animate each animal as long as animation pause isn't enabled.
    if (!pane.settings.pauseAnimation) {
        animals.forEach((animal) => {
            animal.animate(deltaTime, pane.settings.mouseMode, mouseX, mouseZ);
        });
    }

    // Animate each click animation.
    clickAnimations.forEach((clickAnimation) => {
        clickAnimation.animate(deltaTime);
    });

    // Filter out any items that are ready to be deleted
    clickAnimations = clickAnimations.filter((animation) => !animation.deleteItem);

    hoverAnimation.animate(mouseX, mouseZ, deltaTime);

    controls.update();
    renderer.render(scene, camera);
}
