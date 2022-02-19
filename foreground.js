function getOrigSearchQuery() {
    let searchBox = $(".sc-5ki62n-4.eOTMOA"); // Might be user specific
    if (!searchBox.length) searchBox = $(".sc-5ki62n-4.dMJvPw"); // Not logged in
    let origSearchQuery = searchBox.attr("value");

    // Remove suffix if exists
    const queryReg = /([1|3|5]0+users入り)$/g;
    let queryMatch = origSearchQuery.match(queryReg);
    if (queryMatch) {
        let suffixLen = queryMatch[0].length;
        origSearchQuery = origSearchQuery.slice(0, 0 - suffixLen);
    }

    return origSearchQuery;
}

function genIllustSearchUrl(origSearchQuery, suffix = 100, page = 1) {
    let searchQuery = origSearchQuery + suffix + "users入り";
    let illustSearchUrl = `https://www.pixiv.net/ajax/search/artworks/${searchQuery}?word=${searchQuery}&order=date&mode=all&p=${page}&s_mode=s_tag&type=all&lang=en`;
    return illustSearchUrl;
}

function searchThisSuffix(suffix, page = 1) {
    let illustCountDiv = $(".sc-7zddlj-2.dVRwUc").find("span");

    // Get search query
    let origSearchQuery = getOrigSearchQuery();
    let illustSearchUrl = genIllustSearchUrl(origSearchQuery, suffix, page);
    // console.log(illustSearchUrl);

    // For title formatting
    let titleClass;
    if ($(".sc-oh3a2p-4.gHKmNu").length) titleClass = "sc-d98f2c-0 sc-iasfms-4 hFGeeG";
    else titleClass = "sc-d98f2c-0 sc-iasfms-4 cTvdTb";

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

            let illust_tags = i.tags;
            if (illust_tags.includes("虚偽users入りタグ")) {
                // Skip fakes
                skipped_items += 1;
                return;
            }

            // Get illust attributes
            let illust_id = i.id;
            let artist_id = i.userId;
            let illust_thumb_url = i.url;
            let illust_alt = i.alt;
            let illust_title = i.title;

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

function getPopular() {
    // Get elements
    let thumbsUl = $(".sc-l7cibp-1.krFoBL");
    let illustCountDiv = $(".sc-7zddlj-2.dVRwUc").find("span");
    let pageNav = $(".sc-xhhh7v-0.kYtoqc");

    // Make some UI changes
    $(".sc-7zddlj-3.kWbWNM").eq(-1).text("Popular Illustrations");
    $(pageNav).remove();
    $(illustCountDiv).text("0");
    $(thumbsUl).html("");

    // Inject sections
    thumbsUl
        .append($(`<div id="inj-100000" class="inj-sect"></div>`))
        .append($(`<div id="inj-50000" class="inj-sect"></div>`))
        .append($(`<div id="inj-10000" class="inj-sect"></div>`))
        .append($(`<div id="inj-5000" class="inj-sect"></div>`))
        .append($(`<div id="inj-1000" class="inj-sect"></div>`))
        .append($(`<div id="inj-500" class="inj-sect"></div>`))
        .append($(`<div id="inj-100" class="inj-sect"></div>`));
    $(".inj-sect").css("display", "contents");

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
    let tempIllustSearchUrl = genIllustSearchUrl(getOrigSearchQuery());
    $.getJSON(tempIllustSearchUrl, function (data) {
        if (data.body.illustManga.data.length) {
            // console.log(data.body.illustManga.data);
            $("#pop").css("color", "rgb(255 126 48)");
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

var currMode = "illust";

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

    // Inject Popular button
    popSortElem = $(".sc-1xl12os-0.sc-rkvk44-0.cvJBhn.jSdItB").parent();
    newPopElem = popSortElem.clone();
    newPopElem.html("Popular");
    newPopElem.attr("id", "pop");

    // Add click callback
    newPopElem.on("click", getPopular);
    popSortElem.after(newPopElem);

    preCheckPopular();
}