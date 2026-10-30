# Carpe Diem 1064: how this build was made

The owner installed 1062 and 1063 on the Mac and still saw 1059. The Mac app serves its page from its own address
(127.0.0.1:42049) through pywebview's server, which sent it with a Last-Modified date and no word against keeping it, so
WebKit could go on showing the page it had kept from an earlier build. The same can happen on Windows. As The Forge 647
did, in both programs (`fresh_page.py` holds the code put into `carpe_diem_app.py`):

* `_guard_local_server` / `_no_store`: every answer from the address goes out `Cache-Control: no-store, max-age=0`, with
  no ETag or Last-Modified; and the address answers only Carpe Diem's own window (a request under another host name is
  refused with 421).
* `_forget_old_pages`: the first start of a new build empties the web view's cache of pages (WebKit's disk and memory
  caches on a Mac; `EBWebView/Default/Cache` and `Code Cache` on Windows), never its local storage or databases, and
  notes the build in `page_build.txt` beside the work.
* `_check_page_build`: once the page has loaded, if it names an earlier build than the one installed, it is loaded again
  once under a new name (`?build=N`) at the same address, so the work is the same.

The Mac and Windows workflows now prove it on GitHub's computers: the running app serves its page no-store, with no
validator, the page served is the build in BUILD_INFO, and a request under another name is refused. The Windows workflow
also stops every Carpe Diem process between its steps (the single file leaves a second process behind, which the
one-copy rule of 1063 rightly took for an open copy).

`cd1064.py` applies `p_leaf.py` (the Quiet Screen's leaf wears the moon key's rules, so it hides and folds with its
neighbours) and `p_builders.py` (the kits carry the fixed programs). Test: `python3 tests/t_fresh.py <carpe_diem_app.py>`.
