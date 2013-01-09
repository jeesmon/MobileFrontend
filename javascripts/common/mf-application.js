/* some polyfill */
if( typeof Array.prototype.forEach === 'undefined' ) {
	Array.prototype.forEach = function( callback ) {
		var i;
		for( i = 0; i < this.length; i++ ) {
			callback( this[ i ], i );
		}
	};
}
mw.mobileFrontend = (function() {
	var u, modules = [],
		scrollY, tokenCache = {},
		moduleNamespace = {},
		$ = typeof jQuery === 'undefined' ? false : jQuery,
		doc = document.documentElement;

	function message( name, arg1 ) {
		var msg = mwMobileFrontendConfig.messages[name] || '';
		if ( arg1 ) {
			msg = msg.replace( '$1', arg1 );
		}
		return msg;
	}

	// TODO: only apply to places that need it
	// http://www.quirksmode.org/blog/archives/2010/12/the_fifth_posit.html
	// https://github.com/Modernizr/Modernizr/issues/167
	function supportsPositionFixed() {
		// TODO: don't use device detection
		var agent = navigator.userAgent,
			support = false,
			supportedAgents = [
			// match anything over Webkit 534
			/AppleWebKit\/(53[4-9]|5[4-9]\d?|[6-9])\d?\d?/,
			// Android 3+
			/Android [3-9]/
		];
		supportedAgents.forEach( function( item ) {
			if( agent.match( item ) ) {
				support = true;
			}
		} );
		return support;
	}

	function registerModule( moduleName, module ) {
		modules.push( moduleName );
		if ( module ) {
			moduleNamespace[ moduleName ] = module;
		} else { // for backwards compatibility
			moduleNamespace[ moduleName ] = mw.mobileFrontend[ moduleName ];
		}
	}

	function getModule( name ) {
		return moduleNamespace[ name ] || mw.mobileFrontend[ name ];
	}

	function initModules() {
		var module, i;
		for( i = 0; i < modules.length; i++ ) {
			module = getModule( modules[ i ] );
			if( module && module.init ) {
				try {
					module.init();
				} catch( e ) {
					// module failed to load for some reason
				}
			}
		}
		u( document.documentElement ).removeClass( 'page-loading' );
		if ( typeof jQuery !== 'undefined' ) {
			$( window ).trigger( 'mw-mf-ready' );
		}
	}

	// Try to scroll and hide URL bar
	scrollY = window.scrollY || 0;
	if( !window.location.hash && scrollY < 10 ) {
		window.scrollTo( 0, 1 );
	}

	function triggerPageReadyHook( pageTitle, sectionData, anchorSection ) {
		if ( $ ) {
			$( window ).trigger( 'mw-mf-page-loaded', [ {
				title: pageTitle, data: sectionData, anchorSection: anchorSection
			} ] );
		}
	}

	// TODO: separate main menu navigation code into separate module
	function init() {
		var mainPage = document.getElementById( 'mainpage' );

		if ( $ && mainPage ) {
			$( window ).trigger( 'mw-mf-homepage-loaded' );
		}

		if( supportsPositionFixed() ) {
			u( doc ).addClass( 'supportsPositionFixed' );
		}

		// when rotating to landscape stop page zooming on ios
		// allow disabling of transitions in android ics 4.0.2
		function fixBrowserBugs() {
			// see http://adactio.com/journal/4470/
			var viewportmeta = document.querySelector && document.querySelector( 'meta[name="viewport"]' ),
				doc = document.documentElement,
				ua = navigator.userAgent,
				android = ua.match( /Android/ );
			if( viewportmeta && ua.match( /iPhone|iPad/i )  ) {
				viewportmeta.content = 'minimum-scale=1.0, maximum-scale=1.0';
				document.addEventListener( 'gesturestart', function() {
					viewportmeta.content = 'minimum-scale=0.25, maximum-scale=1.6';
				}, false );
			} else if( ua.match(/Android 4\.0\.2/) ){
				u( doc ).addClass( 'android4-0-2' );
			}
			if ( android ) {
				u( doc ).addClass( 'android' );
			}
		}
		fixBrowserBugs();

		initModules();
		// FIXME: kill with fire when dynamic sections are in stable
		if ( !getConfig( 'beta' ) ) {
			triggerPageReadyHook( getConfig( 'title' ) );
		}
	}

	u = typeof jQuery !== 'undefined' ? jQuery : jQueryShim;

	function getConfig( name, defaultValue ) {
		if ( mwMobileFrontendConfig.settings[ name ] !== undefined ) {
			return mwMobileFrontendConfig.settings[ name ];
		} else if ( defaultValue !== undefined ) {
			return defaultValue;
		}
		return null;
	}

	function setConfig( name, value ) {
		mwMobileFrontendConfig.settings[ name ] = value;
	}

	function getApiUrl() {
		return getConfig( 'scriptPath', '' ) + '/api.php';
	}

	function isLoggedIn() {
		return getConfig( 'authenticated', false );
	}

	function getOrigin() {
		return window.location.protocol + '//' + window.location.hostname;
	}

	function getToken( tokenType, callback, endpoint ) {
		var data, url;
		if ( !tokenCache[ endpoint ] ) {
			tokenCache[ endpoint ] = {};
		}
		if ( !isLoggedIn() ) {
			callback( {} ); // return no token
		} else if ( tokenCache.hasOwnProperty( tokenType ) ) {
			tokenCache[ endpoint ][ tokenType ].done( callback );
		} else {
			data = {
				format: 'json',
				action: 'tokens',
				type: tokenType
			};
			if ( endpoint ) {
				data.origin = getOrigin();
			}
			url = endpoint || getApiUrl();
			tokenCache[ endpoint ][ tokenType ] = jQuery.ajax( {
				url: url,
				xhrFields: {
					'withCredentials': true
				},
				dataType: 'json',
				data: data
			} ).done( callback );
		}
	}

	function prettyEncodeTitle( title ) {
		return encodeURIComponent( title.replace( / /g, '_' ) ).replace( /%3A/g, ':' ).replace( /%2F/g, '/' );
	}

	return {
		init: init,
		jQuery: typeof jQuery  !== 'undefined' ? jQuery : false,
		getApiUrl: getApiUrl,
		getModule: getModule,
		getOrigin: getOrigin,
		getToken: typeof jQuery  !== 'undefined' ? getToken : false,
		isLoggedIn: isLoggedIn,
		message: message,
		prefix: 'mw-mf-',
		registerModule: registerModule,
		getConfig: getConfig,
		setConfig: setConfig,
		supportsPositionFixed: supportsPositionFixed,
		triggerPageReadyHook: triggerPageReadyHook,
		prettyEncodeTitle: prettyEncodeTitle,
		utils: u
	};

}());
