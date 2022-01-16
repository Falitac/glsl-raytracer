#version 450

out vec4 position;

void main() {
  // 2 * i % 2 - 1
  vec2 positions[] = {
    vec2(-1.0, -1.0),
    vec2(-1.0, +1.0),
    vec2(+1.0, -1.0),
    vec2(+1.0, +1.0)
  };

  gl_Position = vec4(0.0);
  gl_Position.xy = positions[gl_VertexID];
}