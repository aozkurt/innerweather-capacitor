package com.noronaru.innerweather;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.google.firebase.appcheck.FirebaseAppCheck;
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory;

public class MainActivity extends BridgeActivity {

    private static final int MIC_REQUEST_CODE = 1001;
    private PermissionRequest pendingWebPermission;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register plugins before super.onCreate
        registerPlugin(AdPlugin.class);
        registerPlugin(AppCheckPlugin.class);
        registerPlugin(DownloadPlugin.class);
        super.onCreate(savedInstanceState);

        // Initialize Firebase App Check with the Play Integrity provider.
        // This runs before any JS call so the first getToken() call is fast.
        FirebaseAppCheck.getInstance().installAppCheckProviderFactory(
            PlayIntegrityAppCheckProviderFactory.getInstance()
        );

        // Override the WebChromeClient so WebView getUserMedia permission
        // requests are forwarded to the Android runtime permission dialog.
        bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED) {
                    request.grant(request.getResources());
                } else {
                    pendingWebPermission = request;
                    ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{ Manifest.permission.RECORD_AUDIO },
                        MIC_REQUEST_CODE
                    );
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == MIC_REQUEST_CODE && pendingWebPermission != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                pendingWebPermission.grant(pendingWebPermission.getResources());
            } else {
                pendingWebPermission.deny();
            }
            pendingWebPermission = null;
        }
    }
}
