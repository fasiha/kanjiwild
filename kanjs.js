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

        // This function will get invoked when inputs table is touched
        var retfun = function() {
            var kanji_answers=[];
            // Also possible: `push(val.value)` and
            // `push($(val).attr("value"))`
            $('input.qkanji_in').each(function(i, val) {
                if (known_kanji.indexOf(this.value)>=0) {
                    kanji_answers.push(this.value);
                    $(this).css("color", "green");
                }
                else {
                    $(this).css("color", "red");
                }
            });

            var nkanji_right = $.unique(kanji_answers).length;
            $('#number_left').text(total_known - nkanji_right);
        };


        for (j_cnt=0; j_cnt < total_known; j_cnt++) {
            $('<tr/>', {
                html:
                $('<td/>', {"class": "question_kanji",
                            html: $("<input/>", {
                                type:"text", size: 4,
                                'class':'qkanji_in',
                                value: ""//known_kanji[j_cnt]
                            }).bind("input propertychange", retfun)
                           }).add(
                $("<td/>", {"class":"question_kw",
                            html: $("<input/>",
                                    {type:"text", size: 4,
                                     'class':'qkw_in',
                                     value: known_kw[j_cnt]
                                    })}))
            }).appendTo(input_table);

        }

        //debugger
        display.text("Text again: " + japanese);
        $('#number_known').text(total_known);
        $('#number_left').text(total_known);

        $("#answers").html('');
        $("#questions").html('');

        $("#questions").append(input_table);
        $("#answers").append(answer_table);
    };

    // Tie above update function to text area & heisig number inputs
    input_japanese.bind("input propertychange", update);
    $('#heisig_index').bind("input propertychange", update);
});
