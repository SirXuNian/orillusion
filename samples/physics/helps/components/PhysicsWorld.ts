import Ammo from "@orillusion/ammo/ammo";
import { CEvent, ComponentBase, Object3D, Time, View3D } from "@orillusion/core";
import { RigidBody3D } from "./RigidBody3D";

export class PhysicsWorld extends ComponentBase {

    public collisionShapes: Ammo.btCollisionShape[];
    public broadphase: Ammo.btBroadphaseInterface;
    public solver: Ammo.btSequentialImpulseConstraintSolver;
    public softBodySolver: Ammo.btSoftBodySolver;

    public dynamicsWorld: Ammo.btDiscreteDynamicsWorld | Ammo.btSoftRigidDynamicsWorld;
    public groundShape: Ammo.btBoxShape;
    public collisionConfiguration: Ammo.btDefaultCollisionConfiguration;
    public dispatcher: Ammo.btCollisionDispatcher;
    public items: Map<number, Object3D>;
    public hitMap: Map<number, number>;
    private _countID: number = 0;

    public init(param?: any): void {
        this.items = new Map<number, Object3D>();
        this.hitMap = new Map<number, number>();
        this.collisionShapes = [];
    }

    public createWorld() {
        this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration);
        this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));
        console.log(`PhysicWorld is created!`);
    }

    public creatSoftWorld() {
        this.collisionConfiguration = new Ammo.btSoftBodyRigidBodyCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.softBodySolver = new Ammo.btDefaultSoftBodySolver();
        this.dynamicsWorld = new Ammo.btSoftRigidDynamicsWorld(this.dispatcher, this.broadphase, this.solver, this.collisionConfiguration, this.softBodySolver);
        this.dynamicsWorld.setGravity(new Ammo.btVector3(0, -9.82, 0));

        console.log(`SoftWorld is created!`);
    }

    getSoftWorldInfo(): Ammo.btSoftBodyWorldInfo {
        return (this.dynamicsWorld as Ammo.btSoftRigidDynamicsWorld).getWorldInfo();
    }

    public onAddChild(child: Object3D) {
        let rigidBody = child.getOrAddComponent(RigidBody3D);
        rigidBody.btBody.setUserIndex(this._countID++);
        this.items.set(rigidBody.btBody.getUserIndex(), rigidBody.object3D);

        if (rigidBody.btBody instanceof Ammo.btRigidBody) {
            this.addRigidBody(rigidBody.btBody);
        } else {
            this.dynamicsWorld.addCollisionObject(rigidBody.btBody);
        }

        if (rigidBody.useCollision) {
            this.items.set(rigidBody.btBody.getUserIndex(), child);
            this.dynamicsWorld.addCollisionObject(rigidBody.btBody, rigidBody.collisionFilterGroup, rigidBody.collisionFilterMask);
        }

        console.log(`add one rigidBody!`);
    }

    public onRemoveChild(child: Object3D) {
        let rigidBody = child.getOrAddComponent(RigidBody3D);
        this.items.delete(rigidBody.btBody.getUserIndex());

        if (rigidBody.btBody instanceof Ammo.btRigidBody) {
            this.removeRigidBody(rigidBody.btBody);
        } else {
            this.dynamicsWorld.removeCollisionObject(rigidBody.btBody);
        }

        if (rigidBody.useCollision) {
            this.items.delete(rigidBody.btBody.getUserIndex());
            this.dynamicsWorld.removeCollisionObject(rigidBody.btBody);
        }
        console.log(`remove on rigidBody!`);
    }

    public addRigidBody(rigidBody: Ammo.btRigidBody) {
        this.dynamicsWorld.addRigidBody(rigidBody);
    }

    public removeRigidBody(rigidBody: Ammo.btRigidBody) {
        this.dynamicsWorld.removeRigidBody(rigidBody);
    }

    public addSoftBody(softBody: Ammo.btSoftBody) {
        (this.dynamicsWorld as Ammo.btSoftRigidDynamicsWorld).addSoftBody(softBody, 1, -1);
    }

    public removeSoftBody(softBody: Ammo.btSoftBody) {
        (this.dynamicsWorld as Ammo.btSoftRigidDynamicsWorld).removeSoftBody(softBody);
    }


    public addConstraint(constraint: Ammo.btTypedConstraint, disableCollisionsBetweenLinkedBodies = false) {
        this.dynamicsWorld.addConstraint(constraint, disableCollisionsBetweenLinkedBodies);
    }

    public removeConstraint(constraint: Ammo.btTypedConstraint) {
        this.dynamicsWorld.removeConstraint(constraint);
    }

    public onUpdate(view?: View3D) {
        this.dynamicsWorld.stepSimulation(Time.delta, 1, 1 / 60);

        let count = this.dynamicsWorld.getDispatcher().getNumManifolds();
        for (let i = 0; i < count; i++) {
            const element = this.dispatcher.getManifoldByIndexInternal(i);
            const contacts = element.getNumContacts();
            const body0 = element.getBody0();
            const body1 = element.getBody1();

            const body0_Index = body0.getUserIndex();
            const body1_Index = body1.getUserIndex();
            if (body0_Index != body1_Index) {

                let a = this.items.get(body0_Index);
                let b = this.items.get(body1_Index);
                if (a && b) {
                    a.dispatchEvent(new CEvent("hit", b));
                    b.dispatchEvent(new CEvent("hit", a));
                }
            }
        }
    }

}