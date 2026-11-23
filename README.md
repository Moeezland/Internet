# Moeezland Internet 1.1.0 — security-focused rebuild

This is a security-focused rebuild of the supplied starter project. The browsing surface now uses Electron `WebContentsView` rather than the deprecated `<webview>` tag.

## Requirements

- Windows 10/11 x64 for the packaged installer.
- Node.js LTS and npm.
- Internet connection for dependency installation and browsing.

## Build on Windows

Open PowerShell in this folder and run these commands one at a time:

```powershell
node --version
npm --version
npm install
npm run check
npm start
```

Test the app before packaging. When it behaves correctly:

```powershell
npm run dist:win
```

The installer will be written to `dist\Moeezland-Internet-Setup-1.1.0-x64.exe`.

Do not disable Smart App Control or antivirus to build or run this project. If Windows blocks a script or binary, stop and inspect the exact warning.

## Security changes

- Replaced the `<webview>` element with a separate `WebContentsView`.
- Browser content has no preload script, no Node integration, context isolation, sandboxing and web security enabled.
- Application UI and remote websites run in separate web contents.
- Browser navigation and redirects are restricted to HTTP and HTTPS; URL credentials are rejected.
- New-window requests are denied as separate windows and safe HTTP(S) targets are opened in the current browser view.
- All site permission requests and permission checks are denied by default.
- App UI IPC is limited to the trusted main frame and a small, fixed API.
- Application chrome has a restrictive Content Security Policy.
- Electron is pinned to 45.4.1, the stable release shown by the Electron release feed on 18 November 2026.

## Important limitations / release checklist

This is a safer starter browser, **not a complete security-audited browser**. It does not yet implement tabs, password management, extension support, a polished downloads UI, phishing protection, ad blocking, safe-browsing reputation checks or automatic browser-engine updates.

The default permission policy blocks camera, microphone, geolocation, notifications and other website permissions. Downloads use Chromium's normal download flow; downloaded files are not automatically executed.

Before public release:
1. Run `npm audit` and review every finding.
2. Test navigation, redirects, popups, downloads, browser data persistence, and common websites on a clean Windows 10/11 VM.
3. Verify the final installer with Microsoft Defender and `Get-AuthenticodeSignature`.
4. Submit the Store package through Partner Center and test its Store-installed version separately.
5. Keep Electron updated and rebuild promptly for security releases.

## Signing

This project does not contain a private signing key or a certificate. Never put a private code-signing key in this source folder or publish it. A self-signed certificate is for controlled testing only and does not make a public download trusted. Microsoft Store distribution and direct EXE distribution have different signing requirements.


## Open Source

Moeezland Internet is an open-source desktop web browser developed by Moeezland.

The project is released under the MIT License. You are welcome to use, study, modify, and redistribute the software in accordance with the terms of that license.

### Contributions

Bug reports, security reports, suggestions, and code contributions are welcome.

Please do not publish security vulnerabilities as public issues. Contact the project maintainer privately to report them.

### Security

Security is an ongoing priority. The project uses Electron security features, including context isolation, sandboxing, restricted IPC, and a restrictive Content Security Policy.

This project has not undergone an independent professional security audit. Users should review the source code and understand its limitations before using it.

### Maintainer

Moeezland

### License

This project is licensed under the MIT License. See the `LICENSE` file for details.
