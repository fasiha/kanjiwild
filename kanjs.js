$( document ).ready(function() {

    // Make *sure* you load `data.js` first, in the HTML file! That
    //JavaScript file will load keywords as a single huge
    //comma-separated string, so split it at commas. The kanji is also
    //a single 3029-long string of kanji, but don't split that into an
    //array, leave it as a string.
    kw = kw.split(',');
    // Leave the kanji as a string // kanji = kanji.split('');

    /* Store tags as their own variables */
    var input_japanese = $('#input_japanese');
    var display = $('div#display');

    /* Hide the test, render it visible as soon as test text is entered */
    $("#test").css("visibility", "hidden");

    /* There are two major functions here. `update_input_text` reads
     the Japanese input as well as the Heisig number entered, finds the
     relevant kanji, and populates four arrays:

     1- known_kanji, containing kanji,
     2- known_kw, their associated keywords,
     3- known_hnum, the associated Heisig number,
     4- known_location, the position of the kanji in the input string.

     The second major function is called `check_answers` and is
     defined *inside* `update_input_text`. It is the callback
     triggered upon changes to the textboxes that accept the
     individual kanji and keywords (together called the "questions" of
     the application).
     */

    /* When textarea is updated... */
    var update_input_text = function () {
        // Enable visibility of the test section
        $("#test").css("visibility", "visible");

        // These arrays store the relevant input kanji and related data
        var known_kanji = [];
        var known_kw = [];
        var known_hnum = [];
        var known_location = [];

        // The text input
        var japanese = input_japanese.val();

        // The Heisig number you've learned
        var hnum = Number($("#heisig_index").val());

        // These two tables are the "question" and "answers" tables
        var answer_table = $("<table/>", {id: "answer_table", border: 0});
        var input_table = $("<table/>", {id: "input_table", border: 0});

        // Now, find all the kanji in the input that you know,
        // populate the `known_kanji` and associated arrays, and
        // populate `answer_table` with the answer key.
        var j_cnt, total_known=0;
        for (j_cnt=0; j_cnt<hnum; j_cnt++) {
            var idx = japanese.indexOf(kanji[j_cnt]);
            if (idx >= 0) {
                known_kanji.push(kanji[j_cnt]);
                known_hnum.push(j_cnt+1);
                known_kw.push(kw[j_cnt]);
                known_location.push(idx);

                $('<tr/>', {
                    html: $('<td/>', {
                        text: kanji[j_cnt] + ", #" + String(j_cnt+1)
                    }).add($("<td/>", {
                        text: kw[j_cnt]
                    }))}).appendTo(answer_table);
                total_known++;
            };
        }

        // Showing all kanji or keywords?
        var show_kanji = $('#show-all-kanji')[0].checked;
        var show_kw = $('#show-all-kw')[0].checked;

        // This function is the second major function here. This will
        // get invoked when "questions" section of the application is
        // changed. It will build a list of kanji you've input, and if
        // it's one of the kanji the app expects you to know, it'll
        // mark it green, otherwise red. For each kanji it marks
        // green, it checks the associated English Heisig keyword and
        // makes sure it matches.
        var check_answers = function() {
            var kwleft = total_known;
            var kwlist = $('input.qkw_in');
            var kanji_answers=[];
            // Also possible: `push(val.value)` and
            // `push($(val).attr("value"))`
            $('input.qkanji_in').each(function(i, val) {
                var knownidx = known_kanji.indexOf(this.value);
                if (knownidx>=0) {
                    kanji_answers.push(this.value);
                    $(this).css("color", "green");

                    // Check keyword
                    if (0 == kwlist[i].value.localeCompare(known_kw[knownidx])) {
                        $(kwlist[i]).css("color", "green");
                        kwleft--;
                    }
                    else {
                        $(kwlist[i]).css("color", "red");
                    }
                }
                else {
                    $(this).css("color", "red");
                }
            });

            // Update the HTML element indicating # left and correct
            var nkanji_right = $.unique(kanji_answers).length;
            $('#kanji_number_left').text(total_known - nkanji_right);
            $('#kw_number_left').text(kwleft);
        };

        // The above `check_answers` function is bound to the input
        // textboxes that accept kanji and keywords. Here, we build
        // that table of inputs, one row for each kanji that you
        // should know.
        for (j_cnt=0; j_cnt < total_known; j_cnt++) {
            $('<tr/>', {
                html:
                $('<td/>', {"class": "question_kanji",
                            html: $("<input/>", {
                                type:"text", size: 4,
                                'class':'qkanji_in',
                                value: show_kanji ? known_kanji[j_cnt] : ""
                            }).bind("input propertychange", check_answers)
                           }).add(
                $("<td/>", {"class":"question_kw",
                            html: $("<input/>",
                                    {type:"text", size: 4,
                                     'class':'qkw_in',
                                     value: show_kw ? known_kw[j_cnt] : ""
                                    }).bind("input propertychange", check_answers)}))
            }).appendTo(input_table);
        }

        // Final tweaks of the HTML itself with some values, now known
        display.text(japanese).css("font-weight", "bold");
        $('#number_known').text(total_known);
        $('#kanji_number_left').text(total_known);
        $('#kw_number_left').text(total_known);

        $("#answers").html('');
        $("#questions").html('');

        $("#questions").append(input_table);
        $("#answers").append(answer_table);
    };

    // Bind the above callback to both the practice input and the
    // Heisig number input
    input_japanese.bind("input propertychange", update_input_text);
    $('#heisig_index').bind("input propertychange", update_input_text);
    $('#show-all-kanji').change(update_input_text);
    $('#show-all-kw').change(update_input_text);

    // A minor issue: make the answer key hidden by default and enable
    // you to toggle it.
    var toggle_answer_key = function(obj) {
        var ans = $('div#answers');
        var currently = ans.css("visibility");
        if (0 == currently.localeCompare("visible")) {
            ans.css("visibility", "hidden");
        }
        else {
            ans.css("visibility", "visible");
        }
    };
    $('div#answers').css("visibility", "hidden");
    $('span#toggle_answer_button').click(toggle_answer_key);

    // Finally, create a little fun-function to test kanji in the Javascript
    // console!
    function getrand(items) {
        return items[Math.floor(Math.random() * items.length)];
    }
    function randkw(n) {return getrand(kw.slice(0, n));}
    function randkanji(n) {return getrand(kanji.slice(0, n));}
    // To play, call randkw(743) (replacing 743 with whatever Heisig number
    // you're on) to get a random keyword.
});
