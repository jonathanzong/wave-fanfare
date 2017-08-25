// https://cmuphyscomp.github.io/physcomp-f15/exercises/Pure-Data/pd-arduino/index.html

#define BAUD_RATE 115200

// The maximum message line length.
#define MAX_LINE_LENGTH 80

// The maximum number of tokens in a single message.
#define MAX_TOKENS 10

#ifndef LED_BUILTIN
#define LED_BUILTIN 13
#endif

/****************************************************************/
/**** Utility functions *****************************************/
/****************************************************************/

// Send a single debugging string to the console.
static void send_debug_message( const char *str )
{
  Serial.print("dbg ");
  Serial.println( str );
}

// Send a single debugging integer to the console.
static void send_debug_message( int i )
{
  Serial.print("dbg ");
  Serial.println( i );
}

/****************************************************************/
// Wrapper on strcmp for clarity of code.  Returns true if strings are
// identical.
static int string_equal( char *str1, char *str2 )
{
  return !strcmp(str1, str2);
}

/****************************************************************/
/****************************************************************/
// Process an input message.  Unrecognized commands are silently ignored.

static void parse_input_message(int argc, char *argv[])
{
  // Interpret the first token as a command symbol.
  char *command = argv[0];

  send_debug_message(command);

  if (string_equal(command, "led")) {
    int value = atoi(argv[1] );
    if (value) {
      digitalWrite(LED_BUILTIN, HIGH);
    }
    else {
      digitalWrite(LED_BUILTIN, LOW);
    }
  }
}

/****************************************************************/
// Polling function to process messages arriving over the serial port.  Each
// iteration through this polling function processes at most one character.  It
// records the input message line into a buffer while simultaneously dividing it
// into 'tokens' delimited by whitespace.  Each token is a string of
// non-whitespace characters, and might represent either a symbol or an integer.
// Once a message is complete, parse_input_message() is called.

static void serial_input_poll(void)
{
  static char input_buffer[ MAX_LINE_LENGTH ];   // buffer for input characters
  static char *argv[MAX_TOKENS];                 // buffer for pointers to tokens
  static int chars_in_buffer = 0;  // counter for characters in buffer
  static int chars_in_token = 0;   // counter for characters in current partially-received token (the 'open' token)
  static int argc = 0;             // counter for tokens in argv
  static int error = 0;            // flag for any error condition in the current message

  // Check if at least one byte is available on the serial input.
  if (Serial.available()) {
    int input = Serial.read();

    // If the input is a whitespace character, end any currently open token.
    if ( isspace(input) ) {
      if ( !error && chars_in_token > 0) {
	if (chars_in_buffer == MAX_LINE_LENGTH) error = 1;
	else {
	  input_buffer[chars_in_buffer++] = 0;  // end the current token
	  argc++;                               // increase the argument count
	  chars_in_token = 0;                   // reset the token state
	}
      }

      // If the whitespace input is an end-of-line character, then pass the message buffer along for interpretation.
      if (input == '\r' || input == '\n') {

	// if the message included too many tokens or too many characters, report an error
	if (error) send_debug_message("excessive input error");

	// else process any complete message
	else if (argc > 0) parse_input_message( argc, argv );

	// reset the full input state
	error = chars_in_token = chars_in_buffer = argc = 0;
      }
    }

    // Else the input is a character to store in the buffer at the end of the current token.
    else {
      // if beginning a new token
      if (chars_in_token == 0) {

	// if the token array is full, set an error state
	if (argc == MAX_TOKENS) error = 1;

	// otherwise save a pointer to the start of the token
	else argv[ argc ] = &input_buffer[chars_in_buffer];
      }

      // the save the input and update the counters
      if (!error) {
	if (chars_in_buffer == MAX_LINE_LENGTH) error = 1;
	else {
	  input_buffer[chars_in_buffer++] = input;
	  chars_in_token++;
	}
      }
    }
  }
}

/****************************************************************/
/**** Standard entry points for Arduino system ******************/
/****************************************************************/

void setup()
{
  // initialize the Serial port
  Serial.begin( BAUD_RATE );
  pinMode(LED_BUILTIN, OUTPUT);

  send_debug_message("wakeup");
}

void loop()
{
  serial_input_poll();
}

