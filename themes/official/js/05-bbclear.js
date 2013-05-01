/* Blue Button Reference Implementation
   Copyright (c) 2013 by M. Jackson Wilkinson.
   License: Apache */

function isInt(input){
    return parseInt(input, 10) % 1 === 0;
}

var filters = {
    isolanguage: function(input){
        if(input.length >= 2){
            code = input.substr(0,2);
            return isoLangs[code];
        }else{
            return input;
        }
    },

    since_days: function(input, days){
        batch = [];
        today = new Date();
        target_date = new Date(today.setDate(today.getDate() - days));

        for (var k in input){
            if (isInt(k)){
                if (input[k].effective_time && input[k].effective_time.low && input[k].effective_time.low > target_date){
                    batch.push(input[k]);
                }else if(input[k].date && input[k].date > target_date){
                    batch.push(input[k]);
                }
            }
        }

        return batch;
    },

    strict_length: function(input){
        return input.length;
    },

    fallback: function(input, output){
        return input ? input : output;
    },

    age: function(date){
        today = new Date();
        ms = today - date;
        years = ms / (1000*60*60*24*365);
        return Math.floor(years);
    },

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
                dates = [input.date_range.start.toDateString(), input.date_range.end.toDateString()];
            }
            for (var k in batch){
                if (typeof k == "number"){
                    target = batch[k];
                    if(target.date instanceof Date){
                        target_date = [target.date.toDateString()];
                    }else{
                        target_dates = [target.date_range.start.toDateString, target.date_range.end.toDateString()];
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
            if($.inArray(n, comparand) == -1){
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

            if ($.inArray(val, keyList) < 0){
                keyList.push(val);
            }
        }
        for (var j in keyList){
            var item = {};
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
        return end ? input.slice(start, end) : input.slice(start);
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
        if(input){
            if(input.match(/10\+\d\//g)){
                base = input.split('/')[0].split('+')[0];
                exp = input.split('/')[0].split('+')[1];
                unit = input.split('/')[1];
                str = base + "<sup>" + exp + "</sup>/" + unit;
                return str;
            }else if (input == '1' || input == 1){
                return "";
            }else{
                return input;
            }
        }
        return input;
    },

    full_name: function(input){
        if(typeof input.given == 'undefined'){
            return "John Doe";
        }
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
            severe = 0,
            exists = 0;

        if(input.severity){
            if (input.severity.match(/severe/i)){
                severe++;
            }else if (input.severity.match(/moderate/i)){
                moderate++;
            }else if (input.severity.match(/mild/i)){
                mild++;
            }else{
                exists++;
            }
        } else {
            for (i in input){
                if (isInt(i)){
                    if(input[i].severity){
                        if (input[i].severity.match(/severe/i)){
                            severe++;
                        }else if (input[i].severity.match(/moderate/i)){
                            moderate++;
                        }else if (input[i].severity.match(/mild/i)){
                            mild++;
                        }else{
                            exists++;
                        }
                    }else{
                        exists++;
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
            return exists === 0 ? "no" :
                   exists > 1 ? "multiple" : "";
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
        $(".bb-template").fadeIn();
    });
}

function scrollToElement(element){
    $('html,body').animate({scrollTop: element.offset().top},'slow');
}

$(function(){
    $("#loader").fadeIn(function(){
        text = $.text($("script#xmlBBData"));
        bb = BlueButton(text);
        init_template();
    });

    $(document).on('click', 'nav a', function(){
        destination = $(this).attr('href');
        scrollToElement($(destination));
        return false;
    });
});

isoLangs = {
    "ab": "Abkhaz",
    "aa": "Afar",
    "af": "Afrikaans",
    "ak": "Akan",
    "sq": "Albanian",
    "am": "Amharic",
    "ar": "Arabic",
    "an": "Aragonese",
    "hy": "Armenian",
    "as": "Assamese",
    "av": "Avaric",
    "ae": "Avestan",
    "ay": "Aymara",
    "az": "Azerbaijani",
    "bm": "Bambara",
    "ba": "Bashkir",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bh": "Bihari",
    "bi": "Bislama",
    "bs": "Bosnian",
    "br": "Breton",
    "bg": "Bulgarian",
    "my": "Burmese",
    "ca": "Catalan",
    "ch": "Chamorro",
    "ce": "Chechen",
    "ny": "Chichewa",
    "zh": "Chinese",
    "cv": "Chuvash",
    "kw": "Cornish",
    "co": "Corsican",
    "cr": "Cree",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "dv": "Divehi",
    "nl": "Dutch",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "ee": "Ewe",
    "fo": "Faroese",
    "fj": "Fijian",
    "fi": "Finnish",
    "fr": "French",
    "ff": "Fula",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek, Modern",
    "gn": "Guarani",
    "gu": "Gujarati",
    "ht": "Haitian",
    "ha": "Hausa",
    "he": "Hebrew (modern)",
    "hz": "Herero",
    "hi": "Hindi",
    "ho": "Hiri Motu",
    "hu": "Hungarian",
    "ia": "Interlingua",
    "id": "Indonesian",
    "ie": "Interlingue",
    "ga": "Irish",
    "ig": "Igbo",
    "ik": "Inupiaq",
    "io": "Ido",
    "is": "Icelandic",
    "it": "Italian",
    "iu": "Inuktitut",
    "ja": "Japanese",
    "jv": "Javanese",
    "kl": "Greenlandic",
    "kn": "Kannada",
    "kr": "Kanuri",
    "ks": "Kashmiri",
    "kk": "Kazakh",
    "km": "Khmer",
    "ki": "Kikuyu",
    "rw": "Kinyarwanda",
    "ky": "Kirghiz",
    "kv": "Komi",
    "kg": "Kongo",
    "ko": "Korean",
    "ku": "Kurdish",
    "kj": "Kwanyama",
    "la": "Latin",
    "lb": "Luxembourgish",
    "lg": "Luganda",
    "li": "Limburgish",
    "ln": "Lingala",
    "lo": "Lao",
    "lt": "Lithuanian",
    "lu": "Luba-Katanga",
    "lv": "Latvian",
    "gv": "Manx",
    "mk": "Macedonian",
    "mg": "Malagasy",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "mh": "Marshallese",
    "mn": "Mongolian",
    "na": "Nauru",
    "nv": "Navajo",
    "nb": "Norwegian Bokmal",
    "nd": "North Ndebele",
    "ne": "Nepali",
    "ng": "Ndonga",
    "nn": "Norwegian Nynorsk",
    "no": "Norwegian",
    "ii": "Nuosu",
    "nr": "South Ndebele",
    "oc": "Occitan",
    "oj": "Ojibwe",
    "cu": "Old Church Slavonic",
    "om": "Oromo",
    "or": "Oriya",
    "os": "Ossetian",
    "pa": "Panjabi",
    "pi": "Pali",
    "fa": "Persian",
    "pl": "Polish",
    "ps": "Pashto",
    "pt": "Portuguese",
    "qu": "Quechua",
    "rm": "Romansh",
    "rn": "Kirundi",
    "ro": "Romanian",
    "ru": "Russian",
    "sa": "Sanskrit",
    "sc": "Sardinian",
    "sd": "Sindhi",
    "se": "Northern Sami",
    "sm": "Samoan",
    "sg": "Sango",
    "sr": "Serbian",
    "gd": "Gaelic",
    "sn": "Shona",
    "si": "Sinhalese",
    "sk": "Slovak",
    "sl": "Slovene",
    "so": "Somali",
    "st": "Southern Sotho",
    "es": "Spanish",
    "su": "Sundanese",
    "sw": "Swahili",
    "ss": "Swati",
    "sv": "Swedish",
    "ta": "Tamil",
    "te": "Telugu",
    "tg": "Tajik",
    "th": "Thai",
    "ti": "Tigrinya",
    "bo": "Tibetan,",
    "tk": "Turkmen",
    "tl": "Tagalog",
    "tn": "Tswana",
    "to": "Tonga",
    "tr": "Turkish",
    "ts": "Tsonga",
    "tt": "Tatar",
    "tw": "Twi",
    "ty": "Tahitian",
    "ug": "Uighur",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "uz": "Uzbek",
    "ve": "Venda",
    "vi": "Vietnamese",
    "vo": "Volapuk",
    "wa": "Walloon",
    "cy": "Welsh",
    "wo": "Wolof",
    "fy": "Western Frisian",
    "xh": "Xhosa",
    "yi": "Yiddish",
    "yo": "Yoruba",
    "za": "Zhuang"
};
