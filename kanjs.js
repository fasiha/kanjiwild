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
        var table_html = $("<table/>", {id: "test_table"});
        $("#test_inputs").html('');
        $("#test_inputs").append(table_html);

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
                        text: kanji[j_cnt] + ", #" + j_cnt+1
                    }).add($("<td/>", {
                        text: kw[j_cnt]
                    }))}).appendTo(table_html);
                total_known++;
            };
        }

        //debugger
        $('#number_known').text(total_known);
        display.text("Text again: " + japanese);
    };
    // Tie above update function to text area & heisig number inputs
    input_japanese.bind("input propertychange", update);
    $('#heisig_index').bind("input propertychange", update);
});
