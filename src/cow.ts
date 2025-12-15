import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { random, rgbToHsv, hsvToRgb } from "./utils";
import { MovementController } from "./movementController";

class Cow {
    // Shared original texture across all instances
    private static originalTextureMap: any;

    // General Fields
    group: THREE.Group | undefined;
    id: number;

    // Color Replacement properties
    private saturationModifier = 0.4; // Intensifier added to saturation of pixel
    private valueModifier = 0.4; // Intensifier added to value of pixel.
    private colorBounds = {
        rMax: 70,
        rMin: 50,
        gMax: 60,
        gMin: 40,
        bMax: 40,
        bMin: 30,
    }; // These color values are in the brown range for thw cows skin. leaving the eyes, white spots, and smaller details.

    // Movement controller
    private movementController: MovementController | undefined;

    // Takes scene as input and adds cow to the scene.
    constructor(x: number, z: number, id: number, scene: THREE.Scene, loader: GLTFLoader, hue?: number) {
        // TODO: Determine how to assign IDs to objects.
        this.id = id;

        loader.load("/PolyFarm/blender/cow.glb", (gltf) => {
            scene.add(gltf.scene);

            this.group = gltf.scene;

            //Move mesh to desired position.
            this.group.position.x = x;
            this.group.position.z = z;
            this.group.position.y = random(-0.1, 0.1); // Slightly move the mesh on the y axis to combat z clipping.

            // Increase scale of cow
            this.group.scale.addScalar(25);
            // Determine random rotation
            let newAngle = random(0, 2 * Math.PI);
            let quaternion = new THREE.Quaternion;
            quaternion.y = Math.sin(newAngle / 2);
            quaternion.w = Math.cos(newAngle / 2);
            // Apply that rotation instantly.
            this.group.quaternion.slerp(quaternion, 1);
            
            // Store original texture for recoloring only once (shared across all cows)
            if (!Cow.originalTextureMap) {
                this.group.traverse((child: any) => {
                    if (child.isMesh && child.material.map) {
                        Cow.originalTextureMap = child.material.map.clone();
                    }
                });
            }

            // define movement controller here
            this.movementController = new MovementController(this.group, gltf);
            
            // If hue isn't defined, we create a normal brown cow.
            if (hue) this.changeColor(hue);
        });
    }

    changeColor = (newHue: number) => {
        // If model hasn't finished loading, then exit.
        if (!this.group) return;

        // Now should this code be done with shaders? Most likely. However, I have no idea where to begin with that.
        // So for now I'm leaving my hacky solution of editing the pixels of the texture file directly.
        this.group.traverse((child: any) => {
            if (child.isMesh && child.material.map) {
                // Get original texture from shared class storage
                const originalTexture = Cow.originalTextureMap;

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
    }


    // Movement system is essentially a finite state machine. Mob goes from waiting -> rotating -> moving -> waiting.
    // Code for this is handled within the movement controller
    /*
        If follow mouse is in range, follow users cursor on 2D plane, otherwise do the following:
        When Waiting
            - Increment move timer
            - If move timer is goes past move interval, reset move timer and call rotate
            - Determine a new angle and setup quaternion.

        When rotating
            - slerp current quaternion
            - When mob finished rotating which is approximated using angleTo between current and new rotations:
            - Generate a distance to move forward and advance state to moving.

        When moving
            - Decrement the distance to move determined in the last step by value determined by speed.
            - translate mob the amount set by speed.
            - If distance to move is less than 0, return to waiting state.
    
    */
    animate(deltaTime: number, followMouse: boolean, mouseX: undefined | number, mouseZ: undefined | number) {
        this.movementController?.animate(deltaTime, followMouse, mouseX, mouseZ)
    }
}

export default Cow;
