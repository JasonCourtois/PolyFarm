import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import Animal from "./Animal";
import type { ColorBounds } from "./utils";

export default class Cow extends Animal {
    private static cowTextureMap: any;
    private static modelFilePath = "/PolyFarm/blender/Cow/cow.glb";

    // Custom color properties for the cow. This tells the color replacement what pixels to recolor.
    // Saturation and value (as in HSV colors) modifiers get ues with the hue to create a vibrant cow.
    private static colorBounds: ColorBounds = {
        rMax: 70,
        rMin: 50,
        gMax: 60,
        gMin: 40,
        bMax: 40,
        bMin: 30,
    };
    private static saturationModifier = 0.4;
    private static valueModifier = 0.4;

    protected getOriginalTexture() {
        return Cow.cowTextureMap;
    }

    protected setOriginalTexture(texture: any) {
        Cow.cowTextureMap = texture;
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
            Cow.modelFilePath,
            Cow.colorBounds,
            Cow.saturationModifier,
            Cow.valueModifier,
            hue
        );
    }
}
