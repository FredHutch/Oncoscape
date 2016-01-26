cmake_minimum_required(VERSION 2.8.4) 

project(qtdensitydemo)
find_package(Qt4 REQUIRED) # find and setup Qt4 for this project

set(CMAKE_VERBOSE_MAKEFILE 0)

set(QT_USE_QTSVG 1)

add_definitions(${QT_DEFINITIONS})
add_definitions(-DQT_DLL)
include(${QT_USE_FILE})
include_directories(${QT_INCLUDE_DIR})
link_directories(${QT_LIBRARY_DIR})

execute_process(COMMAND R RHOME
                OUTPUT_VARIABLE R_HOME)

set(sources ../main.cpp
            ../qtdensity.cpp)
             
set(headers ../qtdensity.h)
qt4_wrap_cpp(sources ${headers})

set(NUM_TRUNC_CHARS 2)

execute_process(COMMAND R CMD config --cppflags
                OUTPUT_VARIABLE RCPPFLAGS)
string(SUBSTRING ${RCPPFLAGS} ${NUM_TRUNC_CHARS} -1 RCPPFLAGS)
include_directories(${RCPPFLAGS})

execute_process(COMMAND R CMD config --ldflags
                OUTPUT_VARIABLE RLDFLAGS)
string(LENGTH ${RLDFLAGS} RLDFLAGS_LEN)

if (${RLDFLAGS} MATCHES "[-][L]([^ ;])+")
    string(SUBSTRING ${CMAKE_MATCH_0} ${NUM_TRUNC_CHARS} -1 RLDFLAGS_L)
    string(STRIP ${RLDFLAGS_L} RLDFLAGS_L )
    link_directories(${RLDFLAGS_L})
endif()

if (${RLDFLAGS} MATCHES "[-][l]([^;])+")
    string(SUBSTRING ${CMAKE_MATCH_0} ${NUM_TRUNC_CHARS} -1 RLDFLAGS_l)
    string(STRIP ${RLDFLAGS_l} RLDFLAGS_l )
endif()

execute_process(COMMAND Rscript -e "Rcpp:::CxxFlags()"
                OUTPUT_VARIABLE RCPPINCL)
string(SUBSTRING ${RCPPINCL} ${NUM_TRUNC_CHARS} -1 RCPPINCL)
include_directories(${RCPPINCL})

execute_process(COMMAND Rscript -e "Rcpp:::LdFlags()"
                OUTPUT_VARIABLE RCPPLIBS)
if (${RCPPLIBS} MATCHES "[-][L]([^ ;])+")
    string(SUBSTRING ${CMAKE_MATCH_0} ${NUM_TRUNC_CHARS} -1 RCPPLIBS_L)
    link_directories(${RCPPLIBS_L} )
endif()

if (${RCPPLIBS} MATCHES "[-][l][R]([^;])+")
    string(SUBSTRING ${CMAKE_MATCH_0} ${NUM_TRUNC_CHARS} -1 RCPPLIBS_l)
endif()

execute_process(COMMAND Rscript -e "RInside:::CxxFlags()"
                OUTPUT_VARIABLE RINSIDEINCL)
string(SUBSTRING ${RINSIDEINCL} ${NUM_TRUNC_CHARS} -1 RINSIDEINCL)
include_directories(${RINSIDEINCL})

execute_process(COMMAND Rscript -e "RInside:::LdFlags()"
                OUTPUT_VARIABLE RINSIDELIBS)
if (${RINSIDELIBS} MATCHES "[-][L]([^ ;])+")
    string(SUBSTRING ${CMAKE_MATCH_0} ${NUM_TRUNC_CHARS} -1 RINSIDELIBS_L)
    link_directories(${RINSIDELIBS_L})
endif()

if (${RINSIDELIBS} MATCHES "[-][l][R]([^;])+")
    string(SUBSTRING ${CMAKE_MATCH_0} ${NUM_TRUNC_CHARS} -1 RINSIDELIBS_l)
endif()

execute_process(COMMAND R CMD config CXXFLAGS
                OUTPUT_VARIABLE RCXXFLAGS)

execute_process(COMMAND R CMD config BLAS_LIBS
                OUTPUT_VARIABLE RBLAS)

execute_process(COMMAND R CMD config LAPACK_LIBS
                OUTPUT_VARIABLE RLAPACK)

set(CMAKE_CXX_FLAGS "-W -Wall -pedantic -Wextra ${CMAKE_CXX_FLAGS}")

if (CMAKE_BUILD_TYPE STREQUAL "DEBUG" OR
    CMAKE_BUILD_TYPE STREQUAL "RelWithDebugInfo" )
    add_definitions("-DDEBUG")
elseif ( CMAKE_BUILD_TYPE STREQUAL "RELEASE" )
    add_definitions("-O3")
endif()

add_executable(qtdensitydemo ${sources} ${headers} )

target_link_libraries(qtdensitydemo ${BLAS_LIBS})
target_link_libraries(qtdensitydemo ${LAPACK_LIBS})
target_link_libraries(qtdensitydemo ${QT_LIBRARIES})
target_link_libraries(qtdensitydemo ${RCPPLIBS_l})
target_link_libraries(qtdensitydemo ${RINSIDELIBS_l})
target_link_libraries(qtdensitydemo ${RLDFLAGS_l})

