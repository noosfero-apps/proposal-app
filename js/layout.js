/*jslint nomen: true, plusplus: true, todo: true, white: true, browser: true, indent: 2 */

(function($) {
  'use strict';

  $(document).ready(function() {

    /* Broken after last updates on HTML - needs to be fixed
    // Tabs behavior

    $('nav a').click(function() {
      var $that = $(this);
      $('nav a#active').attr('id', '');
      $that.attr('id', 'active');

      $($that.attr('href')).fadeIn();

      if (isMobile()) {
        $('#content').fadeOut();
      }
      else {
        $('#content').fadeIn();
      }
      $('body').removeClass('mobile');
    });

    // Responsiveness

    var isMobile = function() {
      return ($(window).width() < 500);
    };

    var responsiveness = function() {
      if (isMobile()) {
        $('#subjects').hide();
        $('nav a#active').attr('id', '');
        $('body').addClass('mobile');
      }
      else {
        $('nav a').first().click();
        $('body').removeClass('mobile');
      }
    };

    $(window).load(responsiveness);
    $(window).resize(responsiveness);
    */

    var adjust = function() {

      // Adjust header image size

      var bgsz = '100%';
      if ($(window).width() > 768) {
        bgsz = '768px 147px';
      }
      $('#content').css('background-size', bgsz);
    
      // Calculate inner subject width and position of expanded subject

      var $c  = $('.proposal-category'),
          $i  = $('.proposal-category-items'),
          w   = $c.width() * $c.length - 20,
          pos = $c.length;
      if (w > $(window).width()) {
        console.log('More than one line of items');
        w = '100%';
        pos = $(window).width() / $c.width();
      }
      $i.width(w);
      $i.each(function() {
        var $that = $(this);
        $('#proposal-categories-container').append($that);
      });

    };

    $(window).resize(adjust);
    $(window).load(adjust);
  });
}(jQuery));
