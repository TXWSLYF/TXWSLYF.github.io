/**
 * Created by Alex on 2017/4/12.
 */
$(function () {
    var quoteText = "";
    var quoteAuthor= "";
    function getNewQuote() {
        $.ajax({
            url: "http://api.forismatic.com/api/1.0/",
            jsonp: 'jsonp',
            dataType: 'jsonp',
            data: {
                method: 'getQuote',
                lang: 'en',
                format: 'jsonp'
            },
            success: function(response) {
                quoteText = response.quoteText;
                quoteAuthor = response.quoteAuthor;
                console.log(response);
                $("#quoteText").text('\"' + quoteText + '\"');
                if (quoteAuthor) {
                    $("#quoteAuthor").text("————" + quoteAuthor);
                } else {
                    $("#quoteAuthor").text("———— Unknown");
                }
            }
        });
    }
    getNewQuote();
    $("#newQuoteBtn").on("click",getNewQuote);
    $("#shareToTwitter").on("click",function () {
        window.open('http://twitter.com/intent/tweet?text=' + encodeURIComponent(quoteText + ' ———— ' + quoteAuthor));
    })
});
