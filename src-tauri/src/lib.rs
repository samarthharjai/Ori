mod extensions;

use serde::Serialize;
use std::{
    collections::hash_map::DefaultHasher,
    fs,
    fs::File,
    hash::{Hash, Hasher},
    io::Read,
    path::{Path, PathBuf},
    time::{Duration, Instant},
};
use zip::ZipArchive;

use tauri::{AppHandle, Emitter, Manager, Window};

use extensions::{
    is_image_extension, is_preferred_image_name, is_rar_archive_extension, is_supported_extension,
    is_zip_archive_extension, IMAGE_EXTENSIONS,
};

const SCAN_PROGRESS_EVENT: &str = "scan-progress";
const SCAN_BATCH_EVENT: &str = "scan-batch";
const SCANS_FILE_NAME: &str = "library-scans.json";
const LIBRARIES_FILE_NAME: &str = "libraries.json";
const PROGRESS_THROTTLE: Duration = Duration::from_millis(140);
const BATCH_FLUSH_SIZE: usize = 200;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ContentFolderScan {
    root_path: String,
    folder_count: usize,
    file_count: usize,
    supported_file_count: usize,
    supported_files: Vec<ContentFile>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ContentFile {
    name: String,
    path: String,
    extension: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScanProgress {
    processed: usize,
    total: usize,
    done: bool,
    current_name: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScanBatch {
    files: Vec<ContentFile>,
}

struct ScanEmitter<'a> {
    window: &'a Window,
    total: usize,
    processed: usize,
    current_name: Option<String>,
    batch: Vec<ContentFile>,
    last_emit: Instant,
}

impl<'a> ScanEmitter<'a> {
    fn new(window: &'a Window, total: usize) -> Self {
        Self {
            window,
            total,
            processed: 0,
            current_name: None,
            batch: Vec::new(),
            last_emit: Instant::now(),
        }
    }

    fn record(&mut self, file: ContentFile, current_name: Option<String>) {
        self.processed += 1;
        self.current_name = current_name;
        self.batch.push(file);

        if self.batch.len() >= BATCH_FLUSH_SIZE || self.last_emit.elapsed() >= PROGRESS_THROTTLE {
            self.flush(false);
        }
    }

    fn flush(&mut self, done: bool) {
        if !self.batch.is_empty() {
            let files = std::mem::take(&mut self.batch);
            let _ = self.window.emit(SCAN_BATCH_EVENT, ScanBatch { files });
        }

        let _ = self.window.emit(
            SCAN_PROGRESS_EVENT,
            ScanProgress {
                processed: self.processed,
                total: self.total,
                done,
                current_name: self.current_name.clone(),
            },
        );

        self.last_emit = Instant::now();
    }
}

#[tauri::command]
async fn scan_content_folder(
    window: Window,
    folder_path: String,
) -> Result<ContentFolderScan, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let root_path = PathBuf::from(&folder_path);

        if !root_path.is_dir() {
            return Err("Selected path is not a folder.".to_string());
        }

        let total = count_supported_files(&root_path);

        let mut scan = ContentFolderScan {
            root_path: root_path.to_string_lossy().into_owned(),
            folder_count: 0,
            file_count: 0,
            supported_file_count: 0,
            supported_files: Vec::new(),
        };
        let mut emitter = ScanEmitter::new(&window, total);

        emitter.flush(false);

        scan_folder(&root_path, &mut scan, &mut emitter)?;

        emitter.current_name = None;
        emitter.flush(true);

        Ok(scan)
    })
    .await
    .map_err(|error| format!("Scan task failed: {error}"))?
}

fn count_supported_files(folder_path: &Path) -> usize {
    let Ok(entries) = fs::read_dir(folder_path) else {
        return 0;
    };

    let mut total = 0;

    for entry in entries.flatten() {
        let path = entry.path();

        if path.is_dir() {
            total += count_supported_files(&path);
            continue;
        }

        if !path.is_file() {
            continue;
        }

        if let Some(extension) = path.extension().and_then(|extension| extension.to_str()) {
            if is_supported_extension(&extension.to_lowercase()) {
                total += 1;
            }
        }
    }

    total
}

fn scan_folder(
    folder_path: &Path,
    scan: &mut ContentFolderScan,
    emitter: &mut ScanEmitter,
) -> Result<(), String> {
    let entries = fs::read_dir(folder_path)
        .map_err(|error| format!("Unable to read {}: {error}", folder_path.display()))?;

    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            scan.folder_count += 1;
            scan_folder(&path, scan, emitter)?;
            continue;
        }

        if !path.is_file() {
            continue;
        }

        scan.file_count += 1;

        let Some(extension) = path.extension().and_then(|extension| extension.to_str()) else {
            continue;
        };

        let extension = extension.to_lowercase();

        if !is_supported_extension(&extension) {
            continue;
        }

        scan.supported_file_count += 1;

        let file = ContentFile {
            name: path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("Unknown file")
                .to_string(),
            path: path.to_string_lossy().into_owned(),
            extension,
        };

        scan.supported_files.push(file.clone());
        emitter.record(file, display_name(&path));
    }

    Ok(())
}


fn display_name(path: &Path) -> Option<String> {
    path.parent()
        .and_then(|parent| parent.file_name())
        .and_then(|name| name.to_str())
        .map(|name| name.to_string())
        .or_else(|| {
            path.file_name()
                .and_then(|name| name.to_str())
                .map(|name| name.to_string())
        })
}

#[tauri::command]
fn get_archive_cover(content_path: String) -> Result<Option<String>, String> {
    let path = PathBuf::from(content_path);

    if !path.is_file() {
        return Ok(None);
    }

    let extension = path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_lowercase());

    let Some(extension) = extension else {
        return Ok(None);
    };

    if is_zip_archive_extension(&extension) {
        Ok(extract_zip_cover(&path))
    } else if is_rar_archive_extension(&extension) {
        Ok(extract_rar_cover(&path))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn load_scans(app: AppHandle) -> Result<String, String> {
    read_state_file(&app, SCANS_FILE_NAME, "{}")
}

#[tauri::command]
fn save_scans(app: AppHandle, data: String) -> Result<(), String> {
    write_state_file(&app, SCANS_FILE_NAME, data)
}

#[tauri::command]
fn load_libraries(app: AppHandle) -> Result<String, String> {
    read_state_file(&app, LIBRARIES_FILE_NAME, "[]")
}

#[tauri::command]
fn save_libraries(app: AppHandle, data: String) -> Result<(), String> {
    write_state_file(&app, LIBRARIES_FILE_NAME, data)
}

fn read_state_file(app: &AppHandle, file_name: &str, fallback: &str) -> Result<String, String> {
    let path = state_file_path(app, file_name)?;

    match fs::read_to_string(&path) {
        Ok(contents) => Ok(contents),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(fallback.to_string()),
        Err(error) => Err(format!("Unable to read {file_name}: {error}")),
    }
}

fn write_state_file(app: &AppHandle, file_name: &str, data: String) -> Result<(), String> {
    let path = state_file_path(app, file_name)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    fs::write(&path, data).map_err(|error| format!("Unable to save {file_name}: {error}"))
}

fn state_file_path(app: &AppHandle, file_name: &str) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Unable to resolve app data directory: {error}"))?;

    Ok(dir.join(file_name))
}

fn extract_zip_cover(content_path: &Path) -> Option<String> {
    if let Some(cached_cover_path) = find_cached_cover(content_path) {
        return Some(cached_cover_path);
    }

    let file = File::open(content_path).ok()?;
    let mut archive = ZipArchive::new(file).ok()?;
    let mut candidates = Vec::new();

    for index in 0..archive.len() {
        let file = archive.by_index(index).ok()?;
        let file_name = file.name().replace('\\', "/");

        if !file.is_file() || file_name.starts_with("__MACOSX/") {
            continue;
        }

        let path = Path::new(&file_name);
        let Some(extension) = path.extension().and_then(|extension| extension.to_str()) else {
            continue;
        };

        let extension = extension.to_lowercase();

        if !is_image_extension(&extension) {
            continue;
        }

        candidates.push(ArchiveImageCandidate {
            index,
            score: score_archive_image(&file_name),
            name: file_name,
            extension,
        });
    }

    candidates.sort_by(|left, right| {
        left.score
            .cmp(&right.score)
            .then_with(|| left.name.cmp(&right.name))
    });

    let candidate = candidates.first()?;
    let mut file = archive.by_index(candidate.index).ok()?;
    let mut image_bytes = Vec::new();

    file.read_to_end(&mut image_bytes).ok()?;

    write_cached_cover(content_path, &candidate.extension, &image_bytes)
}


fn extract_rar_cover(content_path: &Path) -> Option<String> {
    if let Some(cached_cover_path) = find_cached_cover(content_path) {
        return Some(cached_cover_path);
    }

    let listing = unrar::Archive::new(content_path).open_for_listing().ok()?;
    let mut candidates = Vec::new();

    for entry in listing {
        let Ok(entry) = entry else { continue };
        let file_name = entry.filename.to_string_lossy().replace('\\', "/");

        if file_name.starts_with("__MACOSX/") {
            continue;
        }

        let Some(extension) = Path::new(&file_name)
            .extension()
            .and_then(|extension| extension.to_str())
        else {
            continue;
        };

        let extension = extension.to_lowercase();

        if !is_image_extension(&extension) {
            continue;
        }

        candidates.push(ArchiveImageCandidate {
            index: 0,
            score: score_archive_image(&file_name),
            name: file_name,
            extension,
        });
    }

    candidates.sort_by(|left, right| {
        left.score
            .cmp(&right.score)
            .then_with(|| left.name.cmp(&right.name))
    });

    let candidate = candidates.first()?;
    let target_name = candidate.name.clone();
    let target_extension = candidate.extension.clone();

    let mut archive = unrar::Archive::new(content_path)
        .open_for_processing()
        .ok()?;

    loop {
        let header = match archive.read_header() {
            Ok(Some(header)) => header,
            _ => break,
        };

        let entry_name = header.entry().filename.to_string_lossy().replace('\\', "/");

        if entry_name == target_name {
            let (data, _rest) = header.read().ok()?;
            return write_cached_cover(content_path, &target_extension, &data);
        }

        archive = match header.skip() {
            Ok(next) => next,
            Err(_) => break,
        };
    }

    None
}

struct ArchiveImageCandidate {
    index: usize,
    score: usize,
    name: String,
    extension: String,
}

fn score_archive_image(file_name: &str) -> usize {
    let path = Path::new(file_name);
    let stem = path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or_default()
        .to_lowercase();
    let full_name = file_name.to_lowercase();

    if is_preferred_image_name(&stem) {
        return 0;
    }

    if full_name.contains("cover") || full_name.contains("poster") {
        return 1;
    }

    if stem.starts_with("000") || stem.starts_with("001") || stem == "1" {
        return 2;
    }

    3
}

fn find_cached_cover(content_path: &Path) -> Option<String> {
    let cache_dir = cover_cache_dir()?;
    let cache_key = cover_cache_key(content_path);

    for extension in IMAGE_EXTENSIONS {
        let path = cache_dir.join(format!("{cache_key}.{extension}"));

        if path.is_file() {
            return Some(path.to_string_lossy().into_owned());
        }
    }

    None
}

fn write_cached_cover(content_path: &Path, extension: &str, image_bytes: &[u8]) -> Option<String> {
    let cache_dir = cover_cache_dir()?;

    fs::create_dir_all(&cache_dir).ok()?;

    let path = cache_dir.join(format!("{}.{}", cover_cache_key(content_path), extension));

    fs::write(&path, image_bytes).ok()?;

    Some(path.to_string_lossy().into_owned())
}

fn cover_cache_dir() -> Option<PathBuf> {
    Some(std::env::temp_dir().join("mangareader").join("covers"))
}

fn cover_cache_key(content_path: &Path) -> u64 {
    let mut hasher = DefaultHasher::new();

    content_path.to_string_lossy().hash(&mut hasher);

    if let Ok(metadata) = fs::metadata(content_path) {
        metadata.len().hash(&mut hasher);
    }

    hasher.finish()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_content_folder,
            get_archive_cover,
            load_scans,
            save_scans,
            load_libraries,
            save_libraries
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
