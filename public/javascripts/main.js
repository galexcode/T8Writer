(function(){
    /* characterize.js
     author: Kyle Jacobson
     last edited: December, 2008
     */

    //
    // USAGE:
    // var faulty_str = "I mean... you know---right?";
    // var corrected_str = punctuateStr(faulty_str);
    //

    function punctuateStr(current_str) {
        // variables indicating whether a quotation is open;
        var open_double = false,
            open_single = false,
            current_char = undefined;

        // loop through the characters in a strng;
        for (i = 0; i < current_str.length; i++) {
            // find the current character;
            if (current_str[i])
                current_char = current_str[i];
            else
                current_char = current_str.substr(i,1);

            // if a foot mark or back-tick is found;
            if (current_char == "\'" || current_char == "\`") {
                // check if this is likely meant to be an apostrophe
                if (i != 0 && current_str.substr(i-1,1) != " " && current_str.substr(i-1,1) != "\"" && i != current_str.length-1 && current_str.substr(i+1,1) != " " && current_str[i+1] != "\"") {
                    current_str = current_str.substring(0,i) + "&rsquo;" + current_str.substring(i+1,current_str.length);
                } else {
                    if (!open_single) {
                        // if there is no open single-quoted string, print an opening single quote;
                        current_str = current_str.substring(0,i) + "&lsquo;" + current_str.substring(i+1,current_str.length);
                        open_single = true;
                    } else {
                        // if there IS an open single-quoted string, print a closing single quote;
                        current_str = current_str.substring(0,i) + "&rsquo;" + current_str.substring(i+1,current_str.length);
                        open_single = false;
                    }
                }
            } else
            if (current_char == "\"") {
                if (!open_double) {
                    // if there is no open double-quoted string, print an opening double quote;
                    current_str = current_str.substring(0,i) + "&ldquo;" + current_str.substring(i+1,current_str.length);
                    open_double = true;
                } else {
                    // if there IS an open double-quoted string, print an opening double quote;
                    current_str = current_str.substring(0,i) + "&rdquo;" + current_str.substring(i+1,current_str.length);
                    open_double = false;
                }
            } else
            // if there a minus sign is found;
            if (current_char == "\-") {
                // check if the user entered three minus signs, i.e., and EM dash;
                if (current_str.substr(i-1,1) == "\-" && current_str.substr(i-2,1) == "\-") {
                    current_str = current_str.substring(0,i-2) + "&#8202;&mdash;&#8202;" + current_str.substring(i+1,current_str.length);
                } else
                // check if the user entered two minus signs, i.e.m an EN dash;
                if (current_str.substr(i-1,1) == "\-" && current_str.substr(i-2,1) != "\-" && current_str.substr(i+1,1) != "\-") {
                    current_str = current_str.substring(0,i-1) + "&#8202;&ndash;&#8202;" + current_str.substring(i+1,current_str.length);
                } else
                // check if the user likely intended a minus sign;
                if (current_str.substr(i-1,1).match(/[0-9]/) && current_str.substr(i+1,1).match(/[0-9]/)) {
                    current_str = current_str.substring(0,i) + "&#8202;&ndash;&#8202;" + current_str.substring(i+1,current_str.length);
                } else
                // check if the user likely intended a hyphen;
                if (current_str.substr(i-1,1).match(/[A-Za-z]/) && current_str.substr(i+1,1).match(/[A-Za-z]/)) {
                    current_str = current_str.substring(0,i) + "&#45;" + current_str.substring(i+1,current_str.length);
                }
            } else
            // if a period is found;
            if (current_char == ".") {
                // check if this is the third of three periods, i.e. an ellipsis;
                if (current_str.substr(i-1,1) == "." && current_str.substr(i-2,1) == ".") {
                    current_str = current_str.substring(0,i-2) + "&hellip;" + current_str.substring(i+1,current_str.length);
                }
            }
            current_char = current_str[i];
        }
        return current_str;
    }

    
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
        var scope = thisObj || window;
        var a = [];
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
            )
        }
    };

    /*
     * the main T8Writer singleton,
     * referenced from outside as T8Writer
     */
    var Writer = {
        current_document: undefined,
        key: undefined,
        user_id: undefined,
        load_observer: new Observer(), // listen for the initial script to be loaded
        auto_save: undefined,
        auto_punctuate: undefined,

        /**
         * this function gets called by bookmarklet
         * @param key random (but unique) md5 hash representing user. passed in by bookmarklet
         */
        init: function(key) {
            Writer.key = key;
            // create container element #T8Writer, so we can easily remove
            // entire plugin from DOM
            var t8_writer = document.createElement("div");
                t8_writer.setAttribute("id","T8Writer");
                document.body.appendChild(t8_writer);

            Writer.load_observer.subscribe(Writer.onLoad);  // notify onLoad() function when show.js loads
            Writer.Utilities.loadScript('http://localhost:3000/writer/show.js');
            Writer.Utilities.loadStyle('http://localhost:3000/stylesheets/writer.css');
        },

        /**
         * callback when initial markup is loaded from show.js (show.html.erb)
         */
        onLoad: function() {
            // apply fadeIn and fadeOut functionality
            T8Writer.Effects.attachEffects();
            // load user's prior documents
            Writer.Modes.selectDocument();
        },

        /**
         *
         * @param id document ID (integer)
         */
        openDocument: function(id) {
            clearInterval(Writer.auto_save);
            // create new instance of Document class
            Writer.current_document = new Document(id);
            // status message
            document.getElementById("T8Writer_Messages").innerHTML = "Loading document&hellip;";
            // load document to be edited, passing in ID
            Writer.Utilities.loadScript('http://localhost:3000/documents/'+id+'/edit.js');
        },

        /**
         *
         * @param title (string), passed in from 'create' command
         */
        createDocument: function(title) {
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
            
            // create new document with title and user's id
            function proceed() {
                // remove #T8Writer (wrapper) element
                document.body.removeChild(document.getElementById("T8Writer"));
                // TODO: Delete all JS variables (e.g. window["T8Writer"])
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
             Writer.auto_punctuate = setInterval(function(){
                document.getElementById("T8Writer_Contents").innerHTML = punctuateStr(document.getElementById("T8Writer_Contents").innerHTML);
                document.getElementById("T8Writer_Contents").focus();
                T8Writer.Utilities.focusAtEnd();
             },3000);
        }
    };

    /**
     * callback for successful document creation
     * @param id (integer) ID of new document
     * @param title (string) the title we gave the new document
     */
    Writer.createDocument.success = function(id,title) {
        // status message
        document.getElementById('T8Writer_Messages').innerHTML = "Successfully created document '"+Writer.createDocument.title+"'";
        // clear status after 3s
        setTimeout(function(){
            if (document.getElementById('T8Writer_Messages'))
                document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
        // create instance of Document class to mirror backend
        Writer.current_document = new Document(id);
        Writer.current_document.id = id;
        Writer.current_document.title = title;
        // load our newly created document
        Writer.openDocument(Writer.current_document.id);
    };

    /**
     * callback for failed document creation
     * @param errs Array? error message passed from Rails' unsuccessful creation
     * TODO: logging!
     */
    Writer.createDocument.errors = function(errs) {
        // status message
        document.getElementById('T8Writer_Messages').innerHTML = "The following errors occurred while attempting to create " + Writer.createDocument.title + ": "+errs+".";
        // clear status after 3s
        setTimeout(function(){
            if (document.getElementById('T8Writer_Messages'))
                document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
    };


    /*
     * Utility functions
     */
    Writer.Utilities = {
        /**
         *
         * @param sUrl = (string) url of JS file to load
         */
        loadScript: function(sUrl) {
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
                var command = document.getElementById("T8Writer_CommandPrompt").value;
                for (var i in Writer.Modes.enterCommand.commands) {
                    if (command.indexOf(i) != -1) {
                        document.getElementById("T8Writer_Contents").removeChild(
                                document.getElementById("T8Writer_CommandPrompt")
                        );
                        Writer.Modes.enterCommand.commands[i](command);
                        Writer.Modes.write();
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
            if (obj.removeEventListener)
                obj.removeEventListener( type, fn, false );
            else if (obj.detachEvent)
            {
                obj.detachEvent( "on"+type, obj[type+fn] );
                obj[type+fn] = null;
                obj["e"+type+fn] = null;
            }
        },

        focusAtEnd: function() {
            setTimeout(function(){
                document.getElementById("T8Writer_Contents").focus();
                var txt_node, selection, range;
                // TODO: we need to make sure this is a text node.
                txt_node = document.getElementById("T8Writer_Contents").childNodes[0];
                selection = window.getSelection();
                range = document.createRange();
                range.selectNode(txt_node);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            },10);
        }
    };

    /*
     * defines modes of operation for T8Writer
     */
    Writer.Modes = {
        write: function(){
            // more will come, but for now fadeOut is attached earlier.
            
            // listen for command mode
            Writer.Utilities.captureKeyCombo();
        },

        selectDocument: function(){
            // open list of user's documents.
            // to call this selectDocument MODE is maybe a little artificial
            Writer.Utilities.loadScript('http://localhost:3000/user_documents.js?key='+Writer.key);
        },

        enterCommand: function() {
            // create command prompt textarea
            document.getElementById("T8Writer_Contents").innerHTML += "<textarea id='T8Writer_CommandPrompt'></textarea>";
            document.getElementById("T8Writer_CommandPrompt").focus();
            
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
            // title = everything after "create "
            var title = command.substring(command.indexOf("create")+7,command.length);
            Writer.createDocument(title);
        },
        "exit": function(){ Writer.exit(); },
        "revert": function(){ Writer.current_document.revert(); },
        "open": function(){}
        
    };
    Writer.Effects = {
        attachEffects: function() {    
            document.getElementById("T8Writer_Contents").onblur = function(){
                Writer.Effects.fadeInExtras(1500);
            };
            document.getElementById("T8Writer_Contents").onfocus = function(e){
                Writer.Effects.fadeOutExtras(3000);
                Writer.Modes.write();
            };
        },

        fadeInExtras: function(duration) {
            // array of elements to fade in
            var extras = [
                document.getElementById("T8Writer_Title"),
                document.getElementById("T8Writer_Documents"),
                document.getElementById("T8Writer_Messages")
            ],
            end_opacity = 1, // we finish at fully opaque
            interval,
            j;
            // add .5% opacity 20x (every 1/20th of supplied duration)
            interval = setInterval(function(){
                if (parseFloat(extras[0].style.opacity) == end_opacity) {
                    clearInterval(interval);
                    return;
                }
                for (j = 0; j < extras.length; j++) {
                    extras[j].style.opacity = parseFloat(extras[j].style.opacity) + 0.05;
                }
            },(duration / 20));
        },

        fadeOutExtras: function(duration) {
            // array of elements to fade in
            var extras = [
                document.getElementById("T8Writer_Title"),
                document.getElementById("T8Writer_Documents"),
                document.getElementById("T8Writer_Messages")
            ],
            end_opacity = 0, // we finish at fully transparent
            interval,
            j;
            // subtract .5% opacity 20x (every 1/20th of supplied duration)
            interval = setInterval(function(){
                if (parseFloat(extras[0].style.opacity) == end_opacity) {
                    clearInterval(interval);
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
            // status message
            // TODO: since the Message area is seperate from the Document class
            // I should really handle this with observers
            document.getElementById("T8Writer_Messages").innerHTML = "Saving document&hellip;";
            // get current text
            this.contents = document.getElementById("T8Writer_Contents").innerHTML;
            // if user requested this save explicitly, cache document for later revert
            if (doCache === true) {
                this.cache.contents = this.contents;   
            }
            // tell the server to save it
            Writer.Utilities.loadScript('http://localhost:3000/documents/'+this.id+'/save.js?_method=put&document[title]='+encodeURIComponent(this.title)+'&document[contents]='+encodeURIComponent(this.contents));
        },
        revert: function() {
            // if we have a cached version of this document (we should!), retrieve it
            if (typeof this.cache.contents !== "undefined") {
                // status message
                document.getElementById("T8Writer_Messages").innerHTML = "Reverting to last save point&hellip;";
                // retrieve cached version
                document.getElementById("T8Writer_Contents").innerHTML = this.cache.contents;
                // status message
                document.getElementById("T8Writer_Messages").innerHTML = "Successfully reverted document.";
            } else {
                // status message
                document.getElementById("T8Writer_Messages").innerHTML = "Document has not been changed since last save.";
            }
            // clear status after 3s
            setTimeout(function(){
                if (document.getElementById('T8Writer_Messages'))
                    document.getElementById('T8Writer_Messages').innerHTML = "";
            },3000);
        },
        email: function() {

        }
    };

    /**
     * callback for successful save
     */
    Document.prototype.save.success = function() {
        // status message
        document.getElementById('T8Writer_Messages').innerHTML = T8Writer.current_document.title + ' successfully saved.';
        // clear status after 3s
        setTimeout(function(){
            if (document.getElementById('T8Writer_Messages'))
                document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
        // tell anyone who's listening that document has been saved
        T8Writer.current_document.observer.fire();
    };

    /**
     * callback for failed save attempt
     * @param errs Array? passed by Rails
     */
    Document.prototype.save.errors = function(errs) {
        // status message
        document.getElementById('T8Writer_Messages').innerHTML = "The following errors occurred while attempting to save "+
                T8Writer.current_document.title + ": "+errs+".";
        // clear status message after 3s
        setTimeout(function(){
            document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
    };
    window["T8Writer"] = Writer;
    // really only left in here for debugging purposes
    window["T8Document"] = Document;
})();