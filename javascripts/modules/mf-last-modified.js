( function( M, $ ) {

var module = ( function() {
	var units = ['seconds', 'minutes', 'hours', 'days', 'months', 'years'],
		limits = [1, 60, 3600, 86400, 2592000, 31536000];

	function timeAgo( timestampDelta ) {
		var i = 0;
		while ( i < limits.length && timestampDelta > limits[i + 1] ) {
			++i;
		}
		return { value: Math.round( timestampDelta / limits[i] ), unit: units[i] };
	}

	function init() {
		var $lastModified = $( '#mw-mf-last-modified' ),
			pageTimestamp = parseInt( $lastModified.data( 'timestamp' ), 10 ),
			currentTimestamp = Math.round( new Date().getTime() / 1000 ),
			delta = timeAgo( currentTimestamp - pageTimestamp ),
			message = mw.msg( 'mobile-frontend-last-modified-' + delta.unit, delta.value );

		$lastModified.text( message );
	}

	return {
		timeAgo: timeAgo,
		init: init
	};
}() );

M.registerModule( 'last-modified', module );

}( mw.mobileFrontend, jQuery ) );
