'use strict';

// to prevent this loading twice in dev - hacky hacky whatever shut your face

if (!window.apploaded) {

  window.apploaded = true;

  var BASE = 'https://jgr3go.github.io/reddit_ar/mooseleague/';

  if (window.location.href.match(/localhost/)) {
    BASE = '';
  }

  angular.module('ar', ['ui.router']).config(['$stateProvider', '$sceDelegateProvider', '$urlRouterProvider', '$locationProvider', function ($sp, $sce, $url, $loc) {
    $sce.resourceUrlWhitelist(['self', BASE + '**']);

    $url.deferIntercept();

    $sp.state({
      name: 'Calendar',
      templateUrl: BASE + 'calendar.html',
      controller: 'calendar',
      url: '/calendar',
      controllerAs: 'CC'
    });

    $url.otherwise('/calendar');
  }]).run(['$http', '$stateRegistry', '$urlRouter', 'Events', function ($http, $stateRegistry, $urlRouter, Events) {

    return Events.list().then(function (evts) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = evts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var evt = _step.value;

          $stateRegistry.register({
            name: evt.name,
            templateUrl: BASE + 'event.html',
            controller: 'event',
            url: evt.url + "?tab",
            params: {
              tab: { dynamic: true }
            },
            controllerAs: 'EC'
          });
        }

        // after registering states, listen on the router
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      $urlRouter.sync();
      $urlRouter.listen();
    });
  }]).factory('Events', ['$http', '$q', function ($http, $q) {
    var EVENTS = [];
    var svc = {};
    svc.list = function () {
      if (!EVENTS.length) {
        return $http.get(BASE + 'events.txt').then(function (res) {
          return res.data;
        }).then(function (res) {
          EVENTS = [];

          var lines = res.split('\n');
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = lines[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var line = _step2.value;

              line = line.trim();
              if (!line) {
                continue;
              }

              var split = line.split('|');
              EVENTS.push({
                name: split[0].trim(),
                url: '/' + split[0].trim().split(' ').join('').toLowerCase(),
                date: split[1].trim(),
                state: split[0].trim(),
                events: split[2].trim(),
                link: split[3].trim()
              });
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          return EVENTS;
        });
      } else {
        return $q.when(EVENTS);
      }
    };

    svc.latest = function () {
      return svc.list().then(function (evts) {
        if (evts.length === 1) {
          return evts[0];
        }
        var isThereOneToday = false;
        if (evts[evts.length - 2]) {
          var date = moment(evts[evts.length - 2].date).format('YYYY-MM-DD');
          if (moment().format('YYYY-MM-DD') === date) {
            return evts[evts.length - 2];
          }
        }
        return evts[evts.length - 1];
      });
    };

    return svc;
  }]).controller('calendar', ['$http', 'Events', function ($http, Events) {
    var vm = this;

    function init() {
      vm.events = [];

      return Events.list().then(function (evts) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = evts[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var evt = _step3.value;

            evt = _.clone(evt);
            evt.date = moment(evt.date).format('MMM D, YYYY');
            vm.events.push(evt);
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      });
    }

    init();
  }]).controller('main', ['$http', '$location', '$timeout', '$state', 'Events', function ($http, $location, $timeout, $state, Events) {

    var vm = this;

    function init() {
      Events.list().then(function (evts) {
        vm.events = evts;
      });

      Events.latest().then(function (evt) {
        console.log(evt);
        vm.next = {
          name: evt.name.toUpperCase(),
          date: moment(evt.date),
          state: evt.state,
          displayDate: moment(evt.date).format('MMM D, YYYY'),
          live: false
        };
      });

      countdown();
    }

    function countdown() {
      if (vm.next) {
        var now = moment();
        var evt = moment(vm.next.date);

        if (now.format('YYYY-MM-DD') === evt.format('YYYY-MM-DD')) {
          vm.next.live = true;
        } else {
          var days = evt.diff(now, 'days');
          vm.next.days = days;
          evt.subtract(days, 'days');
          var hours = evt.diff(now, 'hours');
          vm.next.hours = hours;
          evt.subtract(hours, 'hours');
          var minutes = evt.diff(now, 'minutes');
          vm.next.minutes = minutes;
        }
        $timeout(countdown, 1000 * 60);
      } else {
        $timeout(countdown, 500);
      }
    }

    var lastState = void 0;
    var crumbs = [];
    vm.getBreadcrumbs = function () {
      if ($state.$current.name === lastState) {
        return crumbs;
      }
      lastState = $state.$current.name;
      crumbs = [];
      if (lastState !== 'Calender') {
        crumbs = [{ name: 'Home', last: false, link: 'Calendar' }, { name: lastState, last: true }];
      } else {
        crumbs = [{ name: 'Home', last: true }];
      }
      return crumbs;
    };

    init();
  }]).controller('event', ['$http', '$state', '$timeout', '$location', '$anchorScroll', '$stateParams', function ($http, $state, $timeout, $location, $anchorScroll, $params) {

    var vm = this;

    vm.tab = 'start';

    $anchorScroll.yOffset = 60;

    function init() {
      if ($params.tab) {
        vm.tab = $params.tab;
      }

      var filename = $state.$current.name.split(' ').join('').toLowerCase() + '.txt';
      $http.get(BASE + filename).then(function (res) {
        return res.data;
      }).then(function (res) {
        var event = parseFile(res);
        console.log(event);
        vm.event = event;
        vm.event.file = filename;

        vm.next = {
          date: event.date,
          name: event.name.toUpperCase()
        };

        vm.event.date = moment(new Date(vm.event.date)).format('MMM D, YYYY');

        $timeout($anchorScroll);
      });
    }

    function parseFile(data) {
      var lines = data.split('\n');

      var event = {
        name: lines[0].trim(),
        date: moment(lines[1].trim()),
        events: lines[2].split(',').map(function (a) {
          return a.trim();
        }),
        leagues: [],
        h2h: []
      };

      lines.splice(0, 3);

      var curLeague = {};
      var allUsers = {};

      var ii = void 0;
      for (ii = 0; ii < lines.length; ii++) {
        var line = lines[ii].trim();
        if (!line) {
          continue;
        }
        if (line === '=====') {
          break;
        }

        if (line[0] === '#') {
          var name = line.match(/\#\s*(.*)/)[1].trim();
          curLeague = {
            name: name,
            anchor: name.split(' ').join('').toLowerCase(),
            entrants: [],
            winners: []
          };
          event.leagues.push(curLeague);
          continue;
        }

        var user = parseUser(line, event);
        assignUser(allUsers, user);

        curLeague.entrants.push(user);
      }

      var curh2h = { entrants: [] };
      for (ii = ii + 1; ii < lines.length; ii++) {
        var _line = lines[ii].trim();
        if (_line[0] === '#') {
          continue;
        }
        if (!_line) {
          event.h2h.push(curh2h);
          curh2h = {
            entrants: []
          };
          continue;
        }

        var _user = parseUser(_line, event);
        assignUser(allUsers, _user);

        curh2h.entrants.push(_user);
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = event.leagues[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var league = _step4.value;

          league.entrants = sortAndLane(league.entrants, event);
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = event.h2h[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var h2h = _step5.value;

          h2h.entrants = sortAndLane(h2h.entrants, event);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      event.winners = getWinners(allUsers, event);

      return event;
    }

    function assignUser(users, user) {
      if (!users[user.user.toLowerCase()]) {
        users[user.user.toLowerCase()] = user;
      }
      var u = users[user.user.toLowerCase()];

      u.VDOT = Math.max(u.VDOT, user.VDOT);
      u.note = u.note || user.note;
      u.times = u.times.length > user.times.length ? u.times.length : user.times.length;
      u.links = u.links.length > user.links.length ? u.links : user.links;
    }

    function sortAndLane(list, event) {
      list = _.orderBy(list, ['VDOT', 'user'], ['desc', 'asc']);
      var lane = 1;
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = list[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var e = _step6.value;

          e.lane = lane++;
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6.return) {
            _iterator6.return();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      assignPlaceAndPoints(list, event, 'heatPoints', 'heatPlace', 8);

      list = _.orderBy(list, ['heatPlace', 'events[0].time', 'user'], ['asc', 'asc', 'asc']);

      return list;
    }

    function assignPlaceAndPoints(list, event, pointsKey, placeKey, maxPoints) {
      for (var ii = 0; ii < event.events.length; ii++) {
        var points = maxPoints;
        var place = 1;
        var prev = void 0;

        var byTime = _.orderBy(list, ['events[' + ii + '.time', 'user']);
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = byTime[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var li = _step7.value;

            if (li.events[ii] && li.events[ii].time) {
              if (prev && prev.time === li.events[ii].time) {
                li.events[ii][pointsKey] = prev[pointsKey];
                li.events[ii][placeKey] = prev[placeKey];
              } else {
                li.events[ii][pointsKey] = points;
                li.events[ii][placeKey] = place;
              }

              prev = li.events[ii];
              place += 1;
              if (points) {
                points -= 1;
              }
            }
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7.return) {
              _iterator7.return();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }

        var _iteratorNormalCompletion8 = true;
        var _didIteratorError8 = false;
        var _iteratorError8 = undefined;

        try {
          for (var _iterator8 = list[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
            var _li = _step8.value;

            _li[pointsKey] = _li.events.reduce(function (sum, e) {
              return sum + e[pointsKey];
            }, 0);
          }
        } catch (err) {
          _didIteratorError8 = true;
          _iteratorError8 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion8 && _iterator8.return) {
              _iterator8.return();
            }
          } finally {
            if (_didIteratorError8) {
              throw _iteratorError8;
            }
          }
        }

        var byPoints = _.orderBy(list, [pointsKey, 'user'], ['desc', 'asc']);

        prev = null;
        place = 1;
        var _iteratorNormalCompletion9 = true;
        var _didIteratorError9 = false;
        var _iteratorError9 = undefined;

        try {
          for (var _iterator9 = byPoints[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
            var _li2 = _step9.value;

            if (_li2.raced) {
              if (prev && prev[pointsKey] === _li2[pointsKey]) {
                _li2[placeKey] = prev[placeKey];
              } else {
                _li2[placeKey] = place;
              }
              place += 1;
              prev = _li2;
            }
          }
        } catch (err) {
          _didIteratorError9 = true;
          _iteratorError9 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion9 && _iterator9.return) {
              _iterator9.return();
            }
          } finally {
            if (_didIteratorError9) {
              throw _iteratorError9;
            }
          }
        }
      }
    }

    function getWinners(allUsers, event) {
      allUsers = _.toArray(allUsers);

      assignPlaceAndPoints(allUsers, event, 'points', 'place', 99);

      var winners = _.orderBy(allUsers, ['place', 'events[0].time', 'user'], ['asc', 'asc', 'asc']);

      return winners;
    }

    vm.sortWinnersBy = function (type, index) {
      function byTime(a, b, index) {
        if (a.events[index].time < b.events[index].time) {
          return -1;
        }
        if (b.events[index].time < a.events[index].time) {
          return 1;
        }
        return 0;
      }
      function byKey(a, b, key) {
        if (a[key] < b[key]) {
          return -1;
        }
        if (b[key] < a[key]) {
          return 1;
        }
        return 0;
      }

      if (type === 'event') {
        vm.event.winners = vm.event.winners.sort(function (a, b) {
          var aTime = a.events[index].time,
              bTime = b.events[index].time;

          if (aTime && bTime) {
            return byTime(a, b, index) || byKey(a, b, 'points') || byKey(a, b, 'user');
          } else if (aTime) {
            return -1;
          } else if (bTime) {
            return 1;
          } else {
            return byKey(a, b, 'points') || byKey(a, b, 'user');
          }
        });
      } else {
        vm.event.winners = _.orderBy(vm.event.winners, ['place', 'events[0].time', 'user']);
      }
    };

    function parseUser(line, event) {
      var split = line.split('|').map(function (t) {
        return t.trim();
      });
      var user = {
        user: split[0],
        link: 'https://reddit.com/u/' + split[0],
        VDOT: split[1] ? parseFloat(split[1]) : 0,
        note: split[2] || '',
        times: split[3] ? split[3].split(',').map(function (t) {
          return t.trim();
        }) : event.events.map(function () {
          return '';
        }),
        links: [],
        heatPoints: null,
        heatPlace: null,
        points: null,
        place: null,
        raced: false
      };
      if (split[4]) {
        var links = split[4].split(',').join(' ').split(' ').map(function (l) {
          return l.trim();
        });

        var _iteratorNormalCompletion10 = true;
        var _didIteratorError10 = false;
        var _iteratorError10 = undefined;

        try {
          for (var _iterator10 = links[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            var link = _step10.value;

            if (!link) {
              continue;
            }
            if (link.match(/strava/)) {
              user.links.push({ type: 'strava', url: link });
            } else if (link.match(/youtu/)) {
              user.links.push({ type: 'youtube', url: link });
            }
          }
        } catch (err) {
          _didIteratorError10 = true;
          _iteratorError10 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion10 && _iterator10.return) {
              _iterator10.return();
            }
          } finally {
            if (_didIteratorError10) {
              throw _iteratorError10;
            }
          }
        }

        user.links = user.links.sort(function (a, b) {
          if (a.type < b.type) {
            return -1;
          }
          if (b.type < a.type) {
            return 1;
          }
          return 0;
        });
      }
      user.events = user.times.map(function (t) {
        return {
          event: null,
          time: t,
          heatPlace: null,
          heatPoints: null,
          place: null,
          points: null
        };
      });
      user.raced = user.times.reduce(function (val, t) {
        return !!(val || t);
      }, false);
      return user;
    }

    vm.changeTab = function (tab) {
      vm.tab = tab;
      $state.go($state.$current.name, { tab: tab });
    };

    vm.scrollTo = function (league) {
      $location.hash(league.anchor);
      $anchorScroll();
    };

    init();
  }]).directive('fixedTop', ['$window', function ($window) {
    return {
      restrict: 'A',
      link: function link(scope, elem, attrs, ctrl) {

        var $win = angular.element($window);
        var fixed = parseInt(attrs.fixedTop) || 50;

        $win.on('scroll', function (e) {
          var width = Math.max(window.innerWidth, document.documentElement.clientWidth);
          if (width < 550 || $window.pageYOffset < fixed) {
            elem.css({ position: 'relative', top: '' });
          } else {
            elem.css({ position: 'relative', top: $window.pageYOffset - fixed + 'px' });
          }
        });
      }
    };
  }]);
}