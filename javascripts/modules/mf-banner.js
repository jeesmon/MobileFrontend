( function( M ) {
var m = ( function() {
	var $ = M.jQuery;

	function initBanner( banner ) {
		var cookieNameZeroVisibility = banner.getAttribute( 'id' ),
			settings = M.settings,
			saveUserSetting = settings.saveUserSetting,
			getUserSetting = settings.getUserSetting,
			visibility,
			dismissNotification = banner.getElementsByTagName( 'button' )[ 0 ];

		if ( dismissNotification ) {
			visibility = getUserSetting( cookieNameZeroVisibility );

			if ( visibility === 'off' ) {
				banner.style.display = 'none';
			}

			dismissNotification.onclick = function() {
				banner.parentNode.removeChild( banner );
				saveUserSetting( cookieNameZeroVisibility, 'off',
					// FIXME: currently we only resort to cookie saving for the zero rated banners to avoid cache fragmentation
					// (this has side effect that any banners shown on pages which do not support localStorage are not supported)
					'zeroRatedBannerVisibility' === cookieNameZeroVisibility );
			};
		}
	}

	function init() {
		if ( $ ) {
			$( '.mw-mf-banner' ).each( function() {
				if ( $( this ).find( 'button.notify-close' ).length === 0 &&
					!$( this ).hasClass( 'mw-mf-banner-undismissable' ) ) {
					$( '<button class="notify-close">' ).text( '×' ).appendTo( this );
				}
				initBanner( this );
			} );
		}
	}

	return {
		init: init,
		initBanner: initBanner
	};
}());
M.registerModule( 'banner', m );
}( mw.mobileFrontend ));
