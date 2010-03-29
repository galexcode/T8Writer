(function(){
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


    var Writer = {
        current_document: undefined,
        document_id: undefined,
        key: undefined,
        user_id: undefined,
        load_observer: new Observer(),
        init: function(key) {
            Writer.key = key;

            var t8_writer = document.createElement("div");
                t8_writer.setAttribute("id","T8Writer");
                document.body.appendChild(t8_writer);
            Writer.load_observer.subscribe(Writer.onLoad);
            Writer.Utilities.loadScript('http://localhost:3000/writer/show.js');
            Writer.Utilities.loadStyle('http://localhost:3000/stylesheets/writer.css');
        },
        onLoad: function() {            
            Writer.Modes.selectDocument();
        },

        openDocument: function(id) {
            Writer.document_id = id;
            Writer.current_document = new Document(id);
            document.getElementById("T8Writer_Messages").innerHTML = "Loading document&hellip;";
            Writer.Utilities.loadScript('http://localhost:3000/documents/'+id+'/edit.js');
        },

        createDocument: function(title) {
            function proceed() {
                Writer.Utilities.loadScript('http://localhost:3000/documents/new.js?user_id='+Writer.user_id+"&title="+title);    
            }
            this.title = title || "untitled";
            if (typeof Writer.document_id !== "undefined") {
                Writer.current_document.observer.subscribe(proceed);
                Writer.current_document.save();
            } else {
                proceed();
            }
        },

        exit: function() {
            function proceed() {
                document.body.removeChild(document.getElementById("T8Writer"));
            }
            if (typeof Writer.document_id !== "undefined") {
                Writer.current_document.observer.subscribe(proceed);
                Writer.current_document.save();
            } else {
                proceed();
            }                         
        }
    };
    Writer.createDocument.success = function(id) {
        document.getElementById('T8Writer_Messages').innerHTML = "Successfully created document '"+Writer.createDocument.title+"'";
        setTimeout(function(){
            if (document.getElementById('T8Writer_Messages'))
                document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
        Writer.current_document = new Document(id);
        Writer.current_document.id = id;
        Writer.current_document.title = Writer.createDocument.title;
        Writer.openDocument(Writer.current_document.id);
        Writer.current_document.save();
    };
    Writer.createDocument.errors = function(errs) {
        document.getElementById('T8Writer_Messages').innerHTML = "The following errors occurred while attempting to create " + Writer.createDocument.title + ": "+errs+".";
        setTimeout(function(){
            document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
    };

    Writer.Utilities = {
        /**
         *
         * @param sUrl = string, url
         */
        loadScript: function(sUrl) {
            var script = document.createElement("script");
                script.setAttribute("type","text/javascript");
                script.setAttribute("src",sUrl);
            document.getElementById("T8Writer").appendChild(script);
            //document.body.removeChild(document.body.childNodes[document.body.childNodes.length-1]);
        },

        loadStyle: function(lHref) {
            var link = document.createElement("link");
                link.setAttribute("type","text/css");
                link.setAttribute("rel","stylesheet");
                link.setAttribute("href",lHref);
            document.body.appendChild(link);
        },

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

        listenForPeriod: function(e) {
            var evt = e || window.event;
            if(evt.keyCode == 460 || evt.charCode == 46) {
                Writer.Utilities.removeEvent(document,"keypress",Writer.Utilities.listenForPeriod);
                Writer.Modes.enterCommand();
            }
        },

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
        }
    };
    Writer.Modes = {
        write: function(){            
            // listen for command mode
            Writer.Utilities.captureKeyCombo();
        },

        selectDocument: function(){
            Writer.Utilities.loadScript('http://localhost:3000/user_documents.js?key='+Writer.key);
        },

        enterCommand: function() {
            document.getElementById("T8Writer_Contents").innerHTML += "<textarea id='T8Writer_CommandPrompt'></textarea>";
            document.getElementById("T8Writer_CommandPrompt").focus();
            Writer.Utilities.addEvent(document,"keypress",Writer.Utilities.listenForEnter);
            return false;
        }
    };
    Writer.Modes.enterCommand.commands = {
        "save": function(){ Writer.current_document.save(); },
        "create": function(command){
            var title = command.substring(command.indexOf("create")+7,command.length);
            Writer.createDocument(title);
        },
        "exit": function(){ Writer.exit(); },
        "revert": function(){},
        "open": function(){}
        
    };
    Writer.Effects = {
        attachEffects: function() {    
            document.getElementById("T8Writer_Contents").onblur = function(){
                Writer.Effects.fadeInExtras(1500);
            };
            document.getElementById("T8Writer_Contents").onfocus = function(){
                Writer.Effects.fadeOutExtras(3000);
                Writer.Modes.write();
            };
        },

        fadeInExtras: function(duration) {
            var extras = [
                document.getElementById("T8Writer_Title"),
                document.getElementById("T8Writer_Documents"),
                document.getElementById("T8Writer_Messages")
            ],
            end_opacity = 1,
            interval,
            j;
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
            var extras = [
                document.getElementById("T8Writer_Title"),
                document.getElementById("T8Writer_Documents"),
                document.getElementById("T8Writer_Messages")
            ],
            end_opacity = 0,
            interval,
            j;
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

    var Document = function(id) {
        this.title = undefined;
        this.contents = undefined;
        this.id = id;
        this.observer = new Observer();
    };
    Document.prototype = {
        save: function() {
            document.getElementById("T8Writer_Messages").innerHTML = "Saving document&hellip;";
            this.contents = document.getElementById("T8Writer_Contents").innerHTML;
            Writer.Utilities.loadScript('http://localhost:3000/documents/'+this.id+'/save.js?_method=put&document[title]='+encodeURIComponent(this.title)+'&document[contents]='+encodeURIComponent(this.contents));
        },
        revert: function() {

        },
        email: function() {

        }
    };
    Document.prototype.save.success = function() {
        document.getElementById('T8Writer_Messages').innerHTML = T8Writer.current_document.title + ' successfully saved.';
        setTimeout(function(){
            if (document.getElementById('T8Writer_Messages'))
                document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
        T8Writer.current_document.observer.fire();
    };
    Document.prototype.save.errors = function(errs) {
        document.getElementById('T8Writer_Messages').innerHTML = "The following errors occurred while attempting to save "+
                T8Writer.current_document.title + ": "+errs+".";
        setTimeout(function(){
            document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
    };
    window["T8Writer"] = Writer;
    window["T8Document"] = Document;
})();