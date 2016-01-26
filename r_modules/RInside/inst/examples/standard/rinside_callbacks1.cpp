// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Simple example showing how to capture R's console output using callbacks
//
// Copyright (C) 2014 Christian Authmann
//
// GPL'ed

#include <RInside.h>                    // for the embedded R via RInside

#if !defined(RINSIDE_CALLBACKS)
int main(int argc, char *argv[]) {
    printf("This example requires RInside to be compiled and installed with RINSIDE_CALLBACKS defined\nSee inst/include/RInsideConfig.h\n");
    exit(0);
}
#else


class MyCallbacks : public Callbacks {
    public:
        // see inst/includes/Callbacks.h for a list of all overrideable methods
        virtual void WriteConsole( const std::string& line, int type ) {
            output_buffer << line << std::endl;
        };

        virtual bool has_WriteConsole() {
            return true;
        };

        std::string getConsoleOutput() {
            return output_buffer.str();
        }
    private:
        std::ostringstream output_buffer;
};

int main(int argc, char *argv[]) {
    MyCallbacks *callbacks = new MyCallbacks();

    RInside R(argc, argv);              // create an embedded R instance
    R.set_callbacks( callbacks );

    R.parseEvalNT("print(\"Hello world\")");

    std::string result = callbacks->getConsoleOutput();
    printf("R said:\n%s\n", result.c_str());
    exit(0);
}


#endif
