(function(){
    var Writer = {
        document_id: undefined,
        user_id: undefined,
        init: function(key) {
            var t8_writer = document.createElement("div");
                t8_writer.setAttribute("id","#T8Writer");
                document.body.appendChild(t8_writer);
//            Writer.Utilities.loadScript('http://localhost:3000/users/show.js?key='+key);
            Writer.Utilities.loadScript('http://localhost:3000/writer/show.js');
            Writer.Utilities.loadStyle('http://localhost:3000/stylesheets/writer.css');
            Writer.Utilities.loadScript('http://localhost:3000/documents/1.js');
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

        /**
         *
         * @param keyCode = number, key
         */
        captureKeyPress: function(keyCode){

        },

        /**
         *
         * @param keyCodes = array, keyCodes
         */
        captureKeyCombo: function(keyCodes) {

        }
    };
    Writer.Modes = {
        write: function(){

        },

        selectDoc: function(){

        }        
    };

    var Document = function(id) {
        this.title = undefined;
        this.contents = undefined;
        this.id = id;
        this.prototype.save = function() {

        };
        this.prototype.revert = function() {

        };
        this.prototype.email = function() {

        };
    };
    window["T8Writer"] = Writer;
    window["T8Document"] = Document;
    //Writer.init();
})();