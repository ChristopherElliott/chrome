// Copyright (c) 2017 
/// <reference path="./typings/index.d.ts" />

// The possible log levels.
var logLevels = {
    "none": 0,
    "error": 1, 
    "info": 2
};

// Defines the current log level. Values other than "none" are for debugging
// only and should at no point be checked in.
var currentLogLevel = logLevels.none;

function containsFeed(doc: Document) {
  debugMsg(logLevels.info, "containsFeed called");

  // Find all the RSS link elements.
  var result = doc.evaluate(
      '//*[local-name()="rss" or local-name()="feed" or local-name()="RDF"]',
      doc, null, 0, null);

  if (!result) {
    debugMsg(logLevels.info, "exiting: document.evaluate returned no results");
    return false;  // This is probably overly defensive, but whatever.
  }

  var node = result.iterateNext();

  if (!node) {
    debugMsg(logLevels.info, "returning: iterateNext() returned no nodes");
    return false;  // No RSS tags were found.
  }

  // The feed for arab dash jokes dot net, for example, contains
  // a feed that is a child of the body tag so we continue only if the
  // node contains no parent or if the parent is the body tag.
  if (node.parentElement && node.parentElement.tagName != "BODY") {
    debugMsg(logLevels.info, "exiting: parentElement that's not BODY");
    return false;
  }

  debugMsg(logLevels.info, "Found feed");

  return true;
}

function debugMsg(loglevel: any, text: any) {
  if (loglevel <= currentLogLevel) {
    console.log("RSS Subscription extension: " + text);
  }
}

interface Feed {
  "href": string, 
  "title": string
}


/**
 * Update all urls 
 */
function updateTabs() {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.

    tabs.forEach((tab) => {

      let feeds: Feed[]; 
      if (!isFeedDocument()) {
        console.info("Document is not a feed, check for <link> tags.");
        feeds = findFeedLinks();
      } 

      let feed = feeds[0]; 

      // A tab is a plain object that provides information about the tab.
      // See https://developer.chrome.com/extensions/tabs#type-Tab
      var url = feed.href; //  tab.url;

      // tab.url is only available if the "activeTab" permission is declared.
      // If you want to see the URL of other tabs (e.g. after removing active:true
      // from |queryInfo|), then the "tabs" permission is required to see their 
      // "url" properties.   
      console.assert(typeof url == 'string', 'tab.url should be a string');

      // url = "https://feedly.com/i/subscription/feed/" + url + "rss"; 

      //Update the url here.
      chrome.tabs.update(tab.id, {url: url});
    })
  });
}
 

// See if the document contains a <link> tag within the <head> and
// whether that points to an RSS feed.  
function findFeedLinks() : Feed[] {
  // Find all the RSS link elements.
  var result = document.evaluate(
      '//*[local-name()="link"][contains(@rel, "alternate")] ' +
      '[contains(@type, "rss") or contains(@type, "atom") or ' +
      'contains(@type, "rdf")]', document, null, 0, null);

  var feeds = [];
  var item;
  var count = 0; 
  while (item = result.iterateNext()) {
    feeds.push({"href": item.baseURI, "title": item.textContent});
    ++count;
  }

  // if (count > 0) {
  //   // Notify the extension needs to show the RSS page action icon.
  //   //chrome.extension.sendMessage({msg: "feedIcon", feeds: feeds});
  //   chrome.extension.sendRequest({msg: "feedIcon", feeds: feeds});
  // }
  return feeds; 
}


// Check to see if the current document is a feed delivered as plain text,
// which Chrome does for some mime types, or a feed wrapped in an html.
function isFeedDocument() {
  var body = document.body;

  console.info("Checking if document is feed");

  var soleTagInBody = "";
  if (body && body.childElementCount == 1) {
    soleTagInBody = body.children[0].tagName;
    console.info("The sole tag in the body is: " + soleTagInBody);
  }

  // Some feeds show up as feed tags within the BODY tag, for example some
  // ComputerWorld feeds. We cannot check for this at document_start since
  // the body tag hasn't been defined at that time (contains only HTML element
  // with no children).
  if (soleTagInBody == "RSS" || soleTagInBody == "FEED" ||
      soleTagInBody == "RDF") {
    console.info("Found feed: Tag is: " + soleTagInBody);
    chrome.extension.sendRequest({msg: "feedDocument", href: location.href});
    return true;
  }

  // Chrome renders some content types like application/rss+xml and
  // application/atom+xml as text/plain, resulting in a body tag with one
  // PRE child containing the XML. So, we attempt to parse it as XML and look
  // for RSS tags within.
  if (soleTagInBody == "PRE") {
    console.info("Found feed: Wrapped in PRE");
    var domParser = new DOMParser();
    var doc = domParser.parseFromString(body.textContent, "text/xml");

    if (currentLogLevel >= logLevels.error) {
      let error = doc.getElementsByTagName("parsererror");
      if (error.length)
        console.error('error: ' + doc.childNodes[0].textContent);
    }

    // |doc| now contains the parsed document within the PRE tag.
    if (containsFeed(doc)) {
      // Let the extension know that we should show the subscribe page.
      chrome.extension.sendRequest({msg: "feedDocument", href: location.href});
      return true;
    }
  }

  console.info("Exiting: feed is not a feed document");

  return false;
}


document.addEventListener('DOMContentLoaded', function() {
  updateTabs();
});
