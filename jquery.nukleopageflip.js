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
			resizeOnLoad:		false,				// downsize on load -> usefull for small screens (think smartphone...)
			vMargin:			10,					// minimum vertical margin from window (used for scaling)
			hMargin:			80,					// minimum horizontal margin from window (used for scaling)
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
		var pageWidth = $images.eq(0).width();	// largeur d'une page (calculé en fonction des images)
		var pageHeight = $images.eq(0).height();	// hauteur d'une page (calculé en fonction des images)
		var urlParam = '';					// parametre d'url pour aller directement à une page
		// ------------------------------------------------------------------------------------------------------------------


		// Set up some stuff ------------------------------------------------------------------------------------------------
		// Set styles
		$pages.css({'float':'none', 'position':'absolute'});

		// Build, insert and hide navigation buttons
		var $buttonPrev = $('<a class="previous navbutton" href="#"><<</a>').hide();
		var $buttonNext = $('<a class="next navbutton" href="#">>></a>').hide();
		var prevHeight = $buttonPrev.height();
		var nextHeight = $buttonNext.height();
		$wrapper.append($buttonPrev, $buttonNext);

		// TODO: cache button sizes

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
				$('ul', $directNav).append('<li><a href="#" class="jumpTo">'+(i+1)+'</a></li>');
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
		$('.navbutton').click(function(){
			// hide stuff before animating
			hideControls();

			// User clicked the previous button
			if($(this).is('.previous')) {
				var prev = getNextPreviousPage('previous'); // get previous page number
				//console.log('curPage: '+currentPage+' | PrevPage: '+prev);
				flipPrev(prev);
			}

			// User clicked the next button
			else if($(this).is('.next')) {
				var next = getNextPreviousPage('next'); // get next page number
				//console.log('curPage: '+currentPage+' | NexPage: '+next);
				flipNext(next);
			}
			return false; // don't let the browser's default click action occur
		});


		// Navigation using the controler
		$('.jumpTo').click(function(){
			var targetPage = parseInt($(this).text()) - 1;
			targetPage = (targetPage % 2 == 0) ? targetPage : targetPage+1;
			if(currentPage == targetPage) {
				return false;
			}
			//console.log('current:'+currentPage+' | Target:'+targetPage)
			jumpToPage(targetPage);
			return false;
		});

		// TODO : rescale on window resize


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
				//console.log('new curPage: '+currentPage);
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
				//console.log('new curPage: '+currentPage);
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
				//console.log('going to next: '+page);
				flipNext(page);
			}
			else {
				//console.log('going to prev: '+page);
				flipPrev(page);
			}
		};


		// affichage des bouton prev/next
		function showNavButtons(page){
			$buttonPrev.css({'top':(pageHeight/2)-(prevHeight/2)});
			$buttonNext.css({'top':(pageHeight/2)-(nextHeight/2)});
			if(page != 0) {$buttonPrev.fadeIn();}
			if(page != countPages) {$buttonNext.fadeIn();}
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
			}
		};


		// Downscaling to fit smaller screens. Only works on pageload for now.
		// Maybe implement on resize and upscaling
		function scalePage(){
			var winHeight = $(window).height()-opts.vMargin;
			var winWidth = $(window).width()-opts.hMargin;
			// get real height of all elements
			var realHeight = $wrapper.outerHeight(true) + $('#pageflip-header').outerHeight(true);
			//var margin = realHeight - $wrapper.outerHeight();
			var scale;

			// pages plus hautes que le viewport
			if(realHeight > winHeight){
				scale = (winHeight) / (realHeight);
				console.log("1 : "+scale);
			}

			if(pageWidth*2 > winWidth){
				scale = (winWidth / pageWidth) / 2;
				console.log("2 : "+scale);
			}

			if(realHeight > winHeight || pageWidth*2 > winWidth){
				pageHeight = pageHeight*scale;
				pageWidth = pageWidth*scale;
				$images.width(pageWidth);
				$images.height(pageHeight);
				console.log("final : "+scale);
			}
		};

		// initialise the plugin
		function initPageflip(){
			$pageflip.css({'height': pageHeight, 'overflow':'hidden'});
			$wrapper.css({'height': pageHeight, 'width':pageWidth*2});

			// no direct page access in the url OR 1st page OR out of bounds -> go to first page
			if( urlParam == '' || ( urlParam == 1 || (urlParam < 1 && urlParam > countPages) ) ) {
				if(opts.resizeOnLoad) {
					scalePage();
					$wrapper.css({'width':pageWidth*2, 'height':pageHeight});
					$pageflip.css({'width':pageWidth*2, 'height':pageHeight});
				}
				$pages.eq(0).css('left', pageWidth).fadeIn(opts.speed);
				showNavButtons(0);
				updatePagination(0);
			}

			// direct page access in the url
			else {
				urlParam = parseInt(urlParam);
				urlParam = (urlParam % 2 != 0) ? urlParam-1 : urlParam;
				if(opts.resizeOnLoad) {
					scalePage();
					$wrapper.css({'width':pageWidth*2, 'height':pageHeight});
					$pageflip.css({'width':pageWidth*2, 'height':pageHeight});
				}
				jumpToPage(urlParam);
				updatePagination(urlParam);
			}
			//console.log('curPage: '+currentPage);
		};

		// init the init...
		function init(){
			$pages.hide();
			if(!$images[0].complete){
				setTimeOut(init(), 200);
			}
			else {
				initPageflip();
			}
		};

		// ------------------------------------------------------------------------------------------------------------------

		// go!!!
		init();

	};// end of plugin... bye bye :)

})(jQuery);