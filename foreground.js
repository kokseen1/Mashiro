var SUFFIXES = ["100000", "50000", "30000", "10000", "5000", "1000", "500", "100", "50"];

var JQUERY_SCRIPT_ID = "inj-script";
var JQUERY_PATH = "jquery-3.6.0.min.js";

var TAG_FAKE = "虚偽users入りタグ";

var MODE_ILLUST = "illust";
var MODE_MANGA = "manga";

var COLOR_ORANGE = "rgb(253 158 22)";
var COLOR_BLUE = "rgb(0 150 250)";

var RESULTS_MAX = 1000;

var canvasIds = [];
var popClickCallbacks = [];

var currModeGlobal;
var liTitleClassGlobal;

// TODO: Pull these from the app automatically - as they arent constant
var INJ_POP_ID = "inj-pop";
var INJ_LI_CLASS = "inj-li";
var LOGIN_BANNER_CLASS = ".sc-oh3a2p-4.gHKmNu";
var POP_SORT_ICON_CLASS = ".sc-1xl12os-0.sc-rkvk44-0.cvJBhn.jSdItB";
var LI_TITLE_LOGGEDOUT_CLASS = "sc-d98f2c-0 sc-iasfms-4 hFGeeG";
var LI_TITLE_LOGGEDIN_CLASS = "sc-d98f2c-0 sc-iasfms-4 cTvdTb bZOnOL";
var THUMBS_UL_CLASS = ".sc-l7cibp-1";
var LI_CLASS = ".sc-l7cibp-2";
var COUNT_DIV_CLASS = ".sc-7zddlj-2.dVRwUc span";
var PAGE_NAV_CLASS = ".sc-xhhh7v-0.kYtoqc";
var SEARCHBOX_CLASS = ".sc-5ki62n-4";
var BANNER_ICON_CLASS = ".sc-jn70pf-2.dhOsiK";

// Perform regex matching to find suffix
function suffixRegex(query) {
    const queryReg = /(((10|30|5)0+)users入り)$/;
    let queryMatch = query.match(queryReg);
    // queryMatch[0/1]: 100users入り
    // queryMatch[2]: 100
    return queryMatch;
}

// Get current search query without suffix
function getSearchQuery() {
    // Get current value in search box
    let searchBox = $(SEARCHBOX_CLASS);
    let query = searchBox.attr("value");

    // Remove suffix if exists
    let queryMatch = suffixRegex(query);
    if (queryMatch) query = query.slice(0, 0 - queryMatch[0].length);
    return query;
}

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

let postElement = undefined;
waitForElm(".sc-l7cibp-2").then(element => {
    console.log("Got post element!")
    postElement = element.cloneNode(true)
})

// Generate search api url with given query, defaults to page 1
function genSearchUrl(query, page = 1) {
    // Urlencode characters in query
    let queryEncoded = encodeURIComponent(query);
    return `https://www.pixiv.net/ajax/search/artworks/${queryEncoded}?word=${queryEncoded}&order=date&mode=all&p=${page}&s_mode=s_tag&type=all&lang=en`;
}

// Generate suffixed search api url with given query and suffix
function genSearchUrlSuffixed(query, suffix, page) {
    let querySuffixed = `${query}${suffix}users入り`;
    return genSearchUrl(querySuffixed, page);
}

// Generate thumbnail li element
// TODO: sometimes, the posts wont load at all, and require a second click.
function generateLi(i, popType) {
    let illust_id = i.id;
    let artist_id = i.userId;
    let illust_thumb_url = i.url;
    let illust_alt = i.alt;
    let illust_title = i.title;
    let illust_user_name = i.userName
    let illust_user_profile_picture = i.profileImageUrl

    let post = postElement.cloneNode(true)
    post.classList.add(INJ_LI_CLASS)
    post.id = illust_id

    const title = post.querySelectorAll(".sc-d98f2c-0.sc-iasfms-6")[0]
    const authorName = post.querySelectorAll(".sc-d98f2c-0.sc-1rx6dmq-2")[0]
    const authorPFP = post.querySelectorAll(".sc-1asno00-0 > img")[0]
    authorPFP.src = illust_user_profile_picture

    const illustLink = post.querySelectorAll(".sc-d98f2c-0.sc-rp5asc-16")[0]
    illustLink.href = `/en/artworks/${illust_id}`
    illustLink.setAttribute("data-gtm-user-id", artist_id)
    const illustImg = post.querySelectorAll(".sc-d98f2c-0.sc-rp5asc-16 > .sc-rp5asc-9 > img")[0]
    illustImg.alt = illust_alt
    illustImg.src = illust_thumb_url

    authorName.textContent = illust_user_name
    title.textContent = illust_title

    return post;
}

// Main thumbnail injecting function
function injectLi(i, suffix) {
    // Skip repeats
    let illust_id = i.id;
    if (canvasIds.includes(illust_id)) return;

    // Filter by mode
    let illust_type = i.illustType;
    if (currModeGlobal == MODE_ILLUST && illust_type == 1) return;
    if (currModeGlobal == MODE_MANGA && illust_type == 0) return;

    // Skip fakes and tagless
    let illust_tags = i.tags;
    if (!illust_tags) return;
    if (illust_tags.includes(TAG_FAKE)) return;

    // Differentiate from alt pop
    let popType = "pop-alt";
    if (suffix) popType = "pop-suf";

    // Get suffix from tags
    illust_tags.forEach(tag => {
        let suffixReg = suffixRegex(tag);
        if (suffixReg) {
            suffix = suffixReg[2];
            return;
        }
    });

    // Skip if not popular (tentative)
    if (!suffix) return;

    // Generate li element
    let thumbLi = generateLi(i, popType);

    // Inject li to appropriate section
    $(`#inj-${suffix}`).append(thumbLi);

    // Add to and update canvas arr
    canvasIds.push(illust_id);
    $(COUNT_DIV_CLASS).text(canvasIds.length);
    return true;
}

// Recursively search for and inject results via given suffix
function handleSuffix(suffix, page = 1) {
    let illustSearchUrl = genSearchUrlSuffixed(getSearchQuery(), suffix, page);
    $.getJSON(illustSearchUrl, function (data) {
        let illustsArr = data.body.illustManga.data;
        illustsArr.forEach(i => {
            injectLi(i, suffix);
        });

        // Kill switch to prevent searching the next page
        if (canvasIds.length > RESULTS_MAX) return;

        // Recursively get more popular illusts if available
        if (illustsArr.length == 60 && SUFFIXES.slice(0, 5).includes(suffix))
            handleSuffix(suffix, page + 1);
    });
}

// Remove all thumbnail elements and clear illust id array
function removeAllLi() {
    $(LI_CLASS).remove();

    // Reset count
    canvasIds = [];
    $(COUNT_DIV_CLASS).text("0");
    // console.log("Removed all thumbs");
}

// Remove the page navigation bar
function removePageNav() {
    $(PAGE_NAV_CLASS).remove();
}

// Get the current URL
function getCurrUrl() {
    return window.location.toString();
}

// Get the current mode (illust/manga)
function getCurrMode() {
    let currUrl = getCurrUrl();

    // Default mode to illusts
    currModeGlobal = MODE_ILLUST;
    if (currUrl.includes(`/${MODE_MANGA}`)) {
        currModeGlobal = MODE_MANGA;
    }
}

// Define appropriate global li class name
function getLiTitleClass() {
    liTitleClassGlobal = LI_TITLE_LOGGEDIN_CLASS;
    if ($(LOGIN_BANNER_CLASS).length) liTitleClassGlobal = LI_TITLE_LOGGEDOUT_CLASS;
}

// To be run before every retrieval
function prepFetch() {
    // Clear canvas
    removeAllLi();
    removePageNav();

    // Retrieve global configs
    getCurrMode();
    getLiTitleClass();

    // Execute available callbacks
    popClickCallbacks.forEach(function (callbackFunc) {
        callbackFunc();
    });
}

// Callback to retrieve popular via suffix
function popCallback() {
    // console.log("Pop running!")

    // Search all possible popular suffixes
    SUFFIXES.forEach(suffix => {
        handleSuffix(suffix);
    });
}

// Generate recommended api url, default limit at 180 (max)
function genRecoUrl(illust_id, limit = 180) {
    return `https://www.pixiv.net/ajax/illust/${illust_id}/recommend/init?limit=${limit}&lang=en`;
}

// Handle recommendations from alt pop
function handleRecos(illust_id, query) {
    if (canvasIds.length > RESULTS_MAX) return;
    $.getJSON(genRecoUrl(illust_id), function (data) {
        data.body.illusts.forEach(i => {
            // Skip unrelated (might move to injectLi)
            if (i.tags && !i.tags.includes(query)) return;
            let injectResult = injectLi(i);

            // Recursive search optimised for efficiency
            // Not exhaustive, but fast
            if (i.id && injectResult) handleRecos(i.id, query);
        });
    });
}

// Function to fetch and inject alt pop
function altPopCallback() {
    // console.log("Alt pop running!");

    let query = getSearchQuery();
    let querySearchUrl = genSearchUrl(query);

    $.getJSON(querySearchUrl, function (data) {
        // Inject permanent illusts
        data.body.popular.permanent.forEach(i => {
            injectLi(i);
            handleRecos(i.id, query);
        });

        // Inject recent illusts
        data.body.popular.recent.forEach(i => {
            injectLi(i);
            handleRecos(i.id, query);
        });
    });
}

// Remove premium banner
function removeBanner() {
    $(BANNER_ICON_CLASS).parent().remove();
}

// Remove all injected thumbs
function removeInjectedLi() {
    $(`.${INJ_LI_CLASS}`).remove();
}

// Test for pop/alt availability and add callbacks accordingly
function addClickCallbacks() {
    // Flag to prioritise pop suffix color
    let popAvail;

    let injPop = $(`#${INJ_POP_ID}`);

    let query = getSearchQuery();

    // Perform temp search for 100users
    let tempSearchUrlSuffixed = genSearchUrlSuffixed(query, 100);
    $.getJSON(tempSearchUrlSuffixed, function (data) {
        if (data.body.illustManga.data.length) {
            // Results exist for popular suffixed
            popAvail = true;
            injPop.css("color", COLOR_ORANGE);
            popClickCallbacks.push(popCallback);
        }
    });

    // Temp alt pop search
    let tempSearchUrl = genSearchUrl(query);
    $.getJSON(tempSearchUrl, function (data) {
        if (data.body.popular.permanent.length) {
            // Results exist for alt pop
            if (!popAvail) injPop.css("color", COLOR_BLUE);
            popClickCallbacks.push(altPopCallback);
        }
        // Todo: handle popular.recent
    });
}

// Called whenever there is an update to the page
function handleStateChange() {
    // removeBanner(); // Optional

    // Remove previously injected li
    removeInjectedLi();

    // Reset popular button
    let injPop = $(`#${INJ_POP_ID}`);

    // Reset color
    injPop.css("color", "");
    injPop.off();

    // Clear callbacks arr
    popClickCallbacks = [];

    // Could be sequential to ensure consistency
    addClickCallbacks();

    // Re-set callback
    injPop.on("click", prepFetch);
}

// Inject jQuery into document head
function injectJQuery() {
    let isJQueryInjected = document.getElementById(JQUERY_SCRIPT_ID);
    // Return if already exists
    if (isJQueryInjected) return;
    let script = document.createElement("script");
    script.id = JQUERY_SCRIPT_ID;
    script.src = chrome.runtime.getURL(JQUERY_PATH);
    script.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(script);
}


// Inject Popular button
function injectPopular() {
    // Return if already exists
    if ($(`#${INJ_POP_ID}`).length) return;
    let ogPopSort = $(POP_SORT_ICON_CLASS).parent();
    let injPop = ogPopSort.clone();
    injPop.text("Popular");
    injPop.attr("id", INJ_POP_ID);
    ogPopSort.after(injPop);
}

// Inject sections dynamically
function injectSections() {
    if ($(".inj-sect").length) return;
    SUFFIXES.forEach(suffix => {
        $(THUMBS_UL_CLASS).append($(`<div id="inj-${suffix}" class="inj-sect"></div>`))
    });
}

// Vars are removed when page is refreshed
// jQuery is removed when page is refreshed

// Popular button is removed when illust->manga tab switch/page refreshed
// Sections are removed when illust->manga tab switch/page refreshed

// jQuery gets removed only when page is refreshed
// Always check just to be safe
injectJQuery();

// Determine type of change
if (document.getElementById(INJ_POP_ID)) {
    // On tag change/old->new tab switch
    // console.log("Already added button!");

    handleStateChange();

} else {
    // On refresh/illust->manga tab switch
    // console.log("Adding button");

    injectPopular();
    injectSections();

    handleStateChange();
}
