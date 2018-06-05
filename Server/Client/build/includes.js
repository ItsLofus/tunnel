/*global $*/
// Lmao this is not how the bundler works, just include the bundle and move on
const PROD = false;

var dependencies = [
    "bundle.js"
];

function loadDependencies(callback) {

    PROD ? $('<link>')
        .appendTo('head')
        .attr({
            type: 'text/css',
            rel: 'stylesheet',
            href: 'style.css'
        })

    : $('<link>')
        .appendTo('head')
        .attr({
            type: 'text/css',
            rel: 'stylesheet',
            href: '../css/style.css' // This isn't right
        });


    dependencies.forEach(function(library, i) {
        $.getScript(library, function() {
            if (i == dependencies.length - 1)
                if (typeof callback != "undefined")
                    callback();
        });
    });
}


$(function() {
    loadDependencies();
});
