# CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
# NO LICENCE IS GRANTED. See LICENCE.txt.
#
# Build 1046: the tablet's writing model, ported from Inkwell 7.36 (same author):
# llama.cpp (MIT licence) and the wrapper beside this file. The llama.cpp
# source sits in llama.cpp/, at the release the build names (the GitHub
# workflow fetches it; see build-apk.yml).
cmake_minimum_required(VERSION 3.22.1)
project(inkllm C CXX)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# The model runs on 64-bit ARM tablets only, as in Inkwell. Some Fire tablets
# run 32-bit Fire OS; an app whose native code is all 64-bit cannot be
# installed there at all. For them the build makes a small placeholder of the
# same name, so Carpe Diem installs and works as before, and the Writing model
# panel says the tablet's processor cannot run the model.
if(NOT ANDROID_ABI STREQUAL "arm64-v8a")
    add_library(inkllm SHARED cd_placeholder.c)
    return()
endif()

set(LLAMA_SRC ${CMAKE_CURRENT_LIST_DIR}/llama.cpp)
if(NOT EXISTS ${LLAMA_SRC}/CMakeLists.txt)
    message(FATAL_ERROR "llama.cpp is missing from ${LLAMA_SRC}. The workflow fetches it; to build by hand: "
                        "git clone --depth 1 --branch b11398 https://github.com/ggml-org/llama.cpp ${LLAMA_SRC}")
endif()

# only what the tablet needs: the library and its common helpers
set(LLAMA_BUILD_COMMON   ON  CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TESTS    OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_TOOLS    OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_SERVER   OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_APP      OFF CACHE BOOL "" FORCE)
set(LLAMA_BUILD_UI       OFF CACHE BOOL "" FORCE)
set(LLAMA_CURL           OFF CACHE BOOL "" FORCE)
set(LLAMA_OPENSSL        OFF CACHE BOOL "" FORCE)
set(BUILD_SHARED_LIBS    ON  CACHE BOOL "" FORCE)
# one build for every tablet: each processor variant is built, and the best
# one the tablet's processor supports is chosen when the model starts
set(GGML_NATIVE          OFF CACHE BOOL "" FORCE)
set(GGML_BACKEND_DL      ON  CACHE BOOL "" FORCE)
set(GGML_CPU_ALL_VARIANTS ON CACHE BOOL "" FORCE)
set(GGML_LLAMAFILE       OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP          ON  CACHE BOOL "" FORCE)

add_subdirectory(${LLAMA_SRC} build-llama)

add_library(inkllm SHARED ink_llm.cpp ink_llm_jni.cpp)
target_include_directories(inkllm PRIVATE
    ${LLAMA_SRC}/include ${LLAMA_SRC}/common ${LLAMA_SRC}/ggml/include ${LLAMA_SRC}/vendor)
target_link_libraries(inkllm llama llama-common android log)
