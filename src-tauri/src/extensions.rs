pub const SUPPORTED_EXTENSIONS: [&str; 9] = [
    "cbz", "cbr", "pdf", "epub", "mobi", "mp3", "m4b", "zip", "rar",
];
pub const ZIP_ARCHIVE_EXTENSIONS: [&str; 3] = ["cbz", "zip", "epub"];
pub const RAR_ARCHIVE_EXTENSIONS: [&str; 2] = ["cbr", "rar"];
pub const IMAGE_EXTENSIONS: [&str; 4] = ["jpg", "jpeg", "png", "webp"];
pub const PREFERRED_IMAGE_NAMES: [&str; 4] = ["cover", "folder", "poster", "thumbnail"];

pub fn is_supported_extension(extension: &str) -> bool {
    SUPPORTED_EXTENSIONS.contains(&extension)
}

pub fn is_zip_archive_extension(extension: &str) -> bool {
    ZIP_ARCHIVE_EXTENSIONS.contains(&extension)
}

pub fn is_rar_archive_extension(extension: &str) -> bool {
    RAR_ARCHIVE_EXTENSIONS.contains(&extension)
}

pub fn is_image_extension(extension: &str) -> bool {
    IMAGE_EXTENSIONS.contains(&extension)
}

pub fn is_preferred_image_name(name: &str) -> bool {
    PREFERRED_IMAGE_NAMES.contains(&name)
}
