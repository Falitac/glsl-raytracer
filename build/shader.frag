#version 450

out vec4 color;

uniform vec2 resolution;
uniform float time;
uniform vec3 camPos;
uniform float camAngleV;
uniform float camAngleH;

float M_PI = 3.141592653589793;

vec4 ambient = vec4(0.15);


#define OBJ_NONE -1
#define OBJ_SPHERE 0
#define OBJ_PLANE 1
#define OBJ_TRIANGLE 2
#define OBJ_BOX 3


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
};

struct HitInfo {
  float t;
  int id;
  int objType;

  vec3 intersectionPoint;
  vec3 normal;
  vec4 objColor;
};

const int sphereCount = 10;
const int planeCount = 3;
Sphere spheres[sphereCount];
Plane planes[planeCount];


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
  return (-c - dot(p.normal, ray.origin)) / dot(p.normal, ray.direction);
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

vec4 calculateLight(HitInfo hit, Ray r, vec3 lightPosition) {
  vec4 result = vec4(0.0);

  if(hit.id == -1) {
    return result;
  }

  vec3 diff = lightPosition - hit.intersectionPoint;
  vec3 lightDir = normalize(diff);
  float rr = dot(diff, diff);

  float d = clamp(dot(lightDir, hit.normal), 0.0, 1.0);
  vec4 diffusion = vec4(d) ;

  vec3 reflectDirection = reflect(-lightDir, hit.normal);
  float specularity = pow(max(dot(reflectDirection, - r.direction), 0.0), 512) * 0.8;
  vec4 specular = vec4(specularity);

  Ray shadowCheck;
  shadowCheck.origin = hit.intersectionPoint;
  shadowCheck.direction = normalize(lightPosition - hit.intersectionPoint);
  for(int j = 0; j < sphereCount; j++) {
    if(!(j == hit.id && hit.objType == OBJ_SPHERE)) {
      if(0.0 < sphereIntersect(spheres[j], shadowCheck) && d > 0.0) {
        diffusion = specular = vec4(0.0);
      }
    }
  }

  result = (ambient + diffusion + specular) * hit.objColor;

  return result;
}

void initSpheres() {
  for(int i = 0; i < sphereCount; i++) {
    float theta = time * pow(1.5, sphereCount - i) * 0.1 * M_PI * 2.0 / float(sphereCount);
    float radius = 1.0 + i * 2.6;
    spheres[i].center.x = radius * sin(theta);
    spheres[i].center.z = radius * cos(theta) + 50.0;
    spheres[i].center.y = 5.0;
    spheres[i].r = 1.0 - i * 0.1;
    spheres[i].color.r = (sin(i * 8.8) + 1.0) / 2.0;
    spheres[i].color.g = (cos(i * 2.5) + 1.0) / 2.0;
    spheres[i].color.b = (sin(i * 1.35) + 1.0) / 2.0;
    spheres[i].color.a = 1.0;
    spheres[i].reflectivity = 1.0;
  }
  spheres[0].center.z += 1.0;

}

void main() {
  vec2 normCoord = gl_FragCoord.xy / resolution - vec2(0.5, 0.5);
  float aspect = resolution.x / resolution.y;
  normCoord.y /= aspect;
  float cameraLen = 1.0;

  vec3 camDir = vec3(normCoord, cameraLen);
  camDir = normalize(camDir);
  camDir = rotateY(-camAngleH) * camDir;
  camDir = rotateX(camAngleV) * camDir;

  vec3 lightPosition = vec3(0.0, 10.0 + sin(time) * 2, 50.0);
  float lightRadius = 60.0;
  //lightPosition.x = lightRadius * sin(time);
  //lightPosition.y = 2.0;
  //lightPosition.z = lightRadius * (cos(time) + 1.0);

  Ray r;
  r.origin = camPos;
  r.direction = normalize(vec3(normCoord, cameraLen));
  r.direction = camDir;

  initSpheres();
  planes[0].position = vec3(0.0, -2.0, 0.0);
  planes[0].normal = vec3(0.0, 1.0, 0.0);
  planes[0].color = vec4(0.2, 0.5, 0.7, 1.0);

  float d = 26.0;
  planes[1].position = vec3(0.0, 0.0, d);
  planes[1].normal = vec3(1.0, 0.0, 0.0);
  planes[1].color = vec4(0.7, 0.5, 0.3, 1.0);

  planes[2].position = vec3(0.0, 0.0, d);
  planes[2].normal = vec3(-1.0, 0.0, 0.0);
  planes[2].color = vec4(0.3, 0.7, 0.5, 1.0);


  color = vec4(0.0);

  #define RAY_JUMPS 2
  for(int j = 0; j < RAY_JUMPS; j++) {
    HitInfo hit;
    hit.id = -1;
    hit.t = 1.0e30;
    hit.objType = OBJ_NONE;

    for(int i = 0; i < sphereCount; i++) {
      float t = sphereIntersect(spheres[i], r);
      if(t > 0.0) {
        if(hit.id == -1 || t < hit.t) {
          hit.id = i;
          hit.t = t;
          hit.objType = OBJ_SPHERE;
        }
      }
    }
    for(int i = 0; i < planeCount; i++) {
      float t = planeIntersect(planes[i], r);
      if(t > 0.0) {
        if(hit.id == -1 || t < hit.t) {
          hit.id = i;
          hit.t = t;
          hit.objType = OBJ_PLANE;
        }
      }
    }

    if(hit.id == -1) {
      break;
    }
    hit.intersectionPoint = r.direction * hit.t;
    hit.objColor = vec4(1.0);
    hit.normal = vec3(0.0, 1.0, 0.0);

    switch(hit.objType) {
    case OBJ_SPHERE:
      hit.objColor = spheres[hit.id].color;
      hit.normal = normalize(hit.intersectionPoint - spheres[hit.id].center);
    break;
    case OBJ_PLANE:
      hit.objColor = planes[hit.id].color;
      hit.normal = planes[hit.id].normal;
    break;
    default:
    break;
    }

    for(int i = 0; i < 1; i++) {
      vec3 lPos = lightPosition;
      lPos.z += 80.0 * i;
      color += calculateLight(hit, r, lPos) * float(RAY_JUMPS - j) / float(RAY_JUMPS);
    }
    r.origin = hit.intersectionPoint;
    r.direction = normalize(reflect(-r.direction, hit.normal));
  }
  
}