import { Color, Engine3D, Material, Matrix4, RenderShaderPass, Shader, ShaderLib, Struct, StructStorageGPUBuffer, Texture, UniformGPUBuffer } from "@orillusion/core";
import { EarthTileShader } from "./shader/EarthTileShader";

export class EarthTileMaterial extends Material {

    /**
     * @constructor
     */
    constructor() {
        super();

        ShaderLib.register("EarthTileShader", EarthTileShader);

        let shader = new Shader();
        let colorShader = new RenderShaderPass('EarthTileShader', 'EarthTileShader');
        colorShader.setShaderEntry(`VertMain`, `FragMain`);
        // colorShader.doubleSide = true;
        shader.addRenderPass(colorShader);

        this.shader = shader;

        // default value
        this.baseMap = Engine3D.res.whiteTexture;
    }

    public set baseMap(texture: Texture) {
        this.shader.setTexture(`baseMap`, texture);
    }

    public get baseMap() {
        return this.shader.getTexture(`baseMap`);
    }

    public set tiles(data: StructStorageGPUBuffer<Struct>) {
        this.shader.setStructStorageBuffer(`tiles`, data);
    }

    public get tiles() {
        return this.shader.getStructStorageBuffer(`tiles`);
    }

    public set earthInfo(data: StructStorageGPUBuffer<Struct>) {
        this.shader.setStructStorageBuffer(`earthInfo`, data);
    }

    public get earthInfo() {
        return this.shader.getStructStorageBuffer(`earthInfo`);
    }

    public set RTEData(data: UniformGPUBuffer) {
        this.shader.setUniformBuffer(`args`, data);
    }

    public get RTEData(): UniformGPUBuffer {
        return this.shader.getUniformBuffer(`args`) as UniformGPUBuffer;
    }

    /**
     * set base color (tint color)
     */
    public set baseColor(color: Color) {
        this.shader.setUniformColor(`baseColor`, color);
    }

    /**
     * get base color (tint color)
     */
    public get baseColor() {
        return this.shader.getUniformColor("baseColor");
    }
}