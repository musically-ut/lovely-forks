'use strict';
/*jshint browser: true, es5: true, sub:true */

var _logName = 'lovely-forks:';
var DEBUG = false;
var text;

var svgNS = "http://www.w3.org/2000/svg";

function createIconSVG(type) {
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttributeNS(null, 'height', 12);
    svg.setAttributeNS(null, 'width', 10.5);
    svg.setAttributeNS(null, 'viewBox', "0 0 14 16");
    svg.style['vertical-align'] = 'bottom';
    svg.style['fill'] = 'currentColor';

    svg.classList.add('opticon', 'opticon-' + type);

    var title = document.createElementNS(svgNS, 'title');

    var iconPath = document.createElementNS(svgNS, 'path');
    switch(type) {
        case "star":
            title.appendChild(document.createTextNode('Number of stars'));
            iconPath.setAttributeNS(null, 'd', 'M14 6l-4.9-0.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14l4.33-2.33 4.33 2.33L10.4 9.26 14 6z');
            break;
        case "flame":
            title.appendChild(document.createTextNode('Fork is more recent than upstream.'));
            iconPath.setAttributeNS(null, 'd',  'M5.05 0.31c0.81 2.17 0.41 3.38-0.52 4.31-0.98 1.05-2.55 1.83-3.63 3.36-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-0.3-6.61-0.61 2.03 0.53 3.33 1.94 2.86 1.39-0.47 2.3 0.53 2.27 1.67-0.02 0.78-0.31 1.44-1.13 1.81 3.42-0.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52 0.13-2.03 1.13-1.89 2.75 0.09 1.08-1.02 1.8-1.86 1.33-0.67-0.41-0.66-1.19-0.06-1.78 1.25-1.23 1.75-4.09-1.88-6.22l-0.02-0.02z');
            iconPath.setAttributeNS(null, 'fill', '#d26911');
            break;
    }

    iconPath.appendChild(title);
    svg.appendChild(iconPath);

    return svg;
}


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

            if (timeMs) {
                if (isExpired(timeMs)) {
                    var user = mbUserRepo[0],
                        repo = mbUserRepo[1];
                    keysToUnset.push(makeRemoteDataKey(user, repo));
                    keysToUnset.push(makeSelfDataKey(user, repo));
                    keysToUnset.push(makeTimeKey(user, repo));
                }
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
        var forkA = document.createElement('a');
        forkA.href = url;
        forkA.appendChild(document.createTextNode(fullName));

        text.appendChild(document.createTextNode('also forked to '));
        text.appendChild(forkA);
        text.appendChild(document.createTextNode(' '));
        text.appendChild(createIconSVG('star'));
        text.appendChild(document.createTextNode('' + numStars + ' '));

        if (remoteUpdateTimeMs > selfUpdateTimeMs) {
            text.appendChild(createIconSVG('flame'));
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
    return 'https://api.github.com/repos/' + user + '/' + repo;
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

        var mostStarredFork = allForks[0];

        var forkUrl = mostStarredFork['html_url'],
            fullName = mostStarredFork['full_name'];

        var remoteUpdateTimeMs = mbStrToMs(mostStarredFork['pushed_at']);

        /* Parse self data */
        /* This could either be the repo data (v1) or `all_commits` data (v2). */
        var selfData = JSON.parse(selfDataStr);
        var selfDataToSave = null;

        var selfUpdateTimeMs = null;
        if (selfData.hasOwnProperty('pushed_at')) {
            /* This is not an array, but the repository data. */
            selfUpdateTimeMs = mbStrToMs(selfData['pushed_at']);
            selfDataToSave = selfData;
        } else {
            /* This is the old all-commits data. */
            var allCommits = selfData;
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

            selfUpdateTimeMs = mbStrToMs(committer['date']);
            selfDataToSave = [allCommits[0]];
        }

        if (!selfUpdateTimeMs) {
            if (DEBUG) {
                console.error(_logName,
                              'Could not find the selfUpdateTimeMs.');
            }
            return;
        }


        /* Cache data, if necessary */
        if (isFreshData) {
            var currentTimeMs = (new Date()).toString();

            if (DEBUG) {
                console.log(_logName, 'Saving data');
            }

            try {
                clearLocalStorage();
                localStorage.setItem(makeTimeKey(user, repo), currentTimeMs);

                // Only the most starred fork is relevant
                var relevantRemoteDataStr = JSON.stringify([mostStarredFork]);
                localStorage.setItem(makeRemoteDataKey(user, repo),
                                     relevantRemoteDataStr);

                // Only the latest commit is relevant
                var relevantSelfDataStr = JSON.stringify(selfDataToSave);
                localStorage.setItem(makeSelfDataKey(user, repo),
                                     relevantSelfDataStr);
            } catch(e) {
                if (isQuotaExceeded(e)) {
                    console.warn(_logName, 'localStorage quota full.');
                } else {
                    throw e;
                }
            }
        }

        // Now if the repository doesn't have any notable forks, so not
        // touch the DOM.
        var starGazers = mostStarredFork['stargazers_count'];

        if (!starGazers) {
            if (DEBUG) {
                console.log(_logName,
                            'Repo has only zero starred forks.');
            }
            return;
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
        if (cache.hasData && !isExpired(cache.saveTimeMs)) {
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
