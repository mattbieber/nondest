

///-------------------------------------------------------------------------------------------------
/// <summary>helpers</summary>
///-------------------------------------------------------------------------------------------------
var now = new Date();
var msFor2012Jan1 = 1325401200000;

///-------------------------------------------------------------------------------------------------
/// <summary>helpers</summary>
///-------------------------------------------------------------------------------------------------
(function ($) {
    $.fn.enabler = function (val) {
        this.toggleClass('ui-disabled', !val);
        return this;
    };
    $.fn.timeMobi = function (options) {
        options = $.extend({}, $.fn.timeMobi.defaultOptions, options);
        this.mobiscroll(options);
        return this;
    };
    $.fn.minutesMobi = function (options) {
        options = $.extend({}, $.fn.minutesMobi.defaultOptions, options);
        this.mobiscroll(options);
        return this;
    };
    $.fn.getMobiDate = function () {

        var a = this.mobiscroll('getValue');
        var ampm = parseInt(a[2]);
        var h = parseInt(a[0]) + (ampm * 12);
        var m = parseInt(a[1]);
        return new Date().setHours(h, m);
    };
})(jQuery);

$.fn.minutesMobi.defaultOptions = {
    wheels: [{ 'Label 1': { 0: 'None', 15: '15  min', 30: '30  min', 45: '45  min', 60: '60  min'}}],
    width: 80,
    height: '30',
    showLabel: false,
    theme: 'android',
    display: 'inline',
    mode: 'scroller',
    orgval: null
};
$.fn.timeMobi.defaultOptions = {
    useDefaultDate: false,
    preset: 'time',
    height: '30',
    showLabel: false,
    theme: 'android',
    display: 'inline',
    mode: 'scroller',
    stepMinute: 15,
    orgval: null

};

var $document = $(document);
var $jqmPages = $('div:jqmData(role="page")');
/**
@method formatAMPM
*/
Date.prototype.formatAMPM = function () {
    var hours = this.getHours();
    var minutes = this.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
};

Date.prototype.zoneless = function () {
    this.setMinutes(this.getMinutes() + this.getTimezoneOffset());

    return SafeDate(this);
};
/**
@method format
*/
String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};
String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");

var SafeDate = function (o) {
    var d = new Date(o);

    if (isNaN(Date.parse(d.toString()))) {
        d = new Date(now.getFullYear(), now.getMonth(), now.getDay(), 0, 0, 0);
    }
    return d;
};


var isValidDate = function (o) {
    if (typeof (o) == 'string') {
        var d = new Date(o);
        if (d != 'Invalid Date') {
            return true;
        }
    }

    return false;
};



function logobj(o) {
    var unwrapped = ko.utils.unwrapObservable(o);
    var s = unwrapped.name + '\tisObservable: ' + ko.isObservable(o) + '\tisComputed: ' + ko.isComputed(o) + '\n';
    $.each(unwrapped, function (k, v) {
        s += '\t' + k + '\n\t\tisObservable: ' + ko.isObservable(v) + '\tisComputed: ' + ko.isComputed(v) + '\n\n';
    });
    //console.log(s);
}

/**
@class dateEx
*/
///-------------------------------------------------------------------------------------------------
var dateEx = function (o) { this.init(o); }
$.extend(dateEx.prototype, {
    init: function (o) {
        var d = this;
        d.isViable = isValidDate(0);
        if (d.isViable) {

        }
    },
    isViable: false,
    value: null,
    ticks: -1,
    jsDate: null
});