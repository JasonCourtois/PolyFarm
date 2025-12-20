import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import Animal from "./Animal";
import type { ColorBounds, SceneInfo } from "./utils";

export default class Pig extends Animal {
    private static pigTextureMap: any;
    private static modelFilePath = "/PolyFarm/blender/Pig/pig.glb";

    // Custom color properties for the pig. This tells the color replacement what pixels to recolor.
    // Saturation and value (as in HSV colors) modifiers get ues with the hue to create a vibrant pig.
    // These color bounds target everything besides the eyes. Unlike the cow, most of the pigs texture needs to be replaced.
    private static colorBounds: ColorBounds = {
        rMax: 255,
        rMin: 0,
        gMax: 255,
        gMin: 0,
        bMax: 255,
        bMin: 0,
    };
    private static saturationModifier = 0.3;
    private static valueModifier = -0.2;

    protected getOriginalTexture() {
        return Pig.pigTextureMap;
    }

    protected setOriginalTexture(texture: any) {
        Pig.pigTextureMap = texture;
    }

    constructor(
        x: number,
        z: number,
        scene: THREE.Scene,
        loader: GLTFLoader,
        sceneInfo: SceneInfo,
        hue?: number
    ) {
        // Calls the parent animal constructor with custom values for file path, color bounds, saturation, and value modifiers.
        super(
            x,
            z,
            scene,
            loader,
            Pig.modelFilePath,
            Pig.colorBounds,
            Pig.saturationModifier,
            Pig.valueModifier,
            sceneInfo,
            hue
        );
    }
}
