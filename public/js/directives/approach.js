app.directive('ngApproach', function($compile, $rootScope, $timeout) {

   var unit_names = {
      c: "count",
      d: "distance",
      l: "length",
      t: "time",
      w: "weight"
   };

    function setData(scope,path,value){
        var key,
            pathEls = path.split("."),
            element = scope;
        while(pathEls.length > 1 && element){
            element = element[pathEls.shift()];
        }
        while(pathEls.length > 1 ){
            key = pathEls.shift();
            element[key] = {};
            element = element[key];
        }
        element[pathEls.shift()] = value;
        scope.$apply();
    }

    function toTime(time){
        return sprintf("%02d:%02d",Math.floor(time/60),time % 60);
    }

    return {
        scope: 'false',
        link: function(scope, $element, attrs) {
            var data = scope.$eval( attrs.ngApproach),
                oldApproach = scope.$eval( attrs.ngApproachOld),
                exercise = $rootScope.exercises[$rootScope.select_train.id_exercise],
                types = exercise.type.split(""),
                units = [1,1],
                $resultsOld = [$element.find("[ng-approach-old-result-1]"),$element.find("[ng-approach-old-result-2]")],
                $results = [$element.find("[ng-approach-result-1]"), $element.find("[ng-approach-result-2]")],
                $iTimersOld = [$element.find("[ng-approach-old-rest]"), $element.find("[ng-approach-old-work]")],
                $iTimers = [$element.find("[ng-approach-rest]"), $element.find("[ng-approach-work]")];

            if(types[0] == "w"){
                units[0] = $rootScope.settings.weight_unit;
            }

            if(types[0] == "d"){
                units[0] = $rootScope.settings.distance_unit;
            }

            $rootScope.$watch("settings.is_show_time",function(is_show_time){
                $element[is_show_time?"removeClass":"addClass"]("no-time");
            });

            $results.forEach(function($result, index){
                var type = types[index],
                    key = attrs.ngApproach + "." + type,
                    value = scope.$eval(key),
                    unit = $rootScope.units[unit_names[type]],
                    coeff = unit[units[index]].coeff,
                    $btn = $result.next(),
                    unit_ids = Object.keys(unit);

                $result.val(Math.floor(value*coeff*100)/100);
                $result.on("change",function(){
                    var value = $result.val();
                    coeff = unit[units[index]].coeff;
                    setData(scope, key, value / coeff );
                });
                scope.$watch(key,function(newValue){
                    coeff = unit[units[index]].coeff;
                    $result.val(Math.floor(newValue*coeff*100)/100);
                });

                $btn.css("background",unit[units[index]].color);
                $btn.html(unit[units[index]].sym);
                $btn.on("click",function(){
                    var id = units[index].toString(),
                        unit_index = unit_ids.indexOf(id) + 1;
                    units[index] = unit_ids[unit_index%unit_ids.length];
                    coeff = unit[units[index]].coeff;
                    value = scope.$eval(key);
                    $result.val(Math.floor(value*coeff*100)/100);
                    $btn.css("background",unit[units[index]].color);
                    $btn.html(unit[units[index]].sym);
                });
            });

            $iTimers.forEach(function($iTimer, index){
                var type = index?"w":"r",
                    $btn = $iTimer.next(),
                    key = attrs.ngApproach + ".t" + type,
                    value = scope.$eval(key)|| 0,
                    timeId,
                    stopTimer = function(){
                        $timeout.cancel(timeId);
                        timeId = null;
                    },
                    tickTimer = function(){
                        timeId = $timeout(function(){
                            value = scope.$eval(key)||0;
                            if(value < 59 * 60 + 59 ){
                                setData(scope, key, value + 1);
                                tickTimer();
                            }else{
                                stopTimer();
                            }
                        },1000);
                    };

                $iTimer.val(toTime(value));
                scope.$watch(key,function(newValue){
                    $iTimer.val(toTime(newValue||0));
                });
                $btn.on("click",function(){
                    value = scope.$eval(key)||0;
                    if(timeId){
                        stopTimer();
                    }
                    if(value == 0){
                        $rootScope.$broadcast("stopTimer",key);
                        tickTimer();
                    }
                });
                $iTimer.on("click",function(){
                    value = scope.$eval(key)||0;
                    if(timeId){
                        stopTimer();
                    }
                });

                $rootScope.$on("stopTimer",function(tKey){
                    if(tKey!= key){
                        stopTimer();
                    }
                });
            });

            $iTimersOld.forEach(function($iTimer, index){
                var type = index?"w":"r",
                    key = attrs.ngApproachOld + ".t" + type,
                    value = scope.$eval(key)|| 0;
                $iTimer.val(toTime(value));
                scope.$watch(key,function(newValue){
                    $iTimer.val(toTime(newValue||0));
                });
            });



            $resultsOld.forEach(function($result, index){
                var type = types[index],
                    key = attrs.ngApproachOld + "." + type,
                    value = scope.$eval(key) || 0,
                    unit = $rootScope.units[unit_names[type]],
                    coeff = unit[units[index]].coeff,
                    unit_ids = Object.keys(unit);

                $result.html(Math.floor(value*coeff*100)/100);
                scope.$watch(key,function(newValue){
                    newValue = newValue || 0;
                    coeff = unit[units[index]].coeff;
                    $result.html(Math.floor(newValue*coeff*100)/100);
                });
            });

        }
    };
});