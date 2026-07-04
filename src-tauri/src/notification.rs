use serde::Deserialize;
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Deserialize)]
pub struct NotificationPayload {
    pub kind: String,
    pub title: String,
    pub body: String,
    pub duration: Option<u64>,
}

/// Holds notification data for windows that haven't fetched it yet.
pub struct NotificationDataStore(pub Mutex<HashMap<String, serde_json::Value>>);

impl Default for NotificationDataStore {
    fn default() -> Self {
        Self(Mutex::new(HashMap::new()))
    }
}

#[tauri::command]
pub fn take_notification_data(
    label: String,
    store: tauri::State<'_, NotificationDataStore>,
) -> Option<serde_json::Value> {
    store.0.lock().ok()?.remove(&label)
}

#[tauri::command]
pub fn show_notification_window(app: tauri::AppHandle, payload: NotificationPayload) -> Result<(), String> {
    let label = format!(
        "notif-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );

    let duration = payload.duration.unwrap_or(5000);

    // Build the notification data
    let data = serde_json::json!({
        "kind": payload.kind,
        "title": payload.title,
        "body": payload.body,
        "duration": duration,
    });

    // Store data so the frontend can fetch it
    if let Ok(mut map) = app.state::<NotificationDataStore>().0.lock() {
        map.insert(label.clone(), data);
    }

    // Simple URL — no data in the URL at all
    let webview_url = if let Some(dev_url) = app.config().build.dev_url.clone() {
        let mut url = dev_url.to_string().trim_end_matches('/').to_string();
        url.push_str("/#/notification");
        WebviewUrl::External(url.parse().map_err(|e: url::ParseError| e.to_string())?)
    } else {
        WebviewUrl::App("index.html/#/notification".into())
    };

    // Bottom-right of primary monitor, above the taskbar
    let (x, y) = if let Some(window) = app.get_webview_window("main") {
        if let Ok(Some(monitor)) = window.primary_monitor() {
            let pos = monitor.position();
            let size = monitor.size();
            let scale = monitor.scale_factor();
            let margin_right = 16.0;
            let margin_bottom = 56.0;
            let sx = (pos.x as f64) + (size.width as f64) / scale - 376.0 - margin_right;
            let sy = (pos.y as f64) + (size.height as f64) / scale - 100.0 - margin_bottom;
            (sx, sy)
        } else {
            (100.0, 100.0)
        }
    } else {
        (100.0, 100.0)
    };

    let notif_app = app.clone();
    let close_label = label.clone();

    let _window = WebviewWindowBuilder::new(&app, &label, webview_url)
        .title("")
        .inner_size(376.0, 100.0)
        .min_inner_size(376.0, 100.0)
        .max_inner_size(376.0, 100.0)
        .position(x, y)
        .decorations(false)
        .always_on_top(true)
        .resizable(false)
        .skip_taskbar(true)
        .visible(true)
        .focused(false)
        .background_color(tauri::window::Color(15, 15, 15, 255))
        .build()
        .map_err(|e| e.to_string())?;

    // Give the webview a moment to load, then emit the data
    let emit_label = label.clone();
    let emit_app = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(300));
        let _ = emit_app.emit_to(&emit_label, "notification:data", data_ref(&emit_app, &emit_label));
    });

    // Auto-close after duration
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(duration));
        if let Some(w) = notif_app.get_webview_window(&close_label) {
            let _ = w.destroy();
        }
    });

    Ok(())
}

/// Helper to grab data from the store for emission.
fn data_ref(app: &tauri::AppHandle, label: &str) -> serde_json::Value {
    app.state::<NotificationDataStore>()
        .0
        .lock()
        .ok()
        .and_then(|map| map.get(label).cloned())
        .unwrap_or(serde_json::Value::Null)
}
