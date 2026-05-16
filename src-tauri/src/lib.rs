#[tauri::command]
fn get_open_file_path() -> Option<String> {
    std::env::args().nth(1)
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![get_open_file_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
