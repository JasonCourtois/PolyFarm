import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { random, type SceneInfo } from "./utils";

const modelPath = "/PolyFarm/blender/Grass/grass.glb";

export const loadGrass = (
    x: number,
    z: number,
    scene: THREE.Scene,
    loader: GLTFLoader,
    sceneInfo: SceneInfo
) => {
    loader.load(modelPath, (gltf) => {
        const grass = gltf.scene;
        grass.position.x = x;
        grass.position.z = z;

        grass.scale.addScalar(300);

        // Increment loaded count to track loading percentage.
        sceneInfo.loadedCount++;
        scene.add(grass);
    });
};

export const initializeGrass = (
    grassCount: number,
    worldSize: number,
    scene: THREE.Scene,
    loader: GLTFLoader,
    sceneInfo: SceneInfo
) => {
    for (let i = 0; i < grassCount; i++) {
        let x = random(-worldSize / 2, worldSize / 2);
        let z = random(-worldSize / 2, worldSize / 2);

        loadGrass(x, z, scene, loader, sceneInfo);
    }
};
