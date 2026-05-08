package com.noronaru.innerweather;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.firebase.appcheck.FirebaseAppCheck;

/**
 * Minimal Capacitor plugin that fetches a Firebase App Check token from the
 * native Play Integrity provider and returns it to JavaScript.
 *
 * JS usage:
 *   const AppCheckHelper = registerPlugin('AppCheckHelper');
 *   const { token } = await AppCheckHelper.getToken();
 */
@CapacitorPlugin(name = "AppCheckHelper")
public class AppCheckPlugin extends Plugin {

    @PluginMethod
    public void getToken(PluginCall call) {
        FirebaseAppCheck.getInstance()
            .getToken(false)
            .addOnSuccessListener(appCheckToken -> {
                JSObject result = new JSObject();
                result.put("token", appCheckToken.getToken());
                call.resolve(result);
            })
            .addOnFailureListener(e -> call.reject("App Check token error: " + e.getMessage()));
    }
}
