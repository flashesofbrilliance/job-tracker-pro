// Particle Effects Shader
// Placeholder for WebGL particle system

// Vertex Shader
attribute vec3 position;
attribute vec3 color;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
varying vec3 vColor;

void main() {
  vColor = color;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = 5.0;
}

// Fragment Shader  
#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}