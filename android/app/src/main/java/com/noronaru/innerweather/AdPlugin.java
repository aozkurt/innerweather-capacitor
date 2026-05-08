package com.noronaru.innerweather;

import android.app.Activity;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;

@CapacitorPlugin(name = "AdPlugin")
public class AdPlugin extends Plugin {

    // Set IS_PRODUCTION = true and update PROD_APP_ID in AndroidManifest.xml
    // to your real AdMob app ID before releasing.
    private static final boolean IS_PRODUCTION = false;

    private static final String TEST_UNIT_ID = "ca-app-pub-3940256099942544/1033173712";
    private static final String PROD_UNIT_ID  = "ca-app-pub-5704117395146910/3671096082";

    private InterstitialAd interstitialAd = null;

    @Override
    public void load() {
        Activity activity = getActivity();
        activity.runOnUiThread(() ->
            MobileAds.initialize(activity, status -> loadAd())
        );
    }

    private void loadAd() {
        String adUnitId = IS_PRODUCTION ? PROD_UNIT_ID : TEST_UNIT_ID;
        Activity activity = getActivity();
        AdRequest request = new AdRequest.Builder().build();
        activity.runOnUiThread(() ->
            InterstitialAd.load(activity, adUnitId, request, new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd ad) {
                    interstitialAd = ad;
                }
                @Override
                public void onAdFailedToLoad(LoadAdError error) {
                    interstitialAd = null;
                }
            })
        );
    }

    /**
     * Shows a pre-loaded interstitial ad.
     * Resolves the JS call after the ad is dismissed (or immediately if no ad is ready).
     */
    @PluginMethod
    public void showInterstitial(PluginCall call) {
        Activity activity = getActivity();

        if (interstitialAd == null) {
            // No ad ready — proceed without showing one, pre-load for next time.
            loadAd();
            call.resolve();
            return;
        }

        interstitialAd.setFullScreenContentCallback(new FullScreenContentCallback() {
            @Override
            public void onAdDismissedFullScreenContent() {
                interstitialAd = null;
                loadAd();
                call.resolve();
            }
            @Override
            public void onAdFailedToShowFullScreenContent(AdError error) {
                interstitialAd = null;
                loadAd();
                call.resolve();
            }
        });

        activity.runOnUiThread(() -> interstitialAd.show(activity));
    }
}
