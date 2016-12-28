/**
 * @author lxxxvi / https://github.com/lxxxvi
 * Developed as part of a project at University of Applied Sciences and Arts Northwestern Switzerland (www.fhnw.ch)
 */

module( "SetMaterialColorCommand" );

test( "Test for SetMaterialColorCommand (Undo and Redo)", function() {

	// Setup scene
	var editor = new Editor();
	var box = aBox();
	var cmd = new AddObjectCommand( box );
	cmd.updatable = false;
	editor.execute( cmd );

	var green   = 12581843; // bffbd3
	var blue    = 14152447; // d7f2ff
	var yellow  = 16775383; // fff8d7

	// there have to be at least 2 colors !
	colors = [ green, blue, yellow ];

	[ 'color', 'emissive', 'specular' ].map( function( attributeName ) {

		colors.map( function ( color )  {

			var cmd = new SetMaterialColorCommand( box, attributeName, color );
			cmd.updatable = false;
			editor.execute( cmd );

		} );

		ok( box.material[ attributeName ].getHex() == colors[ colors.length - 1 ], "OK, " + attributeName + " was set correctly to last color " );

		editor.undo();
		ok( box.material[ attributeName ].getHex() == colors[ colors.length - 2 ], "OK, " + attributeName + " is set correctly to second to last color after undo" );

		editor.redo();
		ok( box.material[ attributeName ].getHex() == colors[ colors.length - 1 ], "OK, " + attributeName + " is set correctly to last color after redo" );


	} );

} );
