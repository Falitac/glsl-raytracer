#include "Shader.hpp"

#include <string.h>
#include <iostream>
#include <array>
#include <memory>

Shader::Shader(const std::string& shaderName) {
  compile(shaderName);

}

std::string Shader::loadFromFileContent(const std::string& fileName) {
  std::ifstream file(fileName);
  std::stringstream s;

  if(file.good()) {
    s << file.rdbuf();
  } else {
    throw FileNotFound(fileName);
  }
  return s.str();
}

void Shader::compile(const std::string& shaderName) {
  programID = glCreateProgram();
  const static std::array<GLenum, 3> SHADER_TYPES = {
    GL_VERTEX_SHADER,
    GL_FRAGMENT_SHADER,
    GL_GEOMETRY_SHADER
  };

  for(auto& shaderType : SHADER_TYPES) {
    try {
      auto shader = compileShader(shaderName, shaderType);
      glAttachShader(programID, shader);
      glDeleteShader(shader);
    } catch(FileNotFound& e) {
      std::printf("%s\n", e.what());
    }
  }

  glLinkProgram(programID);

  GLint compilationResult, errorLogSize;
  glGetProgramiv(programID, GL_LINK_STATUS, &compilationResult);
  glGetProgramiv(programID, GL_INFO_LOG_LENGTH, &errorLogSize);

  if(errorLogSize > 0) {
    std::string errorMessage;
    errorMessage.reserve(errorLogSize);
    glGetProgramInfoLog(programID, errorMessage.size(), NULL, errorMessage.data());
    std::fprintf(stderr, "Error compiling program %s\n", errorMessage.c_str());
  }
}

GLuint Shader::compileShader(const std::string& shaderName, GLenum shaderType) {
  const static std::array<std::string, 3> EXTENSIONS = {".vert", ".frag", ".geom"};
  std::size_t fileExtensionID = 0;

  switch (shaderType) {
    case GL_VERTEX_SHADER:   fileExtensionID = 0; break;
    case GL_FRAGMENT_SHADER: fileExtensionID = 1; break;
    case GL_GEOMETRY_SHADER: fileExtensionID = 2; break;
    default: throw WrongShaderType(); break;
  }
  auto shaderSource = loadFromFileContent(shaderName + EXTENSIONS[fileExtensionID]);
  const char* shaderSourceCasted  = shaderSource.c_str();

  auto resultShader = glCreateShader(shaderType);
  glShaderSource(resultShader, 1, &shaderSourceCasted, NULL);
  glCompileShader(resultShader);

  GLint compilationResult, errorLogSize;
  glGetShaderiv(resultShader, GL_COMPILE_STATUS, &compilationResult);
  glGetShaderiv(resultShader, GL_INFO_LOG_LENGTH, &errorLogSize);

  if(errorLogSize > 0) {
    auto errorMessage = std::make_unique<char[]>(errorLogSize);
    glGetShaderInfoLog(resultShader, errorLogSize, NULL, errorMessage.get());

    std::fprintf(stderr, "Compiling %s error:\n", (shaderName + EXTENSIONS[fileExtensionID]).c_str());
    std::fprintf(stderr, "%s\n", errorMessage.get());
  }

  return resultShader;
}

GLint Shader::findVarLocation(const std::string& varName) {
  if(!variableLocations.contains(varName)) {
    auto id = glGetAttribLocation(programID, varName.c_str());
    variableLocations[varName] = id;
  }
  return variableLocations[varName];
}

GLint Shader::findUniformLocation(const std::string& uniformName) {
  if(!uniformLocations.contains(uniformName)) {
    auto id = glGetUniformLocation(programID, uniformName.c_str());
    variableLocations[uniformName] = id;
  }
  return variableLocations[uniformName];
}

void Shader::use() {
  glUseProgram(programID);
}