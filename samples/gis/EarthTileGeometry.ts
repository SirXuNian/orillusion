import { GeometryBase, VertexAttributeName } from "@orillusion/core";

export class EarthTileGeometry extends GeometryBase {

    protected count: number = 0;
    protected width: number;
    protected height: number;
    protected segmentW: number;
    protected segmentH: number;

    /**
     *
     * @constructor
     */
    constructor(count: number, width: number = 10, height: number = 10, segmentW: number = 10, segmentH: number = 10) {
        super();
        this.count = count;
        this.width = width;
        this.height = height;
        this.segmentW = segmentW;
        this.segmentH = segmentH;
        this.buildGeometry();
    }

    private buildGeometry(): void {
        let vertexCount = (this.segmentW + 1) * (this.segmentH + 1);
        let position_arr = new Float32Array(this.count * vertexCount * 3);
        let normal_arr = new Float32Array(this.count * vertexCount * 3);
        let uv_arr = new Float32Array(this.count * vertexCount * 2);

        let numIndices = this.count * (this.segmentH * this.segmentW * 6);
        let indices_arr = new Uint32Array(numIndices);

        numIndices = 0;
        var tw: number = this.segmentW + 1;
        for (var num: number = 0; num < this.count; ++num) {

            numIndices = num * (this.segmentH * this.segmentW * 6);
            var indexP: number = num * vertexCount * 3;
            var indexN: number = num * vertexCount * 3;
            var indexU: number = num * vertexCount * 2;

            for (var yi: number = 0; yi <= this.segmentH; ++yi) {
                for (var xi: number = 0; xi <= this.segmentW; ++xi) {
                    let x = (xi / this.segmentW - 0.5) * this.width;
                    let y = (yi / this.segmentH - 0.5) * this.height;

                    position_arr[indexP++] = x;
                    position_arr[indexP++] = 0;
                    position_arr[indexP++] = y;

                    normal_arr[indexN++] = 0;
                    normal_arr[indexN++] = 1;
                    normal_arr[indexN++] = 0;

                    uv_arr[indexU++] = xi / this.segmentW;
                    uv_arr[indexU++] = yi / this.segmentH;

                    if (xi != this.segmentW && yi != this.segmentH) {
                        let base = (num * vertexCount) + xi + yi * tw;
                        indices_arr[numIndices++] = (base + 1); //1
                        indices_arr[numIndices++] = base; //0
                        indices_arr[numIndices++] = (base + tw); //2

                        indices_arr[numIndices++] = (base + 1); //1
                        indices_arr[numIndices++] = (base + tw); //2
                        indices_arr[numIndices++] = (base + tw + 1); //3
                    }
                }
            }
        }

        this.setIndices(indices_arr);
        this.setAttribute(VertexAttributeName.position, position_arr);
        this.setAttribute(VertexAttributeName.normal, normal_arr);
        this.setAttribute(VertexAttributeName.uv, uv_arr);

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
