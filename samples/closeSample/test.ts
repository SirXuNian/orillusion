import { GUIUtil } from "@samples/utils/GUIUtil";
import { Object3D, MeshRenderer, LitMaterial, Color } from "../../src";
import { Vector3 } from "../../src/math/Vector3";
import { OpenCascade } from "./OpenCascade";
import { OpenCascadeHelper } from "./OpenCascadeHelper";

export class OpenTest_1 {
    test1() {
        let command = {
            sphereRadius: 1,
            cut1_pos: new Vector3(0.0, 0, 0.7),
            cut1_scale: 1
        }

        let objdic = {};
        let compute = () => {
            // let shape2 = OpenCascade.makeLogo(command.sphereRadius, command.cut1_pos, command.cut1_scale);
            // let geos2 = OpenCascadeHelper.visualize("shape2", shape2);
            // for (let i = 0; i < geos2.length; i++) {
            //     let subShapeObj = objdic[`shape2_${i}`];
            //     const element = geos2[i];
            //     if (!subShapeObj) {
            //         let obj = new Object3D();
            //         let mr = obj.addComponent(MeshRenderer);
            //         mr.geometry = element;

            //         let mat = new LitMaterial();
            //         mat.baseColor = Color.random();
            //         mat.roughness = 0.1;
            //         mat.metallic = 1.0;
            //         mr.material = mat;
            //         obj.scaleX = 50;
            //         obj.scaleY = 50;
            //         obj.scaleZ = 50;
            //         // shapeObj.addChild(obj);
            //         objdic[`shape2_${i}`] = mr;
            //     } else {
            //         objdic[`shape2_${i}`].geometry = element;
            //     }
            // }
        }
        compute();

        GUIUtil.float(command, "sphereRadius", true, compute);
        GUIUtil.vector3(command.cut1_pos, true, "cut1_pos", compute);
        GUIUtil.float(command, "cut1_scale", true, compute);

        // shapeObj.y = 50;
        // this.scene.addChild(shapeObj);
    }
}