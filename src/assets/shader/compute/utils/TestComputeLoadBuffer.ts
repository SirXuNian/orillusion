export let TestComputeLoadBuffer = /* wgsl */`
    #include "GlobalUniform"
    #include "MathShader"
    #include "FastMathShader"
    #include "PixeShaderUtil"
    #include "ColorUtil_frag"
    #include "GBufferStand"

    struct Uniform{
        state:i32,
        state1:i32,
        state2:i32,
        state3:i32,
    }

    @group(0) @binding(2) var outputTexture : texture_storage_2d<rgba16float, write>;
    @group(0) @binding(3) var reflectionsGBufferTexture : texture_2d<f32>;
    @group(0) @binding(4) var envMap : texture_2d<f32>;
    @group(0) @binding(5) var<uniform> uniformData : Uniform;
    
    var<private> fragCoord:vec2<u32>;
    var<private> screenSize:vec2<u32>;
    var<private> fragColor:vec4f;
    const PI = 3.1415926 ;
    
    @compute @workgroup_size( 16 , 16 , 1 )
    fn CsMain( @builtin(workgroup_id) workgroup_id : vec3<u32> , @builtin(global_invocation_id) globalInvocation_id : vec3<u32>)
    {
        
        fragCoord = globalInvocation_id.xy;
        screenSize = vec2u(textureDimensions(outputTexture));

        useNormalMatrixInv();

        var outPixel:vec3f ;
        var a = globalUniform.time ;

        var state = uniformData.state ;
        //render normal color
        let gBuffer : GBuffer = getGBuffer( vec2i(fragCoord) );
        fragColor = vec4f(getColorFromGBuffer(gBuffer),1.0) ;
        fragColor = vec4f(vec3f(gBuffer.x),1.0) ;
        // fragColor = vec4f(1.0,0.0,0.0,1.0) ;

        let size = 128.0; 
        let renderRec1 = vec4f(0.0,0.0,size,size);
        renderBufferToViewPort(reflectionsGBufferTexture,renderRec1);

        let renderRec2 = vec4f(0.0,size,256.0,256.0);
        renderColorBufferToViewPort(envMap,renderRec2);
      
        //not chage final color out put 
        textureStore(outputTexture, fragCoord , fragColor );
    }

    fn renderBufferToViewPort( texture:texture_2d<f32> , viewRectangle:vec4f) {
        let size = vec2f(textureDimensions(texture));
        let f32FragCoord = vec2f(fragCoord);
        if(insideRectangle(f32FragCoord,viewRectangle)){
            let uv = clipViewUV(viewRectangle,size,f32FragCoord);
            let gBuffer = textureGBuffer(texture,uv);
            let color = getColorFromGBuffer(gBuffer);
            fragColor = vec4f(color,1.0); 
        }
    }

    fn renderColorBufferToViewPort( texture:texture_2d<f32> , viewRectangle:vec4f) {
        let size = vec2f(textureDimensions(texture));
        let f32FragCoord = vec2f(fragCoord);
        if(insideRectangle(f32FragCoord,viewRectangle)){
            let uv = clipViewUV(viewRectangle,size,f32FragCoord);
            let color = textureLoad(texture, uv , 0).rgb;
            fragColor = vec4f(color,1.0); 
        }
    }

    fn textureGBuffer( texture:texture_2d<f32> , fragCoord:vec2u ) -> GBuffer {
        let bufferTex = textureLoad(texture, fragCoord , 0) ;
        var gBuffer:GBuffer ;
        gBuffer.x = bufferTex.x ;
        gBuffer.y = bufferTex.y ;
        gBuffer.z = bufferTex.z ;
        gBuffer.w = bufferTex.w ;
        return gBuffer ;
    }

 
`