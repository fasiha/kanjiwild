// Contains shared global state:
//
// - known-kanji: all kanji that the user wants to search for, based on Heisig
//     number or textual entry (a dictionary, with keys as kanji)
// - recognizable-kanji: subset of known-kanji that appears in the text the user
//     has currently input (an array)
// - unknown-kanji: the complementary set of input kanji that isn't in
//     recognizable-kanji. An array.
// - recognized-kanji: kanji that the user has previously indicated they
//     recognize. It needn't be a subset of recognizable-kanji or even
//     known-kanji
//     since both the input text as well as the Heisig number/etc. could have
//     changed. (A dictionary with keys as kanji.)
// We want to keep track of which kanji the user has previously marked as
// recognized even if it doesn't appear in the input text or in their list of
// "known" kanji so that they don't have to keep selecting it as any of the app
// inputs changes.
var app = {
    "known-kanji" : {},
    "recognizable-kanji" : [],
    "unknown-kanji" : [],
    "recognized-kanji" : {},
};

// Kanji regexp
var han = XRegExp('(\\p{Han})', 'g');

// Make *sure* you load `data.js` first! Build an array of keywords.
kw = kw.split(',');

// Build a dictionary with kanji as keys and numbers as values
var kanji2number = {};
for (var i = 0; i < kanji.length; i++) {
    kanji2number[kanji.charAt(i)] = i;
}

// Given a maximum Heisig number in RTK 1+3, build a dictionary whose keys are
// the kanji, with don't-care values. heisigNum should be a positive integer.
function buildKnownKanjiDictHeisig(heisigNum) {
    var dict = {};
    heisigNum = Math.min(heisigNum, kanji.length);
    for (var i = 0; i < heisigNum; i++) {
        dict[kanji.charAt(i)] = i;
    }
    return dict;
};

// Given a string containing kanji the user wishes to recognize, build a
// dictionary whose keys are kanji in the string, with arbitrary values.
// knownKanji is a string.
function buildKnownKanjiDictInput(knownKanjiString) {
    var dict = {};
    XRegExp.forEach(knownKanjiString, han,
                    function(match, idx) { dict[match[0]] = idx; });
    // var uniqueKanji = _.unique(knownKanjiString.match(han));
    return dict;
}

// Function that gets run whenever the recognition text has changed (or whenever
// the set of known kanji changes).
//
// Needs app['known-kanji'] to exist, so build a set of known kanji first (based
// on Heisig number or text input).
//
// This will take the input text, convert it to HTML (minor newline processing),
// and annotate each kanji with DOM classes indicating whether it's a kanji and
// if it ought to be recognizable.
//
// Also, very importantly, builds app['recognizable-kanji'], an array containing
// the intersection of the kanji in the input text and
// app['recognizable-kanji'], sorted in the same order as the kanji first appear
// in the input text. This can be an array because, while we use its sort order
// a couple of times (answer key, highlight all known), we don't ever have to
// look up kanji in it, because these are tied to the DOM via D3.
var japaneseInputChanged = function() {
    var text = d3.select('#input-japanese').property('value');

    // Do some basic, poor man's Markdown processing to at least respect line
    // breaks
    text = text.replace(/\n/g, '<br>\n');

    // Use app['recognizable-kanji'] as a dictionary for fast lookups, then
    // convert it to an array at the end. Clear this and regenerate it. We have
    // no use for kanji that were previously recognizeable (only kanji that were
    // previously recognized!).
    app['recognizable-kanji'] = {};

    // Find intersection of kanji that the user knows and kanji in the text.
    // Build the HTML representation of text: put all kanji in span tags with
    // classes that indicate their kanji-ness and whether or not they should be
    // known to the user.
    var html = XRegExp.replace(text, han, function(fullMatch, kanji, idx, str) {
        // If it's a kanji the user will recognize, tag it with
        // .recognizable-kanji and .known-kanji. Also insert it into
        // app['recognizable-kanji'] as a key and value being the earliest index
        // it appears. We'll convert it to a sorted array after we're done
        // building HTML.
        if (kanji in app['known-kanji']) {
            if (!(kanji in app['recognizable-kanji'])) {
                app['recognizable-kanji'][kanji] = idx;
            }
            return '<span class="any-kanji recognizable-kanji ' + kanji + '">' +
                   kanji + '</span>';
        }
        // Otherwise, just tag it with .any-kanji
        return '<span class="any-kanji ' + kanji + '">' + kanji + '</span>';
    }, 'all');
    // Convert the dictionary to an array, sorted by index of first appearance
    // in input text.
    app['recognizable-kanji'] =
        objectToKeysSortedArray(app['recognizable-kanji']);

    // Calculate some extra data for stats.
    var unknownKanji =
        _.difference(_.unique(text.match(han)), app['recognizable-kanji']);
    app['unknown-kanji'] = unknownKanji;

    // Render the resulting HTML
    d3.select("#redisplay").html(html);

    // For all the recognizable-kanji, classed as such, add a click-listener
    // that'll add it to app['recognized-kanji'] and then run updateRecognized()
    // which processes app['recognized-kanji'].
    d3.selectAll('.recognizable-kanji').on('click', function() {
        var thisKanji = d3.select(this).text();
        if (!(thisKanji in app['recognized-kanji'])) {
            app['recognized-kanji'][thisKanji] = 1;
        }
        updateRecognized();
    });

    // Note that this click-listener will only add keys to the app
    // ['recognized-kanji'] dictionary object. There may be kanji in there
    // that are no longer in app['recognizable-kanji'], i.e., the user might
    // have removed that kanji from the input or from the set of known kanji.
    // When there are kanji that the user has clicked as 'recognized' before
    // but that are no longer going to appear in the text or that they no
    // longer wish to treat as known, these will be indicated differently.
    // Therefore, run updateRecognized() here to make sure all kanji already
    // recognized are fresh with respect to the changes in this function.
    updateRecognized();

    // Recall that this function runs whenever the input text changes or when
    // the set of known kanji changes, so in both of those cases, we need to
    // update the answer key.
    buildAnswerKey();
};

// This function gets run whenever app['recognized-kanji'] or
// app['recognizable-kanji'] changes. Note two things in the previous sentence:
// "or" and "changes".
//
// This function is run when *either* of those dictionaries changes.
// app['recognized-kanji'] has kanji for keys, which the user has previously
// indicated as recognized; app['recognizable-kanji'] is an array containing
// kanji that appear in the input text that the user ought to recognize. The
// latter can change when the user changes the input text, or even the set of
// known kanji (changing the Heisig number, etc.). Kanji that are in
// app['recognized-kanji'] but not in app['recognizable-kanji'] will be given
// the DOM class "recognized-kanji-not-currently-recognizable" (maybe colored
// yellow).
//
// This function is run when either of those dictionaries *changes*. Kanji keys
// may be added or removed quite freely without becoming inconsistent. This
// function will ensure that the DOM display reflects the unstructured ways that
// these two dictionaries may change.
function updateRecognized() {
    // This function does a lot of work, in that it reduces everything to some
    // known base state and then treats anything that needs special treatment.
    // So it does some wasteful work but I think that leads to understandeable
    // code. If performance ever becomes an issue, it can be addressed then.

    // Display stats!
    var recognizedInText = _.intersection(_.keys(app['recognized-kanji']),
                                          app['recognizable-kanji']);

    var stats = d3.select("#stats");
    var numUnknown = app['unknown-kanji'].length;
    var numRecognizable = app['recognizable-kanji'].length;
    var numTotalKanji = numUnknown + numRecognizable;
    var numLeftToRecognize = numRecognizable - recognizedInText.length;
    stats.html("");
    var list = stats.append("ul");
    var appendToList = function(s) { list.append("li").text(s); };
    appendToList("Number of kanji you ought to know in input text: " +
                 numRecognizable +
                 ((numLeftToRecognize == 0)
                      ? " (all found!)"
                      : (" (" + (numLeftToRecognize == numRecognizable
                                     ? "all"
                                     : numLeftToRecognize) +
                         " remain to be found)")));
    appendToList("Total number of kanji in input text, known and unknown: " +
                 numTotalKanji);
    appendToList("Total number of kanji you know: " +
                 _.keys(app['known-kanji']).length);
    if (numUnknown > 0) {
        appendToList("Number of kanji you need to learn to read input text: " +
                     numUnknown);
    }

    d3.select('#redisplay-stats').html(
        (recognizedInText.length == numRecognizable
             ? "All " + recognizedInText.length
             : recognizedInText.length) +
        " kanji found, " +
        (numLeftToRecognize > 0 ? numLeftToRecognize : "none") + " left!");

    // Add some instructions:
    d3.select("#recognition-instructions").text(
        _.isEmpty(app['recognized-kanji']) ? ""
                                           : "Enter English keywords here:");

    // In the redisplay (the thing that you click on to select kanji), remove
    // the ".recognized-kanji" class from all kanji, then add it back to ones
    // that have been previously recognized. (Some previously recognized kanji
    // may not be available in the current input text, it doesn't matter, those
    // D3 CSS selections will just be empty.)
    d3.selectAll('.any-kanji').classed('recognized-kanji', false);
    recognizedInText.forEach(function(aKanji) {
        d3.selectAll('.any-kanji.' + aKanji).classed('recognized-kanji', true);
    });

    // All the D3 data-binding magic happens here, in the recognition section,
    // which displays the kanji you've recognized with a box for keywords. The
    // data array is the kanji that are both recognizable *and* previously-
    // recognized (set intersection). Kanji that are no longer recognizable
    // (not in input text, or in the set of known kanji) are still there in the
    // DOM, and will have to be classed with
    // '.recognized-kanji-not-currently-recognizable'; we access these elements
    // via D3's exit() method. Then kanji that are newly recognized, which don't
    // exit in the DOM, are accessed via enter(), and are added to the DOM.
    //
    // But first, find the existing div DOM elements and bind the new array to
    // them. The kanji is used as the data key.
    var data = d3.select('#recognition').selectAll('div').data(
        recognizedInText, function(d) { return d; });

    // For ALL the DOM elements bound to data (even ones that are missing from
    // the current data array), add the '.recognized-kanji' class, and then
    // for the DOM elements that don't match any current data element (via
    // D3's exit()), remove that class.
    data.classed({
        'recognized-kanji' : true,
        'recognized-kanji-not-currently-recognizable' : false
    });
    data.exit().classed({
        'recognized-kanji' : false,
        'recognized-kanji-not-currently-recognizable' : true
    });
    // Now, kanji with class '.recognized-kanji-not-currently-recognizable' can
    // be colored yellow or something like that.

    // For data elements that don't yet have a DOM entry, create them. They will
    // be inside <div> tags, with a <span> tag containing the kanji, an <input>
    // tag for the keyword, and another <span> tag containing a button to delete
    // this kanji from app['recognized-kanji'].
    var newDivs = data.enter().append("div").classed({
        'recognized-container' : true,
        'recognized-kanji' : true,
        'recognized-kanji-not-currently-recognizable' : false
    });

    newDivs.append("span")
        .property({
            "id" : function(d) { return "recognized-" + d; },
        })
        .attr('class', function(d) { return d; })
        .classed({'kanji-for-recognition' : true})
        .text(function(d) { return d; });

    newDivs.append("form")
        .classed('pure-form', true)
        .append("input")
        .property({
            type : "text",
            size : "10",
        })
        .on("input", function(d) {
            var thisKw = this.value.toLowerCase();
            _foo = this;
            if (thisKw === kw[kanji2number[d]].toLowerCase()) {
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

    newDivs.append('span').text('×').classed('like-link', true).on('click',
                                                                   function(d) {
        this.parentNode.remove();
        delete app['recognized-kanji'][d];
        updateRecognized();
    });
}

function objectToKeysSortedArray(obj) {
    return _.sortBy(_.keys(obj), function(key) { return obj[key]; });
}

function buildAnswerKey() {
    var data = d3.select("#answers").selectAll("p").data(
        app['recognizable-kanji'], function(d) { return d; });

    data.exit().remove();

    var ps = data.enter().append("p").text(
        function(d) { return d + " " + kw[kanji2number[d]]; });
}

$(document).ready(function() {

    // When the input text changes, ...
    d3.select("#input-japanese").on('input', japaneseInputChanged);
    //$("#input-japanese").bind('input propertychange', japaneseInputChanged);

    // Helper function to attach a listener to an input field when an
    // appropriate radio box is enabled
    function inputAndRadioAddListener(inputSelector, radioSelector, func) {
        var innerFunc = function() {
            if (d3.select(radioSelector).property('checked')) {
                app['known-kanji'] =
                    func(d3.select(inputSelector).property('value'));
                japaneseInputChanged();
            }
        };
        d3.select(inputSelector).on('click', function() {
            d3.select(radioSelector).property('checked', true);
            innerFunc();
        });
        d3.select(inputSelector).on('input', innerFunc);

        d3.select(radioSelector).on('click', innerFunc);
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

    d3.select('button#recognize-kanji-button').on('click', function() {
        // This turns out to not change the sort order of kanjiSortedArray,
        // which is great!
        app['recognized-kanji'] = _.invert(_.union(
            _.keys(app['recognized-kanji']), app['recognizable-kanji']));
        updateRecognized();
    });

    // Toggle answer key functionality
    d3.select("button#show-answers").on('click', function() {
        var current = d3.select('div#answers').classed('hidden-item');
        d3.select('div#answers').classed('hidden-item', !current);
    })

});
