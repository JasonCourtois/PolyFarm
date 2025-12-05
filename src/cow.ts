import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { random, getEuclidianDistnace } from "./utils";

type AnimationState = "moving" | "rotating" | "waiting";

class Cow {
    // Assigned in Constructor
    group: THREE.Group | undefined;
    id: number;
    private moveInterval: number; // How many seconds until next move should occur.

    // Private preset properties
    private speed = 20; // Speed of movement - larger numbers will look like teleportation.
    private rotationSpeed = 2.5; // Rotation speed in radians per second
    private minDistance = 15;
    private maxDistance = 50;
    private minMoveInterval = 3;
    private maxMoveInterval = 10;

    // Movement tracking variables.
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

        loader.load("./Blender/cow.glb", (gltf) => {
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

            let r = random(0, 255);
            let g = random(0, 255);
            let b = random(0, 255);

            this.group.traverse((child: any) => {
                if (child.isMesh && child.material.map) {
                    // Get original texture and create canvas to manipulate pixels.
                    const originalTexture = child.material.map;
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    if (!ctx) return;   // If we cannot get context, abort - here to satisfy typescript.

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
                        // If r, g, b values are in the brown range of original cow, we want to set this to new random color.
                        if (data[i] > 50 && data[i] < 70 && data[i + 1] > 40 && data[i + 1] < 60 && data[i + 2] > 30 && data[i + 2] < 40) {
                            data[i] = r;
                            data[i + 1] = g;
                            data[i + 2] = b;
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
        // If glb file hasn't finished loading yet, exit.
        if (!this.group) return;

        // If mouse is on the screen and plane.
        if (mouseX && mouseZ) {
            let deltaX = mouseX - this.group.position.x;
            let deltaZ = mouseZ - this.group.position.z;

            let distance = getEuclidianDistnace(deltaX, deltaZ);

            if (distance < 150) {
                let newAngle = Math.atan2(deltaX, deltaZ); // Get the angle from the cow to
                let mouseQuaternion = new THREE.Quaternion();

                let adjustedAngle = (newAngle + (3 * Math.PI) / 2) / 2;

                mouseQuaternion.y = Math.sin(adjustedAngle);
                mouseQuaternion.w = Math.cos(adjustedAngle);

                this.group.quaternion.slerp(
                    mouseQuaternion,
                    Math.min(1, this.rotationSpeed * deltaTime)
                );

                // If close enough to the mouse, stop moving.
                if (distance < 70) return;

                this.group.translateX(this.speed * 0.5 * deltaTime);

                return;
            }
        }

        switch (this.state) {
            case "waiting":
                this.moveTimer += deltaTime; // Add time to move timer

                // If enough time has passed, roll for movement.
                if (this.moveTimer > this.moveInterval) {
                    this.moveTimer = 0;

                    this.updateQuaternion();
                    this.state = "rotating";
                }
                break;
            case "rotating":
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
