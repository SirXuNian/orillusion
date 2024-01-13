export let EarthTileCompute = () => {
    let code = /*wgsl*/ `

    struct VertexInfo {
        position:vec3f,
        nx:f32,
        ny:f32,
        nz:f32,
        uv_x:f32,
        uv_y:f32
    }

    struct EarthInfo {
        sizeX:f32,
        sizeY:f32,
        sizeZ:f32,
        count:f32,
    }

    struct TileData {
        offsetX:f32,
        offsetY:f32,
        tileSize:f32,
        tileX:f32,
        tileY:f32,
        tileZoom:f32,
        texIndex:f32,
        _retain1:f32,
    }

    struct DrawInfo{
        skipFace:atomic<u32>,
        skipFace2:atomic<u32>,
        skipFace3:atomic<u32>,
        skipFace4:atomic<u32>,
    }

    @group(0) @binding(1) var<storage, read_write> vertexBuffer : array<VertexInfo>;
    @group(0) @binding(2) var<storage, read> tiles : array<TileData>;
    @group(0) @binding(3) var<storage, read> earthInfo : EarthInfo;
    @group(0) @binding(4) var<storage, read_write> drawBuffer : DrawInfo;

    @compute @workgroup_size(256, 1, 1)
    fn CsMain(@builtin(global_invocation_id) globalInvocation_id: vec3<u32>) {
        let _a = vertexBuffer[0];
        let _b = tiles[0];
        let _c = earthInfo.sizeX;
        // let _d = atomicLoad(&drawBuffer.skipFace);

        let index = globalInvocation_id.y * 256u + globalInvocation_id.x; 
        if (index < u32(earthInfo.count)) {
            let tile = tiles[index];
            if (isVisible(tile))
            {
                drawEarthTile(index, tile);
            }
        } else {
            hideTile();
        }
    }

    fn hideTile() {
        let segmentW:f32 = 10;
        let segmentH:f32 = 10;
        let vertexCount:u32 = u32(segmentW + 1) * u32(segmentH + 1);
        let firstIndex:u32 = atomicAdd(&drawBuffer.skipFace, 1u);
        let count:u32 = firstIndex * vertexCount + vertexCount;
        for (var i:u32 = count - vertexCount; i < count; i++) {
            vertexBuffer[i].position.x = 0;
            vertexBuffer[i].position.y = 0;
            vertexBuffer[i].position.z = 0;
        }
    }

    fn drawEarthTile(tileIndex:u32, t:TileData) {
        let width:f32 = t.tileSize;
        let height:f32 = t.tileSize;
        let segmentW:f32 = 10;
        let segmentH:f32 = 10;
        let vertexCount:u32 = u32(segmentW + 1) * u32(segmentH + 1);
        let firstIndex:u32 = atomicAdd(&drawBuffer.skipFace, 1u);
        let count:u32 = firstIndex * vertexCount + vertexCount;
        for (var i:u32 = count - vertexCount; i < count; i++) {
            let index:u32 = count - i - 1;
            let xi:u32 = index % u32(segmentW + 1);
            let yi:u32 = index / u32(segmentW + 1);

            var x:f32 = (f32(xi) / segmentW - 0.5) * width;
            var y:f32 = 0;
            var z:f32 = (f32(yi) / segmentH - 0.5) * height;

            x = x + t.offsetX;
            y = 0;
            z = z - t.offsetY;

            x = mapNumberToInterval(x);
            z = mapNumberToInterval(z);

            let o:vec3f = inverseWebMercator(x, z);
            let s:vec3f = spherify(o.x, o.z);
            vertexBuffer[i].position.x = -s.x;
            vertexBuffer[i].position.y = -s.y;
            vertexBuffer[i].position.z = s.z;

            vertexBuffer[i].nz = f32(tileIndex);
        }
    }

    const PI:f32 = 3.1415926;
    const EarthRadius:f32 = 6378137.0;
    const EarthPerimeter:f32 = 2.0 * PI * EarthRadius;
    const EPSG3857_MAX_BOUND:f32 = EarthPerimeter; // 20037508.34;
    const INV_POLE_BY_180:f32 = 180.0 / EPSG3857_MAX_BOUND;
    const PI_BY_POLE:f32 = PI / EPSG3857_MAX_BOUND;
    const PID2:f32 = PI * 0.5;
    const RAD:f32 = 180.0 / PI;
    const RADB2:f32 = RAD * 2;
    const INV_PI_BY_180_HALF_PI:f32 = RAD * PID2;
    const PolarRadius:f32 = 6356752.314245;
    const MinLatitude:f32 = -85.05112878;
    const MaxLatitude:f32 = 85.05112878;
    const MinLongitude:f32 = -180;
    const MaxLongitude:f32 = 180;
    const Min_Div_Max:f32 = 6356752.314245 / 6378137.0;
    const Max_Div_Min:f32 = 6378137.0 / 6356752.314245;

    fn mapNumberToInterval(value:f32) ->  f32 {
        let minBound:f32 = -EPSG3857_MAX_BOUND;
        let maxBound:f32 = EPSG3857_MAX_BOUND;
        return (value - MinLongitude) * (maxBound - minBound) / (MaxLongitude - MinLongitude) + minBound;
    }

    fn inverseWebMercator(x:f32, z:f32) -> vec3f {
        return vec3f(
            x * INV_POLE_BY_180, 
            0, 
            RADB2 * atan(exp(z * PI_BY_POLE)) - INV_PI_BY_180_HALF_PI
        );
    }

    fn spherify(e:f32, t:f32) -> vec3f {
        let n:f32 = (90.0 - t) / 180.0 * PI;
        let r:f32 = e / 180.0 * PI;
        let p = vec3f(
            sin(n) * cos(r), 
            cos(n),
            sin(n) * sin(r)
        );
        return CalcPolarSurface(p);
    }


   fn CalcPolarSurface(position: vec3f) ->vec3f {
        let sphereY = position.y;
        var ret:vec3f = position;
        if (abs(sphereY) >= 0.999999999) {
            ret *= PolarRadius;
            return ret;
        }
        if (abs(sphereY) < 0.0000000001) {
            ret.y = sphereY * Min_Div_Max;
            ret *= EarthRadius;
            return ret;
        }

        //sphere to polar surface
        let xzLength = length(vec2f(ret.x, ret.z));
        let tanAngle = sphereY / xzLength;

        var scale = 1.0 / (tanAngle * tanAngle) + Max_Div_Min * Max_Div_Min;
        scale = 1.0 / sqrt(scale);
        scale = scale / abs(sphereY);
        scale = EarthRadius * scale;
        ret *= scale;
        return ret;
    }

    fn drawFace(v1:vec3f, v2:vec3f, v3:vec3f, u1:vec2f, u2:vec2f, u3:vec2f) {
        let n = getNormal(v1,v2,v3);
        var fID = atomicAdd(&drawBuffer.skipFace, 1u); 
        writeVertexBuffer(fID * 3u + 0u, v1, n, u1);
        writeVertexBuffer(fID * 3u + 1u, v2, n, u2);
        writeVertexBuffer(fID * 3u + 2u, v3, n, u3);
    }

    fn getNormal(v1:vec3f , v2:vec3f , v3:vec3f) -> vec3f{
        let p0 = v2 - v1;
        let p1 = v3 - v2;
        let n = cross(p0, p1);
        return normalize(n);
    }

    fn writeVertexBuffer(vID:u32, pos:vec3f, normal:vec3f, uv:vec2f) {
        vertexBuffer[vID].position = pos;
        vertexBuffer[vID].nx = normal.x;
        vertexBuffer[vID].ny = normal.y;
        vertexBuffer[vID].nz = normal.z;
        vertexBuffer[vID].uv_x = uv.x;
        vertexBuffer[vID].uv_y = uv.y;
    }
    
    fn isVisible(t:TileData) -> bool {
        return true;
    }

    `
    return code;
}