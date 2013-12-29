/// <reference path="common.js" />
/// <reference path="BW.js" />
/// <reference path="BW.viewModels.js" />
/// <reference path="jquery-1.8.3-vsdoc.js" />
/// <reference path="jquery-ui-1.9.2.js" />
/// <reference path="jquery.mobile-1.2.0.js" />
/// <reference path="modernizr-2.5.3.js" />
/// <reference path="knockout.js" />
/// <reference path="knockout-mapping.js" />
/// <reference path="mobiscroll-2.3.custom.min.js" />


///-------------------------------------------------------------------------------------------------
/**
* Represents a jqm data-role='page' DOM node.  Provides event handlers for the page.
* @class BW.page
* @constructor
* @param data {Object} JSON call result
*/
BW.page = function (data) { this.init(data); }
$.extend(BW.page.prototype, {
    id: null,
    model: null,
    init: function (data) {
        var pg = this;
        pg.id = data.id;
        pg.pageinit = data.pageinit;
        pg.pagebeforeshow = data.pagebeforeshow;
        pg.rebind = data.rebind;
    },

    pageinit: null,
    pagebeforeshow: null,
    rebind: null

});

///-------------------------------------------------------------------------------------------------
/**
* Represents a jqm data-role='panel' DOM node.  Provides event handlers for the panel.
* @class BW.panel
* @constructor
* @param data {Object} JSON call result
*/
BW.panel = function (data) { this.init(data); }
$.extend(BW.panel.prototype, {
    id: null,
    model: null,
    init: function (data) {
        var pg = this;
        pg.id = data.id;
        pg.panelcreate = data.panelcreate;
        pg.panelbeforeopen = data.panelbeforeopen;
        pg.panelbeforeclose = data.panelbeforeclose;
        pg.rebind = data.rebind;
    },
    panelcreate: null,
    panelbeforeopen: null,
    panelbeforeclose: null,
    rebind: null
});



var BW = (function (ns) {
    ///-------------------------------------------------------------------------------------------------
    /**
    * Collection of BW.page objects to handle page load events
    * @class BW.pages
    */
    ns.pages = {

        start: new BW.page({
            id: 'start',
            pageinit: function () { },
            pagebeforeshow: function () { },
            rebind: function () { }
        }),
        ///---------------------------------------
        defaultWeek: new BW.page({
            id: 'defaultWeek',
            model: null,
            ///----------------------- pageinit
            pageinit: function (e) {

                var thispage = this;
                var x = new BW.viewModels.DefaultWeekViewModel(
                    function (result) {
                        this.model = result;
                        ko.applyBindings(this.model, document.getElementById(this.id));
                        this.rebind();
                    } .bind(this)
                );
                $('#dwMobiBreakDuration').minutesMobi({});
                $('#dwMobiBreakStartAt').timeMobi({});
                $('#dwMobiBreakEndAt').timeMobi({});
                $('#dwBreakSwitcher a').bind('click', function (e) {
                    var margin = e.currentTarget.getAttribute('data-marg')
                    $('#dwStartAndEndMobi ul').animate({ marginLeft: margin }, 500, function () { $('#dwBreakSwitcher a').toggleClass('ui-btn-active'); });
                    e.preventDefault();

                });
            },
            ///----------------------- pagebeforeshow
            pagebeforeshow: function (e) {
                if (this.model) { this.rebind(); }
            },

            ///----------------------- rebind
            rebind: function () {

                var wantsbreak = this.model.defaultweek.BreakWanted;
                $('#dwMobiBreakWrap').enabler(wantsbreak());
            
                wantsbreak.subscribe(function (val) {
                    $('#dwMobiBreakWrap').enabler(val);
                });

                var emsflip = $('#dwEmsFlip');
                var sixdayflip = $('#dwSixDayFlip')
                var breakwantedflip = $('#dwBreakFlip');

                emsflip.slider();
                sixdayflip.slider();
                breakwantedflip.slider();

                emsflip[0].selectedIndex = this.model.defaultweek.EarlyMorningServices() ? 1 : 0;
                sixdayflip[0].selectedIndex = this.model.defaultweek.SixDayWeek() ? 1 : 0;
                breakwantedflip[0].selectedIndex = this.model.defaultweek.BreakWanted() ? 1 : 0;

                emsflip.slider("refresh");
                sixdayflip.slider("refresh");
                breakwantedflip.slider('refresh');
            }
        }),
        
        ///---------------------------------------
        techCalendar: new BW.page({
            id: 'techCalendar',
            model: null,
            pageinit: function () {
                var m = new BW.viewModels.TechCalendarViewModel(
                    function (result) {
                        var thisPage = this;

                        thisPage.model = result;
                        ko.applyBindings(thisPage.model, document.getElementById(thisPage.id));

                        $wrapper = $('#custom-inner');
                        $calendar = $('#calendar');
                        cal = $calendar.calendario({

                            caldata: thisPage.model.days(),
                            month: thisPage.model.calendarDate.getUTCMonth() + 1,
                            year: thisPage.model.calendarDate.getUTCFullYear(),
                            displayWeekAbbr: true,

                            onDayClick: function ($el, $contentEl, dateProperties) {
                                if ($contentEl.length > 0) {
                                    thisPage.model.goToDayDetail(parseInt(dateProperties.day));
                                }
                            }
                        });

                        $('#custom-month').text(cal.getMonthName());
                        $('#calendar div[data-count]').filter(function () {
                            var $this = $(this),
                                count = $this.data('count');
                            if (count > 0) {
                                // console.log(count);
                                $this.iosbadge({
                                    theme: 'red',
                                    size: 26,
                                    content: count
                                });
                            }
                            //return $(this).attr("sequenceNumber") >= 1 && $(this).attr("sequenceNumber") <= 10}).css("color", "red");
                        });
                    } .bind(this)
                );
            },
            pagebeforeshow: function (e) { },
            rebind: function () { }
        }),
        ///---------------------------------------
        techCalendarDay: new BW.page({
            id: 'techCalendarDay',
            model: null,
            pageinit: function () {
                this.model = BW.pages.techCalendar.model.dayDetail;
                ko.applyBindings(this.model, document.getElementById(this.id));
               
                $('#cdMobiBreakDuration').minutesMobi({});
                $('#cdMobiBreakStartAt').timeMobi({});
                $('#cdMobiBreakEndAt').timeMobi({});
                $('#cdMobiStartAt').timeMobi({});
                
                $('#cdBreakSwitcher a').bind('click', function (e) {
                    var margin = e.currentTarget.getAttribute('data-marg')
                    $('#cdStartAndEndMobi ul').animate({ marginLeft: margin }, 500, function () { $('#cdBreakSwitcher a').toggleClass('ui-btn-active'); });
                    e.preventDefault();
                });
            },
            pagebeforeshow: function () {
                this.rebind();
            },
            rebind: function () {
                var wantsbreak = this.model.day().BreakWanted;
                $('#cdMobiBreakWrap').enabler(wantsbreak());
           
                wantsbreak.subscribe(function (val) {
                    $('#cdMobiBreakWrap').enabler(val);
                });

                $('#cdWorkingFlip').slider();
                $('#cdBreakFlip').slider();
                $("#cdExceptionsListview").listview({
                    autodividers: true,

                    autodividersSelector: function (li) {
                        var out = $(li).attr('data-exceptionkind');
                        return out;
                    }
                });

                $('#cdExceptionsListview li').swipeDelete({
                    direction: 'swiperight', // standard jquery mobile event name
                    btnLabel: 'Delete',
                    btnTheme: 'b',
                    btnClass: 'aSwipeBtn',
                    click: function (e) {
                        e.preventDefault();
                        var url = $(e.target).attr('href');
                        // $(this).parents('li').remove();
                        //$.post(url, function(data) {
                        //    console.log(data);
                        // });
                    }
                });

            }
        })
    };
    
    /** ----------------------------------------------------------------
    * Collection of BW.panel objects to handle panel load events
    * @class BW.panels
    * ---------------------------------------------------------------- */
        ns.panels = {
        dwBreakPanel: new BW.panel({
            id: 'dwBreakPanel',
            model: null,
            panelcreate: function () { },
            panelbeforeopen: function (e) { },
            panelbeforeclose: function (e) { },
            rebind: function () { }
        }),
        ///---------------------------------------
        dwDefaultDayPanel: new BW.panel({
            id: 'dwDefaultDayPanel',
            model: null,
            panelcreate: function () {
                $('#ddMobiStartAt').timeMobi({});
                $('#ddWorkingFlip').slider();

            },
            panelbeforeopen: function (e) {
                this.rebind();
            },
            panelbeforeclose: function (e) {
                BW.pages.defaultWeek.model.dayDetailClose();
            },
            rebind: function () {
                ko.applyBindings(BW.pages.defaultWeek.model, document.getElementById(this.id));

                var working = BW.pages.defaultWeek.model.dayDetail.day._isWorking;
                $('#ddMobiStartAtWrap').enabler(working());


                working.subscribe(function (val) {
                    $('#ddMobiStartAtWrap').enabler(val);
                });

                var workingflip = $('#ddWorkingFlip');
                workingflip.slider();
                workingflip[0].selectedIndex = working() ? 1 : 0;
                workingflip.slider("refresh");
            }
        }),
        cdBreakPanel: new BW.panel({
            id: 'cdBreakPanel',
            model: null,
            panelcreate: function () { },
            panelbeforeopen: function (e) { 
                this.rebind();
            },
            panelbeforeclose: function (e) { },
            rebind: function () { 
         //       ko.applyBindings(BW.pages.techCalendarDay.model, document.getElementById(this.id));
            }
        }),
        ///---------------------------------------
        cdDayPanel: new BW.panel({
            id: 'cdDayPanel',
            model: null,
            panelcreate: function () {
                $('#cdMobiStartAt').timeMobi({});
                $('#cdWorkingFlip').slider();

            },
            panelbeforeopen: function (e) {
                this.rebind();
            },
            panelbeforeclose: function (e) {
                BW.pages.techCalendarDay.model.dayDetailClose();
            },
            rebind: function () {
                
                var working = BW.pages.techCalendarDay.model.day()._isWorking;
                $('#cdMobiStartAtWrap').enabler(working());
                working.subscribe(function (val) {
                    $('#cdMobiStartAtWrap').enabler(val);
                });

                var workingflip = $('#cdWorkingFlip');
                workingflip.slider();
                workingflip[0].selectedIndex = working() ? 1 : 0;
                workingflip.slider("refresh");
            }
        }),

    };

    return ns;
} (BW || {}));

