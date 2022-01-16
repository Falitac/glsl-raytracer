#pragma once

#include <GL/glew.h>
#include <fstream>
#include <sstream>
#include <string>
#include <map>
#include <exception>

class Shader
{
private:
  GLuint programID;
  std::map<std::string, GLuint> variableLocations;
  std::map<std::string, GLuint> uniformLocations;
public:
  Shader() = default;
  Shader(const std::string& shaderName);

  GLuint getProgramID() const {
    return programID;
  }

  void use();
  GLint findVarLocation(const std::string& varName);
  GLint findUniformLocation(const std::string& uniformName);

  const inline GLuint operator()() const {
    return programID;
  }

private:
  std::string loadFromFileContent(const std::string& shaderName);
  void compile(const std::string& shaderName);
  GLuint compileShader(const std::string& shaderName, GLenum shaderType);

  class FileNotFound : public std::exception {
    std::string fileName;

    public:
    FileNotFound(const std::string& fileName)
    : fileName(fileName) {
    }

    virtual const char* what() {
      return std::string(fileName + " does not exist").c_str();
    }
  };
  class WrongShaderType : public std::exception {
    public:
    virtual const char* what() {
      return "Wrong shader type!";
    }
  };

  friend int main(int argc, char** argv);
};


