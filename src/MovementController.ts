import type { GLTF } from "three/examples/jsm/Addons.js";
import type { AnimationState } from "./utils";
import { getEuclidianDistnace } from "./utils";
import * as THREE from "three";
import { random } from "./utils";

export class MovementController {
    private static worldSize = Number(import.meta.env.VITE_WORLDSIZE) || 1;

    // Object references.
    private state: AnimationState; // Controls state of movement.
    private group: THREE.Group; // Actual three.js object (mesh).
    private mixer: THREE.AnimationMixer; // Animation mixer - stores current info about animations.
    private walkAction: THREE.AnimationAction; // Walk animation - stored here to quickly pause/play animation
    private quaternion = new THREE.Quaternion(); // Stores current rotation animal should be facing/moving towards.

    // Movement Properties
    private mouseFollowRange = 300; // Max range cow will start following the mouse
    private mouseFollowLimit = 100; // Acts as boundary around mouse, animal will only get this many meters close to mouse when following.
    private speed = 70; // Speed of movement - larger numbers will look like teleportation. This value is adjusted by deltaTime for framerate.
    private rotationSpeed = 3; // Rotation speed - This number is modified by deltaTime to adjust for framerate.
    private minDistance = 25; // Minimum distance that animal can move when movement started.
    private maxDistance = 65; // Maximum distance that animal

    // Movement state variables.
    private moveInterval: number; // How many seconds until next move should occur - randomly generated between [minMoveInterval, maxMoveInterval).
    private moveTimer = 0; // How many seconds have passed since last move.
    private distanceToMove = 0; // How far animal needs to walk.
    private minMoveInterval = 3; // Minimum time in seconds until next move will be attempted.
    private maxMoveInterval = 10; // Maximum time in seconds until next move will be attempted.

    // Constructor gets reference to walk animation from GLTF file, assigns references to mixer and group as well.
    constructor(group: THREE.Group, gltf: GLTF) {
        this.state = "waiting";
        this.group = group;

        // Use gtlf file to find walk animation
        this.mixer = new THREE.AnimationMixer(this.group);
        this.walkAction = this.mixer.clipAction(gltf.animations[0]);

        // Determine when first move should occur.
        this.moveInterval = this.generateMoveInterval();
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

    // Returns false if the animal didn't fallow the mouse, returns true if the animal is following the mouse.
    private handleMouseFollowing(deltaTime: number, followMouse: boolean, mouseX: number | undefined, mouseZ: number | undefined): boolean{
        if (!mouseX || !mouseZ || !followMouse) return false;   // If mouse position isn't defined or followMouse is disabled, don't follow.

        let deltaX = mouseX - this.group.position.x;
        let deltaZ = mouseZ - this.group.position.z;

        let distance = getEuclidianDistnace(deltaX, deltaZ);

        if (distance < this.mouseFollowRange && distance > this.mouseFollowLimit) {
            this.walkAction.play();

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
            return true;
        } else {
            return false;
        }
    }

    private constrainMovement() {
         // Keep in bounds on x position.
        if (this.group.position.x > MovementController.worldSize / 2) {
            this.group.position.x = MovementController.worldSize / 2;
        } else if (this.group.position.x < -MovementController.worldSize / 2) {
            this.group.position.x = -MovementController.worldSize / 2;
        }

        // Keep in bounds on z position.
        if (this.group.position.z > MovementController.worldSize / 2) {
            this.group.position.z = MovementController.worldSize / 2;
        } else if (this.group.position.z < -MovementController.worldSize / 2) {
            this.group.position.z = -MovementController.worldSize / 2;
        }
    }

    private handleWaiting(deltaTime: number) {
        this.walkAction.stop(); // Fade out over 0.3 seconds instead of abrupt stop
        this.moveTimer += deltaTime; // Add time to move timer

        // If enough time has passed, begin moving.
        if (this.moveTimer > this.moveInterval) {
            this.moveTimer = 0;

            this.updateQuaternion();
            this.state = "rotating";
        }
    }

    private handleRotating(deltaTime: number) {
        this.walkAction.play();

        this.group.quaternion.slerp(this.quaternion, Math.min(1, this.rotationSpeed * deltaTime)); // Apply rotation. Math.min is used in case deltaTime becomes very large and exceeds 1.

        // To check if animal is done rotating, check if the angle to new quaternion is within 0.01.
        if (this.group.quaternion.angleTo(this.quaternion) < 0.5) {
            this.distanceToMove = random(this.minDistance, this.maxDistance);
            this.state = "moving";
        }
    }

    private handleMoving(deltaTime: number) {
        this.walkAction.play();

        this.distanceToMove -= this.speed * deltaTime;
        this.group.translateX(this.speed * deltaTime);

        this.constrainMovement();

        if (this.distanceToMove < 0) {
            this.state = "waiting";
            this.moveInterval = this.generateMoveInterval();
        }
    }

    // Main function that gets called by animal class.
    animate(
        deltaTime: number,
        followMouse: boolean,
        mouseX: undefined | number,
        mouseZ: undefined | number
    ) {
        this.mixer.update(deltaTime); // Advance animation.

        // Exit animation loop early if animal is following the mouse.
        if (this.handleMouseFollowing(deltaTime, followMouse, mouseX, mouseZ)) return;

        switch (this.state) {
            case "waiting":
                this.handleWaiting(deltaTime);
                break;
            case "rotating":
                this.handleRotating(deltaTime);
                break;
            case "moving":
                this.handleMoving(deltaTime);
                break;
        }
    }
}
