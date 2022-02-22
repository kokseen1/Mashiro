console.log("Running foreground");
var JQUERY_SCRIPT_ID = "inj-script";
var JQUERY_PATH = "jquery-3.6.0.min.js";
var LOGIN_BANNER_CLASS = ".sc-oh3a2p-4.gHKmNu";
var POP_SORT_ICON_CLASS = ".sc-1xl12os-0.sc-rkvk44-0.cvJBhn.jSdItB";

// For title formatting
var LI_TITLE_CLASS_LOGGEDOUT = "sc-d98f2c-0 sc-iasfms-4 hFGeeG";
var LI_TITLE_CLASS_LOGGEDIN = "sc-d98f2c-0 sc-iasfms-4 cTvdTb bZOnOL";
var THUMBS_UL_CLASS = ".sc-l7cibp-1.krFoBL";

var MODE_ILLUST = "illust";
var MODE_MANGA = "manga";

var COLOR_ORANGE = "rgb(255 126 48)";
var COLOR_BLUE = "rgb(0 150 240)";
var SUFFIXES = ["100000", "50000", "30000", "10000", "5000", "1000", "500", "100", "50"];
var LI_CLASS = ".sc-l7cibp-2.gpVAva";
var COUNT_DIV_CLASS = ".sc-7zddlj-2.dVRwUc";
// var COUNT_SPAN = $(COUNT_DIV_CLASS).find("span");
// var COUNT_SPAN = "#root > div:nth-child(2) > div.sc-1nr368f-2.kBWrTb > div > div.sc-15n9ncy-0.jORshO > div > section:nth-child(3) > div.sc-7zddlj-0.dFLqqk > div > div > div > span";

var currMode = MODE_ILLUST;
var canvasIds = [];
var liTitleClass = LI_TITLE_CLASS_LOGGEDIN;

var TAG_FAKE = "虚偽users入りタグ";

var SEARCHBOX_LIGHT_SELECTOR = "#root > div:nth-child(2) > div.sc-12xjnzy-0.dIGjtZ > div:nth-child(1) > div:nth-child(1) > div > div.sc-epuuy1-0.hxckiU > form > div > input";

var SEARCHBOX_DARK_SELECTOR = "#root > div:nth-child(2) > div.sc-12xjnzy-0.iqkFre > div:nth-child(1) > div:nth-child(1) > div > div.sc-epuuy1-0.hxckiU > form > div > input";

var INJ_POP_ID = "inj-pop";

function suffixRegex(query) {
    // console.log(query);
    const queryReg = /(([1|3|5]0+)users入り)$/;
    let queryMatch = query.match(queryReg);
    // queryMatch[0/1]: 100users入り
    // queryMatch[2]: 100
    return queryMatch;
}

function getOrigSearchQuery() {

    // let searchBox = $(".sc-5ki62n-4.eOTMOA"); // Might be user specific
    // if (!searchBox.length) searchBox = $(".sc-5ki62n-4.dMJvPw"); // Not logged in


    let searchBox = $(SEARCHBOX_LIGHT_SELECTOR); // Light theme
    if (!searchBox.length) searchBox = $(SEARCHBOX_DARK_SELECTOR); // Dark theme
    let origSearchQuery = searchBox.attr("value");

    // Remove suffix if exists
    let queryMatch = suffixRegex(origSearchQuery);
    if (queryMatch) {
        let suffixLen = queryMatch[0].length;
        origSearchQuery = origSearchQuery.slice(0, 0 - suffixLen);
    }

    return origSearchQuery;
}

function genSearchUrl(searchQuery, page = 1) {
    // Urlencode characters
    let encodedSearchQuery = encodeURIComponent(searchQuery);
    let illustSearchUrl = `https://www.pixiv.net/ajax/search/artworks/${encodedSearchQuery}?word=${encodedSearchQuery}&order=date&mode=all&p=${page}&s_mode=s_tag&type=all&lang=en`;
    return illustSearchUrl;
}

function genSuffixedSearchUrl(origSearchQuery, suffix, page = 1) {
    let searchQuery = `${origSearchQuery}${suffix}users入り`;
    let illustSearchUrl = genSearchUrl(searchQuery, page);
    return illustSearchUrl;
}

function injectLi(i, suffix) {
    let illust_tags = i.tags;
    if (!illust_tags) return;
    // Skip fakes
    if (illust_tags.includes(TAG_FAKE)) return;
    let popClass = "pop-alt";
    if (suffix) popClass = "pop-suf";
    illust_tags.forEach(tag => {
        let suffixReg = suffixRegex(tag);
        if (suffixReg) {
            suffix = suffixReg[2];
            return;
        }
    });
    // Not popular (tentative)
    if (!suffix) return;

    // Get illust attributes
    let illust_id = i.id;
    if (canvasIds.includes(illust_id)) return;
    let illust_type = i.illustType;
    if (currMode == MODE_ILLUST && illust_type == 1) {
        // Skip manga
        return;
    }
    if (currMode == MODE_MANGA && illust_type == 0) {
        // Skip illust
        return;
    }
    let artist_id = i.userId;
    let illust_thumb_url = i.url;
    let illust_alt = i.alt;
    let illust_title = i.title;
    // console.log("Injecting", illust_id, suffix);

    // Craft li
    let thumbLi = $(`<li class='sc-l7cibp-2 gpVAva inj-li ${popClass}'></li>`)
        .append($(`<div class="sc-iasfms-3 jDiQFZ"></div>`)
            .append($(`<div type="illust" size="184" class="sc-iasfms-1 hYfnPb"></div>`)
                .append($(`<div width="184" height="184" class="sc-rp5asc-0 fxGVAF"></div>`)
                    .append($(`<a class="sc-d98f2c-0 sc-rp5asc-16 iUsZyY sc-bdnxRM fGjAxR"
    data-gtm-value="${illust_id}" data-gtm-user-id="${artist_id}" href="/en/artworks/${illust_id}"></a>`)
                        .append($(`<div radius="4" class="sc-rp5asc-9 cYUezH"></div>`)
                            .append($(`<img
    src="${illust_thumb_url}"
    alt="${illust_alt}" class="sc-rp5asc-10 eCFXg"
    style="object-fit: cover; object-position: center center;">`)
                            )))))
            .append($(`<div class="sc-iasfms-0 jtpclu"></div>`)
                .append($(`<a class="${liTitleClass}" href="/en/artworks/${illust_id}">${illust_title}</a>`))));

    // Inject li to appropriate section
    $(`#inj-${suffix}`).append(thumbLi);
    canvasIds.push(illust_id);
    console.log(canvasIds.length);
    getCountSpan().text(canvasIds.length);
}

function searchThisSuffix(suffix, page = 1) {
    // Get search query
    let origSearchQuery = getOrigSearchQuery();
    let illustSearchUrl = genSuffixedSearchUrl(origSearchQuery, suffix, page);
    console.log(illustSearchUrl);


    $.getJSON(illustSearchUrl, function (data) {
        // console.log(illustSearchUrl);
        let illustsArr = data.body.illustManga.data;

        illustsArr.forEach(i => {
            // console.log(i);

            injectLi(i, suffix);

        });

        // Update count
        // let currIllustCount = parseInt(getCountSpan().text());
        // let netResultsLen = suffixResultsLen - skipped_items;
        // illustCountDiv.text((currIllustCount + netResultsLen).toString());

        // console.log(`${suffix}users p${page}: ${netResultsLen} items`);

        // Killswitch
        if (canvasIds.length > 2000) {
            return;
        }

        // Recursively get more popular illusts
        if (illustsArr.length == 60 && SUFFIXES.slice(0, 5).includes(suffix)) searchThisSuffix(suffix, page + 1);

    });
}


function removeAllLi() {
    $(LI_CLASS).remove();
    canvasIds = [];
    console.log("removed all li");
}

function removePageNav() {
    let pageNav = $(".sc-xhhh7v-0.kYtoqc");
    $(pageNav).remove();
}

function getCountSpan() {
    return $(COUNT_DIV_CLASS).find("span");
}

function prepFetch() {
    removeAllLi();
    removePageNav();
    getCountSpan().text("0");
    // $(".sc-7zddlj-3.kWbWNM").text("Popular Illustrations");
    $("#root > div:nth-child(2) > div.sc-1nr368f-2.kBWrTb > div > div.sc-15n9ncy-0.jORshO > div > section:nth-child(3) > div.sc-7zddlj-0.dFLqqk > div > h3").text("Popular Illustrations");
}

function getPopular() {
    console.log("pop running!")
    // $(thumbsUl).html("");
    // Dont bother using sync
    // $.ajaxSetup({
    //     async: false
    // });
    // Search all possible suffixes

    SUFFIXES.forEach(suffix => {
        searchThisSuffix(suffix);
    })
    // $.ajaxSetup({
    // async: true
    // });
}

function genRecoUrl(illust_id, limit = 180) {
    return `https://www.pixiv.net/ajax/illust/${illust_id}/recommend/init?limit=${limit}&lang=en`
}

function handleRecos(illust_id, query) {
    $.getJSON(genRecoUrl(illust_id), function (data) {
        let recoIllustsArr = data.body.illusts;
        recoIllustsArr.forEach(i => {
            // Skip unrelated (might move to injectLi)
            if (i.tags && !i.tags.includes(query)) {
                // console.log("unrelated skipped", i.tags, query)
                return;
            }
            // if (canvasIds.includes(i.id)) return;
            injectLi(i);
            // let recoUrl = genRecoUrl(i.id);
            // handleRecos(recoUrl, query);
        });
    });
}

function getAltPop() {
    console.log("alt pop running!");
    let query = getOrigSearchQuery();
    // Try popular key
    let querySearchUrl = genSearchUrl(query);
    $.getJSON(querySearchUrl, function (data) {
        let permaIllustArr = data.body.popular.permanent;
        // console.log("query",querySearchUrl);
        // removeAllLi();
        permaIllustArr.forEach(i => {
            // console.log(i);
            injectLi(i);
            // console.log(recoUrl);
            handleRecos(i.id, query);
        });
    });
}

function removeBanner() {
    // Remove banner
    $(".sc-jn70pf-2.dhOsiK").parent().remove();
}


function preCheckPopular() {
    let injPop = $("#inj-pop");
    injPop.off();
    // removeBanner();

    // Hide if unnecessary
    // let thumbsUl = $(THUMBS_UL_CLASS);
    // console.log("Hide?: ", thumbsUl.length);
    // if (!thumbsUl.length) {
    //     console.log("hiding inj")
    //     injPop.hide();
    //     return;
    // } else {
    //     console.log("showing inj")
    //     injPop.show();
    // }

    // Set mode
    if (window.location.toString().includes(`/${MODE_MANGA}`)) {
        currMode = MODE_MANGA;
    }

    // Todo: move incognito/logged in checks all to one place
    if ($(LOGIN_BANNER_CLASS).length) liTitleClass = LI_TITLE_CLASS_LOGGEDOUT;

    // Reset popular button
    injPop.css("color", "");
    injPop.on("click", prepFetch);

    // Temp search for 100users
    let origQuery = getOrigSearchQuery();
    let popAvail;

    let tempIllustSearchUrl = genSuffixedSearchUrl(origQuery, 100);
    $.getJSON(tempIllustSearchUrl, function (data) {
        if (data.body.illustManga.data.length) {
            // Results exist
            popAvail = true;
            injPop.css("color", COLOR_ORANGE);
            injPop.on("click", getPopular);
        }
    });

    let tempQuerySearchUrl = genSearchUrl(origQuery);
    $.getJSON(tempQuerySearchUrl, function (data) {
        if (data.body.popular.permanent.length) {
            if (!popAvail) injPop.css("color", COLOR_BLUE);
            injPop.on("click", getAltPop);
        }
    });
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


function injectPopular() {
    // Inject Popular button
    let ogPopSort = $(POP_SORT_ICON_CLASS).parent();
    let injPop = ogPopSort.clone();
    injPop.text("Popular");
    injPop.attr("id", INJ_POP_ID);


    // injPop.on("click", removeAllLi);
    ogPopSort.after(injPop);
}

function injectSections() {
    if ($(".inj-sect").length) return;
    // Inject sections
    let thumbsUl = $(THUMBS_UL_CLASS);
    SUFFIXES.forEach(suffix => {
        thumbsUl.append($(`<div id="inj-${suffix}" class="inj-sect"></div>`))
    });
    // thumbsUl
    //     .append($(`<div id="inj-100000" class="inj-sect"></div>`))
    //     .append($(`<div id="inj-50000" class="inj-sect"></div>`))
    //     .append($(`<div id="inj-10000" class="inj-sect"></div>`))
    //     .append($(`<div id="inj-5000" class="inj-sect"></div>`))
    //     .append($(`<div id="inj-1000" class="inj-sect"></div>`))
    //     .append($(`<div id="inj-500" class="inj-sect"></div>`))
    //     .append($(`<div id="inj-100" class="inj-sect"></div>`))
    //     .append($(`<div id="inj-50" class="inj-sect"></div>`));
    // $(".inj-sect").css("display", "contents");
}

var isPopInjected = document.getElementById(INJ_POP_ID);

if (isPopInjected) {
    // On tag change
    console.log("Already added button!");
    // Can move to pre
    // Clear injected elements
    $(".inj-li").remove();


    preCheckPopular();
} else {
    // First run/manga tab switch
    console.log("Adding button");

    // Add jQuery
    injectJQuery();

    injectPopular();
    injectSections();

    preCheckPopular();
}