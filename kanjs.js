$( document ).ready(function() {

    /* Make *sure* you load `data.js` first, in the HTML file! */
    //kanji = kanji.split('');
    kw = kw.split(',');

    /* Store tags as their own variables */
    var input_japanese = $('#input_japanese');
    var display = $('div#display');

    var hnum = Number($("#heisig_index").val());

    // Globals
    known_kanji = [];
    known_kw = [];
    known_hnum = [];
    known_location = [];

    /* When textarea is updated... */
    input_japanese.bind("input propertychange", function() {

        known_kanji = [];
        known_kw = [];
        known_hnum = [];
        known_location = [];

        var japanese = $('#input_japanese').val();
        var table_html = "<table>";

        var j_cnt, total_known=0;
        for (j_cnt=0; j_cnt<hnum; j_cnt++) {
            var idx = japanese.indexOf(kanji[j_cnt]);
            if (idx >= 0) {
                known_kanji.push(kanji[j_cnt]);
                known_hnum.push(j_cnt+1);
                known_kw.push(kw[j_cnt]);
                known_location.push(idx);

                table_html += '<tr><td>' + kanji[j_cnt] + ', #'
                    + (j_cnt+1) + '</td><td><input type="text" \
                size="15" class="answer" value="'
                    + kw[j_cnt] + '"></td></tr>';
                total_known++;
            };
        }

        table_html+="</table>";

        //debugger
        $('#number_known').text(total_known);
        $("#test_inputs").html(table_html);
        display.text("Text again: " + japanese);

    });

});
