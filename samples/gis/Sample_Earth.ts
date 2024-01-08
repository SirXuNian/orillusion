import { Engine3D, Scene3D, AtmosphericComponent, View3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, SphereGeometry, UnLitMaterial, BoxGeometry, SkyRenderer, Color, PlaneGeometry, Vector3, GPUPrimitiveTopology, GPUAddressMode, Camera3D } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { EarthTile } from "./EarthTile";
import { EarthTileRenderer } from "./EarthTileRenderer";
import { GISMath } from "./GISMath";

export class Sample_Earth {
    public camera: Camera3D;
    public cameraController: HoverCameraController;

    async run() {
        Engine3D.setting.render.useLogDepth = true;

        await Engine3D.init({ renderLoop: () => { this.onRenderLoop() } });

        let scene = new Scene3D();

        GUIHelp.init();

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 0.1, 6000 * 10000.0);
        camera.object3D.z = 3;
        this.camera = camera;

        let cameraController = camera.object3D.addComponent(HoverCameraController);
        cameraController.minDistance = GISMath.EarthRadius * 0.8;// / 2.0;
        cameraController.maxDistance = GISMath.EarthRadius * 2.0; // 6378137.0 * 6;
        // cameraController.wheelStep = 0.0001;
	    // cameraController.mouseLeftFactor = 3;
        cameraController.rollSmooth = 2.0;
        cameraController.smooth = false;
        cameraController.setCamera(391.64495743327956, -31.271933788827532, cameraController.minDistance-100);
        this.cameraController = cameraController;
        // this.cameraController.onBeforeUpdate();
        // this.cameraController.smooth = true;

        this.initScene(scene);

        let view = new View3D();
        view.scene = scene;
        view.camera = camera;
        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        if (false) {
            let tileZ = 2;
            let tileCount = Math.pow(2, tileZ);
            let tileSize = 360 / tileCount;
            let offsetX = (tileSize * tileCount + tileSize) * 0.5;
            let offsetY = (tileSize * tileCount - tileSize) * 0.5;
            for (let tileY = 0; tileY < tileCount; tileY++) {
                for (let tileX = 0; tileX < tileCount; tileX++) {
                    let obj = new EarthTile(
                        offsetX + tileX * tileSize,
                        offsetY - tileY * tileSize,
                        tileSize, tileX, tileY, tileZ);
                    scene.addChild(obj);
                }
                return;
            }
        } else {
            let obj = new Object3D();
            let er = obj.addComponent(EarthTileRenderer);
            // er.setLatLong(120.148732, 30.231006);
            scene.addChild(obj);
        }
    }

    private latest: number = 0;
    private onRenderLoop() {
        let distance = this.cameraController.distance;// Vector3.distance(Vector3.ZERO, this.camera.transform.worldPosition);
        distance = Math.max(0, Math.floor(distance - GISMath.EarthRadius));
        if (this.latest != distance) {
            // this.cameraController.wheelStep = Math.max(Math.min(distance / 10000, 0.001), 0.00001);
            this.cameraController.wheelStep = GISMath.MapNumberToInterval(distance, 0, GISMath.EarthRadius, 0.000001, 0.001);
            this.latest = distance;
            // console.warn(`distance:${distance}, wheelStep: ${this.cameraController.wheelStep}`);
        }
    }
}
