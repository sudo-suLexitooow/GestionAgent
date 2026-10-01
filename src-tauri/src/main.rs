// Évite une console supplémentaire sous Windows en mode release.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    cadre_lib::run()
}
