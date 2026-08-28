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
import android.widget.Toast

class MainActivity : Activity() {
    private lateinit var web: WebView
    private var lastX = 0f
    private var lastY = 0f
    private var targetDisplayId = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        targetDisplayId = windowManager.defaultDisplay.displayId
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
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread { request.grant(request.resources) }
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
        @JavascriptInterface fun leftClick() { service()?.tap(*screenPoint()) }
        @JavascriptInterface fun rightClick() { service()?.tap(*screenPoint()) }
        @JavascriptInterface fun scroll(delta: Float) {
            val (x, y) = screenPoint()
            val dy = (delta * 900f).coerceIn(-700f, 700f)
            service()?.swipe(x, y, x, (y + dy).coerceIn(1f, screenHeight().toFloat()))
        }
        @JavascriptInterface fun home() { service()?.home() }
        @JavascriptInterface fun back() { service()?.back() }
        @JavascriptInterface fun targetLocked() { }
        @JavascriptInterface fun dragStart() { }
        @JavascriptInterface fun dragMove(x: Float, y: Float) { point(x, y) }
        @JavascriptInterface fun dragEnd() { }
        @JavascriptInterface fun displayId(): Int = targetDisplayId
        private fun service() = HandAccessibilityService.instance
        private fun screenWidth() = resources.displayMetrics.widthPixels
        private fun screenHeight() = resources.displayMetrics.heightPixels
        private fun screenPoint(): FloatArray = floatArrayOf(lastX * screenWidth(), lastY * screenHeight())
    }
}
