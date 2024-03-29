document.documentElement.className += ' jsEnabled page-loading';

if ( typeof console === 'undefined' ) {
	console = { log: function() {} };
}
if( typeof mw === 'undefined' ) {
	mw = {};
}

( function() {
var domLoaded;

if ( document.addEventListener ) {
	document.addEventListener( 'DOMContentLoaded', function() {
		domLoaded = true;
		mw.mobileFrontend.init();
	}, false );
}

window.onload = function() {
	if ( !domLoaded ) {
		mw.mobileFrontend.init();
	}
};

// if page hasn't loaded in 7s revert to non-javascript mode
window.setTimeout( function() {
	if ( !domLoaded ) {
		domLoaded = true;
		var className = document.documentElement.className.replace( ' jsEnabled page-loading', '' );
		document.documentElement.className = className;
	}
}, 7000 );

}() );
