package com.handcommands

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent

class HandAccessibilityService : AccessibilityService() {
    companion object { var instance: HandAccessibilityService? = null }
    override fun onServiceConnected() { super.onServiceConnected(); instance = this }
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() { if (instance === this) instance = null }

    fun tap(x: Float, y: Float) = dispatchPath(x, y, 40L)

    fun swipe(x1: Float, y1: Float, x2: Float, y2: Float, duration: Long = 180L) {
        val path = Path().apply { moveTo(x1, y1); lineTo(x2, y2) }
        dispatch(path, duration)
    }

    fun back() { performGlobalAction(GLOBAL_ACTION_BACK) }
    fun home() { performGlobalAction(GLOBAL_ACTION_HOME) }

    private fun dispatchPath(x: Float, y: Float, duration: Long) {
        dispatch(Path().apply { moveTo(x, y) }, duration)
    }

    private fun dispatch(path: Path, duration: Long) {
        val stroke = GestureDescription.StrokeDescription(path, 0L, duration)
        dispatchGesture(GestureDescription.Builder().addStroke(stroke).build(), null, null)
    }
}
