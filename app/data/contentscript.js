'use strict';
/*jshint browser: true, es5: true, sub:true */

var pathComponents = window.location.pathname.split('/');
var _logName = 'github-forks-extension:';
var DEBUG = false;
var el = new WeakMap();
var forksKey = {};

function emptyElem(elem) {
    elem.textContent = ''; // How jQuery does it
}

function createLoadingIndicator() {
    // If the layout of the page changes, we'll have to change this location.
    // We should make sure that we do not accidentally cause errors here.
    var repoName = document.querySelector('.entry-title');
    if (repoName) {
        try {
            var text = document.createElement('span');

            // Stealing the styling from Github fork-info
            text.classList.add('fork-flag', 'lovely-forks-addon');

            text.appendChild(document.createTextNode('loading ...'));
            repoName.appendChild(text);

            // Store it for later use
            el.set(forksKey, text);
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

function safeUpdateDOM(action, actionName) {
    var text = el.get(forksKey);

    // We should make sure that we do not accidentally cause errors here.
    if (text !== null) {
        try {
            emptyElem(text);
            action(text);
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
    return function (text) {
        var starIcon = document.createElement('span');
        starIcon.classList.add('octicon', 'octicon-star');
        starIcon.style.lineHeight = 0; // for alignment
        starIcon.style.fontSize = '1.2em';

        var forkA = document.createElement('a');
        forkA.href = url;
        forkA.appendChild(document.createTextNode(fullName));

        text.appendChild(document.createTextNode('also forked to '));
        text.appendChild(forkA);
        text.appendChild(document.createTextNode(' '));
        text.appendChild(starIcon);
        text.appendChild(document.createTextNode(numStars));
    };
}

function showNoForks(text) {
    text.appendChild(document.createTextNode('no notable forks'));
}

function showError(text) {
    text.appendChild(document.createTextNode('no information'));
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
