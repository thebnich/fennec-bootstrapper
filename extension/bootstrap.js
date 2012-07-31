// -*- Mode: js2; tab-width: 2; indent-tabs-mode: nil; js2-basic-offset: 2; js2-skip-preprocessor-directives: t; -*-
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

/* Bootstrap Interface */

function startup(aData, aReason) {}
function shutdown (aData, aReason) {}
function install (aData, aReason) {
  let win = Services.wm.getMostRecentWindow("navigator:browser");

  let buttons = [{
    label: win.Strings.browser.GetStringFromName("notificationRestart.button"),
    callback: function() {
      // Notify all windows that an application quit has been requested
      let cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].createInstance(Ci.nsISupportsPRBool);
      Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");

      // If nothing aborted, quit the app
      if (cancelQuit.data == false) {
        let appStartup = Cc["@mozilla.org/toolkit/app-startup;1"].getService(Ci.nsIAppStartup);
        appStartup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit);
      }
    }
  }];

  let value = "";
  try {
    value = Services.prefs.getCharPref("extensions.bootstrapper.bootstrapURL");
  } catch (e) {}

  let obj = { value: value };
  if (Services.prompt.prompt(null, "Enter bootstrap URL", "A 'content/' subdirectory, containing browser.xul, must exist at this location. Do not include 'content/' in the URL.", obj, null, {})) {
    Services.prefs.setCharPref("extensions.bootstrapper.bootstrapURL", obj.value);
    let message = win.Strings.browser.GetStringFromName("notificationRestart.normal");
    win.NativeWindow.doorhanger.show(message, "addon-app-restart", buttons, win.BrowserApp.selectedTab.id, { persistence: -1 });
  }
}

function uninstall (aData, aReason) {}
