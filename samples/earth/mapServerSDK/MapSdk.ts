export class MapSdk {
    public static setting: any = {
        size: { w: 256, h: 256 }
    }

    public static getStaticMap(location: number[], zoom: number) {

        //https://restapi.amap.com/v3/staticmap?location=116.481485,39.990464&zoom=10&size=750*300&markers=mid,,A:116.481485,39.990464&key=<用户的key>
    }
}
//https://restapi.amap.com/v3/staticmap?location=116.481485,39.990464&zoom=10&size=256*256&markers=mid,,A:116.481485,39.990464&key=c28da94b74389e25bdb5e7dc7e9d4c0a