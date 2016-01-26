#ifndef BUILDING_NODE_EXTENSION
#define BUILDING_NODE_EXTENSION
#endif

#include <node.h>
#include <nan.h>
#include <RInside.h>                    // for the embedded R via RInside

#include "rlink.h"

using namespace v8;

void Initialize(Handle<Object> target) {
  RWrap::Initialize(target);
}

NODE_MODULE(R, Initialize)
