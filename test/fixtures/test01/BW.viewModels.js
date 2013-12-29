
/** ----------------------------------------------------------------
* Client model for Conflict
* @class dayException
* @constructor
* @param dayExceptionObj {Object} Json data
* ---------------------------------------------------------------- */
var dayException = function (dayExceptionObj) { this.init(dayExceptionObj); }
$.extend(dayException.prototype, {

    init: function (dayExceptionObj) {
        var self = this;
        for (key in dayExceptionObj) {
            var isObservable = ko.isObservable(dayExceptionObj[key]);
            self[key] = isObservable ? dayExceptionObj[key] : ko.observable(dayExceptionObj[key]);
        }
    },

    Approved: ko.observable(false),
    CanOverride: ko.observable(false),
    Detail: ko.observable(''),
    EndAt: ko.observable(null),
    ExceptionReason_Id: ko.observable(0),
    ExceptionType_Id: ko.observable(0),
    HolidayData: {
        EndAt: ko.observable(null),
        HolidayOn: ko.observable(null),
        IsOptional: ko.observable(false),
        Name: ko.observable('')
    },
    Holiday_Id: ko.observable(0),
    Id: ko.observable(0),
    ManagerException_Id: ko.observable(0),
    MonthlyTechSurveyDay_Id: ko.observable(0),
    OverrideRecurringException: ko.observable(false),
    RecurringData: {
        EndOn: ko.observable(null),
        EveryDay: ko.observable(false),
        Fifth: ko.observable(false),
        First: ko.observable(false),
        Fourth: ko.observable(false),
        Friday: ko.observable(false),
        Monday: ko.observable(false),
        Occurance: ko.observable(0),
        Saturday: ko.observable(false),
        Second: ko.observable(false),
        StartOn: ko.observable(null),
        Third: ko.observable(false),
        Thursday: ko.observable(false),
        Tuesday: ko.observable(false),
        Wednesday: ko.observable(false)
    },
    ReoccurringException_Id: ko.observable(0),
    Selected: ko.observable(false),
    StartAt: ko.observable(null),
    SystemMessage: ko.observable('')
});

/** ----------------------------------------------------------------
* Client model for ConflictDay
* @class day
* @constructor
* @param dayExceptionObj {Object} Json data
* ---------------------------------------------------------------- */
var day = function (dayobj) { this.init(dayobj); }
$.extend(day.prototype, {

    init: function (dayobj) {
        var self = this;
        for (key in dayobj) {
            var isObservable = ko.isObservable(dayobj[key]);
            self[key] = isObservable ? dayobj[key] : ko.observable(dayobj[key]);
        }

        self.ConflictCount = ko.observable(self.Conflicts().length);
        if (self.ConflictCount() > 0) {
            var a = [];
            $.each(self.Conflicts(), function (index, obj) {
                var c = new dayException(obj);
                a.push(c);
            });
            self.Conflicts = new ko.observableArray(a);
        }

        var d = ko.utils.unwrapObservable(self.StartAt);

        if (isValidDate(d && d != null)) {
            //self.StartAt = ko.observable(new Date(d).zoneless());
            self._startAt = ko.observable(self.StartAt());
            self._isWorking = ko.observable(true);
        } else {
            self._startAt(new Date().setHours(8, 0, 0, 0));
            self._isWorking = ko.observable(false);
        }
        
        /* knockout handler for 'isWorking' flip toggles */
        self.handleIsWorking = ko.computed({
            read: function () {
                return this._isWorking().toString();
            },
            write: function (value) {
                var working = value === 'true' ? true : false;
                this._isWorking(working);

            },
            owner: this
        });
        return self;

    },
    AvailableDay: ko.observable(0),
    AvailableUnitsToday: ko.observable(0),
    BreakDuration: ko.observable(0),
    BreakStart: ko.observable(null),
    BreakStop: ko.observable(null),
    BreakWanted: ko.observable(false),
    Color: ko.observable(null),
    Conflicts: ko.observableArray(),
    ConflictCount: ko.observable(0),
    Customized: ko.observable(false),
    Date: ko.observable(null),
    Day: ko.observable(0),
    DayOfWeek: ko.observable(null),
    DayOfYear: ko.observable(0),
    EarlyMorningServices: ko.observable(null),
    EndAt: ko.observable(null),
    Exception: ko.observable(0),
    Id: ko.observable(0),
    MaxUnitsBeforeEMS: ko.observable(0),
    MaxUnitsPerDay: ko.observable(0),
    Month: ko.observable(0),
    PreferredUnitsPerDay: ko.observable(0),
    StartAt: ko.observable(null),
    TechId: ko.observable(0),
    ValidDay: ko.observable(0),
    Year: ko.observable(0),
    _startAt: ko.observable(false),
    _isWorking: ko.observable(false),
    handleIsWorking: null,
    supplyExceptionReason: null
});

/** ----------------------------------------------------------------
* Knockout extension method to track model state
* @class ko.dirtyFlag
* @constructor
* @extends KO
* @param dayExceptionObj {Object} knockout node
* @param dayExceptionObj {Boolean} initial state
* ---------------------------------------------------------------- */
ko.dirtyFlag = function (root, isInitiallyDirty) {
    var result = function () { },
        _initialState = ko.observable(ko.toJSON(root)),
        _isInitiallyDirty = ko.observable(isInitiallyDirty);

    result.isDirty = ko.computed(function () {
        return _isInitiallyDirty() || _initialState() !== ko.toJSON(root);
    });
    result.reset = function () {
        _initialState(ko.toJSON(root));
        _isInitiallyDirty(false);
    };
    return result;
};

var BW = (function (ns) {

    /** ----------------------------------------------------------------
    * Collection of BW.page objects to handle page load events
    * @class BW.viewModels
    * ---------------------------------------------------------------- */
    ns.viewModels = {
        Reference: {
            techId: 0,
            monthlySurveyId: 0
        },
        /** ----------------------------------------------------------------
        * viewmodel for default monthly survey
        * @class DefaultWeekViewModel
        * @param callback {Delegate} callback on done
        * ---------------------------------------------------------------- */
        DefaultWeekViewModel: function (callback) {
            var self = this;

            self.callback = callback;
            self.dirtyFlag = ko.observable();
            self.isDirty = ko.computed(function () { return false; });
            self.defaultweek = ko.observable();
            self.days = [];
            self.dayDetail = {
                day: ko.observable(),
                dirtyFlag: ko.observable(),
                isDirty: ko.computed(function () { return false; })
            };

            ///- binding handlers --------------------------------------------------------
            /** ----------------------------------------------------------------
            * ko.computed binding handler for EMS
            *
            * @method handleEMS
            * @type {ko.computed}
            * @return {String} Value for jqm flipToggle
            * ---------------------------------------------------------------- */
            self.handleEMS = ko.computed({
                read: function () {
                    return self.defaultweek.EarlyMorningServices().toString();
                },
                write: function (value) {
                    var ems = value === 'true' ? true : false;
                    self.defaultweek.EarlyMorningServices(ems);
                },
                deferEvaluation: true,
                owner: self
            });

            /** ----------------------------------------------------------------
            * ko.computed binding handler for 6 day work week
            *
            * @method handleSixDay
            * @type {ko.computed}
            * @return {String} Value for jqm flipToggle
            * ---------------------------------------------------------------- */
            self.handleSixDay = ko.computed({
                read: function () {
                    return self.defaultweek.SixDayWeek().toString();
                },
                write: function (value) {
                    var six = value === 'true' ? true : false;
                    self.defaultweek.SixDayWeek(six);
                },
                deferEvaluation: true,
                owner: self
            });

            /** ----------------------------------------------------------------
            * ko.computed binding handler for break wanted & sets duration value default
            * 
            * @method handleBreakWanted
            * @type {ko.computed}
            * @return {String} Value for jqm flipToggle
            * ---------------------------------------------------------------- */
            self.handleBreakWanted = ko.computed({
                read: function () {
                    return self.defaultweek.BreakWanted().toString();
                },
                write: function (value) {
                    var wanted = value === 'true' ? true : false;
                    var $dwMobiBreakDuration = $('#dwMobiBreakDuration');

                    self.defaultweek.BreakWanted(wanted);
                    if (!wanted) {
                        $dwMobiBreakDuration.mobiscroll('setValue', [0], true);
                    } else {
                        var x = $dwMobiBreakDuration.mobiscroll('getValue');
                        if (parseInt(x[0]) == 0) {
                            $dwMobiBreakDuration.mobiscroll('setValue', [15], true);
                        }
                    }
                },
                deferEvaluation: true,
                owner: self
            });

            /** ----------------------------------------------------------------
            * ko.computed binding handler for break duration
            *
            * @method handleBreakDuration
            * @type {ko.computed}
            * @return {String} Number of minutes for break
            * ---------------------------------------------------------------- */
            self.handleBreakDuration = ko.computed({
                read: function () {
                    return self.defaultweek.BreakDuration().toString();
                },
                write: function (value) {
                    var duration = parseInt(value);
                    self.defaultweek.BreakDuration(duration);
                },
                deferEvaluation: true,
                owner: self
            });

            /** ----------------------------------------------------------------
            * event handler to open dwDefaultDayPanel 
            *
            * @method goToDayDetail
            * @param item {Object} The 'day' object from knockout           
            * ---------------------------------------------------------------- */
            self.goToDayDetail = function (obj) {
                // ko.cleanNode($('#dwDefaultDayPanel')[0]);

                self.dayDetail.day = obj;
                self.dayDetail.dirtyFlag = new ko.dirtyFlag(self.dayDetail.day, false);
                self.dayDetail.isDirty = ko.computed(function () {
                    $('#saveDayDetail').toggleClass('ui-disabled', !this.dirtyFlag.isDirty());
                    return this.dirtyFlag.isDirty();
                }, self.dayDetail);
                $('#dwDefaultDayPanel').panel('open');
            };

            /** ----------------------------------------------------------------
            * handler for dwDefaultDayPanel close event parses StartAt mobiscroller
            *
            * @method dayDetailClose
            * ---------------------------------------------------------------- */
            self.dayDetailClose = function () {
                var d = self.dayDetail;
                if (d.isDirty()) {
                    if (d.day._isWorking()) {
                        var a = $('#ddMobiStartAt').mobiscroll('getValue');
                        var ampm = parseInt(a[2]);
                        var h = parseInt(a[0]) + (ampm * 12);
                        var m = parseInt(a[1]);
                        var newstart = new Date().setHours(h, m);

                        d.day.StartAt(new Date(newstart));
                    }
                    else {
                        d.day.StartAt('');
                    }
                }
            };

            /** ----------------------------------------------------------------
            * fetches monthly survey Json and creates knockout model 
            *
            * @method loadData         
            * ---------------------------------------------------------------- */
            self.loadData = function () {
                console.log(TECH_ID);
                $.getJSON(BW.makeendpoint(BW.endpoints.GetMonthlyTechSurvey),
                    {
                        techId: TECH_ID
                    },
                    function (weekdata) {

                        // convert dates to js versions
                        $.each(weekdata, function (index, v) {
                            if (isValidDate(v)) {
                                weekdata[index] = new Date(v);
                            }
                        });
                        // knockout mapping
                        self.defaultweek = ko.mapping.fromJS(weekdata);
                        // create day objects for default week
                        self.days = [
                                    ko.observable(new day({ DayOfWeek: 'Monday', StartAt: self.defaultweek.MonStartAt })),
                                    ko.observable(new day({ DayOfWeek: 'Tuesday', StartAt: self.defaultweek.TueStartAt })),
                                    ko.observable(new day({ DayOfWeek: 'Wednesday', StartAt: self.defaultweek.WedStartAt })),
                                    ko.observable(new day({ DayOfWeek: 'Thursday', StartAt: self.defaultweek.ThuStartAt })),
                                    ko.observable(new day({ DayOfWeek: 'Friday', StartAt: self.defaultweek.FriStartAt })),
                                    ko.observable(new day({ DayOfWeek: 'Saturday', StartAt: self.defaultweek.SatStartAt }))
                                ];
                        // assign a default day to avoid binding exception
                        self.dayDetail.day = self.days[1];

                        // store convenience data
                        BW.viewModels.Reference.techId = self.defaultweek.Tech_Id();
                        BW.viewModels.Reference.monthlySurveyId = self.defaultweek.MonthlySurvey_Id();

                        // notify viewmodel is ready to bind
                        self.callback(self);

                        // set state flag and handler
                        self.dirtyFlag = new ko.dirtyFlag(self.defaultweek, false);
                        self.isDirty = ko.computed(function () {
                            $('#saveWeekButton').toggleClass('ui-disabled', !self.dirtyFlag.isDirty());
                            return self.dirtyFlag.isDirty();
                        }, self);
                    });
            };

            /** ----------------------------------------------------------------
            * sends monthly survey data to server
            *
            * @method saveData         
            * ---------------------------------------------------------------- */
            self.saveData = function (val) {
                var pg = BW.dompages.$techCalendar;

                if (val && this.isDirty()) {
                    if (this.defaultweek.BreakWanted()) {
                        var breakstartat = $('#dwMobiBreakStartAt').getMobiDate();
                        var breakendat = $('#dwMobiBreakEndAt').getMobiDate();

                        this.defaultweek.BreakStartAt(breakstartat);
                        this.defaultweek.BreakEndAt(breakendat);
                    } else {
                        this.defaultweek.BreakStartAt('');
                        this.defaultweek.BreakEndAt('');
                    }
                    var data = ko.toJS(self.defaultweek);
                    $.each(data, function (index, v) {
                        if (v instanceof Date) {
                            data[index] = v.getTime();
                        }
                    });

                    $.ajax({
                        url: BW.makeendpoint(BW.endpoints.PostMonthlyTechSurvey),
                        data: data,
                        dataType: 'json',
                        traditional: true,
                        type: 'POST',
                        success: function (data) {
                            console.log(data);
                        }
                    });
                }
                else {
                    pg = BW.dompages.$start;
                    console.log('cancelled mts');
                }
                $.mobile.changePage(pg, { transition: 'fade' });
            };

            self.loadData();
            return true;
        },

        /** ----------------------------------------------------------------
        * viewmodel for exception calendar
        * @class TechCalendarViewModel
        * @param callback {Delegate} callback on done
        * ---------------------------------------------------------------- */
        TechCalendarViewModel: function (callback) {
            var self = this;

            self.exceptionInfo = ko.observable();
            self.conflictDays = ko.observableArray();
            self.calendarDate = null;
            self.callback = callback;
            self.dirtyFlag = ko.observable();
            self.isDirty = ko.computed(function () { return false; });
            self.days = ko.observable();
            self.dayDetail = {
                day: ko.observable(),
                dayExceptionDetail: ko.observable(),
                dirtyFlag: ko.observable(),
                isDirty: ko.computed(function () { return false; }),
                handleBreakWanted: ko.computed(function () { return false; }),
                handleBreakDuration: ko.computed(function () { return false; }),
                handleOverrideRecurringException: ko.computed(function () { return false; }),
                supplyExceptionReason: null,
                supplyExceptionTypeName: null,
                getExceptionReasons: null,
                getExceptionTypes: null,
                goToEditException: null,
                dayDetailClose: function (val) {
                    $.mobile.changePage(BW.dompages.$defaultWeek, { transition: 'slidedown' });
                }
            };




            /** ----------------------------------------------------------------
            * event handler to open techCalendarDay
            *
            * @method goToDayDetail
            * @param item {Object} The 'day' object from knockout           
            * ---------------------------------------------------------------- */
            self.goToDayDetail = function (index) {
                var c = $.grep(self.conflictDays(), function (obj) { return obj.Day == index; });


                var conday = new day(c[0]);
                // convert dates to js versions
                conday.Date(new Date(conday.Date()));
                conday.StartAt(new Date(conday.StartAt()));
                conday.EndAt(new Date(conday.EndAt()));
                conday.BreakStart(new Date(conday.BreakStart()));
                conday.BreakStop(new Date(conday.BreakStop()));
                $.each(conday.Conflicts(), function (k, v) {
                    v.EndAt(new Date(v.EndAt()));
                    v.StartAt(new Date(v.StartAt()));
                    v.HolidayData().HolidayOn = new Date(v.HolidayData().HolidayOn);
                    v.HolidayData().EndAt = new Date(v.HolidayData().EndAt);
                });


                self.dayDetail.day(conday);
                //todo try/catch
                // convert dates



                ///- binding handlers --------------------------------------------------------
                /** ----------------------------------------------------------------
                * ko.computed binding handler for break duration
                *
                * @method handleBreakDuration
                * @type {ko.computed}
                * @return {String} Number of minutes for break
                * ---------------------------------------------------------------- */
                self.dayDetail.handleBreakDuration = ko.computed({
                    read: function () {
                        return self.dayDetail.day().BreakDuration().toString();
                    },
                    write: function (value) {
                        var duration = parseInt(value);
                        self.dayDetail.day().BreakDuration(duration);
                    },
                    deferEvaluation: true,
                    owner: self
                });

                /** ----------------------------------------------------------------
                * ko.computed binding handler for break wanted & sets duration value default
                * 
                * @method handleBreakWanted
                * @type {ko.computed}
                * @return {String} Value for jqm flipToggle
                * ---------------------------------------------------------------- */
                self.dayDetail.handleBreakWanted = ko.computed({
                    read: function () {
                        return self.dayDetail.day().BreakWanted().toString();
                    },
                    write: function (value) {
                        var wanted = value === 'true' ? true : false;
                        var $cdMobiBreakDuration = $('#cdMobiBreakDuration');

                        self.dayDetail.day().BreakWanted(wanted);
                        if (!wanted) {
                            $cdMobiBreakDuration.mobiscroll('setValue', [0], true);
                        } else {
                            var x = $cdMobiBreakDuration.mobiscroll('getValue');
                            if (parseInt(x[0]) == 0) {
                                $cdMobiBreakDuration.mobiscroll('setValue', [15], true);
                            }
                        }
                    },
                    deferEvaluation: true,
                    owner: self
                });

                self.dayDetail.handleOverrideRecurringException = ko.computed({
                    read: function () {
                        return 'asd';
                    },
                    write: function (value) {
                        //         var excep = self.Selected();
                        //         var recurr = self.SelectedRecurring();

                        //         if (excep.OverrideRecurringException() == false) {
                        //             excep.StartAt(recurr.StartAt());
                        //             excep.EndAt(recurr.EndAt());
                        //             excep.ExceptionType_Id(recurr.ExceptionType_Id());
                        //             excep.ExceptionReason_Id(recurr.ExceptionReason_Id());
                        //             excep.Detail(recurr.Detail());
                        //         }
                        //         saveException();
                    },
                    deferEvaluation: true,
                    owner: self
                });

                self.dayDetail.supplyExceptionReason = function (data) {
                    var c = $.grep(self.exceptionInfo.ExceptionReasons, function (obj) { return obj.Id == data; });
                    return (c.length > 0) ? c[0].Title : 'No Title Found';
                };

                self.dayDetail.supplyExceptionTypeName = function (data) {
                    var c = $.grep(self.exceptionInfo.ExceptionTypes, function (obj) { return obj.Id == data; });
                    return (c.length > 0) ? c[0].Name : 'No Exception Type Name Found';
                };

                self.dayDetail.getExceptionReasons = ko.computed({
                    read: function () {
                        return self.exceptionInfo.ExceptionReasons;
                    },
                    write: function (value) {

                        //var wanted = value === 'true' ? true : false;
                        //self.dayDetail.day().BreakWanted(wanted);
                    },
                    deferEvaluation: true,
                    owner: self

                });

                self.dayDetail.getExceptionTypes = ko.computed({
                    read: function () {
                        return self.exceptionInfo.ExceptionTypes;
                    },
                    write: function (value) {

                        //var wanted = value === 'true' ? true : false;
                        //self.dayDetail.day().BreakWanted(wanted);
                    },
                    deferEvaluation: true,
                    owner: self

                });

                self.dayDetail.goToEditException = function (data) {
                    var c = $.grep(self.dayDetail.day().Conflicts(), function (obj) {
                        return obj.Id() == data.Id();
                    });
                    self.dayDetail.dayExceptionDetail(c[0]);

                    $.mobile.changePage(BW.dompages.$techCalendarDayException, { transition: 'flip' });
                    //  $.mobile.changePage(BW.dompages.$techCalendarDayException, { transition: 'flip' });
                };
                self.dayDetail.dirtyFlag = new ko.dirtyFlag(self.dayDetail.day, false);
                self.dayDetail.isDirty = ko.computed(function () {
                    $('#saveTechCalendarDayButton').toggleClass('ui-disabled', !this.dirtyFlag.isDirty());
                    return self.dayDetail.isDirty();
                }, self.dayDetail);

                // var working = self.dayDetail.day()._isWorking;
                // $mobi.mobiscroll('enableMobi', working());

                // working.subscribe(function (val) {
                //     $mobi.mobiscroll('enableMobi', val);
                // });
                $.mobile.changePage(BW.dompages.$techCalendarDay, { transition: 'flip' });
            };

            /** ----------------------------------------------------------------
            * handler for cdDayPanel close event parses StartAt mobiscroller
            *
            * @method dayDetailClose
            * ---------------------------------------------------------------- */
            self.dayDetailClose = function () {
                var d = self.dayDetail;
                if (d.isDirty()) {
                    if (d.day._isWorking()) {
                        var a = $('#cdMobiStartAt').mobiscroll('getValue');
                        var ampm = parseInt(a[2]);
                        var h = parseInt(a[0]) + (ampm * 12);
                        var m = parseInt(a[1]);
                        var newstart = new Date().setHours(h, m);

                        d.day.StartAt(new Date(newstart));
                    }
                    else {
                        d.day.StartAt('');
                    }
                }
            };

            self.ChangeSelected = function (data) {

                console.log(data);
                // var recurringId = data.RecurringException_Id();
                // if (recurringId != 0) {
                //     for (var i = 0; i < self.exceptionData.RecurringExceptionModels().length; i++) {
                //         if (self.exceptionData.RecurringExceptionModels()[i].Id() == recurringId)
                //             self.SelectedRecurring(self.exceptionData.RecurringExceptionModels()[i]);
                //     }
                // } else {
                //     //self.SelectedRecurring = ko.observable();
                //     var bFound = false;
                //     for (var i = 0; i < self.exceptionData.RecurringExceptionModels().length; i++) {
                //         if (self.exceptionData.RecurringExceptionModels()[i].Id() == 0) {
                //             self.SelectedRecurring(self.exceptionData.RecurringExceptionModels()[i]);
                //             bFound = true;
                //         }
                //     }
                //     if (!bFound) {
                //         var newModel = new RecurringExceptionModel();
                //         self.exceptionData.RecurringExceptionModels.push(newModel);
                //         self.SelectedRecurring(newModel);
                //     }

                // }
                // self.Selected(data);
            };

            //Add a new exception to the list
            self.CreateException = function () {
                // var newModel = new ExceptionModel();
                // //newModel = ko.observable(newModel);
                // self.exceptionData.ExceptionModels.push(newModel);
                // self.ChangeSelected(newModel);
            };


            //Add a new exception to the list
            self.RemoveException = function (data) {
                // self.ChangeSelected(data);
                // self.Selected().Deleted(true);
                // saveException();
            };

            self.finish = function (val, obj) {
                $.mobile.changePage(BW.dompages.$start, { transition: 'fade' });
            };

            self.finishDay = function (val, obj) {
                $.mobile.changePage(BW.dompages.$techCalendar, { transition: 'fade' });
            };

            /** ----------------------------------------------------------------
            * fetches calendar Json and creates knockout model 
            *
            * @method loadData         
            * ---------------------------------------------------------------- */
            self.loadData = function () {
                $.getJSON(BW.makeendpoint(BW.endpoints.GetCalendarDaysAndExceptions),
                     {
                         techId: 10,
                         monthlySurveyId: 3
                     },
                     function (data) {
                         // convert dates to js versions
                         $.each(data, function (index, v) {
                             if (isValidDate(v)) {
                                 data[index] = new Date(v);
                             }
                         });
                         // knockout mapping
                         self.days = ko.mapping.fromJS(data);

                         // used by calendario plugin for month data
                         self.calendarDate = new Date(self.days()[0].Date()).zoneless();

                         // create day conflict objects
                         $.each(data, function (index, day) {
                             if (day.Conflicts.length > 0) {
                                 self.conflictDays.push(day);
                             }
                         });
                         //fetch the exception lookup tables
                         $.getJSON(BW.makeendpoint(BW.endpoints.GetExceptionInfo),
                        {

                        },
                        function (data) {
                            self.exceptionInfo = data;
                            self.callback(self);
                        });


                     });
            };
            self.saveData = function () {
                var data = ko.toJS(self.defaultweek);
                $.each(data, function (index, v) {
                    if (v instanceof Date) {
                        data[index] = v.getTime();
                    }
                });
                $.ajax({
                    url: BW.makeendpoint(BW.endpoints.PostdefaultWeek),
                    data: data,
                    dataType: 'json',
                    traditional: true,
                    type: 'POST',
                    success: function (data) {
                        console.log(data);
                    }
                });
            };

            self.loadData();
        }
    };
    return ns;
} (BW || {}));
