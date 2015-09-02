'use strict';
/*jshint browser: true, es5: true, sub:true */

var _logName = 'lovely-forks:';
var DEBUG = true;
var text;

function emptyElem(elem) {
    elem.textContent = ''; // How jQuery does it
}

function mbStrToMs(dateStr) {
    return dateStr !== null ? Date.parse(dateStr) : null;
}

function isExpired(timeMs) {
    var currentTime = new Date();

    // The time of expiry of data is set to be an hour ago
    var expiryTimeMs = currentTime.valueOf() - 1000 * 60 * 60;

    return timeMs < expiryTimeMs;
}

function makeSelfDataKey(user, repo) {
    return 'lovely-forks@self:' + user + '/' + repo;
}

function makeRemoteDataKey(user, repo) {
    return 'lovely-forks@remote:' + user + '/' + repo;
}

var reDateKey = new RegExp('^lovely-forks@date:(.*)/(.*)$');
function makeTimeKey(user, repo) {
    return 'lovely-forks@date:' + user + '/' + repo;
}

function parseTimeKey(key) {
    var match = reDateKey.exec(key);
    if (match !== null) {
        return [match[1], match[2]];
    } else {
        return null;
    }
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

function clearLocalStorage() {
    var keysToUnset = [];

    /* Remove all items which have expired. */
    for(var ii = 0; ii < localStorage.length; ii++) {
        var key = localStorage.key(ii);
        var mbUserRepo = parseTimeKey(key);
        if (mbUserRepo !== null) {

            var timeMs = mbStrToMs(localStorage.getItem(key));

            if (timeMs && isExpired(timeMs)) {
                var user = mbUserRepo[0],
                    repo = mbUserRepo[1];
                keysToUnset.push(makeRemoteDataKey(user, repo));
                keysToUnset.push(makeSelfDataKey(user, repo));
                keysToUnset.push(makeTimeKey(user, repo));
            } else {
                console.warn(_logName,
                             'Unable to parse time: ',
                             localStorage.getItem(key));
            }
        }
    }

    keysToUnset.forEach(function (key) {
        if (DEBUG) {
            console.log(_logName,
                        'Removing key: ', key);
        }
        localStorage.removeItem(key);
    });
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

function showDetails(fullName, url, numStars,
                     selfUpdateTimeMs, remoteUpdateTimeMs) {
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

        if (remoteUpdateTimeMs > selfUpdateTimeMs) {
            var flameIcon = document.createElement('span');
            flameIcon.classList.add('octicon', 'octicon-flame');
            flameIcon.style.lineHeight = 0;
            flameIcon.style.fontSize = '1.2em';
            flameIcon.style.color = '#d26911';
            flameIcon.title = 'Fork is more recent than upstream.';
            text.appendChild(flameIcon);
        }

        text.parentNode.classList.add('has-lovely-forks');
    };
}

function showError(text) {
    text.appendChild(document.createTextNode('no information'));
}

function makeRemoteDataURL(user, repo) {
    return 'https://api.github.com/repos/' +
                  user + '/' + repo + '/forks?sort=stargazers';
}

function makeSelfDataURL(user, repo) {
    return 'https://api.github.com/repos/' +
                  user + '/' + repo + '/commits';
}

// From: http://crocodillon.com/blog/always-catch-localstorage-security-and-quota-exceeded-errors
function isQuotaExceeded(e) {
    var quotaExceeded = false;
    if (e) {
        if (e.code) {
            switch (e.code) {
                case 22:
                    quotaExceeded = true;
                    break;
                case 1014:
                    // Firefox
                    if (e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                        quotaExceeded = true;
                    }
                    break;
            }
        }
    }
    return quotaExceeded;
}

function processWithData(user, repo, remoteDataStr, selfDataStr, isFreshData) {
    try {
        /* Parse fork data */
        var allForks = JSON.parse(remoteDataStr);

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

        var remoteUpdateTimeMs = mbStrToMs(mostStarredFork['pushed_at']);

        /* Parse self data */
        var allCommits = JSON.parse(selfDataStr);

        if (!allCommits || allCommits.length < 1) {
            if (DEBUG) {
                console.log(_logName,
                            'Repository does not have any commits.');
            }
            return;
        }

        var latestCommit = allCommits[0]['commit'];
        var committer = latestCommit['committer'];

        if (!committer) {
            if (DEBUG) {
                console.error(_logName,
                              'Could not find the latest committer.');
            }
            return;
        }

        var selfUpdateTimeMs   = mbStrToMs(committer['date']);

        /* Cache data, if necessary */
        if (isFreshData) {
            var currentTimeMs = (new Date()).toString();

            try {
                clearLocalStorage();
                localStorage.setItem(makeTimeKey(user, repo), currentTimeMs);
                localStorage.setItem(makeRemoteDataKey(user, repo), remoteDataStr);
                localStorage.setItem(makeSelfDataKey(user, repo), selfDataStr);
            } catch(e) {
                if (isQuotaExceeded(e)) {
                    console.warn(_logName, 'Local storage quote full.');
                } else {
                    throw e;
                }
            }
        }

        safeUpdateDOM(showDetails(fullName, forkUrl, starGazers,
                                  selfUpdateTimeMs, remoteUpdateTimeMs),
                      'showing details');
    } catch (e) {
        console.warn(_logName,
                     'Error while handling response: ',
                     e);
    }
}

function onreadystateChangeFactory(xhr, successFn) {
    return function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                successFn();
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
}

function makeFreshRequest(user, repo) {
    var xhrRemote = new XMLHttpRequest(),
        xhrSelf   = new XMLHttpRequest();

    var remoteDone = false, remoteDataStr = null,
        selfDone = false, selfDataStr = null;

    xhrRemote.onreadystatechange = onreadystateChangeFactory(
        xhrRemote,
        function () {
            remoteDone = true;
            remoteDataStr = xhrRemote.responseText;
            if (selfDone) {
                processWithData(user, repo, remoteDataStr, selfDataStr, true);
            }
        }
    );

    xhrSelf.onreadystatechange = onreadystateChangeFactory(
        xhrSelf,
        function () {
            selfDone = true;
            selfDataStr = xhrSelf.responseText;
            if (remoteDone) {
                processWithData(user, repo, remoteDataStr, selfDataStr, true);
            }
        }
    );


    var remoteDataURL = makeRemoteDataURL(user, repo),
        selfDataURL   = makeSelfDataURL(user, repo);
    xhrRemote.open('GET', remoteDataURL);
    xhrRemote.send();

    xhrSelf.open('GET', selfDataURL);
    xhrSelf.send();
}

function getDataFor(user, repo) {
    var lfTimeKey = makeTimeKey(user, repo),
        lfRemoteDataKey = makeRemoteDataKey(user, repo),
        lfSelfDataKey = makeSelfDataKey(user, repo);

    var ret = { hasData: false };

    var savedRemoteDataStr = localStorage.getItem(lfRemoteDataKey);
    var savedSelfDataStr   = localStorage.getItem(lfSelfDataKey);
    var saveTimeMs         = mbStrToMs(localStorage.getItem(lfTimeKey));

    if (saveTimeMs         === null ||
        savedRemoteDataStr === null ||
        savedSelfDataStr   === null) {
        return ret;
    }

    ret.hasData            = true;
    ret.saveTimeMs         = saveTimeMs;
    ret.savedRemoteDataStr = savedRemoteDataStr;
    ret.savedSelfDataStr   = savedSelfDataStr;

    return ret;
}

function runFor(user, repo) {
    try {
        var cache = getDataFor(user, repo);
        if (cache.hasData && isExpired(cache.saveTimeMs)) {
            if (DEBUG) {
                console.log(_logName,
                            'Reusing saved data.');
            }
            processWithData(user, repo,
                            cache.savedRemoteDataStr, cache.savedSelfDataStr,
                            false);
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
