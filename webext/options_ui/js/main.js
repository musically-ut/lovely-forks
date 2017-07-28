const STAR_THRES_KEY = "star_thres_key";

chrome.storage.local.get(STAR_THRES_KEY, (x) => {
  const thres = x[STAR_THRES_KEY] || 1;
  $('.js-star-threshold').val(thres);
})

$('.js-star-threshold').on('change', (ev) => {
  let thres = ev.target.value;
  if (thres >= 0) {
    chrome.storage.local.set({ [STAR_THRES_KEY]: thres },
      () => {
        if (chrome.runtime.lastError) {
          console.log('Error occurred:', chrome.runtime.lastError);
        } else {
          console.log(`Value successfully set to ${thres}.`);
        }
      }
    );
  }
});
