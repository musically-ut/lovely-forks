/*jshint browser: true, es5: true, sub:true */

const _logName = 'lovely-forks:';
const DEBUG = false;
let text;

const svgNS = 'http://www.w3.org/2000/svg';

function createIconSVG(type) {
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttributeNS(null, 'height', 12);
    svg.setAttributeNS(null, 'width', 10.5);
    svg.setAttributeNS(null, 'viewBox', '0 0 14 16');
    svg.style['vertical-align'] = 'bottom';
    svg.style['fill'] = 'currentColor';

    svg.classList.add('opticon', `opticon-${type}`);

    const title = document.createElementNS(svgNS, 'title');

    const iconPath = document.createElementNS(svgNS, 'path');
    switch(type) {
        case 'star':
            title.append('Number of stars');
            iconPath.setAttributeNS(null, 'd', 'M14 6l-4.9-0.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14l4.33-2.33 4.33 2.33L10.4 9.26 14 6z');
            break;
        case 'flame':
            title.append('Fork may be more recent than upstream.');
            iconPath.setAttributeNS(null, 'd',  'M5.05 0.31c0.81 2.17 0.41 3.38-0.52 4.31-0.98 1.05-2.55 1.83-3.63 3.36-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-0.3-6.61-0.61 2.03 0.53 3.33 1.94 2.86 1.39-0.47 2.3 0.53 2.27 1.67-0.02 0.78-0.31 1.44-1.13 1.81 3.42-0.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52 0.13-2.03 1.13-1.89 2.75 0.09 1.08-1.02 1.8-1.86 1.33-0.67-0.41-0.66-1.19-0.06-1.78 1.25-1.23 1.75-4.09-1.88-6.22l-0.02-0.02z');
            iconPath.setAttributeNS(null, 'fill', '#d26911');
            break;
    }

    iconPath.append(title);
    svg.append(iconPath);

    return svg;
}

function emptyElem(elem) {
    elem.textContent = ''; // How jQuery does it
}

function mbStrToMs(dateStr) {
    return dateStr !== null ? Date.parse(dateStr) : null;
}

function isExpired(timeMs) {
    const currentTime = new Date();

    // The time of expiry of data is set to be an hour ago
    const expiryTimeMs = currentTime.valueOf() - 1000 * 60 * 60;
    return timeMs < expiryTimeMs;
}

function makeSelfDataKey(user, repo) {
    return `lovely-forks@self:${user}/${repo}`;
}

function makeRemoteDataKey(user, repo) {
    return `lovely-forks@remote:${user}/${repo}`;
}


const reDateKey = /^lovely-forks@date:(.*)[/](.*)$/;
function makeTimeKey(user, repo) {
    return `lovely-forks@date:${user}/${repo}`;
}

function parseTimeKey(key) {
    const [, user, repo] = reDateKey.exec(key) || [];
    return {user, repo};
}

function getForksElement() {
    // Verify that the element exists and it's still valid
    // otherwise, create it
    if (document.body.contains(text)) {
        return text;
    }

    // If the layout of the page changes, we'll have to change this location.
    // We should make sure that we do not accidentally cause errors here.
    const repoName = document.querySelector('.repohead-details-container .public');
    if (repoName) {
        try {
            text = document.createElement('span');

            // Stealing the styling from GitHub fork-info
            text.classList.add('fork-flag', 'lovely-forks-addon');

            repoName.append(text);

            return text;
        } catch (e) {
            console.error(_logName,
                          'Error appending data to DOM',
                          e);
        }
    } else {
        console.warn(_logName,
                     'Looks like the layout of the GitHub page has changed.');
    }
}

function clearLocalStorage() {
    /* Remove all items which have expired. */
    for(let ii = 0; ii < localStorage.length; ii++) {
        const key = localStorage.key(ii);
        const {user, repo} = parseTimeKey(key);
        if (user && repo) {
            const timeMs = mbStrToMs(localStorage.getItem(key));

            if (timeMs) {
                if (isExpired(timeMs)) {
                    removeFromLocalStorage(makeRemoteDataKey(user, repo));
                    removeFromLocalStorage(makeSelfDataKey(user, repo));
                    removeFromLocalStorage(makeTimeKey(user, repo));
                }
            } else {
                console.warn(_logName,
                             'Unable to parse time: ',
                             localStorage.getItem(key));
            }
        }
    }
}

function removeFromLocalStorage(key) {
    if (DEBUG) {
        console.log(_logName,
                    'Removing key: ', key);
    }
    localStorage.removeItem(key);
}

function safeUpdateDOM(action, actionName) {
    // Get the stored version or create it if it doesn't exist
    const text = getForksElement();

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

function showDetails(fullName, url, numStars, remoteIsNewer) {
    return text => {
        const forkA = document.createElement('a');
        forkA.href = url;
        forkA.append(fullName);

        text.append('also forked to ', forkA, ' ', createIconSVG('star'), `${numStars} `);

        if (remoteIsNewer) {
            text.append(createIconSVG('flame'));
        }

        text.parentNode.classList.add('has-lovely-forks');
    };
}

function makeRemoteDataURL(user, repo) {
    return `https://api.github.com/repos/${user}/${repo}/forks?sort=stargazers`;
}

function makeCommitDiffURL(user, repo, remoteUser, default_branch) {
    return `https://api.github.com/repos/${user}/${repo}/compare/${user}:${default_branch}...${remoteUser}:${default_branch}`;
}


// From: http://crocodillon.com/blog/always-catch-localstorage-security-and-quota-exceeded-errors
function isQuotaExceeded(e) {
    let quotaExceeded = false;
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
        /* Can either be just one data element,
         * or could be the list of all forks. */
        const allForksData = JSON.parse(remoteDataStr);
        const mostStarredFork = allForksData[0];

        const forkUrl = mostStarredFork['html_url'];
        const fullName = mostStarredFork['full_name'];

        /* Parse self data */
        /* This could either be the commit-diff data (v2)
         * or `all_commits` data (v1). */
        /* selfData can also be null, if the commit difference API resulted in
         * an error. */
        const selfData = JSON.parse(selfDataStr);

        let selfDataToSave = selfData;
        let remoteIsNewer = false;

        if (selfData !== null) {
            if (selfData.hasOwnProperty('ahead_by')) {
                // New version
                const diffData = selfData;
                remoteIsNewer = (diffData['ahead_by'] - diffData['behind_by']) > 0;
            } else {
                // Old version
                const allCommits = selfData;
                const remoteUpdateTimeMs = mbStrToMs(mostStarredFork['pushed_at']);

                if (!allCommits || allCommits.length < 1) {
                    if (DEBUG) {
                        console.log(_logName,
                                    'Repository does not have any commits.');
                    }
                    return;
                }

                const latestCommit = allCommits[0]['commit'];
                const committer = latestCommit['committer'];

                if (!committer) {
                    if (DEBUG) {
                        console.error(_logName,
                                      'Could not find the latest committer.');
                    }
                    return;
                }

                const selfUpdateTimeMs = mbStrToMs(committer['date']);

                remoteIsNewer = remoteUpdateTimeMs > selfUpdateTimeMs;
                selfDataToSave = [allCommits[0]];
            }
        } else {
            remoteIsNewer = false;
        }

        /* Cache data, if necessary */
        if (isFreshData) {
            const currentTimeMs = (new Date()).toString();

            if (DEBUG) {
                console.log(_logName, 'Saving data');
            }

            try {
                clearLocalStorage();
                localStorage.setItem(makeTimeKey(user, repo), currentTimeMs);

                // Only the most starred fork is relevant
                const relevantRemoteDataStr = JSON.stringify([mostStarredFork]);
                localStorage.setItem(makeRemoteDataKey(user, repo),
                                     relevantRemoteDataStr);

                // Only the latest commit is relevant
                const relevantSelfDataStr = JSON.stringify(selfDataToSave);
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
        const starGazers = mostStarredFork['stargazers_count'];

        if (!starGazers) {
            if (DEBUG) {
                console.log(_logName,
                            'Repo has only zero starred forks.');
            }
            return;
        }

        safeUpdateDOM(showDetails(fullName, forkUrl, starGazers,
                                  remoteIsNewer),
                      'showing details');
    } catch (e) {
        console.warn(_logName,
                     'Error while handling response: ',
                     e);
    }
}

function onreadystatechangeFactory(xhr, successFn) {
    return () => {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                successFn();
            } else if (xhr.status === 403) {
                console.warn(_logName,
                             'Looks like the rate-limit was exceeded.');
            } else {
                console.warn(_logName,
                             'GitHub API returned status:', xhr.status);
            }
        } else {
            // Request is still in progress
            // Do nothing.
        }
    };
}

function makeFreshRequest(user, repo) {
    const xhrFork = new XMLHttpRequest();

    xhrFork.onreadystatechange = onreadystatechangeFactory(
        xhrFork,
        () => {
            const forksDataJson = JSON.parse(xhrFork.responseText);
            if (!forksDataJson || forksDataJson.length === 0) {
                if (DEBUG) {
                    console.log(_logName,
                                'Repository does not have any forks.');
                }
                return;
            }

            const mostStarredFork = forksDataJson[0];
            const forksDataStr = JSON.stringify([mostStarredFork]);
            const defaultBranch = mostStarredFork['default_branch'];
            const remoteUser    = mostStarredFork['owner']['login'];

            const xhrDiff = new XMLHttpRequest();

            xhrDiff.onreadystatechange = () => {
                if (xhrDiff.readyState === 4) {
                    if (xhrDiff.status === 200) {
                        const commitDiffJson = JSON.parse(xhrDiff.responseText);
                        // Dropping the list of commits to conserve space.
                        commitDiffJson['commits'] = [];
                        const commitDiffStr = JSON.stringify(commitDiffJson);
                        processWithData(user, repo, forksDataStr, commitDiffStr, true);
                    } else {
                        // In case of any error, ignore recency data.
                        processWithData(user, repo, forksDataStr, null, true);
                    }
                }
            };

            xhrDiff.open('GET', makeCommitDiffURL(user, repo, remoteUser, defaultBranch));
            xhrDiff.send();
        }
    );

    xhrFork.open('GET', makeRemoteDataURL(user, repo));
    xhrFork.send();
}

function getDataFor(user, repo) {
    const lfTimeKey       = makeTimeKey(user, repo);
    const lfRemoteDataKey = makeRemoteDataKey(user, repo);
    const lfSelfDataKey   = makeSelfDataKey(user, repo);

    const ret = { hasData: false };

    const savedRemoteDataStr = localStorage.getItem(lfRemoteDataKey);
    const savedSelfDataStr   = localStorage.getItem(lfSelfDataKey);
    const saveTimeMs         = mbStrToMs(localStorage.getItem(lfTimeKey));

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
        const cache = getDataFor(user, repo);
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
                            'Requesting the data from GitHub API.');
            }
            makeFreshRequest(user, repo);
        }
    } catch (e) {
        console.error(_logName, 'Could not run for ', `${user}/${repo}`,
                      'Exception: ', e);
    }
}

/* Script execution */

const [, user, repo] = window.location.pathname.split('/');
if (user && repo) {
    runFor(user, repo);
} else {
    if (DEBUG) {
        console.log(_logName,
                    'The URL did not identify a username/repository pair.');
    }
}
