import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { random, getEuclidianDistnace, rgbToHsv, hsvToRgb } from "./utils";
import type { AnimationState } from "./utils";



class Cow {
    // Shared original texture across all instances
    private static originalTextureMap: any;

    // General Fields
    group: THREE.Group | undefined;
    id: number;

    // Color properties
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

    // Movement Properties
    private speed = 70; // Speed of movement - larger numbers will look like teleportation. This value is adjusted by deltaTime for framerate.
    private rotationSpeed = 3; // Rotation speed - This number is modified by deltaTime to adjust for framerate.
    private minDistance = 25; // Minimum distance that animal can move when movement started.
    private maxDistance = 65; // Maximum distance that animal
    private minMoveInterval = 3; // Minimum time in seconds until next move will be attempted.
    private maxMoveInterval = 10; // Maximum time in seconds until next move will be attempted.
    private mouseFollowRange = 300; // Max range cow will start following the mouse
    private mouseFollowLimit = 100; // Acts as boundary around mouse, animal will only get this many meters close to mouse when following.


    // Animation properties
    private mixer: THREE.AnimationMixer | undefined;
    private walkAction: THREE.AnimationAction | undefined;

    // Movement state variables.
    private moveInterval: number; // How many seconds until next move should occur.
    private moveTimer = 0; // How many seconds have passed since last move.
    private state: AnimationState = "waiting"; // Mob starts at waiting state.
    private quaternion = new THREE.Quaternion(); // No rotation to start.
    private distanceToMove = 0; // No movement to start

    // Takes scene as input and adds cow to the scene.
    constructor(x: number, z: number, id: number, scene: THREE.Scene, loader: GLTFLoader) {
        // TODO: Determine how to assign IDs to objects.
        this.id = id;

        // Determine when first move should occur.
        this.moveInterval = this.generateMoveInterval();

        loader.load("/blender/cow.glb", (gltf) => {
            scene.add(gltf.scene);

            this.group = gltf.scene;

            //Move mesh to desired position.
            this.group.position.x = x;
            this.group.position.z = z;
            this.group.position.y = random(-0.1, 0.1); // Slightly move the mesh on the y axis to combat z clipping.

            // Increase scale of cow
            this.group.scale.x = 25;
            this.group.scale.y = 25;
            this.group.scale.z = 25;

            // Determine random rotation - then apply it instantly.
            this.updateQuaternion();
            this.group.quaternion.slerp(this.quaternion, 1);
            
            // Store original texture for recoloring only once (shared across all cows)
            if (!Cow.originalTextureMap) {
                this.group.traverse((child: any) => {
                    if (child.isMesh && child.material.map) {
                        Cow.originalTextureMap = child.material.map.clone();
                    }
                });
            }
            
            let newHue = random(0, 360);

            this.mixer = new THREE.AnimationMixer(this.group);

            this.walkAction = this.mixer.clipAction(gltf.animations[0]);

            this.changeColor(newHue);
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

    // Generates a random number of seconds until the next move should be attempted.
    private generateMoveInterval() {
        return random(this.minMoveInterval, this.maxMoveInterval);
    }

    // Updates the quaternion to be a random angle.
    private updateQuaternion() {
        let newAngle = random(0, 2 * Math.PI);

        this.quaternion.y = Math.sin(newAngle / 2);
        this.quaternion.w = Math.cos(newAngle / 2);
    }

    // Movement system is essentially a finite state machine. Mob goes from waiting -> rotating -> moving -> waiting.
    /*
        When Waiting
            - Increment move timer
            - If move timer is goes past move interval, reset move timer and call rotate
            - Rotate might not advance state if mob decides to do nothing.
            - If rotate passes idle check, determine a new angle and setup quaternion.
            - If rotate passed idle check, advance state to rotating.

        When rotating
            - slerp current quaternion
            - When mob finished rotating which is approximated using angleTo between current and new rotations:
            - Generate a distance to move forward and advance state to moving.

        When moving
            - Decrement the distance to move determined in the last step by value determined by speed.
            - translate mob the amount set by speed.
            - If distance to move is less than 0, return to waiting state.
    
    */
    animate(deltaTime: number, mouseX: undefined | number, mouseZ: undefined | number) {
       this.mixer?.update(deltaTime);

        // If glb file hasn't finished loading yet, exit.
        if (!this.group) return;

        // If mouse is on the screen and plane.
        if (mouseX && mouseZ) {
            let deltaX = mouseX - this.group.position.x;
            let deltaZ = mouseZ - this.group.position.z;

            let distance = getEuclidianDistnace(deltaX, deltaZ);

            if (distance < this.mouseFollowRange && distance > this.mouseFollowLimit) {
                this.walkAction?.play();

                let newAngle = Math.atan2(deltaX, deltaZ); // Get the angle from the cow to
                let mouseQuaternion = new THREE.Quaternion();

                let adjustedAngle = (newAngle + (3 * Math.PI) / 2) / 2;

                mouseQuaternion.y = Math.sin(adjustedAngle);
                mouseQuaternion.w = Math.cos(adjustedAngle);

                this.group.quaternion.slerp(
                    mouseQuaternion,
                    Math.min(1, this.rotationSpeed * deltaTime)
                );

                this.group.translateX(this.speed * 0.5 * deltaTime);
                
                // This exits animate loop early, preventing the animal from straying from the mouse.
                return;
            }
        }

        switch (this.state) {
            case "waiting":
                this.walkAction?.stop(); // Fade out over 0.3 seconds instead of abrupt stop
                this.moveTimer += deltaTime; // Add time to move timer

                // If enough time has passed, roll for movement.
                if (this.moveTimer > this.moveInterval) {
                    this.moveTimer = 0;

                    this.updateQuaternion();
                    this.state = "rotating";
                }
                break;
            case "rotating":
                this.walkAction?.play();

                this.group.quaternion.slerp(
                    this.quaternion,
                    Math.min(1, this.rotationSpeed * deltaTime)
                ); // Apply rotation.

                // To check if cube is done rotating, check if the angle to new quaternion is within 0.01.
                if (this.group.quaternion.angleTo(this.quaternion) < 0.5) {
                    this.distanceToMove = random(this.minDistance, this.maxDistance);
                    this.state = "moving";
                }
                break;
            case "moving":
                this.walkAction?.play();

                this.distanceToMove -= this.speed * deltaTime;
                this.group.translateX(this.speed * deltaTime);

                if (this.distanceToMove < 0) {
                    this.state = "waiting";
                    this.moveInterval = this.generateMoveInterval();
                }
                break;
        }
    }
}

export default Cow;
