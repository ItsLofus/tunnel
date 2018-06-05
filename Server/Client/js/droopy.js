/* global $ */
/**
 * Dropy
 */
var dropy = {
  $dropys: null,
  openClass: 'open',
  selectClass: 'selected',
  init: function() {
    var self = this;

    self.$dropys = $('.dropy');
    self.eventHandler();
  },
  eventHandler: function() {
    var self = this;

    // Opening a dropy
    self.$dropys.find('.dropy__title').click(function() {
      self.$dropys.removeClass(self.openClass);
      $(this).parents('.dropy').addClass(self.openClass);
    });

    // Click on a dropy list
    self.$dropys.find('.dropy__content ul li a').click(function() {
      var $that = $(this);
      var $dropy = $that.parents('.dropy');
      var $input = $dropy.find('input');
      var $title = $(this).parents('.dropy').find('.dropy__title span');

      // Remove selected class
      $dropy.find('.dropy__content a').each(function() {
        $(this).removeClass(self.selectClass);
      });

      // Update selected value
      $title.html($that.html());
      $input.val($that.attr('data-value')).trigger('change');

      // If back to default, remove selected class else addclass on right element
      if ($that.hasClass('dropy__header')) {
        $title.removeClass(self.selectClass);
        $title.html($title.attr('data-title'));
      }
      else {
        $title.addClass(self.selectClass);
        $that.addClass(self.selectClass);
      }

      // Close dropdown
      $dropy.removeClass(self.openClass);
    });

    // Close all dropdown onclick on another element
    $(document).bind('click', function(e) {
      if (!$(e.target).parents().hasClass('dropy')) { self.$dropys.removeClass(self.openClass); }
    });
  }
};

$(function() {
  dropy.init();
});
