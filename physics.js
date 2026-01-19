import * as CANNON from 'cannon-es';

export class PhysicsWorld {
    constructor() {
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82 * 4, 0); // Higher gravity for snappier feel
        this.world.broadphase = new CANNON.SAPBroadphase(this.world);
        this.world.allowSleep = true;

        this.diceBodies = [];
        this.setupGround();
        this.setupWalls();
    }

    setupGround() {
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            material: new CANNON.Material({ friction: 0.1, restitution: 0.5 })
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.world.addBody(groundBody);
    }

    setupWalls() {
        // Add invisible walls to keep dice in view
        const wallMaterial = new CANNON.Material({ friction: 0, restitution: 0.9 });
        const size = 4.5; // Tightened barrier to keep dice in view

        const walls = [
            { pos: [size, 0, 0], rot: [0, -Math.PI / 2, 0] },
            { pos: [-size, 0, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [0, 0, size], rot: [0, Math.PI, 0] },
            { pos: [0, 0, -size], rot: [0, 0, 0] },
            { pos: [0, 10, 0], rot: [Math.PI / 2, 0, 0] } // Ceiling
        ];

        walls.forEach(w => {
            const wallBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: wallMaterial });
            wallBody.position.set(...w.pos);
            wallBody.quaternion.setFromEuler(...w.rot);
            this.world.addBody(wallBody);
        });
    }

    addDiceBody() {
        const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            material: new CANNON.Material({ friction: 0.1, restitution: 0.5 })
        });

        this.world.addBody(body);
        this.diceBodies.push(body);
        return body;
    }

    removeDiceBody(body) {
        this.world.removeBody(body);
        this.diceBodies = this.diceBodies.filter(b => b !== body);
    }

    update() {
        this.world.fixedStep();
    }
}
