/*
 * Copyright (c) 2014 Christian Authmann
 */

#pragma once

#include "common/typeid.h"
#include "common/binarystream.h"
#include "common/constants.h"
#include "rinside_callbacks.h"

#include <stdexcept>
#include <map>
#include <functional>


class CppFunctionForRInsideServer;

class RInsideServer {
	public:
		RInsideServer(BinaryStream &stream, RInside &R, RInsideCallbacks &Rcallbacks);
		~RInsideServer();

		void run();

	private:
		SEXP sexp_from_stream();
		void sexp_to_stream(SEXP, int32_t type, bool include_reply = false);

		BinaryStream stream;
		RInside &R;
		RInsideCallbacks &Rcallbacks;

		bool can_send_reply;
		void sendReply(char reply) { if (!can_send_reply) throw std::runtime_error("Cannot send a reply at this time, exiting"); can_send_reply = false; stream.write(reply); }
		void allowSendReply() { if (can_send_reply) throw std::runtime_error("allowSendReply() called twice, exiting"); can_send_reply = true; }

		static std::map<int32_t, std::function<SEXP(BinaryStream &)> > registry_sexp_from_stream;
		static std::map<int32_t, std::function<void(RInsideServer &, SEXP, bool)> > registry_sexp_to_stream;

	public:
		static void registerDefaultTypes();
		template <typename T>
		static void registerType() {
			int32_t type = TYPEID<T>();

			if (registry_sexp_from_stream.count(type) > 0 || registry_sexp_to_stream.count(type) > 0)
				throw std::runtime_error("registerType(): type already registered");

			registry_sexp_from_stream[type] = [] (BinaryStream &stream) -> SEXP {
				T value = stream.read<T>();
				return Rcpp::wrap<T>(value);
			};

			registry_sexp_to_stream[type] = [type] (RInsideServer &server, SEXP sexp, bool include_reply) -> void {
				T value = Rcpp::as<T>(sexp);
				/*
				 * The reply should be sent after type conversion. If type conversion throws an exception,
				 * the server cannot reply with REPLY_ERROR after another reply has been sent.
				 */
				if (include_reply)
					server.sendReply(RIS_REPLY_VALUE);
				server.stream.write(type);
				server.stream.write(value);
			};
		}

		friend class CppFunctionForRInsideServer;
};
