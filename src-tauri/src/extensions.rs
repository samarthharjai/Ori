pub const SUPPORTED_EXTENSIONS: [&str; 9] = [
    "cbz", "cbr", "pdf", "epub", "mobi", "mp3", "m4b", "zip", "rar",
];
pub const ARCHIVE_EXTENSIONS: [&str; 3] = ["cbz", "zip", "epub"];
pub const IMAGE_EXTENSIONS: [&str; 4] = ["jpg", "jpeg", "png", "webp"];
pub const PREFERRED_IMAGE_NAMES: [&str; 4] = ["cover", "folder", "poster", "thumbnail"];

pub fn is_supported_extension(extension: &str) -> bool {
    SUPPORTED_EXTENSIONS.contains(&extension)
}

pub fn is_archive_extension(extension: &str) -> bool {
    ARCHIVE_EXTENSIONS.contains(&extension)
}

pub fn is_image_extension(extension: &str) -> bool {
    IMAGE_EXTENSIONS.contains(&extension)
}

pub fn is_preferred_image_name(name: &str) -> bool {
    PREFERRED_IMAGE_NAMES.contains(&name)
}

pub fn image_mime_type(extension: &str) -> &'static str {
    match extension {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        _ => "application/octet-stream",
    }
}
