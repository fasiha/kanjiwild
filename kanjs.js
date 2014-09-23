// Contains shared global state
var app = {"recognized-kanji" : {}};

// Kanji regexp
var han = XRegExp('(\\p{Han})', 'g');

// Make *sure* you load `data.js` first! Build an array of keywords.
kw = kw.split(',');

// Build a dictionary with kanji as keys and numbers as values
var kanji2number = {};
for (var i = 0; i < kanji.length; i++) {
    kanji2number[kanji.charAt(i)] = i;
}

// heisigNum >= 1
var buildKnownKanjiDictHeisig = function(heisigNum) {
    var dict = {};
    heisigNum = Math.min(heisigNum, kanji.length);
    for (var i = 0; i < heisigNum; i++) {
        dict[kanji.charAt(i)] = i;
    }
    return dict;
};

// knownKanji is a string
var buildKnownKanjiDictInput =
    function(knownKanjiString) {
        var dict = {};
        XRegExp.forEach(knownKanjiString, han,
                        function(match, idx) { dict[match] = idx; });
        // var uniqueKanji = _.unique(knownKanjiString.match(han));
        return dict;
    }

var japaneseInputChanged = function() {
    if (app['known-kanji'] === undefined) {
        console.error("Warning: can't parse input without set of known kanji.");
        return;
    }
    var text = d3.select('#input-japanese').property('value');

    var recognizableDict = {};
    var recognizableArr = [];
    // var uniqueKanji = _.unique(text.match(han));
    var html = XRegExp.replace(text, han, function(fullMatch, kanji, idx, str) {
        if (kanji in app['known-kanji']) {
            if (!(kanji in recognizableDict)) {
                recognizableDict[kanji] = idx;
                recognizableArr.push({kanji : kanji, firstAppearance : idx});
            }

            return '<span class="any-kanji known-kanji ' + kanji + '">' +
                   kanji + '</span>';
        }
        return '<span class="any-kanji ' + kanji + '">' + kanji + '</span>';
    }, 'all');
    d3.select("#redisplay").html(html);
    app['recognizable-kanji'] = recognizableArr;
    // app['recognized-kanji'] = {};

    d3.selectAll('.known-kanji').on('click', function() {
        var thisKanji = this.innerText;
        if (!(thisKanji in app['recognized-kanji'])) {
            app['recognized-kanji'][thisKanji] = 1;
        }
        updateRecognized();
    });

    showAllRecognizable();
    updateRecognized();
};

// need some way of deleting recognized kanji via DOM from DOM &
// app['recognized-kanji']
function updateRecognized() {
    // turn all off then selectively turn some on ***in the redisplay***
    d3.selectAll('.any-kanji').classed('recognized-kanji', false);
    _.intersection(_.keys(app['recognized-kanji']),
                   _.pluck(app['recognizable-kanji'], 'kanji'))
        .forEach(function(aKanji) {
        d3.selectAll('.any-kanji.' + aKanji).classed('recognized-kanji', true);
    });

    // In *recognition* section, update the recognized-but-not-in-text blocks
    // manually. This is because data.enter()/.exit() won't do anything when we
    // have all the kanji already in app['recognized-kanji'] and go from Heisig
    // number 1 to 2200.
     _.difference(_.keys(app['recognized-kanji']),
                 _.pluck(app['recognizable-kanji'], 'kanji'))
        .forEach(function(aKanji) {
        d3.selectAll('#recognition .' + aKanji).classed({
            'recognized-kanji' : false,
            'recognized-kanji-not-in-text' : true
        });
    });
    _.intersection(_.keys(app['recognized-kanji']),
                 _.pluck(app['recognizable-kanji'], 'kanji'))
        .forEach(function(aKanji) {
        d3.selectAll('#recognition .' + aKanji).classed({
            'recognized-kanji' : true,
            'recognized-kanji-not-in-text' : false
        });
    });

    // Update the keyword input area
    var data = d3.select('#recognition').selectAll('p').data(
        _.intersection(_.keys(app['recognized-kanji']),
                       _.pluck(app['recognizable-kanji'], 'kanji')),
        function(d) { return d; });

    var ps = data.enter().append("p");
    ps.append("span")
        .property({
            "id" : function(d) { return "recognized-" + d; },
        })
        .attr('class', function(d) { return d; })
        .classed({
            'recognized-kanji' : true,
            'recognized-kanji-not-in-text' : false
        })
        .text(function(d) { return d + " "; });

    ps.append("input")
        .property({
            type : "text",
            size : "10",
                   // this isn't the answer key!
                   // value : function(d) { return kw[kanji2number[d]]; },
        })
        .on("input", function(d) {
            var thisKw = this.value;
            _foo = this;
            if (thisKw === kw[kanji2number[d]]) {
                // Don't bother telling EVERYONE you've now correctly added
                // keyword:
                // d3.selectAll('.recognized-kanji.' +
                // d).classed('recognized-keyword', true);

                // Mark this input box as recognized-keyword
                this.classList.add('recognized-keyword');
            } else {
                this.classList.remove('recognized-keyword');
            }
        });
}

function showAllRecognizable() {
    var data = d3.select("#answers").selectAll("p").data(
        app['recognizable-kanji'], function(d) { return d.kanji; });

    data.exit().remove();

    var ps = data.enter().append("p").text(
        function(d) { return d.kanji + " " + kw[kanji2number[d.kanji]]; });
}

$(document).ready(function() {

    // When the input text changes, ...
    d3.select("#input-japanese").on('input', japaneseInputChanged);
    //$("#input-japanese").bind('input propertychange', japaneseInputChanged);

    // Helper function to attach a listener to an input field when an
    // appropriate radio box is enabled
    function inputAndRadioAddListener(inputSelector, radioSelector, func) {
        d3.select(inputSelector).on('input', function() {
            if (d3.select(radioSelector).property('checked')) {
                app['known-kanji'] =
                    func(d3.select(inputSelector).property('value'));
                japaneseInputChanged();
            }
        });
    }
    inputAndRadioAddListener("#heisig-number", "#use-heisig-number",
                             function(x) {
        var heisigInt = parseInt(x);
        if (isNaN(heisigInt) || (heisigInt <= 0)) {
            return {};
        }
        return buildKnownKanjiDictHeisig(heisigInt);
    });
    inputAndRadioAddListener("#custom-kanji-list", "#use-kanji-list",
                             buildKnownKanjiDictInput);

    // Set up app['known-kanji'] for the HTML default:
    app['known-kanji'] = buildKnownKanjiDictHeisig(
        parseInt(d3.select("#heisig-number").property('value')));
    // Run once
    japaneseInputChanged();

    // If you click on the custom kanji box, select its radio button
    d3.select("#custom-kanji-list").on('click', function() {
        d3.select("#use-kanji-list").property('checked', true);
    });
    // And similarly for the Heisig number box
    d3.select("#heisig-number").on('click', function() {
        d3.select("#use-heisig-number").property('checked', true);
    });

    d3.select('#recognize-kanji-button').on('click', function() {
        app['recognized-kanji'] =
            _.invert(_.union(_.keys(app['recognized-kanji']),
                             _.pluck(app['recognizable-kanji'], 'kanji')));
        updateRecognized();
    })

});
