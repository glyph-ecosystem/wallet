use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use serde::Deserialize;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Deserialize)]
pub struct NotificationPayload {
    pub kind: String,
    pub title: String,
    pub body: String,
    pub duration: Option<u64>,
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

    let json = serde_json::to_string(&serde_json::json!({
        "kind": payload.kind,
        "title": payload.title,
        "body": payload.body,
        "duration": duration,
    }))
    .map_err(|e| e.to_string())?;
    let b64 = URL_SAFE_NO_PAD.encode(json.as_bytes());

    eprintln!("[notif] label={label}");
    eprintln!("[notif] json={json}");
    eprintln!("[notif] b64={b64}");

    // Position: bottom-right, above taskbar
    let (x, y) = if let Some(window) = app.get_webview_window("main") {
        if let Ok(Some(monitor)) = window.primary_monitor() {
            let pos = monitor.position();
            let size = monitor.size();
            let scale = monitor.scale_factor();
            let sx = (pos.x as f64) + (size.width as f64) / scale - 376.0 - 16.0;
            let sy = (pos.y as f64) + (size.height as f64) / scale - 100.0 - 56.0;
            eprintln!("[notif] monitor {size:?} @{scale} -> ({sx:.0},{sy:.0})");
            (sx, sy)
        } else { (100.0, 100.0) }
    } else { (100.0, 100.0) };

    // Build the window — load the main React app
    let window = WebviewWindowBuilder::new(&app, &label, WebviewUrl::App("index.html".into()))
        .title("")
        .inner_size(376.0, 100.0)
        .position(x, y)
        .decorations(false)
        .always_on_top(true)
        .resizable(false)
        .skip_taskbar(true)
        .visible(true)
        .focused(true)
        .devtools(true)
        .background_color(tauri::window::Color(15, 15, 15, 255))
        .build()
        .map_err(|e| {
            eprintln!("[notif] build failed: {e}");
            e.to_string()
        })?;

    eprintln!("[notif] window built");

    // After a short delay (let the webview load), set the hash via JS eval
    let nav_window = window.clone();
    let hash = format!("#/notification?data={b64}");
    let js = format!("window.location.hash = '{}';", hash.replace('\'', "\\'"));
    eprintln!("[notif] will eval: {js}");

    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(500));
        match nav_window.eval(&js) {
            Ok(_) => eprintln!("[notif] eval OK, hash set to {hash}"),
            Err(e) => eprintln!("[notif] eval failed: {e}"),
        }
    });

    // Auto-close
    let notif_app = app.clone();
    let close_label = label.clone();
    std::thread::spawn(move || {
        eprintln!("[notif] auto-close in {duration}ms");
        std::thread::sleep(std::time::Duration::from_millis(duration));
        if let Some(w) = notif_app.get_webview_window(&close_label) {
            eprintln!("[notif] destroying {close_label}");
            let _ = w.destroy();
        } else {
            eprintln!("[notif] {close_label} already gone");
        }
    });

    eprintln!("[notif] done");
    Ok(())
}
