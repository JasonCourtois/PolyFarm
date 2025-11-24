import * as THREE from 'three';

class Cow {
    // Currently, cow is just a simple cube mesh
    object: THREE.Mesh;
    id: number;
    private moveTimer: number;      // How many seconds have passed since last move.
    private moveInterval:number;    // How many seconds until next move should occur.


    // Takes scene as input and adds cow to the scene.
    constructor(id: number, scene: THREE.Scene, animals: Cow[]) {
        // Create Three js mesh
        let geometry = new THREE.BoxGeometry(20, 20, 20);
        let material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.object = new THREE.Mesh(geometry, material);
        
        // TODO: Determine how to assign IDs to objects.
        this.id = id;

        this.moveTimer = 0;
        this.moveInterval = 3;
        
        animals.push(this);
        scene.add(this.object);
    }

    // to determine movement, 
    private move() {
        this.moveTimer = 0;

        if (Math.random() > 0.5) {
            let direction = Math.random();

            if (direction < 0.5) {
                this.object.position.x += 5;
            } else {
                this.object.position.z += 5;
            }
        } else {
            console.log(`no move ${this.id}`)
        }
    }

    // Move cow and determine actions
    animate(deltaTime: number) {
        this.moveTimer += deltaTime;
        
        if (this.moveTimer > this.moveInterval) {
            this.move();
        }
    }
}

export default Cow