import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { Object3D, Scene3D, Engine3D, AtmosphericComponent, CameraUtil, View3D, DirectLight, KelvinUtil, BitmapTexture2D, Matrix4, MeshRenderer, Object3DUtil, AxisObject, Camera3D, Vector3, DEGREES_TO_RADIANS, LitMaterial, SphereGeometry } from "@orillusion/core";
import { Stats } from "@orillusion/stats";
import { GISCameraController } from "@samples/gis/GISCameraController";
import { GISMath } from "@samples/gis/GISMath";

export class Sample_GISCameraCtrl {
    lightObj3D: Object3D;
    scene: Scene3D;
    view: View3D;

    camera: Camera3D;
    radius: number = GISMath.EarthRadius;
    async run() {
        Engine3D.setting.render.useLogDepth = false;

        Matrix4.maxCount = 10000;
        Matrix4.allocCount = 10000;

        await Engine3D.init({ beforeRender: () => this.update() });

        Engine3D.setting.render.debug = true;
        Engine3D.setting.shadow.shadowBound = 5;

        GUIHelp.init();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        let sky = this.scene.addComponent(AtmosphericComponent);
        let camera = CameraUtil.createCamera3DObject(this.scene);
        camera.perspective(60, Engine3D.aspect, 100, this.radius * 10);


        this.camera = camera;

        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = camera;

        Engine3D.startRenderView(this.view);

        await this.initScene();

        this.scene.addChild(new AxisObject(50, 0.05))

        sky.relativeTransform = this.lightObj3D.transform;
    }


    async initScene() {
        {
            /******** light *******/
            this.lightObj3D = new Object3D();
            this.lightObj3D.rotationX = 21;
            this.lightObj3D.rotationY = 108;
            this.lightObj3D.rotationZ = 10;
            let directLight = this.lightObj3D.addComponent(DirectLight);
            directLight.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            directLight.castShadow = false;
            directLight.intensity = 10;
            this.scene.addChild(this.lightObj3D);
        }
        {
            let texture = await Engine3D.res.loadTexture("textures/grid.jpg", null, true) as BitmapTexture2D;
            let earth = Object3DUtil.GetSingleSphere(this.radius, 0.2, 0.2, 0.2, 2000, 2000);
            earth.localRotation = new Vector3(0, 0, 0);
            earth.transform.scaleY = GISMath.Min_Div_Max;
            let mr = earth.getComponent(MeshRenderer);
            mr.material.setTexture('baseMap', texture)

            let mat = mr.material as LitMaterial;
            let uvRect = mat.getUniformV4('transformUV1');
            let uvScale = 3;
            function setUVScale(v: number) {
                uvRect.z = uvRect.w = v * v;
                mat.setUniformVector4(`transformUV1`, uvRect);
            }
            setUVScale(uvScale);

            this.scene.addChild(earth);
            let materialUV = { uvScale: uvScale };
            GUIHelp.add(materialUV, 'uvScale', 1, 30, 1).onChange(v => {
                setUVScale(v);
            });

            let ctrl = this.camera.object3D.addComponent(GISCameraController);
            ctrl.initCamera(this.radius, earth);

            let forward = Vector3.FORWARD;
            // let matrix = new Matrix4().makeRotationAxis(Vector3.UP, 30 * DEGREES_TO_RADIANS);
            // matrix.transformVector(forward, forward);
            let position = forward.normalize(this.radius * 4);
            ctrl.poseCamera(position);
        }
    }

    update() {
    }

}


