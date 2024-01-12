import { Engine3D, Scene3D, AtmosphericComponent, View3D, CameraUtil, HoverCameraController, Object3D, MeshRenderer, SphereGeometry, UnLitMaterial, BoxGeometry, SkyRenderer, Color, PlaneGeometry, Vector3, GPUPrimitiveTopology, GPUAddressMode, Camera3D, DirectLight, BitmapTexture2D, Object3DUtil, LitMaterial } from "@orillusion/core";
import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { EarthTile } from "./EarthTile";
import { EarthTileRenderer } from "./EarthTileRenderer";
import { GISMath } from "./GISMath";
import { GISCameraController } from "./GISCameraController";

export class Sample_Earth {
    public camera: Camera3D;

    async run() {
        Engine3D.setting.render.useLogDepth = false;

        await Engine3D.init({ renderLoop: () => { this.onRenderLoop() } });

        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent).sunY = 0.6;

        let obj = new Object3D();
        let dl = obj.addComponent(DirectLight);
        scene.addChild(obj);

        GUIHelp.init();

        let camera = CameraUtil.createCamera3DObject(scene);
        camera.perspective(60, Engine3D.aspect, 100, 10 * GISMath.EarthRadius);
        camera.object3D.z = 3;
        this.camera = camera;

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

            let cameraController = this.camera.object3D.addComponent(GISCameraController);
            cameraController.initCamera(GISMath.EarthRadius, obj);

            let er = obj.addComponent(EarthTileRenderer);
            // er.setLatLong(120.148732, 30.231006);
            scene.addChild(obj);


            let position = GISMath.LngLatToEarthSurface(112.9603384873657, 28.167600241852714);
            cameraController.poseCamera(position.normalize(GISMath.EarthRadius * 1.1));

            let texture = await Engine3D.res.loadTexture("textures/grid.jpg", null, true) as BitmapTexture2D;
            let earth = Object3DUtil.GetSingleSphere(GISMath.EarthRadius * 0.99, 0.2, 0.2, 0.2, 2000, 2000);
            let mr = earth.getComponent(MeshRenderer);
            mr.material.setTexture('baseMap', texture);
            scene.addChild(earth);

            let mat = mr.material as LitMaterial;
            let uvRect = mat.getUniformV4('transformUV1');
            let uvScale = 3;
            function setUVScale(v: number) {
                uvRect.z = uvRect.w = v * v;
                mat.setUniformVector4(`transformUV1`, uvRect);
            }
            setUVScale(uvScale);

            let materialUV = { uvScale: uvScale };
            GUIHelp.add(materialUV, 'uvScale', 1, 30, 1).onChange(v => {
                setUVScale(v);
            });
        }
    }

    private latest: number = 0;
    private onRenderLoop() {
    }
}
