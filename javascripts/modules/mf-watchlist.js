(function( M, $ ) {

var w = ( function() {
	var lastToken, nav = M.navigation,
		POST_LOGIN_ACTION_KEY = 'mobile.postaction';

	function toggleWatch( title, token, unwatchflag, callback, errback ) {
		var data = {
			format: 'json', action: 'watch',
			title: title, token: token
		},
			msg = M.message( 'mobile-frontend-watchlist-add', title ),
			popupClass = 'watch-action toast';

		if( unwatchflag ) {
			data.unwatch = true;
			msg = M.message( 'mobile-frontend-watchlist-removed', title );
		} else {
			popupClass += ' watched';
		}

		function report() {
			M.navigation.popup.show( msg, popupClass );
		}

		$.ajax( {
			type: 'post', dataType: 'json',
			url:  M.getApiUrl(),
			data: data
		} ).done( callback ).fail( errback ).
			done( report );
	}

	function createButton( container ) {
		$( container ).find( '.watch-this-article' ).remove();
		return $( '<a class="watch-this-article">' ).appendTo( container )[ 0 ];
	}

	function createWatchListButton( container, title, isWatchedArticle ) {
		var prevent,
			val,
			watchBtn = createButton( container );

		if( isWatchedArticle ) {
			$( watchBtn ).addClass( 'watched' );
		}

		function enable() {
			prevent = false;
			$( watchBtn ).removeClass( 'disabled waiting' );
		}

		function success() {
			if( !$( watchBtn ).hasClass( 'watched' ) ) {
				$( watchBtn ).addClass( 'watched' );
			} else {
				$( watchBtn ).removeClass( 'watched' );
			}
			enable();
		}

		function toggleWatchStatus( unwatch ) {
			toggleWatch( title, lastToken, unwatch, success, enable );
		}

		$( watchBtn ).click( function( ev ) {
			if( prevent ) {
				ev.preventDefault();
			}
			prevent = true;
			$( watchBtn ).addClass( 'disabled waiting' );
			toggleWatchStatus( $( watchBtn ).hasClass( 'watched' ) );
		} );

		// check if user just logged in and if so trigger save to watchlist action
		val = M.settings.getUserSetting( POST_LOGIN_ACTION_KEY );
		if ( val === 'watch' && window.location.search.indexOf( 'article_action=watch' ) > -1 && !isWatchedArticle ) {
			$( watchBtn ).addClass( 'disabled waiting' );
			toggleWatchStatus( false );
			M.settings.saveUserSetting( POST_LOGIN_ACTION_KEY, '' ); // reset it
		}
	}

	function checkWatchStatus( titles, callback ) {
		$.ajax( {
			url:  M.getApiUrl(), dataType: 'json',
			data: {
				action: 'query', format: 'json',
				titles: titles.join( '|' ),
				prop: 'info', inprop: 'watched'
			}
		} ).done( function( data ) {
				var pages = data.query.pages,
					notEmpty = !pages[ '-1' ], statuses = {}, page, i;
				for( i in pages ) {
					if( pages.hasOwnProperty( i ) ) {
						page = pages[ i ];
						statuses[ page.title ] = page.hasOwnProperty( 'watched' );
					}
				}
				if( notEmpty ) {
					callback( statuses );
				}
		} );
	}

	function initWatchListIcon( container, title ) {
		function queueWatchAction() {
			M.settings.saveUserSetting( POST_LOGIN_ACTION_KEY, 'watch' );
		}

		M.getToken( 'watch', function( data ) {
			if( data.tokens && !data.warnings ) { // then user is logged in
				lastToken = data.tokens.watchtoken;
				checkWatchStatus( [ title ], function( status ) {
					createWatchListButton( container, title, status[ title ] );
				} );
			} else {
				$( createButton( container ) ).click( function() {
					var $drawer = nav.showDrawer(), $a,
						href = M.history.getArticleUrl( 'Special:UserLogin' ),
						updateQs = M.history.updateQueryStringParameter;

					$( '<p>' ).html( M.message( 'mobile-frontend-watchlist-cta' ) ).appendTo( $drawer );
					$a = $( '<a> ').text( M.message( 'mobile-frontend-watchlist-cta-button-login' ) ).
						addClass( 'button' ).
						click( queueWatchAction ).appendTo( $drawer );
					href = updateQs( href, 'returnto', M.getConfig( 'title' ) );
					href = updateQs( href, 'returntoquery', 'article_action%3Dwatch' );
					$a.attr( 'href', href );

					// do signup url
					href = updateQs( href, 'type', 'signup' );
					$( '<a>' ).text( M.message( 'mobile-frontend-watchlist-cta-button-signup' ) ).
						attr( 'href', href ).
						addClass( 'signup' ).
						click( queueWatchAction ).appendTo( $drawer );
				} );
				// clear user setting
				M.settings.saveUserSetting( POST_LOGIN_ACTION_KEY, '' );
			}
		} );
	}

	// FIXME: avoid if statement repetition with initWatchListIcon
	function initWatchListIconList( container ) {
		var $items = $( container ).find( 'li' ), titles = [];
		$items.each( function() {
			titles.push( $( this ).attr( 'title' ) );
		} );

		M.getToken( 'watch', function( data ) {
			if( data.tokens && !data.warnings ) {
				lastToken = data.tokens.watchtoken;

				checkWatchStatus( titles, function( status ) {
					$( container ).find( 'li' ).each( function() {
						var title = $( this ).attr( 'title' );
						createWatchListButton( this, title, status[ title ] );
					} );
				} );
			}
		} );
	}

	function upgradeSearch() {
		$( window ).on( 'mw-mf-search-results', function( ev, ul ) {
			initWatchListIconList( ul );
		} );
	}

	function init( container, title ) {
		var pageTitle = M.getConfig( 'title' );
		container = container || M.navigation.getPageMenu();
		title = title || pageTitle;
		$( window ).bind( 'mw-mf-page-loaded', function( ev, article ) {
			initWatchListIcon( container, article.title );
		} );

		upgradeSearch();
	}

	return {
		init: init,
		initWatchListIcon: initWatchListIcon,
		initWatchListIconList: initWatchListIconList
	};
}());

M.registerModule( 'watchlist', w );

}( mw.mobileFrontend, jQuery ));
