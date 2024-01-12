import { BitmapTexture2D, BitmapTexture2DArray, Camera3D, Color, ComputeShader, Engine3D, GPUContext, HoverCameraController, Matrix4, MeshRenderer, Object3D, SphereGeometry, StorageGPUBuffer, Struct, StructStorageGPUBuffer, Texture, UnLitMaterial, UniformGPUBuffer, Vector2, Vector3, View3D } from "@orillusion/core";
import { EarthTileCompute } from "./shader/EarthTileCompute";
import { EarthTileMaterial } from "./EarthTileMaterial";
import { EarthTileGeometry } from "./EarthTileGeometry";
import { GISMath } from "./GISMath";
import { TransformClassNormal } from "./transform";
import { GISCameraController } from "./GISCameraController";

export class TileData extends Struct {
    public offsetX: number = 0;
    public offsetY: number = 0;
    public tileSize: number = 0;
    public tileX: number = 0;
    public tileY: number = 0;
    public tileZoom: number = 0;
    public texIndex: number = 0;
    public _retain1: number = 0;
    constructor(offsetX: number = 0, offsetY: number = 0, tileSize: number = 0) {
        super();
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.tileSize = tileSize;
    }
}

export class EarthInfo extends Struct {
    public sizeX: number = 0;
    public sizeY: number = 0;
    public sizeZ: number = 0;
    public count: number = 0;
}

export class EarthTileRenderer extends MeshRenderer {
    protected tileBuffer: StructStorageGPUBuffer<TileData>;
    protected earthInfo: StructStorageGPUBuffer<EarthInfo>;
    protected earthInfoData: EarthInfo;
    protected drawBuffer: StorageGPUBuffer;
    protected texture: BitmapTexture2DArray;
    protected RTEDataBuffer: UniformGPUBuffer;

    private _tileData: TileData[];
    private _computeGeoShader: ComputeShader;
    private _needUpdate: boolean = false;

    constructor() {
        super();
    }

    public splitDouble(value: number): number[] {
        let hi = Float32Array.from([value])[0];
        let low = value - hi;
        return [hi, low];
    }

    private matrixRTE: Matrix4 = new Matrix4();
    private cameraPos: Vector3 = new Vector3();
    private cameraPos_h: Vector3 = new Vector3();
    private cameraPos_l: Vector3 = new Vector3();
    public updateRTEMat(camera: Camera3D) {
        let viewMat = camera.viewMatrix;
        let projMat = camera.projectionMatrix;

        this.cameraPos.copyFrom(camera.transform.worldPosition);
        let cameraPos_xHL = this.splitDouble(this.cameraPos.x);
        let cameraPos_yHL = this.splitDouble(this.cameraPos.y);
        let cameraPos_zHL = this.splitDouble(this.cameraPos.z);
        this.cameraPos_h.set(cameraPos_xHL[0], cameraPos_yHL[0], cameraPos_zHL[0]);
        this.cameraPos_l.set(cameraPos_xHL[1], cameraPos_yHL[1], cameraPos_zHL[1]);
        this.RTEDataBuffer.setVector3('cameraPos_h', this.cameraPos_h);
        this.RTEDataBuffer.setFloat('retain0', 0);

        this.RTEDataBuffer.setVector3('cameraPos_l', this.cameraPos_l);
        this.RTEDataBuffer.setFloat('retain1', 0);

        let mv = Matrix4.help_matrix_0;
        mv.copyFrom(viewMat);
        mv.rawData[12] = 0;
        mv.rawData[13] = 0;
        mv.rawData[14] = 0;

        this.matrixRTE.multiplyMatrices(projMat, mv);

        this.RTEDataBuffer.setMatrix('matrixRTE', this.matrixRTE);
        this.RTEDataBuffer.apply();
    }

    public init(): void {
        super.init();

        this._tileData = [];
        for (let i = 0; i < 128; i++) {
            let t = new TileData(0, 0, 0);
            t.tileZoom = -1;
            this._tileData.push(t);
        }

        this.buildData();
    }

    public start(): void {
        super.start();
        this._computeGeoShader.setStorageBuffer("vertexBuffer", this.geometry.vertexBuffer.vertexGPUBuffer);
        this._computeGeoShader.setStorageBuffer("tiles", this.tileBuffer);
        this._computeGeoShader.setStorageBuffer("earthInfo", this.earthInfo);
        this._computeGeoShader.setStorageBuffer("drawBuffer", this.drawBuffer);
    }

    public buildData() {
        this._computeGeoShader = new ComputeShader(EarthTileCompute());

        this.tileBuffer = new StructStorageGPUBuffer(TileData, this._tileData.length);
        for (let i = 0; i < this._tileData.length; i++) {
            this.tileBuffer.setStruct(TileData, i, this._tileData[i]);
        }
        this.tileBuffer.apply();

        this.earthInfoData = new EarthInfo();
        this.earthInfoData.count = this._tileData.length;
        this.earthInfo = new StructStorageGPUBuffer(EarthInfo, 1);
        this.earthInfo.setStruct(EarthInfo, 0, this.earthInfoData);
        this.earthInfo.apply();

        this.drawBuffer = new StorageGPUBuffer(4);
        this.drawBuffer.setUint32Array("", new Uint32Array([0, 0, 0, 0]));
        this.drawBuffer.apply();

        this.texs = new Array<BitmapTexture2D>(this._tileData.length);
        this.texture = new BitmapTexture2DArray(256, 256, this.texs.length);

        this.RTEDataBuffer = new UniformGPUBuffer(96);

        if (!this.material) {
            let mat = new EarthTileMaterial();
            let tileX = 0;
            let tileY = 0;
            let tileZoom = 2;
            Engine3D.res.loadTexture(`https://gac-geo.googlecnapps.cn/maps/vt?lyrs=s&gl=CN&x=${tileX}&y=${tileY}&z=${tileZoom}`).then((texture) => {
                for (let i = 0; i < this.texs.length; i++) {
                    this.texs[i] = texture as BitmapTexture2D;
                }
                this.texture.setTextures(this.texs);
            });
            mat.baseMap = this.texture;
            mat.tiles = this.tileBuffer;
            mat.RTEData = this.RTEDataBuffer;
            this.material = mat;
        }

        this.geometry = new EarthTileGeometry(this._tileData.length);

        this._needUpdate = true;
    }

    public onCompute(view: View3D, command: GPUCommandEncoder): void {
        if (this._needUpdate) {
            this._needUpdate = false;
            this.drawBuffer.setUint32Array("", new Uint32Array([0, 0, 0, 0]));
            this.drawBuffer.apply();
            this._computeGeoShader.workerSizeX = Math.floor(this._tileData.length / 256 + 1);
            this._computeGeoShader.workerSizeY = 1;
            this._computeGeoShader.workerSizeZ = 1;
            GPUContext.computeCommand(command, [this._computeGeoShader]);
        }
    }

    protected texs: BitmapTexture2D[];
    protected lastTileXY: Vector2 = new Vector2();
    protected levelZ: number = -1;
    protected sphereObj: Object3D;
    public onUpdate(view?: View3D) {
        if (this._needUpdate) {
            return;
        }

        let controller = view.camera.object3D.getComponent(GISCameraController);
        let z = 20 - GISMath.getLevel(GISMath.GetLevels(), controller.cameraDistanceToEarthSurface, 5.0);
        // z = Math.max(z, 4);

        let v = GISMath.SurfacePosToLngLat(controller.getCameraPosition());
        let LngLat = new Vector3(v[0], v[1]);
        LngLat.set(112.9603384873657, 28.167600241852714, 0);
        controller.moveTestBall(LngLat.x, LngLat.y);

        if (true) {
            const rangeAera = 8;

            let mercatorPos = GISMath.LngLatToMercator(LngLat.x, LngLat.y);

            let tileXY = GISMath.MercatorToTileXY(mercatorPos.x, mercatorPos.y, z);

            if (this.lastTileXY.equals(tileXY))
                return;

            if (this.levelZ == z)
                return;

            console.warn(`${LngLat.x}, ${LngLat.y}, ${z}`);

            this.levelZ = z;
            this.lastTileXY.copyFrom(tileXY);

            this.updateRTEMat(view.camera);

            const tileInfo = GISMath.ComputeVisibleTiles(tileXY.x, tileXY.y, z, rangeAera, true);

            let unassociatedTile = this.associationTileTextureIndex(tileInfo);

            for (let i = 0; i < unassociatedTile.length; i++) {
                let tile = unassociatedTile[i];
                // let url = `https://webrd01.is.autonavi.com/appmaptile?x=${tile.tileX}&y=${tile.tileY}&z=${tile.tileZoom}&lang=zh_cn&size=1&scale=1&style=8`
                let url = `https://gac-geo.googlecnapps.cn/maps/vt?lyrs=s&gl=CN&x=${tile.tileX}&y=${tile.tileY}&z=${tile.tileZoom}`
                Engine3D.res.loadTexture(url).then((texture) => {
                    let texIndex = this.findTextureIndex(tile);
                    if (texIndex != -1) {
                        this.texs[texIndex] = texture as BitmapTexture2D;
                        this.texture.setTexture(texIndex, this.texs[texIndex]);
                    }
                });
            }

            // update TileData to GPUBuffer
            for (let i = 0; i < this._tileData.length && i < tileInfo.length; i++) {
                this._tileData[i] = tileInfo[i];
                this.tileBuffer.setStruct(TileData, i, tileInfo[i]);
            }
            this.tileBuffer.apply();

            this.earthInfoData.count = tileInfo.length;
            this.earthInfo.setStruct(EarthInfo, 0, this.earthInfoData);
            this.earthInfo.apply();

            this._needUpdate = true;
        }
    }

    private findTextureIndex(t: TileData): number {
        for (let i = 0; i < this._tileData.length; i++) {
            let d = this._tileData[i];
            if (d.tileZoom == -1)
                continue;
            if (d.tileX == t.tileX && d.tileY == t.tileY && d.tileZoom == t.tileZoom) {
                return d.texIndex;
            }
        }
        return -1;
    }

    private associationTileTextureIndex(tiles: TileData[]): TileData[] {
        let unassociatedTile: TileData[] = [];
        let slots = new Array<boolean>(this.texs.length);
        for (let i = 0; i < tiles.length; i++) {
            let t = tiles[i];
            let index = this.findTextureIndex(t);
            if (index == -1) {
                unassociatedTile.push(t);
                continue;
            }
            t.texIndex = index;
            slots[index] = true;
        }

        let lastIndex = 0;
        for (let i = 0; i < unassociatedTile.length; i++) {
            for (let index = lastIndex; index < slots.length; index++) {
                if (!slots[index]) {
                    lastIndex = index;
                    slots[index] = true;
                    unassociatedTile[i].texIndex = index;
                    break;
                }
            }
        }
        return unassociatedTile;
    }
}
