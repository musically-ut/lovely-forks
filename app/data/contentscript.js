'use strict';
/*jshint browser: true, es5: true, sub:true */

var pathComponents = window.location.pathname.split('/');
var _logName = 'github-forks-extension:';

function addInfo(fullName, url, numStars) {
    // If the layout of the page changes, we'll have to change this location.
    // We should make sure that we do not accidentally cause errors here.
    var h1s = window.document.querySelectorAll('.entry-title');
    if (h1s.length > 0) {
        try {
            var starIcon = document.createElement('span');
            starIcon.classList.add('octicon');
            starIcon.classList.add('octicon-star');

            var forkA = document.createElement('a');
            forkA.href = url;
            forkA.appendChild(document.createTextNode(fullName + ' ('));
            forkA.appendChild(starIcon);
            forkA.appendChild(document.createTextNode(numStars + ')'));

            var forkSpan = document.createElement('span');
            // Stealing the styling from Github fork-info
            forkSpan.classList.add('fork-flag');
            forkSpan.appendChild(document.createTextNode('Notable fork: '));
            forkSpan.appendChild(forkA);

            h1s[0].appendChild(forkSpan);
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

function makeDataURL(user, repo) {
    return 'https://api.github.com/repos/' +
                  user + '/' + repo + '/forks?sort=stargazers';
}

if (pathComponents.length >= 3) {
    var user = pathComponents[1], repo = pathComponents[2];
    var dataURL = makeDataURL(user, repo);
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var allForks = JSON.parse(xhr.responseText);
                    if (!allForks || allForks.length < 1) {
                        console.log(_logName,
                                    'Repository does not have any forks.');
                        return;
                    }

                    var mostStarredFork = allForks[0],
                        starGazers = mostStarredFork['stargazers_count'];

                    if (!starGazers) {
                        console.log(_logName,
                                    'Repo has only zero starred forks.');
                        return;
                    }

                    var forker = mostStarredFork['owner'];

                    if (!forker || !forker['login']) {
                        console.warn(_logName,
                                     'Owner of the fork no longer exists.');
                        return;
                    }

                    var forkUrl = mostStarredFork['html_url'];

                    addInfo(mostStarredFork['full_name'], forkUrl, starGazers);
                } catch (e) {
                    console.warn(_logName,
                                 'Error while handling response: ',
                                 e);
                }

            } else if (xhr.status === 403) {
                console.warn(_logName,
                             'Looks like the rate-limit was exceeded.');

            } else {
                console.warn(_logName,
                             'Github API returned status:', xhr.status);
            }
        } else {
            // Request is still in progress
            // Do nothing.
        }
    };

    xhr.open('GET', dataURL);
    xhr.send();

} else {
    console.log(_logName,
                'The URL did not identify a username/repository pair.');
}
