export let PixeShaderUtil = /* wgsl */`

    const inv1024:f32 = 1.0/1024.0;

    fn floatToVec2f( v:f32 ) -> vec2f {
        var VPInt:i32 = bitcast<i32>(v);
        var VPInt16k:i32 = VPInt%1024;
        var VPInt16k16k:i32 = ((VPInt-VPInt16k)/1024)%1023;
        return vec2f(f32(VPInt16k),f32(VPInt16k16k))*vec2f(inv1024);
    }

    //1048576
    fn vec2fToFloat( v:vec2f ) -> f32{
        let intv = min(vec2<i32>(floor(v*1024.)),vec2<i32>(1024));
        return bitcast<f32>(i32(intv.x+intv.y*1024));
    }
    
    fn floatToVec3f( v:f32 ) -> vec3f {
        //Returns vec3 from int
        var VPInt:i32 = bitcast<i32>(v);
        var VPInt1024:i32 = VPInt%1024;
        var VPInt10241024:i32 = ((VPInt-VPInt1024)/1024)%1024;
        return vec3f(f32(VPInt1024),f32(VPInt10241024),f32(((VPInt-VPInt1024-VPInt10241024)/1048576)))*vec3f(inv1024);
    }

    fn vec3fToFloat( v:vec3f) -> f32{
        //Returns "int" from vec3 (10 bit per channel)
        let intv = min(vec3<i32>(floor(v*1024.)),vec3<i32>(1023));
        return bitcast<f32>(i32(intv.x+intv.y*1024+intv.z*1048576));
    }

    fn floatToRGBA(v:f32) -> vec4f{
        var iv = bitcast<u32>(v);
        var color = vec4f(0.0);
        color.x = f32((iv&0x00FF0000u)>>16u)/255.0;
        color.y = f32((iv&0x000FF00u)>>8u)/255.0;
        color.z = f32(iv&0x000000FFu)/255.0;
        return color;
    }

    const bitShift:vec4f = vec4f(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    fn RGBAToFloat(v:vec4f) -> f32 {
        var f = dot(v, bitShift);
        return f;
    }

`