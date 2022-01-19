#include <iostream>
#define GLFW_INCLUDE_NONE
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <map>

#include "Shader.hpp"

static void init();
static void updateTime();
static void update();
static void render();
static void cleanup();

static void resizeCallback(GLFWwindow*, int, int);
static void keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods);

struct Camera {
  glm::vec3 pos;
  float angleV;
  float angleH;

  float speed = 12.0f;
  float angleSpeed = 3.0f;
};

struct Context {
  GLFWwindow* window;
  int width, height;

  std::map<int, bool> pressedKeys;

  Shader shader;
  GLuint VAO;

  double timer = 0.0;
  bool timerPaused = false;
  bool timerReverse = false;
  static constexpr double dt = 1.0 / 60.0f;
  double lastFrameTime = 0.0;

  Camera camera;
} ctx;

int main(int argc, char** argv) {
  init();

  glGenVertexArrays(1, &ctx.VAO);
  glBindVertexArray(ctx.VAO);

  ctx.shader = {"shader"};

  ctx.lastFrameTime = glfwGetTime();
  while(!glfwWindowShouldClose(ctx.window)) {
    updateTime();
    update();

    render();
    glfwPollEvents();
  }

  cleanup();
  return EXIT_SUCCESS;
}

static void init() {
  if(!glfwInit()) {
    std::fprintf(stderr, "Couldn't init glfw");
    exit(EXIT_FAILURE);
  }

  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 5);

  ctx.window = glfwCreateWindow(1600, 900, "Ray tracer", nullptr, nullptr);

  if(!ctx.window) {
    std::fprintf(stderr, "Couldn't make window");
    glfwTerminate();
    exit(EXIT_FAILURE);
  }

  glfwSetInputMode(ctx.window, GLFW_STICKY_KEYS, GLFW_TRUE);
  glfwSetWindowSizeCallback(ctx.window, resizeCallback);

  glfwMakeContextCurrent(ctx.window);
  glfwSwapInterval(1);
  //glfwMaximizeWindow(ctx.window);

  glewExperimental = true;
  GLenum glewError = glewInit();
  if(glewError != GLEW_OK) {
    std::fprintf(stderr, "Couldn't init glew");
    glfwTerminate();
    exit(EXIT_FAILURE);
  }

  glfwGetFramebufferSize(ctx.window, &ctx.width, &ctx.height);
  resizeCallback(ctx.window, ctx.width, ctx.height);

  glfwSetInputMode(ctx.window, GLFW_STICKY_KEYS, GLFW_TRUE);
  glfwSetKeyCallback(ctx.window, keyCallback);

  glEnable(GL_BLEND);
}

static void cleanup() {
  glDeleteVertexArrays(1, &ctx.VAO);
  glfwTerminate();
}

static void resizeCallback(GLFWwindow* window, int width, int height) {
  glfwGetFramebufferSize(window, &ctx.width, &ctx.height);
  glViewport(0, 0, width, height);
  updateTime();
  update();
  render();
}

static void keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods) {
  if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS) {
    glfwSetWindowShouldClose(window, GLFW_TRUE);
  }

  if(action == GLFW_PRESS) {
    ctx.pressedKeys[key] = true;
  }
  if(action == GLFW_RELEASE) {
    ctx.pressedKeys[key] = false;
  }

  if(key == GLFW_KEY_SPACE && action == GLFW_PRESS) {
    ctx.timerPaused ^= true;
  }
  if(key == GLFW_KEY_B && action == GLFW_PRESS) {
    ctx.timerReverse ^= true;
  }

  if(key == GLFW_KEY_Z && action == GLFW_PRESS) {
    ctx.shader = {"shader"};
  }
}

static void updateTime() {
  auto dt = glfwGetTime() - ctx.lastFrameTime;
  ctx.lastFrameTime = glfwGetTime();

  if(!ctx.timerPaused) {
    if(ctx.timerReverse) {
      dt = -dt;
    }
    ctx.timer += dt;
  }
}

static void update() {
  if(ctx.pressedKeys[GLFW_KEY_LEFT]) {
    ctx.timer -= ctx.dt;
  }
  if(ctx.pressedKeys[GLFW_KEY_RIGHT]) {
    ctx.timer += ctx.dt;
  }

  auto& camera = ctx.camera;
  if(ctx.pressedKeys[GLFW_KEY_A]) {
    camera.pos.x -= camera.speed * ctx.dt;
  }
  if(ctx.pressedKeys[GLFW_KEY_D]) {
    camera.pos.x += camera.speed * ctx.dt;
  }
  if(ctx.pressedKeys[GLFW_KEY_R]) {
    camera.pos.y += camera.speed * ctx.dt;
  }
  if(ctx.pressedKeys[GLFW_KEY_F]) {
    camera.pos.y -= camera.speed * ctx.dt;
  }
  if(ctx.pressedKeys[GLFW_KEY_W]) {
    camera.angleV += ctx.dt * camera.angleSpeed;
    //camera.pos.z += camera.speed * ctx.dt;
  }
  if(ctx.pressedKeys[GLFW_KEY_S]) {
    camera.angleV -= ctx.dt * camera.angleSpeed;
    //camera.pos.z -= camera.speed * ctx.dt;
  }
  if(ctx.pressedKeys[GLFW_KEY_Q]) {
    camera.angleH -= ctx.dt * camera.angleSpeed;
  }
  if(ctx.pressedKeys[GLFW_KEY_E]) {
    camera.angleH += ctx.dt * camera.angleSpeed;
  }
}

static void render() {
  ctx.shader.use();
  auto uniformResolutionLoc = ctx.shader.findUniformLocation("resolution");
  auto uniformTimeLoc = ctx.shader.findUniformLocation("time");
  auto uniformCamPos = ctx.shader.findUniformLocation("camPos");
  auto uniformCamAngleH = ctx.shader.findUniformLocation("camAngleH");
  auto uniformCamAngleV = ctx.shader.findUniformLocation("camAngleV");

  glUniform2f(uniformResolutionLoc, ctx.width, ctx.height);
  glUniform1f(uniformTimeLoc, ctx.timer);
  glUniform3fv(uniformCamPos, 1, glm::value_ptr(ctx.camera.pos));
  glUniform1f(uniformCamAngleH, ctx.camera.angleH);
  glUniform1f(uniformCamAngleV, ctx.camera.angleV);

  glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 6, 1);

  glfwSwapBuffers(ctx.window);
}