/*
 * Copyright (c) 2014 Christian Authmann
 */


#include "rinsideclient.h"
#include "common/constants.h"
#include <exception>
#include <stdexcept>


RInsideClient::RInsideClient(BinaryStream &_stream) : stream(std::move(_stream)), next_callback_id(1), had_unrecoverable_error(false), can_send_command(false) {
	stream.write(RIS_MAGIC_NUMBER);
	can_send_command = true;
}

RInsideClient::~RInsideClient() {
	if (!had_unrecoverable_error && can_send_command) {
		try {
			stream.write(RIS_CMD_EXIT);
		}
		catch (...) {
			// don't ever throw in a destructor!
		}
	}
}


void RInsideClient::runScript(const std::string code, int32_t result_typeid) {
	writeCommand(RIS_CMD_RUN);
	stream.write(code);
	stream.write(result_typeid);

	while (true) {
		auto reply = stream.read<char>();
		if (reply == RIS_REPLY_CALLBACK) {
			auto callback_id = stream.read<uint32_t>();

			auto &func = callbacks.at(callback_id);
			try {
				func();
			}
			catch (const callback_helper::parameter_error_exception &e) {
				// This is a recoverable error!
				can_send_command = true;
				throw std::runtime_error(e.what());
			}
			catch (...) {
				had_unrecoverable_error = true;
				throw;
			}
		}
		else if (reply == RIS_REPLY_OK) {
			if (result_typeid != 0)
				unrecoverable_error("runScript() did not return a value when one was requested");
			return;
		}
		else if (reply == RIS_REPLY_VALUE) {
			if (result_typeid == 0)
				unrecoverable_error("runScript() did return a value when none was requested");

			auto type = stream.read<int32_t>();
			if (type != result_typeid)
				unrecoverable_error("runScript() did return a value of the wrong type");
			return;
		}
	}
}

std::string RInsideClient::getConsoleOutput() {
	writeCommand(RIS_CMD_GETCONSOLE);
	readReply(false, true);
	auto result = stream.read<std::string>();
	can_send_command = true;
	return result;
}


void RInsideClient::initPlot(uint32_t width, uint32_t height) {
	writeCommand(RIS_CMD_INITPLOT);
	stream.write(width);
	stream.write(height);
	readReply(true, false);
	can_send_command = true;
}

std::string RInsideClient::getPlot() {
	writeCommand(RIS_CMD_GETPLOT);
	readReply(false, true);
	auto result = stream.read<std::string>();
	can_send_command = true;
	return result;
}

void RInsideClient::writeCommand(char command) {
	if (had_unrecoverable_error)
		throw std::runtime_error("RInsideClient cannot continue due to previous unrecoverable errors");
	if (!can_send_command)
		throw std::runtime_error("RInsideClient cannot send a command at this time");

	stream.write(command);
	can_send_command = false;
}

char RInsideClient::readReply(bool accept_ok, bool accept_value) {
	auto reply = stream.read<char>();
	if (reply == RIS_REPLY_ERROR) {
		auto error = stream.read<std::string>();
		can_send_command = true;
		throw std::runtime_error(std::string("Error in R Server: ") + error);
	}
	if (reply == RIS_REPLY_OK && !accept_ok)
		unrecoverable_error("Got unexpected reply from the R server");
	if (reply == RIS_REPLY_VALUE && !accept_value)
		unrecoverable_error("Got unexpected reply from the R server");

	return reply;
}

void RInsideClient::unrecoverable_error(const std::string &error) {
	had_unrecoverable_error = true;
	throw std::runtime_error(error);
}
