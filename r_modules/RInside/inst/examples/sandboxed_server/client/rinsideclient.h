/*
 * Copyright (c) 2014 Christian Authmann
 */

#pragma once

#include "common/binarystream.h"
#include "common/constants.h"
#include "common/typeid.h"

#include <stdexcept>
#include <cstdint>
#include <functional>
#include <map>


#include "callback_helper.h"

class RInsideClient {
	public:

		RInsideClient(BinaryStream &stream);
		~RInsideClient();

		void parseEvalQ(const std::string &code) {
			runScript(code, 0);
			can_send_command = true;
		};

		template <typename T> T parseEval(const std::string &code) {
			runScript(code, TYPEID<T>());
			auto result = stream.read<T>();
			can_send_command = true;
			return result;
		};

		template<typename T>
		void setValue(const std::string &name, const T &value) {
			writeCommand(RIS_CMD_SETVALUE);
			stream.write(name);
			stream.write(TYPEID<T>());
			stream.write(value);

			readReply(true, false);
			can_send_command = true;
		};

		template<typename T>
		T getValue(const std::string &name) {
			writeCommand(RIS_CMD_GETVALUE);
			stream.write(name);
			stream.write(TYPEID<T>());

			readReply(false, true);

			auto type = stream.read<int32_t>();
			if (type != TYPEID<T>())
				unrecoverable_error("getValue() returned wrong type");
			auto result = stream.read<T>();
			can_send_command = true;
			return result;
		};

		template<typename R, typename... Params>
		void setCallback(const std::string &name, std::function<R(Params...)> &callback) {
			uint32_t callback_id = next_callback_id++;
			int32_t result_type = TYPEID<R>();
			size_t paramcount = sizeof...(Params);

			writeCommand(RIS_CMD_SETCALLBACK);
			stream.write(name);
			stream.write(callback_id);
			stream.write(result_type);
			stream.write(paramcount);
			// now write the types of the parameters
			callback_helper::send_pack<Params...>::send(stream);

			// remember the callback
			std::function<void(void)> func = std::bind(callback_helper::call<R, Params...>, std::ref(callback), std::ref(stream));
			callbacks[callback_id] = func;
			readReply(true, false);
			can_send_command = true;
		}

		std::string getConsoleOutput();

		void initPlot(uint32_t width=800, uint32_t height=600);
		std::string getPlot();
	private:
		void runScript(const std::string code, int32_t result_typeid);
		void writeCommand(char command);
		char readReply(bool accept_ok = true, bool accept_value = false);

		void unrecoverable_error(const std::string &error);

		BinaryStream stream;
		uint32_t next_callback_id;
		std::map<uint32_t, std::function<void(void)> > callbacks;
		bool had_unrecoverable_error;
		bool can_send_command;
};
