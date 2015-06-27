'use strict';
/*jshint browser: true, es5: true, sub:true */

var pathComponents = window.location.pathname.split('/');
var _logName = 'github-forks-extension:';
var lovelyForksClass = 'lovely-forks-addon-class';
var DEBUG = false;

function emptyElem(elem) {
    while(elem.firstChild) {
        elem.removeChild(elem.firstChild);
    }
    return elem;
}

function findLovelyForksSpan() {
    return document.querySelector('.' + lovelyForksClass);
}

function createLoadingIndicator() {
    // If the layout of the page changes, we'll have to change this location.
    // We should make sure that we do not accidentally cause errors here.
    var h1s = document.querySelectorAll('.entry-title');
    if (h1s.length > 0) {
        try {
            var loadingSpan = document.createElement('span');
            // Stealing the styling from Github fork-info
            loadingSpan.classList.add('fork-flag', lovelyForksClass);
            loadingSpan.appendChild(document.createTextNode('loading ...'));
            h1s[0].appendChild(loadingSpan);
        } catch (e) {
            console.error(_logName,
                          'Error appending data to DOM',
                          e);
        }
    } else {
        console.warn(_logName,
                     'Looks like the layout of the Github page has changed.');
    }
}

function safeUpdateDOM(cb, actionName) {
    // We should make sure that we do not accidentally cause errors here.
    var loadingSpan = findLovelyForksSpan();
    if (loadingSpan !== null) {
        try {
            cb(loadingSpan);
        } catch (e) {
            console.error(_logName,
                          'Error appending data to DOM', e,
                          'during action', actionName);
        }
    } else {
        console.warn(_logName,
                     'Unable to find the lovely-forks loading indicator',
                     'during action', actionName);
    }
}

function showDetails(fullName, url, numStars) {
    return function (loadingSpan) {
        var starIcon = document.createElement('span');
        starIcon.classList.add('octicon', 'octicon-star');
        starIcon.style.lineHeight = 0; // for alignment
        starIcon.style.fontSize = '1.2em';

        var forkA = document.createElement('a');
        forkA.href = url;
        forkA.appendChild(document.createTextNode(fullName));

        var forkSpan = emptyElem(loadingSpan);
        forkSpan.appendChild(document.createTextNode('also forked to '));
        forkSpan.appendChild(forkA);
        forkSpan.appendChild(document.createTextNode(' '));
        forkSpan.appendChild(starIcon);
        forkSpan.appendChild(document.createTextNode(numStars));
    };
}

function showNoForks(loadingSpan) {
    var forkSpan = emptyElem(loadingSpan);
    forkSpan.appendChild(document.createTextNode('no notable forks'));
}

function showError(loadingSpan) {
    var forkSpan = emptyElem(loadingSpan);
    forkSpan.appendChild(document.createTextNode('no information'));
}

function makeDataURL(user, repo) {
    return 'https://api.github.com/repos/' +
                  user + '/' + repo + '/forks?sort=stargazers';
}

if (pathComponents.length >= 3) {
    var user = pathComponents[1], repo = pathComponents[2];
    var dataURL = makeDataURL(user, repo);
    var xhr = new XMLHttpRequest();

    // Show the loading indicator
    createLoadingIndicator();

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var allForks = JSON.parse(xhr.responseText);
                    if (!allForks || allForks.length < 1) {
                        if (DEBUG) {
                            console.log(_logName,
                                        'Repository does not have any forks.');
                        }
                        safeUpdateDOM(showNoForks, 'no forks');
                        return;
                    }

                    var mostStarredFork = allForks[0],
                        starGazers = mostStarredFork['stargazers_count'];

                    if (!starGazers) {
                        if (DEBUG) {
                            console.log(_logName,
                                        'Repo has only zero starred forks.');
                        }
                        safeUpdateDOM(showNoForks, 'no notable forks');
                        return;
                    }

                    var forkUrl = mostStarredFork['html_url'],
                        fullName = mostStarredFork['full_name'];

                    safeUpdateDOM(showDetails(fullName, forkUrl, starGazers),
                                  'showing details');
                } catch (e) {
                    console.warn(_logName,
                                 'Error while handling response: ',
                                 e);
                }

            } else if (xhr.status === 403) {
                console.warn(_logName,
                             'Looks like the rate-limit was exceeded.');
                safeUpdateDOM(showError, 'rate limit exceeded');
            } else {
                console.warn(_logName,
                             'Github API returned status:', xhr.status);
                safeUpdateDOM(showError, 'showing error');
            }
        } else {
            // Request is still in progress
            // Do nothing.
        }
    };

    xhr.open('GET', dataURL);
    xhr.send();

} else {
    if (DEBUG) {
        console.log(_logName,
                    'The URL did not identify a username/repository pair.');
    }
}
