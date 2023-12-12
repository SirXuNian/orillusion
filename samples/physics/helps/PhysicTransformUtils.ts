import Ammo from "@orillusion/ammo/ammo";
import { Object3D, Quaternion, Vector3, Vector4 } from "@orillusion/core";
import { RigidBody3D } from "./components/RigidBody3D";
export class PhysicTransformUtils {

    public static getBtVector3(rayDirection: Vector3): Ammo.btVector3 {
        return new Ammo.btVector3(rayDirection.x, rayDirection.y, rayDirection.z);
    }

    public static object3DToPhysics(object3D: Object3D, physicBody: Ammo.btCollisionObject) {
        let pos = object3D.transform.localPosition;
        let rot = object3D.transform.localRotQuat;

        let physicWorldTransform = physicBody.getWorldTransform();
        let btPos = physicWorldTransform.getOrigin();
        let btRot = physicWorldTransform.getRotation();
        btPos.setValue(pos.x, pos.y, pos.z);
        btRot.setValue(rot.x, rot.y, rot.z, rot.w);

        physicWorldTransform.setOrigin(btPos);
        physicWorldTransform.setRotation(btRot);
        physicBody.setWorldTransform(physicWorldTransform);
    }

    public static physicsToObject3D(object3D: Object3D, physicBody: Ammo.btCollisionObject) {
        let physicWorldTransform = physicBody.getWorldTransform();
        let position = physicWorldTransform.getOrigin();
        let q2 = physicWorldTransform.getRotation();
        object3D.transform.x = position.x();
        object3D.transform.y = position.y();
        object3D.transform.z = position.z();

        let qua = Quaternion.HELP_0;
        qua.set(q2.x(), q2.y(), q2.z(), q2.w());
        object3D.transform.localRotQuat = qua;
    }

    public static rotationPhysics(rx: number, ry: number, rz: number, object3D: Object3D, physicBody: Ammo.btCollisionObject) {
        object3D.transform.rotationX = rx;
        object3D.transform.rotationY = ry;
        object3D.transform.rotationZ = rz;

        let physicWorldTransform = physicBody.getWorldTransform();
        let rot = physicWorldTransform.getRotation();
        rot.setEulerZYX(rx, ry, rz);
        physicWorldTransform.setRotation(rot);
        physicBody.setWorldTransform(physicWorldTransform);
    }

    public static movePositionPhysics(x: number, y: number, z: number, object3D: Object3D, physicBody: Ammo.btCollisionObject) {
        object3D.transform.x = x;
        object3D.transform.y = y;
        object3D.transform.z = z;

        let physicWorldTransform = physicBody.getWorldTransform();
        let btPos = physicWorldTransform.getOrigin();
        btPos.setValue(x, y, z);
        physicWorldTransform.setOrigin(btPos);
        physicBody.setWorldTransform(physicWorldTransform);
    }

    public static applyBoxRigidBody(rigidBody: RigidBody3D, pos: Vector3, size: Vector3, rot: Vector3, mass: number, friction: number = 0.6, rollingFriction: number = 0.1, restitution: number = 0.8) {
        let btTransform = new Ammo.btTransform();
        let localInertia = new Ammo.btVector3(0, 0, 0);
        let motionState = new Ammo.btDefaultMotionState(btTransform);
        let btShape = new Ammo.btBoxShape(new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5));
        btShape.calculateLocalInertia(mass, localInertia);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, btShape, localInertia);
        btTransform.setIdentity();
        btTransform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

        Quaternion.HELP_0.fromEulerAngles(rot.x, rot.y, rot.z);
        let btq = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
        btTransform.setRotation(btq);
        let btBody = new Ammo.btRigidBody(rbInfo);
        btBody.setRestitution(restitution);
        btBody.setFriction(friction);
        btBody.setRollingFriction(rollingFriction);

        btBody.setWorldTransform(btTransform);

        rigidBody.mass = mass;
        rigidBody.friction = friction;
        rigidBody.rollingFriction = rollingFriction;
        rigidBody.restitution = restitution;
        rigidBody.btShape = btShape;
        rigidBody.btBody = btBody;
        rigidBody.btTransform = btTransform;
        rigidBody.localInertia = localInertia;
        rigidBody.motionState = motionState;
        rigidBody.rbInfo = rbInfo;
    }

    public static applySphereRigidBody(rigidBody: RigidBody3D, pos: Vector3, radius: number, rot: Vector3, mass: number, friction: number = 0.6, rollingFriction: number = 0.1, restitution: number = 0.8) {
        let btTransform = new Ammo.btTransform();
        let localInertia = new Ammo.btVector3(0, 0, 0);
        let motionState = new Ammo.btDefaultMotionState(btTransform);
        let btShape = new Ammo.btSphereShape(radius);
        btShape.calculateLocalInertia(mass, localInertia);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, btShape, localInertia);
        btTransform.setIdentity();
        btTransform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));

        Quaternion.HELP_0.fromEulerAngles(rot.x, rot.y, rot.z);
        let btq = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
        btTransform.setRotation(btq);
        let btBody = new Ammo.btRigidBody(rbInfo);
        btBody.setRestitution(restitution);
        btBody.setFriction(friction);
        btBody.setRollingFriction(rollingFriction);

        btBody.setWorldTransform(btTransform);

        rigidBody.mass = mass;
        rigidBody.friction = friction;
        rigidBody.rollingFriction = rollingFriction;
        rigidBody.restitution = restitution;
        rigidBody.btShape = btShape;
        rigidBody.btBody = btBody;
        rigidBody.btTransform = btTransform;
        rigidBody.localInertia = localInertia;
        rigidBody.motionState = motionState;
        rigidBody.rbInfo = rbInfo;
    }
}

export let btVector3 = (v: Vector3) => {
    return new Ammo.btVector3(v.x, v.y, v.z);
}

export let btVector4 = (v: Vector4) => {
    return new Ammo.btVector4(v.x, v.y, v.z, v.w);
}