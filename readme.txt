Fennec bootstrapper
Source: https://github.com/thebnich/fennec-bootstrapper
XPI:    http://people.mozilla.com/~bnicholson/bootstrapper.xpi

What it is:
This extension allows you to dynamically load chrome code in
mobile/android/chrome/content/ from a remote location. This means you don't
need to rebuild to test your changes.


How it works:
When you install the extension, you provide a URL containing:
  * A content/ directory; this can be pulled directly from your
    mobile/android/chrome source directory.
  * A replace.json file; this contains regex replacements used when the
    bootstrapped scripts are executed. These remove preprocessing directives,
    replace chrome:// URLs, and do other replacements necessary for running
    these scripts without having to modify them directly.


How to use it:
1) Copy the contents of remote/ to somewhere on your server.

2) Replace the content/ directory with the content/ directory from your source.
   Ideally, this will be a "live" working copy so you don't need to copy files
   every time you make a change; you can just symlink the directory if you're
   hosting from your development machine, or you can use lsyncd to synchronize
   your source directory with a remote server. You can also point to
   "file:///sdcard/..." if you want to pull the scripts locally from your phone.

   If using lsyncd, you can add something like this to /etc/rc.local:
   lsyncd -rsync ~/mozilla/inbound/mobile/android/chrome/content/ people.mozilla.org:/home/bnicholson/public_html/bootstrapped/content -delay 5

   You should end up with something like this on your server:
   http://people.mozilla.com/~bnicholson/bootstrapped/

3) Download the extension: http://people.mozilla.com/~bnicholson/bootstrapper.xpi

4) When prompted, enter your server URL
   (e.g., http://people.mozilla.com/~bnicholson/bootstrapped/).

5) Restart.

6) At this point, you should be running bootstrapped files from your server.
   Add a toast to browser.js, restart Fennec, and (hopefully) see it appear!


Other notes:
* The URL is stored in the "extensions.bootstrapper.bootstrapURL" preference.
* grep for "Bootstrapper" in logcat to look for any errors.
