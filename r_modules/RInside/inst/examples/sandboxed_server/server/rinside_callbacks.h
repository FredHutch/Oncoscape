class RInsideCallbacks : public Callbacks {
	public:
		// see inst/includes/Callbacks.h for a list of all overrideable methods
		virtual std::string ReadConsole( const char* prompt, bool addtohistory ) {
			return "";
		};

		virtual void WriteConsole( const std::string& line, int type ) {
			output_buffer << line;
			//printf("Got buffer of type %d: '%s'\n", type, line.c_str());
		};

		virtual void FlushConsole() {
		};

		virtual void ResetConsole() {
		};

		virtual void CleanerrConsole() {
		};

		virtual void Busy( bool /*is_busy*/ ) {
		};

		virtual void ShowMessage(const char* message) {
			//printf("Got Message: '%s'\n", message);
		};

		virtual void Suicide(const char* message) {
			LOG("R Suicide: %s", message);
			throw std::runtime_error("R suicided"); // TODO: is this the correct way to handle suicides?
		};


		virtual bool has_ReadConsole() { return true; };
		virtual bool has_WriteConsole() { return true; };
		virtual bool has_FlushConsole(){ return true; };
		virtual bool has_ResetConsole() { return true; };
		virtual bool has_CleanerrConsole() { return true; };
		virtual bool has_Busy() { return true; };
		virtual bool has_ShowMessage() { return true; };
		virtual bool has_Suicide() { return true; };

		void resetConsoleOutput() {
			output_buffer.str("");
			output_buffer.clear();
		}

		std::string getConsoleOutput() {
			return output_buffer.str();
		}
	private:
		std::ostringstream output_buffer;
};
