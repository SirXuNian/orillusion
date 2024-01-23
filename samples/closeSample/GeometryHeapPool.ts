import { BoundingBox, GeometryBase, Vector3, VertexAttributeName } from '@orillusion/core';

export class GeometryHeapPool {
    private static dic: Map<string, GeometryBase> = new Map();

    public static getGeoheap(name: string): GeometryBase {
        let geo = GeometryHeapPool.dic.get(name);
        if (geo) {
            return geo;
        }
        let maxPoint = 65534;
        geo = new GeometryBase();
        geo.setIndices(new Uint16Array(maxPoint));
        geo.setAttribute(VertexAttributeName.position, new Float32Array(maxPoint * 3));
        geo.setAttribute(VertexAttributeName.normal, new Float32Array(maxPoint * 3));
        geo.setAttribute(VertexAttributeName.uv, new Float32Array(maxPoint * 2));
        geo.setAttribute(VertexAttributeName.TEXCOORD_1, new Float32Array(maxPoint * 2));
        geo.addSubGeometry({
            indexStart: 0,
            indexCount: 0,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        });
        geo.bounds = new BoundingBox(Vector3.ZERO, new Vector3(999, 999, 999));
        GeometryHeapPool.dic.set(name, geo);
        return geo;

    }
}