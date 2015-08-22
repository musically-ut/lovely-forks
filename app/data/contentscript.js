'use strict';
/*jshint browser: true, es5: true, sub:true */

var _logName = 'lovely-forks:';
var DEBUG = false;
var text;

function emptyElem(elem) {
    elem.textContent = ''; // How jQuery does it
}

function makeTimeKey(user, repo) {
    return 'lovely-forks@date:' + user + '/' + repo;
}

function makeDataKey(user, repo) {
    return 'lovely-forks@data:' + user + '/' + repo;
}

function makeRemoteUpdatedKey(user, repo) {
    return 'lovely-forks@remote-updated:' + user + '/' + repo;
}

function getForksElement() {
    // Verify that the element exists and it's still valid
    // otherwise, create it
    if (document.body.contains(text)) {
        return text;
    }

    // If the layout of the page changes, we'll have to change this location.
    // We should make sure that we do not accidentally cause errors here.
    var repoName = document.querySelector('.entry-title');
    if (repoName) {
        try {
            text = document.createElement('span');

            // Stealing the styling from Github fork-info
            text.classList.add('fork-flag', 'lovely-forks-addon');

            repoName.appendChild(text);

            return text;
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
    // Get the stored version or create it if it doesn't exist
    var text = getForksElement();

    // We should make sure that we do not accidentally cause errors here.
    if (text) {
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

        text.parentNode.classList.add('has-lovely-forks');
    };
}

function showError(text) {
    text.appendChild(document.createTextNode('no information'));
}

function makeDataURL(user, repo) {
    return 'https://api.github.com/repos/' +
                  user + '/' + repo + '/forks?sort=stargazers';
}

function processWithData(user, repo, dataStr, isFreshData) {
    try {
        var allForks = JSON.parse(dataStr);
        if (!allForks || allForks.length < 1) {
            if (DEBUG) {
                console.log(_logName,
                            'Repository does not have any forks.');
            }
            return;
        }

        var mostStarredFork = allForks[0],
            starGazers = mostStarredFork['stargazers_count'];

        if (!starGazers) {
            if (DEBUG) {
                console.log(_logName,
                            'Repo has only zero starred forks.');
            }
            return;
        }

        var forkUrl = mostStarredFork['html_url'],
            fullName = mostStarredFork['full_name'];

        var remoteUpdateTimeMs = Date.parse(mostStarredFork['updated_at']);

        if (isFreshData) {
            var currentTimeMs = (new Date()).valueOf();

            localStorage.setItem(makeTimeKey(user, repo), currentTimeMs);
            localStorage.setItem(makeDataKey(user, repo), dataStr);
            localStorage.setItem(makeRemoteUpdatedKey(user, repo),
                                 remoteUpdateTimeMs);
        }

        safeUpdateDOM(showDetails(fullName, forkUrl, starGazers),
                      'showing details');
    } catch (e) {
        console.warn(_logName,
                     'Error while handling response: ',
                     e);
    }
}

function makeFreshRequest(user, repo) {
    var dataURL = makeDataURL(user, repo);
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                processWithData(user, repo, xhr.responseText, true);
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
}
function getDataFor(user, repo) {
    var lfTimeKey = makeTimeKey(user, repo),
        lfDataKey = makeDataKey(user, repo);

    var ret = { hasData: false };

    var saveTime = localStorage.getItem(lfTimeKey);
    if (saveTime !== null) {
        // Save format is in milliseconds since epoch.
        saveTime = new Date(parseInt(saveTime));
    }

    var savedData = localStorage.getItem(lfDataKey);
    if (savedData === null || saveTime === null) {
        return ret;
    }

    ret.hasData = true;
    ret.saveTimeMs = saveTime;
    ret.savedData = savedData;
    return ret;
}

function runFor(user, repo) {
    try {
        var cache = getDataFor(user, repo),
            currentTime = new Date();

        // The time of expiry of data is set to be an hour ago
        var expiryTimeMs = currentTime.valueOf() - 1000 * 60 * 60;

        if (cache.hasData && cache.saveTimeMs > expiryTimeMs) {
            if (DEBUG) {
                console.log(_logName,
                            'Reusing saved data.');
            }
            processWithData(user, repo, cache.savedData, false);
        } else {
            if (DEBUG) {
                console.log(_logName,
                            'Requesting the data from Github API.');
            }
            makeFreshRequest(user, repo);
        }
    } catch (e) {
        console.error(_logName, 'Could not run for ', user + '/' + repo,
                      'Exception: ', e);
    }
}

/* Script execution */

var pathComponents = window.location.pathname.split('/');
if (pathComponents.length >= 3) {
    var user = pathComponents[1], repo = pathComponents[2];
    runFor(user, repo);
} else {
    if (DEBUG) {
        console.log(_logName,
                    'The URL did not identify a username/repository pair.');
    }
}
