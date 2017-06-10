// Copyright (c) 2010 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Whether we can modify the list of readers.
declare var defaultReader: any; 
var storageEnabled = window.localStorage != null;

/**
*  Returns the default list of feed readers.
*/
function defaultReaderList() {
  // This is the default list, unless replaced by what was saved previously.
  return [
    { 'url': 'https://feedly.com/i/subscription/feed/%s',
      'description': 'Feedly'
    }
  ];
}

/**
* Check to see if the current item is set as default reader.
*/
function isDefaultReader(url) {
  defaultReader = window.localStorage.defaultReader ?
                      window.localStorage.defaultReader : "";
  return url == defaultReader;
}

/**
* Find an element with |id| and replace the text of it with i18n message with
* |msg| key.
*/
function i18nReplaceImpl(id, msg, attribute) {
  var element = document.getElementById(id);
  if (element) {
    if (attribute)
      element.setAttribute(attribute, chrome.i18n.getMessage(msg));
    else
      element.innerText = chrome.i18n.getMessage(msg);
  }
}

/**
* Same as i18nReplaceImpl but provided for convenience for elements that have
* the same id as the i18n message id.
*/
function i18nReplace(msg) {
  i18nReplaceImpl(msg, msg, '');
}
