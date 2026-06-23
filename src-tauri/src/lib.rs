mod extensions;

use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use std::{
    collections::hash_map::DefaultHasher,
    fs,
    fs::File,
    hash::{Hash, Hasher},
    io::Read,
    path::{Path, PathBuf},
};
use zip::ZipArchive;

use tauri::{Emitter, Window};

use extensions::{
    image_mime_type, is_archive_extension, is_image_extension, is_preferred_image_name,
    is_supported_extension, IMAGE_EXTENSIONS,
};

const SCAN_PROGRESS_EVENT: &str = "scan-progress";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ContentFolderScan {
    root_path: String,
    folder_count: usize,
    file_count: usize,
    supported_file_count: usize,
    supported_files: Vec<ContentFile>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ContentFile {
    name: String,
    path: String,
    extension: String,
    cover_path: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ScanProgress {
    processed: usize,
    total: usize,
}

#[tauri::command]
fn scan_content_folder(window: Window, folder_path: String) -> Result<ContentFolderScan, String> {
    let root_path = PathBuf::from(folder_path);

    if !root_path.is_dir() {
        return Err("Selected path is not a folder.".into());
    }

    let total = count_supported_files(&root_path);

    let _ = window.emit(
        SCAN_PROGRESS_EVENT,
        ScanProgress {
            processed: 0,
            total,
        },
    );

    let mut scan = ContentFolderScan {
        root_path: root_path.to_string_lossy().into_owned(),
        folder_count: 0,
        file_count: 0,
        supported_file_count: 0,
        supported_files: Vec::new(),
    };
    let mut processed = 0usize;

    scan_folder(&root_path, &mut scan, &window, total, &mut processed)?;

    Ok(scan)
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

#[tauri::command]
fn get_cover_data_url(cover_path: String) -> Result<String, String> {
    let path = PathBuf::from(cover_path);

    if !path.is_file() {
        return Err("Cover image does not exist.".into());
    }

    let extension = path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.to_lowercase())
        .ok_or_else(|| "Cover image is missing a file extension.".to_string())?;

    if !is_image_extension(&extension) {
        return Err("Cover image format is not supported.".into());
    }

    let bytes = fs::read(path).map_err(|error| error.to_string())?;
    let mime_type = image_mime_type(&extension);

    Ok(format!(
        "data:{mime_type};base64,{}",
        STANDARD.encode(bytes)
    ))
}

fn scan_folder(
    folder_path: &Path,
    scan: &mut ContentFolderScan,
    window: &Window,
    total: usize,
    processed: &mut usize,
) -> Result<(), String> {
    let entries = fs::read_dir(folder_path)
        .map_err(|error| format!("Unable to read {}: {error}", folder_path.display()))?;

    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            scan.folder_count += 1;
            scan_folder(&path, scan, window, total, processed)?;
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

        scan.supported_files.push(ContentFile {
            name: path
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("Unknown file")
                .to_string(),
            cover_path: find_content_cover(&path, &extension),
            path: path.to_string_lossy().into_owned(),
            extension,
        });

        *processed += 1;
        let _ = window.emit(
            SCAN_PROGRESS_EVENT,
            ScanProgress {
                processed: *processed,
                total,
            },
        );
    }

    Ok(())
}

fn find_content_cover(content_path: &Path, extension: &str) -> Option<String> {
    if is_archive_extension(extension) {
        return extract_archive_cover(content_path);
    }

    None
}

fn extract_archive_cover(content_path: &Path) -> Option<String> {
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
            get_cover_data_url,
            scan_content_folder
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
