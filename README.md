<table>
<tr>
<td>
<img src="http://musicallyut.in/docs/lovely-forks/logo.png" alt="Lovely forks logo"><br/>
<h2>Lovely forks</h2>
</td>
<td>
<p><a href="https://addons.mozilla.org/en-US/firefox/addon/lovely-forks/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" width="18" /> Firefox addon</a></p>
<p><a href="https://addons.mozilla.org/en-US/seamonkey/addon/lovely-forks/"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/seamonkey/seamonkey_48x48.png" width="18" /> SeaMonkey addon</a></p>
<p><a href="https://chrome.google.com/webstore/detail/lovely-forks/ialbpcipalajnakfondkflpkagbkdoib"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" width="18" /> Chrome extension</a>
</p>
 
<p>Can also be installed on Opera through the <a href="https://addons.opera.com/en-gb/extensions/details/download-chrome-extension-9/?display=en"><img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/opera/opera_48x48.png" width="18" /> Opera Chrome-extension addon</a>.</p>
</td>
</tr>
</table>
 
----

An addon to help you notice **notable** forks of a GitHub project.

Sometimes on GitHub, projects are abandoned by the original authors and the
development continues on a fork. However, the original repository is seldom
updated to inform newcomers of that fact. I have often wasted effort on making
a pull-request or installing old buggy versions of projects when the community
had already moved to a fork.

To make matters worse, the old projects usually have higher search-engine
traffic and a lot more stars than the forks. This makes the forks even harder
to find. This addon tries to remedy that by adding a subscript under the name
of the repository on the GitHub page of the project with a link to the most
notable fork (i.e. the fork with the most stars and at least one star), if such
a fork exists.

Also, if the fork is _more recent_ than the upstream, a flame icon is shown
next to it. These are called [_flamey forks_](https://github.com/musically-ut/lovely-forks/issues/13) 
as suggested by [Mottie](https://github.com/Mottie).

## Screenshots

The [tipsy plugin](https://github.com/jaz303/tipsy) hasn't been updated since
2012 and there is a [community supported
fork](https://github.com/CloCkWeRX/tipsy) which has merged in all the PRs.
However, the alternative only has 27 stars versus the 1,888 stars of the
original project (at the time of writing):

<p align="center">
<img alt="Tipsy plugin" src="https://musicallyut.in/docs/lovely-forks/tipsy-fork.png" width="80%" />
</p>

Similarly, the project [slate](https://github.com/jigish/slate) was last
updated in 2013 and has about 5,000 stars. The [currently active
fork](https://github.com/mattr-/slate) only has 185 stars (at the time of
writing):

<p align="center">
<img alt="slate" src="https://musicallyut.in/docs/lovely-forks/slate-fork.png" width="80%" />
</p>

In some cases, a new flavour of the project might become visible, like an
internationalized fork ([Semantic-UI-pt-br](https://github.com/Semantic-Org/Semantic-UI-pt-br)
is [Semantic-UI](https://github.com/Semantic-Org/Semantic-UI) in a different
language):

<p align="center">
<img alt="semantic-ui" src="https://musicallyut.in/docs/lovely-forks/semantic-fork.png" width="80%" />
</p>

Or provides new features ([vim-fugitive](https://github.com/tpope/vim-fugitive) 
provides git integration for vim, 
[vim-mercenary](https://github.com/jlfwong/vim-mercenary) provides Mercurial
integration):

<p align="center">
<img alt="vim-fugitive" src="https://musicallyut.in/docs/lovely-forks/fugitive-fork.png" width="80%" />
</p>


## Acknowledgements

This project uses icons made by
[Freepik](http://www.flaticon.com/authors/freepik) and 
[Dave Gandy](http://www.flaticon.com/authors/dave-gandy) from
[www.flaticon.com](http://www.flaticon.com) is licensed by 
[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/).

[bfred-it](https://github.com/bfred-it) has contributed to improving the look
and feel of the extension considerably.

[izuzak](https://github.com/izuzak) from GitHub was instrumental in helping me
with bug fixing and suggesting [compare API](https://developer.github.com/v3/repos/commits/#compare-two-commits) 
for improving the heuristic to determine if a fork is more recent than the upstream
repository.
