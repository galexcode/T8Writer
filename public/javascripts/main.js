(function(){
    var Writer = {
        current_document: undefined,
        document_id: undefined,
        user_id: undefined,
        init: function(key) {
            var t8_writer = document.createElement("div");
                t8_writer.setAttribute("id","T8Writer");
                document.body.appendChild(t8_writer);
            Writer.Utilities.loadScript('http://localhost:3000/writer/show.js');
            Writer.Utilities.loadStyle('http://localhost:3000/stylesheets/writer.css');
            Writer.Modes.selectDocument(key);
        },

        openDocument: function(id) {
            Writer.document_id = id;
            Writer.current_document = new Document(id);
            document.getElementById("T8Writer_Messages").innerHTML = "Loading document&hellip;";
            Writer.Utilities.loadScript('http://localhost:3000/documents/'+id+'/edit.js');
        },

        exit: function() {
            if (typeof Writer.document_id !== "undefined") {
                Document.save();
            }
            document.body.removeChild(document.getElementById("#T8Writer"));
        }
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
            document.body.appendChild(script);
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
                if (Writer.Modes.enterCommand.commands[command]) {
                    Writer.Modes.enterCommand.commands[command]();
                    document.getElementById("T8Writer_Contents").removeChild(document.getElementById("T8Writer_CommandPrompt"));
                }
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
            Writer.Effects.fadeOutExtras(3000);
            document.getElementById("T8Writer_Contents").onblur = function(){
                Writer.Effects.fadeInExtras(1500);
                document.getElementById("T8Writer_Contents").onfocus = function(){
                    Writer.Modes.write();
                }
            };

            // listen for command mode
            Writer.Utilities.captureKeyCombo();
        },

        selectDocument: function(key){
            Writer.Utilities.loadScript('http://localhost:3000/user_documents.js?key='+key);
        },

        enterCommand: function() {
            document.getElementById("T8Writer_Contents").innerHTML += "<textarea id='T8Writer_CommandPrompt'></textarea>";
            document.getElementById("T8Writer_CommandPrompt").focus();
            Writer.Utilities.addEvent(document,"keypress",Writer.Utilities.listenForEnter);
        }
    };
    Writer.Modes.enterCommand.commands = {
        "save": function(){ Writer.current_document.save(); },
        "create": function(){},
        "exit": function(){},
        "revert": function(){}
        
    };
    Writer.Effects = {
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
            document.getElementById('T8Writer_Messages').innerHTML = "";
        },3000);
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