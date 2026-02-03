package com.minnieai

import android.app.*
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Foreground Service for Step Counting
 * - Runs continuously in background with notification
 * - Survives app termination
 * - Auto-starts on device boot
 */
class StepCounterService : Service(), SensorEventListener {
    
    companion object {
        private const val TAG = "StepCounterService"
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "step_counter_channel"
        const val ACTION_START = "com.minnieai.START_STEP_COUNTER"
        const val ACTION_STOP = "com.minnieai.STOP_STEP_COUNTER"
        
        private var isRunning = false
        
        fun isServiceRunning(): Boolean = isRunning
        
        fun startService(context: Context) {
            val intent = Intent(context, StepCounterService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
        
        fun stopService(context: Context) {
            val intent = Intent(context, StepCounterService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
    
    private var sensorManager: SensorManager? = null
    private var stepSensor: Sensor? = null
    private var initialSteps: Int = -1
    private var sessionSteps: Int = 0
    private var lastRawSteps: Int = 0
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "✅ Service onCreate()")
        
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        
        if (stepSensor == null) {
            Log.e(TAG, "❌ Step counter sensor not available on this device")
            stopSelf()
            return
        }
        
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        
        when (action) {
            ACTION_START -> {
                Log.d(TAG, "📱 Starting step counter service...")
                startForegroundService()
                registerSensorListener()
            }
            ACTION_STOP -> {
                Log.d(TAG, "🛑 Stopping step counter service...")
                stopForegroundService()
            }
        }
        
        // Service will restart if killed by system
        return START_STICKY
    }
    
    private fun startForegroundService() {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
        isRunning = true
        Log.d(TAG, "✅ Foreground service started with notification")
    }
    
    private fun stopForegroundService() {
        unregisterSensorListener()
        stopForeground(true)
        stopSelf()
        isRunning = false
        Log.d(TAG, "✅ Foreground service stopped")
    }
    
    private fun registerSensorListener() {
        stepSensor?.let { sensor ->
            val registered = sensorManager?.registerListener(
                this,
                sensor,
                SensorManager.SENSOR_DELAY_NORMAL // Use NORMAL for background (saves battery)
            )
            
            if (registered == true) {
                Log.d(TAG, "✅ Sensor listener registered")
            } else {
                Log.e(TAG, "❌ Failed to register sensor listener")
            }
        }
    }
    
    private fun unregisterSensorListener() {
        sensorManager?.unregisterListener(this)
        Log.d(TAG, "🔇 Sensor listener unregistered")
    }
    
    override fun onSensorChanged(event: SensorEvent?) {
        if (event?.sensor?.type == Sensor.TYPE_STEP_COUNTER) {
            val rawSteps = event.values[0].toInt()
            
            // First reading - initialize baseline
            if (initialSteps == -1) {
                initialSteps = rawSteps
                lastRawSteps = rawSteps
                Log.d(TAG, "🎯 Initial step count: $rawSteps")
                return
            }
            
            // Calculate delta
            val delta = rawSteps - lastRawSteps
            
            // Handle device reboot (counter resets to 0)
            if (delta < 0) {
                Log.w(TAG, "🔄 Device reboot detected! Resetting baseline.")
                initialSteps = rawSteps
                lastRawSteps = rawSteps
                return
            }
            
            // Update session steps
            if (delta > 0) {
                sessionSteps += delta
                lastRawSteps = rawSteps
                
                Log.d(TAG, "👟 Steps update: +$delta (Total: $sessionSteps, Raw: $rawSteps)")
                
                // Emit event to React Native
                emitStepUpdate(rawSteps, sessionSteps)
                
                // Update notification
                updateNotification(sessionSteps)
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        Log.d(TAG, "Sensor accuracy changed: $accuracy")
    }
    
    private fun emitStepUpdate(rawSteps: Int, sessionSteps: Int) {
        try {
            // Get React context if app is running
            val reactContext = (application as? MainApplication)?.reactNativeHost
                ?.reactInstanceManager?.currentReactContext as? ReactApplicationContext
            
            reactContext?.let {
                val params: WritableMap = Arguments.createMap().apply {
                    putInt("steps", sessionSteps)
                    putInt("rawSteps", rawSteps)
                }
                
                it.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("StepCounterUpdate", params)
                    
                Log.d(TAG, "📡 Event emitted to React Native")
            }
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to emit event to React Native: ${e.message}")
        }
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Step Counter",
                NotificationManager.IMPORTANCE_LOW // Low importance = no sound
            ).apply {
                description = "Tracks your steps in the background"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
            Log.d(TAG, "✅ Notification channel created")
        }
    }
    
    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Minnie AI - Step Tracking")
            .setContentText("Counting your steps...")
            .setSmallIcon(android.R.drawable.ic_menu_compass) // TODO: Replace with app icon
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Cannot be dismissed
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun updateNotification(steps: Int) {
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Minnie AI - Step Tracking")
            .setContentText("$steps steps today")
            .setSmallIcon(android.R.drawable.ic_menu_compass)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager?.notify(NOTIFICATION_ID, notification)
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        unregisterSensorListener()
        isRunning = false
        Log.d(TAG, "❌ Service destroyed")
    }
}
