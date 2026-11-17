# ProGuard / R8 rules for Capacitor and Android release build

# Preserve JavaScript Interface methods
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Capacitor runtime, plugins and bridge
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.BridgeActivity { *; }
-keep public class * extends com.getcapacitor.BridgeFragment { *; }
-keep public class * extends com.getcapacitor.Bridge { *; }

# Preserve Cordova plugin compatibility
-keep public class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin { *; }

# Preserve source file and line numbers for Play Console stack traces and mapping
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
