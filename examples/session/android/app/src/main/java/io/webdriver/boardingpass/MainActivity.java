package io.webdriver.boardingpass;

import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import android.app.Activity;

/**
 * One boarding pass. Tap Board, swipe sideways to flip it, rotate the device
 * for the stub, and open boardingpass://aurora for the second flight.
 * Status text is also the accessibility id, so a session can find it.
 */
public class MainActivity extends Activity {
    static final String READY = "Ready to board.";
    static final String BOARDING = "Now boarding WD 10.";
    static final String FLIPPED = "The pass is flipped.";
    static final String STUB = "The pass is a stub.";
    static final String AURORA = "Flight WD 01 to Aurora.";

    private boolean boarded;
    private boolean flipped;
    private String flight = "wd10";
    private float downX;
    private float downY;
    private boolean tracking;

    private ScrollView passScroll;
    private TextView status;
    private TextView fromCity;
    private TextView toCity;
    private TextView flightView;
    private TextView seatView;
    private TextView gateView;
    private TextView backFlight;
    private TextView backRoute;
    private TextView stamp;
    private TextView board;
    private View faceFront;
    private View faceBack;
    private View card;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (savedInstanceState != null) {
            boarded = savedInstanceState.getBoolean("boarded");
            flipped = savedInstanceState.getBoolean("flipped");
            flight = savedInstanceState.getString("flight", "wd10");
        }
        setContentView(R.layout.activity_main);
        bind();
        applyIntent(getIntent());
        render(false);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        applyIntent(intent);
        render(false);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putBoolean("boarded", boarded);
        outState.putBoolean("flipped", flipped);
        outState.putString("flight", flight);
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                downX = event.getX();
                downY = event.getY();
                tracking = true;
                break;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                if (tracking) {
                    float dx = event.getX() - downX;
                    float dy = event.getY() - downY;
                    if (Math.abs(dx) > 160 && Math.abs(dx) > Math.abs(dy) * 1.2f) {
                        flip(dx < 0);
                    }
                }
                tracking = false;
                break;
            default:
                break;
        }
        return super.dispatchTouchEvent(event);
    }

    private void bind() {
        passScroll = findViewById(R.id.pass_scroll);
        status = findViewById(R.id.status);
        fromCity = findViewById(R.id.from_city);
        toCity = findViewById(R.id.to_city);
        flightView = findViewById(R.id.flight);
        seatView = findViewById(R.id.seat);
        gateView = findViewById(R.id.gate);
        backFlight = findViewById(R.id.back_flight);
        backRoute = findViewById(R.id.back_route);
        stamp = findViewById(R.id.stamp);
        board = findViewById(R.id.board);
        faceFront = findViewById(R.id.face_front);
        faceBack = findViewById(R.id.face_back);
        card = findViewById(R.id.card);
        fillBarcode(findViewById(R.id.barcode));
        board.setOnClickListener(v -> board());
    }

    private void applyIntent(Intent intent) {
        if (intent == null || intent.getData() == null) {
            return;
        }
        Uri data = intent.getData();
        if ("boardingpass".equals(data.getScheme()) && "aurora".equals(data.getHost())) {
            flight = "aurora";
            flipped = false;
        }
    }

    private void board() {
        if (boarded) {
            return;
        }
        boarded = true;
        render(true);
    }

    private void flip(boolean next) {
        if (flipped == next) {
            return;
        }
        flipped = next;
        card.animate().rotationY(90f).setDuration(160).withEndAction(() -> {
            showFace();
            card.setRotationY(-90f);
            card.animate().rotationY(0f).setDuration(180).start();
        }).start();
        applyStatus();
    }

    private void render(boolean stampIn) {
        boolean aurora = "aurora".equals(flight);
        fromCity.setText(aurora ? "REYKJAVÍK" : "TOKYO");
        toCity.setText(aurora ? "AURORA" : "REYKJAVÍK");
        flightView.setText(aurora ? "WD 01" : "WD 10");
        seatView.setText(aurora ? "1A" : "4A");
        if (aurora) {
            gateView.setText("North");
        } else if (boarded) {
            gateView.setText("7");
        } else {
            gateView.setText("—");
        }
        String route = fromCity.getText() + "  →  " + toCity.getText();
        backFlight.setText(flightView.getText());
        backRoute.setText(route);
        stamp.setText(aurora ? "AURORA" : "BOARDED");
        stamp.setTextColor(getColor(aurora ? R.color.aurora : R.color.stamp));
        boolean showStamp = boarded || aurora;
        stamp.setVisibility(showStamp ? View.VISIBLE : View.GONE);
        if (stampIn && showStamp) {
            stamp.setScaleX(1.35f);
            stamp.setScaleY(1.35f);
            stamp.setAlpha(0f);
            stamp.animate().scaleX(1f).scaleY(1f).alpha(1f).setDuration(220).start();
        }
        board.setEnabled(!boarded);
        board.setText(boarded ? "Boarded" : "Board");
        board.setContentDescription(boarded ? "Boarded" : "Board");
        board.setAlpha(boarded ? 0.45f : 1f);
        paintSky(aurora);
        showFace();
        applyStatus();
    }

    private void showFace() {
        faceFront.setVisibility(flipped ? View.GONE : View.VISIBLE);
        faceBack.setVisibility(flipped ? View.VISIBLE : View.GONE);
        card.setRotationY(0f);
    }

    private void applyStatus() {
        String text = statusText();
        status.setText(text);
        status.setContentDescription(text);
    }

    private String statusText() {
        if ("aurora".equals(flight)) {
            return AURORA;
        }
        if (getResources().getConfiguration().orientation == Configuration.ORIENTATION_LANDSCAPE) {
            return STUB;
        }
        if (flipped) {
            return FLIPPED;
        }
        if (boarded) {
            return BOARDING;
        }
        return READY;
    }

    private void paintSky(boolean aurora) {
        int[] colors = aurora
            ? new int[] { 0xFF04281C, 0xFF14324A, 0xFF2C1444 }
            : new int[] { 0xFF10182A, 0xFF18243A };
        GradientDrawable sky = new GradientDrawable(GradientDrawable.Orientation.TL_BR, colors);
        passScroll.setBackground(sky);
    }

    private void fillBarcode(LinearLayout box) {
        if (box.getChildCount() > 0) {
            return;
        }
        int[] widths = { 2, 4, 2, 6, 3, 1, 5, 2, 8, 3, 2, 4, 1, 6, 3, 2, 5, 2, 7, 3, 2, 4, 3, 1, 5 };
        int ink = getColor(R.color.ink);
        for (int width : widths) {
            View bar = new View(this);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(dp(width), LinearLayout.LayoutParams.MATCH_PARENT);
            params.setMarginEnd(dp(2));
            bar.setLayoutParams(params);
            bar.setBackgroundColor(ink);
            box.addView(bar);
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
