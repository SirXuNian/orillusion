import { BoundingBox, Engine3D, GPUAddressMode, GeometryBase, MeshRenderer, Object3D, PlaneGeometry, UnLitMaterial, Vector3, VertexAttributeName } from "@orillusion/core";
import { EarthTileGeometry } from "./EarthTileGeometry";
import { GISMath } from "./GISMath";

export class EarthTile extends Object3D {
    public offsetX: number;
    public offsetY: number
    public tileSize: number;
    public tileX: number;
    public tileY: number;
    public tileZoom: number;

    constructor(offsetX: number, offsetY: number, tileSize: number, tileX: number, tileY: number, tileZoom: number) {
        super();
        console.warn(offsetX, offsetY, tileSize, tileX, tileY, tileZoom);
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.tileSize = tileSize;
        this.tileX = tileX;
        this.tileY = tileY;
        this.tileZoom = tileZoom;
        this.build();
    }

    protected build() {
        let geometry = new PlaneGeometry(this.tileSize, this.tileSize, 10, 10);
        let vertexs = geometry.getAttribute(VertexAttributeName.position).data;
        const count = vertexs.length / 3;
        for (let i = 0; i < count; i++) {
            let x = vertexs[3 * i + 0] + this.offsetX;
            let y = vertexs[3 * i + 1];
            let z = vertexs[3 * i + 2] - this.offsetY;

            x = GISMath.MapNumberToInterval(x, GISMath.MinLongitude, GISMath.MaxLongitude, -GISMath.EPSG3857_MAX_BOUND, GISMath.EPSG3857_MAX_BOUND);
            z = GISMath.MapNumberToInterval(z, GISMath.MinLongitude, GISMath.MaxLongitude, -GISMath.EPSG3857_MAX_BOUND, GISMath.EPSG3857_MAX_BOUND);

            const o = GISMath.inverseWebMercator(x, z);
            const s = GISMath.spherify(o.x, o.z);
            vertexs[3 * i + 0] = -s.x;
            vertexs[3 * i + 1] = -s.y;
            vertexs[3 * i + 2] = s.z;
        }

        let mr = this.addComponent(MeshRenderer);
        mr.geometry = geometry;
        let mat = new UnLitMaterial();
        mr.material = mat;
        Engine3D.res.loadTexture(`https://gac-geo.googlecnapps.cn/maps/vt?lyrs=s&gl=CN&x=${this.tileX}&y=${this.tileY}&z=${this.tileZoom}`).then((texture) => {
            texture.addressModeU = texture.addressModeV = GPUAddressMode.clamp_to_edge;
            mat.baseMap = texture;
        });
    }
}
