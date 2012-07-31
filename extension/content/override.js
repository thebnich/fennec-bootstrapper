// -*- Mode: js2; tab-width: 2; indent-tabs-mode: nil; js2-basic-offset: 2; js2-skip-preprocessor-directives: t; -*-
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

function dump(a) {
  Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).logStringMessage(a);
}

function get(params) {
  let xhr = new XMLHttpRequest();
  try {
    xhr.open("GET", params.url, false);
    xhr.channel.loadFlags |= Ci.nsIRequest.LOAD_BYPASS_CACHE;
    
    // prevent the "not well-formed" errors for local XHRs
    if (params.type == "xml")
      xhr.overrideMimeType("text/xml");
    else if (params.type == "text")
      xhr.overrideMimeType("text/plain");
    else if (params.type == "json")
      xhr.overrideMimeType("application/json");

    xhr.send(null);
  } catch (e) {}

  if (xhr.readyState == 4 && (xhr.status == 200 || (xhr.status == 0 && xhr.responseText))) {
    if (params.type == "xml")
      params.success(xhr.responseXML);
    else if (params.type == "text")
      params.success(xhr.responseText);
    else if (params.type == "json")
      try {
        params.success(JSON.parse(xhr.responseText));
      } catch (e) {
        dump("Bootstrapper: " + e);
        params.error && params.error();
      }
  } else {
    params.error && params.error();
  }
}

// set the default pref
Services.prefs.getDefaultBranch("").setCharPref("extensions.bootstrapper.bootstrapURL", "chrome://bootstrapper/content/");

let path = Services.prefs.getCharPref("extensions.bootstrapper.bootstrapURL");
if (path[path.length - 1] != "/")
  path += "/";
if (path.indexOf("://") == -1)
  path = "http://" + path;

let defaultPath = Services.prefs.getDefaultBranch("").getCharPref("extensions.bootstrapper.bootstrapURL");
let systemPrincipal = Cc["@mozilla.org/systemprincipal;1"].createInstance(Ci.nsIPrincipal); 
let win = Services.wm.getMostRecentWindow("navigator:browser");

function loadRemoteSubScript(name, url, scope) {
  get({
    url: url,
    type: "text",
    success: function (script) {
      let sandbox = getSandbox();
      Cu.evalInSandbox(script, sandbox, "1.8", url);
      scope[name] = sandbox[name];
    }
  });
}

function getSandbox() {
  let sandbox = Cu.Sandbox(systemPrincipal, {
    sandboxPrototype: win,
    wantXrays: false
  });
  sandbox.__loadRemoteSubScript__ = loadRemoteSubScript;
  sandbox.__this__ = sandbox;
  return sandbox;
}

function loadReplaceValues(json) {
  let sandbox = getSandbox();

  function loadScript(url) {
    get({
      url: url,
      type: "text",
      success: function (script) {
        for (let i = 0; i < json.length; i++) {
          let replace = json[i];
          let regex = new RegExp(replace.searchValue, "gm");
          let value = replace.newValue.replace("%path%", path);
          script = script.replace(regex, value);
        }
        Cu.evalInSandbox(script, sandbox, "1.8", url);
      }
    });
  }

  get({
    url: path + "content/browser.xul",
    type: "xml",
    success: function (xml) {
      let elements = xml.getElementsByTagName("script");
      for (let i = 0; i < elements.length; i++) {
        let src = elements[i].getAttribute("src");
        let url = src.replace("chrome://browser/content/", path + "content/");
        loadScript(url);
      }
    },
    error: function () {
      dump("Bootstrapper: could not find '" + path + "content/browser.xul'; using browser.xul from build.", "short");
      get({
        url: defaultPath + "browser.xul",
        type: "xml",
        success: function (xml) {
          let elements = xml.getElementsByTagName("script");
          for (let i = 0; i < elements.length; i++) {
            let url = elements[i].getAttribute("src");
            loadScript(url);
          }
        }
      });
    }
  });
}

get({
  url: path + "replace.json",
  type: "json",
  success: function (json) {
    loadReplaceValues(json);
  },
  error: function (json) {
    dump("Bootstrapper: could not find '" + path + "replace.json'; using default replacements");
    get({
      url: defaultPath + "replace.json",
      type: "json",
      success: function (json) {
        loadReplaceValues(json);
      }
    });
  }
});

