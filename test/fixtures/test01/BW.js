


///-------------------------------------------------------------------------------------------------
/**
Base Bulwark Js namespace
@module BW
**/
var BW = (function () {

    var internal = {
        /**
        * base url for api calls
        * @property endpointBase
        * @static
        * @final
        * @type String
        */
        endpointBase: 'http://vgweb.bulwarkpestcontrol.com/BulwarkWebApp/api/1.0/'
    };

    function makeendpoint(api) {
        return internal.endpointBase + api;
    }

    return {
        endpoints: {
            GetMonthlySurvey: 'Ajax/GetMonthlySurvey',
            GetMonthlyTechSurvey: 'Ajax/GetMonthlyTechSurvey',
            PostMonthlyTechSurvey: 'Ajax/PostMonthlyTechSurvey',
            GetCalendarDaysAndExceptions: 'Ajax/GetCalendarDaysAndExceptions',
            GetExceptionInfo: 'Ajax/GetExceptionInfo',
            GetMonthlySurveyDay: 'Ajax/GetMonthlySurveyDay',
            PostMonthlySurveyDay: 'Ajax/PostMonthlySurveyDay',
            GetMonthlyTechSurveyExceptions: 'Ajax/GetMonthlyTechSurveyExceptions',
            PostMonthlyTechSurveyException: 'Ajax/PostMonthlyTechSurveyException',
            CreateMonthlyTechSurveyException: 'Create/CreateMonthlyTechSurveyException',
            PostRecurringException: 'Ajax/PostRecurringException'
        },
        pages: {},
        panels: {},
        dompages: {
            $start: $('#start'),
            $defaultWeek: $('#defaultWeek'),
            $defaultDay: $("#dwDefaultDayPanel"),
            $techCalendar: $('#techCalendar'),
            $techCalendarDay: $('#techCalendarDay'),
            $techCalendarDayException: $('#techCalendarDayException'),
            $recurringBase: $('#recurringBase'),
            $recurringDays: $('#recurringDays'),
            $recurringWeeks: $('#recurringWeeks')
        },
        mobis: {
            $defaultDayMobiStartAt: $('#defaultDayMobiStartAt')
        },
        viewModels: {},
        makeendpoint: makeendpoint
    }

} (BW || {}));

///-------------------------------------------------------------------------------------------------
/// <summary>page routing</summary>
///-------------------------------------------------------------------------------------------------
$document.live('pageinit pagebeforeshow', function (e) {
    var pg = e.target.id;
    var url = 'BW.pages.' + pg + '.' + e.type + '(e)';
    console.log(url);
    eval(url);
    // TODO: try/catch
});

$document.live('panelbeforeclose panelbeforeopen panelcreate', function (e) {
    var pg = e.target.id;

    var url = 'BW.panels.' + pg + '.' + e.type + '(e)';

    eval(url);
    // console.log('panel: ' + pg + ' | ' + e.type);
    // TODO: try/catch
});
$('[data-role=header]').live('taphold', function (e) {
    console.log('taphold');

    $('#debugPopup').popup('open');
});


//#region knockout.js bindings ---------------------------------------------------------------------
ko.bindingHandlers.timestringValue = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor(), allBindings = allBindingsAccessor();
        var d = new Date(ko.utils.unwrapObservable(value));

        $(element).val(d.formatAMPM());
    }
};

/// <summary>
///      timestring: given a JS date or ms ticks,
///     uses data attributes (data-string, data-default) to write out formatted date info
/// </summary>
ko.bindingHandlers.timestring = {

    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {

        var x = ko.utils.unwrapObservable(valueAccessor());
        var $ele = $(element);
        if (x != undefined) {
            
            if (isValidDate(x.toString())) {
                $ele.text($ele.data('string').format(x.formatAMPM()));
            } else {
                $ele.text($ele.data('default'));
            }
        } else {
            $ele.text($ele.data('default'));
         
        }
    }
};

ko.bindingHandlers.numbervalue = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var x = ko.utils.unwrapObservable(valueAccessor());
        var $ele = $(element);
        var val = parseInt(x.toString());

        if (!isNaN(val) && val > 0) {
            $ele.val(val);
            return;
        }
        $ele.val($ele.data('default'));

    }

};

ko.bindingHandlers.numberstring = {

    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var x = ko.utils.unwrapObservable(valueAccessor());
        var $ele = $(element);
        var val = parseInt(x.toString());

        if (!isNaN(val) && val > 0) {
            var s = $ele.data('string').format([val]);
            $ele.text(s);
            return;
        }
        $ele.text($ele.data('default'));

    }
};

ko.bindingHandlers.boolConvert = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {

        var x = ko.utils.unwrapObservable(valueAccessor());
        var v = x ? 'true' : 'false';
        console.log(typeof (v));
        return v;


    }
}

ko.bindingHandlers.jqmRefreshCheckbox = {
    init: function (element, valueAccessor) {
        console.log('initiied');
    },
    update: function (element, valueAccessor) {
        ko.utils.unwrapObservable(valueAccessor()); //just to create a dependency
        console.log('upppp');
        try {
            setTimeout(function () { //To make sure the refresh fires after the DOM is updated

                $(element).checkboxradio('refresh');
            }, 0);
        } catch (e) {
            console.log(e);
        }

    }
};

ko.bindingHandlers.datestring = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor(),
            allBindings = allBindingsAccessor();
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        var pattern = allBindings.datepattern || 'MM/dd/yyyy';
        $(element).text(valueUnwrapped.toString(pattern));
    }
}

ko.bindingHandlers.fliptoggle = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var value = valueAccessor(), allBindings = allBindingsAccessor();
        var valueUnwrapped = ko.utils.unwrapObservable(value);
        var pattern = allBindings.datepattern || 'MM/dd/yyyy';
        $(element).text(valueUnwrapped.toString(pattern));
    }
}
//#endregion

///-------------------------------------------------------------------------------------------------
/// <summary>ui coolness</summary>
///-------------------------------------------------------------------------------------------------
function cal(m) {
    var transEndEventNames = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'msTransition': 'MSTransitionEnd',
        'transition': 'transitionend'
    },


    $wrapper = $('#custom-inner'),
    $calendar = $('#calendar'),
    cal = $calendar.calendario({
        onDayClick: function ($el, $contentEl, dateProperties) {
                
                if ($contentEl.length > 0) {
                    //    showEvents( $contentEl, dateProperties );
                }
            },
            caldata: m,
            displayWeekAbbr: true
        }),
    $month = $('#custom-month').html(cal.getMonthName()),
    $year = $('#custom-year').html(cal.getYear());

    function updateMonthYear() {
        $month.html(cal.getMonthName());
        $year.html(cal.getYear());
    }

}

$document.one("pagebeforechange", function () {

    var animationSpeed = 200;

    function animateCollapsibleSet(elm) {
        elm.one("expand", function () {
            $(this).parent().find(".ui-collapsible-content").not(".ui-collapsible-content-collapsed").trigger("collapse");
            $(this).find(".ui-collapsible-content").slideDown(animationSpeed, function () {
                animateCollapsibleSet($(this).parent().trigger("expand"));
            });

            return false;
        }).one("collapse", function () {
            $(this).find(".ui-collapsible-content").slideUp(animationSpeed, function () {
                $(this).parent().trigger("collapse");
            });

            return false;
        });
    }
    animateCollapsibleSet($("[data-role='collapsible-set'] > [data-role='collapsible']"));
});

(function ($) {
    $.fn.badger = function (badge, callback) {
        var badgerExists = this.find('#Badger').html();

        // Clear the badge
        if (!badge) {
            if (badgerExists)
            { this.find('#Badger').remove(); }
        }
        else {
            // Figuring out badge data
            var oldBadge = this.find('#Badge').text();
            if (badge.charAt(0) == '+') {
                if (isNaN(badge.substr(1)))
                { badge = oldBadge + badge.substr(1); }
                else
                { badge = Math.round(Number(oldBadge) + Number(badge.substr(1))); }
            }
            else if (badge.charAt(0) == '-') {
                if (isNaN(badge.substr(1)))
                { badge = oldBadge - badge.substr(1); }
                else
                { badge = Math.round(Number(oldBadge) - Number(badge.substr(1))); }
            }


            // Don't add duplicates
            if (badgerExists)
            { this.find('#Badge').html(badge); }
            else
            { this.append('<div class="badger-outter" id="Badger"><div class="badger-inner"><p class="badger-badge" id="Badge">' + badge + '</p></div></div>'); }

            // Badger text or number class
            if (isNaN(badge))
            { this.find('#Badge').removeClass('badger-number').addClass('badger-text'); }
            else
            { this.find('#Badge').removeClass('badger-text').addClass('badger-number'); }
            // Send back badge
            if (callback) { callback(badge); }
        }
    };
})(jQuery);

/*! jquery.swipeButton.js - v1.2.1 - 2012-10-06
* http://andymatthews.net/code/swipebutton/
* Copyright (c) 2012 andy matthews; Licensed MIT, GPL */

(function ($) {

    $.fn.swipeDelete = function (o) {

        o = $.extend({}, $.fn.swipeDelete.defaults, o);

        return this.filter('[data-swipeurl]').each(function (i, el) {
            var $e = $(el);
            var $parent = $(el).parent('ul');

            $e.on(o.direction, function (e) {

                // reference the current item
                var $li = $(this);
                var cnt = $('.ui-btn', $li).length;

                // remove all currently displayed buttons
                $('div.ui-btn, .' + o.btnClass, $parent).animate({ width: 'toggle' }, 200, function (e) {
                    $(this).remove();
                });

                // if there's an existing button we simply delete it, then stop
                if (!cnt) {
                    // create button
                    var $swipeBtn = $('<a>' + o.btnLabel + '</a>').attr({
                        'data-role': 'button',
                        'data-mini': true,
                        'data-inline': 'true',
                        'class': (o.btnClass === 'aSwipeBtn') ? o.btnClass : o.btnClass + ' aSwipeBtn',
                        'data-theme': o.btnTheme,
                        'href': $li.data('swipeurl')
                    })
                                    .on('click tap', o.click);

                    // slide insert button into list item
                    $swipeBtn.prependTo($li).button();
                    $li.find('.ui-btn').hide().animate({ width: 'toggle' }, 200);

                    // override row click
                    $('div a:not(' + o.btnClass + ')', $li).on('click.swipe', function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        $(this).unbind('click.swipe');
                        $li.removeClass('ui-btn-active').find('div.ui-btn').remove();
                    });

                }


            });

        });
    };

    $.fn.swipeDelete.defaults = {
        direction: 'swiperight',
        btnLabel: 'Delete',
        btnTheme: 'e',
        btnClass: 'aSwipeBtn',
        click: function (e) {
            e.preventDefault();
            $(this).parents('li').slideUp();
        }
    };

} (jQuery));

