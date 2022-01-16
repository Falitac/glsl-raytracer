#version 450

out vec4 color;

uniform vec2 resolution;
uniform float time;

float M_PI = 3.141592653589793;

vec4 ambient = vec4(0.15);

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
      vec4 diffusion = vec4(d) / rr * 3200.0;

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

void main() {
  vec2 normCoord = gl_FragCoord.xy / resolution - vec2(0.5, 0.5);
  float aspect = resolution.x / resolution.y;
  normCoord.y /= aspect;
  normCoord *= 2.2;
  //normCoord.y = -normCoord.y;
  //normCoord -= vec2(0.5);
  //normCoord *= 2.0;
  float cameraLen = 1.0;


  vec3 lightPosition;
  float lightRadius = 79.0;
  lightPosition.x = lightRadius*sin(-time / 5.2);
  lightPosition.y = lightRadius*cos(-time / 5.2);
  lightPosition.z = 46;

  Ray r;
  r.origin = vec3(0.0);
  r.direction = normalize(vec3(normCoord, cameraLen));

  for(int i = 0; i < sphereCount; i++) {
    float theta = time + i * M_PI * 2.0 / float(sphereCount);
    float radius = 12.0 + i * 1.0;
    spheres[i].center.x = radius * sin(theta);
    spheres[i].center.y = radius * cos(theta);
    spheres[i].center.z = 34.0;
    spheres[i].r = 0.3 + i * 0.1 ;
    spheres[i].color.r = (sin(i * 6.8) + 1.0) / 2.0;
    spheres[i].color.g = (cos(i * 2.5) + 1.0) / 2.0;
    spheres[i].color.b = (sin(i * 1.35) + 1.0) / 2.0;
    spheres[i].color.a = 1.0;
    spheres[i].reflectivity = 1.0;
  }
  spheres[0].center.xy = vec2(0.0);
  spheres[0].r = 6.0;
  spheres[0].center.z = 36.0;
  spheres[0].color.rg = vec2(1.0);
  spheres[0].color.b = 0.0;

  //lightPosition.z = 2.0;
  color = vec4(0.2, 0.3, 0.5, 1.0);
  IterationData id;
  id.currentRay = r;
  for(int i = 0; i < 1; i++) {
    id = scene(id.currentRay, lightPosition);
    if(id.currentRay.hit) {
      color = id.color; 
    }
    id = scene(r, vec3(45.0, 55.0, 0.0));
    if(id.currentRay.hit) {
      color += id.color; 
    }
  }

}