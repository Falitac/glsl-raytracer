#version 450

out vec4 color;

uniform vec2 resolution;
uniform float time;
uniform vec3 camPos;
uniform float camAngleV;
uniform float camAngleH;

float M_PI = 3.141592653589793;

vec4 ambient = vec4(0.55);

struct Sphere {
  vec3 center;
  float r;
  vec4 color;

  float reflectivity;
};

struct Plane {
  vec3 position;
  vec3 normal;
  vec4 color;
};

struct Ray {
  vec3 origin;
  vec3 direction;
  bool hit;
};


float sphereIntersect(Sphere s, Ray ray) {
  vec3 tmp = ray.origin - s.center;
  float a = dot(ray.direction, ray.direction);
  float b = 2.0 * dot(tmp, ray.direction);
  float c = dot(tmp, tmp) - s.r * s.r;
  float d = b * b - 4 * a * c;
  if(d < 0.0) {
    return -1.0;
  } else {
    d = sqrt(d);
    float num = -b - d;
    if(num > 0.0) {
      return num / 2.0 / a;
    } else {
      return -1.0;
    }
  }
}

float planeIntersect(Plane p, Ray ray) {
  float c = length(p.position);
  return (c - dot(p.normal, ray.origin)) / dot(p.normal, ray.direction);
}

struct ZBuffer {
  float tValue;
  int id;
};

const int sphereCount = 10;
Sphere spheres[sphereCount];

struct IterationData {
  vec4 color;
  Ray currentRay;
};

IterationData scene(Ray r, vec3 lightPosition) {
  IterationData result;
  result.color = vec4(0.0);
  ZBuffer results[sphereCount];

  for(int i = 0; i < sphereCount; i++) {
    results[i].id = i;
    results[i].tValue = sphereIntersect(spheres[i], r);
  }
  for(int i = 0; i < sphereCount; i++) {
    for(int j = i + 1; j < sphereCount; j++) {
      if(results[j - 1].tValue > results[j].tValue) {
        ZBuffer tmp = results[j - 1];
        results[j - 1] = results[j];
        results[j] = tmp;
      }
    }
  }
  int i = 0;
  for(; i < sphereCount; i++) {
    if(results[i].tValue >= 0.0) {
      int id = results[i].id;
      float t = results[i].tValue;

      vec3 intersectionPoint = r.direction * t;
      vec3 diff = lightPosition - intersectionPoint;
      vec3 lightDir = normalize(diff);
      float rr = dot(diff, diff);

      vec3 normal = normalize(intersectionPoint - spheres[id].center);
      float d = clamp(dot(lightDir, normal), 0.0, 1.0);
      vec4 diffusion = vec4(d);

      vec3 reflectDirection = reflect(-lightDir, normal);
      float specularity = pow(max(dot(reflectDirection, - r.direction), 0.0), 64) * 0.2;
      vec4 specular = vec4(specularity);

      vec4 reflectColor = vec4(0.0);
      result.currentRay.origin = intersectionPoint;
      result.currentRay.direction = reflectDirection;
      result.currentRay.hit = true;

      Ray shadowCheck;
      shadowCheck.origin = intersectionPoint;
      shadowCheck.direction = normalize(-intersectionPoint + lightPosition);
      for(int j = 0; j < sphereCount; j++) {
        if(j != id) {
          if(0.0 < sphereIntersect(spheres[j], shadowCheck) && d > 0.0) {
            diffusion = specular = vec4(0.0);
          }
        }
      }

      result.color = (ambient + diffusion + specular) * spheres[id].color;
      break;
    }
  }
  if(i == sphereCount) {
    result.currentRay.hit = false;
  }
  return result;
}
mat3 rotateY(float angle) {
  return mat3(
    cos(angle), 0, sin(angle),
    0, 1, 0,
    -sin(angle), 0, cos(angle)
    );
}

mat3 rotateX(float angle) {
  return mat3(
    1, 0, 0,
    0, cos(angle), sin(angle),
    0, sin(angle), cos(angle)
    );
}

void main() {
  vec2 normCoord = gl_FragCoord.xy / resolution - vec2(0.5, 0.5);
  float aspect = resolution.x / resolution.y;
  normCoord.y /= aspect;
  normCoord *= 1.0;
  //normCoord.y = -normCoord.y;
  //normCoord -= vec2(0.5);
  //normCoord *= 2.0;
  float cameraLen = 1.0;

  vec3 camDir = vec3(normCoord, cameraLen);
  camDir = normalize(camDir);
  camDir = rotateY(-camAngleH) * camDir;
  camDir = rotateX(camAngleV) * camDir;


  vec3 lightPosition;
  float lightRadius = 79.0;
  lightPosition.x = lightRadius*sin(time);
  lightPosition.y = lightRadius*cos(time);
  lightPosition.x = 0.0;
  lightPosition.y = 0.0;



  Ray r;
  r.hit = false;
  r.origin = camPos;
  r.direction = normalize(camDir);
  r.direction = normalize(vec3(normCoord, cameraLen));

  float zValue = 3400.0 ;
  lightPosition.z = zValue - 880.0;
  for(int i = 0; i < sphereCount; i++) {
    float theta = time * pow(1.5, sphereCount - i) * 0.1 * M_PI * 2.0 / float(sphereCount);
    //theta = time / 3.0;
    float radius = 300.0 + i * 70.0;
    spheres[i].center.x = radius * sin(theta);
    spheres[i].center.y = radius * cos(theta);
    spheres[i].center.z = zValue;
    spheres[i].color.r = (sin(i * 8.8) + 1.0) / 2.0;
    spheres[i].color.g = (cos(i * 2.5) + 1.0) / 2.0;
    spheres[i].color.b = (sin(i * 1.35) + 1.0) / 2.0;
    spheres[i].color.a = 1.0;
    spheres[i].reflectivity = 1.0;
  }
  spheres[0].center.xy = vec2(0.0);

  spheres[0].r = 293.073;
  spheres[1].r = 1.027;
  spheres[2].r = 2.547;
  spheres[3].r = 2.681;
  spheres[4].r = 1.427;
  spheres[5].r = 29.424;
  spheres[6].r = 24.508;
  spheres[7].r = 10.674;
  spheres[8].r = 10.363;
  spheres[9].r = 1.000;

  spheres[0].color.rgb = vec3(0.99, 0.83, 0.25);
  spheres[1].color.rgb = vec3(0.31, 0.31, 0.32);
  spheres[2].color.rgb = vec3(0.97, 0.88, 0.69);
  spheres[3].color.rgb = vec3(0.62, 0.76, 0.39);
  spheres[4].color.rgb = vec3(0.74, 0.15, 0.2);
  spheres[5].color.rgb = vec3(0.83, 0.61, 0.49);

  spheres[6].color.rgb = vec3(0.77, 0.67, 0.43);
  spheres[7].color.rgb = vec3(0.73, 0.88, 0.89);
  spheres[8].color.rgb = vec3(0.24, 0.33, 0.91);
  spheres[9].color.rgb = vec3(0.59, 0.52, 0.44);


  //lightPosition.z = 2.0;
  color = vec4(0.0, 0.0, 0.0, 1.0);
  IterationData id;
  id.currentRay = r;
  for(int i = 0; i < 1; i++) {
    id = scene(id.currentRay, lightPosition);
    if(id.currentRay.hit) {
      color = mix(color, id.color, 0.5); 
    }
  }

}