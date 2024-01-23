import {
    View3D, DirectLight, Engine3D,
    PostProcessingComponent, LitMaterial, HoverCameraController,
    KelvinUtil, MeshRenderer, Object3D, PlaneGeometry, Scene3D, SphereGeometry,
    CameraUtil, webGPUContext, BoxGeometry, TAAPost, AtmosphericComponent, GTAOPost, Color, BloomPost, SSRPost, SSGIPost, GBufferPost, FXAAPost, SkyRenderer, Reflection, SphereReflection, GBufferFrame, ProfilerUtil, Time, SpotLight, Object3DUtil, Object3DTransformTools, PointLight, Vector3
} from '@orillusion/core';
import { GUIHelp } from '@orillusion/debug/GUIHelp';
import { Stats } from '@orillusion/stats';
import { GUIUtil } from '@samples/utils/GUIUtil';
import initOpenCascade from '@orillusion/opencascade';
import { test } from 'test/util';
import { OpenCascade } from './OpenCascade';
import { OpenCascadeHelper } from './OpenCascadeHelper';
export class Sample_SLA {
    lightObj: Object3D;
    scene: Scene3D;
    view: View3D;

    async run() {
        Engine3D.setting.shadow.shadowSize = 2048
        Engine3D.setting.shadow.shadowBound = 175;
        Engine3D.setting.shadow.shadowBias = 0.0061;

        Engine3D.setting.shadow.shadowBound = 550;
        Engine3D.setting.shadow.shadowBias = 0.018;
        Engine3D.setting.render.useCompressGBuffer = true;

        Engine3D.setting.reflectionSetting.reflectionProbeMaxCount = 8;
        Engine3D.setting.reflectionSetting.reflectionProbeSize = 128;
        Engine3D.setting.reflectionSetting.enable = true;
        GUIHelp.init();

        await initOpenCascade();
        await Engine3D.init();

        this.scene = new Scene3D();
        this.scene.addComponent(Stats);
        let sky = this.scene.addComponent(AtmosphericComponent);


        let mainCamera = CameraUtil.createCamera3DObject(this.scene, 'camera');
        // mainCamera.enableCSM = true;
        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let ctrl = mainCamera.object3D.addComponent(HoverCameraController);
        ctrl.setCamera(-90, -25, 200);
        // let controller = mainCamera.object3D.addComponent(FirstCharacterController);
        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = mainCamera;

        Object3DTransformTools.instance.active(this.scene);

        Engine3D.setting.render.hdrExposure = 0.0;

        await this.initScene();
        sky.relativeTransform = this.lightObj.transform;


        Engine3D.startRenderView(this.view);

        let ssgi: SSGIPost;
        let postProcessing = this.scene.addComponent(PostProcessingComponent);
        postProcessing.addPost(FXAAPost);
        let bloom = postProcessing.addPost(BloomPost);
        GUIUtil.renderBloom(bloom);

        GUIUtil.renderShadowSetting();
        let f = GUIHelp.addFolder("SSGI");
        f.open();
        GUIHelp.add(Engine3D.setting.sky, 'skyExposure', 0.0, 5.0, 0.0001);
        GUIHelp.add(Engine3D.setting.render, 'hdrExposure', 0.0, 5.0, 0.0001);
        GUIHelp.endFolder();

    }

    async initScene() {
        {
            this.lightObj = new Object3D();
            this.lightObj.rotationX = 45;
            this.lightObj.rotationY = 110;
            this.lightObj.rotationZ = 0;

            this.lightObj.rotationX = 44.56;
            this.lightObj.rotationY = 112.8;
            this.lightObj.rotationZ = 0;
            let lc = this.lightObj.addComponent(DirectLight);
            lc.lightColor = KelvinUtil.color_temperature_to_rgb(5355);
            lc.castShadow = true;
            lc.intensity = 15;
            lc.indirect = 0.1;
            this.scene.addChild(this.lightObj);
            GUIUtil.renderDirLight(lc);

            let skyReflectionObj = new Object3D();
            let spr = skyReflectionObj.addComponent(SphereReflection);
            // spr.debug(0, 10);
            this.scene.addChild(skyReflectionObj);
        }

        {
            let obj = Object3DUtil.GetCube();
            obj.scaleX = 1000;
            obj.scaleY = 1;
            obj.scaleZ = 1000;
            this.scene.addChild(obj);
        }

        {
            // OpenCascadeHelper.setOpenCascade(OpenCascade.oc);
            let shapeObj = new Object3D();
            let objdic = {};

            // let setting = {
            //     boxWidth: 2,
            //     boxHeight: 1,
            //     boxDepth: 1,
            //     spherePos: new Vector3(1, 1, 1),
            //     sphereRadius: 0.65
            // }

            let compute = () => {
                console.log("asdsa");
                // let shapes = OpenCascade.test_oc0();
                // let shapes = OpenCascade.test_oc1();
                let shapes = OpenCascade.test_oc2();
                let geos2 = OpenCascadeHelper.visualize("shapes", shapes);
                for (let i = 0; i < geos2.length; i++) {
                    let subShapeObj = objdic[`shape2_${i}`];
                    const element = geos2[i];
                    if (!subShapeObj) {
                        let obj = new Object3D();
                        let mr = obj.addComponent(MeshRenderer);
                        mr.geometry = element;

                        let mat = new LitMaterial();
                        mat.baseColor = Color.random();
                        mat.roughness = 0.1;
                        mat.metallic = 0.1;
                        mr.material = mat;
                        shapeObj.addChild(obj);
                        objdic[`shape2_${i}`] = mr;
                    } else {
                        objdic[`shape2_${i}`].geometry = element;
                    }
                }
            }
            compute();

            // GUIUtil.float(setting, "boxWidth", true, compute);
            // GUIUtil.float(setting, "boxHeight", true, compute);
            // GUIUtil.float(setting, "boxDepth", true, compute);
            // GUIUtil.vector3(setting.spherePos, true, "spherePos", compute);
            // GUIUtil.float(setting, "sphereRadius", true, compute);

            shapeObj.y = 50;
            this.scene.addChild(shapeObj);
        }
    }






}

