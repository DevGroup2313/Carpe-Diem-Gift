/*
   CARPE DIEM  |  Copyright (c) 2026 Yannie D. Forest. All rights reserved.
   NO LICENCE IS GRANTED. No copying, adaptation, redistribution, reverse
   engineering or commercial use without the author's written permission.
   See LICENCE.txt. Every distributed copy carries a build marker.
*/
package com.yannie.carpediem;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.net.Uri;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.graphics.Color;
import android.database.Cursor;
import android.provider.OpenableColumns;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;

public class MainActivity extends Activity {
    private WebView web;
    // The file chooser bridge. Android WebViews do NOT open <input type=file>
    // on their own: without onShowFileChooser the Import buttons silently do
    // nothing, which is exactly what happened on the tablet.
    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST = 4711;

    // The SAVE bridge. A blob download in a WebView is opened as a page, which
    // showed the raw backup text and lost the app. Export instead calls
    // window.CarpeNative.saveFile, which opens the system Save dialog here and
    // writes the chosen file itself. The Save dialog needs no storage permission.
    private static final int SAVE_FILE_REQUEST = 4712;
    private String pendingSaveB64;

    // THE MICROPHONE, ASKED FOR PROPERLY (build 1044). Granting the page's
    // request is not enough on Android 6 and later: the app itself must hold
    // the microphone permission, and Android grants that only when the person
    // says yes to its own question. Until 1044 the app never asked, so on a
    // tablet that had not been set by hand, Scriba's microphone stayed silent.
    // Now the page's request waits while Android asks, and is granted or
    // refused by the answer.
    private static final int MIC_REQUEST = 4713;
    private PermissionRequest pendingMic;

    // BUILD 1046: THE TABLET'S OWN WRITING MODEL, for Scriba's summaries,
    // ported from Inkwell 7.36: llama.cpp in a process of its own
    // (ModelService), files downloaded or imported by ModelHost. The page
    // reaches it through window.CarpeModelHost; events come back through
    // window.__cdModelEvent. Nothing starts until the page asks.
    private static final int MODEL_IMPORT_REQUEST = 4714;
    private ModelHost models;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        models = new ModelHost(this, ev -> {
            if (web != null) web.evaluateJavascript("window.__cdModelEvent&&window.__cdModelEvent("
                    + JSONObject.quote(ev.toString()) + ")", null);
        });
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        // A floating window is an iframe pointing at this same file, so the
        // WebView must let a file:// page load a file:// subframe. Without
        // these the floating windows stay blank on some WebView versions.
        try {
            s.setAllowFileAccessFromFileURLs(true);
            s.setAllowUniversalAccessFromFileURLs(true);
        } catch (Throwable ignored) {
        }
        s.setMediaPlaybackRequiresUserGesture(false);
        web.setBackgroundColor(Color.parseColor("#1B6B93"));
        // The app loads only its own HTML from assets, so the only page that can
        // reach this interface is Carpe Diem's own.
        web.addJavascriptInterface(new CarpeBridge(), "CarpeNative");
        web.addJavascriptInterface(new ModelBridge(), "CarpeModelHost");
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override public void run() {
                        boolean wantsMic = false;
                        for (String r : request.getResources()) {
                            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) wantsMic = true;
                        }
                        if (wantsMic && Build.VERSION.SDK_INT >= 23
                                && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                            if (pendingMic != null) { try { pendingMic.deny(); } catch (Exception e) {} }
                            pendingMic = request;
                            requestPermissions(new String[]{ Manifest.permission.RECORD_AUDIO }, MIC_REQUEST);
                            return;
                        }
                        request.grant(request.getResources());
                    }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                return true;
            }
        });
        // The app is served over https from its own assets rather than opened
        // as a file. A file:// page CANNOT put another file:// document in an
        // iframe, which is why the floating windows were empty on the tablet and
        // had to fall back to carrying a studio alone. Served this way the origin
        // is ordinary, the iframe is allowed, and a floating window carries the
        // WHOLE application exactly as the desktop one does.
        // The handler only ever reads app/src/main/assets. The INTERNET
        // permission is there for what can use a connection, such as Scriba's
        // first fetch of Whisper; the app itself always comes from inside.
        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        web.setWebViewClient(new WebViewClientCompat() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });
        web.loadUrl("https://appassets.androidplatform.net/assets/carpe_diem.html");
        setContentView(web);
    }

    // Exposed to the page as window.CarpeNative. The page calls saveFile when the
    // person exports a backup; it hands over the bytes as base64 and this opens the
    // system Save dialog. The file is written in onActivityResult once a place is
    // chosen. Returns true when the dialog is being opened, so the page knows the
    // native path was taken; false lets the page fall back to Copy.
    public class CarpeBridge {
        @JavascriptInterface
        public boolean saveFile(final String name, final String mime, final String b64) {
            try {
                pendingSaveB64 = b64;
                final String type = (mime == null || mime.length() == 0) ? "application/octet-stream" : mime;
                final String fname = (name == null || name.length() == 0) ? "carpe-diem-backup.json" : name;
                runOnUiThread(new Runnable() {
                    @Override public void run() {
                        try {
                            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                            intent.addCategory(Intent.CATEGORY_OPENABLE);
                            intent.setType(type);
                            intent.putExtra(Intent.EXTRA_TITLE, fname);
                            startActivityForResult(intent, SAVE_FILE_REQUEST);
                        } catch (Exception e) {
                            pendingSaveB64 = null;
                        }
                    }
                });
                return true;
            } catch (Exception e) {
                pendingSaveB64 = null;
                return false;
            }
        }

        // Build 1048: the page's right-click Paste reads the clipboard through the app, so a
        // link copied in another app can be pasted without a keyboard. It is read only when
        // Paste is pressed, and nothing is kept or sent anywhere. Returns {"text","html"}.
        @JavascriptInterface
        public String clipboardRead() {
            final String[] out = { "{}" };
            final java.util.concurrent.CountDownLatch done = new java.util.concurrent.CountDownLatch(1);
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    try {
                        android.content.ClipboardManager cm = (android.content.ClipboardManager)
                                getSystemService(android.content.Context.CLIPBOARD_SERVICE);
                        String text = "", html = "";
                        if (cm != null && cm.hasPrimaryClip()) {
                            android.content.ClipData clip = cm.getPrimaryClip();
                            if (clip != null && clip.getItemCount() > 0) {
                                android.content.ClipData.Item it = clip.getItemAt(0);
                                CharSequence t = it.coerceToText(MainActivity.this);
                                if (t != null) text = t.toString();
                                String h = it.getHtmlText();
                                if (h != null) html = h;
                            }
                        }
                        JSONObject o = new JSONObject();
                        o.put("text", text);
                        o.put("html", html);
                        out[0] = o.toString();
                    } catch (Exception e) {
                        out[0] = "{}";
                    } finally {
                        done.countDown();
                    }
                }
            });
            try { done.await(2, java.util.concurrent.TimeUnit.SECONDS); } catch (InterruptedException ignored) { }
            return out[0];
        }
    }

    // Build 1046: the tablet's writing model and the laptop's model over the
    // home Wi-Fi. A laptop's address is plain http (a home address cannot
    // have a certificate) and the page is https, so the app makes those
    // requests itself; the answer returns through window.__cdHttpDone.
    public class ModelBridge {
        @JavascriptInterface public String modelStatus() { return models.status().toString(); }
        @JavascriptInterface public String modelDownload(String url, String file, String bytes, String sha256) {
            long n = 0;
            try { n = Long.parseLong(bytes); } catch (NumberFormatException ignored) { }
            return models.startDownload(url, file, n, sha256);
        }
        @JavascriptInterface public void modelCancelDownload() { models.cancelDownload(); }
        @JavascriptInterface public void modelImport() {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                    startActivityForResult(i, MODEL_IMPORT_REQUEST);
                } catch (Exception e) { }
            });
        }
        @JavascriptInterface public void modelLoad(final String file, final int nCtx, final int nThreads) { runOnUiThread(() -> models.load(file, nCtx, nThreads)); }
        @JavascriptInterface public void modelUnload() { runOnUiThread(() -> models.unload()); }
        @JavascriptInterface public boolean modelRemove(String file) { return models.remove(file); }
        @JavascriptInterface public void modelChat(final String id, final String system, final String user, final int maxTokens, final boolean stream) {
            runOnUiThread(() -> models.chat(id, system, user, maxTokens, stream));
        }
        @JavascriptInterface public void modelCancel(final String id) { runOnUiThread(() -> models.cancel(id)); }
        @JavascriptInterface public void httpRequest(final String id, final String method, final String url,
                                                     final String headersJson, final String body) {
            new Thread(() -> {
                int status = 0;
                String text;
                HttpURLConnection c = null;
                try {
                    URL u = new URL(url);
                    if (!"http".equals(u.getProtocol()) && !"https".equals(u.getProtocol())) throw new Exception("only http and https");
                    c = (HttpURLConnection) u.openConnection();
                    c.setConnectTimeout(8000);
                    c.setReadTimeout(240000);
                    c.setRequestMethod(method == null || method.isEmpty() ? "GET" : method);
                    JSONObject h = new JSONObject(headersJson == null || headersJson.isEmpty() ? "{}" : headersJson);
                    Iterator<String> keys = h.keys();
                    while (keys.hasNext()) { String k = keys.next(); c.setRequestProperty(k, h.optString(k)); }
                    if (body != null && !body.isEmpty() && !"GET".equals(c.getRequestMethod())) {
                        byte[] b = body.getBytes(StandardCharsets.UTF_8);
                        c.setDoOutput(true);
                        c.setFixedLengthStreamingMode(b.length);
                        OutputStream o = c.getOutputStream();
                        try { o.write(b); } finally { o.close(); }
                    }
                    status = c.getResponseCode();
                    InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
                    text = in == null ? "" : readAll(in);
                } catch (Exception e) {
                    status = 0;
                    text = String.valueOf(e.getMessage());
                } finally {
                    if (c != null) c.disconnect();
                }
                final String js = "window.__cdHttpDone&&window.__cdHttpDone(" + JSONObject.quote(id) + "," + status + "," + JSONObject.quote(text) + ")";
                runOnUiThread(() -> { if (web != null) web.evaluateJavascript(js, null); });
            }).start();
        }
    }

    private static String readAll(InputStream in) throws java.io.IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        try { while ((n = in.read(buf)) > 0) out.write(buf, 0, n); } finally { in.close(); }
        return new String(out.toByteArray(), StandardCharsets.UTF_8);
    }

    private String displayName(Uri u) {
        Cursor c = null;
        try {
            c = getContentResolver().query(u, new String[]{ OpenableColumns.DISPLAY_NAME }, null, null, null);
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (RuntimeException ignored) {
        } finally { if (c != null) c.close(); }
        String last = u.getLastPathSegment();
        return last == null ? "model.gguf" : last;
    }

    @Override
    protected void onDestroy() {
        if (models != null) models.release();
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == MODEL_IMPORT_REQUEST) {
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                Uri u = data.getData();
                models.importFrom(u, displayName(u));
            }
            return;
        }
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                filePathCallback = null;
            }
            return;
        }
        if (requestCode == SAVE_FILE_REQUEST) {
            OutputStream os = null;
            try {
                if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingSaveB64 != null) {
                    byte[] bytes = Base64.decode(pendingSaveB64, Base64.DEFAULT);
                    os = getContentResolver().openOutputStream(data.getData());
                    if (os != null) { os.write(bytes); os.flush(); }
                }
            } catch (Exception e) {
                // best effort: a failed write leaves the app untouched, and the
                // person can still use Copy to move the backup instead.
            } finally {
                try { if (os != null) os.close(); } catch (Exception e) {}
                pendingSaveB64 = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == MIC_REQUEST) {
            PermissionRequest req = pendingMic;
            pendingMic = null;
            if (req == null) return;
            boolean ok = grantResults != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            try { if (ok) req.grant(req.getResources()); else req.deny(); } catch (Exception e) {}
            return;
        }
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
