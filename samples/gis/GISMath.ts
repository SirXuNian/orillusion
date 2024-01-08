import { DEGREES_TO_RADIANS, RADIANS_TO_DEGREES, Vector2, Vector3 } from "@orillusion/core";
import { TileData } from "./EarthTileRenderer";

export class GISPostion {
    public lng: number;
    public lat: number;
    constructor(longitude: number, latitude: number) {
        this.lng = longitude;
        this.lat = latitude;
    }

    public ToMercatorPos(): MercatorPos {
        return null;
    }
}

export class MercatorPos {
    public x: number;
    public y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public ToGISPostion(): GISPostion {
        return null;
    }
}

export class GISMath {
    public static readonly EarthRadius = 6378137.0;
    public static readonly EarthPerimeter = 2 * Math.PI * GISMath.EarthRadius;
    public static readonly EPSG3857_MAX_BOUND = this.EarthPerimeter;
    // public static readonly EPSG3857_MAX_BOUND = 20037508.34;
    public static readonly INV_POLE_BY_180 = 180 / GISMath.EPSG3857_MAX_BOUND;
    public static readonly PI_BY_POLE = Math.PI / GISMath.EPSG3857_MAX_BOUND;
    public static readonly PID2 = Math.PI * 0.5;
    public static readonly PIX2 = Math.PI * 2;
    public static readonly RAD = 180 / Math.PI;
    public static readonly RADB2 = GISMath.RAD * 2;
    public static readonly PID360 = Math.PI / 360;
    public static readonly INV_PI_BY_180_HALF_PI = GISMath.RAD * GISMath.PID2;

    public static readonly PolarRadius = 6356752.314245;
    public static readonly MinLatitude = -85.05112878;
    public static readonly MaxLatitude = 85.05112878;
    public static readonly MinLongitude = -180;
    public static readonly MaxLongitude = 180;
    public static readonly Size = 360;
    public static readonly TileSize = 256;

    public static CameraToLngLat(roll: number, pitch: number, result: Vector2 = new Vector2()): Vector2 {
        let lat = -pitch;
        let lng = (roll / 180 * Math.PI + (Math.PI / 2)) % this.PIX2;
        if (lng < 0) {
            lng += this.PIX2;
        }
        lng *= 180 / Math.PI;
        if (lng > 180) {
            lng -= 360
        }
        result.set(lng, lat);
        return result;
    }

    public static GetTileXY(lng: number, lat: number, levelZ: number) : Vector2 {
        return new Vector2();
    }

    public static Test_getResolution(levelZ: number): number {
        const tileNums = Math.pow(2, levelZ);
        const tileTotalPixel = tileNums * GISMath.TileSize;
        return GISMath.EarthPerimeter / tileTotalPixel;
    }

    public static LngLatToMercator(lng: number, lat: number, result: Vector2 = new Vector2()): Vector2 {
        let x = lng * DEGREES_TO_RADIANS * GISMath.EarthRadius;
        let rad = lat * DEGREES_TO_RADIANS;
        let sin = Math.sin(rad);
        let y = GISMath.EarthRadius / 2 * Math.log((1 + sin) / (1 - sin));
        result.set(x, y);
        return result;
    }

    public static getResolution(levelZ: number): number {
        const tileNums = Math.pow(2, levelZ);
        const tileTotalPixel = tileNums * GISMath.TileSize;
        return GISMath.EarthPerimeter / tileTotalPixel;
    }

    public static MercatorToTileXY(mercatorX: number, mercatorY: number, levelZ: number, result: Vector2 = new Vector2()): Vector2 {
        mercatorX += this.EarthPerimeter / 2;
        mercatorY = this.EarthPerimeter / 2 - mercatorY;
        const resolution = this.getResolution(levelZ);
        let tileX = Math.floor(mercatorX / resolution / this.TileSize);
        let tileY = Math.floor(mercatorY / resolution / this.TileSize);
        result.set(tileX, tileY);
        return result;
    }

    public static MercatorToLngLat(x: number, y: number, result: Vector2 = new Vector2()): Vector2 {
        let lng = x * RADIANS_TO_DEGREES / GISMath.EarthRadius;
        let lat = (2 * Math.atan(Math.exp(y / GISMath.EarthRadius)) - (Math.PI / 2)) * RADIANS_TO_DEGREES;
        result.set(lng, lat);
        return result;
    }



    //------------------------------------------------------------------------------------------------------------------;

    public static spherify(e: number, t: number): Vector3 {
        const n = (90 - t) / 180 * Math.PI, r = e / 180 * Math.PI;
        let result = Vector3.HELP_0;
        result.set(GISMath.EarthRadius * Math.sin(n) * Math.cos(r), GISMath.EarthRadius * Math.cos(n), GISMath.PolarRadius * Math.sin(n) * Math.sin(r));
        return result;
    }

    public static inverseWebMercator(x: number, z: number, y?: number): Vector3 {
        let result = Vector3.HELP_0;
        result.set(x * GISMath.INV_POLE_BY_180, y, GISMath.RADB2 * Math.atan(Math.exp(z * GISMath.PI_BY_POLE)) - GISMath.INV_PI_BY_180_HALF_PI);
        return result;
    }

    public static MapNumberToInterval(v0: number, minV0: number, maxV0: number, minV1: number, maxV1: number) {
        return (v0 - minV0) * (maxV1 - minV1) / (maxV0 - minV0) + minV1;
    }

    private static Levels = [];
    public static GetBestLevelResolution(t: number, i: number) {
        const n = window.devicePixelRatio * i;
        const r = Math.tan(t / 50 * 0.5);

        if (this.Levels.length === 0) {
            for (let z = 0; z < 20; z++) {
                const tileNums = Math.pow(2, z);
                const tileTotalPixel = tileNums * GISMath.TileSize;
                this.Levels.push(tileTotalPixel);
            }
        }

        let level = 0;
        for (level = 0; level < this.Levels.length; level++) {
            if (r * this.Levels[level] >= n) {
                // console.error(`${r}, ${this.Levels[level]}, ${r * this.Levels[level]} > ${n}, ${level}`);
                break;
            }
        }
        return level - 1;
    }

    public static CameraToLatlong(beta: number, alpha: number) {
        let n = -alpha;
        let r = (beta / 180 * Math.PI + (Math.PI / 2)) % this.PIX2;
        r < 0 && (r += this.PIX2);
        r *= 180 / Math.PI;
        r > 180 && (r -= 360);
        return new Vector2(n, r);
    }

    public static LatLongToPixelXY(latitude: number, longitude: number, levelOfDetail: number) {
        latitude = this.Clamp(latitude, this.MinLatitude, this.MaxLatitude);
        longitude = this.Clamp(longitude, this.MinLongitude, this.MaxLongitude);

        let x = (longitude + 180) / 360;
        let sinLatitude = Math.sin(latitude * Math.PI / 180);
        let y = 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI);

        let mapSize = this.MapSize(levelOfDetail);
        let pixelX = this.Clamp(x * mapSize + 0.5, 0, mapSize - 1);
        let pixelY = this.Clamp(y * mapSize + 0.5, 0, mapSize - 1);
        return new Vector2(pixelX, pixelY);
    }

    public static Clamp(n: number, minValue: number, maxValue: number) {
        return Math.min(Math.max(n, minValue), maxValue);
    }

    public static MapSize(levelOfDetail: number) {
        return 256 << levelOfDetail;
    }

    public static PixelXYToTileXY(pixelX: number, pixelY: number) {
        let tileX = Math.floor(pixelX / 256);
        let tileY = Math.floor(pixelY / 256);
        return new Vector2(tileX, tileY)
    }

    public static PixelToWorldPos(pixelX: number, pixelY: number, level: number): Vector3 {
        let l = 0;
        let u = 0;
        let h = 180;
        let d = 360;
        for (let i = 0; i < level; i++) {
            h /= 2;
            d /= 2;
            l += h;
            u += d;
        }
        const f = -l, p = l;

        const offsetX = -(u + f - pixelX);
        const offsetY = p - pixelY;

        let x = offsetX;
        let y = 0;
        let z = -offsetY;

        x = this.MapNumberToInterval(x, -this.EPSG3857_MAX_BOUND, this.EPSG3857_MAX_BOUND, this.MinLongitude, this.MaxLongitude);
        z = this.MapNumberToInterval(z, -this.EPSG3857_MAX_BOUND, this.EPSG3857_MAX_BOUND, this.MinLongitude, this.MaxLongitude)

        let o = this.inverseWebMercator(x, z)
        let s = this.spherify(o.x, o.z)
        return new Vector3(-s.x, -s.y, s.z);
    }

    public static ComputeVisibleTiles(tileX: number, tileY: number, level: number, rangeAera: number, center: boolean): TileData[] {
        if (center) {
            let v = Math.floor(rangeAera / 2);
            tileX -= v;
            tileY -= v;
        }

        let tileArr: TileData[] = [];
        const tileTotal = Math.pow(2, level);
        const tileSize = this.Size / tileTotal;

        let l = 0;
        let u = 0;
        let h = 180;
        let d = 360;
        for (let i = 0; i < level; i++) {
            h /= 2;
            d /= 2;
            l += h;
            u += d;
        }
        const f = -l, p = l;

        for (let y = tileY; y < tileY + rangeAera; y++) {
            if (y < 0 || y >= tileTotal)
                continue;
            for (let x = tileX; x < tileX + rangeAera; x++) {
                if (x < 0 || x >= tileTotal)
                    continue;
                const offsetX = -(u + f - x * tileSize);
                const offsetY = p - y * tileSize;
                let tile = new TileData(offsetX, offsetY, tileSize);
                tile.tileX = x;
                tile.tileY = y;
                tile.tileZoom = level;
                tileArr.push(tile);
            }
        }
        // console.log(tileArr, "tiles", tileSize);
        return tileArr;
    }
}
