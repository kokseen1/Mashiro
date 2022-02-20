function suffixRegex(query) {
    const queryReg = /(([1|3|5]0+)users入り)$/;
    let queryMatch = query.match(queryReg);
    // queryMatch[0/1]: 100users入り
    // queryMatch[2]: 100
    return queryMatch;
}

function getOrigSearchQuery() {
    let searchBox = $(".sc-5ki62n-4.eOTMOA"); // Might be user specific
    if (!searchBox.length) searchBox = $(".sc-5ki62n-4.dMJvPw"); // Not logged in
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

function genSuffixedSearchUrl(origSearchQuery, suffix = 100, page = 1) {
    let searchQuery = origSearchQuery + suffix + "users入り";
    let illustSearchUrl = genSearchUrl(searchQuery, page);
    return illustSearchUrl;
}

function injectLi(i, suffix) {
    let illust_tags = i.tags;
    if (!illust_tags) return;
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
    let artist_id = i.userId;
    let illust_thumb_url = i.url;
    let illust_alt = i.alt;
    let illust_title = i.title;
    console.log("Injecting", illust_id, suffix);

    // Craft li
    let thumbLi = $(`<li class='sc-l7cibp-2 gpVAva inj-li'></li>`)
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
                .append($(`<a class="${titleClass}" href="/en/artworks/${illust_id}">${illust_title}</a>`))));

    // Inject li to appropriate section
    $(`#inj-${suffix}`).append(thumbLi);
    canvasIds.push(illust_id);
}

function searchThisSuffix(suffix, page = 1) {
    let illustCountDiv = $(".sc-7zddlj-2.dVRwUc").find("span");

    // Get search query
    let origSearchQuery = getOrigSearchQuery();
    let illustSearchUrl = genSuffixedSearchUrl(origSearchQuery, suffix, page);
    // console.log(illustSearchUrl);



    $.getJSON(illustSearchUrl, function (data) {
        let skipped_items = 0;
        let illustsArr = data.body.illustManga.data;
        let suffixResultsLen = illustsArr.length;

        illustsArr.forEach(i => {

            let illust_type = i.illustType;
            if (currMode == "illust" && illust_type == 1) {
                // Skip manga
                skipped_items += 1;
                return;
            }
            if (currMode == "manga" && illust_type == 0) {
                // Skip illust
                skipped_items += 1;
                return;
            }

            // Todo: Move to injectLi
            let illust_tags = i.tags;
            if (illust_tags.includes("虚偽users入りタグ")) {
                // Skip fakes
                skipped_items += 1;
                return;
            }

            injectLi(i, suffix);

        });

        // Update count
        let currIllustCount = parseInt(illustCountDiv.text());
        let netResultsLen = suffixResultsLen - skipped_items;
        illustCountDiv.text((currIllustCount + netResultsLen).toString());

        console.log(`${suffix}users p${page}: ${netResultsLen} items`);

        // Killswitch
        if (currIllustCount > 2000) {
            return;
        }

        // Recursively get more popular illusts
        if (suffixResultsLen == 60 && ["100000", "50000", "30000", "10000", "5000"].includes(suffix)) searchThisSuffix(suffix, page + 1);

    });
}

function removeAllLi() {
    $(".sc-l7cibp-2.gpVAva").remove();
    console.log("removed all li");
}

function getPopular() {
    // Get elements
    let illustCountDiv = $(".sc-7zddlj-2.dVRwUc").find("span");
    let pageNav = $(".sc-xhhh7v-0.kYtoqc");

    // Make some UI changes
    $(".sc-7zddlj-3.kWbWNM").eq(-1).text("Popular Illustrations");
    $(pageNav).remove();
    $(illustCountDiv).text("0");
    removeAllLi();
    // $(thumbsUl).html("");



    // Dont bother using sync
    // $.ajaxSetup({
    //     async: false
    // });
    // Search all possible suffixes
    let suffixes = ["100000", "50000", "30000", "10000", "5000", "1000", "500", "100", "50"];
    suffixes.forEach(suffix => {
        searchThisSuffix(suffix);
    })
    // $.ajaxSetup({
    // async: true
    // });
}

function genRecoUrl(illust_id, limit = 180) {
    return `https://www.pixiv.net/ajax/illust/${illust_id}/recommend/init?limit=${limit}&lang=en`
}

function handleRecos(recoUrl, query) {
    $.getJSON(recoUrl, function (data) {
        let recoIllustsArr = data.body.illusts;
        console.log(data);
        recoIllustsArr.forEach(i => {
            // Skip unrelated
            if (i.tags && !i.tags.includes(query)) {
                console.log("unrelated skipped", i.tags, query)
                return;
            }
            injectLi(i);
        });
    });
}

function altPopSearch() {
    let query = getOrigSearchQuery();
    // Try popular key
    $.getJSON(genSearchUrl(query), function (data) {
        let permaIllustArr = data.body.popular.permanent;
        console.log(data);
        removeAllLi();
        let pageNav = $(".sc-xhhh7v-0.kYtoqc");
        $(pageNav).remove();
        permaIllustArr.forEach(i => {
            let illust_id = i.id;
            injectLi(i);
            let recoUrl = genRecoUrl(illust_id);
            console.log(recoUrl);
            handleRecos(recoUrl, query);
        });
    });
}

function preCheckPopular() {
    // Remove banner
    $(".sc-jn70pf-2.dhOsiK").parent().remove();

    // Hide if unnecessary
    let thumbsUl = $(".sc-l7cibp-1.krFoBL");
    // console.log("Hide?: ", thumbsUl.length);
    if (!thumbsUl.length) {
        $("#pop").hide();
        return;
    } else {
        $("#pop").show();
    }

    currMode = "illust";
    if (window.location.toString().endsWith("manga")) {
        currMode = "manga";
    }

    // Temp search for 100users
    let query = getOrigSearchQuery();
    let tempIllustSearchUrl = genSuffixedSearchUrl(query);
    $.getJSON(tempIllustSearchUrl, function (data) {
        if (data.body.illustManga.data.length) {
            // Results exist
            $("#pop").css("color", "rgb(255 126 48)");
        } else {
            newPopElem.on("click", altPopSearch);
        }
    });
}

function injectJQuery() {
    let script = document.createElement('script');
    script.id = "inj-script";
    script.src = chrome.runtime.getURL("jquery-3.6.0.min.js")
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);
}

// For title formatting
var titleClass = "sc-d98f2c-0 sc-iasfms-4 cTvdTb";

var currMode = "illust";

var canvasIds = [];

if (document.getElementById("pop")) {
    console.log("Already added button!");
    // Clear injected elements
    $(".inj-li").remove();
    // Reset popular button
    $("#pop").css("color", "");

    preCheckPopular();
} else {
    // First run
    console.log("Adding button");

    // Add jQuery
    injectJQuery();

    // var popSortElem = $(".sc-93qi7v-0.csPOOw");
    // if (!popSortElem.length) popSortElem = $(".sc-93qi7v-3.gRZmyd");
    // $(".sc-93qi7v-0.hMbqKA")



    // Todo: move incognito/logged in checks all to one place
    if ($(".sc-oh3a2p-4.gHKmNu").length) titleClass = "sc-d98f2c-0 sc-iasfms-4 hFGeeG";
    else titleClass = "sc-d98f2c-0 sc-iasfms-4 cTvdTb";

    // Inject Popular button
    popSortElem = $(".sc-1xl12os-0.sc-rkvk44-0.cvJBhn.jSdItB").parent();
    newPopElem = popSortElem.clone();
    newPopElem.html("Popular");
    newPopElem.attr("id", "pop");

    // Add click callback
    newPopElem.on("click", getPopular);
    popSortElem.after(newPopElem);

    // Inject sections
    let thumbsUl = $(".sc-l7cibp-1.krFoBL");
    thumbsUl
        .append($(`<div id="inj-100000" class="inj-sect"></div>`))
        .append($(`<div id="inj-50000" class="inj-sect"></div>`))
        .append($(`<div id="inj-10000" class="inj-sect"></div>`))
        .append($(`<div id="inj-5000" class="inj-sect"></div>`))
        .append($(`<div id="inj-1000" class="inj-sect"></div>`))
        .append($(`<div id="inj-500" class="inj-sect"></div>`))
        .append($(`<div id="inj-100" class="inj-sect"></div>`));
    $(".inj-sect").css("display", "contents");

    preCheckPopular();
}