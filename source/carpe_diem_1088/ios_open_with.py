# -*- coding: utf-8 -*-
"""1088 · "Open in Carpe Diem" on iPhone and iPad, for the files Tabula reads (Word, PDF, plain text, web pages,
Markdown). The same edits serve the iPhone and iPad repository's project and the copy of it inside the page's kit.

usage: ios_open_with.py IOS_REPO      (edits iphone-ipad/CarpeDiem/Info.plist, ShellApp.swift and DeskView.swift)

Info.plist names the document types (as an alternate handler: the default app for each stays the owner's choice) and
asks iOS for a copy of each file (LSSupportsOpeningDocumentsInPlace NO). The scene hands each file's address to
ShellFiles; the page asks for it every second or so through window.pywebview.api.take_file and file_part, as it asks
the Mac and Windows apps, and Tabula opens it. The cloud build's page check also says whether the page can use the
browser's cryptography, which the sign-in needs."""
import os, sys

DOC_TYPES = """	<!-- build 1088: Open in Carpe Diem, for the files Tabula reads -->
	<key>CFBundleDocumentTypes</key>
	<array>
		<dict>
			<key>CFBundleTypeName</key>
			<string>Word document</string>
			<key>CFBundleTypeRole</key>
			<string>Editor</string>
			<key>LSHandlerRank</key>
			<string>Alternate</string>
			<key>LSItemContentTypes</key>
			<array>
				<string>org.openxmlformats.wordprocessingml.document</string>
			</array>
		</dict>
		<dict>
			<key>CFBundleTypeName</key>
			<string>PDF document</string>
			<key>CFBundleTypeRole</key>
			<string>Viewer</string>
			<key>LSHandlerRank</key>
			<string>Alternate</string>
			<key>LSItemContentTypes</key>
			<array>
				<string>com.adobe.pdf</string>
			</array>
		</dict>
		<dict>
			<key>CFBundleTypeName</key>
			<string>Text document</string>
			<key>CFBundleTypeRole</key>
			<string>Editor</string>
			<key>LSHandlerRank</key>
			<string>Alternate</string>
			<key>LSItemContentTypes</key>
			<array>
				<string>public.plain-text</string>
				<string>net.daringfireball.markdown</string>
				<string>public.html</string>
			</array>
		</dict>
	</array>
	<key>UTImportedTypeDeclarations</key>
	<array>
		<dict>
			<key>UTTypeIdentifier</key>
			<string>net.daringfireball.markdown</string>
			<key>UTTypeDescription</key>
			<string>Markdown text</string>
			<key>UTTypeConformsTo</key>
			<array>
				<string>public.plain-text</string>
			</array>
			<key>UTTypeTagSpecification</key>
			<dict>
				<key>public.filename-extension</key>
				<array>
					<string>md</string>
					<string>markdown</string>
				</array>
			</dict>
		</dict>
	</array>
	<key>LSSupportsOpeningDocumentsInPlace</key>
	<false/>
"""


def edit_info(t):
    if "CFBundleDocumentTypes" in t:
        raise SystemExit("Info.plist: document types already there")
    anchor = "\t<key>LSRequiresIPhoneOS</key>\n"
    if t.count(anchor) != 1:
        raise SystemExit("Info.plist: no single LSRequiresIPhoneOS")
    return t.replace(anchor, DOC_TYPES + anchor)


APP_OLD = """        window.makeKeyAndVisible()
        self.window = window
    }
}"""
APP_NEW = """        window.makeKeyAndVisible()
        self.window = window
        // build 1088: a file that opened Carpe Diem waits for the page (ShellFiles, in DeskView.swift)
        ShellFiles.shared.receive(connectionOptions.urlContexts.map { $0.url })
    }

    /// build 1088: a file opened in Carpe Diem while it is open
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        ShellFiles.shared.receive(URLContexts.map { $0.url })
    }
}"""


def edit_app(t):
    if "ShellFiles" in t:
        raise SystemExit("ShellApp.swift: files already received")
    if t.count(APP_OLD) != 1:
        raise SystemExit("ShellApp.swift: the scene's end is not as expected")
    return t.replace(APP_OLD, APP_NEW)


REG_OLD = """        scripts.addScriptMessageHandler(ShellClipboard(), contentWorld: .page, name: "shellClipboard")
"""
REG_NEW = """        scripts.addScriptMessageHandler(ShellClipboard(), contentWorld: .page, name: "shellClipboard")
        // build 1088: files another app gives Carpe Diem, taken by the page (ShellFiles, below)
        scripts.addScriptMessageHandler(ShellFiles.shared, contentWorld: .page, name: "shellFiles")
"""
BRIDGE_OLD = """      window.pywebview.api.save_file = send;
    })();
    \"\"\""""
BRIDGE_NEW = """      window.pywebview.api.save_file = send;
      // build 1088: a file another app gave Carpe Diem, asked for as from the Mac and Windows apps
      var files = function (m) {
        try { return window.webkit.messageHandlers.shellFiles.postMessage(m); } catch (e) { return Promise.resolve(null); }
      };
      window.pywebview.api.take_file = function (where) { return files({ op: 'take', where: String(where || 'desk') }); };
      window.pywebview.api.file_part = function (key, i) { return files({ op: 'part', key: String(key), i: Number(i) }); };
      window.pywebview.api.file_opened = function (name, how) { return files({ op: 'opened', name: String(name), how: String(how) }); };
    })();
    \"\"\""""
TEST_OLD = """        bridge: !!(window.pywebview && window.pywebview.api && window.pywebview.api.save_file && window.CarpeNative),"""
TEST_NEW = """        bridge: !!(window.pywebview && window.pywebview.api && window.pywebview.api.save_file && window.CarpeNative),
        files: !!(window.pywebview && window.pywebview.api && window.pywebview.api.take_file && hs && hs.shellFiles),
        secure: window.isSecureContext === true, subtle: !!(window.crypto && window.crypto.subtle),"""
CLASS = """

/* Build 1088: a file another app gives Carpe Diem (Open in Carpe Diem, from Files, Mail or Safari) waits here until
   the page takes it, the way the Mac and Windows apps keep one: the page asks every second or so (take), then fetches
   it in pieces (part), and Tabula opens it with its own readers. Only the kinds Tabula reads are kept. */
final class ShellFiles: NSObject, WKScriptMessageHandlerWithReply {
    static let shared = ShellFiles()
    static let partBytes = 393216
    static let openable: Set<String> = ["docx", "pdf", "txt", "text", "md", "markdown", "html", "htm"]
    private var waiting: [(key: String, name: String, data: Data)] = []
    private var given: (key: String, name: String, data: Data)?

    func receive(_ urls: [URL]) {
        for url in urls {
            guard ShellFiles.openable.contains(url.pathExtension.lowercased()) else { continue }
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            guard let data = try? Data(contentsOf: url) else { continue }
            waiting.append((key: UUID().uuidString, name: url.lastPathComponent, data: data))
            // the copy the system made in the app's own Inbox is not kept once read; the file itself stays where it was
            if url.path.contains("/Documents/Inbox/") { try? FileManager.default.removeItem(at: url) }
        }
    }

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage,
                               replyHandler: @escaping (Any?, String?) -> Void) {
        // only Carpe Diem's own page (carpe-app://), as for the clipboard
        guard message.frameInfo.securityOrigin.protocol == "carpe-app",
              let body = message.body as? [String: Any], let op = body["op"] as? String else {
            replyHandler(nil, nil)
            return
        }
        switch op {
        case "take":
            if waiting.isEmpty {
                replyHandler(nil, nil)
                return
            }
            let f = waiting.removeFirst()
            given = f
            let parts = max(1, (f.data.count + ShellFiles.partBytes - 1) / ShellFiles.partBytes)
            replyHandler(["key": f.key, "name": f.name, "parts": parts], nil)
        case "part":
            guard let f = given, let key = body["key"] as? String, key == f.key,
                  let i = (body["i"] as? NSNumber)?.intValue, i >= 0 else {
                replyHandler("", nil)
                return
            }
            let from = i * ShellFiles.partBytes
            guard from < f.data.count else {
                replyHandler("", nil)
                return
            }
            let to = min(f.data.count, from + ShellFiles.partBytes)
            replyHandler(f.data.subdata(in: from..<to).base64EncodedString(), nil)
        default:
            replyHandler(true, nil)
        }
    }
}
"""


def edit_desk(t):
    if "ShellFiles" in t:
        raise SystemExit("DeskView.swift: files already taken")
    for old, new, what in ((REG_OLD, REG_NEW, "the handler"), (BRIDGE_OLD, BRIDGE_NEW, "the bridge"), (TEST_OLD, TEST_NEW, "the page check")):
        if t.count(old) != 1:
            raise SystemExit("DeskView.swift: %s is not as expected (%d)" % (what, t.count(old)))
        t = t.replace(old, new)
    return t.rstrip("\n") + CLASS


def apply_repo(repo):
    base = os.path.join(repo, "iphone-ipad", "CarpeDiem")
    for name, fn in (("Info.plist", edit_info), ("ShellApp.swift", edit_app), ("DeskView.swift", edit_desk)):
        p = os.path.join(base, name)
        t = open(p, encoding="utf-8").read()
        open(p, "w", encoding="utf-8").write(fn(t))
        print("  %s: Open in Carpe Diem" % name)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    apply_repo(sys.argv[1])


# ---------- the kit's own iPhone and iPad project (a SwiftUI app, inside the page's kit) ----------
KIT_APP_OLD = """            DeskView()
                .ignoresSafeArea(.container, edges: .bottom)
"""
KIT_APP_NEW = """            DeskView()
                .ignoresSafeArea(.container, edges: .bottom)
                // build 1088: a file opened in Carpe Diem waits for the page (ShellFiles, in DeskView.swift)
                .onOpenURL { url in ShellFiles.shared.receive([url]) }
"""
KIT_REG_OLD = """        config.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "cdReply")
"""
KIT_REG_NEW = """        config.userContentController.addScriptMessageHandler(context.coordinator, contentWorld: .page, name: "cdReply")
        /* build 1088: files another app gives Carpe Diem, taken by the page (ShellFiles, below) */
        config.userContentController.addScriptMessageHandler(ShellFiles.shared, contentWorld: .page, name: "shellFiles")
"""
KIT_BRIDGE_OLD = """          window.CarpeNative = { saveFile: send };
"""
KIT_BRIDGE_NEW = """          window.CarpeNative = { saveFile: send };
          /* build 1088: a file another app gave Carpe Diem, asked for as from the Mac and Windows apps */
          var files = function (m) {
            try { return window.webkit.messageHandlers.shellFiles.postMessage(m); } catch (e) { return Promise.resolve(null); }
          };
          window.CarpeFiles = {
            take_file: function (where) { return files({ op: 'take', where: String(where || 'desk') }); },
            file_part: function (key, i) { return files({ op: 'part', key: String(key), i: Number(i) }); },
            file_opened: function (name, how) { return files({ op: 'opened', name: String(name), how: String(how) }); }
          };
"""


def edit_kit_app(t):
    if "ShellFiles" in t:
        raise SystemExit("CarpeDiemApp.swift: files already received")
    if t.count(KIT_APP_OLD) != 1:
        raise SystemExit("CarpeDiemApp.swift: the window is not as expected")
    return t.replace(KIT_APP_OLD, KIT_APP_NEW)


def edit_kit_desk(t):
    if "ShellFiles" in t:
        raise SystemExit("the kit's DeskView.swift: files already taken")
    for old, new, what in ((KIT_REG_OLD, KIT_REG_NEW, "the handler"), (KIT_BRIDGE_OLD, KIT_BRIDGE_NEW, "the bridge")):
        if t.count(old) != 1:
            raise SystemExit("the kit's DeskView.swift: %s is not as expected (%d)" % (what, t.count(old)))
        t = t.replace(old, new)
    return t.rstrip("\n") + CLASS
