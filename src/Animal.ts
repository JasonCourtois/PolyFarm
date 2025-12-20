import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { random, rgbToHsv, hsvToRgb } from "./utils";
import type { ColorBounds, MouseMode, SceneInfo } from "./utils";
import MovementController from "./MovementController";

// Parent class for all animals in the scene. Contains logic for re-coloring animals.
export default abstract class Animal {
    // Group which stores 3D mesh.
    group: THREE.Group | undefined;

    // Movement controller
    private movementController: MovementController | undefined;

    // Methods that each subclass must implement in order to correctly get/update texture.
    protected abstract getOriginalTexture(): any;
    protected abstract setOriginalTexture(texture: any): void;

    // Variables input by each subclass in order to properly recolor pixels.
    private colorBounds: ColorBounds;
    private saturationModifier: number;
    private valueModifier: number;

    // Constructor adds animal to scene and changes the color of the animal.
    constructor(
        x: number,
        z: number,
        scene: THREE.Scene,
        loader: GLTFLoader,
        modelPath: string,
        colorBounds: ColorBounds,
        saturationModifier: number,
        valueModifier: number,
        sceneInfo: SceneInfo,
        hue?: number
    ) {
        this.colorBounds = colorBounds;

        this.saturationModifier = saturationModifier;
        this.valueModifier = valueModifier;

        loader.load(modelPath, (gltf) => {
            this.group = gltf.scene;

            // Enable shadows on all children
            this.group.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                }
            });

            //Move mesh to desired position.
            this.group.position.x = x;
            this.group.position.z = z;
            this.group.position.y = random(-0.1, 0.1); // Slightly move the mesh on the y axis to combat z clipping.

            // Increase scale of animal.
            this.group.scale.addScalar(25);

            // Determine random initial rotation
            let newAngle = random(0, 2 * Math.PI);
            let quaternion = new THREE.Quaternion();
            quaternion.y = Math.sin(newAngle / 2);
            quaternion.w = Math.cos(newAngle / 2);
            // Apply that rotation instantly.
            this.group.quaternion.slerp(quaternion, 1);

            // Store original texture for recoloring only once.
            // Each subclass will have a static variable to store texture, and all instances of each subclass share reference to that texture when recoloring.
            if (!this.getOriginalTexture()) {
                this.group.traverse((child: any) => {
                    if (child.isMesh && child.material.map) {
                        this.setOriginalTexture(child.material.map.clone());
                    }
                });
            }

            // Handles movement and animation for animal. This needs to be defined here as the gltf object stores the animation info.
            this.movementController = new MovementController(this.group, gltf);

            // If a hue was given, apply the color change.
            if (hue !== undefined) this.changeColor(hue);

            // Increment loaded count to track loading percentage.
            sceneInfo.loadedCount++;
            scene.add(this.group);
        });
    }

    changeColor = (newHue: number) => {
        // If model hasn't finished loading, then exit.
        if (!this.group) return;

        // Now should this code be done with shaders? Most likely. However, I have no idea where to begin with that.
        // So for now I'm leaving my hacky solution of editing the pixels of the texture file directly.
        // Update: the project is now due in 4 hours, I no longer have time to fix this lol.
        this.group.traverse((child: any) => {
            if (child.isMesh && child.material.map) {
                // Get original texture from shared class storage
                const originalTexture = this.getOriginalTexture();

                if (!originalTexture) return;

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                if (!ctx) return; // If we cannot get context, abort - here to satisfy typescript.

                // Get texture image, set canvas to be same size as image.
                const img = originalTexture.image;
                canvas.width = img.width;
                canvas.height = img.height;

                // Draw image to the 2D canvas.
                ctx.drawImage(img, 0, 0);

                // Get pixel RGB values for manipulation.
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    // Anything that falls into this range should be overwritten.
                    if (
                        data[i] > this.colorBounds.rMin &&
                        data[i] < this.colorBounds.rMax &&
                        data[i + 1] > this.colorBounds.gMin &&
                        data[i + 1] < this.colorBounds.gMax &&
                        data[i + 2] > this.colorBounds.bMin &&
                        data[i + 2] < this.colorBounds.bMax
                    ) {
                        // Get HSV and update with new values. I am using HSV to preserve some of the natural noise present within the texture of the animal by only overwriting the hue.
                        let hsv = rgbToHsv(data[i], data[i + 1], data[i + 2]);
                        hsv[0] = newHue;
                        hsv[1] += this.saturationModifier;
                        hsv[2] += this.valueModifier;

                        // Convert back to rgb for pixel data.
                        let rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
                        data[i] = rgb[0];
                        data[i + 1] = rgb[1];
                        data[i + 2] = rgb[2];
                    }
                }

                // Replace canvas with new image data.
                ctx.putImageData(imageData, 0, 0);

                // Create new texture - Nearest Filter used for pixel art to avoid blurring.
                const newTexture = new THREE.CanvasTexture(canvas);
                newTexture.magFilter = THREE.NearestFilter;
                newTexture.minFilter = THREE.NearestFilter;

                // Copy texture data from original texture to ensure it maps to model correctly.
                newTexture.wrapS = originalTexture.wrapS;
                newTexture.wrapT = originalTexture.wrapT;
                newTexture.repeat.copy(originalTexture.repeat);
                newTexture.offset.copy(originalTexture.offset);
                newTexture.center.copy(originalTexture.center);
                newTexture.rotation = originalTexture.rotation;
                newTexture.flipY = originalTexture.flipY;
                newTexture.colorSpace = originalTexture.colorSpace;

                // Mark the new texture and child object to update
                newTexture.needsUpdate = true;
                child.material.map = newTexture;
                child.material.needsUpdate = true;
            }
        });
    };

    // Movement system is essentially a finite state machine. Mob goes from waiting -> rotating -> moving -> waiting.
    // Code for this is handled within the movement controller
    animate(
        deltaTime: number,
        followMouse: MouseMode,
        mouseX: undefined | number,
        mouseZ: undefined | number
    ) {
        this.movementController?.animate(deltaTime, followMouse, mouseX, mouseZ);
    }
}
