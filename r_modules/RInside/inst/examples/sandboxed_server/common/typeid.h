/*
 * Copyright (c) 2014 Christian Authmann
 */

#pragma once

#include <cstdint>
#include <type_traits>
#include <string>
#include <vector>

/*
 * We need a value for each type so we can communicate which type to send or receive over the socket.
 *
 * std::type_info won't help, since its values may change on each program start, making them unsuitable for client/server-communication.
 *
 * Our typeid is an int32_t. Negative values are reserved for native types (int, float, std::string, ...) while positive values
 * can be used in custom classes. See datatypes/foo.h for the syntax.
 */

namespace typeid_helpers {
	/*
	 * For void_t, see the CppCon2014 talk by Walter E. Brown: "Modern Template Metaprogramming: A Compendium", Part II
	 */
	template<typename...>
		struct void_t_struct { using type = void; };
	template<typename... C>
		using void_t = typename void_t_struct<C...>::type;



	template<typename T, typename = void>
	struct has_typeid_member : std::false_type { };

	template<typename T>
	struct has_typeid_member<T, void_t<decltype(T::TYPEID)> > : std::true_type { };


	/*
	 * Note: Calling TYPEID() on an unsupported type yields some cryptic compiler errors. If you have seen errors in one of the lines below,
	 * make sure that the type you're calling TYPEID() on is either
	 * - a supported native type and has a specialization below
	 * or
	 * - a custom class with a public static const int32_t TYPEID
	 */
	template <typename T, typename V = void>
	struct id {
	};

	template <typename T>
	struct id<T, typename std::enable_if< has_typeid_member<T>::value >::type> {
		static const int32_t value = T::TYPEID;
	};

	template <>
	struct id<void, void> {
		static const int32_t value = 0;
	};

	template <>
	struct id<int8_t, void> {
		static const int32_t value = -1;
	};

	template <>
	struct id<uint8_t, void> {
		static const int32_t value = -2;
	};

	template <>
	struct id<int16_t, void> {
		static const int32_t value = -3;
	};

	template <>
	struct id<uint16_t, void> {
		static const int32_t value = -4;
	};

	template <>
	struct id<int32_t, void> {
		static const int32_t value = -5;
	};

	template <>
	struct id<uint32_t, void> {
		static const int32_t value = -6;
	};

	template <>
	struct id<int64_t, void> {
		static const int32_t value = -7;
	};

	template <>
	struct id<uint64_t, void> {
		static const int32_t value = -8;
	};

	template <>
	struct id<float, void> {
		static const int32_t value = -9;
	};

	template <>
	struct id<double, void> {
		static const int32_t value = -10;
	};

	template <>
	struct id<std::string, void> {
		static const int32_t value = -11;
	};



	template <>
	struct id<std::vector<int8_t>, void> {
		static const int32_t value = -21;
	};

	template <>
	struct id<std::vector<uint8_t>, void> {
		static const int32_t value = -22;
	};

	template <>
	struct id<std::vector<int16_t>, void> {
		static const int32_t value = -23;
	};

	template <>
	struct id<std::vector<uint16_t>, void> {
		static const int32_t value = -24;
	};

	template <>
	struct id<std::vector<int32_t>, void> {
		static const int32_t value = -25;
	};

	template <>
	struct id<std::vector<uint32_t>, void> {
		static const int32_t value = -26;
	};

	template <>
	struct id<std::vector<int64_t>, void> {
		static const int32_t value = -27;
	};

	template <>
	struct id<std::vector<uint64_t>, void> {
		static const int32_t value = -28;
	};

	template <>
	struct id<std::vector<float>, void> {
		static const int32_t value = -29;
	};

	template <>
	struct id<std::vector<double>, void> {
		static const int32_t value = -30;
	};

	template <>
	struct id<std::vector<std::string>, void> {
		static const int32_t value = -31;
	};
}

template <typename T>
constexpr int32_t TYPEID() {
	return typeid_helpers::id< typename std::decay<T>::type, void >::value;
}


template<typename T, typename = void>
struct has_typeid : std::false_type { };

template<typename T>
struct has_typeid<T, typeid_helpers::void_t<decltype(typeid_helpers::id<typename std::decay<T>::type, void>::value)> > : std::true_type { };

