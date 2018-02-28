/* jshint browser: true, es5: true, sub:true */

const _logName = 'lovely-forks:';
const STAR_THRES_KEY = 'STAR_THRES_KEY';
const INDENT_KEY = 'INDENT_KEY';
const LF_PREF_KEY = 'LF_PREF_KEY';
const DAYS_THRES_KEY = 'DAYS_THRES_KEY';
const DEBUG = false;
let text;

function getPreferences() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(LF_PREF_KEY, x => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }

            const pref = {};
            x = x[LF_PREF_KEY] || {};

            pref[STAR_THRES_KEY] = x[STAR_THRES_KEY] || 1;
            pref[DAYS_THRES_KEY] = x[DAYS_THRES_KEY] || 0;
            pref[INDENT_KEY] = x[INDENT_KEY] || false;

            if (DEBUG) {
                console.log(_logName, `Preferences = ${JSON.stringify(x)}`);
            }
            resolve(pref);
        });
    });
}

function createIconSVG(type) {
    const icon = document.createElement('img');
    if (type === 'star') {
        icon.title = 'Number of stars';
    } else if (type === 'flame') {
        icon.title = 'Fork may be more recent than upstream.';
    } else {
        return icon;
    }
    icon.src = chrome.extension.getURL(`webext/icons/${type}.svg`);
    return icon;
}

function emptyElem(elem) {
    elem.textContent = ''; // How jQuery does it
}

function mbStrToMs(dateStr) {
    return dateStr && Date.parse(dateStr);
}

function isExpired(timeMs) {
    const currentTime = new Date();

    // The time of expiry of data is set to be an hour ago
    const expiryTimeMs = currentTime.valueOf() - (1000 * 60 * 60);
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
        } catch (err) {
            console.error(_logName,
                          'Error appending data to DOM',
                          err);
        }
    } else {
        console.warn(_logName,
                     'Looks like the layout of the GitHub page has changed.');
    }
}

function clearLocalStorage() {
    /* Remove all items which have expired. */
    for (let ii = 0; ii < localStorage.length; ii++) {
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

function olderThanDays(date, days) {
    const diff = Math.floor((new Date() - Date.parse(date)) / 86400000);

    return diff >= days;
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
        } catch (err) {
            console.error(_logName,
                          'Error appending data to DOM', err,
                          'during action', actionName);
        }
    } else {
        console.warn(_logName,
                     'Unable to find the lovely-forks loading indicator',
                     'during action', actionName);
    }
}

function showDetails(fullName, url, numStars, remoteIsNewer, indented) {
    const forkA = document.createElement('a');
    forkA.href = url;
    forkA.append(fullName);

    text.classList.toggle('indented', indented);
    text.append('also forked to ', forkA, ' ',
                createIconSVG('star'), `${numStars} `);

    if (remoteIsNewer) {
        text.append(createIconSVG('flame'));
    }

    text.parentNode.classList.add('has-lovely-forks');
}

function makeRemoteDataURL(user, repo) {
    return `https://api.github.com/repos/${user}/${repo}/forks?sort=stargazers`;
}

function makeCommitDiffURL(user, repo, remoteUser, defaultBranch) {
    return `https://api.github.com/repos/${user}/${repo}/compare/${user}:${defaultBranch}...${remoteUser}:${defaultBranch}`;
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
                default:
                    break;
            }
        }
    }
    return quotaExceeded;
}

function processWithData(user, repo, remoteDataStr,
                         selfDataStr, isFreshData, pref) {
    try {
        /* Parse fork data */
        /* Can either be just one data element,
         * or could be the list of all forks. */
        const allForksData = JSON.parse(remoteDataStr);
        const mostStarredFork = allForksData[0];

        const forkUrl = mostStarredFork.html_url;
        const fullName = mostStarredFork.full_name;

        /* Parse self data */
        /* This could either be the commit-diff data (v2)
         * or `all_commits` data (v1). */
        /* selfData can also be null, if the commit difference API resulted in
         * an error. */
        const selfData = JSON.parse(selfDataStr);

        let selfDataToSave = selfData;
        let remoteIsNewer = false;

        if (selfData) {
            if ('ahead_by' in selfData) {
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

            if (pref[DAYS_THRES_KEY] !== 0) {
                const lastCommit = selfData.base_commit.commit.author.date;
                const days = pref[DAYS_THRES_KEY];

                if (lastCommit && !olderThanDays(lastCommit, days)) {
                    return;
                }
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
            } catch (err) {
                if (isQuotaExceeded(err)) {
                    console.warn(_logName, 'localStorage quota full.');
                } else {
                    throw err;
                }
            }
        }

        // Now if the repository doesn't have any notable forks, so not
        // touch the DOM.
        const starGazers = mostStarredFork['stargazers_count'];

        if (!starGazers || starGazers < pref[STAR_THRES_KEY]) {
            if (DEBUG) {
                console.log(_logName,
                            `Repo has ${starGazers} < ${pref[STAR_THRES_KEY]} stars.`);
            }
            return;
        }

        safeUpdateDOM(() => showDetails(fullName, forkUrl, starGazers,
                                  remoteIsNewer, pref[INDENT_KEY]),
                      'showing details');
    } catch (err) {
        console.warn(_logName,
                     'Error while handling response: ',
                     err);
    }
}

async function makeFreshRequest(user, repo) {
    const response = await fetch(makeRemoteDataURL(user, repo));

    if (response.status === 403) {
        return console.warn(_logName,
                     'Looks like the rate-limit was exceeded.');
    }

    if (!response.ok) {
        return console.warn(_logName,
                     'GitHub API returned status:', response.status);
    }

    const [mostStarredFork] = await response.json();

    if (!mostStarredFork) {
        if (DEBUG) {
            console.log(_logName,
                        'Repository does not have any forks.');
        }
        return;
    }

    const forksDataStr = JSON.stringify([mostStarredFork]);
    const defaultBranch = mostStarredFork['default_branch'];
    const remoteUser = mostStarredFork['owner']['login'];

    const response2 = await fetch(makeCommitDiffURL(user, repo, remoteUser,
                                                    defaultBranch));

    let commitDiffStr = null;
    if (response2.ok) {
        const commitDiffJson = await response2.json();
        // Dropping the list of commits to conserve space.
        delete commitDiffJson.commits;
        commitDiffStr = JSON.stringify(commitDiffJson);
    }

    const pref = await getPreferences();
    processWithData(user, repo, forksDataStr,
                    commitDiffStr, true, pref);
}

function getDataFor(user, repo) {
    const lfTimeKey = makeTimeKey(user, repo);
    const lfRemoteDataKey = makeRemoteDataKey(user, repo);
    const lfSelfDataKey = makeSelfDataKey(user, repo);

    const ret = {hasData: false};

    const savedRemoteDataStr = localStorage.getItem(lfRemoteDataKey);
    const savedSelfDataStr = localStorage.getItem(lfSelfDataKey);
    const saveTimeMs = mbStrToMs(localStorage.getItem(lfTimeKey));

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

async function runFor(user, repo) {
    try {
        const cache = getDataFor(user, repo);
        if (cache.hasData && !isExpired(cache.saveTimeMs)) {
            if (DEBUG) {
                console.log(_logName,
                            'Reusing saved data.');
            }
            const pref = await getPreferences();
            processWithData(user, repo,
                            cache.savedRemoteDataStr, cache.savedSelfDataStr,
                            false, pref);
        } else {
            if (DEBUG) {
                console.log(_logName,
                            'Requesting the data from GitHub API.');
            }
            makeFreshRequest(user, repo);
        }
    } catch (err) {
        console.error(_logName, 'Could not run for ', `${user}/${repo}`,
                      'Exception: ', err);
    }
}

/* Script execution */

const [, user, repo] = window.location.pathname.split('/');
if (user && repo) {
    runFor(user, repo);
} else if (DEBUG) {
    console.log(_logName,
                'The URL did not identify a username/repository pair.');
}
