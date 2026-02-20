package com.listyyy.app;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;

import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.phone.SmsRetriever;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.api.Status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "SmsConsent")
public class SmsConsentPlugin extends Plugin {

    private static final Pattern OTP_PATTERN = Pattern.compile("\\b(\\d{6})\\b");

    private BroadcastReceiver smsReceiver;

    @PluginMethod
    public void startListening(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Activity not available");
            return;
        }

        unregisterReceiver();

        call.setKeepAlive(true);

        SmsRetriever.getClient(activity)
                .startSmsUserConsent(null)
                .addOnSuccessListener(unused -> registerReceiver(call))
                .addOnFailureListener(e -> call.reject("Failed to start SMS listener", e));
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        unregisterReceiver();
        call.resolve();
    }

    private void registerReceiver(PluginCall call) {
        smsReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!SmsRetriever.SMS_RETRIEVED_ACTION.equals(intent.getAction())) return;

                Bundle extras = intent.getExtras();
                if (extras == null) return;

                Status status = (Status) extras.get(SmsRetriever.EXTRA_STATUS);
                if (status == null) return;

                if (status.getStatusCode() == CommonStatusCodes.SUCCESS) {
                    Intent consentIntent = extras.getParcelable(SmsRetriever.EXTRA_CONSENT_INTENT);
                    if (consentIntent != null) {
                        startActivityForResult(call, consentIntent, "onConsentResult");
                    }
                } else {
                    call.reject("SMS retrieval failed: " + status.getStatusCode());
                    call.setKeepAlive(false);
                    unregisterReceiver();
                }
            }
        };

        IntentFilter filter = new IntentFilter(SmsRetriever.SMS_RETRIEVED_ACTION);
        ContextCompat.registerReceiver(
                getContext(),
                smsReceiver,
                filter,
                SmsRetriever.SEND_PERMISSION,
                null,
                ContextCompat.RECEIVER_EXPORTED
        );
    }

    @ActivityCallback
    private void onConsentResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        try {
            if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                String message = result.getData().getStringExtra(SmsRetriever.EXTRA_SMS_MESSAGE);
                if (message != null) {
                    Matcher matcher = OTP_PATTERN.matcher(message);
                    if (matcher.find()) {
                        JSObject ret = new JSObject();
                        ret.put("code", matcher.group(1));
                        call.resolve(ret);
                    } else {
                        call.reject("No 6-digit code found in SMS");
                    }
                } else {
                    call.reject("No SMS message in result");
                }
            } else {
                call.reject("User denied SMS consent");
            }
        } finally {
            call.setKeepAlive(false);
            unregisterReceiver();
        }
    }

    private void unregisterReceiver() {
        if (smsReceiver != null) {
            try {
                getContext().unregisterReceiver(smsReceiver);
            } catch (IllegalArgumentException ignored) {
            }
            smsReceiver = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        unregisterReceiver();
        super.handleOnDestroy();
    }
}
