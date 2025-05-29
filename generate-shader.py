def generate_pixel_bool_shader(grid_size=15):
    shader_code = []

    # Shader Head
    shader_code.append('Shader "VRChat/SmartWatch_IndividualPixelBools_Full_Generated"')
    shader_code.append('{')
    shader_code.append('    Properties')
    shader_code.append('    {')
    shader_code.append('        _ColorOn ("Pixel On Color", Color) = (1,1,1,1)')
    shader_code.append('        _ColorOff ("Pixel Off Color", Color) = (0,0,0,1)')
    shader_code.append(f'        _GridSize ("Grid Size", Float) = {grid_size}')
    shader_code.append('')

    # Generate Pixel Properties
    for r in range(grid_size):
        for c in range(grid_size):
            shader_code.append(f'        _P{r}_{c} ("Pixel_{r}_{c}", Float) = 0.0')

    shader_code.append('    }') # End Properties
    shader_code.append('')
    shader_code.append('    SubShader')
    shader_code.append('    {')
    shader_code.append('        Tags { "RenderType"="Opaque" "Queue"="Geometry" "DisableBatching"="True" }')
    shader_code.append('        LOD 100')
    shader_code.append('')
    shader_code.append('        Pass')
    shader_code.append('        {')
    shader_code.append('            CGPROGRAM')
    shader_code.append('            #pragma vertex vert')
    shader_code.append('            #pragma fragment frag')
    shader_code.append('            #include "UnityCG.cginc"')
    shader_code.append('')
    shader_code.append('            struct appdata')
    shader_code.append('            {')
    shader_code.append('                float4 vertex : POSITION;')
    shader_code.append('                float2 uv : TEXCOORD0;')
    shader_code.append('            };')
    shader_code.append('')
    shader_code.append('            struct v2f')
    shader_code.append('            {')
    shader_code.append('                float2 uv : TEXCOORD0;')
    shader_code.append('                float4 vertex : SV_POSITION;')
    shader_code.append('            };')
    shader_code.append('')
    shader_code.append('            fixed4 _ColorOn;')
    shader_code.append('            fixed4 _ColorOff;')
    shader_code.append('            float _GridSize;')
    shader_code.append('')

    # Generate Cg Variable Declarations
    for r in range(grid_size):
        line = "            "
        for c in range(grid_size):
            line += f'float _P{r}_{c}; '
        shader_code.append(line.strip()) # Add line by line
    shader_code.append('')

    # Vertex Shader
    shader_code.append('            v2f vert (appdata v)')
    shader_code.append('            {')
    shader_code.append('                v2f o;')
    shader_code.append('                o.vertex = UnityObjectToClipPos(v.vertex);')
    shader_code.append('                o.uv = v.uv;')
    shader_code.append('                return o;')
    shader_code.append('            }')
    shader_code.append('')

    # Fragment Shader Head
    shader_code.append('            fixed4 frag (v2f i) : SV_Target')
    shader_code.append('            {')
    shader_code.append('                float2 screenPixelCoord = floor(i.uv * _GridSize);')
    shader_code.append('                int x = (int)screenPixelCoord.x;')
    shader_code.append(f'                int y = (int)(_GridSize - 1.0 - screenPixelCoord.y);')
    shader_code.append('')
    shader_code.append(f'                x = clamp(x, 0, (int)_GridSize - 1);')
    shader_code.append(f'                y = clamp(y, 0, (int)_GridSize - 1);')
    shader_code.append('')
    shader_code.append('                bool pixelIsOn = false;')
    shader_code.append('')

    # Generate Fragment Shader Conditional Logic
    first_condition = True
    for r in range(grid_size):
        for c in range(grid_size):
            if first_condition:
                shader_code.append(f'                if (y == {r} && x == {c}) pixelIsOn = (_P{r}_{c} > 0.5);')
                first_condition = False
            else:
                shader_code.append(f'                else if (y == {r} && x == {c}) pixelIsOn = (_P{r}_{c} > 0.5);')
    
    shader_code.append('')
    shader_code.append('                if (pixelIsOn)')
    shader_code.append('                {')
    shader_code.append('                    return _ColorOn;')
    shader_code.append('                }')
    shader_code.append('                else')
    shader_code.append('                {')
    shader_code.append('                    return _ColorOff;')
    shader_code.append('                }')
    shader_code.append('            }') # End frag
    shader_code.append('            ENDCG')
    shader_code.append('        }') # End Pass
    shader_code.append('    }') # End SubShader
    shader_code.append('}') # End Shader

    return "\n".join(shader_code)

if __name__ == "__main__":
    GRID_DIMENSION = 15
    generated_shader = generate_pixel_bool_shader(GRID_DIMENSION)
    
    # You can print it to console:
    print(generated_shader)
    
    # Or save it to a file:
    # with open("SmartWatch_IndividualPixelBools_Generated.shader", "w") as f:
    #     f.write(generated_shader)
    # print("Shader code generated to SmartWatch_IndividualPixelBools_Generated.shader")
