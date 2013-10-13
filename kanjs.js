$( document ).ready(function() {

    /* Make *sure* you load `data.js` first, in the HTML file! */
    //kanji = kanji.split('');
    kw = kw.split(',');

    /* Store tags as their own variables */
    var input_japanese = $('#input_japanese');
    var display = $('div#display');



    // Globals
    known_kanji = [];
    known_kw = [];
    known_hnum = [];
    known_location = [];

    /* When textarea is updated... */
    var update = function () {

        known_kanji = [];
        known_kw = [];
        known_hnum = [];
        known_location = [];

        var japanese = $('#input_japanese').val();
        var hnum = Number($("#heisig_index").val());
        var answer_table = $("<table/>", {id: "answer_table", border: 0});
        var input_table = $("<table/>", {id: "input_table", border: 0});

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

        for (j_cnt=0; j_cnt < total_known; j_cnt++) {
            // This is the generator
            // See http://blog.jbrantly.com/2010/04/creating-javascript-function-inside.html
            var target_fn = (function(kanji) {
                return function () {
                    //alert("I need you to type : "+kanji);
                    if (0==kanji.localeCompare(this.value)) {
                        alert("Yes!");}
                };
            })(kanji[j_cnt]);

            var kanjicell = $('<td/>');
            var kwcell = $('<td/>');

            $('<tr/>', {
                html: $('<td/>', {
                    html: $("<input/>",
                            {type:"text", size: 4,
                             value: kanji[j_cnt]
                            }).bind("input propertychange",
                                    target_fn)
                }).add($("<td/>", {
                    html: $("<input/>", {type:"text", size: 4,
                                         value: kw[j_cnt]
                                        })
                }))}).appendTo(input_table);

        }

        //debugger
        $('#number_known').text(total_known);
        $("#answers").html('');
        $("#answers").append(input_table);
        $("#answers").append(answer_table);
        display.text("Text again: " + japanese);
    };
    // Tie above update function to text area & heisig number inputs
    input_japanese.bind("input propertychange", update);
    $('#heisig_index').bind("input propertychange", update);
});
