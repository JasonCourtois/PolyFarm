import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import random from "./utils.js";

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
        // // Create Three js mesh
        // let geometry = new THREE.BoxGeometry(20, 20, 20);
        // let material = new THREE.MeshStandardMaterial({ color: random(0, 0xffffff) });
        // this.mesh = new THREE.Mesh(geometry, material);

        // // Add a small box on the front (positive X side) to indicate direction
        // let frontBoxGeometry = new THREE.BoxGeometry(3, 8, 8);
        // let frontBoxMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        // let frontBox = new THREE.Mesh(frontBoxGeometry, frontBoxMaterial);
        // frontBox.position.x = 11.5; // Position it on the front face (half of main box size + half of front box size)
        // this.mesh.add(frontBox);

        // // Add similar box on the side pointing in positive z side
        // let zBoxGeometry = new THREE.BoxGeometry(3, 8, 8);
        // let zBoxMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        // let zBox = new THREE.Mesh(zBoxGeometry, zBoxMaterial);
        // zBox.position.z = 11.5; // Position it on the front face (half of main box size + half of front box size)
        // this.mesh.add(zBox);
        
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
        })

        
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

    private getEuclidianDistnace(deltaX: number, deltaZ: number) {
        return Math.sqrt(deltaX ** 2 + deltaZ ** 2);
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

            let distance = this.getEuclidianDistnace(deltaX, deltaZ);

            if (distance < 80) {
                let newAngle = Math.atan2(deltaX, deltaZ);  // Get the angle from the cow to 
                let mouseQuaternion = new THREE.Quaternion();
    
                let adjustedAngle = (newAngle + 3 * Math.PI / 2) / 2;

                mouseQuaternion.y = Math.sin(adjustedAngle);
                mouseQuaternion.w = Math.cos(adjustedAngle);
                
                this.group.quaternion.slerp(mouseQuaternion, Math.min(1, this.rotationSpeed * deltaTime));

                // If close enough to the mouse, stop moving.
                if (distance < 25) return;

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
                this.group.quaternion.slerp(this.quaternion, Math.min(1, this.rotationSpeed * deltaTime)); // Apply rotation.

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
