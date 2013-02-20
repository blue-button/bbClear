/* Blue Button Reference Implementation
   Copyright (c) 2013 by M. Jackson Wilkinson.
   License: Apache */

var filters = {
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

    full_name: function(input){
        var name,
            names = input.given.slice(0),
            first_given = names.splice(0,1);

        name = first_given;
        name = input.call_me ? name + " \"" + input.call_me + "\"" : name;
        name = (names.length > 0) ? name + " " + names.join(" ") : name;
        name = name + " " + input.family;

        return name;
    },

    display_name: function(input){
        return input.call_me ? input.call_me : input.given[0];
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

$(function(){
    bb = BlueButton($("script#xmlBBData").text());
    swig.init({
      allowErrors: false,
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
        demographics: bb.demographics()[0],
        allergies: bb.allergies(),
        encounters: bb.encounters(),
        immunizations: bb.immunizations(),
        labs: bb.labs(),
        medications: bb.medications(),
        plan: bb.plan(),
        problems: bb.problems(),
        procedures: bb.procedures(),
        vitals: bb.vitals()
    });

    $(".bb-template").html(renderedHtml);
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
