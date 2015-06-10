$.fn.equalHeights = function(px) {
  'use strict';

  var currentTallest = 0;
  $(this).each(function(index, item){
    var $item = $(item);
    $item.height('auto'); // force a 'recalc' height
    
    if ($item.height() > currentTallest) { currentTallest = $item.height(); }
    if (!px && Number.prototype.pxToEm) { currentTallest = currentTallest.pxToEm(); } //use ems unless px is specified
    // for ie6, set height since min-height isn't supported
    if (typeof(document.body.style.minHeight) === 'undefined') { $item.css({'height': currentTallest}); }
    $item.css({'height': currentTallest});
  });
  return this;
};

// just in case you need it...
// $.fn.equalWidths = function(px) {
//   $(this).each(function(){
//     var currentWidest = 0;
//     $(this).children().each(function(i){
//         if($(this).width() > currentWidest) { currentWidest = $(this).width(); }
//     });
//     if(!px && Number.prototype.pxToEm) currentWidest = currentWidest.pxToEm(); //use ems unless px is specified
//     // for ie6, set width since min-width isn't supported
//     if (typeof(document.body.style.minHeight) === "undefined") { $(this).children().css({'width': currentWidest}); }
//     $(this).children().css({'min-width': currentWidest}); 
//   });
//   return this;
// };