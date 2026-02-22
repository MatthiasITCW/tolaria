use tauri::{menu::SubmenuBuilder, App, Emitter};

const VIEW_ITEMS: [(&str, &str, &str); 3] = [
    ("view-editor-only", "Editor Only", "Alt+1"),
    ("view-editor-list", "Editor + Notes", "Alt+2"),
    ("view-all", "All Panels", "Alt+3"),
];

pub fn setup_menu(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let mut view_menu = SubmenuBuilder::new(app, "View");
    for (id, label, accel) in &VIEW_ITEMS {
        view_menu = view_menu.text(*id, format!("{label}   {accel}"));
    }
    let view_submenu = view_menu.build()?;

    let menu = tauri::menu::MenuBuilder::new(app)
        .item(&view_submenu)
        .build()?;

    app.set_menu(menu)?;

    app.on_menu_event(|app_handle, event| {
        let id = event.id().0.as_str();
        if id.starts_with("view-") {
            let _ = app_handle.emit("menu-event", id);
        }
    });

    Ok(())
}
