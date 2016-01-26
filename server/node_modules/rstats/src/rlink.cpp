#ifndef BUILDING_NODE_EXTENSION
#define BUILDING_NODE_EXTENSION
#endif

#include <node.h>
#include <nan.h>
#include <iostream>
#include <vector>
#include <algorithm>

#include "rlink.h"
#include "helper.h"

using namespace v8;
using namespace std;

Persistent<Function> RWrap::constructor;

RWrap::RWrap() : q_(NULL) {
  q_ = new RInside();
}

RWrap::~RWrap() {
  delete q_;
}


void RWrap::Initialize(Handle<Object> target) {
  NanScope();

   // Prepare constructor template
  Local<FunctionTemplate> tpl = NanNew<FunctionTemplate>(New);
  tpl->SetClassName(NanNew("session"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Prototype
  NODE_SET_PROTOTYPE_METHOD(tpl, "parseEval", parseEval);
  NODE_SET_PROTOTYPE_METHOD(tpl, "parseEvalQ", parseEvalQ);
  NODE_SET_PROTOTYPE_METHOD(tpl, "parseEvalQNT", parseEvalQNT);
  NODE_SET_PROTOTYPE_METHOD(tpl, "assign", assign);
  NODE_SET_PROTOTYPE_METHOD(tpl, "get", get);

  NanAssignPersistent(constructor, tpl->GetFunction());
  target->Set(NanNew("session"), tpl->GetFunction());

}


NAN_METHOD(RWrap::New) {
  NanScope();

  RWrap* w = new RWrap();

  RInside* q = w->GetWrapped();
  std::string load_command = "library(RJSONIO, quietly=TRUE);";
  q->parseEvalQ(load_command);

  w->Wrap(args.This());

  NanReturnValue(args.This());
}


NAN_METHOD(RWrap::parseEval) {
  NanScope();

  RWrap* r = ObjectWrap::Unwrap<RWrap>(args.This());
  RInside* q = r->GetWrapped();

  v8::String::Utf8Value param(args[0]->ToString());
  std::string command = std::string(*param);
  std::string wrapper_before = "toJSON({";
  std::string wrapper_after = "}, digits = 50);";
  std::string full_command = wrapper_before + command + wrapper_after;

  Handle<Object> global = NanGetCurrentContext()->Global();
  Handle<Object> JSON = Handle<Object>::Cast(global->Get(NanNew("JSON")));
  Handle<Function> parse = Handle<Function>::Cast(
	  JSON->Get(NanNew("parse"))
  );

  try {
    std::string ret = q->parseEval(full_command);
    Handle<Value> ret_V8 = NanNew( ret.c_str() );
    Handle<Value> result = Handle<String>::Cast(parse->Call(JSON, 1, &ret_V8));
    NanReturnValue(result);
  } catch(std::exception& ex) {
	  std::string errorMessage(ex.what());
    NanThrowTypeError( errorMessage.c_str() );
    NanReturnUndefined();
  } catch(...) {
    NanThrowTypeError("Unknown error encountered");
    NanReturnUndefined();
  }
}

NAN_METHOD(RWrap::parseEvalQ) {
  NanScope();

  RWrap* r = ObjectWrap::Unwrap<RWrap>(args.This());
  RInside* q = r->GetWrapped();

  v8::String::Utf8Value param(args[0]->ToString());
  std::string command = std::string(*param);

  try {
    q->parseEvalQ(command);
  }
  catch(std::exception& ex) {
	  std::string errorMessage(ex.what());
    NanThrowTypeError( errorMessage.c_str() );
  } catch(...) {
    NanThrowTypeError("Unknown error encountered");
  }

  NanReturnUndefined();
}

NAN_METHOD(RWrap::parseEvalQNT) {
  NanScope();

  RWrap* r = ObjectWrap::Unwrap<RWrap>(args.This());
  RInside* q = r->GetWrapped();

  v8::String::Utf8Value param(args[0]->ToString());
  std::string command = std::string(*param);

  q->parseEvalQNT(command);

  NanReturnUndefined();
}

NAN_METHOD(RWrap::assign) {
  NanScope();

  RWrap* r = ObjectWrap::Unwrap<RWrap>(args.This());
  RInside* q = r->GetWrapped();
  v8::String::Utf8Value param1(args[0]->ToString());
  std::string name = std::string(*param1);

  if ( args[1]->IsNumber() ) {
    double value = args[1]->NumberValue();
    q->assign(value, name);
  }
  else if ( args[1]->IsString() ) {
    v8::String::Utf8Value value(args[1]->ToString());
    std::string value_str = std::string(*value);
    q->assign(value_str, name);
  }
  else if ( args[1]->IsArray() || args[1]->IsObject() ) {
    Handle<Object> object = Handle<Object>::Cast(args[1]);

    Handle<Object> global = NanGetCurrentContext()->Global();
    Handle<Object> JSON = Handle<Object>::Cast(global->Get(NanNew("JSON")));
    Handle<Function> stringify = Handle<Function>::Cast(
    JSON->Get(NanNew("stringify")));

    Handle<Value> stringifyable[] = { object };
    Handle<String> result = Handle<String>::Cast(stringify->Call(JSON, 1, stringifyable));
    v8::String::Utf8Value value(result);
    std::string value_str = std::string(*value);
    q->assign(value_str, "JSON_container");

    std::string command_pt2 = " = fromJSON(JSON_container); rm(JSON_container);";
    std::string full_command = name + command_pt2;
    q->parseEvalQ(full_command);
  }
  NanReturnUndefined();
}

NAN_METHOD(RWrap::get) {
  NanScope();

  RWrap* r = ObjectWrap::Unwrap<RWrap>(args.Holder());
  RInside* q = r->GetWrapped();

  v8::String::Utf8Value param(args[0]->ToString());
  std::string name = std::string(*param);
  std::string command_pt1 = "toJSON(";
  std::string command_pt2 = ", digits=50);";
  std::string full_command = command_pt1 + name + command_pt2;

  Handle<Object> global = NanGetCurrentContext()->Global();
  Handle<Object> JSON = Handle<Object>::Cast(global->Get(NanNew("JSON")));
  Handle<Function> parse = Handle<Function>::Cast(
  JSON->Get(NanNew("parse")));

  try{
    std::string ret = q->parseEval(full_command);
    Handle<Value> ret_V8 = NanNew( ret.c_str() );
    Handle<Value> result = Handle<String>::Cast(parse->Call(JSON, 1, &ret_V8));
    NanReturnValue(result);
  } catch(...) {
    NanThrowTypeError("The requested variable could not be retrieved.");
    NanReturnUndefined();
  }
}
