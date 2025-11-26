import * as THREE from "three";
import random from "./utils.js";

type AnimationState = "moving" | "rotating" | "waiting";

class Cow {
    // Assigned in Constructor
    mesh: THREE.Mesh;
    id: number;
    private moveInterval: number; // How many seconds until next move should occur.

    // Private preset properties
    private speed = 0.4; // Speed of movement - larger numbers will look like teleportation.
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
    constructor(x: number, z: number, id: number) {
        // Create Three js mesh
        let geometry = new THREE.BoxGeometry(20, 20, 20);
        let material = new THREE.MeshStandardMaterial({ color: random(0, 0xffffff) });
        this.mesh = new THREE.Mesh(geometry, material);

        // Move mesh to desired position.
        this.mesh.position.x = x;
        this.mesh.position.z = z;

        // Determine when first move should occur.
        this.moveInterval = this.generateMoveInterval();

        // Determine random rotation - then apply it instantly.
        this.updateQuaternion();
        this.mesh.quaternion.slerp(this.quaternion, 1);

        // TODO: Determine how to assign IDs to objects.
        this.id = id;
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
    animate(deltaTime: number) {
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
                this.mesh.quaternion.slerp(this.quaternion, 0.05); // Apply rotation.

                // To check if cube is done rotating, check if the angle to new quaternion is within 0.01.
                if (this.mesh.quaternion.angleTo(this.quaternion) < 0.5) {
                    this.distanceToMove = random(this.minDistance, this.maxDistance);
                    this.state = "moving";
                }
                break;
            case "moving":
                this.distanceToMove -= this.speed;
                this.mesh.translateX(this.speed);

                if (this.distanceToMove < 0) {
                    this.state = "waiting";
                    this.moveInterval = this.generateMoveInterval();
                }
                break;
        }
    }
}

export default Cow;
