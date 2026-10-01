# Cadre

Application desktop (Tauri 2, React + TypeScript, Rust) pour concevoir, valider, exporter et surveiller le cadrage des agents IA d'un projet.

Cahier des charges, backlog et suivi des sprints : voir le wiki du dépôt.

## Commandes

| But | Commande |
| --- | --- |
| Installer | `npm ci` |
| Lancer l'app | `npm run tauri dev` |
| Tests TypeScript | `npm test` |
| Couverture du cœur (≥ 70 %) | `npm run test:coverage` |
| Lint + format | `npm run lint` |
| Typage | `npm run typecheck` |
| Tests Rust | `cd src-tauri && cargo test` |
| Lint Rust | `cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings` |

Sous Linux, Tauri requiert `libwebkit2gtk-4.1-dev librsvg2-dev libayatana-appindicator3-dev`.
