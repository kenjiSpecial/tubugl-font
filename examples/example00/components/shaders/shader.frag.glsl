precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUv;

const float smoothing = 1.0/16.0;
const float sdfTexel = 1.0/512.0;
const float hint_amount = 1.0;
const float subpixel_amount = 1.0;

vec3 subpixel( float v, float a ) {
    float vt      = 0.6 * v; // 1.0 will make your eyes bleed
    vec3  rgb_max = vec3( -vt, 0.0, vt );
    float top     = abs( vt );
    float bottom  = -top - 1.0;
    float cfloor  = mix( top, bottom, a );
    vec3  res     = clamp( rgb_max - vec3( cfloor ), 0.0, 1.0 );
    return res;
}

void main() {
    float sdf       = texture2D( uTexture, vUv ).a;
    float sdf_north = texture2D( uTexture, vUv + vec2( 0.0, sdfTexel ) ).a;
    float sdf_east  = texture2D( uTexture, vUv + vec2( sdfTexel, 0.0 ) ).a;

    // Estimating stroke direction by the distance field gradient vector
    vec2  sgrad     = vec2( sdf_east - sdf, sdf_north - sdf );
    float sgrad_len = max( length( sgrad ), 1.0 / 128.0 );
    vec2  grad      = sgrad / vec2( sgrad_len );
    float vgrad = abs( grad.y ); // 0.0 - vertical stroke, 1.0 - horizontal one
    
    float horz_scale  = 1.1; // Blurring vertical strokes along the X axis a bit
    float vert_scale  = 0.6; // While adding some contrast to the horizontal strokes
    float hdoffset    = mix( smoothing * horz_scale, smoothing * vert_scale, vgrad ); 
    float res_doffset = mix( smoothing, hdoffset, hint_amount );

    // float alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, distance);
    float alpha       = smoothstep( 0.5 - res_doffset, 0.5 + res_doffset, sdf );
    // Additional contrast
    alpha             = pow( alpha, 1.0 + 0.2 * vgrad * hint_amount );

    if ( alpha < 20.0 / 256.0 ) discard;
    
    vec3 channels = subpixel( grad.x * 0.5 * subpixel_amount, alpha );
    // For subpixel rendering we have to blend each color channel separately
    vec3 bg_color = vec3(0.);
    vec3 font_color = vec3(1.0);
    vec3 res = mix( bg_color, font_color, channels );
    
    gl_FragColor = vec4(res, 1.0);       
    
}   