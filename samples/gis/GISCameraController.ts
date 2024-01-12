import { Camera3D, CameraUtil, ComponentBase, Engine3D, Matrix4, Object3D, Object3DUtil, PointerEvent3D, Ray, Vector2, Vector3, View3D, clamp } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GISMath } from "./GISMath";

class MousePickData {
    mouse: Vector2 = new Vector2();
    enable: boolean = false;
    earthSurface: Vector3 = new Vector3();
}

class CameraData {
    mat4Proj: Matrix4 = new Matrix4();
    mat4World: Matrix4 = new Matrix4();
    mat4View: Matrix4 = new Matrix4();
    up: Vector3 = new Vector3();
    position: Vector3 = new Vector3();
}

class CameraCtrlData {
    snapShot: CameraData = new CameraData();
    pickStart: MousePickData = new MousePickData();
    pickCurrent: MousePickData = new MousePickData();
    moving: boolean;
    activeUp: Vector3 = new Vector3();
    deltaRotation: Matrix4 = new Matrix4();
    start(camera: Camera3D, mouseX: number, mouseY: number) {
        let data = this.snapShot;
        data.mat4Proj.copyFrom(camera.projectionMatrix);
        data.mat4World.copyFrom(camera.transform.worldMatrix);
        data.mat4View.copyFrom(camera.viewMatrix);
        data.position.copyFrom(camera.transform.worldPosition);
        data.up.copyFrom(camera.transform.up);

        this.pickStart.mouse.set(mouseX, mouseY);
        this.pickCurrent.mouse.copyFrom(this.pickStart.mouse);
        this.activeUp.copyFrom(data.up);
        this.moving = true;
    }

    move(x: number, y: number) {
        this.pickCurrent.mouse.set(x, y);
    }
    end() {
        this.moving = false;
    }
}
/**
 * GIS camera controller
 * @group CameraController 
 */
export class GISCameraController extends ComponentBase {

    private help0Vec3: Vector3 = new Vector3();
    private help1Vec3: Vector3 = new Vector3();
    private help2Vec3: Vector3 = new Vector3();
    private help3Vec3: Vector3 = new Vector3();
    private help4Vec3: Vector3 = new Vector3();
    private help5Vec3: Vector3 = new Vector3();
    private help0Mat4: Matrix4 = new Matrix4();

    public camera: Camera3D;
    private _ctrlData: CameraCtrlData;
    private _ray: Ray = new Ray();
    private _destDistance: number = 0;//相机和球心的距离
    private _mouseLeftDown: boolean = false;
    private _mouseRightDown: boolean = false;

    private _tempPosCamera = new Vector3();
    private _earthRadius: number = 10000;
    private _earthObject: Object3D;

    private _fromSp: Object3D;
    private _toSp: Object3D;
    private _testSp: Object3D;
    /**
     * @constructor
     */
    constructor() {
        super();
        this._ctrlData = new CameraCtrlData();
    }

    /**
     * @internal
     */
    public start(): void {
        this.camera = this.object3D.getOrAddComponent(Camera3D);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_DOWN, this.onMouseDown, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
        Engine3D.inputSystem.addEventListener(PointerEvent3D.POINTER_WHEEL, this.onMouseWheel, this);
        this.initDebugSphere();
    }

    public initCamera(earthRadius: number, earth: Object3D) {
        this._earthRadius = earthRadius;
        this._earthObject = earth;
    }

    public poseCamera(position: Vector3): this {
        this._tempPosCamera.copyFrom(position);
        this._destDistance = position.length;
        return this;
    }

    initDebugSphere() {
        {
            let sp = Object3DUtil.GetSingleSphere(1, 1, 0, 0);
            sp.scaleX = sp.scaleY = sp.scaleZ = 10000;
            sp.localPosition = this._tempPosCamera.clone().normalize(this._earthRadius);

            this._toSp = sp;
            this.transform.scene3D.addChild(this._toSp);
        }
        {
            let sp = Object3DUtil.GetSingleSphere(1, 0, 1, 0);
            sp.scaleX = sp.scaleY = sp.scaleZ = 10000;
            sp.localPosition = this._tempPosCamera.clone().normalize(this._earthRadius);

            this._fromSp = sp;
            this.transform.scene3D.addChild(this._fromSp);
        }

        {
            let sp = Object3DUtil.GetSingleSphere(1, 0, 0, 1);
            sp.scaleX = sp.scaleY = sp.scaleZ = 10000;
            sp.localPosition = this._tempPosCamera.clone().normalize(this._earthRadius);

            this._testSp = sp;
            this.transform.scene3D.addChild(this._testSp);
        }

        GUIHelp.add(this.camera, 'far', 100, 6378137 * 10, 1);
        GUIHelp.add(this.camera, 'near', 0.1, 1000, 0.1);

        GUIHelp.add(this.data, 'lng', -180, 180, 1).onChange(v => { this.moveTestBall() });
        GUIHelp.add(this.data, 'lat', -90, 90, 1).onChange(v => { this.moveTestBall() });
        GUIHelp.open();
    }

    private data: { lng: number, lat: number } = { lng: 0, lat: 0 };
    public moveTestBall(lng: number = this.data.lng, lat: number = this.data.lat) {
        let position = GISMath.LngLatToPolarEarthSurface(lng, lat);
        this._testSp.localPosition = position;
    }

    private scaleTestBall(v: number) {
        let sp = this._fromSp;
        sp.scaleX = sp.scaleY = sp.scaleZ = v;
        sp = this._toSp;
        sp.scaleX = sp.scaleY = sp.scaleZ = v;
        sp = this._testSp;
        sp.scaleX = sp.scaleY = sp.scaleZ = v;
    }

    private onMouseWheel(e: PointerEvent3D) {
        if (!this.enable) return;
        this.zoom(Engine3D.inputSystem.wheelDelta * 0.001);
    }

    private zoom(delta: number) {
        let min = this._earthRadius + this.camera.near + 10;
        let max = this._earthRadius * 5.0;
        let t = (this._destDistance - min) / (max - min);
        t *= 1 + delta;
        t = clamp(t, 0.00001, 1);

        this._destDistance = max * t + min * (1 - t);
        this._destDistance = clamp(this._destDistance, min, max);
        this._tempPosCamera.normalize(this._destDistance);
    }

    private onMouseDown(e: PointerEvent3D) {
        if (!this.enable) return;
        switch (e.mouseCode) {
            case 0:
                this._mouseLeftDown = true;
                let dt = this._ctrlData;
                dt.start(this.camera, e.mouseX, e.mouseY);
                this.screenPointToRay(e.mouseX, e.mouseY);
                let pickPoint = GISMath.HitPolarSurface(this._ray);
                if (pickPoint) {
                    dt.pickStart.enable = true;
                    dt.pickStart.earthSurface.copyFrom(pickPoint);
                    console.log(GISMath.SurfacePosToLngLat(pickPoint));
                } else {
                    dt.pickStart.enable = false;
                }
                break;
            case 1:
                break;
            case 2:
                this._mouseRightDown = true;
                break;
            default:
                break;
        }
    }

    private onMouseUp(e: PointerEvent3D) {
        this._mouseLeftDown = false;
        this._mouseRightDown = false;
        this._ctrlData.end();
    }

    /**
     * @internal
     */
    private onMouseMove(e: PointerEvent3D) {
        if (!this.enable) return;
        if (this._mouseLeftDown) {
            this._ctrlData.move(e.mouseX, e.mouseY);
        } else if (this._mouseRightDown) {
            this.zoom(e.movementY * 0.01);
        }
    }


    private calculateDeltaRotation() {
        let dt = this._ctrlData;
        if (dt.pickStart.enable) {
            this.screenPointToRay(dt.pickCurrent.mouse.x, dt.pickCurrent.mouse.y);
            let currentPoint = GISMath.HitPolarSurface(this._ray);
            dt.pickCurrent.enable = currentPoint != null;
            if (currentPoint) {
                dt.pickCurrent.earthSurface.copyFrom(currentPoint);

                this.help2Vec3.copyFrom(dt.pickStart.earthSurface);
                this.help3Vec3.copyFrom(dt.pickCurrent.earthSurface);

                this.help2Vec3.normalize();
                this.help3Vec3.normalize();

                Matrix4.fromToRotation(this.help3Vec3, this.help2Vec3, dt.deltaRotation);
                dt.deltaRotation.transformVector(dt.snapShot.up, dt.activeUp);
            }
        }
    }

    private screenPointToRay(vX: number, vY: number) {
        let ray: Ray = this._ray;
        let dt = this._ctrlData;

        let start = CameraUtil.UnProjectionMat4(vX, vY, 0.1, dt.snapShot.mat4Proj, dt.snapShot.mat4World);
        let end = CameraUtil.UnProjectionMat4(vX, vY, 0.5, dt.snapShot.mat4Proj, dt.snapShot.mat4World);
        end = end.subtract(start).normalize();
        ray.origin.copyFrom(start);
        ray.direction = end;
    }

    private calcRotateMatrix(): void {
        let dt = this._ctrlData;
        if (dt.pickStart.mouse.distance(dt.pickCurrent.mouse) > 1) {
            this.calculateDeltaRotation();
            if (dt.pickStart.enable) {
                this._fromSp.localPosition = dt.pickStart.earthSurface;
                if (dt.pickCurrent.enable) {
                    this._toSp.localPosition = dt.pickCurrent.earthSurface;
                    dt.deltaRotation.transformVector(dt.snapShot.position, this._tempPosCamera);
                }
            }

        }
    }

    public onBeforeUpdate(view?: View3D) {
        if (!this.enable)
            return;

        if (this._ctrlData.moving) {
            this.calcRotateMatrix();
            this.transform.lookAt(this._tempPosCamera, this._earthObject.transform.worldPosition, this._ctrlData.activeUp);
        } else {
            this.transform.lookAt(this._tempPosCamera, this._earthObject.transform.worldPosition, this.transform.up);
        }
        this.scaleTestBall((this._destDistance - this._earthRadius) * 0.01);
        this.camera.lookTarget.copyFrom(this._earthObject.transform.worldPosition);

        // let level = (this._destDistance - this._earthRadius) * 0.05;
        // console.log(Math.floor(level));
        //图是256（level 20，宽度代表100米）
        //图是256（level 19，宽度代表200米）
        //图是256（level 18，宽度代表400米）

        //球的半径是40340，
        // [100, 200, 400, 1000, 2500, ...]
    }


    public get cameraDistanceToEarthSurface(): number {
        return this._destDistance - this._earthRadius;
    }

    public set cameraDistanceToEarthSurface(value: number) {
        this._destDistance = value + this._earthRadius;
    }

    public getCameraPosition(ret?: Vector3): Vector3 {
        ret ||= new Vector3();
        ret.copyFrom(this._tempPosCamera);
        return ret;
    }

    /**
     * @internal
     */
    public destroy(force?: boolean) {
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_MOVE, this.onMouseMove, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_UP, this.onMouseUp, this);
        Engine3D.inputSystem.removeEventListener(PointerEvent3D.POINTER_WHEEL, this.onMouseWheel, this);
        super.destroy(force);
        this.camera = null;
    }
}
