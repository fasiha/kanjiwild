$( document ).ready(function() {
    kanji = kanji.split('');
    kw = kw.split(',');

    var input_japanese = $('#input_japanese');
    var display = $('div#display');
    // Your code here.
    input_japanese.bind("input propertychange", function() {
        $('div#display').text("whatever");
    });

});
