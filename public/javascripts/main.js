(function(){
//
// USAGE:
// var faulty_str = "I mean... you know---right?";
// var corrected_str = punctuateStr(faulty_str);
//

	String.prototype.punctuate = function() {
		// variables indicating whether a quotation is open;
		var open_double = false,
			open_single = false,
			current_str = this,
			current_char, i;

		// loop through the characters in a string;
		for (i = 0; i < current_str.length; i++) {
			// find the current character;
			if (current_str[i]) current_char = current_str[i];
			else current_char = current_str.substr(i,1);

			// if a foot mark or back-tick is found;
			if (current_char == "\'" || current_char == "\`") {
				// check if this is likely meant to be an apostrophe
				if (i !== 0 && current_str.substr(i-1,1) !== " " && current_str.substr(i-1,1) != "\"" && i != current_str.length-1 && current_str.substr(i+1,1) !== " " && current_str[i+1] != "\"") {
					// right single quote (apostrophe)
					current_str = current_str.substring(0,i) + "\u2019" + current_str.substring(i+1,current_str.length);
				} else {
					if (!open_single) {
						// if there is no open single-quoted string, print an opening single quote;
						current_str = current_str.substring(0,i) + "\u2018" + current_str.substring(i+1,current_str.length);
						open_single = true;
					} else {
						// if there IS an open single-quoted string, print a closing single quote;
						current_str = current_str.substring(0,i) + "\u2019" + current_str.substring(i+1,current_str.length);
						open_single = false;
					}
				}
			} else
			if (current_char == "\"") {
				if (!open_double) {
					// if there is no open double-quoted string, print an opening double quote;
					current_str = current_str.substring(0,i) + "\u201C;" + current_str.substring(i+1,current_str.length);
					open_double = true;
				} else {
					// if there IS an open double-quoted string, print a closing double quote;
					current_str = current_str.substring(0,i) + "\u201D" + current_str.substring(i+1,current_str.length);
					open_double = false;
				}
			} else
			// if there a minus sign is found;
			if (current_char == "\-") {
				// check if the user entered three minus signs, i.e., and EM dash;  &#8202;&mdash;&#8202;
				if (current_str.substr(i-1,1) == "\-" && current_str.substr(i-2,1) == "\-") {
					current_str = current_str.substring(0,i-2) + "\u2014" + current_str.substring(i+1,current_str.length);
				} else
				// check if the user entered two minus signs, i.e.m an EN dash &#8202;&ndash;&#8202;;
				if (current_str.substr(i-1,1) == "\-" && current_str.substr(i-2,1) != "\-" && current_str.substr(i+1,1) != "\-") {
					current_str = current_str.substring(0,i-1) + "\u2013" + current_str.substring(i+1,current_str.length);
				} else
				// check if the user likely intended a minus sign; &#8202;&ndash;&#8202;
				if (current_str.substr(i-1,1).match(/[0-9]/) && current_str.substr(i+1,1).match(/[0-9]/)) {
					current_str = current_str.substring(0,i) + "\u2212" + current_str.substring(i+1,current_str.length);
				} else
				// check if the user likely intended a hyphen;&#45;
				if (current_str.substr(i-1,1).match(/[A-Za-z]/) && current_str.substr(i+1,1).match(/[A-Za-z]/)) {
					current_str = current_str.substring(0,i) + "\u2010" + current_str.substring(i+1,current_str.length);
				}
			} else
			// if a period is found;
			if (current_char == ".") {
				// check if this is the third of three periods, i.e. an ellipsis;   &hellip;
				if (current_str.substr(i-1,1) == "." && current_str.substr(i-2,1) == ".") {
					current_str = current_str.substring(0,i-2) + "\u2026" + current_str.substring(i+1,current_str.length);
				}
			}
			current_char = current_str[i];
		}
		return current_str;
	};


	/*
	 * Some OOP help, courtesy of Dustin Diaz
	 */
	Array.prototype.forEach = function(fn, thisObj) {
		var scope = thisObj || window;
		for ( var i=0, j=this.length; i < j; ++i ) {
			fn.call(scope, this[i], i, this);
		}
	};
	Array.prototype.filter = function(fn, thisObj) {
		var scope = thisObj || window,
			a = [];
		for ( var i=0, j=this.length; i < j; ++i ) {
			if ( !fn.call(scope, this[i], i, this) ) {
				continue;
			}
			a.push(this[i]);
		}
		return a;
	};

	function Observer() {
		this.fns = [];
	}
	Observer.prototype = {
		subscribe: function(fn) {
			this.fns.push(fn);
		},
		unsubscribe: function(fn) {
			this.fns = this.fns.filter(
				function(el) {
					if (el !== fn) {
						return el;
					}
				}
			);
		},
		fire: function(o,thisObj) {
			var scope = thisObj || window;
			this.fns.forEach(
				function(el) {
					el.call(scope,o);
				}
			);
		}
	};

	var validateArgTypes = function(args,types) {
		for (var i = 0; i < args.length; i++) {
			if (typeof args[i] !== types[i])
				return "expected argument " + i + " to be of type " +
						types[i] + ", but received type " + (typeof args[i]);
		}
		return false;
	};




	/*
	 * the main T8Writer singleton,
	 * referenced from outside as T8Writer
	 */
	var Writer = {
		// user properties
		key: undefined,
		user_id: undefined,
		// document properties
		current_document: undefined,
		cursor_position: undefined,
		// observers
		load_observer: new Observer(), // listen for the initial script to be loaded
		exit_observer: new Observer(), // listen for exit function completion
		// intervals
		auto_save: undefined,
		fade: undefined,
		idle_counter: undefined,

		/**
		 * this function gets called by bookmarklet
		 * @param key random (but unique) md5 hash representing user. passed in by bookmarklet
		 */
		init: function(key) {
			console.log( "Function init " + validateArgTypes( [key],["string"] ) );

			Writer.key = key;
			// create container element #T8Writer, so we can easily remove
			// entire plugin from DOM
			var t8_writer = document.createElement("div");
				t8_writer.setAttribute("id","T8Writer");
				document.body.appendChild(t8_writer);

			Writer.load_observer.subscribe(Writer.onLoad);  // notify onLoad() function when show.js loads
			Writer.exit_observer.subscribe(T8Exit); // notify T8Exit() function when exit is called
			Writer.Utilities.loadScript('http://localhost:3000/writer/show.js');
			Writer.Utilities.loadStyle('http://localhost:3000/stylesheets/writer.css');

			Writer.Utilities.updateTitle();
		},

		/**
		 * callback when initial markup is loaded from show.js (new.html.erb)
		 */
		onLoad: function() {
			Writer.Elements = {
				// structure
				"self": document.getElementById("T8Writer"),
				"overlay": document.getElementById("T8Writer_Overlay"),
				"container": document.getElementById("T8Writer_Container"),
				"form": document.getElementById("T8Writer_Form"),

				// help
				"help_info": document.getElementById("T8Writer_HelpInfo"),
				"close_help": document.getElementById("closeT8WriterHelp"),

				// actions
				"command_form": document.getElementById("T8Writer_Command"),
				"command_prompt": document.getElementById("T8Writer_CommandPrompt"),
				"new_document_form": document.getElementById("T8Writer_NewDocument"),
				"new_document_title": document.getElementById("T8Writer_NewDocTitle"),

				// document
				"title": document.getElementById("T8Writer_Title"),
				"contents": document.getElementById("T8Writer_Contents"),

				// chrome
				"documents": document.getElementById("T8Writer_Documents"),
				"messages": document.getElementById("T8Writer_Messages"),

				// controls
				"controls": document.getElementById("T8Writer_Controls"),
				"save": document.getElementById("T8Writer_Save"),
				"revert": document.getElementById("T8Writer_Revert"),
				"email": document.getElementById("T8Writer_Email"),
				"create": document.getElementById("T8Writer_Create"),
				"help": document.getElementById("T8Writer_Help"),
				"exit": document.getElementById("exitT8Writer")
			};


			// attach events
			Writer.Elements["save"].onclick = Writer.Modes.enterCommand.commands["save"];
			Writer.Elements["revert"].onclick = Writer.Modes.enterCommand.commands["revert"];
			Writer.Elements["create"].onclick = Writer.Modes.createDocument;
			Writer.Elements["help"].onclick = Writer.Modes.help;

			// X button
			Writer.Elements["exit"].onclick = T8Writer.exit;
			// apply fadeIn and fadeOut functionality
			Writer.Effects.attachEffects();
			// load user's prior documents
			Writer.Modes.selectDocument();
		},

		/**
		 *
		 * @param id document ID (integer)
		 */
		openDocument: function(id) {
			console.log( "Function openDocument " + validateArgTypes( [id],["number"] ) );

			clearInterval(Writer.auto_save);
			// create new instance of Document class
			Writer.current_document = new Document(id);
			// status message
			Writer.Utilities.statusMsg("Loading document&hellip;",false);
			// load document to be edited, passing in ID
			Writer.Utilities.loadScript('http://localhost:3000/documents/'+id+'/edit.js');
		},

		/**
		 *
		 * @param title (string), passed in from 'create' command
		 */
		createDocument: function(title) {
			console.log( "Function createDocument " + validateArgTypes( [title],["string"] ) );

			// this is what we do once any unsaved document has been saved
			function proceed() {
				// create new document with title and user's id
				Writer.Utilities.loadScript('http://localhost:3000/documents/new.js?user_id='+Writer.user_id+"&title="+encodeURIComponent(title));	
			}
			// check to see if there's an open document...
			// ...if so, save it before creating a new one.
			if (typeof Writer.current_document !== "undefined") {
				// run proceed() function once save has finished
				Writer.current_document.observer.subscribe(proceed);
				Writer.current_document.save();
			} else {
				proceed();
			}
		},

		/**
		 * close the damn thing
		 */
		exit: function() {
			clearInterval(Writer.auto_save);
			clearInterval(Writer.idle_counter);
			
			// create new document with title and user's id
			function proceed() {
				// restore title
				document.title = document.title.substring(0,document.title.indexOf(" __/---/\u203E\u203E"));
				// remove #T8Writer (wrapper) element
				document.body.removeChild(Writer.Elements["self"]);
				// Delete all JS variables (e.g. window["T8Writer"])   
				Writer.exit_observer.fire();
			}
			// check to see if there's an open document...
			// ...if so, save it before creating a new one.
			if (typeof Writer.current_document !== "undefined") {
				// run proceed() function once save has finished
				Writer.current_document.observer.subscribe(proceed);
				Writer.current_document.save();
			} else {
				proceed();
			}
		},

		autoSave: function() {
			 Writer.auto_save = setInterval(function(){
				Writer.current_document.save();
			 },45000);
		},

		autoPunctuate: function() {
			var text_nodes, i;

			Writer.Utilities.captureCursor();
			// TODO: this childNodes[0] thing is not sustainable!
			text_nodes = Writer.Utilities.getTextNodes(document.getElementById("T8Writer_Contents"));
			for (i = 0; i < text_nodes.length; i++) {
				text_nodes[i].nodeValue = text_nodes[i].nodeValue.punctuate();	
			}

			Writer.Utilities.resetCursor(Writer.cursor_position);
		}
	};

	/**
	 * callback for successful document creation
	 * @param id (integer) ID of new document
	 * @param title (string) the title we gave the new document
	 */
	Writer.createDocument.success = function(id,title) {
		console.log( "Function createDocument.success " + validateArgTypes( [id,title],["number","string"] ) );

		// status message
		Writer.Utilities.statusMsg("Successfully created document &lsquo;"+Writer.createDocument.title+"&rsquo;",true,3000);
		// create instance of Document class to mirror backend
		Writer.current_document = new Document(id);
		Writer.current_document.id = id;
		Writer.current_document.title = title;
		// load our newly created document
		Writer.openDocument(Writer.current_document.id);
		// remove the title prompt
		Writer.Elements["new_document_form"].style.display = "none";
		// reload user's prior documents
		Writer.Modes.selectDocument();
	};

	/**
	 * callback for failed document creation
	 * @param errs Array? error message passed from Rails' unsuccessful creation
	 * TODO: logging!
	 */
	Writer.createDocument.errors = function(errs) {
		console.log( validateArgTypes( [errs],["string"] ) );

		// status message
		Writer.Utilities.statusMsg("The following errors occurred while attempting to create " +
			Writer.createDocument.title + ": "+errs+".",true,3000);
	};


	/*
	 * Utility functions
	 */
	Writer.Utilities = {
		/**
		 *
		 * @param msg = (string) message to be displayed in status box
		 * @param clearIt = (boolean) indicates whether to clear the status after timeout
		 */
		statusMsg: function(msg,clearIt,timeout) {
			console.log( "Function statusMsg " + validateArgTypes( [msg,clearIt],["string","boolean"] ) );

			// status message
			Writer.Elements["messages"].innerHTML = msg;

			if (clearIt) {
				// clear status after timeout seconds
				setTimeout(function(){
					if (Writer.Elements["messages"])
						Writer.Elements["messages"].innerHTML = "";
				},timeout);
			}
		},

		updateTitle: function() {
			var T8_pos = document.title.indexOf("T8Writer active."),
				editing_pos = document.title.indexOf(" Editing: ");
			if (T8_pos == -1) {
				document.title += " __/---/\u203E\u203E T8Writer active.";
				T8_pos = document.title.length - 16;
			}

			if (editing_pos != -1) {
				document.title = document.title.substring(0,editing_pos);
			}

			if (typeof Writer.current_document !== "undefined")
				document.title += " Editing: \u201C" + Writer.current_document.title + "\u201D";
		},

		/**
		 *
		 * @param sUrl = (string) url of JS file to load
		 */
		loadScript: function(sUrl) {
			console.log( "Function loadScript " + validateArgTypes( [sUrl],["string"] ) );

			var script = document.createElement("script");
				script.setAttribute("type","text/javascript");
				script.setAttribute("src",sUrl);
			document.getElementById("T8Writer").appendChild(script);
			// TODO: delete tag after script has been executed
		},

		/**
		 *
		 * @param lHref (string) url of stylesheet to load
		 */
		loadStyle: function(lHref) {
			console.log( "Function loadStyle " + validateArgTypes( [lHref],["string"] ) );

			var link = document.createElement("link");
				link.setAttribute("type","text/css");
				link.setAttribute("rel","stylesheet");
				link.setAttribute("href",lHref);
			document.getElementById("T8Writer").appendChild(link);
		},

		/**
		 * capture 'enter' keypress, signals submission in cmd mode
		 * @param e
		 */
		listenForEnter: function(e) {
			var evt = e || window.event;
			if (evt.keyCode == 13) {
				Writer.Utilities.removeEvent(document,"keypress",Writer.Utilities.listenForEnter);
				var command = Writer.Elements["command_prompt"].value, i;
				for (i in Writer.Modes.enterCommand.commands) {
					if (command.indexOf(i) != -1) {
						// hide command prompt form
						Writer.Elements["command_form"].style.display = "none";

						Writer.Modes.enterCommand.commands[i](command);
						Writer.Modes.write();
						// reset cursor (we captured cursor position before entering command line mode)
						Writer.Utilities.resetCursor(Writer.cursor_position);
					}
				}
				Writer.Utilities.cancelDefault(e);
			}
		},

		/**
		 * capture '.' keypress, signals launch of cmd mode (when 'alt' is held down)
		 * @param e
		 */
		listenForPeriod: function(e) {
			var evt = e || window.event;
			if(evt.keyCode == 460 || evt.charCode == 46) {
				Writer.Utilities.removeEvent(document,"keypress",Writer.Utilities.listenForPeriod);
				// command mode!
				Writer.Modes.enterCommand();
			}
		},

		/**
		 * capture 'alt' keydown, if '.' is pressed, launch cmd mode
		 * @param e
		 */
		listenForAlt: function(e) {
			var evt = e || window.event;
			if(evt.altKey) {
				Writer.Utilities.removeEvent(document,"keydown",Writer.Utilities.listenForAlt);
				Writer.Utilities.addEvent(document,"keypress",Writer.Utilities.listenForPeriod);
			}
		},

		captureKeyCombo: function() {
			Writer.Utilities.addEvent(document,"keydown",Writer.Utilities.listenForAlt);
		},

		/**
		 * does what it says. cancels default action from evt. prevents firefox from adding <br _moz_dirty>
		 * @param e
		 */
		cancelDefault: function(e) {
			if (e && e.preventDefault)
				e.preventDefault();
			else if (window.event && window.event.returnValue)
				window.eventReturnValue = false;
		},

		// addEvent and removeEvent courtesy of Peter Paul Koch
		// http://www.quirksmode.org/blog/archives/2005/10/_and_the_winner_1.html
		addEvent: function(obj,type,fn) {
			console.log( "Function addEvent " + validateArgTypes( [obj,type,fn],["object","string","function"] ) );

			if (obj.addEventListener)
				obj.addEventListener( type, fn, false );
			else if (obj.attachEvent)
			{
				obj["e"+type+fn] = fn;
				obj[type+fn] = function() { obj["e"+type+fn]( window.event ); };
				obj.attachEvent( "on"+type, obj[type+fn] );
			}
		},

		removeEvent: function(obj,type,fn) {
			console.log( "Function removeEvent " + validateArgTypes( [obj,type,fn],["object","string","function"] ) );

			if (obj.removeEventListener)
				obj.removeEventListener( type, fn, false );
			else if (obj.detachEvent)
			{
				obj.detachEvent( "on"+type, obj[type+fn] );
				obj[type+fn] = null;
				obj["e"+type+fn] = null;
			}
		},

		captureCursor: function() {
			var selection = window.getSelection(), range = undefined;
			// Get range (standards)
			if(selection.getRangeAt !== undefined) {
				range = selection.getRangeAt(0);
			}
			Writer.cursor_position = [range.startContainer,range.startOffset,range.endOffset];
		},

		// TODO: "coords" is actually coords AND relevant node. better name? separate args?
		resetCursor: function(coords) {
			console.log( "Function resetCursor " + validateArgTypes( [coords],["object"] ) );

			document.getElementById("T8Writer_Contents").focus();
			// timeout while we wait for cursor to be positioned normally after focus so there's no conflict here
			setTimeout(function(){
				var text_nodes, text_node, selection, range, node_length;
				// TODO: we need to make sure this is a text node.
				text_nodes = Writer.Utilities.getTextNodes(document.getElementById("T8Writer_Contents"));
				text_node = text_nodes[text_nodes.length-1];
				// new selection
				selection = window.getSelection();
				// range
				range = document.createRange();
				// if we've passed in an array indicating the previous selection, use it
				if (!(coords instanceof Array)) {
					range.selectNode(text_node);
					// collapse range to end of contents
					range.collapse(false);
				} else {
					// sometimes we end up replacing multiple characters (---, ..., etc.) with one
					// this means that our node might be shorter than when we captured cursor.
					if (coords[0].nodeType == 3) {
						node_length = coords[0].nodeValue.length;
					} else
					if (coords[0].nodeType == 1) {
						node_length = coords[0].innerHTML.length;
					}
					// if so, we need to adjust
					if (!isNaN(node_length)) {
						if (coords[1] > node_length)
							coords[1] = node_length;
						if (coords[2] > node_length)
							coords[2] = node_length;
					}
					range.setStart(coords[0],coords[1]);
					range.setEnd(coords[0],coords[2]);
				}
				selection.removeAllRanges();
				// apply range (move cursor)
				selection.addRange(range);
			},10);
		},

		/**
		 * we want to get all of the text nodes within #T8Writer_Contents
		 * so we can run punctuation correction on them
		 * @param node. HTMLNode. The node among whose children we want to find text nodes
		 */
		getTextNodes: function(node) {
			console.log( "Function getTextNodes " + validateArgTypes( [node],["object"] ) );

			var text_nodes = [], i;
			for (i = 0; i < node.childNodes.length; i++) {
				if (node.childNodes[i].nodeType == 3)
					text_nodes.push(node.childNodes[i]);
			}
			return text_nodes;
		},

		/**
		 * wait for a user in writer mode to go 5s without typing, then correct punctuation (Writer.autoPunctuate)
		 */
		isIdle: function() {
			var counter = 0;
			Writer.Utilities.addEvent(document, "keypress", function(){
				counter = 0;
			});
			Writer.idle_counter = setInterval(function(){
				counter += 1;
				if (counter == 5) {
					Writer.autoPunctuate();
					counter = 0;
				}
			},1000);
		}
	};

	/*
	 * defines modes of operation for T8Writer
	 */
	Writer.Modes = {
		createDocument: function() {
			Writer.Elements["new_document_form"].style.display = "block";
			Writer.Elements["new_document_title"].select();
			Writer.Elements["new_document_form"].onsubmit = function() {
				var title = Writer.Elements["new_document_title"].value;
				Writer.createDocument(title);
				
				return false;
			};
		},

		write: function(){
			if (typeof Writer.current_document === "undefined") {
				Writer.Modes.createDocument();
				return false;
			}

			Writer.Utilities.isIdle();
			Writer.autoSave();
			
			// listen for command mode
			Writer.Utilities.captureKeyCombo();
		},

		help: function() {
			var closeHelp = function() {
				Writer.Elements["help_info"].style.display = "none";
				Writer.Utilities.removeEvent(
					document,
					"keypress",
					captureKey
				);
			},
			captureKey = function(e) {
				var evt = e || window.event;
				if (evt.keyCode == 27) {
					closeHelp();
				}
				Writer.Utilities.cancelDefault(e);
			};

			Writer.Elements["help_info"].style.display = "block";
			Writer.Elements["close_help"].onclick = closeHelp;
			Writer.Utilities.addEvent(
				document,
				"keypress",
				captureKey
			);
		},

		selectDocument: function() {
			// clear current list
			Writer.Elements["documents"].innerHTML = "";
			// open list of user's documents.
			// to call this selectDocument MODE is maybe a little artificial
			Writer.Utilities.loadScript('http://localhost:3000/user_documents.js?key='+Writer.key);
		},

		enterCommand: function() {
			clearInterval(Writer.idle_counter);
			clearInterval(Writer.auto_save);

			Writer.Utilities.captureCursor();
			// show command prompt form
			Writer.Elements["command_form"].style.display = "block";
			Writer.Elements["command_prompt"].select();
			
			Writer.Utilities.addEvent(document,"keypress",Writer.Utilities.listenForEnter);
			return false;
		}
	};
	Writer.Modes.enterCommand.commands = {
		"save": function(){
			// since this was a user-requested save (as opposed to automatic),  
			// we set the doCache boolean to true
			Writer.current_document.save(true);
		},
		"create": function(command){
			console.log( "Function commands.create " + validateArgTypes( [command],["string"] ) );

			// title = everything after "create "
			var title = command.substring(command.indexOf("create")+7,command.length);
			Writer.createDocument(title);
		},
		"help": function() { Writer.Modes.help() },
		"exit": function() { Writer.exit(); },
		"revert": function() { Writer.current_document.revert(); },
		"open": function() {}
	};
	Writer.Effects = {
		attachEffects: function() {	
			document.getElementById("T8Writer_Contents").onblur = function(){
				Writer.autoPunctuate();
				Writer.Effects.fadeInExtras(1500);

				clearInterval(Writer.idle_counter);
				clearInterval(Writer.auto_save);
			};
			document.getElementById("T8Writer_Contents").onfocus = function(e){
				Writer.Effects.fadeOutExtras(3000);
				Writer.Modes.write();
			};
		},

		fadeInExtras: function(duration) {
			console.log( "Function fadeInExtras " + validateArgTypes( [duration],["number"] ) );

			// array of elements to fade in
			var extras = [
				document.getElementById("T8Writer_Title"),
				Writer.Elements["documents"],
				Writer.Elements["messages"],
				Writer.Elements["controls"]
			],
			end_opacity = 1, // we finish at fully opaque
			j;

			try {
				clearInterval(Writer.fade);
			}
			catch (err) {
				
			}
			// add .5% opacity 20x (every 1/20th of supplied duration)
			Writer.fade = setInterval(function(){
				if (parseFloat(extras[0].style.opacity) == end_opacity) {
					clearInterval(Writer.fade);
					return;
				}
				for (j = 0; j < extras.length; j++) {
					extras[j].style.opacity = parseFloat(extras[j].style.opacity) + 0.05;
				}
			},(duration / 20));
		},

		fadeOutExtras: function(duration) {
			console.log( "Function fadeOutExtras " + validateArgTypes( [duration],["number"] ) );

			// array of elements to fade in
			var extras = [
				document.getElementById("T8Writer_Title"),
				Writer.Elements["documents"],
				Writer.Elements["messages"],
				Writer.Elements["controls"]
			],
			end_opacity = 0, // we finish at fully transparent
			j;

			try {
				clearInterval(Writer.fade);
			}
			catch (err) {

			}
			// subtract .5% opacity 20x (every 1/20th of supplied duration)
			Writer.fade = setInterval(function(){
				if (parseFloat(extras[0].style.opacity) == end_opacity) {
					clearInterval(Writer.fade);
					return;
				}
				for (j = 0; j < extras.length; j++) {
					extras[j].style.opacity = parseFloat(extras[j].style.opacity) - 0.05;
				}
			},(duration / 20));
		}
	};

	// Document constructor
	var Document = function(id) {
		this.title = undefined;
		this.contents = undefined;
		this.id = id;
		this.observer = new Observer();
		this.cache = {
			contents: undefined	
		};
	};
	Document.prototype = {
		/**
		 *
		 * @param doCache (boolean) indicates whether we should cache this save point
		 */
		save: function(doCache) {
			console.log( "Function document.save " + validateArgTypes( [doCache],["boolean"] ) );

			// status message
			// TODO: since the Message area is separate from the Document class
			// I should really handle this with observers
			Writer.Utilities.statusMsg("Saving document&hellip;",false);

			// get current title
			this.title = document.getElementById("T8Writer_Title").innerHTML;

			// get current text
			this.contents = document.getElementById("T8Writer_Contents").innerHTML;

			// if user requested this save explicitly, cache document for later revert
			if (doCache === true) {
				this.cache.title = this.title;
				this.cache.contents = this.contents;   
			}

			// tell the server to save it
			Writer.Utilities.loadScript('http://localhost:3000/documents/'+this.id+'/save.js?_method=put&document[title]='+encodeURIComponent(this.title)+'&document[contents]='+encodeURIComponent(this.contents));
		},
		revert: function() {
			// if we have a cached version of this document (we should!), retrieve it
			if (typeof this.cache.contents !== "undefined") {
				// status message
				Writer.Utilities.statusMsg("Reverting to last save point&hellip;",false);

				// retrieve cached version
				document.getElementById("T8Writer_Contents").innerHTML = this.cache.contents;

				// status message
				Writer.Utilities.statusMsg("Successfully reverted document.",true,3000);
			} else {
				// status message
				Writer.Utilities.statusMsg("Document has not been changed since last save.",true,3000);
			}
		},
		email: function(address) {
			console.log( "Function document.email " + validateArgTypes( [address],["string"] ) );


		}
	};

	/**
	 * callback for successful save
	 */
	Document.prototype.save.success = function() {
		// status message
		Writer.Utilities.statusMsg(T8Writer.current_document.title + ' successfully saved.',true,3000);

		// tell anyone who's listening that document has been saved
		Writer.current_document.observer.fire();

		// reload user's prior documents
		if (document.getElementById("T8Writer") !== null)
			Writer.Modes.selectDocument();
	};

	/**
	 * callback for failed save attempt
	 * @param errs Array? passed by Rails
	 */
	Document.prototype.save.errors = function(errs) {
			console.log( "Function document.save.errors " + validateArgTypes( [errs],["string"] ) );

		// status message
		Writer.Utilities.statusMsg("The following errors occurred while attempting to save "+
				Writer.current_document.title + ": "+errs+".",true,3000);
	};
	window["T8Writer"] = Writer;
	// really only left in here for debugging purposes
	window["T8Document"] = Document;

	window["T8Exit"] = function() {
		delete window["T8Writer"];
		delete window["T8Document"];
		document.body.removeChild(
			document.getElementById("T8Writer_Init")
		);
	};
})();