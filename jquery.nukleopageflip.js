/*
 * Nukleo Pageflip 0.1
 * Copyright (c) 2011 Erik Berman (nukleo.fr)
 * Licensed under the MIT : http://www.opensource.org/licenses/mit-license.php
 *
 * Simple jQuery pageflip plugin
 * Public repo on github : http://github.com/Nukleo/Nukleo-Pageflip
 *
 * For nicer animation transitions this plugin uses George Smith's easing plugin found at http://gsgd.co.uk/sandbox/jquery/easing/
 * but this is optional. If you don't use the easing plugin, you need to set the easing option to "swing" or "linear" which are included in jQuery
 *
 * @TODO
 * - Add direct page access in the head part (dropdown) and make this optional
*/
;(function($){
	$.fn.nukleopageflip = function(options) {

		// default options --------------------------------------------------------------------------------------------------
		var defaults = {
			speed:				500,				// animation speed
			easing:				"easeInOutExpo",	// easing. if easing plugin is being used, if not change to swing or linear
			shadowOn:			true,				// show the centerfold shadow ?
			shadowOpacity:		0.5,				// opacity of the centerfold shadow
			vMargin:			10,					// minimum vertical margin from window (used for scaling)
			hMargin:			80,					// minimum horizontal margin from window (used for scaling)
			showNav:			true,				// show previous and next buttons ?
			navOpacityStart:	0.5,				// previous and next opacity
			navOpacityEnd:		1,					// previous and next hover opacity
			directNav:			true				// direct page navigation below the pageflip
		};

		var opts = $.extend(defaults, options);
		// ------------------------------------------------------------------------------------------------------------------


		// variables --------------------------------------------------------------------------------------------------------
		var $pageflip = $(this);
		var $wrapper = $pageflip.parent();	// conteneur du pageflip
		var $pages = $('li', $pageflip);	// cache les pages
		var $images = $('img', $pages);		// cache les images (peut etre pas utile)
		var countPages = $pages.length;		// number of pages
		var currentPage = 0;				// current page
		var pageWidth;						// largeur d'une page (calculé en fonction des images)
		var pageHeight;						// hauteur d'une page (calculé en fonction des images)
		var urlParam;						// parametre d'url pour aller directement à une page
		// ------------------------------------------------------------------------------------------------------------------


		// Set up some stuff ------------------------------------------------------------------------------------------------
		// Set styles
		$pages.css({'float':'none', 'position':'absolute', 'opacity':0}); // set opacity to 0 so we can still get image size. if hide() was used, sizing would return 0.
		$pageflip.css({'overflow':'hidden'});

		// Build, insert and hide navigation buttons
		var $buttonPrev = $('<a class="previous navbutton" href="#"><<</a>').hide();
		var $buttonNext = $('<a class="next navbutton" href="#">>></a>').hide();

		$wrapper.append($buttonPrev, $buttonNext);

		var prevHeight = $buttonPrev.height();
		var nextHeight = $buttonNext.height();
		var nextWidth = $buttonNext.width(); //To position left

		// Build, insert and hide centerfold shadow
		var $shadow = $('<div id="page-shadow">').css({'height':pageHeight, 'left':pageWidth-50, 'opacity':opts.shadowOpacity}).hide();
		$pageflip.append($shadow);

		// get url param to jump to a page
		var url = document.URL.split('#')[1];
		if(url != undefined){
			urlParam = url;
		}

		// Build and insert direct page nav
		if(opts.directNav){
			var $directNav = $('<div id="pageflip-directnav">').append('<ul>');
			for(i=0; i<countPages; i++){
				$('ul', $directNav).append('<li><a href="#'+(i+1)+'" class="jumpTo">'+(i+1)+'</a></li>');
			}
			$directNav.insertAfter($wrapper);
		}


		// Display total page count in header
		$('.totalpages').text(countPages);

		// hover on navigation buttons
		$('.navbutton').hover(
			function(){$(this).stop().animate({opacity:opts.navOpacityEnd}, opts.speed);},
			function(){$(this).stop().animate({opacity:opts.navOpacityStart}, opts.speed);}
		);
		// ------------------------------------------------------------------------------------------------------------------


		// Navigation with the previous and next buttons
		$('.navbutton').click(function(e){
			// hide stuff before animating
			hideControls();

			// User clicked the previous button
			if($(this).is('.previous')) {
				var prev = getNextPreviousPage('previous'); // get previous page number

				flipPrev(prev);
			}

			// User clicked the next button
			else if($(this).is('.next')) {
				var next = getNextPreviousPage('next'); // get next page number

				flipNext(next);
			}

			e.stopPropagation();
		});


		// Navigation using the controler
		$('.jumpTo').click(function(e){
			var targetPage = parseInt($(this).text()) - 1;
			targetPage = (targetPage % 2 == 0) ? targetPage : targetPage+1;
			if(currentPage == targetPage) {
				e.stopPropagation();
			}
			jumpToPage(targetPage);
			e.stopPropagation();

		});



		// FUNCTIONS ---------------------------------------------------------------------------------------------------------

		// calcule la page suivante ou précédente
		// la page active (currentPage) est toujours celle de droite et paire, commençant à 0
		function getNextPreviousPage(direction){
			if(direction == 'previous') {return (currentPage-2 <= 0) ? 0 : currentPage-2;} // prev active page is -2
			if(direction == 'next') {return (currentPage+2 > countPages) ? 0 : currentPage+2;} // next active page is +2
		};


		// passe à la page suivante
		function flipNext(page){
			// anim page actuelle de droite vers la gauche
			$pages.eq(currentPage)
			.css('z-index', 1)
			.animate({'width':0}, opts.speed, opts.easing, function(){
				$(this).hide().css({'z-index':0, 'width':pageWidth});
			});

			// anim nouvelle page de gauche
			$pages.eq(page-1)
			.css({'width':0, 'left':pageWidth*2, 'z-index':2})
			.show()
			.animate({'width':pageWidth, 'left':0}, opts.speed, opts.easing, function(){
				//$pages.eq(currentPage-3).hide().css('z-index', 0); // cache la page de gauche précédente -> page-3
				$pages.filter(function(i){return i < currentPage+1;}).hide().css('z-index', 0); // cache la page de gauche précédente -> page-3
				showShadow(page);
				showNavButtons(page);
				currentPage = page;
				updatePagination(page);
			});

			// affichage de la nouvelle page de droite si ce n'est pas la dernière
			if(page !== countPages) {
				$pages.eq(page)
				.css({'left':pageWidth, 'z-index':0})
				.show();
			}

		};


		// passe à la page précédente
		function flipPrev(page){
			// fige l'ancienne page de droite
			$pages.eq(page+2).css({'z-index':0}); // a faire dans le callback d'anim

			// anim nouvelle page de droite
			$pages.eq(page)
			.css({'width':0, 'left':0, 'z-index':2})
			.show()
			.animate({'width':pageWidth, 'left':pageWidth}, opts.speed, opts.easing, function(){
				// supprime les anciennes pages de droite
				$pages.filter(function(i){return i > page;}).hide().css('z-index', 0);
				showShadow(page);
				showNavButtons(page);
				currentPage = page;
				updatePagination(page);
			});

			// anim page de gauche
			$pages.eq(currentPage-1)
			.animate({'width':0, 'left':pageWidth}, opts.speed, opts.easing, function(){
				$(this).hide().css({'width':pageWidth, 'left':0});
			});

			// affichage de la nouvelle page de gauche si ce n'est pas la première
			if(page) {
				$pages.eq(page-1).css({'left':0, 'z-index':0}).show();
			}
		};


		// jump to a specific page
		function jumpToPage(page){
			// hide stuff before animating
			hideControls();
			$pages.css({'z-index':0}); // reset z-index on all pages

			if(page > currentPage) {
				flipNext(page);
			}
			else {
				flipPrev(page);
			}
		};


		// affichage des bouton prev/next
		function showNavButtons(page){
			if(opts.showNav){
				$buttonPrev.css({'top':(pageHeight/2)-(prevHeight/2)});
				$buttonNext.css({'top':(pageHeight/2)-(nextHeight/2), 'left' : pageWidth * 2 - (nextWidth) - 2});
				if(page != 0) {$buttonPrev.fadeIn();}
				if(page != countPages) {$buttonNext.fadeIn();}
			}
		};


		// affichage de l'ombre
		function showShadow(page){
			if( page != 0 && page != countPages && opts.shadowOn ) {
				$shadow.css({'height':pageHeight, 'left':pageWidth-50, 'opacity':opts.shadowOpacity}).fadeIn();
			}
		};


		// hide controls while animating
		function hideControls(){
			$buttonPrev.hide();
			$buttonNext.hide();
			$shadow.fadeOut();
		};


		// update pagination
		function updatePagination(page){
			var pagetext;
			if( page != 0 && page != countPages ) {
				pagetext = page + '-' + parseInt(page+1);
			}
			else if(page == 0) {
				pagetext = '1';
			}
			else {
				pagetext = page;
			}

			$('.currentpage').text(pagetext);

			// update pagination below the pageflip
			$('.jumpTo').removeClass('active').eq(page).addClass('active');
			if(page > 0){
				var temp = (page % 2 != 0) ? page : page-1;
				$('.jumpTo').eq(temp).addClass('active');

				//Setting links
				$('.previous').attr('href', '#' + (page - 2));
				$('.next').attr('href', '#' + (page + 2));
			}
		};


		// initialise the plugin
		function initPageflip(){
			// init size variables, based on the pageflip's first image
			pageWidth = $images.eq(0).width();	// largeur d'une page (calculé en fonction des images)
			pageHeight = $images.eq(0).height();
			$pages.hide().css({opacity:1});
			$pageflip.css({'height': pageHeight});
			$wrapper.css({'height': pageHeight, 'width':pageWidth*2});

			// no direct page access in the url OR 1st page OR out of bounds -> go to first page
			if( urlParam == undefined || ( urlParam == 1 || (urlParam < 1 && urlParam > countPages) ) ) {
				$pages.eq(0).css('left', pageWidth).fadeIn(opts.speed);
				showNavButtons(0);
				updatePagination(0);
			}

			// direct page access in the url
			else {
				urlParam = parseInt(urlParam);
				urlParam = (urlParam % 2 != 0) ? urlParam-1 : urlParam;
				jumpToPage(urlParam);
				updatePagination(urlParam);
			}

		};

		// init the init... Need to find a better way to do this
		function init(){
			
			// loop as long as the first image is not fully loaded
			if(!$images[0].complete){
				setTimeout(init, 500); // 200 -> safari bugs on first page load :/
			}
			else {
				$(loader).fadeOut();
				initPageflip();
			}

		};

		// ------------------------------------------------------------------------------------------------------------------

		// overlay indicating the first image load
		var loader = $('<div id="loader">').text('Chargement en cours...').prependTo($pageflip);

		// go!!!
		init();

	};// end of plugin... bye bye :)

})(jQuery);
