export let Common_frag: string = /*wgsl*/ `
  #include "GlobalUniform"
  #include "FragmentVarying"
  #include "FragmentOutput"
  #include "ShadingInput"
  #include "ColorUtil_frag"

  var<private> ORI_FragmentOutput: FragmentOutput;
  var<private> ORI_VertexVarying: FragmentVarying;
  var<private> ORI_ShadingInput: ShadingInput;
  var<private> viewDir:vec3<f32>;
  var<private> modelIndex:u32;
  @fragment
  fn FragMain( vertex_varying:FragmentVarying ) -> FragmentOutput {
    modelIndex = u32(round(vertex_varying.index)) ; 

    ORI_VertexVarying = vertex_varying;
    viewDir = normalize(globalUniform.CameraPos.xyz - ORI_VertexVarying.vWorldPos.xyz) ;

    #if USE_COMPRESSGBUFFER
      ORI_FragmentOutput.gBuffer = vec4<f32>(0.0); 
    #else
      ORI_FragmentOutput.color = vec4<f32>(1.0, 0.0, 0.0, 1.0);
      #if USE_WORLDPOS
        ORI_FragmentOutput.worldPos = ORI_VertexVarying.vWorldPos;
      #endif
      #if USEGBUFFER
        ORI_FragmentOutput.worldNormal = vec4<f32>(ORI_ShadingInput.Normal.rgb ,1.0); 
        ORI_FragmentOutput.material = vec4<f32>(0.0,1.0,0.0,0.0);
      #endif
    #endif

    frag();
    
    #if USE_DEBUG
      debugFragmentOut();
    #endif

    #if USE_OUTDEPTH
      #if USE_LOGDEPTH
        ORI_FragmentOutput.out_depth = log2Depth(ORI_VertexVarying.fragCoord.z,globalUniform.near,globalUniform.far) ;
      #else
        ORI_FragmentOutput.out_depth = ORI_ShadingInput.FragDepth ;
      #endif
    #endif

    return ORI_FragmentOutput ;
  }


  fn packNHMDGBuffer(depth:f32, albedo:vec3f,hdrLighting:vec3f,rma:vec3f,normal:vec3f) -> vec4f  {
      var gBuffer : vec4f ;
      var octUVNormal = (octEncode(normalize(normal)) + 1.0) * 0.5 ;
      var rgbm = EncodeRGBM(hdrLighting);

      var yc = f32(pack4x8unorm(vec4f(octUVNormal,rma.z,0.0))) ;
      var zc = f32(pack4x8unorm(vec4f(rgbm.rgb,0.0)));
      var wc = f32(pack4x8unorm(vec4f(rma.rg,rgbm.a,0.0)));

      gBuffer.x = depth  ;
      gBuffer.y = yc ;
      gBuffer.z = zc ;
      gBuffer.w = wc ;
      return gBuffer ;
  }

`

