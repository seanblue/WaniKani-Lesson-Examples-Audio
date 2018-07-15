// ==UserScript==
// @name          WaniKani Lesson Examples Audio
// @namespace     https://www.wanikani.com
// @description   Allows you to play audio for example vocab during kanji lessons.
// @author        seanblue
// @version       1.0.0
// @include       *://www.wanikani.com/lesson/session*
// @grant         none
// ==/UserScript==

(function($) {$.each(['show'], function(i, ev) { var el = $.fn[ev]; $.fn[ev] = function() { this.trigger(ev); return el.apply(this, arguments); }; }); })(jQuery);
function promise(){var a,b,c=new Promise(function(d,e){a=d;b=e;});c.resolve=a;c.reject=b;return c;}

(function() {
	'use strict';

	if (!wkof) {
		var response = confirm('WaniKani Lesson Examples Audio requires WaniKani Open Framework.\n Click "OK" to be forwarded to installation instructions.');

		if (response) {
			window.location.href = 'https://community.wanikani.com/t/instructions-installing-wanikani-open-framework/28549';
		}

		return;
	}

	wkof.include('ItemData');
	wkof.ready('ItemData').then(initialize);

	var subjectLoadingInitiated = false;
	var subjectsLoadedPromise = promise();
	var subjectToIdMap;

	var config = {
		wk_items: {
			filters: {
				item_type: 'voc'
			}
		}
	};

	function initialize() {
		$('#supplement-kan-related-vocabulary').on('show', function(e) {
			loadSubjects();

			subjectsLoadedPromise.then(function() {
				let listElements = $(e.currentTarget).find('li');

				for (let i = 0; i < listElements.length; i++) {
					setUpAudio($(listElements[i]));
				}
			});
		});
	}

	function loadSubjects() {
		if (!subjectLoadingInitiated) {
			subjectLoadingInitiated = true;
			wkof.ItemData.get_items(config).then(processSubjects);
		}

		return subjectsLoadedPromise;
	}

	function processSubjects(items) {
		subjectToIdMap = items.reduce(function(map, obj) {
			map[obj.data.characters] = obj.id;
			return map;
		}, {});

		subjectsLoadedPromise.resolve();
	}

	function setUpAudio(el) {
		let characters = el.find('span.vocabulary').text();

		let audioButtonElem = getAudioButtonElement().appendTo(el);
		let audioElem = getAudioElement(characters);

		setUpAudioEvents(audioButtonElem, audioElem);
	}

	function getAudioButtonElement() {
		return $('<button type="button" title="Play pronunciation audio" class="audio-btn audio-idle"></button>');
	}

	function getAudioElement(characters) {
		let audioElem = $('<audio></audio>');

		let audioUrl = getAudioUrl(characters);
		$('<source></source>', {
			src: audioUrl,
			type: 'audio/mpeg'
		}).appendTo(audioElem);

		return audioElem;
	}

	function getAudioUrl(characters) {
		return `https://cdn.wanikani.com/subjects/audio/${subjectToIdMap[characters]}-${encodeURIComponent(characters)}.mp3`;
	}

	function setUpAudioEvents(audioButtonElem, audioElem) {
		audioElem[0].addEventListener('play', function () {
			audioButtonElem.removeClass('audio-idle').addClass('audio-play');
		});

		audioElem[0].addEventListener('ended', function () {
			audioButtonElem.removeClass('audio-play').addClass('audio-idle');
		});

		audioButtonElem.on('click', function() {
			audioElem[0].play();
		});

	}
})();