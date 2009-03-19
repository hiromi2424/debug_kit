/* SVN FILE: $Id$ */
/**
 * Debug Toolbar Javascript.
 *
 * Creates the DEBUGKIT namespace and provides methods for extending 
 * and enhancing the Html toolbar.  Includes library agnostic Event, Element,
 * Cookie and Request wrappers.
 *
 * PHP versions 4 and 5
 *
 * CakePHP :  Rapid Development Framework <http://www.cakephp.org/>
 * Copyright 2006-2008, Cake Software Foundation, Inc.
 *								1785 E. Sahara Avenue, Suite 490-204
 *								Las Vegas, Nevada 89104
 *
 * Licensed under The MIT License
 * Redistributions of files must retain the above copyright notice.
 *
 * @filesource
 * @copyright     Copyright 2006-2008, Cake Software Foundation, Inc.
 * @link          http://www.cakefoundation.org/projects/info/cakephp CakePHP Project
 * @package       debugkit
 * @subpackage    debugkit.vendors.js
 * @license       http://www.opensource.org/licenses/mit-license.php The MIT License
 */
var DEBUGKIT = function () {
	var undef;
	return {
		module : function (newmodule) {
			if (this[newmodule] === undef) {
				this[newmodule] = {};
				return this[newmodule];
			}
			return this[newmodule];
		}
	};
}() ;

DEBUGKIT.module('loader');
DEBUGKIT.loader = function () {
	return {
		//list of methods to run on startup.
		_startup : [],
	
		//register a new method to be run on dom ready.
		register : function (method) {
			this._startup.push(method);
		},

		init : function () {
			for (var i = 0; i < this._startup.length; i++) {
				this._startup[i].init();
			}
		}
	};
}();

//Util module and Element utility class.
DEBUGKIT.module('Util');
DEBUGKIT.Util.Element = {
	hasClass : function (element, className) {
		if (!element.className) {
			return false;
		}
		return element.className.match(new RegExp(className));
	},

	addClass : function (element, className) {
		if (!element.className) {
			element.className = '';
		}
		element.className = element.className.replace(/^(.*)$/, '$1 ' + className);
	},

	removeClass : function (element, className) {
		if (!element.className) {
			return false;
		} 
		element.className = element.className.replace(new RegExp(' ?(' + className +') ?'), '');
	},
	
	swapClass : function (element, removeClass, addClass) {
		if (!element.className) {
			return false;
		}
		element.className = element.className.replace(removeClass, addClass);
	},

	show : function (element) {
		element.style.display = 'block';
	},

	hide : function (element) {
		element.style.display = 'none';
	}
};


//Event binding
DEBUGKIT.Util.Event = {
	addEvent :function(element, type, handler, capture) {
		capture = (capture === undefined) ? false : capture;
		if (element.addEventListener) {
			element.addEventListener(type, handler, capture);
		} else if (element.attachEvent) {
			type = 'on' + type;
			element.attachEvent(type, handler);
		} else {
			type = 'on' + type;
			element[type] = handler;
		}
	},
	
	domready : function(callback) {
		if (document.addEventListener) {
			return document.addEventListener("DOMContentLoaded", callback, false);
		}

		if (document.all && !window.opera) { 
			//Define a "blank" external JavaScript tag
			document.write('<script type="text/javascript" id="domreadywatcher" defer="defer" src="javascript:void(0)"><\/script>');
			var contentloadtag = document.getElementById("domreadywatcher");
			contentloadtag.onreadystatechange = function (){
				if (this.readyState == "complete") {
					callback();
				}
			};
			return;
		}

		if (/Webkit/i.test(navigator.userAgent)){
			var _timer = setInterval(function (){
				if (/loaded|complete/.test(document.readyState)) {
					clearInterval(_timer);
					callback();
				}
			}, 10);
		}
	}
};

//Cookie utility
DEBUGKIT.Util.Cookie = function() {
	var cookieLife = 60;
	return {
		/**
		 * Write to cookie
		 * @param [string] name Name of cookie to write.
		 * @param [mixed] value Value to write to cookie.
		 */
			write : function (name, value) {
				var date = new Date();
				date.setTime(date.getTime() + (cookieLife * 24 * 60 * 60 * 1000));
				var expires = "; expires=" + date.toGMTString();
				document.cookie = name + "=" + value + expires + "; path=/";
				return true;
			},
		/**
		 * Read from the cookie
		 * @param [string] name Name of cookie to read.
		 */
		read : function (name) {
			name = name + '=';
			var cookieJar = document.cookie.split(';');
			for (var i = 0; i < cookieJar.length; i++) {
				var chips = cookieJar[i];
				//trim leading spaces
				while (chips.charAt(0) == ' ') {
					chips = chips.substring(1, chips.length);
				}
				if (chips.indexOf(name) == 0) {
					return chips.substring(name.length, chips.length);
				}
			}
			return false;
		},
		/**
		 * Delete a cookie by name.
		 */
		del : function (name) {
			var date = new Date();
			date.setFullYear(2000,0,1);
			var expires = " ; expires=" + date.toGMTString();
			document.cookie = name + "=" + expires + "; path=/";
		}
	};
}();

/**
 * Object merge takes any number of arguments and glues them together
 * @param [Object] one first object
 * @return object 
 */
DEBUGKIT.Util.merge = function() {
	var out = {};
	for (var i = 0; i < arguments.length; i++) {
		var current = arguments[i];
		for (prop in current) {
			if (current[prop] !== undefined){
				out[prop] = current[prop];
			}
		}
	}
	return out;
};


/**
 * Simple wrapper for XmlHttpRequest objects.
 */
DEBUGKIT.Util.Request = function (options) {
	var _defaults = {
		onComplete : function (){},
		onRequest : function (){},
		onFail : function (){},
		method : 'GET',
		async : true,
		headers : {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		}
	};

	var self = this;
	this.options = DEBUGKIT.Util.merge(_defaults, options);
	this.options.method = this.options.method.toUpperCase();

	var ajax = this.createObj();
	this.transport = ajax;

	//event assignment
	this.onComplete = this.options.onComplete;
	this.onRequest = this.options.onRequest;
	this.onFail = this.options.onFail;

	this.send = function (url, data) {
		if (this.options.method == 'GET' && data) {
			url = url + ( (url.charAt(url.length -1) == '?') ? '&' : '?') + data; //check for ? at the end of the string
			data = null;
		}
		//open connection
		this.transport.open(this.options.method, url, this.options.async);

		//set statechange and pass the active XHR object to it.  From here it handles all status changes.
		this.transport.onreadystatechange = function () {
			self.onReadyStateChange.apply(self, arguments);
		};
		for (var key in this.options.headers) {
			this.transport.setRequestHeader(key, this.options.headers[key]);
		}
		this.onRequest();
		this.transport.send(data);
	};
};

DEBUGKIT.Util.Request.prototype.onReadyStateChange = function (){
	if (this.transport.readyState !== 4) {
		return;
	}
	if (this.transport.status == 200 || this.transport.status > 300 && this.transport.status < 400 ) {
		this.response = { 
			xml: this.transport.responseXML,
			text: this.transport.responseText
		};
		
		if (typeof this.onComplete == 'function') {
			this.onComplete.apply(this, [this, this.response]);
		} else {
			return this.response;
		}
	} else if (this.transport.status > 400) {
		if (typeof this.onFail == 'function') {
			this.onFail.apply(this, []);
		} else {
			console.error('request failed');
		}
	}
};
/**
 * Creates cross-broswer XHR object used for requests
 */
DEBUGKIT.Util.Request.prototype.createObj = function(){
	var request = null;
	try {
		request = new XMLHttpRequest();
	} catch (MS) {
		try {
			request = new ActiveXObject("Msxml2.XMLHTTP");
		} catch (old_MS) {
			try {
				request = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(failure) {
				request = null;
			}
		}
	}
	return request;
};


//Basic toolbar module.
DEBUGKIT.module('toolbar');
DEBUGKIT.toolbar = function () {
	//shortcuts
	var Request = DEBUGKIT.Request,
		Element = DEBUGKIT.Util.Element,
		Cookie = DEBUGKIT.Util.Cookie,
		Event = DEBUGKIT.Util.Event,
		toolbarHidden = false;

	/**
	 * Add neat array functionality.
	 */
	function neatArray (list) {
		if (!list.className.match(/depth-0/)) {
			var item = list.parentNode;
			Element.hide(list);
			Element.addClass(item, 'expandable collapsed');
			Event.addEvent(item, 'click', function (event) {
				var element = this,
					event = event || window.event,
					act = Boolean(item === element),
					hide = Boolean(list.style.display === 'block');
				if (act && hide) {
					Element.hide(list);
					Element.swapClass(item, 'expanded', 'collapsed');
				} else if (act) {
					Element.show(list);
					Element.swapClass(item, 'collapsed', 'expanded');
				}

				if (event.cancelBubble !== undefined) {
					event.cancelBubble = true;
				}
				return false;
			});
		}
	};

	return {
		elements : {},
		panels : {},

		init : function () {
			var i, element, lists, index;
			this.elements.toolbar = document.getElementById('debug-kit-toolbar');

			if (this.elements.toolbar === undefined) {
				throw('Toolbar not found, make sure you loaded it.');
			}
			
			for (i in this.elements.toolbar.childNodes) {
				element = this.elements.toolbar.childNodes[i];
				if (element.nodeName && element.id === 'panel-tabs') {
					this.elements.panel = element;
					break;
				}
			}

			for (i in this.elements.panel.childNodes) {
				element = this.elements.panel.childNodes[i];
				if (Element.hasClass(element, 'panel-tab')) {
					this.addPanel(element);
				}
			}
			lists = document.getElementsByTagName('ul');
			this.makeNeatArray(lists);

			this.deactivatePanel(true);
		},
		/**
		 * Add a panel to the toolbar
		 */
		addPanel : function (tab, callback) {
			if (!tab.nodeName || tab.nodeName.toUpperCase() !== 'LI') {
				throw ('Toolbar not found, make sure you loaded it.');
			}
			var panel = {
				id : false,
				element : tab,
				callback : callback,
				button : undefined,
				content : undefined,
				active : false
			};
			for (var i in tab.childNodes) {
				var element = tab.childNodes[i],
					tag = element.nodeName ? element.nodeName.toUpperCase() : false;
				if (tag === 'A') {
					panel.id = element.hash.replace(/^#/, '');
					panel.button = element;
				} else if (tag === 'DIV') {
					panel.content = element;
				}
			}
			if (!panel.id || !panel.content) {
				return false;
			}

			if (panel.callback !== undefined) {
				Event.addEvent(panel.button, 'click', function(event) {
					event = event || window.event;
					event.preventDefault();
					return panel.callback();
				});
			} else {
				var self = this;
				Event.addEvent(panel.button, 'click', function(event) {
					event = event || window.event;
					event.preventDefault();
					return self.togglePanel(panel.id);
				});
			}
			this.panels[panel.id] = panel;
			return panel.id;
		},

	/**
	 * Toggle a panel
	 */
		togglePanel : function (id) {
			if (this.panels[id] && this.panels[id].active) {
				this.deactivatePanel(true);
			} else {
				this.deactivatePanel(true);
				this.activatePanel(id);
			}
		},

	/**
	 * Make a panel active.
	 */
		activatePanel : function (id, unique) {
			if (this.panels[id] !== undefined && !this.panels[id].active) {
				var panel = this.panels[id];
				if (panel.content !== undefined) {
					Element.show(panel.content);
				}
				Element.addClass(panel.button, 'active');
				panel.active = true;
				return true;
			}
			return false;
		},

	/**
	 * Deactivate a panel.  use true to hide all panels.
	 */
		deactivatePanel : function (id) {
			if (id === true) {
				for (var i in this.panels) {
					this.deactivatePanel(i);
				}
				return true;
			}
			if (this.panels[id] !== undefined) {
				var panel = this.panels[id];
				if (panel.content !== undefined) {
					Element.hide(panel.content);
				}
				Element.removeClass(panel.button, 'active');
				panel.active = false;
				return true;
			}
			return false;
		},

		makeNeatArray : function (lists) {
			var i = 0;
			while (lists[i] !== undefined) {
				var element = lists[i];
				if (Element.hasClass(element, 'neat-array')) {
					neatArray(element);
				}
				++i;
			}
		}
	};
}();
DEBUGKIT.loader.register(DEBUGKIT.toolbar);

//Add events + behaviors for toolbar collapser.
DEBUGKIT.toolbarToggle = function () {
	var toolbar = DEBUGKIT.toolbar,
		Cookie = DEBUGKIT.Util.Cookie,
		Event = DEBUGKIT.Util.Event,
		toolbarHidden = false;

	return {
		init : function () {
			var button = document.getElementById('hide-toolbar'),
				self = this;

			Event.addEvent(button, 'click', function (event) {
				event.preventDefault();
				self.toggleToolbar();
			});

			var toolbarState = Cookie.read('toolbarDisplay');
			if (toolbarState != 'block') {
				toolbarHidden = false;
				this.toggleToolbar();
			}
		},

		toggleToolbar : function () {
			var display = toolbarHidden ? 'block' : 'none';
			for (var i in toolbar.panels) {
				var panel = toolbar.panels[i];
				panel.element.style.display = display;
				Cookie.write('toolbarDisplay', display);
			}
			toolbarHidden = !toolbarHidden;
			return false;
		}
	};
}();
DEBUGKIT.loader.register(DEBUGKIT.toolbarToggle);


DEBUGKIT.module('historyPanel');
DEBUGKIT.historyPanel = function () {
	var toolbar = DEBUGKIT.toolbar,
		Element = DEBUGKIT.Util.Element,
		Cookie = DEBUGKIT.Util.Cookie,
		Event = DEBUGKIT.Util.Event,
		Request = DEBUGKIT.Util.Request,
		historyLinks = [];

	/**
	 * Private methods to handle JSON response and insertion of 
	 * new content.
	 */
	var switchHistory = function (response) {
		try {
			var responseJson = eval( '(' + response.response.text + ')');
		} catch (e) {
			alert('Could not convert JSON response');
			return false;
		}

		for (var i in historyLinks) {
			Element.removeClass(historyLinks[i], 'loading');
		}

		for (var id in toolbar.panels) {
			var panel = toolbar.panels[id];
			if (panel.content === undefined || responseJson[id] === undefined) {
				continue;
			}

			var panelDivs = panel.content.childNodes;
			for (var i in panelDivs) {
				//toggle history element, hide current request one.
				var panelContent = panelDivs[i],
					tag = panelContent.nodeName ? panelContent.nodeName.toUpperCase() : false;
				if (tag === 'DIV' && Element.hasClass(panelContent, 'panel-content-history')) {
					var panelId = panelContent.id.replace('-history', '');
					if (responseJson[panelId]) {
						panelContent.innerHTML = responseJson[panelId];
						var lists = panelContent.getElementsByTagName('UL');
						toolbar.makeNeatArray(lists);
					}
					Element.show(panelContent);
				} else if (tag === 'DIV') {
					Element.hide(panelContent);
				}
			}
		}
	};
	
	/**
	 * Private method to handle restoration to current request.
	 */
	var restoreCurrentState = function () {
		var id, i, panelContent, tag;
		
		for (i in historyLinks) {
			Element.removeClass(historyLinks[i], 'loading');
		}

		for (id in toolbar.panels) {
			panel = toolbar.panels[id];
			if (panel.content === undefined) {
				continue;
			}
			var panelDivs = panel.content.childNodes;
			for (i in panelDivs) {
				panelContent = panelDivs[i];
				tag = panelContent.nodeName ? panelContent.nodeName.toUpperCase() : false;
				if (tag === 'DIV' && Element.hasClass(panelContent, 'panel-content-history')) {
					Element.hide(panelContent);
				} else if (tag === 'DIV') {
					Element.show(panelContent);
				}
			}
		}
	};
	
	function handleHistoryLink (event) {
		event.preventDefault();

		for (i in historyLinks) {
			Element.removeClass(historyLinks[i], 'active');
		}
		Element.addClass(this, 'active loading');
		
		if (this.id === 'history-restore-current') {
			restoreCurrentState();
			return false;
		}

		var remote = new Request({
			onComplete : switchHistory,
			onFail : function () {
				alert('History retrieval failed');
			}
		});
		remote.send(this.href);
	};
	
	return {
		init : function () {
			if (toolbar.panels['history'] === undefined) {
				console.log('bailing on history');
				return;
			}
		
			var anchors = toolbar.panels['history'].content.getElementsByTagName('A');

			for (i in anchors) {
				button = anchors[i];
				if (Element.hasClass(button, 'history-link')) {
					historyLinks.push(button);
				}
			}
			console.log(historyLinks);
			for (i in historyLinks) {
				button = historyLinks[i];
				Event.addEvent(button, 'click', handleHistoryLink);
			}
		}
	};
}();

DEBUGKIT.loader.register(DEBUGKIT.historyPanel);


DEBUGKIT.Util.Event.domready(function () {
	DEBUGKIT.loader.init();
});