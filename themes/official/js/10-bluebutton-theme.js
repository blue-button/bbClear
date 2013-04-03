/* Blue Button Reference Implementation
   Copyright (c) 2013 by M. Jackson Wilkinson.
   License: Apache */

var filters = {
    related_by_date: function(input, kind){
        var date, batch;
        var list = [];

        if (kind == 'encounters'){
            batch = bb.encounters();
        }else if(kind == 'procedures'){
            batch = bb.procedures();
        }else if(kind == 'problems'){
            batch = bb.problems();
        }else if(kind == 'immunizations'){
            batch = bb.immunizations();
        }else if(kind == 'medications'){
            batch = bb.medications();
            return [];
        }else if(kind == 'labs'){
            batch = [];
            for (var m in bb.labs()){
                for (var l in bb.labs()[m].results){
                    batch.push(bb.labs()[m].results[l]);
                }
            }
        }

        if (input.date){
            if (input.date instanceof Date){
                dates = [input.date.toDateString()];
            }else{
                dates = [input.date.from.toDateString(), input.date.to.toDateString()];
            }
            for (var k in batch){
                if (typeof k == "number"){
                    target = batch[k];
                    if(target.date instanceof Date){
                        target_date = [target.date.toDateString()];
                    }else{
                        target_dates = [target.date.from.toDateString, target.date.to.toDateString()];
                    }
                    if(filters.intersects(dates, target_dates).length > 0){
                        list.push(target);
                    }
                }
            }
        }
        return list;
    },
    intersects: function(input, comparand) {
        return input.filter(function(n){
            if(comparand.indexOf(n) == -1){
                return false;
            }
            return true;
        });
    },
    group : function(list, key){
        var keys = key.split(".");
        var val, keyList = [],
            groupedList = [];

        for (i=0;i<list.length;i++){
            val = list[i];
            for (var k in keys){
                val = val[keys[k]];
            }
            if (keyList.indexOf(val) < 0){
                keyList.push(val);
            }
        }

        for (var j in keyList){
            item = {
                grouper: keyList[j],
                list: []
            };
            for (var h=0;h<list.length;h++){
                val = list[h];
                for (var m in keys){
                    val = val[keys[m]];
                }
                if (val == item.grouper){
                    item.list.push(list[h]);
                }
            }
            groupedList.push(item);
        }

        return groupedList;
    },

    slice : function(input, start, end){
        return input.slice(start, end);
    },

    format_phone : function(input){
        if(input.match(/(^\+)/g)){
            return input;
        }else{
            numbers = input.replace(/\D/g, '');
            numbers = numbers.replace(/(^1)/g, '');
            number = [numbers.substr(0,3), numbers.substr(3,3), numbers.substr(6,4)];
            return number.join('.');
        }
    },

    format_unit : function(input){
        if(input.match(/10\+\d\//g)){
            base = input.split('/')[0].split('+')[0];
            exp = input.split('/')[0].split('+')[1];
            unit = input.split('/')[1];
            str = base + "<sup>" + exp + "</sup>/" + unit;
            return str;
        }else{
            return input;
        }
    },

    full_name: function(input){
        if(input.given === null){
            if(input.family === null){
                return "Unknown";
            }else{
                return input.family;
            }
        }
        var name, first_given, other_given,
            names = input.given.slice(0);

        if (names instanceof Array){
            first_given = names.splice(0,1);
            other_given = names.join(" ");
        } else {
            first_given = names;
        }

        name = first_given;
        name = input.call_me ? name + " \"" + input.call_me + "\"" : name;
        name = (other_given) ? name + " " + other_given : name;
        name = name + " " + input.family;

        return name;
    },

    display_name: function(input){
        if(input.given instanceof Array){
            return input.call_me ? input.call_me : input.given[0];
        }else{
            return input.call_me ? input.call_me : input.given;
        }
    },

    gender_pronoun: function(input, possessive, absolute){
        if(input == "female"){
            return possessive ? (absolute ? "hers" : "her") : "she";
        }else{
            return possessive ? "his" : "he";
        }
    },

    max_severity: function(input){
        /* looks through allergies and returns back the highest severity */

        var i,
            mild = 0,
            moderate = 0,
            severe = 0;

        if(input.severity){
            if (input.severity.match(/severe/i)){
                severe++;
            }else if (input.severity.match(/moderate/i)){
                moderate++;
            }else if (input.severity.match(/mild/i)){
                mild++;
            }
        } else {
            for (i in input){
                if(input[i].severity){
                    if (input[i].severity.match(/severe/i)){
                        severe++;
                    }else if (input[i].severity.match(/moderate/i)){
                        moderate++;
                    }else if (input[i].severity.match(/mild/i)){
                        mild++;
                    }
                }
            }
        }

        if(severe){
            return severe > 1 ? "multiple severe" : "severe";
        }else if (moderate){
            return moderate > 1 ? "multiple moderate" : "moderate";
        }else if (mild){
            return mild > 1 ? "multiple mild" : "mild";
        }else{
            return "no";
        }
    }
};

function init_template(){
    swig.init({
      allowErrors: true,
      autoescape: true,
      cache: true,
      encoding: 'utf8',
      filters: filters,
      tags: {},
      extensions: {},
      tzOffset: 0
    });

    template = swig.compile($(".bb-template").html());
    renderedHtml = template({
        bb: bb,
        demographics: bb.demographics(),
        allergies: bb.allergies(),
        encounters: bb.encounters(),
        immunizations: bb.immunizations(),
        labs: bb.labs(),
        medications: bb.medications(),
        problems: bb.problems(),
        procedures: bb.procedures(),
        vitals: bb.vitals()
    });

    $(".bb-template").html(renderedHtml);
    $("#loader").fadeOut(function(){
        $(".panel").hide();
        $("#demographics").show();
        $(".bb-template").fadeIn();
    });
}

$(function(){
    $("#loader").fadeIn(function(){
        bb = BlueButton($("script#xmlBBData").text());
        init_template();
    });

    $(document).on('click', 'nav a', function(){
        destination = $(this).attr('href');
        $(".panel:visible").fadeOut(function(){
            $(destination).fadeIn();
        });
    });
});

if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(needle) {
        for(var i = 0; i < this.length; i++) {
            if(this[i] === needle) {
                return i;
            }
        }
        return -1;
    };
}
