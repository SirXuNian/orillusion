import { BlendMode, GPUCullMode, RegisterComponent, RegisterShader, Texture } from "../../../../..";
import { Engine3D } from "../../../../../Engine3D";
import { RenderShader } from "../../../../../gfx/graphics/webGpu/shader/RenderShader";
import { Color } from "../../../../../math/Color";
import { Vector4 } from "../../../../../math/Vector4";


@RegisterShader(LitShader, 'LitShader')
export class LitShader extends RenderShader {

    constructor() {
        super('PBRLItShader', 'PBRLItShader');
        this.setShaderEntry(`VertMain`, `FragMain`)
        let shaderState = this.shaderState;
        shaderState.acceptShadow = true;
        shaderState.castShadow = true;
        shaderState.receiveEnv = true;
        shaderState.acceptGI = true;
        shaderState.useLight = true;
        this.setDefine('USE_BRDF', true);
        this.setDefine('USE_AO_R', true);
        this.setDefine('USE_ROUGHNESS_G', true);
        this.setDefine('USE_METALLIC_B', true);
        this.setDefine('USE_ALPHA_A', true);

        this.setDefault();
    }

    public setDefault() {
        this.setUniformFloat(`shadowBias`, 0.00035);
        this.setUniformVector4(`transformUV1`, new Vector4(0, 0, 1, 1));
        this.setUniformVector4(`transformUV2`, new Vector4(0, 0, 1, 1));
        this.setUniformColor(`baseColor`, new Color());
        this.setUniformColor(`emissiveColor`, new Color(1, 1, 1));
        this.setUniformVector4(`materialF0`, new Vector4(0.04, 0.04, 0.04, 1));
        this.setUniformColor(`specularColor`, new Color(0.04, 0.04, 0.04));
        this.setUniformFloat(`envIntensity`, 1);
        this.setUniformFloat(`normalScale`, 1);
        this.setUniformFloat(`roughness`, 1.0);
        this.setUniformFloat(`metallic`, 0.0);
        this.setUniformFloat(`ao`, 1.0);
        this.setUniformFloat(`roughness_min`, 0.0);
        this.setUniformFloat(`roughness_max`, 1.0);
        this.setUniformFloat(`metallic_min`, 0.0);
        this.setUniformFloat(`metallic_max`, 1.0);
        this.setUniformFloat(`emissiveIntensity`, 0.0);
        this.setUniformFloat(`alphaCutoff`, 0.0);
        this.setUniformFloat(`ior`, 1.5);
        this.setUniformFloat(`clearcoatFactor`, 0.0);
        this.setUniformFloat(`clearcoatRoughnessFactor`, 0.0);
        this.setUniformColor(`clearcoatColor`, new Color(1, 1, 1));
        this.setUniformFloat(`clearcoatWeight`, 0.0);
    }

    public set _MainTex(value: Texture) {
        this.setTexture("baseMap", value);
    }

    public set _BumpMap(value: Texture) {
        this.setTexture("normalMap", value);
    }

    public set _MaskTex(value: Texture) {
        this.setTexture("maskMap", value);
    }

    public set _UVTransform(value: Vector4) {
        this.setUniformVector4("transformUV1", value);
    }

    public set _Metallic(value: number) {
        this.setUniformFloat("metallic", value);
    }

    public set _Roughness(value: number) {
        this.setUniformFloat("roughness", value);
    }


    public set _MainColor(value: Color) {
        this.setUniformColor("baseColor", value);
    }

    public set _AlphaCutof(value: number) {
        this.setUniformFloat("alphaCutoff", value);
    }

    public set _DoubleSidedEnable(value: number) {
        this.shaderState.cullMode = value ? GPUCullMode.none : this.shaderState.cullMode;
    }

    public set _SurfaceType(value: number) {
        if (value == 0) {
            this.blendMode = BlendMode.NONE;
        } else {
            this.blendMode = BlendMode.ALPHA;
        }
    }

    public set _AlphaCutoffEnable(value: number) {
        if (value == 0) {
            this.setDefine('USE_ALPHACUT', false);
        } else {
            this.setDefine('USE_ALPHACUT', true);
        }
    }

}