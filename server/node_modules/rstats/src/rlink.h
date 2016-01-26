#ifndef RLINK_H
#define RLINK_H

#include <node.h>
#include <nan.h>
#include <RInside.h>                    // for the embedded R via RInside
#include <iostream>
#include <vector>
#include <algorithm>

class RWrap : public node::ObjectWrap {

  public:
    static void Initialize(v8::Handle<v8::Object> target);
    RInside* GetWrapped() const { return q_; };
    void SetWrapped(RInside q) {
      if (q_) delete q_;
      q_ = new RInside(q);
      };

        static v8::Handle<v8::Value> NewInstance(RInside q);

  private:
     RWrap();
    ~RWrap();
    static v8::Persistent<v8::Function> constructor;
    static NAN_METHOD(New);

    // Wrapped methods
    static NAN_METHOD(parseEval);
    static NAN_METHOD(parseEvalQ);
    static NAN_METHOD(parseEvalQNT);
    static NAN_METHOD(assign);
    static NAN_METHOD(get);

    // Wrapped object
    RInside* q_;
};


#endif
