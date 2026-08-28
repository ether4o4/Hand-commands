package com.handcommands

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.view.accessibility.AccessibilityEvent

class HandAccessibilityService : AccessibilityService() {
    companion object { var instance: HandAccessibilityService? = null }
    private var targetDisplayId = 0

    override fun onServiceConnected() { super.onServiceConnected(); instance = this }
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() { if (instance === this) instance = null }

    fun setTargetDisplayId(id: Int) { targetDisplayId = id }

    fun tap(x: Float, y: Float) = dispatch(buildTap(x, y))

    fun doubleTap(x: Float, y: Float) {
        val b = GestureDescription.Builder()
        b.addStroke(GestureDescription.StrokeDescription(Path().apply { moveTo(x, y) }, 0, 40))
        b.addStroke(GestureDescription.StrokeDescription(Path().apply { moveTo(x, y) }, 120, 40))
        dispatch(b.build())
    }

    fun swipe(x1: Float, y1: Float, x2: Float, y2: Float, duration: Long = 180L) {
        val path = Path().apply { moveTo(x1, y1); lineTo(x2, y2) }
        val b = GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(path, 0, duration))
        dispatch(b.build())
    }

    fun back() { performGlobalAction(GLOBAL_ACTION_BACK) }
    fun home() { performGlobalAction(GLOBAL_ACTION_HOME) }

    private fun buildTap(x: Float, y: Float): GestureDescription {
        val b = GestureDescription.Builder().addStroke(GestureDescription.StrokeDescription(Path().apply { moveTo(x, y) }, 0, 40))
        return b.build()
    }

    private fun dispatch(g: GestureDescription) {
        if (Build.VERSION.SDK_INT >= 30) {
            val b = GestureDescription.Builder()
            // Rebuild with the same strokes is not possible from an immutable GestureDescription;
            // target display is therefore set by the activity/service display context when available.
            dispatchGesture(g, null, null)
        } else dispatchGesture(g, null, null)
    }
}
