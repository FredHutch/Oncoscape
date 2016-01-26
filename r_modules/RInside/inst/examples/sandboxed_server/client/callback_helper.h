/*
 * Copyright (c) 2014 Christian Authmann
 */


namespace callback_helper {
	// A recursive template sending the TYPEIDs of all template parameters over the stream
	template <typename... Params>
	struct send_pack;

	template <typename First, typename... Remaining>
	struct send_pack<First, Remaining...> {
		static void send(BinaryStream &stream) {
			auto type = TYPEID<First>();
			stream.write(type);
			send_pack<Remaining...>::send(stream);
		}
	};

	template <>
	struct send_pack<> {
		static void send(BinaryStream &stream) {
		}
	};

	// An exception when the wrong type is sent over the stream
	class type_mismatch_exception : std::exception {
	};

	// An exception when the server failed to transform a parameter, but can still continue
	class parameter_error_exception : public std::runtime_error {
		public:
			explicit parameter_error_exception(const std::string &error) : std::runtime_error(error) {};
	};

	// read a typeid from the stream, compare it to the expected type, then read the value
	template<typename T>
	T read_from_stream_with_typeid(BinaryStream &stream) {
		auto result = stream.read<char>();
		if (result == RIS_REPLY_ERROR) {
			auto error = stream.read<std::string>();
			throw parameter_error_exception(error);
		}
		else if (result != RIS_REPLY_VALUE) {
			throw std::runtime_error("Invalid reply from server");
		}
		auto type = stream.read<int32_t>();
		if (type != TYPEID<T>()) {
			printf("trying to read type %d, got type %d\n", (int) TYPEID<T>(), (int) type);
			throw type_mismatch_exception();
		}
		return stream.read<T>();
	}

	// auto-generated functions for calling callbacks
	template<typename RESULT_TYPE>
	void call(const std::function<RESULT_TYPE()> &fun, BinaryStream &stream) {
		RESULT_TYPE result = fun();
		int32_t result_type = TYPEID<RESULT_TYPE>();
		stream.write(result_type);
		stream.write(result);
	}
	template<typename RESULT_TYPE, typename U0>
	void call(const std::function<RESULT_TYPE(U0)> &fun, BinaryStream &stream) {
		auto x0 = read_from_stream_with_typeid<typename std::decay<U0>::type>(stream);

		RESULT_TYPE result = fun(x0);
		int32_t result_type = TYPEID<RESULT_TYPE>();
		stream.write(result_type);
		stream.write(result);
	}
	template<typename RESULT_TYPE, typename U0, typename U1>
	void call(const std::function<RESULT_TYPE(U0, U1)> &fun, BinaryStream &stream) {
		auto x0 = read_from_stream_with_typeid<typename std::decay<U0>::type>(stream);
		auto x1 = read_from_stream_with_typeid<typename std::decay<U1>::type>(stream);

		RESULT_TYPE result = fun(x0, x1);
		int32_t result_type = TYPEID<RESULT_TYPE>();
		stream.write(result_type);
		stream.write(result);
	}
	template<typename RESULT_TYPE, typename U0, typename U1, typename U2>
	void call(const std::function<RESULT_TYPE(U0, U1, U2)> &fun, BinaryStream &stream) {
		auto x0 = read_from_stream_with_typeid<typename std::decay<U0>::type>(stream);
		auto x1 = read_from_stream_with_typeid<typename std::decay<U1>::type>(stream);
		auto x2 = read_from_stream_with_typeid<typename std::decay<U2>::type>(stream);

		RESULT_TYPE result = fun(x0, x1, x2);
		int32_t result_type = TYPEID<RESULT_TYPE>();
		stream.write(result_type);
		stream.write(result);
	}
	// TODO: more parameters
}
