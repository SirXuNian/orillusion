import { Engine3D, GeometryBase, Quaternion, Vector3, VertexAttributeName, deg2Rad, rad2Deg } from "@orillusion/core";

export class EarthGeometry extends GeometryBase {
    constructor() {
        super()
        this.buidGeometry()
    }

    private buidGeometry() {
        let w = 200;
        let h = 200;
        let sw = w - 1;
        let sh = h - 1;

        let vertexCount = w * h;
        let position_arr = new Float32Array(vertexCount * 3);
        let normal_arr = new Float32Array(vertexCount * 3);
        let uv_arr = new Float32Array(vertexCount * 2);
        let indices_arr = new Uint32Array(sw * sh * 6);

        let index = 0;
        for (let y = 0; y < h; y++) {
            var horAngle: number = (Math.PI * y) / sh;
            var zz: number = -50 * Math.cos(horAngle);
            var ringRadius: number = 50 * Math.sin(horAngle);

            for (let x = 0; x < w; x++) {
                let px = x / sw;
                let py = y / sh;

                var verAngle: number = (2 * Math.PI * x) / sw;
                var xx: number = ringRadius * Math.cos(verAngle);
                var yy: number = ringRadius * Math.sin(verAngle);
                var normLen: number = 1 / Math.sqrt(xx * xx + yy * yy + zz * zz);

                position_arr[index * 3 + 0] = yy;
                position_arr[index * 3 + 1] = zz;
                position_arr[index * 3 + 2] = xx;

                normal_arr[index * 3 + 0] = yy * normLen;
                normal_arr[index * 3 + 1] = zz * normLen;
                normal_arr[index * 3 + 2] = xx * normLen;

                uv_arr[index * 2 + 0] = px;
                uv_arr[index * 2 + 1] = 1.0 - py;

                index++;


            }
        }

        //0 j * w +  i  = 0
        //1 (  j + 1 ) * w + i  = 3
        //2 (  j + 1 ) * w + ( i + 1 )  =4
        //3 (  j ) * w + i  = 1
        // 0 1 2 
        // 0 2 3 
        let vi = 0;
        for (let j = 0; j < sh; j++) {
            for (let i = 0; i < sw; i++) {
                let i0 = j * w + i;
                let i2 = (j + 1) * w + i;
                let i3 = (j + 1) * w + (i + 1);
                let i1 = j * w + (i + 1);

                indices_arr[vi + 0] = i0;
                indices_arr[vi + 1] = i3;
                indices_arr[vi + 2] = i2;

                indices_arr[vi + 3] = i3;
                indices_arr[vi + 4] = i0;
                indices_arr[vi + 5] = i1;

                // indices_arr[vi + 3] = i2;
                // indices_arr[vi + 4] = i3;
                // indices_arr[vi + 5] = i0;

                vi += 6;
            }
        }

        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);
        this.setAttribute(VertexAttributeName.TEXCOORD_1, uv_arr);

        this.addSubGeometry({
            indexStart: 0,
            indexCount: indices_arr.length,
            vertexStart: 0,
            vertexCount: 0,
            firstStart: 0,
            index: 0,
            topology: 0
        });
    }
}
