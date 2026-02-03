package com.minnieai

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Boot Receiver - Auto-starts step counter service after device reboot
 */
class BootReceiver : BroadcastReceiver() {
    
    companion object {
        private const val TAG = "BootReceiver"
    }
    
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "📱 Device boot completed - starting step counter service")
            
            try {
                StepCounterService.startService(context.applicationContext)
                Log.d(TAG, "✅ Step counter service started on boot")
            } catch (e: Exception) {
                Log.e(TAG, "❌ Failed to start service on boot: ${e.message}")
            }
        }
    }
}
