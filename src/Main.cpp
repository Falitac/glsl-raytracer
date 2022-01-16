#include <iostream>
#define GLFW_INCLUDE_NONE
#include <GL/glew.h>
#include <GLFW/glfw3.h>

#include "Shader.hpp"

static void init();
static void render();
static void cleanup();

static void resizeCallback(GLFWwindow*, int, int);
static void keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods);

struct Context {
  GLFWwindow* window;
  int width, height;

  Shader shader;
  GLuint VAO;

  double timer = 0.0;
  bool timerPaused = false;
  bool timerReverse = false;

} ctx;

int main(int argc, char** argv) {
  init();

  glGenVertexArrays(1, &ctx.VAO);
  glBindVertexArray(ctx.VAO);
  

  ctx.shader = {"shader"};


  auto lastTime = glfwGetTime();
  while(!glfwWindowShouldClose(ctx.window)) {
    auto dt = glfwGetTime() - lastTime;
    lastTime = glfwGetTime();
    if(!ctx.timerPaused) {
      if(ctx.timerReverse) {
        dt = -dt;
      }

      ctx.timer += dt;
    }

    render();
    glfwSwapBuffers(ctx.window);
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

  ///ctx.shader = {"shader"};
  glEnable(GL_BLEND);

}

static void cleanup() {
  glDeleteVertexArrays(1, &ctx.VAO);
  glfwTerminate();
}

static void resizeCallback(GLFWwindow* window, int width, int height) {
  glfwGetFramebufferSize(window, &ctx.width, &ctx.height);
  glViewport(0, 0, width, height);
}

static void keyCallback(GLFWwindow* window, int key, int scancode, int action, int mods) {
  if (key == GLFW_KEY_ESCAPE && action == GLFW_PRESS) {
    glfwSetWindowShouldClose(window, GLFW_TRUE);
  }

  if(key == GLFW_KEY_SPACE && action == GLFW_PRESS) {
    ctx.timerPaused ^= true;
  }
  if(key == GLFW_KEY_R && action == GLFW_PRESS) {
    ctx.timerReverse ^= true;
  }

  if(key == GLFW_KEY_Z && action == GLFW_PRESS) {
    ctx.shader = {"shader"};
  }
}

static void render() {
  ctx.shader.use();
  auto uniformResolutionLoc = ctx.shader.findUniformLocation("resolution");
  auto uniformTimeLoc = ctx.shader.findUniformLocation("time");
  glUniform2f(uniformResolutionLoc, ctx.width, ctx.height);
  glUniform1f(uniformTimeLoc, ctx.timer);
  glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 6, 1);
}