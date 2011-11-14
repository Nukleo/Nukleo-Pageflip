/*
 * jQuery nukleo pageflip 0.1
 * Copyright (c) 2011 Erik Berman (nukleo.fr)
 * Licensed under the MIT (MIT-LICENSE.txt)
 *
 * Simple jQuery pageflip plugin
 *
 * For nicer animation transitions this plugin can use George Smith's easing plugin found at http://gsgd.co.uk/sandbox/jquery/easing/
 * but this is optional. If you don't use the easing plugin, you need to set the easing option to "swing" or "linear" which are included in jQuery
 *
 * @TODO
 * - ajouter navigateur de pages sous le pageflip
 * - ajouter zoom sur une page
 * - ajouter accès direct a une page sur le head
 * - rendre completement dynamique le texte en head (page x sur x)
*/
;(function($){
	$.fn.nukleopageflip = function(options) {
		
		// default options
		var defaults = {
			speed:		500,			// animation speed
			easing:		"easeInOutExpo"	// easing. if easing plugin is being used, if not change to swing or linear
		};
		
		var opts = $.extend(defaults, options);

		
		// variables
		var $pageflip = $(this);
		var $wrapper = $pageflip.parent();	// conteneur du pageflip
		var $pages = $('li', $pageflip);	// cache les pages
		var $images = $('img', $pages);		// cache les images (peut etre pas utile)
		var countPages = $pages.length;		// number of pages
		var currentPage = 0;				// current page
		var pageWidth = $images.width();	// largeur d'une page (calculé en fonction des images)
		var pageHeight = $images.height();	// hauteur d'une page (calculé en fonction des images)

		// reset certain styles
		$pageflip.css({'height': pageHeight, 'overflow':'hidden'});
		$wrapper.css({'height': pageHeight, 'width':pageWidth*2});
		$pages.css({'float':'none', 'position':'absolute'});

		// ajoute les boutons de nav
		var $buttonPrev = $('<a class="previous navbutton" href="#"><<</a>').hide();
		var $buttonNext = $('<a class="next navbutton" href="#">>></a>').hide();
		$wrapper.append($buttonPrev, $buttonNext);

		// ombre centrale
		var $shadow = $('<div id="page-shadow">').css({'height':pageHeight, 'left':pageWidth-50, 'opacity':0.5}).hide();
		$pageflip.append($shadow);

		// affichage nombre total de pages
		$('.totalpages').text(countPages);

		// hover sur les boutons de nav
		$('.navbutton').hover(
			function(){
				$(this).stop().animate({opacity:1}, 500);
			},
			function(){
				$(this).stop().animate({opacity:0.3}, 500);
		});

		// click sur les boutons précédent // suivant
		$('.navbutton').click(function(){
			$buttonPrev.hide();
			$buttonNext.hide();
			$shadow.fadeOut();
			if($(this).is('.previous')){
				// calcule quelle est la page précédente et y va
				var prev = getNextPreviousPage('previous');
				flipPrev(prev);
				showNavButtons(prev);
				updatePagination(prev);
			} else {
				// calcule quelle est la page suivante et y va
				var next = getNextPreviousPage('next');
				flipNext(next);
				showNavButtons(next);
				updatePagination(next);
			}
			return false;
		});

		
// ##### TODO ##################################
		// ajoute les boutons d'accès direct
		// hover sur les boutons d'accès direct


// ---- FUNCTIONS --------------------------------------------------------------------------------------------- //

		// calcule la page suivante ou précédente
		function getNextPreviousPage(direction){
			if(direction == 'previous') {
				var newpage = (currentPage-2 <= 0) ? 0 : currentPage-2;
			}

			if(direction == 'next') {
				var newpage = (currentPage+2 > countPages) ? 0 : currentPage+2;
			}

			return newpage;
		};


		// passe à la page suivante
		function flipNext(page){
			// anim page de droite
			$pages.eq(currentPage)
			.css('z-index', 100)
			.animate({'width':0}, opts.speed, opts.easing, function(){
				$(this).hide().css('z-index', 0);
			});

			// anim page de gauche
			$pages.eq(page-1)
			.css({'width':0, 'left':pageWidth*2, 'z-index':101})
			.show()
			.animate({'width':pageWidth, 'left':0}, opts.speed, opts.easing, function(){
				$pages.eq(page-3).hide().css('z-index', 0);
				showShadow(page);
			});

			// affichage de la nouvelle page de droite si ce n'est pas la dernière
			if(page !== countPages) {
				$pages.eq(page)
				.css('left', pageWidth)
				.show();
			}

			currentPage = page;
		};


		// passe à la page précédente
		function flipPrev(page){

			//console.log(page);

			// fige l'ancienne page de droite
			$pages.eq(page+2)
			.css({'z-index':0});

			// anim page de droite
			$pages.eq(page)
			.css({'width':0, 'left':0, 'z-index':102})
			.show()
			.animate({'width':pageWidth, 'left':pageWidth}, opts.speed, opts.easing, function(){
				$pages.eq(page+1).hide();
				showShadow(page);
			});

			// anim page de gauche
			$pages.eq(page+1)
			.animate({'width':0, 'left':pageWidth}, opts.speed, opts.easing);

			// affichage de la nouvelle page de gauche si ce n'est pas la première
			if(page > 0) {
				$pages.eq(page-1)
				.css('left', 0)
				.show();
			}

			currentPage = page;
		};


		// affichage des bouton prev/next
		function showNavButtons(page){
			if(page != 0) {$buttonPrev.fadeIn();}
			if(page != countPages) {$buttonNext.fadeIn();}
		};


		// affichage de l'ombre
		function showShadow(page){
			if( page != 0 && page != countPages ) {
				$shadow.fadeIn();
			}
		};


		// update pagination
		function updatePagination(page){
			var pagetext;
			if( page != 0 && page != countPages ) {
				pagetext = page + '/' + parseInt(page+1);
			}
			else if(page == 0) {
				pagetext = '1';
			}
			else {
				pagetext = page;
			}


			$('.currentpage').text(pagetext);
		};

		// on lance le script
		$pages.hide();
		$pages.eq(0).css('left', pageWidth).fadeIn(opts.speed);
		showNavButtons(0);


	};// end of plugin... bye bye :)
	
})(jQuery);