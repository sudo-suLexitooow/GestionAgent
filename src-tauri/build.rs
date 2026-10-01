// Sous Windows, tauri-build n'embarque le manifeste d'application (Common Controls v6, requis par
// les dialogues du plugin dialog) que dans le binaire de l'app : les exécutables de `cargo test`
// échouaient alors au chargement (STATUS_ENTRYPOINT_NOT_FOUND). On embarque donc nous-mêmes le
// même manifeste, copie de celui de tauri-build, pour toutes les cibles (app et tests).
fn main() {
    let windows_without_default_manifest =
        tauri_build::WindowsAttributes::new_without_app_manifest();
    let attributes =
        tauri_build::Attributes::new().windows_attributes(windows_without_default_manifest);
    if let Err(error) = tauri_build::try_build(attributes) {
        panic!("erreur de tauri-build : {error:#}");
    }
    embed_windows_manifest();
}

fn embed_windows_manifest() {
    let manifest =
        std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("windows-app-manifest.xml");
    println!("cargo:rerun-if-changed={}", manifest.display());

    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    let target_env = std::env::var("CARGO_CFG_TARGET_ENV").unwrap_or_default();
    if target_os == "windows" && target_env == "msvc" {
        println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
        println!("cargo:rustc-link-arg=/MANIFESTINPUT:{}", manifest.display());
    }
}
