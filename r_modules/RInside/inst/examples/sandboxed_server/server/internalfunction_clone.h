#pragma once

/*
 * Ok, frankly, this is a hack.
 * We need an InternalFunction, but we don't have a compatible C++ function - we only have
 * the parameter count and typeids.
 *
 * To do this, we need to get down to the point where the function parameters are nothing but an array of SEXP.
 * And that's so deep in the CppFunction implementation of Rcpp, that we need some detours to get there.
 */


class CppFunctionForRInsideServer: public Rcpp::CppFunctionBase {
	public:
		CppFunctionForRInsideServer(RInsideServer &server, uint32_t callback_id, const std::vector<int32_t> &types) : server(server), callback_id(callback_id), types(types) {
		}
		virtual ~CppFunctionForRInsideServer() {
		}
		SEXP operator()(SEXP* args) {
			// TODO: how do we get the amount of arguments passed? We should probably verify them.
			BEGIN_RCPP
			LOG("Callback %u called", callback_id);
			server.sendReply(RIS_REPLY_CALLBACK);
			server.stream.write(callback_id);
			size_t paramcount = types.size() - 1;
			for (size_t i=0;i<paramcount;i++) {
				LOG("Sending parameter %d at %p", (int) i, args[i]);
				server.allowSendReply();
				try {
					server.sexp_to_stream(args[i], types[i+1], true);
				}
				catch (const std::exception &e) {
					LOG("Exception sending argument: %s", e.what());
					throw;
				}
			}

			LOG("Reading result from stream");
			SEXP result = server.sexp_from_stream();
			server.allowSendReply();

			LOG("Got a SEXP, returning");
			// TODO: verify result type?
			return result;
			END_RCPP
		}
	private:
		RInsideServer &server;
		uint32_t callback_id;
		const std::vector<int32_t> types;
};

// Instantiate the standard deleter. TODO: can we avoid this?
template void Rcpp::standard_delete_finalizer(CppFunctionForRInsideServer* obj);


namespace Rcpp{

	// This is a clone of Rcpp's InternalFunction, just with a different constructor.
    RCPP_API_CLASS(InternalFunctionForRInsideServer_Impl) {
    public:

        RCPP_GENERATE_CTOR_ASSIGN(InternalFunctionForRInsideServer_Impl)

        InternalFunctionForRInsideServer_Impl(RInsideServer &server, uint32_t callback_id, const std::vector<int32_t> &types) {
			set(XPtr<CppFunctionForRInsideServer>(new CppFunctionForRInsideServer(server, callback_id, types), false));
		}

        void update(SEXP){}
    private:

        inline void set( SEXP xp){
            Environment RCPP = Environment::Rcpp_namespace() ;
            Function intf = RCPP["internal_function"] ;
            Storage::set__( intf( xp ) ) ;
        }

    };

    typedef InternalFunctionForRInsideServer_Impl<PreserveStorage> InternalFunctionForRInsideServer ;

}
