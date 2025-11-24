import * as THREE from 'three';

class Cow {
    // Takes scene as input and adds cow to the scene.
    constructor(scene, animals) {
        var geometry = new THREE.BoxGeometry(20, 20, 20);
        var material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        this.cube = new THREE.Mesh(geometry, material);

        animals.push(this);
        scene.add(this.cube);
    }

    // Move cow and determine actions
    animate() {
        this.cube.position.z += 0.1;
    }
}

export default Cow