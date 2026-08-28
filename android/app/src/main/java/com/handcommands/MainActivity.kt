package com.handcommands

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {
    private lateinit var web: WebView
    private var lastX = 0f
    private var lastY = 0f

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.CAMERA), 10)
        }
        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            webViewClient = WebViewClient()
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(r: PermissionRequest) {
                    runOnUiThread { r.grant(r.resources) }
                }
            }
            addJavascriptInterface(HandBridge(), "AndroidHandCommands")
            loadUrl("file:///android_asset/index.html")
        }
        setContentView(web)
    }

    inner class HandBridge {
        @JavascriptInterface fun point(x: Float, y: Float) {
            lastX = (1f - x).coerceIn(0f, 1f)
            lastY = y.coerceIn(0f, 1f)
        }
        @JavascriptInterface fun leftClick() {
            val p = screenPoint()
            HandAccessibilityService.instance?.tap(p[0], p[1])
        }
        @JavascriptInterface fun rightClick() {
            val p = screenPoint()
            HandAccessibilityService.instance?.doubleTap(p[0], p[1])
        }
        @JavascriptInterface fun scroll(delta: Float) {
            val p = screenPoint()
            val dy = (delta * 900f).coerceIn(-700f, 700f)
            HandAccessibilityService.instance?.swipe(p[0], p[1], p[0], (p[1] + dy).coerceIn(1f, screenHeight().toFloat()))
        }
        @JavascriptInterface fun home() { HandAccessibilityService.instance?.home() }
        @JavascriptInterface fun back() { HandAccessibilityService.instance?.back() }
        @JavascriptInterface fun targetLocked() {}
        @JavascriptInterface fun dragStart() {}
        @JavascriptInterface fun dragMove(x: Float, y: Float) { point(x, y) }
        @JavascriptInterface fun dragEnd() {}
        private fun screenWidth() = resources.displayMetrics.widthPixels
        private fun screenHeight() = resources.displayMetrics.heightPixels
        private fun screenPoint(): FloatArray = floatArrayOf(lastX * screenWidth(), lastY * screenHeight())
    }
}
