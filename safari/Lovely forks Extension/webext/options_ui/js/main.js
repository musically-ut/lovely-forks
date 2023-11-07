/* jshint browser: true, es5: true, sub:true */

const DEBUG = false;
const STAR_THRES_KEY = 'STAR_THRES_KEY';
const INDENT_KEY = 'INDENT_KEY';
const LF_PREF_KEY = 'LF_PREF_KEY';
const DAYS_THRES_KEY = 'DAYS_THRES_KEY';

chrome.storage.local.get(LF_PREF_KEY, x => {
    x = x[LF_PREF_KEY] || {};
    const thres = x[STAR_THRES_KEY] || 1;
    const dayThres = x[DAYS_THRES_KEY] || 0;
    const indent = x[INDENT_KEY] || false;
    $('.js-star-threshold').val(thres);
    $('.js-days-threshold').val(dayThres);
    $('.js-to-indent').checkbox(indent ? 'set checked' : 'set unchecked');
});

function savePref() {
    const thres = $('.js-star-threshold').val() || 0;
    const dayThres = $('.js-days-threshold').val() || 0;
    const indent = $('.js-to-indent').checkbox('is checked') || false;
    const pref = {
        [INDENT_KEY]: indent,
        [STAR_THRES_KEY]: thres,
        [DAYS_THRES_KEY]: dayThres,
    };
    chrome.storage.local.set({[LF_PREF_KEY]: pref}, () => {
        if (DEBUG) {
            if (chrome.runtime.lastError) {
                console.log('Error occurred:', chrome.runtime.lastError);
            } else {
                console.log(`Pref set to ${JSON.stringify(pref)}.`);
            }
        }
    });
}

$('.js-to-indent.ui.checkbox').checkbox({onChange: savePref});
$('.js-star-threshold').on('change', savePref);
$('.js-days-threshold').on('change', savePref);
