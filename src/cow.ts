import * as THREE from "three";
import random from "./utils.js";

type AnimationState = "moving" | "rotating" | "waiting";

class Cow {
    // Currently, cow is just a simple cube mesh
    object: THREE.Mesh;
    id: number;
    private moveTimer = 0; // How many seconds have passed since last move.
    private moveInterval = 4; // How many seconds until next move should occur.

    private state: AnimationState = "waiting";  // Mob starts at waiting state.
    private quaternion = new THREE.Quaternion();    // No rotation to start.

    private distanceToMove = 0; // No movement to start

    private speed = 0.4;    // Speed of movement - larger numbers will look like teleportation.


    // Takes scene as input and adds cow to the scene.
    constructor(id: number, scene: THREE.Scene, animals: Cow[]) {
        // Create Three js mesh
        let geometry = new THREE.BoxGeometry(20, 20, 20);
        let material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.object = new THREE.Mesh(geometry, material);
        // TODO: Determine how to assign IDs to objects.
        this.id = id;

        // Add this object to animals array and scene.
        animals.push(this);
        scene.add(this.object);
    }


    // to determine rotational movement, returns false if no move taken, true if mob will move.
    private rotate() {
        // There is a one half chance to move
        if (random(0, 1) < 0.50) {
            return false;
        } 

        let newAngle = random(0, 2 * Math.PI);

        this.quaternion.y = Math.sin(newAngle/2);
        this.quaternion.w = Math.cos(newAngle/2);

        return true;
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
    animate(deltaTime: number) {
        if (this.state == "waiting") {
            this.moveTimer += deltaTime;    // Add time to move timer

            // If enough time has passed, roll for movement.
            if (this.moveTimer > this.moveInterval) {
                this.moveTimer = 0;

                // Advance state if mob rotates.
                if (this.rotate()) {
                    this.state = "rotating";
                }
            }
        } else if (this.state == "rotating") {
            this.object.quaternion.slerp(this.quaternion, 0.05);    // Apply rotation.

            // To check if cube is done rotating, check if the angle to new quaternion is within 0.01.
            if (this.object.quaternion.angleTo(this.quaternion) < 0.5) {
                this.distanceToMove = random(10, 30);
                this.state = "moving";
            }
        } else if (this.state == "moving") {
            this.distanceToMove -= this.speed;
            this.object.translateX(this.speed);

            if (this.distanceToMove < 0) {
                this.state = "waiting";
            }
        }
    }
}

export default Cow;
