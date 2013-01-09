<?php

class SpecialMobileWatchlist extends SpecialWatchlist {
	function execute( $par ) {
		$user = $this->getUser();
		$output = $this->getOutput();
		$view = $this->getRequest()->getVal( 'watchlistview', 'a-z' );
		$recentChangesView = ( $view === 'feed' ) ? true : false;

		$output->setPageTitle( $this->msg( 'watchlist' ) );
		$output->mobileHtmlHeader = $this->getWatchlistHeader();

		if( $user->isAnon() ) {
			// No watchlist for you.
			$output->addHtml( Html::openElement( 'div', array( 'class' => 'content' ) ) );
			parent::execute( $par );
			$output->addHtml( Html::closeElement( 'div' ) );
			return;
		}

		$output->addHtml(
			Html::openElement( 'div',
				array(
					'id' => 'mw-mf-watchlist',
				)
			)
		);

		if ( $recentChangesView ) {
			$this->filter = $this->getRequest()->getVal( 'filter', 'all' );
			$this->showRecentChangesHeader();
			$res = $this->doFeedQuery();
			$this->showFeedResults( $res );
		} else {
			$this->filter = $this->getRequest()->getVal( 'filter', 'articles' );
			$res = $this->doListQuery();
			$this->showListResults( $res );
		}

		$output->addHtml(
			Html::closeElement( 'div' )
		);
	}

	protected function getWatchlistHeader() {
		$cur = $this->getRequest()->getVal( 'watchlistview', 'a-z' );
		$sp = SpecialPage::getTitleFor( 'Watchlist' );
		$attrsList = array(
			'class' => 'button mw-mf-watchlist-view-selector'
		);
		$attrsFeed = array(
			'class' => 'button mw-mf-watchlist-view-selector'
		);
		if ( $cur == 'feed' ) {
			$attrsFeed[ 'class' ] .= ' active';
		} else {
			$attrsList[ 'class' ] .= ' active';
		}

		$html =
			Html::openElement( 'div',
				array(
					'class' => 'mw-mf-watchlist-views header' )
				) .
			Linker::link( $sp,
				wfMessage( 'mobile-frontend-watchlist-a-z' )->text(),
				$attrsList,
				array(
					'watchlistview' => 'a-z'
				)
			) .
			Linker::link( $sp,
				wfMessage( 'mobile-frontend-watchlist-feed' )->text(),
				$attrsFeed,
				array(
					'watchlistview' => 'feed'
				)
			) .
			Html::closeElement( 'div' );
		return $html;
	}

	function showRecentChangesHeader() {
		$filters = array(
			'all' => 'mobile-frontend-watchlist-filter-all',
			'articles' => 'mobile-frontend-watchlist-filter-articles',
			'talk' => 'mobile-frontend-watchlist-filter-talk',
			'other' => 'mobile-frontend-watchlist-filter-other',
		);
		$output = $this->getOutput();

		$output->addHtml(
			Html::openElement( 'ul', array( 'class' => 'mw-mf-watchlist-selector' ) )
		);

		foreach( $filters as $filter => $msg ) {
			$itemAttrs = array();
			if ( $filter === $this->filter ) {
				$itemAttrs['class'] = 'selected';
			}
			$linkAttrs = array(
				'href' => $this->getTitle()->getLocalUrl(
					array(
						'filter' => $filter,
						'watchlistview' => 'feed',
					)
				)
			);
			$output->addHtml(
				Html::openElement( 'li', $itemAttrs ) .
				Html::element( 'a', $linkAttrs, $this->msg( $msg )->plain() ) .
				Html::closeElement( 'li' )
			);
		}

		$output->addHtml(
			Html::closeElement( 'ul' )
		);
	}

	function doFeedQuery() {
		$user = $this->getUser();
		$dbr = wfGetDB( DB_SLAVE, 'watchlist' );

		# Possible where conditions
		$conds = array();

		// snip....

		$tables = array( 'recentchanges', 'watchlist' );
		$fields = array( $dbr->tableName( 'recentchanges' ) . '.*' );
		$join_conds = array(
			'watchlist' => array(
				'INNER JOIN',
				array(
					'wl_user' => $user->getId(),
					'wl_namespace=rc_namespace',
					'wl_title=rc_title'
				),
			),
		);
		$options = array( 'ORDER BY' => 'rc_timestamp DESC' );
		$limitWatchlist = 100; // hack
		if( $limitWatchlist ) {
			$options['LIMIT'] = $limitWatchlist;
		}

		$rollbacker = $user->isAllowed('rollback');
		if ( $rollbacker ) {
			$tables[] = 'page';
			$join_conds['page'] = array('LEFT JOIN','rc_cur_id=page_id');
			if ( $rollbacker ) {
				$fields[] = 'page_latest';
			}
		}

		switch( $this->filter ) {
		case 'all':
			// no-op
			break;
		case 'articles':
			// @fixme content namespaces
			$conds['rc_namespace'] = 0;
			break;
		case 'talk':
			// @fixme associate with content namespaces? or all talks?
			$conds['rc_namespace'] = 1;
			break;
		case 'other':
			// @fixme
			$conds['rc_namespace'] = array(2, 4);
			break;
		}

		ChangeTags::modifyDisplayQuery( $tables, $fields, $conds, $join_conds, $options, '' );
		wfRunHooks('SpecialWatchlistQuery', array(&$conds,&$tables,&$join_conds,&$fields) );

		$res = $dbr->select( $tables, $fields, $conds, __METHOD__, $options, $join_conds );

		return $res;
	}

	function doListQuery() {
		$user = $this->getUser();
		$dbr = wfGetDB( DB_SLAVE, 'watchlist' );

		# Possible where conditions
		$conds = array(
			'wl_user' => $user->getId()
		);
		$tables = array( 'watchlist' );
		$fields = array( $dbr->tableName( 'watchlist' ) . '.*' );
		$options = array( 'ORDER BY' => 'wl_namespace, wl_title' );

		$limitWatchlist = 100; // hack
		if( $limitWatchlist ) {
			$options['LIMIT'] = $limitWatchlist;
		}

		switch( $this->filter ) {
		case 'all':
			break;
		case 'articles':
			$conds['wl_namespace'] = 0;
			break;
		case 'talk':
			$conds['wl_namespace'] = 1;
			break;
		case 'other':
			$conds['wl_namespace'] = array(2, 4);
			break;
		}

		$res = $dbr->select( $tables, $fields, $conds, __METHOD__, $options );

		return $res;
	}

	function showFeedResults( $res ) {
		$this->showResults( $res, true );
	}

	function showListResults( $res ) {
		$this->showResults( $res, false );
	}

	function showResults( $res, $feed ) {
		$empty = $res->numRows() === 0;
		$this->seenTitles = array();

		if ( $feed ) {
			$this->today = $this->day( wfTimestamp() );
			$this->seenDays = array( $this->today => true );
		}

		$output = $this->getOutput();

		if ( $empty ) {
			$msg = $feed ? 'mobile-frontend-watchlist-feed-empty' : 'mobile-frontend-watchlist-a-z-empty';
			$output->addHtml(
				'<p class="content empty">' .
					wfMessage( $msg )->parse() .
				'</p>'
			);
		} else {
			$output->addHtml( '<ul class="mw-mf-watchlist-results">' );

			if ( $feed ) {
				foreach( $res as $row ) {
					$this->showFeedResultRow( $row );
				}
			} else {
				foreach( $res as $row ) {
					$this->showListResultRow( $row );
				}
			}

			$output->addHtml( '</ul>' );
		}
	}

	private function day( $ts ) {
		return $this->getLang()->date( $ts, true );
	}

	function showFeedResultRow( $row ) {
		$output = $this->getOutput();

		$title = Title::makeTitle( $row->rc_namespace, $row->rc_title );
		$titleText = $title->getPrefixedText();
		if ( array_key_exists( $titleText, $this->seenTitles ) ) {
			// todo: skip seen titles and show only the latest?
			// return;
		}
		$this->seenTitles[$titleText] = true;

		$comment = $row->rc_comment;
		$timestamp = $row->rc_timestamp;
		$ts = new MWTimestamp( $row->rc_timestamp );
		$revId = $row->rc_this_oldid;

		if ( $revId ) {
			$diffTitle = Title::makeTitle( NS_SPECIAL, 'MobileDiff/' . $revId ); // @fixme this seems lame
			$diffLink = $diffTitle->getLocalUrl();
		} else {
			// hack -- use full log entry display
			$diffLink = Title::makeTitle( $row->rc_namespace, $row->rc_title )->getLocalUrl();
		}

		if ( $row->rc_user == 0 ) {
			$username = $this->msg( 'mobile-frontend-changeslist-ip' )->plain();
			$usernameClass = 'mw-mf-user mw-mf-anon';
		} else {
			$username = htmlspecialchars( $row->rc_user_text );
			$usernameClass = 'mw-mf-user';
		}

		if ( $comment === '' ) {
			$comment = $this->msg( 'mobile-frontend-changeslist-nocomment' )->plain();
		} else {
			$comment = Linker::formatComment( $comment, $title );
			// flatten back to text
			$comment = Sanitizer::stripAllTags( $comment );
		}

		$output->addHtml(
			'<li>' .
			Html::openElement( 'a', array( 'href' => $diffLink ) ) .
			Html::element( 'h2', null, $titleText ).
			Html::element( 'div', array( 'class' => $usernameClass ), $username ).
			Html::element( 'p', array( 'class' => 'mw-mf-comment' ), $comment ) .
			Html::element( 'div', array( 'class' => 'mw-mf-time' ), $ts->getHumanTimestamp() ) .
			Html::closeElement( 'a' ) .
			'</li>'
		);
	}

	function showListResultRow( $row ) {
		$output = $this->getOutput();

		$title = Title::makeTitle( $row->wl_namespace, $row->wl_title );
		$titleText = $title->getPrefixedText();

		$output->addHtml(
			'<li>' .
			Html::openElement( 'a', array( 'href' => $title->getLocalUrl() ) ) .
			Html::element( 'h2', null, $titleText ).
			Html::closeElement( 'a' ) .
			'</li>'
		);
	}

}
