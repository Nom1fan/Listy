# Capacitor: keep the WebView JS bridge and plugin classes
-keep class com.getcapacitor.** { *; }
-keep class com.listyyy.app.** { *; }

# Keep line numbers for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
