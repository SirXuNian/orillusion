import { Camera3D } from '../core/Camera3D';
import { Object3D } from '../core/entities/Object3D';
import { webGPUContext } from '../gfx/graphics/webGpu/Context3D';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

/**
 * Camera3D tool class
 * @group Util
 */
export class CameraUtil {
    /**
     * create a Camera3D component
     * @param parent parent object3D
     * @param name set name to the owner of this camera3D
     * @returns
     */
    public static createCamera3DObject(parent?: Object3D, name?: string): Camera3D {
        return this.createCamera3D(null, parent, name);
    }

    /**
     * @internal
     * @param object3D
     * @param parent
     * @param name
     * @returns
     */
    public static createCamera3D(object3D?: Object3D, parent?: Object3D, name?: string): Camera3D {
        object3D ||= new Object3D();
        parent && parent.addChild(object3D);
        name && (object3D.name = name);
        return object3D.getOrAddComponent(Camera3D);
    }

    /**
     * @internal
     * @param sX
     * @param sY
     * @param sZ
     * @param camera
     * @returns
     */
    public static UnProjection(sX: number, sY: number, sZ: number = 1, camera?: Camera3D) {
        return this.UnProjectionMat4(sX, sY, sZ, camera.projectionMatrix, camera.transform.worldMatrix);
    }

    private static HELP_0: Vector3 = new Vector3();
    public static UnProjectionMat4(sX: number, sY: number, sZ: number = 1, projectionMatrix: Matrix4, worldMatrix: Matrix4, outP?: Vector3) {
        let sc = 1;
        let ina: Vector3 = this.HELP_0;

        let ox = webGPUContext.canvas.offsetLeft;
        let oy = webGPUContext.canvas.offsetTop;
        let w = webGPUContext.canvas.clientWidth;
        let h = webGPUContext.canvas.clientHeight;
        ina.x = (((sX - ox) * sc) / w - 0.5) * 2;
        ina.y = -(((sY - oy) * sc) / h - 0.5) * 2;
        ina.z = sZ;

        outP ||= new Vector3(0, 0, 0);
        let projectWorld = Matrix4.helpMatrix2;
        projectWorld.copyFrom(projectionMatrix);
        projectWorld.invert();
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.identity();
        cameraToWorld.multiply(projectWorld);
        cameraToWorld.multiply(worldMatrix);
        cameraToWorld.perspectiveMultiplyPoint3(ina, outP);
        return outP;
    }

    /**
     * @internal
     * @param point
     * @param camera
     * @param target
     * @returns
     */
    public static Projection(point: Vector3, camera: Camera3D, target?: Vector3) {
        return this.ProjectionMat4(point, camera.viewMatrix, camera.projectionMatrix, target);
    }

    public static ProjectionMat4(point: Vector3, viewMatrix: Matrix4, projectionMatrix: Matrix4, target?: Vector3) {
        let outP = target ? target : new Vector3(0, 0, 0);
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.copyFrom(viewMatrix);
        cameraToWorld.multiply(projectionMatrix);
        cameraToWorld.perspectiveMultiplyPoint3(point, outP);

        // let ox = webGPUContext.canvas.offsetLeft;
        // let oy = webGPUContext.canvas.offsetTop;
        let w = webGPUContext.canvas.clientWidth / 2;
        let h = webGPUContext.canvas.clientHeight / 2;

        // let w = camera.viewPort.width / 2;
        // let h = camera.viewPort.height / 2;
        outP.x = outP.x * w + w;
        outP.y = h - outP.y * h;
        return outP;
    }

    /**
     * @internal
     * @param sceneX
     * @param sceneY
     * @param z
     * @param camera
     * @param target
     * @returns
     */
    public static UnProjection2(sceneX: number, sceneY: number, z: number, camera: Camera3D, target: Vector3) {
        let outP = target ? target : new Vector3(0, 0, 0);
        let cameraToWorld = Matrix4.helpMatrix;
        cameraToWorld.copyFrom(camera.pvMatrixInv);

        // let w = camera.viewPort.width / 2;
        // let h = camera.viewPort.height / 2;

        let w = webGPUContext.canvas.clientWidth / 2;
        let h = webGPUContext.canvas.clientHeight / 2;

        outP.x = (sceneX - w) / w;
        outP.y = (h - sceneY) / h;
        outP.z = z;

        cameraToWorld.perspectiveMultiplyPoint3(outP, outP);

        return outP;
    }
}
