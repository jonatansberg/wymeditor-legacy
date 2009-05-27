/*
 * WYMeditor : what you see is What You Mean web-based editor
 * Copyright (c) 2005 - 2009 Jean-Francois Hovinne, http://www.wymeditor.org/
 * Dual licensed under the MIT (MIT-license.txt)
 * and GPL (GPL-license.txt) licenses.
 *
 * For further information visit:
 *        http://www.wymeditor.org/
 *
 * File Name:
 *        jquery.wymeditor.explorer.js
 *        MSIE specific class and functions.
 *        See the documentation for more info.
 *
 * File Authors:
 *        Jean-Francois Hovinne (jf.hovinne a-t wymeditor dotorg)
 *        Bermi Ferrer (wymeditor a-t bermi dotorg)
 *        Frédéric Palluel-Lafleur (fpalluel a-t gmail dotcom)
 *        Jonatan Lundin (jonatan.lundin _at_ gmail.com)
 */

WYMeditor.WymClassExplorer = function(wym) {

    this._wym = wym;
    this._class = "className";
    this._newLine = "\r\n";

};

WYMeditor.WymClassExplorer.prototype.initIframe = function(iframe) {

    //This function is executed twice, though it is called once!
    //But MSIE needs that, otherwise designMode won't work.
    //Weird.
    
    this._iframe = iframe;
    this._doc = iframe.contentWindow.document;
    
    //add css rules from options
    var styles = this._doc.styleSheets[0];
    var aCss = eval(this._options.editorStyles);

    this.addCssRules(this._doc, aCss);

    this._doc.title = this._wym._index;

    //set the text direction
    jQuery('html', this._doc).attr('dir', this._options.direction);
    
    //init html value
    jQuery(this._doc.body).html(this._wym._html);
    
    //handle events
    var wym = this;
    
    this._doc.body.onfocus = function()
      {wym._doc.designMode = "on"; wym._doc = iframe.contentWindow.document;};
    this._doc.onbeforedeactivate = function() {wym.saveCaret();};
    this._doc.onkeyup = function() {
      wym.saveCaret();
      wym.keyup();
    };
    this._doc.onclick = function() {wym.saveCaret();};
    
    this._doc.body.onbeforepaste = function() {
      wym._iframe.contentWindow.event.returnValue = false;
    };
    
    this._doc.body.onpaste = function() {
      wym._iframe.contentWindow.event.returnValue = false;
      wym.paste(window.clipboardData.getData("Text"));
    };
    
    //callback can't be executed twice, so we check
    if(this._initialized) {
      
      //pre-bind functions
      if(jQuery.isFunction(this._options.preBind)) this._options.preBind(this);
      
      //bind external events
      this._wym.bindEvents();
      
      //post-init functions
      if(jQuery.isFunction(this._options.postInit)) this._options.postInit(this);
      
      //add event listeners to doc elements, e.g. images
      this.listen();
    }
    
    this._initialized = true;
    
    //init designMode
    this._doc.designMode="on";
    try{
        // (bermi's note) noticed when running unit tests on IE6
        // Is this really needed, it trigger an unexisting property on IE6
        this._doc = iframe.contentWindow.document; 
    }catch(e){}
};

WYMeditor.WymClassExplorer.prototype._exec = function(cmd,param) {

    switch(cmd) {
    
    case WYMeditor.INDENT: case WYMeditor.OUTDENT:
    
        var container = this.findUp(this.container(), WYMeditor.LI);
        if(container) {
            var ancestor = container.parentNode.parentNode;
            if(container.parentNode.childNodes.length>1
              || ancestor.tagName.toLowerCase() == WYMeditor.OL
              || ancestor.tagName.toLowerCase() == WYMeditor.UL)
              this._doc.execCommand(cmd);
        }
    break;
    default:
        if(param) this._doc.execCommand(cmd,false,param);
        else this._doc.execCommand(cmd);
    break;
	}
    
    this.listen();
};

WYMeditor.WymClassExplorer.prototype.selected = function() {

    var caretPos = this._iframe.contentWindow.document.caretPos;
        if(caretPos!=null) {
            if(caretPos.parentElement!=undefined)
              return(caretPos.parentElement());
        }
};

WYMeditor.WymClassExplorer.prototype.saveCaret = function() {

    this._doc.caretPos = this._doc.selection.createRange();
};

WYMeditor.WymClassExplorer.prototype.addCssRule = function(styles, oCss) {

    styles.addRule(oCss.name, oCss.css);
};

WYMeditor.WymClassExplorer.prototype.insert = function(html) {

    // Get the current selection
    var range = this._doc.selection.createRange();

    // Check if the current selection is inside the editor
    if ( jQuery(range.parentElement()).parents( this._options.iframeBodySelector ).is('*') ) {
        try {
            // Overwrite selection with provided html
            range.pasteHTML(html);
        } catch (e) { }
    } else {
        // Fall back to the internal paste function if there's no selection
        this.paste(html);
    }
};

WYMeditor.WymClassExplorer.prototype.wrap = function(left, right) {

    // Get the current selection
    var range = this._doc.selection.createRange();

    // Check if the current selection is inside the editor
    if ( jQuery(range.parentElement()).parents( this._options.iframeBodySelector ).is('*') ) {
        try {
            // Overwrite selection with provided html
            range.pasteHTML(left + range.text + right);
        } catch (e) { }
    }
};

WYMeditor.WymClassExplorer.prototype.unwrap = function() {

    // Get the current selection
    var range = this._doc.selection.createRange();

    // Check if the current selection is inside the editor
    if ( jQuery(range.parentElement()).parents( this._options.iframeBodySelector ).is('*') ) {
        try {
            // Unwrap selection
            var text = range.text;
            this._exec( 'Cut' );
            range.pasteHTML( text );
        } catch (e) { }
    }
};

//keyup handler
WYMeditor.WymClassExplorer.prototype.keyup = function() {
  this._selected_image = null;
};

WYMeditor.WymClassExplorer.prototype.setFocusToNode = function(node) {
    var range = this._doc.selection.createRange();
    range.moveToElementText(node);
    range.collapse(false);
    range.move('character',-1);
    range.select();
    node.focus();
};

