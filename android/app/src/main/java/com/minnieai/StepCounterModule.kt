package com.minnieai

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native Android module for hardware step counter sensor access
 * Uses TYPE_STEP_COUNTER for accurate step counting
 */
class StepCounterModule(reactContext: ReactApplicationContext) : 
    ReactContextBaseJavaModule(reactContext), SensorEventListener {

    private var sensorManager: SensorManager? = null
    private var stepCounterSensor: Sensor? = null
    private var stepDetectorSensor: Sensor? = null
    
    private var isListening: Boolean = false
    private var initialSteps: Float = -1f // Steps at sensor registration (since last reboot)
    private var totalSteps: Float = 0f
    
    companion object {
        const val NAME = "StepCounterModule"
        const val EVENT_STEP_COUNT = "StepCounterUpdate"
    }

    override fun getName(): String = NAME

    init {
        sensorManager = reactContext.getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepCounterSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        stepDetectorSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
    }

    /**
     * Check if hardware step counter is available on this device
     */
    @ReactMethod
    fun isStepCounterAvailable(promise: Promise) {
        val hasStepCounter = stepCounterSensor != null
        val hasStepDetector = stepDetectorSensor != null
        
        val result = WritableNativeMap().apply {
            putBoolean("stepCounter", hasStepCounter)
            putBoolean("stepDetector", hasStepDetector)
            putBoolean("available", hasStepCounter || hasStepDetector)
        }
        promise.resolve(result)
    }

    /**
     * Start listening to step counter sensor
     */
    @ReactMethod
    fun startTracking(promise: Promise) {
        if (isListening) {
            promise.resolve(true)
            return
        }

        val sensor = stepCounterSensor ?: stepDetectorSensor
        
        if (sensor == null) {
            promise.reject("SENSOR_NOT_AVAILABLE", "No step counter sensor available on this device")
            return
        }

        try {
            val registered = sensorManager?.registerListener(
                this,
                sensor,
                SensorManager.SENSOR_DELAY_NORMAL // ~200ms update rate
            ) ?: false

            if (registered) {
                isListening = true
                promise.resolve(true)
            } else {
                promise.reject("REGISTRATION_FAILED", "Failed to register sensor listener")
            }
        } catch (e: Exception) {
            promise.reject("SENSOR_ERROR", "Error starting step tracking: ${e.message}")
        }
    }

    /**
     * Stop listening to step counter sensor
     */
    @ReactMethod
    fun stopTracking(promise: Promise) {
        try {
            sensorManager?.unregisterListener(this)
            isListening = false
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", "Error stopping step tracking: ${e.message}")
        }
    }

    /**
     * Get current step count since tracking started
     */
    @ReactMethod
    fun getCurrentSteps(promise: Promise) {
        if (initialSteps < 0) {
            promise.resolve(0.0)
        } else {
            promise.resolve((totalSteps - initialSteps).toDouble())
        }
    }

    /**
     * Reset the step counter baseline (start fresh count)
     */
    @ReactMethod
    fun resetSteps(promise: Promise) {
        initialSteps = totalSteps
        promise.resolve(true)
    }

    /**
     * Check if currently tracking
     */
    @ReactMethod
    fun isTracking(promise: Promise) {
        promise.resolve(isListening)
    }

    // SensorEventListener implementation
    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            when (it.sensor.type) {
                Sensor.TYPE_STEP_COUNTER -> {
                    // TYPE_STEP_COUNTER returns total steps since last reboot
                    val steps = it.values[0]
                    
                    if (initialSteps < 0) {
                        // First reading - set baseline
                        initialSteps = steps
                    }
                    
                    totalSteps = steps
                    val stepsSinceStart = (steps - initialSteps).toInt()
                    
                    // Emit event to React Native with both session and raw steps
                    sendStepCountEvent(stepsSinceStart, steps)
                }
                Sensor.TYPE_STEP_DETECTOR -> {
                    // TYPE_STEP_DETECTOR triggers for each step detected
                    if (initialSteps < 0) {
                        initialSteps = 0f
                    }
                    totalSteps += 1f
                    
                    // For detector, raw and session are the same accumulator
                    sendStepCountEvent(totalSteps.toInt(), totalSteps)
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Log accuracy changes for debugging
    }

    private fun sendStepCountEvent(steps: Int, rawSteps: Float) {
        val params = Arguments.createMap().apply {
            putInt("steps", steps)
            putDouble("rawSteps", rawSteps.toDouble())
        }
        
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_STEP_COUNT, params)
    }

    // Required for NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN event emitter
    }
}
