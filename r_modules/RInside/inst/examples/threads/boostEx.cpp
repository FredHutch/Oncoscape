// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; -*-

#include <boost/thread.hpp>
#include <boost/bind.hpp>

#include <RInside.h>

class Resource {
public:
    Resource(): i(0), RR(RInside::instance()) { }

    void use() {
	boost::mutex::scoped_lock lock(guard);
	RR.parseEvalQ("cat(\"Hello, world from use()\\n\")");
	++i;
    }
    int getValue() { return i; }

private:
    int i;
    RInside & RR;		// reference to embedded R instance
    boost::mutex guard;
};

void thread_func(Resource& resource) {
    resource.use();
}

extern uintptr_t R_CStackLimit;

int main(int argc, char *argv[]) {

    RInside R(argc, argv);
    R.parseEvalQ("cat(\"Hello, world from main()\\n\")");

    Resource resource;
    boost::thread_group thread_group;
    thread_group.create_thread(boost::bind(thread_func, boost::ref(resource)));
    thread_group.create_thread(boost::bind(thread_func, boost::ref(resource)));
    thread_group.join_all();
    std::cout << "At end value is " << resource.getValue() << std::endl;
    return 0;
}
