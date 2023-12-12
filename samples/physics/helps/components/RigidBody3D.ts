import Ammo from "@orillusion/ammo/ammo";
import { ComponentBase, Quaternion, Vector3 } from "@orillusion/core";
import { PhysicsWorld } from "./PhysicsWorld";
import { PhysicTransformUtils } from "../PhysicTransformUtils";
import { CollisionFilterGroups } from "../PhysicType";

export class RigidBody3D extends ComponentBase {
    public btBody: Ammo.btCollisionObject | Ammo.btRigidBody;
    public btShape: Ammo.btCollisionShape;
    public collisionFilterGroup: number = CollisionFilterGroups.DefaultFilter;
    public collisionFilterMask: number = CollisionFilterGroups.StaticFilter | CollisionFilterGroups.DefaultFilter;
    public mass: number = 0;
    public friction: number = 0.6;
    public rollingFriction: number = 0.1;
    public restitution: number = 0.8
    public btTransform: Ammo.btTransform;
    public localInertia: Ammo.btVector3;
    public motionState: Ammo.btDefaultMotionState;
    public rbInfo: Ammo.btRigidBodyConstructionInfo;
    public useCollision: boolean = true;
    private _forceChange = false;
    public init(param?: any): void {
    }

    public get rigidBody() {
        return this.btBody as Ammo.btRigidBody;
    }

    public setPosition(x: number | Vector3, y?: number, z?: number) {
        this._forceChange = true;
        if (x instanceof Vector3) {
            this.transform.x = x.x;
            this.transform.y = x.y;
            this.transform.z = x.z;
        } else {
            this.transform.x = x;
            this.transform.y = y;
            this.transform.z = z;
        }
    }

    public setRotation(x: number | Vector3, y?: number, z?: number) {
        this._forceChange = true;
        if (x instanceof Vector3) {
            this.transform.rotationX = x.x;
            this.transform.rotationY = x.y;
            this.transform.rotationZ = x.z;
        } else {
            this.transform.rotationX = x;
            this.transform.rotationY = y;
            this.transform.rotationZ = z;
        }
    }

    public setRotationByForward(x: Vector3) {
        this._forceChange = true;
        this.transform.forward = x;
    }

    public onBeforeUpdate(): void {
        if (this._forceChange) {
            this._forceChange = false;
            PhysicTransformUtils.object3DToPhysics(this.object3D, this.btBody);
        } else {
            PhysicTransformUtils.physicsToObject3D(this.object3D, this.btBody);
        }
    }

    public destroy(force?: boolean): void {
        super.destroy(force);
        Ammo.destroy(this.btTransform);
        Ammo.destroy(this.localInertia);
        Ammo.destroy(this.btShape);
        Ammo.destroy(this.motionState);
        Ammo.destroy(this.rbInfo);
        Ammo.destroy(this.btBody);

        this.btTransform = null;
        this.localInertia = null;
        this.btShape = null;
        this.motionState = null;
        this.rbInfo = null;
        this.btBody = null;
    }
}