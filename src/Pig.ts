import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import Animal from "./Animal";
import type { ColorBounds } from "./utils";

export default class Pig extends Animal {
    private static pigTextureMap: any;
    private static modelFilePath = "/PolyFarm/blender/Pig/pig.glb";

    // Custom color properties for the pig. This tells the color replacement what pixels to recolor.
    // Saturation and value (as in HSV colors) modifiers get ues with the hue to create a vibrant pig.
    private static saturationModifier = 0.3;
    private static valueModifier = -0.2;
    private static colorBounds: ColorBounds = {
        rMax: 255,
        rMin: 0,
        gMax: 255,
        gMin: 0,
        bMax: 255,
        bMin: 0,
    }; // These color values are in the brown range for thw cows skin. leaving the eyes, white spots, and smaller details.

    protected getOriginalTexture() {
        return Pig.pigTextureMap;
    }

    protected setOriginalTexture(texture: any) {
        Pig.pigTextureMap = texture;
    }

    constructor(
        x: number,
        z: number,
        id: number,
        scene: THREE.Scene,
        loader: GLTFLoader,
        hue?: number
    ) {
        // Calls the parent animal constructor with custom values for file path, color bounds, saturation, and value modifiers.
        super(
            x,
            z,
            id,
            scene,
            loader,
            Pig.modelFilePath,
            Pig.colorBounds,
            Pig.saturationModifier,
            Pig.valueModifier,
            hue
        );
    }
}
