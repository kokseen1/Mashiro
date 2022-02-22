var JQUERY_SCRIPT_ID = "inj-script";
var JQUERY_PATH = "jquery-3.6.0.min.js";

var TAG_FAKE = "虚偽users入りタグ";

var MODE_ILLUST = "illust";
var MODE_MANGA = "manga";

var SUFFIXES = ["100000", "50000", "30000", "10000", "5000", "1000", "500", "100", "50"];

var COLOR_ORANGE = "rgb(255 126 48)";
var COLOR_BLUE = "rgb(0 150 240)";

var canvasIds = [];

var currMode;
var liTitleClass;


var INJ_POP_ID = "inj-pop";
var INJ_LI_CLASS = "inj-li";
var LOGIN_BANNER_CLASS = ".sc-oh3a2p-4.gHKmNu";
var POP_SORT_ICON_CLASS = ".sc-1xl12os-0.sc-rkvk44-0.cvJBhn.jSdItB";
var LI_TITLE_LOGGEDOUT_CLASS = "sc-d98f2c-0 sc-iasfms-4 hFGeeG";
var LI_TITLE_LOGGEDIN_CLASS = "sc-d98f2c-0 sc-iasfms-4 cTvdTb bZOnOL";
var THUMBS_UL_CLASS = ".sc-l7cibp-1.krFoBL";
var LI_CLASS = ".sc-l7cibp-2.gpVAva";
var COUNT_DIV_CLASS = ".sc-7zddlj-2.dVRwUc span";
var PAGE_NAV_CLASS = ".sc-xhhh7v-0.kYtoqc";
var SEARCHBOX_CLASS = ".sc-5ki62n-4";

// var COUNT_SPAN = $(COUNT_DIV_CLASS).find("span");
// var COUNT_SPAN = "#root > div:nth-child(2) > div.sc-1nr368f-2.kBWrTb > div > div.sc-15n9ncy-0.jORshO > div > section:nth-child(3) > div.sc-7zddlj-0.dFLqqk > div > div > div > span";
// var SEARCHBOX_LIGHT_SELECTOR = "#root > div:nth-child(2) > div.sc-12xjnzy-0.dIGjtZ > div:nth-child(1) > div:nth-child(1) > div > div.sc-epuuy1-0.hxckiU > form > div > input";
// var SEARCHBOX_DARK_SELECTOR = "#root > div:nth-child(2) > div.sc-12xjnzy-0.iqkFre > div:nth-child(1) > div:nth-child(1) > div > div.sc-epuuy1-0.hxckiU > form > div > input";

// Perform regex matching to find suffix
function suffixRegex(query) {
    const queryReg = /(([1|3|5]0+)users入り)$/;
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

// Main thumbnail injecting function
function injectLi(i, suffix) {
    // Skip repeats
    let illust_id = i.id;
    if (canvasIds.includes(illust_id)) return;

    // Filter by mode
    let illust_type = i.illustType;
    if (currMode == MODE_ILLUST && illust_type == 1) return;
    if (currMode == MODE_MANGA && illust_type == 0) return;

    // Skip fakes and tagless
    let illust_tags = i.tags;
    if (!illust_tags) return;
    if (illust_tags.includes(TAG_FAKE)) return;

    // Differentiate from alt pop
    let popClassName = "pop-alt";
    if (suffix) popClassName = "pop-suf";

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

    let artist_id = i.userId;
    let illust_thumb_url = i.url;
    let illust_alt = i.alt;
    let illust_title = i.title;

    let thumbLi = $(`<li class='sc-l7cibp-2 gpVAva ${INJ_LI_CLASS} ${popClassName}'></li>`)

        .append($(`<div class="sc-iasfms-3 jDiQFZ"></div>`)
            .append($(`<div type="illust" size="184" class="sc-iasfms-1 hYfnPb"></div>`)
                .append($(`<div width="184" height="184" class="sc-rp5asc-0 fxGVAF"></div>`)
                    .append($(`<a class="sc-d98f2c-0 sc-rp5asc-16 iUsZyY sc-bdnxRM fGjAxR" data-gtm-value="${illust_id}" data-gtm-user-id="${artist_id}" href="/en/artworks/${illust_id}"></a>`)
                        .append($(`<div radius="4" class="sc-rp5asc-9 cYUezH"></div>`)
                            .append($(`<img src="${illust_thumb_url}" alt="${illust_alt}" class="sc-rp5asc-10 eCFXg" style="object-fit: cover; object-position: center center;">`)
                            )))))

            .append($(`<div class="sc-iasfms-0 jtpclu"></div>`)
                .append($(`<a class="${liTitleClass}" href="/en/artworks/${illust_id}">${illust_title}</a>`))));

    // Inject li to appropriate section
    $(`#inj-${suffix}`).append(thumbLi);

    // Add to and update canvas arr
    canvasIds.push(illust_id);
    $(COUNT_DIV_CLASS).text(canvasIds.length);
}

// Recursively search for and inject results via suffix
function handleSuffix(suffix, page = 1) {
    let illustSearchUrl = genSearchUrlSuffixed(getSearchQuery(), suffix, page);
    $.getJSON(illustSearchUrl, function (data) {
        let illustsArr = data.body.illustManga.data;
        illustsArr.forEach(i => {
            injectLi(i, suffix);
        });

        // Kill switch to stop searching next page
        if (canvasIds.length > 1000) return;

        // Recursively get more popular illusts if available
        if (illustsArr.length == 60 && SUFFIXES.slice(0, 5).includes(suffix)) handleSuffix(suffix, page + 1);
    });
}

// Remove all li thumbnail elements and clear id cache
function removeAllLi() {
    $(LI_CLASS).remove();
    canvasIds = [];
    console.log("Removed all thumbs");
}

// Remove the page navigation bar
function removePageNav() {
    $(PAGE_NAV_CLASS).remove();
}


// Get the current mode (illust/manga)
function getCurrMode() {
    let currUrl = window.location.toString();
    // Default to illusts
    var currMode = MODE_ILLUST;
    if (currUrl.includes(`/${MODE_MANGA}`)) {
        currMode = MODE_MANGA;
    }
}

// Define appropriate global li class name
function getLiTitleClass() {
    var liTitleClass = LI_TITLE_LOGGEDIN_CLASS;
    if ($(LOGIN_BANNER_CLASS).length) liTitleClass = LI_TITLE_LOGGEDOUT_CLASS;
}

// To be run before every retrieval
function prepFetch() {
    removeAllLi();
    removePageNav();
    $(COUNT_DIV_CLASS).text("0");

    // Retrieve global configs
    getCurrMode();
    getLiTitleClass();
}

// Callback to retrieve popular via suffix
function popCallback() {
    console.log("Pop running!")

    // Search all possible popular suffixes
    SUFFIXES.forEach(suffix => {
        handleSuffix(suffix);
    });
}

// Generate recommended api url, limit default at 180 (max)
function genRecoUrl(illust_id, limit = 180) {
    return `https://www.pixiv.net/ajax/illust/${illust_id}/recommend/init?limit=${limit}&lang=en`;
}

// Handle recommendations
function handleRecos(illust_id, query) {
    $.getJSON(genRecoUrl(illust_id), function (data) {
        data.body.illusts.forEach(i => {
            // Skip unrelated (might move to injectLi)
            if (i.tags && !i.tags.includes(query)) return;
            injectLi(i);

            // Todo: recursion
            // let recoUrl = genRecoUrl(i.id);
            // handleRecos(recoUrl, query);
        });
    });
}

// Function to fetch and inject alt pop
function altPopCallback() {
    console.log("Alt pop running!");

    let query = getSearchQuery();
    let querySearchUrl = genSearchUrl(query);

    $.getJSON(querySearchUrl, function (data) {
        data.body.popular.permanent.forEach(i => {
            // Inject permanent illusts
            injectLi(i);
            handleRecos(i.id, query);
        });
    });
}

// Remove banner
function removeBanner() {
    $(".sc-jn70pf-2.dhOsiK").parent().remove();
}

function removeInjectedLi() {
    $(`.${INJ_LI_CLASS}`).remove();
}

// Test for pop availability and add callbacks
function addClickCallbacks() {
    // Flag to prioritise pop suffix color
    let popAvail;
    let injPop = $(`#${INJ_POP_ID}`);
    let query = getSearchQuery();

    // Temp search for 100users
    let tempSearchUrlSuffixed = genSearchUrlSuffixed(query, 100);
    $.getJSON(tempSearchUrlSuffixed, function (data) {
        if (data.body.illustManga.data.length) {
            // Results exist for popular suffixed
            popAvail = true;
            injPop.css("color", COLOR_ORANGE);
            injPop.on("click", popCallback);
        }
    });

    // Temp alt pop search
    let tempSearchUrl = genSearchUrl(query);
    $.getJSON(tempSearchUrl, function (data) {
        if (data.body.popular.permanent.length) {
            // Results exist for alt pop
            if (!popAvail) injPop.css("color", COLOR_BLUE);
            injPop.on("click", altPopCallback);
        }
        // Todo: handle popular.recent
    });
}

// Called whenever there is an update to the page
function handleStateChange() {
    // removeBanner();

    // Remove previously injected li
    removeInjectedLi();

    // Reset popular button
    let injPop = $(`#${INJ_POP_ID}`);
    injPop.off();
    injPop.on("click", prepFetch);
    injPop.css("color", "");

    addClickCallbacks();
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

var isPopInjected = document.getElementById(INJ_POP_ID);
if (isPopInjected) {
    // On tag change

    console.log("Already added button!");

    handleStateChange();

} else {
    // First run/manga tab switch

    console.log("Adding button");

    injectJQuery();
    injectPopular();
    injectSections();

    handleStateChange();
}